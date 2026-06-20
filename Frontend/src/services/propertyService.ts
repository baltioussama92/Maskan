import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { buildQueryString } from '../api/query'
import type {
  PageResponse,
  PropertyQuery,
  PropertyRequest,
  PropertyResponse,
  PropertySearchQuery,
} from '../utils/contracts'

export const propertyService = {
  async list(query: PropertyQuery = {}): Promise<PageResponse<PropertyResponse>> {
    const hasSearchFilters =
      query.location != null && query.location !== '' ||
      query.minPrice != null ||
      query.maxPrice != null ||
      query.available != null ||
      query.checkInDate != null ||
      query.checkOutDate != null

    const queryString = buildQueryString(query as Record<string, unknown>)
    const endpoint = hasSearchFilters ? ENDPOINTS.properties.search : ENDPOINTS.properties.list
    const { data } = await apiClient.get<PageResponse<PropertyResponse>>(`${endpoint}${queryString}`)
    return data
  },

  async search(query: PropertySearchQuery = {}): Promise<PageResponse<PropertyResponse>> {
    const queryString = buildQueryString(query as Record<string, unknown>)
    const { data } = await apiClient.get<PageResponse<PropertyResponse>>(
      `${ENDPOINTS.properties.heroSearch}${queryString}`,
    )
    return data
  },

  async listMine(query: { page?: number; size?: number; sort?: string } = {}): Promise<PageResponse<PropertyResponse>> {
    const queryString = buildQueryString(query as Record<string, unknown>)
    const { data } = await apiClient.get<PageResponse<PropertyResponse>>(`${ENDPOINTS.properties.mine}${queryString}`)
    return data
  },

  async getById(id: number | string): Promise<PropertyResponse> {
    const { data } = await apiClient.get<PropertyResponse>(ENDPOINTS.properties.byId(id))
    return data
  },

  async create(payload: PropertyRequest): Promise<PropertyResponse> {
    const { data } = await apiClient.post<PropertyResponse>(ENDPOINTS.properties.list, payload)
    return data
  },

  async update(id: number | string, payload: PropertyRequest): Promise<PropertyResponse> {
    const { data } = await apiClient.put<PropertyResponse>(ENDPOINTS.properties.byId(id), payload)
    return data
  },

  async remove(id: number | string): Promise<void> {
    await apiClient.delete(ENDPOINTS.properties.byId(id))
  },
}
