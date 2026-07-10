import type { Block } from 'payload'

/**
 * Reads FeaturedContent.featuredCaseStudies at render time — same single-
 * curation-surface rationale as FeaturedPostsBlock.
 */
export const FeaturedCaseStudiesBlock: Block = {
  slug: 'featuredCaseStudiesBlock',
  interfaceName: 'FeaturedCaseStudiesBlock',
  labels: { singular: 'Featured Case Studies', plural: 'Featured Case Studies Blocks' },
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
