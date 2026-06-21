import type { UserDto } from '../utils/contracts'

/**
 * Demo Mode Configuration
 * ──────────────────────────────────────────────────────────────────────────────
 * Set DEMO_MODE to true to run the frontend without backend dependencies.
 * This enables testing and development with mock data.
 * 
 * To disable demo mode:
 * 1. Change DEMO_MODE to false
 * 2. Ensure backend is running on https://maskan-xzpw.onrender.com
 * 3. Restart the frontend dev server
 * ──────────────────────────────────────────────────────────────────────────────
 */

export const DEMO_MODE = false

/**
 * Demo user credentials for testing
 */
export const DEMO_CREDENTIALS = {
  email: 'demo@maskan.com',
  password: 'demo123',
  token: 'demo-token-12345',
  user: {
    id: 1,
    name: 'Demo User',
    email: 'demo@maskan.com',
    role: 'TENANT',
  } as UserDto,
}
