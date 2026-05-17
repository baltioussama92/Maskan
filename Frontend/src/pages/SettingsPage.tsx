import React, { useMemo, useState } from 'react'
import Navbar from '../components/ui/Navbar'
import Footer from '../components/Footer'
import './SettingsPage.css'
import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'

type UserRole = 'PROPRIETOR' | 'TENANT' | 'ADMIN' | 'OWNER'

interface StoredUser {
  id?: number | string
  fullName?: string
  name?: string
  email?: string
  role?: UserRole
}

interface AccountForm {
  fullName: string
  email: string
  phone: string
  language: string
  currency: string
}

interface NotificationForm {
  bookingUpdates: boolean
  marketingEmails: boolean
  productNews: boolean
}

interface EmailPreferencesForm {
  securityAlerts: boolean
  inboxAlerts: boolean
  supportUpdates: boolean
  newPropertyListings: boolean
}

const defaultAccount: AccountForm = {
  fullName: '',
  email: '',
  phone: '',
  language: 'English',
  currency: 'USD',
}

const defaultNotifications: NotificationForm = {
  bookingUpdates: true,
  marketingEmails: false,
  productNews: true,
}

const defaultEmailPreferences: EmailPreferencesForm = {
  securityAlerts: true,
  inboxAlerts: true,
  supportUpdates: true,
  newPropertyListings: true,
}

