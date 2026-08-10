import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useData, type Booking } from '../../context/DataContext'
import type { BookingSource } from '../../data'
import {
  CalendarBlank, Phone, User, CheckCircle, XCircle, Clock, Plus, Trash,
} from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const formMotion = {
  initial: { opacity: 0, height: 0, y: -8 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE_OUT },
}

const STATUS_LABELS: Record<Booking['status'], string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

const STATUS_COLORS: Record<Booking['status'], string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  done: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const SOURCE_LABELS: Record<BookingSource, string> = {
  website: 'Сайт',
  phone: 'Телефон',
  telegram: 'Telegram',
  instagram: 'Instagram',
  admin: 'Админ',
  other: 'Другое',
}

const inputCls = "w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors"

export default function AdminBookings() {
  const { bookings, updateBookingStatus, deleteBooking, addBooking, services, masters } = useData()
  const [filter, setFilter] = useState<Booking['status'] | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
  const [form, setForm] = useState({
    serviceId: '',
    masterId: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    comment: '',
    source: 'phone' as BookingSource,
  })

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const counts = {
    all: bookings.length,
    new: bookings.filter(b => b.status === 'new').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    done: bookings.filter(b => b.status === 'done').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  const resetForm = () => {
    setForm({
      serviceId: '',
      masterId: '',
      date: '',
      time: '',
      name: '',
      phone: '',
      comment: '',
      source: 'phone',
    })
  }

  const handleCreate = async () => {
    if (!form.serviceId || !form.date || !form.time || !form.name.trim() || form.phone.replace(/\D/g, '').length < 10) {
      return
    }
    setSaving(true)
    const svc = services.find(s => s.id === form.serviceId)
    const mstr = masters.find(m => m.id === form.masterId)
    const channelNote = `[${SOURCE_LABELS[form.source]}]`
    const comment = form.comment.trim()
      ? `${channelNote} ${form.comment.trim()}`
      : channelNote

    await addBooking({
      service: svc?.name ?? '',
      serviceId: form.serviceId,
      master: mstr?.name ?? null,
      masterId: form.masterId || undefined,
      date: form.date,
      time: form.time,
      name: form.name.trim(),
      phone: form.phone.trim(),
      comment,
      status: 'confirmed',
      source: form.source,
    })
    setSaving(false)
    setShowForm(false)
    resetForm()
  }

  const relevantMasters = form.serviceId
    ? masters.filter(m => m.services.includes(form.serviceId))
    : masters

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Заявки на запись</h2>
          <p className="text-sm text-zinc-500">Всего заявок: {bookings.length}. Записи с сайта и из админки сразу занимают слот в графике.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-colors shrink-0"
        >
          <motion.span animate={{ rotate: showForm ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus size={16} />
          </motion.span>
          {showForm ? 'Закрыть' : 'Добавить запись'}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
        <motion.div key="add-booking-form" style={{ overflow: 'hidden' }} {...formMotion}
          className="mb-8 bg-zinc-800 border border-zinc-700 rounded-sm p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Новая запись в график</h3>
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
                onChange={e => setForm(f => ({ ...f, serviceId: e.target.value, masterId: '' }))}
                className={inputCls}
              >
                <option value="">Выберите услугу</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Мастер</label>
              <select
                value={form.masterId}
                onChange={e => setForm(f => ({ ...f, masterId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Любой / не указан</option>
                {relevantMasters.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Дата</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Время</label>
              <input type="time" value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Имя клиента</label>
              <input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Имя" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Телефон</label>
              <input value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+7 ..." className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Комментарий</label>
              <input value={form.comment}
                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                placeholder="Пожелания..." className={inputCls} />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-sm hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить в график'}
          </button>
        </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'new', 'confirmed', 'done', 'cancelled'] as const).map(f => (
          <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}
            className={`relative px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors duration-150
              ${filter === f ? 'text-white border-[var(--color-accent)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
            {filter === f && (
              <motion.span layoutId="bookingFilterPill" className="absolute inset-0 bg-[var(--color-accent)] rounded-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
            )}
            {f === 'all' ? 'Все' : STATUS_LABELS[f]} ({counts[f]})
          </motion.button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarBlank size={48} weight="thin" className="text-zinc-700 mb-4" />
          <p className="text-zinc-500 text-sm">Заявок пока нет</p>
          <p className="text-zinc-600 text-xs mt-1">Они появятся здесь после отправки формы записи</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
          {filtered.map((booking, i) => (
            <motion.div key={booking.id} layout="position"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, delay: i * 0.03, ease: EASE_OUT }}
              whileHover={{ y: -1 }}
              className="bg-zinc-800 border border-zinc-700 rounded-sm p-5 transition-colors hover:border-zinc-600">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-sm border font-medium ${STATUS_COLORS[booking.status]}`}>
                      {STATUS_LABELS[booking.status]}
                    </span>
                    {booking.source && (
                      <span className="text-xs px-2 py-1 rounded-sm border border-zinc-600 text-zinc-400">
                        {SOURCE_LABELS[booking.source] ?? booking.source}
                      </span>
                    )}
                    <span className="text-xs text-zinc-500">
                      {new Date(booking.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <User size={14} className="text-zinc-500 shrink-0" />
                      <span className="font-medium">{booking.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Phone size={14} className="text-zinc-500 shrink-0" />
                      <a href={`tel:${booking.phone.replace(/\D/g,'')}`} className="hover:text-[var(--color-accent)] transition-colors">
                        {booking.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <CalendarBlank size={14} className="text-zinc-500 shrink-0" />
                      <span>{booking.date}, {booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Clock size={14} className="text-zinc-500 shrink-0" />
                      <span>{booking.service}{booking.master ? ` — ${booking.master}` : ''}</span>
                    </div>
                  </div>
                  {booking.comment && (
                    <p className="mt-2 text-xs text-zinc-500 italic">&ldquo;{booking.comment}&rdquo;</p>
                  )}
                </div>

                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                  {booking.status === 'new' && (
                    <button onClick={() => handleStatusChange(booking.id, 'confirmed')}
                      disabled={updatingId === booking.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs font-medium rounded-sm hover:bg-emerald-600/30 transition-colors disabled:opacity-50">
                      <CheckCircle size={14} />{updatingId === booking.id ? 'Сохранение...' : 'Подтвердить'}
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => handleStatusChange(booking.id, 'done')}
                      disabled={updatingId === booking.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-600/20 text-zinc-400 border border-zinc-600/30 text-xs font-medium rounded-sm hover:bg-zinc-600/30 transition-colors disabled:opacity-50">
                      <CheckCircle size={14} />{updatingId === booking.id ? 'Сохранение...' : 'Выполнена'}
                    </button>
                  )}
                  {booking.status !== 'cancelled' && booking.status !== 'done' && (
                    <button onClick={() => handleStatusChange(booking.id, 'cancelled')}
                      disabled={updatingId === booking.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-medium rounded-sm hover:bg-red-600/30 transition-colors disabled:opacity-50">
                      <XCircle size={14} />Отменить
                    </button>
                  )}
                  <button onClick={() => handleDelete(booking.id, booking.name)}
                    disabled={deletingId === booking.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700/40 text-zinc-400 border border-zinc-600/40 text-xs font-medium rounded-sm hover:bg-red-600/20 hover:text-red-400 hover:border-red-600/30 transition-colors disabled:opacity-50">
                    <Trash size={14} />{deletingId === booking.id ? 'Удаление...' : 'Удалить'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
