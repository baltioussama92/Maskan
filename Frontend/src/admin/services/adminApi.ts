import { API_BASE_URL, apiClient, getStoredAuthToken } from '../../api/apiClient'
import { ENDPOINTS } from '../../api/endpoints'
import type { BookingResponse, MessageResponse, PageResponse, PropertyResponse, UserDto } from '../../utils/contracts'

export type UserRole = 'guest' | 'host'
export type UserStatus = 'active' | 'banned'
export type GuestIdentityStatus = 'not_verified' | 'pending' | 'approved' | 'rejected'

export interface AdminUser {
  id: number
  backendId?: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  username?: string
  bio?: string
  avatar?: string
  createdAt?: string
  isVerified?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  identityStatus?: GuestIdentityStatus
  verificationLevel?: number
  rejectionReason?: string
  governmentIdFiles?: string[]
  otherAttachmentFiles?: string[]
  selfieFile?: string
  identitySubmittedAt?: string
}

export type ListingStatus = 'pending' | 'approved'

export interface AdminListing {
  id: number
  backendId?: string // Original MongoDB ObjectId for API calls
  title: string
  host: string
  hostId?: number
  location: string
  status: ListingStatus
  createdAt?: string
  description?: string
  pricePerNight?: number
  images?: string[]
  bedrooms?: number
  bathrooms?: number
  area?: number
  amenities?: string[]
  rating?: number
  imageFiles?: File[]
  imageFile?: File
  imagePreview?: string
}

export interface ListingDetails extends AdminListing {
  reviews?: number
}

export type BookingStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'awaiting_checkin'
  | 'paid_awaiting_checkin'
  | 'confirmed'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface AdminBooking {
  id: number
  backendId?: string
  guest: string
  guestId?: number
  property: string
  listingId?: number
  host?: string
  hostId?: number
  dates: string
  status: BookingStatus
  totalPrice?: number
  createdAt?: string
  paymentMethod?: 'CARD' | 'CASH'
}

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'cash'

export interface AdminPayment {
  id: number
  backendId?: string
  user: string
  userId?: number
  amount: number
  status: PaymentStatus
  date: string
}

export interface AdminUserHistoryItem {
  id: string
  label: string
  description: string
  when: string
}

export interface AdminUserChatMessage {
  id: string
  senderId: number
  receiverId: number
  content: string
  createdAt: string
}

export interface AdminUserEarningsSummary {
  totalEarnings: number
  paidBookings: number
  pendingBookings: number
  listingsCount: number
  totalSpent?: number
  currency?: string
}

export interface AdminUserPermissions {
  canEditProfile: boolean
  canChangePassword: boolean
  canDeleteAccount: boolean
  canViewMessages: boolean
  canModerateListings: boolean
}

export interface AdminReport {
  id: number
  backendId?: string
  reporter: string
  reason: string
  target: string
  targetType: 'user' | 'listing'
  resolved: boolean
}

export interface AdminSettings {
  commissionPercentage: number
  enableSmartPricing: boolean
  enableNewHostOnboarding: boolean
  emailNotifications: boolean
  inAppNotifications: boolean
}

export type HostDemandStatus = 'pending' | 'approved' | 'rejected'
export type IdVerificationStatus = 'pending' | 'verified' | 'rejected'

export interface HostDemand {
  id: number
  backendId?: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  status: HostDemandStatus
  submittedDate: string
  documents: string[]
  idDocument: string
  idVerificationStatus: IdVerificationStatus
  housePictures: string[]
  proposedPrice: number
  proposedLocation: string
  bio?: string
  notes?: string
}

interface HostDemandApiResponse {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone?: string
  status: string
  submittedDate: string
  documents: string[]
  idDocument: string
  idVerificationStatus: string
  housePictures: string[]
  proposedPrice: number
  proposedLocation: string
  bio?: string
  notes?: string
}

export interface DashboardStats {
  totalUsers: number
  totalListings: number
  totalBookings: number
  revenue: number
}

export interface ActivityRow {
  id: number
  action: string
  actor: string
  when: string
}

interface AdminSummaryResponse {
  totalUsers?: number
  totalProperties?: number
  totalBookings?: number
}

