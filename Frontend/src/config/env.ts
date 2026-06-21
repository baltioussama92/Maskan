/**
 * Centralized environment configuration for production (Vercel) and local dev.
 * All API and WebSocket URLs derive from VITE_API_BASE_URL — no separate WS env var needed.
 */
const rawApiBase = import.meta.env.VITE_API_BASE_URL || 'https://maskan-xzpw.onrender.com'

export const API_BASE_URL = rawApiBase.replace(/\/$/, '')

/** STOMP/SockJS endpoint: https://maskan-xzpw.onrender.com/ws */
export const WS_URL = `${API_BASE_URL}/ws`

export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || ''

/** Resolve relative upload paths to absolute backend URLs */
export function toAssetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.replace(/\\/g, '/')
  return `${API_BASE_URL}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
}
