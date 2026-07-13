---
phase: 24-servicesshowcase-en-home
reviewed: 2026-07-13T01:10:12Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/blocks/ServicesShowcase/config.ts
  - src/blocks/ServicesShowcase/Component.tsx
  - src/collections/Pages/index.ts
  - src/blocks/RenderBlocks.tsx
  - src/migrations/20260713_005924.ts
  - scripts/seed-phase24-services-showcase.ts
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 24: Code Review Report

**Reviewed:** 2026-07-13T01:10:12Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Reviewed the new `ServicesShowcase` block (config + Component), its additive registration in `Pages`/`RenderBlocks`, the generated migration, and the idempotent seed script. The implementation matches `24-01-PLAN.md` and `24-UI-SPEC.md` closely: registration is genuinely additive (`git diff` on both `Pages/index.ts` and `RenderBlocks.tsx` shows only appended lines), the migration is `CREATE TABLE`/`ADD CONSTRAINT`/`CREATE INDEX` only with zero `ALTER COLUMN`/`DROP` on pre-existing tables, `npx tsc --noEmit` is clean, the href-building convention correctly mirrors `src/lib/canonical.ts`'s `/servicios/{slug}` vs `/en/services/{slug}` dual-segment pattern, and no hardcoded per-card copy exists (card title/excerpt are sourced from `page.title`/`page.meta.description`, CTA label from `next-intl`).

No blocking defects found. Two items worth fixing for robustness/query efficiency, plus two informational notes — one of which (draft-page visibility) is a pre-existing gap in a shared helper that this phase newly exposes on the site's highest-traffic page.

**On the N+1 question:** `ServicesShowcaseComponent` issues 4 independent `payload.find` calls (one per `SERVICE_SLUGS` entry, via `getServicePage`), run in parallel with `Promise.all` rather than sequentially awaited in a loop. This is not a true N+1 in the classic sense (it's a fixed N=4, not proportional to a growing dataset, and it's parallelized so wall-clock cost is ~1 round trip, not 4x), and the existing precedent block (`FeaturedCaseStudiesBlockComponent`) does the fetch in a single `findGlobal` call, so 4-vs-1 round trips is a real but bounded inefficiency, not a correctness bug. See WR-01 below — flagged as a Warning for query efficiency/maintainability, not a Blocker, consistent with the "N+1/performance out of v1 scope unless it's also a correctness issue" review policy.

## Warnings

### WR-01: 4 parallel DB round-trips instead of 1 to fetch the 4 service cards

**File:** `src/blocks/ServicesShowcase/Component.tsx:33-35`
**Issue:** `SERVICE_SLUGS.map((slug) => getServicePage(locale, slug))` fans out to 4 separate `payload.find` calls (each doing its own `getPayload({ config })` + a single-row `where: { slug: { equals: slug } }` query), one per Home page render. The precedent block this UI-SPEC explicitly mirrors (`FeaturedCaseStudiesBlockComponent`) does the equivalent fetch with a single query. Since this block only renders on Home (low page count, not a list that grows), this is bounded and parallelized, so it is not a scaling risk today — but it's 4x the DB round-trips of the pattern it's copying, on the site's highest-traffic page, for no functional benefit (the order is already known from `SERVICE_SLUGS`).
**Fix:** Use a single `where: { slug: { in: SERVICE_SLUGS } }` query in a new helper (e.g. `getServicePages(locale, slugs)` in `services-data.ts`) and re-sort/map the results back into `SERVICE_SLUGS` order, e.g.:
```typescript
export async function getServicePages(locale: 'es' | 'en', slugs: readonly string[]) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { in: slugs as string[] } },
    locale,
    depth: 1,
    limit: slugs.length,
  })
  const bySlug = new Map(docs.map((d) => [d.slug, d]))
  return slugs.map((s) => bySlug.get(s)).filter((p): p is NonNullable<typeof p> => Boolean(p))
}
```
Not urgent given current traffic/scale — safe to defer, but worth tracking as tech debt since it deviates from the established single-query pattern.

### WR-02: `getServicePage` bypasses draft/publish access control (pre-existing, now surfaced on Home)

**File:** `src/lib/services-data.ts:52-60` (consumed by `src/blocks/ServicesShowcase/Component.tsx:33-35`)
**Issue:** `getServicePage`/`getServicePages` call `payload.find` via the Local API without `overrideAccess: false`. Payload's Local API defaults `overrideAccess` to `true`, meaning `authenticatedOrPublished`'s `_status: 'published'` gate is never applied to this query — an unpublished/draft service page would still be fetched and rendered as a live card. This helper predates Phase 24 (used since Phase 19 for `/servicios/[slug]`/`/services/[slug]`), so it isn't new code, but Phase 24 is the first consumer that surfaces it on Home — the site's highest-traffic, most-visible page — meaning a draft service page edited in admin (e.g. mid-rewrite, not yet ready to publish) would immediately appear as a clickable card on the live homepage.
**Fix:** Pass `overrideAccess: false` in `getServicePage`/`getServicePages`, or explicitly add `where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] }` if draft preview elsewhere in the app relies on `overrideAccess: true` for authenticated editors. Flagging for awareness — not blocking this phase's merge since it's inherited behavior, but worth a follow-up fix given the new higher-visibility surface.

## Info

### IN-01: Silent slug-fallback branches are unreachable given the query contract, and could mask a real bug if that contract ever changes

**File:** `src/blocks/ServicesShowcase/Component.tsx:47,51`
**Issue:** `iconBySlug[page.slug ?? '']` and `buildServiceHref(locale, page.slug ?? '')` both guard against `page.slug` being falsy. In practice `page` only ever comes from `getServicePage(locale, slug)`, which queries `where: { slug: { equals: slug } }` — so `page.slug` is guaranteed to equal one of the 4 known `SERVICE_SLUGS` values and is never falsy. If it were ever falsy (e.g. a future refactor that fetches by ID instead of slug), the `?? ''` fallback would silently render a broken link (`/servicios/` or `/en/services/`, both resolving to the Servicios index, not a 404, so the bug would be hard to notice) rather than surfacing an error.
**Fix:** Not urgent; if you want to harden it, replace the `?? ''` fallback with the already-known slug from the `SERVICE_SLUGS`/`getServicePage` pairing (e.g. zip `pages` with their originating slugs from the `Promise.all` rather than reading `page.slug ?? ''` back off the fetched doc) so a future contract change fails loudly (wrong URL/icon becomes visibly wrong) instead of silently degrading to the index URL.

### IN-02: No caching/revalidation layer — every Home render re-fetches the 4 service pages fresh (consistent with existing blocks, just noting the cost)

**File:** `src/blocks/ServicesShowcase/Component.tsx:33-35`
**Issue:** There is no `revalidatePath`/`revalidateTag`/React `cache()` wrapping this fetch (confirmed no `revalidatePath`/`revalidateTag` usage exists anywhere in `src/` yet). This matches the sitewide precedent (`FeaturedCaseStudiesBlockComponent` also fetches fresh per request) so it's not a regression, but combined with WR-01 it means Home currently issues at least 4 additional DB queries on every uncached request that didn't exist before this phase.
**Fix:** No action required for this phase; consider addressing alongside WR-01 and CLAUDE.md's stated (but not-yet-implemented) `afterChange` + `revalidatePath` convention in a future caching pass.

---

_Reviewed: 2026-07-13T01:10:12Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
