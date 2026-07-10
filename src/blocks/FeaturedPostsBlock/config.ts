import type { Block } from 'payload'

/**
 * Reads FeaturedContent.featuredPosts at render time — deliberately has no
 * relationship field of its own so there is exactly one curation surface for
 * "which posts are featured" (the FeaturedContent global), not a competing
 * per-block selection.
 */
export const FeaturedPostsBlock: Block = {
  slug: 'featuredPostsBlock',
  interfaceName: 'FeaturedPostsBlock',
  labels: { singular: 'Featured Posts', plural: 'Featured Posts Blocks' },
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
