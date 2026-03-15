import {
  Body, Container, Head, Heading, Html, Preview,
  Section, Text, Hr, Link,
} from '@react-email/components'
import { formatPrice } from '@/lib/utils'
import * as s from './styles'

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
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={s.accentBar} />

          <Section style={s.header}>
            <Heading style={s.logo}>STRATUM</Heading>
            <Text style={s.tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={s.content}>
            <Text style={s.h3}>Print Request Approved</Text>
            <Heading as="h2" style={s.h2}>Your print request is ready to go!</Heading>
            <Text style={s.paragraph}>
              Hi {name.split(' ')[0] || 'there'}, great news — we&apos;ve reviewed your custom print
              request and it&apos;s been approved.
            </Text>

            {description && (
              <Section style={{
                backgroundColor: s.colors.arctic,
                border: `1px solid ${s.colors.border}`,
                padding: '16px',
                marginBottom: '16px',
              }}>
                <Text style={s.metaLabel}>What You Requested</Text>
                <Text style={{
                  color: s.colors.text,
                  fontSize: '13px',
                  lineHeight: '1.6',
                  margin: '0',
                }}>
                  {description.length > 200 ? description.slice(0, 200) + '...' : description}
                </Text>
              </Section>
            )}

            {/* Price box */}
            <Section style={{
              backgroundColor: s.colors.arctic,
              border: `1px solid ${s.colors.blue}`,
              padding: '24px',
              textAlign: 'center' as const,
            }}>
              <Text style={{ ...s.metaLabel, color: s.colors.blue }}>Total Price</Text>
              <Text style={{
                color: s.colors.white,
                fontSize: '28px',
                fontWeight: '800',
                margin: '8px 0 8px',
              }}>
                {formatPrice(finalPricePence)}
              </Text>
              <Text style={{
                color: s.colors.muted,
                fontSize: '11px',
                margin: '0',
              }}>
                Inc. VAT where applicable
              </Text>
            </Section>

            {adminNotes && (
              <>
                <Hr style={s.divider} />
                <Section style={s.infoBox}>
                  <Text style={s.metaLabel}>Notes From Our Team</Text>
                  <Text style={{
                    color: s.colors.text,
                    fontSize: '13px',
                    lineHeight: '1.6',
                    margin: '4px 0 0',
                  }}>
                    {adminNotes}
                  </Text>
                </Section>
              </>
            )}

            <Hr style={s.divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={paymentUrl} style={{
                ...s.button,
                padding: '14px 40px',
                fontSize: '15px',
              }}>
                Pay Now
              </Link>
            </Section>

            <Text style={s.smallText}>
              This payment link will expire after 24 hours. If it expires, just reply to this
              email and we&apos;ll send a new one.
            </Text>
          </Section>

          <Section style={s.footerSection}>
            <Text style={s.footerText}>
              Questions? Email us at{' '}
              <Link href="mailto:hello@stratum3d.co.uk" style={s.footerLink}>hello@stratum3d.co.uk</Link>
              {' '}or{' '}
              <Link href={`${appUrl}/contact`} style={s.footerLink}>visit our contact page</Link>.
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
