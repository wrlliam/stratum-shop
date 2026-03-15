import {
  Body, Container, Head, Heading, Html, Preview,
  Row, Column, Section, Text, Hr, Link,
} from '@react-email/components'
import type { OrderWithItems } from '@/types'
import { formatPrice } from '@/lib/utils'
import * as s from './styles'

interface OrderCancellationEmailProps {
  order: OrderWithItems
  appUrl: string
}

export function OrderCancellationEmail({ order, appUrl }: OrderCancellationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order #{order.orderNumber} has been cancelled — refund of {formatPrice(order.total)} is on its way.</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={s.accentBar} />

          <Section style={s.header}>
            <Heading style={s.logo}>STRATUM</Heading>
            <Text style={s.tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={s.content}>
            <Text style={s.h3}>Order Cancelled</Text>
            <Heading as="h2" style={s.h2}>We&apos;ve cancelled your order</Heading>
            <Text style={s.paragraph}>
              Order <strong style={{ color: s.colors.white }}>#{order.orderNumber}</strong> has
              been cancelled. We&apos;re sorry it didn&apos;t work out this time.
            </Text>

            {/* Refund info */}
            <Section style={{
              backgroundColor: s.colors.arctic,
              border: `1px solid ${s.colors.green}`,
              padding: '24px',
              textAlign: 'center' as const,
            }}>
              <Text style={{ ...s.metaLabel, color: s.colors.green }}>Refund Issued</Text>
              <Text style={{
                color: s.colors.green,
                fontSize: '28px',
                fontWeight: '800',
                margin: '8px 0 12px',
              }}>
                {formatPrice(order.total)}
              </Text>
              <Text style={{
                color: s.colors.muted,
                fontSize: '12px',
                lineHeight: '1.6',
                margin: '0',
              }}>
                Your refund has been initiated to your original payment method.
                It typically takes <strong style={{ color: s.colors.text }}>3-5 business days</strong> to appear on your
                statement, though some banks may take up to 10 days.
              </Text>
            </Section>

            <Hr style={s.divider} />

            {/* Items */}
            <Text style={s.h3}>Cancelled Items</Text>
            {order.items.map((item, i) => (
              <Row key={item.id} style={i < order.items.length - 1 ? s.itemRow : { paddingBottom: '4px' }}>
                <Column>
                  <Text style={s.itemName}>{item.name}{item.isBundle ? ' (Bundle)' : ''}</Text>
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
                <Column><Text style={s.totalValue}>{formatPrice(order.subtotal)}</Text></Column>
              </Row>
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
                <Column><Text style={{ ...s.grandTotalLabel, color: s.colors.green }}>Total Refunded</Text></Column>
                <Column><Text style={{ ...s.grandTotalValue, color: s.colors.green }}>{formatPrice(order.total)}</Text></Column>
              </Row>
            </Section>

            <Hr style={s.divider} />

            {/* Cancelled by mistake */}
            <Section style={s.infoBox}>
              <Text style={{ color: s.colors.white, fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>
                Cancelled by mistake?
              </Text>
              <Text style={{ color: s.colors.muted, fontSize: '12px', lineHeight: '1.6', margin: '0' }}>
                If this cancellation wasn&apos;t intentional, please{' '}
                <Link href={`${appUrl}/contact`} style={s.inlineLink}>contact us</Link> as soon
                as possible and we&apos;ll do our best to help.
              </Text>
            </Section>

            <Hr style={s.divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/products`} style={s.button}>Browse Products</Link>
            </Section>
          </Section>

          <Section style={s.footerSection}>
            <Text style={s.footerText}>
              Questions about your refund? Email{' '}
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
