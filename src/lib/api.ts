import { supabase } from './supabase'
import type { Service, Master, SiteContent, TimeSlot, Booking, Vacancy } from '../data'

// ─── helpers ────────────────────────────────────────────────────────────────

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m ?? 0)
}

function minutesToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// ─── SERVICES ────────────────────────────────────────────────────────────────

function rowToService(r: Record<string, unknown>): Service {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    priceFrom: r.price_from as number,
    duration: r.duration as string,
    durationMinutes: (r.duration_minutes as number) ?? 60,
    active: r.active as boolean,
    sortOrder: (r.sort_order as number) ?? 0,
  }
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services').select('*').eq('active', true).order('sort_order')
  if (error) throw error
  return (data ?? []).map(rowToService)
}

export async function createService(s: Omit<Service, 'id'>): Promise<Service> {
  const { data, error } = await supabase.from('services').insert({
    name: s.name, description: s.description, price_from: s.priceFrom,
    duration: s.duration, duration_minutes: s.durationMinutes ?? 60,
    active: true, sort_order: s.sortOrder ?? 0,
  }).select().single()
  if (error) throw error
  return rowToService(data)
}

export async function updateService(s: Service): Promise<void> {
  const { error } = await supabase.from('services').update({
    name: s.name, description: s.description, price_from: s.priceFrom,
    duration: s.duration, duration_minutes: s.durationMinutes ?? 60,
  }).eq('id', s.id)
  if (error) throw error
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').update({ active: false }).eq('id', id)
  if (error) throw error
}

// ─── MASTERS ─────────────────────────────────────────────────────────────────

function rowToMaster(r: Record<string, unknown>, serviceIds: string[] = []): Master {
  return {
    id: r.id as string,
    name: r.name as string,
    role: r.role as string,
    experience: r.experience as string,
    photo: r.photo_url as string,
    services: serviceIds,
  }
}

export async function fetchMasters(): Promise<Master[]> {
  const { data, error } = await supabase
    .from('masters')
    .select('*, master_services(service_id)')
    .eq('active', true)
    .order('sort_order')
  if (error) throw error
  return (data ?? []).map((r) => rowToMaster(r, (r.master_services as { service_id: string }[]).map(s => s.service_id)))
}

export async function createMaster(m: Omit<Master, 'id'>, serviceIds: string[]): Promise<Master> {
  const { data, error } = await supabase.from('masters').insert({
    name: m.name, role: m.role, experience: m.experience,
    photo_url: m.photo, active: true,
  }).select().single()
  if (error) throw error
  if (serviceIds.length) {
    await supabase.from('master_services').insert(serviceIds.map(sid => ({ master_id: data.id, service_id: sid })))
  }
  return rowToMaster(data, serviceIds)
}

export async function updateMaster(m: Master, serviceIds: string[]): Promise<void> {
  const { error } = await supabase.from('masters').update({
    name: m.name, role: m.role, experience: m.experience, photo_url: m.photo,
  }).eq('id', m.id)
  if (error) throw error
  await supabase.from('master_services').delete().eq('master_id', m.id)
  if (serviceIds.length) {
    await supabase.from('master_services').insert(serviceIds.map(sid => ({ master_id: m.id, service_id: sid })))
  }
}

export async function deleteMaster(id: string): Promise<void> {
  const { error } = await supabase.from('masters').update({ active: false }).eq('id', id)
  if (error) throw error
}

// ─── SCHEDULE ────────────────────────────────────────────────────────────────

export interface ScheduleDay {
  dayOfWeek: number
  startTime: string
  endTime: string
  active: boolean
}

export async function fetchSchedule(masterId: string): Promise<ScheduleDay[]> {
  const { data, error } = await supabase
    .from('master_schedule').select('*').eq('master_id', masterId).order('day_of_week')
  if (error) throw error
  return (data ?? []).map(r => ({
    dayOfWeek: r.day_of_week,
    startTime: r.start_time.slice(0, 5),
    endTime: r.end_time.slice(0, 5),
    active: r.active,
  }))
}

export async function saveSchedule(masterId: string, days: ScheduleDay[]): Promise<void> {
  await supabase.from('master_schedule').delete().eq('master_id', masterId)
  const rows = days.filter(d => d.active).map(d => ({
    master_id: masterId,
    day_of_week: d.dayOfWeek,
    start_time: d.startTime,
    end_time: d.endTime,
    active: true,
  }))
  if (rows.length) {
    const { error } = await supabase.from('master_schedule').insert(rows)
    if (error) throw error
  }
}

export interface DayOff {
  id: string
  date: string
  reason: string
}

export async function fetchDaysOff(masterId: string): Promise<DayOff[]> {
  const { data, error } = await supabase
    .from('master_days_off').select('*').eq('master_id', masterId).order('date')
  if (error) throw error
  return (data ?? []).map(r => ({ id: r.id, date: r.date, reason: r.reason }))
}

export async function addDayOff(masterId: string, date: string, reason = ''): Promise<DayOff> {
  const { data, error } = await supabase.from('master_days_off')
    .insert({ master_id: masterId, date, reason }).select().single()
  if (error) throw error
  return { id: data.id, date: data.date, reason: data.reason }
}

