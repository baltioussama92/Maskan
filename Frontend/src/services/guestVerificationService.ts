import { API_BASE_URL, getStoredAuthToken } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import type { GuestVerificationSummary, VerificationStatus } from '../utils/contracts'

const API_ROOT = `${API_BASE_URL}/api`

interface VerifyOtpPayload {
  otp: string
}

interface VerifyPhoneOtpPayload {
  reqId: string
  code: string
}

interface SendPhoneOtpPayload {
  phoneNumber: string
}

interface SendPhoneOtpResponse {
  reqId: string
}

interface SendEmailOtpResponse {
  message?: string
  email?: string
  otp?: string
}

interface IdentitySubmissionPayload {
  governmentIds: File[]
  otherAttachments?: File[]
  selfie: File
}

interface ApiSummaryResponse {
  emailVerified?: boolean
  phoneVerified?: boolean
  identityStatus?: VerificationStatus
  verificationLevel?: 0 | 1 | 2 | 3
  rejectionReason?: string
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getStoredAuthToken()
  const headers = new Headers(init.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(`${API_ROOT}${path}`, {
    ...init,
    headers,
  })
}

function normalizeSummary(payload?: ApiSummaryResponse): GuestVerificationSummary {
  const emailVerified = Boolean(payload?.emailVerified)
  const phoneVerified = Boolean(payload?.phoneVerified)
  const identityStatus = payload?.identityStatus || 'not_verified'

  const derivedLevel = identityStatus === 'approved'
    ? 3
    : phoneVerified
    ? 2
    : emailVerified
    ? 1
    : 0

  return {
    emailVerified,
    phoneVerified,
    identityStatus,
    verificationLevel: payload?.verificationLevel ?? derivedLevel,
    rejectionReason: payload?.rejectionReason,
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await authedFetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    let parsedMessage: string | undefined
    try {
      const parsed = JSON.parse(errorBody)
      const message = parsed?.message || parsed?.error
      if (message) {
        parsedMessage = String(message)
      }
    } catch {
      // ignore parsing error and fallback to raw body
    }

    if (parsedMessage) {
      throw new Error(parsedMessage)
    }
    throw new Error(errorBody || 'Verification request failed')
  }

  const responseText = await response.text()
  if (!responseText) {
    return undefined as T
  }

  return JSON.parse(responseText) as T
}

export const guestVerificationService = {
  async getStatus(): Promise<GuestVerificationSummary> {
    const response = await authedFetch(ENDPOINTS.verifications.guestStatus)

    if (!response.ok) {
      throw new Error('Unable to fetch verification status')
    }

    const payload = await response.json()
    return normalizeSummary(payload)
  },

  async sendEmailOtp(userEmail: string): Promise<SendEmailOtpResponse> {
    const normalizedEmail = typeof userEmail === 'string'
      ? userEmail.trim().toLowerCase()
      : ''

    if (!normalizedEmail) {
      throw new Error('Email non trouvé')
    }

    console.log('Sending request to backend with:', normalizedEmail)

    const response = await authedFetch(ENDPOINTS.verifications.sendEmailOtp, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: normalizedEmail }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      let parsedMessage: string | undefined
      try {
        const parsed = JSON.parse(errorBody)
        const message = parsed?.message || parsed?.error
        if (message) {
          parsedMessage = String(message)
        }
      } catch {
        // ignore parsing error and fallback to raw body
      }

      if (parsedMessage) {
        throw new Error(parsedMessage)
      }
      throw new Error(errorBody || 'Verification request failed')
    }

    const responseText = await response.text()
    if (!responseText) {
      return {}
    }

    try {
      return JSON.parse(responseText) as SendEmailOtpResponse
    } catch {
      return { message: responseText }
    }
  },

  async verifyEmailOtp(payload: VerifyOtpPayload): Promise<GuestVerificationSummary> {
    // Ensure OTP is sent as a string (avoid numeric coercion issues)
    const body = { otp: String(payload.otp) }
    console.log('Sending verifyEmailOtp payload:', body)
    const data = await postJson<ApiSummaryResponse>(ENDPOINTS.verifications.verifyEmailOtp, body)
    return normalizeSummary(data)
  },

  async sendPhoneOtp(payload: SendPhoneOtpPayload): Promise<SendPhoneOtpResponse> {
    return postJson<SendPhoneOtpResponse>(ENDPOINTS.verifications.sendPhoneOtp, payload)
  },

  async verifyPhoneOtp(payload: VerifyPhoneOtpPayload): Promise<GuestVerificationSummary> {
    const data = await postJson<ApiSummaryResponse>(ENDPOINTS.verifications.verifyPhoneOtp, payload)
    return normalizeSummary(data)
  },

  async submitIdentity(payload: IdentitySubmissionPayload): Promise<GuestVerificationSummary> {
    const formData = new FormData()
    payload.governmentIds.forEach((file) => {
      formData.append('governmentIds', file)
    })
    payload.otherAttachments?.forEach((file) => {
      formData.append('otherAttachments', file)
    })
    formData.append('selfie', payload.selfie)

    const response = await authedFetch(ENDPOINTS.verifications.submitIdentity, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(errorBody || 'Unable to submit identity files')
    }

    const data = await response.json()
    return normalizeSummary(data)
  },
}
