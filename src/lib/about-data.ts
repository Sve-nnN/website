// Lector y mapeador de Sobre mí (fase 54, plan 54-13). Junta cuatro fuentes y
// devuelve props serializables para AboutView:
//   - el global `about-page` (copy sombra: hero, áreas, etapas, rótulos),
//   - el autor del sitio (nombre, bio, educación, años de experiencia),
//   - la colección `speaking-events` (ponencias),
//   - el conteo de `clientes` por workType (contadores).
//
// `assembleAboutData` es una función pura: sin llamadas a Payload en su cuerpo,
// así la autoprueba (scripts/verify/54-about-ssr.ts) la alimenta con el copy
// sembrado como fixture. `getAboutData` es la única parte que toca el CMS.
//
// NUNCA lanza por una lectura que falle: cada fuente se protege por separado,
// registra con `console.error('[about]', err)` y deja su sección en null. Solo
// devuelve null (la ruta responde 404) cuando no hay ni global ni autor.
//
// Sobre mí NO es un doc de `pages`: sitemap-data.ts publicaría ese doc en el
// sitemap.xml de producción como una URL que aún devuelve 404 (Pitfall 1).
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { AboutPage, Media } from '@/payload-types'
import { getCachedAboutPage, type Locale, type ShadowPageResult } from '@/lib/cache'
import { CACHE_TTL_SECONDS } from '@/lib/cache-tags'
import { str } from '@/lib/home-data'
import { sanitizeHref } from '@/lib/nav-links'
import { BRAND } from '@/lib/page-title'
import { isPlaceholder } from '@/lib/placeholder'
import { SITE_PERSON_SLUG } from '@/lib/person'
import { ABOUT_CHIP_ICON_NAMES } from '@/lib/shadow-icons'

// --- Tipos de salida (todo serializable) ---

export type AboutPhoto = { url: string; width: number; height: number; alt: string }

export type AboutChip = { icon: 'map-pin' | 'globe' | null; label: string }

export type AboutCounter = { value: number; label: string }

export type AboutStage = {
  /** Fecha tal como llega, incluido el marcador pendiente. Nunca va a título, meta ni aria-label. */
  when: string | null
  role: string
  org: string | null
  body: string | null
  current: boolean
  link: { label: string; href: string; external: boolean } | null
}

export type AboutDateRange = { from: string; to: string | null }

export type AboutEducationItem = {
  degree: string
  institution: string | null
  dates: AboutDateRange | null
}

export type AboutTalk = {
  title: string
  /** Organizador, cuando el título trae el sufijo "(por X)" o "(by X)". */
  by: string | null
  role: string | null
  location: string | null
  attendees: number | null
  description: string | null
  flyer: AboutPhoto | null
}

export type AboutData = {
  /** h1: nombre del autor. */
  name: string
  hero: {
    eyebrow: string | null
    lead: string | null
    chips: AboutChip[]
    photo: AboutPhoto | null
  }
  bio: { title: string | null; paragraphs: string[] } | null
  counters: {
    years: AboutCounter | null
    seo: AboutCounter | null
    dev: AboutCounter | null
  }
  specialties: { title: string; items: { title: string; detail: string | null }[] } | null
  experience: { title: string; lead: string | null; stages: AboutStage[] } | null
  education: { title: string; items: AboutEducationItem[] } | null
  talks: { title: string; items: AboutTalk[] } | null
  /** True cuando la página es EN pero el copy del global salió en español. */
  isFallback: boolean
}

// --- Fechas ---

const DATE_PARTS: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric', timeZone: 'UTC' }

function formatMonthYear(value: string | null | undefined, locale: Locale): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'en' ? 'en' : 'es', DATE_PARTS)
    .format(date)
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Mes abreviado y año de cada fecha, en el idioma pedido. Devuelve las partes
 * y no la frase: el texto de conexión ("a", "to", "a hoy") vive en messages
 * (`about.dateRange` y `about.dateRangeOpen`) y lo arma la vista. Sin fecha de
 * inicio devuelve `from` vacío, y sin fecha de fin `to` es null (etapa abierta).
 */
export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  locale: Locale,
): AboutDateRange {
  const from = formatMonthYear(start, locale)
  if (from === '') return { from: '', to: null }
  const to = formatMonthYear(end, locale)
  return { from, to: to === '' ? null : to }
}

// --- Texto ---

/** Texto útil o null: vacío, solo espacios, no-texto o con la marca [PLACEHOLDER]. */
function text(value: unknown): string | null {
  const s = str(value)
  return s !== null && !isPlaceholder(s) ? s : null
}

/** Párrafos de authors.bio, separados por línea en blanco. */
export function splitParagraphs(bio: unknown): string[] {
  const s = str(bio)
  if (!s) return []
  return s
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p !== '' && !isPlaceholder(p))
}

