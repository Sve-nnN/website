---
phase: 09-hero-resultados-kpi-tipografia
plan: 03
subsystem: ui
tags: [tailwind, typography, prose, lexical, blockquote]

requires:
  - phase: 07-design-token-foundation
    provides: locked type scale (text-heading/text-display) and --primary accent token reused here unchanged
provides:
  - Prose.tsx editorial blockquote treatment (Fraunces, primary-accent left rule, indent)
  - Strengthened h1/h2/h3 hierarchy in Prose.tsx (tracking-tight, h3 opacity-90 recession)
  - Blog article header (h1 + byline row) aligned to the same rhythm
affects: [11-cross-cutting-verification]

tech-stack:
  added: []
  patterns:
    - "Weight/opacity-based sibling-size differentiation: when two heading levels share the same locked type-scale size (h2/h3 both text-heading), differentiate via opacity recession rather than inventing a new size token"

key-files:
  modified:
    - src/components/Prose.tsx
    - "src/app/(frontend)/[locale]/blog/[slug]/page.tsx"

key-decisions:
  - "h2/h3 share text-heading (no 5th size token available); h3 differentiates from h2 purely via opacity-90 recession plus the shared tracking-tight, avoiding any new size utility"

patterns-established:
  - "[&_blockquote] rule in Prose.tsx is now the sitewide editorial quote treatment for all rich text (Posts, CaseStudies clientContext/conclusion) — no converter changes needed, purely CSS"

requirements-completed: [UI-08]

duration: 10min
completed: 2026-07-10
---

# Phase 9 Plan 03: Long-Form Typography (Prose.tsx) Summary

**Added an editorial Fraunces blockquote treatment with a primary-accent left rule to Prose.tsx, strengthened h1/h2/h3 tracking and h2/h3 differentiation via opacity, and aligned the blog article header rhythm to match — zero heading tag/semantics changes (1 h1 confirmed, no h2/h3 outside rich text).**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- `Prose.tsx` gains a `[&_blockquote]` rule: `font-display text-heading border-l-4 border-primary pl-6 my-8 text-foreground/80` — Fraunces at heading size, ember-accent left rule, generous indent/margin, slightly muted ink
- `h1`/`h2`/`h3` rules in `Prose.tsx` gain `tracking-tight`; `h3` additionally gains `opacity-90` to recede relative to `h2` since both share the locked `text-heading` size token
- Blog article `<h1>` gains `tracking-tight` to match; byline/meta row spacing increased `mt-4` → `mt-6`, mirroring the Hero subtitle rhythm from 09-01

## Task Commits

1. **Task 1: Add editorial blockquote treatment and strengthen heading rhythm in Prose.tsx** - `e7a3d4e` (feat)
2. **Task 2: Align blog article header rhythm with Prose and verify heading semantics unchanged** - `632a930` (feat)

**Plan metadata:** (pending — final docs commit)

## Files Created/Modified
- `src/components/Prose.tsx` - blockquote rule added, h1/h2/h3 tracking-tight, h3 opacity-90
- `src/app/(frontend)/[locale]/blog/[slug]/page.tsx` - h1 tracking-tight, byline row mt-6

## Decisions Made
- Blockquote styling uses only existing Fraunces/`--primary`/spacing tokens — no new color, no new size, no converter/serializer change (Lexical's default `<blockquote>` output is unchanged; only the Tailwind arbitrary-descendant-selector rule in Prose.tsx targets it).
- h2/h3 differentiation solved via `opacity-90` recession rather than a new size, respecting the locked 4-size type scale budget.

## Deviations from Plan

None - plan executed exactly as written.

## Heading Semantics Verification

`grep -oE '<h[1-3]' "src/app/(frontend)/[locale]/blog/[slug]/page.tsx" | sort | uniq -c`

Before and after this plan's diff: exactly `1 <h1`, zero `<h2`/`<h3` outside rich text content (those live inside `<RichTextRenderer data={doc.content} />`, unaffected by this plan's page-level edits). Only className edits were made on the existing `<h1>`.

## Issues Encountered
None.

## Next Phase Readiness
- `Prose.tsx`'s blockquote/heading treatment propagates automatically to all Posts and CaseStudies rich text (`content`/`clientContext`/`conclusion`) with no further page-level changes needed.
- No blockers for Phase 11 cross-cutting verification.

---
*Phase: 09-hero-resultados-kpi-tipografia*
*Completed: 2026-07-10*

## Self-Check: PASSED
