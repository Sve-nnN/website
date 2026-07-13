---
phase: 25-service-page-visual-polish
plan: 03
subsystem: content-seed
tags: [service-pages, humanizer, block-anatomy, case-study, idempotent-seed]

# Dependency graph
requires:
  - phase: 25-service-page-visual-polish
    plan: 01
    provides: Regression baseline (H1/JSON-LD + Lighthouse) this plan must not disturb
  - phase: 25-service-page-visual-polish
    plan: 02
    provides: ServiceScopeCard + RelatedCaseStudyBlock Payload blocks, additively registered and migrated
provides:
  - "scripts/seed-phase25-data.ts — humanized bilingual copy map (pain/scopeCard/caseStudyFraming) for all 4 service slugs"
  - "scripts/seed-phase25-service-landings.ts — idempotent seed script restructuring all 8 URLs into the 10-block anatomy"
  - All 4 service landings (8 URLs, 4 slugs x 2 locales) live with full anatomy, verified via curl
affects: [25-04, 25-05-regression-diff]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Refetch-inside-the-per-locale-loop id-reuse pattern for shape-changing seed restructures (not a pre-loop single snapshot) — required whenever a script changes block COUNT/order on first run, not just content, to keep 'es'/'en' ids consistent within the same run"

key-files:
  created:
    - scripts/seed-phase25-data.ts
    - scripts/seed-phase25-service-landings.ts
  modified: []

key-decisions:
  - "Reused the plan's explicitly documented deviation from the Phase 19/20 upsertPage pattern: refetch referenceLayout via findByID after writing 'es', not once before the locale loop — first run's index-2 blockType mismatch (serviceScopeCard vs old faq position) logs correctly only on the 'es' write; 'en' cleanly reuses the fresh 'es' ids since both locales share the same 10-block shape"
  - "Found and fixed one real humanizer gap during the explicit Task 2 audit pass: the ai-seo-geo ES pain paragraph reused the exact 'no se arregla X. Se arregla Y' sentence template already used by fullstack-development's ES pain paragraph — rewritten with a distinct construction so no two of the 4 services read as copy-pasted from one template"
  - "Same CallToAction block object literal (richText/links) is used for both the top and bottom block instances per locale — identical props by design (SVCPOL-05 repetition), reapplyIds still assigns each instance its own id by array index"

patterns-established:
  - "Content-only seed scripts should run 'payload migrate:create' as a drift gate even when zero schema change is expected, and confirm 'No schema changes detected' in the same session before writing to prod"

requirements-completed: [SVCPOL-01, SVCPOL-02, SVCPOL-05, SVCPOL-06]

# Metrics
duration: 30min
completed: 2026-07-13
---

# Phase 25 Plan 03: Service Landing Copy + 10-Block Anatomy Seed Summary

**Wrote and humanized new bilingual copy (pain section, scope-card spec sheet, honest per-landing case-study framing) for all 4 service slugs, then restructured all 8 live URLs from the Phase 19 4-block anatomy into the full 10-block anatomy, seeded against the real production Neon Postgres and confirmed idempotent on re-run.**

## Performance

- **Duration:** ~30 min
- **Tasks:** 3 completed
- **Files created:** 2 (`scripts/seed-phase25-data.ts`, `scripts/seed-phase25-service-landings.ts`)

## Accomplishments

