import type { Block } from 'payload'

import { linkGroup } from '@/fields/linkGroup'

/**
 * The one action the home page asks for: request the technical audit.
 *
 * WHY IT IS PAID, AND WHY THE PRICE IS VISIBLE — "auditoría gratis" is the
 * entry door of the entire category (manufraga.net: "Análisis SEO inicial
 * completamente gratuito"; tuconsultorseo.pe: "Auditoría SEO gratis"). Of the
 * eight direct competitors researched, the only one who charges and publishes
 * a price is also the only one with an engineering-shaped offer —
 * ingenieroSEO, with defined tiers, scope and delivery times. Nobody in Lima
 * publishes a price at all. Showing one is therefore both a differentiator
 * and consistent with a site whose argument is that it opens the code.
 *
 * `price` is a CMS field on purpose. Juan set 600 USD to start and expects to
 * raise it as demand builds; that must never require a developer, a deploy,
 * or a conversation with an agent. Same for `creditNote`, which carries the
 * mechanic that removes the buyer's risk: the audit fee is credited in full
 * against the implementation. The audit is not the product — it is the filter
 * that sells the build, which is the part no competitor can deliver.
 */
export const AuditOfferBlock: Block = {
  slug: 'auditOfferBlock',
  interfaceName: 'AuditOfferBlock',
  labels: { singular: 'Audit Offer', plural: 'Audit Offer Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'text',
          localized: true,
          admin: {
            width: '50%',
            description:
              'El precio, tal cual se muestra. Ej: "600 USD". Editable desde acá justamente para poder subirlo sin tocar código.',
          },
        },
        {
          name: 'priceCaption',
          type: 'text',
          localized: true,
          admin: {
            width: '50%',
            description: 'Qué es ese precio. Ej: "Auditoría SEO técnica completa".',
          },
        },
      ],
    },
    {
      name: 'creditNote',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'La mecánica del crédito: el importe se descuenta al contratar la implementación. Es lo que saca el riesgo de la decisión, así que va visible, no en letra chica.',
      },
    },
    {
      name: 'includes',
      type: 'array',
      labels: { singular: 'Punto', plural: 'Puntos' },
      admin: {
        description:
          'Qué incluye la auditoría. Concreto y verificable: el visitante está por pagar, y lo vago es lo que hace dudar.',
      },
      fields: [
        {
          name: 'item',
          type: 'text',
          localized: true,
          required: true,
        },
      ],
    },
    {
      name: 'deliveryNote',
      type: 'text',
      localized: true,
      admin: { description: 'Plazo de entrega. Ej: "Entrega en 10 días hábiles".' },
    },
    linkGroup({
      appearances: ['default', 'outline'],
      overrides: {
        maxRows: 2,
        admin: {
          description: 'El CTA. Uno solo en primario: la portada pide una única acción.',
          initCollapsed: true,
        },
      },
    }),
  ],
}
