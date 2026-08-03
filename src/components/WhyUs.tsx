'use client'
import { motion, useReducedMotion } from 'motion/react'
import { Handshake, Sparkle, UserCircle, Clock } from '@phosphor-icons/react'
import { reasons } from '../data'

const icons = [Handshake, Sparkle, UserCircle, Clock]
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

export default function WhyUs() {
  const reduce = useReducedMotion()
  return (
    <section id="why-us" className="py-24 lg:py-32 bg-[var(--color-ink)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, x: reduce ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.65, ease: EASE_OUT }}
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
              Почему выбирают<br />
              <em className="not-italic text-[var(--color-accent-light)]">Стильный Акцент</em>
            </h2>
            <p className="mt-6 text-[rgba(255,255,255,0.6)] leading-relaxed max-w-[45ch]">
              Наши ценности - сервис и аккуратность. Создаём пространство, где клиент чувствует себя в надёжных руках.
            </p>
            <div className="mt-10 overflow-hidden">
              <img
                src="/products.jpeg"
                alt="Работа мастера в Стильный Акцент"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Right — reason cards, stagger 60ms */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {reasons.map((r, i) => {
              const Icon = icons[i]
              const borderClasses = [
                i % 2 === 0 ? 'sm:border-r' : '',
                i < 2 ? 'border-b' : '',
              ].join(' ')
              return (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.06, ease: EASE_OUT }}
                  className={`bg-[var(--color-ink)] p-8 hover:bg-[rgba(139,107,74,0.12)] transition-colors duration-200 border-[rgba(255,255,255,0.06)] ${borderClasses}`}
                >
                  <Icon size={26} weight="light" className="text-[var(--color-accent-light)] mb-5" />
                  <h3 className="font-medium text-white text-base mb-2">{r.title}</h3>
                  <p className="text-sm text-[rgba(255,255,255,0.5)] leading-relaxed">{r.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
