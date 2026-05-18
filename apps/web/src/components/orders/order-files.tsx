'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatFileSize, isImageFile, getFileIcon } from '@/lib/utils'
import type { OrderAttachment } from '@/types/database'
import { toast } from 'sonner'
import { Upload, Download, X, Image as ImageIcon, Star, FileText } from 'lucide-react'

interface OrderFilesProps {
  orderId: string
  attachments: OrderAttachment[]
  isAdmin: boolean
  currentUserId: string
}

export function OrderFiles({ orderId, attachments: initialAttachments, isAdmin, currentUserId }: OrderFilesProps) {
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    const results: OrderAttachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()
      const filePath = `orders/${orderId}/${Date.now()}_${i}.${ext}`
      setUploadProgress(Math.round((i / files.length) * 70))

      const { error: uploadError } = await supabase.storage
        .from('attachments').upload(filePath, file, { upsert: true })

      if (uploadError) { toast.error(`Erro ao enviar ${file.name}`); continue }

      const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(filePath)

      const { data: attachment, error: dbError } = await supabase
        .from('order_attachments')
        .insert({ order_id: orderId, uploaded_by: currentUserId, file_name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size, is_preview: false, is_final: false })
        .select('*, profiles(id, full_name)').single()

      if (!dbError && attachment) results.push(attachment as OrderAttachment)
      setUploadProgress(Math.round(((i + 1) / files.length) * 100))
    }

    setAttachments(prev => [...results, ...prev])
    setUploading(false)
    setUploadProgress(0)
    if (results.length > 0) toast.success(`${results.length} arquivo${results.length > 1 ? 's' : ''} enviado${results.length > 1 ? 's' : ''}`)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function togglePreview(a: OrderAttachment) {
    const { error } = await supabase.from('order_attachments').update({ is_preview: !a.is_preview }).eq('id', a.id)
    if (!error) {
      setAttachments(prev => prev.map(x => x.id === a.id ? { ...x, is_preview: !x.is_preview } : x))
      toast.success(a.is_preview ? 'Removido das prévias' : 'Marcado como prévia')
    }
  }

  async function toggleFinal(a: OrderAttachment) {
    const { error } = await supabase.from('order_attachments').update({ is_final: !a.is_final }).eq('id', a.id)
    if (!error) {
      setAttachments(prev => prev.map(x => x.id === a.id ? { ...x, is_final: !x.is_final } : x))
      toast.success(a.is_final ? 'Removido dos finais' : 'Marcado como arquivo final')
    }
  }

  async function deleteAttachment(a: OrderAttachment) {
    const filePath = a.file_url.split('/attachments/')[1]
    const { error } = await supabase.from('order_attachments').delete().eq('id', a.id)
    if (!error) {
      await supabase.storage.from('attachments').remove([filePath])
      setAttachments(prev => prev.filter(x => x.id !== a.id))
      toast.success('Arquivo removido')
    }
  }

  const previews = attachments.filter(a => a.is_preview)
  const finals = attachments.filter(a => a.is_final)
  const others = attachments.filter(a => !a.is_preview && !a.is_final)

  return (
    <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[11px] font-semibold text-white/35 uppercase tracking-[0.12em]">
          Arquivos ({attachments.length})
        </h3>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => handleFileUpload(e.target.files)}
            accept="image/*,.pdf,.psd,.ai,.doc,.docx,.xls,.xlsx,.mp4,.mov"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-semibold text-white/40 border border-white/8 bg-white/3 hover:text-white/70 hover:bg-white/6 transition-all disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            Enviar
          </button>
        </div>
      </div>

      {uploading && (
        <div className="mb-4 space-y-1.5">
          <div className="flex justify-between text-[11px] text-white/30">
            <span>Enviando arquivos...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/8 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {attachments.length === 0 && !uploading && (
        <label
          className="flex flex-col items-center gap-2 py-8 border border-dashed border-white/8 rounded-xl cursor-pointer hover:border-blue-500/25 hover:bg-blue-500/3 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center">
            <Upload className="w-4 h-4 text-white/25" />
          </div>
          <p className="text-sm text-white/30">Clique para enviar arquivos</p>
          <p className="text-xs text-white/15">Imagens, PDFs, PSDs, vídeos</p>
        </label>
      )}

      {previews.length > 0 && (
        <FileSection title="Prévias" badge="preview" files={previews} isAdmin={isAdmin} currentUserId={currentUserId}
          onTogglePreview={togglePreview} onToggleFinal={toggleFinal} onDelete={deleteAttachment} onPreviewImage={setPreview} />
      )}

      {finals.length > 0 && (
        <FileSection title="Arquivos Finais" badge="final" files={finals} isAdmin={isAdmin} currentUserId={currentUserId}
          onTogglePreview={togglePreview} onToggleFinal={toggleFinal} onDelete={deleteAttachment} onPreviewImage={setPreview} />
      )}

      {others.length > 0 && (
        <FileSection title={previews.length + finals.length > 0 ? 'Referências' : undefined} files={others} isAdmin={isAdmin} currentUserId={currentUserId}
          onTogglePreview={togglePreview} onToggleFinal={toggleFinal} onDelete={deleteAttachment} onPreviewImage={setPreview} />
      )}

      {/* Image preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <button
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setPreview(null)}
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={preview}
            alt="Preview"
            className="max-w-full max-h-[88vh] rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

function FileSection({ title, badge, files, isAdmin, currentUserId, onTogglePreview, onToggleFinal, onDelete, onPreviewImage }: {
  title?: string
  badge?: 'preview' | 'final'
  files: OrderAttachment[]
  isAdmin: boolean
  currentUserId: string
  onTogglePreview: (a: OrderAttachment) => void
  onToggleFinal: (a: OrderAttachment) => void
  onDelete: (a: OrderAttachment) => void
  onPreviewImage: (url: string) => void
}) {
  return (
    <div className="mb-3">
      {title && (
        <div className="flex items-center gap-2 mb-2 mt-3">
          <p className="text-[11px] font-semibold text-white/25 uppercase tracking-wider">{title}</p>
          {badge === 'preview' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/15">Prévia</span>
          )}
          {badge === 'final' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">Final</span>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        {files.map(file => (
          <FileItem
            key={file.id}
            file={file}
            isAdmin={isAdmin}
            canDelete={isAdmin || file.uploaded_by === currentUserId}
            onTogglePreview={onTogglePreview}
            onToggleFinal={onToggleFinal}
            onDelete={onDelete}
            onPreviewImage={onPreviewImage}
          />
        ))}
      </div>
    </div>
  )
}

function FileItem({ file, isAdmin, canDelete, onTogglePreview, onToggleFinal, onDelete, onPreviewImage }: {
  file: OrderAttachment
  isAdmin: boolean
  canDelete: boolean
  onTogglePreview: (a: OrderAttachment) => void
  onToggleFinal: (a: OrderAttachment) => void
  onDelete: (a: OrderAttachment) => void
  onPreviewImage: (url: string) => void
}) {
  const isImage = isImageFile(file.file_type)

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/8 transition-all group">
      {isImage ? (
        <button
          className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-white/10"
          onClick={() => onPreviewImage(file.file_url)}
        >
          <img src={file.file_url} alt={file.file_name} className="w-full h-full object-cover" />
        </button>
      ) : (
        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0 text-base">
          {getFileIcon(file.file_type)}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 truncate font-medium">{file.file_name}</p>
        <p className="text-[11px] text-white/25">{formatFileSize(file.file_size)}</p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {isAdmin && (
          <>
            <button
              onClick={() => onTogglePreview(file)}
              title="Marcar como prévia"
              className={`p-1.5 rounded-lg transition-colors ${file.is_preview ? 'text-purple-400 bg-purple-500/10' : 'text-white/20 hover:text-purple-400 hover:bg-purple-500/10'}`}
            >
              <ImageIcon className="w-3 h-3" />
            </button>
            <button
              onClick={() => onToggleFinal(file)}
              title="Marcar como final"
              className={`p-1.5 rounded-lg transition-colors ${file.is_final ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/20 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
            >
              <Star className="w-3 h-3" />
            </button>
          </>
        )}
        <a
          href={file.file_url}
          download={file.file_name}
          target="_blank"
          rel="noopener noreferrer"
          title="Baixar"
          className="p-1.5 rounded-lg text-white/20 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
        >
          <Download className="w-3 h-3" />
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(file)}
            title="Remover"
            className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
