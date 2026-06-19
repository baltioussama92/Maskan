import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { buildQueryString } from '../api/query'
import type {
  BookingRequest,
  BookingResponse,
  BookingStatusUpdateRequest,
  CheckInVerificationResponse,
  PageResponse,
  PaymentCheckoutResponse,
  UnavailableDateRange,
  BookedDateRange,
} from '../utils/contracts'

export const bookingService = {
  async create(payload: BookingRequest): Promise<BookingResponse> {
    const { data } = await apiClient.post<BookingResponse>(ENDPOINTS.bookings.create, payload)
    return data
  },

  async getMine(query: { page?: number; size?: number; sort?: string } = {}): Promise<PageResponse<BookingResponse>> {
    const queryString = buildQueryString(query as Record<string, unknown>)
    const { data } = await apiClient.get<PageResponse<BookingResponse>>(`${ENDPOINTS.bookings.listMine}${queryString}`)
    return data
  },

  async getOwnerBookings(query: { page?: number; size?: number; sort?: string } = {}): Promise<PageResponse<BookingResponse>> {
    const queryString = buildQueryString(query as Record<string, unknown>)
    const { data } = await apiClient.get<PageResponse<BookingResponse>>(`${ENDPOINTS.bookings.listOwner}${queryString}`)
    return data
  },

  async getUnavailableDates(listingId: number | string): Promise<UnavailableDateRange[]> {
    const { data } = await apiClient.get<UnavailableDateRange[]>(ENDPOINTS.bookings.unavailableDates(listingId))
    return data
  },

  async getBookedDates(propertyId: number | string): Promise<BookedDateRange[]> {
    const { data } = await apiClient.get<BookedDateRange[]>(ENDPOINTS.properties.bookedDates(propertyId))
    return data
  },

  async updateStatus(id: number | string, payload: BookingStatusUpdateRequest): Promise<BookingResponse> {
    const { data } = await apiClient.patch<BookingResponse>(ENDPOINTS.bookings.updateStatus(id), payload)
    return data
  },

  async payEscrow(bookingId: number | string): Promise<PaymentCheckoutResponse> {
    const { data } = await apiClient.put<PaymentCheckoutResponse>(ENDPOINTS.bookings.pay(bookingId))
    return data
  },

  async checkoutPayment(bookingId: number | string): Promise<PaymentCheckoutResponse> {
    return this.payEscrow(bookingId)
  },

  async verifyCheckIn(bookingId: number | string, secretCode: string): Promise<CheckInVerificationResponse> {
    const { data } = await apiClient.post<CheckInVerificationResponse>(ENDPOINTS.bookings.verifyCheckIn(bookingId), { secretCode })
    return data
  },
}
