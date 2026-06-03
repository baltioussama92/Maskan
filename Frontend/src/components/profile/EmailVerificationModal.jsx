import React, { useEffect, useMemo, useState } from 'react'
import { Loader2, Mail, X } from 'lucide-react'
import { guestVerificationService } from '../../services/guestVerificationService'

const OTP_PATTERN = /^\d{6}$/

export default function EmailVerificationModal({
  isOpen,
  onClose,
  onVerified,
  email = '',
}) {
  const [step, setStep] = useState(1)
  const [otpCode, setOtpCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setStep(1)
    setOtpCode('')
    setIsLoading(false)
    setError('')
    setSuccess('')
  }, [isOpen])

  const canVerify = useMemo(() => OTP_PATTERN.test(otpCode), [otpCode])

  if (!isOpen) return null

  const handleSendCode = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')
      const response = await guestVerificationService.sendEmailOtp(email)
      setStep(2)
      setSuccess(response?.message || 'Code envoyé avec succès. Vérifiez votre boîte mail.')
    } catch (err) {
      setError(err.message || 'Impossible d’envoyer le code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    try {
      if (!canVerify) {
        setError('Le code doit contenir exactement 6 chiffres.')
        return
      }

      setIsLoading(true)
      setError('')
      setSuccess('')
      const summary = await guestVerificationService.verifyEmailOtp({ otp: otpCode })
      onVerified?.(summary)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Code incorrect.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-black">Vérification de l’email</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#6F5944] transition hover:bg-[#F5EEE6]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#E9DCCF] bg-[#FBF8F4] p-3">
          <div className="rounded-lg bg-[#F4E7DE] p-2 text-[#A65B32]">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-black">Adresse de destination</p>
            <p className="text-xs text-[#6F5944]">{email || 'Email non disponible'}</p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-[#6F5944]">
              Cliquez sur “Envoyer le code” pour recevoir un OTP de vérification.
            </p>
            <button
              onClick={handleSendCode}
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#A65B32] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Envoi en cours...' : 'Envoyer le code'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-[#6F5944]">
              Entrez le code OTP à 6 chiffres reçu par email.
            </p>
            <input
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="Code OTP (6 chiffres)"
              className="w-full rounded-xl border border-[#DDCCBB] bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-[#A65B32] focus:ring-2 focus:ring-[#E6D5C3]"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="rounded-xl border border-[#DCCBB9] bg-white px-4 py-2.5 text-sm font-semibold text-[#5A4634] transition hover:bg-[#F8F1EA] disabled:cursor-not-allowed disabled:opacity-70"
              >
                Retour
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#A65B32] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoading ? 'Vérification...' : 'Vérifier'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            {success}
          </p>
        )}
      </div>
    </div>
  )
}
