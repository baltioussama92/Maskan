import React from 'react'
import { CheckCircle2 } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import QRScannerModal from './QRScannerModal'

export default function HostBookingCard({
  bookingId,
  paymentMethod = 'CARD',
  onVerified,
  isScannerOpen,
  onOpenScanner,
  onCloseScanner,
}) {

  const handleDetected = async (targetBookingId, secretCode) => {
    const verified = await bookingService.verifyCheckIn(targetBookingId, secretCode)
    onVerified?.(targetBookingId, verified)
  }

  const isCash = String(paymentMethod).toUpperCase() === 'CASH'

  return (
    <>
      <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        {isCash
          ? 'Paiement cash : scannez ou saisissez le code secret du voyageur pour valider le check-in.'
          : 'Paiement escrow : scannez ou saisissez le code secret du voyageur pour déclencher le payout.'}
      </div>
      <button
        type="button"
        onClick={onOpenScanner}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition text-sm"
      >
        <CheckCircle2 className="w-4 h-4" />
        Valider la remise des clés
      </button>

      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={onCloseScanner}
        onDetected={handleDetected}
        bookingId={bookingId}
      />
    </>
  )
}
