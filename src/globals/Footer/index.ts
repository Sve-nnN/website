import type { GlobalConfig } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Site',
    description: 'Footer columns, social links, legal links, and copyright text.',
  },
  fields: [
    {
      name: 'columns',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        linkGroup({ appearances: false }),
      ],
    },
    {
      name: 'dynamicColumns',
      type: 'array',
      admin: {
        initCollapsed: true,
        description:
          'Columnas computadas en render time desde Posts/CaseStudies (ultimos N por fecha), no curadas manualmente.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
        },
        {
          name: 'source',
          type: 'select',
          required: true,
          options: ['latestPosts', 'latestCaseStudies'],
        },
        {
          name: 'limit',
          type: 'number',
          defaultValue: 5,
          min: 1,
          max: 10,
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: ['linkedin', 'github', 'x', 'website'],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'copyrightText',
      type: 'text',
      localized: true,
    },
  ],
}
