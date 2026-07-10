import type { Block } from 'payload'

/**
 * Self-contained curation surface (unlike Featured*Block) — Clientes has no
 * site-wide "featured" concept elsewhere, so this block's own `clients`
 * relationship IS the curation mechanism.
 */
export const ClientLogosBlock: Block = {
  slug: 'clientLogosBlock',
  interfaceName: 'ClientLogosBlock',
  labels: { singular: 'Client Logos', plural: 'Client Logos Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'clients',
      type: 'relationship',
      relationTo: 'clientes',
      hasMany: true,
      required: false,
      admin: {
        description: 'Leave empty to show all clients.',
      },
    },
  ],
}
