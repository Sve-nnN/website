import type { Field } from 'payload'

import { authenticated } from '@/access/authenticated'

/**
 * Editorial-only "target keyword" reference field, shared between
 * `pages` and `authors`. Read access is restricted to authenticated
 * users — this is internal SEO targeting metadata, not public content,
 * and does not affect SEO meta tags or trigger any external API call.
 */
export const targetKeywordField = (): Field => ({
  name: 'targetKeyword',
  type: 'group',
  label: { en: 'Target Keyword', es: 'Keyword objetivo' },
  access: {
    read: authenticated,
  },
  admin: {
    description: {
      en: 'Editorial reference only — the primary keyword this page/profile is written toward. Does not affect SEO meta tags or trigger any external API call.',
      es: 'Solo referencia editorial — la keyword principal para la que está escrito este contenido. No afecta las meta etiquetas de SEO ni dispara ninguna llamada a una API externa.',
    },
  },
  fields: [
    { name: 'en', type: 'text', label: 'English' },
    { name: 'es', type: 'text', label: 'Español' },
  ],
})
