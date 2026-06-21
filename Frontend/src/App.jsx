import React, { useEffect, useState, Suspense, startTransition } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Layout         from './layout/Layout'
import Watermark      from './components/Watermark'
import HomePage       from './pages/HomePage'
import AuthModal      from './components/auth/AuthModal'
import PropertyGrid   from './components/properties/PropertyGrid'
import AdminLayout from './admin/components/AdminLayout'
import InstallButton from './components/InstallButton'
import { useNotifications } from './context/NotificationContext'
import { useBackendConnectivityCheck } from './hooks/useBackendConnectivityCheck'

const PropertyDetails = React.lazy(() => import('./pages/PropertyDetails'))
const DashboardPage  = React.lazy(() => import('./pages/DashboardPage'))
const ProfilePage    = React.lazy(() => import('./pages/ProfilePage'))
const WishlistPage       = React.lazy(() => import('./pages/WishlistPage'))
const BookingsPage       = React.lazy(() => import('./pages/BookingsPage'))
const MessagesPage       = React.lazy(() => import('./pages/MessagesPage'))
const SettingsPage       = React.lazy(() => import('./pages/SettingsPage'))
const BookingConfirmPage = React.lazy(() => import('./pages/BookingConfirm'))
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'))

// Lazy load less frequently used pages
const HostVerificationPage = React.lazy(() => import('./pages/HostVerificationPage'))
const GuestVerificationPage = React.lazy(() => import('./pages/GuestVerificationPage'))
const BecomeAHostPage = React.lazy(() => import('./pages/BecomeAHostPage'))
const AddPropertyPage = React.lazy(() => import('./pages/AddPropertyPage'))
const MyPropertiesPage = React.lazy(() => import('./pages/MyPropertiesPage'))
const HostBookingsPage = React.lazy(() => import('./pages/HostBookingsPage'))
const AdminControlPage = React.lazy(() => import('./pages/AdminControlPage'))
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPassword'))
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPassword'))
const ReportPage = React.lazy(() => import('./pages/ReportPage'))

// Lazy load admin pages
const AdminDashboardPage = React.lazy(() => import('./admin/pages/Dashboard'))
const AdminUsersPage = React.lazy(() => import('./admin/pages/Users'))
const AdminGuestVerificationsPage = React.lazy(() => import('./admin/pages/GuestVerifications'))
const AdminUserDetailsPage = React.lazy(() => import('./admin/pages/UserDetails'))
const AdminListingsPage = React.lazy(() => import('./admin/pages/Listings'))
const AdminBookingsPage = React.lazy(() => import('./admin/pages/Bookings'))
const AdminPaymentsPage = React.lazy(() => import('./admin/pages/Payments'))
const AdminReportsPage = React.lazy(() => import('./admin/pages/Reports'))
const AdminSettingsPage = React.lazy(() => import('./admin/pages/Settings'))
const AdminHostDemandsPage = React.lazy(() => import('./admin/pages/HostDemands'))

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://maskan-xzpw.onrender.com').replace(/\/$/, '')
const AUTH_TOKEN_KEY = 'authToken'
const USER_STORAGE_KEY = 'user'
const ROLE_STORAGE_KEY = 'userRole'

// Loading fallback component for lazy-loaded routes
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
        <p className="text-sm text-primary-500">Chargement...</p>
      </div>
    </div>
  )
}

