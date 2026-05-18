import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Order, Profile } from '@/types/database'
import { STATUS_CONFIG, PRIORITY_CONFIG, formatRelativeTime, MATERIAL_TYPE_CONFIG } from '@/lib/utils'
import { Plus, ArrowUpRight, Clock, CheckCircle, Layers, Zap, TrendingUp, MoreHorizontal } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('orders')
    .select('*, profiles(id, full_name, email, role)')
    .order('created_at', { ascending: false })
  if (!isAdmin) query = query.eq('created_by', user.id)

  const { data: orders } = await query.limit(50)
  const all = (orders as Order[]) ?? []

  const stats = {
    total: all.length,
    new: all.filter(o => o.status === 'new').length,
    inProgress: all.filter(o => o.status === 'in_progress').length,
    awaiting: all.filter(o => o.status === 'awaiting_approval').length,
    completed: all.filter(o => o.status === 'completed').length,
    urgent: all.filter(o => o.priority === 'urgent' && !['completed', 'cancelled'].includes(o.status)).length,
  }

  const recent = all.slice(0, 6)
  const urgent = all.filter(o => o.priority === 'urgent' && !['completed', 'cancelled'].includes(o.status))

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── HERO HEADER ─── */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{ border: '1px solid rgb(0 180 216 / 0.12)', background: 'linear-gradient(135deg, rgb(0 40 80 / 0.35) 0%, rgb(0 20 40 / 0.15) 60%, transparent 100%)' }}>
        {/* Underwater light orb */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgb(0 180 216 / 0.08) 0%, transparent 70%)' }} />
        {/* Wave decoration bottom */}
        <div className="absolute bottom-0 left-0 right-0 opacity-[0.07]">
          <svg viewBox="0 0 800 30" className="w-full" fill="none" preserveAspectRatio="none">
            <path d="M0 15 Q100 5 200 15 Q300 25 400 15 Q500 5 600 15 Q700 25 800 15 L800 30 L0 30Z" fill="#48cae4"/>
          </svg>
        </div>
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: '#48cae4', opacity: 0.6 }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <h1 className="text-3xl font-bold text-white mb-1">
                Olá, {profile?.full_name?.split(' ')[0]} 🎣
              </h1>
              <p className="text-white/40 text-sm">
                {isAdmin
                  ? `${stats.total} pedidos no sistema · ${stats.inProgress} em andamento`
                  : `Você tem ${stats.total} pedido${stats.total !== 1 ? 's' : ''} registrado${stats.total !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <Link href="/dashboard/novo-pedido">
              <button className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #0077b6, #00b4d8)' }}>
                <Plus className="w-4 h-4" />
                Novo Pedido
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── STATS GRID ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Layers, color: '#00b4d8', glow: 'rgb(0 180 216 / 0.12)' },
          { label: 'Em Andamento', value: stats.inProgress, icon: Clock, color: '#f4a261', glow: 'rgb(244 162 97 / 0.12)' },
          { label: 'Aguardando', value: stats.awaiting, icon: TrendingUp, color: '#c084fc', glow: 'rgb(192 132 252 / 0.12)' },
          { label: 'Finalizados', value: stats.completed, icon: CheckCircle, color: '#06d6a0', glow: 'rgb(6 214 160 / 0.12)' },
        ].map((s, i) => (
          <div key={s.label}
            className="relative overflow-hidden rounded-2xl p-5 animate-fade-up"
            style={{
              animationDelay: `${i * 0.07}s`,
              background: `radial-gradient(ellipse at top left, ${s.glow} 0%, transparent 60%)`,
              border: `1px solid ${s.color}18`,
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-[11px] text-white/20">↑</span>
            </div>
            <div className="text-3xl font-black text-white mb-1">{s.value}</div>
            <div className="text-xs text-white/35 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ─── URGENT BANNER ─── */}
      {urgent.length > 0 && (
        <div className="rounded-2xl border border-[#f4a261]/15 p-4" style={{ background: 'rgb(244 162 97 / 0.05)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#f4a261]" />
            <span className="text-xs font-semibold text-[#f4a261] uppercase tracking-wider">
              {urgent.length} pedido{urgent.length > 1 ? 's' : ''} urgente{urgent.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {urgent.map(o => (
              <Link key={o.id} href={`/dashboard/pedidos/${o.id}`}>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/4 transition-colors cursor-pointer">
                  <span className="text-sm text-white/80 truncate">{o.title}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/30 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── RECENT ORDERS ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-[0.1em]">
            Pedidos Recentes
          </h2>
          <Link href="/dashboard/pedidos"
            className="text-xs flex items-center gap-1 transition-opacity opacity-50 hover:opacity-90"
            style={{ color: '#00b4d8' }}
          >
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyOrders isAdmin={isAdmin} />
        ) : (
          <div className="space-y-2">
            {recent.map((order, i) => (
              <OrderRow key={order.id} order={order} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ─── STATUS BREAKDOWN (admin) ─── */}
      {isAdmin && (
        <div>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-[0.1em] mb-4">
            Por Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.entries(STATUS_CONFIG) as [Order['status'], typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([status, cfg]) => {
              const count = all.filter(o => o.status === status).length
              const pct = all.length > 0 ? Math.round((count / all.length) * 100) : 0
              return (
                <Link key={status} href={`/dashboard/pedidos?status=${status}`}>
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/8 transition-all cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.color.replace('text-', 'bg-')}`} />
                      <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/25">{pct}%</span>
                      <span className="text-sm font-bold text-white/80">{count}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function OrderRow({ order, index }: { order: Order; index: number }) {
  const statusCfg = STATUS_CONFIG[order.status]
  const priorityCfg = PRIORITY_CONFIG[order.priority]

  return (
    <Link href={`/dashboard/pedidos/${order.id}`}>
      <div
        className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/4 hover:border-white/8 transition-all cursor-pointer group animate-fade-up"
        style={{ animationDelay: `${index * 0.04}s` }}
      >
        {/* Status bar */}
        <div className={`w-0.5 h-8 rounded-full shrink-0 ${statusCfg.color.replace('text-', 'bg-')}`} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-white/85 truncate group-hover:text-white transition-colors">
              {order.title}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/30">
            {order.material_types?.slice(0, 2).map(t => (
              <span key={t}>{MATERIAL_TYPE_CONFIG[t].label}</span>
            ))}
            <span>·</span>
            <span>{formatRelativeTime(order.created_at)}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
            {statusCfg.label}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
        </div>
      </div>
    </Link>
  )
}

function EmptyOrders({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/8">
      <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
        <Layers className="w-5 h-5 text-white/20" />
      </div>
      <h3 className="text-sm font-semibold text-white/40 mb-1">Nenhum pedido ainda</h3>
      <p className="text-xs text-white/20 mb-5">
        {isAdmin ? 'Aguardando os clientes criarem pedidos.' : 'Comece criando seu primeiro pedido.'}
      </p>
      {!isAdmin && (
        <Link href="/dashboard/novo-pedido">
          <button className="h-8 px-4 rounded-lg text-xs font-semibold text-white transition-colors" style={{ background: 'linear-gradient(135deg, #0077b6, #00b4d8)' }}>
            + Criar Pedido
          </button>
        </Link>
      )}
    </div>
  )
}