/** "Taller SEO + IA en Lima (por DinoRANK)" a título y organizador. Sin sufijo, el título queda entero. */
export function splitTalkTitle(raw: string): { title: string; by: string | null } {
  const match = /^(.*?)\s*\((?:por|by)\s+([^)]+)\)\s*$/i.exec(raw)
  if (!match || !match[1] || !match[2]) return { title: raw, by: null }
  return { title: match[1].trim(), by: match[2].trim() }
}

// --- Medios ---

type MediaLike = Pick<Media, 'url' | 'width' | 'height' | 'alt'> | number | null | undefined

/** Dimensiones de la foto de la spec (UI-SPEC, Sobre mí): se usan solo si Media no trae ancho o alto. */
const PHOTO_DEFAULT: { width: number; height: number } = { width: 1122, height: 1402 }

/**
 * Foto con url, ancho, alto y alt de Media. Sin url o sin alt devuelve null:
 * el alt es borrador que Juan confirmó antes de subir la foto (T-54-56), y una
 * imagen informativa sin alt no se renderiza.
 */
export function mapPhoto(media: MediaLike, fallbackSize = PHOTO_DEFAULT): AboutPhoto | null {
  if (!media || typeof media !== 'object') return null
  const url = str(media.url)
  const alt = text(media.alt)
  if (!url || !alt) return null
  return {
    url,
    alt,
    width: media.width && media.width > 0 ? media.width : fallbackSize.width,
    height: media.height && media.height > 0 ? media.height : fallbackSize.height,
  }
}

// --- Mapeo de cada fuente ---

function mapChips(hero: AboutPage['hero'] | undefined): AboutChip[] {
  const chips: AboutChip[] = []
  for (const raw of hero?.chips ?? []) {
    const label = text(raw?.label)
    if (!label) continue
    const icon = raw?.icon
    chips.push({
      icon: icon && (ABOUT_CHIP_ICON_NAMES as readonly string[]).includes(icon) ? icon : null,
      label,
    })
  }
  return chips
}

function mapStages(about: Partial<AboutPage>, locale: Locale): AboutStage[] {
  const stages: AboutStage[] = []
  for (const raw of about.experience?.stages ?? []) {
    const role = text(raw?.role)
    if (!role) continue
    const linkLabel = text(raw?.linkLabel)
    // T-54-53: el href escrito en el CMS pasa por sanitizeHref antes de llegar a un botón.
    const linkHref = sanitizeHref(raw?.linkHref, locale)
    stages.push({
      when: str(raw?.when),
      role,
      org: text(raw?.org),
      body: text(raw?.body),
      current: raw?.current === true,
      link:
        linkLabel && linkHref
          ? { label: linkLabel, href: linkHref, external: /^https?:/i.test(linkHref) }
          : null,
    })
  }
  return stages
}

type AuthorLike = {
  name?: string | null
  bio?: string | null
  yearsExperience?: number | null
  education?: ReadonlyArray<{
    degree?: string | null
    institution?: string | null
    startDate?: string | null
    endDate?: string | null
  } | null> | null
}

type EventLike = {
  title?: string | null
  role?: string | null
  description?: string | null
  location?: string | null
  attendeeCount?: number | null
  flyer?: MediaLike
}

export type AboutCounts = { seo: number | null; dev: number | null }

function counter(value: number | null | undefined, label: string | null): AboutCounter | null {
  // Una tarjeta sin valor (o sin rótulo) no se renderiza: ni "0" ni "4+" inventados.
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || !label) return null
  return { value, label }
}

/**
 * Las cuatro fuentes a props. Cualquiera puede venir null: la sección que
 * depende de ella sale null o vacía y la vista no la dibuja.
 */
