// Shared email styles — Dark editorial theme matching the app
// All emails use these base styles for consistency

export const colors = {
  bg: '#0a0a10',
  surface: '#10101a',
  arctic: '#16161e',
  border: '#22242f',
  text: '#e5e7eb',
  muted: '#9ca3af',
  blue: '#6CBCE3',
  blueDark: '#3A9FD4',
  blueLight: 'rgba(108,188,227,0.1)',
  green: '#22c55e',
  greenDark: '#16a34a',
  greenBg: 'rgba(34,197,94,0.08)',
  red: '#ef4444',
  amber: '#f59e0b',
  white: '#ffffff',
}

export const main = {
  backgroundColor: colors.bg,
  fontFamily: "'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
}

export const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: colors.surface,
  border: `1px solid ${colors.border}`,
}

export const accentBar = {
  backgroundColor: colors.blue,
  height: '3px',
  lineHeight: '3px',
  fontSize: '0px',
}

export const header = {
  backgroundColor: colors.bg,
  padding: '28px 32px',
  textAlign: 'center' as const,
  borderBottom: `1px solid ${colors.border}`,
}

export const logo = {
  color: colors.white,
  fontSize: '22px',
  fontWeight: '800',
  letterSpacing: '6px',
  margin: '0',
  textTransform: 'uppercase' as const,
}

export const tagline = {
  color: colors.blue,
  fontSize: '9px',
  letterSpacing: '3px',
  margin: '6px 0 0',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
}

export const content = { padding: '32px' }

export const h2 = {
  color: colors.white,
  fontSize: '20px',
  fontWeight: '700',
  margin: '0 0 12px',
  letterSpacing: '-0.01em',
}

export const h3 = {
  color: colors.blue,
  fontSize: '9px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  margin: '0 0 8px',
}

export const paragraph = {
  color: colors.muted,
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
}

export const divider = {
  borderColor: colors.border,
  margin: '24px 0',
}

export const metaBox = {
  backgroundColor: colors.arctic,
  padding: '16px',
  border: `1px solid ${colors.border}`,
}

export const metaLabel = {
  color: colors.muted,
  fontSize: '9px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 4px',
  fontWeight: '600',
}

export const metaValue = {
  color: colors.white,
  fontSize: '13px',
  fontWeight: '600',
  margin: '0',
}

export const infoBox = {
  backgroundColor: colors.arctic,
  padding: '16px',
  border: `1px solid ${colors.border}`,
  borderLeft: `3px solid ${colors.blue}`,
}

export const itemRow = {
  paddingBottom: '12px',
  marginBottom: '12px',
  borderBottom: `1px solid ${colors.border}`,
}

export const itemName = {
  color: colors.white,
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

export const itemQty = {
  color: colors.muted,
  fontSize: '12px',
  margin: '2px 0 0',
}

export const itemPrice = {
  color: colors.white,
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'right' as const,
  margin: '0',
}

export const totalsBox = {
  backgroundColor: colors.arctic,
  padding: '16px',
  marginTop: '16px',
  border: `1px solid ${colors.border}`,
}

export const totalRow = {
  marginBottom: '8px',
}

export const totalLabel = {
  color: colors.muted,
  fontSize: '13px',
  margin: '0',
}

export const totalValue = {
  color: colors.text,
  fontSize: '13px',
  margin: '0',
  textAlign: 'right' as const,
}

export const grandTotalLabel = {
  color: colors.white,
  fontSize: '15px',
  fontWeight: '700',
  margin: '0',
}

export const grandTotalValue = {
  color: colors.blue,
  fontSize: '15px',
  fontWeight: '700',
  margin: '0',
  textAlign: 'right' as const,
}

export const button = {
  backgroundColor: colors.blue,
  color: colors.bg,
  padding: '12px 36px',
  fontWeight: '700',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
  letterSpacing: '0.5px',
}

export const smallText = {
  color: colors.muted,
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
  lineHeight: '1.5',
}

export const footerSection = {
  backgroundColor: colors.bg,
  padding: '24px 32px',
  textAlign: 'center' as const,
  borderTop: `1px solid ${colors.border}`,
}

export const footerText = {
  color: colors.muted,
  fontSize: '11px',
  margin: '4px 0',
}

export const footerLink = {
  color: colors.blue,
  textDecoration: 'underline',
}

export const addressBox = {
  backgroundColor: colors.arctic,
  padding: '16px',
  border: `1px solid ${colors.border}`,
}

export const addressText = {
  color: colors.text,
  fontSize: '13px',
  lineHeight: '1.8',
  margin: '0',
}

export const inlineLink = {
  color: colors.blue,
  textDecoration: 'underline',
}
