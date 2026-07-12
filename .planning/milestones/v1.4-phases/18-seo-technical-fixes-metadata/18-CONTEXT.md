# Phase 18: SEO Technical Fixes + Metadata - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 2 semantic-heading bugs (missing real `<h1>` on `/contact` and on the Author page)
and 1 metadata gap (Author page not wired into `@payloadcms/plugin-seo`), all found
by the v1.4 competitive SEO audit. No copy or layout changes beyond what the fix
strictly requires. No new pages, no new blocks, no redesign.

</domain>

<decisions>
## Implementation Decisions

### `/contact` H1 (SEO-STRUCT-01)
- **D-01:** Do NOT change `ContactFormBlockComponent`'s existing `<h2>` ("Hablemos"/"Get in
  Touch") — that block is reused as a CTA sidebar elsewhere (see commit `fb5d3d5`), so
  promoting its internal heading to `<h1>` unconditionally risks duplicate H1s on other
  pages that reuse the block.
- **D-02:** Add a dedicated `<h1>` directly in
  `src/app/(frontend)/[locale]/contact/page.tsx`, sourced from `doc.meta?.title ?? doc.title`
  (same value already used for `<title>` in `generateMetadata`), rendered visually hidden
  (`sr-only`, matching existing Tailwind conventions in this codebase) so there is zero
  visible layout change — satisfies "H1 semántico real" without touching design.

### Author page H1 (SEO-STRUCT-02)
- **D-03:** `AuthorCard.tsx` is reused in 3 places: `/authors/[slug]` (page.tsx:176),
  `/case-studies/[slug]` (page.tsx:219, byline), `/blog/[slug]` (page.tsx:145, byline).
  The byline usages sit on pages that already have their own `<h1>` (the post/case-study
  title) — the author name there must stay a non-heading `<Link>`.
- **D-04:** Add an optional prop to `AuthorCard` (e.g. `asPageHeading?: boolean`, default
  `false`). When `true`, render the author name inside an `<h1>` wrapping the existing
  `<Link>` (or replacing the `<Link>` styling with an `<h1>` containing a nested link —
  Claude's discretion on exact DOM shape, as long as there is exactly one real `<h1>`
  containing the author's name and it stays visually identical to today). Only
  `/authors/[slug]/page.tsx` passes `asPageHeading`. Byline call sites (`case-studies`,
  `blog`) get no prop change (default `false`, current behavior preserved).

### Author page metadata (SEO-META-01)
- **D-05:** Add `'authors'` to the `collections` array of `seoPlugin(...)` in
  `src/payload.config.ts` (currently `['pages', 'posts', 'case-studies']`), with
  `tabbedUI: true` inherited from the existing plugin config.
- **D-06:** Extend the existing `generateTitle`/`generateDescription` plugin callbacks (or
  branch inside them) to cover Authors docs: title `${doc.name} | Juan Carlos Angulo}`
  (consistent with the existing pattern for other collections), description falling back
  to `doc.jobTitle ?? ''` (matches today's manual fallback in `generateMetadata`, so
  editors see the same default before they override it in `/admin`).
- **D-07:** Update `src/app/(frontend)/[locale]/authors/[slug]/page.tsx`'s
  `generateMetadata` to read `doc.meta?.title ?? doc.name` / `doc.meta?.description ??
  doc.jobTitle ?? ''`, replacing today's hardcoded `title: doc.name, description:
  doc.jobTitle ?? ''` — mirrors the exact pattern already used in
  `case-studies/[slug]/page.tsx` (`meta?.title ?? doc.title`).
- **D-08:** Adding `meta` fields to the Authors collection via the plugin requires a new
  committed Postgres migration (`payload migrate:create`), following the existing naming
  convention in `src/migrations/` (`YYYYMMDD_HHMMSS_phase18_<description>.ts` +
  matching `.json` snapshot + `index.ts` barrel update). No `push:true`, ever — per
  project-wide constraint (see root `CLAUDE.md`).

### Claude's Discretion
- Exact DOM structure combining `<h1>` + `<Link>` in `AuthorCard` (D-04) — any shape is
  fine as long as there is exactly one real `<h1>` with the author's name, visual output
  unchanged, and the element remains a real navigable link where it already was one.
- Exact wording of the Authors `generateDescription` fallback beyond "must equal today's
  manual fallback" (D-06) — small deviations (e.g. truncating a longer bio) are fine if
  they don't regress below what plugin-seo needs to populate a non-empty description.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §"Phase 18: SEO Technical Fixes + Metadata" — phase goal,
  success criteria, requirements list (SEO-STRUCT-01, SEO-STRUCT-02, SEO-META-01)
- `.planning/REQUIREMENTS.md` §"v1.4 Requirements — SEO Competitivo" — full requirement
  text for SEO-STRUCT-01, SEO-STRUCT-02, SEO-META-01, plus explicitly-out-of-scope
  neighboring items (SEO-SVC-*, geo-pages, Home linking — belong to Phases 19-21)

### Audit source
- `.planning/research/SEO-COMPETITIVE-AUDIT-v1.4.md` — original findings that produced
  this phase (H1 gaps, Author page metadata gap)

### Project-wide constraints
- root `CLAUDE.md` — `push:false` hard constraint (never live-push schema; use
  `payload migrate:create` → commit → `payload migrate`), `@payloadcms/*` lockstep
  versioning

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/AuthorCard.tsx` — existing E-E-A-T card component, needs the
  `asPageHeading` prop addition (D-04); already used in exactly the 3 places listed above.
- `seoPlugin(...)` block in `src/payload.config.ts` (~line 90-98) — existing
  `generateTitle`/`generateDescription` callbacks to extend, not replace.

### Established Patterns
- Metadata pattern already proven on `pages`/`posts`/`case-studies`:
  `generateMetadata` reads `doc.meta?.title ?? doc.<fallback field>` /
  `doc.meta?.description ?? doc.<fallback field> ?? ''` — see
  `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx` lines ~29-47 as the
  canonical example to mirror for Authors.
- Migration pairing convention: every schema change ships a `.ts` migration +
  matching `.json` snapshot in `src/migrations/`, plus an `index.ts` barrel entry.
  Most recent precedent: `20260712_001122_phase14_target_keyword_field.ts`.

### Integration Points
- `src/app/(frontend)/[locale]/contact/page.tsx` — add the `<h1 className="sr-only">`
  here, before `<RenderBlocks>`.
- `src/app/(frontend)/[locale]/authors/[slug]/page.tsx` — pass `asPageHeading` to
  `<AuthorCard author={doc} />` (line ~176) and fix `generateMetadata` (lines ~65-78).
- `src/collections/Authors/index.ts` — currently has an explicit code comment stating
  Authors deliberately has no SEO tab ("per CONTEXT.md" from Phase 1); that comment is
  now stale and should be removed/updated as part of this phase's diff.

</code_context>

<specifics>
## Specific Ideas

No specific visual requirements — this is a technical/metadata fix phase, explicitly
scoped to avoid copy/layout changes beyond the strict minimum for each fix.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Service pages, GEO/IA SEO framing, geo-pages,
and Home linking are explicitly Phases 19-21, not this phase.

### Reviewed Todos (not folded)
None found matching this phase during `todo.match-phase`.

</deferred>

---

*Phase: 18-SEO Technical Fixes + Metadata*
*Context gathered: 2026-07-12*