export function assembleAboutData(input: {
  about: ShadowPageResult<Partial<AboutPage>> | null
  author: AuthorLike | null
  events: ReadonlyArray<EventLike> | null
  counts: AboutCounts | null
  locale: Locale
}): AboutData {
  const { about, author, events, counts, locale } = input
  const data = about?.data ?? null

  const paragraphs = splitParagraphs(author?.bio)
  const bioTitle = text(data?.bio?.title)

  const specialtyTitle = text(data?.specialties?.title)
  const specialtyItems = (data?.specialties?.items ?? []).flatMap((raw) => {
    const title = text(raw?.title)
    return title ? [{ title, detail: text(raw?.detail) }] : []
  })

  const experienceTitle = text(data?.experience?.title)
  const stages = data ? mapStages(data, locale) : []

  const educationTitle = text(data?.education?.title)
  const educationItems = (author?.education ?? []).flatMap((raw): AboutEducationItem[] => {
    const degree = text(raw?.degree)
    if (!degree) return []
    const range = formatDateRange(raw?.startDate, raw?.endDate, locale)
    return [
      {
        degree,
        institution: text(raw?.institution),
        dates: range.from === '' ? null : range,
      },
    ]
  })

  const talksTitle = text(data?.talks?.title)
  const talkItems = (events ?? []).flatMap((raw): AboutTalk[] => {
    const rawTitle = text(raw?.title)
    if (!rawTitle) return []
    const { title, by } = splitTalkTitle(rawTitle)
    const attendees = raw?.attendeeCount
    return [
      {
        title,
        by,
        role: text(raw?.role),
        location: text(raw?.location),
        attendees: typeof attendees === 'number' && attendees > 0 ? attendees : null,
        description: text(raw?.description),
        flyer: mapPhoto(raw?.flyer, { width: 1600, height: 900 }),
      },
    ]
  })

  return {
    name: text(author?.name) ?? BRAND,
    hero: {
      eyebrow: text(data?.hero?.eyebrow),
      lead: text(data?.hero?.lead),
      chips: mapChips(data?.hero),
      photo: mapPhoto(data?.hero?.photo),
    },
    bio: paragraphs.length > 0 ? { title: bioTitle, paragraphs } : null,
    counters: {
      years: counter(author?.yearsExperience, text(data?.counters?.yearsLabel)),
      seo: counter(counts?.seo, text(data?.counters?.seoLabel)),
      dev: counter(counts?.dev, text(data?.counters?.devLabel)),
    },
    specialties:
      specialtyTitle && specialtyItems.length > 0
        ? { title: specialtyTitle, items: specialtyItems }
        : null,
    experience:
      experienceTitle && stages.length > 0
        ? { title: experienceTitle, lead: text(data?.experience?.lead), stages }
        : null,
    education:
      educationTitle && educationItems.length > 0
        ? { title: educationTitle, items: educationItems }
        : null,
    talks: talksTitle && talkItems.length > 0 ? { title: talksTitle, items: talkItems } : null,
    isFallback: about ? about.isFallback : false,
  }
}

// --- Lecturas del CMS ---
//
// SEGURIDAD: `overrideAccess: false` y `select` mínimo en cada lectura de
// colección. Una respuesta cacheada llega a todos los visitantes (mismo
// criterio que cache.ts y cta-data.ts).

const getCachedAboutAuthor = (locale: Locale) =>
  unstable_cache(
    async (): Promise<AuthorLike | null> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'authors',
        where: { slug: { equals: SITE_PERSON_SLUG } },
        locale,
        limit: 1,
        depth: 0,
        overrideAccess: false,
        select: {
          name: true,
          jobTitle: true,
          bio: true,
          education: true,
          yearsExperience: true,
        },
      })
      return (docs[0] as AuthorLike | undefined) ?? null
    },
    ['about-author', locale],
    { revalidate: CACHE_TTL_SECONDS },
  )()

const getCachedAboutEvents = (locale: Locale) =>
  unstable_cache(
    async (): Promise<EventLike[]> => {
      const payload = await getPayload({ config })
      const { docs } = await payload.find({
        collection: 'speaking-events',
        locale,
        sort: '-date',
        limit: 20,
        depth: 1,
        pagination: false,
        overrideAccess: false,
        select: {
          title: true,
          role: true,
          description: true,
          location: true,
          attendeeCount: true,
          date: true,
          coSpeakers: true,
          flyer: true,
        },
      })
      return docs as EventLike[]
    },
    ['about-events', locale],
    { revalidate: CACHE_TTL_SECONDS },
  )()

const getCachedAboutCounts = unstable_cache(
  async (): Promise<AboutCounts> => {
    const payload = await getPayload({ config })
    const [seo, dev] = await Promise.all(
      (['seo', 'desarrollo'] as const).map((workType) =>
        payload.count({
          collection: 'clientes',
          where: { workType: { equals: workType } },
          overrideAccess: false,
        }),
      ),
    )
    return { seo: seo.totalDocs, dev: dev.totalDocs }
  },
  ['about-counts'],
  { revalidate: CACHE_TTL_SECONDS },
)

/** Ejecuta una lectura y, si lanza, registra y devuelve null (T-54-55: sin 500). */
async function guarded<T>(read: () => Promise<T>): Promise<T | null> {
  try {
    return await read()
  } catch (err) {
    console.error('[about]', err)
    return null
  }
}

/**
 * Lee las cuatro fuentes por las capas cacheadas y las junta. Devuelve null si
 * no hay ni global ni autor (la ruta responde 404). Cualquier otro fallo deja
 * solo esa sección fuera.
 */
export async function getAboutData(locale: Locale): Promise<AboutData | null> {
  const [about, author, events, counts] = await Promise.all([
    guarded(() => getCachedAboutPage(locale)),
    guarded(() => getCachedAboutAuthor(locale)),
    guarded(() => getCachedAboutEvents(locale)),
    guarded(() => getCachedAboutCounts()),
  ])
  if (!about && !author) return null
  return assembleAboutData({ about, author, events, counts, locale })
}
