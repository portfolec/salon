import { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Trash, FloppyDisk, CheckCircle, WarningCircle, CaretDown, CaretUp, CaretLeft, CaretRight, Info } from '@phosphor-icons/react'
import { useData } from '../../context/DataContext'
import * as api from '../../lib/api'
import type { WorkInterval } from '../../lib/api'

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

function pad(n: number) { return String(n).padStart(2, '0') }

function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1)
  const startDow = firstDay.getDay()
  const offset = startDow === 0 ? 6 : startDow - 1
  const days: (number | null)[] = Array(offset).fill(null)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

const DEFAULT_INTERVAL: WorkInterval = { startTime: '10:00', endTime: '19:00' }

type Toast = { type: 'success' | 'error'; message: string } | null

type MasterData = {
  workByDate: Record<string, WorkInterval[]>
  calYear: number
  calMonth: number
  selectedDate: string | null
  serviceDays: Record<string, Set<number>>
  variantDays: Record<string, Set<number>>
  monthLoaded: boolean
  servicesLoaded: boolean
}

type Cache = Record<string, MasterData>

function emptyData(): MasterData {
  const today = new Date()
  return {
    workByDate: {},
    calYear: today.getFullYear(),
    calMonth: today.getMonth(),
    selectedDate: today.toLocaleDateString('en-CA'),
    serviceDays: {},
    variantDays: {},
    monthLoaded: false,
    servicesLoaded: false,
  }
}

