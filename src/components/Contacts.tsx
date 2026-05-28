'use client'
import { motion } from 'motion/react'
import {
  MapPin, Phone, Clock, TelegramLogo, InstagramLogo
} from '@phosphor-icons/react'
import { useData } from '../context/DataContext'

export default function Contacts() {
  const { content } = useData()
  return (
    <section id="contacts" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-[var(--color-ink)] leading-tight mb-12">
              Контакты
            </h2>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <MapPin size={20} weight="light" className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium tracking-wide uppercase text-[var(--color-ink-tertiary)] mb-1">Адрес</div>
                  <p className="text-[var(--color-ink)]">{content.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone size={20} weight="light" className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium tracking-wide uppercase text-[var(--color-ink-tertiary)] mb-1">Телефон</div>
                  <a href={`tel:${content.phone.replace(/\D/g,'')}`} className="text-[var(--color-ink)] hover:text-[var(--color-accent)] transition-colors">
                    {content.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock size={20} weight="light" className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-medium tracking-wide uppercase text-[var(--color-ink-tertiary)] mb-1">Режим работы</div>
                  <div className="space-y-1 text-[var(--color-ink)]">
                    <p>{content.hours}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(26,26,26,0.1)]">
                <div className="text-xs font-medium tracking-wide uppercase text-[var(--color-ink-tertiary)] mb-4">Мы в соцсетях</div>
                <div className="flex gap-4">
                  <a href={content.telegramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] transition-colors">
                    <TelegramLogo size={20} weight="light" />Telegram
                  </a>
                  <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] transition-colors">
                    <InstagramLogo size={20} weight="light" />Instagram
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3"
          >
            <div
              className="h-[400px] lg:h-[440px] bg-[var(--color-surface-elevated)] overflow-hidden"
              style={{ borderRadius: 'var(--radius-card)' }}
            >
              <iframe
                src="https://yandex.ru/map-widget/v1/?ll=28.087705%2C59.116668&z=17&pt=28.087705%2C59.116668%2Cpm2rdm&l=map"
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                title="Карта расположения салона"
                className="grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
              />
            </div>
            {/* Баннер — Мы на Яндекс Картах */}
            <a
              href="https://yandex.ru/maps/-/CPHUNU0q"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface)] border border-[rgba(26,26,26,0.08)] hover:border-[var(--color-accent)] transition-all duration-200 group"
              style={{ borderRadius: 'var(--radius-card)' }}
            >
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C7.589 2 4 5.589 4 10c0 5.25 8 14 8 14s8-8.75 8-14c0-4.411-3.589-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" fill="#FC3F1D"/>
                </svg>
                <div>
                  <div className="text-xs font-semibold text-[var(--color-ink)]">Мы на Яндекс Картах</div>
                  <div className="text-xs text-[var(--color-ink-tertiary)]">{content.address}</div>
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-accent)] transition-colors shrink-0">
                <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
