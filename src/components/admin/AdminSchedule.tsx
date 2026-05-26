import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash, FloppyDisk, CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { useData } from '../../context/DataContext'
import * as api from '../../lib/api'
import type { ScheduleDay, DayOff } from '../../lib/api'

const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

const TIME_OPTIONS: string[] = []
for (let h = 7; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

const DEFAULT_SCHEDULE: ScheduleDay[] = DAYS.map((_, i) => ({
  dayOfWeek: i, startTime: '10:00', endTime: '19:00', active: i < 6,
}))

type Toast = { type: 'success' | 'error'; message: string } | null

export default function AdminSchedule() {
  const { masters, isDb } = useData()
  const [masterId, setMasterId] = useState<string>('')
  const [schedule, setSchedule] = useState<ScheduleDay[]>(DEFAULT_SCHEDULE)
  const [daysOff, setDaysOff] = useState<DayOff[]>([])
  const [newDayOff, setNewDayOff] = useState('')
  const [newReason, setNewReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  const activeMasterId = masterId || masters[0]?.id || ''

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadSchedule = useCallback(async (mid: string) => {
    if (!mid || !isDb) return
    setLoading(true)
    try {
      const [sched, offs] = await Promise.all([api.fetchSchedule(mid), api.fetchDaysOff(mid)])
      const filled = DEFAULT_SCHEDULE.map(d => {
        const found = sched.find(s => s.dayOfWeek === d.dayOfWeek)
        return found ? { ...d, ...found } : { ...d, active: false }
      })
      setSchedule(filled)
      setDaysOff(offs)
    } catch {
      showToast('error', 'Ошибка загрузки расписания')
    } finally {
      setLoading(false)
    }
  }, [isDb])

  useEffect(() => {
    if (activeMasterId) loadSchedule(activeMasterId)
  }, [activeMasterId, loadSchedule])

  const handleSave = async () => {
    if (!activeMasterId) return
    setLoading(true)
    try {
      await api.saveSchedule(activeMasterId, schedule)
      showToast('success', 'Расписание сохранено')
    } catch {
      showToast('error', 'Ошибка сохранения')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDayOff = async () => {
    if (!newDayOff || !activeMasterId) return
    try {
      const added = await api.addDayOff(activeMasterId, newDayOff, newReason)
      setDaysOff(prev => [...prev, added].sort((a, b) => a.date.localeCompare(b.date)))
      setNewDayOff('')
      setNewReason('')
    } catch {
      showToast('error', 'Ошибка добавления выходного')
    }
  }

  const handleRemoveDayOff = async (id: string) => {
    try {
      await api.removeDayOff(id)
      setDaysOff(prev => prev.filter(d => d.id !== id))
    } catch {
      showToast('error', 'Ошибка удаления')
    }
  }

  const selectedMaster = masters.find(m => m.id === activeMasterId)

  if (!isDb) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-sm bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <WarningCircle size={28} className="text-amber-400" />
        </div>
        <h3 className="text-base font-medium text-white mb-2">Требуется база данных</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          Управление расписанием доступно только при подключении Supabase.
          Настройте <code className="bg-zinc-800 px-1 rounded text-zinc-400 text-xs">.env.local</code> и добавьте переменные окружения.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-sm shadow-lg text-sm font-medium
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} weight="bold" /> : <WarningCircle size={16} weight="bold" />}
          {toast.message}
        </div>
      )}

      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">График работы</h2>
            <p className="text-sm text-zinc-500">Расписание по дням недели и выходные дни</p>
          </div>
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] disabled:opacity-50 active:scale-[0.98] transition-all">
            <FloppyDisk size={15} weight="bold" />
            Сохранить
          </button>
        </div>

        {/* Master selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-zinc-800 border border-zinc-700 rounded-sm px-5 py-4">
          <div className="flex-1">
            <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wide">Мастер</label>
            <select value={activeMasterId} onChange={e => { setMasterId(e.target.value); setSchedule(DEFAULT_SCHEDULE); setDaysOff([]) }}
              className="w-full sm:max-w-xs bg-zinc-900 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors">
              {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          {selectedMaster && (
            <div className="flex items-center gap-3">
              <img src={selectedMaster.photo || 'https://picsum.photos/seed/avatar/80/80'} alt={selectedMaster.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">{selectedMaster.name}</p>
                <p className="text-xs text-zinc-400">{selectedMaster.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Weekly schedule */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Рабочие дни и часы</h3>
          <div className={`divide-y divide-zinc-700 border border-zinc-700 rounded-sm overflow-hidden ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
            {schedule.map((day, i) => (
              <div key={day.dayOfWeek} className="flex items-center gap-4 px-5 py-3.5 bg-zinc-800 hover:bg-zinc-750 transition-colors">
                <button
                  onClick={() => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, active: !d.active } : d))}
                  className={`relative inline-flex items-center w-11 h-6 rounded-full shrink-0 transition-colors duration-200 focus:outline-none ${day.active ? 'bg-[var(--color-accent)]' : 'bg-zinc-600'}`}
                >
                  <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${day.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-sm w-28 shrink-0 ${day.active ? 'text-white font-medium' : 'text-zinc-500'}`}>
                  {DAYS[day.dayOfWeek]}
                </span>
                {day.active ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <span className="text-xs text-zinc-500">с</span>
                    <select value={day.startTime}
                      onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, startTime: e.target.value } : d))}
                      className="bg-zinc-900 border border-zinc-700 text-white rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors">
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-xs text-zinc-500">до</span>
                    <select value={day.endTime}
                      onChange={e => setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, endTime: e.target.value } : d))}
                      className="bg-zinc-900 border border-zinc-700 text-white rounded-sm px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors">
                      {TIME_OPTIONS.filter(t => t > day.startTime).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600 flex-1">Выходной</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Days off */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Индивидуальные выходные</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            <input type="date" value={newDayOff} onChange={e => setNewDayOff(e.target.value)}
              min={new Date().toLocaleDateString('en-CA')}
              className="bg-zinc-900 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors" />
            <input type="text" value={newReason} onChange={e => setNewReason(e.target.value)}
              placeholder="Причина (необязательно)"
              className="flex-1 min-w-[180px] bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors" />
            <button onClick={handleAddDayOff} disabled={!newDayOff}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-700 text-zinc-200 text-sm font-medium rounded-sm hover:bg-zinc-600 disabled:opacity-40 transition-colors">
              <Plus size={14} weight="bold" /> Добавить
            </button>
          </div>
          {daysOff.length === 0 ? (
            <p className="text-sm text-zinc-600">Индивидуальных выходных нет</p>
          ) : (
            <div className="space-y-2">
              {daysOff.map(d => (
                <div key={d.id} className="flex items-center justify-between px-5 py-3 bg-zinc-800 border border-zinc-700 rounded-sm">
                  <div>
                    <span className="text-sm font-medium text-white">
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    {d.reason && <span className="text-xs text-zinc-500 ml-2">— {d.reason}</span>}
                  </div>
                  <button onClick={() => handleRemoveDayOff(d.id)}
                    className="text-zinc-500 hover:text-red-400 transition-colors p-1.5">
                    <Trash size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Master services */}
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Услуги мастера</h3>
          <p className="text-xs text-zinc-600 mb-3">Изменить набор услуг можно в разделе «Мастера»</p>
          {selectedMaster && selectedMaster.services.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <ServiceTags masterServices={selectedMaster.services} />
            </div>
          ) : (
            <p className="text-sm text-zinc-600">У мастера нет привязанных услуг</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ServiceTags({ masterServices }: { masterServices: string[] }) {
  const { services } = useData()
  const names = masterServices.map(id => services.find(s => s.id === id)?.name).filter(Boolean)
  return (
    <>
      {names.map(n => (
        <span key={n} className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-sm font-medium">{n}</span>
      ))}
    </>
  )
}
