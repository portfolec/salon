import { useState, type ReactNode } from 'react'
import type { Booking } from '../../context/DataContext'
import type { BookingSource } from '../../data'
import { Phone, User, UserCircle, CheckCircle, XCircle, Scissors, Trash, PencilSimple } from '@phosphor-icons/react'

export const STATUS_LABELS: Record<Booking['status'], string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  done: 'Выполнена',
  cancelled: 'Отменена',
}

export const STATUS_COLORS: Record<Booking['status'], string> = {
  new: 'bg-blue-600 text-white',
  confirmed: 'bg-emerald-600 text-white',
  done: 'bg-green-600 text-white',
  cancelled: 'bg-red-600 text-white',
}

export const SOURCE_LABELS: Record<BookingSource, string> = {
  website: 'Сайт',
  phone: 'Телефон',
  telegram: 'Telegram',
  instagram: 'Instagram',
  admin: 'Админ',
  other: 'Другое',
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-zinc-500 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 mb-0.5">{label}</p>
        <div className="text-sm text-zinc-100 leading-snug">{children}</div>
      </div>
    </div>
  )
}

function formatVisitDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
}

interface BookingRowProps {
  booking: Booking
  updatingId: string | null
  deletingId: string | null
  onStatusChange: (id: string, status: Booking['status']) => void
  onDelete: (id: string, name: string) => void
  hideDate?: boolean
  masters?: { id: string; name: string }[]
  onChangeMaster?: (id: string, masterId: string | null) => void
  changingMasterId?: string | null
}

export function BookingRow({
  booking, updatingId, deletingId, onStatusChange, onDelete, hideDate,
  masters, onChangeMaster, changingMasterId,
}: BookingRowProps) {
  const [editingMaster, setEditingMaster] = useState(false)

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-stretch">
        <div className="flex-1 min-w-0 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-sm font-medium ${STATUS_COLORS[booking.status]}`}>
                {STATUS_LABELS[booking.status]}
              </span>
              {booking.source && (
                <span className="text-xs text-zinc-500">
                  {SOURCE_LABELS[booking.source] ?? booking.source}
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-600 shrink-0">
              {new Date(booking.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-end gap-3 mb-4">
            <p className="text-2xl font-semibold text-white tabular-nums leading-none tracking-tight">
              {booking.time}
            </p>
            {!hideDate && (
              <p className="text-sm text-zinc-400 pb-0.5 capitalize">
                {formatVisitDate(booking.date)}
              </p>
            )}
          </div>

          <div className="mb-4">
            {editingMaster && onChangeMaster ? (
              <select
                autoFocus
                defaultValue={booking.masterId ?? ''}
                disabled={changingMasterId === booking.id}
                onChange={e => { onChangeMaster(booking.id, e.target.value || null); setEditingMaster(false) }}
                onBlur={() => setEditingMaster(false)}
                className="bg-zinc-900 border border-[var(--color-accent)] text-white text-sm rounded-sm px-2.5 py-1.5 focus:outline-none max-w-full">
                <option value="">Не назначен</option>
                {(masters ?? []).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            ) : (
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-semibold max-w-full
                ${booking.master
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-amber-500 text-zinc-950'}`}>
                <UserCircle size={16} weight="fill" className="shrink-0" />
                <span className="truncate">
                  {changingMasterId === booking.id
                    ? 'Сохранение...'
                    : booking.master
                      ? `Мастер ${booking.master}`
                      : 'Мастер не назначен'}
                </span>
                {onChangeMaster && changingMasterId !== booking.id && (
                  <button onClick={() => setEditingMaster(true)}
                    className="ml-0.5 shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                    title="Изменить мастера">
                    <PencilSimple size={13} />
                  </button>
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-zinc-700/80">
            <Field label="Клиент" icon={<User size={14} />}>
              <span className="font-medium">{booking.name}</span>
            </Field>
            <Field label="Телефон" icon={<Phone size={14} />}>
              <a href={`tel:${booking.phone.replace(/\D/g, '')}`} className="hover:text-[var(--color-accent)] transition-colors">
                {booking.phone}
              </a>
            </Field>
            <Field label="Услуга" icon={<Scissors size={14} />}>
              {booking.service}{booking.variantName ? ` · ${booking.variantName}` : ''}
            </Field>
          </div>

          {booking.comment && (
            <p className="mt-4 pt-3 border-t border-zinc-700/80 text-xs text-zinc-400 leading-relaxed">
              {booking.comment}
            </p>
          )}
        </div>

        <div className="flex flex-row sm:flex-col gap-2 p-4 sm:p-5 sm:pl-4 sm:w-40 shrink-0 sm:border-l border-t sm:border-t-0 border-zinc-700 bg-zinc-800/80">
          {booking.status === 'new' && (
            <button onClick={() => onStatusChange(booking.id, 'confirmed')}
              disabled={updatingId === booking.id}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-sm hover:bg-emerald-500 transition-colors disabled:opacity-50">
              <CheckCircle size={14} />{updatingId === booking.id ? 'Сохранение...' : 'Подтвердить'}
            </button>
          )}
          {booking.status === 'confirmed' && (
            <button onClick={() => onStatusChange(booking.id, 'done')}
              disabled={updatingId === booking.id}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-sm hover:bg-green-500 transition-colors disabled:opacity-50">
              <CheckCircle size={14} />{updatingId === booking.id ? 'Сохранение...' : 'Выполнена'}
            </button>
          )}
          {booking.status !== 'cancelled' && booking.status !== 'done' && (
            <button onClick={() => onStatusChange(booking.id, 'cancelled')}
              disabled={updatingId === booking.id}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-medium rounded-sm hover:bg-red-500 transition-colors disabled:opacity-50">
              <XCircle size={14} />Отменить
            </button>
          )}
          <button onClick={() => onDelete(booking.id, booking.name)}
            disabled={deletingId === booking.id}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-600 text-white text-xs font-medium rounded-sm hover:bg-red-600 transition-colors disabled:opacity-50">
            <Trash size={14} />{deletingId === booking.id ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}
