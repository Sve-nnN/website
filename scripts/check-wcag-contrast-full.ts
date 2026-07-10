/**
 * Verifies WCAG AA contrast for every consumed token pair in BOTH the light
 * `:root` palette and the `.dark` palette of src/app/globals.css (Phase 11 /
 * UI-11 / UI-13 full-milestone re-audit).
 *
 * Phase 7's scripts/check-dark-contrast.ts only ever checked the 10 `.dark`
 * pairs at the moment `.dark` was rebranded — it never checked the light
 * theme (which mixes hex and oklch() tokens) and predates every Phase 8-10
 * component change. This script reuses check-dark-contrast.ts's WCAG color
 * math verbatim and adds oklch() parsing so both palettes can be checked in
 * one pass, 20 total checks (10 pairs x 2 themes).
 *
 * Token values below are hardcoded (not read from globals.css at runtime) so
 * the script is self-contained and fast. They MUST be kept in sync with the
 * `:root { ... }` and `.dark { ... }` blocks in src/app/globals.css whenever
 * those blocks change.
 *
 * Run with:
 *   node_modules/.bin/tsx scripts/check-wcag-contrast-full.ts
 */

// ---------------------------------------------------------------------------
// Color parsing
// ---------------------------------------------------------------------------

type RGB = { r: number; g: number; b: number }

/** Parses a "#RRGGBB" hex string into 0-255 sRGB channel values. */
function parseHex(hex: string): RGB {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

/** Parses an "rgba(r, g, b, a)" string into 0-255 sRGB channels + 0-1 alpha. */
function parseRgba(rgba: string): RGB & { a: number } {
  const match = rgba.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/,
  )
  if (!match) {
    throw new Error(`Invalid rgba color: ${rgba}`)
  }
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  }
}

/** Gamma-corrects a single 0-255 sRGB channel per the WCAG piecewise formula. */
function channelToLinear(channel255: number): number {
  const c = channel255 / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** Inverse of channelToLinear: linear 0-1 -> gamma-encoded sRGB 0-255. */
function linearToChannel255(linear: number): number {
  const clamped = Math.min(1, Math.max(0, linear))
  const c = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, c)) * 255)
}

/**
 * Parses an "oklch(L C H)" string (L 0-1, C typically 0-0.4, H in degrees)
 * into 0-255 sRGB channel values, using the CSS Color 4 OKLab -> linear-sRGB
 * matrix (Björn Ottosson's formulas), gamma-encoded via linearToChannel255.
 */
function parseOklch(oklch: string): RGB {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/)
  if (!match) {
    throw new Error(`Invalid oklch color: ${oklch}`)
  }
  const L = Number(match[1])
  const C = Number(match[2])
  const H = Number(match[3])

  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  return {
    r: linearToChannel255(rLin),
    g: linearToChannel255(gLin),
    b: linearToChannel255(bLin),
  }
}

/** Parses a hex, rgba(...), or oklch(...) color string into 0-255 sRGB channels. */
function parseColor(color: string): RGB {
  if (color.startsWith('#')) {
    return parseHex(color)
  }
  if (color.startsWith('oklch(')) {
    return parseOklch(color)
  }
  const { r, g, b } = parseRgba(color)
  return { r, g, b }
}

/**
 * Composites a translucent rgba(...) foreground over an opaque background
 * color, returning the effective opaque RGB — needed for --border/--input/
 * --ring, which are stored as rgba() in the .dark block.
 */
function compositeOverBackground(foreground: string, background: string): RGB {
  const bg = parseColor(background)
  if (!foreground.startsWith('rgba') && !foreground.startsWith('rgb(')) {
    return parseColor(foreground)
  }
  const { r, g, b, a } = parseRgba(foreground)
  return {
    r: r * a + bg.r * (1 - a),
    g: g * a + bg.g * (1 - a),
    b: b * a + bg.b * (1 - a),
  }
}

// ---------------------------------------------------------------------------
// WCAG relative luminance + contrast ratio
// ---------------------------------------------------------------------------

