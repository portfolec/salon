import { API_BASE } from './backend'
import { getToken, clearSession, type AdminUser } from './auth'
import type { Service, Master, SiteContent, TimeSlot, Booking, Vacancy, Testimonial } from '../data'

// ─── fetch helper ────────────────────────────────────────────────────────────

async function http<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (res.status === 401) clearSession()
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    let message = body
    try { message = (JSON.parse(body) as { error?: string }).error || body } catch { /* not JSON */ }
    throw new Error(message || `${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function login(username: string, password: string): Promise<{ token: string; user: AdminUser }> {
  return http<{ token: string; user: AdminUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function logout(): Promise<void> {
  try { await http<void>('/api/auth/logout', { method: 'POST' }) } catch { /* best-effort */ }
}

export async function fetchMe(): Promise<AdminUser> {
  const { user } = await http<{ user: AdminUser }>('/api/auth/me')
  return user
}

// ─── ADMIN USERS (staff account management, owner-only) ─────────────────────

export interface AdminUserInput {
  username: string
  password: string
  role?: 'owner' | 'staff' | 'master'
  permissions?: Partial<AdminUser['permissions']>
  masterId?: string | null
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return http<AdminUser[]>('/api/admin-users')
}

export async function createAdminUser(input: AdminUserInput): Promise<AdminUser> {
  return http<AdminUser>('/api/admin-users', { method: 'POST', body: JSON.stringify(input) })
}

export async function updateAdminUser(
  id: string,
  patch: { password?: string; role?: 'owner' | 'staff' | 'master'; active?: boolean; permissions?: Partial<AdminUser['permissions']>; masterId?: string | null },
): Promise<AdminUser> {
  return http<AdminUser>(`/api/admin-users/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
}

export async function deleteAdminUser(id: string): Promise<void> {
  await http<void>(`/api/admin-users/${id}`, { method: 'DELETE' })
}

// ─── MASTER PERSONAL CABINET (self-service) ─────────────────────────────────

export interface MyScheduleDay {
  dayOfWeek: number
  startTime: string
  endTime: string
  active: boolean
}

export interface MyDayOff {
  id: string
  date: string
  reason: string
}

export async function fetchMyBookings(): Promise<Booking[]> {
  return http<Booking[]>('/api/my/bookings')
}

export async function fetchMySchedule(): Promise<MyScheduleDay[]> {
  return http<MyScheduleDay[]>('/api/my/schedule')
}

export async function fetchMyDaysOff(): Promise<MyDayOff[]> {
  return http<MyDayOff[]>('/api/my/days-off')
}

// ─── FILE UPLOADS ────────────────────────────────────────────────────────────

/** Uploads an image file to the backend and returns its absolute URL. */
export async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('photo', file)
  const token = getToken()
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(body?.error || `Ошибка загрузки файла (${res.status})`)
  }
  const data = await res.json() as { url: string }
  // The backend returns either a relative path (local-disk fallback, e.g. /uploads/x.png)
  // or an already-absolute URL (S3 storage, e.g. https://s3.twcstorage.ru/...) — only
  // prepend our own API base in the relative case.
  return /^https?:\/\//i.test(data.url) ? data.url : `${API_BASE}${data.url}`
}

// ─── SERVICES ────────────────────────────────────────────────────────────────

export async function fetchServices(): Promise<Service[]> {
  return http<Service[]>('/api/services')
}

export async function createService(s: Omit<Service, 'id'>): Promise<Service> {
  return http<Service>('/api/services', { method: 'POST', body: JSON.stringify(s) })
}

export async function updateService(s: Service): Promise<void> {
  await http<void>(`/api/services/${s.id}`, { method: 'PUT', body: JSON.stringify(s) })
}

export async function deleteService(id: string): Promise<void> {
  await http<void>(`/api/services/${id}`, { method: 'DELETE' })
}

// ─── MASTERS ─────────────────────────────────────────────────────────────────

export async function fetchMasters(): Promise<Master[]> {
  return http<Master[]>('/api/masters')
}

export async function createMaster(m: Omit<Master, 'id'>, serviceIds: string[]): Promise<Master> {
  return http<Master>('/api/masters', { method: 'POST', body: JSON.stringify({ master: m, serviceIds }) })
}

export async function updateMaster(m: Master, serviceIds: string[]): Promise<void> {
  await http<void>(`/api/masters/${m.id}`, { method: 'PUT', body: JSON.stringify({ master: m, serviceIds }) })
}

export async function deleteMaster(id: string): Promise<void> {
  await http<void>(`/api/masters/${id}`, { method: 'DELETE' })
}

