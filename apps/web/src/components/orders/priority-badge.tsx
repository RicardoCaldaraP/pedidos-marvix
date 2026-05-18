import { cn, PRIORITY_CONFIG } from '@/lib/utils'
import type { OrderPriority } from '@/types/database'
import { ArrowDown, ArrowRight, ArrowUp, Zap } from 'lucide-react'

interface PriorityBadgeProps {
  priority: OrderPriority
  className?: string
}

const ICONS = {
  low: ArrowDown,
  normal: ArrowRight,
  high: ArrowUp,
  urgent: Zap,
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  const Icon = ICONS[priority]

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', config.color, className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}
