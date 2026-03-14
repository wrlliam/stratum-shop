'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { AdminSignOut } from '@/components/admin/AdminSignOut'
import {
  DashboardIcon,
  BackpackIcon,
  LayersIcon,
  LightningBoltIcon,
  ExternalLinkIcon,
  BoxIcon,
  BarChartIcon,
  DiscIcon,
  RulerSquareIcon,
  SpeakerLoudIcon,
  PersonIcon,
  EnvelopeClosedIcon,
  ClipboardIcon,
  TimerIcon,
  ChatBubbleIcon,
  ChevronDownIcon,
  StackIcon,
  RocketIcon,
} from '@radix-ui/react-icons'
import { RecentAuditFeed } from '@/components/admin/RecentAuditFeed'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: <DashboardIcon className="w-4 h-4" />, exact: true },
      { href: '/admin/mission-control', label: 'Mission Control', icon: <RocketIcon className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: <BoxIcon className="w-4 h-4" /> },
      { href: '/admin/bundles', label: 'Bundles', icon: <LayersIcon className="w-4 h-4" /> },
      { href: '/admin/inventory', label: 'Inventory', icon: <BarChartIcon className="w-4 h-4" /> },
      { href: '/admin/filaments', label: 'Filaments', icon: <StackIcon className="w-4 h-4" /> },
      { href: '/admin/recommendations', label: 'Requests', icon: <LightningBoltIcon className="w-4 h-4" /> },
      { href: '/admin/pricing', label: 'Pricing', icon: <RulerSquareIcon className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: <BackpackIcon className="w-4 h-4" /> },
      { href: '/admin/coupons', label: 'Coupons', icon: <DiscIcon className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: <PersonIcon className="w-4 h-4" /> },
      { href: '/admin/banners', label: 'Banners', icon: <SpeakerLoudIcon className="w-4 h-4" /> },
      { href: '/admin/emails', label: 'Mass Email', icon: <EnvelopeClosedIcon className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Support',
    items: [
      { href: '/admin/support', label: 'Support Tickets', icon: <ChatBubbleIcon className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/costs', label: 'Cost Tracking', icon: <TimerIcon className="w-4 h-4" /> },
      { href: '/admin/audit', label: 'Audit Log', icon: <ClipboardIcon className="w-4 h-4" /> },
    ],
  },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-brand-blue/10 text-brand-blue'
          : 'text-brand-muted hover:text-brand-text hover:bg-brand-arctic'
      )}
    >
      <span className={cn('flex-shrink-0', isActive ? 'text-brand-blue' : 'text-brand-muted')}>
        {item.icon}
      </span>
      {item.label}
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
      )}
    </Link>
  )
}

function CollapsedNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        'flex items-center justify-center p-2 rounded-lg transition-all duration-150',
        isActive
          ? 'bg-brand-blue/10 text-brand-blue'
          : 'text-brand-muted hover:text-brand-text hover:bg-brand-arctic'
      )}
    >
      {item.icon}
    </Link>
  )
}

function NavGroup({ group }: { group: NavGroup }) {
  const pathname = usePathname()
  const hasActive = group.items.some((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  )
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-brand-muted uppercase tracking-widest hover:text-brand-text transition-colors"
      >
        {group.label}
        <ChevronDownIcon
          className={cn(
            'w-3 h-3 transition-transform duration-200',
            open ? 'rotate-0' : '-rotate-90'
          )}
        />
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-0.5 pb-1">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

const COLLAPSED_KEY = 'adminSidebarCollapsed'

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  })

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(COLLAPSED_KEY, next ? 'true' : 'false')
    // Dispatch event so layout can react
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: next } }))
  }

  return (
    <aside
      className={cn(
        'h-screen flex-shrink-0 border-r border-brand-border bg-brand-surface flex flex-col transition-all duration-200',
        collapsed ? 'w-[52px]' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-brand-border">
        {collapsed ? (
          <Link href="/admin" className="flex justify-center">
            <Image src="/icon.png" alt="Stratum" width={24} height={24} />
          </Link>
        ) : (
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="Stratum" width={28} height={28} />
            <div>
              <p className="text-sm font-bold text-brand-text">Stratum</p>
              <p className="text-[10px] text-brand-muted uppercase tracking-widest">Admin</p>
            </div>
          </Link>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
        {collapsed ? (
          <div className="space-y-1">
            {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
              <CollapsedNavLink key={item.href} item={item} />
            ))}
          </div>
        ) : (
          NAV_GROUPS.map((group) => (
            <NavGroup key={group.label} group={group} />
          ))
        )}
      </nav>

      {/* Recent Activity (hidden when collapsed) */}
      {!collapsed && <RecentAuditFeed />}

      {/* Bottom */}
      <div className={cn('border-t border-brand-border', collapsed ? 'p-1.5' : 'p-3 space-y-0.5')}>
        {collapsed ? (
          <>
            <Link
              href="/"
              className="flex items-center justify-center p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-all"
              title="View Shop"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </Link>
            <button
              onClick={toggle}
              className="w-full flex items-center justify-center p-2 rounded-lg text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-all"
              title="Expand sidebar"
            >
              <ChevronDownIcon className="w-4 h-4 -rotate-90" />
            </button>
          </>
        ) : (
          <>
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-all"
            >
              <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" />
              View Shop
            </Link>
            <AdminSignOut />
            <button
              onClick={toggle}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand-muted hover:text-brand-text hover:bg-brand-arctic transition-all"
            >
              <ChevronDownIcon className="w-4 h-4 flex-shrink-0 rotate-90" />
              Collapse
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
