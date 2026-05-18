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

export type HistoryEventType =
  | 'created'
  | 'status_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'preview_sent'
  | 'approved'
  | 'revision_requested'
  | 'final_delivered'
  | 'cancelled'

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
  attachments?: OrderAttachment[]
  comments?: Comment[]
  history?: OrderHistory[]
  _count?: {
    comments: number
    attachments: number
  }
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

export interface Comment {
  id: string
  order_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: Profile
  attachments?: CommentAttachment[]
}

export interface CommentAttachment {
  id: string
  comment_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}

export interface OrderHistory {
  id: string
  order_id: string
  user_id: string
  event_type: HistoryEventType
  description: string
  metadata?: Record<string, unknown>
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

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'attachments' | 'comments' | 'history'>
        Update: Partial<Omit<Order, 'id' | 'created_at' | 'profiles' | 'attachments' | 'comments' | 'history'>>
      }
      order_attachments: {
        Row: OrderAttachment
        Insert: Omit<OrderAttachment, 'id' | 'created_at' | 'profiles'>
        Update: Partial<Omit<OrderAttachment, 'id' | 'created_at' | 'profiles'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'attachments'>
        Update: Partial<Omit<Comment, 'id' | 'created_at' | 'profiles' | 'attachments'>>
      }
      order_history: {
        Row: OrderHistory
        Insert: Omit<OrderHistory, 'id' | 'created_at' | 'profiles'>
        Update: never
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Pick<Notification, 'read'>>
      }
    }
  }
}
