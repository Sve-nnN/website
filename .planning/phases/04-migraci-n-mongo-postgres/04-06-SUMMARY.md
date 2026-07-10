---
phase: 04-migraci-n-mongo-postgres
plan: 06
subsystem: migration-case-studies
tags: [migration, case-studies, postgres]
dependency-graph:
  requires: [media-remap]
  provides: [case-studies-remap]
  affects: [scripts/migrate/steps/06-works-audit.ts, 07-redirects-and-verify.ts]
tech-stack:
  added: []
  patterns: []
key-files:
  created:
    - scripts/migrate/steps/05-case-studies.ts
decisions:
  - "Confirmed (a second time, independently of 04-01) that the real production database has 0 case-studies -- this plan's migration is a correctness-preserving no-op against real data, not a skipped/untested code path"
metrics:
  duration: "~5 min"
  completed: 2026-07-10
---

# Phase 4 Plan 06: CaseStudies Migration Summary

Built the CaseStudies migration script per the plan's field-mapping (title/slug verbatim/heroImage/clientContext from the old free-richText field, `kpis` placeholder, `needsStructuredContent` tracking). Real execution confirms the source collection is empty.

## What Was Built

- `scripts/migrate/steps/05-case-studies.ts` — migrates `case-studies.json` to the new structured `case-studies` collection, remapping `heroImage`/embedded media via the media remap-table, preserving the old narrative richText verbatim into `clientContext`, and populating `kpis` with the documented placeholder (`{label:'Resumen', value:'Ver caso completo'}`) to satisfy the new schema's `minRows:1` requirement without inventing real metrics.

## Real Execution Result

0 case studies exist in the real production database (Mongo Atlas) — independently re-confirmed here (first confirmed in 04-01 via a direct `payload.find` query). The script ran end-to-end without error and correctly reported "0 to migrate" rather than silently no-op'ing or crashing on an empty array. No CaseStudy documents were created, and `needsStructuredContent` is empty because there is nothing to structure.

## Deviations from Plan

None — plan executed exactly as written. The empty source is a pre-existing fact of the production data (confirmed in 04-01), not a deviation introduced by this plan.

## Self-Check: PASSED

- FOUND: scripts/migrate/steps/05-case-studies.ts
- FOUND commit 490bcf9
- Verified via direct Local API query (04-01 + re-run here): case-studies collection has 0 real source docs
