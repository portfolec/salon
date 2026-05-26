import Logo from './Logo'
import { useData } from '../context/DataContext'
import { TelegramLogo, InstagramLogo, Phone, MapPin, Clock } from '@phosphor-icons/react'

const NAV = [
  { href: '#services', label: 'Услуги' },
  { href: '#why-us',  label: 'О нас' },
  { href: '#masters',  label: 'Мастера' },
  { href: '#reviews',  label: 'Отзывы' },
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
                <span>Пн — Пт: {content.hoursWeekday}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.55)]">
                <Clock size={14} className="text-[var(--color-accent)] shrink-0" />
                <span>Суббота: {content.hoursSaturday}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[rgba(255,255,255,0.55)]">
                <Clock size={14} className="text-[rgba(255,255,255,0.2)] shrink-0" />
                <span className="text-[rgba(255,255,255,0.3)]">Воскресенье: выходной</span>
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
          <a href="#admin" className="text-xs text-[rgba(255,255,255,0.15)] hover:text-[rgba(255,255,255,0.35)] transition-colors">
            Панель управления
          </a>
        </div>
      </div>
    </footer>
  )
}
