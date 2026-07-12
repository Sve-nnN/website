'use client'

import { Component, useEffect, useState, type ReactNode } from 'react'

import { GrainGradient } from '@paper-design/shaders-react'

/**
 * Hero `variant: 'home'` background shader (HERO-ANIM-01/02/04). Colors are
 * hardcoded copies of the resolved hex values from `src/app/globals.css`
 * (Phase 7 ember/navy tokens), per 16-UI-SPEC.md's Shader Parameters table —
 * not re-derived at runtime, since this component only has two possible
 * states (light/dark) and a build-time constant is simpler and equally
 * token-faithful.
 *
 * Post-implementation revision (16-CONTEXT.md "Revisión post-implementación"):
 * Juan requested a single curved light ribbon (ember->navy) over a
 * near-black backdrop, with much more negative space than the original
 * `wave` shape. `colorBack` now goes near-black (`NEAR_BLACK`) instead of
 * matching the solid navy `--secondary` token, to get the "ribbon over dark
 * backdrop" look from the reference image.
 *
 * Mouse reactivity was prototyped (pointermove -> offsetX/offsetY) and then
 * explicitly rejected by Juan after trying it live — REMOVED, not deferred.
 * The shader keeps only its normal time-based animation (`speed`), no
 * pointer/cursor tracking anywhere in this component. See 16-CONTEXT.md's
 * "Revisión post-implementación" section for the reverted decision record.
 */
const LIGHT_COLORS = ['#23283A', '#3A4159', '#F7581E']
const DARK_COLORS = ['#3A4159', '#4B5470', '#FF7A45']
/** Near-black, not pure #000, so the navy brand identity isn't fully lost. */
const NEAR_BLACK = '#0A0A0F'

/**
 * `ripple` was chosen over `blob` after comparing both against the reference
 * image (see 16-03-shape-comparison screenshots): `ripple`'s concentric-ring
 * pattern radiates from a single fixed center, so `offsetX`/`offsetY` can
 * reliably park that center just outside the frame, leaving only one clean
 * curved arc crossing the visible section — a stable, art-directable single
 * ribbon. `blob` renders as several small, independently orbiting hotspots
 * (time-driven trajectories baked into the shader itself) that drift in and
 * out of frame unpredictably and, at these brand colors' tonal closeness,
 * were frequently invisible entirely — not usable for a single stable ribbon.
 */
const RIBBON_SHAPE = 'ripple' as const
const RIBBON_SOFTNESS = 0.85
const RIBBON_INTENSITY = 0.1
const RIBBON_NOISE = 0.12
const RIBBON_SCALE = 2.3

/** Fixed position: parks the ripple's center outside the frame so only one
 * curved arc shows, bottom-left. Static — no longer mouse-driven. */
const OFFSET_X = 0.5
const OFFSET_Y = -1.35

interface ShaderErrorBoundaryProps {
  children: ReactNode
}

interface ShaderErrorBoundaryState {
  hasError: boolean
}

/**
 * T-16-01: WebGL context creation can fail in unsupported/hostile browser
 * environments. React error boundaries must be classes. Falls back to the
 * plain `bg-secondary` treatment with no visible error to the visitor.
 */
class ShaderErrorBoundary extends Component<ShaderErrorBoundaryProps, ShaderErrorBoundaryState> {
  state: ShaderErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // T-16-02: logs only the caught render error object, never user data.
    console.error('HeroGrainGradient failed to render, falling back to solid background', error)
  }

  render() {
    if (this.state.hasError) {
      return <div className="absolute inset-0 bg-secondary" aria-hidden="true" />
    }
    return this.props.children
  }
}

export function HeroGrainGradient() {
  // Initialized to `false` (matching what the server always renders, since
  // `window` doesn't exist during SSR) to avoid a hydration mismatch — React
  // does not patch mismatched attributes after hydration, so the real
  // matchMedia read happens in the effect below (a genuine post-mount state
  // update, not part of the hydration pass) instead of a useState lazy
  // initializer.
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isDark] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  const motionProps = reducedMotion ? { speed: 0, frame: 0 } : { speed: 0.3 }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      data-testid="hero-grain-gradient"
      data-motion={reducedMotion ? 'reduced' : 'live'}
    >
      <ShaderErrorBoundary>
        <GrainGradient
          colors={colors}
          colorBack={NEAR_BLACK}
          shape={RIBBON_SHAPE}
          softness={RIBBON_SOFTNESS}
          intensity={RIBBON_INTENSITY}
          noise={RIBBON_NOISE}
          scale={RIBBON_SCALE}
          offsetX={OFFSET_X}
          offsetY={OFFSET_Y}
          width="100%"
          height="100%"
          {...motionProps}
        />
      </ShaderErrorBoundary>
    </div>
  )
}
