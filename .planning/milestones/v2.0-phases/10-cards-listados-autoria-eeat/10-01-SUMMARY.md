---
phase: 10-cards-listados-autoria-eeat
plan: 01
subsystem: ui
tags: [react, tailwind, shadcn, card, e-e-a-t, design-tokens]

requires:
  - phase: 08-shadcn-primitives-chrome
    provides: "Phase 8-refined Card/CardHeader/CardContent primitive with named shadow/duration/ease tokens"
  - phase: 07
    provides: "shadow-sm/md/lg/focus, duration-fast/base/slow, ease-out/ease-standard token vocabulary"
provides:
  - "PostCard.tsx and CaseStudyCard.tsx composing Card/CardContent instead of hand-rolled div classNames"
  - "AuthorCard.tsx composing Card, with headline-stat yearsExperience treatment and accessible socialLinks affordance"
  - "Consistent resting/hover elevation + corner radius across ArchiveBlock, FeaturedPostsBlock, FeaturedCaseStudiesBlock, RelatedPosts"
affects: [10-02, 11-cross-cutting-verification]

tech-stack:
  added: []
  patterns:
    - "Card-grid components nest <Card>/<CardContent> inside the clickable <Link>, never applying border/shadow classes directly to Link"
    - "Metric/stat-style fields (yearsExperience) reuse the KPI metric-dominance treatment from Phase 9 (font-display text-heading font-semibold tracking-tight text-primary)"

key-files:
  created: []
  modified:
    - src/components/PostCard.tsx
    - src/components/CaseStudyCard.tsx
    - src/components/AuthorCard.tsx

key-decisions:
  - "AuthorByline.tsx left untouched — already token-consistent and intentionally chromeless per its own docstring; no Card wrapper added"
  - "socialLinks anchors given the same focus-visible ring/shadow-focus utility classes as button.tsx's cva base string, without importing Button (plain anchors preserved)"

patterns-established:
  - "Card composition pattern: outer <Link className='group block'>, nested <Card>, inner content in <CardContent>, image transitions reuse duration-base/ease-standard"

requirements-completed: [UI-09, UI-10]

duration: 12min
completed: 2026-07-10
---

# Phase 10 Plan 01: Card-grid consistency + AuthorCard E-E-A-T prominence Summary

**PostCard, CaseStudyCard, and AuthorCard now compose the Phase 8-refined `Card`/`CardContent` primitive instead of hand-rolled `rounded-lg border ... hover:shadow-md transition-shadow` divs, giving all four card-grid surfaces (ArchiveBlock, FeaturedPostsBlock, FeaturedCaseStudiesBlock, RelatedPosts) identical elevation/radius, and making AuthorCard's years-of-experience read as a KPI-style headline stat with accessible focus-visible social-link icons.**

## Performance

- **Duration:** 12 min
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- PostCard.tsx and CaseStudyCard.tsx now nest `Card`/`CardContent`, eliminating the hand-rolled duplicate styling that previously diverged from `ui/card.tsx`
- All four blocks that delegate to these two shared components (ArchiveBlock, FeaturedPostsBlock, FeaturedCaseStudiesBlock, RelatedPosts) now inherit consistent resting/hover elevation with zero changes to any block `Component.tsx` or `config.ts`
- AuthorCard.tsx composes `Card` and gives `yearsExperience` a headline-stat treatment (matching Phase 9's KPI metric-dominance pattern), and gives `socialLinks` anchors a token-driven hover + focus-visible ring/shadow-focus affordance
- All pre-existing conditional field guards (`post.excerpt`, `caseStudy.client/sector/heroMetric`, `author.bio/credentials/yearsLabel/socialLinks`) preserved unchanged

## Task Commits

1. **Task 1: Card-grid visual consistency — PostCard and CaseStudyCard compose the Card primitive** - `c4f05bb` (feat)
2. **Task 2: AuthorByline/AuthorCard — E-E-A-T prominence styling** - `90c2e48` (feat)

## Files Created/Modified
- `src/components/PostCard.tsx` - Nests Card/CardContent inside Link; image scale transition now token-driven
- `src/components/CaseStudyCard.tsx` - Nests Card/CardContent inside Link, preserving all conditional guards
- `src/components/AuthorCard.tsx` - Wraps in Card(p-8); yearsLabel gets headline-stat styling; socialLinks get focus-visible + duration-fast hover

## Decisions Made
- AuthorByline.tsx required no changes — it is intentionally chromeless (no Card wrapper) per its own docstring, and its existing `text-label`/`Badge variant="secondary"` classes already matched the token vocabulary used elsewhere. No token mismatch was found during read-through.
- For AuthorCard's socialLinks focus affordance, read `button.tsx`'s `cva()` base string and reused its exact `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus` utility classes on the plain `<a>` tags (no `Button` import, preserving the existing anchor-based markup).

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

All created/modified files found on disk; both task commits (c4f05bb, 90c2e48) found in git log.
