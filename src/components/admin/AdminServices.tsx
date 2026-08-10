import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useData } from '../../context/DataContext'
import type { Service, ServiceVariant } from '../../data'
import { Plus, PencilSimple, Trash, X, Check, Clock, ListBullets } from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const formMotion = {
  initial: { opacity: 0, height: 0, y: -8 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE_OUT },
}

function emptyService(): Omit<Service, 'id'> {
  return { name: '', description: '', priceFrom: 0, duration: '', durationMinutes: 60, variants: [] }
}

function emptyVariant(): ServiceVariant {
  return { id: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: '' }
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
    variants: initial.variants ?? [],
  })
  const valid = form.name.trim() && form.priceFrom > 0

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }))

  const variants = form.variants ?? []
  const setVariants = (next: ServiceVariant[]) => setForm(f => ({ ...f, variants: next }))
  const addVariant = () => setVariants([...variants, emptyVariant()])
  const updateVariant = (id: string, patch: Partial<ServiceVariant>) =>
    setVariants(variants.map(v => v.id === id ? { ...v, ...patch } : v))
  const removeVariant = (id: string) => setVariants(variants.filter(v => v.id !== id))

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

      {/* Variants / subcategories block */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListBullets size={15} className="text-[var(--color-accent)]" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Виды услуги (необязательно)</span>
          </div>
          <button type="button" onClick={addVariant}
            className="flex items-center gap-1 text-xs text-[var(--color-accent-light)] hover:text-white transition-colors">
            <Plus size={12} weight="bold" />Добавить вид
          </button>
        </div>
        {variants.length === 0 ? (
          <p className="text-[11px] text-zinc-600">
            Например, у «Стрижки» может быть два вида: «Под машинку» и «Ножницами» — со своей ценой и временем.
            Если видов нет, клиент выбирает услугу целиком.
          </p>
        ) : (
          <div className="space-y-2">
            {variants.map(v => (
              <div key={v.id} className="grid grid-cols-1 sm:grid-cols-[1fr_110px_110px_auto] gap-2 items-start bg-zinc-800 border border-zinc-700 rounded-sm p-2.5">
                <input value={v.name} onChange={e => updateVariant(v.id, { name: e.target.value })}
                  placeholder="Под машинку"
                  className="w-full px-2.5 py-2 text-xs bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
                <input type="number" value={v.priceFrom ?? ''}
                  onChange={e => updateVariant(v.id, { priceFrom: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Цена, ₽"
                  className="w-full px-2.5 py-2 text-xs bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
                <input type="number" value={v.durationMinutes ?? ''}
                  onChange={e => updateVariant(v.id, { durationMinutes: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Мин."
                  className="w-full px-2.5 py-2 text-xs bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
                <button type="button" onClick={() => removeVariant(v.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-700 rounded-sm transition-colors shrink-0 justify-self-end sm:justify-self-auto">
                  <Trash size={14} />
                </button>
              </div>
            ))}
            <p className="text-[11px] text-zinc-600">Пустые поля цены/времени — вид использует значения самой услуги.</p>
          </div>
        )}
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
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setAdding(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-colors">
          <Plus size={16} weight="bold" />Добавить услугу
        </motion.button>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.div key="add-form" style={{ overflow: 'hidden' }} {...formMotion}>
              <ServiceForm
                initial={emptyService()}
                onSave={async s => { await addService(s); setAdding(false) }}
                onCancel={() => setAdding(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {services.map((svc, i) => (
            <motion.div key={svc.id} layout="position"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: EASE_OUT }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {editingId === svc.id ? (
                  <motion.div key="edit" style={{ overflow: 'hidden' }} {...formMotion}>
                    <ServiceForm
                      initial={svc}
                      onSave={async s => { await updateService({ ...svc, ...s }); setEditingId(null) }}
                      onCancel={() => setEditingId(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="view"
                    whileHover={{ y: -1 }}
                    className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-sm px-5 py-4 gap-4 transition-colors hover:border-zinc-600">
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
                      {!!svc.variants?.length && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {svc.variants.map(v => (
                            <span key={v.id} className="text-[11px] px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-400 rounded-sm">
                              {v.name}{v.priceFrom ? ` · от ${v.priceFrom.toLocaleString('ru-RU')} ₽` : ''}
                            </span>
                          ))}
                        </div>
                      )}
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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
