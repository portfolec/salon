import { useState, useEffect, Component, type ReactNode, type ErrorInfo } from 'react'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(e: Error) { return { error: e } }
  componentDidCatch(e: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', e, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#c00' }}>Что-то пошло не так</h2>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', color: '#666' }}>
            {(this.state.error as Error).message}
          </pre>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>
            Обновить страницу
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
import { DataProvider, useData } from './context/DataContext'
import * as api from './lib/api'
import { getToken, getStoredUser, clearSession, type AdminUser } from './lib/auth'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import WhyUs from './components/WhyUs'
import Masters from './components/Masters'
import Testimonials from './components/Testimonials'
import Contacts from './components/Contacts'
import Vacancies from './components/Vacancies'
import Footer from './components/Footer'
import BookingModal from './components/BookingModal'
import FloatingCTA from './components/FloatingCTA'
import AdminPanel from './components/admin/AdminPanel'
import AdminLogin from './components/admin/AdminLogin'
import YandexMetrika from './components/YandexMetrika'
import UserAgreement from './components/UserAgreement'

const ROUTE_HASHES = /^(admin|agreement)(\/|$)/
const HASH_TOP_OFFSET = 80

function scrollToHashTarget(smooth = true) {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  if (!id || ROUTE_HASHES.test(id)) return true
  const el = document.getElementById(id)
  if (!el) return false
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const top = window.scrollY + el.getBoundingClientRect().top - HASH_TOP_OFFSET
  window.scrollTo({
    top: Math.max(0, top),
    behavior: reduce || !smooth ? 'auto' : 'smooth',
  })
  return true
}

function SiteApp() {
  const [modalOpen, setModalOpen] = useState(false)
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined)
  const [preselectedMaster, setPreselectedMaster] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const timers: number[] = []

    const attempt = (smooth: boolean) => {
      if (!cancelled) scrollToHashTarget(smooth)
    }

    attempt(false)
    for (const delay of [120, 350, 700, 1400]) {
      timers.push(window.setTimeout(() => attempt(false), delay))
    }

    const onHash = () => attempt(true)
    const onLoad = () => attempt(false)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('load', onLoad)
    return () => {
      cancelled = true
      timers.forEach(id => window.clearTimeout(id))
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('load', onLoad)
    }
  }, [])

  const handleOpenBooking = (serviceId?: string, masterId?: string) => {
    setPreselectedService(serviceId)
    setPreselectedMaster(masterId)
    setModalOpen(true)
  }

  return (
    <>
      <YandexMetrika />
      <Navbar onBooking={() => handleOpenBooking()} />
      <main>
        <Hero onBooking={() => handleOpenBooking()} />
        <Services onBooking={handleOpenBooking} />
        <WhyUs />
        <Masters onBooking={handleOpenBooking} />
        <Testimonials />
        <Vacancies />
        <Contacts />
      </main>
      <Footer />
      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialServiceId={preselectedService}
        initialMasterId={preselectedMaster}
      />
      <FloatingCTA onBooking={() => handleOpenBooking()} />
    </>
  )
}

function AdminApp() {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser())
  const [checking, setChecking] = useState(() => !!getToken())
  const { refreshBookings } = useData()

  // Validate the stored session against the server once (covers expired/revoked tokens).
  useEffect(() => {
    const token = getToken()
    if (!token) { setChecking(false); return }
    api.fetchMe()
      .then(u => { setUser(u); refreshBookings() })
      .catch(() => { clearSession(); setUser(null) })
      .finally(() => setChecking(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLoginSuccess = (u: AdminUser) => {
    setUser(u)
    refreshBookings()
  }

  const handleLogout = () => {
    api.logout()
    clearSession()
    setUser(null)
    window.location.hash = ''
  }

  if (checking) {
    return <div className="min-h-screen bg-zinc-950" />
  }
  if (!user) return <AdminLogin onLogin={handleLoginSuccess} />
  return <AdminPanel user={user} onLogout={handleLogout} />
}

type Route = 'site' | 'admin' | 'agreement'

function getRoute(): Route {
  const hash = window.location.hash
  if (hash.startsWith('#admin')) return 'admin'
  if (hash.startsWith('#agreement')) return 'agreement'
  return 'site'
}

export default function App() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const handler = () => setRoute(getRoute())
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return (
    <ErrorBoundary>
      <DataProvider>
        {route === 'admin' ? <AdminApp /> : route === 'agreement' ? <UserAgreement /> : <SiteApp />}
      </DataProvider>
    </ErrorBoundary>
  )
}
