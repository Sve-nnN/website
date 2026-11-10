// Funciones de datos de la superficie Autores (fase 55, plan 55-12). Las lecturas
// viven en `getCachedAuthorsIndex`, `getCachedAuthorBySlug`, `getCachedAuthorPosts`
// (src/lib/cache.ts) y `getCachedSpeakingEvents` (src/lib/about-data.ts); este
// modulo solo convierte documentos en props serializables para las vistas y arma
// el JSON-LD Person que antes armaba la ruta del perfil.
//
// Las vistas cliente importan SOLO tipos de aqui (`import type`), asi que nada de
// este modulo llega al bundle del navegador. Ningun import de designs/ ni de
// datos del sandbox (D-02).
//
// D-25: autores y Sobre mi no se unifican, pero comparten el origen de datos de
// Authors y los formateadores de about-data (fechas, parrafos de la bio, titulo
// de ponencia y fotos), para no duplicar la logica ni la bio.
import {
  formatDateRange,
  mapPhoto,
  splitParagraphs,
  splitTalkTitle,
  type AboutDateRange,
  type AboutPhoto,
} from '@/lib/about-data'
import { toPostItems, type BlogPostDocLike, type BlogPostItem } from '@/lib/blog-data'
import { toCaseIndexProps, type CaseDocLike, type CaseIndexItem } from '@/lib/case-study-data'
import { sanitizeHref } from '@/lib/nav-links'
import { buildSitePerson, SITE_PERSON_SLUG } from '@/lib/person'

type Locale = 'es' | 'en'

/** Mismo origen que la ruta del perfil usaba para el nodo Person de otros autores. */
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://juan-tech.com'

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

// ---------------------------------------------------------------------------
// Formas de entrada (documentos de Payload y fixtures)
// ---------------------------------------------------------------------------

type MediaDocLike =
  | { url?: string | null; alt?: string | null; width?: number | null; height?: number | null }
  | number
  | null
  | undefined

/** Forma minima que el indice lee de un autor de `getCachedAuthorsIndex`. */
export type AuthorIndexDocLike = {
  id?: number | string
  slug?: string | null
  name?: string | null
  jobTitle?: string | null
  bio?: string | null
  avatar?: MediaDocLike
  yearsExperience?: number | null
}

type TimelineRowLike = {
  startDate?: string | null
  endDate?: string | null
  description?: string | null
} | null

/** Forma que el perfil lee de un autor de `getCachedAuthorBySlug`. */
export type AuthorProfileDocLike = AuthorIndexDocLike & {
  credentials?: ReadonlyArray<{ label?: string | null } | null> | null
  expertise?: ReadonlyArray<{ topic?: string | null } | null> | null
  education?: ReadonlyArray<
    (TimelineRowLike & { degree?: string | null; institution?: string | null }) | null
  > | null
  experience?: ReadonlyArray<
    (TimelineRowLike & { company?: string | null; role?: string | null }) | null
  > | null
  socialLinks?: ReadonlyArray<{ platform?: string | null; url?: string | null } | null> | null
}

/** Ponencia tal como llega de `getCachedSpeakingEvents`. */
export type AuthorEventDocLike = {
  id?: number | string
  title?: string | null
  role?: string | null
  description?: string | null
  location?: string | null
  attendeeCount?: number | null
  date?: string | null
  link?: string | null
  coSpeakers?: ReadonlyArray<{ name?: string | null } | null> | null
  flyer?: MediaDocLike
}

/** Caso del indice con su autor (id o documento poblado con el nombre). */
export type AuthorCaseDocLike = CaseDocLike & {
  author?: number | { id?: number | string } | null
}

// ---------------------------------------------------------------------------
// Salidas
// ---------------------------------------------------------------------------

export type AuthorAvatar = { url: string; alt: string; width: number; height: number }

export type AuthorIndexItem = {
  slug: string
  name: string
  jobTitle: string | null
  /** Primer parrafo de la bio, o null. La tarjeta lo recorta con line-clamp. */
  excerpt: string | null
  avatar: AuthorAvatar | null
  yearsExperience: number | null
}

