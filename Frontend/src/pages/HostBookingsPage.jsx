import React, { useState, useEffect } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck, MapPin, Clock, CheckCircle2, XCircle,
  Hourglass, ChevronDown, Search, Building2,
  Users, CreditCard, Calendar, UserCheck, AlertCircle,
  Loader2, MessageSquare,
} from 'lucide-react'
import { bookingService } from '../services/bookingService'
import { propertyService } from '../services/propertyService'
import HostBookingCard from '../components/bookings/HostBookingCard'

const STATUS_MAP = {
  pending:   { label: 'En attente',  color: 'text-amber-600',   bg: 'bg-amber-50',   icon: Hourglass },
  awaiting_payment: { label: 'En attente paiement', color: 'text-orange-600', bg: 'bg-orange-50', icon: CreditCard },
  paid_awaiting_checkin: { label: 'Payée · Check-in requis', color: 'text-sky-700', bg: 'bg-sky-50', icon: UserCheck },
  confirmed: { label: 'Confirmée',   color: 'text-emerald-600', bg: 'bg-emerald-50',  icon: CheckCircle2 },
  completed: { label: 'Terminée',    color: 'text-blue-600',    bg: 'bg-blue-50',     icon: CalendarCheck },
  rejected:  { label: 'Refusée',     color: 'text-red-500',     bg: 'bg-red-50',      icon: XCircle },
  cancelled: { label: 'Annulée',     color: 'text-primary-500', bg: 'bg-primary-50',  icon: AlertCircle },
}

const TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'pending',   label: 'En attente' },
  { key: 'awaiting_payment', label: 'Paiement attendu' },
  { key: 'paid_awaiting_checkin', label: 'Check-in QR' },
  { key: 'confirmed', label: 'Confirmées' },
  { key: 'completed', label: 'Terminées' },
  { key: 'rejected',  label: 'Refusées' },
]

