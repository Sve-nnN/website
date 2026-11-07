'use client'

import { LazyMotion, domAnimation, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

import { useMotion } from '@/theme/motion'

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
 * Fase 53 (D-16, D-17): `MotionConfig reducedMotion` ya no depende de
 * `"user"`. El script inicial de `src/theme/motion-init.ts` convierte
 * `prefers-reduced-motion` en `paused` por defecto, y quien reanuda de forma
 * explicita debe poder mover las animaciones aunque el sistema pida reducir.
 * Por eso lee `useMotion().paused`: `always` al pausar, `never` al correr. El
 * `useReducedMotion()` suelto sigue existiendo para logica fuera de `m.*`.
 * Este proveedor convive con `MotionStateProvider` hasta la fase 57.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const { paused } = useMotion()
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={paused ? 'always' : 'never'}>{children}</MotionConfig>
    </LazyMotion>
  )
}
