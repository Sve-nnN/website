---
phase: 42-meta-tags-completion
reviewed: 2026-08-01T15:56:19Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - src/lib/canonical.ts
  - src/app/(frontend)/[locale]/layout.tsx
  - scripts/generate-favicon-pngs.ts
  - public/site.webmanifest
  - src/app/(frontend)/[locale]/page.tsx
  - src/app/(frontend)/[locale]/contact/page.tsx
  - src/app/(frontend)/[locale]/privacy/page.tsx
  - src/app/(frontend)/[locale]/terms/page.tsx
  - src/app/(frontend)/[locale]/search/page.tsx
  - src/app/(frontend)/[locale]/blog/page.tsx
  - src/app/(frontend)/[locale]/blog/[slug]/page.tsx
  - src/app/(frontend)/[locale]/case-studies/page.tsx
  - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
  - src/app/(frontend)/[locale]/authors/page.tsx
  - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
  - src/app/(frontend)/[locale]/websites/page.tsx
  - src/app/(frontend)/[locale]/websites/[slug]/page.tsx
  - src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx
  - src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 42: Code Review Report

**Reviewed:** 2026-08-01T15:56:19Z
**Depth:** standard
**Files Reviewed:** 19
**Status:** issues_found

## Summary

Reviewed the sitewide favicon/manifest/theme-color wiring (`[locale]/layout.tsx` + `public/` assets) and the new `buildAlternates()` canonical/hreflang helper wired into all 15 non-Servicios route files.

