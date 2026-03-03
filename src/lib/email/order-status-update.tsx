import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components'

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
  accentBar?: string // override top bar colour
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
      'A refund has been processed for your order. It should appear on your original payment method within 3–5 business days (some banks may take up to 10 days).',
    detail:
      'If you have any questions about your refund, don\'t hesitate to get in touch.',
    accentBar: '#16a34a',
  },
}

export function OrderStatusUpdateEmail({ orderNumber, status, appUrl }: OrderStatusUpdateEmailProps) {
  const statusInfo = STATUS_MESSAGES[status]
  if (!statusInfo) return null

  const barColour = statusInfo.accentBar ?? '#6CBCE3'
  const isRefund = status === 'refunded'

  return (
    <Html>
      <Head />
      <Preview>{statusInfo.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...accentBar, backgroundColor: barColour }} />

          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={content}>
            <Text style={orderRef}>Order #{orderNumber}</Text>
            <Heading as="h2" style={h2}>{statusInfo.title}</Heading>
            <Text style={paragraph}>{statusInfo.message}</Text>

            {statusInfo.detail && (
              <Section style={{ ...detailBox, borderLeft: `3px solid ${barColour}` }}>
                <Text style={isRefund ? refundDetailText : detailText}>{statusInfo.detail}</Text>
              </Section>
            )}

            {status === 'delivered' && (
              <>
                <Hr style={divider} />
                <Section style={reviewBox}>
                  <Text style={reviewTitle}>Love your prints?</Text>
                  <Text style={reviewText}>
                    Your feedback helps us improve and lets other customers know what to expect.
                    If you&apos;re happy with your order, we&apos;d really appreciate it —
                    even just a quick word to{' '}
                    <Link href="mailto:hello@stratum3d.co.uk" style={inlineLink}>hello@stratum3d.co.uk</Link>.
                  </Text>
                </Section>
              </>
            )}

            <Hr style={divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/orders`} style={{ ...button, backgroundColor: barColour }}>
                View Your Order
              </Link>
            </Section>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              Questions? Email{' '}
              <Link href="mailto:hello@stratum3d.co.uk" style={footerLink}>hello@stratum3d.co.uk</Link>
              {' '}or{' '}
              <Link href={`${appUrl}/contact`} style={footerLink}>contact us online</Link>.
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
const orderRef = {
  color: '#6b7280',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
}
const h2 = {
  color: '#1a1a2e',
  fontSize: '22px',
  fontWeight: '700',
  margin: '0 0 12px',
}
const paragraph = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const divider = { borderColor: '#E8EAED', margin: '24px 0' }

const detailBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E8EAED',
}
const detailText = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
}
const refundDetailText = {
  color: '#15803d',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
}

const reviewBox = {
  backgroundColor: '#EBF6FC',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #6CBCE3',
}
const reviewTitle = { color: '#1a1a2e', fontSize: '13px', fontWeight: '600', margin: '0 0 6px' }
const reviewText = { color: '#374151', fontSize: '12px', lineHeight: '1.6', margin: '0' }
const inlineLink = { color: '#3A9FD4', textDecoration: 'underline' }

const button = {
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
