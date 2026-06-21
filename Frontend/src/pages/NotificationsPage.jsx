import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { notificationService } from '../services/notificationService'
import { resolveNotificationLink } from '../context/NotificationContext'

export default function NotificationsPage({ user }) {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setLoading(false)
      return
    }

    let active = true
    notificationService
      .listMine()
      .then((data) => {
        if (active) setNotifications(data)
      })
      .catch(() => {
        if (active) setNotifications([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  const handleClick = async (item) => {
    if (!item.isRead) {
      try {
        await notificationService.markAsRead(item.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        )
      } catch {
        // keep navigation responsive even if mark-read fails
      }
    }
    const link = resolveNotificationLink(item)
    if (link) navigate(link)
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden px-4 pt-24 pb-12 md:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-xl font-bold text-primary-900 md:text-2xl">Notifications</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary-400" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-primary-500 md:text-base">Aucune notification pour le moment.</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleClick(item)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition hover:brightness-[0.98] ${
                    item.isRead
                      ? 'border-primary-100 bg-white'
                      : 'border-primary-200 bg-primary-50/80'
                  }`}
                >
                  {!item.isRead && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
                  )}
                  <div className={item.isRead ? '' : 'pl-0'}>
                    <p className="text-sm font-semibold text-primary-900 md:text-base">{item.title}</p>
                    <p className="mt-1 text-xs text-primary-600 md:text-sm">{item.message}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
