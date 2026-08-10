'use client'
import { useReducer, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X, ArrowLeft, ArrowRight, Check, CalendarBlank,
  User, Phone, CaretLeft, CaretRight, CheckCircle, Plus, Trash,
  Scissors, UsersThree, Clock, CircleNotch, Warning,
} from '@phosphor-icons/react'
import { useData } from '../context/DataContext'
import * as api from '../lib/api'
import type { TimeSlot } from '../data'
import { isApiConfigured } from '../lib/backend'
import { generateTimeSlots, getAvailableDates } from '../data'

interface BookingModalProps {
  open: boolean
  onClose: () => void
  initialServiceId?: string
  initialMasterId?: string
}

type Flow = 'service' | 'master' | 'time'
type BuildStep = 'service' | 'master' | 'datetime'
type Step = 'entry' | BuildStep | 'variant' | 'cart' | 'details' | 'confirm'

/** Which criterion the client wants to pick first — order of the remaining steps follows. */
const FLOW_ORDERS: Record<Flow, BuildStep[]> = {
  service: ['service', 'master', 'datetime'],
  master:  ['master', 'service', 'datetime'],
  time:    ['datetime', 'service', 'master'],
}

function stepToBuildStep(step: Step): BuildStep | null {
  if (step === 'variant') return 'service'
  return step === 'service' || step === 'master' || step === 'datetime' ? step : null
}

/** True if the datetime step already happened earlier in this flow's order (so we must not clear it). */
function preserveDateTime(order: BuildStep[], current: BuildStep): boolean {
  return order.indexOf('datetime') < order.indexOf(current)
}

interface CartItem {
  id: string
  serviceId: string
  variantId: string | null
  variantName: string | null
  masterId: string | null
  date: Date
  time: string
}

interface Draft {
  serviceId: string | null
  variantId: string | null
  variantName: string | null
  masterId: string | null
  date: Date | null
  time: string | null
}

interface State {
  step: Step
  flow: Flow
  draft: Draft
  preselectedMasterId: string | null
  cart: CartItem[]
  name: string
  phone: string
  comment: string
  calYear: number
  calMonth: number
  submitted: boolean
  submitting: boolean
  errors: Record<string, string>
}

type Action =
  | { type: 'SET_FLOW'; flow: Flow }
  | { type: 'SELECT_SERVICE'; id: string; hasVariants: boolean }
  | { type: 'SELECT_VARIANT'; id: string; name: string }
  | { type: 'SELECT_MASTER'; id: string | null }
  | { type: 'SELECT_DATE'; date: Date }
  | { type: 'SELECT_TIME'; time: string }
  | { type: 'CONTINUE_DATETIME' }
  | { type: 'REMOVE_FROM_CART'; id: string }
  | { type: 'START_ANOTHER' }
  | { type: 'SET_FIELD'; field: 'name' | 'phone' | 'comment'; value: string }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'NAV_MONTH'; dir: 1 | -1 }
  | { type: 'GO_STEP'; step: Step }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_DONE' }
  | { type: 'RESET' }
  | { type: 'INIT'; serviceId: string | undefined; masterId: string | undefined; hasVariants: boolean }

function emptyDraft(serviceId: string | null = null): Draft {
  return { serviceId, variantId: null, variantName: null, masterId: null, date: null, time: null }
}

function addDraftToCart(state: State, draft: Draft): State {
  if (!draft.serviceId || !draft.date || !draft.time) return { ...state, draft, errors: {} }
  const item: CartItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    serviceId: draft.serviceId,
    variantId: draft.variantId,
    variantName: draft.variantName,
    masterId: draft.masterId,
    date: draft.date,
    time: draft.time,
  }
  return { ...state, cart: [...state.cart, item], draft: emptyDraft(), step: 'cart', errors: {} }
}

