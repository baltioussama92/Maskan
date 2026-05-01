import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Calendar, Users, Search, ChevronDown, Plus, Minus } from 'lucide-react'
import { propertyService } from '../../services/propertyService'
import ReactDatePicker, { registerLocale } from 'react-datepicker'
import fr from 'date-fns/locale/fr'
import 'react-datepicker/dist/react-datepicker.css'

// ── Date formatter helper ────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null

const panelClass = 'absolute top-full mt-3 left-0 right-0 md:right-auto md:w-72 rounded-2xl border border-primary-200/50 bg-primary-50/85 shadow-glass-lg backdrop-blur-xl z-[120]'
const panelTallClass = `${panelClass} p-4 max-h-72 overflow-y-auto`
const inputClass = 'w-full rounded-xl border border-primary-200 bg-primary-100 px-4 py-3 text-sm text-primary-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200'

// ── Pill Divider ─────────────────────────────────────────────
function Divider() {
  return <div className="hidden md:block w-px h-8 bg-primary-200/70 shrink-0" />
}

// ── Single Search Field ──────────────────────────────────────
function SearchField({ label, value, placeholder, icon: Icon, onClick, active, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start px-5 ${active ? 'py-4' : 'py-3'} rounded-full transition-all duration-200 w-full
                  md:w-auto group ${active ? 'bg-primary-100 shadow-lg' : 'hover:bg-primary-50/60'}
                  ${className}`}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-500 group-hover:text-primary-600
                       transition-colors duration-150 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </span>
      <span className={`text-sm font-medium mt-0.5 whitespace-nowrap ${value ? 'text-primary-800' : 'text-primary-400'}`}>
        {value || placeholder}
      </span>
    </button>
  )
}

// ── Location Dropdown ────────────────────────────────────────
function LocationDropdown({ value, onChange, onClose, cities }) {
  const [query, setQuery] = useState('')
  const filtered = cities.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  )
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1     }}
      exit  ={{ opacity: 0, y: 10, scale: 0.97   }}
      transition={{ duration: 0.18 }}
      className={`${panelTallClass} left-0 md:w-96`}
    >
      <div className="p-3 border-b border-primary-200">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher une ville…"
          className={inputClass}
        />
      </div>
      <ul className="max-h-52 overflow-y-auto py-1">
        {filtered.map((city) => (
          <li key={city}>
            <button
              type="button"
              onClick={() => { onChange(city); onClose() }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors
                          ${value === city
                            ? 'bg-primary-50 text-primary-600 font-semibold'
                            : 'text-primary-700 hover:bg-primary-50'}`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 text-primary-400" />
              {city}
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

// ── Date Picker Dropdown (simplified) ───────────────────────
function DateDropdown({ label, value, onChange, onClose, min }) {
  // register french locale for react-datepicker
  registerLocale('fr', fr)

  const selectedDate = value ? new Date(value) : null
  const minDate = min ? new Date(min) : new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1     }}
      exit  ={{ opacity: 0, y: 10, scale: 0.97   }}
      transition={{ duration: 0.18 }}
      className={`${panelTallClass} left-0`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-primary-500 mb-3">{label}</p>
      <div className="px-1">
        <ReactDatePicker
          inline
          selected={selectedDate}
          onChange={(d) => { onChange(d ? d.toISOString().split('T')[0] : ''); onClose() }}
          minDate={minDate}
          monthsShown={1}
          locale="fr"
          calendarClassName="rounded-2xl border border-primary-200 bg-primary-50/90 p-2"
        />
      </div>
    </motion.div>
  )
}

// ── Guests Dropdown ──────────────────────────────────────────
function GuestsDropdown({ adults, setAdults, children, setChildren, onClose }) {
  const Counter = ({ label, hint, value, onInc, onDec, min = 0 }) => (
    <div className="flex items-center justify-between py-3 border-b border-primary-200 last:border-none">
      <div>
        <p className="text-sm font-semibold text-primary-800">{label}</p>
        <p className="text-xs text-primary-400">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          onClick={onDec}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border-2 border-primary-200 flex items-center justify-center
                     text-primary-600 disabled:opacity-30 hover:border-primary-400 hover:text-primary-600
                     transition-colors duration-150"
        >
          <Minus className="w-3.5 h-3.5" />
        </motion.button>
        <span className="w-5 text-center text-sm font-bold text-primary-800">{value}</span>
        <motion.button
          whileTap={{ scale: 0.85 }}
          type="button"
          onClick={onInc}
          className="w-8 h-8 rounded-full border-2 border-primary-200 flex items-center justify-center
                     text-primary-600 hover:border-primary-400 hover:text-primary-600
                     transition-colors duration-150"
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1     }}
      exit  ={{ opacity: 0, y: 10, scale: 0.97   }}
      transition={{ duration: 0.18 }}
      className={`${panelTallClass} md:left-auto md:right-0`}
    >
      <Counter
        label="Adultes" hint="13 ans et plus"
        value={adults}    min={1}
        onInc={() => setAdults((v) => v + 1)}
        onDec={() => setAdults((v) => Math.max(1, v - 1))}
      />
      <Counter
        label="Enfants" hint="2 à 12 ans"
        value={children}
        onInc={() => setChildren((v) => v + 1)}
        onDec={() => setChildren((v) => Math.max(0, v - 1))}
      />
      <button
        type="button"
        onClick={onClose}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-xs font-semibold text-primary-50 transition hover:bg-primary-600"
      >
        Appliquer
      </button>
    </motion.div>
  )
}

