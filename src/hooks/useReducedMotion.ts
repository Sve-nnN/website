'use client'

import { useEffect, useState } from 'react'

/**
 * SSR-safe reduced-motion detection hook, replicating
 * `HeroGrainGradient.tsx`'s exact pattern (Phase 16): state initializes to
 * `false` to match what the server always renders (no `window` during SSR),
 * and the real `matchMedia` read happens inside a `useEffect` — a genuine
 * post-mount state update, not part of the hydration pass — to avoid a
 * hydration mismatch (React does not patch mismatched attributes after
 * hydration).
 *
 * Standalone hook, not tied to Motion's API — reusable by any future
 * animated component (Motion-based or not), per MOTION-02.
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}
