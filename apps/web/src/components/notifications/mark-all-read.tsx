'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function MarkAllReadButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function markAllRead() {
    setLoading(true)
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    toast.success('Todas marcadas como lidas')
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={markAllRead}
      disabled={loading}
      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white/40 border border-white/8 bg-white/3 hover:text-white/70 hover:bg-white/6 transition-all disabled:opacity-50"
    >
      {loading ? (
        <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <CheckCircle className="w-3 h-3" />
      )}
      Marcar todas como lidas
    </button>
  )
}