export async function removeDayOff(id: string): Promise<void> {
  const { error } = await supabase.from('master_days_off').delete().eq('id', id)
  if (error) throw error
}

// ─── SERVICE DAYS (per-service day restrictions) ─────────────────────────────

/**
 * Returns set of day_of_week numbers (0=Пн … 6=Вс) the master does this service.
 * Empty set means "no restriction — all working days".
 */
export async function fetchServiceDays(masterId: string, serviceId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from('master_service_days')
    .select('day_of_week')
    .eq('master_id', masterId)
    .eq('service_id', serviceId)
  return new Set((data ?? []).map(r => r.day_of_week as number))
}

/**
 * Fetches all service-day restrictions for a master (all services at once).
 * Returns map: serviceId → Set<dayOfWeek>
 */
export async function fetchAllServiceDays(masterId: string): Promise<Record<string, Set<number>>> {
  const { data } = await supabase
    .from('master_service_days')
    .select('service_id, day_of_week')
    .eq('master_id', masterId)
  const result: Record<string, Set<number>> = {}
  for (const r of data ?? []) {
    const sid = r.service_id as string
    if (!result[sid]) result[sid] = new Set()
    result[sid].add(r.day_of_week as number)
  }
  return result
}

/**
 * Saves which days a master does a specific service.
 * Replaces all previous rows for this master+service.
 * Pass empty set to remove all restrictions (available every working day).
 */
export async function saveServiceDays(masterId: string, serviceId: string, days: Set<number>): Promise<void> {
  await supabase
    .from('master_service_days')
    .delete()
    .eq('master_id', masterId)
    .eq('service_id', serviceId)

  if (days.size === 0) return

  const rows = Array.from(days).map(dow => ({
    master_id: masterId,
    service_id: serviceId,
    day_of_week: dow,
  }))
  const { error } = await supabase.from('master_service_days').insert(rows)
  if (error) throw error
}

// ─── BOOKINGS ────────────────────────────────────────────────────────────────

function rowToBooking(r: Record<string, unknown>): Booking {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    service: r.service_name as string,
    serviceId: r.service_id as string,
    master: r.master_name as string ?? null,
    masterId: r.master_id as string ?? null,
    date: r.date as string,
    time: (r.time as string).slice(0, 5),
    name: r.client_name as string,
    phone: r.client_phone as string,
    comment: r.comment as string,
    status: r.status as Booking['status'],
  }
}

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(rowToBooking)
}

export async function createBooking(b: Omit<Booking, 'id' | 'createdAt'>): Promise<Booking> {
  const { data, error } = await supabase.from('bookings').insert({
    service_id: b.serviceId ?? null,
    service_name: b.service,
    master_id: b.masterId ?? null,
    master_name: b.master ?? '',
    date: b.date,
    time: b.time,
    duration_minutes: 60,
    client_name: b.name,
    client_phone: b.phone,
    comment: b.comment,
    status: 'new',
  }).select().single()
  if (error) throw error
  return rowToBooking(data)
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) throw error
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
  yandexMapsUrl: 'https://yandex.ru/maps/-/CPHUNU0q',
  twoGisUrl: '',
  yandexMetrikaId: '',
  emailjsServiceId: '',
  emailjsTemplateId: '',
  emailjsPublicKey: '',
  notificationEmail: '',
}

export async function fetchContent(): Promise<SiteContent> {
  const { data, error } = await supabase.from('site_content').select('*')
  if (error || !data?.length) return DEFAULT_CONTENT
  const map: Record<string, string> = {}
  data.forEach(r => { map[r.key] = r.value })
  return { ...DEFAULT_CONTENT, ...map } as SiteContent
}

