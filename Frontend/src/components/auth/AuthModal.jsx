import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import AuthLoader from './LoginLoader'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://maskan-xzpw.onrender.com').replace(/\/$/, '')
const AUTH_TOKEN_KEY = 'authToken'
const USER_STORAGE_KEY = 'user'
const ROLE_STORAGE_KEY = 'userRole'
const HOUSE_IMAGE_URL =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80'
const HOUSE_IMAGE_ALT_URL =
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
const HOUSE_IMAGE_THIRD_URL =
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'
const BIRTH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const BIRTH_DAYS = Array.from({ length: 31 }, (_, index) => String(index + 1))
const CURRENT_YEAR = new Date().getFullYear()
const BIRTH_YEARS = Array.from({ length: 100 }, (_, index) => String(CURRENT_YEAR - index))
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TUNISIAN_PHONE_REGEX = /^(?:\+216)?[2-5]\d{7}$/

const normalizeTunisianPhone = (value) => {
  const stripped = value.replace(/\s+/g, '')
  return stripped.startsWith('+216') ? stripped : `+216${stripped}`
}

const formVariants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: 'easeOut',
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' } },
}

const fieldVariants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

const mapRole = (role) => {
  if (role === 'HOST') return 'PROPRIETOR'
  if (role === 'GUEST') return 'TENANT'
  if (role === 'PROPRIETAIRE') return 'PROPRIETOR'
  return role || 'TENANT'
}

const normalizeUser = (user, roleOverride) => ({
  id: user?.id,
  name: user?.fullName || user?.name || 'User',
  email: user?.email,
  role: mapRole(roleOverride || user?.role),
  username: user?.username || '',
  bio: user?.bio || '',
  avatar: user?.avatar || '',
  emailVerified: Boolean(user?.emailVerified),
  phoneVerified: Boolean(user?.phoneVerified),
  identityStatus: user?.identityStatus || 'not_verified',
  verificationLevel: user?.verificationLevel,
  rejectionReason: user?.rejectionReason,
})

const persistSession = (payload) => {
  if (payload?.token) {
    localStorage.setItem(AUTH_TOKEN_KEY, payload.token)
  }
  if (payload?.user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(payload.user))
  }
  if (payload?.role || payload?.user?.role) {
    localStorage.setItem(ROLE_STORAGE_KEY, mapRole(payload.role || payload.user.role))
  }
}

const getApiErrorMessage = (payload, fallbackMessage) => {
  if (!payload || typeof payload !== 'object') {
    return fallbackMessage
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const firstError = Object.values(payload.errors).find(
      (value) => typeof value === 'string' && value.trim(),
    )
    if (firstError) {
      return firstError
    }
  }

  return fallbackMessage
}

function LoginSplash() {
  const logoPath = 'M1124.07,46.9C1037.1,16.52,943.78,0,846.79,0,381.05,0,0,381.05,0,846.78v2960.97c0,465.74,381.05,846.79,846.79,846.79s846.79-381.05,846.79-846.79v-990.99c-329.04-87.01-594.49-323.02-722.95-636.9,23.9,140.28,77.12,270.65,153.45,384.36v1243.53c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28V846.78c0-152.5,124.77-277.28,277.28-277.28s276.46,123.96,277.28,275.78c0,.5,0,1,0,1.5v926.84c1.13,367.62,239.65,682.06,569.51,797.27,86.97,30.37,180.29,46.9,277.28,46.9s190.31-16.52,277.28-46.9c329.86-115.21,568.38-429.65,569.51-797.27v-926.84c0-.5,0-1,0-1.5.81-151.82,125.27-275.78,277.27-275.78s277.28,124.77,277.28,277.28v2960.97c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28v-1243.53c76.33-113.71,129.55-244.08,153.45-384.36-128.47,313.88-393.92,549.89-722.95,636.9v990.99c0,465.74,381.05,846.79,846.78,846.79s846.79-381.05,846.79-846.79V846.78C3941.71,381.05,3560.66,0,3094.92,0c-96.99,0-190.31,16.52-277.28,46.9-330.65,115.48-569.51,431.14-569.51,799.88v924.22c0,152.5-124.77,277.28-277.28,277.28s-277.28-124.77-277.28-277.28v-924.22c0-368.74-238.87-684.4-569.51-799.88'

  return (
    <div className="login-loader" role="status" aria-live="polite" aria-label="Loading authentication">
      <svg className="login-loader__logo" viewBox="0 0 3941.71 4654.54" aria-label="Maskan logo">
        <defs>
          <linearGradient id="login-loader-gradient" x1="0" y1="2327.27" x2="3941.71" y2="2327.27" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f7d9b0" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>
        </defs>
        <path className="login-loader__logo-outline" d={logoPath} pathLength="1" />
        <path className="login-loader__logo-fill" d={logoPath} fill="url(#login-loader-gradient)" />
      </svg>
    </div>
  )
}

