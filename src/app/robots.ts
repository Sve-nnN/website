import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
