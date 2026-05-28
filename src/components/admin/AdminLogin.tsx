import { useState } from 'react'
import { Eye, EyeSlash, Lock } from '@phosphor-icons/react'
import Logo from '../Logo'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123'

interface AdminLoginProps {
  onLogin: () => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', '1')
      onLogin()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-10">
          <Logo size="md" dark />
        </div>
        <div className="bg-zinc-900 p-8 rounded-sm border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={20} className="text-[var(--color-accent)]" weight="light" />
            <h1 className="text-white font-medium">Панель управления</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">Пароль</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false) }}
                  placeholder="••••••••"
                  autoFocus
                  className={`w-full px-4 py-3 pr-10 text-sm bg-zinc-800 text-white placeholder:text-zinc-600 border outline-none focus:border-[var(--color-accent)] transition-colors rounded-sm
                    ${error ? 'border-red-500' : 'border-zinc-700'}`}
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {show ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="text-xs text-red-400 mt-1.5">Неверный пароль</p>}
            </div>
            <button type="submit"
              className="w-full py-3 bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-light)] active:scale-[0.99] transition-all duration-200 rounded-sm">
              Войти
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
