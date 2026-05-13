import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import type { SupportTicketRequest, SupportTicketResponse } from '../utils/contracts'

export const supportTicketService = {
  async listMine(): Promise<SupportTicketResponse[]> {
    const { data } = await apiClient.get<SupportTicketResponse[]>(ENDPOINTS.support.listMine)
    return data
  },

  async create(payload: SupportTicketRequest): Promise<SupportTicketResponse> {
    const { data } = await apiClient.post<SupportTicketResponse>(ENDPOINTS.support.create, payload)
    return data
  },
}
