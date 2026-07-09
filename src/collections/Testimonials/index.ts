import type { CollectionConfig } from 'payload'

/**
 * Structured testimonial attribution collection (SCHEMA-05).
 *
 * `name`/`role`/`company` are ALL `required: true` — an intentional tightening
 * vs. common analogs (e.g. aprendoclub's `Testimonios.ts`, which only requires
 * `nombre`/`quote`). No anonymous quotes allowed per CONTEXT.md.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'role'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    {
      name: 'testimonial',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