// ─── SCHEDULE ────────────────────────────────────────────────────────────────

export interface ScheduleDay {
  dayOfWeek: number
  startTime: string
  endTime: string
  active: boolean
}

export async function fetchSchedule(masterId: string): Promise<ScheduleDay[]> {
  return http<ScheduleDay[]>(`/api/masters/${masterId}/schedule`)
}

export async function saveSchedule(masterId: string, days: ScheduleDay[]): Promise<void> {
  await http<void>(`/api/masters/${masterId}/schedule`, { method: 'PUT', body: JSON.stringify({ days }) })
}

export interface WorkInterval {
  startTime: string
  endTime: string
}

export interface WorkDay {
  date: string
  intervals: WorkInterval[]
}

export async function fetchWorkDays(masterId: string, year: number, month: number): Promise<WorkDay[]> {
  return http<WorkDay[]>(`/api/masters/${masterId}/work-days?year=${year}&month=${month}`)
}

export async function saveWorkDay(masterId: string, date: string, intervals: WorkInterval[]): Promise<WorkDay> {
  return http<WorkDay>(`/api/masters/${masterId}/work-days/${date}`, {
    method: 'PUT',
    body: JSON.stringify({ intervals }),
  })
}

export async function fetchMyWorkDays(year: number, month: number): Promise<WorkDay[]> {
  return http<WorkDay[]>(`/api/my/work-days?year=${year}&month=${month}`)
}

export interface DayOff {
  id: string
  date: string
  reason: string
}

export async function fetchDaysOff(masterId: string): Promise<DayOff[]> {
  return http<DayOff[]>(`/api/masters/${masterId}/days-off`)
}

export async function addDayOff(masterId: string, date: string, reason = ''): Promise<DayOff> {
  return http<DayOff>(`/api/masters/${masterId}/days-off`, { method: 'POST', body: JSON.stringify({ date, reason }) })
}

export async function removeDayOff(id: string): Promise<void> {
  await http<void>(`/api/days-off/${id}`, { method: 'DELETE' })
}

// ─── SERVICE DAYS (per-service day restrictions) ─────────────────────────────

/**
 * Returns set of day_of_week numbers (0=Пн … 6=Вс) the master does this service.
 * Empty set means "no restriction — all working days".
 */
export async function fetchServiceDays(masterId: string, serviceId: string): Promise<Set<number>> {
  const all = await fetchAllServiceDays(masterId)
  return all[serviceId] ?? new Set()
}

/**
 * Fetches all service-day restrictions for a master (all services at once).
 * Returns map: serviceId → Set<dayOfWeek>
 */
export async function fetchAllServiceDays(masterId: string): Promise<Record<string, Set<number>>> {
  const raw = await http<Record<string, number[]>>(`/api/masters/${masterId}/service-days`)
  const result: Record<string, Set<number>> = {}
  for (const [sid, days] of Object.entries(raw)) result[sid] = new Set(days)
  return result
}

/**
 * Saves which days a master does a specific service.
 * Replaces all previous rows for this master+service.
 * Pass empty set to remove all restrictions (available every working day).
 */
export async function saveServiceDays(masterId: string, serviceId: string, days: Set<number>): Promise<void> {
  await http<void>(`/api/masters/${masterId}/service-days/${serviceId}`, {
    method: 'PUT',
    body: JSON.stringify({ days: Array.from(days) }),
  })
}

// ─── VARIANT DAYS (per service-variant day restrictions) ────────────────────

/**
 * Fetches all variant-day restrictions for a master (all variants at once).
 * Returns map: variantId → Set<dayOfWeek>
 */
export async function fetchAllVariantDays(masterId: string): Promise<Record<string, Set<number>>> {
  const raw = await http<Record<string, number[]>>(`/api/masters/${masterId}/variant-days`)
  const result: Record<string, Set<number>> = {}
  for (const [vid, days] of Object.entries(raw)) result[vid] = new Set(days)
  return result
}

/**
 * Saves which days a master does a specific service variant.
 * Pass empty set to remove all restrictions (available same days as the service).
 */
