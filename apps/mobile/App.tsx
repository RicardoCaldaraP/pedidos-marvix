import 'react-native-url-polyfill/auto'
import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native'
import { supabase } from './src/lib/supabase'
import { LoginScreen } from './src/screens/LoginScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { OrderDetailScreen } from './src/screens/OrderDetailScreen'
import { NewOrderScreen } from './src/screens/NewOrderScreen'
import type { Profile, Order } from './src/types'

type Screen = 'dashboard' | 'order-detail' | 'new-order'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) setProfile(data as Profile)
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#3b82f6" size="large" />
        <StatusBar style="light" />
      </View>
    )
  }

  if (!profile) {
    return (
      <>
        <StatusBar style="light" />
        <SafeAreaView style={styles.container}>
          <LoginScreen onLogin={() => {}} />
        </SafeAreaView>
      </>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        {screen === 'dashboard' && (
          <DashboardScreen
            profile={profile}
            onOrderPress={(order) => {
              setSelectedOrder(order)
              setScreen('order-detail')
            }}
            onNewOrder={() => setScreen('new-order')}
          />
        )}

        {screen === 'order-detail' && selectedOrder && (
          <OrderDetailScreen
            order={selectedOrder}
            currentProfile={profile}
            onBack={() => setScreen('dashboard')}
            onStatusChanged={() => {}}
          />
        )}

        {screen === 'new-order' && (
          <NewOrderScreen
            currentProfile={profile}
            onBack={() => setScreen('dashboard')}
            onCreated={() => setScreen('dashboard')}
          />
        )}
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060c1a',
  },
  loading: {
    flex: 1,
    backgroundColor: '#060c1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
