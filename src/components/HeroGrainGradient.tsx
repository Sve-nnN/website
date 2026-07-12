'use client'

import { Component, useEffect, useMemo, useState, type ReactNode } from 'react'

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
 * Shape decision: `ripple` and `blob` were both built and compared live
 * against the reference image (screenshots in
 * `.planning/phases/16-hero-grainy-gradient-implementation/retune-screenshots/`).
 * `ripple` produces a bolder, more graphic single curved arc (its
 * concentric-ring center can be parked outside the frame via static
 * offsetX/offsetY). `blob` — even at the library's own documented preset
 * values — renders as a much more subtle, moody grain field: with this
 * package version and our tonally-close brand palette, `blob`'s orbiting
 * hotspots essentially never cross into full color visibility, leaving a
 * near-black textured surface with only a faint living shimmer. Juan
 * reviewed both live and explicitly preferred `blob`'s calmer, more
 * minimal read — closer to "casi negro" than `ripple`'s bolder ribbon.
 */
const SHADER_SHAPE = 'blob' as const
const SHADER_SOFTNESS = 0.15
const SHADER_INTENSITY = 0.2
const SHADER_NOISE = 0.35
const SHADER_SCALE = 1.4

interface ShaderErrorBoundaryProps {
  children: ReactNode
}

interface ShaderErrorBoundaryState {
  hasError: boolean
}

/**
 * T-16-01: kept as defense-in-depth for synchronous render-phase errors, but
 * this boundary CANNOT catch the one failure mode it was originally written
 * for: `@paper-design/shaders-react`'s `ShaderMount` creates the WebGL
 * context inside an un-awaited async effect (`initShader` in
 * `shader-mount.js`), so a "WebGL is not supported" throw becomes an
 * unhandled promise rejection, not a render-phase error — React error
 * boundaries only catch synchronous errors during render/commit. The real
 * guard against that specific failure is the `supportsWebGL2` feature-detect
 * below, which skips mounting `GrainGradient` entirely when the browser has
 * no WebGL2 context. This class stays as a secondary safety net for any
 * other synchronous error React does report from within its subtree.
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

  // Cheap synchronous feature-detect. Avoids depending on
  // `ShaderErrorBoundary` to observe this library's async WebGL-init failure
  // (see T-16-01 comment above) by skipping the shader mount altogether when
  // the browser has no WebGL2 context, falling back straight to
  // `bg-secondary`. SSR has no `document`, so it assumes support there (the
  // client re-checks synchronously on its first render, same as the server
  // would for any WebGL2-capable browser — the only mismatch window is the
  // rare WebGL2-unsupported client, which self-corrects after hydration).
  const supportsWebGL2 = useMemo(() => {
    if (typeof document === 'undefined') return true
    try {
      return !!document.createElement('canvas').getContext('webgl2')
    } catch {
      return false
    }
  }, [])

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
      {supportsWebGL2 ? (
        <ShaderErrorBoundary>
          <GrainGradient
            colors={colors}
            colorBack={NEAR_BLACK}
            shape={SHADER_SHAPE}
            softness={SHADER_SOFTNESS}
            intensity={SHADER_INTENSITY}
            noise={SHADER_NOISE}
            scale={SHADER_SCALE}
            width="100%"
            height="100%"
            {...motionProps}
          />
        </ShaderErrorBoundary>
      ) : (
        <div className="absolute inset-0 bg-secondary" aria-hidden="true" />
      )}
    </div>
  )
}
