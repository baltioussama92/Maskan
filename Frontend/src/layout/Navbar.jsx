import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Compass, Heart, MessageSquare,
  Bell, ChevronDown, LogOut, Settings, User, Building2, Menu, X,
  Plus, CalendarCheck,
  Globe,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import NotificationBell from '../components/NotificationBell'

// -- Nav Link definitions -------------------------------------
const DEFAULT_NAV_LINKS = [
  { to: '/',         labelKey: 'nav.home',    icon: Home    },
  { to: '/explorer', labelKey: 'nav.explore', icon: Compass },
]

const getUserNavLinks = (isHost) => [
  ...DEFAULT_NAV_LINKS,
  { to: isHost ? '/host-bookings' : '/bookings', labelKey: 'nav.bookings', icon: CalendarCheck },
  { to: '/messages', labelKey: 'nav.messages', icon: MessageSquare },
]

const ADMIN_NAV_LINKS = [
  { to: '/admin/dashboard', labelKey: 'nav.dashboard',       icon: Home },
  { to: '/admin/users',     labelKey: 'nav.usersManagement', icon: User },
  { to: '/admin/reports',   labelKey: 'nav.reports',         icon: Bell },
]

// -- User dropdown items (tenant) -----------------------------
const TENANT_DROPDOWN = [
  { labelKey: 'nav.myProfile', icon: User,     to: '/profile' },
  { labelKey: 'nav.favorites', icon: Heart,    to: '/favorites' },
  { labelKey: 'nav.settings',  icon: Settings, to: '/settings' },
]

// -- Host dropdown items (proprietor) -------------------------
const HOST_DROPDOWN = [
  { labelKey: 'nav.myProfile',   icon: User,      to: '/profile' },
  { labelKey: 'nav.myProperties', icon: Building2, to: '/my-properties' },
  { labelKey: 'nav.addProperty',  icon: Plus,      to: '/add-property' },
  { labelKey: 'nav.settings',     icon: Settings,  to: '/settings' },
]

// -- Admin dropdown items -------------------------------------
const ADMIN_DROPDOWN = [
  { labelKey: 'nav.dashboard',      icon: Building2,     to: '/admin/dashboard' },
  { labelKey: 'nav.usersManagement', icon: User,          to: '/admin/users' },
  { labelKey: 'nav.listings',       icon: Building2,     to: '/admin/listings' },
  { labelKey: 'nav.bookingsAdmin',  icon: CalendarCheck, to: '/admin/bookings' },
  { labelKey: 'nav.payments',       icon: Compass,       to: '/admin/payments' },
  { labelKey: 'nav.reports',        icon: Bell,          to: '/admin/reports' },
  { labelKey: 'nav.settings',       icon: Settings,      to: '/admin/settings' },
]

