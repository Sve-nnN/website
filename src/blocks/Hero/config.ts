import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'home',
      options: [
        { label: 'Home', value: 'home' },
        { label: 'Listing', value: 'listing' },
        { label: 'Post Header', value: 'post-header' },
        { label: 'Case Study Header', value: 'case-study-header' },
        { label: 'Local Landing', value: 'local-landing' },
      ],
    },
    { name: 'title', type: 'text', localized: true },
    { name: 'subtitle', type: 'text', localized: true },
    { name: 'media', type: 'upload', relationTo: 'media' },
    linkGroup({
      appearances: ['default', 'outline'],
      overrides: {
        admin: {
          description: 'Optional CTA buttons rendered below the hero copy.',
          initCollapsed: true,
        },
        maxRows: 2,
      },
    }),
    {
      name: 'breadcrumbs',
      type: 'array',
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'listing',
        description: 'Optional breadcrumb trail, only rendered on the Listing variant.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'label',
              type: 'text',
              localized: true,
              required: true,
              admin: { width: '50%' },
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'cityName',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'local-landing',
        description: 'Nombre de la ciudad mostrado en el badge (ej: "Madrid"). Solo variante Local Landing.',
      },
    },
    {
      name: 'inlineStat',
      type: 'text',
      localized: true,
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'local-landing',
        description: 'Texto del stat inline junto al check-icon (ej: "+40 proyectos entregados"). Solo variante Local Landing.',
      },
    },
    {
      name: 'ringSide',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Izquierda', value: 'left' },
        { label: 'Derecha', value: 'right' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'local-landing',
        description: 'Lado donde se posiciona el anillo decorativo. Solo variante Local Landing.',
      },
    },
    {
      name: 'ringOpacity',
      type: 'number',
      defaultValue: 0.25,
      min: 0,
      max: 1,
      admin: {
        step: 0.05,
        condition: (_, siblingData) => siblingData?.variant === 'local-landing',
        description: 'Opacidad del anillo decorativo (0 a 1). Solo variante Local Landing.',
      },
    },
    {
      name: 'ringFlipX',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: (_, siblingData) => siblingData?.variant === 'local-landing',
        description: 'Espeja el anillo decorativo horizontalmente. Solo variante Local Landing.',
      },
    },
  ],
}
