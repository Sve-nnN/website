import type { Block } from 'payload'

export const RelatedPosts: Block = {
  slug: 'relatedPosts',
  interfaceName: 'RelatedPostsBlockType',
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description: 'Título de la sección (ej: "Artículos relacionados")',
      },
    },
    {
      name: 'posts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        description: 'Posts relacionados específicos (opcional)',
      },
    },
    {
      name: 'autoSelect',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Auto-seleccionar posts por categoría si no hay posts manuales',
      },
    },
    {
      name: 'limit',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
      admin: {
        description: 'Número máximo de posts relacionados',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Related Posts',
      es: 'Posts Relacionados',
    },
    plural: {
      en: 'Related Posts',
      es: 'Posts Relacionados',
    },
  },
}

export default RelatedPosts
