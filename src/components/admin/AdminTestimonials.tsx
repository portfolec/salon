import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useData } from '../../context/DataContext'
import type { Testimonial } from '../../data'
import { Plus, PencilSimple, Trash, X, Check, ChatCircleText } from '@phosphor-icons/react'

const inputCls = "w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors"
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const formMotion = {
  initial: { opacity: 0, height: 0, y: -8 },
  animate: { opacity: 1, height: 'auto', y: 0 },
  exit: { opacity: 0, height: 0, y: -8 },
  transition: { duration: 0.25, ease: EASE_OUT },
}

function emptyTestimonial(): Omit<Testimonial, 'id'> {
  return { name: '', role: '', text: '' }
}

function TestimonialForm({
  initial, onSave, onCancel,
}: { initial: Partial<Testimonial>; onSave: (t: Omit<Testimonial, 'id'>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>({
    name: initial.name ?? '',
    role: initial.role ?? '',
    text: initial.text ?? '',
  })
  const valid = form.name.trim().length > 0 && form.text.trim().length > 0

  const set = (field: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-5 space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Имя клиента *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)}
          placeholder="Екатерина Смирнова" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Подпись</label>
        <input value={form.role} onChange={e => set('role', e.target.value)}
          placeholder="Постоянный клиент, 2 года" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Текст отзыва *</label>
        <textarea value={form.text} onChange={e => set('text', e.target.value)}
          placeholder="Лучший маникюр в городе..." rows={3}
          className={inputCls + ' resize-none'} />
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

export default function AdminTestimonials() {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Отзывы</h2>
          <p className="text-sm text-zinc-500">{testimonials.length} отзывов на главной странице</p>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setAdding(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] transition-colors">
          <Plus size={16} weight="bold" />Добавить отзыв
        </motion.button>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.div key="add-form" style={{ overflow: 'hidden' }} {...formMotion}>
              <TestimonialForm
                initial={emptyTestimonial()}
                onSave={async t => { await addTestimonial(t); setAdding(false) }}
                onCancel={() => setAdding(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {testimonials.length === 0 && !adding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <ChatCircleText size={40} weight="thin" className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">Отзывов пока нет</p>
            <p className="text-zinc-600 text-xs mt-1">Добавьте первый, чтобы он появился в разделе «Отзывы клиентов» на сайте</p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {testimonials.map((t, i) => (
            <motion.div key={t.id} layout="position"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: EASE_OUT }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {editingId === t.id ? (
                  <motion.div key="edit" style={{ overflow: 'hidden' }} {...formMotion}>
                    <TestimonialForm
                      initial={t}
                      onSave={async form => { await updateTestimonial({ ...t, ...form }); setEditingId(null) }}
                      onCancel={() => setEditingId(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="view" whileHover={{ y: -1 }}
                    className="flex items-start justify-between bg-zinc-800 border border-zinc-700 rounded-sm px-5 py-4 gap-4 transition-colors hover:border-zinc-600">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm mb-1">{t.name}</div>
                      {t.role && <p className="text-xs text-zinc-500 mb-2">{t.role}</p>}
                      <p className="text-xs text-zinc-400 leading-relaxed">"{t.text}"</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => { setEditingId(t.id); setAdding(false) }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-sm transition-colors">
                        <PencilSimple size={16} />
                      </button>
                      <button onClick={() => confirm('Удалить отзыв?') && deleteTestimonial(t.id)}
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
