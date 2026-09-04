import { ArrowLeft } from '@phosphor-icons/react'
import Logo from './Logo'
import { useData } from '../context/DataContext'
import { DEFAULT_USER_AGREEMENT, parseAgreement } from '../data/userAgreement'

export default function UserAgreement() {
  const { content } = useData()
  const text = content.userAgreement?.trim() || DEFAULT_USER_AGREEMENT
  const sections = parseAgreement(text)

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-10">
        <a href="#"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors mb-10">
          <ArrowLeft size={16} />
          На главную
        </a>

        <div className="mb-10">
          <Logo size="md" />
        </div>

        <h1 className="font-display text-3xl sm:text-4xl text-[var(--color-ink)] mb-3">
          Пользовательское соглашение
        </h1>
        <p className="text-sm text-[var(--color-ink-tertiary)] mb-12">
          Действует в отношении сайта салона красоты «Стильный Акцент»
        </p>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={section.heading ?? i}>
              {section.heading && (
                <h2 className="text-lg font-medium text-[var(--color-ink)] mb-3">{section.heading}</h2>
              )}
              <div className="space-y-3">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">{p}</p>
                ))}
              </div>
            </section>
          ))}

          <section className="pt-6 border-t border-[rgba(26,26,26,0.1)]">
            <h2 className="text-lg font-medium text-[var(--color-ink)] mb-3">Контакты</h2>
            <p className="text-sm text-[var(--color-ink-secondary)] leading-relaxed">
              {content.address}<br />
              {content.phone}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
