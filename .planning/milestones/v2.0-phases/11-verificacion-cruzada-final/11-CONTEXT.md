# Phase 11: Verificación Cruzada Final - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Cross-cutting verification phase — final sweep across the whole milestone's accumulated diff (Phases 7-10), not new visual work.

<domain>
## Phase Boundary

El diff acumulado de todo el milestone se verifica de punta a punta contra los riesgos identificados en research — contraste, layout en español, contenido hardcodeado y performance — antes de dar por cerrado el pulido visual y retomar Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Lighthouse baseline — adjusted for reality
- ROADMAP success criterion #4 says "sin regresión respecto al baseline de producción" — but there IS no production yet (Phase 6, deploy, is paused and hasn't happened). This is a known gap flagged explicitly in `.planning/research/SUMMARY.md`'s "Gaps to Address" section ("Hostinger/production Lighthouse baseline isn't captured in this research").
- Adjusted interpretation: capture a LOCAL baseline (production build via `npm run build && npm run start`, not `next dev`, since dev-mode Lighthouse scores are not representative) at the start of Phase 7 (before any milestone changes) if not already captured, OR reconstruct an equivalent pre-milestone baseline by checking out the commit immediately before Phase 7 started (`0812dc4`'s parent, or the last Phase-5-era commit) and running Lighthouse there, then compare against the current HEAD. This is the best available proxy for "production baseline" until Phase 6 actually deploys.
- Document this adjustment explicitly in the phase's verification report — do not silently redefine the success criterion without a paper trail.

### Scope
- This phase touches NO component code beyond what's needed to fix any genuine regression found. It is fundamentally a verification/audit phase, not a build phase — plans should be structured around running checks, not adding features.
- If a genuine regression IS found (contrast failure, hardcoded content, broken ES layout, CWV regression), fixing it stays in scope for this phase (per the phase's own goal: "antes de dar por cerrado el pulido visual").

### Verification scope
- WCAG contrast: re-run across BOTH themes (light/dark) on the final accumulated state — not just Phase 7's isolated dark-token check.
- ES layout: verify against actual longest real titles across ALL touched page types (home, blog list/detail, case-studies list/detail, authors list/detail) — Phase 10 already covered blog cards; this phase should cover any remaining page types not yet spot-checked with real long ES content.
- Hardcoded-content grep: final sweep across every file touched by commits in the Phase 7-10 range, plus the `config.ts`/`payload-types.ts` zero-diff check across the FULL milestone range (not just per-phase).
- Mobile Lighthouse: Performance/Accessibility/Best-Practices/SEO scores, run against a production build.

### Claude's Discretion
- Exact tooling for Lighthouse (CLI `lighthouse` package, Chrome DevTools, or PageSpeed Insights API against a temporarily-exposed local build) — whichever is most practical to run headlessly in this environment.

</decisions>

<code_context>
## Existing Code Insights

- Phases 7-10 commits: `0812dc4`(context)..`2cf4573`(latest) — the full milestone diff range to audit is roughly from Phase 5's close (commit `2e22e9b`, "Phase 5 progress update") through current HEAD.
- Each individual phase (7, 8, 9, 10) already ran its own partial verification (WCAG on Phase 7's dark tokens only, heading-semantics checks in 9/10, config.ts/payload-types.ts zero-diff checks per-phase) — this phase's job is to re-verify against the FULL accumulated state, not repeat identical narrow checks.
- Known content gaps already flagged and accepted as non-blocking by Juan: real author (id=1) still has no `years_experience`/`credentials`/`socialLinks` populated (Phase 5/10 follow-up); 0 real case studies in production (Phase 4/8/10 finding).

</code_context>

<specifics>
## Specific Ideas

None beyond the locked decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — this is the milestone's final phase.

</deferred>