/** Experiencia o educacion. `dates` lleva las partes: el conector vive en messages. */
export type AuthorTimelineItem = {
  title: string
  org: string | null
  dates: AboutDateRange | null
  /** Sin fecha de fin o con fin en el futuro: etapa en curso. */
  current: boolean
  description: string | null
}

export type AuthorEventItem = {
  title: string
  by: string | null
  role: string | null
  /** Fecha ISO tal como llega (la vista la formatea con el idioma de la pagina). */
  dateISO: string | null
  location: string | null
  attendees: number | null
  description: string | null
  coSpeakers: string[]
  /** Solo http o https. Un enlace con otro esquema se descarta. */
  link: string | null
  flyer: AboutPhoto | null
}

export type AuthorSocialPlatform = 'linkedin' | 'github' | 'x' | 'website'

/** `href` null cuando la URL del admin no es http ni https: queda solo el texto. */
export type AuthorSocialLink = { platform: AuthorSocialPlatform; href: string | null }

export type AuthorProfileProps = {
  slug: string
  name: string
  jobTitle: string | null
  /** Parrafos de la bio (separados por linea en blanco). */
  paragraphs: string[]
  avatar: AuthorAvatar | null
  yearsExperience: number | null
  credentials: string[]
  expertise: string[]
  experience: AuthorTimelineItem[]
  education: AuthorTimelineItem[]
  events: AuthorEventItem[]
  social: AuthorSocialLink[]
  /** TODOS los posts del autor, sin recorte (SEO-03). */
  posts: BlogPostItem[]
  /** TODOS los casos del autor, sin recorte. */
  cases: CaseIndexItem[]
  /** True para el autor que representa al sitio: muestra el enlace a Sobre mi. */
  isSitePerson: boolean
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

/** Medidas de reserva cuando Media no trae ancho o alto (avatar cuadrado). */
const AVATAR_FALLBACK = { width: 400, height: 400 } as const

/**
 * Avatar con url, ancho, alto y alt. El alt sale de Media y, sin el, del nombre
 * del autor (una foto de persona junto a su nombre). Sin url no hay imagen.
 */
function toAvatar(media: MediaDocLike, fallbackAlt: string): AuthorAvatar | null {
  if (!media || typeof media !== 'object') return null
  const url = text(media.url)
  if (!url) return null
  return {
    url,
    alt: text(media.alt) ?? fallbackAlt,
    width: media.width && media.width > 0 ? media.width : AVATAR_FALLBACK.width,
    height: media.height && media.height > 0 ? media.height : AVATAR_FALLBACK.height,
  }
}

// ---------------------------------------------------------------------------
// Indice
// ---------------------------------------------------------------------------

/**
 * Autores a tarjetas, en el orden recibido. Sin slug o sin nombre no hay tarjeta
 * (no habria a donde enlazar ni que nombrar). `_locale` queda en la firma para
 * que la ruta y el perfil llamen igual.
 */
export function toAuthorsIndexProps(
  docs: ReadonlyArray<AuthorIndexDocLike>,
  _locale: Locale,
): AuthorIndexItem[] {
  const items: AuthorIndexItem[] = []
  for (const doc of docs) {
    const slug = text(doc.slug)
    const name = text(doc.name)
    if (!slug || !name) continue
    items.push({
      slug,
      name,
      jobTitle: text(doc.jobTitle),
      excerpt: splitParagraphs(doc.bio)[0] ?? null,
      avatar: toAvatar(doc.avatar, name),
      yearsExperience: typeof doc.yearsExperience === 'number' ? doc.yearsExperience : null,
    })
  }
  return items
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

function isCurrent(endDate: string | null | undefined, now: number): boolean {
  if (!endDate) return true
  const end = new Date(endDate).getTime()
  return Number.isNaN(end) ? true : end > now
}

function mapTimeline(
  rows: ReadonlyArray<
    | (TimelineRowLike & {
        degree?: string | null
        institution?: string | null
        company?: string | null
        role?: string | null
      })
    | null
  > | null | undefined,
  kind: 'experience' | 'education',
  locale: Locale,
  now: number,
): AuthorTimelineItem[] {
  const items: AuthorTimelineItem[] = []
  for (const row of rows ?? []) {
    if (!row) continue
    // Experiencia: cargo en el h3 y empresa debajo. Educacion: titulo en el h3 e institucion debajo.
    const title = text(kind === 'experience' ? row.role : row.degree)
    if (!title) continue
    const range = formatDateRange(row.startDate, row.endDate, locale)
    items.push({
      title,
      org: text(kind === 'experience' ? row.company : row.institution),
      dates: range.from === '' ? null : range,
      current: isCurrent(row.endDate, now),
      description: text(row.description),
    })
  }
  return items
}

/** Solo http o https: un enlace social no es ni ancla, ni ruta, ni mailto, ni tel (T-55-43). */
export function safeExternalUrl(raw: string | null | undefined, locale: Locale): string | null {
  const href = sanitizeHref(raw, locale)
  return href !== null && /^https?:\/\//i.test(href) ? href : null
}

const PLATFORMS: readonly AuthorSocialPlatform[] = ['linkedin', 'github', 'x', 'website']

function mapSocial(
  rows: AuthorProfileDocLike['socialLinks'],
  locale: Locale,
): AuthorSocialLink[] {
  const links: AuthorSocialLink[] = []
  for (const row of rows ?? []) {
    const platform = row?.platform
    if (!platform || !(PLATFORMS as readonly string[]).includes(platform)) continue
    links.push({
      platform: platform as AuthorSocialPlatform,
      href: safeExternalUrl(row?.url, locale),
    })
  }
  return links
}

function mapEvents(events: ReadonlyArray<AuthorEventDocLike> | null | undefined, locale: Locale): AuthorEventItem[] {
  const items: AuthorEventItem[] = []
  for (const raw of events ?? []) {
    const rawTitle = text(raw?.title)
    if (!rawTitle) continue
    const { title, by } = splitTalkTitle(rawTitle)
    const attendees = raw.attendeeCount
    items.push({
      title,
      by,
      role: text(raw.role),
      dateISO: text(raw.date),
      location: text(raw.location),
      attendees: typeof attendees === 'number' && attendees > 0 ? attendees : null,
      description: text(raw.description),
      coSpeakers: (raw.coSpeakers ?? []).flatMap((c) => {
        const name = text(c?.name)
        return name ? [name] : []
      }),
      link: safeExternalUrl(raw.link, locale),
      flyer: mapPhoto(raw.flyer as Parameters<typeof mapPhoto>[0], { width: 1600, height: 900 }),
    })
  }
  return items
}

/** Casos del autor: los que apuntan a `authorId`, en el orden recibido. Sin limite. */
export function pickAuthorCases<T extends AuthorCaseDocLike>(
  docs: ReadonlyArray<T>,
  authorId: number | string,
): T[] {
  return docs.filter((doc) => {
    const author = doc.author
    const id = author && typeof author === 'object' ? author.id : author
    return id !== null && id !== undefined && String(id) === String(authorId)
  })
}

/**
 * Autor, ponencias, posts y casos a props del perfil. Cada coleccion vacia sale
 * como lista vacia y la vista no pinta su encabezado. `posts` y `cases` entran
 * COMPLETOS: ningun limite de 50 ni revelado en el cliente.
 *
 * `now` se inyecta para que las pruebas fijen el "en curso".
 */
export function toAuthorProfileProps(
  doc: AuthorProfileDocLike,
  events: ReadonlyArray<AuthorEventDocLike> | null | undefined,
  locale: Locale,
  related: {
    posts?: ReadonlyArray<BlogPostDocLike> | null
    cases?: ReadonlyArray<CaseDocLike> | null
  } = {},
  now: number = Date.now(),
): AuthorProfileProps | null {
  const slug = text(doc.slug)
  const name = text(doc.name)
  if (!slug || !name) return null

  const credentials: string[] = []
  for (const row of doc.credentials ?? []) {
    const label = text(row?.label)
    if (label) credentials.push(label)
  }
  const expertise: string[] = []
  for (const row of doc.expertise ?? []) {
    const topic = text(row?.topic)
    if (topic) expertise.push(topic)
  }

  return {
    slug,
    name,
    jobTitle: text(doc.jobTitle),
    paragraphs: splitParagraphs(doc.bio),
    avatar: toAvatar(doc.avatar, name),
    yearsExperience:
      typeof doc.yearsExperience === 'number' && doc.yearsExperience > 0 ? doc.yearsExperience : null,
    credentials,
    expertise,
    experience: mapTimeline(doc.experience, 'experience', locale, now),
    education: mapTimeline(doc.education, 'education', locale, now),
    events: mapEvents(events, locale),
    social: mapSocial(doc.socialLinks, locale),
    posts: toPostItems(related.posts ?? []),
    cases: toCaseIndexProps(related.cases ?? [], locale),
    isSitePerson: slug === SITE_PERSON_SLUG,
  }
}

// ---------------------------------------------------------------------------
// JSON-LD Person (extraido de la ruta del perfil sin cambiar un campo, D-04)
// ---------------------------------------------------------------------------

/** Campos del autor que lee el nodo Person de un autor que no es el del sitio. */
export type AuthorPersonDocLike = {
  slug?: string | null
  name: string
  jobTitle?: string | null
  socialLinks?: ReadonlyArray<{ url: string }> | null
  expertise?: ReadonlyArray<{ topic: string }> | null
  education?: ReadonlyArray<{
    degree: string
    institution: string
    endDate?: string | null
  }> | null
}

/**
 * Nodo Person de cualquier OTRO autor: sin `@id` de sitio, porque no es la
 * entidad del dominio. Es el bloque que la ruta armaba en linea, campo por campo.
 */
export function buildOtherAuthorPersonJsonLd(
  doc: AuthorPersonDocLike,
  siteUrl: string = SITE_URL,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: doc.name,
    jobTitle: doc.jobTitle,
    url: `${siteUrl}/authors/${doc.slug}`,
    ...(doc.socialLinks?.length ? { sameAs: doc.socialLinks.map((s) => s.url) } : {}),
    ...(doc.expertise?.length ? { knowsAbout: doc.expertise.map((e) => e.topic) } : {}),
    ...(doc.education?.length
      ? {
          hasCredential: doc.education
            .filter((ed) => ed.endDate && new Date(ed.endDate).getTime() <= Date.now())
            .map((ed) => ({
              '@type': 'EducationalOccupationalCredential',
              name: ed.degree,
              recognizedBy: { '@type': 'Organization', name: ed.institution },
              datePublished: ed.endDate,
            })),
        }
      : {}),
  }
}

/**
 * SEO-03: el dueno del sitio se emite desde src/lib/person.ts, con el `@id`
 * canonico (`personRef`) que tambien usa la home, para que sean un solo nodo y
 * no dos representaciones sueltas de la misma persona. Ese modulo tambien es el
 * que reparte la educacion entre `hasCredential` y `alumniOf`. Cualquier otro
 * autor arma su nodo con `buildOtherAuthorPersonJsonLd`.
 *
 * `sitePerson` se inyecta solo en las pruebas (la funcion real lee la base).
 */
export async function buildAuthorPersonJsonLd(
  doc: AuthorPersonDocLike,
  locale: Locale,
  sitePerson: (locale: Locale) => Promise<Record<string, unknown>> = buildSitePerson,
): Promise<Record<string, unknown>> {
  return doc.slug === SITE_PERSON_SLUG ? sitePerson(locale) : buildOtherAuthorPersonJsonLd(doc)
}
