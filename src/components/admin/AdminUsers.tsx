import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import * as api from '../../lib/api'
import { useData } from '../../context/DataContext'
import type { AdminUser, AdminPermissions } from '../../lib/auth'
import {
  Plus, Trash, X, Check, ShieldCheck, User, Warning, Scissors,
} from '@phosphor-icons/react'

const inputCls = "w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors"
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const formMotion = {
  initial: { opacity: 0, height: 0, y: -8 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE_OUT },
}

const PERMISSION_LABELS: { key: keyof AdminPermissions; label: string }[] = [
  { key: 'bookings',      label: 'Заявки' },
  { key: 'masters',       label: 'Мастера' },
  { key: 'schedule',      label: 'График' },
  { key: 'services',      label: 'Услуги' },
  { key: 'vacancies',     label: 'Вакансии' },
  { key: 'testimonials',  label: 'Отзывы' },
  { key: 'content',       label: 'Контент' },
  { key: 'notifications', label: 'Уведомления' },
]

const emptyPermissions: AdminPermissions = {
  bookings: true, masters: true, schedule: true,
  services: false, vacancies: false, testimonials: false, content: false, notifications: false,
}

interface FormState {
  username: string
  password: string
  role: 'owner' | 'staff' | 'master'
  permissions: AdminPermissions
  masterId: string | null
}