export default function Navbar({ user = null, onAuthClick, onLogout }) {
  const [scrolled,       setScrolled]       = useState(false)
  const [dropdownOpen,   setDropdownOpen]   = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const dropdownRef = useRef(null)
  const languageRef = useRef(null)
  const location    = useLocation()
  const { language, setLanguage, languageOptions, t } = useLanguage()

  const isAdmin = user?.role === 'ADMIN'
  const isHost = user?.role === 'PROPRIETOR'
  const NAV_LINKS = isAdmin ? ADMIN_NAV_LINKS : user ? getUserNavLinks(isHost) : DEFAULT_NAV_LINKS
  const DROPDOWN_ITEMS = isAdmin ? ADMIN_DROPDOWN : isHost ? HOST_DROPDOWN : TENANT_DROPDOWN

  // -- Scroll listener --------------------------------------
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // -- Close dropdown on outside click ----------------------
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
      if (languageRef.current && !languageRef.current.contains(e.target))
        setLanguageOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // -- Close mobile menu on route change --------------------
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  const currentLanguage = languageOptions.find((option) => option.code === language) || languageOptions[1]

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    if (to === '/profile') return location.pathname === '/profile' || location.pathname === '/account'
    return location.pathname.startsWith(to)
  }

  return (
    <>
      {/* -- Main Navbar ---------------------------------------- */}
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-2.5 bg-primary-50/80 backdrop-blur-xl shadow-glass border-b border-primary-200/40 dark:bg-slate-900/80 dark:border-slate-800 dark:shadow-[0_8px_32px_rgba(2,6,23,0.6)]'
            : 'py-4 bg-primary-50/60 backdrop-blur-md dark:bg-slate-900/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">

          {/* -- Logo ------------------------------------------- */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <motion.img
              animate={{ 
                y: [0, -3, 0],
                rotate: [0, 2, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              whileHover={{ 
                rotate: -6, 
                scale: 1.08,
                y: 0,
              }}
              src="/maskan no name logo.png"
              alt="Maskan logo"
              className="h-10 w-auto shrink-0 drop-shadow-sm"
            />
            <span className="font-poppins font-bold text-xl tracking-tight">
              <span className="text-primary-600 dark:text-slate-300">Mas</span>
              <span className="text-primary-900 dark:text-slate-100">kan</span>
            </span>
          </Link>

          {/* -- Desktop Nav Links ------------------------------- */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, labelKey, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                              transition-colors duration-150 ${
                    isActive(to)
                      ? 'text-primary-600 bg-primary-50 dark:text-slate-100 dark:bg-slate-800'
                      : 'text-primary-700 hover:text-primary-500 hover:bg-primary-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {t(labelKey)}
                {isActive(to) && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-primary-100/60 -z-10"
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* -- Right side ------------------------------------- */}
          <div className="flex items-center gap-2">

            {/* Language picker */}
            <div ref={languageRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setLanguageOpen((value) => !value)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors duration-150 text-primary-700 border-primary-200 bg-primary-50 hover:bg-primary-100 dark:text-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                aria-label={t('nav.chooseLanguage')}
              >
                <Globe className="w-4 h-4" />
                <span>{currentLanguage.shortLabel}</span>
                <motion.span animate={{ rotate: languageOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {languageOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-primary-200/60 bg-primary-50/95 backdrop-blur-xl shadow-glass-lg overflow-hidden dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-[0_12px_32px_rgba(2,6,23,0.6)]"
                  >
                    {languageOptions.map((option) => (
                      <button
                        key={option.code}
                        onClick={() => {
                          setLanguage(option.code)
                          setLanguageOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors duration-100 ${
                          language === option.code
                            ? 'bg-primary-100 text-primary-700 font-semibold dark:bg-slate-800 dark:text-slate-100'
                            : 'text-primary-700 hover:bg-primary-100/80 dark:text-slate-300 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{option.label}</span>
                        <span className="text-[11px] font-bold text-primary-400">{option.shortLabel}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notification bell (shown only if logged in) */}
            {user && (
              <NotificationBell user={user} />
            )}

            {/* Become a host (shown only for tenants) / My Properties (shown for hosts) */}
            {user && (user.role === 'TENANT' || user.role === 'CLIENT' || user.role === 'USER') && (
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold
                           text-primary-600 hover:text-primary-700 hover:bg-primary-100 transition-colors duration-150"
              >
                <Building2 className="w-4 h-4" />
                {t('nav.becomeHost')}
              </Link>
            )}
            {user && user.role === 'PROPRIETOR' && (
              <Link
                to="/my-properties"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold
                           text-primary-600 hover:text-primary-700 hover:bg-primary-100 transition-colors duration-150"
              >
                <Building2 className="w-4 h-4" />
                {t('nav.myProperties')}
              </Link>
            )}

            {user && user.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold
                           text-primary-600 hover:text-primary-700 hover:bg-primary-100 transition-colors duration-150"
              >
                <Building2 className="w-4 h-4" />
                {t('nav.adminDashboard')}
              </Link>
            )}

            {user ? (
              /* -- User Avatar + Dropdown ----------------------- */
              <div ref={dropdownRef} className="relative">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl
                             hover:bg-primary-50 transition-colors duration-150"
                >
                  <img
                    src={user.avatar || `https://i.pravatar.cc/40?img=1`}
                    alt={user.name}
                    className="w-8 h-8 rounded-xl object-cover ring-2 ring-primary-200"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-primary-800 leading-none">{user.name}</p>
                    <p className="text-[10px] text-primary-500 mt-0.5 capitalize">{user.role}</p>
                  </div>
                  <motion.div
                    animate={{ rotate: dropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-primary-400" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.94, y: -8 }}
                      animate={{ opacity: 1, scale: 1,    y: 0  }}
                      exit  ={{ opacity: 0, scale: 0.94, y: -8 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-primary-200/50
                                 bg-primary-50/80 backdrop-blur-xl overflow-hidden shadow-glass-lg py-1"
                    >
                      {DROPDOWN_ITEMS.map(({ labelKey, icon: Icon, to }) => (
                        <Link
                          key={to}
                          to={to}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-700
                                     hover:bg-primary-50 hover:text-primary-600 transition-colors duration-100"
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {t(labelKey)}
                        </Link>
                      ))}
                      <div className="my-1 border-t border-primary-200" />
                      <motion.button
                        whileHover={{ x: 4 }}
                        onClick={() => { setDropdownOpen(false); onLogout?.() }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500
                                   hover:bg-red-50 transition-colors duration-100"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.signOut')}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* -- Auth Buttons ---------------------------------- */
              <div className="hidden sm:flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAuthClick?.('login')}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-primary-700
                             hover:text-primary-600 hover:bg-primary-50 transition-colors duration-150"
                >
                  {t('nav.login')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(164,131,116,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAuthClick?.('register')}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-primary-50
                             bg-gradient-to-r from-primary-500 to-primary-600
                             shadow-md transition-all duration-150"
                >
                  {t('nav.signup')}
                </motion.button>
              </div>
            )}

            {/* Mobile hamburger */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-primary-700 hover:bg-primary-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* -- Mobile Drawer --------------------------------------- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-primary-900/30 backdrop-blur-sm md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 border-l border-primary-200/10
                         bg-primary-900/90 backdrop-blur-2xl flex flex-col pt-20 pb-8 px-5 gap-2 md:hidden"
            >
              {NAV_LINKS.map(({ to, labelKey, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                              transition-colors duration-150 ${
                    isActive(to)
                      ? 'bg-primary-500/20 text-primary-300'
                      : 'text-primary-100 hover:bg-primary-50/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(labelKey)}
                </Link>
              ))}

              <div className="mt-4 pt-4 border-t border-primary-200/10">
                <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-200/70">{t('nav.language')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => {
                        setLanguage(option.code)
                        setLanguageOpen(false)
                        setMobileMenuOpen(false)
                      }}
                      className={`rounded-xl px-2 py-2 text-xs font-semibold transition-colors duration-100 ${
                        language === option.code
                          ? 'bg-primary-500 text-primary-50'
                          : 'bg-primary-50/10 text-primary-100 hover:bg-primary-50/20'
                      }`}
                    >
                      {option.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
              {!user && (
                <div className="mt-auto flex flex-col gap-3">
                  <button
                    onClick={() => { setMobileMenuOpen(false); onAuthClick?.('login') }}
                    className="inline-flex w-full items-center justify-center rounded-xl border border-primary-300/40 px-4 py-3 text-sm font-semibold text-primary-100 transition hover:bg-primary-50/10"
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onAuthClick?.('register') }}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-primary-50 shadow-md shadow-primary-950/20 transition hover:bg-primary-600"
                  >
                    {t('nav.signup')}
                  </button>
                </div>
              )}

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary-100 hover:bg-primary-50/10"
                  >
                    <Building2 className="w-4 h-4" />
                    {t('nav.adminDashboard')}
                  </Link>
                )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
