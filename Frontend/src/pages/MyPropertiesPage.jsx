import React, { useRef, useState, useEffect } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Map, { Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Plus, Search, MapPin, BedDouble, Bath, Eye, EyeOff,
  Trash2, Edit3, Home, ToggleLeft, ToggleRight, MoreVertical,
  TrendingUp, Building2, Star, Clock, X, Check, DollarSign, Loader2, Image as ImageIcon,
} from 'lucide-react'
import { propertyService } from '../services/propertyService'

const PROPERTY_TYPES = ['Appartement', 'Villa', 'Studio', 'Penthouse', 'Chalet', 'Maison']
const AMENITIES_LIST = [
  'WiFi', 'Parking', 'Piscine', 'Climatisation', 'Cuisine équipée',
  'Sécurité 24/7', 'Ascenseur', 'Jardin', 'Terrasse', 'Vue mer',
  'Cheminée', 'Garage', 'Conciergerie', 'Calme absolu', 'Gardien',
]

export default function MyPropertiesPage({ user }) {
  const navigate = useNavigate()
  const editImageInputRef = useRef(null)
  const [properties, setProperties] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | available | hidden
  const [menuOpen, setMenuOpen] = useState(null)
  const [editing, setEditing] = useState(null) // property being edited
  const [editForm, setEditForm] = useState({})
  const [editImageError, setEditImageError] = useState('')
  const [loading, setLoading] = useState(true)
  const [mapCoords, setMapCoords] = useState({ latitude: 35.17744, longitude: 10.95528 })
  const [showMapPicker, setShowMapPicker] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    propertyService.listMine()
      .then(data => {
        if (!active) return
        const mine = (data.content || []).map(p => ({
          ...p,
          price: p.price ?? p.pricePerNight,
          image: p.image ?? (p.images?.length ? p.images[0] : null),
          currency: p.currency || 'DT',
          period: p.period || 'nuit',
          bedrooms: p.bedrooms ?? p.rooms ?? p.roomCount ?? 0,
          bathrooms: p.bathrooms ?? p.bathroomCount ?? 0,
          area: p.area ?? p.surface ?? p.areaSqm ?? 0,
          available: p.available !== false,
        }))
        setProperties(mine)
      })
      .catch(() => setProperties([]))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  if (!user || (user.role !== 'PROPRIETOR' && user.role !== 'ADMIN')) {
    return <Navigate to="/profile" replace />
  }

  const save = (updated) => {
    setProperties(updated)
  }

  const toggleAvailability = (id) => {
    save(properties.map(p => p.id === id ? { ...p, available: !p.available } : p))
  }

  const deleteProperty = (id) => {
    propertyService.remove(id)
      .then(() => save(properties.filter(p => p.id !== id)))
      .catch(() => {})
    setMenuOpen(null)
  }

  const startEdit = (p) => {
    setEditImageError('')
    setEditForm({
      title: p.title,
      location: p.location,
      description: p.description || '',
      houseRules: p.houseRules || '',
      type: p.type || 'Appartement',
      price: p.price ?? p.pricePerNight ?? '',
      bedrooms: p.bedrooms ?? p.rooms ?? p.roomCount ?? '',
      bathrooms: p.bathrooms ?? p.bathroomCount ?? '',
      area: p.area ?? p.surface ?? p.areaSqm ?? '',
      amenities: p.amenities || [],
      images: Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []),
      latitude: p.latitude || 35.17744,
      longitude: p.longitude || 10.95528,
    })
    setMapCoords({ 
      latitude: p.latitude || 35.17744, 
      longitude: p.longitude || 10.95528 
    })
    setEditing(p.id)
    setMenuOpen(null)
  }

  const saveEdit = () => {
    const updated = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      houseRules: (editForm.houseRules || '').trim(),
      location: editForm.location.trim(),
      pricePerNight: Number(editForm.price),
      type: editForm.type,
      bedrooms: Number(editForm.bedrooms) || 0,
      bathrooms: Number(editForm.bathrooms) || 0,
      area: Number(editForm.area) || 0,
      amenities: editForm.amenities || [],
      images: editForm.images || [],
      latitude: mapCoords.latitude,
      longitude: mapCoords.longitude,
    }
    propertyService.update(editing, updated)
      .then(() => {
        save(properties.map(p => p.id === editing ? {
          ...p,
          ...updated,
          price: updated.pricePerNight,
          image: updated.images?.[0] || null,
        } : p))
      })
      .catch(() => {})
    setEditing(null)
  }

  const ef = (key, val) => setEditForm(p => ({ ...p, [key]: val }))
  const removeEditImage = (index) => {
    setEditForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }))
  }
  const handleEditImageChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const invalidType = files.find((file) => !file.type.startsWith('image/'))
    const tooLarge = files.find((file) => file.size > 3 * 1024 * 1024)
    if (invalidType) {
      setEditImageError('Veuillez sélectionner uniquement des fichiers image valides.')
      event.target.value = ''
      return
    }

    if (tooLarge) {
      setEditImageError('Une ou plusieurs images sont trop volumineuses (max 3 MB chacune).')
      event.target.value = ''
      return
    }

    Promise.all(
      files.map((file) => new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.readAsDataURL(file)
      }))
    ).then((newImages) => {
      setEditImageError('')
      setEditForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...newImages],
      }))
      event.target.value = ''
    })
  }
  const toggleEditAmenity = (a) =>
    ef('amenities', editForm.amenities?.includes(a)
      ? editForm.amenities.filter(x => x !== a)
      : [...(editForm.amenities || []), a])

  const filtered = properties
    .filter(p => {
      if (filter === 'available') return p.available
      if (filter === 'hidden') return !p.available
      return true
    })
    .filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
    )

  const totalRevenue = properties.reduce((s, p) => s + p.price, 0)
  const activeCount = properties.filter(p => p.available).length

  return (
    <div className="pt-28 pb-16 min-h-screen bg-primary-50/40">
      <div className="max-w-6xl mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-500" />
              Mes Propriétés
            </h1>
            <p className="text-primary-500 text-sm mt-1">Gérez vos annonces et leur visibilité</p>
          </div>
          <Link
            to="/add-property"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 text-white font-semibold
                       hover:bg-primary-600 transition shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            Nouvelle annonce
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Home, label: 'Total', value: properties.length, color: 'text-primary-500' },
            { icon: Eye, label: 'Actives', value: activeCount, color: 'text-emerald-500' },
            { icon: EyeOff, label: 'Masquées', value: properties.length - activeCount, color: 'text-orange-500' },
            { icon: TrendingUp, label: 'Revenus / mois', value: `${totalRevenue.toLocaleString('fr-TN')} DT`, color: 'text-primary-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-primary-100">
              <Icon className={`w-5 h-5 ${color} mb-1`} />
              <p className="text-2xl font-bold text-primary-900">{value}</p>
              <p className="text-xs text-primary-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'available', label: 'Actives' },
              { key: 'hidden', label: 'Masquées' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition border
                  ${filter === f.key
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'border-primary-200 text-primary-600 hover:bg-primary-50'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary-200 focus:border-primary-400
                         focus:ring-2 focus:ring-primary-200 outline-none transition text-sm text-primary-900"
            />
          </div>
        </div>

        {/* Property cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-12 h-12 text-primary-200 mx-auto mb-3" />
            <p className="text-primary-500 font-medium">Aucune propriété trouvée</p>
            <Link to="/add-property" className="text-primary-500 text-sm hover:underline mt-1 inline-block">
              + Ajouter votre première propriété
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-white rounded-2xl shadow-sm border border-primary-100 overflow-visible
                              flex flex-col sm:flex-row ${!p.available ? 'opacity-70' : ''}`}
                >
                  {/* Image */}
                  <div className="sm:w-56 h-40 sm:h-auto relative shrink-0">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover rounded-t-2xl sm:rounded-l-2xl sm:rounded-tr-none" />
                    {p.badge && (
                      <span className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-lg text-xs font-bold text-white
                        ${p.badgeColor === 'emerald' ? 'bg-emerald-500' : 'bg-primary-500'}`}>
                        {p.badge}
                      </span>
                    )}
                    {!p.available && (
                      <div className="absolute inset-0 bg-primary-900/30 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-lg bg-primary-900/70 text-white text-xs font-bold">Masquée</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-primary-900 line-clamp-1">{p.title}</h3>
                          <p className="text-primary-500 text-sm flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5" /> {p.location}
                          </p>
                        </div>
                        {/* Actions */}
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                            className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-400 transition"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {menuOpen === p.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-lg border border-primary-100 py-1 z-30"
                              >
                                <button
                                  onClick={() => startEdit(p)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                                >
                                  <Edit3 className="w-4 h-4" />
                                  Modifier
                                </button>
                                <button
                                  onClick={() => { toggleAvailability(p.id); setMenuOpen(null) }}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-primary-700 hover:bg-primary-50"
                                >
                                  {p.available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  {p.available ? 'Masquer' : 'Rendre visible'}
                                </button>
                                <button
                                  onClick={() => deleteProperty(p.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Supprimer
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-xs text-primary-500">
                        <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {p.bedrooms} ch.</span>
                        <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {p.bathrooms} sdb.</span>
                        <span>{p.area} m²</span>
                        {p.rating > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {p.rating} ({p.reviewCount})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-primary-900 font-bold">
                        {p.price.toLocaleString('fr-TN')} DT
                        <span className="text-primary-400 font-normal text-sm"> / {p.period || 'mois'}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleAvailability(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
                            ${p.available
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-orange-50 text-orange-600'}`}
                        >
                          {p.available
                            ? <><ToggleRight className="w-4 h-4" /> Active</>
                            : <><ToggleLeft className="w-4 h-4" /> Masquée</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Edit Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white/90 backdrop-blur-md z-10 px-6 py-4 border-b border-primary-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary-500" />
                  Modifier la propriété
                </h2>
                <button onClick={() => setEditing(null)} className="p-2 rounded-xl hover:bg-primary-50 text-primary-400 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-primary-700 mb-1">Titre *</label>
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={e => ef('title', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-primary-700 mb-1">Localisation *</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400 z-10" />
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={e => ef('location', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-xl hover:bg-primary-100 transition"
                    >
                      {showMapPicker ? '▼ Masquer la carte' : '▶ Choisir sur la carte'}
                    </button>
                    {showMapPicker && (
                      <div className="rounded-xl overflow-hidden border border-primary-200 h-64">
                        <Map
                          initialViewState={{
                            longitude: mapCoords.longitude,
                            latitude: mapCoords.latitude,
                            zoom: 12,
                          }}
                          style={{ width: '100%', height: '100%' }}
                          mapStyle="https://api.maptiler.com/maps/019d7cf7-51a0-7f23-b2b3-eb3785692ca9/style.json?key=eOof1Hy8rLq0QdXVjQRl"
                          onClick={(e) => {
                            setMapCoords({
                              latitude: e.lngLat.lat,
                              longitude: e.lngLat.lng,
                            })
                          }}
                        >
                          <Marker
                            longitude={mapCoords.longitude}
                            latitude={mapCoords.latitude}
                            anchor="bottom"
                            color="#B8622A"
                          />
                        </Map>
                      </div>
                    )}
                    <p className="text-xs text-primary-500">
                      Latitude: {mapCoords.latitude.toFixed(5)} | Longitude: {mapCoords.longitude.toFixed(5)}
                    </p>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-primary-700 mb-1">Type de bien</label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => ef('type', t)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition border
                          ${editForm.type === t
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-primary-200 text-primary-600 hover:bg-primary-50'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-primary-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => ef('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary-700 mb-1">Règles de la maison</label>
                  <textarea
                    value={editForm.houseRules || ''}
                    onChange={e => ef('houseRules', e.target.value)}
                    rows={3}
                    placeholder="Ex : Arrivée après 15h, pas de fête, non fumeur..."
                    className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900 resize-none"
                  />
                </div>

                {/* Numbers grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary-700 mb-1">Prix / mois (DT)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400" />
                      <input type="number" min={1} value={editForm.price ?? ''} onChange={e => ef('price', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-700 mb-1">Surface (m²)</label>
                    <input type="number" min={1} value={editForm.area ?? ''} onChange={e => ef('area', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-700 mb-1">Chambres</label>
                    <div className="flex items-center gap-2">
                      <BedDouble className="w-4 h-4 text-primary-400" />
                      <input type="number" min={1} max={20} value={editForm.bedrooms ?? ''} onChange={e => ef('bedrooms', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-700 mb-1">Salles de bain</label>
                    <div className="flex items-center gap-2">
                      <Bath className="w-4 h-4 text-primary-400" />
                      <input type="number" min={1} max={10} value={editForm.bathrooms ?? ''} onChange={e => ef('bathrooms', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none transition text-primary-900" />
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-primary-700">Photos</label>
                    <input
                      ref={editImageInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEditImageChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => editImageInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter des photos
                    </button>
                  </div>

                  {editForm.images?.length ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {editForm.images.map((src, index) => (
                        <div key={`${src}-${index}`} className="relative overflow-hidden rounded-xl border border-primary-100 bg-primary-50">
                          <img src={src} alt={`property-${index + 1}`} className="h-24 w-full object-cover" />
                          <button
                            onClick={() => removeEditImage(index)}
                            className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1 text-red-500 shadow hover:bg-white"
                            aria-label="Supprimer la photo"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/50 p-4 text-sm text-primary-500 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Aucune photo. Ajoutez au moins une image pour mieux présenter votre bien.
                    </div>
                  )}

                  {editImageError && (
                    <p className="mt-2 text-xs font-medium text-red-600">{editImageError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary-700 mb-2">Équipements</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES_LIST.map(a => (
                      <button
                        key={a}
                        onClick={() => toggleEditAmenity(a)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border
                          ${editForm.amenities?.includes(a)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'border-primary-200 text-primary-600 hover:bg-primary-50'}`}
                      >
                        {editForm.amenities?.includes(a) && <Check className="inline w-3 h-3 mr-1" />}
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="sticky bottom-0 bg-white/90 backdrop-blur-md z-10 px-6 py-4 border-t border-primary-100 flex justify-end gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-5 py-2.5 rounded-xl border-2 border-primary-200 text-primary-700 font-semibold hover:bg-primary-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editForm.title?.trim() || !editForm.location?.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition
                             disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
