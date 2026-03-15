import {
  Body, Container, Head, Heading, Html, Preview,
  Section, Text, Hr, Link, Row, Column,
} from '@react-email/components'
import { formatPrice } from '@/lib/utils'
import { formatDeliveryMethod } from '@/lib/delivery'
import type { OrderWithItems } from '@/types'
import * as s from './styles'

interface OrderConfirmationEmailProps {
  order: OrderWithItems
  appUrl: string
}

export function OrderConfirmationEmail({ order, appUrl }: OrderConfirmationEmailProps) {
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const address = order.deliveryAddress as { name?: string; line1?: string; line2?: string; city?: string; county?: string; postcode?: string } | null

  return (
    <Html>
      <Head />
      <Preview>Order confirmed! #{order.orderNumber} — we&apos;re getting started on your prints.</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={s.accentBar} />

          <Section style={s.header}>
            <Heading style={s.logo}>STRATUM</Heading>
            <Text style={s.tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={s.content}>
            <Text style={s.h3}>Order Confirmed</Text>
            <Heading as="h2" style={s.h2}>Thanks for your order!</Heading>
            <Text style={s.paragraph}>
              We&apos;ve received your order and will start working on it shortly. You&apos;ll
              receive updates as your order progresses.
            </Text>

            {/* Order meta */}
            <Section style={s.metaBox}>
              <Row>
                <Column>
                  <Text style={s.metaLabel}>Order Number</Text>
                  <Text style={{ ...s.metaValue, color: s.colors.blue, fontFamily: 'monospace' }}>{order.orderNumber}</Text>
                </Column>
                <Column>
                  <Text style={s.metaLabel}>Date</Text>
                  <Text style={s.metaValue}>
                    {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                </Column>
                <Column>
                  <Text style={s.metaLabel}>Delivery</Text>
                  <Text style={s.metaValue}>{formatDeliveryMethod(order.deliveryMethod || 'standard')}</Text>
                </Column>
              </Row>
            </Section>

            {/* What happens next */}
            <Hr style={s.divider} />
            <Text style={s.h3}>What Happens Next</Text>
            <Section style={s.infoBox}>
              {[
                { num: '01', title: 'Printing', desc: 'Your items are queued and will be printed on demand.' },
                { num: '02', title: 'Quality Check', desc: 'Every print is inspected before packing.' },
                { num: '03', title: 'Dispatch', desc: 'Packed and posted — you\'ll get a shipping notification.' },
              ].map((step, i) => (
                <Row key={step.num} style={{ marginBottom: i < 2 ? '12px' : '0' }}>
                  <Column style={{ width: '32px', verticalAlign: 'top' }}>
                    <Text style={{ color: s.colors.blue, fontSize: '12px', fontWeight: '700', fontFamily: 'monospace', margin: '0' }}>
                      {step.num}
                    </Text>
                  </Column>
                  <Column>
                    <Text style={{ color: s.colors.white, fontSize: '13px', fontWeight: '600', margin: '0' }}>{step.title}</Text>
                    <Text style={{ color: s.colors.muted, fontSize: '12px', margin: '2px 0 0', lineHeight: '1.5' }}>{step.desc}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* Items */}
            <Hr style={s.divider} />
            <Text style={s.h3}>Items Ordered</Text>
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

            {/* Totals */}
            <Section style={s.totalsBox}>
              <Row style={s.totalRow}>
                <Column><Text style={s.totalLabel}>Subtotal</Text></Column>
                <Column><Text style={s.totalValue}>{formatPrice(subtotal)}</Text></Column>
              </Row>
              {order.discountAmount > 0 && (
                <Row style={s.totalRow}>
                  <Column><Text style={{ ...s.totalLabel, color: s.colors.green }}>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</Text></Column>
                  <Column><Text style={{ ...s.totalValue, color: s.colors.green, fontWeight: '600' }}>-{formatPrice(order.discountAmount)}</Text></Column>
                </Row>
              )}
              <Row style={s.totalRow}>
                <Column><Text style={s.totalLabel}>Delivery</Text></Column>
                <Column><Text style={s.totalValue}>{formatPrice(order.deliveryPrice)}</Text></Column>
              </Row>
              <Row style={s.totalRow}>
                <Column><Text style={s.totalLabel}>VAT (20%)</Text></Column>
                <Column><Text style={s.totalValue}>{formatPrice(order.taxAmount)}</Text></Column>
              </Row>
              <Hr style={{ ...s.divider, margin: '12px 0' }} />
              <Row>
                <Column><Text style={s.grandTotalLabel}>Total Paid</Text></Column>
                <Column><Text style={s.grandTotalValue}>{formatPrice(order.total)}</Text></Column>
              </Row>
            </Section>

            {/* Delivery address */}
            {address && (
              <>
                <Hr style={s.divider} />
                <Text style={s.h3}>Delivery Address</Text>
                <Section style={s.addressBox}>
                  <Text style={s.addressText}>
                    {[address.name, address.line1, address.line2, address.city, address.county, address.postcode]
                      .filter(Boolean)
                      .join('\n')}
                  </Text>
                </Section>
              </>
            )}

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
