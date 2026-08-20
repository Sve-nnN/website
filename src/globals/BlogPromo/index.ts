import type { GlobalConfig } from 'payload'

import { revalidateBlogPromoCache } from '@/lib/cache-tags'

/**
 * Los dos textos de conversión que el blog repite en todas sus superficies: la
 * oferta que aparece dentro del artículo y la banda que cierra índice,
 * categoría y post.
 *
 * Vive en un global y no en bloques porque el detalle del post NO se compone
 * con bloques (su cuerpo es un solo campo richText), y porque la alternativa
 * sería mantener el mismo par de textos en 66 documentos.
 *
 * `access.read` abierto a propósito: los globals de Payload sin `access`
 * explícito niegan la lectura anónima, y los fetchers del front corren con
 * `overrideAccess: false`. Sin esta línea, cada página del blog devolvería 500
 * en producción — ya pasó con `featured-content`, ver el comentario en
 * src/lib/cache.ts.
 */
export const BlogPromo: GlobalConfig = {
  slug: 'blog-promo',
  label: 'Blog — conversión',
  admin: {
    group: 'Site',
    description:
      'Oferta inline dentro del artículo y banda de cierre del blog. Se usa en /blog, en las categorías y en cada post.',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateBlogPromoCache],
  },
  fields: [
    {
      name: 'byCategory',
      type: 'array',
      label: 'Versiones por categoría',
      labels: { singular: 'Categoría', plural: 'Categorías' },
      admin: {
        description:
          'Quien lee SEO Técnico y quien lee Estrategia SEO no tienen el mismo problema ni el mismo stack, así que el mismo texto no le habla a los dos. Cada campo que dejes vacío cae al texto general de arriba, así que solo hace falta escribir lo que de verdad cambia.',
      },
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          admin: { description: 'Una fila por categoría. Dos filas para la misma categoría: gana la primera.' },
        },
        {
          name: 'inline',
          type: 'group',
          label: 'Oferta dentro del artículo',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'text', type: 'textarea', localized: true },
            { name: 'linkLabel', type: 'text', localized: true },
            { name: 'linkUrl', type: 'text' },
          ],
        },
        {
          name: 'rail',
          type: 'group',
          label: 'Tarjeta lateral',
          fields: [
            { name: 'title', type: 'text', localized: true },
            { name: 'body', type: 'textarea', localized: true },
            { name: 'linkLabel', type: 'text', localized: true },
            { name: 'linkUrl', type: 'text' },
          ],
        },
        {
          name: 'closing',
          type: 'group',
          label: 'Banda de cierre',
          admin: {
            description:
              'Los puntos son todo o nada: si cargás uno, reemplazan la lista completa del texto general en vez de mezclarse con ella.',
          },
          fields: [
            { name: 'heading', type: 'text', localized: true },
            { name: 'body', type: 'textarea', localized: true },
            {
              name: 'points',
              type: 'array',
              localized: true,
              maxRows: 4,
              labels: { singular: 'Punto', plural: 'Puntos' },
              fields: [{ name: 'item', type: 'text', required: true }],
            },
            { name: 'primaryLabel', type: 'text', localized: true },
            { name: 'primaryUrl', type: 'text' },
            { name: 'secondaryLabel', type: 'text', localized: true },
            { name: 'secondaryUrl', type: 'text' },
          ],
        },
      ],
    },
    {
      name: 'inline',
      type: 'group',
      label: 'Oferta dentro del artículo',
      admin: {
        description:
          'Se inserta después de la primera sección del post, cerca del 40% del cuerpo. Una sola frase: el lector está leyendo, no comprando.',
      },
      fields: [
        { name: 'title', type: 'text', localized: true },
        {
          name: 'text',
          type: 'textarea',
          localized: true,
          admin: { description: 'Vacío = no se muestra la oferta inline en ningún post.' },
        },
        { name: 'linkLabel', type: 'text', localized: true },
        {
          name: 'linkUrl',
          type: 'text',
          admin: { description: 'Ruta interna sin prefijo de idioma, por ejemplo /contacto.' },
        },
      ],
    },
    {
      name: 'rail',
      type: 'group',
      label: 'Tarjeta de la columna lateral',
      admin: {
        description:
          'Va debajo de la tabla de contenidos, en la columna derecha del post. Solo escritorio: en mobile la columna se apila y ahí ya están la oferta inline y la banda de cierre.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          localized: true,
          admin: { description: 'Vacío = no se muestra la tarjeta lateral.' },
        },
        { name: 'body', type: 'textarea', localized: true },
        { name: 'linkLabel', type: 'text', localized: true },
        { name: 'linkUrl', type: 'text' },
      ],
    },
    {
      name: 'closing',
      type: 'group',
      label: 'Banda de cierre',
      admin: {
        description: 'Último bloque de /blog, de cada categoría y de cada post.',
      },
      fields: [
        { name: 'heading', type: 'text', localized: true },
        { name: 'body', type: 'textarea', localized: true },
        {
          name: 'points',
          type: 'array',
          localized: true,
          maxRows: 4,
          labels: { singular: 'Punto', plural: 'Puntos' },
          fields: [{ name: 'item', type: 'text', required: true }],
        },
        { name: 'primaryLabel', type: 'text', localized: true },
        { name: 'primaryUrl', type: 'text' },
        { name: 'secondaryLabel', type: 'text', localized: true },
        { name: 'secondaryUrl', type: 'text' },
      ],
    },
  ],
}
