---
phase: 04-migraci-n-mongo-postgres
plan: 07
subsystem: migration-works-audit
tags: [migration, works, case-studies, checkpoint]
dependency-graph:
  requires: [case-studies-remap]
  provides: [works-audit-closed]
  affects: [scripts/migrate/steps/07-redirects-and-verify.ts]
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - scripts/migrate/steps/06-works-audit.ts
    - scripts/migrate/data/works-audit-report.json
decisions:
  - "Juan confirmed explicitly (via AskUserQuestion, this session) to close the checkpoint with 0 Works processed / 0 CaseStudies created from fold-in -- the real production Works collection has 0 documents, independently reconfirmed by direct Local API query in Task 1 (matches 04-01's original finding)"
metrics:
  duration: "~5 min (Task 2 close-out; Task 1 done in prior session)"
  completed: 2026-07-10
---

# Phase 4 Plan 07: Works Audit + Fold-in to CaseStudies Summary

Audited the retired Works collection against the real production database and closed the human checkpoint: there are genuinely 0 Works documents to audit, so 0 were folded into CaseStudies.

## What Was Built

- `scripts/migrate/steps/06-works-audit.ts` — `generateAuditReport()` reads `works.json` + `case-studies.json`, flags likely-duplicate Works via `caseStudyUrl` -> slug matching, and writes `works-audit-report.json` with an explicit `recommendation` per doc. `foldApprovedWorks(approvedOldIds)` creates new CaseStudies (title/slug-from-title/clientContext-from-excerpt/heroImage-from-cover remap) only for approved `oldId`s, gated on the checkpoint decision.

## Checkpoint Resolution

**Checkpoint:** "Que Works viejos se convierten en CaseStudies nuevos vs se descartan"

**Finding (Task 1, real execution):** `works-audit-report.json` is an empty array — the real production Mongo Atlas database has 0 Works documents (independently reconfirmed here, first confirmed in 04-01).

**Juan's decision:** Confirmed explicitly this session — close the checkpoint with 0 Works processed / 0 CaseStudies created from fold-in, and proceed. There is nothing to approve or reject because there is no data.

**Task 2 execution:** Ran `foldApprovedWorks` with `--approved=none` against the real (empty) audit report. 0 entries processed, 0 CaseStudies created, `works-audit-report.json` remains `[]`. Verification (`processed.length === r.length`, i.e. `0 === 0`) passes trivially and correctly — every entry in the real report (all zero of them) has a final status.

## Real Execution Result

0 Works exist in the real production database. No CaseStudy was created via fold-in. The `works` collection itself was not reintroduced into any schema (confirmed absent from `src/collections/`).

## Deviations from Plan

None — plan executed exactly as written. The empty source is a pre-existing fact of the production data (confirmed in 04-01, reconfirmed in Task 1 of this plan), not a deviation introduced by this plan. Task 2's no-op outcome is the correct behavior given 0 input documents, not a skipped step.

## Self-Check: PASSED

- FOUND: scripts/migrate/steps/06-works-audit.ts
- FOUND: scripts/migrate/data/works-audit-report.json (empty array, confirmed real)
- FOUND commit 3b72b44 (Task 1)
- Verified via direct Local API query (04-01 + re-run in Task 1 + re-run in Task 2 close-out): Works collection has 0 real source docs
