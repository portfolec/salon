import { useState } from 'react'
import { useData, type SiteContent } from '../../context/DataContext'
import { Check, ArrowCounterClockwise, EnvelopeSimple, Info, ArrowSquareOut } from '@phosphor-icons/react'
import emailjs from '@emailjs/browser'

const inputCls = "w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors"

export default function AdminNotifications() {
  const { content, setContent } = useData()
  const [form, setForm] = useState<Pick<SiteContent,
    'notificationEmail' | 'emailjsServiceId' | 'emailjsTemplateId' | 'emailjsPublicKey'
  >>({
    notificationEmail: content.notificationEmail ?? '',
    emailjsServiceId:  content.emailjsServiceId  ?? '',
    emailjsTemplateId: content.emailjsTemplateId ?? '',
    emailjsPublicKey:  content.emailjsPublicKey  ?? '',
  })
  const [saved, setSaved]       = useState(false)
  const [testing, setTesting]   = useState(false)
  const [testResult, setTestResult] = useState<'ok' | 'err' | null>(null)

  const set = (field: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const isConfigured = !!(
    form.emailjsServiceId?.trim() &&
    form.emailjsTemplateId?.trim() &&
    form.emailjsPublicKey?.trim() &&
    form.notificationEmail?.trim()
  )

  const handleSave = async () => {
    await setContent({ ...content, ...form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    if (!isConfigured) return
    setTesting(true)
    setTestResult(null)
    try {
      await emailjs.send(
        form.emailjsServiceId!,
        form.emailjsTemplateId!,
        {
          to_email:     form.notificationEmail,
          client_name:  'Тест',
          client_phone: '+7 (000) 000-00-00',
          service:      'Тестовая услуга',
          master:       'Любой мастер',
          date:         new Date().toLocaleDateString('ru-RU'),
          time:         '12:00',
          comment:      'Это тестовое письмо из панели управления.',
        },
        form.emailjsPublicKey!,
      )
      setTestResult('ok')
    } catch {
      setTestResult('err')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-1">Уведомления</h2>
        <p className="text-sm text-zinc-500">Отправка писем на почту при новой заявке</p>
      </div>

      <div className="space-y-6">

        {/* Инструкция */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-sm p-5 flex gap-4">
          <Info size={18} className="text-[var(--color-accent-light)] shrink-0 mt-0.5" />
          <div className="text-sm text-zinc-400 space-y-1.5 leading-relaxed">
            <p>Для отправки писем используется <strong className="text-zinc-200">EmailJS</strong> — бесплатно до 200 писем/месяц.</p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-500">
              <li>Зарегистрируйся на <a href="https://emailjs.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-light)] hover:underline inline-flex items-center gap-0.5">emailjs.com <ArrowSquareOut size={11} /></a></li>
              <li>Добавь Email Service (Gmail, Yandex, SMTP) → скопируй <strong className="text-zinc-300">Service ID</strong></li>
              <li>Создай Email Template с переменными ниже → скопируй <strong className="text-zinc-300">Template ID</strong></li>
              <li>В разделе Account → скопируй <strong className="text-zinc-300">Public Key</strong></li>
            </ol>
            <div className="mt-3 bg-zinc-900 rounded-sm p-3 text-xs font-mono text-zinc-500 leading-loose">
              <p className="text-zinc-400 font-sans text-xs mb-1">Переменные для шаблона:</p>
              {'{{to_email}} {{client_name}} {{client_phone}} {{service}} {{master}} {{date}} {{time}} {{comment}}'}
            </div>
          </div>
        </div>

        {/* Настройки */}
        <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-5 flex items-center gap-2">
            <EnvelopeSimple size={16} className="text-[var(--color-accent-light)]" />
            Настройки EmailJS
          </h3>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Email для уведомлений</label>
            <input value={form.notificationEmail} onChange={e => set('notificationEmail', e.target.value)}
              placeholder="admin@example.com" type="email" className={inputCls} />
            <p className="mt-1 text-xs text-zinc-600">На этот адрес будут приходить заявки</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Service ID</label>
              <input value={form.emailjsServiceId} onChange={e => set('emailjsServiceId', e.target.value)}
                placeholder="service_xxxxxxx" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Template ID</label>
              <input value={form.emailjsTemplateId} onChange={e => set('emailjsTemplateId', e.target.value)}
                placeholder="template_xxxxxxx" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Public Key</label>
            <input value={form.emailjsPublicKey} onChange={e => set('emailjsPublicKey', e.target.value)}
              placeholder="xxxxxxxxxxxxxxxxxxxx" className={inputCls} />
          </div>

          {/* Статус */}
          <div className="flex items-center gap-2 pt-1">
            {isConfigured
              ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span className="text-xs text-emerald-400">Настроено</span></>
              : <><span className="w-1.5 h-1.5 rounded-full bg-zinc-600" /><span className="text-xs text-zinc-500">Не настроено</span></>
            }
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-sm active:scale-[0.97] transition-all duration-150
              ${saved ? 'bg-emerald-600 text-white' : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-light)]'}`}>
            <Check size={16} weight="bold" />
            {saved ? 'Сохранено!' : 'Сохранить'}
          </button>

          <button onClick={handleTest} disabled={!isConfigured || testing}
            className="flex items-center gap-2 px-5 py-3 bg-zinc-700 text-zinc-200 text-sm font-medium rounded-sm hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] transition-all duration-150">
            <EnvelopeSimple size={16} />
            {testing ? 'Отправка...' : 'Тест письмо'}
          </button>

          <button onClick={() => setForm({
            notificationEmail: content.notificationEmail ?? '',
            emailjsServiceId:  content.emailjsServiceId  ?? '',
            emailjsTemplateId: content.emailjsTemplateId ?? '',
            emailjsPublicKey:  content.emailjsPublicKey  ?? '',
          })}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-800 text-zinc-400 text-sm rounded-sm hover:bg-zinc-700 transition-colors">
            <ArrowCounterClockwise size={16} />Сбросить
          </button>
        </div>

        {testResult === 'ok' && (
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            <Check size={14} weight="bold" /> Тестовое письмо отправлено! Проверьте почту.
          </p>
        )}
        {testResult === 'err' && (
          <p className="text-sm text-red-400">
            Ошибка отправки. Проверьте Service ID, Template ID и Public Key.
          </p>
        )}
      </div>
    </div>
  )
}
