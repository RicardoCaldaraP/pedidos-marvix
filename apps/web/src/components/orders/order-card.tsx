import Link from 'next/link'
import { formatRelativeTime, MATERIAL_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils'
import type { Order } from '@/types/database'
import { MessageSquare, Paperclip, Clock, ArrowUpRight } from 'lucide-react'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const statusCfg = STATUS_CONFIG[order.status]
  const priorityCfg = PRIORITY_CONFIG[order.priority]

  return (
    <Link href={`/dashboard/pedidos/${order.id}`}>
      <div className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-white/5 bg-white/2 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200 cursor-pointer overflow-hidden">
        {/* Gradient accent top */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, transparent, ${statusCfg.color.replace('text-', '').includes('-') ? 'rgb(96 165 250)' : 'rgb(96 165 250)'}, transparent)` }}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">
              {order.title}
            </h3>
            {order.description && (
              <p className="text-xs text-white/30 mt-1 line-clamp-2 leading-relaxed">{order.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              {statusCfg.label}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/50 transition-colors" />
          </div>
        </div>

        {/* Tags */}
        {order.material_types?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {order.material_types.map(type => (
              <span key={type}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/4 border border-white/6 text-white/40">
                <span className="text-[10px]">{MATERIAL_TYPE_CONFIG[type].icon}</span>
                {MATERIAL_TYPE_CONFIG[type].label}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-white/4">
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-medium ${priorityCfg.color}`}>
              {priorityCfg.label}
            </span>
            {order.profiles && (
              <>
                <span className="text-white/15">·</span>
                <span className="text-[11px] text-white/30">
                  {(order.profiles as { full_name: string }).full_name.split(' ')[0]}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/25">
            {(order._count?.comments ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {order._count?.comments}
              </span>
            )}
            {(order._count?.attachments ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {order._count?.attachments}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(order.created_at)}
            </span>
          </div>
        </div>

        {order.deadline && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/70 pt-1 border-t border-white/4">
            <Clock className="w-3 h-3" />
            Prazo: {new Date(order.deadline).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>
    </Link>
  )
}
