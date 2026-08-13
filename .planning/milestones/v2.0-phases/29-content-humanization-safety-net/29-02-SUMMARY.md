---
phase: 29-content-humanization-safety-net
plan: 02
subsystem: database
tags: [payload-cms, content-audit, postgres, localization, snapshot-tooling]

requires:
  - phase: 29-01
    provides: 29-FIELD-AUDIT.md (full field-localization audit, this plan's Task 2 updates one of its rows)
provides:
  - "scripts/content-humanization-snapshot.ts — full-text (not metadata-only) content snapshot across every editorial collection + global, locale:'all', diffable JSON, prep for Phase 31's post-sweep diff"
  - "29-CASESTUDIES-SERVICES-DECISION.md — evidence-based MIGRATION REQUIRED verdict for CaseStudies.services[].service, backed by real live-data query"
affects: [29-04, 30, 31]

tech-stack:
  added: []
  patterns:
    - "Full-text content snapshot script pattern (extends metadata-only content-freeze-snapshot.ts precedent) — payload.find({locale:'all'}) + payload.findGlobal({locale:'all'}) captured verbatim as JSON, gitignored output dir"
    - "Live-data-before-verdict investigation pattern for ambiguous localization calls (query real DB, don't assume from field name alone)"

key-files:
  created:
    - scripts/content-humanization-snapshot.ts
    - .planning/phases/29-content-humanization-safety-net/29-CASESTUDIES-SERVICES-DECISION.md
  modified:
    - .gitignore
    - .planning/phases/29-content-humanization-safety-net/29-FIELD-AUDIT.md

key-decisions:
  - "CaseStudies.services[].service: MIGRATION REQUIRED (not a no-op) — live values are descriptive Spanish service labels (SEO técnico, Estrategia de contenido, etc.), not proper nouns like Websites.stack[].tag's tech-brand names"
  - "content-humanization-snapshot.ts output directory gitignored, following the content-freeze-snapshot.ts/freeze-snapshots precedent — regenerable dumps of production content, not source code"
  - "Snapshot script drops redirects/media from COLLECTIONS (URLs/binary assets, not editorial prose) and adds speaking-events + the 3 editorial globals (footer, header, llms) that content-freeze-snapshot.ts never touched"

requirements-completed: [VOICE-03, VOICE-04]

duration: 25min
completed: 2026-07-14
---

# Phase 29 Plan 02: Full-Text Snapshot Tool + CaseStudies Services Investigation Summary

**Built the full-text content snapshot script for Phase 31's rollback safety net, and resolved with live production data that `CaseStudies.services[].service` needs a localization migration (not a no-op) — unblocking Plan 29-04.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-14T19:30:00Z (approx)
- **Completed:** 2026-07-14T19:56:00Z
- **Tasks:** 2/2 completed
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- Extended the existing `content-freeze-snapshot.ts` pattern into a new full-text snapshot tool covering 9 editorial collections + 3 editorial globals, verified against the real production DB (12 pages, 72 posts, 7 case-studies, etc. — all captured successfully, zero writes)
- Resolved the open `CaseStudies.services[].service` localization question with real evidence instead of assumption: **MIGRATION REQUIRED**, handed off to Plan 29-04 with the exact field config and migration pattern to apply

## Task Commits

1. **Task 1: Extend the content snapshot script to capture full real text** - `44f45cf` (feat)
2. **Task 2: Investigate CaseStudies.services[].service live data and document the decision** - `910240c` (docs)

_No plan-metadata commit yet — this SUMMARY + STATE update will be the final commit for this plan._

## Files Created/Modified
- `scripts/content-humanization-snapshot.ts` - New full-text snapshot script; copies the CLI/output skeleton from `content-freeze-snapshot.ts`, replaces the metadata-only mapper with full document capture, adds a `findGlobal` loop for `footer`/`header`/`llms`, writes to `.planning/phases/29-content-humanization-safety-net/content-snapshots/`
- `.planning/phases/29-content-humanization-safety-net/29-CASESTUDIES-SERVICES-DECISION.md` - Decision doc: verbatim live values found, reasoning, MIGRATION REQUIRED verdict, exact config change + migration pattern for Plan 29-04
- `.gitignore` - Added `.planning/phases/29-content-humanization-safety-net/content-snapshots/` (regenerable production-content dumps, matching the existing `freeze-snapshots/` precedent)
- `.planning/phases/29-content-humanization-safety-net/29-FIELD-AUDIT.md` - Updated the `services[].service` row and "Action Needed #2" section from "pending investigation" to the resolved MIGRATION REQUIRED verdict (this file was created by the concurrently-running Plan 29-01 agent; only the one row/section relevant to this plan's investigation was edited)

## Decisions Made
- **CaseStudies.services[].service verdict: MIGRATION REQUIRED.** Queried all 7 live CaseStudies documents via `payload.find({ collection: 'case-studies', locale: 'all', depth: 0 })`. Found 19 non-empty `service` values across docs 15-20 (doc 14 has an empty `services` array): "SEO técnico", "Estrategia de contenido", "Optimización on-page", "SEO local", "Contenido educativo de salud", "Estrategia de contenido legal", "Estrategia de contenido de producto". These are descriptive Spanish service-category labels with natural EN equivalents — not proper nouns/brand terms like the comparison analog `Websites.stack[].tag` ("Next.js", "Payload", "PostgreSQL"). Verdict: same backfill-then-drop-column migration treatment as `TestimonialsCarousel.title`, using `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` as the reference pattern. This is a schema-and-data migration requiring Juan's named approval before running against the real Neon DB — that step belongs to Plan 29-04, not this plan.
- **Snapshot script scope:** `redirects` and `media` collections excluded from the humanization snapshot (URLs and binary assets, not editorial copy Phase 30/31 will rewrite); `speaking-events` and `websites` added (present in `content-freeze-snapshot.ts`'s original 9-collection list only as `websites`, but `speaking-events` was missing and is editorial content per the field audit). Globals `footer`, `header`, `llms` added since `content-freeze-snapshot.ts` only ever covered collections via `payload.find`.

## Deviations from Plan

None — plan executed exactly as written. Both tasks were read-only against the live DB (`payload.find`/`payload.findGlobal` only); no writes, no schema changes, no migrations run.

## CaseStudies.services[].service Finding (for Plan 29-04)

**Verdict: MIGRATION REQUIRED** — this is NOT a no-op.

Real values queried live from production (verbatim): "SEO técnico" (appears in every doc with services), "Estrategia de contenido", "Optimización on-page", "SEO local", "Contenido educativo de salud", "Estrategia de contenido legal", "Estrategia de contenido de producto". These are ordinary Spanish service-category phrases, not proper nouns — they read like they'd need genuine EN translations ("Technical SEO", "Content Strategy", "On-Page Optimization", "Local SEO", etc.), the same way `TestimonialsCarousel.title` needed one. This is the mirror-opposite conclusion from `Websites.stack[].tag` (correctly left non-localized because its values are real tech-brand proper nouns).

Plan 29-04 should apply: `localized: true` on `CaseStudies.services[].service` in `src/collections/CaseStudies/index.ts`, plus a `payload migrate:create`-generated backfill-then-drop migration (read the SQL in full, insert the `unnest(ARRAY['es','en'])` backfill before any `DROP COLUMN`, exactly mirroring `20260712_202954_phase19_calltoaction_localized.ts`), and present it to Juan for named approval before running `payload migrate` against the real Neon instance — per CLAUDE.md Database Safety, this is not an additive migration.

## Self-Check: PASSED

- FOUND: scripts/content-humanization-snapshot.ts
- FOUND: .planning/phases/29-content-humanization-safety-net/29-CASESTUDIES-SERVICES-DECISION.md
- FOUND commit 44f45cf (feat(29-02): add full-text content humanization snapshot script)
- FOUND commit 910240c (docs(29-02): resolve CaseStudies.services[].service localization decision)
- Verified `npx tsc --noEmit -p tsconfig.json` passes cleanly with the new script in place
- Verified the script runs successfully against the real production DB (read-only) and produces the expected JSON shape (`{ tag, takenAt, collections, globals }`)
