// Lector de servidor del cierre de conversion (CtaSection). Junta tres fuentes
// del CMS: titulo y lead de `home-page.cta`, el correo de la entrada mailto de
// `contactInfo` del doc `contact` y el avatar del autor del sitio.
//
// NUNCA lanza: ante cualquier error registra y devuelve null, y el cierre se
// omite en la pagina. Un fallo de Payload no debe convertirse en un 500 (T-54-24).
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import { getCachedHomePage, getCachedPageBySlug, type Locale } from '@/lib/cache'
import { CACHE_TAGS, CACHE_TTL_SECONDS } from '@/lib/cache-tags'
import { extractContactEmail } from '@/lib/contact-data'
import { SITE_PERSON_SLUG } from '@/lib/person'

export type CtaData = {
  title: string
  lead: string | null
  email: string
  name: string | null
  avatarUrl: string | null
  /** True cuando la pagina es EN pero el copy del cierre salio en espanol. */
  isFallback: boolean
}

// Avatar y nombre del autor. `overrideAccess: false` y `select` minimo: una
// respuesta cacheada llega a todos los visitantes (mismo criterio que cache.ts).
const getCachedCtaAuthor = unstable_cache(
  async (): Promise<{ name: string | null; avatarUrl: string | null }> => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'authors',
      where: { slug: { equals: SITE_PERSON_SLUG } },
      limit: 1,
      depth: 1,
      overrideAccess: false,
      select: { name: true, avatar: true },
    })
    const author = docs[0]
    const avatar = author?.avatar
    const url = avatar && typeof avatar === 'object' ? avatar.url : null
    return { name: author?.name ?? null, avatarUrl: url ?? null }
  },
  ['cta-author'],
  { tags: [CACHE_TAGS.authors()], revalidate: CACHE_TTL_SECONDS },
)

export async function getCtaData(locale: Locale): Promise<CtaData | null> {
  try {
    const [home, contact, author] = await Promise.all([
      getCachedHomePage(locale),
      getCachedPageBySlug('contact', locale),
      getCachedCtaAuthor(),
    ])
    const title = home.data.cta?.title?.trim()
    if (!title) return null
    // Un solo extractor, con validacion: el mismo que usa la pagina Contacto.
    const email = extractContactEmail(contact)
    if (!email) {
      console.error('[cta]', new Error('el doc contact no trae una entrada mailto en contactInfo'))
      return null
    }
    const lead = home.data.cta?.lead?.trim()
    return {
      title,
      lead: lead ? lead : null,
      email,
      name: author.name,
      avatarUrl: author.avatarUrl,
      isFallback: home.isFallback,
    }
  } catch (err) {
    console.error('[cta]', err)
    return null
  }
}
