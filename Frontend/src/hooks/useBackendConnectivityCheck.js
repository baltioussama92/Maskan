import { useEffect } from 'react'
import { API_BASE_URL, WS_URL } from '../config/env'

function describeFetchError(error) {
  if (error instanceof TypeError) {
    return `Network/CORS error reaching ${API_BASE_URL}/api/health — ${error.message}`
  }
  return error?.message || String(error)
}

/**
 * Pings /api/health on startup to validate VITE_API_BASE_URL + CORS in production.
 * Logs to console only (remove or gate behind import.meta.env.DEV in production if desired).
 */
export function useBackendConnectivityCheck() {
  useEffect(() => {
    const controller = new AbortController()

    const run = async () => {
      const healthUrl = `${API_BASE_URL}/api/health`

      console.info('[Maskan] Env check — VITE_API_BASE_URL:', API_BASE_URL)
      console.info('[Maskan] Env check — WS_URL:', WS_URL)

      try {
        const response = await fetch(healthUrl, {
          method: 'GET',
          signal: controller.signal,
          credentials: 'include',
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          console.error(
            `[Maskan] Backend health failed — HTTP ${response.status} from ${healthUrl}`,
          )
          return
        }

        const payload = await response.json()
        console.info('[Maskan] Connection Successful ✅', {
          url: healthUrl,
          status: payload?.status,
          service: payload?.service,
          checks: payload?.checks,
        })
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.error('[Maskan] Connection Failed ❌', describeFetchError(error))
      }
    }

    run()
    return () => controller.abort()
  }, [])
}