interface AdminUserOverviewResponse {
  userId: string
  listingsCount: number
  bookingsAsGuestCount: number
  bookingsAsHostCount: number
  paidBookingsCount: number
  pendingBookingsCount: number
  totalEarnings: number
  totalSpent: number
}

interface AdminHistoryEventResponse {
  id: string
  type: string
  description: string
  metadata?: Record<string, unknown>
  createdAt?: string
}

interface AdminUserMessageResponse {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt?: string
  conversationId?: string
  isDeleted?: boolean
  moderationFlags?: string[]
}

interface AdminUserListingResponse {
  id: string
  title: string
  location: string
  status: string
  createdAt?: string
  pricePerNight?: number
  rating?: number
}

interface AdminUserBookingResponse {
  id: string
  listingId: string
  listingTitle?: string
  guestId?: string
  hostId?: string
  checkInDate: string
  checkOutDate: string
  status: string
  totalPrice?: number
  createdAt?: string
}

interface AdminMonthlyEarningsResponse {
  month: string
  earnings: number
  bookingsCount: number
}

interface AdminUserEarningsResponse {
  totalEarnings: number
  currency: string
  paidBookingsCount: number
  pendingPayoutCount: number
  lastPayoutAt?: string
  monthlyBreakdown: AdminMonthlyEarningsResponse[]
}

interface AdminActionResponse {
  success: boolean
  securityEventId?: string
  deletedAt?: string
}

const defaultSettings: AdminSettings = {
  commissionPercentage: 12,
  enableSmartPricing: true,
  enableNewHostOnboarding: true,
  emailNotifications: true,
  inAppNotifications: true,
}

const toNumberId = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// Ensures unique IDs even when backend provides duplicates or zeros
const ensureUniqueIds = <T extends { id: number }>(items: T[]): T[] => {
  const seenIds = new Set<number>()
  let idCounter = Math.max(...items.map(i => i.id), 0) + 1

  return items.map((item) => {
    if (item.id > 0 && !seenIds.has(item.id)) {
      seenIds.add(item.id)
      return item
    }
    // Assign a new unique ID if the current one is 0 or already seen
    const newId = idCounter++
    seenIds.add(newId)
    return { ...item, id: newId }
  })
}

const mapUserRole = (role: string | undefined): UserRole => {
  const normalized = String(role || '').toUpperCase()
  return normalized === 'HOST' || normalized === 'PROPRIETOR' || normalized === 'PROPRIETAIRE'
    ? 'host'
    : 'guest'
}

const mapUser = (user: UserDto): AdminUser => ({
  id: toNumberId(user.id),
  backendId: user.id != null ? String(user.id) : undefined,
  name: user.fullName || user.name || `User #${user.id}`,
  email: user.email,
  role: mapUserRole(user.role),
  status: user.banned ? 'banned' : 'active',
  username: user.username || undefined,
  bio: user.bio || undefined,
  avatar: user.avatar || undefined,
  createdAt: user.createdAt ? String(user.createdAt) : undefined,
  isVerified: typeof user.isVerified === 'boolean' ? user.isVerified : undefined,
  emailVerified: typeof user.emailVerified === 'boolean' ? user.emailVerified : undefined,
  phoneVerified: typeof user.phoneVerified === 'boolean' ? user.phoneVerified : undefined,
  identityStatus: (user.identityStatus as GuestIdentityStatus | undefined) || 'not_verified',
  verificationLevel: typeof user.verificationLevel === 'number' ? user.verificationLevel : undefined,
  rejectionReason: user.rejectionReason || undefined,
  governmentIdFiles: user.governmentIdFiles || [],
  otherAttachmentFiles: user.otherAttachmentFiles || [],
  selfieFile: user.selfieFile || undefined,
  identitySubmittedAt: user.identitySubmittedAt || undefined,
})

const mapHostDemandStatus = (status: string | undefined): HostDemandStatus => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'approved') return 'approved'
  if (normalized === 'rejected') return 'rejected'
  return 'pending'
}

const mapIdVerificationStatus = (status: string | undefined): IdVerificationStatus => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'verified' || normalized === 'approved') return 'verified'
  if (normalized === 'rejected') return 'rejected'
  return 'pending'
}

