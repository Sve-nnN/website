# Phase 48 Plan Verification

**Status:** PASSED (blocker resolved 2026-09-05; the one warning was documentation-only and closed by marking 48-RESEARCH.md's Open Questions section RESOLVED)
**Plans checked:** 48-01, 48-02, 48-03
**Issues:** 0 blocker, 0 warning remaining

## Resolved Blockers

### 1. [key_links_planned / ui_spec_compliance] `/stack` never renders `<PageHero>` — no visible `<h1>`, no visible breadcrumb trail — RESOLVED (re-verified 2026-09-05)

**Fix applied:** 48-01-PLAN.md Task 1 Paso 10 now instructs rendering `<PageHero variant="index" title={doc.title} trail={trail} />` immediately inside `<main>`, before `<RenderBlocks>`, matching `websites/page.tsx`'s pattern (the same `trail` array is passed to both `PageHero` and `buildBreadcrumbJsonLd`, per UI-SPEC). Paso 10 now explicitly calls out that Home is the one exception in the codebase without `PageHero` and instructs NOT replicating that absence. Task 1's `<verify>` (Paso 12 / `verify-stack-page.ts`) now asserts exactly one `<h1` per locale and a visible breadcrumb marker, and `acceptance_criteria` was updated to require this. `read_first` includes `websites/page.tsx`'s full route pattern and `PageHero.tsx` is in the plan's shared `<context>` block. No conflict introduced with 48-02/48-03, UI-SPEC (which already specified `PageHero variant="index"` and reconciled it with the "no editing sitemap-data.ts/canonical.ts/breadcrumbs.ts" constraint as calling-not-editing), or that constraint — `PageHero` is a component render, not a change to those three files.

Original finding (for audit trail):

- Plan: 48-01, Task 1, Paso 10 (ruta `/stack`)
- 48-UI-SPEC.md (required reading) is explicit and repeated on this point:
  - Typography table: `<h1>` (page title "Mi stack"/"My stack") → **`PageHero` `variant="index"` title treatment**.
  - "Breadcrumbs / canonical" section: "`/stack`'s `PageHero` trail is a literal inline array... passed straight to `PageHero`'s existing `trail` prop **and** to the existing generic `buildBreadcrumbJsonLd(trail)`" — i.e. both the visual trail AND the JSON-LD are expected from the same array.
  - Component Contract Detail explicitly names `PageHero variant="index"` as "correct here" because `/stack` is a listing-style page.
- What the plan actually instructs (48-01 Paso 10): build the `trail` array and pass it **only** to `buildBreadcrumbJsonLd(trail)` inside `<JsonLd>`. There is no instruction anywhere in 48-01/48-02/48-03 to import or render `<PageHero>` on the `/stack` route. `ToolStack/Component.tsx` (Paso 9) renders `intro` in `<Prose>`, the disclosure frame, and the category groups — none of which is an `<h1>`.
- Verified against actual code: `PageHero.tsx` is the only component in the codebase that renders both `<h1>` and the visual `HeroBreadcrumbs` (confirmed by reading the component — `<h1 className=...>{title}</h1>` and `{trail && trail.length > 0 && <HeroBreadcrumbs trail={trail} />}`). Every other listing page in this codebase (`websites/page.tsx`, `case-studies/page.tsx`, `authors/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `search/page.tsx`) uses `PageHero`. The Home page is the only page.tsx that does NOT use `PageHero` (it gets its `<h1>` from a Hero block inside `content.layout` instead) — and 48-01 Paso 10 explicitly tells the executor to copy Home's pattern "EXACTO," which is precisely the one page.tsx pattern in this codebase that has no `PageHero` call.
- Consequence if executed as written: `/stack` ships with no `<h1>` anywhere on the page and no visible breadcrumb trail — only breadcrumb JSON-LD with no on-page UI backing it. This is a basic on-page SEO defect (missing H1) on a project whose CLAUDE.md states "Core Value: ... rendimiento y SEO impecables. Si el rendimiento o el SEO fallan, el sitio no cumple su propósito." None of the `<verify>` blocks in 48-01/48-02 (`verify-stack-page.ts`, `verify-stack-word-count.ts`) check for `<h1>` presence, so this gap would not be caught by any automated gate before the phase is marked done.
- Fix: 48-01 Task 1 Paso 10 must render `<PageHero variant="index" title={doc.title} trail={trail} />` (or equivalent) on the `/stack` route, matching the pattern already used by `websites/page.tsx`/`case-studies/page.tsx`, and pass the SAME `trail` array to both `PageHero` and `buildBreadcrumbJsonLd`. Add an `<h1>`/breadcrumb assertion to `verify-stack-page.ts` so the gap can't silently regress.

## Warnings

### 1. [research_resolution] 48-RESEARCH.md's Open Questions are substantively resolved by the plans but not marked `RESOLVED` in the document

- File: `48-RESEARCH.md`, `## Open Questions` (no `(RESOLVED)` suffix, no inline `RESOLVED` markers)
- Q1 (`whyIUseIt` deprecate-or-repurpose) is resolved by the plans: 48-01 Paso 2 puts the ≥100-word narrative on `ToolStack.tools[].narrative` (new field) and 48-02 Task 2 explicitly repurposes `whyIUseIt` as the source for the no-commission callout's copy — a deliberate choice, not an oversight.
- Q2 (Hostinger's pending affiliate link) is resolved by the plans exactly per RESEARCH's own recommendation: ships in the "no affiliate yet" visual state alongside DigitalOcean/Kinsta (48-02 Task 1/2), no blocking checkpoint added.
- This is a documentation-hygiene gap only — the plan content shows the questions were actually decided — but per Dimension 11's mechanical check, the RESEARCH.md section itself should be updated to say `## Open Questions (RESOLVED)` (or mark each item inline) so a future reader doesn't mistake this for an unresolved gap.

## Verified Strong Points (spot-checked, not just read)

- **Amazon URLs (13 total, spot-checked 4 of 13 live via `curl`):** `amzn.to/46EVbDZ` → `dp/B0DKFMSMYK`, `amzn.to/4qXFkdc` → `dp/B0BHJJ9Y77`, `amzn.to/4gVo0AR` → `dp/B0FHLN6M8Y`, `amzn.to/4x7wavW` → `dp/B0FXGWKHND` — all four match 48-02-PLAN.md's table exactly, all four are genuinely distinct products/ASINs, all four carry `tag=juantech02-20`, none is a shortlink. The planner's claim of having live-resolved these during planning checks out.
- **`program` enum widening:** confirmed additive-only against the real file (`src/collections/AffiliateLinks/index.ts:48`, current options `['amazon','kinsta','dinorank','digitalocean','other']`, exactly matching what 48-01 claims as the starting state before adding 7 new values). No rename/removal instructed anywhere in the plan.
- **DigitalOcean/Kinsta/Hostinger "pending" render vs. GSC "none" render:** correctly modeled as two distinct branches in `resolveAffiliateCta` (`kind:'pending'` → neutral `Badge`, always visible at full card weight, never `/go/undefined`; `kind:'none'` for GSC → no CTA slot content at all, never even a badge) — both the code-level design (48-01) and the UI-SPEC agree these must never look "disabled."
- **No price tables / no ranking by commission:** enforced structurally, not just in prose — `categoryGroups`/`tools` render via a bare `.map` in editorial array order (48-01 Paso 9, Paso 3 of Task 2), no sort call is ever introduced anywhere in the three plans, and the schema's own `admin.description` documents the anti-reorder rule for future editors.
- **INL-01/02 zero-migration + TDZ-hazard avoidance:** confirmed `posts.content` is already `jsonb` (cited migration file), and 48-03's `<verify>` block includes a negative grep specifically for `import ... from '@/components/AffiliateDisclosure'` / `'@/components/RichTextRenderer'` inside `AffiliateInlineCard.tsx`, plus a real `npm run build` check for the exact TDZ error string — this is an enforced gate, not just a stated intention.
- **Requirement coverage:** all 8 requirements (STACK-01..06, INL-01/02) appear in `requirements:` frontmatter across the three plans with no gaps; content coverage matches 48-CONTEXT.md's 9 tools + Amazon gear + GSC exactly (Cursor/Claude/OpenAI/Sitebulb correctly excluded, nav-principal correctly excluded, DigitalOcean network ambiguity correctly deferred).

## Recommendation

Fix the blocker (wire `PageHero` into `/stack`'s route, matching the UI-SPEC's explicit and repeated instruction) before execution. The warning can be resolved by simply updating `48-RESEARCH.md`'s Open Questions heading — no plan change required, since the underlying decisions are already correctly reflected in the plans.
