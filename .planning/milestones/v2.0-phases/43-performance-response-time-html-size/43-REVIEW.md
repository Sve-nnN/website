---
phase: 43-performance-response-time-html-size
reviewed: 2026-08-02T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - src/lib/cache-tags.ts
  - src/lib/cache.ts
  - src/payload.config.ts
  - src/collections/Pages/index.ts
  - src/collections/Posts/index.ts
  - src/collections/CaseStudies/index.ts
  - src/globals/FeaturedContent/index.ts
  - src/app/(frontend)/[locale]/page.tsx
  - src/app/(frontend)/[locale]/blog/page.tsx
  - src/app/(frontend)/[locale]/blog/[slug]/page.tsx
  - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
  - src/app/api/redirects-lookup/route.ts
  - src/blocks/ArchiveBlock/Component.tsx
  - src/blocks/FeaturedCaseStudiesBlock/Component.tsx
  - src/blocks/FeaturedPostsBlock/Component.tsx
  - src/components/CaseStudyCard.tsx
  - src/components/PostCard.tsx
  - src/lib/services-data.ts
findings:
  critical: 0
  warning: 4
  info: 1
  total: 5
status: issues_found
---

# Phase 43: Code Review Report

**Reviewed:** 2026-08-02
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

Reviewed the new `unstable_cache` data-caching layer (`src/lib/cache.ts` / `src/lib/cache-tags.ts`) and its wiring into Pages/Posts/CaseStudies/FeaturedContent hooks, the redirects-plugin `overrides.hooks` mechanism, and every page/component that now calls into it.

The two things the task flagged as highest-risk both check out:

- **No new circular import.** Traced the graph by hand: `cache-tags.ts` imports only `next/cache`, the `payload` package (types), and the generated (import-free) `payload-types.ts` — never `@payload-config`. It is imported by the collections/global that `payload.config.ts` also imports, but nothing in that chain imports back into `payload.config.ts`. `cache.ts` (which does import `@payload-config`) is consumed only by page/component files, never by collections/globals. No cycle exists in either direction. `npx tsc --noEmit` also passes clean.
- **Every fetcher's cache key includes `locale`** (`getCachedPageBySlug`, `getCachedFeaturedContent`, `getCachedPost`, `getCachedCaseStudy`, `getCachedArchive` all key on `locale`). `getCachedRedirectTarget` is the one exception, but correctly so — its key is the raw request `pathname` (`from`), which already encodes the locale prefix (`/en/...` vs `/...`) at the source, per `src/middleware.ts`.
- **`overrideAccess: false` is present on all six top-level cached queries** (`payload.find`/`findGlobal` calls in `cache.ts`), and this phase actually *closes* three pre-existing draft-leak gaps: `Home`, `Blog listing`, `Post detail`, and `Case Study detail` previously called `payload.find`/`payload.findGlobal` with **no** `overrideAccess: false` at all (verified against the pre-phase versions of these files) — so this refactor is a net security improvement for those four routes, not just a perf one.

That said, one nested lookup inside the redirects fetcher is missing the same `overrideAccess: false` the file's own header comment says is mandatory (see WR-01), and the "2 real bugs" fix for `sort: '-publishedAt'` is correct for `posts` but silently does nothing for `case-studies`/`websites`, whose schema has no `publishedAt` field (see WR-02). Two further findings cover a residual gap in the "dedupe the featured-content global" goal and an unused/untagged `'websites:all'` magic string.

The `revalidatePagesCache`/`revalidatePostsCache`/`revalidateCaseStudiesCache`(+OnDelete) hooks and `revalidateFeaturedContentCache` are all wired on the correct operations, invalidate the correct tags, and the `redirectsPlugin({ overrides: { hooks } })` mechanism is confirmed correct by reading the plugin source (`node_modules/@payloadcms/plugin-redirects/dist/index.js`): `overrides` is spread first and `hooks` is never subsequently overwritten by the plugin's own defaults, so the custom `afterChange`/`afterDelete` hooks do reach the `redirects` collection as intended.

## Warnings

### WR-01: `getCachedRedirectTarget`'s nested `findByID` lookup is missing `overrideAccess: false`

**File:** `src/lib/cache.ts:243-246`
**Issue:** The file's own header comment (lines 13-20) states the invariant "Every fetcher in this file passes `overrideAccess: false` explicitly" as a hard security requirement — a cache hit amplifies any leak across visitors for up to 60s. The top-level `payload.find({ collection: 'redirects', ... })` call at line 221-226 correctly sets `overrideAccess: false`, but the nested `payload.findByID` call used to resolve a `reference`-type redirect's target slug does not:
```ts
const refDoc = await payload.findByID({
  collection: relationTo as 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories',
  id,
})
```
If an admin creates a redirect that references a draft (unpublished) doc, this call bypasses `authenticatedOrPublished` and resolves that draft's `slug`, which then gets cached for up to 60s and served to every anonymous visitor hitting that `from` path — a (contained) information-disclosure gap: the draft's existence/slug leaks even though its body content does not (the eventual destination route still enforces `overrideAccess: false` and 404s). This is not a new regression (the pre-phase route handler had the same gap), but this file is the one place in the codebase that explicitly documents this exact invariant, so it should hold itself to it.
**Fix:**
```ts
const refDoc = await payload.findByID({
  collection: relationTo as 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories',
  id,
  overrideAccess: false,
})
```

### WR-02: `sort: '-publishedAt'` is a silent no-op for `case-studies` and `websites` (field doesn't exist on either schema)

