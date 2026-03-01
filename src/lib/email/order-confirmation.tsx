import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
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
import { getDeliveryOption } from '@/lib/stripe'

interface OrderConfirmationEmailProps {
  order: OrderWithItems
  appUrl: string
}

export function OrderConfirmationEmail({ order, appUrl }: OrderConfirmationEmailProps) {
  const deliveryOption = getDeliveryOption(order.deliveryMethod)
  const address = order.deliveryAddress as {
    name: string
    line1: string
    line2?: string
    city: string
    county?: string
    postcode: string
  } | null

  return (
    <Html>
      <Head />
      <Preview>Your Stratum order #{order.orderNumber} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Hr style={divider} />

          {/* Order Confirmed */}
          <Section style={content}>
            <Heading as="h2" style={h2}>
              Order Confirmed ✓
            </Heading>
            <Text style={paragraph}>
              Thank you for your order! We&apos;re preparing your 3D prints and will notify you when
              they&apos;re on their way.
            </Text>

            {/* Order Details */}
            <Section style={orderDetails}>
              <Row>
                <Column>
                  <Text style={detailLabel}>Order Number</Text>
                  <Text style={detailValue}>{order.orderNumber}</Text>
                </Column>
                <Column>
                  <Text style={detailLabel}>Order Date</Text>
                  <Text style={detailValue}>
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </Column>
                <Column>
                  <Text style={detailLabel}>Delivery</Text>
                  <Text style={detailValue}>{deliveryOption?.name || order.deliveryMethod}</Text>
                </Column>
              </Row>
            </Section>

            <Hr style={divider} />

            {/* Items */}
            <Heading as="h3" style={h3}>Items Ordered</Heading>
            {order.items.map((item) => (
              <Row key={item.id} style={itemRow}>
                <Column style={{ width: '60%' }}>
                  <Text style={itemName}>
                    {item.name}
                    {item.isBundle && ' (Bundle)'}
                  </Text>
                  <Text style={itemQty}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
                </Column>
              </Row>
            ))}

            <Hr style={divider} />

            {/* Totals */}
            <Section>
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>Subtotal</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={totalValue}>{formatPrice(order.subtotal)}</Text></Column>
              </Row>
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>Delivery ({deliveryOption?.name})</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={totalValue}>{formatPrice(order.deliveryPrice)}</Text></Column>
              </Row>
              <Row style={totalRow}>
                <Column><Text style={totalLabel}>VAT (20%)</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={totalValue}>{formatPrice(order.taxAmount)}</Text></Column>
              </Row>
              <Row style={grandTotalRow}>
                <Column><Text style={grandTotalLabel}>Total</Text></Column>
                <Column style={{ textAlign: 'right' }}><Text style={grandTotalValue}>{formatPrice(order.total)}</Text></Column>
              </Row>
            </Section>

            {address && (
              <>
                <Hr style={divider} />
                <Heading as="h3" style={h3}>Delivery Address</Heading>
                <Text style={paragraph}>
                  {address.name}<br />
                  {address.line1}<br />
                  {address.line2 && <>{address.line2}<br /></>}
                  {address.city}<br />
                  {address.county && <>{address.county}<br /></>}
                  {address.postcode}
                </Text>
              </>
            )}

            <Hr style={divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/orders/${order.id}`} style={button}>
                View Your Order
              </Link>
            </Section>

            <Text style={footer}>
              Questions? Reply to this email or visit{' '}
              <Link href={appUrl} style={link}>{appUrl}</Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Stratum. All rights reserved.
            </Text>
            <Text style={footerText}>
              Precision 3D Prints • Made with care
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#0a0a10',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}
const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#111127',
  borderRadius: '12px',
  overflow: 'hidden',
}
const header = {
  backgroundColor: '#0d0d1a',
  padding: '32px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #2d2d55',
}
const logo = {
  color: '#f59e0b',
  fontSize: '28px',
  fontWeight: '900',
  letterSpacing: '8px',
  margin: '0',
}
const tagline = {
  color: '#9ca3af',
  fontSize: '12px',
  letterSpacing: '3px',
  margin: '4px 0 0',
  textTransform: 'uppercase' as const,
}
const content = { padding: '32px' }
const h2 = { color: '#f9fafb', fontSize: '24px', fontWeight: '700', margin: '0 0 16px' }
const h3 = { color: '#f59e0b', fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }
const paragraph = { color: '#c8c8f0', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px' }
const divider = { borderColor: '#2d2d55', margin: '24px 0' }
const orderDetails = { backgroundColor: '#1a1a35', borderRadius: '8px', padding: '16px', marginBottom: '0' }
const detailLabel = { color: '#9ca3af', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 4px' }
const detailValue = { color: '#f9fafb', fontSize: '14px', fontWeight: '600', margin: '0' }
const itemRow = { marginBottom: '12px' }
const itemName = { color: '#f9fafb', fontSize: '14px', fontWeight: '500', margin: '0 0 4px' }
const itemQty = { color: '#9ca3af', fontSize: '12px', margin: '0' }
const itemPrice = { color: '#f9fafb', fontSize: '14px', fontWeight: '600', margin: '0' }
const totalRow = { marginBottom: '8px' }
const totalLabel = { color: '#c8c8f0', fontSize: '14px', margin: '0' }
const totalValue = { color: '#c8c8f0', fontSize: '14px', margin: '0' }
const grandTotalRow = { backgroundColor: '#1a1a35', borderRadius: '8px', padding: '12px', marginTop: '8px' }
const grandTotalLabel = { color: '#f59e0b', fontSize: '16px', fontWeight: '700', margin: '0' }
const grandTotalValue = { color: '#f59e0b', fontSize: '16px', fontWeight: '700', margin: '0' }
const button = {
  backgroundColor: '#f59e0b',
  color: '#0a0a10',
  padding: '12px 32px',
  borderRadius: '8px',
  fontWeight: '700',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
}
const link = { color: '#f59e0b', textDecoration: 'underline' }
const footer = { color: '#6b7280', fontSize: '12px', textAlign: 'center' as const, marginTop: '24px' }
const footerSection = { backgroundColor: '#0d0d1a', padding: '24px', textAlign: 'center' as const, borderTop: '1px solid #2d2d55' }
const footerText = { color: '#6b7280', fontSize: '12px', margin: '4px 0' }
