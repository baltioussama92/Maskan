import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Loader2, Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.status === 404) {
        setError('No account exists with this email.')
      } else if (!response.ok) {
        const text = await response.text()
        setError(text || 'Failed to send reset link. Please try again.')
      } else {
        setStep(2)
      }
    } catch (err) {
      setError('Network error. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otp })
      })

      if (!response.ok) {
        const text = await response.text()
        setError(text || 'Invalid or expired OTP.')
      } else {
        setStep(3)
      }
    } catch (err) {
      setError('Network error. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode: otp, newPassword })
      })

      if (!response.ok) {
        const text = await response.text()
        setError(text || 'Failed to reset password.')
      } else {
        setStep(4)
      }
    } catch (err) {
      setError('Network error. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl shadow-primary-500/5 border border-primary-100 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-100">
          <div 
            className="h-full bg-primary-500 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {step < 4 && (
          <Link to="/" className="inline-flex items-center text-sm font-medium text-primary-500 hover:text-primary-700 transition mb-8">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour à l'accueil
          </Link>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary-900 mb-2">
            {step === 1 && 'Mot de passe oublié ?'}
            {step === 2 && 'Vérification OTP'}
            {step === 3 && 'Nouveau mot de passe'}
            {step === 4 && 'Mot de passe réinitialisé'}
          </h1>
          <p className="text-primary-500">
            {step === 1 && "Entrez votre adresse email et nous vous enverrons un code pour réinitialiser votre mot de passe."}
            {step === 2 && `Un code à 6 chiffres a été envoyé à ${email}.`}
            {step === 3 && "Veuillez entrer votre nouveau mot de passe."}
            {step === 4 && "Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="block w-full pl-10 pr-3 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 transition-colors"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer le code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">Code OTP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-full pl-10 pr-3 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 transition-colors text-center text-lg tracking-[0.5em] font-bold"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Vérifier le code'}
            </button>
            <div className="text-center">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-sm text-primary-500 hover:text-primary-700 font-medium transition"
              >
                Changer d'adresse email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">Nouveau mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-primary-900 mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-primary-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-primary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-primary-50/50 transition-colors"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary-500/20"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le mot de passe'}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <button
              onClick={() => navigate('/?auth=login')}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl text-white font-semibold bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-md shadow-primary-500/20"
            >
              Se connecter
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
