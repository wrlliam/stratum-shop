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
      <Preview>Re: Order #{orderNumber} — {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={accentBar} />

          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={content}>
            <Text style={orderRef}>Re: Order #{orderNumber}</Text>
            <Heading as="h2" style={h2}>{subject}</Heading>

            <Section style={messageBox}>
              <Text style={messageText}>{body}</Text>
            </Section>

            <Hr style={divider} />

            <Section style={replyBox}>
              <Text style={replyTitle}>Need to reply?</Text>
              <Text style={replyText}>
                Simply reply to this email and we&apos;ll get back to you, or visit our{' '}
                <Link href={`${appUrl}/contact`} style={inlineLink}>contact page</Link>.
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
  margin: '0 0 20px',
}
const divider = { borderColor: '#E8EAED', margin: '24px 0' }

const messageBox = {
  backgroundColor: '#EBF6FC',
  borderRadius: '10px',
  padding: '20px',
  borderLeft: '3px solid #6CBCE3',
  border: '1px solid #6CBCE3',
}
const messageText = {
  color: '#1a1a2e',
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
}

const replyBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E8EAED',
}
const replyTitle = { color: '#1a1a2e', fontSize: '13px', fontWeight: '600', margin: '0 0 6px' }
const replyText = { color: '#6b7280', fontSize: '12px', lineHeight: '1.6', margin: '0' }
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
