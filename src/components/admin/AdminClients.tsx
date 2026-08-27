import { useState, useEffect, useRef, useMemo } from 'react'
import * as api from '../../lib/api'
import type { ClientRecord } from '../../lib/api'
import { MagnifyingGlass, Warning, Cake, Phone, CalendarBlank } from '@phosphor-icons/react'

const BIRTHDAY_REMIND_DAYS = 3
const COLS = 'lg:grid-cols-[minmax(0,1.2fr)_9rem_8.5rem_11rem_minmax(0,0.8fr)_minmax(0,1.4fr)]'

function formatVisit(date: string, time: string) {
  const day = new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return `${day}, ${time.slice(0, 5)}`
}

function clientCountLabel(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} клиент`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} клиента`
  return `${n} клиентов`
}

function parseLocalDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function daysUntilBirthday(iso: string, now = new Date()) {
  const parsed = parseLocalDate(iso)
  if (!parsed) return null
  const month = parsed.getMonth()
  const day = parsed.getDate()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const safeDate = (year: number) => {
    const next = new Date(year, month, day)
    if (month === 1 && day === 29 && next.getMonth() !== 1) return new Date(year, 1, 28)
    return next
  }

  let next = safeDate(today.getFullYear())
  if (next < today) next = safeDate(today.getFullYear() + 1)
  return Math.round((next.getTime() - today.getTime()) / 86_400_000)
}

