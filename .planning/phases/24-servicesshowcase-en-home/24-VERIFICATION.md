---
phase: 24-servicesshowcase-en-home
verified: 2026-07-13T02:15:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 24: ServicesShowcase en Home Verification Report

**Phase Goal:** Home gana un bloque `ServicesShowcase` con las 4 tarjetas de servicio (leídas dinámicamente de `SERVICE_SLUGS`, no hardcodeadas), enlazando a sus landings en el locale activo, registrado de forma puramente aditiva en Payload (SVCHOME-01/02/03).
**Verified:** 2026-07-13T02:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A visitor on Home (/, /en) sees a "Services" section with exactly 4 cards, one per SERVICE_SLUGS entry, in both locales | ✓ VERIFIED | Live curl against running dev server (localhost:3000). `/` returns HTTP 200, `grep -oc 'href="/servicios/[a-z-]*"'` = 4 unique hrefs (`ai-seo-geo`, `fullstack-development`, `seo-consulting`, `seo-technical-audit`). `/en` returns HTTP 200, `grep -oc 'href="/en/services/[a-z-]*"'` = 4 unique hrefs, same 4 slugs. Section title "Cómo puedo ayudarte" / "How I can help" present in each locale's HTML. Card `<h3>` titles confirmed real and distinct per locale (e.g. es: "Auditoría SEO Técnica", "Consultoría SEO", "Desarrollo Full-Stack con SEO integrado", "SEO para IA / GEO"). |
| 2 | Each card links to the correct locale-appropriate service landing URL and that URL returns 200 | ✓ VERIFIED | All 8 target URLs curled individually and confirmed HTTP 200: `/servicios/{ai-seo-geo,fullstack-development,seo-consulting,seo-technical-audit}` and `/en/services/{same 4 slugs}`. |
| 3 | The card grid is driven by SERVICE_SLUGS + getServicePage — no card title/copy is hardcoded per-instance in the block component | ✓ VERIFIED | Read `src/blocks/ServicesShowcase/Component.tsx` directly: imports `SERVICE_SLUGS`/`getServicePage` from `@/lib/services-data`, maps over `SERVICE_SLUGS`, renders `page.title`/`page.meta?.description` from the fetched doc. `grep -n "Servicios\|Services" Component.tsx` matches only type/import names, no hardcoded per-card copy. CTA label sourced from `next-intl` messages (`servicesShowcase.cta` in `messages/en.json`/`messages/es.json`), not hardcoded per card. |
| 4 | The new block is registered purely additively — zero existing fields/columns modified | ✓ VERIFIED | `git show 2ce4c78 -- src/collections/Pages/index.ts` and `RenderBlocks.tsx`: diffs show only added lines (`+import`, `+ServicesShowcase` array entry, `+servicesShowcase: ServicesShowcaseComponent` map entry) — zero existing lines removed or reordered. Migration `src/migrations/20260713_005924.ts` read directly: contains only `CREATE TABLE` (4 new tables), `ADD CONSTRAINT` (new FKs referencing existing `pages`/`_pages_v` id columns, not altering them), `CREATE INDEX` — zero `DROP`, zero `ALTER COLUMN` on any pre-existing table. `src/migrations/index.ts` diff shows only a new import + new array entry appended. |

