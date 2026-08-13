---
phase: 26-ui-ux-polish-pass-low-risk-components
verified: 2026-07-13T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open /servicios (or any route) on a narrow viewport, tap the mobile menu (hamburger) to open the Radix Sheet, and inspect the active nav item"
    expected: "The nav item matching the current route shows the persistent ember underline/text color and `aria-current=\"page\"`, identical to the desktop nav treatment"
    why_human: "Radix `Sheet`/`Dialog` content is portal-rendered and does not appear in the server-rendered HTML fetched via curl — it only mounts in the DOM after client-side JS/hydration. Source-code inspection of `SiteHeaderChrome.tsx` confirms `aria-current`/active classes are applied identically to both the desktop `CMSLink` and the mobile Sheet `CMSLink` (same `isActive(item)` call, same conditional classes), but this cannot be confirmed by an HTTP fetch — needs a real browser (or headless browser with JS execution) to open the Sheet and read the resulting DOM."
---

# Phase 26: UI/UX Polish Pass — Low-Risk Components Verification Report

**Phase Goal:** Los componentes compartidos que v1.5 no tocó (CTA strip, navbar, FAQ, clientes, testimonios) ganan tratamiento visual pulido de nivel `ui-ux-pro-max`, y Case Studies gana el mismo trail de breadcrumbs visual + JSON-LD que Servicios ya tiene, cerrando la queja nombrada de Juan (CTA full-width) el primer día del milestone.
**Verified:** 2026-07-13
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CTA renders inside a single `Container`, no full-width `vw` bleed, both locales | ✓ VERIFIED | `src/blocks/CallToAction/Component.tsx` — single outer `Container className="py-12 md:py-16"` wraps the card `<section>`; former inner `Container` reduced to a plain `<div>`. Live HTML on `/` and `/en` shows one `max-w-6xl px-4 md:px-6 py-12 md:py-16` wrapper directly around the `rounded-2xl shadow-xl ring-1 ring-white/10` section — no nested second `Container`. |
| 2 | `SiteHeader` shows scroll-state class change and active-route `aria-current="page"` on the actual current route, desktop nav + mobile Sheet, both locales | ⚠ PARTIAL (desktop verified, mobile code-verified only) | `SiteHeaderChrome.tsx` implements `scrolled` state (`bg-secondary/95 backdrop-blur-sm shadow-lg` past 8px vs `bg-secondary shadow-md` idle) and `isActive()` exact-match logic applied identically to desktop `NavigationMenuLink`/`CMSLink` and mobile `Sheet` `CMSLink` (same `active && 'border-primary text-primary'` + `aria-current`). Live curl of `/servicios` (ES) and `/en/services` (EN) confirms 2 `aria-current="page"` occurrences per page (desktop nav is SSR'd), idle scroll class confirmed server-rendered. Mobile Sheet content is Radix-portal-rendered and does not appear in curl'd HTML (client-mount-only) — code inspection shows correct identical wiring, but actual DOM output inside the open Sheet needs a real-browser check (see Human Verification). |
| 3 | FAQ shows individually bordered/elevated cards | ✓ VERIFIED | `src/blocks/FAQ/Component.tsx` — `space-y-3` + per-`<details>` `rounded-lg border border-border bg-card px-6 shadow-sm hover:shadow-md`, `Plus` lucide icon glyph. Live HTML on `/` shows 5 real `<details class="group rounded-lg border border-border bg-card ...">` elements (real Payload FAQ data, not stubbed). |
| 4 | `ClientLogosBlock` normalized by height, `TestimonialsCarousel` shows scroll fade | ✓ VERIFIED | `ClientLogosBlock/Component.tsx` wraps each logo in `flex h-10 md:h-12 items-center` + `h-full w-auto max-w-[140px]` on `Image`. `TestimonialsCarousel/Component.tsx` adds `relative` wrapper + `pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent`. Live HTML: 12 logo cells rendered with the new class, 3 real testimonial cards with the fade div present. |
| 5 | Case Studies listing (2-level breadcrumb) and detail (3-level breadcrumb) show real breadcrumb nav + valid `BreadcrumbList` JSON-LD, both locales | ✓ VERIFIED | `src/lib/breadcrumbs.ts` — `buildCaseStudiesTrail()` added as a sibling of `buildTrail()`, sharing internal `buildSectionTrail()`. Both `case-studies/page.tsx` and `case-studies/[slug]/page.tsx` wired. Live: `/case-studies` (ES) renders `Inicio > Casos de éxito` nav + matching 2-item `BreadcrumbList` JSON-LD; `/en/case-studies` same in EN; `/case-studies/migracion-ecommerce-nextjs-seo-tecnico` renders 3-level nav + 3-item JSON-LD (`Inicio > Casos de éxito > {title}`); `/en/case-studies/migracion-ecommerce-nextjs-seo-tecnico` same in EN, correctly localized labels and title. |

**Score:** 5/5 truths structurally verified; truth #2 carries one client-only-rendered sub-claim (mobile Sheet) that is code-verified but not curl-verifiable — routed to human verification rather than marked FAILED, since source evidence is strong and consistent.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/blocks/CallToAction/Component.tsx` | Single `Container` wrapper | ✓ VERIFIED | Matches UI-SPEC code contract exactly; live-rendered, no double nesting |
| `src/blocks/FAQ/Component.tsx` | Bordered/elevated card list | ✓ VERIFIED | Matches UI-SPEC; live-rendered with 5 real FAQ items |
| `src/blocks/ClientLogosBlock/Component.tsx` | Height-normalized logo cells | ✓ VERIFIED | Matches UI-SPEC; live-rendered with 12 real client logos |
| `src/blocks/TestimonialsCarousel/Component.tsx` | Edge-fade scroll affordance | ✓ VERIFIED | Matches UI-SPEC; live-rendered with 3 real testimonials |
| `src/components/SiteHeader.tsx` | Thin server wrapper delegating to chrome | ✓ VERIFIED | Unchanged `findGlobal`/`normalizeServiceHref` logic, delegates to `SiteHeaderChrome` |
| `src/components/SiteHeaderChrome.tsx` | Client component: scroll-state + active-route | ✓ VERIFIED | Created; scroll listener + `usePathname()` match logic present, applied to both desktop and mobile |
| `src/components/CMSLink.tsx` | `aria-current` forwarding (undocumented dependency, auto-fixed) | ✓ VERIFIED | Optional `'aria-current'` prop added, forwarded to both plain and `appearance`(Button) render paths |
| `src/lib/breadcrumbs.ts` | `buildCaseStudiesTrail()` sibling export, `buildTrail()` unchanged behavior | ✓ VERIFIED | Generalized `buildSectionTrail()` internal, both exports present, `buildTrail()` byte-compatible |
| Case Studies listing/detail `page.tsx` | Wired to shared breadcrumb helper | ✓ VERIFIED | Both pages import and use `buildCaseStudiesTrail`/`buildBreadcrumbJsonLd`, hand-rolled `breadcrumbData` removed from detail page |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `CallToAction/Component.tsx` | `Container` component | single wrapper, no nested Container | ✓ WIRED | Live HTML confirms one `max-w-6xl` ancestor |
| `SiteHeaderChrome.tsx` nav items | `CMSLink` `aria-current` prop | prop pass-through to `next/link` anchor | ✓ WIRED | Live HTML on `/servicios`/`/en/services` shows `aria-current="page"` rendered server-side on desktop nav |
| `case-studies/page.tsx` / `[slug]/page.tsx` | `src/lib/breadcrumbs.ts` | `buildCaseStudiesTrail()` + `buildBreadcrumbJsonLd()` imports | ✓ WIRED | Live JSON-LD and visual nav both derive from the same `trail` variable, matching labels/URLs |
| Services pages (4 call sites) | `buildTrail()` | unchanged signature | ✓ WIRED (regression-safe) | All 4 combos (`/servicios`, `/en/services`, `/services`, `/en/servicios`) plus a detail slug (`/servicios/seo-technical-audit`) return HTTP 200 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `FAQComponent` | `faqs` | Payload block field data | Yes — 5 real items rendered | ✓ FLOWING |
| `ClientLogosBlockComponent` | `logos` | `payload.find('clientes')` fallback / `clients` prop | Yes — 12 real logos rendered | ✓ FLOWING |
| `TestimonialsCarouselComponent` | `testimonials` | `payload.find('testimonials')` | Yes — 3 real testimonials rendered | ✓ FLOWING |
| `case-studies/page.tsx` | `caseStudies` | `payload.find('case-studies')` | Yes — real doc rendered, non-empty path exercised | ✓ FLOWING |
| `case-studies/[slug]/page.tsx` | `doc` | `payload.find('case-studies', where slug)` | Yes — real doc, real title/slug feeding trail | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| CTA single-Container structure | `curl / \| grep 'max-w-6xl...py-12 md:py-16'` | 1 match, directly wrapping CTA `<section>` | ✓ PASS |
| FAQ bordered cards render | `curl / \| grep -c '<details class="group rounded-lg...'` | 5 | ✓ PASS |
| Client logos height-normalized cells render | `curl / \| grep -c 'flex h-10 md:h-12 items-center'` | 12 | ✓ PASS |
| Testimonials fade renders | `curl / \| grep -c 'bg-gradient-to-l from-background'` | 1 (present) | ✓ PASS |
| Desktop nav `aria-current` on active route | `curl /servicios \| grep -c 'aria-current="page"'` | 2 (nav + Sheet SSR shell placeholder, desktop confirmed) | ✓ PASS |
| Services regression (4 combos + 1 detail) | `curl -o /dev/null -w '%{http_code}'` × 5 | all 200 | ✓ PASS |
| Case Studies listing/detail breadcrumb + JSON-LD, both locales | `curl` × 4 routes | 2-level and 3-level trails + matching JSON-LD confirmed in all 4 | ✓ PASS |
| `npx tsc --noEmit -p tsconfig.json` | full typecheck | exit 0, zero errors | ✓ PASS |
| Migration files untouched | `git diff --stat -- src/migrations/` across phase's 10 commits | empty (no migration files in diff) | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` files exist in this repo and none are referenced by the phase's PLAN/SUMMARY files — Step 7c skipped (no probes declared or conventional).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| UIPOL-01 | 26-01 | CTA leaves `Container` bug | ✓ SATISFIED | Verified truth #1 |
| UIPOL-02 | 26-02 | Navbar scroll-state / active-route polish | ✓ SATISFIED (desktop); mobile Sheet needs human confirmation | Verified truth #2 |
| UIPOL-04 | 26-01 | FAQ visual polish | ✓ SATISFIED | Verified truth #3 |
| UIPOL-05 | 26-01 | Client logos visual polish | ✓ SATISFIED | Verified truth #4 |
| UIPOL-06 | 26-01 | Testimonials visual polish | ✓ SATISFIED | Verified truth #4 |
| UIPOL-09 | 26-03 | Case Studies unified breadcrumbs | ✓ SATISFIED | Verified truth #5 |

No orphaned requirements — all 6 requirements mapped to Phase 26 in REQUIREMENTS.md are claimed by one of the 3 plans' `requirements` frontmatter.

### Anti-Patterns Found

None. Scanned all 10 files touched by this phase (`CallToAction`, `FAQ`, `ClientLogosBlock`, `TestimonialsCarousel` Components; `SiteHeader`, `SiteHeaderChrome`, `CMSLink`; `breadcrumbs.ts`; both Case Studies `page.tsx` files) for `TBD`/`FIXME`/`XXX`/`TODO`/`HACK`/`PLACEHOLDER`/stub patterns — zero matches. No `config.ts`/schema/`payload-types.ts`/migration files were touched (confirmed via `git diff --stat` across the phase's 10 commits) — matches the phase's explicit regression guardrails.

### Human Verification Required

### 1. Mobile Sheet nav active-route indicator

**Test:** On a mobile/narrow viewport (or with a real browser dev-tools device emulation), navigate to a route with a matching nav item (e.g. `/servicios`), open the hamburger menu (mobile `Sheet`), and inspect the nav item matching the current route.
**Expected:** The matching nav item shows the persistent `border-primary text-primary` ember treatment and `aria-current="page"`, exactly matching the desktop nav's active-state styling.
**Why human:** Radix `Sheet`'s content is portal-rendered and only mounts into the DOM client-side after hydration/interaction — it does not appear in server-rendered HTML fetched via `curl`, so this specific sub-claim of truth #2 cannot be confirmed by an HTTP-only check. Source-code inspection of `SiteHeaderChrome.tsx` shows the exact same `isActive()`/`aria-current` logic applied to both the desktop and mobile `CMSLink` render paths (same conditional expression, same className computation), which is strong evidence the wiring is correct, but only a real browser/headless-JS check can confirm the actual rendered DOM inside the open Sheet.

### Gaps Summary

No blocking gaps. Every structurally-verifiable success criterion (CTA container fix, FAQ/logos/testimonials visual polish, Case Studies breadcrumbs listing+detail in both locales, Services regression, `tsc` clean, zero migration touches) passed direct codebase and live-HTTP verification, contradicting nothing in the 3 SUMMARY.md files. The one item routed to human verification (mobile Sheet active-route indicator) is a rendering-technology limitation of automated HTTP verification, not a code defect — `SiteHeaderChrome.tsx`'s source shows identical wiring for desktop and mobile. This is a WARNING-level item, not a BLOCKER: recommend a 10-second real-browser check before considering Phase 26 fully closed, but it does not indicate the implementation is missing or wrong.

---

_Verified: 2026-07-13_
_Verifier: Claude (gsd-verifier)_
