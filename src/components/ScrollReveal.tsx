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
 *
 * `priority` (28-04 gap-closure, LCP fix): content that is already visible
 * on initial load (above-the-fold grid items) must not be SSR-rendered with
 * `opacity:0` — Lighthouse's LCP measurement only counts a paint once the
 * element is actually visible, so hiding an above-the-fold LCP candidate
 * behind Motion's hydration + `whileInView`/IntersectionObserver reveal
 * measurably delays LCP (root-caused in 28-04's regression gate). Note that
 * `initial={false}` alone does NOT fix this: Motion's `whileInView` still
 * emits a hidden SSR style by default because it cannot know server-side
 * whether the element is already in the viewport — confirmed by direct SSR
 * HTML inspection during this gap-closure. So `priority` instead skips the
 * motion wrapper entirely and renders plain, always-visible markup — no
 * animated reveal for that instance, but no risk of an SSR-hidden LCP
 * candidate. Callers should reserve this for content confirmed to be
 * above-the-fold (e.g. the first grid row).
 */
export function ScrollReveal({
  children,
  priority = false,
}: {
  children: ReactNode
  priority?: boolean
}) {
  const reducedMotion = useReducedMotion()

  if (priority) {
    return <div data-testid="scroll-reveal">{children}</div>
  }

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
