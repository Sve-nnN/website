// Una sola entidad Person para todo el sitio (issue #3.3).
//
// Hasta ahora convivían dos representaciones distintas de la misma persona en
// el mismo dominio: la home emitía un Person de cuatro propiedades (name,
// jobTitle, url) y /authors/juan-carlos-angulo uno completo con sameAs,
// knowsAbout y credenciales. Para Google son dos nodos sueltos que hay que
// adivinar que son el mismo, y "Juan Carlos Angulo" ya colisiona con otras
// personas reales en los resultados de búsqueda.
//
// La solución es un `@id` canónico compartido: las dos páginas emiten el mismo
// nodo, y cualquier `author` de un Article puede referenciarlo por `@id` en vez
// de repetir un objeto suelto.
//
// El contenido sale del doc de `authors`, no de constantes acá: el CMS ya es la
// fuente de verdad de los perfiles, el bio y el avatar, y duplicarlos en código
// garantiza que en algún momento digan cosas distintas.
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Author, Media } from '@/payload-types'
import { SITE_URL } from '@/lib/sitemap-data'
import { CACHE_TTL_SECONDS } from '@/lib/cache-tags'
import type { Locale } from '@/lib/cache'

/** Slug del autor que representa al dueño del sitio. */
export const SITE_PERSON_SLUG = 'juan-carlos-angulo'

/**
 * Identificador canónico de la entidad. Vive en la raíz del sitio y no en
 * /authors, porque la persona es la entidad del dominio entero y no el
 * contenido de una página.
 */
export const PERSON_ID = `${SITE_URL}/#person`

/** Referencia corta, para el `author` de un Article o un CreativeWork. */
export const personRef = { '@id': PERSON_ID }

function resolveAvatarUrl(avatar: Author['avatar']): string | null {
  if (!avatar || typeof avatar !== 'object') return null
  const url = (avatar as Media).url
  if (!url) return null
  return url.startsWith('http') ? url : `${SITE_URL}${url}`
}

const getCachedSitePerson = unstable_cache(
  async (locale: Locale): Promise<Author | null> => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'authors',
      where: { slug: { equals: SITE_PERSON_SLUG } },
      locale,
      limit: 1,
      // Misma razón que el resto de src/lib/cache.ts: el Local API por defecto
      // saltea las reglas de acceso, y una respuesta cacheada amplifica
      // cualquier filtración a todos los visitantes.
      overrideAccess: false,
    })
    return docs[0] ?? null
  },
  ['site-person'],
  { revalidate: CACHE_TTL_SECONDS },
)

/**
 * Nodo Person completo, para emitir una vez por página.
 *
 * Cada clave se omite si el CMS no la tiene: un `sameAs: []` o una
 * `description: ""` no aportan nada y las Structured Data Guidelines de Google
 * piden no afirmar lo que no hay.
 */
export async function buildSitePerson(locale: Locale): Promise<Record<string, unknown>> {
  const doc = await getCachedSitePerson(locale)

  const fallbackJobTitle =
    locale === 'es' ? 'Ingeniero de Software y Experto SEO' : 'Software Engineer & SEO Expert'

  if (!doc) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      '@id': PERSON_ID,
      name: 'Juan Carlos Angulo',
      jobTitle: fallbackJobTitle,
      url: SITE_URL,
    }
  }

  const image = resolveAvatarUrl(doc.avatar)
  const sameAs = doc.socialLinks?.map((link) => link.url).filter(Boolean) ?? []

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: doc.name,
    jobTitle: doc.jobTitle ?? fallbackJobTitle,
    url: SITE_URL,
    // La ficha de autor es la página que describe a la entidad; la home la
    // menciona pero no trata sobre ella.
    mainEntityOfPage: `${SITE_URL}/authors/${doc.slug ?? SITE_PERSON_SLUG}`,
    ...(sameAs.length ? { sameAs } : {}),
    ...(image ? { image } : {}),
    ...(doc.bio ? { description: doc.bio } : {}),
    ...(doc.expertise?.length ? { knowsAbout: doc.expertise.map((e) => e.topic) } : {}),
    ...buildEducationProps(doc.education),
  }
}

/**
 * Educación: separa lo terminado de lo que está en curso (issue #3.1).
 *
 * El schema emitía `hasCredential` con `datePublished: 2028-08-01`, dos años en
 * el futuro. Una credencial con fecha futura afirma un título que todavía no
 * existe, que es exactamente lo que el pilar Trustworthiness de E-E-A-T mira.
 *
 * Una carrera en curso no es una credencial obtenida: se declara como
 * `alumniOf`, que dice la relación con la institución sin afirmar un título ni
 * una fecha. Cuando el `endDate` pase, la misma entrada empieza a emitirse como
 * `hasCredential` sin tocar nada.
 */
function buildEducationProps(education: Author['education']): Record<string, unknown> {
  if (!education?.length) return {}

  const now = Date.now()
  const completed = education.filter((ed) => ed.endDate && new Date(ed.endDate).getTime() <= now)
  const inProgress = education.filter((ed) => !ed.endDate || new Date(ed.endDate).getTime() > now)

  return {
    ...(completed.length
      ? {
          hasCredential: completed.map((ed) => ({
            '@type': 'EducationalOccupationalCredential',
            name: ed.degree,
            recognizedBy: { '@type': 'Organization', name: ed.institution },
            datePublished: ed.endDate,
          })),
        }
      : {}),
    ...(inProgress.length
      ? {
          alumniOf: inProgress.map((ed) => ({
            '@type': 'CollegeOrUniversity',
            name: ed.institution,
          })),
        }
      : {}),
  }
}
