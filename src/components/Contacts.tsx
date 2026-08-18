'use client'
import { motion } from 'motion/react'
import {
  MapPin, Phone, Clock, TelegramLogo, InstagramLogo
} from '@phosphor-icons/react'
import { useData } from '../context/DataContext'
import MaxIcon from './MaxIcon'

function VkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-.995-1.49-.995-1.745-.995-.352 0-.457.1-.457.592v1.579c0 .436-.137.7-1.27.7-1.872 0-3.95-1.13-5.41-3.24-2.186-3.07-2.782-5.376-2.782-5.845 0-.263.1-.506.595-.506h1.743c.44 0 .612.2.786.684.87 2.503 2.325 4.695 2.927 4.695.22 0 .32-.1.32-.66V8.81c-.073-1.188-.694-1.29-.694-1.717 0-.208.174-.424.456-.424h2.74c.38 0 .51.2.51.655v3.524c0 .387.177.523.286.523.22 0 .41-.136.826-.554 1.278-1.43 2.185-3.635 2.185-3.635.118-.263.32-.506.758-.506h1.744c.524 0 .635.27.524.657-.22 1.1-2.34 3.985-2.34 3.985-.183.303-.25.437 0 .77.177.25.763.76 1.155 1.226.727.828 1.278 1.527 1.427 2.014.134.457-.1.7-.59.7z"/>
    </svg>
  )
}

export default function Contacts() {
  const { content } = useData()
  const yandexUrl = content.yandexMapsUrl?.trim() || 'https://yandex.ru/maps/-/CPHUNU0q'
  const twoGisUrl = content.twoGisUrl?.trim()

  return (
    <section className="py-24 lg:py-32">
      <div id="contacts" className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
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
                <div className="flex gap-4 flex-wrap">
                  <a href={content.telegramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] transition-colors">
                    <TelegramLogo size={20} weight="light" />Telegram
                  </a>
                  <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] transition-colors">
                    <InstagramLogo size={20} weight="light" />Instagram
                  </a>
                  {content.vkUrl && (
                    <a href={content.vkUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] transition-colors">
                      <VkIcon size={20} />ВКонтакте
                    </a>
                  )}
                  {content.maxUrl?.trim() && (
                    <a href={content.maxUrl.trim()} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-accent)] transition-colors">
                      <MaxIcon size={20} />MAX
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

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
                className="opacity-100"
              />
            </div>

            <a
              href={yandexUrl}
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

            {twoGisUrl ? (
              <a
                href={twoGisUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface)] border border-[rgba(26,26,26,0.08)] hover:border-[var(--color-accent)] transition-all duration-200 group"
                style={{ borderRadius: 'var(--radius-card)' }}
              >
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="4" fill="#1A9F29"/>
                    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif">2ГИС</text>
                  </svg>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-ink)]">Мы на 2ГИС</div>
                    <div className="text-xs text-[var(--color-ink-tertiary)]">{content.address}</div>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--color-ink-tertiary)] group-hover:text-[var(--color-accent)] transition-colors shrink-0">
                  <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            ) : (
              <div
                className="flex items-center justify-between px-4 py-3 border border-dashed border-[rgba(26,26,26,0.15)]"
                style={{ borderRadius: 'var(--radius-card)' }}
              >
                <div className="flex items-center gap-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="24" height="24" rx="4" fill="#9a9a9a"/>
                    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif">2ГИС</text>
                  </svg>
                  <div>
                    <div className="text-xs font-semibold text-[var(--color-ink-tertiary)]">Ссылка на 2ГИС</div>
                    <div className="text-xs text-[var(--color-ink-tertiary)]">Добавьте в админке, когда будет готова</div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
