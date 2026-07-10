import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'

/**
 * Public author profile collection (E-E-A-T bio/credentials).
 *
 * Public read access is intentional: this collection holds no auth data
 * (no email/password, no `auth: true`) — it's a public content collection,
 * not a login collection.
 *
 * Trimmed to a lean field set per CONTEXT.md's discretion — does NOT port the
 * heavy `education`/`experience`/`socialMedia`/`expertise` arrays from the
 * JuanPortfolio analog; those are a later content-audit-phase elaboration not
 * called for by CONTEXT.md.
 *
 * No SEO tab: `@payloadcms/plugin-seo` targets `pages`/`posts`/`case-studies`
 * only per CONTEXT.md — Authors does not get a SEO tab in Phase 1.
 */
export const Authors: CollectionConfig = {
  slug: 'authors',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'jobTitle',
      type: 'text',
      localized: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      label: { en: 'Bio', es: 'Biografía' },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'credentials',
      type: 'array',
      label: { en: 'Credentials', es: 'Credenciales' },
      admin: {
        description: 'E-E-A-T credentials, e.g. "10+ años en SEO técnico", "Google Analytics Certification"',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          localized: true,
          required: true,
        },
      ],
    },
    {
      name: 'yearsExperience',
      type: 'number',
      label: { en: 'Years of experience', es: 'Años de experiencia' },
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: { en: 'Social links', es: 'Redes sociales' },
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
    slugField('name'),
  ],
}
