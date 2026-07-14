# Phase 36: Regression Gate - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Re-run the exact same measurement captured in Phase 32 (Lighthouse mobile + H1/JSON-LD, same 6 routes) after Phase 33-35's real changes, diff programmatically against the Phase 32 baseline, and produce an explicit PASS/FAIL verdict. Milestone v1.7's closing gate. Purely measurement/diffing — gap closure only if a real regression is confirmed.

</domain>

<decisions>
### Claude's Discretion

Infrastructure-only phase — measurement/diffing, no user-facing behavior, no grey areas to discuss. All choices (route set, script reuse, doc format, band thresholds) follow the Phase 28/32 pattern directly.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/lighthouse-mobile.mjs` — reused verbatim, same 6-route set as Phase 32.
- Phase 32's H1/JSON-LD inline extraction pattern — reused verbatim.
- Phase 28's `28-REGRESSION-DIFF.md` — tone/rigor/threshold pattern followed exactly, including the gap-closure sub-pattern if a real regression surfaces.

### Established Patterns
- Production build (`npx next build` + `PORT=X npx next start`, never `next dev`) — kill PID after capture, verify via `lsof`/`ps aux`.
- `caffeinate -u` during Lighthouse runs (Mac display-sleep gotcha).
- Threshold: flag if `performance` drops more than 5 points, or any CWV metric (LCP/CLS/TBT) crosses into a worse Lighthouse lab band than its Phase 32 baseline value.
- If a flagged delta looks anomalous, reproduce with 2-3 clean re-runs before concluding real vs. noise (Phase 28 precedent).

### Integration Points
- Baseline reference: `.planning/phases/32-regression-baseline/lh-phase32-baseline.json` and `32-baseline-content.json`.
- Known content changes since baseline: Phase 34 added real content (LocalProofSection + local-landing Hero variant) to Madrid/Lima routes — some LCP shift there is expected and should be explained, not hidden, if it crosses a band. Phase 35 changed 6 files (badge-variants.ts, button-variants.ts, card.tsx, AboutSection, ServiceScopeCard, ContactFormBlock) — none touch Home/Madrid/Lima H1 text.

</code_context>

<specifics>
## Specific Ideas

Same 6 routes as Phase 32: `/`, `/en`, `/seo-tecnico-madrid`, `/en/seo-tecnico-madrid`, `/seo-tecnico-lima`, `/en/seo-tecnico-lima`.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
