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
}

export default withPayload(withNextIntl(nextConfig))
