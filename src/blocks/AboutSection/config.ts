import type { Block } from 'payload'

import { iconSelectOptions } from '@/fields/IconPicker/icons'

// Gap-fill block (10.7, UI-20): JuanPortfolio's "About" section (eyebrow +
// title + narrative paragraphs + optional photo) had no direct analog among
// the 16 blocks registered in 05-04 — the closest was the generic `content`
// block (single richText column), which the home page seed (05-06) used as a
// stand-in. This block gives editors a dedicated, purpose-built shape instead.
export const AboutSection: Block = {
  slug: 'aboutSection',
  interfaceName: 'AboutSectionBlock',
  labels: {
    singular: 'About Section',
    plural: 'About Sections',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow',
      localized: true,
      admin: {
        description: 'Texto corto sobre el título (ej: "Sobre mí")',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
      localized: true,
    },
    {
      name: 'paragraphs',
      type: 'array',
      label: 'Párrafos',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'text',
          type: 'textarea',
          required: true,
          localized: true,
          label: false,
        },
      ],
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Foto (opcional)',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Features',
      minRows: 4,
      maxRows: 4,
      admin: {
        description:
          'Exactamente 4 items: icono + título + descripción (grid "Mi enfoque en Consultoría Técnica")',
      },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: iconSelectOptions,
          admin: {
            components: {
              Field: '@/fields/IconPicker/Component#IconPickerField',
            },
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          localized: true,
        },
      ],
    },
    {
      name: 'ctaText',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto del botón CTA (opcional)',
      },
    },
    {
      name: 'ctaLink',
      type: 'text',
      admin: {
        description: 'URL o ancla del CTA, ej: #contact (opcional)',
      },
    },
  ],
}

export default AboutSection
