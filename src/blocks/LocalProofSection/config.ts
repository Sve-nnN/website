import type { Block } from 'payload'

// Local social-proof band (33-LOCAL-02): 3 numeric stats + a single
// testimonial card carrying a local business name, distinct from
// `resultsSection` (generic stats-only, up to 6) and `testimonialSection`
// (quote-only, no business field) — this block always pairs exactly 3 stats
// with one localized testimonial, matching the Madrid/Lima landing spec.
export const LocalProofSection: Block = {
  slug: 'localProofSection',
  interfaceName: 'LocalProofSectionBlock',
  labels: {
    singular: 'Local Proof Section',
    plural: 'Local Proof Sections',
  },
  fields: [
    {
      name: 'stats',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 3,
      admin: {
        description: 'Exactamente 3 estadisticas numericas locales.',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Valor de la estadistica (ej: "+40", "98%", "5 anos")',
          },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'Descripcion de la estadistica',
          },
        },
      ],
    },
    {
      name: 'testimonial',
      type: 'group',
      admin: {
        description: 'Testimonio local con nombre y negocio.',
      },
      fields: [
        {
          name: 'quote',
          type: 'textarea',
          label: 'Cita',
          required: true,
          localized: true,
        },
        {
          name: 'authorName',
          type: 'text',
          label: 'Nombre del autor',
          required: true,
        },
        {
          name: 'authorBusiness',
          type: 'text',
          label: 'Negocio / empresa local del autor',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}

export default LocalProofSection
