import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CreditCard, Loader2, Lock, X } from 'lucide-react'

const EMPTY_FORM = {
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatCardNumber(value) {
  return digitsOnly(value).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function isFutureExpiry(expiry) {
  const match = String(expiry || '').match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false

  const month = Number(match[1])
  const year = Number(match[2])
  if (month < 1 || month > 12) return false

  const now = new Date()
  const currentYear = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1

  if (year > currentYear) return true
  return year === currentYear && month >= currentMonth
}

function validateForm(form) {
  const errors = {}

  if (!form.cardholderName.trim()) {
    errors.cardholderName = 'Le nom du titulaire est requis.'
  }

  const cardNumber = digitsOnly(form.cardNumber)
  if (cardNumber.length !== 16) {
    errors.cardNumber = 'Le numéro de carte doit contenir exactement 16 chiffres.'
  }

  if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
    errors.expiry = 'La date doit être au format MM/AA.'
  } else if (!isFutureExpiry(form.expiry)) {
    errors.expiry = 'La date d’expiration doit être valide et dans le futur.'
  }

  if (digitsOnly(form.cvv).length !== 3) {
    errors.cvv = 'Le CVV doit contenir exactement 3 chiffres.'
  }

  return errors
}

export default function EscrowPaymentModal({
  open,
  booking,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [processing, setProcessing] = useState(false)

  const totalLabel = useMemo(() => {
    const amount = Number(booking?.totalPrice || 0)
    return `${amount.toLocaleString('fr-TN')} DT`
  }, [booking?.totalPrice])

  const resetState = () => {
    setForm(EMPTY_FORM)
    setErrors({})
    setSubmitError('')
    setProcessing(false)
  }

  const handleClose = () => {
    if (processing) return
    resetState()
    onClose?.()
  }

  const handleChange = (field) => (event) => {
    let value = event.target.value

    if (field === 'cardNumber') {
      value = formatCardNumber(value)
    } else if (field === 'expiry') {
      value = formatExpiry(value)
    } else if (field === 'cvv') {
      value = digitsOnly(value).slice(0, 3)
    }

    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
    setSubmitError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (processing || !booking?.id) return

    const validationErrors = validateForm(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setProcessing(true)
    setSubmitError('')

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 2000))
      await onSuccess?.(booking.id)
      resetState()
      onClose?.()
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Le paiement a échoué.'
      setSubmitError(message)
      setProcessing(false)
    }
  }

  if (!open || !booking) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-primary-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary-900">Paiement sécurisé</h2>
                <p className="text-xs text-primary-500">Escrow · {totalLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="rounded-lg p-2 text-primary-400 transition hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                Titulaire de la carte
              </label>
              <input
                type="text"
                value={form.cardholderName}
                onChange={handleChange('cardholderName')}
                placeholder="Nom complet"
                disabled={processing}
                className="w-full rounded-xl border border-primary-200 px-3 py-2.5 text-sm text-primary-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
              {errors.cardholderName && (
                <p className="mt-1 text-xs text-red-500">{errors.cardholderName}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                Numéro de carte
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                value={form.cardNumber}
                onChange={handleChange('cardNumber')}
                placeholder="1234 5678 9012 3456"
                disabled={processing}
                className="w-full rounded-xl border border-primary-200 px-3 py-2.5 text-sm text-primary-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              />
              {errors.cardNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                  Expiration
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  value={form.expiry}
                  onChange={handleChange('expiry')}
                  placeholder="MM/AA"
                  disabled={processing}
                  className="w-full rounded-xl border border-primary-200 px-3 py-2.5 text-sm text-primary-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                {errors.expiry && (
                  <p className="mt-1 text-xs text-red-500">{errors.expiry}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-primary-500">
                  CVV
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  value={form.cvv}
                  onChange={handleChange('cvv')}
                  placeholder="123"
                  disabled={processing}
                  className="w-full rounded-xl border border-primary-200 px-3 py-2.5 text-sm text-primary-900 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
                {errors.cvv && (
                  <p className="mt-1 text-xs text-red-500">{errors.cvv}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs text-primary-600">
              <Lock className="h-4 w-4 shrink-0" />
              <span>Paiement simulé à des fins de démonstration. Aucun débit réel.</span>
            </div>

            {submitError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Traitement du paiement...
                </>
              ) : (
                'Submit Payment'
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
