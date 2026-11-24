// Lector y mapeador de la home (fase 54, plan 54-08). Convierte el global
// `home-page` en props tipadas y serializables para HomeView.
//
// `mapHomeGlobal` es una funcion pura: sin imports de Payload en su cuerpo, asi
// la autoprueba (scripts/verify/54-home-ssr.ts) la alimenta con el copy
// sembrado como fixture. `getHomeData` es la unica parte que toca el CMS y
// NUNCA lanza: ante un error registra y devuelve todas las secciones en null,
// para que la home no responda 500 (T-54-33).
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { MarqueeLogo } from '@/components/mui/LogoMarquee'
import { getCachedHomePage, type Locale } from '@/lib/cache'
import { CACHE_TAGS, CACHE_TTL_SECONDS } from '@/lib/cache-tags'
import { emptySectionsB, getHomeSectionsB, type HomeSectionsB } from '@/lib/home-data-b'
import { sanitizeHref } from '@/lib/nav-links'
import { SERVICE_ICON_NAMES } from '@/lib/shadow-icons'
import { isServiceSlug, type ServiceSlug } from '@/lib/service-slugs'
import type { Cliente, HomePage, Media } from '@/payload-types'

export type HomeHero = {
  eyebrow: string | null
  titleLine1: string
  titleLine2: string | null
  lead: string | null
  ctaLabel: string | null
  /** Destino ya saneado con sanitizeHref. null deja el boton sin enlace. */
  ctaHref: string | null
  statValue: string | null
  statCaption: string | null
}

export type VitalItem = {
  name: string
  desc: string | null
  value: string | null
  label: string | null
  goodPct: number
  midPct: number
  poorPct: number
  markerPct: number
  note: string | null
}

export type HomeVitals = {
  title: string
  lead: string | null
  measurementNote: string | null
  items: VitalItem[]
}

export type ServiceItem = {
  /** Nombre de icono validado contra SERVICE_ICON_NAMES, o null. */
  icon: string | null
  title: string
  body: string | null
  tags: string[]
  /** Slug validado de la pagina del servicio. La vista arma el href con buildServiceHref. */
  servicePage: ServiceSlug | null
}

export type HomeServices = {
  title: string
  lead: string | null
  ctaLabel: string | null
  items: ServiceItem[]
}

export type HomeClients = {
  title: string
  logos: MarqueeLogo[]
}

export type HomeData = {
  hero: HomeHero | null
  tagline: string | null
  vitals: HomeVitals | null
  services: HomeServices | null
  /** Marquesina de logos: clientes con logo y titulo de clientLogosBlock. null sin logos. */
  clients: HomeClients | null
  /** Segunda mitad de la home (plan 54-14): proceso, casos, sitios, sobre mi, testimonios, FAQ, bloques existentes y cierre. */
  sectionsB: HomeSectionsB
  /** True cuando la pagina es EN pero el copy del global salio en espanol. */
  isFallback: boolean
}

