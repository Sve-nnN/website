import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { revalidatePostsCache, revalidatePostsCacheOnDelete } from '@/lib/cache-tags'
import { AffiliateInlineBlock } from '@/blocks/AffiliateInlineBlock/config'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'updatedAt'],
  },
  // Phase 43 (43-01): invalidates posts:all + posts:<slug> unstable_cache
  // tags (src/lib/cache.ts) — also covers getCachedFeaturedContent, which
  // tags itself with posts:all so a Post edit refreshes Home's Featured
  // section too.
  hooks: {
    afterChange: [revalidatePostsCache],
    afterDelete: [revalidatePostsCacheOnDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
      // Phase 48 (INL-01): agrega el bloque `affiliate-inline` — jsonb ya
      // existente, cero migración. Único override de `content` en este
      // archivo; el resto de campos queda intacto.
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          BlocksFeature({ blocks: [AffiliateInlineBlock] }),
        ],
      }),
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
    slugField('title'),
  ],
}
