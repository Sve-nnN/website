import type { Block } from 'payload'

export const ArchiveBlock: Block = {
  slug: 'archiveBlock',
  interfaceName: 'ArchiveBlock',
  labels: { singular: 'Archive / Featured Grid', plural: 'Archive / Featured Grid Blocks' },
  fields: [
    // Any future "grid of N items from a collection" need MUST extend this select's options — never spawn a new block slug (RESEARCH.md Pitfall 5).
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
  ],
}
