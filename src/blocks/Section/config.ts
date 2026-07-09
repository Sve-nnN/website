import type { Block } from 'payload'

import { CallToAction } from '../CallToAction/config'
import { Content } from '../Content/config'
import { MediaBlock } from '../MediaBlock/config'
import { ArchiveBlock } from '../ArchiveBlock/config'

// DEVIATION from JuanPortfolio analog: el array `blocks` anidado referencia
// únicamente el set consolidado nuevo (CallToAction/Content/MediaBlock/ArchiveBlock).
// Los bloques del sitio viejo (formulario genérico, tarjetas de trabajos, clientes
// destacados, intro) quedan fuera — DROP-listed o superados según 01-CONTEXT.md.
export const Section: Block = {
  slug: 'section',
  interfaceName: 'SectionBlock',
  labels: {
    singular: 'Section',
    plural: 'Sections',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'container',
          type: 'select',
          defaultValue: 'container',
          options: [
            { label: 'Container', value: 'container' },
            { label: 'Full width', value: 'full' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'paddingY',
          type: 'select',
          defaultValue: 'md',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'backgroundStyle',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Color', value: 'color' },
            { label: 'Image', value: 'image' },
          ],
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'backgroundColor',
      type: 'select',
      options: [
        { label: 'Default', value: 'bg-transparent' },
        { label: 'Muted', value: 'bg-gray-50 dark:bg-card-dark' },
        { label: 'Primary (light)', value: 'bg-blue-50' },
        { label: 'Dark card', value: 'bg-card' },
      ],
      admin: {
        condition: (_, siblingData) => siblingData?.backgroundStyle === 'color',
      },
    },
    {
      name: 'backgroundMedia',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (_, siblingData) => siblingData?.backgroundStyle === 'image',
      },
    },
    {
      name: 'anchorId',
      type: 'text',
      admin: { description: 'ID de ancla para navegación (#mi-seccion)' },
    },
    {
      name: 'className',
      type: 'text',
      admin: { description: 'Clases CSS adicionales (Tailwind)' },
    },
    {
      name: 'blocks',
      label: 'Inner blocks',
      type: 'blocks',
      // No permitimos Section dentro de Section en el MVP para evitar bucles.
      blocks: [CallToAction, Content, MediaBlock, ArchiveBlock],
      localized: true,
    },
  ],
}

export default Section
