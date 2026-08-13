---
phase: 02-biling-e-seo
plan: 5
subsystem: seo
tags: [payload-local-api, seed, i18n, json-ld, redirects, sitemap, llms-txt, e2e-verification]

requires:
  - phase: 02-biling-e-seo (02-02)
    provides: localization block (es/en), Llms global, Pages/Posts/CaseStudies/Authors/Categories schema
  - phase: 02-biling-e-seo (02-03)
    provides: middleware (next-intl + redirects execution), [locale] restructure, JsonLd component
  - phase: 02-biling-e-seo (02-04)
    provides: sitemap.ts, robots.ts, llms.txt/llms-full.txt route handlers
provides:
  - Idempotent standalone seed script (scripts/seed-phase2.ts) populating Author/Category/Page(home)/Post/CaseStudy/Redirect + Llms global in both locales
  - blog/[slug]/page.tsx — post detail with Article JSON-LD + generateMetadata from SEO meta tab
  - case-studies/[slug]/page.tsx — case study detail with CreativeWork + BreadcrumbList JSON-LD + generateMetadata
  - End-to-end verification of the full Phase 2 i18n/SEO pipeline against real seeded data
affects: [04-migracion (ETL reuses Local API two-call locale pattern), 05-frontend (detail page shells)]

tech-stack:
  added: []
  patterns:
    - "Standalone seed script via getPayload({ config }) with relative config import (runs outside Next.js @payload-config alias) executed with tsx"
    - "Two-call locale pattern: create with locale 'es', then payload.update with locale 'en' to populate localized fields per doc"
    - "Idempotency by slug/from lookup before create (payload.find limit 1) — re-runnable seed logging 'already exists, skipping'"
    - "Hand-written JSON-LD objects passed to shared JsonLd component (JSON.stringify serialization, no injection surface)"

key-files:
  created:
    - scripts/seed-phase2.ts
    - src/app/(frontend)/[locale]/blog/[slug]/page.tsx
    - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
  modified: []

key-decisions:
  - "Seed content is explicitly minimal test/placeholder data (test-post, test-case-study, /legacy-test-url) per 02-CONTEXT.md — real content arrives in Phase 4 migration; test docs are trivially identifiable and removable"
  - "Seed targets the live Neon Postgres DB (no separate seed/staging DB exists); the run was gated behind an explicit authorization step, the same escalation pattern used for the Phase 1 migration"
  - "Redirect seeded with to: { type: 'custom', url: '/' } producing a real HTTP redirect through the 02-03 middleware"

requirements-completed: [I18N-02, I18N-05, I18N-06]

duration: ~25min
completed: 2026-07-09
---

# Phase 02 Plan 5: Seed Content + Detail Pages + End-to-End Verification Summary

**Idempotent Phase 2 seed script plus blog/case-study detail pages with hand-written Article/CreativeWork/BreadcrumbList JSON-LD — closing the phase by exercising every i18n/SEO code path (locale parity, redirects, sitemap, llms.txt, JSON-LD, SEO-tab-to-HTML) against real seeded bilingual content.**

## Performance

- **Duration:** ~25 min (implementation + seed run + verification)
- **Tasks:** 2
- **Files modified:** 3 (all new)

## Accomplishments

