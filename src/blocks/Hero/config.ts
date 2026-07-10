import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

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
    linkGroup({
      appearances: ['default', 'outline'],
      overrides: {
        admin: {
          description: 'Optional CTA buttons rendered below the hero copy.',
          initCollapsed: true,
        },
        maxRows: 2,
      },
    }),
    {
      name: 'breadcrumbs',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'listing',
        description: 'Optional breadcrumb trail, only rendered on the Listing variant.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
  ],
}
