import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import type { UpdateUserPreferencesRequest, UserPreferences } from '../utils/contracts'

export const preferencesService = {
  async getMy(): Promise<UserPreferences> {
    const { data } = await apiClient.get<UserPreferences>(ENDPOINTS.users.preferences)
    return data
  },

  async update(payload: UpdateUserPreferencesRequest): Promise<UserPreferences> {
    const { data } = await apiClient.put<UserPreferences>(ENDPOINTS.users.preferences, payload)
    return data
  },
}
