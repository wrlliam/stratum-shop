import type { Metadata } from 'next'
import { DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartProvider } from '@/components/providers/CartProvider'
import { ConfirmProvider } from '@/components/providers/ConfirmProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { CartDrawer } from '@/components/shop/CartDrawer'
import { PageLoader } from '@/components/ui/PageLoader'
import { Toaster } from 'react-hot-toast'

const dmSans = DM_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Stratum — Precision 3D Prints',
    template: '%s | Stratum',
  },
  description:
    'Premium 3D printed objects, crafted layer by layer. Browse our collection of precision prints for every need.',
  keywords: ['3D printing', '3D prints', 'custom prints', 'stratum', 'precision printing'],
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'Stratum',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <body className="bg-brand-bg text-brand-text antialiased font-sans">
        <ThemeProvider>
        <ConfirmProvider>
        <CartProvider>
          <PageLoader />
          <Navbar />
          <CartDrawer />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgb(var(--brand-surface))',
                color: 'rgb(var(--brand-text))',
                border: '1px solid rgb(var(--brand-border))',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                fontSize: '14px',
              },
            }}
          />
        </CartProvider>
        </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
