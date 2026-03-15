'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  HamburgerMenuIcon,
  Cross1Icon,
  BackpackIcon,
  ChevronDownIcon,
  ExitIcon,
  DashboardIcon,
  PersonIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'motion/react'
import { useCart } from '@/components/providers/CartProvider'
import { useSession, signOut } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils'
import { AnnouncementBanner } from '@/components/layout/AnnouncementBanner'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navLinks = [
  { href: '/products', label: 'Shop' },
  { href: '/bundles', label: 'Bundles' },
  { href: '/recommendations', label: 'Request a Print' },
]

interface SearchResult {
  id: string
  name: string
  slug: string
  price: number
  images: { url: string; alt?: string }[]
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { cart, toggleCart } = useCart()
  const { data: session } = useSession()

  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
  }, [pathname])

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`)
        const data = await res.json()
        setSearchResults(data.products || [])
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    if (searchOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [searchOpen])

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [searchOpen])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
    }
    if (searchOpen) {
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [searchOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  if (isAdmin) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-30">
      <AnnouncementBanner />
    <nav
      className={cn(
        'transition-all duration-300',
        scrolled
          ? 'bg-brand-bg/90 backdrop-blur-xl border-b border-brand-border'
          : 'bg-transparent backdrop-blur-sm border-b border-brand-border/30'
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
            <span className="text-xl font-bold font-mono tracking-tight text-brand-text group-hover:text-brand-blue transition-colors">
              STRATUM
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-sm text-sm font-medium transition-all duration-200',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'text-brand-blue border-b-2 border-brand-blue font-semibold'
                    : 'text-brand-muted hover:text-brand-text hover:bg-brand-arctic'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div ref={searchRef} className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} className="flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search prints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 sm:w-56 px-3 py-2 text-sm bg-brand-surface border border-brand-border rounded-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                    className="p-2 text-brand-muted hover:text-brand-text ml-1"
                  >
                    <Cross1Icon className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="p-2.5 rounded-sm text-brand-muted hover:text-brand-blue hover:bg-brand-arctic transition-all duration-200"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              )}

              {/* Search results dropdown */}
              {searchOpen && searchQuery.trim() && (
                <div className="absolute right-0 top-full mt-1 w-72 sm:w-80 bg-brand-surface border border-brand-border rounded-sm shadow-card-lg overflow-hidden z-50 animate-fade-in">
                  {searchLoading ? (
                    <div className="px-4 py-6 text-center">
                      <div className="animate-spin w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full mx-auto" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-brand-muted">
                      No results for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    <>
                      {searchResults.map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-brand-arctic transition-colors"
                        >
                          {product.images[0] && (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              width={36}
                              height={36}
                              className="rounded-sm object-cover w-9 h-9"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-text truncate">{product.name}</p>
                            <p className="text-xs text-brand-blue font-semibold">{formatPrice(product.price)}</p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        href={`/products?search=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setSearchOpen(false)}
                        className="block px-4 py-2.5 text-center text-xs font-medium text-brand-blue bg-brand-arctic hover:bg-brand-blue-light transition-colors border-t border-brand-border"
                      >
                        View all results
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Cart */}
            <button
              onClick={toggleCart}
              aria-label="Open cart"
              className="relative p-2.5 rounded-sm text-brand-muted hover:text-brand-blue hover:bg-brand-arctic transition-all duration-200"
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
                  className="flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium text-brand-text hover:bg-brand-arctic transition-all duration-200"
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
                  <div className="absolute right-0 mt-1 w-48 bg-brand-surface border border-brand-border rounded-sm shadow-card-lg overflow-hidden animate-fade-in">
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
                    <Link
                      href="/support"
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg width="16" height="16" viewBox="0 0 15 15" fill="none" className="w-4 h-4"><path d="M7.5 1a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 7.5 1zM0 7.5a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0zm7.5-3a1 1 0 0 0-1 1H5a2.5 2.5 0 0 1 5 0c0 .84-.65 1.47-1.15 1.87-.25.21-.45.39-.58.55-.12.15-.27.37-.27.63H7c0-.47.18-.77.37-1.01.2-.25.46-.47.7-.66C8.5 6.48 9 6.06 9 5.5a1 1 0 0 0-1-1zm-.75 6a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
                      Support
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
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-brand-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400 transition-colors"
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
                className="hidden md:flex items-center px-4 py-2 rounded-sm text-sm font-medium border border-brand-border text-brand-text hover:text-brand-blue hover:border-brand-blue hover:bg-brand-arctic transition-all duration-200"
              >
                Sign in
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
              className="md:hidden p-2.5 rounded-sm text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-all"
            >
              {menuOpen ? <Cross1Icon className="w-4 h-4" /> : <HamburgerMenuIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden border-t border-brand-border bg-brand-surface overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center px-4 py-3 rounded-sm text-sm font-medium transition-all',
                      pathname === link.href
                        ? 'text-brand-blue bg-brand-blue-light font-semibold'
                        : 'text-brand-text hover:text-brand-blue hover:bg-brand-arctic'
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div className="pt-2 border-t border-brand-border">
                {session?.user ? (
                  <>
                    <Link
                      href="/account"
                      className="flex items-center gap-2 px-4 py-3 rounded-sm text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                    >
                      <PersonIcon className="w-4 h-4" />
                      Account
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 px-4 py-3 rounded-sm text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                    >
                      <BackpackIcon className="w-4 h-4" />
                      My Orders
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center gap-2 px-4 py-3 rounded-sm text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                    >
                      <svg width="16" height="16" viewBox="0 0 15 15" fill="none" className="w-4 h-4"><path d="M7.5 1a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 7.5 1zM0 7.5a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0zm7.5-3a1 1 0 0 0-1 1H5a2.5 2.5 0 0 1 5 0c0 .84-.65 1.47-1.15 1.87-.25.21-.45.39-.58.55-.12.15-.27.37-.27.63H7c0-.47.18-.77.37-1.01.2-.25.46-.47.7-.66C8.5 6.48 9 6.06 9 5.5a1 1 0 0 0-1-1zm-.75 6a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/></svg>
                      Support
                    </Link>
                    {(session.user as { role?: string }).role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-3 rounded-sm text-sm text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                      >
                        <DashboardIcon className="w-4 h-4" />
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-sm text-sm text-brand-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400 transition-all"
                    >
                      <ExitIcon className="w-4 h-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center px-4 py-3 rounded-sm text-sm font-medium text-brand-text hover:text-brand-blue hover:bg-brand-arctic transition-all"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </div>
  )
}
