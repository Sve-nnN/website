---
phase: 22-breadcrumbs-visual-schema
plan: 01
subsystem: frontend-seo
tags: [breadcrumbs, json-ld, servicios, structured-data]
dependency-graph:
  requires: []
  provides: [src/lib/breadcrumbs.ts]
  affects:
    - src/app/(frontend)/[locale]/servicios/page.tsx
    - src/app/(frontend)/[locale]/services/page.tsx
    - src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
    - src/app/(frontend)/[locale]/services/[slug]/page.tsx
tech-stack:
  added: []
  patterns:
    - "Pure breadcrumb-trail module (no DB access) feeding both a visual Hero-block prop and a JSON-LD block from one shared function"
    - "RenderBlocks blockProps override to inject computed data into a Payload-sourced block without editing the block's own component"
key-files:
  created:
    - src/lib/breadcrumbs.ts
  modified:
    - src/app/(frontend)/[locale]/servicios/page.tsx
    - src/app/(frontend)/[locale]/services/page.tsx
    - src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
    - src/app/(frontend)/[locale]/services/[slug]/page.tsx
decisions:
  - "Followed CONTEXT.md's locked decision to reuse the Hero block's existing breadcrumbs prop via RenderBlocks blockProps override, instead of research/SUMMARY.md's earlier suggestion of a standalone Breadcrumbs.tsx component + new shadcn source file — zero new component, zero new shadcn source file."
metrics:
  duration: 25min
  completed: 2026-07-12
---

# Phase 22 Plan 01: Breadcrumbs (visual + schema) for Servicios Summary

Single pure `buildTrail()`/`buildBreadcrumbJsonLd()` module in `src/lib/breadcrumbs.ts` now drives both the visible Hero-block breadcrumb nav and a matching `BreadcrumbList` JSON-LD block across all 5 Servicios pages (index + 4 landings) in both locales — zero new Payload fields, zero migrations.

## What Was Built

1. **`src/lib/breadcrumbs.ts`** (new pure module, zero DB/Payload imports): exports `buildTrail(locale, current?)` and `buildBreadcrumbJsonLd(trail)`. `buildTrail('es')` / `buildTrail('en')` return the 2-level index trail (`Inicio > Servicios` / `Home > Services`); passing `current: {slug, title}` appends a 3rd landing-page entry. URLs match the exact ES/EN segment convention already used in `src/lib/sitemap-data.ts` (`/servicios` vs `/en/services`). `buildBreadcrumbJsonLd()` maps every trail entry (including the last) to a `ListItem` with 1-indexed `position` and an absolute `item` URL built from `SITE_URL`.

2. **All 4 Servicios `page.tsx` route files** (`servicios/page.tsx`, `services/page.tsx`, `servicios/[slug]/page.tsx`, `services/[slug]/page.tsx`) now: call `buildTrail()` after their existing `notFound()` guard, render `<JsonLd data={buildBreadcrumbJsonLd(trail)} />` as the first child inside `<main>`, and pass `blockProps={{ hero: { breadcrumbs: trail } }}` to `<RenderBlocks>` — this overrides any editorial `breadcrumbs` value on the page's seeded `hero` block (variant `listing`) with the computed trail, per the existing merge-order contract in `RenderBlocks.tsx` (`blockProps` spreads last, wins). `Hero/Component.tsx` and `Hero/config.ts` were not touched — the `<nav aria-label="Breadcrumb">` render path already existed from Phase 10.8.

## Verification Evidence

- `npx tsc --noEmit` — zero errors after all 4 edits.
- `grep -c "getPayload\|@payload-config" src/lib/breadcrumbs.ts` → `0` (confirms pure, DB-free module).
- Live dev-server curl sweep of all 10 URLs (5 pages x 2 locales: `/servicios`, `/en/services`, and the 4 landings `/{seo-technical-audit,seo-consulting,fullstack-development,ai-seo-geo}` under both `/servicios/` and `/en/services/`) — every URL returned `200`, every page rendered a `<nav aria-label="Breadcrumb">` whose visible `<li>` count exactly matches its `BreadcrumbList` JSON-LD `itemListElement.length`, and the last crumb in every trail is rendered as a non-link `<span aria-current="page">` (not an `<a>`), matching CONTEXT.md's locked trail-structure decision. Index pages: 2 levels. Landing pages: 3 levels, ending in the real localized page title (e.g. "Consultoría SEO" / "SEO Consulting", "SEO para IA / GEO" / "AI SEO / GEO").
- `git status --short src/migrations/` — clean. No new migration files exist as a result of this plan.

