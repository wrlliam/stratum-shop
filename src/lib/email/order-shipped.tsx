import {
  Body, Container, Head, Heading, Html, Preview,
  Section, Text, Hr, Link, Row, Column,
} from '@react-email/components'
import { formatPrice } from '@/lib/utils'
import type { OrderWithItems } from '@/types'
import * as s from './styles'

interface OrderShippedEmailProps {
  order: OrderWithItems
  trackingNumber?: string | null
  appUrl: string
}

export function OrderShippedEmail({ order, trackingNumber, appUrl }: OrderShippedEmailProps) {
  const address = order.deliveryAddress as { name?: string; line1?: string; line2?: string; city?: string; county?: string; postcode?: string } | null

  return (
    <Html>
      <Head />
      <Preview>Your order #{order.orderNumber} has been shipped!</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={s.accentBar} />

          <Section style={s.header}>
            <Heading style={s.logo}>STRATUM</Heading>
            <Text style={s.tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={s.content}>
            <Text style={s.h3}>Order Shipped</Text>
            <Heading as="h2" style={s.h2}>Your order is on its way!</Heading>
            <Text style={s.paragraph}>
              Order #{order.orderNumber} has been dispatched and is heading to you.
            </Text>

            {/* Tracking */}
            {trackingNumber ? (
              <Section style={{
                backgroundColor: s.colors.arctic,
                border: `1px solid ${s.colors.blue}`,
                padding: '24px',
                textAlign: 'center' as const,
              }}>
                <Text style={{ ...s.metaLabel, color: s.colors.blue }}>Tracking Number</Text>
                <Text style={{
                  color: s.colors.white,
                  fontSize: '20px',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  margin: '8px 0 16px',
                }}>
                  {trackingNumber}
                </Text>
                <Link
                  href={`https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`}
                  style={{ ...s.button, padding: '10px 28px', fontSize: '13px' }}
                >
                  Track Your Parcel
                </Link>
              </Section>
            ) : (
              <Section style={s.infoBox}>
                <Text style={{ color: s.colors.muted, fontSize: '13px', lineHeight: '1.6', margin: '0' }}>
                  Your order has been shipped without a tracking number. Standard deliveries
                  typically arrive within 2-3 business days.
                </Text>
              </Section>
            )}

            {/* Items */}
            <Hr style={s.divider} />
            <Text style={s.h3}>Items Dispatched</Text>
            {order.items.map((item, i) => (
              <Row key={i} style={i < order.items.length - 1 ? s.itemRow : { paddingBottom: '4px' }}>
                <Column>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemQty}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: 'right', verticalAlign: 'top' }}>
                  <Text style={s.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                </Column>
              </Row>
            ))}

            {/* Address */}
            {address && (
              <>
                <Hr style={s.divider} />
                <Text style={s.h3}>Delivering To</Text>
                <Section style={s.addressBox}>
                  <Text style={s.addressText}>
                    {[address.name, address.line1, address.line2, address.city, address.county, address.postcode]
                      .filter(Boolean)
                      .join('\n')}
                  </Text>
                </Section>
              </>
            )}

            {/* Help */}
            <Hr style={s.divider} />
            <Section style={s.infoBox}>
              <Text style={{ color: s.colors.white, fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>
                Not arrived in time?
              </Text>
              <Text style={{ color: s.colors.muted, fontSize: '12px', lineHeight: '1.6', margin: '0' }}>
                If your order hasn&apos;t arrived within the expected delivery window, please{' '}
                <Link href={`${appUrl}/contact`} style={s.inlineLink}>contact us</Link>
                {' '}and we&apos;ll investigate right away.
              </Text>
            </Section>

            <Hr style={s.divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/orders`} style={s.button}>View Your Order</Link>
            </Section>
          </Section>

          <Section style={s.footerSection}>
            <Text style={s.footerText}>
              Questions? Email us at{' '}
              <Link href="mailto:hello@stratum3d.co.uk" style={s.footerLink}>hello@stratum3d.co.uk</Link>
            </Text>
            <Text style={s.footerText}>
              &copy; {new Date().getFullYear()} Stratum &middot; Precision 3D Prints
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
