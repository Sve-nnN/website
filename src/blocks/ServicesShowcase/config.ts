import type { Block } from 'payload'

/**
 * Fixed 2x2 grid of the 4 service landing pages, read live from
 * `SERVICE_SLUGS` (src/lib/services-data.ts) — not a curated relation. The
 * only editorial field is the section title; card content (title/excerpt/
 * href) is entirely derived from the 4 service pages at render time.
 */
export const ServicesShowcase: Block = {
  slug: 'servicesShowcase',
  interfaceName: 'ServicesShowcaseBlock',
  labels: { singular: 'Services Showcase', plural: 'Services Showcase Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Section heading — editable per page instance.',
      },
    },
  ],
}
