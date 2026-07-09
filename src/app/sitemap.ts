import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juancarlosangulo.com'

type SitemapCollection = {
  collection: 'pages' | 'posts' | 'case-studies' | 'authors' | 'categories'
  prefix: string
  hasDrafts: boolean
}

const SITEMAP_COLLECTIONS: SitemapCollection[] = [
  { collection: 'pages', prefix: '', hasDrafts: true },
  { collection: 'posts', prefix: 'blog', hasDrafts: true },
  { collection: 'case-studies', prefix: 'case-studies', hasDrafts: true },
  { collection: 'authors', prefix: 'authors', hasDrafts: false },
  { collection: 'categories', prefix: 'categories', hasDrafts: false },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config })

  const entriesByCollection = await Promise.all(
    SITEMAP_COLLECTIONS.map(async ({ collection, prefix, hasDrafts }) => {
      const result = await payload.find({
        collection,
        limit: 0,
        locale: 'all',
        ...(hasDrafts ? { where: { _status: { equals: 'published' } } } : {}),
      })

      return result.docs.map((doc) => {
        const path =
          prefix === ''
            ? doc.slug !== 'home'
              ? doc.slug
              : ''
            : `${prefix}/${doc.slug}`

        const url = path ? `${SITE_URL}/${path}` : SITE_URL

        return {
          url,
          lastModified: doc.updatedAt,
          alternates: {
            languages: {
              es: url,
              en: path ? `${SITE_URL}/en/${path}` : `${SITE_URL}/en`,
            },
          },
        } satisfies MetadataRoute.Sitemap[number]
      })
    }),
  )

  return entriesByCollection.flat()
}
