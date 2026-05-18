import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderCard } from '@/components/orders/order-card'
import type { Order, OrderStatus } from '@/types/database'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

const STATUS_OPTIONS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Novos' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'awaiting_approval', label: 'Aguardando' },
  { value: 'revision_requested', label: 'Alteração' },
  { value: 'completed', label: 'Finalizados' },
  { value: 'cancelled', label: 'Cancelados' },
]

interface SearchParams {
  status?: OrderStatus | 'all'
  q?: string
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  const isAdmin = profile?.role === 'admin'

  let query = supabase
    .from('orders')
    .select(`*, profiles(id, full_name, email, role)`)
    .order('created_at', { ascending: false })

  if (!isAdmin) query = query.eq('created_by', user.id)

  const activeStatus = params.status && params.status !== 'all' ? params.status : null
  if (activeStatus) query = query.eq('status', activeStatus)

  const { data: orders } = await query
  const allOrders = (orders as Order[]) ?? []

  const filtered = params.q
    ? allOrders.filter(o =>
        o.title.toLowerCase().includes(params.q!.toLowerCase()) ||
        o.description?.toLowerCase().includes(params.q!.toLowerCase())
      )
    : allOrders

  const activeFilter = params.status ?? 'all'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAdmin ? 'Todos os Pedidos' : 'Meus Pedidos'}
          </h1>
          <p className="text-white/30 text-sm mt-0.5">
            {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' && ` · filtrando por "${STATUS_OPTIONS.find(s => s.value === activeFilter)?.label}"`}
          </p>
        </div>
        <Link href="/dashboard/novo-pedido">
          <button
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #0077b6, #00b4d8)' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Pedido</span>
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
          <input
            type="text"
            name="q"
            placeholder="Buscar pedidos..."
            defaultValue={params.q}
            className="w-full pl-9 pr-4 h-9 rounded-xl border border-white/7 bg-white/3 text-white text-sm placeholder:text-white/20 outline-none transition-all focus:border-blue-500/40 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/10"
          />
        </form>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_OPTIONS.map(opt => (
            <Link
              key={opt.value}
              href={`/dashboard/pedidos${opt.value !== 'all' ? `?status=${opt.value}` : ''}`}
              className={`shrink-0 px-3 h-9 flex items-center rounded-xl text-xs font-medium transition-all ${
                activeFilter === opt.value
                  ? 'border text-[#48cae4]'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/4 border border-transparent'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/8">
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
            <SlidersHorizontal className="w-5 h-5 text-white/20" />
          </div>
          <h3 className="text-sm font-semibold text-white/40 mb-1">Nenhum pedido encontrado</h3>
          <p className="text-xs text-white/20 mb-5">Tente mudar os filtros ou criar um novo pedido.</p>
          <Link href="/dashboard/novo-pedido">
            <button className="h-8 px-4 rounded-lg text-xs font-semibold text-white transition-colors" style={{ background: 'linear-gradient(135deg, #0077b6, #00b4d8)' }}>
              + Criar Pedido
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((order, i) => (
            <div key={order.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <OrderCard order={order} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
