# Phase 40: Websites — Content Population (Real Data Capture) - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 1 new one-time script (likely split into sub-steps: seed/upsert, Lighthouse capture, screenshot capture) that populates 6 `websites` documents via the Local API
**Analogs found:** 5 / 5 (no gaps — every sub-pattern has a direct in-repo analog)

## File Classification

| New/Modified File (expected) | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/seed-phase40-websites.ts` (new) | script (Local API upsert) | CRUD (create/update `websites` docs) | `scripts/seed-phase19-service-pages.ts` (upsert-by-slug shape) + `scripts/spike-cloudinary-upload.ts` (bare `getPayload({config})` bootstrap) | exact (compose two analogs) |
| `scripts/lighthouse-live-websites.mjs` (new, adapted) | script (Node API wrapper) | request-response (HTTP → Lighthouse audit → JSON) | `scripts/lighthouse-mobile.mjs` | exact (reuse `runLighthouse`/`getChromePath`, replace `ROUTES`/`baseUrl` composition with a flat list of 6 live URLs) |
| `scripts/screenshot-live-websites.mjs` (new) | script (Playwright capture → buffer → Media upload) | file-I/O (screenshot → buffer → Cloudinary via Payload Local API) | `scripts/verify-mobile-viewport.mjs` (Playwright launch/screenshot pattern) + `scripts/migrate/steps/01-media.ts` (buffer → `payload.create({collection:'media', file:{data,...}})`) | role-match (compose two analogs — no existing script screenshots an *external* URL and uploads to Media in one step) |
| `src/collections/Websites/index.ts` (existing, read-only reference) | model | CRUD | itself (Phase 38, already built) | exact — this phase must match its field names exactly, not modify it |

No controllers/components are touched — this is a pure one-time data-population phase (backend scripts only), consistent with CONTEXT.md's "sin ninguna infraestructura de re-auditoría en vivo."

## Pattern Assignments

### `scripts/seed-phase40-websites.ts` (script, CRUD upsert)

**Analog #1 — bootstrap + relative config import:** `scripts/spike-cloudinary-upload.ts` (full file, 86 lines) and `scripts/seed-phase19-service-pages.ts` lines 19-21.

```typescript
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })
  // ...
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```
Every standalone script in this repo bootstraps this way — a **relative** import of `payload.config.ts` (not the `@payload-config` alias, which only resolves inside Next's own build/runtime), a single `getPayload({ config })` call, and an explicit `process.exit(0)`/`process.exit(1)` pair so the script terminates instead of hanging on an open DB pool.

**Analog #2 — idempotent upsert-by-slug pattern:** `scripts/seed-phase19-service-pages.ts` `upsertPage()`, lines 222-277 (full function read).

```typescript
const { docs } = await payload.find({
  collection: 'pages',
  where: { slug: { equals: slug } },
  limit: 1,
})

let docId: number | string

if (docs.length === 0) {
  const created = await payload.create({
    collection: 'pages',
    locale: 'es',
    data: { title: titleByLocale.es, slug, _status: 'published', /* ... */ },
  })
  docId = created.id
} else {
  docId = docs[0].id
}

