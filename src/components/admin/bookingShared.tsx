import { useState } from 'react'
import { motion } from 'motion/react'
import type { Booking } from '../../context/DataContext'
import type { BookingSource } from '../../data'
import { Phone, User, UserCircle, CheckCircle, XCircle, Scissors, CalendarBlank, Trash, PencilSimple } from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export const STATUS_LABELS: Record<Booking['status'], string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export const STATUS_COLORS: Record<Booking['status'], string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  done: 'bg-green-600/15 text-green-400 border-green-600/25',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
}

export const SOURCE_LABELS: Record<BookingSource, string> = {
  website: 'Сайт',
  phone: 'Телефон',
  telegram: 'Telegram',
  instagram: 'Instagram',
  admin: 'Админ',
  other: 'Другое',
}

interface BookingRowProps {
  booking: Booking
  index?: number
  updatingId: string | null
  deletingId: string | null
  onStatusChange: (id: string, status: Booking['status']) => void
  onDelete: (id: string, name: string) => void
  /** Hide the date in the details grid — useful when already grouped by day. */
  hideDate?: boolean
  /** List of masters to pick from when reassigning a booking. Omit to hide the "change master" control. */
  masters?: { id: string; name: string }[]
  onChangeMaster?: (id: string, masterId: string | null) => void
  changingMasterId?: string | null
}

export function BookingRow({
  booking, index = 0, updatingId, deletingId, onStatusChange, onDelete, hideDate,
  masters, onChangeMaster, changingMasterId,
}: BookingRowProps) {
  const [editingMaster, setEditingMaster] = useState(false)
  return (
    <motion.div layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: EASE_OUT }}
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
              <a href={`tel:${booking.phone.replace(/\D/g, '')}`} className="hover:text-[var(--color-accent)] transition-colors">
                {booking.phone}
              </a>
            </div>
            {!hideDate && (
              <div className="flex items-center gap-2 text-zinc-300">
                <CalendarBlank size={14} className="text-zinc-500 shrink-0" />
                <span>{booking.date}, {booking.time}</span>
              </div>
            )}
            {hideDate && (
              <div className="flex items-center gap-2 text-zinc-300">
                <CalendarBlank size={14} className="text-zinc-500 shrink-0" />
                <span>{booking.time}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-300 min-w-0">
              <UserCircle size={14} className="text-zinc-500 shrink-0" />
              {editingMaster && onChangeMaster ? (
                <select
                  autoFocus
                  defaultValue={booking.masterId ?? ''}
                  disabled={changingMasterId === booking.id}
                  onChange={e => { onChangeMaster(booking.id, e.target.value || null); setEditingMaster(false) }}
                  onBlur={() => setEditingMaster(false)}
                  className="bg-zinc-900 border border-zinc-600 text-zinc-100 text-sm rounded-sm px-2 py-1 focus:outline-none focus:border-[var(--color-accent)] max-w-full">
                  <option value="">Не назначен</option>
                  {(masters ?? []).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <>
                  <span className={booking.master ? 'font-medium truncate' : 'text-amber-400/80 italic'}>
                    {changingMasterId === booking.id ? 'Сохранение...' : (booking.master || 'Автоназначение не удалось')}
                  </span>
                  {onChangeMaster && changingMasterId !== booking.id && (
                    <button onClick={() => setEditingMaster(true)}
                      className="text-zinc-500 hover:text-[var(--color-accent)] transition-colors shrink-0" title="Изменить мастера">
                      <PencilSimple size={13} />
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <Scissors size={14} className="text-zinc-500 shrink-0" />
              <span>
                {booking.service}{booking.variantName ? ` (${booking.variantName})` : ''}
              </span>
            </div>
          </div>
          {booking.comment && (
            <p className="mt-2 text-xs text-zinc-500 italic">&ldquo;{booking.comment}&rdquo;</p>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
          {booking.status === 'new' && (
            <button onClick={() => onStatusChange(booking.id, 'confirmed')}
              disabled={updatingId === booking.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs font-medium rounded-sm hover:bg-emerald-600/30 transition-colors disabled:opacity-50">
              <CheckCircle size={14} />{updatingId === booking.id ? 'Сохранение...' : 'Подтвердить'}
            </button>
          )}
          {booking.status === 'confirmed' && (
            <button onClick={() => onStatusChange(booking.id, 'done')}
              disabled={updatingId === booking.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-600/30 text-xs font-medium rounded-sm hover:bg-green-600/30 transition-colors disabled:opacity-50">
              <CheckCircle size={14} />{updatingId === booking.id ? 'Сохранение...' : 'Выполнена'}
            </button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'done' && (
            <button onClick={() => onStatusChange(booking.id, 'cancelled')}
              disabled={updatingId === booking.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-medium rounded-sm hover:bg-red-600/30 transition-colors disabled:opacity-50">
              <XCircle size={14} />Отменить
            </button>
          )}
          <button onClick={() => onDelete(booking.id, booking.name)}
            disabled={deletingId === booking.id}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700/40 text-zinc-400 border border-zinc-600/40 text-xs font-medium rounded-sm hover:bg-red-600/20 hover:text-red-400 hover:border-red-600/30 transition-colors disabled:opacity-50">
            <Trash size={14} />{deletingId === booking.id ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
