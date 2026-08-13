---
phase: 26-ui-ux-polish-pass-low-risk-components
reviewed: 2026-07-13T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/blocks/CallToAction/Component.tsx
  - src/blocks/FAQ/Component.tsx
  - src/blocks/ClientLogosBlock/Component.tsx
  - src/blocks/TestimonialsCarousel/Component.tsx
  - src/components/SiteHeader.tsx
  - src/components/SiteHeaderChrome.tsx
  - src/components/CMSLink.tsx
  - src/lib/breadcrumbs.ts
  - src/app/(frontend)/[locale]/case-studies/page.tsx
  - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 26: Code Review Report

**Reviewed:** 2026-07-13
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

All four "pure Tailwind/JSX" block fixes (`CallToAction`, `FAQ`, `ClientLogosBlock`, `TestimonialsCarousel`) match the UI-SPEC's exact code contracts byte-for-byte — no deviation found there. The `SiteHeaderChrome` extraction correctly avoids the Phase 16-style hydration-mismatch pattern: `scrolled` initializes to `false` on both server and client, and the real `window.scrollY` read only happens inside `useEffect` (post-hydration), so SSR and first client paint agree. The scroll listener is registered with `{ passive: true }` and correctly removed on unmount. The `buildCaseStudiesTrail()` extension was verified directly against the diff (not just the SUMMARY's claim): `buildTrail()` is now a thin, byte-for-byte-compatible wrapper around the new `buildSectionTrail()`, and all 4 existing Services call sites (`servicios/page.tsx`, `servicios/[slug]/page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx`) were grepped and confirmed unchanged/still calling `buildTrail()` with the original signature. The `CMSLink` `aria-current` addition is a genuinely optional, backward-compatible prop — all 4 existing call sites (`CallToAction`, `Content`, `Hero`, `SiteHeaderChrome`) were checked; only `SiteHeaderChrome` passes it, so no existing caller's rendered output changes.

That said, the review surfaced a real functional gap in the new active-route feature: the color half of the "active route" visual signal (UIPOL-02) never actually renders differently, because `CMSLink`'s own base classes unconditionally apply `text-primary` to every plain (non-`appearance`) link — including all nav items — regardless of hover/active state. `SiteHeaderChrome`'s conditional `active && 'border-primary text-primary'` is therefore a no-op for color (the border half still works). This is not a new bug (the CMSLink base class predates this phase), but this phase built a new, currently-non-functional feature on top of it without noticing. Additional, lower-severity issues below.

## Warnings

### WR-01: Active-route text-color signal is masked by CMSLink's unconditional base styling

**File:** `src/components/CMSLink.tsx:64`, `src/components/SiteHeaderChrome.tsx:129-131,166-169`
**Issue:** The plain-link render branch in `CMSLink` always applies `cn('text-primary underline underline-offset-2', className)`. Because `text-primary` (a color utility) and `underline` are never overridden by anything in `SiteHeaderChrome`'s nav `className` strings in the *default* (non-hover, non-active) state, `twMerge` has nothing to collide with and keeps them — meaning every nav link renders permanently ember-colored and underlined, not just on hover/focus/active. UI-SPEC's Color Contract explicitly reserves ember for "the active-route indicator (underline + text color)" only, and the state table implies idle links inherit `text-secondary-foreground`, not `text-primary`. As shipped, `SiteHeaderChrome`'s `active && 'border-primary text-primary'` toggle for `text-primary` is a no-op — the color never actually distinguishes idle from active (only the `border-b-2` toggle has any visible effect, and even the hover `hover:text-primary` classes are equally masked/meaningless since the color is already ember at rest).
**Fix:** Give `CMSLink`'s plain-link branch a default text color that callers can override (e.g. drop the hardcoded `text-primary underline` from the base and let call sites opt in), or have `SiteHeaderChrome` pass an explicit idle-state color class (`text-secondary-foreground`) so `twMerge` actually has something to swap out on hover/active:
```tsx
// SiteHeaderChrome.tsx nav className
cn(
  'relative pb-1 border-b-2 border-transparent text-secondary-foreground hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:text-primary transition-colors duration-fast ease-out text-body',
  active && 'border-primary text-primary',
)
```

### WR-02: `isActive()` only recognizes `type: 'custom'` nav links, silently ignoring `reference`-type links

