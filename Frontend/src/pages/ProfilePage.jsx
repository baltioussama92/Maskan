import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, X, Loader2 } from 'lucide-react'
import PortfolioHeader from '../components/profile/PortfolioHeader'
import RoleSwitcher from '../components/profile/RoleSwitcher'
import GuestView from '../components/profile/GuestView'
import HostView from '../components/profile/HostView'
import ProfileSettings from '../components/profile/ProfileSettings'
import { bookingService } from '../services/bookingService'
import { wishlistService } from '../services/wishlistService'
import { propertyService } from '../services/propertyService'
import { reviewService } from '../services/reviewService'

const USER_STORAGE_KEY = 'user'
const AUTH_TOKEN_KEY = 'authToken'
const ROLE_STORAGE_KEY = 'userRole'
const DISPLAY_ROLE_KEY = 'displayRole'
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const MAX_AVATAR_SIZE = 320

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read selected image'))
    reader.readAsDataURL(file)
  })
}

async function compressAvatar(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.')
  }

  const sourceDataUrl = await fileToDataUrl(file)
  const img = new Image()

  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = () => reject(new Error('Selected image could not be loaded.'))
    img.src = sourceDataUrl
  })

  const scale = Math.min(MAX_AVATAR_SIZE / img.width, MAX_AVATAR_SIZE / img.height, 1)
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to process selected image.')
  }

  context.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

