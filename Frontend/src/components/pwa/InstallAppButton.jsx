import React, { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

/**
 * Captures beforeinstallprompt and shows a native-style install CTA.
 * Hidden when app is already installed (display-mode: standalone).
 */
export default function InstallAppButton({ className = '' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true

    if (isStandalone) return undefined

    try {
      if (localStorage.getItem('maskan_pwa_dismissed') === '1') {
        setDismissed(true)
      }
    } catch {
      // ignore
    }

    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      if (!dismissed) setVisible(true)
    }

    const onInstalled = () => {
      setVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [dismissed])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setVisible(false)
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    try {
      localStorage.setItem('maskan_pwa_dismissed', '1')
    } catch {
      // ignore
    }
  }

  if (!visible || !deferredPrompt) return null

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 z-[9990] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-primary-200 bg-white p-4 shadow-glass-lg md:left-auto md:right-6 ${className}`}
      role="dialog"
      aria-label="Install Maskan app"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100">
        <Download className="h-5 w-5 text-primary-600" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-primary-900">Installer Maskan</p>
        <p className="text-xs text-primary-500">Accédez rapidement depuis votre écran d&apos;accueil.</p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="h-10 shrink-0 rounded-xl bg-primary-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
      >
        Installer
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-400 hover:bg-primary-50 hover:text-primary-600"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
