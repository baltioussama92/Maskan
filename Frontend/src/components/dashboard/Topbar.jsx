import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Search, Menu, ChevronDown, LogOut, Settings, User, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

const ROLE_COLORS = {
  PROPRIETAIRE: { pill: 'bg-primary-100 text-primary-700',  ring: 'ring-primary-200' },
  TENANT:       { pill: 'bg-primary-50 text-primary-600',   ring: 'ring-primary-200' },
  ADMIN:        { pill: 'bg-primary-200 text-primary-800',  ring: 'ring-primary-200' },
}

const ROLE_LABELS = {
  PROPRIETAIRE: 'Propriétaire',
  TENANT:       'Locataire',
  ADMIN:        'Administrateur',
}

export default function Topbar({ role = 'TENANT', pageTitle = 'Tableau de bord', onMenuToggle }) {
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifications] = useState([])
  const { isDark, toggleTheme } = useTheme()

  const ac = ROLE_COLORS[role] || ROLE_COLORS.TENANT
  const unread = notifications.filter(n => n.unread).length

  return (
    <header className="h-16 bg-primary-100 border-b border-primary-200 flex items-center
                       justify-between px-4 sm:px-6 shrink-0 z-20 relative">

      {/* ── Left ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-primary-50 text-primary-500 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-primary-900 leading-tight">{pageTitle}</h1>
          <p className="text-[11px] text-primary-400 font-medium leading-none mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* ── Right ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">

        {/* Dark mode toggle */}
        <motion.button
          whileTap={{ rotate: 360 }}
          transition={{ duration: 0.4 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl text-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
        >
          {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
            className="relative p-2 rounded-xl text-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <Bell className="w-4.5 h-4.5" style={{width:'1.1rem',height:'1.1rem'}} />
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-primary-100"
              />
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0,  scale: 1     }}
                exit  ={{ opacity: 0, y: 10, scale: 0.96   }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-80 bg-primary-100 rounded-2xl shadow-xl
                           border border-primary-200 overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-primary-200">
                  <p className="text-sm font-bold text-primary-800">Notifications</p>
                  {unread > 0 && (
                    <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      {unread} non lue{unread > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <ul>
                  {notifications.map(n => (
                    <li key={n.id}
                        className={`flex gap-3 px-4 py-3 border-b border-primary-200 last:border-none
                                    hover:bg-primary-50 cursor-pointer transition-colors
                                    ${n.unread ? 'bg-primary-50/60' : ''}`}>
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-primary-500' : 'bg-primary-200'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-primary-700 leading-relaxed">{n.text}</p>
                        <p className="text-[10px] text-primary-400 mt-0.5 font-medium">{n.time}</p>
                      </div>
                    </li>
                  ))}
                  {notifications.length === 0 && (
                    <li className="px-4 py-3 text-xs text-primary-500">Aucune notification</li>
                  )}
                </ul>
                <div className="px-4 py-2.5 text-center">
                  <button className="text-xs font-semibold text-primary-600 hover:underline">
                    Voir toutes les notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl
                       hover:bg-primary-50 transition-colors duration-150"
          >
            <img
              src="https://i.pravatar.cc/36?img=1"
              alt="avatar"
              className={`w-8 h-8 rounded-xl object-cover ring-2 ${ac.ring}`}
            />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-primary-800 leading-none">
                {role === 'PROPRIETAIRE' ? 'Karim T.' : role === 'ADMIN' ? 'Super Admin' : 'Rim K.'}
              </p>
              <span className={`text-[10px] font-semibold ${ac.pill} px-1.5 py-0.5 rounded-full`}>
                {ROLE_LABELS[role]}
              </span>
            </div>
            <motion.div animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3.5 h-3.5 text-primary-400" />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0,  scale: 1     }}
                exit  ={{ opacity: 0, y: 10, scale: 0.96   }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full mt-2 w-48 bg-primary-100 rounded-2xl shadow-xl
                           border border-primary-200 overflow-hidden z-50 py-1"
              >
                {[
                  { icon: User,     label: 'Mon profil',   href: '/dashboard/settings' },
                  { icon: Settings, label: 'Paramètres',   href: '/dashboard/settings' },
                ].map(({ icon: Icon, label, href }) => (
                  <a key={label} href={href}
                     className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-700
                                hover:bg-primary-50 hover:text-primary-900 transition-colors">
                    <Icon className="w-4 h-4 text-primary-400" />
                    {label}
                  </a>
                ))}
                <div className="my-1 border-t border-primary-200" />
                <button
                  onClick={() => {
                    localStorage.removeItem('authToken')
                    localStorage.removeItem('user')
                    localStorage.removeItem('userRole')
                    window.location.href = '/'
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500
                                   hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
