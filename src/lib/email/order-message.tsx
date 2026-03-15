import {
  Body, Container, Head, Heading, Html, Preview,
  Section, Text, Hr, Link,
} from '@react-email/components'
import * as s from './styles'

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
      <Body style={s.main}>
        <Container style={s.container}>
          <Section style={s.accentBar} />

          <Section style={s.header}>
            <Heading style={s.logo}>STRATUM</Heading>
            <Text style={s.tagline}>Precision 3D Prints</Text>
          </Section>

          <Section style={s.content}>
            <Text style={s.h3}>Re: Order #{orderNumber}</Text>
            <Heading as="h2" style={s.h2}>{subject}</Heading>

            <Section style={{
              backgroundColor: s.colors.arctic,
              border: `1px solid ${s.colors.blue}`,
              borderLeft: `3px solid ${s.colors.blue}`,
              padding: '20px',
            }}>
              <Text style={{
                color: s.colors.white,
                fontSize: '14px',
                lineHeight: '1.7',
                margin: '0',
                whiteSpace: 'pre-wrap' as const,
              }}>
                {body}
              </Text>
            </Section>

            <Hr style={s.divider} />

            <Section style={s.infoBox}>
              <Text style={{ color: s.colors.white, fontSize: '13px', fontWeight: '600', margin: '0 0 4px' }}>
                Need to reply?
              </Text>
              <Text style={{ color: s.colors.muted, fontSize: '12px', lineHeight: '1.6', margin: '0' }}>
                Simply reply to this email and we&apos;ll get back to you, or visit our{' '}
                <Link href={`${appUrl}/contact`} style={s.inlineLink}>contact page</Link>.
              </Text>
            </Section>

            <Hr style={s.divider} />

            <Section style={{ textAlign: 'center' }}>
              <Link href={`${appUrl}/orders`} style={s.button}>View Your Order</Link>
            </Section>
          </Section>

          <Section style={s.footerSection}>
            <Text style={s.footerText}>
              Questions? Email{' '}
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
