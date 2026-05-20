import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import MapLibreMap, { Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  ArrowLeft, Heart, Share2, MapPin, Star, Bed, Bath, Maximize2,
  Wifi, Car, Waves, Shield, TreePine, Wind, ChefHat, Building,
  CalendarDays, Users, X, Check, Loader2, ChevronLeft, ChevronRight, AlertTriangle,
  CreditCard, Banknote,
} from 'lucide-react'
import { propertyService } from '../services/propertyService'
import { bookingService } from '../services/bookingService'
import { wishlistService } from '../services/wishlistService'
import { reviewService } from '../services/reviewService'
import ReviewForm from '../components/reviews/ReviewForm'
import { useNotifications } from '../context/NotificationContext'

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || 'eOof1Hy8rLq0QdXVjQRl'

const getPropertyTypePin = (type) => {
  const normalized = String(type || '').toLowerCase()
  if (normalized.includes('villa')) return '🏛️'
  if (normalized.includes('maison') || normalized.includes('house')) return '🏠'
  if (normalized.includes('chalet')) return '🏕️'
  if (normalized.includes('studio')) return '🏢'
  if (normalized.includes('penthouse')) return '🏙️'
  if (normalized.includes('appartement') || normalized.includes('apartment')) return '🏢'
  return '📍'
}

const DEFAULT_HOUSE_RULES = [
  'Arrivée : à partir de 15h00',
  'Départ : avant 11h00',
  'Non fumeur à l\'intérieur',
  'Animaux acceptés sur demande',
]

function isIdentityApproved(user) {
  const identityStatus = user?.identityStatus
  return identityStatus === 'approved' || identityStatus === 'verified'
}

function parseHouseRules(houseRules) {
  if (!houseRules || typeof houseRules !== 'string') return DEFAULT_HOUSE_RULES
  const normalized = houseRules
    .split(/\r?\n|[•\-]/)
    .map((line) => line.trim())
    .filter(Boolean)
  return normalized.length ? normalized : DEFAULT_HOUSE_RULES
}

function normalizePropertyData(data) {
  return {
    ...data,
    price: data.price ?? data.pricePerNight,
    lat: data.latitude ?? data.lat,
    lng: data.longitude ?? data.lng,
    image: data.image ?? (data.images?.length ? data.images[0] : null),
    currency: data.currency || 'DT',
    period: data.period || (data.pricePerNight != null ? 'nuit' : 'mois'),
  }
}

function getReviewerInitials(name) {
  return String(name || 'AN')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AN'
}

// ── Amenity icon map ──────────────────────────────────────────
const AMENITY_ICONS = {
  'WiFi':             Wifi,
  'Parking':          Car,
  'Piscine':          Waves,
  'Piscine privée':   Waves,
  'Sécurité 24/7':    Shield,
  'Jardin':           TreePine,
  'Climatisation':    Wind,
  'Cuisine équipée':  ChefHat,
  'Ascenseur':        Building,
  'Garage':           Car,
  'Vue mer':          Waves,
  'Terrasse':         Building,
  'Conciergerie':     Shield,
  'Gardien':          Shield,
  'Proche école':     Building,
  'Cheminée':         Wind,
  'Vue forêt':        TreePine,
  'Calme absolu':     TreePine,
}

// ── Gallery images (generate variants from the main image) ────
function getGalleryImages(property) {
  const images = Array.isArray(property?.images)
    ? property.images.filter(Boolean)
    : []

  if (images.length > 1) {
    return images
  }

  const base = images[0] || property?.image
  if (!base) {
    return ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=90']
  }

  // Do not append query params to data URLs or static uploaded file URLs.
  if (base.startsWith('data:') || base.includes('/uploads/')) {
    return [base]
  }

  const separator = base.includes('?') ? '&' : '?'
  return [
    base,
    `${base}${separator}crop=top`,
    `${base}${separator}crop=center`,
    `${base}${separator}crop=bottom`,
  ]
}