export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState(initialMode === 'register' ? 'register' : 'login')
  const [loading, setLoading] = useState(false)
  const [loginSplash, setLoginSplash] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    gender: '',
  })

  const title = useMemo(() => (mode === 'login' ? 'Sign in' : 'Create account'), [mode])

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleLogin = async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      }),
    })

    if (!response.ok) {
      let errorPayload = null
      try {
        errorPayload = await response.json()
      } catch {
        errorPayload = null
      }

      if (errorPayload?.error === 'ACCOUNT_BANNED') {
        throw new Error(errorPayload.message || 'Votre compte est bloqué ou l’accès est interdit.')
      }

      throw new Error(getApiErrorMessage(errorPayload, 'Invalid credentials'))
    }

    const payload = await response.json()
    persistSession(payload)
    onSuccess?.(normalizeUser(payload.user, payload.role))
    onClose?.()
  }

  const handleRegister = async () => {
    const email = form.email.trim().toLowerCase()
    const fullName = `${form.firstName} ${form.lastName}`.trim()
    const phone = normalizeTunisianPhone(form.phone.trim())

    if (!EMAIL_REGEX.test(email)) {
      throw new Error('Please enter a valid email address')
    }

    if (!TUNISIAN_PHONE_REGEX.test(phone)) {
      throw new Error('Please enter a valid Tunisian phone number (e.g., +216 20 123 456, +21620123456, 20 123 456, or 20123456)')
    }

    if (form.password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    if (form.password !== form.confirmPassword) {
      throw new Error('Passwords do not match')
    }

    if (fullName.length < 3) {
      throw new Error('Please enter your full name')
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        password: form.password,
        role: 'GUEST',
      }),
    })

    if (!response.ok) {
      let errorPayload = null
      try {
        errorPayload = await response.json()
      } catch {
        errorPayload = null
      }
      throw new Error(getApiErrorMessage(errorPayload, 'Registration failed'))
    }

    const payload = await response.json()
    if (payload?.token && payload?.user) {
      persistSession(payload)
      onSuccess?.(normalizeUser(payload.user, payload.role))
      onClose?.()
      return
    }

    setMode('login')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    setLoading(true)

    try {
      setLoginSplash(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (mode === 'login') {
        await handleLogin()
      } else {
        await handleRegister()
      }
    } catch (error) {
      setSubmitError(error?.message || 'Authentication failed')
    } finally {
      setLoginSplash(false)
      setLoading(false)
    }
  }

  if (loginSplash) {
    return <LoginSplash />
  }

  return (
    <AnimatePresence>
        {loading && <AuthLoader />}
        {!loading && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-primary-900/65 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-primary-100/15 bg-primary-50 shadow-2xl lg:grid-cols-2"
          initial={{ y: 26, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <section className="relative hidden min-h-[560px] overflow-hidden lg:block">
            <img src={HOUSE_IMAGE_URL} alt="Modern family home exterior" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-950/90 via-primary-950/40 to-primary-700/10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(184,98,42,0.22),_transparent_32%)]" />

            <motion.div
              className="absolute left-7 top-7 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-primary-50 backdrop-blur-md"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-primary-100/75">Maskan Homes</p>
            </motion.div>

            <div className="absolute bottom-7 left-7 right-7 grid gap-4">
              <div className="grid grid-cols-[1.25fr_0.85fr] gap-4">
                <div className="overflow-hidden rounded-[28px] border border-white/15 shadow-2xl">
                  <img src={HOUSE_IMAGE_ALT_URL} alt="Bright living room interior" className="h-56 w-full object-cover" />
                </div>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[28px] border border-white/15 shadow-2xl">
                    <img src={HOUSE_IMAGE_THIRD_URL} alt="Elegant modern apartment" className="h-[6.5rem] w-full object-cover" />
                  </div>
                  <div className="rounded-[28px] border border-white/15 bg-white/12 p-4 text-primary-50 backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.18em] text-primary-100/75">Verified homes</p>
                    <p className="mt-2 text-lg font-semibold leading-tight">Move into places that feel warm, calm, and ready.</p>
                  </div>
                </div>
              </div>

              <div className="max-w-lg rounded-[28px] border border-white/15 bg-primary-950/35 p-5 text-primary-50 backdrop-blur-md">
                <p className="text-3xl font-bold leading-tight">
                  {mode === 'login' ? 'Welcome back to your next home.' : 'Create your account and start your home search.'}
                </p>
                <p className="mt-3 text-sm text-primary-100/90">
                  {mode === 'login'
                    ? 'Sign in to manage bookings, favorites, and your rental journey.'
                    : 'Join Maskan to browse beautiful homes, save listings, and connect with hosts.'}
                </p>
              </div>
            </div>
          </section>

          <section className="relative p-6 sm:p-8 lg:p-10">
            <div className="mb-5 grid grid-cols-3 gap-2 lg:hidden">
              <img src={HOUSE_IMAGE_URL} alt="House exterior" className="h-24 w-full rounded-2xl object-cover shadow-md" />
              <img src={HOUSE_IMAGE_ALT_URL} alt="Living room" className="h-24 w-full rounded-2xl object-cover shadow-md" />
              <img src={HOUSE_IMAGE_THIRD_URL} alt="Apartment view" className="h-24 w-full rounded-2xl object-cover shadow-md" />
            </div>

            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-500">Welcome</p>
                <h2 className="mt-1 text-2xl font-bold text-primary-900">{title}</h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-primary-200 bg-primary-50 p-2 text-primary-700 transition hover:-translate-y-0.5 hover:bg-primary-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-6 max-w-md text-sm leading-6 text-primary-700">
              {mode === 'login'
                ? 'Sign in to continue your booking flow, manage saved properties, and review host messages.'
                : 'Create your account to explore modern homes, save favorites, and get matched faster.'}
            </p>

            <div className="mb-6 inline-flex rounded-xl bg-primary-100/70 p-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === 'login' ? 'bg-primary-600 text-primary-50 shadow-md' : 'text-primary-700 hover:text-primary-900'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === 'register' ? 'bg-primary-600 text-primary-50 shadow-md' : 'text-primary-700 hover:text-primary-900'
                }`}
              >
                Sign up
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                className="space-y-3"
                onSubmit={handleSubmit}
                variants={formVariants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                {mode === 'register' && (
                  <motion.div variants={fieldVariants} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={updateField('firstName')}
                      placeholder="First name"
                      className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      required
                    />
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={updateField('lastName')}
                      placeholder="Last name"
                      className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      required
                    />
                  </motion.div>
                )}

                <motion.input
                  variants={fieldVariants}
                  type="email"
                  value={form.email}
                  onChange={updateField('email')}
                  placeholder={mode === 'register' ? 'Email address' : 'Email'}
                  autoComplete="email"
                  className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  required
                />

                {mode === 'register' && (
                  <motion.input
                    variants={fieldVariants}
                    type="tel"
                    value={form.phone}
                    onChange={updateField('phone')}
                    placeholder="Tunisian phone (e.g., +216 20 123 456)"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    required
                  />
                )}

                <motion.input
                  variants={fieldVariants}
                  type="password"
                  value={form.password}
                  onChange={updateField('password')}
                  placeholder={mode === 'register' ? 'Password' : 'Password'}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  required
                />

                {mode === 'login' && (
                  <motion.button
                    variants={fieldVariants}
                    type="button"
                    onClick={() => {
                      onClose?.()
                      navigate('/forgot-password')
                    }}
                    className="text-xs font-semibold text-primary-600 transition hover:text-primary-700 hover:underline"
                  >
                    Forgot password?
                  </motion.button>
                )}

                {mode === 'register' && (
                  <motion.input
                    variants={fieldVariants}
                    type="password"
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    required
                  />
                )}

                {mode === 'register' && (
                  <>
                    <motion.label variants={fieldVariants} className="mb-0.5 block text-sm font-medium text-primary-700">
                      Birthday
                    </motion.label>
                    <motion.div variants={fieldVariants} className="grid grid-cols-3 gap-2">
                      <select
                        value={form.birthMonth}
                        onChange={updateField('birthMonth')}
                        className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        required
                      >
                        <option value="">Month</option>
                        {BIRTH_MONTHS.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <select
                        value={form.birthDay}
                        onChange={updateField('birthDay')}
                        className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        required
                      >
                        <option value="">Day</option>
                        {BIRTH_DAYS.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <select
                        value={form.birthYear}
                        onChange={updateField('birthYear')}
                        className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3.5 py-2.5 text-sm text-primary-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        required
                      >
                        <option value="">Year</option>
                        {BIRTH_YEARS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </motion.div>

                    <motion.label variants={fieldVariants} className="mb-0.5 block text-sm font-medium text-primary-700">
                      Gender
                    </motion.label>
                    <motion.div variants={fieldVariants} className="grid grid-cols-2 gap-2">
                      {['Female', 'Male'].map((option) => (
                        <label
                          key={option}
                          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                            form.gender === option
                              ? 'border-primary-500 bg-primary-100 text-primary-900'
                              : 'border-primary-200 bg-primary-50 text-primary-700 hover:border-primary-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={option}
                            checked={form.gender === option}
                            onChange={updateField('gender')}
                            className="h-4 w-4 accent-primary-600"
                            required
                          />
                          {option}
                        </label>
                      ))}
                    </motion.div>
                  </>
                )}

                {submitError && <p className="pt-1 text-xs font-medium text-red-600">{submitError}</p>}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  animate={!loading ? { y: [0, -1.2, 0] } : { y: 0 }}
                  transition={!loading ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                  className="mt-2 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-primary-50 shadow-lg shadow-primary-600/25 transition hover:bg-primary-700 disabled:opacity-60"
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
                </motion.button>
              </motion.form>
            </AnimatePresence>

            <button
              type="button"
              onClick={() => {
                setSubmitError('')
                setMode((prev) => (prev === 'login' ? 'register' : 'login'))
              }}
              className="mt-4 text-xs font-semibold text-primary-700 transition hover:text-primary-900 hover:underline"
            >
              {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
            </button>
          </section>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}