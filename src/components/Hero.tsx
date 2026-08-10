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

  const zoomBg = !reduce && isDesktop

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: reduce ? 0 : 0.15 },
    },
  }
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0.01 : 0.65, ease: EASE_OUT } },
  }

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
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
          background: 'linear-gradient(105deg, rgba(10,10,10,0.88) 0%, rgba(10,10,10,0.68) 45%, rgba(10,10,10,0.3) 75%, rgba(10,10,10,0.14) 100%)',
        }}
      />
      {/* Extra vertical vignette so text always reads over the photo, regardless of layout width */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(10,10,10,0.35) 0%, rgba(10,10,10,0.15) 30%, rgba(10,10,10,0.35) 65%, rgba(10,10,10,0.75) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(10,10,10,0.6), transparent)' }}
      />

      {/* Content — animates in as one coordinated, staggered sequence */}
      <div className="relative z-10 min-h-[100svh] flex flex-col justify-between px-6 md:px-14 lg:px-20 xl:px-28 pt-28 pb-12">
        <motion.div
          className="flex-1 flex flex-col justify-center max-w-2xl"
          initial="hidden"
          animate="show"
          variants={container}
        >
          {/* Eyebrow */}
          <motion.p variants={item}
            className="text-xs font-medium tracking-[0.25em] uppercase text-white/70 mb-6"
            style={{ textShadow: '0 1px 12px rgba(0,0,0,0.5)' }}>
            Стильный Акцент - Центр красоты
          </motion.p>

          {/* Headline */}
          <motion.h1 variants={item}
            className="font-display text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.05] tracking-tight text-white mb-7"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.45)' }}>
            {content.heroTitle}
          </motion.h1>

          {/* Subtitle */}
          <motion.p variants={item}
            className="text-sm md:text-base text-white/80 leading-relaxed max-w-[44ch] mb-10"
            style={{ textShadow: '0 1px 16px rgba(0,0,0,0.5)' }}>
            {content.heroSubtitle}
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBooking}
              className="cta-shimmer inline-flex items-center justify-center gap-2 px-8 py-4 text-white text-sm font-medium tracking-wide"
              style={{ borderRadius: 'var(--radius-btn)' }}
            >
              <span>Записаться</span>
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
        </motion.div>

      </div>
    </section>
  )
}
