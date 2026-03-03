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

interface OrderConfirmationEmailProps {
  order: OrderWithItems
  appUrl: string
}

export function OrderConfirmationEmail({ order, appUrl }: OrderConfirmationEmailProps) {
  const deliveryOption = getDeliveryOption(order.deliveryMethod)
  const address = order.deliveryAddress as DeliveryAddress | null

  return (
    <Html>
      <Head />
      <Preview>Order confirmed — #{order.orderNumber}. Your prints are being queued for production.</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Blue accent bar */}
          <Section style={accentBar} />

          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={content}>
            {/* Hero */}
            <Heading as="h2" style={h2}>Order Confirmed</Heading>
            <Text style={paragraph}>
              Thanks for your order, {address?.name?.split(' ')[0] || 'there'}! We&apos;ve received your payment
              and your prints are being queued for production.
            </Text>

            {/* Order meta */}
            <Section style={metaBox}>
              <Row>
                <Column style={metaCol}>
                  <Text style={metaLabel}>Order</Text>
                  <Text style={metaValue}>#{order.orderNumber}</Text>
                </Column>
                <Column style={metaCol}>
                  <Text style={metaLabel}>Date</Text>
                  <Text style={metaValue}>
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </Text>
                </Column>
                <Column style={metaCol}>
                  <Text style={metaLabel}>Delivery</Text>
                  <Text style={metaValue}>{deliveryOption?.name ?? order.deliveryMethod}</Text>
                </Column>
                {deliveryOption && (
                  <Column style={metaCol}>
                    <Text style={metaLabel}>Est. Arrival</Text>
                    <Text style={metaValue}>{deliveryOption.description}</Text>
                  </Column>
                )}
              </Row>
            </Section>

            <Hr style={divider} />

            {/* What happens next */}
            <Heading as="h3" style={h3}>What happens next</Heading>
            <Section style={stepsBox}>
              {[
                {
                  n: '1',
                  title: 'Printing',
                  desc: 'Your items enter our print queue. Larger pieces can take several hours — we\'ll make sure every layer is right.',
                },
                {
                  n: '2',
                  title: 'Quality check',
                  desc: 'Each print is inspected by hand before packaging. If anything doesn\'t meet our standards, we reprint it.',
                },
                {
                  n: '3',
                  title: 'Dispatch',
                  desc: `Once packed, we'll send you a shipping confirmation${deliveryOption ? ` with your ${deliveryOption.name} tracking details` : ''}.`,
                },
              ].map((step) => (
                <Row key={step.n} style={{ marginBottom: '16px' }}>
                  <Column style={{ width: '36px', verticalAlign: 'top' }}>
                    <Text style={stepNum}>{step.n}</Text>
                  </Column>
                  <Column>
                    <Text style={stepTitle}>{step.title}</Text>
                    <Text style={stepDesc}>{step.desc}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={divider} />

            {/* Items */}
            <Heading as="h3" style={h3}>Items ordered</Heading>
            {order.items.map((item) => (
              <Row key={item.id} style={itemRow}>
                <Column>
                  <Text style={itemName}>
                    {item.name}{item.isBundle ? ' (Bundle)' : ''}
                  </Text>
                  <Text style={itemQty}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                  <Text style={itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                </Column>
              </Row>
            ))}

            {/* Totals */}
            <Section style={totalsBox}>
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>Subtotal</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={totalValue}>{formatPrice(order.subtotal)}</Text></Column>
              </Row>
              {order.discountAmount > 0 && (
                <Row style={totalRow}>
                  <Column><Text style={totalLabel}>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</Text></Column>
                  <Column style={{ textAlign: 'right' }}><Text style={discountValue}>−{formatPrice(order.discountAmount)}</Text></Column>
                </Row>
              )}
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>Delivery</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={totalValue}>{formatPrice(order.deliveryPrice)}</Text></Column>
              </Row>
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>VAT (20%)</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={totalValue}>{formatPrice(order.taxAmount)}</Text></Column>
              </Row>
              <Hr style={{ ...divider, margin: '12px 0' }} />
              <Row>
                <Column><Text style={grandTotalLabel}>Total paid</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={grandTotalValue}>{formatPrice(order.total)}</Text></Column>
              </Row>
            </Section>

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

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/orders`} style={button}>
                View Your Order
              </Link>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Questions? Email us at{' '}
              <Link href="mailto:hello@stratum3d.co.uk" style={footerLink}>hello@stratum3d.co.uk</Link>
              {' '}or{' '}
              <Link href={`${appUrl}/contact`} style={footerLink}>visit our contact page</Link>.
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

const metaBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E8EAED',
}
const metaCol = { verticalAlign: 'top' as const, paddingRight: '12px' }
const metaLabel = {
  color: '#6b7280',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 4px',
}
const metaValue = {
  color: '#1a1a2e',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0',
}

const stepsBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '20px',
  borderLeft: '3px solid #6CBCE3',
  border: '1px solid #E8EAED',
}
const stepNum = {
  backgroundColor: '#6CBCE3',
  color: '#1a1a2e',
  fontSize: '11px',
  fontWeight: '900',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  textAlign: 'center' as const,
  lineHeight: '22px',
  margin: '0',
}
const stepTitle = {
  color: '#1a1a2e',
  fontSize: '13px',
  fontWeight: '600',
  margin: '0 0 3px',
}
const stepDesc = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '0',
}

const itemRow = { paddingBottom: '12px', borderBottom: '1px solid #E8EAED' }
const itemName = { color: '#1a1a2e', fontSize: '14px', fontWeight: '500', margin: '0 0 3px' }
const itemQty = { color: '#6b7280', fontSize: '12px', margin: '0' }
const itemPrice = { color: '#1a1a2e', fontSize: '14px', fontWeight: '600', margin: '0' }

const totalsBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  marginTop: '16px',
  border: '1px solid #E8EAED',
}
const totalRow = { marginBottom: '8px' }
const totalLabel = { color: '#6b7280', fontSize: '13px', margin: '0' }
const totalValue = { color: '#374151', fontSize: '13px', margin: '0' }
const discountValue = { color: '#16a34a', fontSize: '13px', fontWeight: '600', margin: '0' }
const grandTotalLabel = { color: '#1a1a2e', fontSize: '15px', fontWeight: '700', margin: '0' }
const grandTotalValue = { color: '#1a1a2e', fontSize: '15px', fontWeight: '700', margin: '0' }

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
