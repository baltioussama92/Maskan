import { useEffect, useMemo, useState } from 'react'
import Modal from '../components/Modal'
import Table, { type TableColumn } from '../components/Table'
import { useAdminToast } from '../components/AdminLayout'
import { adminApi, type AdminBooking } from '../services/adminApi'
import { EmptyState, FilterSelect, MetricCard, SearchField, StatusBadge, SurfaceCard } from '../components/ui'

const money = (value: number) => `${value.toLocaleString('fr-TN')} DT`

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  awaiting_payment: 'Paiement attendu',
  awaiting_checkin: 'Check-in requis (cash)',
  paid_awaiting_checkin: 'Check-in requis (carte)',
  confirmed: 'Confirmée',
  completed: 'Terminée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
}

interface ExtendedBooking extends AdminBooking {
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'cash'
  refundRequested: boolean
  cancellationState: 'none' | 'requested' | 'approved'
}

export default function Bookings() {
  const { showToast } = useAdminToast()

  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<ExtendedBooking[]>([])
  const [target, setTarget] = useState<ExtendedBooking | null>(null)
  const [detailsTarget, setDetailsTarget] = useState<ExtendedBooking | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')

  useEffect(() => {
    let active = true

    adminApi.getBookings()
      .then((data) => {
        if (!active) return
        const mapped: ExtendedBooking[] = data.map((booking, index) => {
          const status = booking.status
          const paymentStatus = booking.paymentMethod === 'CASH'
            ? 'cash'
            : status === 'cancelled' || status === 'rejected'
              ? 'refunded'
              : status === 'paid_awaiting_checkin' || status === 'completed'
                ? 'paid'
                : 'pending'
          return {
            ...booking,
            paymentStatus,
            refundRequested: index % 4 === 0,
            cancellationState: status === 'cancelled' ? 'approved' : index % 5 === 0 ? 'requested' : 'none',
          }
        })
        setBookings(mapped)
      })
      .catch(() => showToast('Failed to load bookings.', 'error'))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [showToast])

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const lookup = `${booking.guest} ${booking.property} ${booking.host || ''}`.toLowerCase()
      const matchesSearch = lookup.includes(search.toLowerCase())
      const matchesBookingStatus = bookingStatusFilter === 'all' || booking.status === bookingStatusFilter
      const matchesPaymentStatus = paymentStatusFilter === 'all' || booking.paymentStatus === paymentStatusFilter
      return matchesSearch && matchesBookingStatus && matchesPaymentStatus
    })
  }, [bookings, search, bookingStatusFilter, paymentStatusFilter])

  const stats = {
    total: bookings.length,
    active: bookings.filter((booking) => ['confirmed', 'awaiting_payment', 'awaiting_checkin', 'paid_awaiting_checkin'].includes(booking.status)).length,
    refunds: bookings.filter((booking) => booking.refundRequested).length,
    cancellations: bookings.filter((booking) => booking.status === 'cancelled').length,
  }

  const columns = useMemo<TableColumn<ExtendedBooking>[]>(() => [
    { key: 'guest', header: 'Guest', render: (row) => row.guest },
    { key: 'host', header: 'Host', render: (row) => row.host || 'Unknown host' },
    { key: 'property', header: 'Property', render: (row) => row.property },
    { key: 'dates', header: 'Dates', render: (row) => row.dates },
    {
      key: 'amount',
      header: 'Total',
      render: (row) => money(row.totalPrice || 220),
    },
    {
      key: 'bookingStatus',
      header: 'Booking Status',
      render: (row) => (
        <StatusBadge
          tone={['confirmed', 'completed'].includes(row.status)
            ? 'success'
            : ['pending', 'awaiting_payment', 'awaiting_checkin', 'paid_awaiting_checkin'].includes(row.status)
              ? 'warning'
              : 'danger'}
        >
          {BOOKING_STATUS_LABELS[row.status] || row.status}
        </StatusBadge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => (
        <StatusBadge tone={row.paymentStatus === 'paid' ? 'success' : row.paymentStatus === 'pending' ? 'warning' : row.paymentStatus === 'cash' ? 'info' : 'info'}>
          {row.paymentStatus}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'whitespace-nowrap',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setDetailsTarget(row)}
            className="rounded-lg border border-[#D8C8B3] bg-[#F9F3EA] px-2 py-1 text-[11px] font-semibold text-[#4B3A2E] transition hover:bg-[#EFE2D5]"
          >
            Details
          </button>
          <button
            type="button"
            disabled={row.status === 'cancelled'}
            onClick={() => setTarget(row)}
            className="rounded-lg border border-[#E3BBB5] bg-[#FAEBEA] px-2 py-1 text-[11px] font-semibold text-[#8E2E29] transition hover:bg-[#F5DEDB] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ),
    },
  ], [])

  const onCancelBooking = async () => {
    if (!target) return

    setActionLoading(true)
    try {
      const updated = await adminApi.cancelBooking(target.backendId || target.id)
      if (!updated) {
        showToast('Failed to cancel booking.', 'error')
        return
      }

      setBookings((prev) => prev.map((booking) => (
        booking.id === updated.id
          ? {
              ...booking,
              ...updated,
              paymentStatus: 'refunded',
              cancellationState: 'approved',
              refundRequested: true,
            }
          : booking
      )))
      setTarget(null)
      showToast('Booking cancelled successfully.')
    } catch {
      showToast('Failed to cancel booking.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Bookings" value={stats.total} />
        <MetricCard label="Active Bookings" value={stats.active} tone="success" />
        <MetricCard label="Refund Requests" value={stats.refunds} tone="warning" />
        <MetricCard label="Cancelled" value={stats.cancellations} tone="danger" />
      </section>

      <SurfaceCard title="Booking Management" subtitle="Track reservations, refunds, cancellations and payment states">
        <div className="mb-4 grid gap-2 md:grid-cols-[1.6fr,1fr,1fr]">
          <SearchField value={search} onChange={setSearch} placeholder="Search guest, host, property" />
          <FilterSelect
            value={bookingStatusFilter}
            onChange={setBookingStatusFilter}
            options={[
              { label: 'All Booking Status', value: 'all' },
              { label: 'En attente', value: 'pending' },
              { label: 'Paiement attendu', value: 'awaiting_payment' },
              { label: 'Check-in requis (cash)', value: 'awaiting_checkin' },
              { label: 'Check-in requis (carte)', value: 'paid_awaiting_checkin' },
              { label: 'Confirmée', value: 'confirmed' },
              { label: 'Terminée', value: 'completed' },
              { label: 'Refusée', value: 'rejected' },
              { label: 'Annulée', value: 'cancelled' },
            ]}
          />
          <FilterSelect
            value={paymentStatusFilter}
            onChange={setPaymentStatusFilter}
            options={[
              { label: 'All Payment Status', value: 'all' },
              { label: 'Paid', value: 'paid' },
              { label: 'Cash', value: 'cash' },
              { label: 'Pending', value: 'pending' },
              { label: 'Refunded', value: 'refunded' },
            ]}
          />
        </div>

        {filtered.length === 0 && !loading ? (
          <EmptyState title="No bookings match your filters" body="Try broadening status filters or changing search text." />
        ) : (
          <Table
            columns={columns}
            rows={filtered}
            rowKey={(row) => row.id}
            loading={loading}
            emptyText="No bookings found."
          />
        )}
      </SurfaceCard>

      <Modal
        open={Boolean(target)}
        title="Cancel booking"
        message={target ? `Cancel booking for ${target.guest} at ${target.property}?` : ''}
        confirmLabel="Cancel booking"
        onCancel={() => setTarget(null)}
        onConfirm={onCancelBooking}
        isLoading={actionLoading}
      />

      <Modal
        open={Boolean(detailsTarget)}
        title={detailsTarget ? `Booking #${detailsTarget.id} details` : 'Booking details'}
        message={detailsTarget ? `${detailsTarget.guest} with ${detailsTarget.host || 'host'} at ${detailsTarget.property}` : ''}
        confirmLabel="Close"
        onCancel={() => setDetailsTarget(null)}
        onConfirm={() => setDetailsTarget(null)}
        footerSlot={detailsTarget ? (
          <div className="mt-3 grid gap-2 rounded-xl border border-[#E4D4C0] bg-[#FCF7F0] p-3 text-sm text-[#4E3D30]">
            <p><span className="font-semibold">Dates:</span> {detailsTarget.dates}</p>
            <p><span className="font-semibold">Payment:</span> {detailsTarget.paymentStatus}</p>
            <p><span className="font-semibold">Payment Method:</span> {detailsTarget.paymentMethod || 'CARD'}</p>
            <p><span className="font-semibold">Refund Request:</span> {detailsTarget.refundRequested ? 'Yes' : 'No'}</p>
            <p><span className="font-semibold">Cancellation:</span> {detailsTarget.cancellationState}</p>
            <p><span className="font-semibold">Total:</span> {money(detailsTarget.totalPrice || 220)}</p>
          </div>
        ) : undefined}
      />
    </div>
  )
}
