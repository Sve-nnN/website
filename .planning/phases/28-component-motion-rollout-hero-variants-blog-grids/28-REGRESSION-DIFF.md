# Phase 28 Regression Gate: (Task 2 appends the final top-line verdict here)

Diff of the post-change site (Plans 28-02/28-03) against the Plan 28-01 baseline, across all 6 representative routes. Same measurement scripts as 28-01, re-run verbatim, plus a new reduced-motion headless pass (`scripts/verify-reduced-motion-phase28.mjs`).

## Task 1: Reduced-Motion Consistency + H1 / JSON-LD Integrity

Source: `28-reduced-motion-check.json` (new, this plan) and `28-post-content.json` (post-change, this plan) vs `28-baseline-content.json` (pre-change, 28-01). Reduced-motion check via `scripts/verify-reduced-motion-phase28.mjs --base-url http://localhost:3000` against the running dev server. H1/BreadcrumbList diff via inline `node -e` (Phase 25's 25-04 pattern).

### Reduced-motion consistency (prefers-reduced-motion: reduce emulation)

| Route | Hydration console/page errors | ScrollReveal elements found | ScrollReveal opacity check |
|---|---|---|---|
| /en | PASS (0 hydration errors) | 8 | PASS (all 8 at opacity:1) |
| /es | PASS (0 hydration errors) | 8 | PASS (all 8 at opacity:1) |
| /en/blog | PASS (0 hydration errors) | 15 | PASS (all 15 at opacity:1) |
| /servicios | PASS (0 hydration errors) | 0 | N/A (no ScrollReveal on this route — Hero-only) |
| /en/services | PASS (0 hydration errors) | 0 | N/A (no ScrollReveal on this route — Hero-only) |
| /en/seo-tecnico-lima | PASS (0 hydration errors) | 4 | PASS (all 4 at opacity:1) |

**Script result:** `RESULT: PASS (all hard assertions OK)` — exit code 0, 6/6 routes, zero failures. Every `[data-testid="scroll-reveal"]` element (35 total across the 3 routes that have any) was scrolled into view and settled at computed `opacity:1` under reduced-motion emulation; zero hydration-mismatch console or page errors were observed on any route.

### H1 / BreadcrumbList integrity

| URL | H1 count/text | BreadcrumbList itemListElement |
|---|---|---|
| /en | PASS (1, byte-identical: "Juan Carlos Angulo: Software Engineer &amp; SEO Expert") | N/A (no BreadcrumbList on this route, matches baseline) |
| /es | PASS (1, byte-identical: "Juan Carlos Angulo: Ingeniero de Software y Experto SEO") | N/A (no BreadcrumbList on this route, matches baseline) |
| /en/blog | PASS (1, byte-identical: "Blog") | N/A (no BreadcrumbList on this route, matches baseline) |
| /servicios | PASS (1, byte-identical: "Servicios") | PASS (deep-equal) |
| /en/services | PASS (1, byte-identical: "Services") | PASS (deep-equal) |
| /en/seo-tecnico-lima | PASS (1, byte-identical: "Technical SEO in Lima") | N/A (no BreadcrumbList on this route, matches baseline) |

**Programmatic diff result:** `PASS: H1 text unchanged on all routes present in baseline` (exact script output from `28-04-PLAN.md`'s Task 1 verify block) — 6/6 routes, zero H1 regressions. Full BreadcrumbList `itemListElement` deep-equality also confirmed for both routes that carry a BreadcrumbList (`/servicios`, `/en/services`).

**Task 1 verdict: PASS on all axes (6/6 routes).** Hero variant CSS differentiation (28-02) and blog-grid/PostCard motion (28-03) introduced zero hydration-mismatch errors, zero stuck-at-opacity:0 ScrollReveal elements under reduced-motion emulation, and zero H1/BreadcrumbList drift from the 28-01 baseline.
