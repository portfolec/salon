import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useData } from '../../context/DataContext'
import AdminBookings from './AdminBookings'
import AdminServices from './AdminServices'
import AdminMasters from './AdminMasters'
import AdminVacancies from './AdminVacancies'
import AdminContent from './AdminContent'
import AdminSchedule from './AdminSchedule'
import AdminNotifications from './AdminNotifications'
import Logo from '../Logo'
import {
  CalendarBlank, Scissors, UsersThree, TextT,
  SignOut, List, X, ArrowSquareOut, Clock, Bell, Briefcase,
} from '@phosphor-icons/react'

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]

type Tab = 'bookings' | 'services' | 'masters' | 'vacancies' | 'schedule' | 'content' | 'notifications'

const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: 'bookings',      label: 'Заявки',        Icon: CalendarBlank },
  { id: 'services',      label: 'Услуги',        Icon: Scissors },
  { id: 'masters',       label: 'Мастера',       Icon: UsersThree },
  { id: 'vacancies',     label: 'Вакансии',      Icon: Briefcase },
  { id: 'schedule',      label: 'График',        Icon: Clock },
  { id: 'content',       label: 'Контент',       Icon: TextT },
  { id: 'notifications', label: 'Уведомления',   Icon: Bell },
]

interface AdminPanelProps {
  onLogout: () => void
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('bookings')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { newBookingsCount, isDb, dbError, dbOk } = useData()

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
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
        <main className="flex-1 p-6 lg:p-10 overflow-auto">
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
              {activeTab === 'schedule'      && <AdminSchedule />}
              {activeTab === 'content'       && <AdminContent />}
              {activeTab === 'notifications' && <AdminNotifications />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
