'use client'

import { LazyMotion, domAnimation, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Sitewide root provider for `motion` (MOTION-01/MOTION-02). Wraps the app
 * exactly once (in `[locale]/layout.tsx`) so the LazyMotion animation
 * runtime is paid a single time, not per component.
 *
 * `domAnimation` (not `domMax`/the full `motion` component import) keeps the
 * shared feature set to the smallest sufficient bundle (~19-20KB gzip per
 * research) — every future `m.*` usage (Phase 28 rollout too) must render
 * inside this provider to resolve its animation features.
 *
 * `MotionConfig reducedMotion="user"` is Motion's own OS-preference gate for
 * every `m.*` component's animation values; the separate `useReducedMotion()`
 * hook exists for logic that doesn't go through `m.*` at all.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
