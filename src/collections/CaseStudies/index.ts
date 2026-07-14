import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { TestimonialSection } from '@/blocks/TestimonialSection/config'

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
      fields: [{ name: 'service', type: 'text', required: true, localized: true }],
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
    // Gap-fill (10.7, UI-21): CaseStudies has no general-purpose `blocks`
    // layout field (it's a fixed KPI/challenge/solution/results model, per
    // 01-04-PLAN.md) — this field is scoped to allow ONLY TestimonialSection,
    // slotted between "solution" and "results" so an editor can embed one
    // hand-picked quote inline without opening up free-form block layout.
    {
      name: 'testimonialSection',
      label: 'Testimonio (opcional)',
      type: 'blocks',
      maxRows: 1,
      admin: {
        description: 'Testimonio embebido entre "La solución" y "Resultados"',
      },
      blocks: [TestimonialSection],
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
    // Added in 05-09: CaseStudies had no author relationship, which would
    // have silently omitted the CONT-02 E-E-A-T byline for this content
    // type. Backfilled to the single real Author doc via
    // scripts/backfill-case-study-author.ts.
    { name: 'author', type: 'relationship', relationTo: 'authors', required: false },
    slugField(),
  ],
}
