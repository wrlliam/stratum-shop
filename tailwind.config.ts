import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: 'rgb(var(--brand-blue) / <alpha-value>)',
          'blue-dark': 'rgb(var(--brand-blue-dark) / <alpha-value>)',
          'blue-light': 'rgb(var(--brand-blue-light) / <alpha-value>)',
          slate: 'rgb(var(--brand-slate) / <alpha-value>)',
          charcoal: 'rgb(var(--brand-charcoal) / <alpha-value>)',
          'light-gray': 'rgb(var(--brand-light-gray) / <alpha-value>)',
          arctic: 'rgb(var(--brand-arctic) / <alpha-value>)',
          bg: 'rgb(var(--brand-bg) / <alpha-value>)',
          surface: 'rgb(var(--brand-surface) / <alpha-value>)',
          border: 'rgb(var(--brand-border) / <alpha-value>)',
          text: 'rgb(var(--brand-text) / <alpha-value>)',
          muted: 'rgb(var(--brand-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'DM Mono', 'monospace'],
        display: ['var(--font-display)', 'Cal Sans', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        'display': ['5.5rem', { lineHeight: '0.92', letterSpacing: '-0.02em' }],
        'display-sm': ['3.5rem', { lineHeight: '0.95', letterSpacing: '-0.01em' }],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
        'blue-sm': '0 2px 8px rgba(108,188,227,0.25)',
        'blue': '0 4px 16px rgba(108,188,227,0.35)',
        'blue-lg': '0 8px 24px rgba(108,188,227,0.4)',
        'inner-border': 'inset 0 0 0 1.5px rgb(var(--brand-border))',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scan-line': 'scanLine 1.2s ease-in-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-down': 'slideDown 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scanLine: {
          '0%': { transform: 'scaleX(0)', opacity: '1' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        slideDown: {
          '0%': { opacity: '0', maxHeight: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', maxHeight: '600px', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
