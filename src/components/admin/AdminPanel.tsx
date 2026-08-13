import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useData } from '../../context/DataContext'
import AdminBookings from './AdminBookings'
import AdminServices from './AdminServices'
import AdminMasters from './AdminMasters'
import AdminVacancies from './AdminVacancies'
import AdminTestimonials from './AdminTestimonials'
import AdminContent from './AdminContent'
import AdminSchedule from './AdminSchedule'
import AdminNotifications from './AdminNotifications'
import AdminStats from './AdminStats'
import AdminUsers from './AdminUsers'
import Logo from '../Logo'
import { hasPermission, type AdminUser, type AdminPermissions } from '../../lib/auth'
import {
  CalendarBlank, Scissors, UsersThree, TextT,
  SignOut, List, X, ArrowSquareOut, Clock, Bell, Briefcase, ShieldCheck, ChatCircleText, ChartBar,
} from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

type Tab = 'bookings' | 'services' | 'masters' | 'vacancies' | 'testimonials' | 'schedule' | 'stats' | 'content' | 'notifications' | 'users'

const ALL_TABS: { id: Tab; label: string; Icon: React.ElementType; permission?: keyof AdminPermissions; ownerOnly?: boolean }[] = [
  { id: 'bookings',      label: 'Заявки',        Icon: CalendarBlank, permission: 'bookings' },
  { id: 'services',      label: 'Услуги',        Icon: Scissors,      permission: 'services' },
  { id: 'masters',       label: 'Мастера',       Icon: UsersThree,    permission: 'masters' },
  { id: 'vacancies',     label: 'Вакансии',      Icon: Briefcase,     permission: 'vacancies' },
  { id: 'testimonials',  label: 'Отзывы',        Icon: ChatCircleText, permission: 'testimonials' },
  { id: 'schedule',      label: 'График',        Icon: Clock,         permission: 'schedule' },
  { id: 'stats',         label: 'Статистика',    Icon: ChartBar,      permission: 'bookings' },
  { id: 'content',       label: 'Контент',       Icon: TextT,         permission: 'content' },
  { id: 'notifications', label: 'Уведомления',   Icon: Bell,          permission: 'notifications' },
  { id: 'users',         label: 'Пользователи',  Icon: ShieldCheck,   ownerOnly: true },
]

