import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { OrderComments } from '@/components/comments/order-comments'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { OrderFiles } from '@/components/orders/order-files'
import { OrderActions } from '@/components/orders/order-actions'
import type { Order, Profile } from '@/types/database'
import { formatDate, MATERIAL_TYPE_CONFIG, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils'
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: order } = await supabase
    .from('orders')
    .select(`*, profiles (id, full_name, email, role, avatar_url)`)
    .eq('id', id)
    .single()

  if (!order) notFound()

  const isAdmin = profile?.role === 'admin'
  const isOwner = order.created_by === user.id

  if (!isAdmin && !isOwner) redirect('/dashboard')

  const { data: attachments } = await supabase
    .from('order_attachments')
    .select('*, profiles(id, full_name)')
    .eq('order_id', id)
    .order('created_at', { ascending: false })

  const { data: history } = await supabase
    .from('order_history')
    .select('*, profiles(id, full_name)')
    .eq('order_id', id)
    .order('created_at', { ascending: true })

  const typedOrder = {
    ...order,
    attachments: attachments ?? [],
    history: history ?? [],
  } as Order

  const statusCfg = STATUS_CONFIG[order.status as Order['status']]
  const priorityCfg = PRIORITY_CONFIG[order.priority as Order['priority']]

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Back */}
      <Link
        href="/dashboard/pedidos"
        className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar aos pedidos
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
              <span className={`text-[11px] font-medium ${priorityCfg.color}`}>
                {priorityCfg.label}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white leading-snug">{order.title}</h1>
            {order.description && (
              <p className="text-white/40 mt-2 leading-relaxed text-sm">{order.description}</p>
            )}

            {/* Material types */}
            {(order.material_types as Order['material_types'])?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(order.material_types as Order['material_types']).map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white/4 border border-white/6 text-white/40"
                  >
                    <span className="text-[10px]">{MATERIAL_TYPE_CONFIG[type].icon}</span>
                    {MATERIAL_TYPE_CONFIG[type].label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <OrderActions order={typedOrder} isAdmin={isAdmin} currentUserId={user.id} />
        </div>

        {/* Metadata */}
        <div className="mt-5 pt-5 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <MetaItem icon={User} label="Criado por" value={(order.profiles as Profile)?.full_name ?? 'Desconhecido'} />
          <MetaItem icon={Calendar} label="Data" value={formatDate(order.created_at)} />
          {order.deadline && (
            <MetaItem icon={Clock} label="Prazo" value={formatDate(order.deadline)} highlight />
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: files + comments */}
        <div className="lg:col-span-2 space-y-5">
          <OrderFiles
            orderId={id}
            attachments={typedOrder.attachments ?? []}
            isAdmin={isAdmin}
            currentUserId={user.id}
          />
          <OrderComments
            orderId={id}
            currentUserId={user.id}
            currentProfile={profile as Profile}
            isAdmin={isAdmin}
          />
        </div>

        {/* Right: timeline */}
        <div>
          <OrderTimeline history={typedOrder.history ?? []} />
        </div>
      </div>
    </div>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[11px] text-white/25 mb-1 flex items-center gap-1 uppercase tracking-wider">
        <Icon className="w-3 h-3" />
        {label}
      </p>
      <p className={`text-sm font-medium ${highlight ? 'text-amber-400' : 'text-white/80'}`}>{value}</p>
    </div>
  )
}
