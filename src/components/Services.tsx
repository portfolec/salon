'use client'
import { motion, useReducedMotion } from 'motion/react'
import {
  Scissors, HandPalm, Sparkle, Eye, Star, Leaf,
  Lightning, Drop, ArrowUpRight,
} from '@phosphor-icons/react'
import { useData } from '../context/DataContext'

interface ServicesProps {
  onBooking: (serviceId?: string) => void
}

const iconById: Record<string, React.ElementType> = {
  hairdresser: Scissors,
  manicure: HandPalm,
  pedicure: Sparkle,
  lashes: Eye,
  brows: Star,
  massage: Leaf,
  laser: Lightning,
  epilation: Drop,
}

const iconByName: Record<string, React.ElementType> = {
  'Парикмахер': Scissors,
  'Маникюр': HandPalm,
  'Педикюр': Sparkle,
  'Ресницы': Eye,
  'Брови': Star,
  'Массаж': Leaf,
  'Лазерная эпиляция': Lightning,
  'Обычная эпиляция': Drop,
}

function getIcon(id: string, name: string): React.ElementType {
  return iconById[id] ?? iconByName[name] ?? Scissors
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export default function Services({ onBooking }: ServicesProps) {
  const { services } = useData()
  const reduce = useReducedMotion()
  return (
    <section id="services" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--color-ink)] leading-tight">
            Услуги и цены
          </h2>
          <button
            onClick={() => onBooking()}
            className="self-start md:self-auto inline-flex items-center gap-2 px-7 py-3.5 bg-[var(--color-ink)] text-white text-sm font-medium tracking-wide hover:bg-[var(--color-accent)] active:scale-[0.98] transition-all duration-200"
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            Записаться
            <ArrowUpRight size={16} />
          </button>
        </div>

        {/* Services list */}
        <div className="border-t border-[rgba(26,26,26,0.1)]">
          {services.map((svc, i) => {
            const Icon = getIcon(svc.id, svc.name)
            return (
              <motion.button
                key={svc.id}
                onClick={() => onBooking(svc.id)}
                className="group w-full text-left"
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.05, ease: EASE_OUT }}
                whileTap={{ scale: 0.995 }}
              >
                <div className="flex items-center gap-5 py-6 border-b border-[rgba(26,26,26,0.1)] hover:bg-[var(--color-surface-elevated)] transition-colors duration-200 px-4 -mx-4 rounded-sm">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 flex items-center justify-center bg-[var(--color-surface-elevated)] group-hover:bg-[var(--color-accent)] transition-colors duration-200 shrink-0"
                    style={{ borderRadius: '2px' }}
                  >
                    <Icon
                      size={20}
                      weight="light"
                      className="text-[var(--color-accent)] group-hover:text-white transition-colors duration-200"
                    />
                  </div>

                  {/* Name + description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="font-display text-xl md:text-2xl text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors duration-200 leading-tight">
                        {svc.name}
                      </span>
                      <span className="text-xs text-[var(--color-ink-tertiary)]">{svc.duration}</span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-ink-secondary)] leading-relaxed">{svc.description}</p>
                  </div>

                  {/* Price + arrow */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="block text-xs text-[var(--color-ink-tertiary)]">от</span>
                      <span className="block text-lg font-medium text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors duration-200">
                        {svc.priceFrom.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <ArrowUpRight
                      size={20}
                      className="text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-accent)] opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-200"
                    />
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

      </div>
    </section>
  )
}
