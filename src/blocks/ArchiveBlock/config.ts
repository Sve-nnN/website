import type { Block } from 'payload'

export const ArchiveBlock: Block = {
  slug: 'archiveBlock',
  interfaceName: 'ArchiveBlock',
  labels: { singular: 'Archive / Featured Grid', plural: 'Archive / Featured Grid Blocks' },
  fields: [
    // Any future "grid of N items from a collection" need MUST extend this select's options — never spawn a new block slug (RESEARCH.md Pitfall 5).
    // Precedent: 05-03 added `enableCategoryFilter` below as a sibling field
    // conditioned on relationTo, instead of a new PostsArchiveBlock — follow
    // this same pattern for any future per-collection-type toggle.
    {
      name: 'relationTo',
      type: 'select',
      required: true,
      options: [
        { label: 'Posts', value: 'posts' },
        { label: 'Case Studies', value: 'case-studies' },
      ],
    },
    {
      name: 'mode',
      type: 'radio',
      defaultValue: 'latest',
      options: [
        { label: 'Latest N', value: 'latest' },
        { label: 'Manual selection', value: 'manual' },
      ],
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      admin: { condition: (_, siblingData) => siblingData.mode === 'latest' },
    },
    {
      name: 'selectedDocs',
      type: 'relationship',
      relationTo: ['posts', 'case-studies'],
      hasMany: true,
      admin: { condition: (_, siblingData) => siblingData.mode === 'manual' },
    },
    {
      name: 'enableCategoryFilter',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        condition: (_, siblingData) => siblingData?.relationTo === 'posts',
        description: 'Show category filter tabs above the grid (posts only).',
      },
    },
    // Empty-state copy per 05-UI-SPEC.md Copywriting Contract — editable
    // defaults, not hardcoded in the renderer (05-07 addition).
    {
      name: 'emptyStateHeading',
      type: 'text',
      localized: true,
      defaultValue: 'Nothing here yet',
      admin: {
        description: 'Shown when a category filter (or manual selection) yields 0 results.',
      },
    },
    {
      name: 'emptyStateBody',
      type: 'textarea',
      localized: true,
      defaultValue: 'This category doesn\'t have any posts yet. Browse all posts instead.',
    },
  ],
}