**File:** `src/lib/cache.ts:170, 180`
**Issue:** `getCachedArchive`'s `case-studies` branch (line 170) and `websites` branch (line 180) both pass `sort: '-publishedAt'`. Neither `CaseStudy` nor `Website` has a `publishedAt` field (confirmed against `src/collections/CaseStudies/index.ts`, `src/collections/Websites/index.ts`, and the generated `payload-types.ts` — both interfaces only have `createdAt`/`updatedAt`/`_status`). Payload's `buildOrderBy` (`node_modules/@payloadcms/drizzle/dist/queries/buildOrderBy.js`) wraps unknown sort-path resolution in a `try {} catch (_) { /* continue */ }`, so this doesn't crash — it silently drops that sort term and falls back to the default `-createdAt` tiebreaker. The prompt's context states this line was one of "2 real bugs 43-02 found and fixed" (alongside the `categoryId` number-vs-string fix, which **is** correct — verified `Category.id: number` in `payload-types.ts`). The fix is correct only for the `posts` branch (`Post.publishedAt` genuinely exists at `payload-types.ts:375`); for case-studies/websites it's dead code masquerading as a fix, inherited unchanged from the pre-phase blanket `payload.find({ ..., sort: '-publishedAt' })` call that applied to all three `relationTo` types identically. Low practical impact (creation-date ordering is a reasonable fallback) but worth fixing or at minimum documenting, since a future reader will reasonably assume "sorted by publish date" is true for all three listing types when it silently isn't for two of them.
**Fix:** Either add a real `publishedAt` field to `CaseStudies`/`Websites` if publish-date ordering is actually wanted for those types, or drop the misleading sort term and comment why:
```ts
if (relationTo === 'case-studies') {
  return payload.find({
    collection: 'case-studies',
    sort: '-createdAt', // CaseStudy has no publishedAt field — createdAt is the real ordering key
    ...
```

### WR-03: `FeaturedWebsitesBlock` still bypasses the caching/dedup layer this phase built

**File:** `src/blocks/FeaturedWebsitesBlock/Component.tsx:11-18`
**Issue:** This file was not touched by this phase's diff, but it directly undermines the stated goal ("dedupes a double-fetch of the featured-content global"). `FeaturedPostsBlock` and `FeaturedCaseStudiesBlock` were refactored to share one `getCachedFeaturedContent(locale)` call (correct — verified via diff), but `FeaturedWebsitesBlock` still does its own independent, uncached `payload.findGlobal({ slug: 'featured-content', depth: 1, locale })`. On Home (which renders all three Featured*Block components), this means the `featured-content` global gets fetched via two separate code paths per request: once through the cache (shared by 2 blocks) and once always-live (by this block, on every request, never benefiting from the 60s TTL or `revalidateTag` invalidation). This is a residual gap relative to the phase's own stated purpose, not a functional bug (data returned is still correct), but it leaves one of the exact duplicate-DB-round-trip patterns this phase set out to eliminate.
**Fix:** Switch `FeaturedWebsitesBlock` to `getCachedFeaturedContent(locale)` like its two siblings, and add a `websites: { title: true, slug: true, ... }` entry to the `populate` object in `getCachedFeaturedContent` (see WR-04 — that `populate` object currently has no entry for `websites` at all, so even if this block switched over today, `featuredWebsites` would come back field-unscoped or under-populated relative to what `WebsiteCard` needs).

### WR-04: `'websites:all'` cache tag is a magic string, absent from `CACHE_TAGS`, and never invalidated

**File:** `src/lib/cache.ts:199`, `src/lib/cache-tags.ts:27-35`
**Issue:** `getCachedArchive`'s `websites` branch tags its cache entry with the literal string `'websites:all'` instead of a `CACHE_TAGS.websites()`-style constant — `CACHE_TAGS` (in `cache-tags.ts`) has no `websites` entry at all. Additionally, `src/collections/Websites/index.ts` has no `afterChange`/`afterDelete` hooks wired to call `revalidateTag('websites:all')`, unlike Pages/Posts/CaseStudies/FeaturedContent. This means any archive listing of websites only ever refreshes on the 60s TTL backstop, never immediately on a Website edit/publish — which the task description says is an acceptable behavior for the backstop case, so this isn't a correctness blocker, but the un-constant'd tag string is a real maintainability trap: if someone adds a `revalidateWebsitesCache` hook later, a typo in the tag string (e.g. `'website:all'` or `'websites-all'`) would silently fail to invalidate anything, with no type system or lint rule to catch the mismatch.
**Fix:**
```ts
// cache-tags.ts
export const CACHE_TAGS = {
  ...
  websites: () => 'websites:all',
}

// cache.ts
tags: [
  relationTo === 'posts'
    ? CACHE_TAGS.posts()
    : relationTo === 'case-studies'
      ? CACHE_TAGS.caseStudies()
      : CACHE_TAGS.websites(),
],
```

## Info

### IN-01: `getCachedFeaturedContent`'s `populate` has no entry for the `websites` relationship

**File:** `src/lib/cache.ts:71-74`
**Issue:** `populate` scopes fields only for `posts` and `case-studies`; there's no `websites` key even though `FeaturedContent.featuredWebsites` is a real relationship on the same global. Currently harmless because nothing reads `getCachedFeaturedContent(...).featuredWebsites` (see WR-03), but it's a latent gap that will need filling the moment WR-03 is addressed.
**Fix:** Add a `websites` entry to `populate` mirroring the `posts`/`case-studies` shape once `FeaturedWebsitesBlock` is migrated to this fetcher (see WR-03's fix).

---

_Reviewed: 2026-08-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
