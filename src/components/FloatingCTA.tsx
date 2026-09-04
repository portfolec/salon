'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'

interface FloatingCTAProps {
  onBooking: () => void
  hidden?: boolean
}

export default function FloatingCTA({ onBooking, hidden }: FloatingCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const scrolled = window.scrollY > 400
      const footer = document.querySelector('[data-site-footer]')
      const footerOnScreen = footer
        ? footer.getBoundingClientRect().top < window.innerHeight - 72
        : false
      setVisible(scrolled && !footerOnScreen)
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const show = visible && !hidden

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none md:hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
        >
          <button
            onClick={onBooking}
            className="cta-shimmer pointer-events-auto inline-flex items-center gap-2.5 px-8 py-4 text-white text-sm font-medium tracking-wide"
            style={{ borderRadius: '100px' }}
          >
            <CalendarBlank size={18} />
            <span>Записаться</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