const mapHostDemand = (item: HostDemandApiResponse): HostDemand => ({
  id: toNumberId(item.id),
  backendId: item.id,
  userId: String(item.userId || item.id),
  userName: item.userName,
  userEmail: item.userEmail,
  userPhone: item.userPhone || undefined,
  status: mapHostDemandStatus(item.status),
  submittedDate: item.submittedDate,
  documents: item.documents || [],
  idDocument: item.idDocument,
  idVerificationStatus: mapIdVerificationStatus(item.idVerificationStatus),
  housePictures: item.housePictures || [],
  proposedPrice: Number(item.proposedPrice || 0),
  proposedLocation: item.proposedLocation || 'N/A',
  bio: item.bio || undefined,
  notes: item.notes || undefined,
})

const mapListing = (listing: PropertyResponse, isPending: boolean): AdminListing => ({
  id: toNumberId(listing.id),
  backendId: String(listing.id), // Preserve original backend ID
  title: listing.title,
  host: listing.hostId ? `Host #${listing.hostId}` : 'Unknown host',
  hostId: toNumberId(listing.hostId),
  location: listing.location,
  status: isPending ? 'pending' : 'approved',
  createdAt: String(listing.createdAt || ''),
  description: listing.description || '',
  pricePerNight: Number(listing.pricePerNight || listing.price || 0),
  images: listing.images || [],
  bedrooms: Number(listing.bedrooms || 0),
  bathrooms: Number(listing.bathrooms || 0),
  area: Number(listing.area || 0),
  amenities: listing.amenities || [],
  rating: Number(listing.rating || 0),
})

const mapAdminListingStatus = (status: string | undefined): ListingStatus => {
  const normalized = String(status || '').toUpperCase()
  return normalized.includes('PENDING') ? 'pending' : 'approved'
}

const mapAdminUserListing = (listing: AdminUserListingResponse): AdminListing => ({
  id: toNumberId(listing.id),
  title: listing.title,
  host: 'User listing',
  location: listing.location,
  status: mapAdminListingStatus(listing.status),
  createdAt: String(listing.createdAt || ''),
})

const mapBookingStatus = (status: string | undefined): BookingStatus => {
  const normalized = String(status || '').toUpperCase()
  switch (normalized) {
    case 'AWAITING_PAYMENT':
      return 'awaiting_payment'
    case 'AWAITING_CHECKIN':
      return 'awaiting_checkin'
    case 'PAID_AWAITING_CHECKIN':
      return 'paid_awaiting_checkin'
    case 'CONFIRMED':
      return 'confirmed'
    case 'COMPLETED':
      return 'completed'
    case 'REJECTED':
      return 'rejected'
    case 'CANCELLED':
      return 'cancelled'
    case 'PENDING':
    default:
      return 'pending'
  }
}

const mapBooking = (
  booking: BookingResponse,
  hostsByListingId?: Map<number, { host: string; hostId?: number }>,
): AdminBooking => {
  const listingId = toNumberId(booking.listingId)
  const hostInfo = hostsByListingId?.get(listingId)

  return {
    id: toNumberId(booking.id),
    backendId: booking.id ? String(booking.id) : undefined,
    guest: booking.guestId ? `Guest #${booking.guestId}` : 'Unknown guest',
    guestId: toNumberId(booking.guestId),
    property: booking.listingTitle || `Listing #${booking.listingId}`,
    listingId,
    host: hostInfo?.host || 'Unknown host',
    hostId: hostInfo?.hostId,
    dates: `${booking.checkInDate} to ${booking.checkOutDate}`,
    status: mapBookingStatus(booking.status),
    totalPrice: Number(booking.totalPrice || 0),
    createdAt: String(booking.createdAt || booking.checkInDate || ''),
    paymentMethod: booking.paymentMethod,
  }
}

