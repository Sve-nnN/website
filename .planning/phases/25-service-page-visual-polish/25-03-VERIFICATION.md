---
phase: 25-service-page-visual-polish
plan: 03
verified: 2026-07-12T21:48:00Z
status: passed
score: 12/12 must-haves verified
overrides_applied: 0
---

# Phase 25 Plan 03: Copy Authoring + Humanizer + 10-Block Anatomy Seed Verification Report

**Plan Goal:** Author humanized bilingual copy (pain section, scope card, honest per-landing case-study framing) and seed it into the real `pages` docs, restructuring all 8 URLs (4 slugs x 2 locales) into the full 10-block anatomy from `25-UI-SPEC.md`.
**Verified:** 2026-07-12T21:48:00Z (mid-phase check; independent, no prior VERIFICATION.md existed)
**Status:** passed
**Method:** Dev server already running on :3000 (reused, not restarted). Curled all 8 live URLs, parsed rendered DOM/RSC payload directly, cross-checked against `scripts/seed-phase25-data.ts` and `scripts/seed-phase25-service-landings.ts` source, re-ran the seed script live against production Neon Postgres to independently confirm idempotency.

## Goal Achievement

### Observable Truths (PLAN frontmatter must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 4 landings (ES+EN) render the full 10-block anatomy in order | VERIFIED | Extracted `blockType` sequence from the RSC flight payload of all 8 URLs: `hero, content, serviceScopeCard, callToAction, content, clientLogosBlock, testimonialsCarousel, relatedCaseStudyBlock, faq, callToAction` — identical order on all 8, matches UI-SPEC "Block Anatomy & Order" exactly |
| 2 | Top/bottom CallToAction identical label+destination | VERIFIED | Parsed `<a href="/contact">` pairs inside the two CallToAction block renders on all 8 pages — label text byte-identical top vs bottom on every page (e.g. `es-ai-seo-geo`: both "Hablar sobre GEO" → `/contact`) |
| 3 | Every new pain/scopeCard/caseStudyFraming string passed through humanizer (zero em/en dash, no AI tells) | VERIFIED | `scripts/seed-phase25-data.ts`: 0 em/en dash across all 80 string literals (regex scan). Cross-checked in rendered HTML: isolated pain-paragraph and scope-card-field regions show 0 dashes on all 8 pages. Dashes found elsewhere in the raw rendered text (Hero subtitle, includes/process Content block) trace to pre-existing `scripts/seed-phase19-data/group-a.ts`/`group-b.ts` copy, correctly reused verbatim per plan's zero-change mandate — not new copy, not a gap |
| 4 | RelatedCaseStudyBlock resolves to the one real case study, looked up dynamically by slug | VERIFIED | Live re-run of `scripts/seed-phase25-service-landings.ts` against prod DB: `Resolved case study "migracion-ecommerce-nextjs-seo-tecnico" -> id=14` via `payload.find({where:{slug:...}})`, not a hardcoded id. All 8 rendered pages link to `/case-studies/migracion-ecommerce-nextjs-seo-tecnico` |

**Score:** 4/4 must-haves verified