const readStoredUser = (): StoredUser | null => {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return null
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

const SettingsPage: React.FC = () => {
  const storedUser = useMemo(() => readStoredUser(), [])

  const [account, setAccount] = useState<AccountForm>({
    ...defaultAccount,
    fullName: storedUser?.fullName || storedUser?.name || 'Demo User',
    email: storedUser?.email || 'demo@maskan.com',
  })
  const [notifications, setNotifications] = useState<NotificationForm>(defaultNotifications)
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferencesForm>(defaultEmailPreferences)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [accountMessage, setAccountMessage] = useState('')
  const [securityMessage, setSecurityMessage] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const role = storedUser?.role || 'TENANT'

  const updateAccountField = (key: keyof AccountForm, value: string) => {
    setAccount((prev) => ({ ...prev, [key]: value }))
  }

  const updateNotificationField = (key: keyof NotificationForm) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const updateEmailPreferenceField = (key: keyof EmailPreferencesForm) => {
    setEmailPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault()

    setAccountMessage('')
    setSavingAccount(true)

    try {
      const { data } = await apiClient.put(ENDPOINTS.users.updateMe, {
        fullName: account.fullName,
      })

      const nextUser: StoredUser = {
        ...storedUser,
        name: data?.fullName || data?.name || account.fullName,
        fullName: data?.fullName || data?.name || account.fullName,
        email: data?.email || account.email,
        role,
      }

      localStorage.setItem('user', JSON.stringify(nextUser))
      setAccountMessage('Profile settings saved successfully.')
      window.dispatchEvent(new Event('storage'))
    } catch {
      setAccountMessage('Failed to save profile settings.')
    } finally {
      setSavingAccount(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSecurityMessage('Please complete all password fields.')
      return
    }

    if (newPassword.length < 8) {
      setSecurityMessage('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setSecurityMessage('New password and confirmation do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await apiClient.patch(ENDPOINTS.users.updatePassword, {
        currentPassword,
        newPassword,
      })
      setSecurityMessage('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to update password.'
      setSecurityMessage(message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="settings-page">
      <Navbar />

      <main className="settings-main">
        <section className="settings-hero">
          <div className="container settings-hero-inner">
            <p className="settings-eyebrow">Account Center</p>
            <h1>Settings</h1>
            <p>Manage your profile, notification preferences, and security details.</p>
          </div>
        </section>

        <section className="settings-content container">
          <div className="settings-grid">
            <article className="settings-card">
              <div className="settings-card-head">
                <h2>Profile</h2>
                <span className="settings-badge">{role}</span>
              </div>

              <form onSubmit={handleAccountSave} className="settings-form">
                <label>
                  Full Name
                  <input
                    type="text"
                    value={account.fullName}
                    onChange={(e) => updateAccountField('fullName', e.target.value)}
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    value={account.email}
                    onChange={(e) => updateAccountField('email', e.target.value)}
                    required
                  />
                </label>

                <label>
                  Phone
                  <input
                    type="tel"
                    value={account.phone}
                    onChange={(e) => updateAccountField('phone', e.target.value)}
                    placeholder="+1 555 123 456"
                  />
                </label>

                <div className="settings-row">
                  <label>
                    Language
                    <select
                      value={account.language}
                      onChange={(e) => updateAccountField('language', e.target.value)}
                    >
                      <option>English</option>
                      <option>French</option>
                      <option>Arabic</option>
                    </select>
                  </label>

                  <label>
                    Currency
                    <select
                      value={account.currency}
                      onChange={(e) => updateAccountField('currency', e.target.value)}
                    >
                      <option>USD</option>
                      <option>EUR</option>
                      <option>MAD</option>
                    </select>
                  </label>
                </div>

                <button type="submit" className="settings-btn" disabled={savingAccount}>
                  {savingAccount ? 'Saving...' : 'Save Profile'}
                </button>
                {accountMessage && <p className="settings-message success">{accountMessage}</p>}
              </form>
            </article>

            <article className="settings-card">
              <div className="settings-card-head">
                <h2>Notifications</h2>
              </div>

              <div className="toggle-list">
                <label className="toggle-item">
                  <div>
                    <strong>Booking updates</strong>
                    <p>Receive booking confirmations and status changes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.bookingUpdates}
                    onChange={() => updateNotificationField('bookingUpdates')}
                  />
                </label>

                <label className="toggle-item">
                  <div>
                    <strong>Marketing emails</strong>
                    <p>Get travel deals and recommendations.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.marketingEmails}
                    onChange={() => updateNotificationField('marketingEmails')}
                  />
                </label>

                <label className="toggle-item">
                  <div>
                    <strong>Product news</strong>
                    <p>Learn about new features and improvements.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.productNews}
                    onChange={() => updateNotificationField('productNews')}
                  />
                </label>
              </div>
            </article>

            <article className="settings-card">
              <div className="settings-card-head">
                <h2>Email Preferences</h2>
                <span className="settings-badge">Events</span>
              </div>

              <div className="toggle-list">
                <label className="toggle-item">
                  <div>
                    <strong>🔒 Security Alerts</strong>
                    <p>Get notified when your password changes.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPreferences.securityAlerts}
                    onChange={() => updateEmailPreferenceField('securityAlerts')}
                  />
                </label>

                <label className="toggle-item">
                  <div>
                    <strong>💬 Inbox Alerts</strong>
                    <p>Receive email when you get a new direct message.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPreferences.inboxAlerts}
                    onChange={() => updateEmailPreferenceField('inboxAlerts')}
                  />
                </label>

                <label className="toggle-item">
                  <div>
                    <strong>📋 Support Updates</strong>
                    <p>Get replies to your support tickets and reports.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPreferences.supportUpdates}
                    onChange={() => updateEmailPreferenceField('supportUpdates')}
                  />
                </label>

                <label className="toggle-item">
                  <div>
                    <strong>🏠 New Property Listings</strong>
                    <p>Stay updated with new properties matching your interests.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailPreferences.newPropertyListings}
                    onChange={() => updateEmailPreferenceField('newPropertyListings')}
                  />
                </label>
              </div>

              <div className="email-prefs-note">
                <p><em>💡 Tip: Disable any emails you don't want to receive. Your preferences are saved automatically.</em></p>
              </div>
            </article>
              <div className="settings-card-head">
                <h2>Security</h2>
              </div>

              <form onSubmit={handlePasswordSave} className="settings-form">
                <label>
                  Current password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </label>

                <label>
                  New password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>

                <label>
                  Confirm new password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>

                <button type="submit" className="settings-btn secondary" disabled={savingPassword}>
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
                {securityMessage && <p className="settings-message">{securityMessage}</p>}
              </form>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default SettingsPage
