import React, { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import { useNotifications } from '../context/NotificationContext'
import { paymentMethodService } from '../services/paymentMethodService'
import { preferencesService } from '../services/preferencesService'
import { supportTicketService } from '../services/supportTicketService'
import { useTheme } from '../context/ThemeContext'
import {
  Settings, User, Bell, Shield, Globe, Moon, Sun,
  Eye, EyeOff, Check, Loader2, Trash2, LogOut,
  ChevronRight, Smartphone, Mail, CreditCard, MapPin, HelpCircle,
} from 'lucide-react'

const USER_KEY = 'user'

// ── Sections ─────────────────────────────────────────────────
const SECTIONS = [
  { id: 'profile',       label: 'Profil',          icon: User   },
  { id: 'notifications', label: 'Notifications',   icon: Bell   },
  { id: 'security',      label: 'Sécurité',        icon: Shield },
  { id: 'preferences',   label: 'Préférences',     icon: Globe  },
  { id: 'payments',      label: 'Paiements',       icon: CreditCard },
  { id: 'privacy',       label: 'Confidentialité', icon: Shield },
  { id: 'support',       label: 'Support',         icon: HelpCircle },
  { id: 'danger',        label: 'Zone dangereuse',  icon: Trash2 },
]

// ── Toggle switch ────────────────────────────────────────────
function Toggle({ checked, onChange, label, description }) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between gap-4 py-3.5 text-left"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary-900">{label}</p>
        {description && <p className="text-xs text-primary-500 mt-0.5">{description}</p>}
      </div>
      <div className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
        checked ? 'bg-primary-500' : 'bg-primary-200'
      }`}>
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  )
}

// ── Form field ───────────────────────────────────────────────
function FormField({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-primary-500 flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-primary-200 bg-primary-100 text-sm text-primary-900 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"

// ── Main Component ──────────────────────────────────────────
export default function SettingsPage({ user, onUserUpdate, onLogout }) {
  const [searchParams] = useSearchParams()
  const { notify } = useNotifications()
  const [activeSection, setActiveSection] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [supportLoading, setSupportLoading] = useState(false)
  const [supportSaving, setSupportSaving] = useState(false)

  // Profile form
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+216 ',
    bio: user?.bio || '',
    city: user?.city || '',
    avatar: user?.avatar || '',
    language: 'Français',
    currency: 'DT',
  })

  // Notification settings
  const [notifs, setNotifs] = useState({
    bookings:  true,
    messages:  true,
    marketing: false,
    sms:       false,
    news:      true,
  })

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showActivity: true,
    allowMessages: true,
  })

  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentForm, setPaymentForm] = useState({
    cardholderName: '',
    brand: 'Visa',
    last4: '',
    expMonth: '',
    expYear: '',
    isDefault: false,
  })

  const [supportTickets, setSupportTickets] = useState([])
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  })

  // Security
  const [showPwd, setShowPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [pwdError, setPwdError] = useState('')

  const { isDark, toggleTheme } = useTheme()

  if (!user) return <Navigate to="/" replace />

  useEffect(() => {
    const section = searchParams.get('section')
    if (section && SECTIONS.some((item) => item.id === section)) {
      setActiveSection(section)
    }
  }, [searchParams])

  useEffect(() => {
    if (!user) return

    let active = true
    const loadPreferences = async () => {
      setPrefsLoading(true)
      try {
        const data = await preferencesService.getMy()
        if (!active) return
        setForm((prev) => ({
          ...prev,
          language: data?.language || prev.language,
          currency: data?.currency || prev.currency,
        }))
        if (data?.notifications) {
          setNotifs({
            bookings: Boolean(data.notifications.bookings),
            messages: Boolean(data.notifications.messages),
            marketing: Boolean(data.notifications.marketing),
            sms: Boolean(data.notifications.sms),
            news: Boolean(data.notifications.news),
          })
        }
        if (data?.privacy) {
          setPrivacy({
            showProfile: Boolean(data.privacy.showProfile),
            showActivity: Boolean(data.privacy.showActivity),
            allowMessages: Boolean(data.privacy.allowMessages),
          })
        }
      } catch (error) {
        if (!active) return
        notify?.('Impossible de charger vos preferences.', 'error')
      } finally {
        if (active) setPrefsLoading(false)
      }
    }

    const loadPayments = async () => {
      setPaymentsLoading(true)
      try {
        const data = await paymentMethodService.listMine()
        if (!active) return
        setPaymentMethods(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!active) return
        notify?.('Impossible de charger vos moyens de paiement.', 'error')
      } finally {
        if (active) setPaymentsLoading(false)
      }
    }

    const loadSupportTickets = async () => {
      setSupportLoading(true)
      try {
        const data = await supportTicketService.listMine()
        if (!active) return
        setSupportTickets(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!active) return
        notify?.('Impossible de charger vos tickets de support.', 'error')
      } finally {
        if (active) setSupportLoading(false)
      }
    }

    loadPreferences()
    loadPayments()
    loadSupportTickets()

    return () => {
      active = false
    }
  }, [user, notify])

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleProfileSave = async () => {
    setSaving(true)
    try {
      const response = await apiClient.put(ENDPOINTS.users.updateMe, {
        fullName: form.name.trim() || user.name,
        email: form.email.trim() || user.email,
        phone: form.phone?.trim() || undefined,
        bio: form.bio?.trim() || undefined,
        city: form.city?.trim() || undefined,
        avatar: form.avatar?.trim() || undefined,
      })

      const backendUser = response.data || {}
      const updated = {
        ...user,
        ...backendUser,
        name: backendUser.fullName || backendUser.name || form.name.trim() || user.name,
        email: backendUser.email || form.email.trim() || user.email,
        phone: backendUser.phone || form.phone?.trim() || user.phone,
        bio: backendUser.bio || form.bio?.trim() || user.bio,
        city: backendUser.city || form.city?.trim() || user.city,
        avatar: backendUser.avatar || form.avatar?.trim() || user.avatar,
      }

      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      onUserUpdate?.(updated)
      setSaved('profile')
      setTimeout(() => setSaved(''), 2000)
      notify?.('Profil mis a jour.', 'success')
    } catch (error) {
      console.error('Profile update failed:', error)
      notify?.('Impossible de mettre a jour le profil.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async () => {
    setPwdError('')
    if (!pwdForm.current || !pwdForm.next || !pwdForm.confirm) {
      setPwdError('Veuillez remplir tous les champs.')
      return
    }
    if (pwdForm.next.length < 8) {
      setPwdError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdError('Les mots de passe ne correspondent pas.')
      return
    }
    setSaving(true)
    try {
      await apiClient.patch(ENDPOINTS.users.updatePassword, {
        currentPassword: pwdForm.current,
        newPassword: pwdForm.next,
      })
      setPwdForm({ current: '', next: '', confirm: '' })
      setSaved('security')
      setTimeout(() => setSaved(''), 2000)
      notify?.('Mot de passe mis a jour.', 'success')
    } catch (error) {
      console.error('Password update failed:', error)
      setPwdError(error?.message || 'Échec de la mise à jour du mot de passe.')
      notify?.('Impossible de mettre a jour le mot de passe.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationsSave = async () => {
    setPrefsSaving(true)
    try {
      await preferencesService.update({ notifications: notifs })
      setSaved('notifications')
      setTimeout(() => setSaved(''), 2000)
      notify?.('Notifications mises a jour.', 'success')
    } catch (error) {
      notify?.('Impossible de mettre a jour vos notifications.', 'error')
    } finally {
      setPrefsSaving(false)
    }
  }

  const handlePreferencesSave = async () => {
    setPrefsSaving(true)
    try {
      await preferencesService.update({ language: form.language, currency: form.currency })
      setSaved('preferences')
      setTimeout(() => setSaved(''), 2000)
      notify?.('Preferences enregistrees.', 'success')
    } catch (error) {
      notify?.('Impossible de mettre a jour vos preferences.', 'error')
    } finally {
      setPrefsSaving(false)
    }
  }

  const handlePrivacySave = async () => {
    setPrefsSaving(true)
    try {
      await preferencesService.update({ privacy })
      setSaved('privacy')
      setTimeout(() => setSaved(''), 2000)
      notify?.('Parametres de confidentialite mis a jour.', 'success')
    } catch (error) {
      notify?.('Impossible de mettre a jour la confidentialite.', 'error')
    } finally {
      setPrefsSaving(false)
    }
  }

  const handlePaymentSubmit = async (event) => {
    event.preventDefault()
    if (!paymentForm.cardholderName.trim() || !paymentForm.last4.trim()) {
      notify?.('Veuillez renseigner le titulaire et les 4 derniers chiffres.', 'error')
      return
    }

    const expMonth = Number(paymentForm.expMonth)
    const expYear = Number(paymentForm.expYear)
    if (!expMonth || !expYear) {
      notify?.('Veuillez renseigner une date d\'expiration valide.', 'error')
      return
    }

    setPaymentSaving(true)
    try {
      const created = await paymentMethodService.create({
        cardholderName: paymentForm.cardholderName.trim(),
        brand: paymentForm.brand.trim(),
        last4: paymentForm.last4.trim(),
        expMonth,
        expYear,
        isDefault: paymentForm.isDefault,
      })

      setPaymentMethods((prev) => {
        const updated = paymentForm.isDefault
          ? prev.map((item) => ({ ...item, isDefault: false }))
          : prev
        return [created, ...updated]
      })
      setPaymentForm({
        cardholderName: '',
        brand: 'Visa',
        last4: '',
        expMonth: '',
        expYear: '',
        isDefault: false,
      })
      notify?.('Moyen de paiement ajoute.', 'success')
    } catch (error) {
      notify?.('Impossible d\'ajouter ce moyen de paiement.', 'error')
    } finally {
      setPaymentSaving(false)
    }
  }

  const handlePaymentDefault = async (id) => {
    setPaymentsLoading(true)
    try {
      const updated = await paymentMethodService.setDefault(id)
      setPaymentMethods((prev) => prev.map((item) => ({
        ...item,
        isDefault: item.id === updated.id,
      })))
      notify?.('Moyen de paiement par defaut mis a jour.', 'success')
    } catch (error) {
      notify?.('Impossible de definir ce moyen de paiement.', 'error')
    } finally {
      setPaymentsLoading(false)
    }
  }

  const handlePaymentRemove = async (id) => {
    setPaymentsLoading(true)
    try {
      await paymentMethodService.remove(id)
      setPaymentMethods((prev) => prev.filter((item) => item.id !== id))
      notify?.('Moyen de paiement supprime.', 'success')
    } catch (error) {
      notify?.('Impossible de supprimer ce moyen de paiement.', 'error')
    } finally {
      setPaymentsLoading(false)
    }
  }

  const handleSupportSubmit = async (event) => {
    event.preventDefault()
    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      notify?.('Veuillez remplir le sujet et le message.', 'error')
      return
    }

    setSupportSaving(true)
    try {
      const created = await supportTicketService.create({
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        priority: supportForm.priority,
      })
      setSupportTickets((prev) => [created, ...prev])
      setSupportForm({ subject: '', message: '', priority: 'medium' })
      notify?.('Votre demande a ete envoyee.', 'success')
    } catch (error) {
      notify?.('Impossible d\'envoyer votre demande.', 'error')
    } finally {
      setSupportSaving(false)
    }
  }

  return (
    <section className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5 text-primary-50" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primary-900">Paramètres</h1>
              <p className="text-sm text-primary-500">Gérez votre compte et vos préférences</p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar nav ───────────────────────────────── */}
          <motion.nav
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:w-56 shrink-0"
          >
            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
              {SECTIONS.map(s => {
                const active = activeSection === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                      active
                        ? 'bg-primary-500 text-primary-50 shadow-md'
                        : 'text-primary-600 hover:bg-primary-100'
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                  </button>
                )
              })}
            </div>
          </motion.nav>

          {/* ── Content ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 min-w-0"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {/* ─── Profile ─────────────────────────────── */}
                {activeSection === 'profile' && (
                  <Card title="Informations du profil" subtitle="Modifiez vos informations personnelles">
                    <div className="space-y-4">
                      <FormField icon={User} label="Nom complet">
                        <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Votre nom" />
                      </FormField>
                      <FormField icon={Mail} label="Adresse email">
                        <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="vous@exemple.com" />
                      </FormField>
                      <FormField icon={Smartphone} label="Téléphone">
                        <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+216 XX XXX XXX" />
                      </FormField>
                      <FormField icon={User} label="Biographie">
                        <textarea name="bio" value={form.bio} onChange={handleChange} className={inputClass + ' resize-none'} placeholder="Parlez un peu de vous..." rows="3" />
                      </FormField>
                      <FormField icon={MapPin} label="Ville">
                        <input name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="Votre ville" />
                      </FormField>
                      <FormField icon={User} label="URL de l'avatar">
                        <input name="avatar" value={form.avatar} onChange={handleChange} className={inputClass} placeholder="https://exemple.com/avatar.jpg" />
                      </FormField>
                    </div>
                    <SaveButton loading={saving} saved={saved === 'profile'} onClick={handleProfileSave} />
                  </Card>
                )}

                {/* ─── Notifications ───────────────────────── */}
                {activeSection === 'notifications' && (
                  <Card title="Notifications" subtitle="Choisissez comment vous souhaitez être notifié">
                    {prefsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-primary-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des preferences...
                      </div>
                    ) : (
                      <div className="divide-y divide-primary-200">
                        <Toggle
                          label="Mises à jour des réservations"
                          description="Confirmations, annulations et rappels"
                          checked={notifs.bookings}
                          onChange={() => setNotifs(p => ({ ...p, bookings: !p.bookings }))}
                        />
                        <Toggle
                          label="Nouveaux messages"
                          description="Notifications à chaque message reçu"
                          checked={notifs.messages}
                          onChange={() => setNotifs(p => ({ ...p, messages: !p.messages }))}
                        />
                        <Toggle
                          label="Emails promotionnels"
                          description="Offres spéciales et recommandations"
                          checked={notifs.marketing}
                          onChange={() => setNotifs(p => ({ ...p, marketing: !p.marketing }))}
                        />
                        <Toggle
                          label="Alertes SMS"
                          description="Notifications urgentes par SMS"
                          checked={notifs.sms}
                          onChange={() => setNotifs(p => ({ ...p, sms: !p.sms }))}
                        />
                        <Toggle
                          label="Nouveautés produit"
                          description="Nouvelles fonctionnalités et améliorations"
                          checked={notifs.news}
                          onChange={() => setNotifs(p => ({ ...p, news: !p.news }))}
                        />
                      </div>
                    )}
                    <SaveButton label="Enregistrer" loading={prefsSaving} saved={saved === 'notifications'} onClick={handleNotificationsSave} />
                  </Card>
                )}

                {/* ─── Security ────────────────────────────── */}
                {activeSection === 'security' && (
                  <Card title="Sécurité" subtitle="Changez votre mot de passe">
                    <div className="space-y-4">
                      <FormField icon={Shield} label="Mot de passe actuel">
                        <div className="relative">
                          <input
                            type={showPwd ? 'text' : 'password'}
                            value={pwdForm.current}
                            onChange={e => setPwdForm(p => ({ ...p, current: e.target.value }))}
                            className={inputClass + ' pr-10'}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwd(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400"
                          >
                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormField>
                      <FormField icon={Shield} label="Nouveau mot de passe">
                        <input
                          type="password"
                          value={pwdForm.next}
                          onChange={e => setPwdForm(p => ({ ...p, next: e.target.value }))}
                          className={inputClass}
                          placeholder="Min. 8 caractères"
                        />
                      </FormField>
                      <FormField icon={Shield} label="Confirmer le mot de passe">
                        <input
                          type="password"
                          value={pwdForm.confirm}
                          onChange={e => setPwdForm(p => ({ ...p, confirm: e.target.value }))}
                          className={inputClass}
                          placeholder="Retapez le mot de passe"
                        />
                      </FormField>
                      {pwdError && (
                        <p className="text-sm text-red-500 font-medium">{pwdError}</p>
                      )}
                    </div>
                    <SaveButton label="Mettre à jour" loading={saving} saved={saved === 'security'} onClick={handlePasswordSave} />
                  </Card>
                )}

                {/* ─── Preferences ─────────────────────────── */}
                {activeSection === 'preferences' && (
                  <Card title="Préférences" subtitle="Personnalisez votre expérience">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <FormField icon={Globe} label="Langue">
                        <select name="language" value={form.language} onChange={handleChange} className={inputClass + ' cursor-pointer'}>
                          <option>Francais</option>
                          <option>العربية</option>
                          <option>English</option>
                        </select>
                      </FormField>
                      <FormField icon={CreditCard} label="Devise">
                        <select name="currency" value={form.currency} onChange={handleChange} className={inputClass + ' cursor-pointer'}>
                          <option>DT</option>
                          <option>EUR</option>
                          <option>USD</option>
                        </select>
                      </FormField>
                    </div>
                    <div className="divide-y divide-primary-200">
                      <div className="flex items-center justify-between py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-primary-900">Mode sombre</p>
                          <p className="text-xs text-primary-500 mt-0.5">Activer le theme sombre</p>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
                            isDark ? 'bg-primary-500' : 'bg-primary-200'
                          }`}
                        >
                          <motion.div
                            animate={{ x: isDark ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center"
                          >
                            {isDark ? <Moon className="w-2.5 h-2.5 text-primary-500" /> : <Sun className="w-2.5 h-2.5 text-primary-300" />}
                          </motion.div>
                        </button>
                      </div>
                    </div>
                    <SaveButton label="Enregistrer" loading={prefsSaving} saved={saved === 'preferences'} onClick={handlePreferencesSave} />
                  </Card>
                )}

                {/* ─── Privacy ───────────────────────────── */}
                {activeSection === 'privacy' && (
                  <Card title="Confidentialite" subtitle="Gerez vos informations personnelles">
                    {prefsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-primary-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des preferences...
                      </div>
                    ) : (
                      <div className="divide-y divide-primary-200">
                        <Toggle
                          label="Afficher mon profil"
                          description="Votre profil reste visible sur la plateforme"
                          checked={privacy.showProfile}
                          onChange={() => setPrivacy((prev) => ({ ...prev, showProfile: !prev.showProfile }))}
                        />
                        <Toggle
                          label="Afficher mon activite"
                          description="Partagez vos avis et activites recentes"
                          checked={privacy.showActivity}
                          onChange={() => setPrivacy((prev) => ({ ...prev, showActivity: !prev.showActivity }))}
                        />
                        <Toggle
                          label="Autoriser les messages"
                          description="Les hôtes peuvent vous contacter"
                          checked={privacy.allowMessages}
                          onChange={() => setPrivacy((prev) => ({ ...prev, allowMessages: !prev.allowMessages }))}
                        />
                      </div>
                    )}
                    <SaveButton label="Enregistrer" loading={prefsSaving} saved={saved === 'privacy'} onClick={handlePrivacySave} />
                  </Card>
                )}

                {/* ─── Payments ─────────────────────────── */}
                {activeSection === 'payments' && (
                  <Card title="Moyens de paiement" subtitle="Gerez vos moyens de paiement">
                    {paymentsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-primary-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Chargement des moyens de paiement...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentMethods.length === 0 ? (
                          <p className="text-sm text-primary-500">Aucun moyen de paiement enregistre.</p>
                        ) : (
                          paymentMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between gap-3 rounded-xl border border-primary-200 bg-white px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-primary-900">{method.brand} •••• {method.last4}</p>
                                <p className="text-xs text-primary-500">{method.cardholderName} · Exp {String(method.expMonth).padStart(2, '0')}/{method.expYear}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {method.isDefault ? (
                                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Par defaut</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handlePaymentDefault(method.id)}
                                    className="text-xs font-semibold text-primary-600 hover:underline"
                                  >
                                    Definir par defaut
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handlePaymentRemove(method.id)}
                                  className="text-xs font-semibold text-red-600 hover:underline"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    <form onSubmit={handlePaymentSubmit} className="mt-6 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField icon={User} label="Titulaire">
                          <input
                            name="cardholderName"
                            value={paymentForm.cardholderName}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, cardholderName: event.target.value }))}
                            className={inputClass}
                            placeholder="Nom sur la carte"
                          />
                        </FormField>
                        <FormField icon={CreditCard} label="Reseau">
                          <select
                            name="brand"
                            value={paymentForm.brand}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, brand: event.target.value }))}
                            className={inputClass + ' cursor-pointer'}
                          >
                            <option>Visa</option>
                            <option>Mastercard</option>
                            <option>Amex</option>
                          </select>
                        </FormField>
                        <FormField icon={CreditCard} label="Derniers 4 chiffres">
                          <input
                            name="last4"
                            value={paymentForm.last4}
                            onChange={(event) => setPaymentForm((prev) => ({ ...prev, last4: event.target.value }))}
                            className={inputClass}
                            maxLength={4}
                            placeholder="1234"
                          />
                        </FormField>
                        <FormField icon={CreditCard} label="Expiration">
                          <div className="flex gap-2">
                            <input
                              name="expMonth"
                              value={paymentForm.expMonth}
                              onChange={(event) => setPaymentForm((prev) => ({ ...prev, expMonth: event.target.value }))}
                              className={inputClass}
                              placeholder="MM"
                            />
                            <input
                              name="expYear"
                              value={paymentForm.expYear}
                              onChange={(event) => setPaymentForm((prev) => ({ ...prev, expYear: event.target.value }))}
                              className={inputClass}
                              placeholder="YYYY"
                            />
                          </div>
                        </FormField>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-primary-700">
                        <input
                          type="checkbox"
                          checked={paymentForm.isDefault}
                          onChange={(event) => setPaymentForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                        />
                        Utiliser comme moyen de paiement par defaut
                      </label>
                      <div className="pt-4">
                        <motion.button
                          whileHover={!paymentSaving ? { scale: 1.02 } : {}}
                          whileTap={!paymentSaving ? { scale: 0.98 } : {}}
                          type="submit"
                          disabled={paymentSaving}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-sm font-bold text-primary-50 shadow-md transition-all disabled:opacity-70"
                        >
                          {paymentSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {paymentSaving ? 'Ajout en cours...' : 'Ajouter'}
                        </motion.button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* ─── Support ──────────────────────────── */}
                {activeSection === 'support' && (
                  <Card title="Support" subtitle="Besoin d'aide ? Contactez-nous">
                    <form onSubmit={handleSupportSubmit} className="space-y-4">
                      <FormField icon={HelpCircle} label="Sujet">
                        <input
                          name="subject"
                          value={supportForm.subject}
                          onChange={(event) => setSupportForm((prev) => ({ ...prev, subject: event.target.value }))}
                          className={inputClass}
                          placeholder="Ex: Probleme de reservation"
                        />
                      </FormField>
                      <FormField icon={Mail} label="Message">
                        <textarea
                          name="message"
                          value={supportForm.message}
                          onChange={(event) => setSupportForm((prev) => ({ ...prev, message: event.target.value }))}
                          className={inputClass + ' resize-none'}
                          rows="4"
                          placeholder="Decrivez votre demande"
                        />
                      </FormField>
                      <FormField icon={Shield} label="Priorite">
                        <select
                          name="priority"
                          value={supportForm.priority}
                          onChange={(event) => setSupportForm((prev) => ({ ...prev, priority: event.target.value }))}
                          className={inputClass + ' cursor-pointer'}
                        >
                          <option value="low">Basse</option>
                          <option value="medium">Moyenne</option>
                          <option value="high">Haute</option>
                        </select>
                      </FormField>
                      <div className="pt-4">
                        <motion.button
                          whileHover={!supportSaving ? { scale: 1.02 } : {}}
                          whileTap={!supportSaving ? { scale: 0.98 } : {}}
                          type="submit"
                          disabled={supportSaving}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-sm font-bold text-primary-50 shadow-md transition-all disabled:opacity-70"
                        >
                          {supportSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {supportSaving ? 'Envoi...' : 'Envoyer'}
                        </motion.button>
                      </div>
                    </form>

                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-primary-900 mb-3">Vos demandes recentes</h3>
                      {supportLoading ? (
                        <div className="flex items-center gap-2 text-sm text-primary-500">
                          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des demandes...
                        </div>
                      ) : supportTickets.length === 0 ? (
                        <p className="text-sm text-primary-500">Aucune demande pour le moment.</p>
                      ) : (
                        <div className="space-y-2">
                          {supportTickets.map((ticket) => (
                            <div key={ticket.id} className="rounded-xl border border-primary-200 bg-white px-4 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-primary-900">{ticket.subject}</p>
                                <span className="text-xs text-primary-500">{ticket.status}</span>
                              </div>
                              <p className="text-xs text-primary-500">Priorite: {ticket.priority}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* ─── Danger Zone ─────────────────────────── */}
                {activeSection === 'danger' && (
                  <Card title="Zone dangereuse" subtitle="Actions irréversibles" danger>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-primary-900">Se déconnecter</p>
                          <p className="text-xs text-primary-500 mt-0.5">Vous serez redirigé vers la page d'accueil</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onLogout?.()}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary-200 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition"
                        >
                          <LogOut className="w-4 h-4" /> Déconnexion
                        </motion.button>
                      </div>
                      <div className="border-t border-primary-200" />
                      <div className="flex items-center justify-between gap-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-red-600">Supprimer le compte</p>
                          <p className="text-xs text-primary-500 mt-0.5">Cette action est irréversible et supprimera toutes vos données</p>
                        </div>
                        <button
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-sm font-bold text-red-600 hover:bg-red-100 transition"
                        >
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── Card wrapper ─────────────────────────────────────────────
function Card({ title, subtitle, danger, children }) {
  return (
    <div className={`bg-primary-50 border rounded-3xl shadow-glass p-6 sm:p-8 ${
      danger ? 'border-red-200' : 'border-primary-200'
    }`}>
      <div className="mb-6">
        <h2 className={`text-lg font-extrabold ${danger ? 'text-red-600' : 'text-primary-900'}`}>{title}</h2>
        {subtitle && <p className="text-sm text-primary-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ── Save button ──────────────────────────────────────────────
function SaveButton({ onClick, loading, saved, label = 'Enregistrer' }) {
  return (
    <div className="mt-6 pt-6 border-t border-primary-200 flex items-center gap-3">
      <motion.button
        whileHover={!loading ? { scale: 1.02 } : {}}
        whileTap={!loading ? { scale: 0.98 } : {}}
        onClick={onClick}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-sm font-bold text-primary-50 shadow-md transition-all disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {loading ? 'Sauvegarde...' : label}
      </motion.button>
      <AnimatePresence>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm font-semibold text-emerald-600 flex items-center gap-1"
          >
            <Check className="w-4 h-4" /> Enregistré
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