for (const locale of LOCALES) {
  await payload.update({
    collection: 'pages',
    id: docId,
    locale,
    data: { /* locale-specific fields */ },
  })
}
```
Apply directly to `websites`: `payload.find({ collection: 'websites', where: { slug: { equals: <domain-slug> } }, limit: 1 })` to check for an existing doc before creating, then `payload.create`/`payload.update` per locale for the localized fields (`title`, `role`, `industry`, `highlights[].text`, `challenges[].text` are all `localized: true` per `src/collections/Websites/index.ts`). Non-localized fields (`stack[].tag`, `year`, `client`, `relatedCaseStudy`, `lighthouse.*`, `lighthouseCapturedAt`, `screenshots`, `slugField()`) only need to be written once (any locale write persists them, since Payload stores non-localized fields at the doc level, not per-locale).

**Note on `reapplyIds`:** the Phase 19 script's `reapplyIds()` helper (lines 178-220) exists specifically because `pages.content.layout` is a `blocks` field with nested sub-arrays, and Payload full-replaces array/blocks fields on `update`. `Websites` has simple `array` fields (`highlights`, `stack`, `challenges`, `screenshots`) but they are **not localized as a whole array of blocks with locale-specific ids that need reconciling across two separate locale writes** — only the *inner* `text`/`tag` fields are localized-or-not per field, not the array shape itself. Still, write each array field's full contents in a single `payload.update` call per locale to avoid any partial-array overwrite risk (write `highlights`/`challenges` per-locale since their `text` sub-field is `localized: true`; write `stack`/`screenshots` once, non-locale-specific, since none of their sub-fields are localized).

**Client relationship lookup pattern:** no existing script queries `clientes` by name, but the shape is a straightforward `payload.find`:
```typescript
const { docs: clienteDocs } = await payload.find({
  collection: 'clientes',
  where: { name: { equals: 'Arianna Lupi' } }, // or whatever the title field is
  limit: 1,
})
const clientId = clienteDocs[0]?.id
```
CONTEXT.md already supplies the exact IDs to use (ids 29, 4, 1, 8, 28 across the 5 sites with a `Clientes` match; `juan-tech.com` gets no `client`) — hardcoding the IDs directly in the seed data (as Phase 19/25 hardcode their copy) is consistent with this repo's convention of committing real content values into the seed script rather than re-deriving them at runtime.

---

### `scripts/lighthouse-live-websites.mjs` (script, request-response)

**Analog:** `scripts/lighthouse-mobile.mjs` (full file, 149 lines, already read in full above).

Reuse verbatim: `getChromePath()` (lines 59-70), `safeNumeric()` (lines 76-82), and `runLighthouse(url, chromePath)` (lines 84-109) — these three functions have zero dependency on the local-dev-server assumption; `runLighthouse` already takes an arbitrary `url` string.

**What must change vs. the original:** the original composes `url = ${args.baseUrl}${route}` from a *relative* `ROUTES` list intended for a locally-served single site. For Phase 40, replace `ROUTES` with a flat list of the 6 already-absolute live URLs (`https://ariannalupi.com`, `https://aprendoclub.com`, `https://estylopia.com`, `https://drmanuelvargashidalgo.com`, `https://apturio.com`, `https://juan-tech.com`) and call `runLighthouse(url, chromePath)` directly per site — no `baseUrl`/`route` string concatenation needed:
```javascript
const SITES = [
  'https://ariannalupi.com',
  'https://aprendoclub.com',
  'https://estylopia.com',
  'https://drmanuelvargashidalgo.com',
  'https://apturio.com',
  'https://juan-tech.com',
]
// ...
for (const url of SITES) {
  console.log(`Running Lighthouse (mobile) against ${url} ...`)
  scores[url] = await runLighthouse(url, chromePath)
}
```
Keep the `--headless=new --no-sandbox` Chrome flags and the mobile `formFactor`/`screenEmulation` settings (lines 85-91) unchanged — CONTEXT.md/ROADMAP.md require "mismo patrón que lighthouse-mobile.mjs," mobile only. The returned `{ performance, accessibility, 'best-practices', seo }` keys map directly onto `Websites.lighthouse.{performance, accessibility, bestPractices, seo}` (note the `best-practices` → `bestPractices` rename needed at the call site — the collection field is camelCase, Lighthouse's raw key is kebab-case). Record `lighthouseCapturedAt` as `new Date().toISOString()` at the moment each site's audit completes — CONTEXT.md/collection schema require this as a real, non-fabricated per-run timestamp, not a shared batch timestamp, if the 6 runs happen at meaningfully different times.

**External-site caveat (new vs. Phase 11's local-build assumption):** the original script's docstring explicitly warns against running Lighthouse against `next dev` (non-representative scores) — that constraint doesn't apply here since these are real production sites already deployed. No code change needed for this, just don't add a dev-server guard that doesn't exist in the source; the live URLs are inherently production.

---

### `scripts/screenshot-live-websites.mjs` (script, file-I/O)

**Analog #1 — Playwright launch + full-page screenshot:** `scripts/verify-mobile-viewport.mjs` lines 17, 75, 130-132 and `scripts/verify-phase11-real-content-mobile.mjs` line 60 (both confirmed instances of `fullPage: true`).

```javascript
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: VIEWPORT })
await page.goto(url, { waitUntil: 'networkidle' })
const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`)
await page.screenshot({ path: screenshotPath, fullPage: true })
await page.close()
// ...
await browser.close()
```
CONTEXT.md/ROADMAP.md require full-page screenshots ("Screenshot full-page real vía Playwright") — use `fullPage: true` as in `verify-mobile-viewport.mjs`/`verify-phase11-real-content-mobile.mjs`, not the `fullPage: false` variant from `verify-hero-mobile.mjs`. For a 6-site one-time capture, `viewport` can stay at the desktop default (Playwright's default `1280x720`) unless CONTEXT.md wants a specific device size — CONTEXT.md doesn't specify, so default viewport is a reasonable, low-risk choice (flag as a planner decision point if a specific breakpoint matters for the portfolio card crop).

**Analog #2 — screenshot buffer → Media doc via Local API:** `scripts/migrate/steps/01-media.ts` lines 62-83 (the `fetch` → `arrayBuffer` → `Buffer.from` → `payload.create({collection:'media', file:{data,...}})` shape) — Playwright's `page.screenshot()` without a `path` option returns a `Buffer` directly, so this phase can skip the `fetch`/`arrayBuffer` round-trip entirely and pipe the screenshot buffer straight into the same `file` shape:
```javascript
const buffer = await page.screenshot({ fullPage: true }) // no `path` → returns Buffer directly

const mediaDoc = await payload.create({
  collection: 'media',
  data: { alt: `${siteName} — full-page screenshot` },
  file: {
    data: buffer,
    mimetype: 'image/png',
    name: `${siteSlug}-screenshot.png`,
    size: buffer.length,
  },
})
```
This is the exact `file: { data, mimetype, name, size }` shape from `01-media.ts` line 77-82 — confirmed working against the real Cloudinary adapter (that script is the one that did the real Mongo→Postgres media migration). Then attach `mediaDoc.id` into the `websites` doc's `screenshots` array: `{ image: mediaDoc.id }` per `src/collections/Websites/index.ts` line 44 (`{ name: 'image', type: 'upload', relationTo: 'media', required: true }`).

**Alternative (simpler, if a local file is preferred over a buffer):** `scripts/spike-cloudinary-upload.ts` lines 36-40 shows the `filePath` variant (`payload.create({ collection: 'media', data: {...}, filePath: './scripts/fixtures/test-image.jpg' })`) — only relevant if the screenshot is first written to disk via `page.screenshot({ path: ... })` and then re-read; the in-memory buffer approach above avoids the extra disk round-trip and is the recommended path.

---

## Shared Patterns

### Payload Local API bootstrap (identical across every standalone script)
**Source:** `scripts/spike-cloudinary-upload.ts` lines 29-34, `scripts/seed-phase19-service-pages.ts` lines 19-21, `scripts/migrate/steps/01-media.ts` lines 12-18
```typescript
import { getPayload } from 'payload'
import config from '../src/payload.config' // relative path — NOT the '@payload-config' alias
const payload = await getPayload({ config })
```
**Apply to:** the seed script and any script in this phase that touches the Local API. Run with `npx tsx scripts/<name>.ts` (confirmed convention from every `.ts` script's docstring) or `node --env-file=.env node_modules/.bin/tsx scripts/<name>.ts` (Phase 19's exact invocation, useful if `.env` isn't auto-loaded).

### Cloudinary storage adapter (already wired, confirm not reconfigure)
**Source:** `src/payload.config.ts` lines 8, 15, ~125-131; `src/collections/Media/index.ts` lines 3-9
```typescript
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { cloudinaryAdapter } from './lib/cloudinary-adapter'
// ...
cloudStoragePlugin({
  collections: {
    media: {
      adapter: cloudinaryAdapter,
      generateFileURL: ({ filename }) => cloudinaryAdapter().generateFileURL({ filename }),
    },
  },
})
```
Env-gated by `hasCloudinaryCreds` (`CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`, computed identically in both `payload.config.ts` and `src/collections/Media/index.ts` — a documented "must stay in sync" pitfall). **Apply to:** nothing to change here — this phase's screenshot uploads flow through this adapter automatically via `payload.create({ collection: 'media', ... })`; just confirm `.env` has the three Cloudinary vars set before running the script (already true in this environment per Phase 3/Phase 4 migration history).

### Lighthouse Node API (Chrome-for-Testing + mobile preset)
**Source:** `scripts/lighthouse-mobile.mjs` lines 18, 59-109
```javascript
import { install, computeExecutablePath, resolveBuildId, detectBrowserPlatform, Browser } from '@puppeteer/browsers'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
```
**Apply to:** the Lighthouse capture script — reuse `getChromePath()` unchanged (downloads/caches Chrome-for-Testing to `.lighthouse-chrome/` at repo root, same cache dir works for external URLs).

### Playwright screenshot (real headless Chromium, not CSS simulation)
**Source:** `scripts/verify-mobile-viewport.mjs` lines 17, 75; `package.json` confirms `"playwright": "^1.61.1"` as a real dependency (not devDependency-only ambiguity — grep confirmed the version pin)
```javascript
import { chromium } from 'playwright'
const browser = await chromium.launch()
```
**Apply to:** the screenshot capture script for all 6 live sites.

### `Websites` collection field shape (exact names — read-only reference, do not modify)
**Source:** `src/collections/Websites/index.ts` (full file, 69 lines, already built in Phase 38)
```typescript
{
  title: string (localized, required),
  role?: string (localized),
  industry?: string (localized),
  year?: number,
  highlights: [{ text: string (localized, required) }],
  stack: [{ tag: string (required, NOT localized) }],
  challenges: [{ text: string (localized, required, textarea) }],
  screenshots: [{ image: Media relationship (required) }],
  lighthouse: { performance?, accessibility?, bestPractices?, seo?: number (0-100) },
  lighthouseCapturedAt: date (required, sibling to lighthouse group, NOT nested inside it),
  client?: relationship → clientes (single),
  relatedCaseStudy?: relationship → case-studies (single),
  slug: auto-generated from title via slugField(),
}
```
**Apply to:** every `payload.create`/`payload.update` call in the seed script — field names must match exactly (`bestPractices` not `best_practices`/`best-practices`; `lighthouseCapturedAt` at the top level of `data`, not inside `data.lighthouse`; `stack[].tag` not `stack[].name`; `screenshots[].image` not `screenshots[].file`/`screenshots[].media`).

## No Analog Found

None — all 5 sub-patterns (Local API bootstrap, upsert-by-slug, Lighthouse capture, Playwright screenshot, buffer-to-Media upload) have direct, recently-modified analogs already in `scripts/`. The only genuinely new composition is "Playwright screenshot buffer piped directly into `payload.create({file: {data: buffer, ...}})`" — no existing script does exactly this in one step, but both halves (`page.screenshot()` returning a Buffer, and `payload.create` accepting a `file.data` Buffer) are independently proven in `scripts/verify-mobile-viewport.mjs` and `scripts/migrate/steps/01-media.ts` respectively, so this is a low-risk composition, not an unprecedented pattern.

## Metadata

**Analog search scope:** `scripts/` (all `seed-phase*.ts`, `lighthouse-mobile.mjs`, `spike-cloudinary-upload.ts`, `migrate/steps/01-media.ts`, `verify-*.mjs`, `capture-service-page-snapshot.mjs`), `src/collections/Websites/index.ts`, `src/collections/Media/index.ts`, `src/payload.config.ts`, `package.json`
**Files scanned:** 9 scripts (full or targeted reads), 1 collection file (full), 1 config file (targeted), `package.json` (grep)
**Pattern extraction date:** 2026-07-14