**File:** `src/components/SiteHeaderChrome.tsx:95-99`
**Issue:** `Header.navItems` uses the shared `link({ appearances: false })` field factory, which supports both `type: 'custom'` (has `url`) and `type: 'reference'` (resolves via `reference.value`/`.relationTo`, no `url` field set). `isActive()` reads only `item.link?.url`; for a `reference`-type nav item this is `undefined`/`null`, so `isActive()` returns `false` unconditionally even when that item's resolved route (computed independently inside `CMSLink`) is the current page. The active-route underline/`aria-current` silently never appears for any nav item authored as a reference link.
**Fix:** Either resolve the href the same way `CMSLink` does (extract a shared `resolveHref(link)` helper used by both `CMSLink` and `isActive()`) or restrict `Header.navItems` to `type: 'custom'` at the schema level and document the constraint. Minimal fix:
```ts
function resolveHref(link?: HeaderLink | null): string | undefined {
  if (!link) return undefined
  if (link.type === 'reference' && link.reference?.value) {
    const slug = typeof link.reference.value === 'object' ? link.reference.value.slug : undefined
    return slug ? `/${slug}` : undefined
  }
  return link.url ?? undefined
}
```

### WR-03: `normalizePath()`'s locale-prefix strip has no word-boundary check

**File:** `src/components/SiteHeaderChrome.tsx:52-56`
**Issue:** `acc.startsWith(\`/${locale}\`)` matches any path whose first segment merely *starts with* `en`/`es`, not just an exact `/en` or `/es` segment — e.g. a hypothetical future route `/english-services` or `/estudios` would be truncated incorrectly (`/enlaces` → `laces` after `.slice(3)`, losing the leading slash entirely and producing a comparison string that can never equal a well-formed path). This is a duplicate of an identical pre-existing bug in `LocaleSwitcher.tsx:26-27` — this phase copied the same unsafe pattern into new code instead of extracting a shared, boundary-safe helper. Currently benign against the site's actual route set (no top-level segment starts with the substrings "en"/"es"), but it's a latent correctness bug that will resurface silently the next time a route is added.
**Fix:** Require a trailing `/` or end-of-string boundary after the locale segment:
```ts
const stripped = routing.locales.reduce((acc, locale) => {
  const prefix = `/${locale}`
  if (acc === prefix) return '/'
  if (acc.startsWith(`${prefix}/`)) return acc.slice(prefix.length)
  return acc
}, path)
```
Consider extracting this into `src/lib/service-slugs.ts` (or a new `src/lib/locale-path.ts`) as a single shared `stripLocalePrefix()` used by both `LocaleSwitcher` and `SiteHeaderChrome`, closing both copies of the bug at once.

### WR-04: Logo link is hardcoded to `/` regardless of locale

**File:** `src/components/SiteHeaderChrome.tsx:109`
**Issue:** `<Link href="/" ...>` always points to the Spanish (default, unprefixed) homepage. On the `en` locale this sends users who click the logo from `/en/...` to `/` (Spanish home) instead of `/en`. This bug predates Phase 26 (identical in the pre-refactor `SiteHeader.tsx`), so it is not a regression introduced here, but it now lives in a newly-created file under this phase's ownership and is worth fixing while the header is already being touched.
**Fix:**
```tsx
<Link href={locale === 'en' ? '/en' : '/'} className="flex items-center gap-2">
```

## Info

### IN-01: FAQ items keyed by array index instead of Payload's stable row `id`

**File:** `src/blocks/FAQ/Component.tsx:20`
**Issue:** `faqs?.map((item, i) => <details key={i} ...>` uses the array index as the React key, even though Payload auto-generates a stable `id` per array-field row. Native `<details>` open/closed state lives in the DOM node itself; if the `faqs` array is ever reordered or has an item removed/inserted (e.g. during a live content edit reflected via revalidation without a full page reload), React's index-based reconciliation can reuse a DOM node whose `open` attribute was set by the user for a different question, silently showing the wrong item as expanded. Low probability in practice (requires content change without full remount) but a real identity bug given a stable key is available for free.
**Fix:** `key={item.id ?? i}` (same fallback pattern already used for `NavItem`/`Sheet` nav keys elsewhere in this phase's own `SiteHeaderChrome.tsx`).

### IN-02: Scroll-state effect can cause a one-frame flash on client-side navigation

**File:** `src/components/SiteHeaderChrome.tsx:84-91`
**Issue:** Not a hydration-mismatch bug (SSR and first paint both render the idle `scrolled=false` classes, matching the intended safe pattern). However, `handleScroll()` runs synchronously inside `useEffect` on every mount, so if the browser's scroll position is already past the 8px threshold at mount time (possible on client-side route transitions where scroll position is retained, or on browser back/forward restoring scroll), the header will render idle for one frame then immediately flash to the scrolled style right after hydration. Cosmetic only.
**Fix:** Not required, but could be smoothed by reading `window.scrollY` in a lazy `useState` initializer guarded by `typeof window !== 'undefined'` if the flash becomes noticeable in practice.

---

_Reviewed: 2026-07-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
