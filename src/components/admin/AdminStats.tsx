import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useData, type Booking } from '../../context/DataContext'
import { STATUS_LABELS } from './bookingShared'
import {
  ChartBar, TrendUp, CalendarBlank, CurrencyRub, UsersThree, Trophy, CheckCircle, XCircle,
} from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

type PeriodKey = '7d' | '30d' | 'month' | 'all' | 'custom'

const PERIODS: { id: PeriodKey; label: string }[] = [
  { id: '7d', label: 'Ближайшие 7 дней' },
  { id: '30d', label: 'Ближайшие 30 дней' },
  { id: 'month', label: 'Этот месяц' },
  { id: 'all', label: 'Весь период' },
  { id: 'custom', label: 'Свой период' },
]

const STATUS_DOT: Record<Booking['status'], string> = {
  new: 'bg-blue-400',
  confirmed: 'bg-emerald-400',
  done: 'bg-green-400',
  cancelled: 'bg-red-400',
}

function pad(n: number) { return String(n).padStart(2, '0') }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU')
}

export default function AdminStats() {
  const { bookings, masters, services } = useData()
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const [customFrom, setCustomFrom] = useState(() => toDateStr(new Date(Date.now() - 29 * 86400000)))
  const [customTo, setCustomTo] = useState(() => toDateStr(new Date()))

  const { from, to, label } = useMemo(() => {
    const today = new Date()
    if (period === '7d') {
      const end = new Date(today); end.setDate(end.getDate() + 6)
      return { from: toDateStr(today), to: toDateStr(end), label: 'на ближайшие 7 дней' }
    }
    if (period === '30d') {
      const end = new Date(today); end.setDate(end.getDate() + 29)
      return { from: toDateStr(today), to: toDateStr(end), label: 'на ближайшие 30 дней' }
    }
    if (period === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      return { from: toDateStr(start), to: toDateStr(end), label: 'за этот календарный месяц' }
    }
    if (period === 'custom') {
      return { from: customFrom, to: customTo, label: `с ${customFrom} по ${customTo}` }
    }
    return { from: null as string | null, to: null as string | null, label: 'за всё время' }
  }, [period, customFrom, customTo])

  const inRange = useMemo(() => bookings.filter(b => {
    if (from && b.date < from) return false
    if (to && b.date > to) return false
    return true
  }), [bookings, from, to])

  function priceOf(b: Booking): number {
    const svc = services.find(s => s.id === b.serviceId)
    if (!svc) return 0
    if (b.variantName && svc.variants?.length) {
      const variant = svc.variants.find(v => v.name === b.variantName)
      if (variant?.priceFrom) return variant.priceFrom
    }
    return svc.priceFrom ?? 0
  }

  const totals = useMemo(() => {
    const byStatus: Record<Booking['status'], number> = { new: 0, confirmed: 0, done: 0, cancelled: 0 }
    let revenue = 0
    inRange.forEach(b => {
      byStatus[b.status]++
      if (b.status === 'done') revenue += priceOf(b)
    })
    return { total: inRange.length, byStatus, revenue }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange, services])

  const masterStats = useMemo(() => {
    return masters.map(m => {
      const mine = inRange.filter(b => b.masterId === m.id)
      const byStatus: Record<Booking['status'], number> = { new: 0, confirmed: 0, done: 0, cancelled: 0 }
      let revenue = 0
      const serviceCounts: Record<string, number> = {}
      mine.forEach(b => {
        byStatus[b.status]++
        if (b.status === 'done') revenue += priceOf(b)
        const label = b.variantName ? `${b.service} — ${b.variantName}` : b.service
        serviceCounts[label] = (serviceCounts[label] ?? 0) + 1
      })
      const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]
      return { master: m, total: mine.length, byStatus, revenue, topService }
    }).sort((a, b) => b.total - a.total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inRange, masters, services])

  const unassigned = inRange.filter(b => !b.masterId).length
  const maxTotal = Math.max(1, ...masterStats.map(s => s.total))

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1 flex items-center gap-2">
          <ChartBar size={20} weight="fill" className="text-[var(--color-accent)]" />
          Статистика
        </h2>
        <p className="text-sm text-zinc-500">Загруженность и результаты сотрудников {label}</p>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PERIODS.map(p => (
          <motion.button key={p.id} whileTap={{ scale: 0.95 }} onClick={() => setPeriod(p.id)}
            className={`relative overflow-hidden px-3.5 py-2 text-xs font-medium rounded-sm border transition-colors duration-150
              ${period === p.id ? 'text-white border-[var(--color-accent)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
            {period === p.id && (
              <motion.span layoutId="statsPeriodPill" className="absolute inset-0 bg-[var(--color-accent)] rounded-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            )}
            <span className="relative z-10">{p.label}</span>
          </motion.button>
        ))}
      </div>

      {period === 'custom' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-wrap items-end gap-3 mb-6 bg-zinc-800 border border-zinc-700 rounded-sm p-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">С</label>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 text-white outline-none focus:border-[var(--color-accent)] rounded-sm" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">По</label>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 text-white outline-none focus:border-[var(--color-accent)] rounded-sm" />
          </div>
        </motion.div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Всего записей', value: totals.total, Icon: CalendarBlank, color: 'text-white' },
          { label: 'Подтверждено', value: totals.byStatus.confirmed, Icon: TrendUp, color: 'text-emerald-400' },
          { label: 'Выполнено', value: totals.byStatus.done, Icon: CheckCircle, color: 'text-green-400' },
          { label: 'Отменено', value: totals.byStatus.cancelled, Icon: XCircle, color: 'text-red-400' },
        ].map(card => (
          <motion.div key={card.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            className="bg-zinc-800 border border-zinc-700 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2 text-zinc-500">
              <card.Icon size={14} />
              <span className="text-[11px] uppercase tracking-wide">{card.label}</span>
            </div>
            <div className={`text-2xl font-semibold ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-[var(--color-accent)]/15 to-transparent border border-[var(--color-accent)]/25 rounded-sm p-4 mb-8 flex items-center gap-3">
        <CurrencyRub size={22} className="text-[var(--color-accent-light)] shrink-0" />
        <div>
          <p className="text-xs text-zinc-400">Выручка по выполненным записям {label}</p>
          <p className="text-xl font-semibold text-white">{formatMoney(totals.revenue)} ₽</p>
        </div>
      </div>

      {/* Per-master breakdown */}
      <div className="flex items-center gap-2 mb-4">
        <UsersThree size={16} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">По сотрудникам</h3>
      </div>

      {masters.length === 0 ? (
        <p className="text-sm text-zinc-600">Мастера не добавлены.</p>
      ) : (
        <div className="space-y-3">
          {masterStats.map((s, i) => (
            <motion.div key={s.master.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: EASE_OUT }}
              className="bg-zinc-800 border border-zinc-700 rounded-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 sm:w-56 shrink-0">
                  <img
                    src={s.master.photo || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop'}
                    alt={s.master.name}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {i === 0 && s.total > 0 && <Trophy size={13} weight="fill" className="text-amber-400 shrink-0" />}
                      <p className="text-sm font-medium text-white truncate">{s.master.name}</p>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{s.master.role}</p>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-400">
                      {s.total} {s.total === 1 ? 'запись' : s.total >= 2 && s.total <= 4 ? 'записи' : 'записей'}
                    </span>
                    <span className="text-xs text-zinc-500">{formatMoney(s.revenue)} ₽ выручки</span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mb-2.5">
                    <motion.div
                      className="h-full bg-[var(--color-accent)] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.total / maxTotal) * 100}%` }}
                      transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.04 }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {(Object.keys(STATUS_LABELS) as Booking['status'][]).map(st => (
                      s.byStatus[st] > 0 && (
                        <span key={st} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[st]}`} />
                          {STATUS_LABELS[st]}: {s.byStatus[st]}
                        </span>
                      )
                    ))}
                    {s.topService && (
                      <span className="text-[11px] text-zinc-500">
                        · чаще всего: <span className="text-zinc-400">{s.topService[0]}</span> ({s.topService[1]})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {unassigned > 0 && (
            <p className="text-xs text-zinc-600 pt-1">
              Без указанного мастера {label}: {unassigned}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
