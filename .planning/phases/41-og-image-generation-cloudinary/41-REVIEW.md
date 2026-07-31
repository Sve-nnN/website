---
phase: 41-og-image-generation-cloudinary
reviewed: 2026-07-31T23:19:38Z
depth: standard
files_reviewed: 20
files_reviewed_list:
  - src/lib/og-image.ts
  - src/app/(frontend)/[locale]/layout.tsx
  - src/app/(frontend)/[locale]/page.tsx
  - src/app/(frontend)/[locale]/authors/[slug]/page.tsx
  - src/app/(frontend)/[locale]/authors/page.tsx
  - src/app/(frontend)/[locale]/blog/[slug]/page.tsx
  - src/app/(frontend)/[locale]/blog/page.tsx
  - src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx
  - src/app/(frontend)/[locale]/case-studies/page.tsx
  - src/app/(frontend)/[locale]/contact/page.tsx
  - src/app/(frontend)/[locale]/privacy/page.tsx
  - src/app/(frontend)/[locale]/search/page.tsx
  - src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx
  - src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx
  - src/app/(frontend)/[locale]/services/[slug]/page.tsx
  - src/app/(frontend)/[locale]/services/page.tsx
  - src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
  - src/app/(frontend)/[locale]/servicios/page.tsx
  - src/app/(frontend)/[locale]/terms/page.tsx
  - src/app/(frontend)/[locale]/websites/[slug]/page.tsx
  - src/app/(frontend)/[locale]/websites/page.tsx
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 41: Code Review Report

**Reviewed:** 2026-07-31T23:19:38Z
**Depth:** standard
**Files Reviewed:** 20
**Status:** issues_found

## Summary