// Map backend roles (HOST/GUEST) to frontend roles (PROPRIETOR/TENANT)
const mapRole = (role) => {
  if (role === 'HOST') return 'PROPRIETOR'
  if (role === 'GUEST') return 'TENANT'
  if (role === 'PROPRIETAIRE') return 'PROPRIETOR'
  return role || 'TENANT'
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Runtime error caught by AppErrorBoundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-primary-50">
          <div className="max-w-lg w-full rounded-2xl border border-primary-200 bg-white p-6 text-center">
            <h1 className="text-xl font-bold text-primary-900">Une erreur est survenue</h1>
            <p className="mt-2 text-sm text-primary-600">Rechargez la page. Si le problème persiste, revenez à l’accueil.</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition"
              >
                Recharger
              </button>
              <a
                href="/"
                className="px-4 py-2 rounded-xl border border-primary-200 text-primary-700 font-semibold hover:bg-primary-50 transition"
              >
                Accueil
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const normalizeUser = (user, localProfile = null) => ({
  id: user?.id,
  name: user?.fullName || user?.name || 'User',
  email: user?.email,
  role: mapRole(user?.role),
  username: user?.username || localProfile?.username || '',
  bio: user?.bio || localProfile?.bio || '',
  avatar: user?.avatar || localProfile?.avatar || '',
  emailVerified: Boolean(user?.emailVerified),
  phoneVerified: Boolean(user?.phoneVerified),
  identityStatus: user?.identityStatus || 'not_verified',
  verificationLevel: user?.verificationLevel,
  rejectionReason: user?.rejectionReason,
  trustScore: typeof user?.trustScore === 'number' ? user.trustScore : 0,
})

// -- Explorer Page with Search -----------------------------------------------
function ExplorerPage({ user = null, onAuthClick = null }) {
  const [searchParams] = useSearchParams()
  const city = searchParams.get('city') || searchParams.get('location')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guests = searchParams.get('guests')

  return (
    <div className="pt-24">
      <PropertyGrid 
        title={city ? `Propriétés à ${city}` : 'Explorer toutes les propriétés'}
        searchFilters={{ city, checkIn, checkOut, guests: guests ? parseInt(guests, 10) : null }}
        user={user}
        onAuthClick={onAuthClick}
      />
    </div>
  )
}

// -- 404 Page --------------------------------------------------
function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <p className="text-[10rem] font-extrabold text-primary-100 leading-none select-none">404</p>
      <h1 className="text-2xl font-extrabold text-primary-800 -mt-4">Page introuvable</h1>
      <p className="text-primary-500 text-sm mt-2 mb-8">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-primary-50 shadow-md shadow-primary-500/25 transition hover:bg-primary-600 hover:shadow-primary-500/35"
      >
        Retour à l'accueil
      </Link>
    </div>
  )
}

function OpeningSplash() {
  const brand = 'MASKAN'
  const logoPath = 'M1124.07,46.9C1037.1,16.52,943.78,0,846.79,0,381.05,0,0,381.05,0,846.78v2960.97c0,465.74,381.05,846.79,846.79,846.79s846.79-381.05,846.79-846.79v-990.99c-329.04-87.01-594.49-323.02-722.95-636.9,23.9,140.28,77.12,270.65,153.45,384.36v1243.53c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28V846.78c0-152.5,124.77-277.28,277.28-277.28s276.46,123.96,277.28,275.78c0,.5,0,1,0,1.5v926.84c1.13,367.62,239.65,682.06,569.51,797.27,86.97,30.37,180.29,46.9,277.28,46.9s190.31-16.52,277.28-46.9c329.86-115.21,568.38-429.65,569.51-797.27v-926.84c0-.5,0-1,0-1.5.81-151.82,125.27-275.78,277.27-275.78s277.28,124.77,277.28,277.28v2960.97c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28v-1243.53c76.33-113.71,129.55-244.08,153.45-384.36-128.47,313.88-393.92,549.89-722.95,636.9v990.99c0,465.74,381.05,846.79,846.78,846.79s846.79-381.05,846.79-846.79V846.78C3941.71,381.05,3560.66,0,3094.92,0c-96.99,0-190.31,16.52-277.28,46.9-330.65,115.48-569.51,431.14-569.51,799.88v924.22c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28v-924.22c0-368.74-238.87-684.4-569.51-799.88'

  return (
    <div className="brand-loader" role="status" aria-live="polite" aria-label="Opening Maskan website">
      <div className="brand-loader__glow" aria-hidden="true" />
      <svg
        className="brand-loader__logo"
        viewBox="0 0 3941.71 4654.54"
        aria-label="Maskan logo"
      >
        <defs>
          <linearGradient id="brand-loader-gradient" x1="0" y1="2327.27" x2="3941.71" y2="2327.27" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#cbad8d" />
            <stop offset="1" stopColor="#dfcfbf" />
          </linearGradient>
        </defs>
        <path className="brand-loader__logo-outline" d={logoPath} pathLength="1" />
        <path className="brand-loader__logo-fill" d={logoPath} fill="url(#brand-loader-gradient)" />
      </svg>
      <h1 className="brand-loader__word" aria-label={brand}>
        {brand.split('').map((letter, index) => (
          <span key={`${letter}-${index}`} style={{ animationDelay: `${0.14 * index + 0.8}s` }}>
            {letter}
          </span>
        ))}
      </h1>
      <p className="brand-loader__tagline">Votre maison, votre histoire</p>
    </div>
  )
}

