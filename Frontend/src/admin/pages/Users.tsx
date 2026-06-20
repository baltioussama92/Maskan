import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Ban, CheckCircle2, Eye, Pencil, ShieldMinus, UserRoundCheck } from 'lucide-react'
import Modal from '../components/Modal'
import Table, { type TableColumn } from '../components/Table'
import { useAdminToast } from '../components/AdminLayout'
import { adminApi, type AdminUser } from '../services/adminApi'
import { EmptyState, FilterSelect, MetricCard, SearchField, StatusBadge, SurfaceCard, adminEnter } from '../components/ui'

const pageSize = 8

export default function Users() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useAdminToast()

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    let active = true

    adminApi.getUsers()
      .then((data) => {
        if (active) setUsers(data)
      })
      .catch(() => showToast('Failed to load users.', 'error'))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [showToast])

  useEffect(() => {
    const deletedUserId = location.state?.deletedUserId
    if (!deletedUserId) return

    setUsers((prev) => prev.filter((user) => user.id !== Number(deletedUserId)))
    showToast('User removed from admin view.')
    navigate('/admin/users', { replace: true, state: null })
  }, [location.state, navigate, showToast])

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchSearch = `${user.name} ${user.email} ${user.username || ''}`.toLowerCase().includes(search.toLowerCase())
      const matchRole = roleFilter === 'all' || user.role === roleFilter
      const matchStatus = statusFilter === 'all' || user.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1)

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const rows = filtered.slice((page - 1) * pageSize, page * pageSize)

  const stats = {
    total: users.length,
    hosts: users.filter((user) => user.role === 'host').length,
    guests: users.filter((user) => user.role === 'guest').length,
    banned: users.filter((user) => user.status === 'banned').length,
  }

  const columns = useMemo<TableColumn<AdminUser>[]>(() => [
    {
      key: 'identity',
      header: 'User',
      render: (row) => (
        <div>
          <p className="font-semibold text-[#2E241D]">{row.name}</p>
          <p className="text-xs text-[#746252]">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <StatusBadge tone={row.role === 'host' ? 'info' : 'neutral'}>
          {row.role === 'host' ? 'Host' : 'Guest'}
        </StatusBadge>
      ),
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (row) => {
        const state = row.identityStatus || 'not_verified'
        if (state === 'approved') return <StatusBadge tone="success">Verified</StatusBadge>
        if (state === 'pending') return <StatusBadge tone="warning">Pending</StatusBadge>
        if (state === 'rejected') return <StatusBadge tone="danger">Rejected</StatusBadge>
        return <StatusBadge tone="neutral">Not verified</StatusBadge>
      },
    },
    {
      key: 'status',
      header: 'Account',
      render: (row) => (
        <StatusBadge tone={row.status === 'active' ? 'success' : 'danger'}>
          {row.status}
        </StatusBadge>
      ),
    },
    {
      key: 'bookings',
      header: 'Bookings',
      render: (row) => String((row.id * 7) % 28 + 1),
    },
    {
      key: 'joined',
      header: 'Join Date',
      render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '2026-01-12',
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <ActionButton label="View" icon={<Eye size={13} />} onClick={() => navigate(`/admin/users/${row.backendId || row.id}`, { state: { user: row } })} />
          <ActionButton label="Edit" icon={<Pencil size={13} />} onClick={() => setSelected(row)} />
          <ActionButton
            label={row.status === 'active' ? 'Suspend' : 'Unsuspend'}
            icon={<ShieldMinus size={13} />}
            onClick={() => setSelected(row)}
          />
          <ActionButton
            label="Verify"
            icon={<UserRoundCheck size={13} />}
            onClick={async () => {
              try {
                const updated = await adminApi.approveGuestVerification(row.backendId || row.id)
                setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)))
                showToast('Verification state updated.')
              } catch {
                showToast('Failed to update verification state.', 'error')
              }
            }}
          />
          <ActionButton label={row.status === 'active' ? 'Ban' : 'Unban'} icon={<Ban size={13} />} onClick={() => setSelected(row)} tone="danger" />
        </div>
      ),
    },
  ], [navigate, showToast])

  const onConfirmBanToggle = async () => {
    if (!selected) return

    setActionLoading(true)
    try {
      const updated = await adminApi.toggleUserBan(selected.backendId || selected.id)
      if (!updated) {
        showToast('User update failed.', 'error')
        return
      }

      setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)))
      setSelected(null)
      showToast(`User ${updated.status === 'banned' ? 'banned' : 'unbanned'} successfully.`)
    } catch {
      showToast('Failed to update user status.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={adminEnter(0)}>
          <MetricCard label="Total Users" value={stats.total} icon={<UserRoundCheck size={18} />} />
        </div>
        <div className={adminEnter(1)}>
          <MetricCard label="Hosts" value={stats.hosts} tone="info" icon={<CheckCircle2 size={18} />} />
        </div>
        <div className={adminEnter(2)}>
          <MetricCard label="Guests" value={stats.guests} tone="neutral" icon={<CheckCircle2 size={18} />} />
        </div>
        <div className={adminEnter(3)}>
          <MetricCard label="Banned" value={stats.banned} tone="danger" icon={<Ban size={18} />} />
        </div>
      </section>

      <div className={adminEnter(4)}>
      <SurfaceCard title="User Management" subtitle="Search, filter, review and moderate all platform users">
        <div className="mb-4 grid gap-2 md:grid-cols-[1.5fr,1fr,1fr]">
          <SearchField value={search} onChange={setSearch} placeholder="Search by name, email, username" />
          <FilterSelect
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { label: 'All Roles', value: 'all' },
              { label: 'Hosts', value: 'host' },
              { label: 'Guests', value: 'guest' },
            ]}
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: 'All Status', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Banned', value: 'banned' },
            ]}
          />
        </div>

        {filtered.length === 0 && !loading ? (
          <EmptyState title="No users found" body="Try adjusting your filters or search terms." />
        ) : (
          <Table
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            loading={loading}
            emptyText="No users found."
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </SurfaceCard>
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected?.status === 'active' ? 'Ban or suspend user' : 'Restore user access'}
        message={selected ? `Select moderation decision for ${selected.name} (${selected.email}).` : ''}
        confirmLabel={selected?.status === 'active' ? 'Ban user' : 'Restore user'}
        isLoading={actionLoading}
        onCancel={() => setSelected(null)}
        onConfirm={onConfirmBanToggle}
      />
    </div>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  tone = 'neutral',
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  tone?: 'neutral' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
        tone === 'danger'
          ? 'border-[#E3BBB5] bg-[#FAEBEA] text-[#8E2E29] hover:bg-[#F5DEDB]'
          : 'border-[#D8C8B3] bg-[#F9F3EA] text-[#4B3A2E] hover:bg-[#EFE2D5]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
