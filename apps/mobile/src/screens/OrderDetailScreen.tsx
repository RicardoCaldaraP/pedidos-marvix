import React, { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Order, Comment, Profile, OrderAttachment, OrderStatus } from '../types'
import { STATUS_CONFIG } from '../types'

interface OrderDetailScreenProps {
  order: Order
  currentProfile: Profile
  onBack: () => void
  onStatusChanged: () => void
}

export function OrderDetailScreen({ order: initialOrder, currentProfile, onBack, onStatusChanged }: OrderDetailScreenProps) {
  const [order, setOrder] = useState(initialOrder)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<OrderAttachment[]>([])
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  const isAdmin = currentProfile.role === 'admin'
  const isOwner = order.created_by === currentProfile.id
  const statusConf = STATUS_CONFIG[order.status]

  useEffect(() => { loadData() }, [order.id])

  async function loadData() {
    const [commentsRes, attachmentsRes] = await Promise.all([
      supabase
        .from('comments')
        .select('*, profiles(id, full_name, role)')
        .eq('order_id', order.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('order_attachments')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false }),
    ])

    setComments((commentsRes.data as Comment[]) ?? [])
    setAttachments((attachmentsRes.data as OrderAttachment[]) ?? [])
    setLoading(false)
  }

  async function sendComment() {
    if (!commentText.trim()) return
    setSubmitting(true)

    const { data } = await supabase
      .from('comments')
      .insert({
        order_id: order.id,
        author_id: currentProfile.id,
        content: commentText.trim(),
      })
      .select('*, profiles(id, full_name, role)')
      .single()

    if (data) {
      setComments(prev => [...prev, data as Comment])
      setCommentText('')
    }

    setSubmitting(false)
  }

  async function changeStatus(newStatus: OrderStatus, message: string) {
    setStatusLoading(true)

    await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id)

    await supabase.from('order_history').insert({
      order_id: order.id,
      user_id: currentProfile.id,
      event_type: 'status_changed',
      description: message,
    })

    setOrder(prev => ({ ...prev, status: newStatus }))
    setStatusLoading(false)
    onStatusChanged()
    Alert.alert('Sucesso', message)
  }

  function handleApprove() {
    Alert.alert('Aprovar Prévia', 'Confirmar aprovação?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Aprovar', onPress: () => changeStatus('completed', 'Prévia aprovada — pedido finalizado!') },
    ])
  }

  function handleRevision() {
    Alert.alert('Solicitar Alteração', 'Confirmar solicitação de alteração?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Solicitar', onPress: () => changeStatus('revision_requested', 'Alteração solicitada pelo cliente') },
    ])
  }

  function handleAdminStatus(newStatus: OrderStatus, label: string) {
    Alert.alert(label, `Confirmar: "${label}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: () => changeStatus(newStatus, label) },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Back button */}
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        {/* Order header */}
        <View style={styles.orderCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusConf.bg, borderColor: statusConf.color + '40' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusConf.color }]} />
            <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
          </View>

          <Text style={styles.orderTitle}>{order.title}</Text>

          {order.description && (
            <Text style={styles.orderDesc}>{order.description}</Text>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Criado em</Text>
            <Text style={styles.metaValue}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</Text>
          </View>

          {order.deadline && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Prazo</Text>
              <Text style={[styles.metaValue, { color: '#fbbf24' }]}>{new Date(order.deadline).toLocaleDateString('pt-BR')}</Text>
            </View>
          )}
        </View>

        {/* Action buttons */}
        {!isAdmin && isOwner && order.status === 'awaiting_approval' && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.approveBtn]}
              onPress={handleApprove}
              disabled={statusLoading}
            >
              <Text style={styles.actionBtnText}>✓ Aprovar Prévia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.revisionBtn]}
              onPress={handleRevision}
              disabled={statusLoading}
            >
              <Text style={[styles.actionBtnText, { color: '#fbbf24' }]}>↩ Pedir Alteração</Text>
            </TouchableOpacity>
          </View>
        )}

        {isAdmin && !['cancelled', 'completed'].includes(order.status) && (
          <View style={styles.adminActions}>
            <Text style={styles.adminActionsTitle}>Ações Admin</Text>
            <View style={styles.adminActionRow}>
              {order.status === 'new' && (
                <TouchableOpacity
                  style={[styles.adminBtn, { borderColor: '#f59e0b40' }]}
                  onPress={() => handleAdminStatus('in_progress', 'Pedido iniciado')}
                >
                  <Text style={[styles.adminBtnText, { color: '#f59e0b' }]}>▶ Iniciar</Text>
                </TouchableOpacity>
              )}
              {['in_progress', 'revision_requested'].includes(order.status) && (
                <TouchableOpacity
                  style={[styles.adminBtn, { borderColor: '#c084fc40' }]}
                  onPress={() => handleAdminStatus('awaiting_approval', 'Prévia enviada para aprovação')}
                >
                  <Text style={[styles.adminBtnText, { color: '#c084fc' }]}>↑ Enviar Prévia</Text>
                </TouchableOpacity>
              )}
              {['in_progress', 'awaiting_approval', 'revision_requested'].includes(order.status) && (
                <TouchableOpacity
                  style={[styles.adminBtn, { borderColor: '#34d39940' }]}
                  onPress={() => handleAdminStatus('completed', 'Pedido finalizado')}
                >
                  <Text style={[styles.adminBtnText, { color: '#34d399' }]}>✓ Finalizar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.adminBtn, { borderColor: '#f8717140' }]}
                onPress={() => handleAdminStatus('cancelled', 'Pedido cancelado')}
              >
                <Text style={[styles.adminBtnText, { color: '#f87171' }]}>✕ Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Arquivos ({attachments.length})</Text>
            {attachments.slice(0, 5).map(att => (
              <View key={att.id} style={styles.attachmentItem}>
                <Text style={styles.attachmentIcon}>
                  {att.file_type.startsWith('image/') ? '🖼️' : att.file_type === 'application/pdf' ? '📄' : '📎'}
                </Text>
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>{att.file_name}</Text>
                  <Text style={styles.attachmentSize}>
                    {(att.file_size / 1024).toFixed(0)} KB
                    {att.is_preview && ' · Prévia'}
                    {att.is_final && ' · Final'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentários ({comments.length})</Text>

          {loading ? (
            <ActivityIndicator color="#3b82f6" style={{ marginVertical: 20 }} />
          ) : comments.length === 0 ? (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>Nenhum comentário ainda</Text>
            </View>
          ) : (
            comments.map(comment => {
              const isMine = comment.author_id === currentProfile.id
              const profile = comment.profiles as Profile

              return (
                <View key={comment.id} style={[styles.comment, isMine && styles.commentMine]}>
                  <Text style={styles.commentAuthor}>{profile?.full_name?.split(' ')[0]}</Text>
                  <View style={[styles.commentBubble, isMine && styles.commentBubbleMine]}>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                  <Text style={styles.commentTime}>
                    {new Date(comment.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Comment input */}
      <View style={styles.commentInput}>
        <TextInput
          style={styles.commentField}
          placeholder="Escreva um comentário..."
          placeholderTextColor="#475569"
          value={commentText}
          onChangeText={setCommentText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!commentText.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={sendComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060c1a' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  backText: { color: '#60a5fa', fontSize: 15 },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderTitle: { fontSize: 18, fontWeight: '700', color: 'white', marginBottom: 8 },
  orderDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaLabel: { fontSize: 13, color: '#475569' },
  metaValue: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  approveBtn: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(52,211,153,0.4)' },
  revisionBtn: { backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(251,191,36,0.4)' },
  actionBtnText: { color: '#34d399', fontWeight: '600', fontSize: 14 },
  adminActions: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  adminActionsTitle: { fontSize: 12, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  adminActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  adminBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.03)',
  },
  adminBtnText: { fontSize: 13, fontWeight: '600' },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 12, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  attachmentItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  attachmentIcon: { fontSize: 20 },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 14, color: 'white' },
  attachmentSize: { fontSize: 12, color: '#475569', marginTop: 1 },
  emptyComments: { paddingVertical: 20, alignItems: 'center' },
  emptyCommentsText: { fontSize: 14, color: '#475569' },
  comment: { marginBottom: 12 },
  commentMine: { alignItems: 'flex-end' },
  commentAuthor: { fontSize: 12, color: '#475569', marginBottom: 3 },
  commentBubble: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    padding: 12,
    maxWidth: '85%',
  },
  commentBubbleMine: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
  },
  commentText: { fontSize: 14, color: '#e2e8f0', lineHeight: 20 },
  commentTime: { fontSize: 11, color: '#334155', marginTop: 3 },
  commentInput: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#060c1a',
  },
  commentField: {
    flex: 1,
    minHeight: 40,
    maxHeight: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: 'white',
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { color: 'white', fontSize: 20, fontWeight: '700' },
})
