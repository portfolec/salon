import { useState } from 'react'
import { useData } from '../../context/DataContext'
import type { Vacancy } from '../../data'
import { Plus, PencilSimple, Trash, X, Check, Briefcase } from '@phosphor-icons/react'

const inputCls = "w-full px-3 py-2.5 text-sm bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-600 outline-none focus:border-[var(--color-accent)] rounded-sm transition-colors"

function emptyVacancy(): Omit<Vacancy, 'id'> {
  return { title: '', description: '', requirements: '' }
}

function VacancyForm({
  initial, onSave, onCancel,
}: { initial: Partial<Vacancy>; onSave: (v: Omit<Vacancy, 'id'>) => void; onCancel: () => void }) {
  const [form, setForm] = useState<Omit<Vacancy, 'id'>>({
    title: initial.title ?? '',
    description: initial.description ?? '',
    requirements: initial.requirements ?? '',
  })
  const valid = form.title.trim().length > 0

  const set = (field: keyof typeof form, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-sm p-5 space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Название вакансии *</label>
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Мастер маникюра" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Описание</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Условия работы, график, коллектив..." rows={3}
          className={inputCls + ' resize-none'} />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1.5">Требования</label>
        <textarea value={form.requirements} onChange={e => set('requirements', e.target.value)}
          placeholder="Опыт от 1 года, аккуратность..." rows={2}
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

export default function AdminVacancies() {
  const { vacancies, addVacancy, updateVacancy, deleteVacancy } = useData()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Вакансии</h2>
          <p className="text-sm text-zinc-500">{vacancies.length} вакансий на сайте</p>
        </div>
        <button onClick={() => { setAdding(true); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-sm hover:bg-[var(--color-accent-light)] active:scale-[0.98] transition-all">
          <Plus size={16} weight="bold" />Добавить вакансию
        </button>
      </div>

      <div className="space-y-3">
        {adding && (
          <VacancyForm
            initial={emptyVacancy()}
            onSave={async v => { await addVacancy(v); setAdding(false) }}
            onCancel={() => setAdding(false)}
          />
        )}

        {vacancies.length === 0 && !adding && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase size={40} weight="thin" className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">Вакансий пока нет</p>
            <p className="text-zinc-600 text-xs mt-1">Добавьте первую, чтобы она появилась в разделе «Вакансии» на сайте</p>
          </div>
        )}

        {vacancies.map(v => (
          <div key={v.id}>
            {editingId === v.id ? (
              <VacancyForm
                initial={v}
                onSave={async form => { await updateVacancy({ ...v, ...form }); setEditingId(null) }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between bg-zinc-800 border border-zinc-700 rounded-sm px-5 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm mb-1">{v.title}</div>
                  {v.description && <p className="text-xs text-zinc-400 leading-relaxed mb-1">{v.description}</p>}
                  {v.requirements && <p className="text-xs text-zinc-500 leading-relaxed">{v.requirements}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setEditingId(v.id); setAdding(false) }}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-sm transition-colors">
                    <PencilSimple size={16} />
                  </button>
                  <button onClick={() => confirm('Удалить вакансию?') && deleteVacancy(v.id)}
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
