// Cached data-fetch layer for Phase 43 (Performance: Response Time + HTML
// Size). Wraps Payload's Local API (`getPayload().find`/`findGlobal`) in
// Next 15's `unstable_cache` -- this is DATA caching, not ROUTE caching. All
// routes stay `force-dynamic` (self-hosted Dokploy build has no DB access
// during `next build`); `unstable_cache` only ever executes at request time,
// so it does not reintroduce that constraint.
//
// This module is consumed ONLY by page.tsx/component files, never by
// `collections/`/`globals/` (those import the config-free `./cache-tags`
// instead), so importing `@payload-config` here does not create the import
// cycle documented in cache-tags.ts.
//
// SECURITY (T-43-02): Payload's Local API defaults to `overrideAccess: true`,
// which bypasses each collection's `read: authenticatedOrPublished` access
// rule. Without an explicit `overrideAccess: false` on every fetcher below, a
// draft doc could get cached by `unstable_cache` and served to ANY anonymous
// visitor for up to 60s -- worse than the single-request leak already fixed
// in Phase 24 (WR-02), because a cache hit amplifies it across visitors.
// Every fetcher in this file passes `overrideAccess: false` explicitly, same
// pattern as `src/lib/services-data.ts`.

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Post, CaseStudy, Category } from '@/payload-types'
import { CACHE_TAGS, CACHE_TTL_SECONDS } from './cache-tags'
import { resolvePrimaryCategorySlug } from './blog-paths'

export type Locale = 'es' | 'en'

export type PostCardData = Pick<
  Post,
  'id' | 'title' | 'slug' | 'excerpt' | 'heroImage' | 'categories'
>
export type CaseStudyCardData = Pick<
  CaseStudy,
  'id' | 'title' | 'slug' | 'sector' | 'heroMetric' | 'client'
>

// --- Pages (Home in this plan; also used by other page.tsx routes) ---

export function getCachedPageBySlug(slug: string, locale: Locale, depth?: number) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        locale,
        limit: 1,
        overrideAccess: false,
        ...(depth !== undefined ? { depth } : {}),
      })
      return docs[0]
    },
    ['page', slug, locale, String(depth ?? 'default')],
    { tags: [CACHE_TAGS.page(slug)], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Featured Content global (deduped: FeaturedPostsBlock +
// FeaturedCaseStudiesBlock both call this instead of each doing their own
// `payload.findGlobal` -- root cause #1 of 43-CONTEXT.md) ---

export function getCachedFeaturedContent(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({
        slug: 'featured-content',
        depth: 1,
        locale,
        // NOT overrideAccess:false here (unlike every other fetcher in this
        // file): `featured-content` has no `versions`/drafts (see
        // src/globals/FeaturedContent/index.ts), so there is no draft state
        // to leak — the security rationale in this file's header comment
        // doesn't apply to it. Its real `access` config (Payload's default
        // for globals without an explicit `access` block, confirmed via
        // `GET /api/globals/featured-content` -> 403 for ALL other globals
        // too, e.g. header/footer) denies unauthenticated reads outright, so
        // overrideAccess:false here throws instead of returning empty —
        // this broke Home in production (HTTP 500) until this fix.
        populate: {
          // `categories` rides along so featured post cards can build their
          // /blog/<category>/<slug> href. At depth 1 it arrives as bare ids,
          // which `FeaturedPostsBlock` resolves through
          // `getCachedPostCategoryMap`.
          posts: { title: true, slug: true, excerpt: true, heroImage: true, categories: true },
          'case-studies': { title: true, slug: true, sector: true, heroMetric: true, client: true },
        },
      })
    },
    ['featured-content', locale],
    {
      tags: [CACHE_TAGS.featuredContent(), CACHE_TAGS.posts(), CACHE_TAGS.caseStudies()],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

// --- Categories (blog URL structure: /blog/<category>/<post>) ---

export type CategoryData = Pick<Category, 'id' | 'title' | 'slug' | 'description'>

/**
 * All categories for a locale. Small (5 docs) and read on every blog route —
 * the category listing resolves its slug against this instead of querying by
 * slug, so an unknown segment costs no extra round trip.
 */
export function getCachedCategories(locale: Locale): Promise<CategoryData[]> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'categories',
        locale,
        limit: 100,
        sort: 'title',
        overrideAccess: false,
        select: { title: true, slug: true, description: true },
      })
      return docs
    },
    ['categories', locale],
    { tags: [CACHE_TAGS.categories()], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * `postSlug -> categorySlug` for every published post. Backs two things that
 * would otherwise need a per-item query: building `/blog/<category>/<slug>`
 * links from contexts that only know a post slug (search results, footer),
 * and 301ing legacy `/blog/<postSlug>` URLs to their new home.
 */
export function getCachedPostCategoryMap(locale: Locale): Promise<Record<string, string>> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        locale,
        limit: 0,
        pagination: false,
        overrideAccess: false,
        select: { slug: true, categories: true },
        populate: { categories: { slug: true } },
      })

      const map: Record<string, string> = {}
      for (const doc of docs) {
        if (doc.slug) map[doc.slug] = resolvePrimaryCategorySlug(doc.categories)
      }
      return map
    },
    ['post-category-map', locale],
    {
      tags: [CACHE_TAGS.posts(), CACHE_TAGS.categories()],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

// --- Post / Case Study detail (not wired to any route in this plan --
// ready for 43-02/43-03 to consume without touching this file again) ---

export function getCachedPost(slug: string, locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'posts',
        where: { slug: { equals: slug } },
        locale,
        // depth 2, not 1: at depth 1 `author` arrives populated but
        // `author.avatar` is still a bare id, so `AuthorByline` and
        // `AuthorCard` both fell through to their initials fallback and the
        // post pages showed an empty circle where the photo belongs. The
        // avatar lives one relationship deeper than the author, so the author
        // being populated is not enough.
        depth: 2,
        limit: 1,
        overrideAccess: false,
      })
      return docs[0]
    },
    ['post', slug, locale],
    { tags: [CACHE_TAGS.post(slug)], revalidate: CACHE_TTL_SECONDS },
  )()
}

