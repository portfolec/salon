import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useData, type Booking } from '../../context/DataContext'
import type { BookingSource, TimeSlot } from '../../data'
import * as api from '../../lib/api'
import { STATUS_LABELS, SOURCE_LABELS, BookingRow } from './bookingShared'
import AdminMasterCalendar from './AdminMasterCalendar'
import {
  CalendarBlank, Plus, CaretLeft, CaretRight, ListBullets, UsersThree, X,
} from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const formMotion = {
  initial: { opacity: 0, height: 0, y: -8 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE_OUT },
}

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

function bookingStamp(b: Booking) {
  return `${String(b.date).slice(0, 10)}T${String(b.time).slice(0, 5)}`
}

function formatDayHeading(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const EMPTY_FORM = {
  serviceId: '',
  variantName: '',
  masterId: '',
  date: '',
  time: '',
  name: '',
  phone: '',
  comment: '',
  source: 'phone' as BookingSource,
}

function stripChannelPrefix(comment: string) {
  return comment.replace(/^\[[^\]]+\]\s*/, '').trim()
}

const inputCls = "w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors"

export default function AdminBookings() {
  const { bookings, updateBookingStatus, updateBookingMaster, updateBooking, deleteBooking, addBooking, services, masters } = useData()
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<Booking['status'] | 'all'>('all')
  const [filterDate, setFilterDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [formNotice, setFormNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [changingMasterId, setChangingMasterId] = useState<string | null>(null)

  // ── availability-driven date/time picker for the manual "add booking" form ──
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [listYear, setListYear] = useState(today.getFullYear())
  const [listMonth, setListMonth] = useState(today.getMonth())
  const [availDays, setAvailDays] = useState<Set<number>>(new Set())
  const [daysLoading, setDaysLoading] = useState(false)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const handleStatusChange = async (id: string, status: Booking['status']) => {
    setUpdatingId(id)
    try {
      await updateBookingStatus(id, status)
    } catch (e) {
      console.error('[AdminBookings] status update failed', e)
      alert('Не удалось обновить статус записи. Проверьте подключение и попробуйте снова.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleChangeMaster = async (id: string, masterId: string | null) => {
    setChangingMasterId(id)
    try {
      await updateBookingMaster(id, masterId)
    } catch (e) {
      console.error('[AdminBookings] master change failed', e)
      alert(e instanceof Error ? e.message : 'Не удалось изменить мастера. Проверьте подключение и попробуйте снова.')
    } finally {
      setChangingMasterId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить запись клиента «${name}»? Это действие нельзя отменить.`)) return
    setDeletingId(id)
    try {
      await deleteBooking(id)
    } catch (e) {
      console.error('[AdminBookings] delete failed', e)
      alert('Не удалось удалить запись. Проверьте подключение и попробуйте снова.')
    } finally {
      setDeletingId(null)
    }
  }
  const [form, setForm] = useState(EMPTY_FORM)

  const bookingsOnDate = useMemo(
    () => filterDate ? bookings.filter(b => b.date === filterDate) : bookings,
    [bookings, filterDate],
  )

  const countByDate = useMemo(() => {
    const map: Record<string, number> = {}
    bookings.forEach(b => { map[b.date] = (map[b.date] ?? 0) + 1 })
    return map
  }, [bookings])

  const filtered = useMemo(() => {
    const list = filter === 'all' ? bookingsOnDate : bookingsOnDate.filter(b => b.status === filter)
    return list.slice().sort((a, b) => bookingStamp(b).localeCompare(bookingStamp(a)))
  }, [bookingsOnDate, filter])

  const grouped = useMemo(() => {
    const groups: { date: string; items: Booking[] }[] = []
    for (const b of filtered) {
      const date = String(b.date).slice(0, 10)
      const last = groups[groups.length - 1]
      if (last?.date === date) last.items.push(b)
      else groups.push({ date, items: [b] })
    }
    return groups
  }, [filtered])

  const counts = {
    all: bookingsOnDate.length,
    new: bookingsOnDate.filter(b => b.status === 'new').length,
    confirmed: bookingsOnDate.filter(b => b.status === 'confirmed').length,
    done: bookingsOnDate.filter(b => b.status === 'done').length,
    cancelled: bookingsOnDate.filter(b => b.status === 'cancelled').length,
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError(null)
    setFormNotice(null)
    setAvailDays(new Set())
    setTimeSlots([])
  }

  const openForm = () => {
    setShowForm(true)
    window.setTimeout(() => {
      document.getElementById('admin-booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const fillFromBooking = (b: Booking, { keepSlot }: { keepSlot: boolean }) => {
    const date = String(b.date).slice(0, 10)
    setForm({
      serviceId: b.serviceId || services.find(s => s.name === b.service)?.id || '',
      variantName: b.variantName ?? '',
      masterId: b.masterId ?? '',
      date: keepSlot ? date : '',
      time: keepSlot ? String(b.time).slice(0, 5) : '',
      name: b.name,
      phone: b.phone,
      comment: stripChannelPrefix(b.comment ?? ''),
      source: b.source && b.source !== 'website' ? b.source : 'phone',
    })
    if (keepSlot && date) {
      const [y, m] = date.split('-').map(Number)
      if (y && m) { setCalYear(y); setCalMonth(m - 1) }
    }
    setFormError(null)
    setShowForm(true)
    openForm()
  }

  const handleEdit = (b: Booking) => {
    setEditingId(b.id)
    setFormNotice(null)
    fillFromBooking(b, { keepSlot: true })
  }

  const handleRepeat = (b: Booking) => {
    setEditingId(null)
    setFormNotice('Данные клиента скопированы — выберите новую дату и время')
    fillFromBooking(b, { keepSlot: false })
  }

  const selectedService = services.find(s => s.id === form.serviceId)
  const selectedVariant = selectedService?.variants?.find(v => v.name === form.variantName)

  // Load which days have free slots for the chosen service/master.
  useEffect(() => {
    if (!form.serviceId) { setAvailDays(new Set()); return }
    setDaysLoading(true)
    api.getAvailableDays(form.masterId || null, form.serviceId, masters, calYear, calMonth, selectedVariant?.id)
      .then(setAvailDays)
      .catch(() => setAvailDays(new Set()))
      .finally(() => setDaysLoading(false))
  }, [form.serviceId, form.masterId, form.variantName, calYear, calMonth, masters, selectedVariant?.id])

  // Load free time slots for the chosen day.
  useEffect(() => {
    if (!form.serviceId || !form.date) { setTimeSlots([]); return }
    setSlotsLoading(true)
    const dateObj = new Date(`${form.date}T00:00:00`)
    api.getTimeSlots(form.masterId || null, form.serviceId, masters, services, dateObj, selectedVariant?.id, editingId)
      .then(setTimeSlots)
      .catch(() => setTimeSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [form.serviceId, form.masterId, form.date, form.variantName, masters, services, selectedVariant?.id, editingId])

  const navFormMonth = (dir: number) => {
    let m = calMonth + dir
    let y = calYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setCalMonth(m)
    setCalYear(y)
  }

  const navListMonth = (dir: number) => {
    let m = listMonth + dir
    let y = listYear
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setListMonth(m)
    setListYear(y)
  }

  const handleSave = async () => {
    if (!form.serviceId || !form.date || !form.time || !form.name.trim()) {
      setFormError('Нужны услуга, имя клиента, дата и время. Телефон можно не заполнять.')
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      const svc = services.find(s => s.id === form.serviceId)
      const mstr = masters.find(m => m.id === form.masterId)
      const channelNote = `[${SOURCE_LABELS[form.source]}]`
      const comment = form.comment.trim()
        ? (editingId ? form.comment.trim() : `${channelNote} ${form.comment.trim()}`)
        : (editingId ? form.comment.trim() : channelNote)

      const payload = {
        service: svc?.name ?? '',
        serviceId: form.serviceId,
        variantName: form.variantName || null,
        master: mstr?.name ?? null,
        masterId: form.masterId || undefined,
        date: form.date,
        time: form.time,
        name: form.name.trim(),
        phone: form.phone.trim(),
        comment,
        status: (editingId
          ? (bookings.find(b => b.id === editingId)?.status ?? 'confirmed')
          : 'confirmed') as Booking['status'],
        source: form.source,
      }

      if (editingId) await updateBooking(editingId, payload)
      else await addBooking(payload)
      setShowForm(false)
      resetForm()
    } catch (e) {
      console.error('[AdminBookings] save failed', e)
      setFormError(e instanceof Error ? e.message : 'Не удалось сохранить запись.')
    } finally {
      setSaving(false)
    }
  }

  const relevantMasters = form.serviceId
    ? masters.filter(m => m.services.includes(form.serviceId))
    : masters

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Заявки на запись</h2>
          <p className="text-sm text-zinc-500">Всего заявок: {bookings.length}. Записи с сайта и из админки сразу занимают слот в графике.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (showForm) { setShowForm(false); resetForm() }
            else { resetForm(); openForm() }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-colors shrink-0"
        >
          <motion.span animate={{ rotate: showForm ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={16} />
          </motion.span>
          {showForm ? 'Закрыть' : 'Добавить запись'}
        </motion.button>
      </div>

      <div className="flex gap-2 mb-6">
        {([
          { id: 'list', label: 'Список заявок', Icon: ListBullets },
          { id: 'calendar', label: 'По мастерам', Icon: UsersThree },
        ] as const).map(({ id, label, Icon }) => (
          <motion.button key={id} whileTap={{ scale: 0.96 }} onClick={() => setView(id)}
            className={`relative overflow-hidden flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-sm border transition-colors duration-150
              ${view === id ? 'text-white border-[var(--color-accent)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
            {view === id && (
              <motion.span layoutId="bookingViewPill" className="absolute inset-0 bg-[var(--color-accent)] rounded-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            )}
            <Icon size={14} weight={view === id ? 'fill' : 'regular'} className="relative z-10" />
            <span className="relative z-10">{label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
        <motion.div id="admin-booking-form" key="add-booking-form" style={{ overflow: 'hidden' }} {...formMotion}
          className="mb-8 bg-zinc-800 border border-zinc-700 rounded-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
            {editingId ? 'Редактирование записи' : 'Новая запись в график'}
          </h3>
          {formNotice && (
            <p className="text-sm text-emerald-300 bg-emerald-950 border border-emerald-800 rounded-sm px-3 py-2">{formNotice}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Канал</label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value as BookingSource }))}
                className={inputCls}
              >
                {(['phone', 'telegram', 'instagram', 'admin', 'other'] as BookingSource[]).map(s => (
                  <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Услуга</label>
              <select
                value={form.serviceId}
                onChange={e => setForm(f => ({ ...f, serviceId: e.target.value, variantName: '', masterId: '', date: '', time: '' }))}
                className={inputCls}
              >
                <option value="">Выберите услугу</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            {!!selectedService?.variants?.length && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Вид услуги</label>
                <select
                  value={form.variantName}
                  onChange={e => setForm(f => ({ ...f, variantName: e.target.value, date: '', time: '' }))}
                  className={inputCls}
                >
                  <option value="">Не указан</option>
                  {selectedService.variants!.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Мастер</label>
              <select
                value={form.masterId}
                onChange={e => setForm(f => ({ ...f, masterId: e.target.value, date: '', time: '' }))}
                className={inputCls}
              >
                <option value="">Любой / не указан</option>
                {relevantMasters.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Имя клиента</label>
              <input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Имя" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Телефон <span className="text-zinc-600 normal-case tracking-normal">(необязательно)</span></label>
              <input value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="Можно оставить пустым" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Комментарий</label>
              <input value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Пожелания..." className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Дата и время</label>
            {!form.serviceId ? (
              <p className="text-xs text-zinc-600 py-3 px-1">Сначала выберите услугу — здесь появится свободное время выбранного мастера.</p>
            ) : (
              <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => navFormMonth(-1)} className="p-1 text-zinc-400 hover:text-white transition-colors">
                    <CaretLeft size={14} />
                  </button>
                  <span className="text-xs font-medium text-white">{MONTHS_RU[calMonth]} {calYear}</span>
                  <button type="button" onClick={() => navFormMonth(1)} className="p-1 text-zinc-400 hover:text-white transition-colors">
                    <CaretRight size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAYS_RU.map(d => (
                    <div key={d} className="text-center text-[9px] text-zinc-600 py-1">{d}</div>
                  ))}
                </div>
                <div className={`grid grid-cols-7 gap-1 mb-4 transition-opacity ${daysLoading ? 'opacity-50' : ''}`}>
                  {buildCalendarGrid(calYear, calMonth).map((day, idx) => {
                    if (!day) return <div key={idx} />
                    const dateStr = `${calYear}-${pad(calMonth + 1)}-${pad(day)}`
                    const isAvail = availDays.has(day) || form.date === dateStr
                    const isSel = form.date === dateStr
                    return (
                      <button type="button" key={idx} disabled={!isAvail}
                        onClick={() => setForm(f => ({ ...f, date: dateStr, time: '' }))}
                        className={`h-7 text-xs rounded-sm transition-colors duration-150
                          ${isSel ? 'bg-[var(--color-accent)] text-white font-medium' : ''}
                          ${!isSel && isAvail ? 'hover:bg-zinc-800 text-white' : ''}
                          ${!isAvail ? 'text-zinc-700 cursor-not-allowed' : ''}`}>
                        {day}
                      </button>
                    )
                  })}
                </div>
                {form.date && (
                  <div>
                    {slotsLoading ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-8 rounded-sm bg-zinc-800 animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      (() => {
                        const current = form.time.slice(0, 5)
                        const slots = timeSlots.map(s => ({
                          ...s,
                          time: s.time.slice(0, 5),
                          available: s.available || s.time.slice(0, 5) === current,
                        }))
                        if (current && !slots.some(s => s.time === current)) {
                          slots.unshift({ time: current, available: true })
                        }
                        if (slots.length === 0) {
                          return <p className="text-xs text-zinc-600 py-1">Нет свободных слотов на этот день</p>
                        }
                        return (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                            {slots.map(slot => (
                              <button type="button" key={slot.time} disabled={!slot.available}
                                onClick={() => slot.available && setForm(f => ({ ...f, time: slot.time }))}
                                className={`py-1.5 text-xs rounded-sm border transition-colors duration-150
                                  ${form.time === slot.time ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white font-medium' : ''}
                                  ${slot.available && form.time !== slot.time ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500' : ''}
                                  ${!slot.available ? 'border-zinc-800 text-zinc-700 line-through cursor-not-allowed' : ''}`}>
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        )
                      })()
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {formError && (
            <p className="text-sm text-red-300">{formError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Сохранить в график'}
          </button>
        </motion.div>
        )}
      </AnimatePresence>

      {view === 'calendar' ? (
        <AdminMasterCalendar onEdit={handleEdit} onRepeat={handleRepeat} />
      ) : (
        <>
          <div className="grid lg:grid-cols-[280px_1fr] gap-6 mb-6">
            <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-4 h-fit">
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => navListMonth(-1)} className="p-1 text-zinc-400 hover:text-white transition-colors">
                  <CaretLeft size={14} />
                </button>
                <span className="text-xs font-medium text-white">{MONTHS_RU[listMonth]} {listYear}</span>
                <button type="button" onClick={() => navListMonth(1)} className="p-1 text-zinc-400 hover:text-white transition-colors">
                  <CaretRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS_RU.map(d => (
                  <div key={d} className="text-center text-[9px] text-zinc-600 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {buildCalendarGrid(listYear, listMonth).map((day, idx) => {
                  if (!day) return <div key={idx} />
                  const dateStr = `${listYear}-${pad(listMonth + 1)}-${pad(day)}`
                  const count = countByDate[dateStr] ?? 0
                  const isSel = filterDate === dateStr
                  const isToday = today.getDate() === day && today.getMonth() === listMonth && today.getFullYear() === listYear
                  return (
                    <button type="button" key={idx}
                      onClick={() => setFilterDate(isSel ? null : dateStr)}
                      className={`relative h-9 rounded-sm text-xs transition-colors duration-150 flex flex-col items-center justify-center gap-0.5
                        ${isSel ? 'bg-[var(--color-accent)] text-white font-medium' : 'hover:bg-zinc-700 text-zinc-200'}
                        ${isToday && !isSel ? 'ring-1 ring-inset ring-[var(--color-accent)]/60' : ''}`}>
                      <span>{day}</span>
                      {count > 0 && (
                        <span className={`text-[9px] leading-none px-1 rounded-full font-semibold
                          ${isSel ? 'bg-white/25 text-white' : 'bg-zinc-600/50 text-zinc-300'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-700 flex items-center justify-between gap-2">
                <p className="text-[11px] text-zinc-500 leading-snug">
                  {filterDate
                    ? new Date(filterDate + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'Все дни'}
                </p>
                {filterDate && (
                  <button type="button" onClick={() => setFilterDate(null)}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors shrink-0">
                    <X size={12} />Все дни
                  </button>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {(['all', 'new', 'confirmed', 'done', 'cancelled'] as const).map(f => (
                  <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}
                    className={`relative overflow-hidden px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors duration-150
                      ${filter === f ? 'text-white border-[var(--color-accent)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
                    {filter === f && (
                      <motion.span layoutId="bookingFilterPill" className="absolute inset-0 bg-[var(--color-accent)] rounded-sm"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                    )}
                    <span className="relative z-10">{f === 'all' ? 'Все' : STATUS_LABELS[f]} ({counts[f]})</span>
                  </motion.button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center bg-zinc-800/40 border border-zinc-700 rounded-sm">
                  <CalendarBlank size={40} weight="thin" className="text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm">
                    {filterDate ? 'На этот день записей нет' : 'Заявок пока нет'}
                  </p>
                  {!filterDate && (
                    <p className="text-zinc-600 text-xs mt-1">Они появятся здесь после отправки формы записи</p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={filterDate ?? 'all'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  className="space-y-6"
                >
                  {grouped.map(group => (
                    <section key={group.date}>
                      {!filterDate && (
                        <h3 className="text-sm font-medium text-zinc-300 capitalize mb-3">
                          {formatDayHeading(group.date)}
                          <span className="ml-2 text-xs font-normal text-zinc-600">{group.items.length}</span>
                        </h3>
                      )}
                      <div className="space-y-3">
                        {group.items.map(booking => (
                          <BookingRow key={booking.id} booking={booking}
                            hideDate
                            updatingId={updatingId} deletingId={deletingId}
                            onStatusChange={handleStatusChange} onDelete={handleDelete}
                            masters={masters} onChangeMaster={handleChangeMaster} changingMasterId={changingMasterId}
                            onEdit={handleEdit} onRepeat={handleRepeat} />
                        ))}
                      </div>
                    </section>
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
