import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Card from '../components/Card'
import Table, { type TableColumn } from '../components/Table'
import type { HostDemand } from '../services/adminApi'
import { getHostDemands, approveHostDemand, rejectHostDemand } from '../services/adminApi'
import { useAdminToast } from '../components/AdminLayout'
import HostDemandDetailsModal from '../components/HostDemandDetailsModal'

export default function HostDemandsPage() {
  const [demands, setDemands] = useState<HostDemand[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<HostDemand | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const { showToast } = useAdminToast()

  useEffect(() => {
    loadDemands()
  }, [])

  const loadDemands = async () => {
    setLoading(true)
    try {
      const data = await getHostDemands()
      setDemands(data)
    } catch (error) {
      console.error('Failed to load host demands:', error)
      showToast('Failed to load host demands', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDemand = (demand: HostDemand) => {
    setSelectedDemand(demand)
    setShowDetailsModal(true)
  }

  const handleApproveDemand = async (demand: HostDemand) => {
    try {
      await approveHostDemand(demand.backendId || demand.id.toString())
      setDemands(demands.map(d =>
        d.id === demand.id || d.backendId === demand.backendId
          ? { ...d, status: 'approved' as const }
          : d
      ))
      if (selectedDemand?.id === demand.id || selectedDemand?.backendId === demand.backendId) {
        setSelectedDemand(prev => prev ? { ...prev, status: 'approved' } : null)
      }
      showToast('Host demand approved — user role upgraded to HOST ✓', 'success')
      // Inform the admin that the user's JWT is stale until re-login.
      // The backend sends an in-app notification to the user automatically.
      setTimeout(() => {
        showToast(
          `ℹ️ ${demand.userName} must log out and back in to activate HOST privileges`,
          'info' as never
        )
      }, 1800)
    } catch (error) {
      console.error('Failed to approve host demand:', error)
      showToast('Failed to approve host demand', 'error')
    }
  }

  const handleRejectDemand = async (demand: HostDemand, reason?: string) => {
    try {
      await rejectHostDemand(demand.backendId || demand.id.toString(), reason)
      setDemands(demands.map(d =>
        d.id === demand.id || d.backendId === demand.backendId
          ? { ...d, status: 'rejected' as const }
          : d
      ))
      if (selectedDemand?.id === demand.id || selectedDemand?.backendId === demand.backendId) {
        setSelectedDemand(prev => prev ? { ...prev, status: 'rejected' } : null)
      }
      showToast('Host demand rejected', 'success')
    } catch (error) {
      console.error('Failed to reject host demand:', error)
      showToast('Failed to reject host demand', 'error')
    }
  }

  const filteredDemands = filterStatus === 'all'
    ? demands
    : demands.filter(d => d.status === filterStatus)

  const statuses = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  }

  const columns = useMemo<TableColumn<HostDemand>[]>(() => [
    {
      key: 'userName',
      header: 'User',
      render: (row) => row.userName,
    },
    {
      key: 'userEmail',
      header: 'Email',
      render: (row) => row.userEmail,
    },
    {
      key: 'proposedLocation',
      header: 'Location',
      render: (row) => row.proposedLocation,
    },
    {
      key: 'proposedPrice',
      header: 'Price',
      render: (row) => `$${row.proposedPrice}`,
    },
    {
      key: 'idVerificationStatus',
      header: 'ID Status',
      render: (row) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
            row.idVerificationStatus === 'verified'
              ? 'bg-green-100 text-green-800'
              : row.idVerificationStatus === 'rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
          }`}
        >
          {row.idVerificationStatus}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${statuses[row.status].color}`}>
          {statuses[row.status].label}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDemand(row)}
            className="inline-block px-3 py-1 rounded-lg bg-[#CBAD8D] text-white text-xs font-semibold hover:bg-[#B89968] transition"
          >
            View
          </button>
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleApproveDemand(row)}
                className="inline-block px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setSelectedDemand(row)
                  setShowDetailsModal(true)
                }}
                className="inline-block px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
              >
                Reject
              </button>
            </>
          )}
        </div>
      ),
    },
  ], [statuses])

  const stats = {
    total: demands.length,
    pending: demands.filter(d => d.status === 'pending').length,
    approved: demands.filter(d => d.status === 'approved').length,
    rejected: demands.filter(d => d.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#3A2D28]">Host Demands</h1>
        <p className="mt-1 text-sm text-[#6B5D54]">
          Review and manage user requests to become property hosts
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="text-sm font-medium text-[#6B5D54]">Total Demands</div>
            <div className="mt-2 text-3xl font-bold text-[#3A2D28]">{stats.total}</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <Card className="p-4 border-l-4 border-amber-500">
            <div className="text-sm font-medium text-[#6B5D54]">Pending</div>
            <div className="mt-2 text-3xl font-bold text-amber-600">{stats.pending}</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
        >
          <Card className="p-4 border-l-4 border-green-500">
            <div className="text-sm font-medium text-[#6B5D54]">Approved</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{stats.approved}</div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <Card className="p-4 border-l-4 border-red-500">
            <div className="text-sm font-medium text-[#6B5D54]">Rejected</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{stats.rejected}</div>
          </Card>
        </motion.div>
      </div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="flex gap-2 border-b border-[#D4C4B9] pb-4"
      >
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg transition capitalize ${
              filterStatus === status
                ? 'bg-[#3A2D28] text-white'
                : 'bg-[#E8DED2] text-[#3A2D28] hover:bg-[#D4C4B9]'
            }`}
          >
            {status}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <Table
            columns={columns}
            rows={filteredDemands}
            rowKey={(row) => row.id}
            loading={loading}
            emptyText={filterStatus === 'all' ? 'No host demands found' : `No ${filterStatus} host demands found`}
          />
        </Card>
      </motion.div>

      {/* Details Modal */}
      {showDetailsModal && selectedDemand && (
        <HostDemandDetailsModal
          demand={selectedDemand}
          onClose={() => setShowDetailsModal(false)}
          onApprove={() => {
            handleApproveDemand(selectedDemand)
            setShowDetailsModal(false)
          }}
          onReject={(reason: string) => {
            handleRejectDemand(selectedDemand, reason)
            setShowDetailsModal(false)
          }}
        />
      )}
    </div>
  )
}
