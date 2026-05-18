import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { OrderStatus, OrderPriority, MaterialType } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "d 'de' MMM, HH:mm", { locale: ptBR })
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  new: {
    label: 'Novo Pedido',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  awaiting_approval: {
    label: 'Aguardando Aprovação',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  revision_requested: {
    label: 'Alteração Solicitada',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
  completed: {
    label: 'Finalizado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
}

export const PRIORITY_CONFIG: Record<OrderPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-slate-400' },
  normal: { label: 'Normal', color: 'text-blue-400' },
  high: { label: 'Alta', color: 'text-amber-400' },
  urgent: { label: 'Urgente', color: 'text-red-400' },
}

export const MATERIAL_TYPE_CONFIG: Record<MaterialType, { label: string; icon: string }> = {
  feed: { label: 'Feed', icon: '🖼️' },
  story: { label: 'Story', icon: '📱' },
  banner: { label: 'Banner', icon: '🏳️' },
  video: { label: 'Vídeo', icon: '🎬' },
  carousel: { label: 'Carrossel', icon: '🎠' },
  thumbnail: { label: 'Thumbnail', icon: '🖼️' },
  other: { label: 'Outro', icon: '📄' },
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️'
  if (fileType === 'application/pdf') return '📄'
  if (fileType.startsWith('video/')) return '🎬'
  if (fileType.includes('photoshop') || fileType.includes('psd')) return '🎨'
  return '📎'
}

export function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/')
}
