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
    // AVIF first, WebP as the fallback for anything that cannot decode it.
    // Next picks the first entry the request's `Accept` header allows, so a
    // modern browser gets AVIF and everything else still gets WebP exactly as
    // before. Measured on 2026-08-14: `/_next/image` was answering with
    // `content-type: image/webp` even when the browser offered AVIF, because
    // this array listed WebP alone.
    formats: ['image/avif', 'image/webp'],
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

      // `/blog/payloadcms-tutorial` is a leftover seed fixture that never got
      // published (see the docblock in scripts/publish-draft-content.ts), but
      // Google indexed it anyway: over the 90 days to 2026-08-14 it drew 84
      // impressions and 3 clicks at average position 17.26, all landing on a
      // 404. It is the only legacy blog URL without a redirect — every other
      // one (`/blog/tablas-hash`, `/blog/nextjs-seo`, ...) already 308s to its
      // categorised home.
      //
      // Target is the published post covering the same subject
      // (`/blog/development/payload-cms-guide`, live in both locales), NOT the
      // draft fixture: publishing seed content to satisfy a redirect would put
      // unreviewed text in front of the traffic that is already arriving.
      //
      // This lives here rather than in the `redirects` collection because the
      // Neon instance is unreachable from a dev machine (TCP connects, the
      // Postgres handshake resets), and because the `/categories` cleanup
      // above already set the precedent for legacy-URL redirects in code.
      {
        source: '/blog/payloadcms-tutorial',
        destination: '/blog/development/payload-cms-guide',
        permanent: true,
      },
      {
        source: '/en/blog/payloadcms-tutorial',
        destination: '/en/blog/development/payload-cms-guide',
        permanent: true,
      },
    ]
  },
}

export default withPayload(withNextIntl(nextConfig))
