import React, { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, MapPin, Clock, CheckCircle2, XCircle,
  Hourglass, ChevronRight, Building2, Search, X,
  Calendar, Users, CreditCard, Loader2,
} from 'lucide-react'
import { bookingService } from '../services/bookingService'
import { propertyService } from '../services/propertyService'
import GuestCheckInQRCode from '../components/bookings/GuestCheckInQRCode'
import EscrowPaymentModal from '../components/bookings/EscrowPaymentModal'
import CancelConfirmationModal from '../components/bookings/CancelConfirmationModal'

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmée',
    icon: CheckCircle2,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  awaiting_payment: {
    label: 'Paiement attendu',
    icon: CreditCard,
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  awaiting_checkin: {
    label: 'Check-in requis (cash)',
    icon: CheckCircle2,
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  paid_awaiting_checkin: {
    label: 'Check-in requis (carte)',
    icon: CheckCircle2,
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  pending: {
    label: 'En attente',
    icon: Hourglass,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  completed: {
    label: 'Terminée',
    icon: CheckCircle2,
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    border: 'border-primary-200',
    dot: 'bg-primary-400',
  },
  cancelled: {
    label: 'Annulée',
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-400',
  },
  rejected: {
    label: 'Refusée',
    icon: XCircle,
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-400',
  },
}

const FILTER_TABS = [
  { value: 'all',       label: 'Toutes'     },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'awaiting_payment', label: 'Paiement attendu' },
  { value: 'awaiting_checkin', label: 'Check-in requis (cash)' },
  { value: 'paid_awaiting_checkin', label: 'Check-in requis (carte)' },
  { value: 'pending',   label: 'En attente' },
  { value: 'completed', label: 'Terminées'  },
  { value: 'cancelled', label: 'Annulées'   },
]

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-TN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

const CANCELLABLE_STATUSES = new Set([
  'pending',
  'confirmed',
  'awaiting_payment',
  'awaiting_checkin',
  'paid_awaiting_checkin',
])

// ── Component ────────────────────────────────────────────────
export default function BookingsPage({ user }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [allBookings, setAllBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentModalBooking, setPaymentModalBooking] = useState(null)
  const [paymentError, setPaymentError] = useState('')
  const [cancelMessage, setCancelMessage] = useState('')
  const [cancelModalBooking, setCancelModalBooking] = useState(null)
  const [cancellingBookingId, setCancellingBookingId] = useState(null)

  const loadBookings = async (active = true, silent = false) => {
    if (!silent) {
      setLoading(true)
    }
    try {
      const data = await bookingService.getMine()
      if (!active) return
      let propertyIndex = new Map()
      try {
        const listings = await propertyService.list()
        propertyIndex = new Map(
          (listings.content || []).map((property) => [String(property.id), {
            ...property,
            price: property.price ?? property.pricePerNight,
            image: property.image ?? (property.images?.length ? property.images[0] : null),
          }])
        )
      } catch {
        propertyIndex = new Map()
      }

      const enriched = await Promise.all((data.content || []).map(async (b) => {
        let property = propertyIndex.get(String(b.listingId))
        if (!property) {
          try {
            const p = await propertyService.getById(b.listingId)
            property = {
              ...p,
              price: p.price ?? p.pricePerNight,
              image: p.image ?? (p.images?.length ? p.images[0] : null),
            }
          } catch { /* property not resolvable */ }
        }
        const nights = Math.max(1, Math.round((new Date(b.checkOutDate) - new Date(b.checkInDate)) / 86400000))
        return {
          id: b.id,
          propertyId: b.listingId,
          checkIn: b.checkInDate,
          checkOut: b.checkOutDate,
          guests: b.guests ?? b.guestCount ?? 1,
          totalPrice: Number(b.totalPrice ?? (property?.price ?? 0) * nights),
          status: (b.status || '').toLowerCase(),
          createdAt: b.createdAt || b.checkInDate,
          checkInSecretCode: b.checkInSecretCode || '',
          paymentMethod: (b.paymentMethod || 'CARD').toUpperCase(),
          property: property || b.property || { title: 'Propriété', location: 'Non disponible', image: '' },
        }
      }))
      setAllBookings(enriched)
    } catch {
      if (active) {
        setAllBookings([])
      }
    } finally {
      if (active && !silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    let active = true
    loadBookings(active)

    const timer = window.setInterval(() => loadBookings(active, true), 8000)
    const onStatusUpdated = () => loadBookings(active, true)
    window.addEventListener('booking:status-updated', onStatusUpdated)

    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('booking:status-updated', onStatusUpdated)
    }
  }, [user])

  const handleEscrowPaymentSuccess = async (bookingId) => {
    const result = await bookingService.payEscrow(bookingId)

    setAllBookings((prev) => prev.map((booking) => (
      booking.id === bookingId
        ? {
            ...booking,
            status: 'paid_awaiting_checkin',
            checkInSecretCode: result.checkInSecretCode || booking.checkInSecretCode,
          }
        : booking
    )))

    setPaymentModalBooking(null)
    setExpandedId(bookingId)
    setPaymentError('')

    window.dispatchEvent(new CustomEvent('booking:status-updated', {
      detail: { bookingId, status: 'PAID_AWAITING_CHECKIN' },
    }))
  }

  const isEscrowAwaitingPayment = (booking) => (
    booking.status === 'awaiting_payment' && booking.paymentMethod === 'CARD'
  )

  const isCashAwaitingCheckIn = (booking) => (
    booking.status === 'awaiting_checkin' && booking.paymentMethod === 'CASH'
  )

  const handleConfirmCancel = async (booking) => {
    setCancelMessage('')
    setPaymentError('')
    setCancellingBookingId(booking.id)

    try {
      const result = await bookingService.cancelReservation(booking.id)
      setAllBookings((prev) => prev.map((item) => (
        item.id === booking.id ? { ...item, status: 'cancelled' } : item
      )))
      setCancelMessage(result.message)
      setCancelModalBooking(null)

      if (typeof result.guestTrustScore === 'number') {
        window.dispatchEvent(new CustomEvent('user:trust-score-updated', {
          detail: { trustScore: result.guestTrustScore },
        }))
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message || error?.message
      setPaymentError(apiMessage || 'Impossible d\'annuler cette réservation.')
    } finally {
      setCancellingBookingId(null)
    }
  }

  if (!user) return <Navigate to="/" replace />

  // Filter by status
  let bookings = filter !== 'all'
    ? allBookings.filter(b => b.status === filter)
    : [...allBookings]

  // Search
  if (search.trim()) {
    const q = search.toLowerCase()
    bookings = bookings.filter(b =>
      (b.property?.title || '').toLowerCase().includes(q) ||
      (b.property?.location || '').toLowerCase().includes(q) ||
      String(b.id).toLowerCase().includes(q)
    )
  }

  // Stats
  const stats = {
    total: allBookings.length,
    confirmed: allBookings.filter(b => b.status === 'confirmed').length,
    pending: allBookings.filter(b => b.status === 'pending').length,
    totalSpent: allBookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((s, b) => s + (b.totalPrice || 0), 0),
  }

  return (
    <section className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {loading && (
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        )}

        {!loading && (
        <>

        {paymentError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            {paymentError}
          </div>
        )}

        {cancelMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-700">
            {cancelMessage}
          </div>
        )}

        {/* ── Header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
              <CalendarCheck className="w-5 h-5 text-primary-50" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-900">Mes Réservations</h1>
              <p className="text-sm text-primary-500">Gérez et suivez toutes vos réservations</p>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, icon: CalendarCheck, color: 'from-primary-400 to-primary-600' },
              { label: 'Confirmées', value: stats.confirmed, icon: CheckCircle2, color: 'from-emerald-400 to-emerald-500' },
              { label: 'En attente', value: stats.pending, icon: Hourglass, color: 'from-amber-400 to-amber-500' },
              { label: 'Total dépensé', value: `${stats.totalSpent.toLocaleString('fr-TN')} DT`, icon: CreditCard, color: 'from-primary-500 to-primary-700' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-primary-50 border border-primary-200 rounded-2xl p-4"
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-lg font-extrabold text-primary-900">{s.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Filter tabs + search ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {FILTER_TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setFilter(t.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === t.value
                    ? 'bg-primary-500 text-primary-50 shadow-md'
                    : 'bg-primary-100 text-primary-600 hover:bg-primary-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full sm:w-56 pl-10 pr-4 py-2.5 rounded-xl border border-primary-200 bg-primary-50 text-sm
                         text-primary-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-primary-400 hover:text-primary-600" />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Empty state ──────────────────────────────────── */}
        {bookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-5">
              <CalendarCheck className="w-9 h-9 text-primary-300" />
            </div>
            <h2 className="text-lg font-bold text-primary-800 mb-1">
              {search || filter !== 'all' ? 'Aucun résultat' : 'Aucune réservation'}
            </h2>
            <p className="text-sm text-primary-500 mb-6 max-w-xs">
              {search || filter !== 'all'
                ? 'Essayez un autre filtre ou terme de recherche.'
                : 'Explorez les propriétés et réservez votre prochain logement.'}
            </p>
            {!search && filter === 'all' && (
              <Link
                to="/explorer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-sm font-bold text-primary-50 shadow-md hover:bg-primary-600 transition"
              >
                <Building2 className="w-4 h-4" /> Explorer
              </Link>
            )}
          </motion.div>
        )}

        {/* ── Booking list ─────────────────────────────────── */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {bookings.map((b, i) => {
              const sc = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
              const StatusIcon = sc.icon
              const nights = daysBetween(b.checkIn, b.checkOut)
              const expanded = expandedId === b.id

              return (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="bg-primary-50 border border-primary-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Main row */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : b.id)}
                    className="w-full flex items-center gap-4 p-4 sm:p-5 text-left"
                  >
                    {/* Property image */}
                    <img
                      src={b.property.image}
                      alt={b.property.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 ring-2 ring-primary-200"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-primary-900 text-sm sm:text-base truncate">{b.property.title}</h3>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${sc.bg} ${sc.text} ${sc.border} border`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-primary-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{b.property.location}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-primary-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-primary-400" />
                          {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary-400" />
                          {nights} jours
                        </span>
                      </div>
                    </div>

                    {/* Expand arrow */}
                    <motion.div
                      animate={{ rotate: expanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="hidden sm:block shrink-0"
                    >
                      <ChevronRight className="w-5 h-5 text-primary-300" />
                    </motion.div>
                  </button>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-primary-200">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <DetailCell icon={Calendar} label="Arrivée" value={formatDate(b.checkIn)} />
                            <DetailCell icon={Calendar} label="Départ" value={formatDate(b.checkOut)} />
                            <DetailCell icon={Users} label="Voyageurs" value={`${b.guests} personne${b.guests > 1 ? 's' : ''}`} />
                            <DetailCell icon={CreditCard} label="Total" value={`${b.totalPrice.toLocaleString('fr-TN')} DT`} />
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-primary-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">
                              Réf. {b.id}
                            </span>
                            <span className="text-[10px] text-primary-400">
                              Réservée le {formatDate(b.createdAt)}
                            </span>
                            <div className="ml-auto flex gap-2">
                              <Link
                                to={`/property/${b.propertyId}`}
                                className="px-3.5 py-2 rounded-xl bg-primary-100 border border-primary-200 text-xs font-semibold text-primary-700 hover:bg-primary-200 transition"
                              >
                                Voir la propriété
                              </Link>
                              {(b.status === 'confirmed' || b.status === 'awaiting_payment' || b.status === 'paid_awaiting_checkin') && (
                                <button className="px-3.5 py-2 rounded-xl bg-primary-500 text-xs font-bold text-primary-50 shadow-sm hover:bg-primary-600 transition">
                                  Contacter l'hôte
                                </button>
                              )}
                              {isEscrowAwaitingPayment(b) && (
                                <button
                                  onClick={() => setPaymentModalBooking(b)}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-500 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 transition"
                                >
                                  Pay Now
                                </button>
                              )}
                              {CANCELLABLE_STATUSES.has(b.status) && (
                                <button
                                  onClick={() => setCancelModalBooking(b)}
                                  disabled={cancellingBookingId === b.id}
                                  className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition disabled:opacity-60"
                                >
                                  Annuler
                                </button>
                              )}
                            </div>
                          </div>

                          {isEscrowAwaitingPayment(b) && (
                            <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                              <p className="text-sm font-semibold text-orange-800">Paiement attendu (escrow)</p>
                              <p className="text-xs text-orange-700 mt-1">
                                Finalisez le paiement par carte pour recevoir votre code QR de check-in.
                              </p>
                            </div>
                          )}

                          {isCashAwaitingCheckIn(b) && (
                            <div className="mt-4 rounded-2xl border border-primary-200 bg-primary-50 p-4">
                              <p className="text-sm font-semibold text-primary-800">Check-in requis (cash)</p>
                              <p className="text-xs text-primary-600 mt-1">
                                Vous paierez {b.totalPrice.toLocaleString('fr-TN')} DT en espèces directement à l'hôte à l'arrivée.
                              </p>
                            </div>
                          )}

                          {(b.status === 'paid_awaiting_checkin' || isCashAwaitingCheckIn(b)) && (
                            <GuestCheckInQRCode secretCode={b.checkInSecretCode} />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        </>
        )}
      </div>

      <EscrowPaymentModal
        open={Boolean(paymentModalBooking)}
        booking={paymentModalBooking}
        onClose={() => setPaymentModalBooking(null)}
        onSuccess={handleEscrowPaymentSuccess}
      />

      <CancelConfirmationModal
        open={Boolean(cancelModalBooking)}
        booking={cancelModalBooking}
        loading={Boolean(cancelModalBooking && cancellingBookingId === cancelModalBooking.id)}
        onClose={() => {
          if (cancellingBookingId) return
          setCancelModalBooking(null)
        }}
        onConfirm={handleConfirmCancel}
      />
    </section>
  )
}

// ── Detail cell ──────────────────────────────────────────────
function DetailCell({ icon: Icon, label, value }) {
  return (
    <div className="bg-primary-100 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-primary-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400">{label}</span>
      </div>
      <p className="text-sm font-bold text-primary-900">{value}</p>
    </div>
  )
}
