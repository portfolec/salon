'use client'
import { useReducer, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X, ArrowLeft, ArrowRight, Check, CalendarBlank,
  User, Phone, CaretLeft, CaretRight, CheckCircle,
} from '@phosphor-icons/react'
import { useData } from '../context/DataContext'
import * as api from '../lib/api'
import type { TimeSlot } from '../data'
import { isSupabaseConfigured } from '../lib/supabase'
import { generateTimeSlots, getAvailableDates } from '../data'

interface BookingModalProps {
  open: boolean
  onClose: () => void
  initialServiceId?: string
}

type Step = 'service' | 'master' | 'datetime' | 'details' | 'confirm'

interface State {
  step: Step
  selectedService: string | null
  selectedMaster: string | null
  selectedDate: Date | null
  selectedTime: string | null
  name: string
  phone: string
  comment: string
  calYear: number
  calMonth: number
  submitted: boolean
  errors: Record<string, string>
}

type Action =
  | { type: 'SELECT_SERVICE'; id: string }
  | { type: 'SELECT_MASTER'; id: string | null }
  | { type: 'SELECT_DATE'; date: Date }
  | { type: 'SELECT_TIME'; time: string }
  | { type: 'SET_FIELD'; field: 'name' | 'phone' | 'comment'; value: string }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'NAV_MONTH'; dir: 1 | -1 }
  | { type: 'GO_STEP'; step: Step }
  | { type: 'SUBMIT' }
  | { type: 'RESET' }
  | { type: 'INIT_SERVICE'; id: string | undefined }

function init(initialServiceId?: string): State {
  const today = new Date()
  return {
    step: initialServiceId ? 'master' : 'service',
    selectedService: initialServiceId ?? null,
    selectedMaster: null,
    selectedDate: null,
    selectedTime: null,
    name: '',
    phone: '',
    comment: '',
    calYear: today.getFullYear(),
    calMonth: today.getMonth(),
    submitted: false,
    errors: {},
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_SERVICE':
      return { ...state, selectedService: action.id, step: 'master', errors: {} }
    case 'SELECT_MASTER':
      return { ...state, selectedMaster: action.id, step: 'datetime', errors: {}, selectedDate: null, selectedTime: null }
    case 'SELECT_DATE':
      return { ...state, selectedDate: action.date, selectedTime: null }
    case 'SELECT_TIME':
      return { ...state, selectedTime: action.time }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, errors: { ...state.errors, [action.field]: '' } }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors }
    case 'NAV_MONTH': {
      const d = new Date(state.calYear, state.calMonth + action.dir, 1)
      const today = new Date()
      if (action.dir === -1 && (d.getFullYear() < today.getFullYear() || (d.getFullYear() === today.getFullYear() && d.getMonth() < today.getMonth()))) return state
      return { ...state, calYear: d.getFullYear(), calMonth: d.getMonth(), selectedDate: null, selectedTime: null }
    }
    case 'GO_STEP':
      return { ...state, step: action.step, errors: {} }
    case 'SUBMIT':
      return { ...state, submitted: true }
    case 'RESET':
      return init()
    case 'INIT_SERVICE':
      return init(action.id)
    default:
      return state
  }
}

const STEPS: Step[] = ['service', 'master', 'datetime', 'details', 'confirm']
const STEP_LABELS: Record<Step, string> = {
  service: 'Услуга', master: 'Мастер', datetime: 'Дата', details: 'Запись', confirm: 'Готово',
}
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

