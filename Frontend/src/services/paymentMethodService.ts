import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import type { PaymentMethodRequest, PaymentMethodResponse } from '../utils/contracts'

export const paymentMethodService = {
  async listMine(): Promise<PaymentMethodResponse[]> {
    const { data } = await apiClient.get<PaymentMethodResponse[]>(ENDPOINTS.paymentMethods.list)
    return data
  },

  async create(payload: PaymentMethodRequest): Promise<PaymentMethodResponse> {
    const { data } = await apiClient.post<PaymentMethodResponse>(ENDPOINTS.paymentMethods.create, payload)
    return data
  },

  async setDefault(id: string | number): Promise<PaymentMethodResponse> {
    const { data } = await apiClient.patch<PaymentMethodResponse>(ENDPOINTS.paymentMethods.setDefault(id))
    return data
  },

  async remove(id: string | number): Promise<void> {
    await apiClient.delete(ENDPOINTS.paymentMethods.remove(id))
  },
}
