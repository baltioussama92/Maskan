import axios from 'axios'

export const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8080";
export const AUTH_TOKEN_KEY = 'authToken'
const USER_STORAGE_KEY = 'user'
const ROLE_STORAGE_KEY = 'userRole'

export function getStoredAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearStoredAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

interface ApiResponse<T> {
  data: T
  status: number
}

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

function resolveApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const typedPayload = payload as { message?: unknown; errors?: unknown }

  if (typeof typedPayload.message === 'string' && typedPayload.message.trim()) {
    return typedPayload.message
  }

  if (typedPayload.errors && typeof typedPayload.errors === 'object') {
    const firstError = Object.values(typedPayload.errors as Record<string, unknown>)
      .find((value) => typeof value === 'string' && value.trim())
    if (typeof firstError === 'string') {
      return firstError
    }
  }

  return fallback
}

axiosInstance.interceptors.request.use((config) => {
  const token = getStoredAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const payload = error?.response?.data
    const fallbackMessage = typeof error?.message === 'string' && error.message.trim()
      ? error.message
      : 'Request failed'

    error.message = resolveApiErrorMessage(payload, fallbackMessage)

    if (status === 401 || status === 403) {
      const message = status === 403
        ? 'Votre compte est bloqué ou l’accès est interdit.'
        : 'Votre session a expiré. Veuillez vous reconnecter.'

      clearStoredAuthToken()
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(ROLE_STORAGE_KEY)

      window.dispatchEvent(new CustomEvent('app:notify', {
        detail: {
          type: 'error',
          message,
        },
      }))
      sessionStorage.setItem('appAuthError', message)

      if (!window.location.search.includes('auth=login')) {
        window.location.href = '/?auth=login'
      }
    }

    return Promise.reject(error)
  },
)

async function request<T>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<ApiResponse<T>> {
  const response = await axiosInstance.request<T>({
    method,
    url: path,
    data: body,
  })

  return {
    data: response.data,
    status: response.status,
  }
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
