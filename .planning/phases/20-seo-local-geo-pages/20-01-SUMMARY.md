---
phase: 20-seo-local-geo-pages
plan: 01
subsystem: seo
tags: [payload-cms, nextjs, geo-pages, local-seo, bilingual-content]

requires:
  - phase: 18-seo-technical-fixes-metadata
    provides: one-H1-per-page discipline (Hero block owns it), plugin-seo already wired to 'pages'
  - phase: 19-service-pages
    provides: block-assembly seed pattern (lexicalParagraph/lexicalWithHeading, reapplyIds, upsertPage), CallToAction.richText localized:true fix (migration 20260712_202954_phase19_calltoaction_localized)
provides:
  - 2 new Pages docs (seo-tecnico-lima id=11, seo-tecnico-madrid id=12), bilingual, genuinely differentiated content
  - Static single-slug route pattern reused from /privacy (no dynamic [slug], no lib registry — only 2 fixed slugs)
affects: [phase-21-home-optimization-service-linking]

tech-stack:
  added: []
  patterns:
    - "Reused Phase 19's seed-script block-assembly pattern verbatim (lexical helpers, reapplyIds id-reuse discipline, upsertPage) for a second, simpler use case (2 fixed slugs vs. a slug registry)"

key-files:
  created:
    - scripts/seed-phase20-data/types.ts
    - scripts/seed-phase20-data/copy.ts
    - scripts/seed-phase20-geo-pages.ts
    - src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx
    - src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx
  modified: []

key-decisions:
  - "Single URL segment shared across both locales (/seo-tecnico-lima, /seo-tecnico-madrid + /en/ prefix) instead of Phase 19's dual-segment pattern — these pages ARE the Spanish-language target keywords themselves, so an English URL segment would work against the SEO intent"
  - "Madrid page explicitly states Juan does NOT have a physical Madrid office — honesty over the templated-page anti-pattern Juan rejected; differentiation comes from real ES-market keyword data + honest remote-specialist framing, not a fabricated local presence"
  - "Lima page grounds every claim in real, already-seeded facts from scripts/seed-author-eeat.ts (UPC education, the real 2025 DinoRANK/Arianna Lupi workshop with 18 attendees) — zero invented local-presence claims"
  - "No new Postgres migration — confirmed CallToAction.richText was already localized:true from Phase 19's fix before writing any block-assembly code, avoiding a repeat of Phase 19's data-loss incident"

patterns-established:
  - "Geo-page content differentiation checklist: each page must contain at least one fact/section genuinely absent from its sibling page, not just a city-name substitution"

requirements-completed: [SEO-LOCAL-01, SEO-LOCAL-02]

duration: unknown (interleaved with phase 19 DB-safety incident recovery)
completed: 2026-07-12
---

# Phase 20 Plan 01: Lima + Madrid geo-pages with genuinely differentiated content

**2 new SEO landing pages ("SEO técnico en Lima", "SEO técnico en Madrid/España") live in both locales, each grounded in real, distinct facts — Lima in Juan's physical presence and local community involvement, Madrid in an honest remote-specialist framing backed by real market data — closing the v1.4 geo-positioning gap without the templated find-replace-city pattern Juan explicitly rejected.**

## Performance

- **Tasks:** 3 completed (content module, route files, seed + live verification)
- **Files created:** 5

