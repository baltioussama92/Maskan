import React, { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CalendarX2, Loader2, ShieldAlert, X } from 'lucide-react'

function daysSinceReservation(createdAt) {
  if (!createdAt) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const created = new Date(createdAt)
  created.setHours(0, 0, 0, 0)

  return Math.max(0, Math.round((today - created) / 86400000))
}

export default function CancelConfirmationModal({
  open,
  booking,
  loading = false,
  onClose,
  onConfirm,
}) {
  const policy = useMemo(() => {
    if (!booking) {
      return null
    }

    const daysHeld = daysSinceReservation(booking.createdAt)
    const isTaxed = daysHeld > 10
    const totalPrice = Number(booking.totalPrice || 0)
    const penaltyAmount = isTaxed ? Math.round(totalPrice * 0.05 * 100) / 100 : 0
    const refundAmount = isTaxed ? Math.max(0, totalPrice - penaltyAmount) : totalPrice

    return {
      daysHeld,
      isTaxed,
      totalPrice,
      penaltyAmount,
      refundAmount,
    }
  }, [booking])

  if (!open || !booking || !policy) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2F241F]/55 p-4 backdrop-blur-[2px]"
        onClick={loading ? undefined : onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-md overflow-hidden rounded-2xl border border-[#D4C4B9] bg-[#FFFCF8] shadow-[0_24px_60px_rgba(47,36,31,0.22)]"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div className="border-b border-[#E8DED2] bg-gradient-to-r from-[#3A2D28] to-[#5B4A42] px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <CalendarX2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="cancel-modal-title" className="text-lg font-bold">
                    Confirmer l&apos;annulation
                  </h2>
                  <p className="text-xs text-white/75 mt-0.5">
                    {booking.property?.title || 'Réservation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className={`rounded-xl border px-4 py-3 ${
              policy.isTaxed
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}>
              <div className="flex items-start gap-3">
                {policy.isTaxed ? (
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                )}
                <div className="text-sm">
                  {policy.isTaxed ? (
                    <>
                      <p className="font-semibold">Annulation avec pénalité</p>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">
                        Vous détenez cette réservation depuis {policy.daysHeld} jours (plus de 10 jours).
                        Une pénalité de 5% sera appliquée et votre Trust Score sera réduit.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">Annulation gratuite</p>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">
                        Vous êtes dans la période de grâce de 10 jours ({policy.daysHeld} jour
                        {policy.daysHeld > 1 ? 's' : ''} depuis la réservation). Remboursement intégral, sans impact sur votre Trust Score.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E8DED2] bg-[#FBF8F3] p-4 text-sm text-[#3A2D28]">
              <div className="flex justify-between gap-3">
                <span className="text-[#6B5D54]">Montant total</span>
                <span className="font-semibold">{policy.totalPrice.toLocaleString('fr-TN')} DT</span>
              </div>
              {policy.isTaxed && (
                <div className="mt-2 flex justify-between gap-3 text-amber-800">
                  <span>Pénalité (5%)</span>
                  <span className="font-semibold">- {policy.penaltyAmount.toLocaleString('fr-TN')} DT</span>
                </div>
              )}
              <div className="mt-3 flex justify-between gap-3 border-t border-[#E8DED2] pt-3">
                <span className="font-semibold">Remboursement estimé</span>
                <span className="text-base font-bold text-[#3A2D28]">
                  {policy.refundAmount.toLocaleString('fr-TN')} DT
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6B5D54]">
              Cette action est définitive. Votre réservation passera au statut « Annulée ».
            </p>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl border border-[#D4C4B9] bg-[#F3EBE0] px-4 py-3 text-sm font-bold text-[#3A2D28] transition hover:bg-[#E8DED2] disabled:opacity-60"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => onConfirm?.(booking)}
                disabled={loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition disabled:opacity-60 ${
                  policy.isTaxed
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#3A2D28] hover:bg-[#2F241F]'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Annulation...
                  </>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
