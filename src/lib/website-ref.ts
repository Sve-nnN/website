// `@id` del nodo WebSite en un módulo propio: person.ts y site-schema.ts lo
// necesitan y site-schema.ts ya importa la persona.
import { SITE_URL } from '@/lib/sitemap-data'

export const WEBSITE_ID = `${SITE_URL}/#website`

/** Referencia corta al sitio, para el `isPartOf` de una WebPage. */
export const websiteRef = { '@id': WEBSITE_ID }
