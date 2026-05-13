import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import type { ReviewRequest, ReviewResponse } from '../utils/contracts'

export const reviewService = {
  async create(payload: ReviewRequest): Promise<ReviewResponse> {
    const { data } = await apiClient.post<ReviewResponse>(ENDPOINTS.reviews.create, payload)
    return data
  },

  async listByProperty(propertyId: number | string): Promise<ReviewResponse[]> {
    const { data } = await apiClient.get<ReviewResponse[]>(ENDPOINTS.reviews.listByProperty(propertyId))
    return data
  },

  async canReview(propertyId: number | string): Promise<boolean> {
    const { data } = await apiClient.get<boolean>(ENDPOINTS.reviews.canReview(propertyId))
    return Boolean(data)
  },
}
