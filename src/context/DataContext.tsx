import {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from 'react'
import emailjs from '@emailjs/browser'
import { isApiConfigured } from '../lib/backend'
import { getToken } from '../lib/auth'
import * as api from '../lib/api'
import type { Service, Master, SiteContent, Booking, Vacancy, Testimonial } from '../data'
import {
  services as defaultServices,
  masters  as defaultMasters,
  vacancies as defaultVacancies,
  testimonials as defaultTestimonials,
} from '../data'

export type { Booking, SiteContent }

const DEFAULT_CONTENT: SiteContent = {
  heroTitle: 'Красота в каждой детали',
  heroSubtitle: 'Премиальный салон: стрижки, маникюр, педикюр, ресницы, брови, массаж и эпиляция.',
  address: 'Ленинградская обл., г. Сланцы, ул. Кирова, 39',
  phone: '+7 (495) 123-45-67',
  hours: 'Ежедневно 10:00 - 20:00',
  telegramUrl: 'https://t.me/stilnyaktsent',
  instagramUrl: 'https://instagram.com/stilnyaktsent',
  vkUrl: '',
  yandexMapsUrl: 'https://yandex.ru/maps/-/CPHUNU0q',
  twoGisUrl: '',
  yandexMetrikaId: '',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  notificationEmail: '',
}

// ─── localStorage fallback (when API is not configured) ──────────────────────

const LS_KEY = 'sa_data_v2'
function loadLS() {
  try {
    const r = localStorage.getItem(LS_KEY)
    return r ? JSON.parse(r) : null
  } catch { return null }
}
function saveLS(key: string, val: unknown) {
  try {
    const existing = loadLS() ?? {}
    localStorage.setItem(LS_KEY, JSON.stringify({ ...existing, [key]: val }))
  } catch {}
}

// ─── context ─────────────────────────────────────────────────────────────────

interface ContextValue {
  services: Service[]
  masters: Master[]
  bookings: Booking[]
  vacancies: Vacancy[]
  testimonials: Testimonial[]
  content: SiteContent
  loading: boolean
  newBookingsCount: number
  isDb: boolean
  dbError: string | null
  dbOk: boolean

  // Actions
  addService:    (s: Omit<Service, 'id'>) => Promise<void>
  updateService: (s: Service) => Promise<void>
  deleteService: (id: string) => Promise<void>

  addMaster:    (m: Omit<Master, 'id'>, serviceIds: string[]) => Promise<void>
  updateMaster: (m: Master, serviceIds: string[]) => Promise<void>
  deleteMaster: (id: string) => Promise<void>

  addBooking:           (b: Omit<Booking, 'id' | 'createdAt'>) => Promise<void>
  updateBookingStatus:  (id: string, status: Booking['status']) => Promise<void>
  deleteBooking:        (id: string) => Promise<void>

  addVacancy:    (v: Omit<Vacancy, 'id'>) => Promise<void>
  updateVacancy: (v: Vacancy) => Promise<void>
  deleteVacancy: (id: string) => Promise<void>

  addTestimonial:    (t: Omit<Testimonial, 'id'>) => Promise<void>
  updateTestimonial: (t: Testimonial) => Promise<void>
  deleteTestimonial: (id: string) => Promise<void>

  setContent: (c: SiteContent) => Promise<void>

  reload: () => Promise<void>
  refreshBookings: () => Promise<void>
}

const DataContext = createContext<ContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>(defaultServices)
  const [masters,  setMasters]  = useState<Master[]>(defaultMasters)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vacancies, setVacancies] = useState<Vacancy[]>(defaultVacancies)
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials)
  const [content,  setContentState] = useState<SiteContent>(DEFAULT_CONTENT)
  const [loading,  setLoading]  = useState(isApiConfigured)
  const [dbError, setDbError] = useState<string | null>(null)
  const [dbOk, setDbOk] = useState(false)

  const isDb = isApiConfigured

  // ── load all data ──────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    if (!isDb) {
      const ls = loadLS()
      if (ls?.services)  setServices(ls.services)
      if (ls?.masters)   setMasters(ls.masters)
      if (ls?.bookings)  setBookings(ls.bookings)
      if (ls?.vacancies) setVacancies(ls.vacancies)
      if (ls?.testimonials) setTestimonials(ls.testimonials)
      if (ls?.content)   setContentState(ls.content)
      return
    }
    setLoading(true)
    setDbError(null)
    try {
      // Public data — needed by the customer-facing site, always fetched.
      const [svcs, msts, vacs, tstm, cnt] = await Promise.all([
        api.fetchServices(),
        api.fetchMasters(),
        api.fetchVacancies(),
        api.fetchTestimonials(),
        api.fetchContent(),
      ])
      setServices(svcs)
      setMasters(msts)
      setVacancies(vacs)
      setTestimonials(tstm)
      setContentState(cnt as SiteContent)
      setDbOk(true)
    } catch (e) {
      setDbOk(false)
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message?: unknown }).message)
          : String(e)
      setDbError(msg)
      console.error('[DataContext] load error', e)
    } finally {
      setLoading(false)
    }

    // Bookings require an admin session — fetched best-effort so a missing
    // token/permission never blocks the public site from loading.
    await refreshBookings()
  }, [isDb])

  const refreshBookings = useCallback(async () => {
    if (!isDb || !getToken()) return
    try {
      setBookings(await api.fetchBookings())
    } catch (e) {
      console.warn('[DataContext] bookings fetch failed (no session/permission?)', e)
    }
  }, [isDb])

  useEffect(() => { reload() }, [reload])

  // ── polling: pick up new bookings from other channels/tabs ─────────────────
  useEffect(() => {
    if (!isDb) return
    const interval = setInterval(() => {
      if (document.hidden) return
      refreshBookings()
    }, 20000)
    return () => clearInterval(interval)
  }, [isDb, refreshBookings])

  // ── SERVICES ──────────────────────────────────────────────────────────────
  const addService = async (s: Omit<Service, 'id'>) => {
    if (isDb) {
      const created = await api.createService(s)
      setServices(prev => [...prev, created])
    } else {
      const ns = { ...s, id: Date.now().toString() }
      setServices(prev => { const n = [...prev, ns]; saveLS('services', n); return n })
    }
  }

  const updateService = async (s: Service) => {
    if (isDb) {
      await api.updateService(s)
      setServices(prev => prev.map(x => x.id === s.id ? s : x))
    } else {
      setServices(prev => { const n = prev.map(x => x.id === s.id ? s : x); saveLS('services', n); return n })
    }
  }

  const deleteService = async (id: string) => {
    if (isDb) {
      await api.deleteService(id)
      setServices(prev => prev.filter(x => x.id !== id))
    } else {
      setServices(prev => { const n = prev.filter(x => x.id !== id); saveLS('services', n); return n })
    }
  }

  // ── MASTERS ───────────────────────────────────────────────────────────────
  const addMaster = async (m: Omit<Master, 'id'>, serviceIds: string[]) => {
    if (isDb) {
      const created = await api.createMaster(m, serviceIds)
      setMasters(prev => [...prev, created])
    } else {
      const nm = { ...m, id: Date.now().toString(), services: serviceIds }
      setMasters(prev => { const n = [...prev, nm]; saveLS('masters', n); return n })
    }
  }

  const updateMaster = async (m: Master, serviceIds: string[]) => {
    const updated = { ...m, services: serviceIds }
    if (isDb) {
      await api.updateMaster(updated, serviceIds)
      setMasters(prev => prev.map(x => x.id === m.id ? updated : x))
    } else {
      setMasters(prev => { const n = prev.map(x => x.id === m.id ? updated : x); saveLS('masters', n); return n })
    }
  }

  const deleteMaster = async (id: string) => {
    if (isDb) {
      await api.deleteMaster(id)
      setMasters(prev => prev.filter(x => x.id !== id))
    } else {
      setMasters(prev => { const n = prev.filter(x => x.id !== id); saveLS('masters', n); return n })
    }
  }

  // ── BOOKINGS ──────────────────────────────────────────────────────────────
  const addBooking = async (b: Omit<Booking, 'id' | 'createdAt'>) => {
    if (isDb) {
      await api.createBooking(b)
    } else {
      const nb: Booking = { ...b, id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'new' }
      setBookings(prev => { const n = [nb, ...prev]; saveLS('bookings', n); return n })
    }

    // ── EmailJS notification (fire-and-forget) ───────────────────
    const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey, notificationEmail } = content
    if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey && notificationEmail) {
      emailjs.send(
        emailjsServiceId,
        emailjsTemplateId,
        {
          to_email:     notificationEmail,
          client_name:  b.name,
          client_phone: b.phone,
          service:      b.variantName ? `${b.service} (${b.variantName})` : b.service,
          master:       b.master ?? 'Любой мастер',
          date:         b.date,
          time:         b.time,
          comment:      b.comment || '—',
        },
        emailjsPublicKey,
      ).catch(err => console.warn('[EmailJS] notification failed (non-fatal):', err))
    }
  }

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    if (isDb) {
      await api.updateBookingStatus(id, status)
      setBookings(prev => prev.map(x => x.id === id ? { ...x, status } : x))
    } else {
      setBookings(prev => { const n = prev.map(x => x.id === id ? { ...x, status } : x); saveLS('bookings', n); return n })
    }
  }

  const deleteBooking = async (id: string) => {
    if (isDb) {
      await api.deleteBooking(id)
      setBookings(prev => prev.filter(x => x.id !== id))
    } else {
      setBookings(prev => { const n = prev.filter(x => x.id !== id); saveLS('bookings', n); return n })
    }
  }

  // ── VACANCIES ─────────────────────────────────────────────────────────────
  const addVacancy = async (v: Omit<Vacancy, 'id'>) => {
    if (isDb) {
      const created = await api.createVacancy(v)
      setVacancies(prev => [...prev, created])
    } else {
      const nv = { ...v, id: Date.now().toString() }
      setVacancies(prev => { const n = [...prev, nv]; saveLS('vacancies', n); return n })
    }
  }

  const updateVacancy = async (v: Vacancy) => {
    if (isDb) {
      await api.updateVacancy(v)
      setVacancies(prev => prev.map(x => x.id === v.id ? v : x))
    } else {
      setVacancies(prev => { const n = prev.map(x => x.id === v.id ? v : x); saveLS('vacancies', n); return n })
    }
  }

  const deleteVacancy = async (id: string) => {
    if (isDb) {
      await api.deleteVacancy(id)
      setVacancies(prev => prev.filter(x => x.id !== id))
    } else {
      setVacancies(prev => { const n = prev.filter(x => x.id !== id); saveLS('vacancies', n); return n })
    }
  }

  // ── TESTIMONIALS ──────────────────────────────────────────────────────────
  const addTestimonial = async (t: Omit<Testimonial, 'id'>) => {
    if (isDb) {
      const created = await api.createTestimonial(t)
      setTestimonials(prev => [...prev, created])
    } else {
      const nt = { ...t, id: Date.now().toString() }
      setTestimonials(prev => { const n = [...prev, nt]; saveLS('testimonials', n); return n })
    }
  }

  const updateTestimonial = async (t: Testimonial) => {
    if (isDb) {
      await api.updateTestimonial(t)
      setTestimonials(prev => prev.map(x => x.id === t.id ? t : x))
    } else {
      setTestimonials(prev => { const n = prev.map(x => x.id === t.id ? t : x); saveLS('testimonials', n); return n })
    }
  }

  const deleteTestimonial = async (id: string) => {
    if (isDb) {
      await api.deleteTestimonial(id)
      setTestimonials(prev => prev.filter(x => x.id !== id))
    } else {
      setTestimonials(prev => { const n = prev.filter(x => x.id !== id); saveLS('testimonials', n); return n })
    }
  }

  // ── CONTENT ───────────────────────────────────────────────────────────────
  const setContent = async (c: SiteContent) => {
    setContentState(c)
    if (isDb) {
      await api.saveContent(c)
    } else {
      saveLS('content', c)
    }
  }

  const newBookingsCount = bookings.filter(b => b.status === 'new').length

  return (
    <DataContext.Provider value={{
      services, masters, bookings, vacancies, testimonials, content, loading, newBookingsCount, isDb, dbError, dbOk,
      addService, updateService, deleteService,
      addMaster, updateMaster, deleteMaster,
      addBooking, updateBookingStatus, deleteBooking,
      addVacancy, updateVacancy, deleteVacancy,
      addTestimonial, updateTestimonial, deleteTestimonial,
      setContent, reload, refreshBookings,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
