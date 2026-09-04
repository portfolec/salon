import { useState } from 'react'
import { useData, type SiteContent } from '../../context/DataContext'
import { Check, ArrowCounterClockwise, ChartLine } from '@phosphor-icons/react'
import { DEFAULT_USER_AGREEMENT } from '../../data/userAgreement'

const inputCls = "w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors"

export default function AdminContent() {
  const { content, setContent } = useData()
  const [form, setForm] = useState<SiteContent>(() => ({
    ...content,
    userAgreement: content.userAgreement?.trim() || DEFAULT_USER_AGREEMENT,
  }))
  const [saved, setSaved] = useState(false)

  const set = (field: keyof SiteContent, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    await setContent(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-1">Контент сайта</h2>
        <p className="text-sm text-zinc-500">Редактирование текстов и контактной информации</p>
      </div>

      <div className="space-y-8">
        {/* Hero */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">Главный экран</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Заголовок</label>
              <input value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)}
                placeholder="Красота в каждой детали" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Подзаголовок</label>
              <textarea value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)}
                placeholder="Описание услуг..." rows={3}
                className={inputCls + ' resize-none'} />
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5">Контактная информация</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { label: 'Адрес',           field: 'address',      placeholder: 'Москва, ул. ...' },
              { label: 'Телефон',         field: 'phone',        placeholder: '+7 (495) 123-45-67' },
              { label: 'Режим работы',       field: 'hours',        placeholder: 'Ежедневно 10:00 - 20:00' },
              { label: 'Ссылка Telegram',  field: 'telegramUrl',  placeholder: 'https://t.me/...' },
              { label: 'Ссылка Instagram', field: 'instagramUrl', placeholder: 'https://instagram.com/...' },
              { label: 'Ссылка ВКонтакте', field: 'vkUrl',          placeholder: 'https://vk.com/...' },
              { label: 'Ссылка MAX',       field: 'maxUrl',         placeholder: 'https://max.ru/...' },
              { label: 'Ссылка Яндекс Карты', field: 'yandexMapsUrl', placeholder: 'https://yandex.ru/maps/...' },
              { label: 'Ссылка 2ГИС', field: 'twoGisUrl',           placeholder: 'https://2gis.ru/...' },
            ] as { label: string; field: keyof SiteContent; placeholder: string }[]).map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
                <input value={(form[field] as string) ?? ''} onChange={e => set(field, e.target.value)}
                  placeholder={placeholder} className={inputCls} />
              </div>
            ))}
          </div>
        </div>

        {/* Yandex Metrika */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-6">
          <div className="flex items-center gap-3 mb-5">
            <ChartLine size={20} className="text-[var(--color-accent-light)]" />
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Яндекс Метрика</h3>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Номер счётчика</label>
            <input
              value={form.yandexMetrikaId ?? ''}
              onChange={e => set('yandexMetrikaId', e.target.value.replace(/\D/g, ''))}
              placeholder="12345678"
              className={inputCls}
              inputMode="numeric"
            />
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              Найдите номер счётчика в&nbsp;
              <a href="https://metrika.yandex.ru" target="_blank" rel="noopener noreferrer"
                className="text-[var(--color-accent-light)] hover:underline">
                metrika.yandex.ru
              </a>
              {' '}→ Настройки счётчика. Скрипт подключится автоматически после сохранения.
              {form.yandexMetrikaId
                ? <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Счётчик {form.yandexMetrikaId} подключён
                  </span>
                : <span className="ml-2 text-zinc-600">Счётчик не настроен</span>
              }
            </p>
          </div>
        </div>

        <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-2">Пользовательское соглашение</h3>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Текст страницы «Пользовательское соглашение». Пустая строка между абзацами. Заголовок раздела — отдельная строка вида «1. Название».
          </p>
          <textarea
            value={form.userAgreement ?? ''}
            onChange={e => set('userAgreement', e.target.value)}
            rows={18}
            className={inputCls + ' resize-y min-h-[16rem] font-mono text-[13px] leading-relaxed'}
          />
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-sm active:scale-[0.98] transition-all duration-200
              ${saved ? 'bg-emerald-600 text-white' : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'}`}>
            <Check size={16} weight="bold" />
            {saved ? 'Сохранено!' : 'Сохранить изменения'}
          </button>
          <button onClick={() => setForm({
            ...content,
            userAgreement: content.userAgreement?.trim() || DEFAULT_USER_AGREEMENT,
          })}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-700 text-zinc-300 text-sm font-medium rounded-sm hover:bg-zinc-600 transition-colors">
            <ArrowCounterClockwise size={16} />Сбросить
          </button>
        </div>
      </div>
    </div>
  )
}
