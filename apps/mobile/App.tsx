import 'react-native-url-polyfill/auto'
import React, { useState, useEffect, useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, SafeAreaView, StyleSheet, Platform, Alert } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from './src/lib/supabase'
import { LoginScreen } from './src/screens/LoginScreen'
import { DashboardScreen } from './src/screens/DashboardScreen'
import { OrderDetailScreen } from './src/screens/OrderDetailScreen'
import { NewOrderScreen } from './src/screens/NewOrderScreen'
import type { Profile, Order } from './src/types'

// Mostra notificações mesmo com o app em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

type Screen = 'dashboard' | 'order-detail' | 'new-order'

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Marvix Pedidos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00b4d8',
      sound: 'default',
    })
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    // Listener: notificação recebida com app aberto
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification.request.content.title)
    })

    // Listener: usuário tocou na notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as { order_id?: string }
      if (data?.order_id) {
        // Navegar para o pedido (seria ideal com expo-router, mas funciona via state)
        setScreen('dashboard')
      }
    })

    return () => {
      subscription.unsubscribe()
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) {
      setProfile(data as Profile)
      // Registra token de push e salva no perfil
      try {
        const token = await registerForPushNotifications()
        if (token) {
          await supabase.from('profiles').update({ push_token: token }).eq('id', userId)
        }
      } catch (_) {}
    }
    setLoading(false)
  }

  // ── Realtime: recebe notificações via Supabase e dispara push local ──────
  useEffect(() => {
    if (!profile) return

    const channel = supabase
      .channel(`push:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        async (payload) => {
          const n = payload.new as { title: string; message: string; order_id?: string }
          await Notifications.scheduleNotificationAsync({
            content: {
              title: n.title,
              body: n.message,
              sound: 'default',
              data: { order_id: n.order_id },
              color: '#00b4d8',
            },
            trigger: null, // imediato
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00b4d8" size="large" />
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
            onOrderPress={(order) => { setSelectedOrder(order); setScreen('order-detail') }}
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
  container: { flex: 1, backgroundColor: '#010c17' },
  loading: { flex: 1, backgroundColor: '#010c17', alignItems: 'center', justifyContent: 'center' },
})
