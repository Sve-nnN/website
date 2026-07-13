'use client'

import * as m from 'motion/react-m'
import type { ReactNode } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Generic hover-lift leaf using `whileHover`. Wraps `Card` (a plain
 * `forwardRef` div) rather than passing motion props through `Card` itself.
 * Duration/ease reuse the `--motion-fast`/`--ease-standard` token values
 * (Phase 7).
 */
export function TestimonialCardMotion({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()

  return (
    <m.div
      whileHover={reducedMotion ? {} : { y: -4 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </m.div>
  )
}
