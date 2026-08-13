import { motion } from 'motion/react'
import type { Booking } from '../../context/DataContext'
import { STATUS_LABELS, STATUS_COLORS, SOURCE_LABELS } from './bookingShared'
import { CalendarBlank, Phone, Scissors, ChatCircleDots } from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

/** Read-only booking card for the master's own personal cabinet — phone is already masked by the API. */
export function MyBookingCard({ booking: b, index = 0, hideDate }: { booking: Booking; index?: number; hideDate?: boolean }) {
  return (
    <motion.div layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: EASE_OUT }}
      className="bg-zinc-800 border border-zinc-700 rounded-sm p-5">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded-sm border font-medium ${STATUS_COLORS[b.status]}`}>
          {STATUS_LABELS[b.status]}
        </span>
        {b.source && (
          <span className="text-xs px-2 py-1 rounded-sm border border-zinc-600 text-zinc-400">
            {SOURCE_LABELS[b.source] ?? b.source}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {!hideDate ? (
          <div className="flex items-center gap-2 text-zinc-300">
            <CalendarBlank size={14} className="text-zinc-500 shrink-0" />
            <span>{b.date}, {b.time}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-zinc-300">
            <CalendarBlank size={14} className="text-zinc-500 shrink-0" />
            <span>{b.time}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-zinc-300">
          <Scissors size={14} className="text-zinc-500 shrink-0" />
          <span>{b.service}{b.variantName ? ` (${b.variantName})` : ''}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="font-medium">{b.name}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-300">
          <Phone size={14} className="text-zinc-500 shrink-0" />
          <span className="tracking-wide">{b.phone}</span>
        </div>
      </div>
      {b.comment && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-zinc-500 italic">
          <ChatCircleDots size={14} className="shrink-0 mt-0.5" />
          &ldquo;{b.comment}&rdquo;
        </p>
      )}
    </motion.div>
  )
}
