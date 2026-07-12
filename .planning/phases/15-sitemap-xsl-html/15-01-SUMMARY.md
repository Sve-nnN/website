---
phase: 15-sitemap-xsl-html
plan: 01
subsystem: seo
tags: [sitemap, xslt, xml, route-handler, nextjs]

# Dependency graph
requires: []
provides:
  - "Shared getSitemapEntries() query module (src/lib/sitemap-data.ts) reused by sitemap.xml and sitemap.html routes"
  - "Custom /sitemap.xml route handler with xml-stylesheet processing instruction"
  - "Static /sitemap.xsl stylesheet rendering readable table when sitemap.xml is opened in a browser"
affects: [15-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route handler at src/app/sitemap.xml/route.ts replaces the native Next.js sitemap.ts MetadataRoute convention when a processing instruction is required"
    - "Shared query logic lives in src/lib/sitemap-data.ts, consumed by multiple route handlers to avoid duplication"

key-files:
  created: [src/lib/sitemap-data.ts, src/app/sitemap.xml/route.ts, public/sitemap.xsl]
  modified: []

key-decisions:
  - "Ported sitemap.ts query logic exactly (5 collections, published-only filter, ES/EN alternates) — no redesign, per plan instruction"
  - "Kept SITE_URL fallback as https://juancarlosangulo.com to match the pre-existing pattern already repeated across robots.ts and other page files — changing it is out of scope for this phase; production correctness depends on NEXT_PUBLIC_SERVER_URL being set to https://juan-tech.com in the Hostinger environment"

patterns-established:
  - "Shared data module (src/lib/sitemap-data.ts) exporting SitemapEntry/SitemapGroup types + SITEMAP_GROUP_LABELS for reuse across sitemap.xml and sitemap.html routes"

requirements-completed: [SITEMAP-01]

# Metrics
duration: 15min
completed: 2026-07-11
---

# Phase 15 Plan 01: Sitemap XML route handler + XSL stylesheet Summary

**Custom `/sitemap.xml` route handler emitting hand-built XML with an `xml-stylesheet` processing instruction, paired with a static `public/sitemap.xsl` table stylesheet, replacing Next.js's native `MetadataRoute.Sitemap` convention which has no way to reference an XSL transform.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 2 completed
- **Files modified:** 4 (1 created lib module, 1 created route handler, 1 created XSL file, 1 deleted native sitemap.ts)

## Accomplishments
- `src/lib/sitemap-data.ts` — shared `getSitemapEntries()` query, ports the exact 5-collection/published-filter/ES-EN-alternates logic from the old `sitemap.ts`, plus `SITEMAP_GROUP_LABELS` for reuse in plan 15-02
- `src/app/sitemap.xml/route.ts` — hand-built XML with `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>`, defensive `escapeXml()` on every interpolated value
- `public/sitemap.xsl` — XSLT 1.0 stylesheet rendering URL/Last Modified/Language table with the exact hardcoded palette from 15-UI-SPEC.md
- Verified live against dev server: `/sitemap.xml` returns 74 URLs with the XSL processing instruction present; `/sitemap.xsl` served with `content-type: application/xml`

## Task Commits

1. **Task 1: Shared sitemap data module + sitemap.xml route handler** - `3a96421` (feat)
2. **Task 2: Static sitemap.xsl stylesheet** - `52d6012` (feat)

## Files Created/Modified
- `src/lib/sitemap-data.ts` - shared query module, types, group labels
- `src/app/sitemap.xml/route.ts` - custom XML route handler (replaces src/app/sitemap.ts)
- `src/app/sitemap.ts` - deleted (native convention superseded by route handler)
- `public/sitemap.xsl` - static XSLT stylesheet

## Decisions Made
- Ported query logic exactly, no redesign
- Kept the `https://juancarlosangulo.com` SITE_URL fallback unchanged — it's an existing repo-wide pattern (also present in `robots.ts` and page files), out of scope to touch in this phase. Flagged for Juan: confirm `NEXT_PUBLIC_SERVER_URL=https://juan-tech.com` is set in the Hostinger production environment.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. (Note: confirm production `NEXT_PUBLIC_SERVER_URL` env var per the decision above.)

## Next Phase Readiness
`getSitemapEntries()` and `SITEMAP_GROUP_LABELS` are ready for plan 15-02's `/sitemap.html` route to consume directly, no duplicated query logic needed.

---
*Phase: 15-sitemap-xsl-html*
*Completed: 2026-07-11*
