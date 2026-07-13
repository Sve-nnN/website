---
phase: 22-breadcrumbs-visual-schema
verified: 2026-07-12T00:00:00Z
status: passed
score: 3/3 must-haves fully verified
overrides_applied: 0
note: "BREAD-03 closed post-verification by the orchestrator: the seo-schema subagent (Agent tool, subagent_type: 'seo-schema') was invoked directly against all 10 live URLs (not just the 4-sample subset) and returned 10/10 PASS — @context, @type, sequential position, required ListItem properties, absolute item URLs, no placeholders. Supersedes the human_needed status originally recorded here."
---

# Phase 22: Breadcrumbs (visual + schema) Verification Report

**Phase Goal:** Usuarios ven un trail de breadcrumbs claro en la jerarquía de Servicios, y los motores de búsqueda reciben el mismo trail como BreadcrumbList JSON-LD, derivados de una sola fuente de verdad sin riesgo de schema/DB.
**Verified:** 2026-07-12
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Visible breadcrumb trail renders on Servicios index + 4 landings, both locales (BREAD-01) | ✓ VERIFIED | Live curl against dev server (10/10 URLs) shows `<nav aria-label="Breadcrumb">` with 2 `<li>` on index pages (`Inicio > Servicios` / `Home > Services`) and 3 `<li>` on all 4 landings, ending in a non-clickable `<span aria-current="page">` with the real localized page title (e.g. "Consultoría SEO" / "SEO Consulting"). See raw extraction table below. |
| 2 | Every page with breadcrumbs emits `BreadcrumbList` JSON-LD derived from the same `buildTrail()` call as the visual trail, no duplicated URL/locale logic (BREAD-02) | ✓ VERIFIED | All 10 URLs' `<script type="application/ld+json">` `itemListElement.length` matches the visible `<li>` count exactly (2-2 on index, 3-3 on landings). Source-level check: `src/lib/breadcrumbs.ts` is the only file in the diff containing URL-segment/label logic (`homeHref`, `servicesSegment`, `servicesIndexHref`, `LABELS`); a grep of all 4 `page.tsx` files for `servicios`/`services` string literals shows only import statements referencing `getServicePage`/`getServicesIndexPage` from `services-data.ts` — zero re-derivation of trail URLs/labels in any page file. Both the visual trail (`blockProps={{ hero: { breadcrumbs: trail } }}`) and JSON-LD (`buildBreadcrumbJsonLd(trail)`) consume the identical `trail` const per page. |
| 3 | `BreadcrumbList` JSON-LD validates with no errors in both locales via the `seo-schema` agent (BREAD-03) | ? UNCERTAIN | Structural schema.org validation independently re-run by this verifier against live output (see Anti-Patterns/Data section below) passes every check in the published `seo-schema` checklist. However, the literal agent invocation named by BREAD-03 was not performed — by the executor (documented in SUMMARY.md as a toolset limitation) or by this verifier (same toolset limitation: no Task tool available). Routed to human verification. |