export async function saveVariantDays(masterId: string, variantId: string, days: Set<number>): Promise<void> {
  await http<void>(`/api/masters/${masterId}/variant-days/${variantId}`, {
    method: 'PUT',
    body: JSON.stringify({ days: Array.from(days) }),
  })
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

export async function fetchBookings(): Promise<Booking[]> {
  return http<Booking[]>('/api/bookings')
}

export async function createBooking(b: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  return http<Booking>('/api/bookings', { method: 'POST', body: JSON.stringify(b) })
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  await http<void>(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export async function updateBookingMaster(id: string, masterId: string | null): Promise<{ masterId: string | null; masterName: string }> {
  return http<{ masterId: string | null; masterName: string }>(`/api/bookings/${id}/master`, {
    method: 'PATCH',
    body: JSON.stringify({ masterId }),
  })
}

export async function deleteBooking(id: string): Promise<void> {
  await http<void>(`/api/bookings/${id}`, { method: 'DELETE' })
}

// ─── CONTENT ─────────────────────────────────────────────────────────────────

const DEFAULT_CONTENT: SiteContent = {
  heroTitle: 'Красота в каждой детали',
  heroSubtitle: 'Премиальный салон: стрижки, маникюр, педикюр, ресницы, брови, массаж и эпиляция.',
  address: 'Ленинградская обл., г. Сланцы, ул. Кирова, 39',
  phone: '+7 (495) 123-45-67',
  hours: 'Ежедневно 10:00 - 20:00',
  telegramUrl: 'https://t.me/stilnyaktsent',
  instagramUrl: 'https://instagram.com/stilnyaktsent',
  vkUrl: '',
  maxUrl: '',
  yandexMapsUrl: 'https://yandex.ru/maps/-/CPHUNU0q',
  twoGisUrl: '',
  yandexMetrikaId: '',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  notificationEmail: '',
}

export async function fetchContent(): Promise<SiteContent> {
  try {
    const map = await http<Record<string, string>>('/api/content')
    if (!Object.keys(map).length) return DEFAULT_CONTENT
    return { ...DEFAULT_CONTENT, ...map } as SiteContent
  } catch {
    return DEFAULT_CONTENT
  }
}

export async function saveContent(c: SiteContent): Promise<void> {
  await http<void>('/api/content', { method: 'PUT', body: JSON.stringify(c) })
}

// ─── VACANCIES ───────────────────────────────────────────────────────────────

export async function fetchVacancies(): Promise<Vacancy[]> {
  return http<Vacancy[]>('/api/vacancies')
}

export async function createVacancy(v: Omit<Vacancy, 'id'>): Promise<Vacancy> {
  return http<Vacancy>('/api/vacancies', { method: 'POST', body: JSON.stringify(v) })
}

export async function updateVacancy(v: Vacancy): Promise<void> {
  await http<void>(`/api/vacancies/${v.id}`, { method: 'PUT', body: JSON.stringify(v) })
}

export async function deleteVacancy(id: string): Promise<void> {
  await http<void>(`/api/vacancies/${id}`, { method: 'DELETE' })
}

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────

export async function fetchTestimonials(): Promise<Testimonial[]> {
  return http<Testimonial[]>('/api/testimonials')
}

export async function createTestimonial(t: Omit<Testimonial, 'id'>): Promise<Testimonial> {
  return http<Testimonial>('/api/testimonials', { method: 'POST', body: JSON.stringify(t) })
}

export async function updateTestimonial(t: Testimonial): Promise<void> {
  await http<void>(`/api/testimonials/${t.id}`, { method: 'PUT', body: JSON.stringify(t) })
}

export async function deleteTestimonial(id: string): Promise<void> {
  await http<void>(`/api/testimonials/${id}`, { method: 'DELETE' })
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

/** Returns set of day-numbers (1–31) available for booking in a given month */
export async function getAvailableDays(
  masterId: string | null,
  serviceId: string,
  _masterList: Master[],
  year: number,
  month: number,
  variantId?: string | null,
): Promise<Set<number>> {
  const params = new URLSearchParams({ serviceId, year: String(year), month: String(month) })
  if (masterId) params.set('masterId', masterId)
  if (variantId) params.set('variantId', variantId)
  const days = await http<number[]>(`/api/availability/days?${params}`)
  return new Set(days)
}

/** Returns time slots for a specific master + service + date */
export async function getTimeSlots(
  masterId: string | null,
  serviceId: string,
  _masterList: Master[],
  services: Service[],
  date: Date,
  variantId?: string | null,
): Promise<TimeSlot[]> {
  const svc = services.find(s => s.id === serviceId)
  const variant = variantId ? svc?.variants?.find(v => v.id === variantId) : undefined
  const durationMin = variant?.durationMinutes ?? svc?.durationMinutes ?? 60
  const dateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD
  const params = new URLSearchParams({
    serviceId,
    date: dateStr,
    durationMinutes: String(durationMin),
  })
  if (masterId) params.set('masterId', masterId)
  if (variantId) params.set('variantId', variantId)
  return http<TimeSlot[]>(`/api/availability/slots?${params}`)
}
