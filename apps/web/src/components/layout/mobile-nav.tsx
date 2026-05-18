'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, PlusCircle, Bell } from 'lucide-react'
import { toast } from 'sonner'

interface MobileNavProps {
  unreadCount?: number
  userId: string
}

export function MobileNav({ unreadCount = 0, userId }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [count, setCount] = useState(unreadCount)

  useEffect(() => { setCount(unreadCount) }, [unreadCount])

  useEffect(() => {
    const channel = supabase
      .channel(`mobile-notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setCount(prev => prev + 1)
          const n = payload.new as { title: string; message: string; order_id?: string }
          toast(n.title, {
            description: n.message,
            duration: 6000,
            action: n.order_id
              ? { label: 'Ver', onClick: () => router.push(`/dashboard/pedidos/${n.order_id}`) }
              : undefined,
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        async () => {
          const { count: fresh } = await supabase
            .from('notifications').select('*', { count: 'exact', head: true })
            .eq('user_id', userId).eq('read', false)
          setCount(fresh ?? 0)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const items = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Início', exact: true },
    { href: '/dashboard/pedidos', icon: FileText, label: 'Pedidos' },
    { href: '/dashboard/novo-pedido', icon: PlusCircle, label: 'Novo' },
    { href: '/dashboard/notificacoes', icon: Bell, label: 'Avisos', badge: count },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl px-2 pb-safe"
      style={{ background: 'rgba(1, 12, 23, 0.96)', borderTop: '1px solid rgb(0 180 216 / 0.1)' }}>
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-all',
                active ? 'text-[#48cae4]' : 'text-white/30'
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: '#0096c7' }}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
