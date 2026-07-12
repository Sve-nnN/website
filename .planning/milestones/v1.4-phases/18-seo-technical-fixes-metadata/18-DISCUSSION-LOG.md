# Phase 18: SEO Technical Fixes + Metadata - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-12
**Phase:** 18-SEO Technical Fixes + Metadata
**Areas discussed:** /contact H1 placement, Author page H1 placement, Author page metadata wiring

> Run autonomously (non-interactive background job, per explicit instruction from the
> orchestrating agent — no human available to answer AskUserQuestion prompts). Each area
> below was resolved by reading the actual code (via a codebase-exploration subagent) and
> picking the lowest-risk option consistent with the phase's explicit "no copy/layout
> changes beyond the strict minimum" boundary. Documented here for Juan's later review.

---

## /contact H1 placement

| Option | Description | Selected |
|--------|-------------|----------|
| Promote `ContactFormBlockComponent`'s existing `<h2>` to `<h1>` | Simplest edit, but the block is reused as a CTA sidebar elsewhere (commit `fb5d3d5`) — risks duplicate H1s on other pages | |
| Add a dedicated `sr-only` `<h1>` in `contact/page.tsx` | Zero visible layout change, satisfies the semantic requirement, block stays untouched and safe to reuse | ✓ |
| Add a visible `<h1>` above the existing H2 | Satisfies requirement but introduces visual redundancy ("Contact" + "Hablemos") not asked for | |

**Selected:** sr-only `<h1>` in `contact/page.tsx`, sourced from `doc.meta?.title ?? doc.title`.
**Notes:** Chosen because it's the only option with zero blast radius on the reused block and zero visual change, matching the phase's explicit low-risk framing in ROADMAP.md.

---

## Author page H1 placement

| Option | Description | Selected |
|--------|-------------|----------|
| Make `AuthorCard`'s name always render as `<h1>` | Simplest edit, but `AuthorCard` is reused in blog/case-study bylines where a post/case-study title is already the page H1 — would create duplicate H1s | |
| Add an `asPageHeading` prop to `AuthorCard`, default `false` | Only `/authors/[slug]/page.tsx` opts in; byline usages unaffected | ✓ |
| Add a separate, new component just for the page-level author name | More code duplication for no real benefit over a prop | |

**Selected:** `asPageHeading` prop, default `false`, passed `true` only from `/authors/[slug]/page.tsx`.
**Notes:** AuthorCard is reused in exactly 3 places (`authors/[slug]`, `case-studies/[slug]` byline, `blog/[slug]` byline) — confirmed via grep before deciding.

---

## Author page metadata wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Add `'authors'` to `seoPlugin({ collections: [...] })` + extend existing `generateTitle`/`generateDescription` callbacks | Matches the exact pattern already proven for pages/posts/case-studies | ✓ |
| Build a bespoke SEO field group manually on the Authors collection, outside the plugin | Reinvents what the plugin already does; inconsistent with rest of the codebase | |

**Selected:** Extend `seoPlugin` config, mirror the `case-studies` `generateMetadata` pattern in `authors/[slug]/page.tsx`.
**Notes:** Requires a new committed Postgres migration (`payload migrate:create`) since the plugin injects new `meta` fields into the Authors table — `push:false` is a hard project constraint (root `CLAUDE.md`).

---

## Claude's Discretion

- Exact DOM structure combining `<h1>` + `<Link>` in `AuthorCard.tsx`.
- Exact wording/truncation of the Authors `generateDescription` fallback, as long as it matches or improves on today's manual fallback (`doc.jobTitle ?? ''`).

## Deferred Ideas

None — discussion stayed within phase scope (service pages, GEO/IA SEO, geo-pages, and Home linking are Phases 19-21, not this phase).
