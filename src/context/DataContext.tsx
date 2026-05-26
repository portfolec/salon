import {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import * as api from '../lib/api'
import type { Service, Master, SiteContent, Booking } from '../data'
import {
  services as defaultServices,
  masters  as defaultMasters,
} from '../data'

export type { Booking, SiteContent }

const DEFAULT_CONTENT: SiteContent = {
  heroTitle: 'Красота в каждой детали',
  heroSubtitle: 'Премиальный салон: стрижки, маникюр, педикюр, ресницы, брови, массаж и эпиляция.',
  address: 'Москва, ул. Профсоюзная, 56к2',
  phone: '+7 (495) 123-45-67',
  hoursWeekday: '10:00 - 20:00',
  hoursSaturday: '10:00 - 19:00',
  telegramUrl: 'https://t.me/stilnyaktsent',
  instagramUrl: 'https://instagram.com/stilnyaktsent',
  yandexMetrikaId: '',
}

// ─── localStorage fallback (when Supabase not configured) ─────────────────────

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
  content: SiteContent
  loading: boolean
  newBookingsCount: number
  isDb: boolean

  // Actions
  addService:    (s: Omit<Service, 'id'>) => Promise<void>
  updateService: (s: Service) => Promise<void>
  deleteService: (id: string) => Promise<void>

  addMaster:    (m: Omit<Master, 'id'>, serviceIds: string[]) => Promise<void>
  updateMaster: (m: Master, serviceIds: string[]) => Promise<void>
  deleteMaster: (id: string) => Promise<void>

  addBooking:           (b: Omit<Booking, 'id' | 'createdAt'>) => Promise<void>
  updateBookingStatus:  (id: string, status: Booking['status']) => Promise<void>

  setContent: (c: SiteContent) => Promise<void>

  reload: () => Promise<void>
}

const DataContext = createContext<ContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>(defaultServices)
  const [masters,  setMasters]  = useState<Master[]>(defaultMasters)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [content,  setContentState] = useState<SiteContent>(DEFAULT_CONTENT)
  const [loading,  setLoading]  = useState(isSupabaseConfigured)

  const isDb = isSupabaseConfigured

  // ── load all data ──────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    if (!isDb) {
      const ls = loadLS()
      if (ls?.services) setServices(ls.services)
      if (ls?.masters)  setMasters(ls.masters)
      if (ls?.bookings) setBookings(ls.bookings)
      if (ls?.content)  setContentState(ls.content)
      return
    }
    setLoading(true)
    try {
      const [svcs, msts, bkgs, cnt] = await Promise.all([
        api.fetchServices(),
        api.fetchMasters(),
        api.fetchBookings(),
        api.fetchContent(),
      ])
      setServices(svcs)
      setMasters(msts)
      setBookings(bkgs)
      setContentState(cnt as SiteContent)
    } catch (e) {
      console.error('[DataContext] load error', e)
    } finally {
      setLoading(false)
    }
  }, [isDb])

  useEffect(() => { reload() }, [reload])

  // ── realtime: new bookings ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isDb) return
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel('bookings-rt')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, payload => {
          try {
            const b = payload.new as Record<string, unknown>
            setBookings(prev => [{
              id: b.id as string, createdAt: b.created_at as string,
              service: b.service_name as string, serviceId: b.service_id as string,
              master: b.master_name as string, masterId: b.master_id as string,
              date: b.date as string, time: (b.time as string).slice(0, 5),
              name: b.client_name as string, phone: b.client_phone as string,
              comment: b.comment as string, status: b.status as Booking['status'],
            }, ...prev])
          } catch (e) { console.warn('[Realtime] INSERT parse error', e) }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, payload => {
          try {
            const b = payload.new as Record<string, unknown>
            setBookings(prev => prev.map(x => x.id === b.id ? { ...x, status: b.status as Booking['status'] } : x))
          } catch (e) { console.warn('[Realtime] UPDATE parse error', e) }
        })
        .subscribe(() => { /* realtime connected */ })
    } catch (e) {
      console.warn('[Realtime] failed to set up channel (non-fatal):', e)
    }
    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch {}
      }
    }
  }, [isDb])

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
      await api.createBooking(b) // realtime will add it to state
    } else {
      const nb: Booking = { ...b, id: Date.now().toString(), createdAt: new Date().toISOString(), status: 'new' }
      setBookings(prev => { const n = [nb, ...prev]; saveLS('bookings', n); return n })
    }
  }

  const updateBookingStatus = async (id: string, status: Booking['status']) => {
    if (isDb) {
      await api.updateBookingStatus(id, status)
      // realtime UPDATE will handle state update
    } else {
      setBookings(prev => { const n = prev.map(x => x.id === id ? { ...x, status } : x); saveLS('bookings', n); return n })
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
      services, masters, bookings, content, loading, newBookingsCount, isDb,
      addService, updateService, deleteService,
      addMaster, updateMaster, deleteMaster,
      addBooking, updateBookingStatus,
      setContent, reload,
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