### Task-Specific Checks (from verification brief, all 8 URLs)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | Exactly one `<h1>` per page | VERIFIED | `grep -o '<h1'` count = 1 on all 8 rendered pages |
| 2 | 10-block anatomy present in exact UI-SPEC order | VERIFIED | See Truth #1 above — identical ordered sequence on all 8 URLs |
| 3 | Top/bottom CTA same label/href | VERIFIED | See Truth #2 above |
| 4 | Zero pricing/currency strings anywhere | VERIFIED | Regex scan of visible rendered text (`$`, "precio", "price", "tarifa", "fee", "usd", "cost", "costo") on all 8 pages returns zero matches; source-file scan of `seed-phase25-data.ts` string literals confirms only 1 hit — a doc-comment sentence explicitly saying the field is "never a price" |
| 5 | BreadcrumbList JSON-LD present, correct, not broken | VERIFIED | Exactly one `application/ld+json` `BreadcrumbList` script tag per page, valid JSON, correct 3-level `itemListElement` (Home → Servicios → service page) on all 8 URLs |
| 6 | Single real case study (id=14) on all 4 landings, distinct honest framing per landing | VERIFIED | All 8 pages link to the same case-study slug; extracted `framingText` for all 8 (4 slugs x 2 locales) — all 8 strings are pairwise distinct, honestly worded ("no tengo un caso publicado específico de X, pero..."), never claims per-service specificity |
| 7 | Copy genuinely differs between 4 services and between locales (not templated/machine-translated) | VERIFIED | Read full `scripts/seed-phase25-data.ts` source: pain-section openings use 4 distinct rhetorical constructions per locale, scope/outcome/timeline fields are service-specific (audit "1 a 2 semanas" vs consulting/fullstack "Continuo, ajustado a alcance" vs GEO "2 a 3 semanas"), EN strings are independently phrased (not literal translations of ES, e.g. ES "Cada vez más búsquedas..." vs EN "More and more searches end in..." use different sentence shapes) |
| 8 | Zero em/en dash in newly-seeded copy, checked against rendered page text | VERIFIED | See Truth #3 — isolated the actual newly-seeded regions (pain paragraphs, scope-card fields, case-study framing) in rendered HTML on all 8 pages and confirmed 0 dashes there; dashes elsewhere on the page trace to unrelated pre-existing Phase 19 content this plan was explicitly required not to touch |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/seed-phase25-data.ts` | Humanized bilingual copy map, 4 slugs x 2 locales x 3 beats | VERIFIED | Exists, all 4 slugs x 2 locales x 3 sub-objects populated, non-empty, 0 dashes, 0 price strings |
| `scripts/seed-phase25-service-landings.ts` | Idempotent seed script, 10-block anatomy | VERIFIED | Exists, builds exact UI-SPEC block order, resolves case study dynamically, refetch-inside-loop id-safety pattern present and functioning |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `seed-phase25-service-landings.ts` | `seed-phase25-data.ts` | import of copy map | WIRED | `import { serviceLandingCopy } from './seed-phase25-data'` — used directly in `buildLayout` |
| `seed-phase25-service-landings.ts` | `case-studies` collection | `payload.find({where:{slug:...}})` | WIRED | Live re-run confirmed dynamic resolution to id=14, throws loudly if not found (verified in source, not exercised since case study exists) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `ServiceScopeCardComponent` | `scope`/`outcome`/`timeline` props | Seeded Payload doc field, from `serviceLandingCopy` map | Yes — rendered text on all 8 pages matches seed source exactly, service-specific | FLOWING |
| `RelatedCaseStudyBlockComponent` | `caseStudy` relationship | Dynamically resolved case-study id=14 | Yes — `CaseStudyCard` renders real client/title/sector/heroMetric from the actual case-studies collection doc | FLOWING |

### Idempotency Re-Verification (live, real DB)

Re-ran `node --env-file=.env node_modules/.bin/tsx scripts/seed-phase25-service-landings.ts` independently against production Neon Postgres during this verification. Output: case study resolved to id=14, all 4 docs written for both locales, **zero `reapplyIds: blockType mismatch` warnings** — confirms the script is genuinely idempotent (not just claimed in SUMMARY.md). Post-run spot-check of `/servicios/seo-technical-audit` still returns 200 with exactly 1 `<h1>`.

### Regression Guardrail Check

`git diff f5d033a^..9a26cc1 --stat` against `src/blocks/Hero/`, `src/blocks/Content/`, `src/blocks/FAQ/`, `src/blocks/CallToAction/`, `src/blocks/ClientLogosBlock/`, `src/blocks/TestimonialsCarousel/` returns empty — confirmed zero changes to these block configs/components across all 3 task commits, matching the plan's "zero-change reuse" requirement.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| SVCPOL-01 | 25-03 | Full block anatomy per landing | SATISFIED | 10-block order verified on all 8 URLs |
| SVCPOL-02 | 25-03 | Reinforced social proof | SATISFIED | ClientLogosBlock + TestimonialsCarousel + RelatedCaseStudyBlock all present and rendering real data |
| SVCPOL-05 | 25-03 | Repeated CTA, same action | SATISFIED | Top/bottom CTA identical on all 8 pages |
| SVCPOL-06 | 25-03 | Humanizer discipline | SATISFIED | Zero em/en dash in new copy, verified at source and in rendered output |

### Anti-Patterns Found

None. No TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER markers in either modified file. No stub returns, no hardcoded empty data.

### Human Verification Required

None. All checks in this brief were verifiable programmatically via live curl + grep/parse against the running dev server and a live re-run against the real database.

### Gaps Summary

No gaps found. All 4 PLAN must-have truths and all 8 requested spot-checks pass against the live, running application and the real production database. The only em/en dashes present anywhere on the 8 rendered pages trace to pre-existing Phase 19 content (Hero subtitles, includes/process Content block) that this plan was explicitly required to leave untouched — correctly out of scope, not a regression introduced by this plan.

---

*Verified: 2026-07-12T21:48:00Z*
*Verifier: Claude (gsd-verifier)*
