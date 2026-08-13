import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Un solo formato (evita duplicar transformaciones avif+webp) y cache
    // largo: Cloudinary ya sirve la imagen optimizada, no hace falta
    // retransformar/recachear seguido.
    formats: ['image/webp'],
    minimumCacheTTL: 2678400,
  },
  async redirects() {
    return [
      // `/categories/<slug>` never had a route — the sitemap used to advertise
      // 10 of these (both locales) straight into a 404. Categories now live
      // under the blog as real folders (`/blog/<category>`, see
      // src/lib/blog-paths.ts) and there is deliberately no `/categories`
      // section, so the legacy URLs redirect there permanently.
      { source: '/categories/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/en/categories/:slug', destination: '/en/blog/:slug', permanent: true },
      { source: '/categories', destination: '/blog', permanent: true },
      { source: '/en/categories', destination: '/en/blog', permanent: true },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig))
