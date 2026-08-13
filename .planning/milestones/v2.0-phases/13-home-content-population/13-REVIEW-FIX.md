---
phase: 13-home-content-population
fixed_at: 2026-07-11T23:35:54Z
review_path: .planning/phases/13-home-content-population/13-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 6
skipped: 1
status: partial
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-07-11T23:35:54Z
**Source review:** .planning/phases/13-home-content-population/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (1 critical, 3 warnings, 3 info — full scope requested, including Info)
- Fixed: 6
- Skipped: 1 (no code change needed — verified correct as-is)

## Fixed Issues

### CR-01: IconPickerField offers 24 icons but the frontend only renders 4 — silent wrong-icon fallback for 20 of them

**Files modified:** `src/blocks/AboutSection/Component.tsx`
**Commit:** ba77c0d
**Applied fix:** Replaced the hand-listed 4-icon `iconMap` (and its unsafe `as keyof typeof iconMap` cast) with `Object.fromEntries(ICON_OPTIONS.map((o) => [o.value, o.Icon]))`, derived directly from the same `ICON_OPTIONS` array the admin `IconPickerField` uses. All 24 icons offered in the admin picker now render correctly on the frontend; `Code` remains the fallback for any unrecognized value. Verified with a full-project `tsc --noEmit` pass (zero errors).

### WR-01: `ctaLink` is a free-text field with no scheme/format validation, rendered directly into an `href`

**Files modified:** `src/blocks/AboutSection/config.ts`
**Commit:** 1f04b55
**Applied fix:** Added a `validateCtaLink` function (typed with Payload's `Validate`) restricting non-empty values to `#`, `/`, `http://`, `https://`, or `mailto:` prefixes, wired as `validate` on the `ctaLink` field. Rejects `javascript:`-scheme and other unsafe values at the admin/API layer.

### WR-02: `IconPickerField` trigger button has no accessible label/state wiring

**Files modified:** `src/fields/IconPicker/Component.tsx`
**Commit:** abb28f6
**Applied fix:** Added `id`/`htmlFor` pairing between the trigger `<button>` and the preceding `FieldLabel`, plus `aria-haspopup="dialog"` and `aria-expanded` driven live from `useModal()`'s `isModalOpen(modalSlug)` (rather than untracked local state, since the modal library exposes this directly).

### WR-03: `RenderBlocks` spreads full `sharedProps` (including `onSubmit`, `contactEmail`) onto every block, not just the ones that need them

**Files modified:** `src/blocks/RenderBlocks.tsx`, `src/app/(frontend)/[locale]/page.tsx`, `src/app/(frontend)/[locale]/contact/page.tsx`
**Commit:** 6934558
**Applied fix:** Added a new `blockProps` prop to `RenderBlocks`, keyed by `blockType`, merged only into the matching block's renderer props. Updated both the Home page and the Contact page to pass `onSubmit`/`contactEmail`/`locale`/`sent` via `blockProps={{ contactFormBlock: {...} }}` instead of the page-wide `sharedProps` spread. The generic `sharedProps` mechanism (still used by the blog listing's `activeCategory` forwarding) was left untouched since that finding was specific to the contact-form-only props' blast radius, not the generic-forwarding pattern itself.

### IN-01: Seed script's `contactCopy` typed as `Record<string, unknown>` loses type safety for a known shape

**Files modified:** `scripts/seed-phase13-home-content.ts`
**Commit:** 2a7ad76
**Applied fix:** Imported the generated `ContactFormBlock` type from `payload-types.ts` and retyped `contactCopy` as `Record<Locale, Omit<ContactFormBlock, 'id' | 'blockName'>>`. Verified with `tsc --noEmit` that the existing ES/EN literal objects satisfy the real shape with zero errors (confirming no latent field-name typos).

### IN-02: `IconPickerField` search only matches icon `label`, not `value`

**Files modified:** `src/fields/IconPicker/Component.tsx`
**Commit:** 1dc066b
**Applied fix:** Extended the search filter to also match `opt.value.toLowerCase()` in addition to `opt.label.toLowerCase()`, so searching by the underlying value string (e.g. `trendingUp`) works even if a label's wording diverges from its value in the future.

## Skipped Issues

### IN-03: `verify-phase13-home-content.mjs` hardcodes `BASE_URL` default to `localhost:3000` while CLAUDE.md references `localhost:3001`

**File:** `scripts/verify-phase13-home-content.mjs:12`
**Reason:** Verified this is not a bug — no fix applied. `package.json`'s `dev` script (`"next dev"`) has no `-p` flag, so this project's own dev server defaults to port 3000, matching `BASE_URL`'s default. Cross-checked all 8 verify scripts under `scripts/` (`smoke-check-phase8.mjs`, `verify-hero-mobile.mjs`, `verify-es-layout-final.mjs`, `verify-mobile-viewport.mjs`, `verify-phase12-author-eeat.mjs`, `verify-phase10-cards-eeat.mjs`, `verify-phase11-real-content-mobile.mjs`, and this one) — every one of them defaults to `localhost:3000`, confirming this is the established codebase convention for this project's own dev server, not an inconsistency. CLAUDE.md's `localhost:3001` reference is to the *old* JuanPortfolio Next.js site being migrated from ("Mismo contenido y mismas páginas que el sitio actual en localhost:3001"), a separate running process, not this rebuild's own dev server. Changing the default to 3001 would have made this script diverge from the other 7 and pointed it at the wrong (old) site by default.
**Original issue:** CLAUDE.md's project description references `localhost:3001` as the reference/dev context for this rebuild. The verification script defaults to `localhost:3000`, overridable via `BASE_URL` env var — flagged only as a note in case the default silently targets the wrong port in a future run.

---

_Fixed: 2026-07-11T23:35:54Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