- `scripts/seed-phase25-data.ts`: typed `ServiceLandingCopy` map covering all 4 service slugs x 2 locales x 3 content beats (`pain.title`/`pain.paragraphs`, `scopeCard.title`/`scope`/`outcome`/`timeline`, `caseStudyFraming.title`/`framingText`) — grounded in the existing Phase 19 `includes`/`process` copy and the competitive-gap research (Arianna Lupi/Aleyda Solis flat single-page sites with no proof density), zero invented metrics, zero price/currency strings anywhere in `scopeCard`
- Explicit humanizer pass (Task 2, separate commit) against `~/.claude/skills/humanizer/SKILL.md`: automated zero-em/en-dash scan passed across the whole file (including doc comments, which required one comment-wording fix), and the audit caught a genuine template-repeat tell (identical "no se arregla X, se arregla Y" sentence shape reused across two services' ES pain paragraphs) that the automated dash scan alone would have missed — fixed with a distinct construction
- `scripts/seed-phase25-service-landings.ts`: builds and writes the full 10-block layout (`hero → content(pain) → serviceScopeCard → callToAction(top) → content(includes/process/proofLinks) → clientLogosBlock → testimonialsCarousel → relatedCaseStudyBlock → faq → callToAction(bottom)`) for all 4 existing service docs, both locales, resolving the one real case study (`migracion-ecommerce-nextjs-seo-tecnico`, id=14) dynamically by slug with `overrideAccess: false`
- Applied the plan's documented critical fix verbatim: refetches `referenceLayout` via `findByID` *inside* the per-locale loop (after writing `es`, before building `en`) instead of a single pre-loop snapshot — confirmed correct in the real run log: the expected `blockType mismatch at index 2` warning fired exactly once per doc (on the `es` write, against the old 4-block layout), and `en` reused `es`'s freshly-written ids cleanly since both locales now share the identical 10-block shape
- `payload migrate:create` run before and confirmed "No schema changes detected" — this was a content-only write against tables Plan 25-02 already created, no migration drift
- Ran the seed script against the real production Neon Postgres; second run immediately after showed **zero** `reapplyIds` mismatch warnings across all 4 docs, confirming idempotency

## Task Commits

Each task was committed atomically:

1. **Task 1: Author raw bilingual copy** - `f5d033a` (feat)
2. **Task 2: Humanizer pass on all copy** - `f07cd13` (feat)
3. **Task 3: Build seed script and seed 10-block anatomy into all 4 docs** - `9a26cc1` (feat)

## Files Created/Modified

- `scripts/seed-phase25-data.ts` - Humanized bilingual copy map, all 4 slugs x 2 locales x 3 content beats
- `scripts/seed-phase25-service-landings.ts` - Idempotent seed script, 10-block anatomy, refetch-inside-loop id discipline, dynamic case-study resolution

## Verification Evidence (live, real DB)

- **Humanizer:** `node -e` regex scan confirms zero `—`/`–` characters anywhere in `scripts/seed-phase25-data.ts` (both after Task 1's write and re-confirmed after Task 2's edit)
- **All 8 URLs return 200:** `/servicios/{seo-technical-audit,seo-consulting,fullstack-development,ai-seo-geo}` and `/en/services/{same 4 slugs}`
- **Per-URL anatomy check (all 8, via curl + grep on saved HTML):** exactly 1 `<h1>`, exactly 1 `ServiceScopeCardComponent` render, exactly 1 `RelatedCaseStudyBlockComponent` render, exactly 1 `BreadcrumbList` JSON-LD block — no duplication, no regression
- **CTA repetition (SVCPOL-05):** on `/servicios/seo-technical-audit`, both CTA instances render `<a href="/contact">Pedir una auditoría</a>` with identical classes/label — confirmed top and bottom are the same block shape repeated, not two distinct CTAs
- **No price/currency leakage:** grepped for `precio`/`tarifa`/`USD`/`Price:` and multi-digit `$` currency patterns across rendered HTML — zero matches (the raw `$N` substrings present in the HTML are Next.js RSC flight-payload reference tokens, not currency, confirmed by pattern shape `\$[0-9]\\` inside the streamed script payload, not in visible card text)
- **Case-study framing (honest, per-landing):** all 4 ES framing strings and all 4 EN framing strings are distinct (verified via grep before seeding); live-rendered ES text on `/servicios/seo-technical-audit` confirmed to be "Todavía no tengo un caso publicado específico de auditorías técnicas, pero acá tenés un ejemplo real de cómo trabajo con clientes." — matches the seed data exactly, resolves to the real case study (id=14), never a fabricated per-service claim
- **Zero-diff on reused blocks:** `git diff` across the 3 commits in this plan against `src/blocks/Hero/`, `src/blocks/Content/`, `src/blocks/FAQ/`, `src/blocks/CallToAction/`, `src/blocks/ClientLogosBlock/`, `src/blocks/TestimonialsCarousel/` returns empty — no block config/component was touched, only content and layout position
- **Idempotency:** second run of `scripts/seed-phase25-service-landings.ts` logged zero `reapplyIds` mismatch warnings across all 4 docs (vs. exactly 4 expected warnings, one per doc, on the first run)

## Decisions Made

- Reused the refetch-inside-the-loop pattern exactly as specified in `25-03-PLAN.md`'s Interfaces section rather than the simpler Phase 19/20 pre-loop-snapshot pattern, since this run changes block COUNT/order (4 → 10) on the first write, which the simpler pattern would have handled incorrectly (see plan's own T-25-06 rationale)
- Kept the top and bottom `CallToAction` block built from one shared object literal (`ctaBlock`) inside `buildLayout`, spread into two distinct array positions — guarantees byte-identical props by construction rather than by convention, while `reapplyIds` still assigns each array position its own stable id

## Deviations from Plan

None outside what the plan itself explicitly anticipated and documented (the refetch-inside-loop fix was a planned deviation from the Phase 19/20 baseline pattern, already called out in `25-03-PLAN.md`, not an ad hoc one). During the Task 2 humanizer audit, one real cross-service template repeat was caught and fixed (see Accomplishments) — this is the humanizer pass doing its documented job, not a deviation from the plan.

## Issues Encountered

None. `npx tsc --noEmit` passed clean after each task. `payload migrate:create` confirmed no schema drift before the real-DB seed ran.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None. All 8 URLs render real, humanized, service-specific content; no hardcoded empty values or placeholder text was introduced.

## Threat Flags

None — this plan's writes stay entirely within the trust boundaries and mitigations already documented in `25-03-PLAN.md`'s threat model (T-25-06 through T-25-09), no new network endpoint, auth path, or schema surface introduced.

## Next Phase Readiness

All 4 service landings (8 URLs) are live with the full 10-block anatomy, both locales, verified against the real running dev server and the real production database. `25-04` (or the phase's next plan) can proceed to compare against the `25-01` regression baseline. No blockers.

---
*Phase: 25-service-page-visual-polish*
*Completed: 2026-07-13*

## Self-Check: PASSED

- `scripts/seed-phase25-data.ts` — FOUND on disk
- `scripts/seed-phase25-service-landings.ts` — FOUND on disk
- Commit `f5d033a` — FOUND in `git log`
- Commit `f07cd13` — FOUND in `git log`
- Commit `9a26cc1` — FOUND in `git log`