// ── Main SearchBar ───────────────────────────────────────────
export default function SearchBar({ onSearch, className = '' }) {
  const [location,  setLocation]  = useState('')
  const [checkIn,   setCheckIn]   = useState('')
  const [checkOut,  setCheckOut]  = useState('')
  const [adults,    setAdults]    = useState(2)
  const [kids,      setKids]      = useState(0)
  const [openPanel, setOpenPanel] = useState(null) // 'location' | 'checkin' | 'checkout' | 'guests'
  const [cities, setCities] = useState([])

  const barRef = useRef(null)

  // Close panels on outside click
  useEffect(() => {
    const handler = (e) => {
      if (barRef.current && !barRef.current.contains(e.target))
        setOpenPanel(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const expanded = openPanel !== null

  useEffect(() => {
    let active = true
    propertyService.list()
      .then((data) => {
        if (!active) return
        const uniqueCities = Array.from(new Set((data.content || []).map((property) => property.location).filter(Boolean)))
        setCities(uniqueCities)
      })
      .catch(() => {
        if (!active) return
        setCities([])
      })

    return () => {
      active = false
    }
  }, [])

  const toggle = (panel) => setOpenPanel((p) => (p === panel ? null : panel))

  const guestLabel =
    adults + kids === 1 ? '1 voyageur' : `${adults + kids} voyageurs`

  const handleSubmit = (e) => {
    e.preventDefault()
    setOpenPanel(null)
    onSearch?.({ location, checkIn, checkOut, guests: adults + kids })
  }

  return (
    <form
      ref={barRef}
      onSubmit={handleSubmit}
      className={`relative z-[110] flex flex-col md:flex-row items-stretch md:items-center
          rounded-3xl md:rounded-full border border-primary-200/50 bg-primary-50/75 shadow-glass-lg backdrop-blur-xl p-1.5 gap-1 w-full
          transition-all duration-200 ease-out ${expanded ? 'max-w-5xl md:scale-105' : 'max-w-3xl'} ${className}`}
    >
      {/* Location */}
      <div className="relative flex-1">
        <SearchField
          label="Destination"
          icon={MapPin}
          value={location}
          placeholder="Où souhaitez-vous aller ?"
          onClick={() => toggle('location')}
          active={openPanel === 'location'}
          className="w-full"
        />
        <AnimatePresence>
          {openPanel === 'location' && (
            <LocationDropdown
              value={location}
              onChange={setLocation}
              onClose={() => setOpenPanel(null)}
              cities={cities}
            />
          )}
        </AnimatePresence>
      </div>

      <Divider />

      {/* Check-in */}
      <div className="relative w-full md:w-auto">
        <SearchField
          label="Arrivée"
          icon={Calendar}
          value={fmtDate(checkIn)}
          placeholder="Ajouter date"
          onClick={() => toggle('checkin')}
          active={openPanel === 'checkin'}
        />
        <AnimatePresence>
          {openPanel === 'checkin' && (
            <DateDropdown
              label="Date d'arrivée"
              value={checkIn}
              onChange={(v) => { setCheckIn(v); if (checkOut && v >= checkOut) setCheckOut('') }}
              onClose={() => setOpenPanel(null)}
            />
          )}
        </AnimatePresence>
      </div>

      <Divider />

      {/* Check-out */}
      <div className="relative w-full md:w-auto">
        <SearchField
          label="Départ"
          icon={Calendar}
          value={fmtDate(checkOut)}
          placeholder="Ajouter date"
          onClick={() => toggle('checkout')}
          active={openPanel === 'checkout'}
        />
        <AnimatePresence>
          {openPanel === 'checkout' && (
            <DateDropdown
              label="Date de départ"
              value={checkOut}
              onChange={setCheckOut}
              onClose={() => setOpenPanel(null)}
              min={checkIn || undefined}
            />
          )}
        </AnimatePresence>
      </div>

      <Divider />

      {/* Guests */}
      <div className="relative w-full md:w-auto">
        <SearchField
          label="Voyageurs"
          icon={Users}
          value={adults + kids > 0 ? guestLabel : null}
          placeholder="Ajouter"
          onClick={() => toggle('guests')}
          active={openPanel === 'guests'}
        />
        <AnimatePresence>
          {openPanel === 'guests' && (
            <GuestsDropdown
              adults={adults}    setAdults={setAdults}
              children={kids}    setChildren={setKids}
              onClose={() => setOpenPanel(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Search CTA */}
      <motion.button
        whileHover={{ scale: 1.06, boxShadow: '0 10px 30px rgba(164,131,116,0.4)' }}
        whileTap={{ scale: 0.96 }}
        type="submit"
        className="ml-0 md:ml-1 w-full md:w-auto justify-center flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-primary-50
                   bg-gradient-to-r from-primary-500 to-primary-600
                   shadow-lg transition-all duration-200 shrink-0"
      >
        <Search className="w-4 h-4" />
        <span>Rechercher</span>
      </motion.button>
    </form>
  )
}
