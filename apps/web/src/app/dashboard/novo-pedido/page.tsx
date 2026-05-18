'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MATERIAL_TYPE_CONFIG, PRIORITY_CONFIG } from '@/lib/utils'
import type { MaterialType, OrderPriority } from '@/types/database'
import { toast } from 'sonner'
import { ArrowLeft, Upload, X, FileText, Check } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const MATERIAL_TYPES = Object.entries(MATERIAL_TYPE_CONFIG) as [MaterialType, { label: string; icon: string }][]
const PRIORITIES = Object.entries(PRIORITY_CONFIG) as [OrderPriority, { label: string; color: string }][]

export default function NewOrderPage() {
  const router = useRouter()
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('normal')
  const [selectedTypes, setSelectedTypes] = useState<MaterialType[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  function toggleType(type: MaterialType) {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || selectedTypes.length === 0) {
      toast.error(!title.trim() ? 'Título obrigatório' : 'Selecione pelo menos um tipo')
      return
    }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: order, error } = await supabase.from('orders')
      .insert({ title: title.trim(), description: description.trim() || null, deadline: deadline || null, priority, material_types: selectedTypes, status: 'new', created_by: user.id })
      .select().single()

    if (error || !order) { toast.error('Erro ao criar pedido'); setSubmitting(false); return }

    await supabase.from('order_history').insert({ order_id: order.id, user_id: user.id, event_type: 'created', description: 'Pedido criado' })

    if (files.length > 0) {
      setUploading(true)
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const filePath = `orders/${order.id}/${Date.now()}_${i}.${file.name.split('.').pop()}`
        setUploadPct(Math.round(((i + 0.5) / files.length) * 100))
        const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file)
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath)
          await supabase.from('order_attachments').insert({ order_id: order.id, uploaded_by: user.id, file_name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size, is_preview: false, is_final: false })
        }
        setUploadPct(Math.round(((i + 1) / files.length) * 100))
      }
    }

    toast.success('Pedido criado com sucesso!')
    router.push(`/dashboard/pedidos/${order.id}`)
  }

  const isValid = title.trim() && selectedTypes.length > 0

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-5">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-white">Novo Pedido</h1>
        <p className="text-white/35 text-sm mt-1">Preencha os detalhes para enviar sua solicitação</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic */}
        <Section title="Informações">
          <Field label="Título *">
            <input
              value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Ex: Posts para o lançamento do produto"
              className="input-field"
            />
          </Field>
          <Field label="Descrição detalhada">
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o que você precisa, referências de estilo, cores, textos importantes..."
              rows={4}
              className="input-field resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prioridade">
              <div className="flex gap-2">
                {PRIORITIES.map(([v, c]) => (
                  <button key={v} type="button" onClick={() => setPriority(v)}
                    className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition-all ${priority === v ? 'text-white' : 'border-white/6 bg-white/2 text-white/30 hover:text-white/60'}`}
                    style={priority === v ? { background: `${c.color.replace('text-', '').includes('-') ? '#1d4ed8' : '#1d4ed8'}20`, borderColor: `${c.color.replace('text-', '').includes('-') ? '#60a5fa' : '#60a5fa'}30` } : {}}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Prazo">
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="input-field" />
            </Field>
          </div>
        </Section>

        {/* Types */}
        <Section title={`Tipo de Material * — ${selectedTypes.length} selecionado${selectedTypes.length !== 1 ? 's' : ''}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MATERIAL_TYPES.map(([v, c]) => {
              const sel = selectedTypes.includes(v)
              return (
                <button key={v} type="button" onClick={() => toggleType(v)}
                  className={`relative flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${sel ? 'border-blue-500/30 bg-blue-500/8 text-blue-300' : 'border-white/6 bg-white/2 text-white/35 hover:border-white/12 hover:text-white/60'}`}
                >
                  {sel && <Check className="absolute top-2 right-2 w-3 h-3 text-blue-400" />}
                  <span className="text-xl">{c.icon}</span>
                  <span className="text-[11px] font-semibold">{c.label}</span>
                </button>
              )
            })}
          </div>
        </Section>

        {/* Files */}
        <Section title="Referências e Arquivos">
          <label className="flex flex-col items-center gap-2 py-8 border border-dashed border-white/8 rounded-xl cursor-pointer hover:border-blue-500/25 hover:bg-blue-500/3 transition-all">
            <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
              <Upload className="w-4 h-4 text-white/30" />
            </div>
            <p className="text-sm text-white/35">Arraste arquivos ou clique para selecionar</p>
            <p className="text-xs text-white/20">Imagens, PDFs, PSDs, vídeos</p>
            <input type="file" multiple className="hidden" onChange={e => e.target.files && setFiles(p => [...p, ...Array.from(e.target.files!)])}
              accept="image/*,.pdf,.psd,.ai,.doc,.docx,.mp4,.mov" />
          </label>

          {files.length > 0 && (
            <div className="space-y-2 mt-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/3 border border-white/5">
                  <FileText className="w-4 h-4 text-white/30 shrink-0" />
                  <span className="flex-1 text-sm text-white/60 truncate">{f.name}</span>
                  <span className="text-xs text-white/25">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))}
                    className="p-1 text-white/20 hover:text-red-400/70 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-white/30">
                <span>Enviando arquivos...</span><span>{uploadPct}%</span>
              </div>
              <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            </div>
          )}
        </Section>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href="/dashboard" className="flex-1">
            <button type="button" className="w-full h-10 rounded-xl border border-white/8 text-sm font-medium text-white/40 hover:text-white/70 hover:border-white/15 transition-all">
              Cancelar
            </button>
          </Link>
          <button type="submit" disabled={!isValid || submitting || uploading}
            className="flex-[2] h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Criando...
              </span>
            ) : 'Criar Pedido'}
          </button>
        </div>
      </form>

      <style>{`
        .input-field {
          width: 100%; height: 40px; padding: 0 14px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; color: white; font-size: 14px; outline: none; transition: all 0.15s;
        }
        textarea.input-field { height: auto; padding: 12px 14px; }
        .input-field::placeholder { color: rgba(255,255,255,0.2); }
        .input-field:focus { border-color: rgba(59,130,246,0.4); background: rgba(255,255,255,0.05); box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        input[type="date"].input-field::-webkit-calendar-picker-indicator { filter: invert(0.3); }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5 space-y-4">
      <h2 className="text-[11px] font-semibold text-white/35 uppercase tracking-[0.12em]">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/40">{label}</label>
      {children}
    </div>
  )
}
