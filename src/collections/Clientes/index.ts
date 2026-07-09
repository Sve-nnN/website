import type { CollectionConfig } from 'payload'

/**
 * Lean client-logo-carousel collection (SCHEMA-07).
 *
 * Deliberately minimal per CONTEXT.md: "puramente credibilidad visual" — no
 * case-study fields, no relationship to CaseStudies here (that relationship
 * lives on CaseStudies pointing back to Clientes, not the other way around).
 * Does NOT compete conceptually with the enriched CaseStudies collection.
 */
export const Clientes: CollectionConfig = {
  slug: 'clientes',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'websiteUrl',
      type: 'text',
    },
  ],
}
