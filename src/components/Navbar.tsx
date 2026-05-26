import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Logo from './Logo'
import { useData } from '../context/DataContext'

interface NavbarProps {
  onBooking: () => void
}

const links = [
  { href: '#services', label: 'Услуги' },
  { href: '#why-us', label: 'О нас' },
  { href: '#masters', label: 'Мастера' },
  { href: '#reviews', label: 'Отзывы' },
  { href: '#contacts', label: 'Контакты' },
]

export default function Navbar({ onBooking }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { content } = useData()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled
            ? 'rgba(245,245,243,0.97)'
            : 'rgba(10,10,10,0.35)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: scrolled
            ? '1px solid rgba(26,26,26,0.1)'
            : '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <nav className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">

          {/* Logo */}
          <a href="#" aria-label="Стильный Акцент — главная">
            {/* sm на мобильном, md на десктопе */}
            <span className="block lg:hidden"><Logo size="sm" dark={!scrolled} /></span>
            <span className="hidden lg:block"><Logo size="md" dark={!scrolled} /></span>
          </a>

          {/* Desktop nav links */}
          <ul className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-[12px] font-medium tracking-[0.18em] uppercase transition-colors duration-200"
                  style={{ color: scrolled ? 'var(--color-ink-secondary)' : 'rgba(255,255,255,0.80)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = scrolled ? 'var(--color-ink)' : '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = scrolled ? 'var(--color-ink-secondary)' : 'rgba(255,255,255,0.80)')}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop: phone + CTA */}
          <div className="hidden lg:flex items-center gap-5">
            <a
              href={`tel:${content.phone.replace(/\D/g, '')}`}
              className="text-[12px] font-light transition-colors duration-200"
              style={{ color: scrolled ? 'var(--color-ink-secondary)' : 'rgba(255,255,255,0.65)' }}
            >
              {content.phone}
            </a>
            <button
              onClick={onBooking}
              className="text-[11px] font-medium tracking-[0.2em] uppercase px-5 py-2.5 transition-all duration-200 active:scale-[0.98]"
              style={{
                backgroundColor: scrolled ? 'var(--color-ink)' : 'rgba(255,255,255,0.15)',
                color: '#fff',
                border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.4)',
                borderRadius: 'var(--radius-btn)',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget
                b.style.backgroundColor = scrolled ? 'var(--color-accent)' : 'rgba(255,255,255,0.25)'
              }}
              onMouseLeave={e => {
                const b = e.currentTarget
                b.style.backgroundColor = scrolled ? 'var(--color-ink)' : 'rgba(255,255,255,0.15)'
              }}
            >
              Записаться
            </button>
          </div>

          {/* Mobile: animated hamburger */}
          <button
            className="lg:hidden flex flex-col gap-[5px] p-2"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            <motion.span
              className="block h-px w-6 origin-center"
              style={{ backgroundColor: scrolled ? '#1a1a1a' : '#fff' }}
              animate={menuOpen ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.22 }}
            />
            <motion.span
              className="block h-px w-6 origin-center"
              style={{ backgroundColor: scrolled ? '#1a1a1a' : '#fff' }}
              animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.18 }}
            />
            <motion.span
              className="block h-px w-6 origin-center"
              style={{ backgroundColor: scrolled ? '#1a1a1a' : '#fff' }}
              animate={menuOpen ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.22 }}
            />
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-zinc-950/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              className="fixed top-16 left-0 right-0 z-40 border-b border-stone-200 shadow-2xl"
              style={{ backgroundColor: 'rgba(245,245,243,0.98)', backdropFilter: 'blur(20px)' }}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="max-w-7xl mx-auto px-6 py-6">
                <ul className="flex flex-col">
                  {links.map((l, i) => (
                    <motion.li
                      key={l.href}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.045, duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <a
                        href={l.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between py-4 border-b border-stone-100 last:border-b-0 group"
                      >
                        <span
                          className="text-xl font-light text-zinc-800 group-hover:text-zinc-950 transition-colors"
                          style={{ fontFamily: 'var(--font-display, serif)' }}
                        >
                          {l.label}
                        </span>
                        <span className="text-zinc-300 group-hover:text-[var(--color-accent,#7B5E45)] transition-colors text-sm">
                          →
                        </span>
                      </a>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-col gap-3">
                  <button
                    onClick={() => { setMenuOpen(false); onBooking() }}
                    className="w-full py-3.5 text-white text-[12px] font-medium tracking-[0.22em] uppercase transition-colors duration-200"
                    style={{
                      backgroundColor: 'var(--color-ink, #1a1a1a)',
                      borderRadius: 'var(--radius-btn, 0)',
                    }}
                  >
                    Записаться
                  </button>
                  <a
                    href={`tel:${content.phone.replace(/\D/g, '')}`}
                    className="text-center text-[13px] font-light text-zinc-500 py-1"
                  >
                    {content.phone}
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
