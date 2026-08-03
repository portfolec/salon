import Logo from './Logo'
import { useData } from '../context/DataContext'
import { TelegramLogo, InstagramLogo, Phone, MapPin, Clock } from '@phosphor-icons/react'

function VkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-.995-1.49-.995-1.745-.995-.352 0-.457.1-.457.592v1.579c0 .436-.137.7-1.27.7-1.872 0-3.95-1.13-5.41-3.24-2.186-3.07-2.782-5.376-2.782-5.845 0-.263.1-.506.595-.506h1.743c.44 0 .612.2.786.684.87 2.503 2.325 4.695 2.927 4.695.22 0 .32-.1.32-.66V8.81c-.073-1.188-.694-1.29-.694-1.717 0-.208.174-.424.456-.424h2.74c.38 0 .51.2.51.655v3.524c0 .387.177.523.286.523.22 0 .41-.136.826-.554 1.278-1.43 2.185-3.635 2.185-3.635.118-.263.32-.506.758-.506h1.744c.524 0 .635.27.524.657-.22 1.1-2.34 3.985-2.34 3.985-.183.303-.25.437 0 .77.177.25.763.76 1.155 1.226.727.828 1.278 1.527 1.427 2.014.134.457-.1.7-.59.7z"/>
    </svg>
  )
}

const NAV = [
  { href: '#services', label: 'Услуги' },
  { href: '#why-us',  label: 'О нас' },
  { href: '#masters',  label: 'Мы в лицах' },
  { href: '#reviews',  label: 'Отзывы' },
  { href: '#vacancies', label: 'Вакансии' },
  { href: '#contacts', label: 'Контакты' },
]

export default function Footer() {
  const { content } = useData()

  return (
    <footer className="bg-[var(--color-ink)] text-white">
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Logo size="md" dark />
            <p className="text-sm text-[rgba(255,255,255,0.45)] leading-relaxed max-w-[24ch]">
              Профессиональный уход и красота в одном пространстве.
            </p>
            <div className="flex items-center gap-3">
              <a href={content.telegramUrl} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-[rgba(255,255,255,0.15)] flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-200"
                style={{ borderRadius: '2px' }}>
                <TelegramLogo size={16} />
              </a>
              <a href={content.instagramUrl} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 border border-[rgba(255,255,255,0.15)] flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-200"
                style={{ borderRadius: '2px' }}>
                <InstagramLogo size={16} />
              </a>
              {content.vkUrl && (
                <a href={content.vkUrl} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 border border-[rgba(255,255,255,0.15)] flex items-center justify-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors duration-200"
                  style={{ borderRadius: '2px' }}>
                  <VkIcon size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[rgba(255,255,255,0.3)] mb-5">
              Навигация
            </p>
            <ul className="flex flex-col gap-3">
              {NAV.map(l => (
                <li key={l.href}>
                  <a href={l.href}
                    className="text-sm text-[rgba(255,255,255,0.55)] hover:text-white transition-colors duration-150">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[rgba(255,255,255,0.3)] mb-5">
              Контакты
            </p>
            <ul className="flex flex-col gap-4">
              <li>
                <a href={`tel:${content.phone.replace(/\D/g,'')}`}
                  className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.55)] hover:text-white transition-colors">
                  <Phone size={14} className="text-[var(--color-accent)] shrink-0" />
                  {content.phone}
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-[rgba(255,255,255,0.55)]">
                <MapPin size={14} className="text-[var(--color-accent)] shrink-0 mt-0.5" />
                {content.address}
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[rgba(255,255,255,0.3)] mb-5">
              Режим работы
            </p>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.55)]">
                <Clock size={14} className="text-[var(--color-accent)] shrink-0" />
                <span>{content.hours}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgba(255,255,255,0.07)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[rgba(255,255,255,0.25)]">
            &copy; {new Date().getFullYear()} Стильный Акцент. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}
