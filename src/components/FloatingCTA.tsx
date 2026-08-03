'use client'
import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect } from 'react'
import { CalendarBlank } from '@phosphor-icons/react'

interface FloatingCTAProps {
  onBooking: () => void
}

export default function FloatingCTA({ onBooking }: FloatingCTAProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-6 left-0 right-0 flex justify-center z-40 pointer-events-none md:hidden"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
        >
          <button
            onClick={onBooking}
            className="cta-shimmer pointer-events-auto inline-flex items-center gap-2.5 px-8 py-4 text-white text-sm font-medium tracking-wide shadow-lg active:scale-[0.97]"
            style={{ borderRadius: '100px' }}
          >
            <CalendarBlank size={18} />
            Записаться
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
