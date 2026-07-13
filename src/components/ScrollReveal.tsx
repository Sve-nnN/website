'use client'

import * as m from 'motion/react-m'
import type { ReactNode } from 'react'

import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Generic scroll-reveal leaf (fade+rise) using `whileInView`, which Motion's
 * docs confirm is IntersectionObserver-backed — no hand-rolled scroll
 * listener. `viewport={{ once: true }}` reveals the item the first time it
 * scrolls into view, then leaves it visible.
 *
 * When the user prefers reduced motion, the transition collapses to instant
 * (`duration: 0`) rather than skipping the wrapper entirely, so the DOM
 * structure stays identical either way — same discipline as
 * `HeroGrainGradient`'s `motionProps` branch.
 */
export function ScrollReveal({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()

  return (
    <m.div
      data-testid="scroll-reveal"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  )
}
