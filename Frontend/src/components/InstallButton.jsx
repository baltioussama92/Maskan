import React, { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

function isMobileDevice() {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    || window.matchMedia('(max-width: 767px)').matches
  )
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    && !window.MSStream
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

/**
 * Mobile-only PWA install FAB (bottom-right).
 * Android: uses beforeinstallprompt native dialog.
 * iOS: shows Add to Home Screen instructions.
 */
export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileDevice())
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
    )

    const onBeforeInstall = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    const onInstalled = () => setDeferredPrompt(null)

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS()) {
      window.alert(
        'Installer Maskan sur iOS :\n\n'
        + '1. Appuyez sur Partager (icône carré avec flèche)\n'
        + '2. Faites défiler et choisissez « Sur l\'écran d\'accueil »\n'
        + '3. Appuyez sur « Ajouter »',
      )
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      await deferredPrompt.userChoice
      setDeferredPrompt(null)
      return
    }

    if (isAndroid()) {
      window.alert(
        'Installation PWA : ouvrez le menu Chrome (⋮) puis « Installer l\'application » '
        + 'ou « Ajouter à l\'écran d\'accueil ».',
      )
    }
  }

  if (!isMobile || isStandalone) return null

  return (
    <button
      type="button"
      onClick={handleInstall}
      aria-label="Installer l'application Maskan"
      className="fixed bottom-5 right-4 z-[9990] md:hidden flex items-center gap-2 rounded-full
                 bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-glass-lg
                 transition-colors hover:bg-primary-600 active:scale-95 motion-safe-only"
    >
      <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
      Installer
    </button>
  )
}
