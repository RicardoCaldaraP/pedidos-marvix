import { formatDateTime } from '@/lib/utils'
import type { OrderHistory, HistoryEventType } from '@/types/database'
import {
  Plus, MessageSquare, Paperclip, CheckCircle, RotateCcw,
  Send, XCircle, Clock, Eye
} from 'lucide-react'

interface OrderTimelineProps {
  history: OrderHistory[]
}

const EVENT_CONFIG: Record<HistoryEventType, {
  icon: React.ElementType
  color: string
  bg: string
}> = {
  created: { icon: Plus, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  status_changed: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  comment_added: { icon: MessageSquare, color: 'text-white/40', bg: 'bg-white/8' },
  attachment_added: { icon: Paperclip, color: 'text-white/40', bg: 'bg-white/8' },
  preview_sent: { icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  approved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  revision_requested: { icon: RotateCcw, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  final_delivered: { icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  cancelled: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/15' },
}

export function OrderTimeline({ history }: OrderTimelineProps) {
  if (history.length === 0) return null

  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
      <h3 className="text-[11px] font-semibold text-white/35 uppercase tracking-[0.12em] mb-5">
        Timeline
      </h3>

      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/6" />

        <div className="space-y-4">
          {[...history].reverse().map((event) => {
            const config = EVENT_CONFIG[event.event_type] ?? EVENT_CONFIG.status_changed

            return (
              <div key={event.id} className="flex gap-3 relative">
                <div className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center`}>
                  <config.icon className={`w-3 h-3 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-xs text-white/70 leading-relaxed">{event.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {event.profiles?.full_name && (
                      <p className="text-[11px] text-white/25">
                        {event.profiles.full_name.split(' ')[0]}
                      </p>
                    )}
                    {event.profiles?.full_name && <span className="text-white/15">·</span>}
                    <p className="text-[11px] text-white/20">
                      {formatDateTime(event.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