// ── Image Gallery with Lightbox ───────────────────────────────
function ImageGallery({ images, title }) {
  const [lightbox, setLightbox] = useState(null)

  return (
    <>
      {/* Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden">
        {/* Main large image */}
        <div
          className="relative aspect-[4/3] md:aspect-auto md:row-span-2 cursor-pointer group"
          onClick={() => setLightbox(0)}
        >
          <img src={images[0]} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors" />
        </div>
        {/* Side images */}
        {images.slice(1, 3).map((src, i) => (
          <div
            key={i}
            className="relative aspect-[4/3] cursor-pointer group hidden md:block"
            onClick={() => setLightbox(i + 1)}
          >
            <img src={src} alt={`${title} ${i + 2}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors" />
            {i === 1 && images.length > 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightbox(i + 1) }}
                className="absolute bottom-3 right-3 bg-primary-50/90 backdrop-blur-sm text-primary-900 text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                +{images.length - 3} photos
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-primary-900/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary-50/10 text-primary-50 flex items-center justify-center hover:bg-primary-50/20 transition-colors" onClick={() => setLightbox(null)}>
              <X className="w-5 h-5" />
            </button>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary-50/10 text-primary-50 flex items-center justify-center hover:bg-primary-50/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + images.length) % images.length) }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              src={images[lightbox]}
              alt={title}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary-50/10 text-primary-50 flex items-center justify-center hover:bg-primary-50/20 transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % images.length) }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <p className="absolute bottom-4 text-primary-50/60 text-sm">{lightbox + 1} / {images.length}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Booking Sidebar ───────────────────────────────────────────
function toDateOnly(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function parseIsoDateToLocalDate(isoDate) {
  const [year, month, day] = String(isoDate || '').split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  return new Date(year, month - 1, day)
}

function formatDateForApi(date) {
  if (!(date instanceof Date)) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameCalendarDay(firstDate, secondDate) {
  if (!(firstDate instanceof Date) || !(secondDate instanceof Date)) {
    return false
  }

  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate()
}

function BookingSidebar({ property, user, onAuthClick, onRequireVerification, notify }) {
  const [checkIn, setCheckIn]   = useState(null)
  const [checkOut, setCheckOut] = useState(null)
  const [guests, setGuests]     = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('CARD')
  const [loading, setLoading]   = useState(false)
  const [booked, setBooked]     = useState(false)
  const [error, setError]       = useState('')
  const [unavailableDateRanges, setUnavailableDateRanges] = useState([])

  useEffect(() => {
    let active = true
    bookingService.getUnavailableDates(property.id)
      .then((data) => {
        if (!active) return
        setUnavailableDateRanges(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        if (!active) return
        console.log('Error fetching unavailable dates:', error)
        setUnavailableDateRanges([])
      })

    return () => { active = false }
  }, [property.id])

  const parsedUnavailableRanges = useMemo(() => (
    unavailableDateRanges
      .map((range) => ({
        start: parseIsoDateToLocalDate(range.checkInDate),
        end: parseIsoDateToLocalDate(range.checkOutDate),
      }))
      .filter((range) => range.start && range.end)
  ), [unavailableDateRanges])

  const unavailableDates = useMemo(() => {
    const uniqueDates = new Map()

    parsedUnavailableRanges.forEach((range) => {
      const cursor = new Date(range.start)
      while (cursor < range.end) {
        uniqueDates.set(formatDateForApi(cursor), new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
    })

    return Array.from(uniqueDates.values())
  }, [parsedUnavailableRanges])

  const hasDateRangeOverlap = (startDate, endDate) => {
    return parsedUnavailableRanges.some((range) => range.start < endDate && range.end > startDate)
  }

  const minimumCheckoutDate = useMemo(() => {
    if (!checkIn) {
      return toDateOnly(new Date())
    }

    const date = new Date(checkIn)
    date.setDate(date.getDate() + 1)
    return date
  }, [checkIn])

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    const diff = checkOut - checkIn
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [checkIn, checkOut])

  const subtotal = nights * property.price
  const serviceFee = Math.round(subtotal * 0.08)
  const total = subtotal + serviceFee

  const handleBook = async () => {
    if (!user) {
      onAuthClick?.('login')
      return
    }

    if (!isIdentityApproved(user)) {
      onRequireVerification?.()
      return
    }

    if (!checkIn || !checkOut || nights <= 0) {
      setError('Veuillez sélectionner des dates valides.')
      return
    }
    if (hasDateRangeOverlap(checkIn, checkOut)) {
      setError('Ces dates ne sont plus disponibles. Veuillez sélectionner une autre période.')
      return
    }

    setError('')
    setLoading(true)

    try {
      await bookingService.create({
        listingId: String(property.id),
        checkInDate: formatDateForApi(checkIn),
        checkOutDate: formatDateForApi(checkOut),
        guests,
        paymentMethod,
      })
      setBooked(true)
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Échec de la réservation.'

      setError(message)

      if (status === 400 && message.toLowerCase().includes('active reservation')) {
        notify?.('Vous avez déjà une réservation active. Vous ne pouvez pas réserver un autre logement avant la fin de votre séjour actuel.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const today = toDateOnly(new Date())

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="sticky top-28 bg-primary-50 border border-primary-200 rounded-2xl p-6 shadow-glass"
    >
      {/* Price */}
      <div className="flex items-baseline gap-1.5 mb-6">
        <span className="text-2xl font-extrabold text-primary-900">
          {property.price.toLocaleString('fr-TN')} {property.currency || 'DT'}
        </span>
        {property.period && (
          <span className="text-sm text-primary-500">/ {property.period}</span>
        )}
      </div>

      {booked ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-primary-600" />
          </div>
          <h3 className="text-lg font-bold text-primary-900">Réservation confirmée !</h3>
          <p className="text-sm text-primary-500 mt-1">
            {nights} nuit{nights > 1 ? 's' : ''} · {checkIn?.toLocaleDateString('fr-FR')} – {checkOut?.toLocaleDateString('fr-FR')}
          </p>
          <p className="text-xs text-primary-400 mt-3">Un email de confirmation vous a été envoyé.</p>
        </motion.div>
      ) : (
        <>
          {/* Date inputs */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1 block">Arrivée</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9c502b]/70 pointer-events-none z-10" />
                <DatePicker
                  selected={checkIn}
                  startDate={checkIn}
                  endDate={checkOut}
                  selectsStart
                  minDate={today}
                  excludeDates={unavailableDates}
                  dayClassName={(date) => {
                    const isUnavailable = unavailableDates.some((unavailableDate) => isSameCalendarDay(unavailableDate, date))
                    return isUnavailable ? 'maskan-day-unavailable' : 'maskan-day-available'
                  }}
                  onChange={(date) => {
                    setCheckIn(date)
                    if (checkOut && date && checkOut <= date) {
                      setCheckOut(null)
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  popperClassName="maskan-datepicker-popper"
                  calendarClassName="maskan-datepicker"
                  className="w-full !pl-10 pr-3 py-2.5 rounded-xl border border-primary-200 bg-primary-100 text-sm text-primary-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1 block">Départ</label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9c502b]/70 pointer-events-none z-10" />
                <DatePicker
                  selected={checkOut}
                  startDate={checkIn}
                  endDate={checkOut}
                  selectsEnd
                  minDate={minimumCheckoutDate}
                  excludeDates={unavailableDates}
                  dayClassName={(date) => {
                    const isUnavailable = unavailableDates.some((unavailableDate) => isSameCalendarDay(unavailableDate, date))
                    return isUnavailable ? 'maskan-day-unavailable' : 'maskan-day-available'
                  }}
                  filterDate={(date) => {
                    if (!checkIn) {
                      return date > today
                    }

                    return date > checkIn && !hasDateRangeOverlap(checkIn, date)
                  }}
                  onChange={(date) => setCheckOut(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  popperClassName="maskan-datepicker-popper"
                  calendarClassName="maskan-datepicker"
                  className="w-full !pl-10 pr-3 py-2.5 rounded-xl border border-primary-200 bg-primary-100 text-sm text-primary-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="mb-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-1 block">Voyageurs</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 pointer-events-none" />
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-primary-200 bg-primary-100 text-sm text-primary-900 outline-none appearance-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment method */}
          <div className="mb-5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-primary-500 mb-2 block">Mode de paiement</label>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  paymentMethod === 'CARD'
                    ? 'border-primary-400 bg-primary-50 shadow-sm'
                    : 'border-primary-200 bg-primary-100 hover:bg-primary-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${paymentMethod === 'CARD' ? 'bg-primary-500 text-white' : 'bg-primary-200 text-primary-600'}`}>
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-primary-900">Pay Securely Online (Escrow)</p>
                    <p className="text-xs text-primary-500">Carte bancaire, paiement sequestre</p>
                  </div>
                </div>
                <span className={`h-3 w-3 rounded-full border ${paymentMethod === 'CARD' ? 'border-primary-500 bg-primary-500' : 'border-primary-300 bg-transparent'}`} />
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  paymentMethod === 'CASH'
                    ? 'border-primary-400 bg-primary-50 shadow-sm'
                    : 'border-primary-200 bg-primary-100 hover:bg-primary-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${paymentMethod === 'CASH' ? 'bg-primary-500 text-white' : 'bg-primary-200 text-primary-600'}`}>
                    <Banknote className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-primary-900">Pay Cash on Arrival</p>
                    <p className="text-xs text-primary-500">Paiement en main propre</p>
                  </div>
                </div>
                <span className={`h-3 w-3 rounded-full border ${paymentMethod === 'CASH' ? 'border-primary-500 bg-primary-500' : 'border-primary-300 bg-transparent'}`} />
              </button>
            </div>
          </div>

          {/* Price breakdown */}
          {nights > 0 && (
            <div className="border-t border-primary-200 pt-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between text-primary-700">
                 <span>{property.price.toLocaleString('fr-TN')} DT × {nights} nuit{nights > 1 ? 's' : ''}</span>
                 <span>{subtotal.toLocaleString('fr-TN')} DT</span>
              </div>
              <div className="flex justify-between text-primary-500">
                <span>Frais de service</span>
                 <span>{serviceFee.toLocaleString('fr-TN')} DT</span>
              </div>
              <div className="flex justify-between font-bold text-primary-900 pt-2 border-t border-primary-200">
                <span>Total</span>
                 <span>{total.toLocaleString('fr-TN')} DT</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 font-medium mb-3">{error}</p>
          )}

          {/* Book button */}
          <motion.button
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            onClick={handleBook}
            disabled={loading || !property.available}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200
              ${property.available
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-primary-50 shadow-md hover:shadow-lg'
                : 'bg-primary-200 text-primary-400 cursor-not-allowed'
              }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : !property.available ? (
              'Indisponible'
            ) : !user ? (
              'Se connecter pour réserver'
            ) : !isIdentityApproved(user) ? (
              'Verifier votre identite pour reserver'
            ) : (
              'Réserver maintenant'
            )}
          </motion.button>

          {property.available && (
            <p className="text-center text-[11px] text-primary-400 mt-2">Aucun prélèvement immédiat</p>
          )}
        </>
      )}
    </motion.div>
  )
}

