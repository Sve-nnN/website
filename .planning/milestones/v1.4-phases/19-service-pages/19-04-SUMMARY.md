---
phase: 19-service-pages
plan: 04
subsystem: content
tags: [copywriting, bilingual-content, seo, geo, llms-txt]

requires:
  - phase: 19-service-pages
    provides: content-authoring contracts (types.ts, plan 19-01)
provides:
  - Bilingual copy for Desarrollo Full-Stack con SEO integrado + SEO para IA/GEO
affects: [19-05]

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - scripts/seed-phase19-data/group-b.ts
  modified: []

key-decisions:
  - "Desarrollo Full-Stack copy explicitly names Next.js and Payload/headless CMS (non-negotiable per this plan's must_haves) — the real differentiator no audited competitor offers at Juan's level"
  - "GEO/AI-SEO copy references llms.txt/llms-full.txt both in prose AND via 2 proofLinks entries, satisfying SEO-SVC-03's 'tangible proof, not just a name' requirement"

patterns-established: []

requirements-completed: [SEO-SVC-02, SEO-SVC-03]

duration: unknown
completed: 2026-07-12
---

# Phase 19 Plan 04: Desarrollo Full-Stack + SEO para IA/GEO copy

**Real, bilingual copy for the remaining 2 service landings — Full-Stack Development with SEO built into the code, and AI SEO/GEO explicitly grounded in the already-live llms.txt/llms-full.txt infrastructure.**

## Performance
- **Tasks:** 2 completed (copy authoring, pricing/proof-link verification)
- **Files created:** 1

## Accomplishments
- `fullstackServiceCopy`: pain framing contrasts SEO-bolted-onto-WordPress vs SEO-designed-in-the-code; `includes` explicitly names Next.js and Payload/headless CMS (server rendering/streaming, CWV built into architecture, schema-level structured data); FAQ addresses "why Next.js/Payload vs WordPress" with a real, specific answer.
- `geoServiceCopy`: pain framing addresses AI answer engines citing competitors instead of you; `includes`/`process` cover content structuring for AI citability and the llms.txt/llms-full.txt manifest; `proofLinks` has exactly 2 entries (`/llms.txt`, `/llms-full.txt`) with real descriptive text, and both filenames are also mentioned in prose (not just the links array).
- Verified via grep: zero pricing, Next.js/Payload named >= 2 times, llms.txt/llms-full.txt mentioned >= 4 times total (prose + proofLinks urls).

## Task Commits
1. **Task 1: Copy authoring** — `f5483b8` (feat, bundled with group-a.ts and Task 2)
2. **Task 2: Pricing/proof-link verification** — `f5483b8` (verification, no code changes needed — checks passed on first write)

## Files Created/Modified
- `scripts/seed-phase19-data/group-b.ts`

## Verification
- `npx tsc --noEmit` exit 0
- `grep -ic "next.js\|payload"` >= 2
- `grep -c "llms.txt\|llms-full.txt"` >= 4
- `grep -c "url: '/llms.txt'"` and `url: '/llms-full.txt'"` — both present for es+en (2 each)
- Zero pricing language

## Deviations from Plan
None.

## Issues Encountered
None.

## Next Phase Readiness
19-05's seed script consumes `fullstackServiceCopy`/`geoServiceCopy` unchanged, including the `proofLinks` array for the GEO page's block assembly.

---
*Phase: 19-service-pages*
*Completed: 2026-07-12*
