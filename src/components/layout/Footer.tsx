'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  if (pathname.startsWith('/admin')) return null

  return (
    <footer className="bg-white border-t border-brand-border mt-20">
      <div className="brand-stripe" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/icon.png" alt="Stratum" width={28} height={28} />
              <span className="text-lg font-bold tracking-tight text-brand-text">Stratum</span>
            </div>
            <p className="text-sm text-brand-muted leading-relaxed max-w-xs">
              Precision 3D printed objects, crafted layer by layer. Each piece is made to order
              with high-quality materials.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/products', label: 'All Products' },
                { href: '/bundles', label: 'Bundles' },
                { href: '/products?featured=true', label: 'Featured' },
                { href: '/recommendations', label: 'Request a Print' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-brand-muted hover:text-brand-blue transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-semibold text-brand-blue uppercase tracking-widest mb-4">
              Info
            </h4>
            <ul className="space-y-3">
              {[
                { href: '#', label: 'About Us' },
                { href: '#', label: 'Shipping Policy' },
                { href: '#', label: 'Returns & Refunds' },
                { href: '#', label: 'Contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-brand-muted hover:text-brand-blue transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-muted">
            © {new Date().getFullYear()} Stratum. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-muted">Payments secured by</span>
            <span className="text-xs font-semibold text-brand-text bg-brand-arctic border border-brand-border px-2 py-0.5 rounded">
              Stripe
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
