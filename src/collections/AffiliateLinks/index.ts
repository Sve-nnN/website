import type { CollectionConfig, FieldAccess } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrActive } from '@/access/authenticatedOrActive'
import { slugField } from '@/fields/slug'
import {
  revalidateAffiliateLinksCache,
  revalidateAffiliateLinksCacheOnDelete,
} from '@/lib/cache-tags'

// Internal-only field gate for `cookieWindowDays`/`commissionNote` — same
// shape as src/fields/targetKeyword.ts's `authenticatedFieldRead`, applied
// directly to each field (NOT wrapped in a `group`, per 46-CONTEXT.md's
// frozen flat-field matrix).
const authenticatedFieldRead: FieldAccess = ({ req: { user } }) => Boolean(user)

// `affiliate-links`: matriz de localización congelada en 46-CONTEXT.md.
// SIN bloque `versions` — `active` (checkbox) reemplaza drafts, no hay
// flujo de revisión editorial para links de afiliado. Hooks de invalidación
// de cache se agregan en 46-01 Task 2, una vez existan los exports de
// cache-tags.ts (evita un import roto entre tasks).
export const AffiliateLinks: CollectionConfig = {
  slug: 'affiliate-links',
  labels: { singular: 'Affiliate Link', plural: 'Affiliate Links' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrActive,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'program', 'active', 'placement'],
  },
  // Hooks wireados directamente acá (no vía `overrides` de plugin): esta
  // colección no está registrada por ningún plugin.
  hooks: {
    afterChange: [revalidateAffiliateLinksCache],
    afterDelete: [revalidateAffiliateLinksCacheOnDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true }, // NO localizado — identificador interno
    slugField('name'),
    {
      name: 'program',
      type: 'select',
      required: true,
      options: ['amazon', 'kinsta', 'dinorank', 'digitalocean', 'other'].map((v) => ({
        label: v,
        value: v,
      })),
    }, // NO localizado
    {
      name: 'destinations',
      type: 'array',
      // NO localizado — resuelto en render por pickDestination(). Sin
      // validación de formato adicional: `required: true` en los subcampos
      // ya cubre la validación esperada (RESEARCH.md ASVS V5).
      fields: [
        { name: 'marketplace', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'cookieWindowDays',
      type: 'number',
      access: { read: authenticatedFieldRead },
    }, // interno
    {
      name: 'commissionNote',
      type: 'text',
      access: { read: authenticatedFieldRead },
    }, // interno
    { name: 'active', type: 'checkbox', defaultValue: false }, // reemplaza drafts
    {
      name: 'placement',
      type: 'select',
      options: ['stack-page', 'inline-post', 'both'].map((v) => ({ label: v, value: v })),
    }, // NO localizado
    { name: 'order', type: 'number' }, // NO localizado, sort opcional
    { name: 'tagline', type: 'text', localized: true },
    { name: 'whyIUseIt', type: 'textarea', localized: true },
    { name: 'disclosureOverride', type: 'textarea', localized: true },
    { name: 'ctaLabel', type: 'text', localized: true },
    // Deliberadamente ausentes: `rel` (se emite desde código en AffiliateLink.tsx)
    // y `price` (nunca un campo, per 46-CONTEXT.md).
  ],
}