export function getCachedCaseStudy(slug: string, locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'case-studies',
        where: { slug: { equals: slug } },
        locale,
        // Same reason as posts above: this page renders an AuthorCard, whose
        // avatar sits a relationship deeper than the author itself.
        depth: 2,
        limit: 1,
        overrideAccess: false,
      })
      return docs[0]
    },
    ['case-study', slug, locale],
    { tags: [CACHE_TAGS.caseStudy(slug)], revalidate: CACHE_TTL_SECONDS },
  )()
}

// --- Archive listing (ArchiveBlock, used by Servicios/Blog listing routes
// in 43-02) -- not wired to any component in this plan yet. Branches by
// `relationTo` with 3 literal `payload.find` calls (one per collection)
// instead of a single call with a dynamic `collection: relationTo`, because
// Payload's generic `select` type doesn't correlate well against a union
// `collection` type. `websites` doesn't get a `select` this phase -- not a
// confirmed root cause per 43-CONTEXT.md. ---

export type ArchiveRelationTo = 'posts' | 'case-studies' | 'websites'

export function getCachedArchive({
  relationTo,
  limit,
  locale,
  categoryId,
}: {
  relationTo: ArchiveRelationTo
  limit: number
  locale: Locale
  // 43-02: Category.id is a numeric Payload id (see payload-types.ts), not a
  // string -- typed as `number` to match the real caller (ArchiveBlock's
  // `categoryFilter`) instead of silently mismatching the `where` equality
  // check against the DB's integer column.
  categoryId?: number
}) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })

      if (relationTo === 'posts') {
        return payload.find({
          collection: 'posts',
          where: categoryId ? { categories: { in: [categoryId] } } : undefined,
          sort: '-publishedAt',
          locale,
          limit,
          overrideAccess: false,
          // `categories` is selected (and shaped down to just its slug by
          // `populate`) because every post card links to
          // /blog/<category>/<slug> — without it the card cannot build its
          // own href. `populate` keeps the RSC payload small: only the
          // related category's id+slug ship, not its whole document.
          select: { title: true, slug: true, excerpt: true, heroImage: true, categories: true },
          populate: { categories: { slug: true } },
        })
      }

      if (relationTo === 'case-studies') {
        return payload.find({
          collection: 'case-studies',
          sort: '-publishedAt',
          locale,
          limit,
          overrideAccess: false,
          select: { title: true, slug: true, sector: true, heroMetric: true, client: true },
        })
      }

      return payload.find({
        collection: 'websites',
        sort: '-publishedAt',
        locale,
        limit,
        overrideAccess: false,
      })
    },
    [
      'archive',
      relationTo,
      locale,
      String(limit),
      String(categoryId ?? 'none'),
    ],
    {
      tags: [
        relationTo === 'posts'
          ? CACHE_TAGS.posts()
          : relationTo === 'case-studies'
            ? CACHE_TAGS.caseStudies()
            : 'websites:all',
      ],
      revalidate: CACHE_TTL_SECONDS,
    },
  )()
}

// --- Redirects lookup (transversal, runs on every request via middleware —
// used by src/app/api/redirects-lookup/route.ts) ---

const REDIRECT_COLLECTION_BASE_PATH: Record<string, string> = {
  pages: '',
  posts: 'blog',
  'case-studies': 'case-studies',
  authors: 'authors',
  categories: 'categories',
}

export function getCachedRedirectTarget(from: string): Promise<string | null> {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'redirects',
        where: { from: { equals: from } },
        limit: 1,
        overrideAccess: false,
      })

      const redirectDoc = docs[0]
      let target: string | null = null

      if (redirectDoc) {
        // SECURITY (T-02-01, open-redirect mitigation): the redirect target is
        // resolved EXCLUSIVELY from the admin-authored `redirects` collection
        // doc (doc.to.url or a resolved refDoc.slug) — never from
        // request-controlled input. `from` above is only ever used as an
        // equality lookup key against admin-authored data, never echoed back
        // as (or used to build) the redirect target itself.
        if (redirectDoc.to?.type === 'custom') {
          target = redirectDoc.to.url ?? null
        } else if (redirectDoc.to?.type === 'reference' && redirectDoc.to.reference) {
          const { relationTo, value } = redirectDoc.to.reference
          const id = typeof value === 'object' && value !== null ? value.id : value
          const refDoc = await payload.findByID({
            collection: relationTo as 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories',
            id,
            // SECURITY (43-REVIEW WR-01): missing overrideAccess:false here
            // let a redirect pointing at a draft doc leak that doc's slug
            // through the resolved redirect target, same class of leak the
            // rest of this file's fetchers already guard against.
            overrideAccess: false,
          })
          const base = REDIRECT_COLLECTION_BASE_PATH[relationTo] ?? ''
          const refSlug = (refDoc as { slug?: string })?.slug

          if (refSlug) {
            target =
              base === '' && refSlug === 'home' ? '/' : `/${[base, refSlug].filter(Boolean).join('/')}`
          }
        }
      }

      return target
    },
    ['redirect', from],
    { tags: [CACHE_TAGS.redirects()], revalidate: CACHE_TTL_SECONDS },
  )()
}