// ── Main Property Details Page ────────────────────────────────
export default function PropertyDetails({ user, onAuthClick }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useNotifications()
  const [liked, setLiked] = useState(false)
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const displayLocation = property?.location || property?.address || property?.locationName || property?.city || 'Localisation indisponible'

  useEffect(() => {
    let active = true
    setLoading(true)
    propertyService.getById(id)
      .then(data => {
        if (!active) return
        setProperty(normalizePropertyData(data))
      })
      .catch(() => {
        if (!active) return
        setProperty(null)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!user || !property?.id) {
      setLiked(false)
      return
    }

    let active = true
    wishlistService.list()
      .then((items) => {
        if (!active) return
        const exists = items.some((item) => String(item.id) === String(property.id))
        setLiked(exists)
      })
      .catch(() => {
        if (!active) return
        setLiked(false)
      })

    return () => {
      active = false
    }
  }, [user, property?.id])

  useEffect(() => {
    if (!property?.id) {
      setReviews([])
      return
    }

    let active = true
    setReviewsLoading(true)
    reviewService.listByProperty(property.id)
      .then((data) => {
        if (!active) return
        setReviews(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!active) return
        setReviews([])
      })
      .finally(() => {
        if (!active) return
        setReviewsLoading(false)
      })

    return () => {
      active = false
    }
  }, [property?.id])

  useEffect(() => {
    if (!user || !property?.id) {
      setCanReview(false)
      return
    }

    let active = true
    reviewService.canReview(property.id)
      .then((value) => {
        if (!active) return
        setCanReview(Boolean(value))
      })
      .catch(() => {
        if (!active) return
        setCanReview(false)
      })

    return () => {
      active = false
    }
  }, [user, property?.id])

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((left, right) => {
      const leftDate = left?.createdAt ? new Date(left.createdAt).getTime() : 0
      const rightDate = right?.createdAt ? new Date(right.createdAt).getTime() : 0
      return rightDate - leftDate
    })
  }, [reviews])

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!property?.id) return
    if (!user) {
      onAuthClick?.('login')
      return
    }

    if (!rating || rating < 1 || rating > 5) {
      return
    }

    setReviewSubmitting(true)
    try {
      await reviewService.create({
        propertyId: String(property.id),
        rating,
        comment: comment?.trim() || undefined,
      })

      const updatedReviews = await reviewService.listByProperty(property.id)
      setReviews(Array.isArray(updatedReviews) ? updatedReviews : [])
      const refreshedProperty = await propertyService.getById(id)
      setProperty(normalizePropertyData(refreshedProperty))
      notify?.('Votre avis a été publié.', 'success')
    } catch (error) {
      throw error
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!property?.id) return
    if (!user) {
      onAuthClick?.('login')
      return
    }

    try {
      if (liked) {
        await wishlistService.remove(String(property.id))
        setLiked(false)
      } else {
        await wishlistService.add(String(property.id))
        setLiked(true)
      }
    } catch {
      // Leave current state unchanged on failure.
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-24">
        <p className="text-5xl font-extrabold text-primary-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-primary-900 mb-2">Propriété introuvable</h1>
        <p className="text-sm text-primary-500 mb-6">Cette annonce n'existe pas ou a été supprimée.</p>
        <Link to="/explorer" className="text-sm font-semibold text-primary-600 hover:underline">
          ← Retour à l'explorer
        </Link>
      </div>
    )
  }

  const images = getGalleryImages(property)

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Top bar: back + actions ────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleWishlistToggle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-200 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors"
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
              {liked ? 'Sauvegardé' : 'Sauvegarder'}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary-200 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors">
              <Share2 className="w-4 h-4" /> Partager
            </button>
          </div>
        </div>

        {/* ── Image Gallery ──────────────────────────────────── */}
        <ImageGallery images={images} title={property.title} />

        {/* ── Content + Sidebar ───────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 mt-8">
          {/* Left: Details */}
          <div className="space-y-8">
            {/* Title block */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-900 leading-tight">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-2 text-primary-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{property.location}</span>
                  </div>
                </div>
                {(property.averageRating ?? property.rating) != null && (
                  <div className="flex items-center gap-1.5 bg-primary-100 px-3 py-2 rounded-xl shrink-0">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-primary-900">{property.averageRating ?? property.rating}</span>
                    {property.reviewCount != null && (
                      <span className="text-xs text-primary-400">({property.reviewCount} avis)</span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-4 mt-5 py-4 border-y border-primary-200">
                {property.bedrooms != null && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Bed className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-900">{property.bedrooms}</p>
                      <p className="text-[10px] text-primary-400">Chambre{property.bedrooms > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}
                {property.bathrooms != null && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Bath className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-900">{property.bathrooms}</p>
                      <p className="text-[10px] text-primary-400">Salle{property.bathrooms > 1 ? 's' : ''} de bain</p>
                    </div>
                  </div>
                )}
                {property.area != null && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-900">{property.area} m²</p>
                      <p className="text-[10px] text-primary-400">Surface</p>
                    </div>
                  </div>
                )}
                {property.type && (
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                      <Building className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-900">{property.type}</p>
                      <p className="text-[10px] text-primary-400">Type</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Host */}
            {property.host && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4"
              >
                <img
                  src={property.host.avatar}
                  alt={property.host.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-primary-200"
                />
                <div>
                  <p className="text-sm font-bold text-primary-900">Hébergé par {property.host.name}</p>
                  <p className="text-xs text-primary-500">Hôte vérifié · Membre depuis 2023</p>
                </div>
              </motion.div>
            )}

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-lg font-bold text-primary-900 mb-3">À propos de ce logement</h2>
              <p className="text-sm text-primary-700 leading-relaxed">
                Découvrez ce magnifique {property.type?.toLowerCase() || 'logement'} situé à {displayLocation}.
                {property.bedrooms && ` Avec ${property.bedrooms} chambre${property.bedrooms > 1 ? 's' : ''}`}
                {property.bathrooms && ` et ${property.bathrooms} salle${property.bathrooms > 1 ? 's' : ''} de bain`}
                {property.area && `, ce bien de ${property.area} m² offre un espace de vie confortable et lumineux`}.
                Idéal pour {property.bedrooms >= 3 ? 'les familles' : property.bedrooms >= 2 ? 'les couples ou petites familles' : 'un séjour solo ou en couple'}.
              </p>
              <p className="text-sm text-primary-700 leading-relaxed mt-3">
                Profitez d'un cadre exceptionnel avec tous les équipements nécessaires pour un séjour agréable.
                L'hôte est disponible pour vous accompagner et vous recommander les meilleures adresses du quartier.
              </p>
            </motion.div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-lg font-bold text-primary-900 mb-4">Équipements</h2>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map(amenity => {
                    const Icon = AMENITY_ICONS[amenity] || Shield
                    return (
                      <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-200/60">
                        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary-600" />
                        </div>
                        <span className="text-sm text-primary-700 font-medium">{amenity}</span>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Location hint */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <h2 className="text-lg font-bold text-primary-900 mb-3">Localisation</h2>
              {property.lat != null && property.lng != null ? (
                <div className="rounded-2xl overflow-hidden border border-primary-200">
                  <MapLibreMap
                    initialViewState={{
                      latitude: Number(property.lat),
                      longitude: Number(property.lng),
                      zoom: 14,
                    }}
                    mapStyle={`https://api.maptiler.com/maps/019d7cf7-51a0-7f23-b2b3-eb3785692ca9/style.json?key=${MAPTILER_KEY}`}
                    style={{ width: '100%', height: 260 }}
                    attributionControl={true}
                  >
                    <Marker
                      latitude={Number(property.lat)}
                      longitude={Number(property.lng)}
                      anchor="bottom"
                    >
                      <div className="select-none -translate-y-1">
                        <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg border-2 border-white text-base">
                          {getPropertyTypePin(property.type)}
                        </div>
                        <div className="w-0 h-0 mx-auto border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px] border-t-primary-500" />
                      </div>
                    </Marker>
                  </MapLibreMap>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border border-primary-200 bg-primary-100 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-primary-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-primary-700">{displayLocation}</p>
                    <p className="text-xs text-primary-400 mt-1">Coordonnées non définies par l'hôte</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* House Rules */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-bold text-primary-900 mb-3">Règles de la maison</h2>
              <div className="space-y-2 text-sm text-primary-700">
                {parseHouseRules(property.houseRules).map((rule, index) => (
                  <p key={`${rule}-${index}`}>• {rule}</p>
                ))}
              </div>
            </motion.div>

            {/* Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="rounded-2xl border border-primary-200 bg-primary-50 p-5"
            >
              <h2 className="text-lg font-bold text-primary-900">Avis et commentaires</h2>
              <p className="text-xs text-primary-500 mt-1">
                Donnez une note et partagez votre avis sur la maison, le propriétaire ou le service.
              </p>

              {canReview ? (
                <ReviewForm
                  onSubmitReview={handleReviewSubmit}
                  submitting={reviewSubmitting}
                  disabled={!user}
                  submitLabel={user ? 'Publier mon avis' : 'Connectez-vous pour publier un avis'}
                  initialRating={5}
                />
              ) : user ? (
                <p className="mt-4 text-xs text-primary-500">
                  You must complete a stay at this property to leave a review.
                </p>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {reviewsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-primary-500 md:col-span-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Chargement des avis...
                  </div>
                ) : (
                  sortedReviews.length === 0 ? (
                    <p className="text-xs text-primary-500 md:col-span-2">Aucun avis pour le moment.</p>
                  ) : (
                    sortedReviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-primary-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                              {getReviewerInitials(review.authorName)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-primary-900">{review.authorName || 'Avis anonyme'}</p>
                              <div className="mt-1 flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <Star
                                    key={`${review.id}-${value}`}
                                    className={`w-4 h-4 ${value <= Number(review.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-primary-200'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] text-primary-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : ''}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="mt-3 text-sm leading-relaxed text-primary-700">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )
                )}
              </div>
            </motion.div>
          </div>

          {/* Right: Booking sidebar */}
          <div className="order-first lg:order-last">
            <BookingSidebar
              property={property}
              user={user}
              notify={notify}
              onAuthClick={onAuthClick}
              onRequireVerification={() => setShowVerificationPrompt(true)}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVerificationPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/60 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="w-full max-w-md rounded-2xl border border-primary-200 bg-primary-50 p-6 shadow-xl"
            >
              <div className="mb-3 inline-flex rounded-xl bg-amber-100 p-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-primary-900">Verification requise</h3>
              <p className="mt-2 text-sm text-primary-600">
                Pour reserver, vous devez terminer la verification invite : email, telephone et identite.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowVerificationPrompt(false)}
                  className="flex-1 rounded-xl border border-primary-200 px-4 py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-100"
                >
                  Plus tard
                </button>
                <button
                  onClick={() => navigate('/guest-verification?context=booking')}
                  className="flex-1 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2.5 text-sm font-bold text-primary-50"
                >
                  Verifier maintenant
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
