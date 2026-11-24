import type { Field, GlobalConfig } from 'payload'

import { revalidateAboutPageCache } from '@/lib/cache-tags'
import { ABOUT_CHIP_ICON_NAMES, toSelectOptions } from '@/lib/shadow-icons'

/**
 * Copy nuevo de Sobre mí (fase 54, contenido sombra aditivo).
 *
 * Los párrafos de la bio salen de authors.bio, la educación de authors y las
 * ponencias de speaking-events: no se duplican aquí.
 *
 * Sin `access` y sin `versions` (T-54-05): GET /api/globals/about-page
 * responde 403 y no hay borradores que filtrar.
 */

const text = (name: string, localized = true): Field => ({ name, type: 'text', localized })
const area = (name: string, localized = true): Field => ({ name, type: 'textarea', localized })

export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'Sobre mí (contenido nuevo)',
  admin: {
    group: 'Site',
    description: 'Copy del rediseño de Sobre mí. Privado hasta el corte.',
  },
  hooks: {
    afterChange: [revalidateAboutPageCache],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        text('eyebrow'),
        area('lead'),
        {
          name: 'photo',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'El texto alternativo sale del campo alt de Media.' },
        },
        {
          name: 'chips',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'icon',
              type: 'select',
              options: toSelectOptions(ABOUT_CHIP_ICON_NAMES),
            },
            text('label'),
          ],
        },
      ],
    },
    {
      name: 'bio',
      type: 'group',
      fields: [text('title')],
    },
    {
      name: 'counters',
      type: 'group',
      fields: [text('seoLabel'), text('devLabel'), text('yearsLabel')],
    },
    {
      name: 'specialties',
      type: 'group',
      fields: [
        text('title'),
        {
          name: 'items',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [text('title'), text('detail')],
        },
      ],
    },
    {
      name: 'experience',
      type: 'group',
      fields: [
        text('title'),
        area('lead'),
        {
          name: 'stages',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [
            // Texto libre: admite marcadores pendientes ("2024 a hoy", "por confirmar").
            text('when'),
            text('role'),
            text('org'),
            area('body'),
            { name: 'current', type: 'checkbox', defaultValue: false },
            text('linkLabel'),
            text('linkHref', false),
          ],
        },
      ],
    },
    {
      name: 'education',
      type: 'group',
      fields: [text('title')],
    },
    {
      name: 'talks',
      type: 'group',
      fields: [text('title')],
    },
  ],
}
