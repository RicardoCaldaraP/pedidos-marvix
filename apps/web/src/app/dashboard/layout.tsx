import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar profile={profile as Profile} unreadCount={unreadCount ?? 0} />
      </div>

      {/* Main content */}
      <main className="md:pl-60 pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNav unreadCount={unreadCount ?? 0} />
      </div>
    </div>
  )
}