function UserForm({
  initial, isNew, onSave, onCancel, saving,
}: {
  initial: FormState
  isNew: boolean
  onSave: (f: FormState) => void
  onCancel: () => void
  saving: boolean
}) {
  const { masters } = useData()
  const [form, setForm] = useState<FormState>(initial)
  const valid = form.username.trim().length > 0 && (!isNew || form.password.length >= 6)
    && (form.role !== 'master' || !!form.masterId)

  const togglePerm = (key: keyof AdminPermissions) =>
    setForm(f => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }))

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Логин *</label>
          <input value={form.username} disabled={!isNew}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            placeholder="username" className={`${inputCls} ${!isNew ? 'opacity-60' : ''}`} />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">
            {isNew ? 'Пароль *' : 'Новый пароль'}
          </label>
          <input type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder={isNew ? 'минимум 6 символов' : 'оставьте пустым, если не меняете'} className={inputCls} />
        </div>
      </div>

      <div>
        <label className="block text-xs text-zinc-400 mb-2">Роль</label>
        <div className="flex flex-wrap gap-2">
          {(['staff', 'owner', 'master'] as const).map(r => (
            <button key={r} type="button" onClick={() => setForm(f => ({
              ...f,
              role: r,
              permissions: r === 'master' ? emptyPermissions : f.permissions,
            }))}
              className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors
                ${form.role === r
                  ? 'bg-[var(--color-accent)]/15 border-[var(--color-accent)] text-[var(--color-accent-light)]'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'}`}>
              {r === 'owner' ? 'Владелец (полный доступ)' : r === 'master' ? 'Мастер (личный кабинет)' : 'Сотрудник'}
            </button>
          ))}
        </div>
      </div>

      {form.role === 'master' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Мастер *</label>
          <select value={form.masterId ?? ''} onChange={e => setForm(f => ({ ...f, masterId: e.target.value || null }))}
            className={inputCls}>
            <option value="">Выберите мастера…</option>
            {masters.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-zinc-500">
            Этот аккаунт увидит только свои заявки (телефоны клиентов скрыты) и свой график работы.
          </p>
        </div>
      )}

      {form.role === 'staff' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-2">Права доступа</label>
          <div className="flex flex-wrap gap-2">
            {PERMISSION_LABELS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => togglePerm(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors
                  ${form.permissions[key]
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}>
                {form.permissions[key] && <Check size={12} weight="bold" />}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => valid && !saving && onSave(form)} disabled={!valid || saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] text-white text-xs font-medium rounded-sm hover:bg-[var(--color-accent-light)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Check size={14} weight="bold" />{saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button onClick={onCancel} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 text-zinc-300 text-xs font-medium rounded-sm hover:bg-zinc-600 transition-colors">
          <X size={14} />Отмена
        </button>
      </div>
    </div>
  )
}

export default function AdminUsers({ currentUser }: { currentUser: AdminUser }) {
  const { masters } = useData()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.fetchAdminUsers()
      .then(setUsers)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (f: FormState) => {
    setSaving(true)
    setError(null)
    try {
      const created = await api.createAdminUser({
        username: f.username.trim(), password: f.password, role: f.role, permissions: f.permissions,
        masterId: f.role === 'master' ? f.masterId : null,
      })
      setUsers(prev => [...prev, created])
      setAdding(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string, f: FormState) => {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.updateAdminUser(id, {
        role: f.role, permissions: f.permissions,
        masterId: f.role === 'master' ? f.masterId : null,
        ...(f.password ? { password: f.password } : {}),
      })
      setUsers(prev => prev.map(u => u.id === id ? updated : u))
      setEditingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (u: AdminUser) => {
    setError(null)
    try {
      const updated = await api.updateAdminUser(u.id, { active: !u.active })
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить пользователя? Он потеряет доступ к панели.')) return
    setError(null)
    try {
      await api.deleteAdminUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Пользователи</h2>
          <p className="text-sm text-zinc-500">Доступ сотрудников к панели управления</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setAdding(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-colors">
          <Plus size={16} weight="bold" />Добавить пользователя
        </motion.button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-sm text-sm text-red-300">
          <Warning size={16} className="shrink-0 mt-0.5" />
          {error}
        </motion.div>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.div key="add-form" style={{ overflow: 'hidden' }} {...formMotion}>
              <UserForm
                isNew
                initial={{ username: '', password: '', role: 'staff', permissions: emptyPermissions, masterId: null }}
                onSave={handleCreate}
                onCancel={() => setAdding(false)}
                saving={saving}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">Загрузка…</div>
        )}

        {!loading && users.length === 0 && !adding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldCheck size={40} weight="thin" className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">Пользователей пока нет</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {users.map((u, i) => (
            <motion.div key={u.id} layout="position"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: EASE_OUT }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {editingId === u.id ? (
                  <motion.div key="edit" style={{ overflow: 'hidden' }} {...formMotion}>
                    <UserForm
                      isNew={false}
                      initial={{ username: u.username, password: '', role: u.role, permissions: u.permissions, masterId: u.masterId }}
                      onSave={f => handleUpdate(u.id, f)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="view" whileHover={{ y: -1 }}
                    onClick={() => { setEditingId(u.id); setAdding(false) }}
                    className={`flex items-start justify-between bg-zinc-800 border border-zinc-700 rounded-sm px-5 py-4 gap-4 transition-colors hover:border-zinc-600 cursor-pointer ${!u.active ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/15 flex items-center justify-center text-[var(--color-accent-light)] shrink-0 mt-0.5">
                        <User size={16} weight="light" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-medium text-white text-sm">{u.username}</span>
                          {u.id === currentUser.id && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-400 rounded-sm">Вы</span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium
                            ${u.role === 'owner' ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent-light)]' : u.role === 'master' ? 'bg-sky-500/15 text-sky-300' : 'bg-zinc-700 text-zinc-300'}`}>
                            {u.role === 'owner' ? 'Владелец' : u.role === 'master' ? 'Мастер' : 'Сотрудник'}
                          </span>
                          {!u.active && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-red-500/15 text-red-300 rounded-sm">Отключён</span>
                          )}
                        </div>
                        {u.role === 'master' && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <Scissors size={12} className="text-zinc-500" />
                            {masters.find(m => m.id === u.masterId)?.name ?? 'Мастер не выбран'}
                          </div>
                        )}
                        {u.role === 'staff' && (
                          <div className="flex flex-wrap gap-1.5">
                            {PERMISSION_LABELS.filter(p => u.permissions[p.key]).map(p => (
                              <span key={p.key} className="text-[11px] px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded-sm border border-zinc-700">
                                {p.label}
                              </span>
                            ))}
                            {PERMISSION_LABELS.every(p => !u.permissions[p.key]) && (
                              <span className="text-[11px] text-zinc-600">Нет прав</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {u.id !== currentUser.id && (
                        <>
                          <button onClick={() => handleToggleActive(u)}
                            className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-sm transition-colors">
                            {u.active ? 'Отключить' : 'Включить'}
                          </button>
                          <button onClick={() => handleDelete(u.id)}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-sm transition-colors">
                            <Trash size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
