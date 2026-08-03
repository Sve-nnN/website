// Cache tag scheme + invalidation hooks for Phase 43 (Performance: Response
// Time + HTML Size). Pure module: NO import of `payload`/`@payload-config`
// here, on purpose -- collections/globals (Pages, Posts, CaseStudies,
// FeaturedContent) import this file to wire their `hooks`, and those same
// collections are imported BY payload.config.ts. Importing `@payload-config`
// from this file would create a cycle:
//   payload.config.ts -> collections/* -> lib/cache-tags.ts -> @payload-config
// `src/lib/cache.ts` (the module that DOES need `getPayload`/`@payload-config`
// for the actual cached fetchers) is consumed only by page.tsx/component
// files, never by collections/globals, so it never re-introduces this cycle.
//
// TTL is a 60s safety net only -- the primary freshness mechanism is the
// `revalidateTag` calls below, wired into each collection/global's
// `afterChange`/`afterDelete` hooks in Task 1/2.

import { revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload'

import type { Page, Post, CaseStudy } from '@/payload-types'

export const CACHE_TTL_SECONDS = 60

export const CACHE_TAGS = {
  page: (slug: string) => `pages:${slug}`,
  posts: () => 'posts:all',
  post: (slug: string) => `posts:${slug}`,
  caseStudies: () => 'case-studies:all',
  caseStudy: (slug: string) => `case-studies:${slug}`,
  featuredContent: () => 'featured-content',
  redirects: () => 'redirects',
}

// --- Pages ---

export const revalidatePagesCache: CollectionAfterChangeHook<Page> = ({ doc }) => {
  if (doc.slug) revalidateTag(CACHE_TAGS.page(doc.slug))
  return doc
}

export const revalidatePagesCacheOnDelete: CollectionAfterDeleteHook<Page> = ({ doc }) => {
  if (doc.slug) revalidateTag(CACHE_TAGS.page(doc.slug))
  return doc
}

// --- Posts ---

export const revalidatePostsCache: CollectionAfterChangeHook<Post> = ({ doc }) => {
  revalidateTag(CACHE_TAGS.posts())
  if (doc.slug) revalidateTag(CACHE_TAGS.post(doc.slug))
  return doc
}

export const revalidatePostsCacheOnDelete: CollectionAfterDeleteHook<Post> = ({ doc }) => {
  revalidateTag(CACHE_TAGS.posts())
  if (doc.slug) revalidateTag(CACHE_TAGS.post(doc.slug))
  return doc
}

// --- Case Studies ---

export const revalidateCaseStudiesCache: CollectionAfterChangeHook<CaseStudy> = ({ doc }) => {
  revalidateTag(CACHE_TAGS.caseStudies())
  if (doc.slug) revalidateTag(CACHE_TAGS.caseStudy(doc.slug))
  return doc
}

export const revalidateCaseStudiesCacheOnDelete: CollectionAfterDeleteHook<CaseStudy> = ({
  doc,
}) => {
  revalidateTag(CACHE_TAGS.caseStudies())
  if (doc.slug) revalidateTag(CACHE_TAGS.caseStudy(doc.slug))
  return doc
}

// --- Featured Content (global — no afterDelete for globals) ---

export const revalidateFeaturedContentCache: GlobalAfterChangeHook = ({ doc }) => {
  revalidateTag(CACHE_TAGS.featuredContent())
  return doc
}

// --- Redirects (registered by @payloadcms/plugin-redirects, wired via
// `overrides.hooks` in payload.config.ts — Task 2) ---

export const revalidateRedirectsCache: CollectionAfterChangeHook = ({ doc }) => {
  revalidateTag(CACHE_TAGS.redirects())
  return doc
}

export const revalidateRedirectsCacheOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateTag(CACHE_TAGS.redirects())
  return doc
}
