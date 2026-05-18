import React, { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator
} from 'react-native'
import { supabase } from '../lib/supabase'
import type { Order, Profile } from '../types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../types'

interface DashboardScreenProps {
  profile: Profile
  onOrderPress: (order: Order) => void
  onNewOrder: () => void
}

export function DashboardScreen({ profile, onOrderPress, onNewOrder }: DashboardScreenProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const isAdmin = profile.role === 'admin'

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    let query = supabase
      .from('orders')
      .select('*, profiles(id, full_name, role)')
      .order('created_at', { ascending: false })
      .limit(30)

    if (!isAdmin) {
      query = query.eq('created_by', profile.id)
    }

    const { data } = await query
    setOrders((data as Order[]) ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  function onRefresh() {
    setRefreshing(true)
    loadOrders()
  }

  const stats = {
    total: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    inProgress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
    urgent: orders.filter(o => o.priority === 'urgent' && !['completed', 'cancelled'].includes(o.status)).length,
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>
                  Olá, {profile.full_name.split(' ')[0]} 👋
                </Text>
                <Text style={styles.subtitle}>
                  {isAdmin ? 'Visão geral dos pedidos' : 'Seus pedidos'}
                </Text>
              </View>
              <TouchableOpacity style={styles.newButton} onPress={onNewOrder}>
                <Text style={styles.newButtonText}>+ Novo</Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard label="Total" value={stats.total} color="#3b82f6" />
              <StatCard label="Andamento" value={stats.inProgress} color="#f59e0b" />
              <StatCard label="Finalizados" value={stats.completed} color="#10b981" />
              {stats.urgent > 0 && (
                <StatCard label="Urgentes" value={stats.urgent} color="#ef4444" />
              )}
            </View>

            <Text style={styles.sectionTitle}>
              {orders.length === 0 ? '' : `Pedidos (${orders.length})`}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => onOrderPress(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhum pedido</Text>
            <Text style={styles.emptyText}>
              {isAdmin ? 'Aguardando pedidos dos clientes' : 'Crie seu primeiro pedido'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '30' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const statusConf = STATUS_CONFIG[order.status]
  const priorityConf = PRIORITY_CONFIG[order.priority]

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle} numberOfLines={1}>{order.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusConf.bg, borderColor: statusConf.color + '40' }]}>
          <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
        </View>
      </View>

      {order.description && (
        <Text style={styles.orderDesc} numberOfLines={2}>{order.description}</Text>
      )}

      <View style={styles.orderMeta}>
        <Text style={[styles.priorityText, { color: priorityConf.color }]}>
          {priorityConf.label}
        </Text>
        <Text style={styles.dateText}>
          {new Date(order.created_at).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060c1a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#060c1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  newButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  newButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  orderCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 10,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  orderTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 18,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#475569',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
})