export default function HostBookingsPage({ user }) {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [scannerBookingId, setScannerBookingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const loadBookings = async (active = true, silent = false) => {
    if (!silent) {
      setLoading(true)
    }
    setActionError('')
    try {
      const data = await bookingService.getOwnerBookings()
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
        let prop = propertyIndex.get(String(b.listingId))
        if (!prop) {
          try {
            const p = await propertyService.getById(b.listingId)
            prop = { ...p, price: p.price ?? p.pricePerNight, image: p.image ?? (p.images?.length ? p.images[0] : null) }
          } catch { /* ignore */ }
        }
        const nights = Math.max(1, Math.round((new Date(b.checkOutDate) - new Date(b.checkInDate)) / 86400000))
        return {
          id: b.id,
          propertyId: b.listingId,
          propertyTitle: b.listingTitle || b.property?.title || prop?.title || 'Propriété',
          propertyImage: b.listingImage || b.property?.image || prop?.image || '',
          location: b.listingLocation || b.property?.location || prop?.location || '',
          tenant: { 
            name: b.guestName || `Locataire #${b.guestId}`, 
            avatar: `https://i.pravatar.cc/40?u=${b.guestId}`, 
            email: b.guestEmail || '',
            id: b.guestId,
          },
          checkIn: b.checkInDate,
          checkOut: b.checkOutDate,
          guests: b.guests ?? b.guestCount ?? 1,
          totalPrice: Number(b.totalPrice ?? (prop?.price || 0) * nights),
          status: (b.status || '').toLowerCase(),
          createdAt: b.createdAt || b.checkInDate,
          message: '',
        }
      }))
      setBookings(enriched)
    } catch {
      if (active) {
        setBookings([])
        setActionError('Impossible de charger les réservations.')
      }
    } finally {
      if (active && !silent) setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) return
    let active = true
    if (!scannerBookingId) {
      loadBookings(active)
    }

    let timer = null
    if (!scannerBookingId) {
      timer = window.setInterval(() => loadBookings(active, true), 8000)
    }

    return () => {
      active = false
      if (timer) {
        window.clearInterval(timer)
      }
    }
  }, [user, scannerBookingId])

  if (!user || (user.role !== 'PROPRIETOR' && user.role !== 'ADMIN')) {
    return <Navigate to="/profile" replace />
  }

  const updateStatus = async (id, newStatus) => {
    if (updatingId) return
    setActionError('')
    setUpdatingId(id)
    try {
      const updated = await bookingService.updateStatus(id, { status: newStatus.toUpperCase() })
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: String(updated.status || newStatus).toLowerCase() } : b))
      window.dispatchEvent(new CustomEvent('booking:status-updated', {
        detail: {
          bookingId: id,
          status: String(updated.status || newStatus).toUpperCase(),
        },
      }))
      await loadBookings(true)
    } catch (error) {
      const apiMessage =
        error?.response?.data?.message ||
        (error?.response?.data?.errors && Object.values(error.response.data.errors)[0]) ||
        error?.message
      setActionError(apiMessage || 'Action impossible pour cette réservation.')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCheckInVerified = async (bookingId, verified) => {
    setActionError('')
    setScannerBookingId(null)
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: String(verified?.status || 'completed').toLowerCase() } : b))
    window.dispatchEvent(new CustomEvent('booking:status-updated', {
      detail: {
        bookingId,
        status: String(verified?.status || 'COMPLETED').toUpperCase(),
      },
    }))
    await loadBookings(true)
  }

  const filtered = bookings
    .filter(b => tab === 'all' || b.status === tab)
    .filter(b =>
      (b.propertyTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.tenant?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      String(b.id).toLowerCase().includes(search.toLowerCase())
    )

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const confirmedCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'awaiting_payment' || b.status === 'paid_awaiting_checkin').length
  const totalRevenue = bookings.filter(b => b.status === 'completed')
    .reduce((s, b) => s + b.totalPrice, 0)

  return (
    <div className="pt-28 pb-16 min-h-screen bg-primary-50/40">
      <div className="max-w-5xl mx-auto px-4">

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : (
        <>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-primary-500" />
            Gestion des Réservations
          </h1>
          <p className="text-primary-500 text-sm mt-1">Acceptez, refusez et suivez les réservations de vos biens</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Clock, label: 'En attente', value: pendingCount, color: 'text-amber-500' },
            { icon: CheckCircle2, label: 'Confirmées', value: confirmedCount, color: 'text-emerald-500' },
            { icon: Building2, label: 'Total', value: bookings.length, color: 'text-primary-500' },
            { icon: CreditCard, label: 'Revenus', value: `${totalRevenue.toLocaleString('fr-TN')} DT`, color: 'text-primary-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100">
              <Icon className={`w-5 h-5 ${color} mb-1`} />
              <p className="text-2xl font-bold text-primary-900">{value}</p>
              <p className="text-xs text-primary-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition border
                  ${tab === t.key
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-primary-200 text-primary-600 hover:bg-primary-50'}`}
              >
                {t.label}
                {t.key === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par propriété, locataire ou ID…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-200 focus:border-primary-400
                         focus:ring-2 focus:ring-primary-200 outline-none transition text-sm text-primary-900"
            />
          </div>
        </div>

        {actionError && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
            {actionError}
          </div>
        )}

        {/* Booking cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <CalendarCheck className="w-12 h-12 text-primary-200 mx-auto mb-3" />
            <p className="text-primary-500 font-medium">Aucune réservation trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filtered.map((b, i) => {
                const status = STATUS_MAP[b.status] || STATUS_MAP.pending
                const StatusIcon = status.icon
                const isOpen = expanded === b.id

                return (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden"
                  >
                    {/* Main row */}
                    <button
                      onClick={() => setExpanded(isOpen ? null : b.id)}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-primary-50/50 transition"
                    >
                      <img src={b.propertyImage} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 hidden sm:block" />

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-primary-900 text-sm line-clamp-1">{b.propertyTitle}</p>
                        <p className="text-xs text-primary-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {b.location}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <img src={b.tenant.avatar} alt="" className="w-5 h-5 rounded-full" />
                          <span className="text-xs text-primary-600 font-medium">{b.tenant.name}</span>
                        </div>
                      </div>

                      <div className="hidden md:block text-right shrink-0">
                        <p className="text-sm font-bold text-primary-900">{b.totalPrice.toLocaleString('fr-TN')} DT</p>
                        <p className="text-xs text-primary-500">{b.checkIn} → {b.checkOut}</p>
                      </div>

                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.color} ${status.bg} shrink-0`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>

                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-primary-400">
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-primary-100 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-primary-500 text-xs">Check-in</p>
                                <p className="font-medium text-primary-800 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-primary-400" />
                                  {b.checkIn}
                                </p>
                              </div>
                              <div>
                                <p className="text-primary-500 text-xs">Check-out</p>
                                <p className="font-medium text-primary-800 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-primary-400" />
                                  {b.checkOut}
                                </p>
                              </div>
                              <div>
                                <p className="text-primary-500 text-xs">Voyageurs</p>
                                <p className="font-medium text-primary-800 flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-primary-400" />
                                  {b.guests} personne{b.guests > 1 ? 's' : ''}
                                </p>
                              </div>
                              <div>
                                <p className="text-primary-500 text-xs">Montant total</p>
                                <p className="font-bold text-primary-900 flex items-center gap-1">
                                  <CreditCard className="w-3.5 h-3.5 text-primary-400" />
                                  {b.totalPrice.toLocaleString('fr-TN')} DT
                                </p>
                              </div>
                            </div>

                            {/* Tenant info */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-primary-50/60">
                              <div className="flex items-center gap-3">
                                <img src={b.tenant.avatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                <div>
                                  <p className="text-sm font-semibold text-primary-800">{b.tenant.name}</p>
                                  <p className="text-xs text-primary-500">{b.tenant.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => navigate('/messages', { state: { recipientId: b.tenant.id, recipientName: b.tenant.name } })}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition text-xs font-semibold"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Message
                              </button>
                            </div>

                            {/* Message */}
                            {b.message && (
                              <div className="p-3 rounded-xl bg-primary-50/40 border border-primary-100">
                                <p className="text-xs text-primary-500 mb-1">Message du locataire</p>
                                <p className="text-sm text-primary-700 italic">« {b.message} »</p>
                              </div>
                            )}

                            {/* Action buttons */}
                            {b.status === 'pending' && (
                              <div className="flex gap-3 pt-1">
                                <button
                                  onClick={() => updateStatus(b.id, 'confirmed')}
                                  disabled={updatingId === b.id}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                                             bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition text-sm
                                             disabled:opacity-60"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {updatingId === b.id ? 'Mise à jour…' : 'Accepter'}
                                </button>
                                <button
                                  onClick={() => updateStatus(b.id, 'rejected')}
                                  disabled={updatingId === b.id}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                                             border-2 border-red-200 text-red-500 font-semibold hover:bg-red-50 transition text-sm
                                             disabled:opacity-60"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Refuser
                                </button>
                              </div>
                            )}
                            {b.status === 'confirmed' && (
                              <div className="flex gap-3 pt-1">
                                <button
                                  onClick={() => updateStatus(b.id, 'completed')}
                                  disabled={updatingId === b.id}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                                             bg-blue-500 text-white font-semibold hover:bg-blue-600 transition text-sm
                                             disabled:opacity-60"
                                >
                                  <CalendarCheck className="w-4 h-4" />
                                  Marquer terminée
                                </button>
                                <button
                                  onClick={() => updateStatus(b.id, 'cancelled')}
                                  disabled={updatingId === b.id}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                                             border-2 border-primary-200 text-primary-600 font-semibold hover:bg-primary-50 transition text-sm
                                             disabled:opacity-60"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Annuler
                                </button>
                              </div>
                            )}

                            {b.status === 'paid_awaiting_checkin' && (
                              <HostBookingCard
                                bookingId={b.id}
                                onVerified={handleCheckInVerified}
                                isScannerOpen={scannerBookingId === b.id}
                                onOpenScanner={() => setScannerBookingId(b.id)}
                                onCloseScanner={() => setScannerBookingId(null)}
                              />
                            )}

                            <p className="text-[11px] text-primary-400 text-right">
                              Réservation #{b.id} · Créée le {b.createdAt}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  )
}
