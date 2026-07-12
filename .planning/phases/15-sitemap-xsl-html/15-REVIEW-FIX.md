---
phase: 15-sitemap-xsl-html
fixed_at: 2026-07-12T01:35:18Z
review_path: .planning/phases/15-sitemap-xsl-html/15-REVIEW.md
iteration: 1
findings_in_scope: 13
fixed: 12
skipped: 1
status: partial
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-07-12T01:35:18Z
**Source review:** .planning/phases/15-sitemap-xsl-html/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 13 (9 warnings + 4 info)
- Fixed: 12
- Skipped: 1 (IN-04, per the review's own "no action required" guidance)

## Fixed Issues

### WR-01: `SITE_URL` fallback silently points sitemap at the wrong domain if env var is unset

**Files modified:** `src/lib/sitemap-data.ts`
**Commit:** ee43d06
**Applied fix:** Wrapped the `SITE_URL` computation in `resolveSiteUrl()`, which throws in production when `NEXT_PUBLIC_SERVER_URL` is unset (instead of silently falling back to `juancarlosangulo.com`) and logs a `console.warn` in development.

### WR-02: EN-locale pages are never emitted as primary `<loc>` entries in `sitemap.xml`

**Files modified:** `src/lib/sitemap-data.ts`
**Commit:** fe86504
**Applied fix:** `getSitemapEntries()` now emits one `SitemapEntry` per locale (ES and EN) instead of one per document, each carrying the full reciprocal `alternates` pair and a new `locale` field. Verified live: `/sitemap.xml` now returns 148 `<loc>` entries (74 docs × 2 locales), each with self + alternate `xhtml:link` hreflang annotations.

### WR-03: No error handling around `getSitemapEntries()` in either route handler

**Files modified:** `src/app/sitemap.xml/route.ts`, `src/app/sitemap.html/route.ts`
**Commit:** a4197b3
**Applied fix:** Both `GET` handlers now wrap `getSitemapEntries()` in try/catch, log the error server-side, and return a safe non-200 response (empty valid `<urlset>` with status 500 for XML; plain-text 500 for HTML) instead of letting the error bubble into Next's default unhandled-error page.

### WR-04: `sitemap.html` language switcher duplicates the ES link inside the same list item

**Files modified:** `src/app/sitemap.html/route.ts`
**Commit:** fe86504
**Applied fix:** `renderItem` now derives the "other" locale from `entry.locale` and only renders a switcher link to that other locale, never to the entry's own URL. Verified live: 0 of 148 rendered `<li>` rows have duplicate main/switcher hrefs.

### WR-05: `hasAlternates` check in `sitemap.html` is an unreachable branch

**Files modified:** `src/app/sitemap.html/route.ts`
**Commit:** 746eb68
**Applied fix:** Removed the dead conditional — since `getSitemapEntries()` always produces distinct es/en alternates today, the switcher link is now rendered unconditionally with a comment explaining why.

### WR-06: Both bilingual-backfill scripts match link items via `link.url` without checking `type: 'custom'`

**Files modified:** `scripts/fix-header-navitems-es-labels.ts`, `scripts/seed-phase15-sitemap-footer-link.ts`
**Commit:** b6da14f
**Applied fix:** Both scripts now explicitly check `link.type === 'custom'` before matching by `url`, and log a `console.warn` for any item whose link type isn't `'custom'` (i.e., `'reference'` items, the field's default) instead of silently no-oping.

### WR-07: Footer seed's column backfill matches ES/EN columns by array index

**Files modified:** `scripts/seed-phase15-sitemap-footer-link.ts`
**Commit:** b6da14f
**Applied fix:** Column matching now uses the array row's stable, Payload-generated `id` via `.find()` instead of positional index. Added `console.warn` calls for unmatched EN columns and for EN column titles with no ES mapping, so silent no-ops are now visible.

### WR-08: `fix-header-navitems-es-labels.ts`'s hardcoded URL map is incomplete relative to the footer script

**Files modified:** `scripts/fix-header-navitems-es-labels.ts`
**Commit:** b6da14f
**Applied fix:** Added the missing `/search` entry to `ES_LABELS_BY_URL` for parity with the footer script's superset, with a comment documenting the relationship. Added a `console.warn` for any nav item whose URL doesn't match a known key.

### WR-09: Duplicate near-identical escaping helpers across the two route handlers

**Files modified:** `src/lib/sitemap-data.ts`, `src/app/sitemap.xml/route.ts`, `src/app/sitemap.html/route.ts`
**Commit:** cba66f9
**Applied fix:** Added a single `escapeMarkupText()` export in `sitemap-data.ts` (using the numeric `&#39;` entity, valid in both XML and HTML) and both route handlers now alias their local `escapeXml`/`escapeHtml` names to it instead of maintaining separate copies.

### IN-01: XSL "no alternates" fallback (`—`) is unreachable given current data

**Files modified:** `public/sitemap.xsl`
**Commit:** 915b348
**Applied fix:** Added a comment above the `xsl:choose` block clarifying the `xsl:otherwise` branch is defensive/future-proofing rather than dead code with no explanation, per the review's suggestion (no functional change needed since the review itself said no action was strictly required).

### IN-02: Language-switcher links lack `hreflang`/`lang` attributes

**Files modified:** `src/app/sitemap.html/route.ts`
**Commit:** fe86504
**Applied fix:** Folded into the WR-02/WR-04 rewrite of `renderItem` — both the main link and the switcher link now carry `hreflang` attributes matching their target locale.

### IN-03: Redundant re-fetch of the EN footer inside the seed script's locale loop

**Files modified:** `scripts/seed-phase15-sitemap-footer-link.ts`
**Commit:** 915b348
**Applied fix:** The loop now reuses the already-fetched `enFooter` reference for the `'en'` iteration instead of calling `payload.findGlobal` a second time.

## Skipped Issues

### IN-04: `sitemap.html` document declares `lang="en"` unconditionally

**File:** `src/app/sitemap.html/route.ts:48`
**Reason:** The review itself states this is "not clearly fixable without splitting the page by locale (out of scope per UI-SPEC, which explicitly allows English-only labels for this utility page) — noting for awareness only, no action required." No code change applied; documented here for visibility.
**Original issue:** The single served `/sitemap.html` document hardcodes `<html lang="en">` even though roughly half its content is ES URLs and the page mixes both locales' content by design.

---

## Verification

- `npx tsc --noEmit -p .` — clean, no errors anywhere in the project after all fixes.
- Live dev server (`localhost:3000`):
  - `GET /sitemap.xml` → `200`, `content-type: application/xml; charset=utf-8`, valid XML (parsed with `xml.dom.minidom`), 148 `<loc>` entries (74 documents × 2 locales, confirming WR-02).
  - `GET /sitemap.html` → `200`, 148 `<li>` rows, 0 rows with duplicate main/switcher hrefs (confirming WR-04 fix).
  - `GET /sitemap.xsl` → `200`.

---

_Fixed: 2026-07-12T01:35:18Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
