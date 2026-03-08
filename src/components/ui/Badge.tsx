import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'green' | 'red' | 'amber' | 'purple'
  size?: 'sm' | 'md'
  className?: string
}

const variants = {
  default: 'bg-brand-arctic text-brand-text border-brand-border',
  blue: 'badge-blue bg-brand-blue-light text-brand-blue border-brand-blue/30',
  green: 'badge-green bg-green-950/60 text-green-400 border-green-800/50',
  red: 'badge-red bg-red-950/60 text-red-400 border-red-800/50',
  amber: 'badge-amber bg-amber-950/60 text-amber-400 border-amber-800/50',
  purple: 'badge-purple bg-purple-950/60 text-purple-400 border-purple-800/50',
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
    prepared: { label: 'Prepared', variant: 'amber' },
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