const mapAdminBooking = (booking: AdminUserBookingResponse): AdminBooking => ({
  id: toNumberId(booking.id),
  backendId: booking.id ? String(booking.id) : undefined,
  guest: booking.guestId ? `Guest #${booking.guestId}` : 'Unknown guest',
  guestId: toNumberId(booking.guestId),
  property: booking.listingTitle || `Listing #${booking.listingId}`,
  listingId: toNumberId(booking.listingId),
  host: booking.hostId ? `Host #${booking.hostId}` : 'Unknown host',
  hostId: toNumberId(booking.hostId),
  dates: `${booking.checkInDate} to ${booking.checkOutDate}`,
  status: mapBookingStatus(booking.status),
  totalPrice: Number(booking.totalPrice || 0),
  createdAt: String(booking.createdAt || booking.checkInDate || ''),
  paymentMethod: undefined,
})

const mapPaymentStatus = (status: string | undefined, paymentMethod?: string | null): PaymentStatus => {
  const normalized = String(status || '').toUpperCase()
  const method = String(paymentMethod || '').toUpperCase()
  if (method === 'CASH') return 'cash'
  if (['PAID_AWAITING_CHECKIN', 'COMPLETED'].includes(normalized)) return 'paid'
  if (['PENDING', 'AWAITING_PAYMENT', 'AWAITING_CHECKIN', 'CONFIRMED'].includes(normalized)) return 'pending'
  return 'failed'
}

const toPayments = (bookings: BookingResponse[]): AdminPayment[] => (
  bookings.map((booking) => ({
    id: toNumberId(booking.id),
    backendId: booking.id ? String(booking.id) : undefined,
    user: booking.guestId ? `User #${booking.guestId}` : 'Unknown user',
    userId: toNumberId(booking.guestId),
    amount: Number(booking.totalPrice || 0),
    status: mapPaymentStatus(booking.status, booking.paymentMethod),
    date: booking.createdAt ? String(booking.createdAt).slice(0, 10) : String(booking.checkInDate || ''),
  }))
)

async function fetchAdminBookings(): Promise<BookingResponse[]> {
  const { data } = await apiClient.get<PageResponse<BookingResponse>>(ENDPOINTS.admin.bookings)
  return data.content || []
}

async function fetchPendingListings(): Promise<PropertyResponse[]> {
  const { data } = await apiClient.get<PageResponse<PropertyResponse>>(ENDPOINTS.admin.pendingListings)
  return data.content || []
}

async function uploadPropertyImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const token = getStoredAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Image upload failed')
  }

  const data = await response.json() as { url?: string }
  if (!data.url) {
    throw new Error('Image upload response is missing URL')
  }

  return data.url
}

async function uploadPropertyImages(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => uploadPropertyImage(file)))
}

