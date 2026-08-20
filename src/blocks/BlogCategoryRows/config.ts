import type { Block } from 'payload'

/**
 * Filas por categoría para el índice del blog: una fila por tema, con su
 * encabezado, su conteo real y un enlace a la categoría completa.
 *
 * Por qué no es una opción más de ArchiveBlock (que es lo que su propio
 * comentario pide para "otra grilla de N items"): ArchiveBlock renderiza UNA
 * consulta. Esto renderiza una por categoría, con encabezado propio, conteo y
 * navegación a otra URL por fila. Es una topología distinta, no un parámetro.
 */
export const BlogCategoryRows: Block = {
  slug: 'blogCategoryRows',
  interfaceName: 'BlogCategoryRowsBlock',
  labels: { singular: 'Blog — filas por categoría', plural: 'Blog — filas por categoría' },
  fields: [
    {
      name: 'postsPerCategory',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: {
        description:
          'Cuántos artículos muestra cada fila. 3 llena una fila del grid en escritorio; 6 llena dos y alarga bastante la página.',
      },
    },
    {
      name: 'categoryOrder',
      type: 'array',
      labels: { singular: 'Categoría', plural: 'Categorías' },
      admin: {
        description:
          'Orden de las filas. Vacío = todas las categorías con artículos, alfabéticas. Una categoría que no esté en esta lista no aparece en el índice, pero su página sigue existiendo.',
      },
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
        },
      ],
    },
    {
      name: 'viewAllLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Ver más',
      admin: { description: 'Texto del enlace que abre la categoría completa.' },
    },
  ],
}
