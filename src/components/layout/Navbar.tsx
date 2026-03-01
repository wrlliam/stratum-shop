'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  HamburgerMenuIcon,
  Cross1Icon,
  BackpackIcon,
  ChevronDownIcon,
  ExitIcon,
  DashboardIcon,
  PersonIcon,
} from '@radix-ui/react-icons'
import { useCart } from '@/components/providers/CartProvider'
import { useSession, signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/bundles', label: 'Bundles' },
  { href: '/recommendations', label: 'Request a Print' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const { cart, toggleCart } = useCart()
  const { data: session } = useSession()

  if (pathname.startsWith('/admin')) return null

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-30 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-brand-border shadow-card'
          : 'bg-white/80 backdrop-blur-sm border-b border-brand-border'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/icon.png"
              alt="Stratum"
              width={32}
              height={32}
              className="group-hover:scale-105 transition-transform duration-200"
            />
            <span className="text-xl font-bold tracking-tight text-brand-text group-hover:text-brand-blue transition-colors">
              Stratum
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-brand-blue bg-brand-blue-light font-semibold'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-arctic'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <button
              onClick={toggleCart}
              aria-label="Open cart"
              className="relative p-2.5 rounded-xl text-brand-muted hover:text-brand-blue hover:bg-brand-arctic transition-all duration-200"
            >
              <BackpackIcon className="w-5 h-5" />
              {cart.itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-blue text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.itemCount > 9 ? '9+' : cart.itemCount}
                </span>
              )}
            </button>

            {/* User menu */}
            {session?.user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-brand-text hover:bg-brand-arctic transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-brand-blue-light border border-brand-blue/30 flex items-center justify-center text-xs font-bold text-brand-blue">
                    {session.user.name?.charAt(0).toUpperCase() || <PersonIcon />}
                  </div>
                  <span className="max-w-[120px] truncate">{session.user.name}</span>
                  <ChevronDownIcon
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200 text-brand-muted',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-brand-border rounded-xl shadow-card-lg overflow-hidden animate-fade-in">
                    <Link
                      href="/account"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <PersonIcon className="w-4 h-4" />
                      Account
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <BackpackIcon className="w-4 h-4" />
                      My Orders
                    </Link>
                    {(session.user as { role?: string }).role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-4 py-3 text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <DashboardIcon className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-brand-border" />
                    <button
                      onClick={() => {
                        signOut()
                        setUserMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-brand-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ExitIcon className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden md:flex items-center px-4 py-2 rounded-xl text-sm font-medium border border-brand-border text-brand-text hover:text-brand-blue hover:border-brand-blue hover:bg-brand-arctic transition-all duration-200"
              >
                Sign in
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="md:hidden p-2.5 rounded-xl text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-all"
            >
              {menuOpen ? <Cross1Icon className="w-4 h-4" /> : <HamburgerMenuIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-border bg-white">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  pathname === link.href
                    ? 'text-brand-blue bg-brand-blue-light font-semibold'
                    : 'text-brand-text hover:text-brand-blue hover:bg-brand-arctic'
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-brand-border">
              {session?.user ? (
                <>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                  >
                    <PersonIcon className="w-4 h-4" />
                    Account
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                  >
                    <BackpackIcon className="w-4 h-4" />
                    My Orders
                  </Link>
                  {(session.user as { role?: string }).role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                    >
                      <DashboardIcon className="w-4 h-4" />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-brand-muted hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <ExitIcon className="w-4 h-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
