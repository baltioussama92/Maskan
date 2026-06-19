import { API_BASE_URL } from '../../api/apiClient'

export function toAssetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }

  const normalized = path.replace(/\\/g, '/')
  const base = API_BASE_URL.replace(/\/$/, '')

  if (normalized.startsWith('/')) {
    return `${base}${normalized}`
  }

  return `${base}/${normalized}`
}
