import { apiClient, clearStoredAuthToken, setStoredAuthToken } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from '../utils/contracts'

const USER_STORAGE_KEY = 'user'
const ROLE_STORAGE_KEY = 'userRole'

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.login, payload)
    setStoredAuthToken(data.token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user))
    localStorage.setItem(ROLE_STORAGE_KEY, data.role)
    return data
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.auth.register, payload)
    setStoredAuthToken(data.token)
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user))
    localStorage.setItem(ROLE_STORAGE_KEY, data.role)
    return data
  },

  logout(): void {
    clearStoredAuthToken()
    localStorage.removeItem(USER_STORAGE_KEY)
    localStorage.removeItem(ROLE_STORAGE_KEY)
  },

  async getCurrentUser(): Promise<UserDto> {
    const { data } = await apiClient.get<UserDto>(ENDPOINTS.auth.me)
    // Update localStorage with fresh data
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data))
    if (data.role) {
      localStorage.setItem(ROLE_STORAGE_KEY, data.role)
    }
    return data
  },

  /**
   * Called after an admin approves a host demand.
   * Refreshes the user's role from the server and updates localStorage,
   * so the approved user sees their HOST privileges without a full re-login.
   * The JWT itself does not embed a role claim (only the email subject),
   * so the backend always re-reads the role from MongoDB on each request.
   * The only stale state is in the frontend localStorage cache.
   */
  async refreshUserSession(): Promise<UserDto | null> {
    try {
      return await this.getCurrentUser()
    } catch {
      return null
    }
  },
}
