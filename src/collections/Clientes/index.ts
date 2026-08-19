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
    /**
     * Marca los clientes que un desconocido reconoce de entrada.
     *
     * Un muro donde los 28 logos pesan lo mismo desperdicia a los pocos que
     * hacen el trabajo pesado: un visitante que no sabe quién es Juan no
     * evalúa 28 marcas, engancha con la que ya conoce y a partir de ahí lee el
     * resto. Los destacados salen primero y en celda más grande dentro de su
     * grupo. La jerarquía la da el tamaño y nunca el color, porque el sistema
     * tiene exactamente dos temperaturas y la brasa está reservada para la
     * decisión de la página.
     *
     * Pocos, o deja de ser jerarquía: cuatro o cinco como máximo.
     */
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Cliente reconocible: se muestra primero y más grande dentro de su grupo. Usalo con avaricia, cuatro o cinco a lo sumo.',
      },
    },
  ],
}
