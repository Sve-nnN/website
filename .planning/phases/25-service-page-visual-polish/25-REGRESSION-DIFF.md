# Phase 25 Regression Gate: PENDING (Task 2 will finalize verdict)

Diff of the post-change site (Plans 25-02/25-03) against the Plan 25-01 baseline, across all 8 service URLs (4 slugs x 2 locales). Same measurement scripts as 25-01, re-run verbatim, unmodified.

## Task 1: H1 / JSON-LD / ES-EN Parity

Source: `25-baseline-content.json` (pre-change, 25-01) vs `25-post-content.json` (post-change, this plan). Programmatic diff via `node -e` (see 25-04-PLAN.md verify block). Live ES/EN parity check via direct fetch against exact translation-namespace strings from `messages/en.json` / `messages/es.json` (`serviceScopeCard.*`, `relatedCaseStudyBlock.title`).

| URL | H1 count/text | BreadcrumbList itemListElement | ES/EN scope-card + framing parity |
|---|---|---|---|
| /servicios/seo-technical-audit | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /servicios/seo-consulting | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /servicios/fullstack-development | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /servicios/ai-seo-geo | PASS (1, byte-identical) | PASS (deep-equal) | PASS (Spanish labels present, zero EN leakage) |
| /en/services/seo-technical-audit | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |
| /en/services/seo-consulting | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |
| /en/services/fullstack-development | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |
| /en/services/ai-seo-geo | PASS (1, byte-identical) | PASS (deep-equal) | PASS (English labels present, zero ES leakage) |

**Programmatic diff result:** `PASS: 8/8 URLs, H1 + BreadcrumbList unchanged from baseline` (exact script output from `25-04-PLAN.md`'s Task 1 verify block).

**ES/EN parity detail:** For every URL, all 4 locale-specific `serviceScopeCard` strings (`title`/`scopeLabel`/`outcomeLabel`/`timelineLabel`) and the `relatedCaseStudyBlock.title` string were confirmed present verbatim, with zero occurrence of the opposite-locale equivalents anywhere in the response HTML — 8/8 URLs PASS, zero leakage. CTA button text also confirmed locale-correct on spot-check (e.g. `/servicios/seo-technical-audit` renders "Pedir una auditoría" / "Contáctame"; `/en/services/seo-technical-audit` renders "Request an audit" / "Contact me").

**Note on the out-of-band nav/link fix** (`src/lib/service-slugs.ts`, SiteHeader/Content-block/LocaleSwitcher touched between 25-01's baseline and 25-03's seed): no delta was observed on H1, JSON-LD, or scope-card/framing parity attributable to that fix — all checks above are clean PASS with byte-identical H1 text and deep-equal BreadcrumbList structure, so the nav fix had zero measurable impact on these three axes.

(Task 2 Lighthouse findings appended below.)