/** Cadena con contenido o null (vacio, solo espacios o un valor que no es texto). */
export function str(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

export function emptyHomeData(): HomeData {
  return {
    hero: null,
    tagline: null,
    vitals: null,
    services: null,
    clients: null,
    sectionsB: emptySectionsB(),
    isFallback: false,
  }
}

function mapHero(hero: HomePage['hero'], locale: Locale): HomeHero | null {
  if (!hero) return null
  const titleLine1 = str(hero.titleLine1)
  const titleLine2 = str(hero.titleLine2)
  // Sin ninguna linea de titulo no hay h1 que mostrar: la seccion se omite y la
  // vista emite el h1 de respaldo.
  if (!titleLine1 && !titleLine2) return null
  return {
    eyebrow: str(hero.eyebrow),
    titleLine1: titleLine1 ?? (titleLine2 as string),
    titleLine2: titleLine1 ? titleLine2 : null,
    lead: str(hero.lead),
    ctaLabel: str(hero.ctaLabel),
    ctaHref: sanitizeHref(hero.ctaHref, locale),
    statValue: str(hero.statValue),
    statCaption: str(hero.statCaption),
  }
}

/** Numero finito o 0 (un valor que falta o no es numerico no rompe la barra). */
function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function mapVitals(vitals: HomePage['vitals']): HomeVitals | null {
  if (!vitals) return null
  const title = str(vitals.title)
  const items: VitalItem[] = []
  for (const raw of vitals.items ?? []) {
    const name = str(raw.name)
    if (!name) continue
    items.push({
      name,
      desc: str(raw.desc),
      value: str(raw.value),
      label: str(raw.label),
      goodPct: num(raw.goodPct),
      midPct: num(raw.midPct),
      poorPct: num(raw.poorPct),
      markerPct: num(raw.markerPct),
      note: str(raw.note),
    })
  }
  // Sin items no hay lecturas que mostrar, y sin titulo la seccion quedaria sin
  // encabezado ni nombre accesible: en los dos casos se omite.
  if (!title || items.length === 0) return null
  return { title, lead: str(vitals.lead), measurementNote: str(vitals.measurementNote), items }
}

function mapServices(services: HomePage['services']): HomeServices | null {
  if (!services) return null
  const title = str(services.title)
  const items: ServiceItem[] = []
  for (const raw of services.items ?? []) {
    const itemTitle = str(raw.title)
    if (!itemTitle) continue
    const icon = str(raw.icon)
    const page = str(raw.servicePage)
    items.push({
      icon: icon && (SERVICE_ICON_NAMES as readonly string[]).includes(icon) ? icon : null,
      title: itemTitle,
      body: str(raw.body),
      tags: (raw.tags ?? []).map((t) => str(t.tag)).filter((t): t is string => t !== null),
      servicePage: page && isServiceSlug(page) ? page : null,
    })
  }
  if (!title || items.length === 0) return null
  return { title, lead: str(services.lead), ctaLabel: str(services.ctaLabel), items }
}

/** Documento del global `home-page` a props. Una seccion sin contenido da null. */
export function mapHomeGlobal(
  global: Partial<HomePage> | null | undefined,
  locale: Locale,
  isFallback: boolean,
): HomeData {
  if (!global) return { ...emptyHomeData(), isFallback }
  return {
    hero: mapHero(global.hero, locale),
    tagline: str(global.tagline),
    vitals: mapVitals(global.vitals),
    services: mapServices(global.services),
    // Los logos salen de la coleccion `clientes`, no del global: getHomeData
    // los agrega despues.
    clients: null,
    // La segunda mitad la agrega getHomeData: mapHomeGlobal solo mapea el global.
    sectionsB: emptySectionsB(),
    isFallback,
  }
}

type ClienteRow = Pick<Cliente, 'id' | 'name' | 'logo' | 'onDark'>

const CLIENTS_SELECT = { name: true, logo: true, onDark: true } as const

/**
 * Logos de la marquesina. Replica la seleccion de ClientLogosBlock: si el
 * bloque `clientLogosBlock` del doc `home` trae una lista explicita, esos
 * clientes en ese orden; si no, todos. Un cliente sin logo con url se omite.
 *
 * SEGURIDAD: `overrideAccess: false` y `select` minimo, igual que cache.ts. El
 * resultado se cachea 60 s y llega a todos los visitantes. Lanza ante un error;
 * getHomeData lo captura.
 */
export function getHomeClients(locale: Locale): Promise<HomeClients | null> {
  return unstable_cache(
    async (): Promise<HomeClients | null> => {
      const payload = await getPayload({ config })

      const { docs: pages } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: 'home' } },
        locale,
        limit: 1,
        depth: 0,
        overrideAccess: false,
        select: { content: true },
      })
      const block = (pages[0]?.content?.layout ?? []).find((b) => b.blockType === 'clientLogosBlock')
      const title = str(block?.title)
      // Sin titulo no hay encabezado que ponerle a la franja: se omite en vez de inventar uno.
      if (!title) return null

      const explicit = (block?.clients ?? [])
        .map((c) => (typeof c === 'object' && c ? c.id : c))
        .filter((id): id is number => typeof id === 'number')

      const { docs } = await payload.find({
        collection: 'clientes',
        ...(explicit.length > 0 ? { where: { id: { in: explicit } } } : {}),
        locale,
        limit: 50,
        depth: 1,
        pagination: false,
        overrideAccess: false,
        select: CLIENTS_SELECT,
      })

      const ordered: ClienteRow[] =
        explicit.length > 0
          ? explicit.flatMap((id) => docs.filter((d) => d.id === id))
          : docs

      const logos: MarqueeLogo[] = []
      for (const client of ordered) {
        const logo: Media | null = typeof client.logo === 'object' ? client.logo : null
        if (!logo?.url) continue
        logos.push({
          id: client.id,
          src: logo.url,
          alt: str(logo.alt) ?? client.name,
          width: logo.width ?? null,
          height: logo.height ?? null,
          onDark: client.onDark ?? false,
        })
      }
      return logos.length > 0 ? { title, logos } : null
    },
    ['home-clients', locale],
    { tags: [CACHE_TAGS.page('home')], revalidate: CACHE_TTL_SECONDS },
  )()
}

/**
 * Lee el global y los logos por las capas cacheadas y los junta. Nunca lanza:
 * un fallo de la Local API (global sin migrar, rol sin permiso, base caida)
 * deja la home sin esas secciones en lugar de un 500. Cada lectura falla por
 * separado, asi que un error en clientes no se lleva el global ni al reves.
 */
export async function getHomeData(locale: Locale): Promise<HomeData> {
  const [{ base, rawGlobal }, clients] = await Promise.all([
    (async (): Promise<{ base: HomeData; rawGlobal: HomePage | null }> => {
      try {
        const { data, isFallback } = await getCachedHomePage(locale)
        return { base: mapHomeGlobal(data, locale, isFallback), rawGlobal: data }
      } catch (err) {
        console.error('[home]', err)
        return { base: emptyHomeData(), rawGlobal: null }
      }
    })(),
    (async (): Promise<HomeClients | null> => {
      try {
        return await getHomeClients(locale)
      } catch (err) {
        console.error('[home]', err)
        return null
      }
    })(),
  ])
  // La segunda mitad nunca lanza (cada lector falla por separado) y no depende
  // de que el global haya leido bien: sus lectores propios siguen con el global
  // en null, y una mitad caida no tumba a la otra.
  const sectionsB = await getHomeSectionsB(locale, rawGlobal)
  return { ...base, clients, sectionsB }
}
