---
phase: 25-service-page-visual-polish
reviewed: 2026-07-12T00:00:00Z
depth: deep
files_reviewed: 13
files_reviewed_list:
  - src/blocks/ServiceScopeCard/config.ts
  - src/blocks/ServiceScopeCard/Component.tsx
  - src/blocks/RelatedCaseStudyBlock/config.ts
  - src/blocks/RelatedCaseStudyBlock/Component.tsx
  - src/components/CaseStudyCard.tsx
  - src/app/globals.css
  - tailwind.config.ts
  - scripts/seed-phase25-data.ts
  - scripts/seed-phase25-service-landings.ts
  - src/collections/Pages/index.ts
  - src/blocks/RenderBlocks.tsx
  - src/migrations/20260713_022605.ts
  - src/migrations/index.ts
findings:
  critical: 2
  warning: 3
  info: 2
  total: 7
status: issues_found
post_review_note: "Both CRITICAL findings (client name missing due to depth:1, testimonials title locale-clobber) fixed in commit 12f02f3 — depth bumped to 2 on RelatedCaseStudyBlock's own queries; TestimonialsCarousel.title cleared with explicit null (omitting the key alone did not clear a non-localized field's stale value) and the component now falls back to a real getTranslations() call. Re-verified live: all 10 Servicios URLs + Home 200, testimonials heading correct per locale. The 3 WARNING and 2 INFO findings were left as documented non-blocking debt per the review's own severity assessment."
---

# Phase 25: Code Review Report

**Reviewed:** 2026-07-12
**Depth:** deep
**Files Reviewed:** 13 (plus cross-referenced: `src/lib/services-data.ts`, `src/blocks/TestimonialsCarousel/{config.ts,Component.tsx}`, `src/collections/CaseStudies/index.ts`, `src/payload-types.ts`, `scripts/seed-home-page.ts`)
**Status:** issues_found

## Summary

Reviewed the full commit range `3926ed2~1..501f8fe` (Plans 25-02 through 25-04 plus the gap-closure fix commit). The two new Payload blocks are cleanly built, additively registered, and the migration is genuinely additive (8 `CREATE TABLE`, zero `ALTER`/`DROP` on existing tables). The gap-closure commit's `--primary-text` token is correctly scoped to only the two elements it was introduced for (`ServiceScopeCard` timeline value, `CaseStudyCard` hero metric via `RelatedCaseStudyBlock`) — it does not leak onto any pre-existing `text-primary` usage elsewhere in the codebase.

However, two BLOCKER-level defects were found by tracing the actual runtime data flow rather than trusting the summaries' claims:

1. `RelatedCaseStudyBlockComponent`'s "already-resolved relationship" branch silently drops the case study's client name on every one of the 8 service landing pages, because the parent page query's `depth: 1` does not populate a second level of nesting (`caseStudy.client`), but the component's fast-path branch assumes it does.
2. The Phase 25 seed script (copying a pre-existing pattern from `seed-home-page.ts`) writes locale-specific text into `TestimonialsCarousel.title`, a field that is **not** `localized: true` in its Payload config — the two sequential per-locale `payload.update` calls silently overwrite each other, so both locales end up displaying whichever locale was written last ("Testimonials" clobbers "Testimonios").

Neither defect was caught by the phase's own regression gate (25-01/25-04), because that gate only diffs H1 text, `BreadcrumbList` JSON-LD, and the `serviceScopeCard`/`relatedCaseStudyBlock` translation-namespace strings — it does not assert on the client-name field or the `testimonialsCarousel` section heading text.

## Structural Findings (fallow)

None provided for this review.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: RelatedCaseStudyBlock silently drops the client name on every service landing (insufficient population depth)

**File:** `src/blocks/RelatedCaseStudyBlock/Component.tsx:17-18`
**Issue:**
The component has two paths to resolve `caseStudy`:
- If the parent page query already populated the relationship (`typeof caseStudy === 'object'`), it's used as-is (line 17-18).
- Otherwise it does its own `findByID`/`find` call with `depth: 1` (lines 23-29, 33-40).