function EditProfileModal({ user, onSave, onCancel, onUserUpdate }) {
  const fileInputRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [form, setForm] = useState({
    name: user?.name || user?.fullName || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    city: user?.city || '',
    avatar: user?.avatar || '',
  })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    compressAvatar(file)
      .then((compressedAvatar) => {
        setSaveError('')
        setAvatarPreview(compressedAvatar)
        setForm((prev) => ({ ...prev, avatar: compressedAvatar }))
      })
      .catch((error) => {
        setSaveError(error?.message || 'Unable to update profile picture.')
      })
  }

  const handleSave = async () => {
    setSaveError('')
    setSaving(true)

    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setSaveError('Session expired. Please sign in again.')
      setSaving(false)
      return
    }

    const updatedUser = {
      ...user,
      name: form.name.trim() || user.name,
      fullName: form.name.trim() || user.fullName,
      username: form.username.trim(),
      email: form.email.trim() || user.email,
      phone: form.phone.trim(),
      bio: form.bio.trim(),
      city: form.city.trim(),
      avatar: form.avatar,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: updatedUser.name,
          username: updatedUser.username,
          phone: updatedUser.phone,
          bio: updatedUser.bio,
          city: updatedUser.city,
          avatar: updatedUser.avatar || '',
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Unable to save profile.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          // Fall back to text if JSON parsing fails
          const textError = await response.text()
          errorMessage = textError || errorMessage
        }
        throw new Error(errorMessage)
      }

      const backendUser = await response.json()
      const mergedUser = {
        ...updatedUser,
        name: backendUser?.fullName || backendUser?.name || updatedUser.name,
        avatar: backendUser?.avatar ?? updatedUser.avatar,
      }

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mergedUser))
      onUserUpdate?.(mergedUser)

      setSaved(true)
      setTimeout(() => onSave?.(), 800)
    } catch (error) {
      console.error('Profile update error:', error)
      setSaveError(error?.message || 'Could not save profile.')
    } finally {
      setSaving(false)
    }
  }

  const displayAvatar = avatarPreview || form.avatar || user?.avatar

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Profile</h2>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              {displayAvatar ? (
                <img src={displayAvatar} alt={form.name} className="w-28 h-28 rounded-2xl object-cover ring-4 ring-slate-200 shadow-lg" />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 ring-4 ring-slate-200 shadow-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{form.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-4">
            <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" className="w-full px-4 py-2 rounded-lg border border-slate-200" />
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className="w-full px-4 py-2 rounded-lg border border-slate-200" />
            <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="Username" className="w-full px-4 py-2 rounded-lg border border-slate-200" />
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" className="w-full px-4 py-2 rounded-lg border border-slate-200" />
            <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-full px-4 py-2 rounded-lg border border-slate-200" />
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Tell us about yourself..." className="w-full px-4 py-2 rounded-lg border border-slate-200 resize-none" />
          </div>

          {saveError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>}
          {saved && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Profile updated successfully!
            </motion.div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <button onClick={onCancel} className="flex-1 py-2 px-4 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <motion.button whileHover={!saving ? { scale: 1.02 } : {}} whileTap={!saving ? { scale: 0.98 } : {}} onClick={handleSave} disabled={saving} className="flex-1 py-2 px-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg font-semibold text-white disabled:opacity-70 flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Check className="w-4 h-4" />Save</>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function ProfilePage({ user, onUserUpdate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [displayRole, setDisplayRole] = useState(() => localStorage.getItem(DISPLAY_ROLE_KEY) || 'GUEST')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const [guestBookings, setGuestBookings] = useState([])
  const [guestReviews, setGuestReviews] = useState([])
  const [wishlist, setWishlist] = useState([])

  const [hostStats, setHostStats] = useState({
    totalListings: 0,
    totalBookings: 0,
    responseRate: 0,
    acceptanceRate: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    averageRating: 0,
  })
  const [hostListings, setHostListings] = useState([])
  const [hostEarnings, setHostEarnings] = useState([])
  const [hostReviews, setHostReviews] = useState([])

  if (!user) {
    return <Navigate to="/" replace />
  }

  const isHost = user?.role === 'PROPRIETOR' || user?.role === 'HOST'

  useEffect(() => {
    let active = true

    const mapGuestBooking = (booking) => {
      const now = new Date()
      const checkIn = booking.checkInDate
      const checkOut = booking.checkOutDate
      const start = checkIn ? new Date(checkIn) : now
      const end = checkOut ? new Date(checkOut) : now
      const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      const rawStatus = String(booking.status || '').toUpperCase()
      const status = rawStatus === 'CANCELLED' || rawStatus === 'REJECTED' ? 'cancelled' : end <= now ? 'completed' : 'upcoming'

      return {
        id: booking.id,
        propertyTitle: booking.listingTitle || `Listing #${booking.listingId}`,
        location: booking.listingLocation || 'Unknown location',
        propertyImage: booking.listingImage,
        checkIn,
        checkOut,
        status,
        totalPrice: booking.totalPrice || 0,
        nights,
      }
    }

    const loadGuestData = async () => {
      const [bookingsPage, savedWishlist] = await Promise.all([bookingService.getMine(), wishlistService.list()])
      if (!active) return

      const bookings = bookingsPage.content || []
      setGuestBookings(bookings.map(mapGuestBooking))
      setWishlist(savedWishlist.map((property) => ({
        id: property.id,
        title: property.title,
        location: property.location,
        price: property.pricePerNight || property.price || 0,
        image: property.images?.[0] || property.image,
        rating: property.rating || 0,
      })))

      const completed = bookings.filter((booking) => ['COMPLETED', 'CONFIRMED', 'PAID_AWAITING_CHECKIN'].includes(String(booking.status || '').toUpperCase()))
      const reviewCollections = await Promise.all(completed.slice(0, 10).map((booking) => reviewService.listByProperty(booking.listingId)))
      if (!active) return

      setGuestReviews(reviewCollections.flatMap((collection) =>
        collection
          .filter((review) => String(review.guestId) === String(user?.id))
          .map((review) => ({
            hostName: `Host #${review.authorId || 'unknown'}`,
            date: review.createdAt,
            rating: review.rating,
            comment: review.comment || '',
          }))
      ))
    }

    const loadHostData = async () => {
      const [listingsPage, ownerBookingsPage] = await Promise.all([propertyService.listMine(), bookingService.getOwnerBookings()])
      if (!active) return

      const listings = listingsPage.content || []
      const ownerBookings = ownerBookingsPage.content || []

      setHostListings(listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        location: listing.location,
        price: listing.pricePerNight || listing.price || 0,
        image: listing.images?.[0] || listing.image,
        status: listing.pendingApproval ? 'pending' : 'active',
        views: 0,
        bookings: ownerBookings.filter((booking) => String(booking.listingId) === String(listing.id)).length,
        rating: listing.rating || 0,
      })))

      const completed = ownerBookings.filter((booking) => String(booking.status || '').toUpperCase() === 'COMPLETED')
      const totalEarnings = completed.reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0)
      const month = new Date().toISOString().slice(0, 7)
      const monthlyEarnings = completed
        .filter((booking) => String(booking.createdAt || '').slice(0, 7) === month)
        .reduce((sum, booking) => sum + Number(booking.totalPrice || 0), 0)

      setHostEarnings(completed.slice(0, 20).map((booking, index) => ({
        id: index + 1,
        bookingTitle: booking.listingTitle || `Booking #${booking.id}`,
        date: booking.createdAt || booking.checkOutDate || booking.checkInDate,
        amount: Number(booking.totalPrice || 0),
      })))

      const reviewCollections = await Promise.all(listings.slice(0, 10).map((listing) => reviewService.listByProperty(listing.id)))
      if (!active) return

      const mappedHostReviews = reviewCollections.flatMap((collection) =>
        collection.map((review) => ({
          id: review.id,
          guestName: `Guest #${review.guestId}`,
          propertyTitle: listings.find((listing) => String(listing.id) === String(review.listingId))?.title || `Listing #${review.listingId}`,
          date: review.createdAt,
          rating: review.rating,
          comment: review.comment || '',
        }))
      )

      setHostReviews(mappedHostReviews)
      setHostStats({
        totalListings: listings.length,
        totalBookings: ownerBookings.length,
        responseRate: 0,
        acceptanceRate: 0,
        totalEarnings,
        monthlyEarnings,
        averageRating: mappedHostReviews.length > 0
          ? Number((mappedHostReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / mappedHostReviews.length).toFixed(1))
          : 0,
      })
    }

    Promise.all([loadGuestData(), isHost ? loadHostData() : Promise.resolve()]).catch(() => {
      // Keep empty states on API failures
    })

    return () => {
      active = false
    }
  }, [isHost, user?.id])

  const handleRoleChange = (role) => {
    setDisplayRole(role)
    localStorage.setItem(DISPLAY_ROLE_KEY, role)
  }

  const handleSettingClick = (action) => {
    if (action === 'edit_profile') {
      setIsEditModalOpen(true)
      return
    }

    if (action === 'logout') {
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(ROLE_STORAGE_KEY)
      localStorage.removeItem(DISPLAY_ROLE_KEY)
      navigate('/')
    }
  }

  const trustScore = Math.min(100,
    50
    + (user?.emailVerified ? 15 : 0)
    + (user?.phoneVerified ? 15 : 0)
    + (user?.identityStatus === 'approved' ? 20 : 0)
  )

  const totalStaysCompleted = guestBookings.filter((booking) => booking.status === 'completed').length

  return (
    <section className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <PortfolioHeader
          user={user}
          role={displayRole}
          onEdit={() => setIsEditModalOpen(true)}
          onBecomeHost={!isHost ? () => navigate('/host-verification') : null}
          totalStaysCompleted={totalStaysCompleted}
          trustScore={trustScore}
          isSuperHost={isHost && hostStats.totalEarnings > 5000}
          memberSince={user?.createdAt}
          reviewCount={displayRole === 'GUEST' ? guestReviews.length : hostReviews.length}
        />

        <div className="mt-6">
          <RoleSwitcher
            currentRole={displayRole}
            isHost={isHost}
            onRoleChange={handleRoleChange}
            onBecomeHost={() => navigate('/host-verification')}
          />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {displayRole === 'GUEST' ? (
              <GuestView user={user} bookings={guestBookings} reviews={guestReviews} wishlist={wishlist} />
            ) : (
              <HostView user={user} stats={hostStats} listings={hostListings} earnings={hostEarnings} reviews={hostReviews} onAddListing={() => navigate('/add-property')} />
            )}
          </div>

          <ProfileSettings onSettingClick={handleSettingClick} isOpen />
        </div>
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            user={user}
            onSave={() => setIsEditModalOpen(false)}
            onCancel={() => setIsEditModalOpen(false)}
            onUserUpdate={onUserUpdate}
          />
        )}
      </AnimatePresence>
    </section>
  )
}