/** Reads the requested tab id from the URL hash, e.g. "#admin/services" -> "services". */
function getTabIdFromHash(): string {
  const match = window.location.hash.match(/^#admin\/(.+)$/)
  return match?.[1] ?? ''
}

interface AdminPanelProps {
  user: AdminUser
  onLogout: () => void
}

export default function AdminPanel({ user, onLogout }: AdminPanelProps) {
  const tabs = useMemo(
    () => ALL_TABS.filter(t => t.ownerOnly ? user.role === 'owner' : hasPermission(user, t.permission!)),
    [user],
  )
  const isAllowed = useCallback((id: string) => tabs.some(t => t.id === id), [tabs])

  const [activeTab, setActiveTabState] = useState<Tab>(() => {
    const fromHash = getTabIdFromHash()
    return (isAllowed(fromHash) ? fromHash : tabs[0]?.id ?? 'bookings') as Tab
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { newBookingsCount, isDb, dbError, dbOk } = useData()

  // Keep the URL hash in sync so each section has its own link and survives a page reload.
  const setActiveTab = useCallback((tab: Tab) => {
    setActiveTabState(tab)
    window.history.replaceState(null, '', `#admin/${tab}`)
  }, [])

  // If the hash changes externally (back/forward navigation, manual edit), follow it.
  useEffect(() => {
    const handler = () => {
      const id = getTabIdFromHash()
      if (isAllowed(id)) setActiveTabState(id as Tab)
    }
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [isAllowed])

  // Ensure the hash reflects the current (permitted) tab on first mount.
  useEffect(() => {
    if (window.location.hash !== `#admin/${activeTab}`) {
      window.history.replaceState(null, '', `#admin/${activeTab}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-screen bg-zinc-950 flex overflow-hidden">
      {/* Sidebar — pinned to the viewport; only its own content scrolls if it overflows */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 h-screen bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-y-auto shrink-0
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-zinc-800 flex items-center justify-between">
          <Logo size="sm" dark />
          <button className="lg:hidden text-zinc-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* DB status badge */}
        {isDb ? (
          dbOk ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}
              className="mx-4 mt-3 mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
              <span className="relative flex w-1.5 h-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-emerald-400 tracking-wide">База подключена</span>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}
              className="mx-4 mt-3 mb-1 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span className="text-[10px] font-medium text-red-300 tracking-wide">Ошибка подключения</span>
              </div>
              {dbError && (
                <p className="mt-1 text-[10px] text-red-200/70 leading-snug break-words">
                  {dbError}
                </p>
              )}
              <p className="mt-1 text-[10px] text-zinc-500 leading-snug">
                После изменения <code className="text-zinc-400">.env.local</code> нужно перезапустить dev-сервер.
              </p>
            </motion.div>
          )
        ) : (
          <div className="mx-4 mt-3 mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span className="text-[10px] font-medium text-zinc-400 tracking-wide">База не настроена</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map(({ id, label, Icon }, i) => (
            <motion.button
              key={id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.035, ease: EASE_OUT }}
              onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium overflow-hidden group"
            >
              {activeTab === id && (
                <motion.span
                  layoutId="adminNavActivePill"
                  className="absolute inset-0 bg-[var(--color-accent)]/15 rounded-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <Icon size={18} weight={activeTab === id ? 'fill' : 'light'}
                className={`relative z-10 transition-colors duration-150 ${activeTab === id ? 'text-[var(--color-accent-light)]' : 'text-zinc-400 group-hover:text-white'}`} />
              <span className={`relative z-10 transition-colors duration-150 ${activeTab === id ? 'text-[var(--color-accent-light)]' : 'text-zinc-400 group-hover:text-white'}`}>
                {label}
              </span>
              {id === 'bookings' && newBookingsCount > 0 && (
                <motion.span
                  key={newBookingsCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="relative z-10 ml-auto bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {newBookingsCount}
                </motion.span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Current user */}
        <div className="px-4 py-3 mx-3 mb-1 flex items-center gap-2.5 bg-zinc-800/60 rounded-sm">
          <div className="w-7 h-7 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent-light)] text-xs font-semibold shrink-0">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white font-medium truncate">{user.username}</p>
            <p className="text-[10px] text-zinc-500">{user.role === 'owner' ? 'Владелец' : 'Сотрудник'}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 hover:translate-x-0.5 transition-all duration-150">
            <ArrowSquareOut size={18} weight="light" />
            Открыть сайт
          </a>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 hover:translate-x-0.5 transition-all duration-150">
            <SignOut size={18} weight="light" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-zinc-400 hover:text-white transition-colors" onClick={() => setSidebarOpen(true)}>
            <List size={22} />
          </button>
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                <h1 className="text-white font-semibold">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-xs text-zinc-500">Панель управления · Стильный Акцент</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-h-0 p-6 lg:p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {activeTab === 'bookings'      && <AdminBookings />}
              {activeTab === 'services'      && <AdminServices />}
              {activeTab === 'masters'       && <AdminMasters />}
              {activeTab === 'vacancies'     && <AdminVacancies />}
              {activeTab === 'testimonials'  && <AdminTestimonials />}
              {activeTab === 'schedule'      && <AdminSchedule />}
              {activeTab === 'stats'         && <AdminStats />}
              {activeTab === 'content'       && <AdminContent />}
              {activeTab === 'notifications' && <AdminNotifications />}
              {activeTab === 'users'         && <AdminUsers currentUser={user} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