Reviewed `src/lib/og-image.ts` (the ported Cloudinary title-overlay mechanism) and all 19 route files (+root layout) wired to it in Phase 41. The core mechanism is sound: the `,`/`/` double-encoding for the `l_text` layer is correct (verified by hand-tracing the encode/decode cycle — Cloudinary decodes the URL once, so only the two characters that double as its own delimiter set need the extra escape, and the regex-based double-encoding step cannot produce false positives since every `%XY` triplet in `encodeURIComponent`'s output is a genuine escape, never a literal source character). The 3-tier fallback priority (`meta.image` → `heroImage` → deterministic per-slug pool) is applied consistently across all 19 call sites; no route leaks an avatar, website screenshot, or relative path into the OG image field (author `avatar` and website `screenshots[]` are deliberately excluded, matching 41-CONTEXT.md). `twitter.creor` is correctly omitted sitewide, and no route hardcodes a non-Cloudinary or incorrectly-localized `og:url` — the Servicios/Services dual-slug routes intentionally collapse `og:url` to the same canonical target as `buildServiceAlternates`, which is correct OG practice (not a bug).

Four issues are still worth fixing before this ships, none of them blockers: an unhandled-surrogate-pair edge case in the title truncation that can throw inside `generateMetadata`, an assumption (never live-verified, per all three phase SUMMARY.md files) that Next's twitter-image-inherits-from-openGraph behavior works across a layout/page metadata-merge boundary, duplicated `generateMetadata` logic across the four Servicios/Services physical routes, and a silent degrade path if a Cloudinary URL without `/upload/` is ever passed in.

## Warnings

### WR-01: Title truncation can split a UTF-16 surrogate pair, throwing inside `generateMetadata`

**File:** `src/lib/og-image.ts:58-61`
**Issue:** `title.slice(0, 62)` operates on UTF-16 code units, not code points. If an editorial title (`meta.title`, editable in the Payload admin — e.g. an emoji in a long blog-post SEO title) is long enough to trigger truncation (`> 65` chars) and happens to have a supplementary-plane character (most emoji, some rare symbols) whose high surrogate lands exactly at index 61, the slice produces a string ending in a lone unpaired surrogate. `encodeURIComponent` throws a `URIError: URI malformed` on such a string. Since this runs inside `generateMetadata`, an uncaught throw there breaks the entire page render (500), not just the OG image — for any locale/route that hits this exact title+length+character-position combination.
**Fix:**
```typescript
// Truncate on code points, not UTF-16 code units, to avoid splitting a surrogate pair.
const truncated =
  title.length > 65 ? `${Array.from(title).slice(0, 62).join('')}...` : title
```

### WR-02: Twitter-image-inherits-from-OpenGraph behavior across the layout/page split was never live-verified

**File:** `src/app/(frontend)/[locale]/layout.tsx:18-26`, combined with every `openGraph` returned by the 19 `generateMetadata` functions
**Issue:** The whole `twitter:image` story for this phase rests on `twitter: { card: 'summary_large_image' }` being declared once in the root layout's *static* `metadata` export, while `openGraph.images` is returned per-route from each page's `generateMetadata`. The code comment (`layout.tsx:20-21`) asserts Next.js merges these and back-fills `twitter:image` from `openGraph.images` automatically — this is a real, documented Next.js behavior, but it depends on Next's final metadata-accumulation step running *after* the parent (layout) and child (page) metadata objects are merged. All three Phase 41 plan SUMMARY.md files (`41-01`, `41-02`, `41-03`) explicitly record that the DB-dependent dev-server curl verification needed to confirm the rendered `<meta name="twitter:image">` tag was **blocked** every single time by a Neon/Postgres `ECONNRESET` issue, and was never completed. So the one behavior this phase leans on hardest for Twitter/social-preview correctness is unverified in this codebase as shipped.
**Fix:** Before closing the phase/milestone, run the live verification the summaries already prescribe once DB connectivity is stable:
```bash
curl -s http://localhost:3000/ | grep -o '<meta name="twitter:image"[^>]*>'
```
If the tag is missing or empty, explicitly set `twitter.images` per-page (or add a small helper that mirrors `openGraph.images` into `twitter.images` in `buildOpenGraph`) instead of relying on the implicit cross-level fallback.

### WR-03: `generateMetadata` fully duplicated across the four Servicios/Services physical routes

**File:** `src/app/(frontend)/[locale]/services/page.tsx:20-40` and `src/app/(frontend)/[locale]/servicios/page.tsx:20-40` (identical); `src/app/(frontend)/[locale]/services/[slug]/page.tsx:20-49` and `src/app/(frontend)/[locale]/servicios/[slug]/page.tsx:20-49` (identical)
**Issue:** This phase added the exact same 12-20 lines of `buildOpenGraph`-wiring code to both physical-route twins in each pair, byte-for-byte identical (confirmed via diff). This is intentional — both routes must resolve to the same canonical OG data — but it means any future change (a new field, a fixed typo, a locale tweak) has to be made in two places by hand, with nothing enforcing they stay in sync. This is exactly the kind of drift the sibling `buildServiceAlternates` helper in `src/lib/canonical.ts` was written to prevent for canonical URLs; the OG wiring re-introduces the same duplication `canonical.ts`'s own comment explicitly calls out as a problem it solves ("collapses the 4 physical URL combinations... into 2 canonical targets").
**Fix:** Extract a shared `getServiceOpenGraph(locale, doc, slug)` helper (in `src/lib/services-data.ts` or alongside `buildServiceAlternates`) that both `services/*` and `servicios/*` route files call, mirroring how `buildServiceAlternates` is already shared.

### WR-04: Non-`/upload/` Cloudinary URLs silently bypass the entire OG transform (no title, no scrim, no 1200×630 crop)

**File:** `src/lib/og-image.ts:25-29`
**Issue:** `getCloudinaryOgWithTitle` returns the URL unmodified, with no logging, if `url` doesn't contain `/upload/`. Today every URL flowing through here is generated by this repo's own `cloudinaryAdapter.generateFileURL` (always delivery type `upload`) or the fixed fallback pool, so this path isn't currently reachable — but if a future Media doc is ever populated via a different delivery type (`fetch`, `private`, `authenticated`), or Cloudinary account settings change, the resulting `og:image` would silently be an untitled, wrong-aspect-ratio raw image with no scrim, and nothing in the code or logs would signal that the title overlay was skipped.
**Fix:** Log (or assert) when the early-return path is hit, so a future data/config change that violates this assumption is visible instead of silently degrading OG quality:
```typescript
if (!url || !url.includes('cloudinary.com')) return url
const uploadIndex = url.indexOf('/upload/')
if (uploadIndex === -1) {
  console.warn(`[og-image] Cloudinary URL missing /upload/ segment, skipping title overlay: ${url}`)
  return url
}
```

## Info

### IN-01: `og:type` hardcoded to `website` for all pages, including blog posts and case studies

**File:** `src/lib/og-image.ts:126-141` (all call sites inherit this)
**Issue:** `buildOpenGraph` always sets `type: 'website'`. Blog posts (`blog/[slug]/page.tsx`) and case studies (`case-studies/[slug]/page.tsx`) are natural candidates for `og:type: 'article'` plus `article:published_time`/`article:author`, which social platforms and some SEO tooling use to render richer previews. This is explicitly out of this phase's stated scope (41-CONTEXT.md limits scope to OG-03/OG-04), so not a defect — just a follow-up worth tracking given the project's stated goal of "SEO impecable."
**Fix:** Consider a follow-up phase/task adding an optional `type: 'article' | 'website'` param to `buildOpenGraph`, defaulting to `'website'`, set to `'article'` from the two doc-detail routes that have real publish dates/authors.

### IN-02: Fallback-pool URL shape and the transform-stripping heuristic in `getCloudinaryOgWithTitle` are implicitly coupled across two files

**File:** `src/lib/og-image.ts:34-51` relative to `src/lib/heroImageFallback.ts` (not part of this diff, pre-existing)
**Issue:** `getFallbackHeroImage` returns URLs of the shape `.../upload/f_auto,q_auto/portfolio/fallback-image-N.avif` — i.e. the fallback pool bakes a transform segment *and* a literal `.avif` extension into what `getCloudinaryOgWithTitle` treats as "the public ID." The transform-stripping loop in `og-image.ts` happens to parse this correctly today (traced by hand: `f_auto,q_auto` matches the transform-prefix heuristic and is stripped, `portfolio/fallback-image-N.avif` is kept intact as the public ID), but the correctness depends on `heroImageFallback.ts`'s exact URL shape never changing without a matching update to `og-image.ts`'s segment parser, and there's no test or comment cross-referencing the two files.
**Fix:** Add a one-line comment in each file pointing at the other (or a small shared unit test asserting `getCloudinaryOgWithTitle(getFallbackHeroImage('x'), 'Title')` produces the expected transform chain) so a future edit to either file's URL shape doesn't silently break the other.

---

_Reviewed: 2026-07-31T23:19:38Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