The parent page fetch (`src/lib/services-data.ts:getServicePage`) queries the `pages` collection with `depth: 1`. That single level of depth is consumed resolving `content.layout[].caseStudy` (a page-level relationship field, even though it's nested inside a block) from an ID into a `CaseStudy` object — it does **not** cascade a second level to also resolve `CaseStudy.client` (a relationship of the *resolved* case-study doc). So in the normal/common code path — which is every render on the live service pages, since the seed script always writes a concrete `caseStudyId` — `caseStudy` arrives as an object whose `.client` field is still a bare numeric ID, not a populated `{ name, ... }` object.

`CaseStudyCard` (reused verbatim per spec) does:
```tsx
const client = typeof caseStudy.client === 'object' ? caseStudy.client : null
```
Since `client` is a number in this path, `client` resolves to `null` and the "client name" line (`{client && <p>...}`) never renders — contradicting both the UI-SPEC ("client name, title, sector, `heroMetric`" are the four fields `CaseStudyCard` is expected to show) and the 25-02 summary's own description of the component.

Contrast with `FeaturedCaseStudiesBlock/Component.tsx:17`, which issues its own fresh `depth: 1` query rooted at `case-studies` — that correctly populates `client`, because there the root of the query *is* the case-study doc, so depth 1 reaches `client` directly. `RelatedCaseStudyBlockComponent`'s object branch has no equivalent fresh query, so it inherits the shallower depth from the page-level fetch.

This was not caught by the 25-04 regression diff (H1/JSON-LD/ES-EN string parity only) or by the phase's manual curl checks (which asserted the block/component render count, not the presence of every field it renders).

**Fix:**
```tsx
if (caseStudy && typeof caseStudy === 'object') {
  // caseStudy.client may still be an un-populated id if the parent page
  // query's depth didn't cascade a second level — re-resolve by id when
  // that's the case, same discipline as the id-only branch below.
  resolved = typeof caseStudy.client === 'object' || !caseStudy.client
    ? caseStudy
    : await payload.findByID({
        collection: 'case-studies',
        id: caseStudy.id,
        depth: 1,
        locale,
        overrideAccess: false,
      })
} else if (caseStudy) {
  resolved = await payload.findByID({
    collection: 'case-studies',
    id: caseStudy,
    depth: 1,
    locale,
    overrideAccess: false,
  })
}
```
(Or simplest/most robust: always call `findByID`/`find` with `depth: 1` rooted at `case-studies`, ignoring whatever the parent already populated, since the extra query is cheap and guarantees consistent depth regardless of the caller's query shape.)

### CR-02: `TestimonialsCarousel.title` is not localized — sequential per-locale seed writes clobber each other, showing the wrong language

**File:** `scripts/seed-phase25-service-landings.ts:136-139, 215-219, 324-341`
**Issue:**
`TESTIMONIALS_TITLE` supplies `'Testimonios'` for `es` and `'Testimonials'` for `en` (lines 136-139), and `buildLayout` writes that per-locale string into the `testimonialsCarousel` block's `title` field (line 216). But `src/blocks/TestimonialsCarousel/config.ts`'s `title` field has **no** `localized: true` (confirmed against `payload-types.ts:752`, where `TestimonialsCarouselBlock.title` is typed as a single `string | null`, not a `{ es, en }` shape like the genuinely-localized fields on the same page).

`restructureServicePage`'s loop (lines 324-341) writes `locale: 'es'` first, then `locale: 'en'` second, in the same run, into the same document. Since the field isn't localized, both writes target the same underlying DB column — there is no per-locale storage to keep them apart. The `en` write (which runs second, always) overwrites whatever the `es` write set. End state after seeding: **all 8 URLs** (both locales) show `"Testimonials"` as the section heading, including the 4 Spanish landings that should show `"Testimonios"`.

This is a copy-forward of a pre-existing bug already present in `scripts/seed-home-page.ts` (which does the identical `LOCALES` loop with `'Testimonios'`/`'Testimonials'` into the same non-localized field) — so Home's testimonials heading likely has the same defect today. Phase 25 propagates it to 4 more pages / 8 more URLs, and none of the 25-01/25-04 regression tooling checks this string (it only diffs H1, `BreadcrumbList` JSON-LD, and the two brand-new namespaces), so it shipped undetected.

**Fix:** Either localize the field:
```ts
// src/blocks/TestimonialsCarousel/config.ts
{
  name: 'title',
  type: 'text',
  label: 'Título',
  localized: true,       // add this
  required: false,
  defaultValue: 'Testimonios',
},
```
(requires a schema migration — additive `ALTER COLUMN`/locale-table change, or a new `_locales` shadow table depending on how Payload models it — read the generated migration before applying), or, if localizing is out of scope for this fix, drop the per-locale title override in the seed script and reuse the field's single `defaultValue` (leave `title` unset in `buildLayout` so it doesn't get seeded with conflicting per-locale strings at all).

## Warnings

### WR-01: `--primary`-as-text contrast defect fixed only in the 2 touched components, not the pre-existing occurrences elsewhere

**File:** `src/app/globals.css:21-31`, `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx:118,130,168,199`
**Issue:** The gap-closure fix correctly diagnosed that `--primary` (`#F7581E`) fails WCAG AA (3.15:1) when used as literal text color on light surfaces, and introduced `--primary-text` (4.61:1) — but only applied it to `ServiceScopeCard`'s timeline value and `CaseStudyCard`'s hero metric (the 2 elements reachable from the 8 audited service-page URLs). The identical `text-primary` pattern at `text-display font-display font-semibold text-primary` / `font-heading text-heading font-semibold text-primary` is still used unmodified on the case-study detail page (`heroMetric`, results before/after values, numbered list markers) and in `src/blocks/ResultsSection/Component.tsx:24`, `src/blocks/AboutSection/Component.tsx`, and others — all of which have the same contrast failure but weren't part of this phase's audited routes, so they remain unfixed. Not a regression introduced by Phase 25, but the phase established the correct token and left the rest of the codebase inconsistent (same bug class, silently unaddressed) rather than filing a follow-up.
**Fix:** File a follow-up phase/task to sweep all `text-primary` usages that render as literal text-on-light-background (not button fills) and migrate them to `text-primary-text`, or note the gap explicitly in ROADMAP/STATE so it isn't lost.

### WR-02: `reapplyIds`'s "refetch inside the loop" pattern silently depends on the config's default locale being `'es'`

**File:** `scripts/seed-phase25-service-landings.ts:324-326`
**Issue:** `payload.findByID({ collection: 'pages', id: docId, depth: 0 })` is called with no `locale` argument, relying on Payload defaulting to `defaultLocale` (`'es'`, per `payload.config.ts:74`). The loop's correctness (using the just-written `'es'` layout as the reference for the `'en'` write) depends entirely on this implicit default matching the first entry of `LOCALES` (`['es', 'en'] as const`, line 53). If either the config's `defaultLocale` or the `LOCALES` array order ever changes independently (a documented drift risk this project already tracks for the *routing* defaultLocale in `payload.config.ts:67-68`), this script would silently start reusing the wrong locale's layout as the id-reuse reference, without erroring — the mismatch would show up only as unexpected `reapplyIds: blockType mismatch` warnings or, worse, id reuse against a stale English layout.
**Fix:** Pass `locale: 'es'` explicitly in the `findByID` call (or derive it as `LOCALES[0]`) instead of relying on the implicit config default, so the coupling is visible in the code rather than an implicit cross-file assumption.

### WR-03: `ServiceScopeCard`/`RelatedCaseStudyBlock` textarea fields render raw newlines as literal whitespace, not paragraph breaks

**File:** `src/blocks/ServiceScopeCard/Component.tsx:25,30`, `src/blocks/RelatedCaseStudyBlock/Component.tsx:54`
**Issue:** `scope`, `outcome`, and `framingText` are `textarea` fields (multi-line plain text) rendered directly inside a single `<p>{value}</p>`. If an editor enters multiple lines/paragraphs in the admin UI (which a `textarea` visually invites), those newlines collapse to a single space in HTML output — the field silently loses its paragraph structure. Today's seed data happens to be single-paragraph strings, so this doesn't manifest yet, but it's a latent trap for the next content edit made directly in the admin panel (not through the seed script).
**Fix:** Either use `white-space: pre-line` on these `<p>` elements (cheapest fix, preserves newlines without needing a rich-text migration), or document in the field's `admin.description` that multi-paragraph input is not supported and will be visually collapsed.

## Info

### IN-01: `RelatedCaseStudyBlockComponent` and `ServiceScopeCardComponent` each instantiate a fresh Payload client per render

**File:** `src/blocks/RelatedCaseStudyBlock/Component.tsx:12`
**Issue:** `await getPayload({ config })` is called on every render of every block instance — consistent with the existing codebase pattern (`TestimonialsCarouselComponent`, `FeaturedCaseStudiesBlock`, etc. do the same), so not a new problem introduced by this phase, and Payload internally memoizes/caches `getPayload` calls against the same config object, so this is not a true reconnect per call. Flagged for awareness only, not actionable within this phase's scope (performance is explicitly out of scope for this review per the v1 charter).
**Fix:** None required; noting for completeness only.

### IN-02: `scripts/seed-phase25-service-landings.ts` throws (non-zero exit) if the one hardcoded case study slug is ever renamed/removed

**File:** `scripts/seed-phase25-service-landings.ts:56, 354-358`
**Issue:** `CASE_STUDY_SLUG = 'migracion-ecommerce-nextjs-seo-tecnico'` is hardcoded and the script `throw`s if it's not found, refusing to seed anything. This is a deliberate, documented safety choice ("Refusing to seed a broken relationship") and is the right call for a one-time seed script — flagged only as a maintenance note: if this script needs to be re-run after that case study is ever renamed, it will need a matching update, and there's no fallback to "use whatever case study exists" at seed time (unlike the runtime component, which does have a most-recent fallback).
**Fix:** None required — informational only; the hard failure is intentional and appropriately loud.

---

_Reviewed: 2026-07-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
