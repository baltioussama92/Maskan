import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'

const toneClasses = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-primary-50 border-primary-200 text-primary-800',
  info: 'bg-white border-primary-200 text-primary-800',
}

/**
 * Render inside BrowserRouter (see App.jsx).
 * Mobile: centered, 90% width. Desktop: top-right, max 400px.
 */
export default function ToastStack() {
  const { toasts, dismissToast } = useNotifications()
  const navigate = useNavigate()

  const handleToastClick = (toast) => {
    if (!toast.link) return
    navigate(toast.link)
    dismissToast(toast.id)
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 md:inset-x-auto md:right-4 md:items-end md:px-0"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`pointer-events-auto relative w-[90%] max-w-[400px] rounded-xl border px-4 py-3 pr-10 text-sm font-medium shadow-lg md:w-[400px] ${toneClasses[toast.type] || toneClasses.info} ${toast.link ? 'cursor-pointer hover:brightness-[0.98]' : ''}`}
            onClick={() => handleToastClick(toast)}
            role={toast.link ? 'button' : 'status'}
          >
            {toast.unread && (
              <span
                className="absolute left-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary-500"
                aria-hidden="true"
              />
            )}
            <p className={toast.unread ? 'pl-3' : ''}>{toast.message}</p>
            {toast.link && (
              <p className={`mt-1 text-xs opacity-70 ${toast.unread ? 'pl-3' : ''}`}>
                Appuyez pour ouvrir
              </p>
            )}
            <button
              type="button"
              aria-label="Fermer la notification"
              className="absolute right-2 top-2 rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation()
                dismissToast(toast.id)
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
