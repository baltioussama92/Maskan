import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const NotificationContext = createContext({
  notify: (_input, _type = 'info') => {},
  toasts: [],
  dismissToast: (_id) => {},
})

function normalizeNotifyInput(input, fallbackType = 'info') {
  if (typeof input === 'string') {
    return { message: input, type: fallbackType, link: null, unread: true }
  }
  return {
    message: input?.message || '',
    type: input?.type || fallbackType,
    link: input?.link || input?.path || null,
    unread: input?.unread !== false,
  }
}

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((input, type = 'info') => {
    const payload = normalizeNotifyInput(input, type)
    if (!payload.message) return

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, ...payload }])

    window.setTimeout(() => {
      dismissToast(id)
    }, payload.link ? 6000 : 4000)
  }, [dismissToast])

  useEffect(() => {
    const onNotify = (event) => {
      const detail = event?.detail || {}
      if (detail?.message) {
        notify({
          message: detail.message,
          type: detail.type || 'info',
          link: detail.link || detail.path || null,
        })
      }
    }

    window.addEventListener('app:notify', onNotify)
    return () => window.removeEventListener('app:notify', onNotify)
  }, [notify])

  useEffect(() => {
    const authError = sessionStorage.getItem('appAuthError')
    if (authError) {
      notify(authError, 'error')
      sessionStorage.removeItem('appAuthError')
    }
  }, [notify])

  const value = useMemo(
    () => ({ notify, toasts, dismissToast }),
    [notify, toasts, dismissToast],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}

/** Map backend notification types to in-app routes */
export function resolveNotificationLink(notification) {
  if (!notification) return null
  if (notification.link || notification.path) {
    return notification.link || notification.path
  }
  switch (notification.type) {
    case 'BOOKING':
    case 'PAYMENT':
      return '/bookings'
    case 'KYC':
      return '/guest-verification'
    default:
      return '/notifications'
  }
}
