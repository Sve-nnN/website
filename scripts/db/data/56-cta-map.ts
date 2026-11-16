/**
 * Inventario de CTAs de la fase 56 (plan 56-10, D-15, CONT-02).
 *
 * Cada CTA vigente con su origen, el archivo y la clave donde vive, si lo lee master
 * (produccion), el momento de carga (`ahora`, `corte` o `excluido`), las rutas donde se
 * ve en ES y en EN y el texto aprobado por Juan.
 *
 * El texto (es, en, estado, vigenteEs) sale de CTA_LOTE1 (56-cta-lote1.ts, que lee el JSON
 * generado desde textos-pendientes-juan.md). Aqui no se inventa ningun texto: una fila sin
 * texto aprobado conserva el vigente y queda `pendiente`.
 *
 * Los metadatos (origen, archivo, clave, rutas, loadAt) son de este archivo. La columna
 * `origen` del JSON de entrada de 56-02 se deja como estaba: tres filas apuntaban a un
 * espacio de nombres que no existe (serviceScopeCard no trae CTAs) y aqui se corrigen con
 * la clave real de messages.
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision, DecisionStatus } from './56-content-decisions'
import { CTA_LOTE1, type CtaRow } from './56-cta-lote1'

export type CtaOrigen = 'sombra' | 'messages' | 'bloque' | 'header' | 'landing'
/** `excluido` = fuera de alcance de la fase (landings Lima y Madrid). */
export type CtaMapLoadAt = 'ahora' | 'corte' | 'excluido'
export type CtaMapEstado = DecisionStatus | 'fuera'

export type CtaRoutes = { es: string[]; en: string[] }

export type CtaMapEntry = {
  id: string
  /** Fila de la tabla del lote 1 aprobada por Juan (1 a 13), si la tiene. */
  loteRow: number | null
  origen: CtaOrigen
  /** Archivo donde vive el campo (global, bloque, vista o messages). */
  archivo: string
  /** Clave de messages, campo del global o descripcion de donde sale el texto. */
  clave: string
  /** Claves de messages.json (ES y EN) que sostienen este texto en el codigo de la rama. */
  messageKeys: string[]
  /** Lo lee master, o sea produccion hoy. Si es verdadero, loadAt nunca es `ahora`. */
  master: boolean
  loadAt: CtaMapLoadAt
  /** Rutas donde se ve el texto. Vacio = no hay ruta visible conocida (se anota en `nota`). */
  routes: CtaRoutes
  /** Texto en espanol: el aprobado, o el vigente si la fila esta pendiente. */
  es: string
  /** Texto en ingles aprobado. Ausente mientras la fila este pendiente. */
  en?: string
  vigenteEs: string
  estado: CtaMapEstado
  nota?: string
}

/** Frase que Juan retiro del cierre de la home (D-15). No puede aparecer en ninguna ruta. */
export const RETIRED_PHRASES: readonly string[] = ['empiezo por mirar qué ve Google hoy']

/** Cierre de la home aprobado por Juan (D-15), exacto. */
export const CIERRE_LEAD = {
  es: '¿Tienes un proyecto en mente? Cuéntame de qué se trata.',
  en: 'Have a project in mind? Tell me what it is about.',
} as const

const CIERRE_ROUTES: CtaRoutes = {
  es: ['/', '/sobre-mi', '/case-studies', '/websites'],
  en: ['/en', '/en/sobre-mi', '/en/case-studies', '/en/websites'],
}
const HOME_ROUTES: CtaRoutes = { es: ['/'], en: ['/en'] }
const STACK_ROUTES: CtaRoutes = { es: ['/stack'], en: ['/en/stack'] }
const CONTACT_ROUTES: CtaRoutes = { es: ['/contact'], en: ['/en/contact'] }
const NO_ROUTES: CtaRoutes = { es: [], en: [] }

const SOMBRA = 'src/globals/HomePage/index.ts'

type Meta = Omit<CtaMapEntry, 'es' | 'en' | 'vigenteEs' | 'estado'>

