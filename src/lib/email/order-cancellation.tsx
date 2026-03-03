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
import type { OrderWithItems } from '@/types'
import { formatPrice } from '@/lib/utils'

interface OrderCancellationEmailProps {
  order: OrderWithItems
  appUrl: string
}

export function OrderCancellationEmail({ order, appUrl }: OrderCancellationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order #{order.orderNumber} has been cancelled — refund of {formatPrice(order.total)} is on its way.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={accentBar} />

          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>Order Cancelled</Heading>
            <Text style={paragraph}>
              Your order <strong style={{ color: '#1a1a2e' }}>#{order.orderNumber}</strong> has
              been cancelled. We&apos;re sorry it didn&apos;t work out this time.
            </Text>

            {/* Refund info */}
            <Section style={refundBox}>
              <Text style={refundLabel}>Refund issued</Text>
              <Text style={refundAmount}>{formatPrice(order.total)}</Text>
              <Text style={refundNote}>
                Your refund has been initiated to your original payment method.
                It typically takes <strong>3–5 business days</strong> to appear on your
                statement, though some banks may take up to 10 days.
              </Text>
            </Section>

            <Hr style={divider} />

            {/* Items */}
            <Heading as="h3" style={h3}>Cancelled items</Heading>
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

            {/* Totals */}
            <Section style={totalsBox}>
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>Subtotal</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={totalValue}>{formatPrice(order.subtotal)}</Text></Column>
              </Row>
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
                <Column><Text style={refundTotalLabel}>Total refunded</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={refundTotalValue}>{formatPrice(order.total)}</Text></Column>
              </Row>
            </Section>

            <Hr style={divider} />

            {/* Cancelled by mistake */}
            <Section style={helpBox}>
              <Text style={helpTitle}>Cancelled by mistake?</Text>
              <Text style={helpText}>
                If this cancellation wasn&apos;t intentional, please{' '}
                <Link href={`${appUrl}/contact`} style={inlineLink}>contact us</Link> as soon
                as possible and we&apos;ll do our best to help.
              </Text>
            </Section>

            <Hr style={divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/products`} style={button}>
                Browse Products
              </Link>
            </Section>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              Questions about your refund? Email{' '}
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

const refundBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #86efac',
  borderRadius: '10px',
  padding: '24px',
  textAlign: 'center' as const,
}
const refundLabel = {
  color: '#15803d',
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
  fontWeight: '600',
}
const refundAmount = {
  color: '#16a34a',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 12px',
}
const refundNote = {
  color: '#15803d',
  fontSize: '12px',
  lineHeight: '1.6',
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
const refundTotalLabel = { color: '#16a34a', fontSize: '15px', fontWeight: '700', margin: '0' }
const refundTotalValue = { color: '#16a34a', fontSize: '15px', fontWeight: '700', margin: '0' }

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