export const adminApi = {
  async getUsers(): Promise<AdminUser[]> {
    const { data } = await apiClient.get<UserDto[]>(ENDPOINTS.admin.users)
    const mapped = data.map(mapUser)
    return ensureUniqueIds(mapped)
  },

  async getGuestVerificationRequests(): Promise<AdminUser[]> {
    const users = await this.getUsers()
    return users
      .filter((user) => user.identityStatus === 'pending')
      .sort((a, b) => {
        const left = a.identitySubmittedAt ? Date.parse(a.identitySubmittedAt) : 0
        const right = b.identitySubmittedAt ? Date.parse(b.identitySubmittedAt) : 0
        return right - left
      })
  },

  async approveGuestVerification(userId: number | string): Promise<AdminUser> {
    const { data } = await apiClient.patch<UserDto>(ENDPOINTS.admin.approveGuestVerification(userId), {})
    return mapUser(data)
  },

  async rejectGuestVerification(userId: number | string, reason?: string): Promise<AdminUser> {
    const { data } = await apiClient.patch<UserDto>(ENDPOINTS.admin.rejectGuestVerification(userId), {
      reason: reason || '',
    })
    return mapUser(data)
  },

  async getUserById(userId: number | string): Promise<AdminUser | null> {
    const users = await this.getUsers()
    const requested = String(userId)
    return users.find((user) => String(user.id) === requested || user.backendId === requested) || null
  },

  async getListings(): Promise<AdminListing[]> {
    const [allListingsResponse, pendingListings] = await Promise.all([
      apiClient.get<PageResponse<PropertyResponse>>(ENDPOINTS.properties.list),
      fetchPendingListings(),
    ])

    const pendingIds = new Set(pendingListings.map((entry) => toNumberId(entry.id)))
    const merged = [...(allListingsResponse.data.content || []), ...pendingListings]
    const uniqById = new Map<number, PropertyResponse>()

    merged.forEach((entry) => {
      uniqById.set(toNumberId(entry.id), entry)
    })

    const mapped = Array.from(uniqById.values()).map((listing) => {
      const id = toNumberId(listing.id)
      const hasPendingApproval = Boolean((listing as PropertyResponse & { pendingApproval?: boolean }).pendingApproval)
      return mapListing(listing, pendingIds.has(id) || hasPendingApproval)
    })
    return ensureUniqueIds(mapped)
  },

  async getListingDetails(listingId: number, backendId?: string): Promise<ListingDetails | null> {
    const idToFetch = backendId || listingId
    const { data } = await apiClient.get<PropertyResponse>(ENDPOINTS.properties.byId(idToFetch))
    const listing = mapListing(data, false)
    return {
      ...listing,
      reviews: Number(data.reviewCount || 0),
    }
  },

  async updateListing(listingId: number, payload: Partial<AdminListing>): Promise<AdminListing | null> {
    try {
      const updateData: Record<string, unknown> = {}
      if (payload.title !== undefined) updateData.title = payload.title
      if (payload.description !== undefined) updateData.description = payload.description
      if (payload.location !== undefined) updateData.location = payload.location
      if (payload.pricePerNight !== undefined) updateData.pricePerNight = payload.pricePerNight
      if (payload.bedrooms !== undefined) updateData.bedrooms = payload.bedrooms
      if (payload.bathrooms !== undefined) updateData.bathrooms = payload.bathrooms
      if (payload.area !== undefined) updateData.area = payload.area
      if (payload.amenities !== undefined) updateData.amenities = payload.amenities

      let finalImages: string[] | undefined = payload.images ? [...payload.images] : undefined

      if (payload.imageFiles && payload.imageFiles.length > 0) {
        const uploadedUrls = await uploadPropertyImages(payload.imageFiles)
        finalImages = [...(finalImages || []), ...uploadedUrls]
      } else if (payload.imageFile) {
        const uploadedUrl = await uploadPropertyImage(payload.imageFile)
        finalImages = [...(finalImages || []), uploadedUrl]
      } else if (payload.imagePreview) {
        finalImages = [...(finalImages || []), payload.imagePreview]
      }

      if (finalImages !== undefined) {
        updateData.images = finalImages
      }

      // Use backendId if available for real API calls
      const idToUse = payload.backendId || listingId
      const { data } = await apiClient.put<PropertyResponse>(ENDPOINTS.properties.byId(idToUse), updateData)
      return mapListing(data, false)
    } catch {
      return null
    }
  },

  async getBookings(): Promise<AdminBooking[]> {
    const [data, listings] = await Promise.all([
      fetchAdminBookings(),
      this.getListings(),
    ])

    const hostsByListingId = new Map<number, { host: string; hostId?: number }>()
    listings.forEach((listing) => {
      hostsByListingId.set(listing.id, {
        host: listing.host,
        hostId: listing.hostId,
      })
    })

    const mapped = data.map((booking) => mapBooking(booking, hostsByListingId))
    return ensureUniqueIds(mapped)
  },

  async getUserBookings(userId: number | string): Promise<AdminBooking[]> {
    const { data } = await apiClient.get<AdminUserBookingResponse[]>(`${ENDPOINTS.admin.userBookings(userId)}?role=all`)

    const mapped = data.map(mapAdminBooking)
    return ensureUniqueIds(mapped)
  },

  async getPayments(): Promise<AdminPayment[]> {
    const data = await fetchAdminBookings()
    const mapped = toPayments(data)
    return ensureUniqueIds(mapped)
  },

  async getUserPayments(userId: number | string): Promise<AdminPayment[]> {
    const payments = await this.getPayments()
    return payments.filter((payment) => String(payment.userId) === String(userId))
  },

  async getUserListings(userId: number | string): Promise<AdminListing[]> {
    const { data } = await apiClient.get<AdminUserListingResponse[]>(ENDPOINTS.admin.userListings(userId))
    const mapped = data.map(mapAdminUserListing)
    return ensureUniqueIds(mapped)
  },

  async getUserConversation(userId: number | string): Promise<AdminUserChatMessage[]> {
    try {
      const { data } = await apiClient.get<AdminUserMessageResponse[]>(`${ENDPOINTS.admin.userMessages(userId)}?limit=100&direction=all`)

      return data.map((message) => ({
        id: String(message.id),
        senderId: toNumberId(message.senderId),
        receiverId: toNumberId(message.receiverId),
        content: message.content,
        createdAt: String(message.createdAt || ''),
      }))
    } catch {
      return []
    }
  },



  async getUserEarningsSummary(userId: number | string): Promise<AdminUserEarningsSummary> {
    const [overviewResponse, earningsResponse] = await Promise.all([
      apiClient.get<AdminUserOverviewResponse>(ENDPOINTS.admin.userOverview(userId)),
      apiClient.get<AdminUserEarningsResponse>(ENDPOINTS.admin.userEarnings(userId)),
    ])

    const overview = overviewResponse.data
    const earnings = earningsResponse.data

    return {
      totalEarnings: Number(earnings.totalEarnings || 0),
      paidBookings: Number(earnings.paidBookingsCount || 0),
      pendingBookings: Number(earnings.pendingPayoutCount || 0),
      listingsCount: Number(overview.listingsCount || 0),
      totalSpent: Number(overview.totalSpent || 0),
      currency: earnings.currency || 'USD',
    }
  },

  async getUserHistory(userId: number | string): Promise<AdminUserHistoryItem[]> {
    const { data } = await apiClient.get<AdminHistoryEventResponse[]>(`${ENDPOINTS.admin.userHistory(userId)}?limit=100`)

    return data.map((event) => ({
      id: String(event.id),
      label: String(event.type || 'EVENT').replaceAll('_', ' '),
      description: event.description || 'No description',
      when: String(event.createdAt || ''),
    }))
  },

  async updateUserProfile(user: AdminUser, payload: { name: string; email: string }): Promise<AdminUser> {
    const { data } = await apiClient.patch<UserDto>(ENDPOINTS.admin.updateUser(user.id), {
      fullName: payload.name,
      email: payload.email,
    })
    return mapUser(data)
  },

  async changeUserPassword(userId: number | string, newPassword: string): Promise<boolean> {
    const { data } = await apiClient.patch<AdminActionResponse>(ENDPOINTS.admin.updateUserPassword(userId), {
      newPassword,
      forceResetOnNextLogin: false,
    })
    return Boolean(data.success)
  },

  async deleteUser(userId: number | string): Promise<boolean> {
    const { data } = await apiClient.delete<AdminActionResponse>(ENDPOINTS.admin.deleteUser(userId))
    return Boolean(data.success)
  },

  async getUserPermissions(userId: number | string): Promise<AdminUserPermissions> {
    const { data } = await apiClient.get<AdminUserPermissions>(ENDPOINTS.admin.userPermissions(userId))
    return data
  },

  async getReports(): Promise<AdminReport[]> {
    const { data } = await apiClient.get<any[]>(ENDPOINTS.admin.reports)
    return (data || []).map((item, index) => ({
      id: toNumberId(item?.id) || index + 1,
      backendId: item?.id ? String(item.id) : undefined,
      reporter: String(item?.reporterLabel || item?.reporterId || 'System'),
      reason: String(item?.reason || item?.category || 'Report'),
      target: String(item?.targetLabel || item?.targetId || 'Unknown target'),
      targetType: String(item?.targetType || '').toLowerCase() === 'user' ? 'user' : 'listing',
      resolved: ['resolved', 'closed'].includes(String(item?.status || '').toLowerCase()),
    }))
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const [summaryResponse, payments] = await Promise.all([
      apiClient.get<AdminSummaryResponse>(ENDPOINTS.dashboard.adminSummary),
      this.getPayments(),
    ])

    const revenue = payments
      .filter((payment) => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0)

    return {
      totalUsers: Number(summaryResponse.data.totalUsers || 0),
      totalListings: Number(summaryResponse.data.totalProperties || 0),
      totalBookings: Number(summaryResponse.data.totalBookings || 0),
      revenue,
    }
  },

  async getRecentActivity(): Promise<ActivityRow[]> {
    const [pendingListings, bookings, users] = await Promise.all([
      fetchPendingListings(),
      fetchAdminBookings(),
      this.getUsers(),
    ])

    const items: ActivityRow[] = []

    pendingListings.slice(0, 2).forEach((listing, idx) => {
      items.push({
        id: idx + 1,
        action: 'Listing pending approval',
        actor: listing.hostId ? `Host #${listing.hostId}` : 'Host',
        when: String(listing.createdAt || 'recently').slice(0, 16),
      })
    })

    bookings.slice(0, 1).forEach((booking, idx) => {
      items.push({
        id: 20 + idx,
        action: `Booking ${String(booking.status || '').toLowerCase()}`,
        actor: booking.guestId ? `Guest #${booking.guestId}` : 'Guest',
        when: String(booking.createdAt || booking.checkInDate || 'recently').slice(0, 16),
      })
    })

    const bannedCount = users.filter((user) => user.status === 'banned').length
    items.push({
      id: 99,
      action: 'Banned accounts monitored',
      actor: 'Admin',
      when: `${bannedCount} banned users`,
    })

    return items
  },

  async toggleUserBan(userId: number | string): Promise<AdminUser | null> {
    const { data } = await apiClient.put<UserDto>(ENDPOINTS.admin.blockUser(userId))
    return mapUser(data)
  },

  async approveListing(listingId: number | string): Promise<AdminListing | null> {
    const { data } = await apiClient.put<PropertyResponse>(ENDPOINTS.admin.verifyProperty(listingId))
    return mapListing(data, false)
  },

  async rejectListing(listingId: number): Promise<void> {
    await apiClient.delete<void>(ENDPOINTS.properties.byId(listingId))
  },

  async deleteListing(listingId: number): Promise<void> {
    await apiClient.delete<void>(ENDPOINTS.properties.byId(listingId))
  },

  async cancelBooking(bookingId: number | string): Promise<AdminBooking | null> {
    const { data } = await apiClient.patch<BookingResponse>(ENDPOINTS.bookings.updateStatus(bookingId), {
      status: 'CANCELLED',
    })
    return mapBooking(data)
  },

  async getSettings(): Promise<AdminSettings> {
    const { data } = await apiClient.get<AdminSettings>(ENDPOINTS.admin.settings)
    return {
      ...defaultSettings,
      ...(data || {}),
    }
  },

  async saveSettings(nextSettings: AdminSettings): Promise<AdminSettings> {
    const { data } = await apiClient.put<AdminSettings>(ENDPOINTS.admin.settings, nextSettings)
    return {
      ...defaultSettings,
      ...(data || nextSettings),
    }
  },

  async getHostDemands(): Promise<HostDemand[]> {
    const { data } = await apiClient.get<HostDemandApiResponse[]>(ENDPOINTS.admin.hostDemands)
    return data.map(mapHostDemand)
  },

  async getHostDemandById(demandId: number | string): Promise<HostDemand | null> {
    const { data } = await apiClient.get<HostDemandApiResponse>(ENDPOINTS.admin.hostDemandById(demandId))
    return mapHostDemand(data)
  },

  async approveHostDemand(demandId: number | string): Promise<HostDemand | null> {
    const { data } = await apiClient.put<HostDemandApiResponse>(ENDPOINTS.admin.approveHostDemand(demandId))
    return mapHostDemand(data)
  },

  async rejectHostDemand(demandId: number | string, reason?: string): Promise<void> {
    await apiClient.put(ENDPOINTS.admin.rejectHostDemand(demandId), { reason })
  },
}

export async function getHostDemands(): Promise<HostDemand[]> {
  return adminApi.getHostDemands()
}

export async function approveHostDemand(demandId: number | string): Promise<HostDemand | null> {
  return adminApi.approveHostDemand(demandId)
}

export async function rejectHostDemand(demandId: number | string, reason?: string): Promise<void> {
  return adminApi.rejectHostDemand(demandId, reason)
}

