import React from 'react'
import { motion } from 'framer-motion'
import {
  User, Settings, Lock, Bell, CreditCard, LogOut,
  ChevronRight, Shield, DollarSign, HelpCircle
} from 'lucide-react'

const SettingsMenu = [
  {
    icon: User,
    label: 'Edit Profile',
    description: 'Update your personal information',
    action: 'edit_profile',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    icon: Settings,
    label: 'Account Settings',
    description: 'Manage your account preferences',
    action: 'account_settings',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  {
    icon: Lock,
    label: 'Security',
    description: 'Change password and security options',
    action: 'security',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  {
    icon: Bell,
    label: 'Notifications',
    description: 'Manage notification preferences',
    action: 'notifications',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    icon: CreditCard,
    label: 'Payment Methods',
    description: 'Add or manage payment methods',
    action: 'payment_methods',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    icon: Shield,
    label: 'Privacy & Safety',
    description: 'Control your privacy settings',
    action: 'privacy',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    icon: HelpCircle,
    label: 'Help & Support',
    description: 'Get help or contact support',
    action: 'help',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
  },
  {
    icon: LogOut,
    label: 'Logout',
    description: 'Sign out of your account',
    action: 'logout',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    isLast: true,
  },
]

export default function ProfileSettings({ onSettingClick = () => {}, isOpen = true }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 20 }}
      transition={{ duration: 0.3 }}
      className="hidden lg:block lg:col-span-1"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Settings</h2>

        <div className="space-y-3">
          {SettingsMenu.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSettingClick(item.action)}
                className={`w-full text-left ${item.bgColor} border ${item.borderColor} rounded-xl p-3 transition-all hover:shadow-md group ${
                  item.isLast ? 'mt-6 pt-6 border-t-2' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${item.color} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">{item.label}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${item.color} flex-shrink-0 group-hover:translate-x-1 transition-transform`} />
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Account Status</span>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Verification</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Verified</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Premium</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">Basic</span>
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          onClick={() => onSettingClick('help')}
          className="mt-6 w-full p-4 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-xl text-center cursor-pointer"
        >
          <p className="text-sm font-semibold text-primary-900">Need help?</p>
          <p className="text-xs text-primary-700 mt-1">Contact our support team</p>
        </motion.button>
      </div>
    </motion.aside>
  )
}
