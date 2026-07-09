import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'

export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'client', 'updatedAt'] },
  versions: {
    drafts: { autosave: { interval: 100 }, schedulePublish: true },
    maxPerDoc: 50,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    { name: 'heroMetric', type: 'text', localized: true },
    { name: 'heroSubtitle', type: 'text', localized: true },
    {
      type: 'row',
      fields: [
        { name: 'client', type: 'relationship', relationTo: 'clientes', required: false },
        { name: 'sector', type: 'text', localized: true },
        { name: 'period', type: 'text' },
      ],
    },
    {
      name: 'services',
      type: 'array',
      fields: [{ name: 'service', type: 'text', required: true }],
    },
    {
      name: 'kpis',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        { name: 'label', type: 'text', required: true, localized: true },
        { name: 'value', type: 'text', required: true },
      ],
    },
    { name: 'clientContext', type: 'richText', editor: lexicalEditor(), localized: true },
    {
      name: 'challenge',
      type: 'array',
      fields: [{ name: 'text', type: 'textarea', required: true, localized: true }],
    },
    {
      name: 'solution',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'description', type: 'textarea', required: true, localized: true },
      ],
    },
    {
      name: 'results',
      type: 'group',
      fields: [
        { name: 'periodBefore', type: 'text' },
        { name: 'periodAfter', type: 'text' },
        {
          name: 'metrics',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true, localized: true },
            { name: 'before', type: 'text', required: true },
            { name: 'after', type: 'text', required: true },
          ],
        },
      ],
    },
    { name: 'conclusion', type: 'richText', editor: lexicalEditor(), localized: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    slugField(),
  ],
}
