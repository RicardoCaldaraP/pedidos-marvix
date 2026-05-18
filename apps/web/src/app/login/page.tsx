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
    <div className="min-h-screen flex overflow-hidden" style={{ background: '#010c17' }}>
      {/* Ocean background layers */}
      <div className="aurora-bg" />

      {/* Animated water caustics */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(ellipse 2px 2px at 20% 30%, #48cae4 0%, transparent 100%),
              radial-gradient(ellipse 1px 1px at 80% 70%, #00b4d8 0%, transparent 100%),
              radial-gradient(ellipse 3px 3px at 40% 80%, #0096c7 0%, transparent 100%),
              radial-gradient(ellipse 2px 2px at 60% 20%, #48cae4 0%, transparent 100%)`,
            backgroundSize: '120px 120px, 80px 80px, 200px 200px, 160px 160px',
          }}
        />
      </div>

      {/* ─── LEFT PANEL ─── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-14 grid-bg overflow-hidden">
        {/* Deep ocean gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#012a4a]/50 via-transparent to-[#023e8a]/20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#010c17] via-transparent to-transparent pointer-events-none" />

        {/* Underwater light rays */}
        <div className="absolute top-0 left-1/4 w-px h-full opacity-[0.06]"
          style={{ background: 'linear-gradient(to bottom, transparent, #48cae4 30%, transparent)' }} />
        <div className="absolute top-0 left-2/3 w-px h-full opacity-[0.04]"
          style={{ background: 'linear-gradient(to bottom, transparent, #00b4d8 50%, transparent)' }} />

        {/* Floating particles */}
        {[
          { size: 3, x: '15%', y: '25%', delay: 0 },
          { size: 2, x: '70%', y: '45%', delay: 1.5 },
          { size: 4, x: '45%', y: '65%', delay: 0.8 },
          { size: 2, x: '85%', y: '30%', delay: 2.2 },
          { size: 3, x: '30%', y: '80%', delay: 1.1 },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: p.size, height: p.size,
              left: p.x, top: p.y,
              background: '#48cae4',
              opacity: 0.35,
              animationDelay: `${p.delay}s`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <Image src="/logo/logo-branca.png" alt="Marvix" width={130} height={40} className="object-contain" />
        </motion.div>

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-lg"
        >
          {/* Big decorative letter */}
          <div className="text-[120px] font-black leading-none select-none mb-6"
            style={{ color: 'rgb(0 180 216 / 0.04)' }}>
            M
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Pedidos na medida,<br />
            <span className="text-gradient-ocean">entregas certeiras.</span>
          </h2>
          <p className="text-[#48cae4]/50 text-lg leading-relaxed">
            Gerencie todas as solicitações de arte em um único lugar —
            do anzol ao feed, sem enrolar a linha.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[
              { value: '🎣', label: 'Pesca & Lazer' },
              { value: '∞', label: 'Pedidos' },
              { value: 'RT', label: 'Tempo real' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
              >
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs mt-0.5" style={{ color: '#48cae4', opacity: 0.5 }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Wave decoration */}
          <div className="mt-12 opacity-[0.12]">
            <svg viewBox="0 0 400 40" className="w-full" fill="none">
              <path d="M0 20 Q50 5 100 20 Q150 35 200 20 Q250 5 300 20 Q350 35 400 20" stroke="#48cae4" strokeWidth="1.5" fill="none"/>
              <path d="M0 28 Q50 13 100 28 Q150 43 200 28 Q250 13 300 28 Q350 43 400 28" stroke="#00b4d8" strokeWidth="1" fill="none" opacity="0.6"/>
            </svg>
          </div>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative z-10 text-xs"
          style={{ color: '#48cae4', opacity: 0.3 }}
        >
          Marvix Pesca & Lazer · Sistema interno de pedidos
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
            <p className="text-sm" style={{ color: '#48cae4', opacity: 0.45 }}>Entre com suas credenciais para acessar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: '#48cae4', opacity: 0.5 }}>
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 rounded-xl px-4 text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{
                  background: 'rgb(0 30 60 / 0.5)',
                  border: '1px solid rgb(0 180 216 / 0.15)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgb(0 180 216 / 0.5)'
                  e.target.style.background = 'rgb(0 40 80 / 0.6)'
                  e.target.style.boxShadow = '0 0 0 3px rgb(0 180 216 / 0.08)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgb(0 180 216 / 0.15)'
                  e.target.style.background = 'rgb(0 30 60 / 0.5)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: '#48cae4', opacity: 0.5 }}>
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-11 rounded-xl px-4 text-sm text-white placeholder:text-white/20 outline-none transition-all"
                style={{
                  background: 'rgb(0 30 60 / 0.5)',
                  border: '1px solid rgb(0 180 216 / 0.15)',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgb(0 180 216 / 0.5)'
                  e.target.style.background = 'rgb(0 40 80 / 0.6)'
                  e.target.style.boxShadow = '0 0 0 3px rgb(0 180 216 / 0.08)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgb(0 180 216 / 0.15)'
                  e.target.style.background = 'rgb(0 30 60 / 0.5)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full h-11 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all mt-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #0077b6 0%, #0096c7 50%, #00b4d8 100%)' }}
            >
              <span className="absolute inset-0 bg-white/0 hover:bg-white/6 transition-colors" />
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
            <div className="flex-1 h-px" style={{ background: 'rgb(0 180 216 / 0.1)' }} />
            <span className="text-xs" style={{ color: '#48cae4', opacity: 0.25 }}>acesso restrito</span>
            <div className="flex-1 h-px" style={{ background: 'rgb(0 180 216 / 0.1)' }} />
          </div>

          {/* Info */}
          <div className="rounded-xl p-4" style={{ background: 'rgb(0 30 60 / 0.4)', border: '1px solid rgb(0 180 216 / 0.1)' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#48cae4', opacity: 0.4 }}>
              Sistema exclusivo para a Marvix Pesca & Lazer. Em caso de problemas com seu acesso, entre em contato com o administrador.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
