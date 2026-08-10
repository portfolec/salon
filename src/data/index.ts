export interface ServiceVariant {
  id: string
  name: string
  priceFrom?: number
  durationMinutes?: number
}

export interface Service {
  id: string
  name: string
  description: string
  priceFrom: number
  duration: string
  durationMinutes?: number
  active?: boolean
  sortOrder?: number
  /** Optional sub-categories of this service, e.g. "под машинку" / "ножницами" for a haircut. */
  variants?: ServiceVariant[]
}

export interface Master {
  id: string
  name: string
  role: string
  experience: string
  services: string[]
  photo: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface SiteContent {
  heroTitle: string
  heroSubtitle: string
  address: string
  phone: string
  hours: string
  telegramUrl: string
  instagramUrl: string
  vkUrl?: string
  yandexMapsUrl?: string
  twoGisUrl?: string
  yandexMetrikaId?: string
  emailjsServiceId?: string
  emailjsTemplateId?: string
  emailjsPublicKey?: string
  notificationEmail?: string
}

export type BookingSource = 'website' | 'phone' | 'telegram' | 'instagram' | 'admin' | 'other'

export interface Booking {
  id: string
  createdAt: string
  service: string
  serviceId?: string
  variantName?: string | null
  master: string | null
  masterId?: string | null
  date: string
  time: string
  name: string
  phone: string
  comment: string
  status: 'new' | 'confirmed' | 'done' | 'cancelled'
  source?: BookingSource
}

export interface Vacancy {
  id: string
  title: string
  description: string
  requirements: string
}

export const services: Service[] = [
  {
    id: 'hairdresser',
    name: 'Парикмахер',
    description: 'Стрижки, окрашивание, укладки от мастеров-стилистов',
    priceFrom: 2500,
    duration: '60-120 мин',
  },
  {
    id: 'manicure',
    name: 'Маникюр',
    description: 'Классический, гелевый, аппаратный — любое покрытие',
    priceFrom: 1800,
    duration: '60-90 мин',
  },
  {
    id: 'pedicure',
    name: 'Педикюр',
    description: 'Обработка стоп и покрытие с уходом за кутикулой',
    priceFrom: 2200,
    duration: '75-100 мин',
  },
  {
    id: 'lashes',
    name: 'Ресницы',
    description: 'Наращивание ресниц: классика, объём, голливуд',
    priceFrom: 3500,
    duration: '120-180 мин',
  },
  {
    id: 'brows',
    name: 'Брови',
    description: 'Коррекция, архитектура и окрашивание бровей',
    priceFrom: 1200,
    duration: '45-60 мин',
  },
  {
    id: 'massage',
    name: 'Массаж',
    description: 'Расслабляющий, антицеллюлитный, лимфодренажный',
    priceFrom: 3000,
    duration: '60-90 мин',
  },
  {
    id: 'laser',
    name: 'Лазерная эпиляция',
    description: 'Диодный лазер для всех типов кожи и волос',
    priceFrom: 2000,
    duration: '30-90 мин',
  },
  {
    id: 'epilation',
    name: 'Обычная эпиляция',
    description: 'Восковая и сахарная эпиляция любых зон',
    priceFrom: 800,
    duration: '30-60 мин',
  },
]

export const masters: Master[] = [
  {
    id: 'anastasia',
    name: 'Анастасия Ковалёва',
    role: 'Парикмахер-стилист',
    experience: '9 лет',
    services: ['hairdresser'],
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=480&h=600&fit=crop&q=80',
  },
  {
    id: 'marina',
    name: 'Марина Захарова',
    role: 'Мастер маникюра и педикюра',
    experience: '6 лет',
    services: ['manicure', 'pedicure'],
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=480&h=600&fit=crop&q=80',
  },
  {
    id: 'elena',
    name: 'Елена Петрова',
    role: 'Специалист по ресницам и бровям',
    experience: '7 лет',
    services: ['lashes', 'brows'],
    photo: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=480&h=600&fit=crop&q=80',
  },
  {
    id: 'darya',
    name: 'Дарья Волкова',
    role: 'Массаж и эпиляция',
    experience: '5 лет',
    services: ['massage', 'laser', 'epilation'],
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=480&h=600&fit=crop&q=80',
  },
]

export const reasons = [
  {
    title: 'Сервис',
    body: 'Внимание к каждому клиенту: встречаем, сопровождаем и доводим результат до идеала.',
  },
  {
    title: 'Аккуратность',
    body: 'Чистота рабочих мест, стерильные инструменты и бережное отношение к деталям.',
  },
  {
    title: 'Мастера с опытом',
    body: 'От 5 до 9 лет практики, регулярное повышение квалификации.',
  },
  {
    title: 'Удобный график',
    body: 'Работаем ежедневно с 10:00 до 20:00, принимаем по записи без очередей.',
  },
]

export const vacancies: Vacancy[] = [
  {
    id: 'master-manicure',
    title: 'Мастер маникюра',
    description: 'Работа в уютном салоне с постоянным потоком клиентов и профессиональной косметикой.',
    requirements: 'Опыт от 1 года, аккуратность, умение работать с гель-лаком.',
  },
  {
    id: 'hairdresser',
    title: 'Парикмахер-стилист',
    description: 'Стрижки, окрашивание и укладки. Дружная команда и гибкий график.',
    requirements: 'Опыт от 2 лет, портфолио работ.',
  },
  {
    id: 'admin',
    title: 'Администратор салона',
    description: 'Встреча гостей, запись клиентов, поддержание сервиса на высоком уровне.',
    requirements: 'Коммуникабельность, опыт работы с людьми приветствуется.',
  },
]

export const testimonials = [
  {
    name: 'Екатерина Смирнова',
    role: 'Постоянный клиент, 2 года',
    text: 'Лучший маникюр в городе. Марина знает своё дело идеально — пришла на гель-лак и осталась на педикюр.',
  },
  {
    name: 'Ольга Михайлова',
    role: 'Клиент по рекомендации',
    text: 'Анастасия невероятный стилист. Показала вдохновение и получила именно то, о чём мечтала. Результат превзошёл ожидания.',
  },
  {
    name: 'Артём Белов',
    role: 'Первый визит в этом месяце',
    text: 'Отличный расслабляющий массаж. Профессионально, тихо и без суеты. Обязательно вернусь.',
  },
]

export function generateTimeSlots(date: Date): TimeSlot[] {
  const times = [
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00',
  ]
  const seed = date.getDate() + date.getMonth()
  const bookedIndices = new Set([
    seed % 4,
    (seed + 3) % 19,
    (seed + 7) % 19,
    (seed + 11) % 19,
    (seed + 14) % 4 + 5,
  ])
  return times.map((time, i) => ({ time, available: !bookedIndices.has(i) }))
}

export function getAvailableDates(year: number, month: number): Set<number> {
  const result = new Set<number>()
  const today = new Date()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const dayOfWeek = date.getDay()
    const isPast = date < today && date.toDateString() !== today.toDateString()
    if (!isPast && dayOfWeek !== 0) result.add(d)
  }
  return result
}