**Score:** 2/3 truths fully verified programmatically; 1/3 verified by equivalent manual evidence, pending human/tooling confirmation of the literal agent-invocation clause.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/breadcrumbs.ts` | Pure `buildTrail()`/`buildBreadcrumbJsonLd()` module, zero DB access | ✓ VERIFIED | Exists, exports both functions with exact signatures from the plan. `grep -c "getPayload\|@payload-config"` → 0 (confirmed pure). |
| `src/app/(frontend)/[locale]/servicios/page.tsx` | Wired: imports `buildTrail`/`buildBreadcrumbJsonLd`/`JsonLd`, renders both | ✓ VERIFIED | Imports present, `trail` computed and passed to both `<JsonLd>` and `<RenderBlocks blockProps>`. |
| `src/app/(frontend)/[locale]/services/page.tsx` | Same, EN index | ✓ VERIFIED | Identical wiring confirmed. |
| `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx` | Same, ES landing, 3-level trail with `doc.title` | ✓ VERIFIED | `buildTrail(locale, { slug: doc.slug ?? slug, title: doc.title })` present and correctly wired. |
| `src/app/(frontend)/[locale]/services/[slug]/page.tsx` | Same, EN landing | ✓ VERIFIED | Identical wiring confirmed. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| All 4 `page.tsx` files | `src/lib/breadcrumbs.ts` | `import { buildTrail, buildBreadcrumbJsonLd }` | WIRED | Confirmed via source read + live output matching computed values. |
| All 4 `page.tsx` files | `src/blocks/RenderBlocks.tsx` | `blockProps={{ hero: { breadcrumbs: trail } }}` | WIRED | `RenderBlocks` spreads `blockProps?.[block.blockType]` last (overrides Payload-sourced `breadcrumbs`), confirmed in source; live output shows the computed trail (not the empty `breadcrumbs: []` seeded in the Payload doc — confirmed via REST API dump showing seeded `"breadcrumbs": []` on the hero block, meaning the visible nav is genuinely coming from the override, not from editorial data). |
| All 4 `page.tsx` files | `src/components/JsonLd.tsx` | `<JsonLd data={buildBreadcrumbJsonLd(trail)} />` | WIRED | Confirmed rendering the exact `<script type="application/ld+json">` payload matching `buildBreadcrumbJsonLd()`'s output shape. |
| `src/blocks/Hero/Component.tsx` | breadcrumbs prop | `isListing && breadcrumbs && breadcrumbs.length > 0` gate | WIRED | Confirmed `variant: 'listing'` is seeded on both the Servicios index and landing hero blocks (`scripts/seed-phase19-service-pages.ts` lines 96, 139), so the gate passes and the nav renders. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| Visual breadcrumb `<nav>` | `trail` (buildTrail output) | `SERVICE_SLUGS`/`SITE_URL` (static) + `doc.title` (live Postgres fetch via `getServicePage`) | Yes — verified via 10-URL live curl sweep showing real localized titles (e.g. "SEO para IA / GEO", "Full-Stack Development with SEO Built In") | ✓ FLOWING |
| JSON-LD `BreadcrumbList` | `buildBreadcrumbJsonLd(trail)` | Same `trail` const, no independent query | Yes — item counts and labels match the visual trail exactly on all 10 URLs | ✓ FLOWING |

### Live URL Sweep (10/10)

| URL | HTTP | Nav `<li>` count | Nav labels | JSON-LD items | Match |
|-----|------|-------------------|-----------|----------------|-------|
| `/servicios` | 200 | 2 | Inicio, Servicios | 2 | OK |
| `/en/services` | 200 | 2 | Home, Services | 2 | OK |
| `/servicios/seo-technical-audit` | 200 | 3 | Inicio, Servicios, Auditoría SEO Técnica | 3 | OK |
| `/en/services/seo-technical-audit` | 200 | 3 | Home, Services, Technical SEO Audit | 3 | OK |
| `/servicios/seo-consulting` | 200 | 3 | Inicio, Servicios, Consultoría SEO | 3 | OK |
| `/en/services/seo-consulting` | 200 | 3 | Home, Services, SEO Consulting | 3 | OK |
| `/servicios/fullstack-development` | 200 | 3 | Inicio, Servicios, Desarrollo Full-Stack con SEO integrado | 3 | OK |
| `/en/services/fullstack-development` | 200 | 3 | Home, Services, Full-Stack Development with SEO Built In | 3 | OK |
| `/servicios/ai-seo-geo` | 200 | 3 | Inicio, Servicios, SEO para IA / GEO | 3 | OK |
| `/en/services/ai-seo-geo` | 200 | 3 | Home, Services, AI SEO / GEO | 3 | OK |

(Note: an initial naive grep against the raw HTML falsely flagged `/en/services` as a 404 due to Next.js's RSC flight payload including boilerplate `HTTPAccessErrorFallback`/`status:404` component definitions unrelated to the actual response; the real SSR DOM segment — isolated before the `self.__next_f` flight script — confirms a genuine 200 with correct title "Services"/h1 "Services" and full breadcrumb + JSON-LD content. This false alarm was ruled out before concluding OK.)

### Schema.org Structural Validation (independent re-check, sample: `/servicios/seo-consulting`)

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

Checked programmatically (Python, this verifier, independent of SUMMARY.md's claims): `@context` == `https://schema.org` ✓, `@type` == `BreadcrumbList` (not deprecated) ✓, every `ListItem` has `position`/`name`/`item` ✓, positions sequential 1-indexed ✓, all `item` values absolute URLs ✓. No placeholder text. Last crumb rendered as `<span aria-current="page">` (non-link), consistent across all 4 sampled landing pages.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BREAD-01 | 22-01-PLAN.md | Visible breadcrumb trail, index + 4 landings, ES/EN | ✓ SATISFIED | Live 10-URL sweep, all matching. |
| BREAD-02 | 22-01-PLAN.md | BreadcrumbList JSON-LD from same `buildTrail()`, no duplicated logic | ✓ SATISFIED | Source-level + live-output cross-check; single source of truth confirmed. |
| BREAD-03 | 22-01-PLAN.md | seo-schema agent validation, both locales | ? NEEDS HUMAN | Structural validation independently confirmed correct; literal agent invocation not performed by executor or verifier (tooling gap in both sessions). |

### Anti-Patterns Found

None. `grep -n -E "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` across all 5 changed/created files returned zero matches. `npx tsc --noEmit` passes with zero errors. `git status --short src/migrations/` is clean (no new migration, matching the phase's zero-schema-change premise).

### Human Verification Required

### 1. Formal seo-schema agent invocation for BREAD-03

**Test:** In a Claude session with Task-tool access, invoke `subagent_type: "seo-schema"` against the 4 representative BreadcrumbList JSON-LD samples: `/servicios` (ES index), `/en/services` (EN index), `/servicios/seo-consulting` (ES landing), `/en/services/seo-consulting` (EN landing).
**Expected:** PASS verdict, no missing required properties, no invalid `@type` — consistent with the manual-checklist equivalent already recorded in this report and in `22-01-SUMMARY.md`.
**Why human:** Both the phase-22 executor and this verifier ran with a Read/Write/Bash-only toolset with no Task/subagent-spawn capability, so the literal instrument named by BREAD-03 was never actually invoked in either session — only a manual application of its published checklist. The underlying JSON-LD is independently confirmed schema-correct by this verifier, but closing BREAD-03 to the letter requires either running the actual agent once (a Claude session with Task-tool access) or Juan explicitly accepting the manual-checklist evidence as satisfying the requirement's intent.

### Gaps Summary

BREAD-01 and BREAD-02 are fully, independently verified against live rendered output — the breadcrumb trail and JSON-LD are real, correctly wired through the single `buildTrail()`/`buildBreadcrumbJsonLd()` source of truth, with zero schema/migration risk as required. BREAD-03's substance (schema correctness) is also independently confirmed, but the specific tooling clause ("usando el agente/MCP seo-schema") was not literally executed by either the phase executor or this verification pass, due to an identical Task-tool gap in both toolsets. This is not a code defect — it is a process/tooling gap that needs a human decision: either run the agent literally, or accept the equivalent manual-checklist evidence (which already matches what the agent's own published checklist would check) and close BREAD-03 on that basis.

---

*Verified: 2026-07-12*
*Verifier: Claude (gsd-verifier)*
