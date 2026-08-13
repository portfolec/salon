import { useState, useMemo, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import * as api from '../../lib/api'
import type { MyScheduleDay, MyDayOff } from '../../lib/api'
import type { Booking } from '../../context/DataContext'
import { MyBookingCard } from './myBookingShared'
import { CaretLeft, CaretRight, CalendarBlank, Clock, Warning } from '@phosphor-icons/react'

const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

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

function pad(n: number) { return String(n).padStart(2, '0') }

export default function AdminMySchedule() {
  const today = new Date()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [schedule, setSchedule] = useState<MyScheduleDay[]>([])
  const [daysOff, setDaysOff] = useState<MyDayOff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toLocaleDateString('en-CA'))

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([api.fetchMyBookings(), api.fetchMySchedule(), api.fetchMyDaysOff()])
      .then(([b, s, d]) => { setBookings(b); setSchedule(s); setDaysOff(d) })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const activeBookings = bookings.filter(b => b.status !== 'cancelled')
  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    activeBookings.forEach(b => { (map[b.date] ??= []).push(b) })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings])

  const offDates = useMemo(() => new Set(daysOff.map(d => d.date)), [daysOff])
  const workingDows = useMemo(() => new Set(schedule.filter(s => s.active).map(s => s.dayOfWeek)), [schedule])

  const navMonth = (dir: number) => {
    let m = calMonth + dir
    let y = calYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setCalMonth(m)
    setCalYear(y)
  }

  const dayBookings = selectedDate
    ? (byDate[selectedDate] ?? []).slice().sort((a, b) => a.time.localeCompare(b.time))
    : []
  const selectedDayOff = selectedDate ? daysOff.find(d => d.date === selectedDate) : undefined

  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-1">Мой график</h2>
        <p className="text-sm text-zinc-500">Нажмите на дату, чтобы увидеть все записи на этот день.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-sm text-sm text-red-300">
          <Warning size={16} className="shrink-0 mt-0.5" />
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">Загрузка…</div>
      ) : (
        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          {/* Calendar */}
          <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-5 h-fit">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => navMonth(-1)} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                <CaretLeft size={16} />
              </button>
              <span className="text-sm font-medium text-white">{MONTHS_RU[calMonth]} {calYear}</span>
              <button onClick={() => navMonth(1)} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                <CaretRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_RU.map(d => (
                <div key={d} className="text-center text-[10px] font-medium tracking-wide text-zinc-600 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {buildCalendarGrid(calYear, calMonth).map((day, idx) => {
                if (!day) return <div key={idx} />
                const dateStr = `${calYear}-${pad(calMonth + 1)}-${pad(day)}`
                const dow = (new Date(calYear, calMonth, day).getDay() + 6) % 7
                const dayItems = byDate[dateStr] ?? []
                const isSel = selectedDate === dateStr
                const isOff = offDates.has(dateStr) || !workingDows.has(dow)
                const hasNew = dayItems.some(b => b.status === 'new')
                return (
                  <button key={idx}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative h-11 rounded-sm text-sm transition-colors duration-150 flex flex-col items-center justify-center gap-0.5
                      ${isSel ? 'bg-[var(--color-accent)] text-white font-medium' : isOff ? 'text-zinc-700 hover:bg-zinc-700/60' : 'hover:bg-zinc-700 text-zinc-200'}
                      ${isToday(day) && !isSel ? 'ring-1 ring-inset ring-[var(--color-accent)]/60' : ''}`}>
                    <span>{day}</span>
                    {dayItems.length > 0 ? (
                      <span className={`text-[9px] leading-none px-1 rounded-full font-semibold
                        ${isSel ? 'bg-white/25 text-white' : hasNew ? 'bg-blue-500/25 text-blue-300' : 'bg-zinc-600/50 text-zinc-300'}`}>
                        {dayItems.length}
                      </span>
                    ) : isOff && !isSel ? (
                      <span className="w-1 h-1 rounded-full bg-zinc-600" />
                    ) : null}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-700 space-y-1.5 text-xs text-zinc-500">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0" />
                Серым — выходные дни
              </p>
              <p>Записей в месяце: {Object.entries(byDate).filter(([d]) => d.startsWith(`${calYear}-${pad(calMonth + 1)}`)).reduce((sum, [, v]) => sum + v.length, 0)}</p>
            </div>
          </div>

          {/* Day detail */}
          <div>
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-800/40 border border-zinc-700 rounded-sm">
                <CalendarBlank size={40} weight="thin" className="text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Выберите день в календаре</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <CalendarBlank size={16} className="text-[var(--color-accent)]" />
                  <span className="text-sm font-medium text-white">
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-xs text-zinc-500">— {dayBookings.length} {dayBookings.length === 1 ? 'запись' : 'записей'}</span>
                  {selectedDayOff && (
                    <span className="text-xs px-2 py-0.5 rounded-sm bg-red-500/10 border border-red-500/20 text-red-300">
                      Выходной{selectedDayOff.reason ? `: ${selectedDayOff.reason}` : ''}
                    </span>
                  )}
                </div>
                {dayBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-800/40 border border-zinc-700 rounded-sm">
                    <Clock size={32} weight="thin" className="text-zinc-700 mb-3" />
                    <p className="text-zinc-500 text-sm">В этот день записей нет</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence initial={false}>
                      {dayBookings.map((b, i) => (
                        <MyBookingCard key={b.id} booking={b} index={i} hideDate />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
