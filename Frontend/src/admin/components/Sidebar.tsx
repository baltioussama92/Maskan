import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  CreditCard,
  FileCheck,
  FileWarning,
  Headset,
  Home,
  LayoutTemplate,
  LogOut,
  MessageSquareWarning,
  Settings,
  ShieldQuestion,
  UserCog,
  Users,
} from 'lucide-react'
import { cx } from './ui'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/listings', label: 'Property Management', icon: BookOpen },
  { to: '/admin/bookings', label: 'Booking Management', icon: BarChart3 },
  { to: '/admin/guest-verifications', label: 'Verification Center', icon: FileCheck },
  { to: '/admin/reports', label: 'Reports & Disputes', icon: ShieldQuestion },
  { to: '/admin/reports?panel=chat', label: 'Chat Moderation', icon: MessageSquareWarning },
  { to: '/admin/payments', label: 'Revenue & Payments', icon: CreditCard },
  { to: '/admin/reports?panel=support', label: 'Support Center', icon: Headset },
  { to: '/admin/settings?panel=content', label: 'Content Management', icon: LayoutTemplate },
  { to: '/admin/settings?panel=notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/dashboard?panel=analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
  onNavigateHome: () => void
  onNavigateExplore: () => void
  onLogout: () => void
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onNavigateHome,
  onNavigateExplore,
  onLogout,
}: SidebarProps) {
  const asideClasses = cx(
    'fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col border-r border-[#CFBAA1]/45 bg-gradient-to-b from-[#211711] via-[#2A1E17] to-[#35261E] p-4 text-[#F8F0E8] shadow-[0_20px_45px_rgba(22,14,9,0.42)] transition-all duration-300 lg:sticky lg:top-0',
    collapsed ? 'w-24' : 'w-80',
    mobileOpen ? 'translate-x-0' : '-translate-x-full',
    'lg:translate-x-0',
  )

  return (
    <>
      {mobileOpen ? (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-[#2A1E17]/45 backdrop-blur-[1px] lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside className={asideClasses}>
      <div
        className={cx(
          'mb-4 rounded-2xl border border-[#CFAE88]/30 bg-[#FFFFFF]/10 px-4 py-4 backdrop-blur opacity-0 motion-safe:animate-admin-fade-in-up motion-reduce:animate-none motion-reduce:opacity-100',
          collapsed && 'px-3',
        )}
      >
        <div className="flex items-center justify-between">
          <div className={cx('min-w-0', collapsed && 'text-center')}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F2E5D7]/75">Control Center</p>
            <p className="mt-1 truncate text-2xl font-black tracking-tight">MASKAN</p>
            {!collapsed ? <p className="mt-1 text-xs text-[#F2E5D7]/70">Administration command deck</p> : null}
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-lg border border-[#CFAE88]/40 bg-[#FFFFFF]/10 p-1.5 text-[#F9F0E6] transition hover:bg-[#FFFFFF]/20 lg:inline-flex"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <nav className="custom-admin-scroll space-y-1.5 overflow-y-auto pr-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-[#CBA97F]/25 text-[#FFFFFF] ring-1 ring-[#D7B488]/55'
                  : 'text-[#F2E5D7]/90 hover:bg-[#FFFFFF]/10 hover:text-[#FFFFFF]'
              }`
            )}
            onClick={onCloseMobile}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed ? label : null}
          </NavLink>
        ))}

        {!collapsed ? (
          <NavLink
            to="/admin/host-demands"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? 'border-[#D7B488]/60 bg-[#CBA97F]/25 text-white'
                  : 'border-[#D7B488]/30 text-[#EEDDC9] hover:bg-[#FFFFFF]/10'
              }`
            }
            onClick={onCloseMobile}
          >
            <UserCog size={16} className="shrink-0" />
            Host Demands
          </NavLink>
        ) : null}
      </nav>

      <div className={cx('mt-5 space-y-2 rounded-2xl border border-[#CBAD8D]/20 bg-[#FFFFFF]/10 p-3', collapsed && 'px-2')}>
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#F9F4ED] transition-colors duration-200 hover:bg-[#FFFFFF]/12"
          title={collapsed ? 'Home page' : undefined}
        >
          <Home size={15} />
          {!collapsed ? 'Home page' : null}
        </button>
        <button
          type="button"
          onClick={onNavigateExplore}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#F9F4ED] transition-colors duration-200 hover:bg-[#FFFFFF]/12"
          title={collapsed ? 'Explore listings' : undefined}
        >
          <Compass size={15} />
          {!collapsed ? 'Explore listings' : null}
        </button>
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#CBAD8D] px-3 py-2.5 text-sm font-semibold text-[#2F241F] transition-colors duration-200 hover:bg-[#D8B999]"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} />
          {!collapsed ? 'Logout' : null}
        </button>
      </div>
      </aside>
    </>
  )
}
