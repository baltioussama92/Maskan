import React, { useEffect, useState } from 'react'
import { Loader2, Star } from 'lucide-react'

export default function ReviewForm({
  onSubmitReview,
  onSubmitted,
  submitting = false,
  error = '',
  disabled = false,
  submitLabel = "Publier l'avis",
  successLabel = 'Avis publié',
  initialRating = 0,
  initialComment = '',
}) {
  const [rating, setRating] = useState(initialRating)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState(initialComment)
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setRating(initialRating)
  }, [initialRating])

  useEffect(() => {
    setComment(initialComment)
  }, [initialComment])

  const activeError = error || localError

  const stars = [1, 2, 3, 4, 5]

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (disabled || submitting) {
      return
    }

    if (rating < 1 || rating > 5) {
      setLocalError('Veuillez sélectionner une note entre 1 et 5.')
      return
    }

    setLocalError('')

    try {
      await onSubmitReview?.({
        rating,
        comment: comment.trim(),
      })
      setRating(0)
      setHoverRating(0)
      setComment('')
      onSubmitted?.()
    } catch (submissionError) {
      if (!error) {
        setLocalError(submissionError?.message || 'Impossible de publier votre avis pour le moment.')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 rounded-2xl border border-primary-200 bg-white p-4 shadow-sm">
      <div>
        <label className="text-xs font-semibold text-primary-700">Note</label>
        <div className="mt-2 flex items-center gap-1.5">
          {stars.map((value) => {
            const isActive = value <= (hoverRating || rating)

            return (
              <button
                type="button"
                key={value}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                onFocus={() => setHoverRating(value)}
                onBlur={() => setHoverRating(0)}
                className="rounded-full p-1 transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300"
                aria-label={`${value} étoile${value > 1 ? 's' : ''}`}
              >
                <Star
                  className={`h-6 w-6 transition-colors duration-150 ${isActive ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-primary-700">Commentaire</label>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Partagez votre expérience de séjour..."
          className="mt-1 w-full resize-none rounded-xl border border-primary-200 bg-primary-50 px-3 py-2.5 text-sm text-primary-800 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {activeError && <p className="text-xs font-medium text-red-500">{activeError}</p>}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#A65B32] to-[#8f4d2a] px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        <span>{submitting ? 'Publication...' : submitLabel}</span>
      </button>

      {successLabel ? <p className="sr-only">{successLabel}</p> : null}
    </form>
  )
}