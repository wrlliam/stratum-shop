'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AdminNavLinkProps {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

export function AdminNavLink({ href, label, icon, exact }: AdminNavLinkProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn('admin-link', isActive && 'active')}
    >
      {icon}
      {label}
    </Link>
  )
}