## Accomplishments
- `scripts/seed-phase20-data/copy.ts` exports `limaPageCopy`/`madridPageCopy`, both fully bilingual, both structured H1→context→includes→process→FAQ→CTA, with zero content overlap beyond generic connective phrasing — Lima cites real UPC/DinoRANK/Arianna Lupi facts, Madrid cites real ES-market keyword-research data and an explicit, honest "no tengo oficina en Madrid" disclosure.
- Two static single-slug routes (`/seo-tecnico-lima`, `/seo-tecnico-madrid`), mirroring `/privacy`'s pattern minus the manual `<h1>`/`<Container>` (Hero block owns both, per Phase 18/19 discipline) — no dynamic `[slug]` route needed since only 2 fixed slugs exist.
- `scripts/seed-phase20-geo-pages.ts`, structurally identical to Phase 19's seed script (same `lexicalParagraph`/`lexicalWithHeading` helpers, same `reapplyIds`/`upsertPage` id-reuse discipline), simplified for 2 hardcoded slugs.
- **Before writing any block-assembly code**, confirmed via `grep -n "localized" src/blocks/CallToAction/config.ts` that `richText` was already `localized: true` (Phase 19's fix) — this phase introduces zero new schema migrations, directly avoiding a repeat of Phase 19's DB-safety incident.
- Seed script run against the real dev DB **with Juan's explicit, direct approval in-thread** (per the new Database Safety rule established during Phase 19) — created `seo-tecnico-lima` (id=11) and `seo-tecnico-madrid` (id=12) with no errors.

## Task Commits

1. **Task 1: Content module (Lima + Madrid bilingual copy)** — `85513c8` (feat, bundled with Task 2)
2. **Task 2: Route files** — `85513c8` (feat)
3. **Task 3: [BLOCKING] Seed script + live verification** — `36768a7` (feat, script) — seed execution itself was a real DB write run separately by the orchestrator/main session after Juan's direct in-thread approval, not a git commit

## Files Created/Modified
- `scripts/seed-phase20-data/types.ts` — self-contained `GeoPageCopy`/`FaqItem`/`BilingualGeoPageCopy` types (structurally identical to Phase 19's `ServiceCopy` shape, kept phase-local per project convention)
- `scripts/seed-phase20-data/copy.ts` — `limaPageCopy`, `madridPageCopy`
- `src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx` — static single-slug route
- `src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx` — static single-slug route
- `scripts/seed-phase20-geo-pages.ts` — idempotent seed orchestrator

## Verification (Task 3, live against the real dev server + real DB)

- Seed script run once (approved directly by Juan in-thread): created `seo-tecnico-lima` (id=11), `seo-tecnico-madrid` (id=12), no errors.
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/seo-tecnico-lima` → 200
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/seo-tecnico-madrid` → 200
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/en/seo-tecnico-lima` → 200
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/en/seo-tecnico-madrid` → 200
- `curl -s http://localhost:3000/seo-tecnico-lima | grep -oc "UPC\|DinoRANK"` → 10 (real local facts present)
- `curl -s http://localhost:3000/seo-tecnico-madrid | grep -oc "remoto\|remote"` → 6 (honest remote framing present)
- CTA localization regression check (the exact class of bug found as CR-01 in Phase 19): ES page → "Conversar sobre tu proyecto" (5 occurrences); EN page → "Talk about your project" (5 occurrences) — confirms `CallToAction.richText`'s `localized: true` fix holds for this phase's content too, no collision.
- `npx tsc --noEmit` → exit 0
- `npm run build` was NOT re-run for this phase specifically (per the project's current "no long blocking builds in foreground" operating rule) — `tsc --noEmit` + live dev-server curl checks against the real DB are treated as sufficient evidence per 20-01-PLAN.md's own fallback clause; a full production build was already confirmed working end-to-end in Phase 19 with the same block types (Hero/Content/FAQ/CallToAction) this phase reuses unchanged.

## Deviations from Plan

- The seed script run (Task 3) required explicit human approval per the Database Safety rule established mid-Phase-19 (not anticipated when 20-01-PLAN.md was written, since that rule postdates the plan). Juan approved directly, in-thread, before the seed ran — documented here as the required record of that approval, matching the rule's own requirement.
- This SUMMARY.md was written after code review flagged its absence (WR-01 in `20-REVIEW.md`) rather than immediately after Task 3 completed — no functional gap, purely a documentation-timing deviation, now closed.

## Issues Encountered

None beyond the approval-flow deviation above. No repeat of Phase 19's CallToAction localization incident — the pre-check (grep for `localized: true` before writing block-assembly code) worked as intended.

## Next Phase Readiness

- Phase 21 (Home Optimization & Service Linking) can link to both geo-pages from Home if desired, using the same `/seo-tecnico-lima` / `/seo-tecnico-madrid` fixed paths (no locale-segment complexity to account for, unlike Phase 19's services links).
- No blockers carried forward.

---
*Phase: 20-seo-local-geo-pages*
*Completed: 2026-07-12*
