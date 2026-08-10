import { useState, useCallback } from 'react'
import { Plus, Trash, FloppyDisk, CheckCircle, WarningCircle, CaretDown, CaretUp, Info } from '@phosphor-icons/react'
import { useData } from '../../context/DataContext'
import * as api from '../../lib/api'
import type { ScheduleDay, DayOff } from '../../lib/api'

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const DAYS_FULL  = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

const DEFAULT_SCHEDULE: ScheduleDay[] = DAYS_FULL.map((_, i) => ({
  dayOfWeek: i, startTime: '10:00', endTime: '19:00', active: i < 6,
}))

type Toast = { type: 'success' | 'error'; message: string } | null

// per-master data cache
type MasterData = {
  schedule: ScheduleDay[]
  daysOff: DayOff[]
  // serviceId → Set of dayOfWeek numbers the master does this service
  // empty Set = no restriction (available all working days)
  serviceDays: Record<string, Set<number>>
  loaded: boolean
}
type Cache = Record<string, MasterData>

function emptyData(): MasterData {
  return { schedule: DEFAULT_SCHEDULE.map(d => ({ ...d })), daysOff: [], serviceDays: {}, loaded: false }
}

export default function AdminSchedule() {
  const { masters, services, isDb } = useData()

  const [cache, setCache]         = useState<Cache>({})
  const [activeMaster, setActive] = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [savingSvc, setSavingSvc] = useState(false)
  const [toast, setToast]         = useState<Toast>(null)
  const [newDayOff, setNewDayOff] = useState('')
  const [newReason, setNewReason] = useState('')

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // Load schedule + service-days for a master (once)
  const loadMaster = useCallback(async (mid: string) => {
    if (!isDb || cache[mid]?.loaded) return
    try {
      const [sched, offs, svcDays] = await Promise.all([
        api.fetchSchedule(mid),
        api.fetchDaysOff(mid),
        api.fetchAllServiceDays(mid),
      ])
      const filled = DEFAULT_SCHEDULE.map(d => {
        const found = sched.find(s => s.dayOfWeek === d.dayOfWeek)
        return found ? { ...d, ...found } : { ...d, active: false }
      })
      setCache(prev => ({ ...prev, [mid]: { schedule: filled, daysOff: offs, serviceDays: svcDays, loaded: true } }))
    } catch {
      showToast('error', 'Ошибка загрузки расписания')
    }
  }, [isDb, cache])

  const toggleMaster = (mid: string) => {
    if (activeMaster === mid) { setActive(null); return }
    setActive(mid)
    loadMaster(mid)
  }

  const setSchedule = (mid: string, fn: (s: ScheduleDay[]) => ScheduleDay[]) =>
    setCache(prev => ({ ...prev, [mid]: { ...(prev[mid] ?? emptyData()), schedule: fn((prev[mid] ?? emptyData()).schedule) } }))

  const handleSave = async (mid: string) => {
    const data = cache[mid]; if (!data) return
    setSaving(true)
    try {
      await api.saveSchedule(mid, data.schedule)
      showToast('success', 'Расписание сохранено')
    } catch { showToast('error', 'Ошибка сохранения') }
    finally { setSaving(false) }
  }

  // Toggle a day for a specific service
  const toggleServiceDay = (mid: string, serviceId: string, dow: number) => {
    setCache(prev => {
      const d = prev[mid] ?? emptyData()
      const current = new Set(d.serviceDays[serviceId] ?? [])
      if (current.has(dow)) current.delete(dow)
      else current.add(dow)
      return { ...prev, [mid]: { ...d, serviceDays: { ...d.serviceDays, [serviceId]: current } } }
    })
  }

  const handleSaveServiceDays = async (mid: string) => {
    const data = cache[mid]; if (!data) return
    const master = masters.find(m => m.id === mid); if (!master) return
    setSavingSvc(true)
    try {
      await Promise.all(
        master.services.map(sid =>
          api.saveServiceDays(mid, sid, data.serviceDays[sid] ?? new Set())
        )
      )
      showToast('success', 'Расписание по услугам сохранено')
    } catch { showToast('error', 'Ошибка сохранения') }
    finally { setSavingSvc(false) }
  }

  const handleAddDayOff = async (mid: string) => {
    if (!newDayOff) return
    try {
      const added = await api.addDayOff(mid, newDayOff, newReason)
      setCache(prev => ({
        ...prev,
        [mid]: { ...(prev[mid] ?? emptyData()), daysOff: [...(prev[mid]?.daysOff ?? []), added].sort((a, b) => a.date.localeCompare(b.date)) }
      }))
      setNewDayOff(''); setNewReason('')
    } catch { showToast('error', 'Ошибка добавления выходного') }
  }

  const handleRemoveDayOff = async (mid: string, id: string) => {
    try {
      await api.removeDayOff(id)
      setCache(prev => ({ ...prev, [mid]: { ...(prev[mid] ?? emptyData()), daysOff: (prev[mid]?.daysOff ?? []).filter(d => d.id !== id) } }))
    } catch { showToast('error', 'Ошибка удаления') }
  }

  // Group masters by services
  const groups: Record<string, typeof masters> = {}
  const assigned = new Set<string>()
  services.forEach(svc => {
    const svcMasters = masters.filter(m => m.services.includes(svc.id))
    if (svcMasters.length > 0) {
      groups[svc.name] = svcMasters
      svcMasters.forEach(m => assigned.add(m.id))
    }
  })
  const unassigned = masters.filter(m => !assigned.has(m.id))
  if (unassigned.length > 0) groups['Другие'] = unassigned

  if (!isDb) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <WarningCircle size={28} className="text-amber-400" />
        </div>
        <h3 className="text-base font-medium text-white mb-2">Требуется база данных</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          Управление расписанием доступно только при подключении к базе данных.
        </p>
      </div>
    )
  }

  return (
    <div className="relative space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-sm shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} weight="bold" /> : <WarningCircle size={16} weight="bold" />}
          {toast.message}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-white mb-1">График работы</h2>
        <p className="text-sm text-zinc-500">Нажмите на мастера чтобы отредактировать расписание и распределение услуг по дням</p>
      </div>

      {/* Groups */}
      {Object.entries(groups).map(([role, groupMasters]) => (
        <div key={role}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">{role}</span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">{groupMasters.length} {groupMasters.length === 1 ? 'мастер' : 'мастера'}</span>
          </div>

          <div className="space-y-2">
            {groupMasters.map(master => {
              const data   = cache[master.id]
              const isOpen = activeMaster === master.id
              const masterServices = master.services.map(id => services.find(s => s.id === id)).filter(Boolean) as typeof services

              return (
                <div key={master.id} className="border border-zinc-700 rounded-sm overflow-hidden">
                  {/* Card header */}
                  <button
                    onClick={() => toggleMaster(master.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 bg-zinc-800 hover:bg-zinc-750 transition-colors text-left"
                  >
                    <img
                      src={master.photo || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop'}
                      alt={master.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white leading-snug">{master.name}</p>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">
                        {masterServices.map(s => s.name).join(', ') || 'Услуги не указаны'}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 mr-2">
                      {DAYS_SHORT.map((d, i) => {
                        const dayData = data?.schedule.find(s => s.dayOfWeek === i)
                        const active  = data?.loaded ? (dayData?.active ?? false) : i < 6
                        return (
                          <div key={d} className="flex flex-col items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-zinc-700'}`} />
                            <span className="text-[9px] text-zinc-600">{d}</span>
                          </div>
                        )
                      })}
                    </div>
                    {isOpen ? <CaretUp size={14} className="text-zinc-400 shrink-0" /> : <CaretDown size={14} className="text-zinc-400 shrink-0" />}
                  </button>

                  {/* Expanded editor */}
                  {isOpen && (
                    <div className="bg-zinc-900 border-t border-zinc-700 p-5 space-y-7">

                      {/* ── 1. General schedule ─────────────────────────────── */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Рабочие дни и часы</h4>
                          <button onClick={() => handleSave(master.id)} disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-accent)] text-white text-xs font-medium rounded-sm hover:bg-[var(--color-accent-light)] disabled:opacity-50 active:scale-[0.97] transition-all">
                            <FloppyDisk size={13} weight="bold" />
                            Сохранить
                          </button>
                        </div>
                        <div className="divide-y divide-zinc-800 border border-zinc-700 rounded-sm overflow-hidden">
                          {(data?.schedule ?? DEFAULT_SCHEDULE).map((day, i) => (
                            <div key={day.dayOfWeek} className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50">
                              <button
                                onClick={() => setSchedule(master.id, prev => prev.map((d, idx) => idx === i ? { ...d, active: !d.active } : d))}
                                className={`relative inline-flex items-center w-10 h-5 rounded-full shrink-0 transition-colors duration-200 ${day.active ? 'bg-[var(--color-accent)]' : 'bg-zinc-600'}`}
                              >
                                <span className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${day.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                              </button>
                              <span className={`text-sm w-24 shrink-0 ${day.active ? 'text-white' : 'text-zinc-600'}`}>{DAYS_FULL[day.dayOfWeek]}</span>
                              {day.active ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-zinc-500">с</span>
                                  <select value={day.startTime}
                                    onChange={e => setSchedule(master.id, prev => prev.map((d, idx) => idx === i ? { ...d, startTime: e.target.value } : d))}
                                    className="bg-zinc-900 border border-zinc-700 text-white rounded-sm px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-accent)]">
                                    {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                  <span className="text-xs text-zinc-500">до</span>
                                  <select value={day.endTime}
                                    onChange={e => setSchedule(master.id, prev => prev.map((d, idx) => idx === i ? { ...d, endTime: e.target.value } : d))}
                                    className="bg-zinc-900 border border-zinc-700 text-white rounded-sm px-2 py-1 text-xs focus:outline-none focus:border-[var(--color-accent)]">
                                    {TIME_OPTIONS.filter(t => t > day.startTime).map(t => <option key={t} value={t}>{t}</option>)}
                                  </select>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-600">Выходной</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── 2. Services per day ───────────────────────────────
                           Which days the master does each service.
                           Empty = available all working days (no restriction). */}
                      {masterServices.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Услуги по дням</h4>
                            <button onClick={() => handleSaveServiceDays(master.id)} disabled={savingSvc}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-accent)] text-white text-xs font-medium rounded-sm hover:bg-[var(--color-accent-light)] disabled:opacity-50 active:scale-[0.97] transition-all">
                              <FloppyDisk size={13} weight="bold" />
                              Сохранить
                            </button>
                          </div>

                          <div className="flex items-start gap-1.5 mb-4 p-3 bg-zinc-800/60 border border-zinc-700/50 rounded-sm">
                            <Info size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              Отметьте дни, в которые мастер выполняет каждую услугу.{' '}
                              <span className="text-zinc-400">Если ни один день не выбран — услуга доступна все рабочие дни.</span>
                            </p>
                          </div>

                          <div className="border border-zinc-700 rounded-sm overflow-hidden divide-y divide-zinc-800">
                            {/* Header row */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800">
                              <span className="text-[10px] text-zinc-500 font-medium flex-1">Услуга</span>
                              {DAYS_SHORT.map(d => (
                                <span key={d} className="text-[10px] text-zinc-500 w-8 text-center">{d}</span>
                              ))}
                            </div>

                            {/* Service rows */}
                            {masterServices.map(svc => {
                              const activeDays = data?.schedule.filter(s => s.active).map(s => s.dayOfWeek) ?? []
                              const selectedDays = data?.serviceDays[svc.id] ?? new Set<number>()
                              const hasRestriction = selectedDays.size > 0

                              return (
                                <div key={svc.id} className="flex items-center gap-2 px-4 py-3 bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-white font-medium truncate">{svc.name}</p>
                                    {!hasRestriction && (
                                      <p className="text-[10px] text-zinc-600 mt-0.5">все рабочие дни</p>
                                    )}
                                  </div>

                                  {DAYS_SHORT.map((_, dow) => {
                                    const isWorkDay = activeDays.includes(dow)
                                    const isChecked = selectedDays.has(dow)

                                    return (
                                      <button
                                        key={dow}
                                        disabled={!isWorkDay}
                                        onClick={() => toggleServiceDay(master.id, svc.id, dow)}
                                        title={isWorkDay ? `${DAYS_FULL[dow]}: ${isChecked ? 'убрать' : 'добавить'} ${svc.name}` : `${DAYS_FULL[dow]}: выходной`}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all shrink-0
                                          ${!isWorkDay
                                            ? 'opacity-20 cursor-not-allowed'
                                            : isChecked
                                              ? 'bg-[var(--color-accent)] text-white shadow-sm'
                                              : 'bg-zinc-700/60 text-zinc-500 hover:bg-zinc-600 hover:text-zinc-300'
                                          }`}
                                      >
                                        {isWorkDay ? (isChecked ? '✓' : '–') : '×'}
                                      </button>
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── 3. Individual days off ───────────────────────────── */}
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Индивидуальные выходные</h4>
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <input type="date" value={newDayOff} onChange={e => setNewDayOff(e.target.value)}
                            min={new Date().toLocaleDateString('en-CA')}
                            className="bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)]" />
                          <input type="text" value={newReason} onChange={e => setNewReason(e.target.value)}
                            placeholder="Причина (необязательно)"
                            className="flex-1 min-w-[160px] bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[var(--color-accent)]" />
                          <button onClick={() => handleAddDayOff(master.id)} disabled={!newDayOff}
                            className="flex items-center gap-1 px-3 py-2 bg-zinc-700 text-zinc-200 text-xs font-medium rounded-sm hover:bg-zinc-600 disabled:opacity-40 transition-colors">
                            <Plus size={12} weight="bold" /> Добавить
                          </button>
                        </div>
                        {(data?.daysOff ?? []).length === 0
                          ? <p className="text-xs text-zinc-600">Выходных нет</p>
                          : (
                            <div className="space-y-1.5">
                              {(data?.daysOff ?? []).map(d => (
                                <div key={d.id} className="flex items-center justify-between px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-sm">
                                  <span className="text-xs text-white">
                                    {new Date(d.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}
                                    {d.reason && <span className="text-zinc-500 ml-2">— {d.reason}</span>}
                                  </span>
                                  <button onClick={() => handleRemoveDayOff(master.id, d.id)}
                                    className="text-zinc-600 hover:text-red-400 transition-colors p-1">
                                    <Trash size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        }
                      </div>

                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {masters.length === 0 && (
        <p className="text-sm text-zinc-600">Мастера не добавлены. Добавьте их в разделе «Мастера».</p>
      )}
    </div>
  )
}
