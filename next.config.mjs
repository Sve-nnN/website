import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    // remotePatterns intentionally empty in Phase 1 (local-disk media only);
    // add Cloudinary hostname pattern in Phase 3
    remotePatterns: [],
  },
}

export default withPayload(nextConfig)
