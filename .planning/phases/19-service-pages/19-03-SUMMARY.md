---
phase: 19-service-pages
plan: 03
subsystem: content
tags: [copywriting, bilingual-content, seo]

requires:
  - phase: 19-service-pages
    provides: content-authoring contracts (types.ts, plan 19-01)
provides:
  - Bilingual copy for the services index page + Auditoría SEO Técnica + Consultoría SEO
affects: [19-05]

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - scripts/seed-phase19-data/group-a.ts
  modified: []

key-decisions:
  - "Auditoría vs Consultoría pain-framing kept deliberately distinct (one-off audit vs ongoing engagement) so the two pages don't read as duplicates of the same template with different titles"
  - "Zero pricing anywhere, cotización-a-medida framing per research/SEO-COMPETITIVE-AUDIT-v1.4.md's finding that 3 of 4 competitors hide price"

patterns-established: []

requirements-completed: [SEO-SVC-01, SEO-SVC-02]

duration: unknown
completed: 2026-07-12
---

# Phase 19 Plan 03: Index + Auditoría SEO Técnica + Consultoría SEO copy

**Real, bilingual marketing copy for the services index page and 2 of 4 individual service landings, following the H1->pain->includes->process->FAQ->CTA structure validated by the 4 audited competitors.**

## Performance
- **Tasks:** 2 completed (copy authoring, pricing/completeness verification)
- **Files created:** 1

## Accomplishments
- `indexPageCopy` lists all 4 services (name + differentiating 1-line description each), zero pricing, CTA to contact.
- `auditServiceCopy`: pain framing grounded in real technical SEO problems (crawl budget, rendering, indexing gaps), `includes` specific to Juan's actual expertise (CWV, crawl/render analysis, schema, IA), `process` emphasizes Juan covers both diagnosis AND implementation (unlike auditors who only hand off a report), 4 real FAQ questions.
- `consultingServiceCopy`: pain framing distinct from audit's (ongoing/recurring needs vs one-off), `includes` covers strategy/monitoring/roadmap/cross-team collaboration, FAQ includes an engagement-structure/cadence question per this plan's explicit must_have.
- Verified via grep: zero pricing language, `faqs:` present for both services.

## Task Commits
1. **Task 1: Copy authoring** — `f5483b8` (feat, bundled with group-b.ts and Task 2)
2. **Task 2: Pricing/completeness verification** — `f5483b8` (verification, no code changes needed — checks passed on first write)

## Files Created/Modified
- `scripts/seed-phase19-data/group-a.ts`

## Verification
- `npx tsc --noEmit` exit 0
- `grep -iE '(€|\$|USD|EUR|/mes|/month|precio|price|tarifa|pricing)'` — 0 real matches (false positives on Spanish "todo" manually inspected and ruled out)
- `grep -c "faqs:"` >= 2

## Deviations from Plan
None.

## Issues Encountered
None.

## Next Phase Readiness
19-05's seed script consumes `indexPageCopy`/`auditServiceCopy`/`consultingServiceCopy` unchanged.

---
*Phase: 19-service-pages*
*Completed: 2026-07-12*
