---
phase: 22-breadcrumbs-visual-schema
reviewed: 2026-07-12T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/lib/breadcrumbs.ts
  - src/app/(frontend)/[locale]/servicios/page.tsx
  - src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
  - src/app/(frontend)/[locale]/services/page.tsx
  - src/app/(frontend)/[locale]/services/[slug]/page.tsx
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-07-12
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the new `src/lib/breadcrumbs.ts` module and the four Servicios `page.tsx` route files it feeds. The implementation matches the plan closely: `buildTrail()`/`buildBreadcrumbJsonLd()` is a genuinely pure, DB-free single source of truth, both the visual Hero-block `breadcrumbs` prop and the `BreadcrumbList` JSON-LD are derived from the same `trail` value in every file, URL segment conventions (`/servicios` vs `/en/services`) match `sitemap-data.ts` exactly, and no Payload schema/migration changes were introduced (confirmed clean `git status` on `src/migrations/`). No bugs found in the trail-construction logic itself (home/index/landing URLs, 1-indexed `position`, absolute `item` URLs) — traced through all locale/current-slug branches by hand and the output is correct for all 10 target URLs.

The one substantive finding is a pre-existing gap in `src/components/JsonLd.tsx` (not modified by this phase, but newly exercised by 4 new call sites here) whose in-code comment overstates its own safety: `JSON.stringify` does not escape `</script>`, so a `title` containing that literal string would break out of the `<script>` tag. Risk is bounded by the trust boundary (Payload `pages.title` is admin-only, plain-text, required) but the claim in the comment is factually wrong and worth correcting since this phase is the reason the concern was raised in the review brief. Two minor code-quality notes round out the findings; none block shipping.

## Warnings

### WR-01: `JsonLd.tsx`'s security comment is incorrect — `JSON.stringify` does not neutralize `</script>` breakout

**File:** `src/components/JsonLd.tsx:2-5` (unmodified, but newly exercised by all 5 files in this phase via `buildBreadcrumbJsonLd()`)
**Issue:** The comment states "a title containing `</script>` cannot break out of the script block" because `JSON.stringify` is used. This is false — `JSON.stringify('</script>')` produces the literal string `"</script>"` with no escaping of `<` or `/`. When interpolated via `dangerouslySetInnerHTML` into a real `<script type="application/ld+json">` tag, an HTML parser will still terminate the script element early on encountering the raw `</script>` substring, regardless of it being "inside" a JS string per JSON.stringify's output. The remainder of the payload (and anything the attacker appends after the truncation point) is then parsed as raw HTML in the document — a classic JSON-in-`<script>` XSS vector.
  In this phase specifically, `buildTrail()`'s `current.title` (landing page trail label 3) comes straight from the Payload `pages.title` field (`src/collections/Pages/index.ts:49-53`, plain `text`, `required`), which is admin-editable content, not end-user input — so exploitation requires a malicious or compromised CMS editor account, not a public visitor. That materially lowers severity versus a public-input XSS, which is why this is a Warning rather than a Critical, but the trust-boundary table in the plan (T-22-01) inherits this same incorrect justification, so the false sense of safety could mislead a future author who copies this component for a JSON-LD field fed by lower-trust input (e.g. a public comment or contact-form-derived value).
**Fix:** Escape `<` (and ideally `/` and `&`) before injecting:
```typescript
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
```
Also correct the comment to describe what actually protects the output (the escaping above), not `JSON.stringify` alone.

### WR-02: `buildTrail()`/`buildBreadcrumbJsonLd()` have no unit tests

**File:** `src/lib/breadcrumbs.ts` (whole file)
**Issue:** This module is explicitly designed and documented as the "single source of truth" for two independently-rendered surfaces (visual nav + JSON-LD) across 5 pages x 2 locales x 2 trail depths (index vs landing) — a matrix with real edge-case surface (home `'/'` vs `/en`, `es` root special-casing in `absoluteUrl`, 2-item vs 3-item trails). The plan's own verification relies entirely on manual `tsx -e` one-liners and a live curl sweep, both ad hoc and not repeatable in CI. There is no automated regression guard if a future change (e.g. adding a 3rd locale, or renaming `SERVICES_INDEX_SLUG`) silently breaks one of the 10 URL combinations.
**Fix:** Add a small unit test file (`src/lib/breadcrumbs.test.ts` or wherever the project's existing test convention lives) asserting: `buildTrail('es')` → 2 items with `Inicio`/`/`, `Servicios`/`/servicios`; `buildTrail('en')` → 2 items with `Home`/`/en`, `Services`/`/en/services`; `buildTrail('es', {slug,title})` and `buildTrail('en', {slug,title})` → 3 items with correct landing URL; `buildBreadcrumbJsonLd()` → `itemListElement.length === trail.length`, 1-indexed `position`, and `item` starting with `SITE_URL` (no double slash for the home case).

## Info

### IN-01: `servicios/[slug]/page.tsx` and `services/[slug]/page.tsx` (and the two index files) are byte-for-byte duplicates

**File:** `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx`, `src/app/(frontend)/[locale]/services/[slug]/page.tsx` (also true of the two index `page.tsx` files)
**Issue:** All 4 edits were applied identically to two pairs of otherwise-identical files (a pre-existing dual-route pattern from Phase 19, explicitly acknowledged in the plan as intentional since there's no `pathnames` config in next-intl). This phase reinforces the duplication rather than reducing it — any future bug fix or field addition to the trail-wiring logic needs to be applied twice, and nothing in tooling enforces the two pairs stay in sync.
**Fix:** Not required for this phase (matches existing repo convention and the plan explicitly scoped it out), but worth flagging for a future phase: extract the shared `page.tsx` body into one component invoked by both route files (e.g. `renderServicesIndex(locale)` / `renderServiceLanding(locale, slug)` helpers in a shared module), so `servicios/*` and `services/*` become thin locale-routing shims.

### IN-02: Redundant `doc.slug ?? slug` fallback in both `[slug]/page.tsx` files

**File:** `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx:42`, `src/app/(frontend)/[locale]/services/[slug]/page.tsx:42`
**Issue:** `buildTrail(locale as 'es' | 'en', { slug: doc.slug ?? slug, title: doc.title })` — `doc` was fetched via `getServicePage(locale, slug)` with `where: { slug: { equals: slug } }`, so `doc.slug` will always equal the already-validated `slug` route param by construction. The `?? slug` fallback is dead code (it can never be reached with a different value) and slightly obscures that `slug` here is already allowlist-checked by `isServiceSlug()` inside `getServicePage`.
**Fix:** Simplify to `buildTrail(locale as 'es' | 'en', { slug, title: doc.title })` for clarity — `slug` is already the trusted, validated value; no need to prefer a value re-read off the fetched document.

---

_Reviewed: 2026-07-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
