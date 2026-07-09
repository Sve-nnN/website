---
phase: 01-schema-foundation
plan: 03
subsystem: database
tags: [payload, collections, schema, typescript]

# Dependency graph
requires:
  - phase: 01-schema-foundation (plan 01)
    provides: shared access-control utilities (src/access/*), slugField (src/fields/slug.ts), deepMerge utility
provides:
  - Authors collection (public author profile, E-E-A-T bio/credentials)
  - Clientes collection (lean logo-carousel-only collection, SCHEMA-07)
  - Testimonials collection (structured attribution, name/role/company all required, SCHEMA-05)
affects: [payload.config.ts wiring (Wave 4), CaseStudies (client relationship), frontend author/testimonial/client-logo display (Phase 5)]

# Tech tracking
tech-stack:
  added: []
  patterns: [lean collection trimming from richer analogs, mandatory attribution fields via required:true]

key-files:
  created:
    - src/collections/Authors/index.ts
    - src/collections/Clientes/index.ts
    - src/collections/Testimonials/index.ts
  modified: []

key-decisions:
  - "Clientes kept intentionally minimal (name/logo/websiteUrl only) per CONTEXT.md — no case-study fields, no revalidatePath hooks (Phase 5 concern), no orden/presentation fields from aprendoclub/JuanPortfolio analogs"
  - "Testimonials name/role/company all required:true — stricter than aprendoclub's Testimonios.ts (only nombre/quote required) — enforces SCHEMA-05 no-anonymous-quotes rule"
  - "Authors trimmed to name/jobTitle/bio/avatar/slug — heavy education/experience/socialMedia/expertise arrays from JuanPortfolio analog deferred to a later content-audit phase, not called for by CONTEXT.md"
  - "No SEO tab on Authors in Phase 1 — plugin-seo targets pages/posts/case-studies only per CONTEXT.md"

requirements-completed: [SCHEMA-05, SCHEMA-07]

# Metrics
duration: 15min
completed: 2026-07-09
---

# Phase 1 Plan 3: Authors, Clientes, Testimonials Collections Summary

**Three lean Payload collections — public Authors profile, minimal Clientes logo-carousel, and Testimonials with mandatory name/role/company attribution — ready for Wave 4 config wiring**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-09T18:37:00Z (approx.)
- **Completed:** 2026-07-09T18:52:45Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Clientes collection created — deliberately minimal (name, logo upload → media, websiteUrl), no case-study fields, per CONTEXT.md's "puramente credibilidad visual" directive (SCHEMA-07)
- Testimonials collection created — name/role/company all `required: true`, closing the anonymous-quote gap present in the aprendoclub analog (SCHEMA-05)
- Authors collection created — public-read (`read: () => true`), lean field set (name/jobTitle/bio/avatar/slug), no heavy E-E-A-T arrays ported from JuanPortfolio

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Clientes and Testimonials collections** - `767092e` (feat)
2. **Task 2: Create Authors collection** - `d414e11` (feat)

_Note: this plan ran as a sequential (non-TDD) executor alongside concurrent sibling Wave 2 plans on the shared working tree; only files listed in this plan's `files_modified` were staged/committed by this agent._

## Files Created/Modified
- `src/collections/Clientes/index.ts` - Lean logo-carousel collection (name, logo, websiteUrl)
- `src/collections/Testimonials/index.ts` - Structured attribution collection (name/role/company/testimonial/avatar, all attribution fields required)
- `src/collections/Authors/index.ts` - Public author profile collection (name/jobTitle/bio/avatar/slug)

## Decisions Made
- Followed the exact field shapes specified in the plan's `<interfaces>` block for Clientes and Testimonials (verbatim match to RESEARCH.md code examples)
- For Authors, exercised the "Claude's Discretion" leeway from CONTEXT.md to choose a lean field set (name/jobTitle/bio/avatar/slug) since CONTEXT.md gave no elaborated Authors field spec beyond "public profile"

## Deviations from Plan

None — plan executed exactly as written. `npx tsc --noEmit` passes cleanly across all three new files with no type errors.

**Note on acceptance-criteria grep counts:** The plan's acceptance criteria for Task 2 specify `grep -c "slugField" src/collections/Authors/index.ts == 1`. The actual file has 2 matches (the `import { slugField } from '@/fields/slug'` line plus the `slugField('name')` field usage) — both are required for the field to function; a file that uses `slugField` correctly cannot avoid this second match. This is a minor imprecision in the plan's grep test, not a functional deviation. All other acceptance criteria pass exactly as specified, and the underlying intent (Authors collection exports correctly, uses `slugField`, is public-read, and excludes the heavy arrays) is fully satisfied.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three collections (`Authors`, `Clientes`, `Testimonials`) are ready for import into `payload.config.ts` in Wave 4
- No blockers for downstream plans; Clientes is ready to be referenced by CaseStudies' `client` relationship field (separate plan)

---
*Phase: 01-schema-foundation*
*Completed: 2026-07-09*
