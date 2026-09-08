import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

/**
 * Identidad de cada PDF de lead magnet (uno por locale) subido a Cloudinary
 * como recurso privado (`resource_type:'raw', type:'authenticated'`).
 *
 * ACCESO CERRADO A PROPÓSITO, mismo criterio que `Subscribers`: las 4
 * operaciones piden usuario autenticado, porque `cloudinaryPublicId` es
 * exactamente el dato que una URL firmada necesita para servir el archivo —
 * no debería ser legible por la API pública de Payload. La entrega real pasa
 * por `secure-download.ts` (server-side, MAIL-03), nunca por REST.
 */
export const LeadMagnets: CollectionConfig = {
  slug: 'lead-magnets',
  labels: { singular: 'Lead Magnet', plural: 'Lead Magnets' },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Site',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'locale', 'fileName'],
    description:
      'PDFs de lead magnet, uno por locale. El public_id de Cloudinary lo escribe el script de subida — no editar a mano.',
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description:
          'Identificador interno fijo (ej. "seo-audit-checklist") — nunca una URL pública.',
      },
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
      ],
    },
    {
      name: 'cloudinaryPublicId',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
        description: 'Nunca editar a mano — lo escribe el script de subida.',
      },
    },
    {
      name: 'fileName',
      type: 'text',
      required: true,
      admin: { description: 'Nombre de archivo con el que se ofrece la descarga.' },
    },
  ],
}
