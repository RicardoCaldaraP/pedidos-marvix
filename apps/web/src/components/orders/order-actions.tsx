'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus } from '@/types/database'
import { toast } from 'sonner'
import {
  ChevronDown, Play, Send, CheckCircle, RotateCcw, XCircle
} from 'lucide-react'

interface OrderActionsProps {
  order: Order
  isAdmin: boolean
  currentUserId: string
}

export function OrderActions({ order, isAdmin, currentUserId }: OrderActionsProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function changeStatus(newStatus: OrderStatus, description: string) {
    setLoading(true)
    setOpen(false)

    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', order.id)

    if (error) {
      toast.error('Erro ao atualizar status')
      setLoading(false)
      return
    }

    await supabase.from('order_history').insert({
      order_id: order.id,
      user_id: currentUserId,
      event_type: 'status_changed',
      description,
    })

    await supabase.from('notifications').insert({
      user_id: order.created_by,
      title: 'Status do pedido atualizado',
      message: description,
      type: 'status_changed',
      order_id: order.id,
      read: false,
    })

    toast.success(description)
    router.refresh()
    setLoading(false)
  }

  const isOwner = order.created_by === currentUserId
  const btnBase = 'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all disabled:opacity-50'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Client: approve / request revision */}
      {!isAdmin && isOwner && order.status === 'awaiting_approval' && (
        <>
          <button
            disabled={loading}
            onClick={() => changeStatus('completed', 'Prévia aprovada — pedido finalizado!')}
            className={`${btnBase} bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Aprovar
          </button>
          <button
            disabled={loading}
            onClick={() => changeStatus('revision_requested', 'Alteração solicitada pelo cliente')}
            className={`${btnBase} bg-white/4 text-white/50 border border-white/10 hover:text-white/80 hover:bg-white/8`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Pedir Alteração
          </button>
        </>
      )}

      {/* Client: cancel */}
      {!isAdmin && isOwner && ['new', 'in_progress', 'revision_requested'].includes(order.status) && (
        <button
          disabled={loading}
          onClick={() => changeStatus('cancelled', 'Pedido cancelado pelo cliente')}
          className={`${btnBase} bg-red-500/8 text-red-400/70 border border-red-500/15 hover:bg-red-500/15 hover:text-red-400`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancelar
        </button>
      )}

      {/* Admin: action dropdown */}
      {isAdmin && order.status !== 'cancelled' && order.status !== 'completed' && (
        <div className="relative">
          <button
            disabled={loading}
            onClick={() => setOpen(o => !o)}
            className={`${btnBase} bg-white/4 text-white/50 border border-white/10 hover:text-white/80 hover:bg-white/8`}
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            Ações
            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-1.5 w-52 z-40 rounded-xl border border-white/8 bg-[#0a0f1a] shadow-2xl overflow-hidden">
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Alterar Status</p>
                </div>
                <div className="p-1.5">
                  {order.status === 'new' && (
                    <DropItem
                      icon={<Play className="w-3.5 h-3.5 text-amber-400" />}
                      label="Iniciar Pedido"
                      onClick={() => changeStatus('in_progress', 'Pedido iniciado')}
                    />
                  )}
                  {['in_progress', 'revision_requested'].includes(order.status) && (
                    <DropItem
                      icon={<Send className="w-3.5 h-3.5 text-purple-400" />}
                      label="Enviar Prévia"
                      onClick={() => changeStatus('awaiting_approval', 'Prévia enviada para aprovação')}
                    />
                  )}
                  {['in_progress', 'awaiting_approval', 'revision_requested'].includes(order.status) && (
                    <DropItem
                      icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                      label="Finalizar Pedido"
                      onClick={() => changeStatus('completed', 'Pedido finalizado pelo administrador')}
                    />
                  )}
                  <div className="my-1 h-px bg-white/6" />
                  <DropItem
                    icon={<XCircle className="w-3.5 h-3.5 text-red-400" />}
                    label="Cancelar Pedido"
                    onClick={() => changeStatus('cancelled', 'Pedido cancelado pelo administrador')}
                    danger
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Admin: reopen */}
      {isAdmin && ['cancelled', 'completed'].includes(order.status) && (
        <button
          disabled={loading}
          onClick={() => changeStatus('in_progress', 'Pedido reaberto')}
          className={`${btnBase} bg-white/4 text-white/50 border border-white/10 hover:text-white/80 hover:bg-white/8`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reabrir
        </button>
      )}
    </div>
  )
}

function DropItem({ icon, label, onClick, danger }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
        danger
          ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/8'
          : 'text-white/50 hover:text-white/90 hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
