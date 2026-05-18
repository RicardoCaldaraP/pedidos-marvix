import { cn, STATUS_CONFIG } from '@/lib/utils'
import type { OrderStatus } from '@/types/database'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.bg,
        config.color,
        config.border,
        className
      )}
    >
      <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', config.color.replace('text-', 'bg-'))} />
      {config.label}
    </span>
  )
}
