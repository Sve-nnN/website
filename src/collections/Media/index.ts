import type { CollectionConfig } from 'payload'

// MUST stay identical to the hasCloudinaryCreds boolean in
// src/payload.config.ts — both independently compute this from the same
// three env vars (RESEARCH.md Pitfall 2 / key_links).
const hasCloudinaryCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*'],
    // Disabled when Cloudinary is active to avoid the shallow-merge
    // metadata-clobbering bug across parallel per-size handleUpload calls
    // (RESEARCH.md Pitfall 2); Cloudinary's own URL transformations serve
    // size variants instead.
    imageSizes: hasCloudinaryCreds
      ? undefined
      : [
          { name: 'thumbnail', width: 300, height: undefined },
          { name: 'card', width: 768, height: undefined },
          { name: 'hero', width: 1600, height: undefined },
        ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
}
