'use client'
import { motion, useReducedMotion } from 'motion/react'
import { Star, Quotes } from '@phosphor-icons/react'
import { useData } from '../context/DataContext'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export default function Testimonials() {
  const reduce = useReducedMotion()
  const { testimonials } = useData()
  if (testimonials.length === 0) return null
  return (
    <section id="reviews" className="py-24 lg:py-32 bg-[var(--color-surface-elevated)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--color-ink)] leading-tight">
            Отзывы клиентов
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: reduce ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.07, ease: EASE_OUT }}
              className="bg-white p-8 flex flex-col relative overflow-hidden"
              style={{ borderRadius: 'var(--radius-card)' }}
            >
              <Quotes size={40} weight="fill" className="absolute top-5 right-6 text-[var(--color-surface-elevated)] pointer-events-none" />
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={14} weight="fill" className="text-[var(--color-accent)]" />
                ))}
              </div>
              <blockquote className="flex-1 text-[var(--color-ink)] leading-relaxed text-sm mb-6">
                "{t.text}"
              </blockquote>
              <div>
                <div className="font-medium text-sm text-[var(--color-ink)]">{t.name}</div>
                <div className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
