import type { Block } from 'payload'

export const ResultsSection: Block = {
  slug: 'resultsSection',
  interfaceName: 'ResultsSectionBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'Título de la sección (ej: "Resultados Cuantificables")',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción opcional debajo del título',
      },
    },
    {
      name: 'stats',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Valor de la estadística (ej: "40%", "3x", "+50K")',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Descripción de la estadística',
          },
        },
      ],
    },
    {
      name: 'backgroundColor',
      type: 'select',
      defaultValue: 'gray',
      options: [
        { label: 'Gris claro', value: 'gray' },
        { label: 'Blanco', value: 'white' },
        { label: 'Primary', value: 'primary' },
      ],
      admin: {
        description: 'Color de fondo de la sección',
      },
    },
  ],
}

export default ResultsSection
