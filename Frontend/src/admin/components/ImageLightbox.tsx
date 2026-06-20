import { useEffect } from 'react'
import { adminModalBackdrop, adminModalPanel } from './ui'
import { toAssetUrl } from '../utils/assetUrl'

interface ImageLightboxProps {
  src: string
  alt: string
  onClose: () => void
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 ${adminModalBackdrop}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-[101] flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl leading-none text-white transition-colors duration-200 hover:bg-white/25"
        aria-label="Close preview"
      >
        ×
      </button>

      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className={`max-h-[92vh] max-w-[92vw] rounded-xl object-contain shadow-2xl ${adminModalPanel}`}
      />
    </div>
  )
}

interface ClickableImagePreviewProps {
  src?: string
  alt: string
  label: string
  onOpen: (src: string, alt: string) => void
  className?: string
}

export function ClickableImagePreview({
  src,
  alt,
  label,
  onOpen,
  className = 'max-h-48',
}: ClickableImagePreviewProps) {
  if (!src) return null

  const resolvedSrc = toAssetUrl(src)

  return (
    <div>
      <label className="text-xs font-semibold text-[#6B5D54]">{label}</label>
      <button
        type="button"
        onClick={() => onOpen(src, alt)}
        className="mt-2 block w-full overflow-hidden rounded-lg border border-[#D4C4B9] text-left transition-colors duration-200 hover:border-[#CBAD8D] focus:outline-none focus:ring-2 focus:ring-[#CBAD8D]"
        aria-label={`View full size: ${alt}`}
      >
        <img
          src={resolvedSrc}
          alt={alt}
          className={`w-full ${className} cursor-zoom-in object-cover`}
        />
        <span className="block bg-[#F3EBE0] px-3 py-1.5 text-[11px] font-medium text-[#6B5D54]">
          Click to enlarge
        </span>
      </button>
    </div>
  )
}
