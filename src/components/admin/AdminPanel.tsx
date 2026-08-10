import { useState } from 'react'
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
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-zinc-800 flex items-center justify-between">
          <Logo size="sm" dark />
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* DB status badge */}
        {isDb ? (
          dbOk ? (
            <div className="mx-4 mt-3 mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400 tracking-wide">База подключена</span>
            </div>
          ) : (
            <div className="mx-4 mt-3 mb-1 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-sm">
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
            </div>
          )
        ) : (
          <div className="mx-4 mt-3 mb-1 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span className="text-[10px] font-medium text-zinc-400 tracking-wide">База не настроена</span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors duration-150
                ${activeTab === id
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent-light)]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
              <Icon size={18} weight={activeTab === id ? 'fill' : 'light'} />
              {label}
              {id === 'bookings' && newBookingsCount > 0 && (
                <span className="ml-auto bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {newBookingsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-zinc-800 space-y-1">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <ArrowSquareOut size={18} weight="light" />
            Открыть сайт
          </a>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors">
            <SignOut size={18} weight="light" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
          <button className="lg:hidden text-zinc-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <List size={22} />
          </button>
          <div>
            <h1 className="text-white font-semibold">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-zinc-500">Панель управления · Стильный Акцент</p>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          {activeTab === 'bookings'      && <AdminBookings />}
          {activeTab === 'services'      && <AdminServices />}
          {activeTab === 'masters'       && <AdminMasters />}
          {activeTab === 'vacancies'     && <AdminVacancies />}
          {activeTab === 'schedule'      && <AdminSchedule />}
          {activeTab === 'content'       && <AdminContent />}
          {activeTab === 'notifications' && <AdminNotifications />}
        </main>
      </div>
    </div>
  )
}
