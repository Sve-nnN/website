# Phase 9: Hero + Resultados/KPI + Tipografía - Context

**Gathered:** 2026-07-10
**Status:** Ready for planning
**Mode:** Refinement phase — visual direction locked by `05-UI-SPEC.md`, tokens available from Phase 7, primitives refined in Phase 8. This phase applies that foundation to specific high-visibility content blocks.

<domain>
## Phase Boundary

El hero del sitio, la sección de resultados/KPIs de case studies y la jerarquía tipográfica de contenido largo (posts, case studies) transmiten mayor impacto visual y refuerzan el patrón "métrica en el titular" ya decidido en PROJECT.md, manteniendo el copy 100% editable desde Payload.

</domain>

<decisions>
## Implementation Decisions

### Scope discipline (carried from milestone-level discuss)
- No new package dependencies, no motion/animation JS library, no dark-mode toggle.
- Zero diffs in any `src/blocks/*/config.ts` file or `payload-types.ts` — visual-only changes, same hard constraint as Phase 8.
- All copy must remain sourced from Payload fields — no hardcoded strings introduced for "polish" purposes (this is the exact pitfall PITFALLS.md flagged: a well-meaning visual refactor quietly hardcoding a badge/stat/label that should be a Payload field).

### Hero treatment
- Increase visual impact via typography/spacing/hierarchy only — larger/bolder type scale usage, better vertical rhythm, stronger contrast between eyebrow/title/subtitle roles. Do not add new fields or change the Hero block's config.ts.
- If the Hero uses a background image/overlay, contrast on that composited background must be re-verified after the change (ROADMAP success criterion #4) — do not assume Phase 7's flat-background contrast check covers composited/overlay contexts.

### Results/KPI treatment
- The main metric (e.g. "$41K → $76K") must visually dominate the ResultsSection/KPI cards — this is the "metric in the headline" pattern already decided in PROJECT.md as a competitive differentiator (case studies modeled after ariannalupi.com/casos/).
- Reinforce via type scale/weight/color (using existing tokens), not new UI chrome or new dependencies.

### Typography hierarchy for long-form content
- Apply the Inter (UI/body) + Fraunces (display/headlines) role split consistently across post/case-study body content — headings, body copy, blockquotes/citations.
- Must NOT degrade existing heading semantics (h1/h2/h3 hierarchy) — this is an explicit PITFALLS.md warning (markup/SEO regression risk from "just visual" edits). Typography changes should be CSS/utility-class only, never restructuring heading levels.

### Claude's Discretion
- Exact type scale values/weights for the hero and long-form hierarchy — informed by `05-UI-SPEC.md`'s existing 4-size scale and research's typography guidance, no new sizes invented without cause.
- Exact KPI card visual treatment (size, color emphasis, layout) — informed by the ariannalupi.com/casos/ reference pattern already documented in PROJECT.md.

</decisions>

<code_context>
## Existing Code Insights

- Hero block: `src/blocks/Hero/Component.tsx` (or similar — locate exact path/name during planning; there may be multiple hero variants per Phase 5's RESEARCH.md mentioning HighImpact/LowImpact/MediumImpact patterns from the old site, though Phase 5 may have consolidated to fewer).
- `ResultsSection` block: `src/blocks/ResultsSection/Component.tsx` — renders case study KPIs/results comparison.
- Post/case-study detail pages: `src/app/(frontend)/[locale]/blog/[slug]/`, `src/app/(frontend)/[locale]/case-studies/[slug]/` — long-form content rendering, likely via a shared Prose/Content component.
- `05-UI-SPEC.md` — locked Inter+Fraunces role split and 4-size type scale.
- Phase 7 added shadow/motion tokens; Phase 8 refined shadcn primitives to consume them — this phase is content-block-specific, building on both.
- Note from Phase 4: no real post has `heroImage` — the Post Hero uses a deterministic per-slug fallback against a pool of 53 Cloudinary images. Any hero contrast/overlay work must account for this fallback-image scenario, not just an idealized custom image.

</code_context>

<specifics>
## Specific Ideas

None beyond the locked decisions above — informed directly by `05-UI-SPEC.md`, PROJECT.md's case-study model, and `.planning/research/SUMMARY.md`.

</specifics>

<deferred>
## Deferred Ideas

- Motion/animation (KPI count-up, scroll-reveal) — deferred per milestone-level decision; this phase is static visual treatment only.

</deferred>