/** Metadatos por id de CTA_LOTE1. Un id nuevo en el lote 1 sin metadatos aqui lo detecta la validacion. */
const META: Meta[] = [
  {
    id: 'hero-cta',
    loteRow: 1,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'hero.ctaLabel',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: HOME_ROUTES,
    nota: 'La siembra desde 56-home-copy.ts la hace 56-12. En /en sale en espanol hasta esa siembra.',
  },
  {
    id: 'services-cta',
    loteRow: 4,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'services.ctaLabel',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: HOME_ROUTES,
  },
  {
    id: 'cierre-titulo',
    loteRow: 2,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'cta.title',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: CIERRE_ROUTES,
    nota: 'Lo pinta CtaSection (getCtaData) en home, Sobre mi, casos, Websites y autores.',
  },
  {
    id: 'cierre-lead',
    loteRow: 3,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'cta.lead',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: CIERRE_ROUTES,
    nota: 'D-15: Juan retiro la frase "empiezo por mirar qué ve Google hoy".',
  },
  {
    id: 'cases-cta',
    loteRow: 5,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'cases.ctaLabel',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: HOME_ROUTES,
  },
  {
    id: 'sites-cta',
    loteRow: 6,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'sites.ctaLabel',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: HOME_ROUTES,
  },
  {
    id: 'contact-step-1',
    loteRow: null,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'contact.steps[0].title',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: CONTACT_ROUTES,
    nota: 'Lote 2: sigue pendiente de aprobacion explicita de Juan.',
  },
  {
    id: 'contact-step-2',
    loteRow: null,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'contact.steps[1].title',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: CONTACT_ROUTES,
    nota: 'Lote 2: sigue pendiente de aprobacion explicita de Juan.',
  },
  {
    id: 'contact-step-3',
    loteRow: null,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'contact.steps[2].title',
    messageKeys: [],
    master: false,
    loadAt: 'ahora',
    routes: CONTACT_ROUTES,
    nota: 'Lote 2: sigue pendiente de aprobacion explicita de Juan.',
  },
  {
    id: 'header-cta',
    loteRow: 1,
    origen: 'header',
    archivo: 'src/globals/Header/index.ts',
    clave: 'ctaButton (con respaldo shell.ctaFallback en HeaderView.tsx)',
    messageKeys: ['shell.ctaFallback'],
    master: true,
    loadAt: 'corte',
    routes: HOME_ROUTES,
    nota:
      'El campo ctaButton lo lee produccion y hoy dice "Hablemos". El respaldo de messages ya dice lo aprobado. Se escribe en 56-14.',
  },
  {
    id: 'audit-offer-cta',
    loteRow: null,
    origen: 'bloque',
    archivo: 'src/blocks/AuditOfferBlock/config.ts',
    clave: 'bloque auditOfferBlock del doc pages home (src/lib/home-data-b.ts)',
    messageKeys: [],
    master: true,
    loadAt: 'corte',
    routes: NO_ROUTES,
    nota: 'La tabla del lote 1 no trae esta fila: queda pendiente con el texto vigente.',
  },
  {
    id: 'auditor-cta',
    loteRow: 9,
    origen: 'bloque',
    archivo: 'src/blocks/AuditorHighlight/Component.tsx',
    clave: 'bloque auditorHighlight (ctaLabel) con respaldo auditorHighlight.cta',
    messageKeys: ['auditorHighlight.cta'],
    master: true,
    loadAt: 'corte',
    routes: HOME_ROUTES,
    nota: 'El respaldo de messages ya dice lo aprobado; si el bloque de master trae ctaLabel propio, lo cambia 56-14.',
  },
  {
    id: 'services-index-talk',
    loteRow: 7,
    origen: 'messages',
    archivo: 'src/components/pages/ServicesIndexView.tsx',
    clave: 'services.index.talkCta',
    messageKeys: ['services.index.talkCta'],
    master: false,
    loadAt: 'ahora',
    routes: { es: ['/servicios'], en: ['/en/services'] },
  },
  {
    id: 'service-card-cta',
    loteRow: 8,
    origen: 'messages',
    archivo: 'src/blocks/ServicesShowcase/Component.tsx',
    clave: 'servicesShowcase.cta',
    messageKeys: ['servicesShowcase.cta'],
    master: false,
    loadAt: 'ahora',
    routes: NO_ROUTES,
    nota:
      'La clave ya dice lo aprobado, pero ninguna ruta de dev pinta el bloque ServicesShowcase. Las tarjetas visibles (home y /servicios) dicen "Ver servicio" desde common.seeService y services.index.viewService. Decision abierta para Juan.',
  },
  {
    id: 'auditor-notice-cta',
    loteRow: 10,
    origen: 'messages',
    archivo: 'src/blocks/AuditorCallout/Component.tsx',
    clave: 'auditorCallout.cta y stackPage.auditorCta',
    messageKeys: ['auditorCallout.cta', 'stackPage.auditorCta'],
    master: false,
    loadAt: 'ahora',
    routes: STACK_ROUTES,
    nota: 'El aviso de AuditorCallout vive en articulos; en dev se ve con el mismo texto en /stack (stackPage.auditorCta).',
  },
  {
    id: 'stack-tool-link',
    loteRow: 11,
    origen: 'messages',
    archivo: 'src/blocks/ToolStack/Component.tsx',
    clave: 'stackPage.ctaDefault',
    messageKeys: ['stackPage.ctaDefault'],
    master: false,
    loadAt: 'ahora',
    routes: STACK_ROUTES,
  },
  {
    id: 'stack-amazon',
    loteRow: 12,
    origen: 'messages',
    archivo: 'src/blocks/ToolStack/Component.tsx',
    clave: 'stackPage.ctaAmazon',
    messageKeys: ['stackPage.ctaAmazon'],
    master: false,
    loadAt: 'ahora',
    routes: STACK_ROUTES,
  },
  {
    id: 'contact-response-note',
    loteRow: 13,
    origen: 'sombra',
    archivo: SOMBRA,
    clave: 'contact.infoRows[0].text y messages contact.cta.responseNote (CtaPanel)',
    messageKeys: ['contact.cta.responseNote'],
    master: false,
    loadAt: 'ahora',
    routes: CONTACT_ROUTES,
    nota: 'En /en/contact sale en espanol hasta que 56-12 siembre la fila EN del global.',
  },
  {
    id: 'contact-write-email',
    loteRow: null,
    origen: 'messages',
    archivo: 'src/components/pages/ContactView.tsx',
    clave: 'contact.writeEmail',
    messageKeys: ['contact.writeEmail'],
    master: false,
    loadAt: 'ahora',
    routes: NO_ROUTES,
    nota: 'La tabla del lote 1 no trae esta fila: queda pendiente con el texto vigente.',
  },
  {
    id: 'contact-submit',
    loteRow: null,
    origen: 'messages',
    archivo: 'src/components/mui/ContactForm.tsx',
    clave: 'contact.form.submit',
    messageKeys: ['contact.form.submit'],
    master: false,
    loadAt: 'ahora',
    routes: NO_ROUTES,
    nota: 'La tabla del lote 1 no trae esta fila: queda pendiente con el texto vigente.',
  },
  {
    id: 'emailcapture-submit',
    loteRow: null,
    origen: 'messages',
    archivo: 'src/blocks/EmailCaptureBlock/Component.tsx',
    clave: 'emailCapture.submitLabel',
    messageKeys: ['emailCapture.submitLabel'],
    master: false,
    loadAt: 'ahora',
    routes: NO_ROUTES,
    nota: 'La tabla del lote 1 no trae esta fila: queda pendiente con el texto vigente.',
  },
  {
    id: 'newsletter-submit',
    loteRow: null,
    origen: 'messages',
    archivo: 'src/components/pages/blog/BlogNewsletter.tsx',
    clave: 'blog.newsletter.submitLabel',
    messageKeys: ['blog.newsletter.submitLabel'],
    master: false,
    loadAt: 'ahora',
    routes: NO_ROUTES,
    nota: 'La tabla del lote 1 no trae esta fila: queda pendiente con el texto vigente.',
  },
]

