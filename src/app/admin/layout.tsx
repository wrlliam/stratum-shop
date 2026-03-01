import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import {
  DashboardIcon,
  BackpackIcon,
  LayersIcon,
  LightningBoltIcon,
  ExternalLinkIcon,
  BoxIcon,
  BarChartIcon,
  DiscIcon,
} from '@radix-ui/react-icons'
import { AdminNavLink } from '@/components/admin/AdminNavLink'
import { AdminSignOut } from '@/components/admin/AdminSignOut'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: <DashboardIcon className="w-4 h-4" />, exact: true },
  { href: '/admin/products', label: 'Products', icon: <BoxIcon className="w-4 h-4" /> },
  { href: '/admin/bundles', label: 'Bundles', icon: <LayersIcon className="w-4 h-4" /> },
  { href: '/admin/orders', label: 'Orders', icon: <BackpackIcon className="w-4 h-4" /> },
  { href: '/admin/coupons', label: 'Coupons', icon: <DiscIcon className="w-4 h-4" /> },
  { href: '/admin/inventory', label: 'Inventory', icon: <BarChartIcon className="w-4 h-4" /> },
  { href: '/admin/recommendations', label: 'Requests', icon: <LightningBoltIcon className="w-4 h-4" /> },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex bg-brand-bg">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-brand-border bg-white flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-brand-border">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="Stratum" width={28} height={28} />
            <div>
              <p className="text-sm font-bold text-brand-text">Stratum</p>
              <p className="text-[10px] text-brand-muted uppercase tracking-widest">Admin</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <AdminNavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              exact={item.exact}
            />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-brand-border space-y-0.5">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-all"
          >
            <ExternalLinkIcon className="w-4 h-4" />
            View Shop
          </Link>
          <AdminSignOut />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
