import {
  Body, Container, Head, Heading, Html, Preview,
  Section, Text, Hr, Link,
} from '@react-email/components'
import * as s from './styles'

interface OrderStatusUpdateEmailProps {
  orderNumber: string
  status: string
  appUrl: string
}

interface StatusInfo {
  preview: string
  title: string
  message: string
  detail?: string
  accentColor?: string
}

const STATUS_MESSAGES: Record<string, StatusInfo> = {
  processing: {
    preview: 'We\'ve received your order and it\'s being prepared.',
    title: 'Your Order is Being Prepared',
    message:
      'Good news — your payment has been confirmed and your order is now in our queue. Our team will begin printing your items shortly.',
    detail:
      'We print every order fresh to order. Once your prints pass our quality check they\'ll be packaged up and dispatched. You\'ll receive a separate shipping confirmation email when they\'re on their way.',
  },
  printing: {
    preview: 'Your 3D prints are currently being produced.',
    title: 'Printing in Progress',
    message:
      'Your order is on the printer right now! Each layer is being laid down with care.',
    detail:
      'FDM printing takes time — complex or larger pieces can run for several hours. Once complete, we\'ll inspect every item before packing.',
  },
  quality_check: {
    preview: 'Your prints have finished — we\'re doing a quality check before dispatch.',
    title: 'Quality Check Underway',
    message:
      'Your prints have come off the machine and we\'re now checking them over before packaging.',
    detail:
      'We inspect every print for layer quality, dimensional accuracy, and surface finish. If anything doesn\'t meet our standard, we reprint it — no shortcuts.',
  },
  ready_to_ship: {
    preview: 'Your order is packed and ready to dispatch.',
    title: 'Packed & Ready to Go',
    message:
      'Your order has passed quality check, been carefully packaged, and is ready for collection by Royal Mail.',
    detail:
      'You\'ll receive a separate shipping email with tracking information (if available for your delivery method) as soon as it\'s been handed over.',
  },
  delivered: {
    preview: 'Your Stratum order has been delivered. Enjoy your prints!',
    title: 'Order Delivered',
    message:
      'Your order has been marked as delivered — we hope your prints arrived in perfect condition!',
    detail:
      'Enjoying your purchase? We\'d love to hear from you. If anything isn\'t right, please get in touch and we\'ll make it right.',
  },
  refunded: {
    preview: 'A refund has been issued for your order.',
    title: 'Refund Issued',
    message:
      'A refund has been processed for your order. It should appear on your original payment method within 3-5 business days (some banks may take up to 10 days).',
    detail:
      'If you have any questions about your refund, don\'t hesitate to get in touch.',
    accentColor: '#22c55e',
  },
}

export function OrderStatusUpdateEmail({ orderNumber, status, appUrl }: OrderStatusUpdateEmailProps) {
  const statusInfo = STATUS_MESSAGES[status]
  if (!statusInfo) return null

  const accentColor = statusInfo.accentColor ?? s.colors.blue
  const isRefund = status === 'refunded'

  return (
    <Html>
      <Head />
      <Preview>{statusInfo.preview}</Preview>
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={{ ...s.accentBar, backgroundColor: accentColor }} />

          <Section style={s.header}>
            <Heading style={s.logo}>STRATUM</Heading>
            <Text style={s.tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={s.content}>
            <Text style={s.h3}>Order #{orderNumber}</Text>
            <Heading as="h2" style={s.h2}>{statusInfo.title}</Heading>
            <Text style={s.paragraph}>{statusInfo.message}</Text>

            {statusInfo.detail && (
              <Section style={{
                ...s.infoBox,
                borderLeft: `3px solid ${accentColor}`,
              }}>
                <Text style={{
                  color: isRefund ? s.colors.green : s.colors.muted,
                  fontSize: '13px',
                  lineHeight: '1.6',
                  margin: '0',
                }}>
                  {statusInfo.detail}
                </Text>
              </Section>
            )}

            {status === 'delivered' && (
              <>
                <Hr style={s.divider} />
                <Section style={{
                  backgroundColor: s.colors.arctic,
                  border: `1px solid ${s.colors.blue}`,
                  padding: '16px',
                }}>
                  <Text style={{ color: s.colors.white, fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>
                    Love your prints?
                  </Text>
                  <Text style={{ color: s.colors.muted, fontSize: '12px', lineHeight: '1.6', margin: '0' }}>
                    Your feedback helps us improve and lets other customers know what to expect.
                    If you&apos;re happy with your order, we&apos;d really appreciate it —
                    even just a quick word to{' '}
                    <Link href="mailto:hello@stratum3d.co.uk" style={s.inlineLink}>hello@stratum3d.co.uk</Link>.
                  </Text>
                </Section>
              </>
            )}

            <Hr style={s.divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/orders`} style={{ ...s.button, backgroundColor: accentColor }}>
                View Your Order
              </Link>
            </Section>
          </Section>

          <Section style={s.footerSection}>
            <Text style={s.footerText}>
              Questions? Email{' '}
              <Link href="mailto:hello@stratum3d.co.uk" style={s.footerLink}>hello@stratum3d.co.uk</Link>
              {' '}or{' '}
              <Link href={`${appUrl}/contact`} style={s.footerLink}>contact us online</Link>.
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
