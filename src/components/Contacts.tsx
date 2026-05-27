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
            className="h-[400px] lg:h-[480px] bg-[var(--color-surface-elevated)] overflow-hidden"
            style={{ borderRadius: 'var(--radius-card)' }}
          >
            <iframe
              src="https://yandex.ru/map-widget/v1/?ll=37.562080%2C55.684768&z=15&pt=37.562080%2C55.684768%2Cpm2rdm&l=map"
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen
              title="Карта расположения салона"
              className="grayscale opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