/** WCAG relative luminance for an sRGB color, weighted 0.2126/0.7152/0.0722. */
function relativeLuminance({ r, g, b }: RGB): number {
  const R = channelToLinear(r)
  const G = channelToLinear(g)
  const B = channelToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/** WCAG contrast ratio between two sRGB colors: (L1 + 0.05) / (L2 + 0.05). */
function contrastRatio(colorA: RGB, colorB: RGB): number {
  const lumA = relativeLuminance(colorA)
  const lumB = relativeLuminance(colorB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

// ---------------------------------------------------------------------------
// Token values (mirror src/app/globals.css :root + .dark blocks — keep in sync)
// ---------------------------------------------------------------------------

type Palette = {
  background: string
  foreground: string
  card: string
  cardForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  border: string
}

const light: Palette = {
  background: '#FAFAF7',
  foreground: '#12141C',
  card: '#FAFAF7',
  cardForeground: '#12141C',
  primary: '#F7581E',
  primaryForeground: '#12141C',
  secondary: '#12141C',
  secondaryForeground: '#FAFAF7',
  muted: 'oklch(0.97 0 0)',
  mutedForeground: 'oklch(0.54 0 0)',
  accent: 'oklch(0.97 0 0)',
  accentForeground: 'oklch(0.205 0 0)',
  destructive: '#DC2626',
  border: 'oklch(0.63 0 0)',
}

const dark: Palette = {
  background: '#12141C',
  foreground: '#FAFAF7',
  card: '#1B1E29',
  cardForeground: '#FAFAF7',
  primary: '#FF7A45',
  primaryForeground: '#12141C',
  secondary: '#23283A',
  secondaryForeground: '#FAFAF7',
  muted: '#1F2230',
  mutedForeground: '#A8ACBB',
  accent: '#23283A',
  accentForeground: '#FAFAF7',
  destructive: '#F87171',
  border: 'rgba(250, 250, 247, 0.35)',
}

// ---------------------------------------------------------------------------
// Token pairs to check (same 10-pair list as check-dark-contrast.ts)
// ---------------------------------------------------------------------------

type Pair = {
  name: string
  foreground: string
  background: string
  threshold: number
}

function buildPairs(p: Palette): Pair[] {
  return [
    { name: 'foreground / background', foreground: p.foreground, background: p.background, threshold: 4.5 },
    { name: 'muted-foreground / background', foreground: p.mutedForeground, background: p.background, threshold: 4.5 },
    { name: 'muted-foreground / muted', foreground: p.mutedForeground, background: p.muted, threshold: 4.5 },
    { name: 'card-foreground / card', foreground: p.cardForeground, background: p.card, threshold: 4.5 },
    { name: 'primary-foreground / primary', foreground: p.primaryForeground, background: p.primary, threshold: 4.5 },
    { name: 'secondary-foreground / secondary', foreground: p.secondaryForeground, background: p.secondary, threshold: 4.5 },
    { name: 'accent-foreground / accent', foreground: p.accentForeground, background: p.accent, threshold: 4.5 },
    { name: 'destructive / background', foreground: p.destructive, background: p.background, threshold: 4.5 },
    { name: 'primary / background', foreground: p.primary, background: p.background, threshold: 3.0 },
    { name: 'border / background', foreground: p.border, background: p.background, threshold: 3.0 },
  ]
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function checkTheme(themeName: string, palette: Palette): boolean {
  const pairs = buildPairs(palette)
  const rows = pairs.map((pair) => {
    const fgRgb = compositeOverBackground(pair.foreground, pair.background)
    const bgRgb = parseColor(pair.background)
    const ratio = contrastRatio(fgRgb, bgRgb)
    const pass = ratio >= pair.threshold
    return { ...pair, ratio, pass }
  })

  const nameWidth = Math.max(...rows.map((r) => r.name.length), 'Pair'.length)
  console.log(`\n${themeName} theme`)
  const header = `${'Pair'.padEnd(nameWidth)}  Ratio   Threshold  Result`
  console.log(header)
  console.log('-'.repeat(header.length))

  let anyFail = false
  for (const row of rows) {
    if (!row.pass) anyFail = true
    console.log(
      `${row.name.padEnd(nameWidth)}  ${row.ratio.toFixed(2).padStart(5)}   ${row.threshold.toFixed(1).padStart(9)}  ${row.pass ? 'PASS' : 'FAIL'}`,
    )
  }
  return !anyFail
}

function main() {
  const lightPassed = checkTheme('Light (:root)', light)
  const darkPassed = checkTheme('Dark (.dark)', dark)

  console.log('\n' + '='.repeat(60))
  if (!lightPassed || !darkPassed) {
    console.error(
      `\nFAILED: light=${lightPassed ? 'PASS' : 'FAIL'} dark=${darkPassed ? 'PASS' : 'FAIL'}. One or more token pairs failed WCAG AA contrast requirements.`,
    )
    process.exit(1)
  }

  console.log('\nAll 20 checks (10 pairs x 2 themes) meet WCAG AA contrast requirements.')
  process.exit(0)
}

main()
