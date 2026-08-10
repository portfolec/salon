import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useData } from '../../context/DataContext'
import type { Master } from '../../data'
import { Plus, PencilSimple, Trash, X, Check, CalendarBlank } from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const formMotion = {
  initial: { opacity: 0, height: 0, y: -8 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE_OUT },
}

function emptyMaster(): Omit<Master, 'id'> {
  return { name: '', role: '', experience: '', services: [], photo: '' }
}

function MasterForm({
  initial, onSave, onCancel,
}: { initial: Partial<Master>; onSave: (m: Omit<Master, 'id'>, serviceIds: string[]) => void; onCancel: () => void }) {
  const { services } = useData()
  const [form, setForm] = useState<Omit<Master, 'id'>>({
    name: initial.name ?? '',
    role: initial.role ?? '',
    experience: initial.experience ?? '',
    photo: initial.photo ?? '',
    services: initial.services ?? [],
  })
  const valid = form.name.trim() && form.role.trim()

  const set = (field: keyof Omit<Master, 'id' | 'services'>, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const toggleService = (id: string) =>
    setForm(f => ({
      ...f,
      services: f.services.includes(id) ? f.services.filter(s => s !== id) : [...f.services, id],
    }))

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Имя *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Анастасия Ковалёва"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Специализация *</label>
          <input value={form.role} onChange={e => set('role', e.target.value)}
            placeholder="Парикмахер-стилист"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Опыт</label>
          <input value={form.experience} onChange={e => set('experience', e.target.value)}
            placeholder="9 лет"
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Фото (URL)</label>
          <input value={form.photo} onChange={e => set('photo', e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors" />
        </div>
      </div>

      {form.photo && (
        <div className="flex items-center gap-3">
          <img src={form.photo} alt="preview" className="w-16 h-16 object-cover rounded-sm border border-zinc-700" />
          <span className="text-xs text-zinc-500">Предпросмотр фото</span>
        </div>
      )}

      <div>
        <label className="block text-xs text-zinc-400 mb-2">Услуги мастера</label>
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <button key={s.id} type="button"
              onClick={() => toggleService(s.id)}
              className={`px-3 py-1.5 text-xs rounded-sm border transition-colors
                ${form.services.includes(s.id)
                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'}`}>
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => valid && onSave(form, form.services)} disabled={!valid}
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

export default function AdminMasters() {
  const { masters, services, addMaster, updateMaster, deleteMaster } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const getServiceNames = (ids: string[]) =>
    ids.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'Услуги не назначены'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Мастера</h2>
          <p className="text-sm text-zinc-500">{masters.length} специалистов · расписание в разделе «График»</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setAdding(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-colors">
          <Plus size={16} weight="bold" />Добавить мастера
        </motion.button>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.div key="add-form" style={{ overflow: 'hidden' }} {...formMotion}>
              <MasterForm
                initial={emptyMaster()}
                onSave={async (m, sids) => { await addMaster(m, sids); setAdding(false) }}
                onCancel={() => setAdding(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {masters.map((master, i) => (
            <motion.div key={master.id} layout="position"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: EASE_OUT }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {editingId === master.id ? (
                  <motion.div key="edit" style={{ overflow: 'hidden' }} {...formMotion}>
                    <MasterForm
                      initial={master}
                      onSave={async (m, sids) => { await updateMaster({ ...master, ...m }, sids); setEditingId(null) }}
                      onCancel={() => setEditingId(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="view" whileHover={{ y: -1 }}
                    className="flex items-center gap-4 bg-zinc-800 border border-zinc-700 rounded-sm px-5 py-4 transition-colors hover:border-zinc-600">
                    <img src={master.photo || 'https://picsum.photos/seed/avatar/80/80'}
                      alt={master.name}
                      className="w-12 h-12 object-cover object-top rounded-full border border-zinc-700 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">{master.name}</div>
                      <div className="text-xs text-[var(--color-accent)] mt-0.5">{master.role} · {master.experience}</div>
                      <div className="text-xs text-zinc-500 mt-1 truncate">
                        <CalendarBlank size={11} className="inline mr-1 relative -top-px" />
                        {getServiceNames(master.services)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => { setEditingId(master.id); setAdding(false) }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-sm transition-colors">
                        <PencilSimple size={16} />
                      </button>
                      <button onClick={() => confirm('Удалить мастера?') && deleteMaster(master.id)}
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
