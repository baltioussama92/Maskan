import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../api/apiClient'
import { ENDPOINTS } from '../api/endpoints'
import {
  Settings, User, Bell, Shield, Globe, Moon, Sun,
  Eye, EyeOff, Check, Loader2, Trash2, LogOut,
  ChevronRight, Smartphone, Mail, CreditCard, MapPin,
} from 'lucide-react'

const USER_KEY = 'user'

// ── Sections ─────────────────────────────────────────────────
const SECTIONS = [
  { id: 'profile',       label: 'Profil',          icon: User   },
  { id: 'notifications', label: 'Notifications',   icon: Bell   },
  { id: 'security',      label: 'Sécurité',        icon: Shield },
  { id: 'preferences',   label: 'Préférences',     icon: Globe  },
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
  const [activeSection, setActiveSection] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

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

  // Security
  const [showPwd, setShowPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [pwdError, setPwdError] = useState('')

  // Theme
  const [darkMode, setDarkMode] = useState(false)

  if (!user) return <Navigate to="/" replace />

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
    } catch (error) {
      console.error('Profile update failed:', error)
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
    } catch (error) {
      console.error('Password update failed:', error)
      setPwdError(error?.message || 'Échec de la mise à jour du mot de passe.')
    } finally {
      setSaving(false)
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField icon={Globe} label="Langue">
                          <select name="language" value={form.language} onChange={handleChange} className={inputClass + ' cursor-pointer'}>
                            <option>Français</option>
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
                    <div className="divide-y divide-primary-200">
                      <div className="flex items-center justify-between py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-primary-900">Mode sombre</p>
                          <p className="text-xs text-primary-500 mt-0.5">Activer le thème sombre (bientôt disponible)</p>
                        </div>
                        <button
                          onClick={() => setDarkMode(v => !v)}
                          className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
                            darkMode ? 'bg-primary-500' : 'bg-primary-200'
                          }`}
                        >
                          <motion.div
                            animate={{ x: darkMode ? 20 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center"
                          >
                            {darkMode ? <Moon className="w-2.5 h-2.5 text-primary-500" /> : <Sun className="w-2.5 h-2.5 text-primary-300" />}
                          </motion.div>
                        </button>
                      </div>
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
