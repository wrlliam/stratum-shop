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

interface OrderMessageEmailProps {
  orderNumber: string
  subject: string
  body: string
  appUrl: string
}

export function OrderMessageEmail({ orderNumber, subject, body, appUrl }: OrderMessageEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on your Stratum order #{orderNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Hr style={divider} />

          {/* Content */}
          <Section style={content}>
            <Text style={orderRef}>Re: Order #{orderNumber}</Text>
            <Heading as="h2" style={h2}>
              {subject}
            </Heading>
            <Text style={paragraph}>{body}</Text>

            <Hr style={divider} />

            <Section style={{ textAlign: 'center' as const }}>
              <Link href={`${appUrl}/orders`} style={button}>
                View Your Orders
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

// Styles (matching order-confirmation.tsx)
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
const orderRef = { color: '#9ca3af', fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '1px', margin: '0 0 8px' }
const h2 = { color: '#f9fafb', fontSize: '24px', fontWeight: '700', margin: '0 0 16px' }
const paragraph = { color: '#c8c8f0', fontSize: '14px', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-wrap' as const }
const divider = { borderColor: '#2d2d55', margin: '24px 0' }
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
