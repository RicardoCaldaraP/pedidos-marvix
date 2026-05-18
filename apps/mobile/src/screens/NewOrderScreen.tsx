import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { MaterialType, OrderPriority, Profile } from '../types'
import { MATERIAL_TYPE_CONFIG, PRIORITY_CONFIG } from '../types'

const MATERIAL_TYPES = Object.entries(MATERIAL_TYPE_CONFIG) as [MaterialType, { label: string; emoji: string }][]
const PRIORITIES = Object.entries(PRIORITY_CONFIG) as [OrderPriority, { label: string; color: string }][]

interface NewOrderScreenProps {
  currentProfile: Profile
  onBack: () => void
  onCreated: () => void
}

export function NewOrderScreen({ currentProfile, onBack, onCreated }: NewOrderScreenProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<OrderPriority>('normal')
  const [selectedTypes, setSelectedTypes] = useState<MaterialType[]>([])
  const [submitting, setSubmitting] = useState(false)

  function toggleType(type: MaterialType) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Atenção', 'O título é obrigatório')
      return
    }
    if (selectedTypes.length === 0) {
      Alert.alert('Atenção', 'Selecione pelo menos um tipo de material')
      return
    }

    setSubmitting(true)

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        material_types: selectedTypes,
        status: 'new',
        created_by: currentProfile.id,
      })
      .select()
      .single()

    if (error || !order) {
      Alert.alert('Erro', 'Não foi possível criar o pedido')
      setSubmitting(false)
      return
    }

    await supabase.from('order_history').insert({
      order_id: order.id,
      user_id: currentProfile.id,
      event_type: 'created',
      description: 'Pedido criado pelo cliente',
    })

    Alert.alert('Sucesso!', 'Pedido criado com sucesso', [
      { text: 'OK', onPress: onCreated }
    ])

    setSubmitting(false)
  }

  const isValid = title.trim() && selectedTypes.length > 0

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Back button */}
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>Novo Pedido</Text>
        <Text style={styles.pageSubtitle}>Preencha os detalhes do pedido</Text>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Post Instagram — Lançamento"
              placeholderTextColor="#475569"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Descreva o que precisa, referências, cores, textos..."
              placeholderTextColor="#475569"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Prioridade</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map(([value, config]) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.priorityBtn,
                    priority === value && { backgroundColor: config.color + '20', borderColor: config.color + '60' }
                  ]}
                  onPress={() => setPriority(value)}
                >
                  <Text style={[styles.priorityBtnText, { color: priority === value ? config.color : '#64748b' }]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Material types */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tipo de Material *</Text>
            <Text style={styles.sectionCount}>{selectedTypes.length} selecionado{selectedTypes.length !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.typesGrid}>
            {MATERIAL_TYPES.map(([value, config]) => {
              const selected = selectedTypes.includes(value)
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.typeBtn,
                    selected && styles.typeBtnSelected
                  ]}
                  onPress={() => toggleType(value)}
                >
                  <Text style={styles.typeEmoji}>{config.emoji}</Text>
                  <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                    {config.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Submit */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Criar Pedido</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060c1a' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  backButton: { marginBottom: 16 },
  backText: { color: '#60a5fa', fontSize: 15 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: 'white' },
  pageSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2, marginBottom: 20 },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 12, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  sectionCount: { fontSize: 12, color: '#60a5fa' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#cbd5e1', marginBottom: 6 },
  input: {
    height: 44, borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14, fontSize: 15, color: 'white',
  },
  textarea: { height: 90, paddingTop: 12 },
  priorityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  priorityBtnText: { fontSize: 13, fontWeight: '500' },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  typeBtnSelected: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  typeEmoji: { fontSize: 14 },
  typeLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  typeLabelSelected: { color: '#93c5fd' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
  submitBtn: {
    flex: 2, height: 48, borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },
})
