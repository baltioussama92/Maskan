import { useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

const MOBILE_MAX_WIDTH = 767

/**
 * Returns true when animations should be minimized:
 * - OS prefers-reduced-motion
 * - viewport <= 767px (mobile)
 */
export function useAppMotion() {
  const prefersReducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    const onChange = (event) => setIsMobile(event.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const reduceMotion = prefersReducedMotion || isMobile

  return {
    reduceMotion,
    isMobile,
    prefersReducedMotion,
    /** Use as Framer Motion transition override */
    instant: { duration: 0 },
    /** Subtle transition for desktop only */
    subtle: reduceMotion
      ? { duration: 0 }
      : { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    /** Fade-only — safe on mobile */
    fade: reduceMotion
      ? { duration: 0 }
      : { duration: 0.2, ease: 'easeOut' },
  }
}
