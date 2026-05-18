'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, PlusCircle, Bell } from 'lucide-react'

interface MobileNavProps {
  unreadCount?: number
}

export function MobileNav({ unreadCount = 0 }: MobileNavProps) {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Início', exact: true },
    { href: '/dashboard/pedidos', icon: FileText, label: 'Pedidos' },
    { href: '/dashboard/novo-pedido', icon: PlusCircle, label: 'Novo' },
    { href: '/dashboard/notificacoes', icon: Bell, label: 'Avisos', badge: unreadCount },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-t border-white/8 px-2 pb-safe">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-all',
                active ? 'text-blue-400' : 'text-slate-500'
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
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
