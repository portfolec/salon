import { useState } from 'react'
import { useData, type Booking } from '../../context/DataContext'
import { CalendarBlank, Phone, User, CheckCircle, XCircle, Clock } from '@phosphor-icons/react'

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

export default function AdminBookings() {
  const { bookings, updateBookingStatus } = useData()
  const [filter, setFilter] = useState<Booking['status'] | 'all'>('all')

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const counts = {
    all: bookings.length,
    new: bookings.filter(b => b.status === 'new').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    done: bookings.filter(b => b.status === 'done').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-1">Заявки на запись</h2>
        <p className="text-sm text-zinc-500">Всего заявок: {bookings.length}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'new', 'confirmed', 'done', 'cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors duration-150
              ${filter === f ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
            {f === 'all' ? 'Все' : STATUS_LABELS[f]} ({counts[f]})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarBlank size={48} weight="thin" className="text-zinc-700 mb-4" />
          <p className="text-zinc-500 text-sm">Заявок пока нет</p>
          <p className="text-zinc-600 text-xs mt-1">Они появятся здесь после отправки формы записи</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(booking => (
            <div key={booking.id} className="bg-zinc-800 border border-zinc-700 rounded-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-sm border font-medium ${STATUS_COLORS[booking.status]}`}>
                      {STATUS_LABELS[booking.status]}
                    </span>
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
                    <p className="mt-2 text-xs text-zinc-500 italic">"{booking.comment}"</p>
                  )}
                </div>

                {/* Status actions */}
                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                  {booking.status === 'new' && (
                    <button onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs font-medium rounded-sm hover:bg-emerald-600/30 transition-colors">
                      <CheckCircle size={14} />Подтвердить
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button onClick={() => updateBookingStatus(booking.id, 'done')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-600/20 text-zinc-400 border border-zinc-600/30 text-xs font-medium rounded-sm hover:bg-zinc-600/30 transition-colors">
                      <CheckCircle size={14} />Выполнена
                    </button>
                  )}
                  {booking.status !== 'cancelled' && booking.status !== 'done' && (
                    <button onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 text-xs font-medium rounded-sm hover:bg-red-600/30 transition-colors">
                      <XCircle size={14} />Отменить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
