import { useEffect, useState } from 'react'

export type TruncationLimits = { title: number; artist: number }

const DEFAULT_LIMITS: TruncationLimits = { title: 60, artist: 80 }

// Add an ellipsis at the end if string exceeds max length.
export function ellipsizeEnd(s: string | null | undefined, max = 60, ellipsis = '…'): string {
  if (!s) return ''
  return s.length > max ? s.slice(0, Math.max(0, max - 1)) + ellipsis : s
}

// Keep the first N comma-separated artists; append an ellipsis if clipped.
export function clipArtists(
  s: string | null | undefined,
  keep = 3,
  separator = ',',
  ellipsis = ' …'
): string {
  if (!s) return ''
  const parts = s
    .split(separator)
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length > keep ? parts.slice(0, keep).join(', ') + ellipsis : s
}

// Map viewport width -> truncation limits so long titles stay readable.
export function getTruncationLimits(w: number): TruncationLimits {
  if (w >= 1100) return { title: 170, artist: 170 }
  if (w >= 900) return { title: 150, artist: 150 }
  if (w >= 700) return { title: 120, artist: 120 }
  if (w >= 500) return { title: 90, artist: 90 }
  if (w >= 400) return { title: 50, artist: 50 }
  return { title: 36, artist: 24 }
}

// React hook that recomputes truncation limits any time the viewport size changes.
export function useTruncationLimits(
  getLimits: (w: number) => TruncationLimits = getTruncationLimits,
  initial: TruncationLimits = DEFAULT_LIMITS
): TruncationLimits {
  // lazy init for SSR safety
  const initialValue = typeof window !== 'undefined' ? getLimits(window.innerWidth) : initial

  const [limits, setLimits] = useState<TruncationLimits>(initialValue)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let frame: number | null = null
    const onResize = () => {
      // use rAF to avoid flooding setState during continuous resize
      if (frame != null) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        setLimits(getLimits(window.innerWidth))
        frame = null
      })
    }

    window.addEventListener('resize', onResize)
    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [getLimits])

  return limits
}