export default function AdminSchedule() {
  const { masters, services, isDb } = useData()
  const today = new Date()

  const [cache, setCache] = useState<Cache>({})
  const [activeMaster, setActive] = useState<string | null>(null)
  const [savingDay, setSavingDay] = useState(false)
  const [savingSvc, setSavingSvc] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const persistTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const persistSeq = useRef(0)
  const persistInflight = useRef(0)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadMonth = useCallback(async (mid: string, year: number, month: number) => {
    const days = await api.fetchWorkDays(mid, year, month)
    const workByDate: Record<string, WorkInterval[]> = {}
    days.forEach(d => { workByDate[d.date] = d.intervals })
    setCache(prev => {
      const cur = prev[mid] ?? emptyData()
      const selected = cur.selectedDate?.startsWith(`${year}-${pad(month + 1)}`)
        ? cur.selectedDate
        : `${year}-${pad(month + 1)}-01`
      return { ...prev, [mid]: { ...cur, workByDate, calYear: year, calMonth: month, selectedDate: selected, monthLoaded: true } }
    })
  }, [])

  const loadServices = useCallback(async (mid: string) => {
    if (!isDb) return
    try {
      const [svcDays, varDays] = await Promise.all([
        api.fetchAllServiceDays(mid),
        api.fetchAllVariantDays(mid),
      ])
      setCache(prev => ({
        ...prev,
        [mid]: { ...(prev[mid] ?? emptyData()), serviceDays: svcDays, variantDays: varDays, servicesLoaded: true },
      }))
    } catch {
      showToast('error', 'Ошибка загрузки услуг')
    }
  }, [isDb])

  const masterIdsKey = masters.map(m => m.id).join(',')
  useEffect(() => {
    if (!isDb || !masterIdsKey) return
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    masterIdsKey.split(',').forEach(id => {
      loadMonth(id, year, month).catch(() => {})
    })
  }, [isDb, masterIdsKey, loadMonth])

  const toggleMaster = (mid: string) => {
    if (activeMaster === mid) { setActive(null); return }
    setActive(mid)
    const d = cache[mid]
    const now = new Date()
    if (!d?.monthLoaded) {
      loadMonth(mid, d?.calYear ?? now.getFullYear(), d?.calMonth ?? now.getMonth())
        .catch(() => showToast('error', 'Ошибка загрузки графика'))
    }
    if (!d?.servicesLoaded) loadServices(mid)
  }

  const navMonth = (mid: string, dir: number) => {
    const data = cache[mid] ?? emptyData()
    let m = data.calMonth + dir
    let y = data.calYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setCache(prev => ({ ...prev, [mid]: { ...(prev[mid] ?? emptyData()), calYear: y, calMonth: m } }))
    loadMonth(mid, y, m).catch(() => showToast('error', 'Ошибка загрузки графика'))
  }

  const writeDayCache = (mid: string, date: string, intervals: WorkInterval[]) => {
    setCache(prev => {
      const cur = prev[mid] ?? emptyData()
      const workByDate = { ...cur.workByDate }
      if (intervals.length) workByDate[date] = intervals
      else delete workByDate[date]
      return { ...prev, [mid]: { ...cur, workByDate } }
    })
  }

  const persistDay = async (mid: string, date: string, intervals: WorkInterval[]) => {
    if (intervalsOverlap(intervals)) {
      showToast('error', 'Интервалы не должны пересекаться')
      return false
    }
    const seq = ++persistSeq.current
    persistInflight.current += 1
    setSavingDay(true)
    try {
      const saved = await api.saveWorkDay(mid, date, intervals)
      if (seq !== persistSeq.current) return true
      writeDayCache(mid, date, saved.intervals)
      return true
    } catch {
      if (seq === persistSeq.current) showToast('error', 'Не удалось сохранить день')
      return false
    } finally {
      persistInflight.current = Math.max(0, persistInflight.current - 1)
      if (persistInflight.current === 0) setSavingDay(false)
    }
  }

  const persistDayDebounced = (mid: string, date: string, intervals: WorkInterval[]) => {
    const key = `${mid}:${date}`
    clearTimeout(persistTimers.current[key])
    persistTimers.current[key] = setTimeout(() => { void persistDay(mid, date, intervals) }, 350)
  }

  const selectDate = (mid: string, date: string) => {
    setCache(prev => ({ ...prev, [mid]: { ...(prev[mid] ?? emptyData()), selectedDate: date } }))
  }

  const setDayIntervals = (mid: string, date: string, intervals: WorkInterval[], immediate = false) => {
    writeDayCache(mid, date, intervals)
    if (immediate) void persistDay(mid, date, intervals)
    else persistDayDebounced(mid, date, intervals)
  }

  const applyToWeekday = async (mid: string, date: string, intervals: WorkInterval[]) => {
    if (intervalsOverlap(intervals) || !intervals.length) {
      showToast('error', 'Сначала задайте непересекающиеся интервалы')
      return
    }
    const data = cache[mid] ?? emptyData()
    const y = data.calYear
    const m = data.calMonth
    const dow = dateDow(date)
    const last = new Date(y, m + 1, 0).getDate()
    const dates: string[] = []
    for (let d = 1; d <= last; d++) {
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`
      if (dateDow(ds) === dow) dates.push(ds)
    }
    setSavingDay(true)
    try {
      await Promise.all(dates.map(ds => api.saveWorkDay(mid, ds, intervals)))
      setCache(prev => {
        const cur = prev[mid] ?? emptyData()
        const workByDate = { ...cur.workByDate }
        dates.forEach(ds => { workByDate[ds] = intervals })
        return { ...prev, [mid]: { ...cur, workByDate } }
      })
      showToast('success', `Часы скопированы на ${dates.length} дн.`)
    } catch {
      showToast('error', 'Не удалось скопировать часы')
    } finally {
      setSavingDay(false)
    }
  }

  const toggleWorkDay = (mid: string, date: string) => {
    const data = cache[mid] ?? emptyData()
    const current = data.workByDate[date] ?? []
    if (current.length) setDayIntervals(mid, date, [], true)
    else setDayIntervals(mid, date, [{ ...DEFAULT_INTERVAL }], true)
    selectDate(mid, date)
  }

  const toggleServiceDay = (mid: string, serviceId: string, dow: number) => {
    setCache(prev => {
      const d = prev[mid] ?? emptyData()
      const current = new Set(d.serviceDays[serviceId] ?? [])
      if (current.has(dow)) current.delete(dow)
      else current.add(dow)
      return { ...prev, [mid]: { ...d, serviceDays: { ...d.serviceDays, [serviceId]: current } } }
    })
  }

  const toggleVariantDay = (mid: string, variantId: string, dow: number) => {
    setCache(prev => {
      const d = prev[mid] ?? emptyData()
      const current = new Set(d.variantDays[variantId] ?? [])
      if (current.has(dow)) current.delete(dow)
      else current.add(dow)
      return { ...prev, [mid]: { ...d, variantDays: { ...d.variantDays, [variantId]: current } } }
    })
  }

  const handleSaveServiceDays = async (mid: string) => {
    const data = cache[mid]; if (!data) return
    const master = masters.find(m => m.id === mid); if (!master) return
    const masterServices = master.services.map(id => services.find(s => s.id === id)).filter(Boolean) as typeof services
    const variantIds = masterServices.flatMap(s => s.variants?.map(v => v.id) ?? [])
    setSavingSvc(true)
    try {
      await Promise.all([
        ...master.services.map(sid => api.saveServiceDays(mid, sid, data.serviceDays[sid] ?? new Set())),
        ...variantIds.map(vid => api.saveVariantDays(mid, vid, data.variantDays[vid] ?? new Set())),
      ])
      showToast('success', 'Расписание по услугам сохранено')
    } catch { showToast('error', 'Ошибка сохранения') }
    finally { setSavingSvc(false) }
  }

  const groups: Record<string, typeof masters> = {}
  const assigned = new Set<string>()
  services.forEach(svc => {
    const svcMasters = masters.filter(m => m.services.includes(svc.id) && !assigned.has(m.id))
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
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-sm shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} weight="bold" /> : <WarningCircle size={16} weight="bold" />}
          {toast.message}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-white mb-1">График работы</h2>
        <p className="text-sm text-zinc-500">Выберите мастера и настройте месяц в календаре. В одном дне можно несколько интервалов, например 10:00–13:00 и 18:00–21:00. Новый месяц сначала копируется из прежнего недельного графика.</p>
      </div>

      {Object.entries(groups).map(([role, groupMasters]) => (
        <div key={role}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-400">{role}</span>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-600">{groupMasters.length} {groupMasters.length === 1 ? 'мастер' : 'мастера'}</span>
          </div>

          <div className="space-y-2">
            {groupMasters.map(master => {
              const data = cache[master.id]
              const isOpen = activeMaster === master.id
              const masterServices = master.services.map(id => services.find(s => s.id === id)).filter(Boolean) as typeof services
              const prefix = `${data?.calYear ?? today.getFullYear()}-${pad((data?.calMonth ?? today.getMonth()) + 1)}`
              const workCount = data
                ? Object.entries(data.workByDate).filter(([d, iv]) => d.startsWith(prefix) && iv.length > 0).length
                : 0
                              const selected = data?.selectedDate
              const selectedIntervals = selected ? (data?.workByDate[selected] ?? []) : []
              const selectedDow = selected ? dateDow(selected) : null

              return (
                <div key={master.id} className="border border-zinc-700 rounded-sm overflow-hidden">
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
                    {data?.monthLoaded ? (
                      <span className="hidden sm:block text-xs text-zinc-500 mr-2">{workCount} раб. дн. в месяце</span>
                    ) : (
                      <span className="hidden sm:block text-xs text-zinc-600 mr-2">…</span>
                    )}
                    {isOpen ? <CaretUp size={14} className="text-zinc-400 shrink-0" /> : <CaretDown size={14} className="text-zinc-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="bg-zinc-900 border-t border-zinc-700 p-5 space-y-7">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Календарь месяца</h4>
                        <div className="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-5">
                          <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-4 h-fit">
                            <div className="flex items-center justify-between mb-3">
                              <button type="button" onClick={() => navMonth(master.id, -1)} className="p-1 text-zinc-400 hover:text-white">
                                <CaretLeft size={14} />
                              </button>
                              <span className="text-xs font-medium text-white">{MONTHS_RU[data?.calMonth ?? today.getMonth()]} {data?.calYear ?? today.getFullYear()}</span>
                              <button type="button" onClick={() => navMonth(master.id, 1)} className="p-1 text-zinc-400 hover:text-white">
                                <CaretRight size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-1">
                              {DAYS_SHORT.map(d => (
                                <div key={d} className="text-center text-[9px] text-zinc-600 py-1">{d}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {buildCalendarGrid(data?.calYear ?? today.getFullYear(), data?.calMonth ?? today.getMonth()).map((day, idx) => {
                                if (!day) return <div key={idx} />
                                const y = data?.calYear ?? today.getFullYear()
                                const m = data?.calMonth ?? today.getMonth()
                                const dateStr = `${y}-${pad(m + 1)}-${pad(day)}`
                                const intervals = data?.workByDate[dateStr] ?? []
                                const isWork = intervals.length > 0
                                const isSel = selected === dateStr
                                const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y
                                return (
                                  <button type="button" key={idx}
                                    onClick={() => selectDate(master.id, dateStr)}
                                    onDoubleClick={() => toggleWorkDay(master.id, dateStr)}
                                    className={`relative h-10 rounded-sm text-xs transition-colors flex flex-col items-center justify-center gap-0.5
                                      ${isSel ? 'bg-[var(--color-accent)] text-white font-medium' : isWork ? 'bg-emerald-900/40 text-zinc-100 hover:bg-emerald-900/70' : 'text-zinc-500 hover:bg-zinc-700'}
                                      ${isToday && !isSel ? 'ring-1 ring-inset ring-[var(--color-accent)]/60' : ''}`}>
                                    <span>{day}</span>
                                    {isWork && !isSel && (
                                      <span className="text-[8px] leading-none text-emerald-300">{intervals.length}</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                            <p className="mt-3 text-[11px] text-zinc-500">Клик — выбрать день. Двойной клик — рабочий / выходной.</p>
                          </div>

                          <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-4">
                            {!selected ? (
                              <p className="text-sm text-zinc-500 py-8 text-center">Выберите день в календаре</p>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-3 mb-4">
                                  <div>
                                    <p className="text-sm font-medium text-white capitalize">
                                      {new Date(selected + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                      {selectedIntervals.length ? `${intervalWord(selectedIntervals.length)}` : 'Выходной'}
                                      {savingDay ? ' · сохранение…' : ''}
                                    </p>
                                  </div>
                                  {selectedIntervals.length > 0 ? (
                                    <button type="button" onClick={() => setDayIntervals(master.id, selected, [], true)}
                                      className="text-xs px-3 py-1.5 bg-zinc-700 text-zinc-200 rounded-sm hover:bg-red-600 hover:text-white transition-colors">
                                      Сделать выходным
                                    </button>
                                  ) : (
                                    <button type="button" onClick={() => setDayIntervals(master.id, selected, [{ ...DEFAULT_INTERVAL }], true)}
                                      className="text-xs px-3 py-1.5 bg-[var(--color-accent)] text-white rounded-sm hover:bg-[var(--color-accent-light)] transition-colors">
                                      Сделать рабочим
                                    </button>
                                  )}
                                </div>

                                {selectedIntervals.length > 0 && (
                                  <div className="space-y-2">
                                    {selectedIntervals.map((iv, i) => (
                                      <div key={i} className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-zinc-500 w-16 shrink-0">с</span>
                                        <select value={iv.startTime}
                                          onChange={e => {
                                            const startTime = e.target.value
                                            const endTime = iv.endTime > startTime ? iv.endTime : (TIME_OPTIONS.find(t => t > startTime) ?? '23:00')
                                            const next = selectedIntervals.map((x, idx) => idx === i ? { ...x, startTime, endTime } : x)
                                            setDayIntervals(master.id, selected, next)
                                          }}
                                          className="bg-zinc-900 border border-zinc-700 text-white rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-accent)]">
                                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                          {!TIME_OPTIONS.includes(iv.startTime) && <option value={iv.startTime}>{iv.startTime}</option>}
                                        </select>
                                        <span className="text-xs text-zinc-500">до</span>
                                        <select value={iv.endTime}
                                          onChange={e => {
                                            const next = selectedIntervals.map((x, idx) => idx === i ? { ...x, endTime: e.target.value } : x)
                                            setDayIntervals(master.id, selected, next)
                                          }}
                                          className="bg-zinc-900 border border-zinc-700 text-white rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-accent)]">
                                          {TIME_OPTIONS.filter(t => t > iv.startTime).map(t => <option key={t} value={t}>{t}</option>)}
                                          {!TIME_OPTIONS.includes(iv.endTime) && <option value={iv.endTime}>{iv.endTime}</option>}
                                        </select>
                                        <button type="button"
                                          onClick={() => setDayIntervals(master.id, selected, selectedIntervals.filter((_, idx) => idx !== i), true)}
                                          className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                                          title="Удалить интервал">
                                          <Trash size={14} />
                                        </button>
                                      </div>
                                    ))}
                                    {intervalsOverlap(selectedIntervals) && (
                                      <p className="text-[11px] text-red-400">Интервалы пересекаются — сдвиньте границы, иначе день не сохранится.</p>
                                    )}
                                    <button type="button"
                                      onClick={() => setDayIntervals(master.id, selected, [...selectedIntervals, nextInterval(selectedIntervals)], true)}
                                      className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-accent-light)] hover:text-white transition-colors">
                                      <Plus size={12} weight="bold" /> Добавить интервал
                                    </button>
                                    <button type="button"
                                      onClick={() => void applyToWeekday(master.id, selected, selectedIntervals)}
                                      disabled={savingDay || intervalsOverlap(selectedIntervals)}
                                      className="mt-1 text-[11px] text-zinc-500 hover:text-white disabled:opacity-40 transition-colors">
                                      Скопировать эти часы на все {DAYS_SHORT[dateDow(selected)]} этого месяца
                                    </button>
                                  </div>
                                )}
                                {selectedDow !== null && (
                                  <p className="text-[11px] text-zinc-500 mt-4">
                                    {selectedIntervals.length === 0
                                      ? 'Дата выходная в календаре — запись на сайт в этот день не откроется.'
                                      : masterServices.filter(s => offeredOnDow(data?.serviceDays[s.id], selectedDow)).length
                                        ? `В этот день на сайте: ${masterServices.filter(s => offeredOnDow(data?.serviceDays[s.id], selectedDow)).map(s => s.name).join(', ')}`
                                        : 'В этот день недели ни одна услуга не отмечена — запись на сайт не откроется.'}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {masterServices.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Услуги по дням недели</h4>
                            <button onClick={() => handleSaveServiceDays(master.id)} disabled={savingSvc}
                              className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-accent)] text-white text-xs font-medium rounded-sm hover:bg-[var(--color-accent-light)] disabled:opacity-50 active:scale-[0.97] transition-all">
                              <FloppyDisk size={13} weight="bold" />
                              Сохранить
                            </button>
                          </div>

                          <div className="flex items-start gap-1.5 mb-4 p-3 bg-zinc-800/60 border border-zinc-700/50 rounded-sm">
                            <Info size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-500 leading-relaxed">
                              Календарь задаёт рабочие даты и часы. Здесь — какие услуги в какие дни недели. Запись на сайт открывается только если дата рабочая и услуга разрешена в этот день недели. Пустая строка — услуга во все рабочие даты.
                            </p>
                          </div>

                          <div className="border border-zinc-700 rounded-sm overflow-hidden divide-y divide-zinc-800">
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800">
                              <span className="text-[10px] text-zinc-500 font-medium flex-1">Услуга</span>
                              {DAYS_SHORT.map((d, dow) => (
                                <span key={d} className={`text-[10px] w-8 text-center ${selectedDow === dow ? 'text-white font-medium' : 'text-zinc-500'}`}>{d}</span>
                              ))}
                            </div>

                            {masterServices.map(svc => {
                              const selectedDays = data?.serviceDays[svc.id] ?? new Set<number>()
                              const hasRestriction = selectedDays.size > 0
                              const svcVariants = (svc.variants ?? []).filter(v => !master.disabledVariantIds?.includes(v.id))

                              return (
                                <div key={svc.id}>
                                  <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/40">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-white font-medium truncate">{svc.name}</p>
                                      {!hasRestriction && <p className="text-[10px] text-zinc-600 mt-0.5">все рабочие дни</p>}
                                    </div>
                                    {DAYS_SHORT.map((_, dow) => {
                                      const isChecked = selectedDays.has(dow)
                                      return (
                                        <button key={dow} onClick={() => toggleServiceDay(master.id, svc.id, dow)}
                                          className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all shrink-0
                                            ${isChecked ? 'bg-[var(--color-accent)] text-white' : 'bg-zinc-700/60 text-zinc-500 hover:bg-zinc-600'}
                                            ${selectedDow === dow ? 'ring-1 ring-white/40' : ''}`}>
                                          {isChecked ? '✓' : '–'}
                                        </button>
                                      )
                                    })}
                                  </div>
                                  {svcVariants.map(variant => {
                                    const varSelectedDays = data?.variantDays[variant.id] ?? new Set<number>()
                                    const varHasRestriction = varSelectedDays.size > 0
                                    return (
                                      <div key={variant.id} className="flex items-center gap-2 pl-8 pr-4 py-2 bg-zinc-900/40 border-t border-zinc-800/60">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[11px] text-zinc-300 truncate">└ {variant.name}</p>
                                          {!varHasRestriction && <p className="text-[9px] text-zinc-600 mt-0.5">как у услуги</p>}
                                        </div>
                                        {DAYS_SHORT.map((_, dow) => {
                                          const isChecked = varSelectedDays.has(dow)
                                          return (
                                            <button key={dow} onClick={() => toggleVariantDay(master.id, variant.id, dow)}
                                              className={`w-8 h-7 rounded flex items-center justify-center text-[11px] font-medium transition-all shrink-0
                                                ${isChecked ? 'bg-[var(--color-accent)]/80 text-white' : 'bg-zinc-800/60 text-zinc-600 hover:bg-zinc-700'}
                                                ${selectedDow === dow ? 'ring-1 ring-white/30' : ''}`}>
                                              {isChecked ? '✓' : '–'}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
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

function toMinutesLocal(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function minutesToTimeLocal(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function dateDow(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const js = new Date(y, m - 1, d).getDay()
  return js === 0 ? 6 : js - 1
}

function intervalsOverlap(list: WorkInterval[]) {
  const sorted = [...list].sort((a, b) => toMinutesLocal(a.startTime) - toMinutesLocal(b.startTime))
  for (let i = 1; i < sorted.length; i++) {
    if (toMinutesLocal(sorted[i].startTime) < toMinutesLocal(sorted[i - 1].endTime)) return true
  }
  return false
}

function nextInterval(existing: WorkInterval[]): WorkInterval {
  const sorted = [...existing].sort((a, b) => toMinutesLocal(a.startTime) - toMinutesLocal(b.startTime))
  const dayEnd = toMinutesLocal('23:00')
  const last = sorted[sorted.length - 1]
  if (last) {
    const cursor = toMinutesLocal(last.endTime)
    if (dayEnd - cursor >= 60) {
      return { startTime: minutesToTimeLocal(cursor), endTime: minutesToTimeLocal(Math.min(cursor + 180, dayEnd)) }
    }
  }
  const dayStart = toMinutesLocal('07:00')
  let cursor = dayStart
  for (const iv of sorted) {
    const a = toMinutesLocal(iv.startTime)
    if (a - cursor >= 60) {
      return { startTime: minutesToTimeLocal(cursor), endTime: minutesToTimeLocal(Math.min(cursor + 180, a)) }
    }
    cursor = Math.max(cursor, toMinutesLocal(iv.endTime))
  }
  return { startTime: '18:00', endTime: '21:00' }
}

function offeredOnDow(days: Set<number> | undefined, dow: number) {
  return !days || days.size === 0 || days.has(dow)
}

function intervalWord(n: number) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} интервал`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} интервала`
  return `${n} интервалов`
}