Traced every one of the 15 route files by hand: in each case the `esPath`/`enPath` pair passed to `buildAlternates()` is byte-identical to the `url:` expression that same `generateMetadata()` already passes to `buildOpenGraph()` (Phase 41) — confirmed via `git diff` (each route's diff is a pure 2–6 line addition, no existing `url:` line touched) and via direct reading of all 15 files. No canonical/og:url drift found anywhere in the diff.

`buildAlternates()` is a genuinely independent sibling of `buildServiceAlternates()` — it takes `esPath`/`enPath` as plain parameters instead of the Servicios-specific `esPathFor`/`enPathFor` closures, shares no state, and the diff shows `buildServiceAlternates()` untouched (0 lines changed).

`scripts/generate-favicon-pngs.ts` is not wired into any npm script (`package.json` has no reference to it) and only writes the 4 derived PNG files — it never touches `favicon.ico`/`favicon.svg`, so it cannot be accidentally destructive. Rasterizing the whole SVG buffer does correctly yield the `#light-icon` variant, because the stylesheet's unconditional base rule sets `#dark-icon { display: none }` and `prefers-color-scheme` never matches during a static Sharp render — the code comment's claim is accurate. All 4 committed PNGs were verified byte-for-byte with `file`: 180×180, 32×32, 192×192, 512×512 — exactly matching their declared `sizes` in `layout.tsx` and `site.webmanifest`.

`site.webmanifest` is valid JSON, leaks no sensitive data, and its `theme_color`/`background_color` match the `--primary`/`--background` CSS custom properties in `globals.css` exactly (`#F7581E` / `#FAFAF7`). Its two icon paths (`/icon-192.png`, `/icon-512.png`) match committed files.

The new `viewport` export in `layout.tsx` is the only `viewport`/`themeColor` declaration in the entire `src/app` tree (confirmed via grep) — no conflict with a pre-existing export, and it correctly moves `themeColor` out of `metadata` per the Next.js 15 requirement.

`npx tsc --noEmit` passes with zero errors after this phase's changes.

One real robustness gap found (WARNING) in the shared `canonical.ts` helper, now used across 15 routes instead of the Servicios-only 4. Two INFO-level notes are included for completeness.

## Warnings

### WR-01: `buildAlternates()` builds canonical/hreflang URLs with unguarded string concatenation — a trailing-slash misconfiguration silently produces double-slash URLs sitewide

**File:** `src/lib/canonical.ts:63-70`
**Issue:** `canonical: \`${SITE_URL}${targetPath}\`` and the three `languages` entries all concatenate `SITE_URL` directly with paths that start with `/`, with no normalization. `SITE_URL` is `process.env.NEXT_PUBLIC_SERVER_URL` (via `resolveSiteUrl()` in `src/lib/sitemap-data.ts`), which is operator-controlled input with no trailing-slash validation. If it's ever set with a trailing slash (e.g. `https://juancarlosangulo.com/`), every `<link rel="canonical">` and every `hreflang` alternate on all 15 routes this phase wired would render with a double slash (`https://juancarlosangulo.com//en/blog/my-post`), which is a distinct URL from the real page and would either be ignored by crawlers or actively hurt indexing — directly undermining this project's stated core value ("if SEO fails, the site doesn't fulfill its purpose," per `CLAUDE.md`). This exact pattern already existed in the pre-existing `buildServiceAlternates()` (untouched, not introduced by this phase), but this phase multiplies its blast radius from 4 routes to 19. Currently `.env` has `NEXT_PUBLIC_SERVER_URL=http://localhost:3000` (no trailing slash), so it does not currently manifest — but there is no guard preventing a future misconfiguration (e.g. copy-pasting a URL with a trailing slash into a hosting provider's env panel) from silently corrupting every canonical/hreflang tag sitewide with no build-time or runtime warning.
**Fix:** Normalize the base URL once, e.g.:
```ts
const BASE = SITE_URL.replace(/\/$/, '')
// ...
canonical: `${BASE}${targetPath}`,
languages: {
  es: `${BASE}${esPath}`,
  en: `${BASE}${enPath}`,
  'x-default': `${BASE}${esPath}`,
},
```
Apply the same fix to `buildServiceAlternates()` for consistency (both functions share the same `SITE_URL` import).

## Info

### IN-01: Task 3's live-render verification for this phase was never actually executed

**File:** `.planning/phases/42-meta-tags-completion/42-03-SUMMARY.md:121-132` (process artifact, not source)
**Issue:** Per the phase's own SUMMARY, the planned live `curl` sweep across all 19 route types (the actual runtime check that canonical/og:url/favicon/manifest tags render correctly in a served HTML response) was blocked twice by local Neon Postgres connectivity and deferred, logged as open `WINDOWS.md` id 4. This review's confirmation that canonical paths match `og:url` is based on static code tracing (reading every route file plus `git diff`) and a clean `tsc --noEmit`, not on an actual rendered page. Static tracing is strong evidence here (the code is simple string literals with no dynamic branching that a curl sweep would catch and static tracing wouldn't), but it is not a substitute for the live verification the plan itself specified as its acceptance evidence.
**Fix:** Not a code fix — flagging so the pending live-curl sweep (`npm run dev && curl -s http://localhost:3000/seo-tecnico-lima | grep canonical`, repeated per the Task 3 verify block) is not forgotten before `/gsd-ship`, consistent with the open `WINDOWS.md` id 4 entry already tracking this.

### IN-02: `generate-favicon-pngs.ts` assumes it is always invoked with the repo root as CWD, with no explicit guard

**File:** `scripts/generate-favicon-pngs.ts:24,37`
**Issue:** `SVG_PATH = path.join('public', 'favicon.svg')` and `outPath = path.join('public', file)` are relative paths. The file's own header comment documents the intended invocation (`node_modules/.bin/tsx scripts/generate-favicon-pngs.ts`, implying repo-root CWD), and a wrong CWD does fail loudly via the `main().catch()` handler rather than corrupting anything — so this is not a functional bug, just a minor robustness gap for a one-off manual script.
**Fix:** Optional — anchor the paths to the script's own location for CWD-independence:
```ts
const ROOT = path.resolve(import.meta.dirname, '..')
const SVG_PATH = path.join(ROOT, 'public', 'favicon.svg')
// and: path.join(ROOT, 'public', file)
```

---

_Reviewed: 2026-08-01T15:56:19Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
