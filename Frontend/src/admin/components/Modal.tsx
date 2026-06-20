import type { ReactNode } from 'react'
import { adminModalBackdrop, adminModalPanel } from './ui'

interface ModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
  footerSlot?: ReactNode
}

export default function Modal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
  footerSlot,
}: ModalProps) {
  if (!open) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#3A2D28]/40 p-4 ${adminModalBackdrop}`}>
      <div className={`w-full max-w-md rounded-2xl border border-[#CBAD8D]/50 bg-[#FFFFFF] p-6 shadow-[0_24px_40px_rgba(58,45,40,0.2)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_24px_40px_rgba(2,6,23,0.6)] ${adminModalPanel}`}>
        <h3 className="text-lg font-semibold text-[#3A2D28] dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-[#3A2D28]/80 dark:text-slate-300">{message}</p>

        {footerSlot}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-[#CBAD8D]/60 px-4 py-2 text-sm font-medium text-[#3A2D28] transition-colors duration-200 hover:bg-[#EBE3DB] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-xl bg-[#3A2D28] px-4 py-2 text-sm font-medium text-[#FFFFFF] transition-colors duration-200 hover:bg-[#3A2D28]/90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {isLoading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