function formatBirthday(iso: string) {
  const d = parseLocalDate(iso)
  if (!d) return ''
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function remindLabel(days: number) {
  if (days === 0) return 'Сегодня'
  if (days === 1) return 'Завтра'
  return `Через ${days} дня`
}

function remindBadge(days: number) {
  if (days === 0) return 'bg-rose-700 text-white'
  if (days === 1) return 'bg-orange-700 text-white'
  return 'bg-[#8b6b4a] text-white'
}

export default function AdminClients() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    setLoading(true)
    api.fetchClients()
      .then(setClients)
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
    return () => {
      Object.values(timers.current).forEach(clearTimeout)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q)
      || c.phone.toLowerCase().includes(q)
      || c.phoneDigits.includes(q.replace(/\D/g, ''))
      || c.master.toLowerCase().includes(q),
    )
  }, [clients, query])

  const upcomingBirthdays = useMemo(() => {
    return clients
      .map(c => {
        if (!c.birthday) return null
        const days = daysUntilBirthday(c.birthday)
        if (days == null || days < 0 || days > BIRTHDAY_REMIND_DAYS) return null
        return { ...c, days }
      })
      .filter((c): c is ClientRecord & { days: number } => c != null)
      .sort((a, b) => a.days - b.days || a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' }))
  }, [clients])

  const persist = (key: string, phoneDigits: string, fn: () => Promise<void>) => {
    if (!phoneDigits) return
    clearTimeout(timers.current[key])
    timers.current[key] = setTimeout(async () => {
      setSavingKey(key)
      try {
        await fn()
      } catch {
        setError('Не удалось сохранить')
      } finally {
        setSavingKey(null)
      }
    }, 400)
  }

  const onNotes = (phoneDigits: string, notes: string) => {
    setClients(prev => prev.map(c => c.phoneDigits === phoneDigits ? { ...c, notes } : c))
    persist(`n:${phoneDigits}`, phoneDigits, () => api.saveClientNotes(phoneDigits, notes))
  }

  const onBirthday = (phoneDigits: string, birthday: string) => {
    setClients(prev => prev.map(c => c.phoneDigits === phoneDigits ? { ...c, birthday } : c))
    persist(`b:${phoneDigits}`, phoneDigits, () => api.saveClientBirthday(phoneDigits, birthday))
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-white mb-1">База клиентов</h2>
          <p className="text-sm text-zinc-500">
            {loading ? 'Загрузка…' : clientCountLabel(filtered.length)}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по имени, телефону, мастеру"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm"
          />
        </div>
      </div>

      {upcomingBirthdays.length > 0 && (
        <div className="mb-5 rounded-sm overflow-hidden bg-stone-200">
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#8b6b4a]">
            <Cake size={18} weight="fill" className="text-white shrink-0" />
            <p className="text-sm font-medium text-white">Дни рождения в ближайшие 3 дня</p>
          </div>
          <ul className="divide-y divide-stone-300">
            {upcomingBirthdays.map(c => (
              <li key={c.phoneDigits || c.phone + c.name}
                className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-stone-800">
                <span className={`px-2 py-1 text-xs font-semibold uppercase tracking-wide rounded-sm ${remindBadge(c.days)}`}>
                  {remindLabel(c.days)}
                </span>
                <span className="text-base font-medium text-stone-900">{c.name || 'Клиент'}</span>
                <span className="flex items-center gap-1.5 text-sm text-stone-600">
                  <CalendarBlank size={14} className="shrink-0" />
                  {formatBirthday(c.birthday)}
                </span>
                {c.phone && (
                  <a href={`tel:${c.phoneDigits ? '+' + c.phoneDigits : c.phone}`}
                    className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900">
                    <Phone size={14} className="shrink-0" />
                    {c.phone}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-sm text-sm text-red-300">
          <Warning size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-zinc-500">Загрузка…</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500 border border-zinc-700 rounded-sm bg-zinc-800/40">
          {query ? 'Никого не нашли' : 'Пока нет клиентов из записей'}
        </div>
      ) : (
        <div className="border border-zinc-700 rounded-sm overflow-hidden">
          <div className={`hidden lg:grid ${COLS} gap-3 px-4 py-2 bg-zinc-800 text-[10px] font-medium uppercase tracking-wider text-zinc-500`}>
            <span>ФИО</span>
            <span>Телефон</span>
            <span>Дата рождения</span>
            <span>Последняя запись</span>
            <span>Мастер</span>
            <span>Заметки{savingKey ? ' · сохранение…' : ''}</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {filtered.map(c => {
              const days = c.birthday ? daysUntilBirthday(c.birthday) : null
              const soon = days != null && days >= 0 && days <= BIRTHDAY_REMIND_DAYS
              return (
                <div key={c.phoneDigits || c.phone + c.name}
                  className={`grid grid-cols-1 ${COLS} gap-2 lg:gap-3 px-4 py-3 ${soon ? 'bg-zinc-800' : 'bg-zinc-900 hover:bg-zinc-800'}`}>
                  <div>
                    <p className="lg:hidden text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">ФИО</p>
                    <p className="text-sm text-white font-medium truncate">{c.name || '—'}</p>
                  </div>
                  <div>
                    <p className="lg:hidden text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Телефон</p>
                    <a href={`tel:${c.phoneDigits ? '+' + c.phoneDigits : c.phone}`} className="text-sm text-zinc-300 hover:text-white">
                      {c.phone || '—'}
                    </a>
                  </div>
                  <div>
                    <p className="lg:hidden text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Дата рождения</p>
                    <input
                      type="date"
                      value={c.birthday || ''}
                      onChange={e => onBirthday(c.phoneDigits, e.target.value)}
                      disabled={!c.phoneDigits}
                      className="w-full px-2 py-1.5 text-sm bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-[var(--color-accent)] rounded-sm disabled:opacity-50 [color-scheme:dark]"
                    />
                    {soon && (
                      <p className="mt-1 text-[11px] text-amber-300">{remindLabel(days!)}</p>
                    )}
                  </div>
                  <div>
                    <p className="lg:hidden text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Последняя запись</p>
                    <p className="text-sm text-zinc-300">{c.lastDate ? formatVisit(c.lastDate, c.lastTime) : '—'}</p>
                  </div>
                  <div>
                    <p className="lg:hidden text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Мастер</p>
                    <p className="text-sm text-zinc-300 truncate">{c.master || '—'}</p>
                  </div>
                  <div>
                    <p className="lg:hidden text-[10px] uppercase tracking-wider text-zinc-600 mb-0.5">Заметки</p>
                    <textarea
                      value={c.notes}
                      onChange={e => onNotes(c.phoneDigits, e.target.value)}
                      disabled={!c.phoneDigits}
                      placeholder={c.phoneDigits ? 'Заметка о клиенте' : 'Нужен телефон, чтобы сохранить заметку'}
                      rows={2}
                      className="w-full px-2.5 py-1.5 text-sm bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm resize-y min-h-[2.5rem] disabled:opacity-50"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
