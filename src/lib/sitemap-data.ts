import { getPayload } from 'payload'
import config from '@payload-config'

export const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

type SitemapCollection = {
  collection: 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories'
  prefix: string
  hasDrafts: boolean
  group: SitemapEntry['group']
}

const SITEMAP_COLLECTIONS: SitemapCollection[] = [
  { collection: 'pages', prefix: '', hasDrafts: true, group: 'pages' },
  { collection: 'posts', prefix: 'blog', hasDrafts: true, group: 'blog' },
  { collection: 'case-studies', prefix: 'case-studies', hasDrafts: true, group: 'case-studies' },
  { collection: 'authors', prefix: 'authors', hasDrafts: false, group: 'authors' },
  { collection: 'categories', prefix: 'categories', hasDrafts: false, group: 'categories' },
]

export type SitemapEntry = {
  url: string
  lastModified: string | Date
  group: 'pages' | 'blog' | 'case-studies' | 'authors' | 'categories'
  alternates: { es: string; en: string }
}

export type SitemapGroup = SitemapEntry['group']

export const SITEMAP_GROUP_LABELS: Record<SitemapGroup, string> = {
  pages: 'Pages',
  blog: 'Blog',
  'case-studies': 'Case Studies',
  authors: 'Authors',
  categories: 'Categories',
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const payload = await getPayload({ config })

  const entriesByCollection = await Promise.all(
    SITEMAP_COLLECTIONS.map(async ({ collection, prefix, hasDrafts, group }) => {
      const result = await payload.find({
        collection,
        limit: 0,
        locale: 'all',
        ...(hasDrafts ? { where: { _status: { equals: 'published' } } } : {}),
      })

      return result.docs.map((doc) => {
        const path =
          prefix === '' ? (doc.slug !== 'home' ? doc.slug : '') : `${prefix}/${doc.slug}`

        const url = path ? `${SITE_URL}/${path}` : SITE_URL

        return {
          url,
          lastModified: doc.updatedAt,
          group,
          alternates: {
            es: url,
            en: path ? `${SITE_URL}/en/${path}` : `${SITE_URL}/en`,
          },
        } satisfies SitemapEntry
      })
    }),
  )

  return entriesByCollection.flat()
}
