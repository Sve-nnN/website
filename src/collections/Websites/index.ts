import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'

export const Websites: CollectionConfig = {
  slug: 'websites',
  labels: { singular: 'Website', plural: 'Websites' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'client', 'year', 'updatedAt'] },
  versions: {
    drafts: { autosave: { interval: 100 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'role', type: 'text', localized: true },
    { name: 'industry', type: 'text', localized: true },
    { name: 'year', type: 'number' },
    {
      name: 'highlights',
      type: 'array',
      fields: [{ name: 'text', type: 'text', required: true, localized: true }],
    },
    {
      name: 'stack',
      type: 'array',
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'challenges',
      type: 'array',
      fields: [{ name: 'text', type: 'textarea', required: true, localized: true }],
    },
    {
      name: 'screenshots',
      type: 'array',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'lighthouse',
      type: 'group',
      label: 'Lighthouse',
      fields: [
        { name: 'performance', type: 'number', min: 0, max: 100 },
        { name: 'accessibility', type: 'number', min: 0, max: 100 },
        { name: 'bestPractices', type: 'number', min: 0, max: 100 },
        { name: 'seo', type: 'number', min: 0, max: 100 },
      ],
    },
    { name: 'lighthouseCapturedAt', type: 'date', required: true },
    { name: 'client', type: 'relationship', relationTo: 'clientes', hasMany: false, required: false },
    {
      name: 'relatedCaseStudy',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: false,
      required: false,
    },
    slugField(),
  ],
}
