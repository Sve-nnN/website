'use client'

import { Component, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'

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

// PERF (rendering-hydration-no-flicker): reading `document.documentElement`'s
// class in a plain `useEffect` + `useState` pair (the old pattern) commits an
// extra post-mount render just to flip colors, which is the flash the rule
// warns about. `useSyncExternalStore` is React's canonical fix -- it reads
// the real snapshot synchronously as part of the render/commit React already
// does, with `getServerSnapshot` keeping SSR/first-paint consistent (no dark
// mode toggle exists in this codebase today, so this is a no-op in practice,
// but the pattern is now flicker-safe for whenever dark mode is wired).
function subscribeToDarkClass(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

function getDarkClassSnapshot() {
  return document.documentElement.classList.contains('dark')
}

function getServerDarkClassSnapshot() {
  return false
}

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
export type HeroGrainGradientVariant = 'default' | 'cta'

interface ShaderVariantConfig {
  shape: 'wave' | 'dots' | 'truchet' | 'corners' | 'ripple' | 'blob' | 'sphere'
  softness: number
  intensity: number
  noise: number
  scale: number
  offsetX?: number
  offsetY?: number
  speed: number
}

/**
 * Per-variant shader config, both built from the exact same
 * LIGHT_COLORS/DARK_COLORS/NEAR_BLACK constants above.
 *
 * `default` — the Hero/ContactFormBlock look documented above (byte-identical
 * to the pre-`variant`-prop constants: shape `blob`, softness 0.15,
 * intensity 0.2, noise 0.35, scale 1.4, base speed 0.3).
 *
 * `cta` — quick task 260712-1f1: a deliberate, distinct variation for the
 * "Ready to work together?" strip only. Reuses `ripple` (the phase-16-vetted
 * bolder alternative documented above — "a bolder, more graphic single
 * curved arc") with a static offsetX/offsetY parking its concentric-ring
 * center off-center per that same code comment's own guidance, plus a
 * slightly livelier base motion speed. Same palette, different shape/motion
 * feel from the Hero's calm `blob`.
 */
const SHADER_VARIANTS: Record<HeroGrainGradientVariant, ShaderVariantConfig> = {
  default: {
    shape: 'blob',
    softness: 0.15,
    intensity: 0.2,
    noise: 0.35,
    scale: 1.4,
    speed: 0.3,
  },
  cta: {
    shape: 'ripple',
    softness: 0.35,
    intensity: 0.45,
    noise: 0.3,
    scale: 1.1,
    offsetX: 0.2,
    offsetY: -0.15,
    speed: 0.45,
  },
}

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

interface HeroGrainGradientProps {
  variant?: HeroGrainGradientVariant
}

export function HeroGrainGradient({ variant = 'default' }: HeroGrainGradientProps = {}) {
  const variantConfig = SHADER_VARIANTS[variant]
  // Initialized to `false` (matching what the server always renders, since
  // `window` doesn't exist during SSR) to avoid a hydration mismatch — React
  // does not patch mismatched attributes after hydration, so the real
  // matchMedia read happens in the effect below (a genuine post-mount state
  // update, not part of the hydration pass) instead of a useState lazy
  // initializer.
  const [reducedMotion, setReducedMotion] = useState(false)
  // SSR-safe and flicker-safe: `useSyncExternalStore` reads the real dark-mode
  // snapshot as part of React's normal render/commit instead of a follow-up
  // `useEffect` state flip (see PERF comment above `subscribeToDarkClass`).
  // Dark mode isn't reachable today (no next-themes/toggle in this codebase),
  // but this keeps the pattern flicker-safe for whenever it's wired.
  const isDark = useSyncExternalStore(
    subscribeToDarkClass,
    getDarkClassSnapshot,
    getServerDarkClassSnapshot,
  )

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

  const motionProps = reducedMotion ? { speed: 0, frame: 0 } : { speed: variantConfig.speed }

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
            shape={variantConfig.shape}
            softness={variantConfig.softness}
            intensity={variantConfig.intensity}
            noise={variantConfig.noise}
            scale={variantConfig.scale}
            offsetX={variantConfig.offsetX}
            offsetY={variantConfig.offsetY}
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
