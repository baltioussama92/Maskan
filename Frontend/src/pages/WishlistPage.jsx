import React, { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Trash2, MapPin, Star, Bed, Bath, Maximize2,
  Search, SlidersHorizontal, X, Loader2,
} from 'lucide-react'
import { wishlistService } from '../services/wishlistService'

// ── Sort options ─────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'date',       label: 'Ajouté récemment' },
  { value: 'price-asc',  label: 'Prix croissant'   },
  { value: 'price-desc', label: 'Prix décroissant'  },
  { value: 'rating',     label: 'Meilleure note'    },
]

// ── Component ────────────────────────────────────────────────
export default function WishlistPage({ user }) {
  const [sort,   setSort]   = useState('date')
  const [search, setSearch] = useState('')
  const [removing, setRemoving] = useState(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  useEffect(() => {
    let active = true

    wishlistService.list()
      .then((data) => {
        if (!active) return
        setItems(data.map((property) => ({
          ...property,
          price: property.price ?? property.pricePerNight,
          image: property.image ?? (property.images?.length ? property.images[0] : null),
          period: property.period || (property.pricePerNight != null ? 'nuit' : 'mois'),
        })))
      })
      .catch(() => {
        if (!active) return
        setItems([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  if (!user) return <Navigate to="/" replace />

  const handleRemove = (id) => {
    setRemoving(id)
    wishlistService.remove(id)
      .then((data) => {
        setItems(data.map((property) => ({
          ...property,
          price: property.price ?? property.pricePerNight,
          image: property.image ?? (property.images?.length ? property.images[0] : null),
          period: property.period || (property.pricePerNight != null ? 'nuit' : 'mois'),
        })))
      })
      .catch(() => {})
      .finally(() => setTimeout(() => setRemoving(null), 300))
  }

  let filteredItems = [...items]

  // Search
  if (search.trim()) {
    const q = search.toLowerCase()
    filteredItems = filteredItems.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.location || '').toLowerCase().includes(q) ||
      (p.type || '').toLowerCase().includes(q)
    )
  }

  // Sort
  if (sort === 'price-asc')  filteredItems.sort((a, b) => (a.price || 0) - (b.price || 0))
  if (sort === 'price-desc') filteredItems.sort((a, b) => (b.price || 0) - (a.price || 0))
  if (sort === 'rating')     filteredItems.sort((a, b) => (b.rating || 0) - (a.rating || 0))

  const totalValue = filteredItems.reduce((s, p) => s + (p.price || 0), 0)

  return (
    <section className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-900">Mes Favoris</h1>
              <p className="text-sm text-primary-500">
                {items.length} {items.length > 1 ? 'propriétés sauvegardées' : 'propriété sauvegardée'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Toolbar ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher dans mes favoris..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-200 bg-primary-50 text-sm
                         text-primary-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-primary-400 hover:text-primary-600" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 pointer-events-none" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2.5 rounded-xl border border-primary-200 bg-primary-50 text-sm
                         font-medium text-primary-800 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200 cursor-pointer"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* ── Empty state ───────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            <p className="mt-4 text-sm text-primary-500">Chargement de vos favoris...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-5">
              <Heart className="w-9 h-9 text-primary-300" />
            </div>
            <h2 className="text-lg font-bold text-primary-800 mb-1">
              {search ? 'Aucun résultat' : 'Aucun favori pour le moment'}
            </h2>
            <p className="text-sm text-primary-500 mb-6 max-w-xs">
              {search
                ? 'Essayez un autre terme de recherche.'
                : 'Explorez les propriétés et ajoutez-les à vos favoris en cliquant sur le cœur.'}
            </p>
            {!search && (
              <Link
                to="/explorer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-sm font-bold text-primary-50 shadow-md hover:bg-primary-600 transition"
              >
                <Search className="w-4 h-4" /> Explorer
              </Link>
            )}
          </motion.div>
        ) : (
          <>
            {/* ── Grid ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: removing === p.id ? 0 : 1, y: 0, scale: removing === p.id ? 0.9 : 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  >
                    <WishlistCard property={p} onRemove={handleRemove} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary bar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary-100 border border-primary-200 p-4 sm:px-6"
            >
              <p className="text-sm text-primary-600">
                <span className="font-bold text-primary-800">{filteredItems.length}</span> propriété{filteredItems.length > 1 ? 's' : ''} • Valeur totale&nbsp;
                <span className="font-bold text-primary-800">{totalValue.toLocaleString('fr-TN')} DT</span>/mois
              </p>
              <Link
                to="/explorer"
                className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition"
              >
                + Ajouter plus
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}

// ── Wishlist Card ────────────────────────────────────────────
function WishlistCard({ property: p, onRemove }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={`/property/${p.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group block bg-primary-100 rounded-2xl border border-primary-200 overflow-hidden
                 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={p.image}
          alt={p.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent" />

        {/* Remove button */}
        <motion.button
          initial={false}
          animate={{ opacity: hovered ? 1 : 0.7 }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(p.id) }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary-50/90 backdrop-blur-sm
                     flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
          title="Retirer des favoris"
        >
          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
        </motion.button>

        {/* Price tag */}
        <div className="absolute bottom-3 right-3 bg-primary-100/90 backdrop-blur-sm rounded-xl px-3 py-1.5">
            <p className="text-sm font-extrabold text-primary-900 leading-none">
            {p.price.toLocaleString('fr-TN')} {p.currency || 'DT'}
            {p.period && <span className="text-[10px] font-normal text-primary-500">/{p.period}</span>}
          </p>
        </div>

        {/* Badge */}
        {p.badge && (
          <span className={`absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm
                            ${p.badgeColor === 'emerald' ? 'bg-emerald-500/90 text-white' : 'bg-primary-500/90 text-white'}`}>
            {p.badge}
          </span>
        )}

        {!p.available && (
          <div className="absolute inset-0 bg-primary-900/40 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full bg-primary-900/70 text-primary-100 text-xs font-bold backdrop-blur-sm">
              Indisponible
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-semibold text-primary-900 text-sm truncate">{p.title}</h3>
        <div className="flex items-center gap-1 mt-1 mb-3">
          <MapPin className="w-3 h-3 text-primary-400" />
          <span className="text-xs text-primary-500 truncate">{p.location}</span>
        </div>

        {(p.bedrooms || p.bathrooms || p.area) && (
          <div className="flex items-center gap-3 text-xs text-primary-500 mb-3">
            {p.bedrooms != null && (
              <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {p.bedrooms}</span>
            )}
            {p.bathrooms != null && (
              <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms}</span>
            )}
            {p.area != null && (
              <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5" /> {p.area} m²</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-primary-200">
          {p.rating != null && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-primary-800">{p.rating}</span>
              {p.reviewCount != null && (
                <span className="text-[10px] text-primary-400">({p.reviewCount})</span>
              )}
            </div>
          )}
          {p.type && (
            <span className="text-[10px] font-medium text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
              {p.type}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
