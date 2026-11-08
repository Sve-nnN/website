import type { Field, GlobalConfig } from 'payload'

import { revalidateHomePageCache } from '@/lib/cache-tags'
import { SERVICE_SLUGS } from '@/lib/service-slugs'
import { CONTACT_ICON_NAMES, SERVICE_ICON_NAMES, toSelectOptions } from '@/lib/shadow-icons'

/**
 * Copy nuevo de la home y de Contacto (fase 54, contenido sombra aditivo).
 *
 * Producción (rama master) y el preview comparten la misma base. Todo el copy
 * nuevo vive aquí, en una estructura que master ignora, y nada existente se
 * sobrescribe.
 *
 * Sin `access` y sin `versions` a propósito (T-54-05): el acceso por defecto de
 * un global niega la lectura anónima, así que GET /api/globals/home-page
 * responde 403 y el copy sin aprobar no sale por la API pública. Sin drafts no
 * hay borradores que filtrar.
 *
 * Todo es opcional y sin defaultValue: no se inventa copy. Lo carga un script
 * con el copy aprobado del sandbox.
 */

const text = (name: string, localized = true): Field => ({ name, type: 'text', localized })
const area = (name: string, localized = true): Field => ({ name, type: 'textarea', localized })
const num = (name: string): Field => ({ name, type: 'number' })

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Home (contenido nuevo)',
  admin: {
    group: 'Site',
    description: 'Copy del rediseño de la home y de Contacto. Privado hasta el corte.',
  },
  hooks: {
    afterChange: [revalidateHomePageCache],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        text('eyebrow'),
        text('titleLine1'),
        text('titleLine2'),
        area('lead'),
        text('ctaLabel'),
        text('ctaHref', false),
        text('statValue'),
        text('statCaption'),
      ],
    },
    area('tagline'),
    {
      name: 'vitals',
      type: 'group',
      fields: [
        text('title'),
        area('lead'),
        area('measurementNote'),
        {
          name: 'items',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [
            text('name'),
            text('desc'),
            text('value'),
            text('label'),
            num('goodPct'),
            num('midPct'),
            num('poorPct'),
            num('markerPct'),
            text('note'),
          ],
        },
      ],
    },
    {
      name: 'services',
      type: 'group',
      fields: [
        text('title'),
        area('lead'),
        text('ctaLabel'),
        {
          name: 'items',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'icon',
              type: 'select',
              options: toSelectOptions(SERVICE_ICON_NAMES),
            },
            text('title'),
            area('body'),
            {
              name: 'tags',
              type: 'array',
              admin: { initCollapsed: true },
              fields: [text('tag', false)],
            },
            {
              name: 'servicePage',
              type: 'select',
              options: toSelectOptions(SERVICE_SLUGS),
            },
          ],
        },
      ],
    },
    {
      name: 'cases',
      type: 'group',
      fields: [text('title'), area('lead'), text('ctaLabel'), text('metricSuffix'), area('note')],
    },
    {
      name: 'process',
      type: 'group',
      fields: [
        text('title'),
        {
          name: 'steps',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'icon',
              type: 'select',
              options: toSelectOptions(SERVICE_ICON_NAMES),
            },
            text('title'),
            area('body'),
          ],
        },
      ],
    },
    {
      name: 'sites',
      type: 'group',
      fields: [text('title'), text('ctaLabel'), area('note')],
    },
    {
      name: 'about',
      type: 'group',
      fields: [
        text('title'),
        text('seoLabel'),
        text('devLabel'),
        {
          name: 'paragraphs',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [area('text')],
        },
        {
          name: 'chips',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [text('label')],
        },
        {
          name: 'photos',
          type: 'array',
          admin: {
            initCollapsed: true,
            description: 'El texto alternativo de cada foto sale del campo alt de Media.',
          },
          fields: [{ name: 'image', type: 'upload', relationTo: 'media' }, text('caption')],
        },
      ],
    },
    {
      name: 'testimonials',
      type: 'group',
      fields: [text('title')],
    },
    {
      name: 'faq',
      type: 'group',
      fields: [
        text('title'),
        {
          name: 'items',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [text('question'), area('answer')],
        },
      ],
    },
    {
      name: 'cta',
      type: 'group',
      fields: [text('title'), area('lead')],
    },
    {
      // Cierra el hueco de datos de Contacto declarado en UI-SPEC: "Cómo
      // empezamos" y las tres filas de información.
      name: 'contact',
      type: 'group',
      fields: [
        text('stepsTitle'),
        text('faqTitle'),
        {
          name: 'steps',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [text('title'), area('body')],
        },
        {
          name: 'infoRows',
          type: 'array',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'icon',
              type: 'select',
              options: toSelectOptions(CONTACT_ICON_NAMES),
            },
            text('title'),
            area('text'),
          ],
        },
      ],
    },
  ],
}
