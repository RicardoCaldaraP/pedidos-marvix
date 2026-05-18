'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Credenciais inválidas')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#04080f' }}>
      {/* Aurora background */}
      <div className="aurora-bg" />

      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-14 grid-bg">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-transparent to-cyan-950/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04080f] via-transparent to-transparent pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <Image src="/logo/logo-branca.png" alt="Marvix" width={130} height={40} className="object-contain" />
        </motion.div>

        {/* Center quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-lg"
        >
          {/* Big decorative number */}
          <div className="text-[120px] font-black leading-none text-white/[0.03] select-none mb-6">M</div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Pedidos organizados,<br />
            <span className="text-gradient-blue">resultados</span> entregues.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Gerencie todas as solicitações de design em um único lugar. Sem WhatsApp, sem confusão.
          </p>

          {/* Stats row */}
          <div className="flex gap-8 mt-10">
            {[
              { value: '100%', label: 'Organizado' },
              { value: 'RT', label: 'Tempo real' },
              { value: '∞', label: 'Pedidos' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 text-xs text-slate-600"
        >
          Marvix Pedidos · Sistema interno
        </motion.div>
      </div>

      {/* ─── RIGHT PANEL ─── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:hidden mb-10"
        >
          <Image src="/logo/logo-branca.png" alt="Marvix" width={110} height={34} className="object-contain" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
            <p className="text-slate-500 text-sm">Entre com suas credenciais para acessar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 rounded-xl border border-white/8 bg-white/4 px-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/50 focus:bg-white/6 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-11 rounded-xl border border-white/8 bg-white/4 px-4 text-sm text-white placeholder:text-slate-600 outline-none transition-all focus:border-blue-500/50 focus:bg-white/6 focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-11 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all mt-2 disabled:opacity-60 group"
              style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1d4ed8 100%)' }}
            >
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-xs text-slate-600">acesso restrito</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Info */}
          <div className="rounded-xl border border-white/6 bg-white/2 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Este sistema é exclusivo para uso interno da Marvix. Em caso de problemas com seu acesso, entre em contato com o administrador.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
