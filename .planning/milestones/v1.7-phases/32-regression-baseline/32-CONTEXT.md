# Phase 32: Regression Baseline - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Capture a measurable snapshot (Lighthouse mobile + H1/JSON-LD) of the site's current state, before any component in this milestone (v1.7) is touched. Same "baseline before, gate after" pattern as v1.5 Phase 25 and v1.6 Phase 28. Purely measurement — no code or content changes in this phase.

</domain>

<decisions>
### Claude's Discretion

Infrastructure-only phase — measurement/tooling, no user-facing behavior, no grey areas to discuss. All choices (route set, script reuse, doc format) follow the established Phase 25/28 pattern directly from the codebase.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/lighthouse-mobile.mjs` — mobile Lighthouse runner against a local production build, takes `--base-url`/`--out`/`--routes-only`. Reused verbatim (Phase 11/25/28 precedent).
- Phase 28's H1/JSON-LD diff pattern (inline `node -e` against a running server) — reused verbatim.

### Established Patterns
- Baseline doc committed as `{phase}-REGRESSION-BASELINE.md` (or `-DIFF.md` for gates), same shape as `28-REGRESSION-DIFF.md`.
- Production build (`npx next build` + `PORT=X npx next start`, never `next dev`, never `npm run build` per project CLAUDE.md) — kill PID after capture, verify via `lsof`/`ps aux`.
- `caffeinate -u` during Lighthouse runs (Mac display-sleep gotcha discovered in Phase 28).

### Integration Points
- Route set must explicitly include `/seo-tecnico-madrid` and `/seo-tecnico-lima` (or their locale-prefixed forms) since Phase 34 will structurally modify them.

</code_context>

<specifics>
## Specific Ideas

Route set for this baseline: `/en`, `/es`, `/en/blog`, `/en/case-studies`, `/en/seo-tecnico-madrid`, `/en/seo-tecnico-lima` (mirrors Phase 28's 6-route set, swapping in the two Local Landing routes that Phase 34 will change).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
