import { useState } from 'react'
import { motion } from 'motion/react'
import { Eye, EyeSlash, Lock, User } from '@phosphor-icons/react'
import Logo from '../Logo'
import * as api from '../../lib/api'
import { setSession, type AdminUser } from '../../lib/auth'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

interface AdminLoginProps {
  onLogin: (user: AdminUser) => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const { token, user } = await api.login(username.trim(), password)
      setSession(token, user)
      onLogin(user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный логин или пароль')
      setPassword('')
      setShakeKey(k => k + 1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glow — keeps the screen from feeling flat */}
      <div className="absolute w-[36rem] h-[36rem] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,107,74,0.16) 0%, transparent 70%)', top: '-10%', left: '50%', transform: 'translateX(-50%)' }} />

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <motion.div className="flex justify-center mb-10"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}>
          <Logo size="md" dark />
        </motion.div>
        <motion.div
          key={shakeKey}
          animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="bg-zinc-900 p-8 rounded-sm border border-zinc-800 shadow-2xl shadow-black/40"
        >
          <div className="flex items-center gap-3 mb-6">
            <Lock size={20} className="text-[var(--color-accent)]" weight="light" />
            <h1 className="text-white font-medium">Панель управления</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Логин</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(null) }}
                  placeholder="admin"
                  autoFocus
                  autoComplete="username"
                  className={`w-full pl-9 pr-4 py-3 text-sm bg-zinc-800 text-white placeholder:text-zinc-600 border outline-none focus:border-[var(--color-accent)] transition-colors duration-200 rounded-sm
                    ${error ? 'border-red-500' : 'border-zinc-700'}`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Пароль</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-10 text-sm bg-zinc-800 text-white placeholder:text-zinc-600 border outline-none focus:border-[var(--color-accent)] transition-colors duration-200 rounded-sm
                    ${error ? 'border-red-500' : 'border-zinc-700'}`}
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {show ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 mt-1.5">{error}</motion.p>
              )}
            </div>
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-3 bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-light)] disabled:opacity-60 transition-colors duration-200 rounded-sm">
              {loading ? 'Входим…' : 'Войти'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  )
}