/** CTAs de landings que fuera del lote 1: se anotan, no se tocan. */
const FUERA: CtaMapEntry[] = [
  {
    id: 'landings-servicio',
    loteRow: null,
    origen: 'landing',
    archivo: 'docs pages y bloques de las landings de servicio',
    clave: 'bloques de cada landing de servicio',
    messageKeys: [],
    master: true,
    loadAt: 'corte',
    routes: NO_ROUTES,
    es: '',
    vigenteEs: '',
    estado: 'fuera',
    nota: 'No esta en el lote 1. Master las lee: no se tocan en caliente (D-02).',
  },
  {
    id: 'landings-lima-madrid',
    loteRow: null,
    origen: 'landing',
    archivo: 'docs pages seo-tecnico-lima y seo-tecnico-madrid',
    clave: 'bloques de las landings',
    messageKeys: [],
    master: true,
    loadAt: 'excluido',
    routes: NO_ROUTES,
    es: '',
    vigenteEs: '',
    estado: 'fuera',
    nota: 'Juan las deja como estan por ahora. Fuera de alcance de la fase.',
  },
]

/** Une los metadatos con el texto de CTA_LOTE1 por id. Exportada para la autoprueba. */
export function buildCtaMap(lote1: readonly CtaRow[] = CTA_LOTE1): CtaMapEntry[] {
  const byId = new Map(lote1.map((r) => [r.id, r]))
  const entries: CtaMapEntry[] = []
  for (const meta of META) {
    const row = byId.get(meta.id)
    if (!row) continue
    entries.push({
      ...meta,
      es: row.es,
      ...(row.en ? { en: row.en } : {}),
      vigenteEs: row.vigenteEs,
      estado: row.estado,
    })
  }
  return [...entries, ...FUERA]
}

export const CTA_MAP: CtaMapEntry[] = buildCtaMap()

/** Ids de META, para que la autoprueba compare contra CTA_LOTE1. */
export const META_IDS: readonly string[] = META.map((m) => m.id)

