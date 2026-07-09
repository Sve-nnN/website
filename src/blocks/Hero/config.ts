import type { Block } from 'payload'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'home',
      options: [
        { label: 'Home', value: 'home' },
        { label: 'Listing', value: 'listing' },
        { label: 'Post Header', value: 'post-header' },
        { label: 'Case Study Header', value: 'case-study-header' },
      ],
    },
    { name: 'title', type: 'text', localized: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'media', type: 'upload', relationTo: 'media' },
  ],
}
