import { useState, useMemo, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { useData, type Booking } from '../../context/DataContext'
import { BookingRow } from './bookingShared'
import { CaretLeft, CaretRight, CalendarBlank, UsersThree } from '@phosphor-icons/react'

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

export default function AdminMasterCalendar({
  onEdit,
  onRepeat,
}: {
  onEdit?: (booking: Booking) => void
  onRepeat?: (booking: Booking) => void
}) {
  const { masters, bookings, updateBookingStatus, updateBookingMaster, deleteBooking } = useData()
  const today = new Date()

  const [masterId, setMasterId] = useState<string>('')
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(today.toLocaleDateString('en-CA'))
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [changingMasterId, setChangingMasterId] = useState<string | null>(null)

  // Default to the first master once masters load, so the view is useful immediately.
  useEffect(() => {
    if (!masterId && masters.length > 0) setMasterId(masters[0].id)
  }, [masters, masterId])

  const activeBookings = bookings.filter(b => b.status !== 'cancelled')
  const relevantBookings = masterId ? activeBookings.filter(b => b.masterId === masterId) : activeBookings

  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {}
    relevantBookings.forEach(b => {
      if (!map[b.date]) map[b.date] = []
      map[b.date].push(b)
    })
    return map
  }, [relevantBookings])

  const navMonth = (dir: number) => {
    let m = calMonth + dir
    let y = calYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setCalMonth(m)
    setCalYear(y)
  }

  const handleStatusChange = async (id: string, status: Booking['status']) => {
    setUpdatingId(id)
    try {
      await updateBookingStatus(id, status)
    } catch (e) {
      console.error('[AdminMasterCalendar] status update failed', e)
      alert('Не удалось обновить статус записи.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить запись клиента «${name}»? Это действие нельзя отменить.`)) return
    setDeletingId(id)
    try {
      await deleteBooking(id)
    } catch (e) {
      console.error('[AdminMasterCalendar] delete failed', e)
      alert('Не удалось удалить запись.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleChangeMaster = async (id: string, newMasterId: string | null) => {
    setChangingMasterId(id)
    try {
      await updateBookingMaster(id, newMasterId)
    } catch (e) {
      console.error('[AdminMasterCalendar] master change failed', e)
      alert(e instanceof Error ? e.message : 'Не удалось изменить мастера.')
    } finally {
      setChangingMasterId(null)
    }
  }

  const dayBookings = selectedDate
    ? (byDate[selectedDate] ?? []).slice().sort((a, b) => a.time.localeCompare(b.time))
    : []

  const selectedMaster = masters.find(m => m.id === masterId)
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-1">Расписание по мастеру</h3>
          <p className="text-xs text-zinc-500">Выберите мастера и день, чтобы увидеть его записи</p>
        </div>
        <div className="relative w-full sm:w-64">
          <UsersThree size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <select
            value={masterId}
            onChange={e => { setMasterId(e.target.value); }}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors appearance-none"
          >
            <option value="">Все мастера</option>
            {masters.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

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
              const dayItems = byDate[dateStr] ?? []
              const isSel = selectedDate === dateStr
              const hasNew = dayItems.some(b => b.status === 'new')
              return (
                <button key={idx}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative h-11 rounded-sm text-sm transition-colors duration-150 flex flex-col items-center justify-center gap-0.5
                    ${isSel ? 'bg-[var(--color-accent)] text-white font-medium' : 'hover:bg-zinc-700 text-zinc-200'}
                    ${isToday(day) && !isSel ? 'ring-1 ring-inset ring-[var(--color-accent)]/60' : ''}`}>
                  <span>{day}</span>
                  {dayItems.length > 0 && (
                    <span className={`text-[9px] leading-none px-1 rounded-full font-semibold
                      ${isSel ? 'bg-white/25 text-white' : hasNew ? 'bg-blue-500/25 text-blue-300' : 'bg-zinc-600/50 text-zinc-300'}`}>
                      {dayItems.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-700 text-xs text-zinc-500">
            {selectedMaster ? (
              <>Показаны записи мастера <span className="text-zinc-300">{selectedMaster.name}</span></>
            ) : (
              <>Показаны записи всех мастеров</>
            )}
            {' · '}всего в месяце: {Object.entries(byDate).filter(([d]) => d.startsWith(`${calYear}-${pad(calMonth + 1)}`)).reduce((sum, [, v]) => sum + v.length, 0)}
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
              <div className="mb-4 flex items-center gap-2">
                <CalendarBlank size={16} className="text-[var(--color-accent)]" />
                <span className="text-sm font-medium text-white">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <span className="text-xs text-zinc-500">— {dayBookings.length} {dayBookings.length === 1 ? 'запись' : 'записей'}</span>
              </div>
              {dayBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-800/40 border border-zinc-700 rounded-sm">
                  <p className="text-zinc-500 text-sm">В этот день записей нет</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {dayBookings.map(b => (
                      <BookingRow key={b.id} booking={b} hideDate
                        updatingId={updatingId} deletingId={deletingId}
                        onStatusChange={handleStatusChange} onDelete={handleDelete}
                        masters={masters} onChangeMaster={handleChangeMaster} changingMasterId={changingMasterId}
                        onEdit={onEdit} onRepeat={onRepeat} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
