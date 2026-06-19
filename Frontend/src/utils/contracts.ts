// ── TypeScript contracts matching backend DTOs ──────────────

// ── Roles ────────────────────────────────────────────────────
export type BackendRole = 'ADMIN' | 'HOST' | 'GUEST'
export type FrontendRole = 'ADMIN' | 'PROPRIETOR' | 'TENANT'

export const mapBackendRole = (role: string | undefined): FrontendRole => {
  if (role === 'HOST') return 'PROPRIETOR'
  if (role === 'GUEST') return 'TENANT'
  if (role === 'ADMIN') return 'ADMIN'
  return 'TENANT'
}

export const mapFrontendRole = (role: string | undefined): BackendRole => {
  if (role === 'PROPRIETOR') return 'HOST'
  if (role === 'TENANT') return 'GUEST'
  if (role === 'ADMIN') return 'ADMIN'
  return 'GUEST'
}

// ── Auth ─────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  role: BackendRole
}

export type VerificationStatus = 'not_verified' | 'pending' | 'approved' | 'rejected'

export interface GuestVerificationSummary {
  emailVerified: boolean
  phoneVerified: boolean
  identityStatus: VerificationStatus
  verificationLevel: 0 | 1 | 2 | 3
  rejectionReason?: string
}

export interface UserDto {
  id: string | number
  fullName?: string
  name?: string
  email: string
  role: string
  createdAt?: string
  isVerified?: boolean
  banned?: boolean
  emailVerified?: boolean
  phoneVerified?: boolean
  identityStatus?: VerificationStatus
  verificationLevel?: 0 | 1 | 2 | 3
  rejectionReason?: string
  trustScore?: number
  governmentIdFiles?: string[]
  otherAttachmentFiles?: string[]
  selfieFile?: string
  identitySubmittedAt?: string
  // frontend-only extras
  username?: string
  bio?: string
  avatar?: string
  preferences?: UserPreferences
}

export interface NotificationPreferences {
  bookings: boolean
  messages: boolean
  marketing: boolean
  news: boolean
}

export interface PrivacyPreferences {
  showProfile: boolean
  showActivity: boolean
  allowMessages: boolean
}

export interface UserPreferences {
  language: string
  currency: string
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
}

export interface UpdateUserPreferencesRequest {
  language?: string
  currency?: string
  notifications?: Partial<NotificationPreferences>
  privacy?: Partial<PrivacyPreferences>
}

export interface PaymentMethodRequest {
  cardholderName: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault?: boolean
}

export interface PaymentMethodResponse {
  id: string
  cardholderName: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
  createdAt?: string
}

export interface SupportTicketRequest {
  subject: string
  message: string
  priority?: string
}

export interface SupportTicketResponse {
  id: string
  subject: string
  priority: string
  status: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  token: string
  role: string
  user: UserDto
}

// ── Properties ───────────────────────────────────────────────
export interface PropertyRequest {
  title: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  pricePerNight: number
  images?: string[]
  houseRules?: string
}

export interface PropertyResponse {
  id: string | number
  title: string
  description?: string
  location: string
  latitude?: number
  longitude?: number
  pricePerNight?: number
  price?: number
  images?: string[]
  hostId?: string
  createdAt?: string
  // frontend-enriched fields (not from backend)
  ownerId?: number
  image?: string
  currency?: string
  period?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  houseRules?: string
  rating?: number
  reviewCount?: number
  type?: string
  badge?: string
  badgeColor?: string
  available?: boolean
  amenities?: string[]
  host?: { name: string; avatar: string }
  lat?: number
  lng?: number
  averageRating?: number
}

export interface PropertyQuery {
  location?: string
  minPrice?: number | string
  maxPrice?: number | string
  available?: boolean
  type?: string
  page?: number
  size?: number
  sort?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ── Bookings ─────────────────────────────────────────────────
export type BookingStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'AWAITING_CHECKIN'
  | 'PAID_AWAITING_CHECKIN'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED'

export type BookingPaymentMethod = 'CARD' | 'CASH'

export interface BookingRequest {
  listingId: string
  checkInDate: string
  checkOutDate: string
  guests?: number
  paymentMethod?: BookingPaymentMethod
}

export interface BookingResponse {
  id: string
  listingId: string
  guestId: string
  checkInDate: string
  checkOutDate: string
  status: BookingStatus
  guests?: number
  guestCount?: number
  totalPrice?: number
  createdAt?: string
  listingTitle?: string
  listingLocation?: string
  listingImage?: string
  property?: {
    title?: string
    image?: string
    location?: string
  }
  guestEmail?: string
  guestName?: string
  stripePaymentIntentId?: string
  checkInSecretCode?: string
  paymentMethod?: BookingPaymentMethod
}

export interface PaymentCheckoutResponse {
  bookingId: string
  status: BookingStatus
  stripePaymentIntentId: string
  checkInSecretCode: string
  message: string
}

export interface VerifyCheckInRequest {
  secretCode: string
}

export interface CheckInVerificationResponse {
  bookingId: string
  status: BookingStatus
  message: string
}

export interface BookingCancellationResponse {
  bookingId: string
  status: BookingStatus
  cancellationType: 'FREE' | 'TAXED' | 'LATE'
  totalPrice: number
  refundAmount: number
  penaltyAmount: number
  daysUntilCheckIn: number
  daysSinceReservation: number
  trustScorePenalty: number
  guestTrustScore?: number
  message: string
}

export interface UnavailableDateRange {
  checkInDate: string
  checkOutDate: string
}

export interface BookedDateRange {
  startDate: string
  endDate: string
}

// ── Reviews ──────────────────────────────────────────────────
export interface ReviewRequest {
  propertyId: string
  rating: number
  description?: string
}

export interface ReviewResponse {
  id: string
  propertyId: string
  userId?: string
  reservationId?: string
  authorName?: string
  rating: number
  description: string
  createdAt: string
}

// ── Messages ─────────────────────────────────────────────────
export interface MessageRequest {
  receiverId: string | number
  content: string
  timestamp?: string
}

export interface MessageResponse {
  id: string
  senderId: string | number
  receiverId: string | number
  content: string
  createdAt: string
}

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface ConnectionRequestActionRequest {
  targetUserId: string
}

export interface ConnectionRequestResponse {
  id: string
  requesterId: string
  receiverId: string
  status: ConnectionStatus
  createdAt?: string
  respondedAt?: string
}

// ── Admin ────────────────────────────────────────────────────
export interface UpdateUserProfileRequest {
  fullName: string
  avatar?: string
}

// ── API error shape ──────────────────────────────────────────
export interface ApiError {
  status: number
  message?: string
  payload?: { message?: string }
}