export default function BookingModal({ open, onClose, initialServiceId }: BookingModalProps) {
  const { services, masters, addBooking } = useData()
  const [state, dispatch] = useReducer(reducer, undefined, () => init(initialServiceId))
  const prevInitId = useRef(initialServiceId)

  const [availDays,  setAvailDays]  = useState<Set<number>>(new Set())
  const [timeSlots,  setTimeSlots]  = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  useEffect(() => {
    if (open && initialServiceId !== prevInitId.current) {
      dispatch({ type: 'INIT_SERVICE', id: initialServiceId })
      prevInitId.current = initialServiceId
    }
    if (open && !state.selectedService && initialServiceId) {
      dispatch({ type: 'INIT_SERVICE', id: initialServiceId })
    }
  }, [open, initialServiceId])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Load available days when service/master/month changes
  useEffect(() => {
    if (!state.selectedService) return
    if (isSupabaseConfigured) {
      api.getAvailableDays(state.selectedMaster, state.selectedService, masters, state.calYear, state.calMonth)
        .then(days => setAvailDays(days))
        .catch(() => setAvailDays(getAvailableDates(state.calYear, state.calMonth)))
    } else {
      setAvailDays(getAvailableDates(state.calYear, state.calMonth))
    }
  }, [state.selectedService, state.selectedMaster, state.calYear, state.calMonth, masters])

  // Load time slots when date changes
  useEffect(() => {
    if (!state.selectedDate || !state.selectedService) return
    setSlotsLoading(true)
    if (isSupabaseConfigured) {
      api.getTimeSlots(state.selectedMaster, state.selectedService, masters, services, state.selectedDate)
        .then(slots => { setTimeSlots(slots); setSlotsLoading(false) })
        .catch(() => { setTimeSlots(generateTimeSlots(state.selectedDate!)); setSlotsLoading(false) })
    } else {
      setTimeSlots(generateTimeSlots(state.selectedDate))
      setSlotsLoading(false)
    }
  }, [state.selectedDate, state.selectedService, state.selectedMaster, masters, services])

  const handleClose = () => {
    onClose()
    setTimeout(() => dispatch({ type: 'RESET' }), 300)
  }

  const currentStepIndex = STEPS.indexOf(state.step)

  const relevantMasters = state.selectedService
    ? masters.filter(m => m.services.includes(state.selectedService!))
    : masters

  function buildCalendarGrid(): (number | null)[] {
    const firstDay = new Date(state.calYear, state.calMonth, 1)
    const startDow = firstDay.getDay()
    const offset = startDow === 0 ? 6 : startDow - 1
    const days: (number | null)[] = Array(offset).fill(null)
    const daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) days.push(d)
    while (days.length % 7 !== 0) days.push(null)
    return days
  }

  function validateDetails() {
    const errors: Record<string, string> = {}
    if (!state.name.trim()) errors.name = 'Введите имя'
    if (state.phone.replace(/\D/g, '').length < 10) errors.phone = 'Введите корректный номер'
    return errors
  }

  async function handleSubmit() {
    const selectedSvc  = services.find(s => s.id === state.selectedService)
    const selectedMstr = masters.find(m => m.id === state.selectedMaster)
    await addBooking({
      service: selectedSvc?.name ?? '',
      serviceId: state.selectedService ?? undefined,
      master: selectedMstr?.name ?? null,
      masterId: state.selectedMaster ?? undefined,
      date: state.selectedDate?.toLocaleDateString('en-CA') ?? '',
      time: state.selectedTime ?? '',
      name: state.name,
      phone: state.phone,
      comment: state.comment,
      status: 'new',
    })
    dispatch({ type: 'SUBMIT' })
  }

  const selectedSvc  = services.find(s => s.id === state.selectedService)
  const selectedMstr = masters.find(m => m.id === state.selectedMaster)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-stretch justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={handleClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} />

          <motion.div
            className="relative z-10 w-full bg-white flex flex-col overflow-hidden"
            style={{ maxWidth: '600px', height: '100dvh', borderRadius: '0' }}
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.45, bounce: 0.12 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(26,26,26,0.1)] shrink-0">
              <div className="flex items-center gap-3">
                {currentStepIndex > 0 && !state.submitted && (
                  <button onClick={() => dispatch({ type: 'GO_STEP', step: STEPS[currentStepIndex - 1] })}
                    className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors" aria-label="Назад">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h2 className="font-medium text-[var(--color-ink)] text-base">Онлайн-запись</h2>
              </div>
              <button onClick={handleClose} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"><X size={20} /></button>
            </div>

            {/* Step indicator */}
            {!state.submitted && (
              <div className="flex shrink-0 border-b border-[rgba(26,26,26,0.1)]">
                {STEPS.filter(s => s !== 'confirm').map((s, i) => {
                  const idx = STEPS.indexOf(s)
                  const done = idx < currentStepIndex
                  const active = s === state.step
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center py-3 gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200
                        ${done ? 'bg-[var(--color-accent)] text-white' : active ? 'bg-[var(--color-ink)] text-white' : 'bg-[var(--color-surface-elevated)] text-[var(--color-ink-tertiary)]'}`}>
                        {done ? <Check size={12} weight="bold" /> : i + 1}
                      </div>
                      <span className={`text-[10px] tracking-wide ${active ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-tertiary)]'}`}>
                        {STEP_LABELS[s]}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={state.step}
                  initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>

                  {/* SERVICE */}
                  {state.step === 'service' && (
                    <div className="p-6">
                      <p className="text-sm text-[var(--color-ink-secondary)] mb-5">Выберите услугу:</p>
                      <div className="space-y-2">
                        {services.map(svc => (
                          <button key={svc.id} onClick={() => dispatch({ type: 'SELECT_SERVICE', id: svc.id })}
                            className="w-full flex items-center justify-between px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors duration-150"
                            style={{ borderRadius: 'var(--radius-input)' }}>
                            <div>
                              <span className="text-sm font-medium text-[var(--color-ink)]">{svc.name}</span>
                              <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">{svc.duration}</span>
                            </div>
                            <span className="text-sm font-medium text-[var(--color-accent)]">
                              от {svc.priceFrom.toLocaleString('ru-RU')} ₽
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MASTER */}
                  {state.step === 'master' && (
                    <div className="p-6">
                      <p className="text-sm text-[var(--color-ink-secondary)] mb-5">Выберите мастера:</p>
                      <div className="space-y-2">
                        <button onClick={() => dispatch({ type: 'SELECT_MASTER', id: null })}
                          className="w-full flex items-center gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors"
                          style={{ borderRadius: 'var(--radius-input)' }}>
                          <div className="w-9 h-9 bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 rounded-full">
                            <User size={18} className="text-[var(--color-ink-tertiary)]" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--color-ink)]">Любой свободный мастер</span>
                            <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">Мы подберём специалиста</span>
                          </div>
                        </button>
                        {relevantMasters.map(m => (
                          <button key={m.id} onClick={() => dispatch({ type: 'SELECT_MASTER', id: m.id })}
                            className="w-full flex items-center gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors"
                            style={{ borderRadius: 'var(--radius-input)' }}>
                            <img src={m.photo || 'https://picsum.photos/seed/avatar/80/80'} alt={m.name}
                              className="w-9 h-9 object-cover shrink-0 rounded-full" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[var(--color-ink)]">{m.name}</span>
                              <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">{m.role} · {m.experience}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DATETIME */}
                  {state.step === 'datetime' && (
                    <div className="p-6">
                      {/* Calendar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <button onClick={() => dispatch({ type: 'NAV_MONTH', dir: -1 })}
                            className="p-1.5 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"><CaretLeft size={16} /></button>
                          <span className="text-sm font-medium text-[var(--color-ink)]">{MONTHS_RU[state.calMonth]} {state.calYear}</span>
                          <button onClick={() => dispatch({ type: 'NAV_MONTH', dir: 1 })}
                            className="p-1.5 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"><CaretRight size={16} /></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {DAYS_RU.map(d => (
                            <div key={d} className="text-center text-[10px] font-medium tracking-wide text-[var(--color-ink-tertiary)] py-1">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {buildCalendarGrid().map((day, idx) => {
                            if (!day) return <div key={idx} />
                            const isAvail = availDays.has(day)
                            const isSel = state.selectedDate?.getDate() === day && state.selectedDate?.getMonth() === state.calMonth
                            const today = new Date()
                            const isToday = today.getDate() === day && today.getMonth() === state.calMonth && today.getFullYear() === state.calYear
                            return (
                              <button key={idx} disabled={!isAvail}
                                onClick={() => dispatch({ type: 'SELECT_DATE', date: new Date(state.calYear, state.calMonth, day) })}
                                className={`h-8 text-sm rounded-sm transition-colors duration-150
                                  ${isSel ? 'bg-[var(--color-ink)] text-white font-medium' : ''}
                                  ${!isSel && isAvail ? 'hover:bg-[var(--color-surface-elevated)] text-[var(--color-ink)]' : ''}
                                  ${!isAvail ? 'text-[var(--color-ink-tertiary)] opacity-30 cursor-not-allowed' : ''}
                                  ${isToday && !isSel ? 'font-semibold underline underline-offset-2 decoration-[var(--color-accent)]' : ''}`}>
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Time slots */}
                      {state.selectedDate && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarBlank size={14} className="text-[var(--color-accent)]" />
                            <span className="text-xs font-medium text-[var(--color-ink)]">
                              {state.selectedDate.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                          {slotsLoading ? (
                            <div className="grid grid-cols-4 gap-2">
                              {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="h-10 rounded-sm bg-[var(--color-surface-elevated)] animate-pulse" />
                              ))}
                            </div>
                          ) : timeSlots.length === 0 ? (
                            <p className="text-sm text-[var(--color-ink-secondary)] text-center py-4">
                              Нет доступных слотов на этот день
                            </p>
                          ) : (
                            <div className="grid grid-cols-4 gap-2">
                              {timeSlots.map(slot => (
                                <button key={slot.time} disabled={!slot.available}
                                  onClick={() => slot.available && dispatch({ type: 'SELECT_TIME', time: slot.time })}
                                  className={`py-2.5 text-sm text-center transition-colors duration-150
                                    ${state.selectedTime === slot.time ? 'bg-[var(--color-ink)] text-white font-medium' : ''}
                                    ${slot.available && state.selectedTime !== slot.time ? 'border border-[rgba(26,26,26,0.15)] hover:border-[var(--color-accent)] text-[var(--color-ink)]' : ''}
                                    ${!slot.available ? 'border border-[rgba(26,26,26,0.06)] text-[var(--color-ink-tertiary)] line-through cursor-not-allowed' : ''}`}
                                  style={{ borderRadius: 'var(--radius-input)' }}>
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {state.selectedDate && state.selectedTime && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                          <button onClick={() => dispatch({ type: 'GO_STEP', step: 'details' })}
                            className="w-full py-3.5 bg-[var(--color-ink)] text-white text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] active:scale-[0.99] transition-all duration-200"
                            style={{ borderRadius: 'var(--radius-btn)' }}>
                            Продолжить <ArrowRight size={16} />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* DETAILS */}
                  {state.step === 'details' && (
                    <div className="p-6">
                      <div className="bg-[var(--color-surface)] px-4 py-3 mb-6 text-sm space-y-1" style={{ borderRadius: 'var(--radius-card)' }}>
                        {[
                          { l: 'Услуга', v: selectedSvc?.name },
                          { l: 'Мастер', v: selectedMstr?.name ?? 'Любой' },
                          { l: 'Дата и время', v: `${state.selectedDate?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${state.selectedTime}` },
                        ].map(row => (
                          <div key={row.l} className="flex justify-between">
                            <span className="text-[var(--color-ink-secondary)]">{row.l}</span>
                            <span className="font-medium text-[var(--color-ink)]">{row.v}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">Имя <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)]" />
                            <input type="text" value={state.name} onChange={e => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                              placeholder="Анастасия"
                              className={`w-full pl-9 pr-4 py-3 text-sm border bg-white text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] outline-none focus:border-[var(--color-ink)] transition-colors ${state.errors.name ? 'border-red-400' : 'border-[rgba(26,26,26,0.2)]'}`}
                              style={{ borderRadius: 'var(--radius-input)' }} />
                          </div>
                          {state.errors.name && <p className="text-xs text-red-500 mt-1">{state.errors.name}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">Телефон <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)]" />
                            <input type="tel" value={state.phone} onChange={e => dispatch({ type: 'SET_FIELD', field: 'phone', value: e.target.value })}
                              placeholder="+7 (___) ___-__-__"
                              className={`w-full pl-9 pr-4 py-3 text-sm border bg-white text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] outline-none focus:border-[var(--color-ink)] transition-colors ${state.errors.phone ? 'border-red-400' : 'border-[rgba(26,26,26,0.2)]'}`}
                              style={{ borderRadius: 'var(--radius-input)' }} />
                          </div>
                          {state.errors.phone && <p className="text-xs text-red-500 mt-1">{state.errors.phone}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-ink)] mb-2">Комментарий</label>
                          <textarea value={state.comment} onChange={e => dispatch({ type: 'SET_FIELD', field: 'comment', value: e.target.value })}
                            placeholder="Пожелания к мастеру..." rows={3}
                            className="w-full px-4 py-3 text-sm border border-[rgba(26,26,26,0.2)] bg-white text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] outline-none focus:border-[var(--color-ink)] transition-colors resize-none"
                            style={{ borderRadius: 'var(--radius-input)' }} />
                        </div>
                        <button
                          onClick={() => {
                            const errors = validateDetails()
                            if (Object.keys(errors).length) { dispatch({ type: 'SET_ERRORS', errors }); return }
                            dispatch({ type: 'GO_STEP', step: 'confirm' })
                          }}
                          className="w-full py-3.5 bg-[var(--color-ink)] text-white text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] active:scale-[0.99] transition-all"
                          style={{ borderRadius: 'var(--radius-btn)' }}>
                          Проверить запись <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CONFIRM */}
                  {state.step === 'confirm' && !state.submitted && (
                    <div className="p-6">
                      <h3 className="font-medium text-[var(--color-ink)] mb-5">Подтверждение записи</h3>
                      <div className="border border-[rgba(26,26,26,0.1)] divide-y divide-[rgba(26,26,26,0.1)] mb-6" style={{ borderRadius: 'var(--radius-card)' }}>
                        {[
                          { label: 'Услуга', value: selectedSvc?.name },
                          { label: 'Мастер', value: selectedMstr?.name ?? 'Любой свободный' },
                          { label: 'Дата', value: state.selectedDate?.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }) },
                          { label: 'Время', value: state.selectedTime },
                          { label: 'Имя', value: state.name },
                          { label: 'Телефон', value: state.phone },
                          ...(state.comment ? [{ label: 'Комментарий', value: state.comment }] : []),
                        ].map(row => (
                          <div key={row.label} className="flex justify-between px-4 py-3 text-sm">
                            <span className="text-[var(--color-ink-secondary)]">{row.label}</span>
                            <span className="font-medium text-[var(--color-ink)] text-right max-w-[60%]">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={handleSubmit}
                        className="w-full py-3.5 bg-[var(--color-accent)] text-white text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[var(--color-ink)] active:scale-[0.99] transition-all"
                        style={{ borderRadius: 'var(--radius-btn)' }}>
                        Подтвердить запись <Check size={16} weight="bold" />
                      </button>
                    </div>
                  )}

                  {/* SUCCESS */}
                  {state.submitted && (
                    <div className="p-8 flex flex-col items-center text-center">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="mb-6">
                        <CheckCircle size={64} weight="light" className="text-[var(--color-accent)]" />
                      </motion.div>
                      <h3 className="font-display text-2xl text-[var(--color-ink)] mb-3">Запись оформлена</h3>
                      <p className="text-[var(--color-ink-secondary)] leading-relaxed mb-2">
                        Спасибо, <strong>{state.name}</strong>! Мы свяжемся с вами для подтверждения.
                      </p>
                      <p className="text-sm text-[var(--color-ink-tertiary)] mb-8">
                        {state.selectedDate?.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })},{' '}
                        {state.selectedTime} &middot; {selectedSvc?.name}
                      </p>
                      <button onClick={handleClose}
                        className="px-8 py-3 bg-[var(--color-ink)] text-white text-sm font-medium tracking-wide hover:bg-[var(--color-accent)] active:scale-[0.98] transition-all"
                        style={{ borderRadius: 'var(--radius-btn)' }}>
                        Готово
                      </button>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
