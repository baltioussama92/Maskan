import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HostDemand } from '../services/adminApi'
import ImageLightbox, { ClickableImagePreview } from './ImageLightbox'
import { toAssetUrl } from '../utils/assetUrl'

interface HostDemandDetailsModalProps {
  demand: HostDemand
  onClose: () => void
  onApprove: () => void
  onReject: (reason: string) => void
}

interface LightboxState {
  src: string
  alt: string
}

export default function HostDemandDetailsModal({
  demand,
  onClose,
  onApprove,
  onReject,
}: HostDemandDetailsModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  const openLightbox = (src: string, alt: string) => {
    setLightbox({ src: toAssetUrl(src), alt })
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      await onApprove()
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }
    setLoading(true)
    try {
      await onReject(rejectionReason)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl dark:bg-slate-900 dark:shadow-[0_20px_45px_rgba(2,6,23,0.6)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#3A2D28] to-[#5B4A42] px-6 py-4 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Host Demand Details</h2>
              <p className="text-sm text-white/80 mt-1">{demand.userName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* User Info */}
            <section>
              <h3 className="text-lg font-bold text-[#3A2D28] mb-4">1. Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FBF8F3] p-4 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-[#6B5D54]">Full Name</label>
                  <p className="mt-1 text-[#3A2D28]">{demand.userName}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B5D54]">Email</label>
                  <p className="mt-1 text-[#3A2D28]">{demand.userEmail}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B5D54]">Phone</label>
                  <p className="mt-1 text-[#3A2D28]">{demand.userPhone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B5D54]">Submitted Date</label>
                  <p className="mt-1 text-[#3A2D28]">{new Date(demand.submittedDate).toLocaleDateString()}</p>
                </div>
                {demand.bio && (
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-[#6B5D54]">Bio</label>
                    <p className="mt-1 text-[#3A2D28]">{demand.bio}</p>
                  </div>
                )}
              </div>
            </section>

            {/* ID Verification */}
            <section>
              <h3 className="text-lg font-bold text-[#3A2D28] mb-4">2. ID Verification</h3>
              <div className="bg-[#FBF8F3] p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-xs font-semibold text-[#6B5D54]">ID Document Status</label>
                    <div className="mt-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          demand.idVerificationStatus === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : demand.idVerificationStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {demand.idVerificationStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ClickableImagePreview
                    src={demand.idDocument}
                    alt="Government ID document"
                    label="ID Document Preview"
                    onOpen={openLightbox}
                  />
                  <ClickableImagePreview
                    src={demand.selfieUrl}
                    alt="Applicant selfie"
                    label="Selfie Preview"
                    onOpen={openLightbox}
                  />
                </div>

                {!demand.idDocument && !demand.selfieUrl && (
                  <p className="text-sm text-[#6B5D54]">No identity documents uploaded.</p>
                )}
              </div>
            </section>

            {/* Property Info */}
            <section>
              <h3 className="text-lg font-bold text-[#3A2D28] mb-4">3. Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FBF8F3] p-4 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-[#6B5D54]">Proposed Location</label>
                  <p className="mt-1 text-[#3A2D28]">{demand.proposedLocation}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B5D54]">Proposed Price/Night</label>
                  <p className="mt-1 text-[#3A2D28] font-semibold">${demand.proposedPrice}</p>
                </div>
              </div>
            </section>

            {/* House Pictures */}
            {demand.housePictures && demand.housePictures.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-[#3A2D28] mb-4">4. House Pictures</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {demand.housePictures.map((pic, idx) => (
                    <button
                      key={`${pic}-${idx}`}
                      type="button"
                      onClick={() => openLightbox(pic, `House picture ${idx + 1}`)}
                      className="aspect-video overflow-hidden rounded-lg border border-[#D4C4B9] text-left transition hover:border-[#CBAD8D] focus:outline-none focus:ring-2 focus:ring-[#CBAD8D]"
                      aria-label={`View house picture ${idx + 1}`}
                    >
                      <img
                        src={toAssetUrl(pic)}
                        alt={`House ${idx + 1}`}
                        className="h-full w-full cursor-zoom-in object-cover transition hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Documents */}
            {demand.documents && demand.documents.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-[#3A2D28] mb-4">5. Supporting Documents</h3>
                <div className="space-y-2">
                  {demand.documents.map((doc, idx) => (
                    <a
                      key={`${doc}-${idx}`}
                      href={toAssetUrl(doc)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 bg-[#FBF8F3] rounded-lg hover:bg-[#E8DED2] transition"
                    >
                      <span className="text-xl">📄</span>
                      <span className="text-sm font-medium text-[#3A2D28]">Document {idx + 1}</span>
                      <span className="ml-auto text-xs text-[#6B5D54]">Download</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Status & Actions */}
            <section>
              <h3 className="text-lg font-bold text-[#3A2D28] mb-4">Status & Decision</h3>
              <div className="bg-[#FBF8F3] p-4 rounded-xl">
                <label className="text-xs font-semibold text-[#6B5D54]">Current Status</label>
                <div className="mt-2 mb-4">
                  <span
                    className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold capitalize ${
                      demand.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : demand.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {demand.status}
                  </span>
                </div>

                {demand.status === 'pending' && (
                  <div className="space-y-4">
                    {!showRejectForm ? (
                      <div className="flex gap-3">
                        <button
                          onClick={handleApprove}
                          disabled={loading}
                          className="flex-1 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : '✓ Approve as Host'}
                        </button>
                        <button
                          onClick={() => setShowRejectForm(true)}
                          className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-[#6B5D54]">Reason for Rejection</label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Explain why this host application is being rejected (e.g., incomplete documents, invalid ID, etc.)"
                            className="w-full mt-2 p-3 border border-[#D4C4B9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CBAD8D]"
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={handleReject}
                            disabled={loading || !rejectionReason.trim()}
                            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
                          >
                            {loading ? 'Processing...' : 'Confirm Rejection'}
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectForm(false)
                              setRejectionReason('')
                            }}
                            className="flex-1 py-2 rounded-lg bg-gray-400 text-white font-semibold hover:bg-gray-500 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </motion.div>
      </motion.div>

      {lightbox ? (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </AnimatePresence>
  )
}
