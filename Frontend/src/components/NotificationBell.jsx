import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarCheck, CheckCircle, CreditCard, RefreshCw, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationService } from '../services/notificationService'
import { authService } from '../services/authService'
import { resolveNotificationLink } from '../context/NotificationContext'

const ROLE_STORAGE_KEY = 'userRole'

const hostApprovalSeenKey = (userId) => `hasSeenHostApproval_${userId}`

const hasSeenHostApprovalBanner = (userId) => {
  if (!userId) return true
  return localStorage.getItem(hostApprovalSeenKey(userId)) === 'true'
}

const markHostApprovalBannerSeen = (userId) => {
  if (!userId) return
  localStorage.setItem(hostApprovalSeenKey(userId), 'true')
}

const isHostApprovalNotification = (notification) =>
  notification.type === 'SYSTEM' &&
  notification.title &&
  notification.title.includes('Host Application Approved')

const formatRelativeTime = (value) => {
  if (!value) return ''
  const now = Date.now()
  const then = new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round((now - then) / 60000))
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `il y a ${diffHours} h`
  const diffDays = Math.round(diffHours / 24)
  return `il y a ${diffDays} j`
}

function NotificationBell({ user }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [roleUpgradeBanner, setRoleUpgradeBanner] = useState(false)
  const containerRef = useRef(null)

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  )

  const dismissRoleUpgradeBanner = () => {
    markHostApprovalBannerSeen(user?.id)
    setRoleUpgradeBanner(false)
  }

  const handleRoleUpgradeReload = () => {
    markHostApprovalBannerSeen(user?.id)
    window.location.reload()
  }

  const markHostApprovalNotificationsRead = async (items) => {
    const unreadApprovals = items.filter((n) => !n.isRead && isHostApprovalNotification(n))
    if (unreadApprovals.length === 0) return

    await Promise.all(
      unreadApprovals.map(async (notification) => {
        try {
          await notificationService.markAsRead(notification.id)
        } catch {
          // Ignore transient failures to keep UI responsive.
        }
      }),
    )

    const readIds = new Set(unreadApprovals.map((n) => n.id))
    setNotifications((prev) =>
      prev.map((item) => (readIds.has(item.id) ? { ...item, isRead: true } : item)),
    )
  }

  const refreshNotifications = async () => {
    if (!user?.id) {
      setNotifications([])
      return
    }

    setLoading(true)
    try {
      const data = await notificationService.listMine()
      setNotifications(data)

      // Auto-refresh session when a host-approval SYSTEM notification is found.
      // The JWT does NOT embed role claims — it only stores the email subject.
      // The backend always re-reads role from MongoDB, so the change is already
      // effective server-side. Only localStorage is stale until refreshed here.
      const hasHostApproval = data.some((n) => !n.isRead && isHostApprovalNotification(n))

      if (hasHostApproval && !hasSeenHostApprovalBanner(user?.id)) {
        const currentRole = localStorage.getItem(ROLE_STORAGE_KEY)
        const profileRole =
          typeof user?.role === 'string' ? user.role : user?.role != null ? String(user.role) : ''
        const alreadyHost =
          profileRole.toLowerCase() === 'host' || currentRole?.toLowerCase() === 'host'

        if (alreadyHost) {
          markHostApprovalBannerSeen(user?.id)
          await markHostApprovalNotificationsRead(data)
        } else if (currentRole && currentRole.toLowerCase() !== 'host') {
          const updated = await authService.refreshUserSession()
          if (updated?.role) {
            const newRole = typeof updated.role === 'string' ? updated.role : String(updated.role)
            if (newRole.toLowerCase() === 'host') {
              markHostApprovalBannerSeen(user?.id)
              await markHostApprovalNotificationsRead(data)
              setRoleUpgradeBanner(true)
            }
          }
        }
      }
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
      )
    } catch {
      // Ignore transient failures to keep UI responsive.
    }
  }

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.id)
    }
    const link = resolveNotificationLink(item)
    if (link) {
      setOpen(false)
      navigate(link)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
    } catch {
      // Ignore transient failures to keep UI responsive.
    }
  }

  useEffect(() => {
    refreshNotifications().catch(() => {})
    const timer = window.setInterval(() => {
      refreshNotifications().catch(() => {})
    }, 30000)

    return () => window.clearInterval(timer)
  }, [user?.id])

  useEffect(() => {
    const handler = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Host role-upgrade banner — shown when backend confirms HOST role */}
      <AnimatePresence>
        {roleUpgradeBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-4 left-1/2 z-[9999] flex w-[90%] max-w-lg -translate-x-1/2 flex-wrap items-center justify-center gap-2 px-4 py-3 text-center text-sm font-semibold sm:flex-nowrap sm:gap-3 sm:px-5 rounded-2xl bg-emerald-600 text-white shadow-xl"
          >
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>🎉 Your host application was approved! Reload to activate HOST features.</span>
            <button
              onClick={handleRoleUpgradeReload}
              className="ml-2 px-3 py-1 rounded-lg bg-white text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition"
            >
              Reload
            </button>
            <button
              onClick={dismissRoleUpgradeBanner}
              className="ml-1 text-white/70 hover:text-white text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((value) => !value)}
        className="relative p-2 rounded-xl text-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-150 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-primary-100">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[min(calc(100vw-2rem),24rem)] rounded-2xl border border-primary-200/60 bg-white/80 backdrop-blur-2xl shadow-glass-lg overflow-hidden dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="px-4 py-3 border-b border-primary-200/60 flex items-center justify-between dark:border-slate-700">
              <div>
                <p className="text-sm font-semibold text-primary-900 dark:text-slate-100">Notifications</p>
                <p className="text-[11px] text-primary-500 dark:text-slate-400">
                  {loading ? 'Mise a jour...' : `${notifications.length} total`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshNotifications}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-slate-200"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  Rafraichir
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-slate-200"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-primary-500 text-center dark:text-slate-400">
                Aucune notification pour le moment.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    className={`w-full text-left px-4 py-3 border-b border-primary-100/70 transition-colors dark:border-slate-700 ${
                      item.isRead
                        ? 'hover:bg-primary-50/70 dark:hover:bg-slate-700/60'
                        : 'bg-[#A65B32]/10 hover:bg-[#A65B32]/20 dark:bg-slate-700/40 dark:hover:bg-slate-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          item.isRead ? 'bg-primary-200 dark:bg-slate-600' : 'bg-[#A65B32]'
                        }`}
                      />
                      <div
                        className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                          item.type === 'BOOKING'
                            ? 'bg-primary-100 text-primary-600 dark:bg-slate-700 dark:text-slate-200'
                            : item.type === 'KYC'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-200'
                            : item.type === 'PAYMENT'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.type === 'BOOKING' ? (
                          <CalendarCheck className="w-4 h-4" />
                        ) : item.type === 'KYC' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : item.type === 'PAYMENT' ? (
                          <CreditCard className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-primary-900 truncate dark:text-slate-100">
                          {item.title}
                        </p>
                        <p className="text-xs text-primary-700 truncate dark:text-slate-300">
                          {item.message}
                        </p>
                        <p className="text-[11px] text-primary-500 mt-1 dark:text-slate-400">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default React.memo(NotificationBell)
