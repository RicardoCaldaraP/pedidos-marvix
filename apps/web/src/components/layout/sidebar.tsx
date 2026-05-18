'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import {
  LayoutDashboard, FileText, PlusCircle, LogOut, Bell, ChevronRight
} from 'lucide-react'
import type { Profile } from '@/types/database'
import { toast } from 'sonner'

interface SidebarProps {
  profile: Profile
  unreadCount?: number
}

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/pedidos', icon: FileText, label: 'Pedidos' },
  { href: '/dashboard/novo-pedido', icon: PlusCircle, label: 'Novo Pedido' },
]

export function Sidebar({ profile, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [count, setCount] = useState(unreadCount)

  useEffect(() => {
    setCount(unreadCount)
  }, [unreadCount])

  // ── Realtime: atualiza badge e mostra toast ao receber notificação nova ──
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setCount(prev => prev + 1)
          const n = payload.new as { title: string; message: string; order_id?: string }
          toast(n.title, {
            description: n.message,
            duration: 6000,
            action: n.order_id
              ? {
                  label: 'Ver pedido',
                  onClick: () => router.push(`/dashboard/pedidos/${n.order_id}`),
                }
              : undefined,
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        async () => {
          // Recalcula quando alguma é marcada como lida
          const { count: fresh } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .eq('read', false)
          setCount(fresh ?? 0)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile.id])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    toast.success('Até logo!')
  }

  function initials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] flex flex-col z-40"
      style={{ background: 'rgba(1, 12, 23, 0.97)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgb(0 180 216 / 0.08)' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgb(0 180 216 / 0.08)' }}>
        <Link href="/dashboard">
          <Image src="/logo/logo-branca.png" alt="Marvix" width={100} height={30} className="object-contain" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {profile.role === 'admin' && (
          <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] px-3 pb-2 pt-1">
            Administração
          </p>
        )}

        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 group',
                active
                  ? 'text-[#48cae4]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/4'
              )}>
                <item.icon className="w-[15px] h-[15px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-50" />}
              </div>
            </Link>
          )
        })}

        {/* Notifications */}
        <Link href="/dashboard/notificacoes">
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150',
            pathname.startsWith('/dashboard/notificacoes')
              ? 'text-[#48cae4]'
              : 'text-white/40 hover:text-white/80 hover:bg-white/4'
          )}>
            <div className="relative">
              <Bell className="w-[15px] h-[15px] shrink-0" />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white leading-none"
                  style={{ background: '#0096c7' }}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </div>
            <span className="flex-1">Notificações</span>
            {count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgb(0 180 216 / 0.12)', color: '#48cae4' }}>
                {count}
              </span>
            )}
          </div>
        </Link>
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-3 space-y-0.5" style={{ borderTop: '1px solid rgb(0 180 216 / 0.08)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'rgb(0 30 60 / 0.4)', border: '1px solid rgb(0 180 216 / 0.1)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: 'rgb(0 150 199 / 0.2)', border: '1px solid rgb(0 180 216 / 0.2)', color: '#48cae4' }}>
            {initials(profile.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white/80 truncate">{profile.full_name}</p>
            <p className="text-[11px] text-white/25 capitalize">
              {profile.role === 'admin' ? 'Administrador' : 'Cliente'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium text-white/25 hover:text-red-400/80 hover:bg-red-500/5 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair da conta
        </button>
      </div>
    </aside>
  )
}
