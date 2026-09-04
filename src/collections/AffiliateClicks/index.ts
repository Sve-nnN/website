import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

/**
 * Log append-only de clics reales sobre `/go/[slug]` (GO-04).
 *
 * `create`/`update` en `() => false` A PROPÓSITO, no por convención: es el
 * mecanismo estructural que impide un `UPDATE ... clicks + 1` o cualquier
 * edición posterior de una fila ya escrita. El route handler
 * (`src/app/go/[slug]/route.ts`) escribe igual porque el Local API por
 * defecto corre con `overrideAccess: true` cuando no se pasa
 * `overrideAccess: false` explícito — mismo mecanismo verbatim que ya usa
 * `src/app/actions/subscribe.tsx` contra `Subscribers`.
 *
 * `slug` se guarda como texto plano, NO como `relationship` a
 * `affiliate-links`: el log debe sobrevivir si el doc de `affiliate-links` se
 * borra después.
 *
 * Sin `clickedAt`: el `createdAt` automático de Payload ya es el timestamp
 * del clic — un campo redundante duplicaría el dato.
 *
 * Sin IP cruda (LEG-04, 47-RESEARCH.md Open Question 2): la IP solo vive en
 * memoria del proceso para el throttle (src/lib/ip-throttle.ts), nunca se
 * persiste acá.
 */
export const AffiliateClicks: CollectionConfig = {
  slug: 'affiliate-clicks',
  labels: { singular: 'Affiliate Click', plural: 'Affiliate Clicks' },
  access: {
    create: () => false,
    read: authenticated,
    update: () => false,
    delete: authenticated,
  },
  admin: {
    group: 'Site',
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'userAgent', 'createdAt'],
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'A qué affiliate-links.slug corresponde el clic (guardado como string plano).',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: { description: 'User-Agent del request. Sin IP cruda por diseño.' },
    },
  ],
}
