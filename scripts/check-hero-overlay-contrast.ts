/**
 * Verifies WCAG contrast for the Hero's composited background — the real
 * fallback image rendered at reduced opacity over the navy `--secondary`
 * section background — against `--secondary-foreground` title/subtitle text.
 *
 * Phase 7's `check-dark-contrast.ts` only verified flat design-token pairs;
 * it never accounted for the Hero's image-over-navy composite, whose
 * effective background brightness varies per fallback image. This script
 * closes that gap by sampling all 53 real Cloudinary fallback images (see
 * src/lib/heroImageFallback.ts) plus one synthetic pure-white worst case.
 *
 * IMAGE_OPACITY below MUST be kept in sync with the opacity value on the
 * `<div className="absolute inset-0 opacity-30">` wrapper in
 * src/blocks/Hero/Component.tsx — that div renders the fallback image at
 * reduced opacity directly over the section's `bg-secondary` background,
 * which is the compositing this script reproduces.
 *
 * Run with:
 *   node_modules/.bin/tsx scripts/check-hero-overlay-contrast.ts
 */

import sharp from 'sharp'

// ---------------------------------------------------------------------------
// Config — keep in sync with src/blocks/Hero/Component.tsx and
// src/lib/heroImageFallback.ts
// ---------------------------------------------------------------------------

/** Mirrors `opacity-30` on the image wrapper div in Hero/Component.tsx. */
const IMAGE_OPACITY = 0.3

/** Mirrors FALLBACK_POOL_SIZE / FALLBACK_BASE_URL in src/lib/heroImageFallback.ts. */
const FALLBACK_POOL_SIZE = 53
const FALLBACK_BASE_URL =
  'https://res.cloudinary.com/dmufha3qv/image/upload/f_auto,q_auto/portfolio'

// ---------------------------------------------------------------------------
// Color types + WCAG math (same formulas as scripts/check-dark-contrast.ts)
// ---------------------------------------------------------------------------

type RGB = { r: number; g: number; b: number }

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

function channelToLinear(channel255: number): number {
  const c = channel255 / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function relativeLuminance({ r, g, b }: RGB): number {
  const R = channelToLinear(r)
  const G = channelToLinear(g)
  const B = channelToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function contrastRatio(colorA: RGB, colorB: RGB): number {
  const lumA = relativeLuminance(colorA)
  const lumB = relativeLuminance(colorB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Composites `fg` at `alpha` opacity over an opaque `bg`. */
function compositeOver(fg: RGB, bg: RGB, alpha: number): RGB {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  }
}

// ---------------------------------------------------------------------------
// Locked tokens (src/app/globals.css :root — keep in sync)
// ---------------------------------------------------------------------------

const NAVY_SECONDARY = parseHex('#12141C')
const OFF_WHITE_SECONDARY_FOREGROUND = parseHex('#FAFAF7')

// ---------------------------------------------------------------------------
// Image sampling
// ---------------------------------------------------------------------------

type Candidate = {
  name: string
  color: RGB
}

async function sampleAverageColor(url: string): Promise<RGB> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  const { data, info } = await sharp(buffer)
    .resize(8, 8, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const channels = info.channels
  let r = 0
  let g = 0
  let b = 0
  const pixelCount = data.length / channels
  for (let i = 0; i < data.length; i += channels) {
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  return {
    r: r / pixelCount,
    g: g / pixelCount,
    b: b / pixelCount,
  }
}

async function loadCandidates(): Promise<Candidate[]> {
  const imageIndices = Array.from({ length: FALLBACK_POOL_SIZE }, (_, i) => i + 1)

  const imageCandidates = await Promise.all(
    imageIndices.map(async (n) => {
      const url = `${FALLBACK_BASE_URL}/fallback-image-${n}.avif`
      const color = await sampleAverageColor(url)
      return { name: `fallback-image-${n}.avif`, color }
    }),
  )

  const syntheticWhite: Candidate = {
    name: 'synthetic worst-case (pure white)',
    color: { r: 255, g: 255, b: 255 },
  }

  return [...imageCandidates, syntheticWhite]
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    `Sampling ${FALLBACK_POOL_SIZE} real Cloudinary fallback images + 1 synthetic worst case...\n`,
  )

  const candidates = await loadCandidates()

  const rows = candidates.map((candidate) => {
    const compositedBg = compositeOver(candidate.color, NAVY_SECONDARY, IMAGE_OPACITY)
    const ratio = contrastRatio(OFF_WHITE_SECONDARY_FOREGROUND, compositedBg)
    return {
      name: candidate.name,
      ratio,
      passLarge: ratio >= 3.0,
      passNormal: ratio >= 4.5,
    }
  })

  const sorted = [...rows].sort((a, b) => a.ratio - b.ratio)
  const worst5 = sorted.slice(0, 5)
  const syntheticRow = rows.find((r) => r.name.startsWith('synthetic'))

  const nameWidth = Math.max(...rows.map((r) => r.name.length), 'Candidate'.length)
  const header = `${'Candidate'.padEnd(nameWidth)}  Ratio   Large(3:1)  Normal(4.5:1)`
  console.log('Worst 5 by contrast ratio:')
  console.log(header)
  console.log('-'.repeat(header.length))
  for (const row of worst5) {
    console.log(
      `${row.name.padEnd(nameWidth)}  ${row.ratio.toFixed(2).padStart(5)}   ${row.passLarge ? 'PASS' : 'FAIL'}        ${row.passNormal ? 'PASS' : 'FAIL'}`,
    )
  }

  if (syntheticRow && !worst5.includes(syntheticRow)) {
    console.log('\nSynthetic worst-case:')
    console.log(header)
    console.log('-'.repeat(header.length))
    console.log(
      `${syntheticRow.name.padEnd(nameWidth)}  ${syntheticRow.ratio.toFixed(2).padStart(5)}   ${syntheticRow.passLarge ? 'PASS' : 'FAIL'}        ${syntheticRow.passNormal ? 'PASS' : 'FAIL'}`,
    )
  }

  // Title text (text-display / text-heading) is large text -> 3:1 threshold.
  // Subtitle text (text-body) is normal text -> 4.5:1 threshold.
  const failures = rows.filter((r) => !r.passLarge || !r.passNormal)

  console.log(
    `\n${rows.length} candidates checked (${FALLBACK_POOL_SIZE} real + 1 synthetic). ${failures.length} failure(s).`,
  )

  if (failures.length > 0) {
    console.error('\nOne or more candidates failed WCAG contrast against the Hero overlay.')
    for (const f of failures) {
      console.error(
        `  FAIL: ${f.name} — ratio ${f.ratio.toFixed(2)} (large: ${f.passLarge ? 'pass' : 'FAIL'}, normal: ${f.passNormal ? 'pass' : 'FAIL'})`,
      )
    }
    process.exit(1)
  }

  console.log('\nAll candidates meet WCAG contrast requirements against the Hero overlay.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