/**
 * Valida el inventario. Devuelve los problemas, vacio si esta bien.
 *  - toda fila del lote 1 tiene metadatos y viceversa;
 *  - toda fila tiene origen, archivo y clave;
 *  - lo que lee master nunca tiene loadAt `ahora` (T-56-33);
 *  - `excluido` solo para Lima y Madrid;
 *  - el cierre de la home coincide con D-15 y no conserva la frase retirada;
 *  - el loadAt de CTA_LOTE1 coincide con el de este mapa.
 */
export function validateCtaMap(
  map: readonly CtaMapEntry[] = CTA_MAP,
  lote1: readonly CtaRow[] = CTA_LOTE1,
): string[] {
  const problems: string[] = []
  const mapIds = new Set(map.map((e) => e.id))
  for (const row of lote1) {
    if (!META_IDS.includes(row.id)) problems.push(`${row.id}: la fila del lote 1 no tiene metadatos en CTA_MAP`)
  }
  for (const id of META_IDS) {
    if (!lote1.some((r) => r.id === id)) problems.push(`${id}: tiene metadatos pero no existe en el lote 1`)
  }
  const seen = new Set<string>()
  for (const e of map) {
    if (seen.has(e.id)) problems.push(`${e.id}: id duplicado`)
    seen.add(e.id)
    if (!e.archivo.trim()) problems.push(`${e.id}: falta el archivo de origen`)
    if (!e.clave.trim()) problems.push(`${e.id}: falta la clave o el campo`)
    if (e.master && e.loadAt === 'ahora') problems.push(`${e.id}: lo lee master y tiene loadAt ahora (T-56-33)`)
    if (e.loadAt === 'excluido' && e.id !== 'landings-lima-madrid') problems.push(`${e.id}: solo Lima y Madrid pueden ser excluido`)
    if (e.id === 'landings-lima-madrid' && e.loadAt !== 'excluido') problems.push('landings-lima-madrid: debe ser excluido')
    if (e.estado === 'aprobado' && !e.en) problems.push(`${e.id}: esta aprobado sin texto en ingles`)
    if (e.estado === 'aprobado' && !e.es) problems.push(`${e.id}: esta aprobado sin texto en espanol`)
    const row = lote1.find((r) => r.id === e.id)
    if (row && row.loadAt !== e.loadAt) problems.push(`${e.id}: loadAt ${e.loadAt} no coincide con el lote 1 (${row.loadAt})`)
    for (const phrase of RETIRED_PHRASES) {
      if ((e.es && e.es.includes(phrase)) || (e.en && e.en.includes(phrase))) {
        if (e.id === 'cierre-lead') problems.push(`cierre-lead: conserva la frase retirada "${phrase}" (D-15)`)
      }
    }
  }
  const cierre = map.find((e) => e.id === 'cierre-lead')
  if (!cierre) problems.push('cierre-lead: falta en el inventario')
  else if (cierre.estado === 'aprobado') {
    if (cierre.es !== CIERRE_LEAD.es) problems.push(`cierre-lead: el ES no coincide con D-15 (${cierre.es})`)
    if (cierre.en !== CIERRE_LEAD.en) problems.push(`cierre-lead: el EN no coincide con D-15 (${cierre.en ?? 'sin texto'})`)
  } else problems.push('cierre-lead: D-15 lo aprueba y el mapa lo tiene sin aprobar')
  if (!mapIds.has('landings-lima-madrid')) problems.push('landings-lima-madrid: falta la fila de exclusion')
  return problems
}

/** Una decision por fila sin texto aprobado (ids CTA-MAP-<id>). Las filas fuera del lote no generan decision. */
export const DECISIONS: Decision[] = CTA_MAP.filter((e) => e.estado === 'pendiente').map((e) => ({
  id: `CTA-MAP-${e.id}`,
  label: `CTA ${e.id} (${e.origen})`,
  status: 'pendiente',
  gate: 'aprobado',
  chosen: 'vigente',
  options: { vigente: { es: e.vigenteEs, note: 'Sin texto del lote 1 pegado por Juan' } },
  source: `${e.archivo} :: ${e.clave} (carga: ${e.loadAt})`,
}))

/** Forma que lee el verificador vivo (scripts/verify/56-cta-live.mjs, --export). */
export type CtaLiveExport = {
  retired: string[]
  entries: {
    id: string
    origen: CtaOrigen
    loadAt: CtaMapLoadAt
    estado: CtaMapEstado
    es: string
    en: string | null
    vigenteEs: string
    routes: CtaRoutes
    messageKeys: string[]
  }[]
}

export function toLiveExport(map: readonly CtaMapEntry[] = CTA_MAP): CtaLiveExport {
  return {
    retired: [...RETIRED_PHRASES],
    entries: map.map((e) => ({
      id: e.id,
      origen: e.origen,
      loadAt: e.loadAt,
      estado: e.estado,
      es: e.es,
      en: e.en ?? null,
      vigenteEs: e.vigenteEs,
      routes: e.routes,
      messageKeys: e.messageKeys,
    })),
  }
}
