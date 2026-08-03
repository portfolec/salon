'use client'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from '@phosphor-icons/react'
import { useData } from '../context/DataContext'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

interface MastersProps {
  onBooking: (serviceId?: string) => void
}

export default function Masters({ onBooking }: MastersProps) {
  const { masters, services } = useData()
  const reduce = useReducedMotion()
  const getServiceNames = (ids: string[]) =>
    ids.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ')

  return (
    <section id="masters" className="py-24 lg:py-32 bg-[var(--color-surface-elevated)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--color-ink)] leading-tight">
            Мы в лицах
          </h2>
          <p className="text-[var(--color-ink-secondary)] max-w-[38ch] text-sm leading-relaxed">
            Команда, за которой стоит опыт, сервис и аккуратность в каждой детали.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {masters.map((master, i) => (
            <motion.div
              key={master.id}
              initial={{ opacity: 0, y: reduce ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : i * 0.07, ease: EASE_OUT }}
              whileTap={{ scale: 0.98 }}
              className="group cursor-pointer"
              onClick={() => onBooking(master.services[0])}
            >
              {/* Photo */}
              <div className="relative overflow-hidden aspect-[3/4] mb-4 bg-[var(--color-surface)]">
                <img
                  src={master.photo || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=480&h=640&fit=crop&q=80'}
                  alt={master.name}
                  className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  loading="lazy"
                  onError={e => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=480&h=640&fit=crop&q=80'
                  }}
                />
                <div className="absolute inset-0 bg-[var(--color-ink)] opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute inset-0 flex items-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-250 pointer-events-none">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-white text-sm font-medium">Записаться</span>
                    <div className="w-8 h-8 bg-white flex items-center justify-center shrink-0" style={{ borderRadius: '2px' }}>
                      <ArrowUpRight size={16} className="text-[var(--color-ink)]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div>
                <h3 className="font-medium text-[var(--color-ink)] text-base leading-snug group-hover:text-[var(--color-accent)] transition-colors duration-150">
                  {master.name}
                </h3>
                <p className="text-sm text-[var(--color-accent)] mt-0.5 font-medium">{master.role}</p>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[var(--color-ink-tertiary)] bg-[var(--color-surface)] px-2 py-0.5" style={{ borderRadius: '2px' }}>
                    {master.experience}
                  </span>
                  <span className="text-xs text-[var(--color-ink-tertiary)] truncate max-w-[120px]">
                    {getServiceNames(master.services)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
