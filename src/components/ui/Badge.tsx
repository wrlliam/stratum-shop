import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default: 'bg-brand-arctic text-brand-text border-brand-border',
  blue: 'bg-brand-blue-light text-brand-blue border-brand-blue/30',
  green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  red: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
}

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'default' },
    paid: { label: 'Paid', variant: 'green' },
    processing: { label: 'Processing', variant: 'blue' },
    preparing: { label: 'Preparing', variant: 'amber' },
    prepared: { label: 'Prepared', variant: 'purple' },
    shipped: { label: 'Shipped', variant: 'purple' },
    delivered: { label: 'Delivered', variant: 'green' },
    cancelled: { label: 'Cancelled', variant: 'red' },
    refunded: { label: 'Refunded', variant: 'amber' },
    reviewing: { label: 'Reviewing', variant: 'blue' },
    accepted: { label: 'Accepted', variant: 'green' },
    declined: { label: 'Declined', variant: 'red' },
  }

  const config = map[status] || { label: status, variant: 'default' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