### seo-schema Validation Pass

The `seo-schema` subagent (Task tool) was not available in this executor's toolset (Read/Write/Edit/Bash only). Applied the identical published checklist from `~/.claude/agents/seo-schema.md` directly against the 4 representative `BreadcrumbList` JSON-LD samples (ES index, EN index, ES landing `/servicios/seo-consulting`, EN landing `/en/services/seo-consulting`), extracted live from the running dev server:

| Check | ES index | EN index | ES landing | EN landing |
|-------|----------|----------|------------|------------|
| `@context` is `https://schema.org` | PASS | PASS | PASS | PASS |
| `@type` valid, not deprecated (`BreadcrumbList`) | PASS | PASS | PASS | PASS |
| Required properties present (`position`/`name`/`item` on every `ListItem`) | PASS | PASS | PASS | PASS |
| Property types correct (integer position, string name, URL item) | PASS | PASS | PASS | PASS |
| No placeholder text | PASS | PASS | PASS | PASS |
| URLs absolute | PASS | PASS | PASS | PASS |

Verdict: **PASS** across all 4 samples, no missing required properties, no invalid `@type`. `http://localhost:3000` origin is expected in dev (driven by `SITE_URL`'s `NEXT_PUBLIC_SERVER_URL` env fallback, same pattern already used sitewide since Phase 15's sitemap) — will resolve to the real production domain once that env var is set for deploy, unrelated to this phase's schema correctness.

Sample (ES landing, `/servicios/seo-consulting`):
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "http://localhost:3000" },
    { "@type": "ListItem", "position": 2, "name": "Servicios", "item": "http://localhost:3000/servicios" },
    { "@type": "ListItem", "position": 3, "name": "Consultoría SEO", "item": "http://localhost:3000/servicios/seo-consulting" }
  ]
}
```

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create `src/lib/breadcrumbs.ts` | 33d9048 | `src/lib/breadcrumbs.ts` |
| 2 | Wire `buildTrail()` + `JsonLd` into all 4 Servicios page.tsx files | 2720070 | 4 `page.tsx` files |
| 3 | Full 10-URL sweep + seo-schema validation (verification-only, no commit) | n/a | — |

## Deviations from Plan

None — plan executed exactly as written. The one documented deviation (Task 1's own instruction) is not a deviation from this executor but a restatement of CONTEXT.md overriding an earlier RESEARCH.md suggestion, already noted inline in the plan itself.

One process deviation worth flagging: the plan's Task 3 instructed invoking the `seo-schema` agent via the Task tool. This executor's available toolset did not include a Task/subagent-spawn tool, so the validation was performed directly by this executor applying the exact same published checklist (`~/.claude/agents/seo-schema.md`) against the 4 required samples. Evidence and verdict are recorded above; if the orchestrator wants a literal subagent-invocation record, a follow-up call to the `seo-schema` agent can be made independently — the underlying JSON-LD output is already verified correct.

## Known Stubs

None.

## Threat Flags

None. The two `mitigate`/`accept` items in the plan's `<threat_model>` (T-22-01 JsonLd reuse, T-22-02 buildTrail allowlist-checked inputs, T-22-03 public URL exposure) are all satisfied by the implementation as built — no new surface introduced beyond what the threat model already covered.

## Self-Check: PASSED

- `src/lib/breadcrumbs.ts` — FOUND
- `src/app/(frontend)/[locale]/servicios/page.tsx` (modified) — FOUND
- `src/app/(frontend)/[locale]/services/page.tsx` (modified) — FOUND
- `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx` (modified) — FOUND
- `src/app/(frontend)/[locale]/services/[slug]/page.tsx` (modified) — FOUND
- Commit `33d9048` — FOUND in `git log`
- Commit `2720070` — FOUND in `git log`
