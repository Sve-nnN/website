# Phase 32 Regression Baseline

**Captured:** 2026-07-14, production build (`npx next build` + `PORT=3040 npx next start`, `caffeinate -u` held throughout), Chrome-for-Testing via `scripts/lighthouse-mobile.mjs`, mobile form factor.

Purpose: snapshot the site's current state before any v1.7 phase (33-36) touches a component. Compared against this file at Phase 36's Regression Gate. Same pattern as `28-REGRESSION-DIFF.md`.

Route set: home (ES/EN) + all 4 locale combinations of `/seo-tecnico-madrid` and `/seo-tecnico-lima` — the only routes Phase 34 will structurally modify. Route resolution confirmed via curl: `/` and `/en` are 200 (canonical), `/es` 307-redirects to `/` (next-intl `localePrefix: 'as-needed'` with `defaultLocale: 'es'`).

## Lighthouse Mobile (production build, port 3040)

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| / | 84 | 96 | 96 | 100 | 4094ms (poor) | 0 (good) | 154ms (good) |
| /en | 85 | 96 | 96 | 100 | 4236ms (poor) | 0 (good) | 75ms (good) |
| /seo-tecnico-madrid | 88 | 98 | 96 | 91 | 3795ms (needs-improvement) | 0 (good) | 65ms (good) |
| /en/seo-tecnico-madrid | 89 | 98 | 96 | 91 | 3782ms (needs-improvement) | 0 (good) | 64ms (good) |
| /seo-tecnico-lima | 89 | 98 | 96 | 91 | 3783ms (needs-improvement) | 0 (good) | 60ms (good) |
| /en/seo-tecnico-lima | 89 | 98 | 96 | 91 | 3785ms (needs-improvement) | 0 (good) | 60ms (good) |

Raw data: `lh-phase32-baseline.json`. LCP bands: good <=2500ms / needs-improvement <=4000ms / poor above. CLS: good <=0.1 / needs-improvement <=0.25 / poor above. TBT: good <=200ms / needs-improvement <=600ms / poor above.

## H1 / JSON-LD Snapshot

| Route | H1 (count, text) | JSON-LD types |
|---|---|---|
| / | 1, "Juan Carlos Angulo: Ingeniero de Software y Experto SEO" | Person |
| /en | 1, "Juan Carlos Angulo: Software Engineer & SEO Expert" | Person |
| /seo-tecnico-madrid | 1, "SEO Técnico en Madrid / España" | none |
| /en/seo-tecnico-madrid | 1, "Technical SEO in Madrid / Spain" | none |
| /seo-tecnico-lima | 1, "SEO Técnico en Lima" | none |
| /en/seo-tecnico-lima | 1, "Technical SEO in Lima" | none |

Raw data: `32-baseline-content.json`. All 6 routes have exactly one H1, no duplicates, no missing headings. Local landing pages carry no JSON-LD in the current baseline (Phase 33/34 introduce no explicit requirement to add it — noted for Phase 36 comparison, not a defect).

## Phase 32 Verdict: Baseline captured, 6/6 routes clean

No component or content was modified during this phase — measurement only, per REG-01 and the phase's success criteria. This file and its two JSON artifacts are the reference point for Phase 36's Regression Gate.
