# Stack Research — v1.9 Websites Portfolio Section

**Domain:** Payload CMS collection + one-off data-capture tooling (real Lighthouse scores + real screenshots) for a "Websites I've built" portfolio showcase
**Researched:** 2026-07-14
**Confidence:** HIGH

## Key Finding

This milestone needs **zero new npm packages**. Everything required — Payload collection modeling, real Lighthouse score capture, and real screenshot capture for Cloudinary upload — is already installed in `package.json` at current versions, and was already proven working end-to-end by earlier phases (`scripts/lighthouse-mobile.mjs`, `scripts/spike-cloudinary-upload.ts`). This is additive Payload config + two capture scripts, not a stack change. (Base project stack — Payload/Next/Postgres/Cloudinary/Resend — is already covered by `.planning/research/STACK.md`; this file only adds what's new for v1.9.)

## Recommended Stack

### Core Technologies (already in the project — no action needed)

| Technology | Version (installed) | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `payload` | 3.85.2 | New `Websites` collection: slug, `liveUrl`, `stack` (tags/array), `challenges` (array, same pattern as `CaseStudies.challenge`), Lighthouse score fields, launch year, role, industry, technical highlights, optional relationships to `clientes` and `case-studies` | Same collection-modeling pattern already used by `case-studies` — no new API surface, just a new collection config file plus a Home-block + listing/detail page pair, matching the existing `FeaturedContent` global → `FeaturedCaseStudiesBlock` pattern |
| `@payloadcms/plugin-cloud-storage` + custom `cloudinaryAdapter` (`src/lib/cloudinary-adapter.ts`) | 3.85.2 / n/a | Uploads real screenshots to Cloudinary via the existing `Media` collection | Already validated end-to-end (`scripts/spike-cloudinary-upload.ts`): `payload.create({ collection: 'media', filePath })` streams the file through this adapter into the real Cloudinary account and returns a working `f_auto,q_auto` URL. Website screenshots reuse `Media`, not a new upload path. |
| `lighthouse` | 13.4.0 | Programmatically runs a full Lighthouse audit (performance/accessibility/best-practices/SEO) against a URL and returns category scores as JSON | Same engine Chrome DevTools uses under the hood — the only credible source of "real Lighthouse scores." No API shortcut returns official Lighthouse category scores without running the audit engine itself. |
| `chrome-launcher` | 1.2.1 | Launches a headless Chrome instance for `lighthouse` to drive (Lighthouse needs a live Chrome DevTools Protocol target; it doesn't ship its own browser) | Standard pairing per Lighthouse's own docs; already used by `scripts/lighthouse-mobile.mjs` |
| `@puppeteer/browsers` | 3.0.6 | Downloads/caches a pinned Chrome-for-Testing binary so `chrome-launcher` has a deterministic browser to launch (vs. relying on whatever Chrome happens to be installed on the machine) | Already the project's established pattern for reproducible Lighthouse runs — reuse `getChromePath()` from `scripts/lighthouse-mobile.mjs` verbatim |
| `playwright` | 1.61.1 (chromium browsers already downloaded and cached at `~/Library/Caches/ms-playwright`, build 1228) | Captures a real full-page screenshot of each external live site (`page.goto(url)` + `page.screenshot({ fullPage: true })`) | Playwright's `fullPage` screenshot is the standard reliable way to capture an accurate rendered screenshot of a third-party site (handles JS-rendered content, waits for network idle, consistent viewport sizing) — more robust than scraping an `<img>` or a hosted screenshot API, and it's already a devDependency with browsers pre-installed, so this is zero net-new setup |

### Supporting Libraries (none new — reused as-is)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tsx` | latest (installed) | Run the two new one-off capture scripts (e.g. `scripts/capture-websites-screenshots.ts`, `scripts/capture-websites-lighthouse.ts`) outside the Next.js build, same as every other `scripts/*.ts` in this repo | `npx tsx scripts/<script>.ts` |
| `payload` Local API | 3.85.2 | Write the captured screenshot + Lighthouse numbers straight into the new `Websites` collection docs after capture | Reuse the `getPayload({ config })` + `../src/payload.config` import pattern from `scripts/spike-cloudinary-upload.ts` / `scripts/seed-phase2.ts` — do NOT go through the HTTP REST API for a local seed script |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `scripts/lighthouse-mobile.mjs` (existing file) | Reference implementation for driving Lighthouse against a URL and extracting category scores | Do not rewrite from scratch — clone its `getChromePath()` + `runLighthouse()` functions into a new script that (a) takes an arbitrary **external** `liveUrl` per site instead of the fixed local `ROUTES` array, and (b) captures `categories.performance.score` etc. as integers 0-100 to store directly in `Websites.lighthouse.*` fields |
| `scripts/spike-cloudinary-upload.ts` (existing file) | Reference implementation for the Local-API-create → Cloudinary-upload → verify-URL flow | Clone this pattern for screenshot capture: Playwright saves a PNG to a temp path, then `payload.create({ collection: 'media', filePath: tmpPngPath, data: { alt } })` uploads it to Cloudinary, then the returned Media `id` gets attached to the new `Websites` doc's screenshot field |

## Installation

```bash
# Nothing to install — payload, lighthouse, chrome-launcher, @puppeteer/browsers,
# playwright (with chromium browsers already downloaded), and cloudinary are all
# already present in package.json / node_modules at current versions.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `lighthouse` Node API (local, via `chrome-launcher`) | Google PageSpeed Insights API (`https://www.googleapis.com/pagespeedonline/v5/runPagespeed`) | If Juan wants scores sourced from Google's own hosted infra (CrUX field data blended in) rather than a local lab run — but PSI's API has rate limits and returns lab data from Google's servers, not a locally-reproducible run. Since these are one-time captures of Juan's own already-live sites, running Lighthouse locally (as the project already does for regression baselines) keeps consistency with existing tooling and gives full control over form factor/throttling. |
| `playwright` full-page screenshot | A hosted screenshot API (urlbox.io, screenshotone, apiflash, etc.) | Only if Juan wants zero local browser dependency or needs screenshots refreshed automatically/on a schedule post-launch. For a one-time capture of 6 known sites, a hosted API adds a paid dependency + API key for something Playwright (already installed with browsers cached) does for free in one script run. |
| `playwright` | `puppeteer` (`@puppeteer/browsers` is already a devDependency, but that's just the browser-fetching helper, not the automation library) | If a future need arises for Puppeteer-specific APIs — not the case here. The project already standardized on Playwright as its screenshot/automation tool (multiple `verify-*.mjs`/`smoke-check-*.mjs` scripts) and on `chrome-launcher` + `@puppeteer/browsers` specifically as the Lighthouse-driving pair. Don't blend a second automation library in for the same job. |
| Scripted capture (default) | Manual score entry (Juan runs Lighthouse in Chrome DevTools by hand, types numbers into admin) | Fine as a per-site fallback if scripted capture chokes on a specific external site (bot-detection, geo-block, etc.), but scripted capture should be the default — it's reproducible and matches the "real Lighthouse scores" requirement more rigorously than manual DevTools runs, which vary run-to-run more (though both count as "real"). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| A new npm package for "Lighthouse as a service" (e.g. `lighthouse-batch`, `unlighthouse`) | Adds a dependency and its own opinionated runner/config just to loop over 6 URLs once — the project already has a working, understood Lighthouse-driving script (`lighthouse-mobile.mjs`) to clone from | Clone/adapt the existing script, loop over the 6 real `liveUrl`s |
| A hosted screenshot API as the default | Introduces a new paid vendor + API key for a one-time capture of exactly 6 sites the project already has full browser automation tooling for | Playwright, already installed with browsers cached |
| Storing screenshots as local files in `public/` or committing them to git | Violates the project's established Cloudinary-only media policy (local-disk uploads don't persist on Hostinger — see root `CLAUDE.md` "What NOT to Use") | Upload through the existing `Media` collection → `cloudinaryAdapter`, same as every other image in the site |
| Running Lighthouse against a local dev/build equivalent of the 6 external sites, or assuming their own infra needs tuning | These are Juan's finished, already-deployed sites (ariannalupi.com, aprendoclub.com, etc.) — there's no "prod build" step to control here; just point Lighthouse at each site's live public URL | Run Lighthouse directly against each real `liveUrl`, mobile form factor, matching the project's existing baseline methodology (`lighthouse-mobile.mjs`) for consistency |
| A brand-new `@payloadcms/plugin-seo` wiring, `plugin-form-builder`, or other plugin for this collection | Out of scope for this milestone — `Websites` is a portfolio-of-work showcase like `case-studies`/`clientes`, not a marketing landing page needing its own meta-tab plugin from scratch | If detail pages need custom meta, add `websites` to the existing `@payloadcms/plugin-seo` `collections` array — no new package |

## Stack Patterns by Variant

**If a site's live URL blocks headless Chrome / bot detection (possible for a client site behind Cloudflare):**
- Fall back to a manual Lighthouse run in real Chrome DevTools (Juan runs it, provides the 4 numbers) for that one site, and note in the collection's admin description that the score was captured manually vs. scripted.
- Because scripted capture should be the default (reproducible, matches methodology already used for regression baselines) but must not block seeding the other 5 sites if one has bot protection.

**If Juan wants scores refreshed automatically after launch (not just a one-time seed):**
- Do not build a cron/scheduled re-audit system now — this milestone is scoped as a one-time real-data capture, not a live monitoring feature, and Hostinger's persistent-Node model doesn't provide serverless-cron-style scheduling out of the box.
- Because `PROJECT.md` explicitly scopes this milestone to "poblado con 6 sitios reales" with data captured once, and building ongoing monitoring would reopen the "Out of Scope: dashboard interno de analytics/SEO tooling" exclusion from the root project scope.

**If a screenshot needs a specific viewport (mobile vs. desktop) rather than default desktop full-page:**
- Pass `viewport: { width, height }` to `browser.newContext()` before `page.goto()` in the capture script — Playwright supports this natively, no extra package.
- Because the existing case-study hero pattern is desktop-first; only add a mobile-viewport screenshot field if the `Websites` UI design calls for both.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `lighthouse@13.4.0` | `chrome-launcher@^1.2.1`, Chrome-for-Testing binaries resolved via `@puppeteer/browsers@3.0.6` | Exact combination already proven working by `scripts/lighthouse-mobile.mjs` in this repo — no version drift risk, all three already pinned/installed |
| `playwright@1.61.1` | Chromium build cached at `~/Library/Caches/ms-playwright` (chromium-1228, headless-shell-1228) | Browsers already downloaded on this machine — if running the capture script on a different machine (e.g. CI or a fresh clone), run `npx playwright install chromium` first; otherwise `page.screenshot()` fails with a missing-browser error |
| `payload@3.85.2` Local API `payload.create({ collection: 'media', filePath })` | `cloudinaryAdapter` (`src/lib/cloudinary-adapter.ts`), `cloudinary@2.10.0` | Proven end-to-end by `scripts/spike-cloudinary-upload.ts` — reuse verbatim, including its documented `mimeType`/`filesize` handling quirks in `cloudinary-adapter.ts` |

## Sources

- Local repo inspection: `package.json` (dependencies/devDependencies confirmed installed and current) — HIGH
- Local repo inspection: `scripts/lighthouse-mobile.mjs` (working Lighthouse + chrome-launcher + @puppeteer/browsers pattern, Phase 11) — HIGH
- Local repo inspection: `scripts/spike-cloudinary-upload.ts` (working Local API → Cloudinary upload pattern, Phase 3) — HIGH
- Local repo inspection: `src/lib/cloudinary-adapter.ts` (Cloudinary adapter implementation + documented gotchas) — HIGH
- `npm view` (live registry query, 2026-07-14): confirmed `lighthouse@13.4.0`, `playwright@1.61.1`, `chrome-launcher@1.2.1`, `@puppeteer/browsers@3.0.6`, `cloudinary@2.10.0` are current latest versions and match what's already installed in this project — HIGH
- Local filesystem check: `~/Library/Caches/ms-playwright` confirms Chromium browsers (build 1228) already downloaded on this machine — HIGH
- WebSearch: "run Lighthouse CLI programmatically against a URL and get JSON scores node script" — confirmed the Node-module pattern (`lighthouse` + `chrome-launcher`, scores as `category.score * 100`) matches what's already implemented in this repo — MEDIUM (general pattern confirmation, not project-specific)
- `.planning/PROJECT.md` — milestone v1.9 scope definition (6 real sites, real Lighthouse scores, real screenshots, one-time capture not ongoing monitoring) — HIGH
- `.planning/research/STACK.md` — base project stack (Payload/Next/Postgres/Cloudinary/Resend), not repeated here — HIGH

---
*Stack research for: Payload CMS "Websites I've built" portfolio showcase (new collection + real Lighthouse capture + real screenshot capture)*
*Researched: 2026-07-14*
