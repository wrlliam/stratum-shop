import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components'
import type { OrderWithItems, DeliveryAddress } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getDeliveryOption } from '@/lib/stripe'

interface OrderShippedEmailProps {
  order: OrderWithItems
  trackingNumber?: string | null
  appUrl: string
}

export function OrderShippedEmail({ order, trackingNumber, appUrl }: OrderShippedEmailProps) {
  const deliveryOption = getDeliveryOption(order.deliveryMethod)
  const address = order.deliveryAddress as DeliveryAddress | null

  return (
    <Html>
      <Head />
      <Preview>
        Your order #{order.orderNumber} is on its way
        {deliveryOption ? ` — ${deliveryOption.description}` : ''}.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={accentBar} />

          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>Your order is on its way</Heading>
            <Text style={paragraph}>
              Order <strong style={{ color: '#1a1a2e' }}>#{order.orderNumber}</strong> has been
              packed and dispatched{deliveryOption ? ` via ${deliveryOption.name}` : ''}.
              {deliveryOption ? ` Expected delivery: ${deliveryOption.description}.` : ''}
            </Text>

            {/* Tracking */}
            {trackingNumber ? (
              <Section style={trackingBox}>
                <Text style={trackingLabel}>Tracking number</Text>
                <Text style={trackingValue}>{trackingNumber}</Text>
                <Link
                  href={`https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`}
                  style={trackingButton}
                >
                  Track on Royal Mail →
                </Link>
              </Section>
            ) : (
              <Section style={noTrackingBox}>
                <Text style={noTrackingText}>
                  No tracking number is available for your delivery method. Royal Mail
                  will deliver within {deliveryOption?.description ?? 'the estimated timeframe'}.
                </Text>
              </Section>
            )}

            <Hr style={divider} />

            {/* Items */}
            <Heading as="h3" style={h3}>Items dispatched</Heading>
            {order.items.map((item) => (
              <Row key={item.id} style={itemRow}>
                <Column>
                  <Text style={itemName}>{item.name}{item.isBundle ? ' (Bundle)' : ''}</Text>
                  <Text style={itemQty}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                  <Text style={itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                </Column>
              </Row>
            ))}

            {/* Delivery address */}
            {address && (
              <>
                <Hr style={divider} />
                <Heading as="h3" style={h3}>Delivering to</Heading>
                <Section style={addressBox}>
                  <Text style={addressText}>
                    {address.name}<br />
                    {address.line1}<br />
                    {address.line2 ? <>{address.line2}<br /></> : null}
                    {address.city}<br />
                    {address.county ? <>{address.county}<br /></> : null}
                    {address.postcode}
                  </Text>
                </Section>
              </>
            )}

            <Hr style={divider} />

            {/* Delay note */}
            <Section style={helpBox}>
              <Text style={helpTitle}>Not arrived in time?</Text>
              <Text style={helpText}>
                If your parcel hasn&apos;t arrived within a few days of the estimated window, please{' '}
                <Link href={`${appUrl}/contact`} style={inlineLink}>get in touch</Link> and
                we&apos;ll look into it straight away.
              </Text>
            </Section>

            <Hr style={divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/orders`} style={button}>
                View Your Order
              </Link>
            </Section>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              Questions? Email{' '}
              <Link href="mailto:hello@stratum3d.co.uk" style={footerLink}>hello@stratum3d.co.uk</Link>
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Stratum · Precision 3D Prints
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#F8F9FA',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
}
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#FFFFFF',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid #E8EAED',
}
const accentBar = {
  backgroundColor: '#6CBCE3',
  height: '4px',
  lineHeight: '4px',
  fontSize: '0px',
}
const header = {
  backgroundColor: '#1a1a2e',
  padding: '28px 32px',
  textAlign: 'center' as const,
}
const logo = {
  color: '#FFFFFF',
  fontSize: '26px',
  fontWeight: '900',
  letterSpacing: '8px',
  margin: '0',
}
const tagline = {
  color: '#6CBCE3',
  fontSize: '11px',
  letterSpacing: '3px',
  margin: '6px 0 0',
  textTransform: 'uppercase' as const,
}
const content = { padding: '32px' }
const h2 = {
  color: '#1a1a2e',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 12px',
}
const h3 = {
  color: '#3A9FD4',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 16px',
}
const paragraph = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const divider = { borderColor: '#E8EAED', margin: '24px 0' }

const trackingBox = {
  backgroundColor: '#EBF6FC',
  borderRadius: '10px',
  padding: '24px',
  textAlign: 'center' as const,
  border: '1px solid #6CBCE3',
}
const trackingLabel = {
  color: '#3A9FD4',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 10px',
  fontWeight: '600',
}
const trackingValue = {
  color: '#1a1a2e',
  fontSize: '22px',
  fontWeight: '700',
  fontFamily: '"Courier New", Courier, monospace',
  letterSpacing: '2px',
  margin: '0 0 16px',
}
const trackingButton = {
  backgroundColor: '#6CBCE3',
  color: '#1a1a2e',
  padding: '10px 28px',
  borderRadius: '8px',
  fontWeight: '700',
  fontSize: '13px',
  textDecoration: 'none',
  display: 'inline-block',
}
const noTrackingBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E8EAED',
}
const noTrackingText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
}

const itemRow = { paddingBottom: '12px', borderBottom: '1px solid #E8EAED' }
const itemName = { color: '#1a1a2e', fontSize: '14px', fontWeight: '500', margin: '0 0 3px' }
const itemQty = { color: '#6b7280', fontSize: '12px', margin: '0' }
const itemPrice = { color: '#1a1a2e', fontSize: '14px', fontWeight: '600', margin: '0' }

const addressBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E8EAED',
}
const addressText = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '1.8',
  margin: '0',
}

const helpBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E8EAED',
}
const helpTitle = { color: '#1a1a2e', fontSize: '13px', fontWeight: '600', margin: '0 0 6px' }
const helpText = { color: '#6b7280', fontSize: '12px', lineHeight: '1.6', margin: '0' }
const inlineLink = { color: '#3A9FD4', textDecoration: 'underline' }

const button = {
  backgroundColor: '#6CBCE3',
  color: '#1a1a2e',
  padding: '13px 36px',
  borderRadius: '8px',
  fontWeight: '700',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footerSection = {
  backgroundColor: '#F5F5F5',
  padding: '24px 32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #E8EAED',
}
const footerText = { color: '#6b7280', fontSize: '12px', margin: '4px 0' }
const footerLink = { color: '#3A9FD4', textDecoration: 'underline' }
