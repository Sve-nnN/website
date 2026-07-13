---
phase: 26-ui-ux-polish-pass-low-risk-components
plan: 03
subsystem: frontend/breadcrumbs
tags: [breadcrumbs, case-studies, json-ld, seo, ui-polish]
dependency-graph:
  requires:
    - src/lib/breadcrumbs.ts (Phase 22, buildTrail/buildBreadcrumbJsonLd)
  provides:
    - buildCaseStudiesTrail() (src/lib/breadcrumbs.ts)
    - Visual breadcrumb nav + BreadcrumbList JSON-LD on Case Studies listing + detail pages
  affects:
    - "src/app/(frontend)/[locale]/case-studies/page.tsx"
    - "src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"
tech-stack:
  added: []
  patterns:
    - "Section-parameterized internal helper (buildSectionTrail) shared by buildTrail (services) and buildCaseStudiesTrail (case-studies), avoiding URL/locale logic duplication"
key-files:
  created: []
  modified:
    - src/lib/breadcrumbs.ts
    - "src/app/(frontend)/[locale]/case-studies/page.tsx"
    - "src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx"
decisions:
  - "Case Studies section segment is NOT locale-prefixed (case-studies for both es/en), unlike Services (servicios/services) -- captured explicitly in SECTION_SEGMENTS per UI-SPEC Component 6"
  - "Listing page breadcrumb uses light-surface variant (text-muted-foreground / hover:text-foreground) since its background is off-white, not navy -- detail page reuses the navy variant (text-secondary-foreground/70) matching Hero's existing pattern"
  - "Removed now-dead SITE_URL const and copy.home/copy.caseStudies keys from case-studies/[slug]/page.tsx after replacing the hand-rolled breadcrumbData object -- nothing else in the file referenced them (verified via grep before deleting)"
metrics:
  duration: 25min
  completed: 2026-07-13
---

# Phase 26 Plan 03: Case Studies Breadcrumbs (UIPOL-09) Summary

Extended the existing Services breadcrumb helper (`src/lib/breadcrumbs.ts`, Phase 22) with a generalized internal `buildSectionTrail()` and a new sibling export `buildCaseStudiesTrail()`, then wired both Case Studies pages (listing + detail) to the shared helper -- closing a gap where the listing page had no breadcrumb at all and the detail page had a hand-rolled, desynced JSON-LD-only implementation.

## What Was Built

**Task 1 — `src/lib/breadcrumbs.ts` extension:**
- Added `Section` type (`'services' | 'case-studies'`), `SECTION_LABELS` and `SECTION_SEGMENTS` records
- Extracted `sectionIndexHref()` and generic internal `buildSectionTrail(locale, section, current)`
- Redefined `buildTrail()` as a thin wrapper: `buildSectionTrail(locale, 'services', current)` -- byte-for-byte behavior-compatible, zero changes needed at any of the 4 existing Services call sites
- Added new exported `buildCaseStudiesTrail(locale, current)` -- sibling calling `buildSectionTrail(locale, 'case-studies', current)`
- `buildBreadcrumbJsonLd()` left completely untouched

**Task 2 — Wiring both Case Studies pages:**
- `case-studies/page.tsx`: added visual breadcrumb `<nav>` (light-surface variant: `text-muted-foreground`, `hover:text-foreground`) above the `<h1>`, plus a `<JsonLd>` component rendering `buildBreadcrumbJsonLd(trail)` -- this page previously emitted neither
- `case-studies/[slug]/page.tsx`: deleted the hand-rolled `breadcrumbData` object (and the now-dead `SITE_URL` const + `copy.home`/`copy.caseStudies` keys it depended on), replaced with `buildCaseStudiesTrail(locale, { slug, title })` + `buildBreadcrumbJsonLd(trail)`; inserted a visual breadcrumb `<nav>` (navy variant: `text-secondary-foreground/70`) inside the hero `Container`, above the client/sector/period metadata row
- Both pages compute the trail once and reuse the same variable for both the JSON-LD payload and the visual nav

## Live Verification (real dev server, real Neon data)

- `/case-studies` (ES): 2-level nav `Inicio > Casos de éxito`, `BreadcrumbList` JSON-LD present and matching
- `/en/case-studies` (EN): 2-level nav `Home > Case Studies`
- `/case-studies/migracion-ecommerce-nextjs-seo-tecnico` (ES): 3-level nav `Inicio > Casos de éxito > Migración a Next.js sin perder tráfico orgánico`, JSON-LD matching all 3 entries
- `/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico` (EN): 3-level nav `Home > Case Studies > Migrating to Next.js without losing organic traffic`
- Regression check -- all 4 Services combos still 200 and render correctly: `/servicios` (2-level), `/en/services` (2-level), `/services`, `/en/servicios`, plus `/servicios/seo-technical-audit` (3-level detail, 4th call site)
- `npx tsc --noEmit -p tsconfig.json`: zero errors
- `git diff --stat`: only `breadcrumbs.ts` + 2 Case Studies `page.tsx` files changed -- zero `config.ts`/`payload-types.ts`/migration files touched, zero Services `page.tsx` files touched

## Deviations from Plan

None - plan executed exactly as written. One small additive cleanup within Task 2's own scope: removed the `SITE_URL` const and the two now-unused `copy` object keys (`home`, `caseStudies`) in `case-studies/[slug]/page.tsx` after deleting the `breadcrumbData` object that was their only consumer (verified via grep before deleting, as instructed by the plan's action step).

## Known Stubs

None.

## Threat Flags

None -- no new network surface, auth path, or schema change introduced. `doc.slug`/`doc.title` flow through the same already-trusted Local API -> JSON-LD path Services already uses (T-26-06 mitigation: buildTrail backward compatibility verified live above, not just via tsc).

## Self-Check: PASSED

- FOUND: src/lib/breadcrumbs.ts (buildCaseStudiesTrail present, tsc clean)
- FOUND: src/app/(frontend)/[locale]/case-studies/page.tsx (breadcrumb nav + JsonLd wired)
- FOUND: src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx (breadcrumb nav + JsonLd wired, breadcrumbData removed)
- FOUND commit 0d0713f: feat(26-03): extend breadcrumbs.ts with buildCaseStudiesTrail
- FOUND commit 024ac8d: feat(26-03): wire Case Studies pages to shared breadcrumb helper
