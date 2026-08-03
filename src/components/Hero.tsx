'use client'
import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { useData } from '../context/DataContext'

// Emil: ease-out curve for entering elements
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

interface HeroProps {
  onBooking: () => void
}

export default function Hero({ onBooking }: HeroProps) {
  const { content } = useData()
  const reduce = useReducedMotion()
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0.01 : 0.75, ease: EASE_OUT, delay: reduce ? 0 : delay },
  })

  const zoomBg = !reduce && isDesktop

  return (
    <section className="relative min-h-[100dvh] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={zoomBg ? { scale: 1.06 } : false}
        animate={{ scale: 1 }}
        transition={zoomBg ? { duration: 2.0, ease: EASE_OUT } : { duration: 0 }}
      >
        <img
          src="/salon.jpeg"
          alt="Интерьер салона Стильный Акцент"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 40%' }}
          loading="eager"
        />
      </motion.div>

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(105deg, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.18) 75%, rgba(10,10,10,0.08) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.6), transparent)' }}
      />

      {/* Content — each element staggers in independently */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col justify-between px-6 md:px-14 lg:px-20 xl:px-28 pt-28 pb-12">
        <div className="flex-1 flex flex-col justify-center max-w-2xl">
          {/* Eyebrow */}
          <motion.p {...fadeUp(0.1)}
            className="text-xs font-medium tracking-[0.25em] uppercase text-[rgba(255,255,255,0.55)] mb-6">
            Стильный Акцент - Центр красоты
          </motion.p>

          {/* Headline */}
          <motion.h1 {...fadeUp(0.2)}
            className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] tracking-tight text-white mb-7">
            {content.heroTitle}
          </motion.h1>

          {/* Subtitle */}
          <motion.p {...fadeUp(0.32)}
            className="text-sm md:text-base text-[rgba(255,255,255,0.65)] leading-relaxed max-w-[44ch] mb-10">
            {content.heroSubtitle}
          </motion.p>

          {/* CTA buttons */}
          <motion.div {...fadeUp(0.44)} className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBooking}
              className="cta-shimmer inline-flex items-center justify-center gap-2 px-8 py-4 text-white text-sm font-medium tracking-wide active:scale-[0.97]"
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              Записаться
              <ArrowRight size={16} weight="bold" />
            </button>
            <a
              href="#services"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[rgba(255,255,255,0.35)] text-white text-sm font-medium hover:border-white active:scale-[0.97] transition-all duration-150"
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              Наши услуги
            </a>
          </motion.div>
        </div>

      </div>
    </section>
  )
}
