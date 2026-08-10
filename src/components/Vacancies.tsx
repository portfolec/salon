'use client'
import { motion, useReducedMotion } from 'motion/react'
import { Briefcase, ArrowRight } from '@phosphor-icons/react'
import { useData } from '../context/DataContext'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export default function Vacancies() {
  const { content, vacancies } = useData()
  const reduce = useReducedMotion()

  if (vacancies.length === 0) return null

  return (
    <section id="vacancies" className="py-24 lg:py-32 bg-[var(--color-surface-elevated)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          className="mb-14 max-w-2xl"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--color-ink)] leading-tight">
            Вакансии
          </h2>
          <p className="mt-4 text-[var(--color-ink-secondary)] text-sm leading-relaxed max-w-[48ch]">
            Ищем людей, которым близки сервис и аккуратность. Присоединяйтесь к команде Стильный Акцент.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {vacancies.map((v, i) => (
            <motion.article
              key={v.id}
              initial={{ opacity: 0, y: reduce ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.07, ease: EASE_OUT }}
              className="flex flex-col border-t border-[rgba(26,26,26,0.12)] pt-6"
            >
              <Briefcase size={22} weight="light" className="text-[var(--color-accent)] mb-4" />
              <h3 className="font-medium text-[var(--color-ink)] text-lg mb-2">{v.title}</h3>
              <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed mb-3">{v.description}</p>
              <p className="text-xs text-[var(--color-ink-tertiary)] leading-relaxed mb-6 flex-1">
                {v.requirements}
              </p>
              <a
                href={`tel:${content.phone.replace(/\D/g, '')}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-ink)] transition-colors"
              >
                Откликнуться
                <ArrowRight size={14} weight="bold" />
              </a>
            </motion.article>
          ))}
        </div>

        <p className="mt-12 text-sm text-[var(--color-ink-tertiary)]">
          Или напишите нам в{' '}
          <a href={content.telegramUrl} target="_blank" rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline">
            Telegram
          </a>
          {' '}с пометкой «Вакансия».
        </p>
      </div>
    </section>
  )
}
