import type { Block } from 'payload'

/**
 * Reads FeaturedContent.featuredWebsites at render time — same single-
 * curation-surface rationale as FeaturedCaseStudiesBlock.
 */
export const FeaturedWebsitesBlock: Block = {
  slug: 'featuredWebsitesBlock',
  interfaceName: 'FeaturedWebsitesBlock',
  labels: { singular: 'Featured Websites', plural: 'Featured Websites Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Section heading — editable per page instance.',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
    },
  ],
}
