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
import { formatPrice } from '@/lib/utils'

interface PrintRequestApprovedEmailProps {
  name: string
  description: string
  finalPricePence: number
  adminNotes?: string | null
  paymentUrl: string
  appUrl: string
}

export function PrintRequestApprovedEmail({
  name,
  description,
  finalPricePence,
  adminNotes,
  paymentUrl,
  appUrl,
}: PrintRequestApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your print request has been approved! Pay now to start printing.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={accentBar} />

          <Section style={header}>
            <Heading style={logo}>STRATUM</Heading>
            <Text style={tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>Your Print Request Has Been Approved!</Heading>
            <Text style={paragraph}>
              Hi {name.split(' ')[0] || 'there'}, great news — we&apos;ve reviewed your custom print
              request and it&apos;s ready to go.
            </Text>

            <Section style={detailsBox}>
              <Text style={detailLabel}>What you requested</Text>
              <Text style={detailValue}>{description.length > 200 ? description.slice(0, 200) + '…' : description}</Text>
            </Section>

            <Section style={priceBox}>
              <Text style={priceLabel}>Total Price</Text>
              <Text style={priceValue}>{formatPrice(finalPricePence)}</Text>
              <Text style={priceNote}>Inc. VAT where applicable</Text>
            </Section>

            {adminNotes && (
              <>
                <Hr style={divider} />
                <Section style={notesBox}>
                  <Text style={detailLabel}>Notes from our team</Text>
                  <Text style={notesText}>{adminNotes}</Text>
                </Section>
              </>
            )}

            <Hr style={divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={paymentUrl} style={button}>
                Pay Now
              </Link>
            </Section>

            <Text style={smallText}>
              This payment link will expire after 24 hours. If it expires, just reply to this
              email and we&apos;ll send a new one.
            </Text>
          </Section>

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
const paragraph = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const divider = { borderColor: '#E8EAED', margin: '24px 0' }

const detailsBox = {
  backgroundColor: '#F5F5F5',
  borderRadius: '10px',
  padding: '16px',
  border: '1px solid #E8EAED',
  marginBottom: '16px',
}
const detailLabel = {
  color: '#6b7280',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 6px',
  fontWeight: '600',
}
const detailValue = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
}

const priceBox = {
  backgroundColor: '#1a1a2e',
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center' as const,
}
const priceLabel = {
  color: '#6CBCE3',
  fontSize: '10px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 6px',
}
const priceValue = {
  color: '#FFFFFF',
  fontSize: '28px',
  fontWeight: '900',
  margin: '0',
}
const priceNote = {
  color: '#9ca3af',
  fontSize: '11px',
  margin: '6px 0 0',
}

const notesBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '10px',
  padding: '16px',
  borderLeft: '3px solid #6CBCE3',
}
const notesText = {
  color: '#374151',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '0',
}

const button = {
  backgroundColor: '#6CBCE3',
  color: '#1a1a2e',
  padding: '14px 40px',
  borderRadius: '8px',
  fontWeight: '700',
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
}

const smallText = {
  color: '#9ca3af',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
  lineHeight: '1.5',
}

const footerSection = {
  backgroundColor: '#F5F5F5',
  padding: '24px 32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #E8EAED',
}
const footerText = { color: '#6b7280', fontSize: '12px', margin: '4px 0' }
const footerLink = { color: '#3A9FD4', textDecoration: 'underline' }
