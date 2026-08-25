// Fetcher de las páginas de SEO local, separado de local-landing-slugs.ts por
// el mismo motivo que separa services-data.ts de service-slugs.ts: este módulo
// importa `getPayload`/`@payload-config` a nivel de módulo, así que cualquier
// consumidor que solo necesite slugs o URLs debe importar del módulo puro para
// no arrastrar el SDK de servidor a un bundle de cliente.
import { getPayload } from 'payload'

import config from '@payload-config'
import { LOCAL_LANDING_SLUGS } from '@/lib/local-landing-slugs'

/**
 * Página de una landing de SEO local.
 *
 * Igual que `getServicePage`: la comprobación contra la lista permitida va
 * ANTES de tocar la base, para que ninguna ruta pueda consultar `pages` con un
 * slug arbitrario, y `overrideAccess: false` para que un borrador no se filtre
 * al footer, que se renderiza en todas las páginas del sitio.
 */
export async function getLocalLandingPage(locale: 'es' | 'en', slug: string) {
  if (!LOCAL_LANDING_SLUGS.includes(slug)) {
    return undefined
  }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    locale,
    limit: 1,
    overrideAccess: false,
  })
  return docs[0]
}