- `scripts/seed-phase2.ts` — idempotent standalone script creating Author (`juan-carlos-angulo`), Category (`seo`), Page (`home`), Post (`test-post`), CaseStudy (`test-case-study`), Redirect (`/legacy-test-url` → `/`), and the Llms global, using the two-call locale pattern (create es, update en) for localized fields and SEO meta tab fields
- `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` — async Server Component querying `posts` with `depth: 1` (populates author), rendering one Article JSON-LD block, `notFound()` on empty, and `generateMetadata` reading `doc.meta` before falling back to `doc.title`/`doc.excerpt`
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` — async Server Component querying `case-studies`, rendering two JSON-LD blocks (CreativeWork + BreadcrumbList with es/en breadcrumb labels), `notFound()` on empty, and `generateMetadata` from `doc.meta` with `doc.heroSubtitle` fallback

## Task Commits

Each task was committed atomically (code committed before the seed run):

1. **Task 1: Idempotent Phase 2 seed script** — `d4c0eb6` (feat)
2. **Task 2: Post and case-study detail pages with JSON-LD** — `29d6c62` (feat)

A blocker was recorded at `dd7009c` (docs) noting the seed needed authorization to write to production Neon. Per the orchestrator's report, that authorization step was subsequently cleared and the seed executed successfully (see End-to-End Verification below).

## Files Created/Modified

- `scripts/seed-phase2.ts` — 322-line standalone seed; instantiates Payload via `getPayload({ config })`, idempotency by slug/from lookup, `lexicalParagraph` helper for richText fields, final summary of created/found doc IDs to stdout
- `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` — 70 lines, Article JSON-LD + generateMetadata
- `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` — 93 lines, CreativeWork + BreadcrumbList JSON-LD + generateMetadata

## End-to-End Verification

The following results were reported by the orchestrator, which ran the seed against the live Neon DB and a local `npm run dev` server. They are recorded here as the orchestrator's reported outcome (not independently re-run by this executor):

**Seed execution (reported):**
- First run created Author(1), Category(1), Page/home(1), Post(1), CaseStudy(1), Redirect(1), and the Llms global
- Second run logged "already exists, skipping" for every entity — idempotency confirmed

**Runtime curl verification (8 checks, all reported passing):**

| Check | Route | Result |
|-------|-------|--------|
| Home (es, no prefix) | `/` | 200 |
| Home (en) | `/en` | 200 |
| Locale redirect | `/es` | 307 → `/` |
| Post detail | `/blog/test-post` | 200 |
| Case study detail | `/case-studies/test-case-study` | 200 |
| Redirect execution | `/legacy-test-url` | 308 → `/` |
| Sitemap real data | `/sitemap.xml` | 200, contains `test-post`/`test-case-study` (6 matches) |
| Llms real data | `/llms.txt` | 200, real Llms global content |
| Locale parity | `/en/blog/test-post` | 200 |

**JSON-LD confirmed in rendered HTML (reported):** Article on the blog post, CreativeWork + BreadcrumbList on the case study, Person on home (from 02-03).

Dev server was shut down after verification.

## Decisions Made

- Seed data kept intentionally minimal and clearly labeled as test content (`test-*` slugs, `/legacy-test-url`) so it is trivially removable before the Phase 4 real-content migration.
- Seed targets the live Neon Postgres DB because the project has no separate seed/staging database; the run was gated behind an explicit authorization step (same escalation pattern as the Phase 1 migration).

## Deviations from Plan

None — plan executed exactly as written. Both detail pages follow the `<interfaces>` JSON-LD reference shapes verbatim; the seed follows the two-call locale pattern and entity field specs from the plan.

## Issues Encountered

The only interruption was the expected authorization gate on running the seed against production Neon (recorded as blocker `dd7009c`). This is normal flow, not a bug — per the orchestrator's report it was cleared before the seed run. No code changes were required after the gate cleared.

## Known Stubs

The seeded content is intentional placeholder/test data (Author bio "Test bio for Phase 2.", Llms.txt "Placeholder llms.txt — Phase 2 plumbing test", etc.), explicitly sanctioned by 02-CONTEXT.md. Real content is delivered by the Phase 4 Mongo → Postgres migration. These are plumbing-validation stubs, not gaps blocking the plan's goal (proving the pipeline works end to end), which is fully achieved.

## Next Phase Readiness

- Phase 2 is functionally complete: all six I18N requirements are exercised end to end against real seeded bilingual content, and all reported curl checks pass.
- The seed script remains idempotent and re-runnable for future manual testing.
- Phase 4 (migration) can reuse the two-call locale pattern and Local API seeding approach established here; the test docs should be removed before real content is migrated.

## Self-Check: PASSED

All created files verified present on disk; both task commits (`d4c0eb6`, `29d6c62`) verified in git history.
