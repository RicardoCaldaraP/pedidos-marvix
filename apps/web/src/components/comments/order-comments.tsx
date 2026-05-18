'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import type { Comment, Profile } from '@/types/database'
import { toast } from 'sonner'
import { Send, MessageSquare } from 'lucide-react'

interface OrderCommentsProps {
  orderId: string
  currentUserId: string
  currentProfile: Profile
  isAdmin: boolean
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function OrderComments({ orderId, currentUserId, currentProfile }: OrderCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadComments()

    const channel = supabase
      .channel(`comments:${orderId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `order_id=eq.${orderId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('comments')
              .select('*, profiles(id, full_name, role, avatar_url)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setComments(prev => [...prev, data as Comment])
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  async function loadComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(id, full_name, role, avatar_url)')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    setComments((data as Comment[]) ?? [])
    setLoading(false)
    setTimeout(() => bottomRef.current?.scrollIntoView(), 100)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)

    const { error } = await supabase.from('comments').insert({
      order_id: orderId,
      author_id: currentUserId,
      content: text.trim(),
    })

    if (error) {
      toast.error('Erro ao enviar comentário')
    } else {
      setText('')
      await supabase.from('order_history').insert({
        order_id: orderId,
        user_id: currentUserId,
        event_type: 'comment_added',
        description: `Comentário adicionado por ${currentProfile.full_name}`,
      })
    }
    setSubmitting(false)
  }

  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-3.5 h-3.5 text-white/25" />
        <h3 className="text-[11px] font-semibold text-white/35 uppercase tracking-[0.12em]">
          Comentários ({comments.length})
        </h3>
      </div>

      {/* Comments list */}
      <div className="space-y-4 max-h-96 overflow-y-auto mb-5 pr-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-7 h-7 rounded-lg bg-white/5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-white/5 rounded w-1/4" />
                  <div className="h-10 bg-white/5 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-7 h-7 text-white/10 mx-auto mb-2" />
            <p className="text-white/25 text-sm">Nenhum comentário ainda</p>
          </div>
        ) : (
          comments.map(comment => {
            const isMine = comment.author_id === currentUserId
            const profile = comment.profiles as Profile

            return (
              <div key={comment.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-[10px] font-semibold text-blue-400 shrink-0">
                  {initials(profile?.full_name ?? 'U')}
                </div>

                <div className={`flex-1 min-w-0 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-medium text-white/60">
                      {profile?.full_name?.split(' ')[0]}
                    </span>
                    {profile?.role === 'admin' && (
                      <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/12 text-blue-400 border border-blue-500/15">
                        Admin
                      </span>
                    )}
                    <span className="text-[11px] text-white/20">{formatRelativeTime(comment.created_at)}</span>
                  </div>
                  <div className={`rounded-xl px-3.5 py-2.5 text-sm max-w-[85%] ${
                    isMine
                      ? 'bg-blue-600/15 text-blue-100 border border-blue-500/15'
                      : 'bg-white/4 text-white/70 border border-white/6'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-xs">{comment.content}</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-[10px] font-semibold text-blue-400 shrink-0 mb-0.5">
          {initials(currentProfile.full_name)}
        </div>
        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escreva um comentário..."
            rows={1}
            className="w-full px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-white/20 bg-white/3 border border-white/7 rounded-xl outline-none resize-none transition-all focus:border-blue-500/40 focus:bg-white/5 focus:ring-2 focus:ring-blue-500/8 min-h-[40px] max-h-32"
            style={{ height: 'auto' }}
            onInput={e => {
              const t = e.currentTarget
              t.style.height = 'auto'
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e as unknown as React.FormEvent)
              }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="absolute right-2 bottom-2 w-7 h-7 rounded-lg bg-blue-600/80 hover:bg-blue-600 disabled:opacity-30 transition-all flex items-center justify-center"
          >
            {submitting ? (
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-3 h-3 text-white" />
            )}
          </button>
        </div>
      </form>
      <p className="text-[11px] text-white/15 mt-1.5 ml-9">Enter para enviar · Shift+Enter para nova linha</p>
    </div>
  )
}
