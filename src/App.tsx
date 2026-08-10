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
import { DataProvider } from './context/DataContext'
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

function SiteApp() {
  const [modalOpen, setModalOpen] = useState(false)
  const [preselectedService, setPreselectedService] = useState<string | undefined>(undefined)
  const [preselectedMaster, setPreselectedMaster] = useState<string | undefined>(undefined)

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
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin_auth') === '1')

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    setAuthed(false)
    window.location.hash = ''
  }

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />
  return <AdminPanel onLogout={handleLogout} />
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash.startsWith('#admin'))

  useEffect(() => {
    const handler = () => setIsAdmin(window.location.hash.startsWith('#admin'))
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [])

  return (
    <ErrorBoundary>
      <DataProvider>
        {isAdmin ? <AdminApp /> : <SiteApp />}
      </DataProvider>
    </ErrorBoundary>
  )
}
