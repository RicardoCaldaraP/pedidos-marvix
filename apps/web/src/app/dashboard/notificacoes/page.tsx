import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatRelativeTime } from '@/lib/utils'
import type { Notification } from '@/types/database'
import { Bell, CheckCircle, MessageSquare, FileText, AlertCircle } from 'lucide-react'
import { MarkAllReadButton } from '@/components/notifications/mark-all-read'
import Link from 'next/link'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  status_changed: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  comment_added: { icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  new_order: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  approved: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  revision_requested: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  attachment_added: { icon: FileText, color: 'text-white/40', bg: 'bg-white/5' },
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allNotifications = (notifications as Notification[]) ?? []
  const unreadCount = allNotifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notificações</h1>
          <p className="text-white/30 text-sm mt-0.5">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''}`
              : 'Tudo em dia'
            }
          </p>
        </div>
        {unreadCount > 0 && <MarkAllReadButton userId={user.id} />}
      </div>

      {allNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/8">
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
            <Bell className="w-5 h-5 text-white/20" />
          </div>
          <h3 className="text-sm font-semibold text-white/40 mb-1">Sem notificações</h3>
          <p className="text-xs text-white/20">Você receberá notificações sobre seus pedidos aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allNotifications.map((notification, i) => {
            const config = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.status_changed
            const Icon = config.icon

            return (
              <div
                key={notification.id}
                className={`flex gap-4 p-4 rounded-2xl border transition-all animate-fade-up ${
                  !notification.read
                    ? 'bg-blue-500/4 border-blue-500/12'
                    : 'bg-white/[0.02] border-white/5'
                }`}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-white/60'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-[11px] text-white/20">{formatRelativeTime(notification.created_at)}</p>
                    {notification.order_id && (
                      <Link
                        href={`/dashboard/pedidos/${notification.order_id}`}
                        className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors"
                      >
                        Ver pedido →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