**Score:** 4/4 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/blocks/ServicesShowcase/config.ts` | Block slug `servicesShowcase`, `interfaceName ServicesShowcaseBlock`, single localized `title` field | ✓ VERIFIED | Matches exactly — read in full, no stub markers |
| `src/blocks/ServicesShowcase/Component.tsx` | Server component fetching 4 SERVICE_SLUGS pages, rendering 2x2 grid | ✓ VERIFIED | Read in full, matches UI-SPEC markup verbatim (Container py-12, conditional h2, grid grid-cols-1 sm:grid-cols-2 gap-6, icon badge, CTA row) |
| `scripts/seed-phase24-services-showcase.ts` | Idempotent seed of Home's layout, both locales | ✓ VERIFIED (indirect) | Live render confirms exactly 1 instance per locale (4 links, not 8/duplicated) — consistent with idempotent behavior claimed in SUMMARY |
| `src/migrations/20260713_005924.ts` | Additive-only migration for new block tables | ✓ VERIFIED | Read directly — CREATE TABLE/ADD CONSTRAINT/CREATE INDEX only |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/collections/Pages/index.ts` | `src/blocks/ServicesShowcase/config.ts` | import + blocks array entry | ✓ WIRED | Confirmed in git diff and current file content |
| `src/blocks/RenderBlocks.tsx` | `src/blocks/ServicesShowcase/Component.tsx` | blockComponents map entry | ✓ WIRED | Confirmed in git diff and current file content |
| `src/blocks/ServicesShowcase/Component.tsx` | `src/lib/services-data.ts` | SERVICE_SLUGS + getServicePage calls | ✓ WIRED | Confirmed by direct code read; live curl output shows real, distinct data per card (proves data actually flows, not stubbed) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `ServicesShowcaseComponent` | `pages` (from `Promise.all(SERVICE_SLUGS.map(getServicePage))`) | `src/lib/services-data.ts` → Payload Local API query against real Postgres | Yes — 4 distinct real titles/descriptions rendered per locale on the live dev server | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Home (es) shows 4 service cards | `curl -s localhost:3000/ \| grep -oc 'href="/servicios/[a-z-]*"'` | 4 (unique) | ✓ PASS |
| Home (en) shows 4 service cards | `curl -s localhost:3000/en \| grep -oc 'href="/en/services/[a-z-]*"'` | 4 (unique) | ✓ PASS |
| All 8 target service URLs (4 slugs x 2 locales) return 200 | individual curl per URL | all 200 | ✓ PASS |
| Section title renders per locale | grep for exact seeded strings | both found | ✓ PASS |
| TypeScript compiles clean (regression check) | `npx tsc --noEmit` | exit 0 | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SVCHOME-01 | 24-01-PLAN.md | Home shows ServicesShowcase block with 4 cards, both locales | ✓ SATISFIED | Live curl verification, both locales |
| SVCHOME-02 | 24-01-PLAN.md | Cards driven by SERVICE_SLUGS/getServicePage, not hardcoded, correct locale-appropriate links | ✓ SATISFIED | Code read + live data distinctness confirms dynamic sourcing; all 8 URLs return 200 |
| SVCHOME-03 | 24-01-PLAN.md | Block registered purely additively, no existing columns modified | ✓ SATISFIED | git diff on Pages/index.ts, RenderBlocks.tsx, and migration SQL all confirm additive-only |

Note: `.planning/REQUIREMENTS.md` still shows SVCHOME-01/02/03 as unchecked (`- [ ]`) and the phase-tracking table rows as "Pending" — this is a documentation-sync gap, not a functional gap. The underlying requirements are satisfied in the live codebase; REQUIREMENTS.md checkboxes should be updated to `[x]` as part of phase close.

### Anti-Patterns Found

None. Scanned `src/blocks/ServicesShowcase/config.ts`, `Component.tsx`, and `scripts/seed-phase24-services-showcase.ts` for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER` — zero matches. No empty implementations, no hardcoded empty data flowing to render.

### Human Verification Required

None. All must-haves were verifiable programmatically via direct code read, git diff, and live HTTP verification against the running dev server.

### Notes (non-blocking)

- `24-UI-SPEC.md`'s "Checker Sign-Off" section (Dimensions 1-6, `Approval: pending`) is unchecked. Cross-checked against 5 other completed phases in this repo with UI-SPEC.md files (Phase 5, 12, 13, 15, 16) — all show the identical unchecked `Approval: pending` state despite being fully closed/completed phases. This is a project-wide convention/artifact gap, not specific to Phase 24, and does not indicate the visual implementation deviates from spec (live HTML output was independently verified against the UI-SPEC's exact class names: `Container py-12`, `grid grid-cols-1 sm:grid-cols-2 gap-6`, icon badge `size-10`/`bg-primary/10`, CTA row markup — all match verbatim).
- REQUIREMENTS.md checkboxes for SVCHOME-01/02/03 remain unchecked; recommend updating to `[x]` since functional verification passed.

### Gaps Summary

No blocking gaps found. Phase goal achieved: Home renders the `ServicesShowcase` block with exactly 4 dynamically-sourced service cards in both locales, each linking correctly to a live, 200-returning landing page, registered as a purely additive Payload block/migration with zero modification to any pre-existing schema or file content.

---

_Verified: 2026-07-13T02:15:00Z_
_Verifier: Claude (gsd-verifier)_
