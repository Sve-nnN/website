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
    /**
     * What kind of work was done for this client. Deliberately three coarse
     * buckets and nothing finer: Juan has permission to show all 28 logos but
     * cannot say what he did for each one, so this is the most the wall can
     * honestly claim.
     *
     * It is still worth claiming. An ungrouped logo wall is the category's
     * most copied habit — every competitor has one and none of them says
     * anything with it. Grouping by type of work turns the same authorised
     * logos into an actual statement: that this is not a person who only does
     * one thing.
     */
    {
      name: 'workType',
      type: 'select',
      defaultValue: 'seo',
      options: [
        { label: 'SEO', value: 'seo' },
        { label: 'Desarrollo', value: 'desarrollo' },
        { label: 'Optimización', value: 'optimizacion' },
      ],
      admin: {
        description:
          'Tipo de trabajo hecho para este cliente. Agrupa el muro de logos en la portada.',
      },
    },
  ],
}
