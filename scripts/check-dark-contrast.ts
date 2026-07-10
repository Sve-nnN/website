/**
 * Verifies WCAG AA contrast for every rebranded `.dark` token pair in
 * src/app/globals.css (Phase 7 / D-03 / UI-03 rebrand to the ember/navy
 * palette).
 *
 * Token values below are hardcoded (not read from globals.css at runtime) so
 * the script is self-contained and fast. They MUST be kept in sync with the
 * `.dark { ... }` block in src/app/globals.css whenever that block changes.
 *
 * Run with:
 *   node_modules/.bin/tsx scripts/check-dark-contrast.ts
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

/** Parses either a hex or rgba(...) color string into 0-255 sRGB channels. */
function parseColor(color: string): RGB {
  if (color.startsWith('#')) {
    return parseHex(color)
  }
  const { r, g, b } = parseRgba(color)
  return { r, g, b }
}

/**
 * Composites a translucent rgba(...) foreground over an opaque background
 * color, returning the effective opaque RGB — needed for --border/--input/
 * --ring, which are stored as rgba() in globals.css.
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

/** Gamma-corrects a single 0-255 sRGB channel per the WCAG piecewise formula. */
function channelToLinear(channel255: number): number {
  const c = channel255 / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

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
// .dark token values (mirror src/app/globals.css .dark block — keep in sync)
// ---------------------------------------------------------------------------

const dark = {
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
// Token pairs to check
// ---------------------------------------------------------------------------

type Pair = {
  name: string
  foreground: string
  background: string
  threshold: number
}

const pairs: Pair[] = [
  { name: 'foreground / background', foreground: dark.foreground, background: dark.background, threshold: 4.5 },
  { name: 'muted-foreground / background', foreground: dark.mutedForeground, background: dark.background, threshold: 4.5 },
  { name: 'muted-foreground / muted', foreground: dark.mutedForeground, background: dark.muted, threshold: 4.5 },
  { name: 'card-foreground / card', foreground: dark.cardForeground, background: dark.card, threshold: 4.5 },
  { name: 'primary-foreground / primary', foreground: dark.primaryForeground, background: dark.primary, threshold: 4.5 },
  { name: 'secondary-foreground / secondary', foreground: dark.secondaryForeground, background: dark.secondary, threshold: 4.5 },
  { name: 'accent-foreground / accent', foreground: dark.accentForeground, background: dark.accent, threshold: 4.5 },
  { name: 'destructive / background', foreground: dark.destructive, background: dark.background, threshold: 4.5 },
  { name: 'primary / background', foreground: dark.primary, background: dark.background, threshold: 3.0 },
  { name: 'border / background', foreground: dark.border, background: dark.background, threshold: 3.0 },
]

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function main() {
  const rows = pairs.map((pair) => {
    const fgRgb = compositeOverBackground(pair.foreground, pair.background)
    const bgRgb = parseColor(pair.background)
    const ratio = contrastRatio(fgRgb, bgRgb)
    const pass = ratio >= pair.threshold
    return { ...pair, ratio, pass }
  })

  const nameWidth = Math.max(...rows.map((r) => r.name.length), 'Pair'.length)
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

  if (anyFail) {
    console.error('\nOne or more .dark token pairs failed WCAG AA contrast requirements.')
    process.exit(1)
  }

  console.log('\nAll .dark token pairs meet WCAG AA contrast requirements.')
  process.exit(0)
}

main()