function init(initialServiceId?: string, initialMasterId?: string, initialHasVariants?: boolean): State {
  const today = new Date()
  let step: Step = 'entry'
  let flow: Flow = 'service'
  let preselectedMasterId: string | null = null

  if (initialServiceId) {
    flow = 'service'
    step = initialHasVariants ? 'variant' : 'master'
  } else if (initialMasterId) {
    flow = 'master'
    preselectedMasterId = initialMasterId
    step = 'service'
  }

  return {
    step,
    flow,
    draft: { ...emptyDraft(initialServiceId ?? null), masterId: preselectedMasterId },
    preselectedMasterId,
    cart: [],
    name: '',
    phone: '',
    comment: '',
    calYear: today.getFullYear(),
    calMonth: today.getMonth(),
    submitted: false,
    submitting: false,
    errors: {},
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_FLOW': {
      const order = FLOW_ORDERS[action.flow]
      return {
        ...state,
        flow: action.flow,
        step: order[0],
        draft: emptyDraft(),
        preselectedMasterId: null,
        errors: {},
      }
    }
    case 'SELECT_SERVICE': {
      const order = FLOW_ORDERS[state.flow]
      const masterId = state.preselectedMasterId ?? state.draft.masterId
      const keepDT = preserveDateTime(order, 'service')
      const newDraft: Draft = {
        serviceId: action.id,
        variantId: null,
        variantName: null,
        masterId,
        date: keepDT ? state.draft.date : null,
        time: keepDT ? state.draft.time : null,
      }
      if (action.hasVariants) {
        return { ...state, draft: newDraft, step: 'variant', errors: {} }
      }
      const idx = order.indexOf('service')
      const nextStep = order[idx + 1]
      return nextStep
        ? { ...state, draft: newDraft, step: nextStep, errors: {} }
        : addDraftToCart(state, newDraft)
    }
    case 'SELECT_VARIANT': {
      const order = FLOW_ORDERS[state.flow]
      const newDraft: Draft = { ...state.draft, variantId: action.id, variantName: action.name }
      const idx = order.indexOf('service')
      const nextStep = order[idx + 1]
      return nextStep
        ? { ...state, draft: newDraft, step: nextStep, errors: {} }
        : addDraftToCart(state, newDraft)
    }
    case 'SELECT_MASTER': {
      const order = FLOW_ORDERS[state.flow]
      const keepDT = preserveDateTime(order, 'master')
      const newDraft: Draft = {
        ...state.draft,
        masterId: action.id,
        date: keepDT ? state.draft.date : null,
        time: keepDT ? state.draft.time : null,
      }
      const idx = order.indexOf('master')
      const nextStep = order[idx + 1]
      return nextStep
        ? { ...state, draft: newDraft, step: nextStep, errors: {} }
        : addDraftToCart(state, newDraft)
    }
    case 'SELECT_DATE':
      return { ...state, draft: { ...state.draft, date: action.date, time: null } }
    case 'SELECT_TIME':
      return { ...state, draft: { ...state.draft, time: action.time } }
    case 'CONTINUE_DATETIME': {
      const order = FLOW_ORDERS[state.flow]
      const idx = order.indexOf('datetime')
      const nextStep = order[idx + 1]
      return nextStep
        ? { ...state, step: nextStep, errors: {} }
        : addDraftToCart(state, state.draft)
    }
    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.id !== action.id) }
    case 'START_ANOTHER':
      return { ...state, draft: emptyDraft(), preselectedMasterId: null, step: 'entry', errors: {} }
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, errors: { ...state.errors, [action.field]: '' } }
    case 'SET_ERRORS':
      return { ...state, errors: action.errors }
    case 'NAV_MONTH': {
      const d = new Date(state.calYear, state.calMonth + action.dir, 1)
      const today = new Date()
      if (
        action.dir === -1 &&
        (d.getFullYear() < today.getFullYear() ||
          (d.getFullYear() === today.getFullYear() && d.getMonth() < today.getMonth()))
      ) return state
      return {
        ...state,
        calYear: d.getFullYear(),
        calMonth: d.getMonth(),
        draft: { ...state.draft, date: null, time: null },
      }
    }
    case 'GO_STEP':
      return { ...state, step: action.step, errors: {} }
    case 'SUBMIT_START':
      return { ...state, submitting: true }
    case 'SUBMIT_DONE':
      return { ...state, submitted: true, submitting: false }
    case 'RESET':
      return init()
    case 'INIT':
      return init(action.serviceId, action.masterId, action.hasVariants)
    default:
      return state
  }
}

const STEP_LABELS: Record<BuildStep, string> = {
  service: 'Услуга', master: 'Мастер', datetime: 'Дата',
}
const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS_RU   = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

