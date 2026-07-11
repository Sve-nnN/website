import type { CollectionConfig } from 'payload'

import { slugField } from '@/fields/slug'

/**
 * Public author profile collection (E-E-A-T bio/credentials).
 *
 * Public read access is intentional: this collection holds no auth data
 * (no email/password, no `auth: true`) — it's a public content collection,
 * not a login collection.
 *
 * Originally trimmed to a lean field set per Phase 1 CONTEXT.md's discretion
 * (name/jobTitle/bio/avatar/credentials/yearsExperience/socialLinks only).
 * Phase 12 (AUTHOR-01) recovers the `expertise`/`education`/`experience`
 * arrays for full E-E-A-T coverage on the author page — see
 * .planning/phases/12-author-page-e-e-a-t-expansion/12-CONTEXT.md. The
 * `certificate` upload field from the JuanPortfolio analog's `education[]`
 * is intentionally NOT ported — no real certificate files are available.
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
      name: 'expertise',
      type: 'array',
      label: { en: 'Expertise', es: 'Expertise' },
      admin: {
        description: 'Temas de especialización técnica, renderizados como tags en el author page',
      },
      fields: [
        {
          name: 'topic',
          type: 'text',
          localized: true,
          required: true,
        },
      ],
    },
    {
      name: 'education',
      type: 'array',
      label: { en: 'Education & Certifications', es: 'Educación y Certificaciones' },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'degree',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'institution',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'startDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'monthOnly',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'monthOnly',
            },
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
        },
      ],
    },
    {
      name: 'experience',
      type: 'array',
      label: { en: 'Experience', es: 'Experiencia' },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'company',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'role',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'startDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'monthOnly',
            },
          },
        },
        {
          name: 'endDate',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'monthOnly',
            },
          },
        },
        {
          name: 'description',
          type: 'textarea',
          localized: true,
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
