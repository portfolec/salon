import { useState } from 'react'
import { useData } from '../../context/DataContext'
import type { Service } from '../../data'
import { Plus, PencilSimple, Trash, X, Check, Clock } from '@phosphor-icons/react'

function emptyService(): Omit<Service, 'id'> {
  return { name: '', description: '', priceFrom: 0, duration: '', durationMinutes: 60 }
}

function ServiceForm({
  initial, onSave, onCancel,
}: { initial: Partial<Service>; onSave: (s: Omit<Service, 'id'>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Service, 'id'>>({
    name: initial.name ?? '',
    description: initial.description ?? '',
    priceFrom: initial.priceFrom ?? 0,
    duration: initial.duration ?? '',
    durationMinutes: initial.durationMinutes ?? 60,
  })
  const valid = form.name.trim() && form.priceFrom > 0

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }))

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Название *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Маникюр"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Цена от (₽) *</label>
          <input type="number" value={form.priceFrom || ''} onChange={e => set('priceFrom', parseInt(e.target.value) || 0)}
            placeholder="1800"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-zinc-400 mb-1.5">Описание</label>
          <input value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Краткое описание услуги"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
        </div>
      </div>

      {/* Duration block — highlighted */}
      <div className="bg-zinc-900 border border-[var(--color-accent)]/30 rounded-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} className="text-[var(--color-accent)]" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Длительность процедуры</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Точное время (минуты) — для расписания *</label>
            <div className="relative">
              <input type="number" min={5} step={5} value={form.durationMinutes || ''}
                onChange={e => set('durationMinutes', parseInt(e.target.value) || 60)}
                placeholder="60"
                className="w-full px-3 py-2.5 pr-10 text-sm bg-zinc-800 border border-zinc-600 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">мин</span>
            </div>
            <p className="text-[11px] text-zinc-600 mt-1">Используется для блокировки слотов в календаре записи</p>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">Отображаемый диапазон — для клиента</label>
            <input value={form.duration} onChange={e => set('duration', e.target.value)}
              placeholder="60-90 мин"
              className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-600 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
            <p className="text-[11px] text-zinc-600 mt-1">Показывается в карточке услуги на сайте</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => valid && onSave(form)} disabled={!valid}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-accent)] text-white text-xs font-medium rounded-sm hover:bg-[var(--color-accent-light)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Check size={14} weight="bold" />Сохранить
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 bg-zinc-700 text-zinc-300 text-xs font-medium rounded-sm hover:bg-zinc-600 transition-colors">
          <X size={14} />Отмена
        </button>
      </div>
    </div>
  )
}

export default function AdminServices() {
  const { services, addService, updateService, deleteService } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Услуги</h2>
          <p className="text-sm text-zinc-500">{services.length} услуг в каталоге</p>
        </div>
        <button onClick={() => { setAdding(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] active:scale-[0.98] transition-all">
          <Plus size={16} weight="bold" />Добавить услугу
        </button>
      </div>

      <div className="space-y-3">
        {adding && (
          <ServiceForm
            initial={emptyService()}
            onSave={async s => { await addService(s); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}

        {services.map(svc => (
          <div key={svc.id}>
            {editingId === svc.id ? (
              <ServiceForm
                initial={svc}
                onSave={async s => { await updateService({ ...svc, ...s }); setEditingId(null) }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-sm px-5 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="font-medium text-white text-sm">{svc.name}</span>
                    <span className="text-[var(--color-accent)] text-sm font-medium">от {svc.priceFrom.toLocaleString('ru-RU')} ₽</span>
                    {svc.duration && <span className="text-xs text-zinc-500">{svc.duration}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {svc.durationMinutes && (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock size={11} className="text-[var(--color-accent)]" />
                        {svc.durationMinutes} мин в расписании
                      </span>
                    )}
                    {svc.description && <span className="text-xs text-zinc-500 truncate max-w-xs">{svc.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setEditingId(svc.id); setAdding(false) }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-sm transition-colors">
                    <PencilSimple size={16} />
                  </button>
                  <button onClick={() => confirm('Удалить услугу?') && deleteService(svc.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded-sm transition-colors">
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
