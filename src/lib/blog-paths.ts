// Single source of truth for blog URL shapes. Pure module: no Payload/DB
// access, no side effects — same contract as `src/lib/breadcrumbs.ts` and
// `src/lib/canonical.ts`.
//
// The blog is organised as real folders, not query params:
//
//   /blog                        listing (all posts)
//   /blog/<category>             category listing
//   /blog/<category>/<post>      post detail
//
// There is deliberately no `/categories` section — the legacy
// `/categories/<slug>` URLs 301 to `/blog/<slug>` from `next.config.mjs`.

export type Locale = 'es' | 'en'

/**
 * Category segment used for posts that have no category assigned. `general`
 * is a real category in the CMS, so the resulting URL is a live page rather
 * than a synthetic segment. Exactly one published post currently needs it
 * (`tablas-hash`); assigning it a category in the admin makes the fallback
 * moot without any code change.
 */
export const FALLBACK_CATEGORY_SLUG = 'general'

/** A post's `categories` entry can arrive populated, as a bare id, or null. */
export type CategoryRef = number | { slug?: string | null } | null | undefined

/**
 * Picks the category that owns a post's canonical URL: the first one assigned.
 * Every published post currently has 0 or 1 category, so "first" is not a
 * heuristic today — it only becomes one if multi-category posts appear, and
 * the post-detail route then 301s any non-primary category segment to this one
 * so a post never has two indexable URLs.
 */
export function resolvePrimaryCategorySlug(categories: CategoryRef[] | null | undefined): string {
  const first = categories?.find(
    (c): c is { slug?: string | null } => typeof c === 'object' && c !== null,
  )

  return first?.slug ?? FALLBACK_CATEGORY_SLUG
}

export function blogIndexPath(): string {
  return '/blog'
}

export function blogCategoryPath(categorySlug: string): string {
  return `/blog/${categorySlug}`
}

export function blogPostPath(categorySlug: string, postSlug: string): string {
  return `/blog/${categorySlug}/${postSlug}`
}

/**
 * Prefixes a blog path with the locale segment. `es` is the default locale
 * (`routing.ts`) and therefore unprefixed; `en` gets `/en`. Use this for
 * absolute metadata/canonical/sitemap URLs, which must be unambiguous. In-page
 * `<Link>` hrefs stay unprefixed on purpose and get their prefix at render time
 * from the locale-aware `Link` in `@/i18n/navigation` — the middleware only
 * rewrites INCOMING requests, never outgoing hrefs, and believing otherwise is
 * what spread unprefixed `/en` links across the site in the first place.
 */
export function localizeBlogPath(locale: Locale, path: string): string {
  return locale === 'en' ? `/en${path}` : path
}
