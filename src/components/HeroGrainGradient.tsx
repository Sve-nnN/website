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
 */
const LIGHT_COLORS = ['#12141C', '#23283A', '#F7581E']
const LIGHT_COLOR_BACK = '#12141C'
const DARK_COLORS = ['#23283A', '#3A4159', '#FF7A45']
const DARK_COLOR_BACK = '#23283A'

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
  const colorBack = isDark ? DARK_COLOR_BACK : LIGHT_COLOR_BACK

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
          colorBack={colorBack}
          shape="wave"
          softness={0.8}
          intensity={0.25}
          noise={0.12}
          scale={1}
          fit="cover"
          width="100%"
          height="100%"
          {...motionProps}
        />
      </ShaderErrorBoundary>
    </div>
  )
}
