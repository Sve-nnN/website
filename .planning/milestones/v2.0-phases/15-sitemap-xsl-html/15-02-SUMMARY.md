---
phase: 15-sitemap-xsl-html
plan: 02
subsystem: seo
tags: [sitemap, footer, seed-script, bilingual, payload]

# Dependency graph
requires:
  - phase: 15-01
    provides: "getSitemapEntries()/SITEMAP_GROUP_LABELS shared query module"
provides:
  - "Real navigable /sitemap.html route grouped by section"
  - "Footer legalLinks Sitemap entry (es + en) pointing to /sitemap.html"
  - "Backfilled ES-locale legalLinks/columns labels on the Footer global (pre-existing bug fix)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Route handler at src/app/sitemap.html/route.ts reuses the shared sitemap-data.ts module (no duplicated query logic)"
    - "Idempotent seed scripts match by non-localized field (href) rather than localized label to avoid false negatives across locales"

key-files:
  created: [src/app/sitemap.html/route.ts, scripts/seed-phase15-sitemap-footer-link.ts]
  modified: []

key-decisions:
  - "Backfilled pre-existing missing ES localized labels on Footer.legalLinks and Footer.columns (Rule 3 - blocking bug), confirmed explicitly by Juan before running against the real production DB, since Payload validates the full merged global document on every updateGlobal call and the missing required+localized fields blocked any ES write to the Footer global"
  - "Reused the exact ES translations already authored in scripts/seed-header-footer-content.ts (Privacidad/Términos, Sitio/Contacto, Blog/Casos de éxito/Autores/Contáctame/Buscar) rather than inventing new copy, for consistency with prior intent"
  - "Preserved existing array item ids during the backfill to avoid re-orphaning the shared, non-localized array structure across locales"

patterns-established: []

requirements-completed: [SITEMAP-02]

# Metrics
duration: 40min
completed: 2026-07-11
---

# Phase 15 Plan 02: sitemap.html route + footer Sitemap link Summary

**Real navigable `/sitemap.html` page grouped by section (Pages/Blog/Case Studies/Authors/Categories), wired into the footer's `legalLinks` via an idempotent seed script — plus a Rule 3 fix for a pre-existing ES-locale bilingual data gap (missing required localized labels) that was blocking any write to the Footer global.**

## Performance

- **Duration:** ~40 min
- **Tasks:** 2 completed (+1 blocking-bug fix folded into Task 2)
- **Files modified:** 2 created

## Accomplishments
- `src/app/sitemap.html/route.ts` — full HTML document, 5 sections (Pages/Blog/Case Studies/Authors/Categories), empty groups omitted, EN/ES language switcher per item, token-aware light/dark inline CSS
- `scripts/seed-phase15-sitemap-footer-link.ts` — idempotent seed, matches by `href` not `label`, verified via two consecutive runs (add then skip)
- Backfilled a real, pre-existing ES-locale bug on the Footer global (missing required `label`/`title` values on existing `legalLinks`/`columns` items) that blocked the seed's own ES write — confirmed by Juan before running against the live DB
- Full live sanity pass against the dev server: `/sitemap.xml` (74 URLs, XSL PI present), `/sitemap.xsl` (valid XSLT, served with `content-type: application/xml`), `/sitemap.html` (5 groups, correct order, real content), footer "Sitemap" link present in both `/` and `/en` pointing to `/sitemap.html`, `robots.txt` still correctly references `/sitemap.xml` (no Phase 2 regression)

## Task Commits

1. **Task 1: sitemap.html route handler grouped by section** - `caf0801` (feat)
2. **Task 2: Idempotent footer "Sitemap" link seed** - `8fa03ab` (feat, includes Rule 3 fix)

## Files Created/Modified
- `src/app/sitemap.html/route.ts` - navigable grouped sitemap page
- `scripts/seed-phase15-sitemap-footer-link.ts` - footer link seed + ES label backfill

## Decisions Made
- Backfilled ES `legalLinks`/`columns` labels using the known-correct copy from `scripts/seed-header-footer-content.ts`, preserving ids — confirmed by Juan directly before executing against the real DB (this touched more of the Footer document than the plan's literal Task 2 scope, but was required to unblock the plan's own goal)

## Deviations from Plan

### Auto-fixed Issues (with explicit user confirmation)

**1. [Rule 3 - Blocking] Backfilled missing ES-locale required labels on Footer.legalLinks/columns**
- **Found during:** Task 2 (footer Sitemap link seed)
- **Issue:** Payload validates the FULL merged Footer global document on every `updateGlobal` call. The ES locale had empty `label`/`title` values on pre-existing array items (`legalLinks`: Privacy/Terms; `columns`: Site/Contact + nested link labels) — a data gap of the same shape already found/fixed in Phases 5, 13, and 14 (an EN-only write orphaning the shared array's ES localized values). This blocked ANY ES-locale write to Footer, including this seed's own append.
- **Fix:** Backfilled the missing ES values using the exact translations already authored in `scripts/seed-header-footer-content.ts` (Privacidad/Términos/Sitio/Contacto/Blog/Casos de éxito/Autores/Contáctame/Buscar), preserving each item's existing `id`.
- **Files modified:** `scripts/seed-phase15-sitemap-footer-link.ts` (backfill logic), Footer global data in the real Postgres DB
- **Verification:** Live curl against dev server confirmed the ES homepage footer now renders "Privacidad"/"Términos"/"Sitio"/"Contacto"/"Blog"/"Casos de éxito"/"Autores"/"Contáctame"/"Buscar"/"Sitemap" correctly, EN unaffected
- **Committed in:** `8fa03ab`
- **User confirmation:** Explicitly confirmed by Juan (verified the source translations directly in `scripts/seed-header-footer-content.ts`) before this ran against the real production database, after the auto-mode permission classifier flagged it as a shared-resource modification requiring authorization.

---

**Total deviations:** 1 auto-fixed (1 blocking, explicitly user-confirmed before execution)
**Impact on plan:** Necessary to unblock the plan's own goal (adding the Footer Sitemap link). No unrelated scope creep — reused pre-existing correct copy, did not invent new content.

## Issues Encountered
- Dev server webpack cache went stale after adding the new `sitemap.html` route while the server was running (`Cannot find module './431.js'`, matching the pattern already seen in Phase 12) — resolved by clearing `.next` and restarting, unrelated to Phase 15 code.
- **New, unrelated finding during sanity pass:** the `Header` global (main site nav, a different global from `Footer`) has the SAME class of ES-locale bug — `navItems[].link.label` is empty in ES, so the desktop nav renders with no visible link text on the ES homepage. This is out of scope for Phase 15 (Header, not Footer) and was NOT fixed — logged to `.planning/phases/15-sitemap-xsl-html/deferred-items.md` and flagged directly to Juan in the execution report. High severity (SEO/UX-critical, live on the ES homepage), recommend a quick follow-up fix using the same id-preserving backfill technique before v1.2 is considered fully closed.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 15 (SITEMAP-01, SITEMAP-02) is functionally complete. v1.2 milestone's last planned phase is done. Outstanding item: the Header ES-locale nav-label bug found during this phase's sanity pass (see deferred-items.md) — recommend Juan decide whether to address it as a quick follow-up before considering v1.2 fully closed, since it's a live, visible defect on the ES homepage nav.

---
*Phase: 15-sitemap-xsl-html*
*Completed: 2026-07-11*
