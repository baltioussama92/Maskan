import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import Table, { type TableColumn } from '../components/Table'
import { useAdminToast } from '../components/AdminLayout'
import { adminApi, getHostDemands, getHostDemandRowKey, type AdminUser, type HostDemand } from '../services/adminApi'
import { SectionTabs, StatusBadge, SurfaceCard } from '../components/ui'

function toAssetUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const normalized = path.replace(/\\/g, '/')
  if (normalized.startsWith('/')) return `http://localhost:8080${normalized}`
  return `http://localhost:8080/${normalized}`
}

function fileNameFromPath(path: string): string {
  if (!path) return 'file'
  const normalized = path.replace(/\\/g, '/')
  const parts = normalized.split('/')
  return parts[parts.length - 1] || 'file'
}

type VerificationTab = 'guest' | 'host'

export default function GuestVerificationsPage() {
  const { showToast } = useAdminToast()

  const [loading, setLoading] = useState(true)
  const [guestRequests, setGuestRequests] = useState<AdminUser[]>([])
  const [hostRequests, setHostRequests] = useState<HostDemand[]>([])
  const [selectedGuest, setSelectedGuest] = useState<AdminUser | null>(null)
  const [selectedHost, setSelectedHost] = useState<HostDemand | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState<VerificationTab>('guest')
  const [guestLoaded, setGuestLoaded] = useState(false)
  const [hostLoaded, setHostLoaded] = useState(false)

  useEffect(() => {
    let active = true

    const loadGuestRequests = async () => {
      if (guestLoaded) return
      setLoading(true)
      try {
        const guests = await adminApi.getGuestVerificationRequests()
        if (!active) return
        setGuestRequests(guests)
        setGuestLoaded(true)
      } catch {
        showToast('Failed to load guest verification requests.', 'error')
      } finally {
        if (active) setLoading(false)
      }
    }

    const loadHostRequests = async () => {
      if (hostLoaded) return
      setLoading(true)
      try {
        const hosts = await getHostDemands()
        if (!active) return
        setHostRequests(hosts)
        setHostLoaded(true)
      } catch {
        showToast('Failed to load host verification requests.', 'error')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (activeTab === 'guest') {
      loadGuestRequests()
    } else {
      loadHostRequests()
    }

    return () => {
      active = false
    }
  }, [activeTab, guestLoaded, hostLoaded, showToast])

  const guestColumns = useMemo<TableColumn<AdminUser>[]>(() => [
    { key: 'name', header: 'Guest', render: (row) => row.name },
    { key: 'email', header: 'Email', render: (row) => row.email },
    {
      key: 'submitted',
      header: 'Submitted',
      render: (row) => row.identitySubmittedAt ? new Date(row.identitySubmittedAt).toLocaleString() : 'Unknown',
    },
    {
      key: 'attachments',
      header: 'Attachments',
      render: (row) => String((row.governmentIdFiles?.length || 0) + (row.otherAttachmentFiles?.length || 0) + (row.selfieFile ? 1 : 0)),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge tone="warning">Pending review</StatusBadge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedGuest(row)
              setAction(null)
            }}
            className="rounded-lg border border-[#D8C8B3] bg-[#F9F3EA] px-2 py-1 text-[11px] font-semibold text-[#4B3A2E] transition hover:bg-[#EFE2D5]"
          >
            Review
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedGuest(row)
              setAction('approve')
            }}
            className="rounded-lg border border-[#BAD8C3] bg-[#EBF7F0] px-2 py-1 text-[11px] font-semibold text-[#2C6643] transition hover:bg-[#DDF1E5]"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedGuest(row)
              setAction('reject')
            }}
            className="rounded-lg border border-[#E3BBB5] bg-[#FAEBEA] px-2 py-1 text-[11px] font-semibold text-[#8E2E29] transition hover:bg-[#F5DEDB]"
          >
            Reject
          </button>
        </div>
      ),
    },
  ], [])

  const hostColumns = useMemo<TableColumn<HostDemand>[]>(() => [
    { key: 'host', header: 'Host', render: (row) => row.userName },
    { key: 'email', header: 'Email', render: (row) => row.userEmail },
    { key: 'city', header: 'City', render: (row) => row.proposedLocation },
    { key: 'ownership', header: 'Proof of Ownership', render: (row) => row.documents.length > 0 ? 'Provided' : 'Missing' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge tone={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'}>
          {row.status}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedHost(row)
              setAction(null)
            }}
            className="rounded-lg border border-[#D8C8B3] bg-[#F9F3EA] px-2 py-1 text-[11px] font-semibold text-[#4B3A2E] transition hover:bg-[#EFE2D5]"
          >
            Review
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedHost(row)
              setAction('approve')
            }}
            className="rounded-lg border border-[#BAD8C3] bg-[#EBF7F0] px-2 py-1 text-[11px] font-semibold text-[#2C6643] transition hover:bg-[#DDF1E5]"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedHost(row)
              setAction('reject')
            }}
            className="rounded-lg border border-[#E3BBB5] bg-[#FAEBEA] px-2 py-1 text-[11px] font-semibold text-[#8E2E29] transition hover:bg-[#F5DEDB]"
          >
            Reject
          </button>
        </div>
      ),
    },
  ], [])

  const closeModals = () => {
    setSelectedGuest(null)
    setSelectedHost(null)
    setAction(null)
    setNotes('')
  }

  const onConfirmGuest = async () => {
    if (!selectedGuest || !action) return

    setActionLoading(true)
    try {
      const targetId = selectedGuest.backendId || selectedGuest.id
      if (action === 'approve') {
        const updated = await adminApi.approveGuestVerification(targetId)
        setGuestRequests((prev) => prev.filter((item) => item.id !== updated.id))
      } else {
        const updated = await adminApi.rejectGuestVerification(targetId, notes)
        setGuestRequests((prev) => prev.filter((item) => item.id !== updated.id))
      }
      showToast(`Guest verification ${action}d successfully.`)
      closeModals()
    } catch {
      showToast(`Failed to ${action} guest verification.`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const onConfirmHost = async () => {
    if (!selectedHost || !action) return

    setActionLoading(true)
    try {
      if (action === 'approve') {
        const updated = await adminApi.approveHostDemand(selectedHost.backendId || selectedHost.id)
        if (updated) {
          setHostRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        }
      } else {
        await adminApi.rejectHostDemand(selectedHost.backendId || selectedHost.id, notes)
        setHostRequests((prev) => prev.map((item) => (
          item.id === selectedHost.id
            ? { ...item, status: 'rejected', notes: notes || item.notes }
            : item
        )))
      }

      showToast(`Host verification ${action}d successfully.`)
      closeModals()
    } catch {
      showToast(`Failed to ${action} host verification.`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const timelineEvents = [
    { at: '09:15', title: 'Documents uploaded', detail: 'Government ID and selfie submitted' },
    { at: '09:19', title: 'AI pre-check complete', detail: 'Face match score 93%' },
    { at: '09:26', title: 'Manual review pending', detail: 'Waiting for compliance approval' },
  ]

  const governmentIds = selectedGuest?.governmentIdFiles || []
  const otherAttachments = selectedGuest?.otherAttachmentFiles || []

  return (
    <div className="space-y-6">
      <SurfaceCard
        title="Verification Center"
        subtitle="Guest identity checks and host onboarding approvals"
        action={
          <SectionTabs
            options={[
              { key: 'guest', label: 'Guest Verification' },
              { key: 'host', label: 'Host Verification' },
            ]}
            value={activeTab}
            onChange={(next) => setActiveTab(next)}
          />
        }
      >
        {activeTab === 'guest' ? (
          <Table
            columns={guestColumns}
            rows={guestRequests}
            rowKey={(row) => row.backendId || `guest-${row.id}`}
            loading={loading}
            emptyText="No pending guest verification requests."
          />
        ) : (
          <Table
            columns={hostColumns}
            rows={hostRequests}
            rowKey={getHostDemandRowKey}
            loading={loading}
            emptyText="No host verification requests."
          />
        )}
      </SurfaceCard>

      <Modal
        open={Boolean(selectedGuest) && Boolean(action)}
        title={action === 'approve' ? 'Approve guest verification' : 'Reject guest verification'}
        message={selectedGuest ? `${selectedGuest.name} • ${selectedGuest.email}` : ''}
        confirmLabel={action === 'approve' ? 'Approve' : 'Reject'}
        isLoading={actionLoading}
        onCancel={closeModals}
        onConfirm={onConfirmGuest}
        footerSlot={action === 'reject' ? (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-semibold text-[#3A2D28]" htmlFor="guest-reject-notes">
              Notes
            </label>
            <textarea
              id="guest-reject-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Add reason and next steps"
              className="w-full rounded-lg border border-[#CBAD8D]/60 px-3 py-2 text-sm text-[#3A2D28] outline-none focus:border-[#3A2D28]"
            />
          </div>
        ) : undefined}
      />

      <Modal
        open={Boolean(selectedGuest) && !action}
        title={selectedGuest ? `Verification review: ${selectedGuest.name}` : 'Verification review'}
        message={selectedGuest ? selectedGuest.email : ''}
        confirmLabel="Close"
        onCancel={closeModals}
        onConfirm={closeModals}
        footerSlot={selectedGuest ? (
          <div className="mt-3 space-y-4 text-[#3A2D28]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C6654]">Government ID files</p>
              {governmentIds.length === 0 ? (
                <p className="mt-1 text-sm">No ID files uploaded.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {governmentIds.map((filePath, index) => (
                    <li key={`${filePath}-${index}`}>
                      <a className="text-sm text-[#6D533C] underline" href={toAssetUrl(filePath)} target="_blank" rel="noreferrer">
                        {fileNameFromPath(filePath)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C6654]">Selfie</p>
              {selectedGuest.selfieFile ? (
                <a className="text-sm text-[#6D533C] underline" href={toAssetUrl(selectedGuest.selfieFile)} target="_blank" rel="noreferrer">
                  {fileNameFromPath(selectedGuest.selfieFile)}
                </a>
              ) : (
                <p className="mt-1 text-sm">No selfie uploaded.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C6654]">Other attachments</p>
              {otherAttachments.length === 0 ? (
                <p className="mt-1 text-sm">No additional attachments.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {otherAttachments.map((filePath, index) => (
                    <li key={`${filePath}-${index}`}>
                      <a className="text-sm text-[#6D533C] underline" href={toAssetUrl(filePath)} target="_blank" rel="noreferrer">
                        {fileNameFromPath(filePath)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7C6654]">Verification History Timeline</p>
              <ol className="mt-2 space-y-2 rounded-xl border border-[#E6D8C5] bg-[#FCF7F0] p-3 text-sm">
                {timelineEvents.map((event) => (
                  <li key={event.at}>
                    <p className="font-semibold text-[#4A3A2E]">{event.at} - {event.title}</p>
                    <p className="text-[#715E4E]">{event.detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : undefined}
      />

      <Modal
        open={Boolean(selectedHost)}
        title={selectedHost ? `Host verification: ${selectedHost.userName}` : 'Host verification'}
        message={selectedHost ? `${selectedHost.userEmail} • ${selectedHost.proposedLocation}` : ''}
        confirmLabel={action ? (action === 'approve' ? 'Approve host' : 'Reject host') : 'Close'}
        onCancel={closeModals}
        onConfirm={action ? onConfirmHost : closeModals}
        footerSlot={selectedHost ? (
          <div className="mt-3 space-y-3 text-sm text-[#4E3D30]">
            <p><span className="font-semibold">Proof of ownership:</span> {selectedHost.documents.length > 0 ? 'Provided' : 'Not provided'}</p>
            <p><span className="font-semibold">ID status:</span> {selectedHost.idVerificationStatus}</p>
            <p><span className="font-semibold">Requested price:</span> ${selectedHost.proposedPrice}</p>
            <p><span className="font-semibold">Notes:</span> {selectedHost.notes || 'No notes provided.'}</p>

            {!action ? (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAction('approve')}
                  className="rounded-lg border border-[#BAD8C3] bg-[#EBF7F0] px-2.5 py-1 text-xs font-semibold text-[#2C6643] transition hover:bg-[#DDF1E5]"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setAction('reject')}
                  className="rounded-lg border border-[#E3BBB5] bg-[#FAEBEA] px-2.5 py-1 text-xs font-semibold text-[#8E2E29] transition hover:bg-[#F5DEDB]"
                >
                  Reject
                </button>
              </div>
            ) : null}

            {action === 'reject' ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#3A2D28]" htmlFor="host-reject-notes">
                  Rejection notes
                </label>
                <textarea
                  id="host-reject-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Add rejection notes for host applicant"
                  className="w-full rounded-lg border border-[#CBAD8D]/60 px-3 py-2 text-sm text-[#3A2D28] outline-none focus:border-[#3A2D28]"
                />
              </div>
            ) : null}
          </div>
        ) : undefined}
      />
    </div>
  )
}