// -- Routing split: /dashboard uses its own shell -------------
function AppRoutes() {
  const [authModal, setAuthModal] = useState(null)
  const [user,      setUser]      = useState(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const isDash   = location.pathname.startsWith('/dashboard')
  const isAdminArea = location.pathname.startsWith('/admin')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('auth') === 'login') {
      setAuthModal('login')
    }
  }, [location.search])

  const handleAuthClick = (mode) => {
    startTransition(() => {
      setAuthModal(mode)
    })
  }

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      const locallyStoredUser = (() => {
        try {
          return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
        } catch {
          return null
        }
      })()

      if (!token) {
        setUser(null)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Session invalide')
        }

        const backendUser = await response.json()
        const mergedUser = {
          ...backendUser,
          username: backendUser?.username || locallyStoredUser?.username || '',
          bio: backendUser?.bio || locallyStoredUser?.bio || '',
          avatar: backendUser?.avatar || locallyStoredUser?.avatar || '',
          trustScore: backendUser?.trustScore ?? locallyStoredUser?.trustScore ?? 0,
        }

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mergedUser))
        if (backendUser?.role) {
          localStorage.setItem(ROLE_STORAGE_KEY, mapRole(backendUser.role))
        }

        setUser(normalizeUser(backendUser, locallyStoredUser))
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem(USER_STORAGE_KEY)
        localStorage.removeItem(ROLE_STORAGE_KEY)
        setUser(null)
      }
    }

    verifySession()
  }, [])

  useEffect(() => {
    const onTrustScoreUpdated = (event) => {
      const nextScore = event?.detail?.trustScore
      if (typeof nextScore !== 'number') return

      setUser((prev) => (prev ? { ...prev, trustScore: nextScore } : prev))

      try {
        const stored = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '{}')
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ ...stored, trustScore: nextScore }))
      } catch {
        // Ignore malformed local profile cache.
      }
    }

    window.addEventListener('user:trust-score-updated', onTrustScoreUpdated)
    return () => window.removeEventListener('user:trust-score-updated', onTrustScoreUpdated)
  }, [])

  const handleAuthSuccess = (nextUser) => {
    setUser(nextUser)
    setAuthModal(null)
    notify(`Bienvenue ${nextUser.name} ! 👋`, 'success')
    navigate('/explorer', { replace: true })
  }

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(ROLE_STORAGE_KEY)
    setUser(null)
    notify('À bientôt ! Vous êtes déconnecté.', 'success')
    navigate('/', { replace: true })
  }

  return (
    <>
      {isDash ? (
        <Routes>
          <Route path="/dashboard/*" element={<Suspense fallback={<LoadingFallback />}><DashboardPage /></Suspense>} />
        </Routes>
      ) : isAdminArea ? (
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Suspense fallback={<LoadingFallback />}><AdminDashboardPage /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<LoadingFallback />}><AdminUsersPage /></Suspense>} />
            <Route path="guest-verifications" element={<Suspense fallback={<LoadingFallback />}><AdminGuestVerificationsPage /></Suspense>} />
            <Route path="users/:userId" element={<Suspense fallback={<LoadingFallback />}><AdminUserDetailsPage /></Suspense>} />
            <Route path="listings" element={<Suspense fallback={<LoadingFallback />}><AdminListingsPage /></Suspense>} />
            <Route path="bookings" element={<Suspense fallback={<LoadingFallback />}><AdminBookingsPage /></Suspense>} />
            <Route path="payments" element={<Suspense fallback={<LoadingFallback />}><AdminPaymentsPage /></Suspense>} />
            <Route path="reports" element={<Suspense fallback={<LoadingFallback />}><AdminReportsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<LoadingFallback />}><AdminSettingsPage /></Suspense>} />
            <Route path="host-demands" element={<Suspense fallback={<LoadingFallback />}><AdminHostDemandsPage /></Suspense>} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Routes>
      ) : (
        <Layout user={user} onAuthClick={handleAuthClick} onLogout={handleLogout}>
          <Routes>
            <Route path="/"         element={<HomePage user={user} onAuthClick={handleAuthClick} />} />
            <Route path="/explorer" element={<ExplorerPage user={user} onAuthClick={handleAuthClick} />} />
            <Route path="/explore" element={<ExplorerPage user={user} onAuthClick={handleAuthClick} />} />
            <Route path="/property/:id" element={<Suspense fallback={<LoadingFallback />}><PropertyDetails user={user} onAuthClick={handleAuthClick} /></Suspense>} />
            <Route path="/profile"  element={user ? <Suspense fallback={<LoadingFallback />}><ProfilePage user={user} onUserUpdate={setUser} onLogout={handleLogout} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/account"  element={user ? <Suspense fallback={<LoadingFallback />}><ProfilePage user={user} onUserUpdate={setUser} onLogout={handleLogout} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/host-verification" element={user ? <Suspense fallback={<LoadingFallback />}><HostVerificationPage user={user} onUserUpdate={setUser} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/become-a-host" element={user ? <Suspense fallback={<LoadingFallback />}><BecomeAHostPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/guest-verification" element={user ? <Suspense fallback={<LoadingFallback />}><GuestVerificationPage user={user} onUserUpdate={setUser} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/bookings"  element={user ? <Suspense fallback={<LoadingFallback />}><BookingsPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/messages"  element={user ? <Suspense fallback={<LoadingFallback />}><MessagesPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/settings"  element={user ? <Suspense fallback={<LoadingFallback />}><SettingsPage user={user} onUserUpdate={setUser} onLogout={handleLogout} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/favorites" element={user ? <Suspense fallback={<LoadingFallback />}><WishlistPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/add-property"    element={user ? <Suspense fallback={<LoadingFallback />}><AddPropertyPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/my-properties"   element={user ? <Suspense fallback={<LoadingFallback />}><MyPropertiesPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/host-bookings"   element={user ? <Suspense fallback={<LoadingFallback />}><HostBookingsPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/admin-control"   element={user && (user.role === 'ADMIN') ? <Suspense fallback={<LoadingFallback />}><AdminControlPage user={user} /></Suspense> : <Navigate to="/" replace />} />
            <Route path="/forgot-password" element={<Suspense fallback={<LoadingFallback />}><ForgotPasswordPage /></Suspense>} />
            <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense>} />
            <Route path="/booking/:id/confirm" element={user ? <Suspense fallback={<LoadingFallback />}><BookingConfirmPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/notifications" element={user ? <Suspense fallback={<LoadingFallback />}><NotificationsPage user={user} /></Suspense> : <Navigate to="/?auth=login" replace />} />
            <Route path="/report" element={<Suspense fallback={<LoadingFallback />}><ReportPage /></Suspense>} />
            <Route path="*"         element={<NotFound     />} />
          </Routes>
        </Layout>
      )}

      {/* Global Auth Modal */}
      <AnimatePresence>
        {authModal && (
          <AuthModal
            key="global-auth"
            initialMode={authModal}
            onSuccess={handleAuthSuccess}
            onClose={() => setAuthModal(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// -- Root App --------------------------------------------------
export default function App() {
  useBackendConnectivityCheck()

  const [isOpening, setIsOpening] = useState(() => {
    try {
      return sessionStorage.getItem('maskan_loader_seen') !== '1'
    } catch {
      return false
    }
  })
  const [isOpeningExit, setIsOpeningExit] = useState(false)

  useEffect(() => {
    if (!isOpening) return undefined

    const exitTimer = window.setTimeout(() => {
      setIsOpeningExit(true)
    }, 1200)

    const hideTimer = window.setTimeout(() => {
      setIsOpening(false)
      try {
        sessionStorage.setItem('maskan_loader_seen', '1')
      } catch {
        // ignore session storage errors
      }
    }, 1600)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [isOpening])

  return (
    <AppErrorBoundary>
      <>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="relative z-10">
            <Watermark />
            <AppRoutes />
            <InstallButton />
          </div>
        </BrowserRouter>

        {isOpening && (
          <div className={`pointer-events-none fixed inset-0 z-[9998] ${isOpeningExit ? 'brand-loader-exit' : ''}`}>
            <OpeningSplash />
          </div>
        )}
      </>
    </AppErrorBoundary>
  )
}
