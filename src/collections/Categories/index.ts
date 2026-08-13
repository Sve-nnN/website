import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { slugField } from '@/fields/slug'
import {
  revalidateCategoriesCache,
  revalidateCategoriesCacheOnDelete,
} from '@/lib/cache-tags'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    // PROD-500 FIX: this used to be `authenticatedOrPublished`, which returns
    // the query constraint `{ _status: { equals: 'published' } }` for
    // anonymous readers. Categories has NO `versions.drafts` config, so there
    // is no `_status` field/column on this collection and Payload throws
    // ("The following path cannot be queried: _status") on every
    // unauthenticated read. That was invisible until Phase 43 switched the
    // frontend to `overrideAccess: false`: from then on, populating a post's
    // `categories` relation (depth >= 1) threw, so EVERY blog post detail
    // page 500'd, as did `GET /api/categories`. Categories are public
    // taxonomy with no draft state, so an open read is the correct rule —
    // same as Authors/Media, which already use `() => true`.
    read: () => true,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [revalidateCategoriesCache],
    afterDelete: [revalidateCategoriesCacheOnDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    slugField('title'),
  ],
}