export async function saveContent(c: SiteContent): Promise<void> {
  const rows = Object.entries(c).map(([key, value]) => ({
    key, value, updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase.from('site_content').upsert(rows, { onConflict: 'key' })
  if (error) throw error
}

// ─── VACANCIES ───────────────────────────────────────────────────────────────

function rowToVacancy(r: Record<string, unknown>): Vacancy {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    requirements: r.requirements as string,
  }
}

export async function fetchVacancies(): Promise<Vacancy[]> {
  const { data, error } = await supabase
    .from('vacancies').select('*').eq('active', true).order('sort_order')
  if (error) throw error
  return (data ?? []).map(rowToVacancy)
}

export async function createVacancy(v: Omit<Vacancy, 'id'>): Promise<Vacancy> {
  const { data, error } = await supabase.from('vacancies').insert({
    title: v.title, description: v.description, requirements: v.requirements,
    active: true, sort_order: 0,
  }).select().single()
  if (error) throw error
  return rowToVacancy(data)
}

export async function updateVacancy(v: Vacancy): Promise<void> {
  const { error } = await supabase.from('vacancies').update({
    title: v.title, description: v.description, requirements: v.requirements,
  }).eq('id', v.id)
  if (error) throw error
}

export async function deleteVacancy(id: string): Promise<void> {
  const { error } = await supabase.from('vacancies').update({ active: false }).eq('id', id)
  if (error) throw error
}

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

/** Returns set of day-numbers (1–31) available for booking in a given month */
export async function getAvailableDays(
  masterId: string | null,
  serviceId: string,
  masterList: Master[],
  year: number,
  month: number,
): Promise<Set<number>> {
  const masterIds = masterId
    ? [masterId]
    : masterList.filter(m => m.services.includes(serviceId)).map(m => m.id)

  if (!masterIds.length) return new Set()

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate   = `${year}-${String(month + 1).padStart(2, '0')}-31`

  const [{ data: schedules }, { data: daysOff }, { data: serviceDaysRows }] = await Promise.all([
    supabase.from('master_schedule').select('master_id, day_of_week').in('master_id', masterIds).eq('active', true),
    supabase.from('master_days_off').select('master_id, date').in('master_id', masterIds).gte('date', startDate).lte('date', endDate),
    supabase.from('master_service_days').select('master_id, day_of_week').in('master_id', masterIds).eq('service_id', serviceId),
  ])

  // Per-service day restrictions: master_id → set of allowed dow (empty = no restriction)
  const serviceDayMap: Record<string, Set<number>> = {}
  serviceDaysRows?.forEach(r => {
    if (!serviceDayMap[r.master_id]) serviceDayMap[r.master_id] = new Set()
    serviceDayMap[r.master_id].add(r.day_of_week as number)
  })

  const offMap: Record<string, Set<string>> = {}
  daysOff?.forEach(d => {
    if (!offMap[d.master_id]) offMap[d.master_id] = new Set()
    offMap[d.master_id].add(d.date)
  })

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const result = new Set<number>()

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    if (date < today) continue
    const dow = date.getDay() === 0 ? 6 : date.getDay() - 1
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const anyAvail = masterIds.some(mid => {
      const works = schedules?.some(s => s.master_id === mid && s.day_of_week === dow)
      const isOff = offMap[mid]?.has(dateStr) ?? false
      // If service-specific days are set, check restriction; otherwise no restriction
      const svcDays = serviceDayMap[mid]
      const serviceAllowed = !svcDays || svcDays.size === 0 || svcDays.has(dow)
      return works && !isOff && serviceAllowed
    })
    if (anyAvail) result.add(d)
  }
  return result
}

/** Returns time slots for a specific master + service + date */
export async function getTimeSlots(
  masterId: string | null,
  serviceId: string,
  masterList: Master[],
  services: Service[],
  date: Date,
): Promise<TimeSlot[]> {
  const svc = services.find(s => s.id === serviceId)
  const durationMin = svc?.durationMinutes ?? 60
  const dow = date.getDay() === 0 ? 6 : date.getDay() - 1
  const dateStr = date.toLocaleDateString('en-CA') // YYYY-MM-DD

  const masterIds = masterId
    ? [masterId]
    : masterList.filter(m => m.services.includes(serviceId)).map(m => m.id)

  if (!masterIds.length) return []

  const [{ data: schedules }, { data: existingBookings }, { data: serviceDaysRows }] = await Promise.all([
    supabase.from('master_schedule').select('master_id, start_time, end_time')
      .in('master_id', masterIds).eq('day_of_week', dow).eq('active', true),
    supabase.from('bookings').select('master_id, time, duration_minutes')
      .in('master_id', masterIds).eq('date', dateStr).neq('status', 'cancelled'),
    supabase.from('master_service_days').select('master_id, day_of_week')
      .in('master_id', masterIds).eq('service_id', serviceId),
  ])

  // Build service restriction map
  const serviceDayMap: Record<string, Set<number>> = {}
  serviceDaysRows?.forEach(r => {
    if (!serviceDayMap[r.master_id]) serviceDayMap[r.master_id] = new Set()
    serviceDayMap[r.master_id].add(r.day_of_week as number)
  })

  // Filter schedules by service-specific day restriction
  const filteredSchedules = (schedules ?? []).filter(sched => {
    const svcDays = serviceDayMap[sched.master_id]
    return !svcDays || svcDays.size === 0 || svcDays.has(dow)
  })

  const slotMap: Record<string, boolean> = {}

  for (const sched of filteredSchedules) {
    const startMin = toMinutes(sched.start_time.slice(0, 5))
    const endMin   = toMinutes(sched.end_time.slice(0, 5))
    const masterBookings = existingBookings?.filter(b => b.master_id === sched.master_id) ?? []

    for (let t = startMin; t + durationMin <= endMin; t += 30) {
      const slotKey = minutesToTime(t)
      if (slotMap[slotKey] === true) continue

      const blocked = masterBookings.some(b => {
        const bs = toMinutes(b.time.slice(0, 5))
        const be = bs + (b.duration_minutes ?? 60)
        return t < be && t + durationMin > bs
      })

      if (!blocked) slotMap[slotKey] = true
      else if (slotMap[slotKey] === undefined) slotMap[slotKey] = false
    }
  }

  return Object.entries(slotMap)
    .sort(([a], [b]) => toMinutes(a) - toMinutes(b))
    .map(([time, available]) => ({ time, available }))
}
