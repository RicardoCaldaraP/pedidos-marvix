export type UserRole = 'admin' | 'client'

export type OrderStatus =
  | 'new'
  | 'in_progress'
  | 'awaiting_approval'
  | 'revision_requested'
  | 'completed'
  | 'cancelled'

export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent'

export type MaterialType =
  | 'feed'
  | 'story'
  | 'banner'
  | 'video'
  | 'carousel'
  | 'thumbnail'
  | 'other'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  title: string
  description: string
  status: OrderStatus
  priority: OrderPriority
  material_types: MaterialType[]
  deadline?: string
  created_by: string
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Comment {
  id: string
  order_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface OrderAttachment {
  id: string
  order_id: string
  uploaded_by: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  is_preview: boolean
  is_final: boolean
  created_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  order_id?: string
  read: boolean
  created_at: string
}

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'Novo Pedido', color: '#60a5fa', bg: '#1d4ed820' },
  in_progress: { label: 'Em Andamento', color: '#fbbf24', bg: '#d9770620' },
  awaiting_approval: { label: 'Aguardando Aprovação', color: '#c084fc', bg: '#9333ea20' },
  revision_requested: { label: 'Alteração Solicitada', color: '#fb923c', bg: '#ea580c20' },
  completed: { label: 'Finalizado', color: '#34d399', bg: '#059669' + '20' },
  cancelled: { label: 'Cancelado', color: '#f87171', bg: '#dc262620' },
}

export const PRIORITY_CONFIG: Record<OrderPriority, { label: string; color: string }> = {
  low: { label: 'Baixa', color: '#64748b' },
  normal: { label: 'Normal', color: '#60a5fa' },
  high: { label: 'Alta', color: '#fbbf24' },
  urgent: { label: 'Urgente', color: '#f87171' },
}

export const MATERIAL_TYPE_CONFIG: Record<MaterialType, { label: string; emoji: string }> = {
  feed: { label: 'Feed', emoji: '🖼️' },
  story: { label: 'Story', emoji: '📱' },
  banner: { label: 'Banner', emoji: '🏳️' },
  video: { label: 'Vídeo', emoji: '🎬' },
  carousel: { label: 'Carrossel', emoji: '🎠' },
  thumbnail: { label: 'Thumbnail', emoji: '🖼️' },
  other: { label: 'Outro', emoji: '📄' },
}
