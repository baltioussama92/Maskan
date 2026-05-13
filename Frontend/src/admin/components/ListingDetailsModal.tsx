import React, { useEffect, useState } from 'react'
import { adminApi, type ListingDetails } from '../services/adminApi'

interface ListingDetailsModalProps {
  listingId: number | null
  backendId?: string
  open: boolean
  onClose: () => void
  onUpdate?: (updated: ListingDetails) => void
}

export default function ListingDetailsModal({
  listingId,
  backendId,
  open,
  onClose,
  onUpdate,
}: ListingDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [listing, setListing] = useState<ListingDetails | null>(null)
  const [editData, setEditData] = useState<Partial<ListingDetails>>({})
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string>('')

  const toDataUrl = (file: File): Promise<string> => (
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(file)
    })
  )

  const allImages = [...existingImages, ...newImagePreviews]

  useEffect(() => {
    if (open && listingId) {
      setLoading(true)
      setIsEditing(false)
      adminApi
        .getListingDetails(listingId, backendId)
        .then((data) => {
          if (data) {
            setListing(data)
            setEditData(data)
            const initialImages = data.images || []
            setExistingImages(initialImages)
            setNewImageFiles([])
            setNewImagePreviews([])
            setSelectedImage(initialImages[0] || '')
          }
        })
        .catch(() => {
          setListing(null)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [open, listingId, backendId])

  useEffect(() => {
    if (allImages.length === 0) {
      if (selectedImage !== '') {
        setSelectedImage('')
      }
      return
    }

    if (!allImages.includes(selectedImage)) {
      setSelectedImage(allImages[0])
    }
  }, [allImages, selectedImage])

  const handleSave = async () => {
    if (!listing) return
    setSaving(true)
    try {
      const updated = await adminApi.updateListing(listing.id, {
        ...editData,
        backendId,
        images: existingImages,
        imageFiles: newImageFiles.length > 0 ? newImageFiles : undefined,
      })
      if (updated) {
        setListing(updated)
        setEditData(updated)
        onUpdate?.(updated)
        setIsEditing(false)
        const updatedImages = updated.images || []
        setExistingImages(updatedImages)
        setNewImageFiles([])
        setNewImagePreviews([])
        setSelectedImage(updatedImages[0] || '')
      }
    } catch {
      console.error('Failed to update listing')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData(listing || {})
    setIsEditing(false)
    const initialImages = listing?.images || []
    setExistingImages(initialImages)
    setNewImageFiles([])
    setNewImagePreviews([])
    setSelectedImage(initialImages[0] || '')
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const previews = await Promise.all(files.map((file) => toDataUrl(file)))
      setNewImageFiles((prev) => [...prev, ...files])
      setNewImagePreviews((prev) => [...prev, ...previews])
      if (!selectedImage && previews[0]) {
        setSelectedImage(previews[0])
      }
    } finally {
      e.target.value = ''
    }
  }

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== index))
  }

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== index))
    setNewImagePreviews((prev) => prev.filter((_, idx) => idx !== index))
  }

  const startEditing = () => {
    if (!listing) return
    setEditData(listing)
    const initialImages = listing.images || []
    setExistingImages(initialImages)
    setNewImageFiles([])
    setNewImagePreviews([])
    setSelectedImage(initialImages[0] || '')
    setIsEditing(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-900">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-[#3A2D28] dark:text-slate-100">
            {listing?.title || 'Listing Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-slate-100"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex gap-3 items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#CBAD8D]" />
              <span className="text-gray-500">Loading details...</span>
            </div>
          ) : listing ? (
            <div className="space-y-6">
              {/* Main Image */}
              {allImages.length > 0 && (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={selectedImage || allImages[0]}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, idx) => (
                    <button
                      key={`${image}-${idx}`}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-lg border ${selectedImage === image ? 'border-[#CBAD8D]' : 'border-gray-200'}`}
                    >
                      <img src={image} alt={`Listing image ${idx + 1}`} className="h-16 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Image Edit Section (only in edit mode) */}
              {isEditing && (
                <div className="rounded-lg border-2 border-dashed border-[#CBAD8D] bg-[#FBF7F3] p-4">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700 mb-2 block">Add Images</span>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-[#CBAD8D] bg-white py-6 cursor-pointer hover:bg-[#FBF7F3] transition"
                      >
                        <span className="text-2xl">IMG</span>
                        <span className="text-sm font-medium text-[#3A2D28]">
                          Click to upload one or more images
                        </span>
                        <span className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</span>
                      </label>
                    </div>
                  </label>

                  {allImages.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {existingImages.map((image, idx) => (
                        <div key={`existing-${idx}`} className="relative overflow-hidden rounded-lg border border-gray-200">
                          <img src={image} alt={`Existing image ${idx + 1}`} className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(idx)}
                            className="absolute right-1 top-1 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/75"
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      {newImagePreviews.map((image, idx) => (
                        <div key={`new-${idx}`} className="relative overflow-hidden rounded-lg border border-[#CBAD8D]">
                          <img src={image} alt={`New image ${idx + 1}`} className="h-24 w-full object-cover" />
                          <span className="absolute left-1 top-1 rounded bg-[#CBAD8D] px-2 py-1 text-xs text-white">New</span>
                          <button
                            type="button"
                            onClick={() => removeNewImage(idx)}
                            className="absolute right-1 top-1 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/75"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Status & Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                    listing.status === 'approved'
                      ? 'bg-[#EBE3DB] text-[#3A2D28]'
                      : 'bg-[#CBAD8D] text-[#3A2D28]'
                  }`}>
                    {listing.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rating</p>
                  <p className="text-lg font-semibold">* {listing.rating?.toFixed(1) ?? 'N/A'}</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4 border-t border-gray-200 pt-4">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title || ''}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CBAD8D] focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{listing.title}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location || ''}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CBAD8D] focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-gray-700">{listing.location}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CBAD8D] focus:outline-none"
                      rows={3}
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-gray-700">{listing.description}</p>
                  )}
                </div>

                {/* Price & Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Prix par nuit (DT)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.pricePerNight || 0}
                        onChange={(e) => setEditData({ ...editData, pricePerNight: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CBAD8D] focus:outline-none"
                      />
                    ) : (
                          <p className="mt-1 text-lg font-semibold">{listing.pricePerNight?.toLocaleString('fr-TN')} DT</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Area (sq m)</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.area || 0}
                        onChange={(e) => setEditData({ ...editData, area: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CBAD8D] focus:outline-none"
                      />
                    ) : (
                      <p className="mt-1 text-gray-700">{listing.area} m2</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.bedrooms || 0}
                        onChange={(e) => setEditData({ ...editData, bedrooms: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CBAD8D] focus:outline-none"
                      />
                    ) : (
                      <p className="mt-1 text-gray-700">{listing.bedrooms}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bathrooms</label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editData.bathrooms || 0}
                        onChange={(e) => setEditData({ ...editData, bathrooms: Number(e.target.value) })}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#CBAD8D] focus:outline-none"
                      />
                    ) : (
                      <p className="mt-1 text-gray-700">{listing.bathrooms}</p>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                {listing.amenities && listing.amenities.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Amenities</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {listing.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="inline-block rounded-full bg-[#EBE3DB] px-3 py-1 text-xs text-[#3A2D28]"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host Info */}
                {listing.hostId && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Host ID</label>
                    <p className="mt-1 text-gray-700">#{listing.hostId}</p>
                  </div>
                )}

                {/* Created Date */}
                {listing.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-600">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load listing details.</p>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        {listing && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-lg bg-[#CBAD8D] px-4 py-2 text-sm font-medium text-white hover:bg-[#CBAD8D]/90 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
                <button
                  onClick={startEditing}
                  className="rounded-lg bg-[#CBAD8D] px-4 py-2 text-sm font-medium text-white hover:bg-[#CBAD8D]/90"
                >
                  Edit Listing
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
