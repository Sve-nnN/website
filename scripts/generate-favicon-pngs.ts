/**
 * One-off raster script: generates the 4 PNG favicon/icon variants from
 * `public/favicon.svg` (Phase 42 / META-02..05 — apple-touch-icon, 32x32
 * favicon, and the two manifest icon sizes).
 *
 * The SVG embeds both a `#light-icon` and `#dark-icon` group, toggled via a
 * `prefers-color-scheme: dark` media query in the file's own `<style>`
 * block. That media query never matches during a static raster render, and
 * the stylesheet's unconditional base rule already sets
 * `#dark-icon { display: none }` — so passing the whole SVG buffer straight
 * into `sharp()` renders exactly the `light-icon` variant (black
 * rounded-square background + white "J" mark) with no manual `<g>`
 * extraction needed.
 *
 * Run with:
 *   node_modules/.bin/tsx scripts/generate-favicon-pngs.ts
 */

import path from 'node:path'
import fs from 'node:fs'

import sharp from 'sharp'

const SVG_PATH = path.join('public', 'favicon.svg')

const TARGETS = [
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
] as const

async function main() {
  const svgBuffer = fs.readFileSync(SVG_PATH)

  for (const { file, size } of TARGETS) {
    const outPath = path.join('public', file)
    await sharp(svgBuffer).resize(size, size).png().toFile(outPath)
    console.log(`Generated ${outPath} (${size}x${size})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
