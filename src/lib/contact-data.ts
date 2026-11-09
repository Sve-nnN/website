// Lector y mapeador de Contacto (fase 54, plan 54-12). Convierte el doc
// `contact` de pages y el global `home-page` en props tipadas y serializables
// para ContactView.
//
// `assembleContactData` es una funcion pura: sin llamadas a Payload en su
// cuerpo, asi la autoprueba (scripts/verify/54-contact-ssr.ts) la alimenta con
// el copy sembrado como fixture. `getContactData` es la unica parte que toca el
// CMS. La lectura del doc `contact` puede lanzar (la ruta decide), pero la de
// `home-page` NUNCA lanza: ante un error registra y deja esas secciones en
// null, para que Contacto no responda 500 (UI Considerations: falla de Local
// API al leer un global sombra).
import type { HomePage } from '@/payload-types'

import { getCachedHomePage, getCachedPageBySlug, type Locale } from '@/lib/cache'
import { str } from '@/lib/home-data'
import { isPlaceholder } from '@/lib/placeholder'
import { CONTACT_ICON_NAMES } from '@/lib/shadow-icons'

export type ContactStep = { title: string; body: string | null }

export type ContactInfoRow = {
  /** Nombre validado contra CONTACT_ICON_NAMES, o null (la fila sale sin icono). */
  icon: string | null
  title: string
  text: string
}

export type ContactFaqItem = { question: string; answer: string }

export type ContactData = {
  /** h1: titulo del bloque hero del doc, o el titulo del doc. */
  title: string
  /** Etiqueta de la ultima miga: el titulo del doc. */
  crumbLabel: string
  /** `name` del JSON-LD ContactPage: meta.title, o el titulo del doc, o el respaldo. Igual que antes del rediseno. */
  schemaName: string
  lead: string | null
  /** Correo de `contactFormBlock.contactInfo` (entrada con href mailto:). null sin entrada. */
  email: string | null
  steps: { title: string; items: ContactStep[] } | null
  infoRows: ContactInfoRow[]
  faq: { title: string; items: ContactFaqItem[] } | null
  /** True cuando la pagina es EN pero el copy de `home-page` salio en espanol. */
  isFallback: boolean
}

type DocLike = {
  title?: string | null
  meta?: { title?: string | null } | null
  content?: { layout?: ReadonlyArray<unknown> | null } | null
}
type BlockLike = Record<string, unknown> | null | undefined

/** Texto util o null: vacio, solo espacios, no-texto o con la marca [PLACEHOLDER]. */
function text(value: unknown): string | null {
  const s = str(value)
  return s !== null && !isPlaceholder(s) ? s : null
}

function firstBlock(doc: DocLike | null | undefined, blockType: string): BlockLike {
  for (const raw of doc?.content?.layout ?? []) {
    const block = raw as BlockLike
    if (block && block.blockType === blockType) return block
  }
  return null
}

const MAILTO_ADDRESS = /^[^\s@?]+@[^\s@?]+\.[^\s@?]+$/

/**
 * Correo del bloque de contacto: la entrada de `contactInfo` cuyo href empieza
 * por `mailto:`. Nunca se escribe a mano en el codigo. Un href que no trae una
 * direccion valida da null.
 */
export function extractContactEmail(doc: DocLike | null | undefined): string | null {
  const block = firstBlock(doc, 'contactFormBlock')
  const info = (block?.contactInfo ?? []) as Array<{ href?: string | null } | null>
  for (const entry of info) {
    const href = typeof entry?.href === 'string' ? entry.href.trim() : ''
    if (!/^mailto:/i.test(href)) continue
    const address = href.replace(/^mailto:/i, '').split('?')[0]
    if (MAILTO_ADDRESS.test(address)) return address
  }
  return null
}

function mapSteps(contact: HomePage['contact']): ContactData['steps'] {
  const title = text(contact?.stepsTitle)
  const items: ContactStep[] = []
  for (const raw of contact?.steps ?? []) {
    const stepTitle = text(raw?.title)
    if (!stepTitle) continue
    items.push({ title: stepTitle, body: text(raw?.body) })
  }
  // Sin titulo o sin pasos la franja no se dibuja: ni h2 huerfano ni lista vacia.
  return title && items.length > 0 ? { title, items } : null
}

function mapInfoRows(contact: HomePage['contact']): ContactInfoRow[] {
  const rows: ContactInfoRow[] = []
  for (const raw of contact?.infoRows ?? []) {
    const title = text(raw?.title)
    const body = text(raw?.text)
    if (!title || !body) continue
    const icon = str(raw?.icon)
    rows.push({
      icon: icon && (CONTACT_ICON_NAMES as readonly string[]).includes(icon) ? icon : null,
      title,
      text: body,
    })
  }
  return rows
}

function mapFaq(home: Partial<HomePage>): ContactData['faq'] {
  const title = text(home.contact?.faqTitle)
  const items: ContactFaqItem[] = []
  for (const raw of home.faq?.items ?? []) {
    const question = text(raw?.question)
    const answer = text(raw?.answer)
    if (question && answer) items.push({ question, answer })
  }
  return title && items.length > 0 ? { title, items } : null
}

/**
 * Doc `contact` y global `home-page` a props. Una seccion sin contenido da
 * null (o lista vacia) y la vista no la dibuja. `home` null deja Contacto solo
 * con h1, formulario y correo.
 */
export function assembleContactData(
  doc: DocLike,
  home: Partial<HomePage> | null | undefined,
  isFallback: boolean,
  fallbackTitle: string,
): ContactData {
  const hero = firstBlock(doc, 'hero')
  const form = firstBlock(doc, 'contactFormBlock')
  const docTitle = text(doc.title) ?? fallbackTitle
  return {
    title: text(hero?.title) ?? docTitle,
    crumbLabel: docTitle,
    schemaName: str(doc.meta?.title) ?? docTitle,
    lead: text(hero?.subtitle) ?? text(form?.description),
    email: extractContactEmail(doc),
    steps: home ? mapSteps(home.contact) : null,
    infoRows: home ? mapInfoRows(home.contact) : [],
    faq: home ? mapFaq(home) : null,
    isFallback: home ? isFallback : false,
  }
}

/**
 * Lee el doc `contact` y el global por las capas cacheadas. Devuelve null si el
 * doc no existe (la ruta responde 404). Un error leyendo `home-page` no se
 * propaga: se registra y Contacto sale sin Como empezamos, filas ni FAQ.
 */
export async function getContactData(locale: Locale): Promise<ContactData | null> {
  const doc = await getCachedPageBySlug('contact', locale)
  if (!doc) return null

  let home: Partial<HomePage> | null = null
  let isFallback = false
  try {
    const result = await getCachedHomePage(locale)
    home = result.data
    isFallback = result.isFallback
  } catch (err) {
    console.error('[contact]', err)
  }

  return assembleContactData(doc, home, isFallback, locale === 'es' ? 'Contacto' : 'Contact')
}
