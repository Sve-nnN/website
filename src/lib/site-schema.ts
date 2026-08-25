// Los nodos de entidad del sitio: `WebSite` y `ProfessionalService` (issue #48).
//
// Hasta ahora la home emitía únicamente el `Person` de src/lib/person.ts. Eso
// deja dos cosas sin declarar en ningún lado del dominio:
//
//   1. El sitio como obra. Sin un `WebSite`, nada dice que juan-tech.com es una
//      publicación con nombre propio, ni en qué idiomas existe.
//   2. El negocio. La persona tiene un `jobTitle`, pero "vende auditorías SEO"
//      no está declarado como servicio en ninguna parte, y es lo que necesita
//      resolver cualquier buscador generativo al que le pregunten quién hace
//      SEO técnico en Lima o en Madrid.
//
// Los tres nodos comparten `@id` y se referencian entre sí, en vez de repetir
// la misma persona tres veces, siguiendo la decisión que ya tomó person.ts.
//
// Sin `SearchAction` a propósito: la caja de búsqueda de sitelinks que ese nodo
// habilitaba fue retirada por Google, así que emitirlo sería declarar algo que
// ya no lee nadie.
import type { Locale } from '@/lib/cache'
import { PERSON_ID, personRef } from '@/lib/person'
import { SITE_URL } from '@/lib/sitemap-data'

export const WEBSITE_ID = `${SITE_URL}/#website`
export const BUSINESS_ID = `${SITE_URL}/#business`

/** Referencia corta al sitio, para el `isPartOf` de una WebPage. */
export const websiteRef = { '@id': WEBSITE_ID }

const COPY = {
  es: {
    name: 'Juan Tech',
    description:
      'Blog técnico bilingüe y portfolio de Juan Carlos Angulo, ingeniero de software y consultor SEO técnico.',
    serviceName: 'Juan Carlos Angulo — SEO técnico y desarrollo web',
    serviceDescription:
      'Auditoría SEO técnica, consultoría SEO, desarrollo full-stack con Next.js y Payload CMS, y optimización para buscadores con IA.',
  },
  en: {
    name: 'Juan Tech',
    description:
      'Bilingual technical blog and portfolio of Juan Carlos Angulo, software engineer and technical SEO consultant.',
    serviceName: 'Juan Carlos Angulo — Technical SEO and web development',
    serviceDescription:
      'Technical SEO audits, SEO consulting, full-stack development with Next.js and Payload CMS, and optimisation for AI search engines.',
  },
} as const

/**
 * El sitio como obra publicada.
 *
 * `inLanguage` lleva los dos idiomas y no el de la página: el nodo describe el
 * sitio entero, que existe en español e inglés, no la variante que se está
 * sirviendo. La página individual ya declara su idioma en el `<html lang>` y en
 * el `inLanguage` de su propio Article.
 */
export function buildWebSite(locale: Locale): Record<string, unknown> {
  const t = COPY[locale]

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: t.name,
    url: SITE_URL,
    description: t.description,
    inLanguage: ['es', 'en'],
    publisher: personRef,
    author: personRef,
  }
}

/**
 * El negocio.
 *
 * `ProfessionalService` y no `Organization`: lo que se ofrece son servicios
 * profesionales prestados por una persona, no una empresa con estructura.
 *
 * Sin `address` ni `telephone`, porque no existen: es un freelance sin oficina
 * pública y el sitio no publica un teléfono. Inventar un NAP para completar el
 * nodo es exactamente el tipo de dato que después no coincide con ninguna otra
 * fuente. `areaServed` sí se declara, y sale de algo que el sitio ya sostiene:
 * hay landings propias de SEO técnico para Lima y para Madrid.
 *
 * `founder` y `employee` apuntan al `@id` de la persona en vez de repetirla, así
 * los tres nodos del dominio son uno solo para quien los lea.
 *
 * Sobre qué propiedades entran acá: el validador de schema.org marca
 * `provider`, `availableLanguage` e `isPartOf` como impropias de este tipo, y
 * tiene razón. `provider` es de `Service`, no del negocio que lo presta;
 * `availableLanguage` es de `ContactPoint`/`Service`, y el equivalente para una
 * organización es `knowsLanguage`; `isPartOf` es de `CreativeWork`, y un
 * negocio no es parte de un sitio web. El enlace en esa dirección lo hace el
 * `WebSite` a través de su `publisher`.
 */
export function buildProfessionalService(locale: Locale): Record<string, unknown> {
  const t = COPY[locale]

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': BUSINESS_ID,
    name: t.serviceName,
    url: SITE_URL,
    description: t.serviceDescription,
    founder: personRef,
    employee: personRef,
    areaServed: [
      { '@type': 'City', name: 'Lima' },
      { '@type': 'City', name: 'Madrid' },
    ],
    knowsLanguage: [
      { '@type': 'Language', name: 'Spanish', alternateName: 'es' },
      { '@type': 'Language', name: 'English', alternateName: 'en' },
    ],
    mainEntityOfPage: `${SITE_URL}/servicios`,
  }
}

/**
 * El servicio de una landing de SEO local (issue #42).
 *
 * Las cuatro landings no tenían NINGÚN dato estructurado, ni siquiera
 * BreadcrumbList, cuando el resto del sitio sí lo tiene. Y son justo las
 * páginas que más ganan con `Service` + `areaServed`, porque lo que se pregunta
 * en esas búsquedas es quién presta este servicio en esta ciudad.
 *
 * `provider` sí corresponde acá: en `Service` es la propiedad correcta para
 * apuntar a quién lo presta, al revés de lo que pasaba en el nodo del negocio.
 * Referencia el `@id` del `ProfessionalService` en vez de repetirlo, así la
 * landing suma al mismo nodo en vez de crear un negocio nuevo por ciudad.
 *
 * `serviceType` es texto libre, y el que va es el que la página realmente
 * ofrece, no una categoría inventada para llenar el campo.
 */
export function buildLocalService(params: {
  locale: Locale
  city: string
  country: string
  name: string
  description?: string
  url: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${params.url}#service`,
    name: params.name,
    ...(params.description ? { description: params.description } : {}),
    serviceType: params.locale === 'es' ? 'SEO técnico' : 'Technical SEO',
    provider: { '@id': BUSINESS_ID },
    url: params.url,
    areaServed: {
      '@type': 'City',
      name: params.city,
      containedInPlace: { '@type': 'Country', name: params.country },
    },
  }
}

/** El `@id` de la persona, reexportado para no importar dos módulos por lo mismo. */
export { PERSON_ID }