export default function BookingModal({ open, onClose, initialServiceId, initialMasterId }: BookingModalProps) {
  const { services, masters, addBooking } = useData()
  const [state, dispatch] = useReducer(
    reducer, undefined,
    () => init(initialServiceId, initialMasterId, !!services.find(s => s.id === initialServiceId)?.variants?.length),
  )
  const prevInitId = useRef(initialServiceId)
  const prevInitMasterId = useRef(initialMasterId)

  const [availDays,  setAvailDays]  = useState<Set<number>>(new Set())
  const [timeSlots,  setTimeSlots]  = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [masterCheckingId, setMasterCheckingId] = useState<string | null>(null)
  const [masterConflict, setMasterConflict] = useState(false)

  useEffect(() => {
    if (open && (initialServiceId !== prevInitId.current || initialMasterId !== prevInitMasterId.current)) {
      const hasVariants = !!(initialServiceId && services.find(s => s.id === initialServiceId)?.variants?.length)
      dispatch({ type: 'INIT', serviceId: initialServiceId, masterId: initialMasterId, hasVariants })
      prevInitId.current = initialServiceId
      prevInitMasterId.current = initialMasterId
    }
  }, [open, initialServiceId, initialMasterId, services])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!state.draft.serviceId || state.step !== 'datetime') {
      if (state.step === 'datetime' && !state.draft.serviceId) {
        setAvailDays(getAvailableDates(state.calYear, state.calMonth))
      }
      return
    }
    if (isApiConfigured) {
      api.getAvailableDays(state.draft.masterId, state.draft.serviceId, masters, state.calYear, state.calMonth)
        .then(days => setAvailDays(days))
        .catch(() => setAvailDays(getAvailableDates(state.calYear, state.calMonth)))
    } else {
      setAvailDays(getAvailableDates(state.calYear, state.calMonth))
    }
  }, [state.draft.serviceId, state.draft.masterId, state.calYear, state.calMonth, masters, state.step])

  useEffect(() => {
    if (!state.draft.date || state.step !== 'datetime') return
    setSlotsLoading(true)
    if (state.draft.serviceId && isApiConfigured) {
      api.getTimeSlots(state.draft.masterId, state.draft.serviceId, masters, services, state.draft.date)
        .then(slots => { setTimeSlots(slots); setSlotsLoading(false) })
        .catch(() => { setTimeSlots(generateTimeSlots(state.draft.date!)); setSlotsLoading(false) })
    } else {
      setTimeSlots(generateTimeSlots(state.draft.date))
      setSlotsLoading(false)
    }
  }, [state.draft.date, state.draft.serviceId, state.draft.masterId, masters, services, state.step])

  const handleClose = () => {
    onClose()
    setTimeout(() => dispatch({ type: 'RESET' }), 300)
  }

  const order = FLOW_ORDERS[state.flow]
  const currentBuildStep = stepToBuildStep(state.step)
  const buildStepIndex = currentBuildStep ? order.indexOf(currentBuildStep) : -1

  const relevantMasters = state.draft.serviceId
    ? masters.filter(m => m.services.includes(state.draft.serviceId!))
    : masters

  const preselectedMaster = state.preselectedMasterId
    ? masters.find(m => m.id === state.preselectedMasterId)
    : undefined

  const selectableServices = preselectedMaster
    ? services.filter(s => preselectedMaster.services.includes(s.id))
    : services

  const currentService = state.draft.serviceId
    ? services.find(s => s.id === state.draft.serviceId)
    : undefined

  const isDatetimeLastStep = order.indexOf('datetime') === order.length - 1
  const isMasterLastStep = order.indexOf('master') === order.length - 1

  function goBack() {
    if (state.step === 'variant') {
      dispatch({ type: 'GO_STEP', step: 'service' })
      return
    }
    const bs = stepToBuildStep(state.step)
    if (!bs) return
    const idx = order.indexOf(bs)
    dispatch({ type: 'GO_STEP', step: idx > 0 ? order[idx - 1] : 'entry' })
  }

  async function handleMasterClick(masterId: string | null) {
    setMasterConflict(false)
    if (
      isMasterLastStep && masterId && state.draft.serviceId &&
      state.draft.date && state.draft.time && isApiConfigured
    ) {
      setMasterCheckingId(masterId)
      try {
        const slots = await api.getTimeSlots(masterId, state.draft.serviceId, masters, services, state.draft.date)
        const ok = slots.some(s => s.time === state.draft.time && s.available)
        setMasterCheckingId(null)
        if (!ok) { setMasterConflict(true); return }
      } catch {
        setMasterCheckingId(null)
      }
    }
    dispatch({ type: 'SELECT_MASTER', id: masterId })
  }

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
    if (!state.cart.length) errors.cart = 'Добавьте хотя бы одну услугу'
    return errors
  }

  async function handleSubmit() {
    dispatch({ type: 'SUBMIT_START' })
    for (const item of state.cart) {
      const selectedSvc  = services.find(s => s.id === item.serviceId)
      const selectedMstr = masters.find(m => m.id === item.masterId)
      await addBooking({
        service: selectedSvc?.name ?? '',
        serviceId: item.serviceId,
        variantName: item.variantName ?? undefined,
        master: selectedMstr?.name ?? null,
        masterId: item.masterId ?? undefined,
        date: item.date.toLocaleDateString('en-CA'),
        time: item.time,
        name: state.name,
        phone: state.phone,
        comment: state.comment,
        status: 'new',
        source: 'website',
      })
    }
    dispatch({ type: 'SUBMIT_DONE' })
  }

  function cartLabel(item: CartItem) {
    const svc = services.find(s => s.id === item.serviceId)
    const mstr = masters.find(m => m.id === item.masterId)
    return {
      service: item.variantName ? `${svc?.name ?? ''} — ${item.variantName}` : (svc?.name ?? ''),
      master: mstr?.name ?? 'Любой мастер',
      when: `${item.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${item.time}`,
    }
  }

  const headerTitle =
    state.step === 'entry' ? 'Онлайн-запись'
    : state.step === 'cart' ? 'Ваша запись'
    : state.step === 'details' ? 'Контакты'
    : state.step === 'confirm' ? 'Подтверждение'
    : 'Онлайн-запись'

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
            <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(26,26,26,0.1)] shrink-0">
              <div className="flex items-center gap-3">
                {(buildStepIndex >= 0 || state.step === 'variant') && !state.submitted && (
                  <button onClick={goBack}
                    className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors" aria-label="Назад">
                    <ArrowLeft size={18} />
                  </button>
                )}
                {(state.step === 'details' || state.step === 'confirm') && !state.submitted && (
                  <button onClick={() => dispatch({ type: 'GO_STEP', step: state.step === 'confirm' ? 'details' : 'cart' })}
                    className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors" aria-label="Назад">
                    <ArrowLeft size={18} />
                  </button>
                )}
                {state.step === 'cart' && !state.submitted && state.cart.length > 0 && (
                  <button onClick={() => dispatch({ type: 'START_ANOTHER' })}
                    className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors" aria-label="Назад">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h2 className="font-medium text-[var(--color-ink)] text-base">{headerTitle}</h2>
              </div>
              <button onClick={handleClose} className="text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors"><X size={20} /></button>
            </div>

            {buildStepIndex >= 0 && !state.submitted && (
              <div className="flex shrink-0 border-b border-[rgba(26,26,26,0.1)]">
                {order.map((s, i) => {
                  const done = i < buildStepIndex
                  const active = s === currentBuildStep
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

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={state.step}
                  initial={{ opacity: 0, x: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>

                  {state.step === 'entry' && (
                    <div className="p-6">
                      <div className="space-y-2">
                        <button onClick={() => dispatch({ type: 'SET_FLOW', flow: 'service' })}
                          className="w-full flex items-center gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors duration-150"
                          style={{ borderRadius: 'var(--radius-input)' }}>
                          <div className="w-9 h-9 bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 rounded-full">
                            <Scissors size={17} className="text-[var(--color-accent)]" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--color-ink)]">Услуга</span>
                            <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">Далее: мастер, затем дата и время</span>
                          </div>
                        </button>
                        <button onClick={() => dispatch({ type: 'SET_FLOW', flow: 'master' })}
                          className="w-full flex items-center gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors duration-150"
                          style={{ borderRadius: 'var(--radius-input)' }}>
                          <div className="w-9 h-9 bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 rounded-full">
                            <UsersThree size={17} className="text-[var(--color-accent)]" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--color-ink)]">Мастер</span>
                            <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">Далее: услуга, затем дата и время</span>
                          </div>
                        </button>
                        <button onClick={() => dispatch({ type: 'SET_FLOW', flow: 'time' })}
                          className="w-full flex items-center gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors duration-150"
                          style={{ borderRadius: 'var(--radius-input)' }}>
                          <div className="w-9 h-9 bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0 rounded-full">
                            <Clock size={17} className="text-[var(--color-accent)]" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-[var(--color-ink)]">Дата и время</span>
                            <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">Далее: услуга, затем мастер</span>
                          </div>
                        </button>
                      </div>
                      {state.cart.length > 0 && (
                        <button onClick={() => dispatch({ type: 'GO_STEP', step: 'cart' })}
                          className="mt-5 w-full py-3 border border-[rgba(26,26,26,0.15)] text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-colors"
                          style={{ borderRadius: 'var(--radius-btn)' }}>
                          К списку записей ({state.cart.length})
                        </button>
                      )}
                    </div>
                  )}

                  {state.step === 'service' && (
                    <div className="p-6">
                      {preselectedMaster ? (
                        <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-[var(--color-surface)]" style={{ borderRadius: 'var(--radius-card)' }}>
                          <img src={preselectedMaster.photo || 'https://picsum.photos/seed/avatar/80/80'} alt={preselectedMaster.name}
                            className="w-10 h-10 object-cover shrink-0 rounded-full" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-ink)] truncate">{preselectedMaster.name}</p>
                            <p className="text-xs text-[var(--color-ink-tertiary)]">Выберите услугу у этого мастера</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--color-ink-secondary)] mb-2">Выберите услугу:</p>
                      )}
                      {state.cart.length > 0 && (
                        <p className="text-xs text-[var(--color-accent)] mb-5">
                          В записи уже {state.cart.length}: можно добавить ещё к другому мастеру
                        </p>
                      )}
                      {!state.cart.length && !preselectedMaster && (
                        <p className="text-xs text-[var(--color-ink-tertiary)] mb-5">
                          Можно записаться сразу на несколько услуг к разным мастерам
                        </p>
                      )}
                      <div className="space-y-2">
                        {selectableServices.map(svc => (
                          <button key={svc.id}
                            onClick={() => dispatch({ type: 'SELECT_SERVICE', id: svc.id, hasVariants: !!svc.variants?.length })}
                            className="w-full flex items-center justify-between px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors duration-150"
                            style={{ borderRadius: 'var(--radius-input)' }}>
                            <div>
                              <span className="text-sm font-medium text-[var(--color-ink)]">{svc.name}</span>
                              <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">
                                {svc.duration}{svc.variants?.length ? ` · ${svc.variants.length} вида` : ''}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-[var(--color-accent)]">
                              от {svc.priceFrom.toLocaleString('ru-RU')} ₽
                            </span>
                          </button>
                        ))}
                      </div>
                      {state.cart.length > 0 && (
                        <button onClick={() => dispatch({ type: 'GO_STEP', step: 'cart' })}
                          className="mt-5 w-full py-3 border border-[rgba(26,26,26,0.15)] text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)] transition-colors"
                          style={{ borderRadius: 'var(--radius-btn)' }}>
                          К списку записей ({state.cart.length})
                        </button>
                      )}
                    </div>
                  )}

                  {state.step === 'variant' && currentService && (
                    <div className="p-6">
                      <p className="text-sm text-[var(--color-ink-secondary)] mb-5">
                        Выберите вид услуги «{currentService.name}»:
                      </p>
                      <div className="space-y-2">
                        {(currentService.variants ?? []).map(v => (
                          <button key={v.id}
                            onClick={() => dispatch({ type: 'SELECT_VARIANT', id: v.id, name: v.name })}
                            className="w-full flex items-center justify-between px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors duration-150"
                            style={{ borderRadius: 'var(--radius-input)' }}>
                            <span className="text-sm font-medium text-[var(--color-ink)]">{v.name}</span>
                            <span className="text-sm font-medium text-[var(--color-accent)]">
                              от {(v.priceFrom ?? currentService.priceFrom).toLocaleString('ru-RU')} ₽
                              {v.durationMinutes ? ` · ${v.durationMinutes} мин` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {state.step === 'master' && (
                    <div className="p-6">
                      <p className="text-sm text-[var(--color-ink-secondary)] mb-5">Выберите мастера:</p>
                      {masterConflict && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2.5 mb-4 px-4 py-3 bg-red-50 border border-red-200"
                          style={{ borderRadius: 'var(--radius-card)' }}>
                          <Warning size={16} className="text-red-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs text-red-700 leading-relaxed">
                              Этот мастер занят в выбранное время. Выберите другого мастера или другое время.
                            </p>
                            <button onClick={() => { setMasterConflict(false); dispatch({ type: 'GO_STEP', step: 'datetime' }) }}
                              className="text-xs font-medium text-red-700 underline mt-1.5">
                              Выбрать другое время
                            </button>
                          </div>
                        </motion.div>
                      )}
                      <div className="space-y-2">
                        <button onClick={() => handleMasterClick(null)}
                          disabled={masterCheckingId !== null}
                          className="w-full flex items-center gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors disabled:opacity-50"
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
                          <button key={m.id} onClick={() => handleMasterClick(m.id)}
                            disabled={masterCheckingId !== null}
                            className="w-full flex items-center gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)] hover:border-[var(--color-accent)] text-left transition-colors disabled:opacity-50"
                            style={{ borderRadius: 'var(--radius-input)' }}>
                            <img src={m.photo || 'https://picsum.photos/seed/avatar/80/80'} alt={m.name}
                              className="w-9 h-9 object-cover shrink-0 rounded-full" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[var(--color-ink)]">{m.name}</span>
                              <span className="block text-xs text-[var(--color-ink-tertiary)] mt-0.5">{m.role} · {m.experience}</span>
                            </div>
                            {masterCheckingId === m.id && (
                              <CircleNotch size={16} className="text-[var(--color-accent)] animate-spin shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {state.step === 'datetime' && (
                    <div className="p-6">
                      {!state.draft.serviceId && (
                        <p className="text-xs text-[var(--color-ink-tertiary)] mb-4">
                          Показаны общие рабочие часы — услугу и мастера уточним на следующих шагах.
                        </p>
                      )}
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
                            const isSel = state.draft.date?.getDate() === day && state.draft.date?.getMonth() === state.calMonth
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

                      {state.draft.date && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <CalendarBlank size={14} className="text-[var(--color-accent)]" />
                            <span className="text-xs font-medium text-[var(--color-ink)]">
                              {state.draft.date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                                    ${state.draft.time === slot.time ? 'bg-[var(--color-ink)] text-white font-medium' : ''}
                                    ${slot.available && state.draft.time !== slot.time ? 'border border-[rgba(26,26,26,0.15)] hover:border-[var(--color-accent)] text-[var(--color-ink)]' : ''}
                                    ${!slot.available ? 'border border-[rgba(26,26,26,0.06)] text-[var(--color-ink-tertiary)] line-through cursor-not-allowed' : ''}`}
                                  style={{ borderRadius: 'var(--radius-input)' }}>
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {state.draft.date && state.draft.time && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                          <button onClick={() => dispatch({ type: 'CONTINUE_DATETIME' })}
                            className="w-full py-3.5 bg-[var(--color-ink)] text-white text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] active:scale-[0.99] transition-all duration-200"
                            style={{ borderRadius: 'var(--radius-btn)' }}>
                            {isDatetimeLastStep ? 'Добавить в запись' : 'Далее'} <ArrowRight size={16} />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {state.step === 'cart' && (
                    <div className="p-6">
                      <p className="text-sm text-[var(--color-ink-secondary)] mb-5">
                        Выбрано услуг: {state.cart.length}. Можно добавить ещё к другому мастеру.
                      </p>
                      <div className="space-y-2 mb-6">
                        {state.cart.map(item => {
                          const label = cartLabel(item)
                          return (
                            <div key={item.id}
                              className="flex items-start justify-between gap-3 px-4 py-3.5 border border-[rgba(26,26,26,0.1)]"
                              style={{ borderRadius: 'var(--radius-card)' }}>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--color-ink)]">{label.service}</div>
                                <div className="text-xs text-[var(--color-ink-tertiary)] mt-0.5">{label.master}</div>
                                <div className="text-xs text-[var(--color-accent)] mt-1">{label.when}</div>
                              </div>
                              <button onClick={() => dispatch({ type: 'REMOVE_FROM_CART', id: item.id })}
                                className="text-[var(--color-ink-tertiary)] hover:text-red-500 transition-colors shrink-0 p-1"
                                aria-label="Удалить">
                                <Trash size={16} />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                      <div className="space-y-3">
                        <button onClick={() => dispatch({ type: 'START_ANOTHER' })}
                          className="w-full py-3.5 border border-[rgba(26,26,26,0.15)] text-[var(--color-ink)] text-sm font-medium flex items-center justify-center gap-2 hover:border-[var(--color-accent)] transition-colors"
                          style={{ borderRadius: 'var(--radius-btn)' }}>
                          <Plus size={16} /> Добавить ещё услугу
                        </button>
                        <button
                          onClick={() => {
                            if (!state.cart.length) return
                            dispatch({ type: 'GO_STEP', step: 'details' })
                          }}
                          disabled={!state.cart.length}
                          className="w-full py-3.5 bg-[var(--color-ink)] text-white text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] active:scale-[0.99] transition-all disabled:opacity-40"
                          style={{ borderRadius: 'var(--radius-btn)' }}>
                          Оформить запись <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {state.step === 'details' && (
                    <div className="p-6">
                      <div className="bg-[var(--color-surface)] px-4 py-3 mb-6 text-sm space-y-2" style={{ borderRadius: 'var(--radius-card)' }}>
                        {state.cart.map(item => {
                          const label = cartLabel(item)
                          return (
                            <div key={item.id} className="flex justify-between gap-3">
                              <span className="text-[var(--color-ink-secondary)] truncate">{label.service}</span>
                              <span className="font-medium text-[var(--color-ink)] text-right shrink-0">{label.when}</span>
                            </div>
                          )
                        })}
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

                  {state.step === 'confirm' && !state.submitted && (
                    <div className="p-6">
                      <h3 className="font-medium text-[var(--color-ink)] mb-5">Подтверждение записи</h3>
                      <div className="border border-[rgba(26,26,26,0.1)] divide-y divide-[rgba(26,26,26,0.1)] mb-4" style={{ borderRadius: 'var(--radius-card)' }}>
                        {state.cart.map((item, i) => {
                          const label = cartLabel(item)
                          return (
                            <div key={item.id} className="px-4 py-3 text-sm space-y-1">
                              <div className="text-xs text-[var(--color-ink-tertiary)]">Услуга {i + 1}</div>
                              <div className="flex justify-between gap-3">
                                <span className="text-[var(--color-ink-secondary)]">Услуга</span>
                                <span className="font-medium text-[var(--color-ink)] text-right">{label.service}</span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span className="text-[var(--color-ink-secondary)]">Мастер</span>
                                <span className="font-medium text-[var(--color-ink)] text-right">{label.master}</span>
                              </div>
                              <div className="flex justify-between gap-3">
                                <span className="text-[var(--color-ink-secondary)]">Когда</span>
                                <span className="font-medium text-[var(--color-ink)] text-right">{label.when}</span>
                              </div>
                            </div>
                          )
                        })}
                        {[
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
                      <button onClick={handleSubmit} disabled={state.submitting}
                        className="w-full py-3.5 bg-[var(--color-accent)] text-white text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-[var(--color-ink)] active:scale-[0.99] transition-all disabled:opacity-60"
                        style={{ borderRadius: 'var(--radius-btn)' }}>
                        {state.submitting ? 'Отправка...' : 'Подтвердить запись'} <Check size={16} weight="bold" />
                      </button>
                    </div>
                  )}

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
                        Услуг в записи: {state.cart.length}
                      </p>
                      <button onClick={handleClose}
                        className="px-8 py-3 bg-[var(--color-ink)] text-white text-sm font-medium tracking-wide hover:bg-[var(--color-accent)] active:scale-[0.98] transition-all">
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
