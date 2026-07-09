import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // remotePatterns intentionally empty in Phase 1 (local-disk media only);
    // add Cloudinary hostname pattern in Phase 3
    remotePatterns: [],
  },
}

export default withPayload(withNextIntl(nextConfig))
