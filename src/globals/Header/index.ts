import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  admin: {
    group: 'Site',
    description: 'Site-wide navigation, logo, and CTA button — editable without touching code.',
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'navItems',
      type: 'array',
      admin: { initCollapsed: true },
      fields: [link({ appearances: false })],
    },
    {
      name: 'ctaButton',
      type: 'group',
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          // Editable per-locale default per UI-SPEC Copywriting Contract
          // ("Get in Touch" / "Hablemos") — editors can override per locale.
          defaultValue: 'Get in Touch',
        },
        {
          name: 'href',
          type: 'text',
          defaultValue: '/contact',
        },
      ],
    },
  ],
}
