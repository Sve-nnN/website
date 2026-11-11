/**
 * Datos del corte de la fase 56 (plan 56-13, D-02, D-13, D-20, D-21).
 *
 * Todo lo que `master` ya sirve hoy y que se carga en el CORTE (fase 57, plan 56-14) se registra
 * aqui con su valor actual como respaldo, el valor deseado, el estado y el gate. Este archivo no
 * escribe en ninguna base: no importa Payload, no abre red y no lee .env. El respaldo `current`
 * se leyo el 2026-11-10 con solo GET a la API publica de produccion (https://juan-tech.com/api)
 * y a los sitios publicos, nunca de la base (T-56-46).
 *
 * MODELO
 *   - Un item es una carga del corte: kind, target, loadAt (siempre `corte`), current (respaldo),
 *     desired (lo que se cargara; ausente si Juan aun no lo dicto), status y gate.
 *   - Un item "propio" genera una decision CUT-<kind>-<nombre> en DECISIONS.
 *   - Un item "gobernado" (`governedBy`) NO genera decision propia: su estado lo manda otra
 *     decision que ya existe (ALT-, LESSON-, CTA-, HEAD-) y la autoprueba comprueba que coincida.
 *     Asi el gate de la fase 57 no cuenta dos veces el mismo texto.
 *
 * REGLA DE VALORES POR DEFECTO (D-22 y orquestador): las decisiones de Juan que aun no llegaron
 * quedan `propuesto` con el valor recomendado; lo que Juan debe dictar y no existe todavia queda
 * `pendiente` y sin `desired` (nada se inventa, T-56-47).
 *
 * Los textos de `desired` salen de hechos verificados (cabeceras HTTP, marcadores del HTML, DNS)
 * o de hechos que Juan ya dio (CONTEXT D-08 y D-13). Cada item lleva su `evidence`.
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision, DecisionGate, DecisionOption, DecisionStatus } from './56-content-decisions'
import { CAPTURE_ALTS } from './56-alt-texts'
import { flatLessons, lessonId, caseUrl } from './56-case-lessons'
import { CTA_MAP } from './56-cta-map'
import { DECISIONS as HEAD_DECISIONS, HEADINGS, type HeadingGroup } from './56-headings-table'
import { LEGAL_EFFECTIVE_DATE } from './56-legal-copy'

export type CutKind =
  | 'websites-row'
  | 'media-alt'
  | 'lessons'
  | 'legal-date'
  | 'testimonial'
  | 'author'
  | 'post-translation'
  | 'cta-master'
  | 'heading-master'

export const CUT_KINDS: readonly CutKind[] = [
  'websites-row',
  'media-alt',
  'lessons',
  'legal-date',
  'testimonial',
  'author',
  'post-translation',
  'cta-master',
  'heading-master',
]

/** Prefijo del id por kind: CUT-<prefijo>-<nombre>. Los ids cortos (websites, post) son los que usa el plan en sus comandos --only. */
export const CUT_ID_PREFIX: Record<CutKind, string> = {
  'websites-row': 'websites',
  'media-alt': 'media-alt',
  lessons: 'lessons',
  'legal-date': 'legal-date',
  testimonial: 'testimonial',
  author: 'author',
  'post-translation': 'post-translation',
  'cta-master': 'cta-master',
  'heading-master': 'heading-master',
}

/** Valor tipo JSON. Las formas `{ es, en }` se muestran en dos lineas en la revision. */
export type CutValue = string | number | boolean | null | CutValue[] | { [key: string]: CutValue }

export type CutItem = {
  /** CUT-<prefijo del kind>-<nombre> (ver CUT_ID_PREFIX). */
  id: string
  kind: CutKind
  label: string
  /** Coleccion o global y slug o id, por ejemplo `websites:ariannalupi-com#stack`. */
  target: string
  /** Siempre `corte`: nada de esto se escribe en caliente (D-02). */
  loadAt: 'corte'
  /** Valor que sirve hoy produccion. Es el respaldo para revertir. Nunca vacio. */
  current: CutValue
  /** Lo que se cargara. Ausente mientras Juan no lo dicte. */
  desired?: CutValue
  status: DecisionStatus
  gate: DecisionGate
  chosen?: string
  recommended?: string
  /** Opciones extra de la decision (se suman a `actual` y `propuesto`, que salen de current y desired). */
  options?: Record<string, DecisionOption>
  /** Id de la decision que ya manda el estado de este item (ALT-, LESSON-, CTA-, HEAD-). */
  governedBy?: string
  source: string
  /** Fecha de la lectura del respaldo. */
  capturedAt: string
  /** Lo que se verifico para escribir `desired`: cabeceras, marcadores, DNS. */
  evidence?: string[]
  note?: string
}

export const CUT_CAPTURED_AT = '2026-11-10'
export const PROD_API = 'https://juan-tech.com/api'

// ---------------------------------------------------------------------------
// Respaldo leido por GET (T-56-46)
// ---------------------------------------------------------------------------

export type LiveSite = {
  updatedAt: string
  stack: string[]
  highlights: { es: string[]; en: string[] }
  challenges: { es: string[]; en: string[] }
}

/**
 * Filas de Websites tal como las sirvio produccion el 2026-11-10 (GET /api/websites, ES y EN).
 * Son las cuatro filas cuyo stack o cuyos textos hablan de hosting o de base de datos.
 */
export const LIVE_WEBSITES: Record<string, LiveSite> = {
  'ariannalupi-com': {
    updatedAt: '2026-07-14T17:38:48.825Z',
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    highlights: {
      es: [
        'Migración completa a Next.js + Payload CMS con contenido bilingüe',
        'Base de datos Postgres en Neon con hosting Node.js en Hostinger',
        'SEO técnico integrado desde el código, sin plugins de terceros',
      ],
      en: [
        'Full migration to Next.js + Payload CMS with bilingual content',
        'Postgres database on Neon with Node.js hosting on Hostinger',
        'Technical SEO built into the codebase, no third-party plugins',
      ],
    },
    challenges: {
      es: [
        'Migrar la plataforma sin perder posicionamiento orgánico existente',
        'Mantener tiempos de carga bajos con contenido rico en imágenes',
      ],
      en: ['Migrating platforms without losing existing organic rankings', 'Keeping load times low with image-heavy content'],
    },
  },
  'juan-tech-com': {
    updatedAt: '2026-07-14T17:39:57.252Z',
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    highlights: {
      es: [
        'Sitio personal construido en Next.js + Payload CMS + Postgres',
        'Mismo stack usado como referencia para proyectos de clientes',
        'Hosting Node.js persistente en Hostinger',
      ],
      en: [
        'Personal site built on Next.js + Payload CMS + Postgres',
        'Same stack used as a reference for client projects',
        'Persistent Node.js hosting on Hostinger',
      ],
    },
    challenges: {
      es: [
        'Mantener el sitio como referencia viva del stack sin descuidar el SEO propio',
        'Balancear tiempo entre proyectos de clientes y el sitio propio',
      ],
      en: [
        'Keeping the site as a living reference for the stack without neglecting its own SEO',
        'Balancing time between client projects and the personal site',
      ],
    },
  },
  'aprendoclub-com': {
    updatedAt: '2026-07-14T17:38:58.391Z',
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    highlights: {
      es: [
        'Plataforma Next.js + Payload CMS + Postgres para cursos online',
        'Hosting Node.js persistente en Hostinger',
        'Estructura de contenido pensada para escalar cursos y lecciones',
      ],
      en: [
        'Next.js + Payload CMS + Postgres platform for online courses',
        'Persistent Node.js hosting on Hostinger',
        'Content structure built to scale courses and lessons',
      ],
    },
    challenges: {
      es: [
        'Modelar cursos/lecciones de forma flexible en el CMS',
        'Asegurar rendimiento con un catálogo de cursos en crecimiento',
      ],
      en: ['Modeling courses/lessons flexibly in the CMS', 'Ensuring performance as the course catalog grows'],
    },
  },
  'apturio-com': {
    updatedAt: '2026-07-14T17:39:26.032Z',
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    highlights: {
      es: [
        'Producto construido en Next.js + Payload CMS + Postgres',
        'Arquitectura de referencia reutilizada en otros proyectos del stack',
        'Hosting Node.js persistente en Hostinger',
      ],
      en: [
        'Product built on Next.js + Payload CMS + Postgres',
        'Reference architecture reused across other projects in the stack',
        'Persistent Node.js hosting on Hostinger',
      ],
    },
    challenges: {
      es: [
        'Diseñar un modelo de datos flexible para el producto',
        'Mantener buen rendimiento en Postgres con pooling adecuado',
      ],
      en: ['Designing a flexible data model for the product', 'Keeping good Postgres performance with proper connection pooling'],
    },
  },
}

/** Testimonio unico que existe en produccion (GET /api/testimonials, ES y EN). */
export const LIVE_TESTIMONIAL = {
  id: 1,
  name: 'Patricia Ibarra',
  company: 'Estylopia',
  role: 'CEO',
  es: 'Trabajar con Juan fue lo mejor.',
  en: 'Working with Juan was the best decision we made.',
}

/** Experiencia del autor tal como la sirvio produccion (GET /api/authors, ES y EN). */
type LiveExperience = {
  company: string
  role: string
  startDate: string | null
  endDate: string | null
  description: string | null
}

export const LIVE_AUTHOR_EXPERIENCE: { es: LiveExperience[]; en: LiveExperience[] } = {
  es: [
    {
      company: 'aprendoclub',
      role: 'Senior Tech SEO Analyst',
      startDate: null,
      endDate: null,
      description:
        'Coach del Diplomado de SEO + AIO en aprendoclub, la academia de marketing con IA fundada por Arianna Lupi. Acompaña a estudiantes hispanohablantes en su formación como especialistas SEO. Más info: https://www.aprendoclub.com/diplomado',
    },
    { company: 'AprendoSEO', role: 'Especialista en Tech SEO', startDate: '2022-11-01', endDate: '2026-02-01', description: null },
    {
      company: 'Cripto Avances & Nakama Digital',
      role: 'Desarrollador Web',
      startDate: '2022-01-01',
      endDate: '2022-09-01',
      description: null,
    },
  ],
  en: [
    {
      company: 'aprendoclub',
      role: 'Senior Tech SEO Analyst',
      startDate: null,
      endDate: null,
      description:
        'Coach for the SEO + AIO Diploma program at aprendoclub, the AI-marketing academy founded by Arianna Lupi. Mentors Spanish-speaking students becoming SEO specialists. More info: https://www.aprendoclub.com/diplomado',
    },
    { company: 'AprendoSEO', role: 'Technical SEO Specialist', startDate: '2022-11-01', endDate: '2026-02-01', description: null },
    {
      company: 'Cripto Avances & Nakama Digital',
      role: 'Web Developer',
      startDate: '2022-01-01',
      endDate: '2022-09-01',
      description: null,
    },
  ],
}

// ---------------------------------------------------------------------------
// Ayudas de forma
// ---------------------------------------------------------------------------

/** Una fila de Websites como valor bilingue: el stack no se traduce, los textos si. */
const siteValue = (
  stack: string[],
  text?: { highlights: { es: string[]; en: string[] }; challenges?: { es: string[]; en: string[] } },
): CutValue => ({
  es: { ...(stack.length > 0 ? { stack } : {}), ...(text ? { highlights: text.highlights.es, ...(text.challenges ? { retos: text.challenges.es } : {}) } : {}) },
  en: { ...(stack.length > 0 ? { stack } : {}), ...(text ? { highlights: text.highlights.en, ...(text.challenges ? { challenges: text.challenges.en } : {}) } : {}) },
})

const liveSite = (slug: string): CutValue => {
  const s = LIVE_WEBSITES[slug]
  return siteValue(s.stack, { highlights: s.highlights, challenges: s.challenges })
}

const experienceValue = (rows: { es: LiveExperience[]; en: LiveExperience[] }): CutValue => ({
  es: { experience: rows.es.map((r) => ({ ...r })) },
  en: { experience: rows.en.map((r) => ({ ...r })) },
})

/** Texto legible de un valor, para la revision y para la autoprueba. */
export function show(v: CutValue | undefined): string {
  if (v === undefined || v === null) return '(vacío)'
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return v.map((x) => show(x)).join('; ')
  return Object.entries(v)
    .map(([k, x]) => `${k}: ${show(x)}`)
    .join(' | ')
}

/** Si el valor trae `es` o `en`, cada lado va en su linea. Si no, el mismo texto en las dos. */
export function bilingual(v: CutValue | undefined): { es: string; en: string } {
  if (v !== null && typeof v === 'object' && !Array.isArray(v) && ('es' in v || 'en' in v)) {
    return { es: show(v.es), en: show(v.en) }
  }
  const t = show(v)
  return { es: t, en: t }
}

/** ¿El valor esta vacio? Un texto en blanco, un arreglo sin elementos o un objeto sin claves. */
export function isEmptyValue(v: CutValue | undefined): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => isEmptyValue(x))
  if (typeof v === 'object') return Object.keys(v).length === 0
  return false
}

// ---------------------------------------------------------------------------
// 1. Websites (D-13, tracer: el stack de Arianna Lupi va primero)
// ---------------------------------------------------------------------------

const EVIDENCE_ARIANNA = [
  'GET https://ariannalupi.com: server cloudflare, 7 astro-island y 4 _astro/ en el HTML, 0 _next/static, 0 wp-content, 0 self.__next_f',
  'DNS: A 104.21.56.7 y 172.67.175.33 (rangos de Cloudflare), NS de Cloudflare; el origen queda detras del proxy',
  'Hostinger NO se afirma: el origen no se ve desde fuera y el sandbox lo trae sin verificar',
  'D-13: Juan dijo Astro, sin confirmar del todo; los marcadores del HTML lo confirman',
]

const EVIDENCE_JUAN_TECH = [
  'GET https://juan-tech.com: x-powered-by Next.js, Payload; GET /api/users/me devuelve {"user":null,"message":"Account"} (respuesta de Payload)',
  'DNS: A 116.203.79.125 con rDNS static.125.79.203.116.clients.your-server.de (Hetzner), NS de Cloudflare',
  'Postgres, Dokploy, Cloudinary y Resend: no se ven desde fuera; vienen de D-08 de 56-CONTEXT y de la instruccion de Juan',
]

const EVIDENCE_APTURIO = [
  'GET https://apturio.com: server LiteSpeed, cabeceras platform: hostinger y panel: hpanel, x-nextjs-prerender y x-middleware-rewrite (Next.js), 28 _next/static y 165 self.__next_f en el HTML',
  'GET /api/users/me devuelve {"user":null,"message":"Account"} (respuesta de Payload) y /admin responde 200',
  'DNS: A 82.25.87.50, NS de Cloudflare solo como DNS (no hay cf-ray ni server cloudflare: el sitio no pasa por el proxy)',
  'Neon Postgres: no se puede verificar desde fuera, queda como esta',
]

const EVIDENCE_APRENDOCLUB = [
  'GET https://aprendoclub.com: 307 a https://www.aprendoclub.com/; ahi x-powered-by Next.js, Payload, x-vercel-id gru1, x-vercel-cache HIT y server cloudflare',
  'GET /api/users/me devuelve {"user":null,"message":"Account"} (respuesta de Payload); DNS A 104.21.12.171 y 172.67.152.212 (Cloudflare)',
  'GET https://aprendoseo.com: 301 al mismo https://www.aprendoclub.com/ (es el mismo sitio con otro nombre)',
  'Neon Postgres: no se puede verificar desde fuera; el item lo conserva y se lo marca a Juan',
]

const EVIDENCE_LOOPS = [
  'GET https://loopsgrowth.com: 200, server cloudflare, titulo "Agencia de SEO/GEO Growth | loops growth", 30 _astro/ y 0 _next/static (Astro)',
  'GET /api/websites de produccion y de dev: 6 filas, ninguna con slug loopsgrowth-com',
]

export const CUT_WEBSITES: CutItem[] = [
  {
    id: 'CUT-websites-ariannalupi-stack',
    kind: 'websites-row',
    label: 'Arianna Lupi: stack de la fila de Websites (Astro y Cloudflare)',
    target: 'websites:ariannalupi-com#stack',
    loadAt: 'corte',
    current: siteValue(LIVE_WEBSITES['ariannalupi-com'].stack),
    desired: siteValue(['Astro', 'Cloudflare']),
    status: 'propuesto',
    gate: 'aprobado',
    chosen: 'propuesto',
    recommended: 'propuesto',
    options: {
      dejar: {
        es: 'Dejar el stack como esta',
        en: 'Leave the stack as it is',
        note: 'El sitio publico seguiria diciendo Next.js, Payload CMS, Neon Postgres y Hostinger para un sitio que corre Astro',
      },
    },
    source: `${PROD_API}/websites?where[slug][equals]=ariannalupi-com (lectura); scripts/seed-phase40-websites.ts lineas 64 a 95 (origen del dato)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: EVIDENCE_ARIANNA,
    note: 'Opcion arianna=corte de la decision de Websites. La fila la lee master: se carga en el corte y no en caliente (D-02).',
  },
  {
    id: 'CUT-websites-ariannalupi-textos',
    kind: 'websites-row',
    label: 'Arianna Lupi: highlights y retos reales (los dicta Juan)',
    target: 'websites:ariannalupi-com#highlights,challenges',
    loadAt: 'corte',
    current: siteValue([], { highlights: LIVE_WEBSITES['ariannalupi-com'].highlights, challenges: LIVE_WEBSITES['ariannalupi-com'].challenges }),
    status: 'pendiente',
    gate: 'aprobado',
    chosen: 'yo-dicto',
    recommended: 'yo-dicto',
    options: {
      'yo-dicto': {
        es: 'Juan dicta los highlights y los retos reales de ese sitio',
        en: 'Juan dictates the real highlights and challenges for that site',
        note: 'Los vigentes cuentan una migracion a Next.js y Payload que no corresponde a un sitio Astro. No se inventan sustitutos (T-56-47). Hasta que Juan los dicte este item bloquea el gate de la fase 57.',
      },
    },
    source: `${PROD_API}/websites?where[slug][equals]=ariannalupi-com (lectura)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: EVIDENCE_ARIANNA.slice(0, 1),
    note: 'Sin desired a proposito. La respuesta de Juan debe traer los textos en ES y EN.',
  },
  {
    id: 'CUT-websites-juan-tech-com',
    kind: 'websites-row',
    label: 'Juan Tech: stack y linea de hosting de la fila de Websites (Hetzner con Dokploy)',
    target: 'websites:juan-tech-com#stack,highlights',
    loadAt: 'corte',
    current: liveSite('juan-tech-com'),
    desired: siteValue(['Next.js', 'Payload CMS', 'Postgres', 'Hetzner', 'Dokploy', 'Cloudinary', 'Resend'], {
      highlights: {
        es: [
          'Sitio personal construido en Next.js + Payload CMS + Postgres',
          'Mismo stack usado como referencia para proyectos de clientes',
          'Hosting Node.js persistente en un VPS de Hetzner con Dokploy',
        ],
        en: [
          'Personal site built on Next.js + Payload CMS + Postgres',
          'Same stack used as a reference for client projects',
          'Persistent Node.js hosting on a Hetzner VPS with Dokploy',
        ],
      },
      challenges: LIVE_WEBSITES['juan-tech-com'].challenges,
    }),
    status: 'propuesto',
    gate: 'aprobado',
    chosen: 'propuesto',
    recommended: 'propuesto',
    options: {
      'solo-quitar': {
        es: 'Solo quitar Neon Postgres, Hostinger y la linea de hosting, sin agregar nada: queda Next.js y Payload CMS',
        en: 'Only remove Neon Postgres, Hostinger and the hosting line, adding nothing: Next.js and Payload CMS remain',
        note: 'Cambio minimo, puede dejar un stack incompleto',
      },
      dejar: {
        es: 'Dejar la fila como esta',
        en: 'Leave the row as it is',
        note: 'Contradice el texto legal nuevo, que dice Hetzner con Dokploy',
      },
    },
    source: `${PROD_API}/websites?where[slug][equals]=juan-tech-com (lectura)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: EVIDENCE_JUAN_TECH,
    note: 'Opcion otras=dicto, con el stack real que Juan dio. Solo cambia la linea de hosting y los tags; los demas highlights y retos se conservan tal cual. Juan puede recortar Cloudinary y Resend de los tags si los ve como servicios y no como stack.',
  },
  {
    id: 'CUT-websites-apturio-com',
    kind: 'websites-row',
    label: 'Apturio: stack de la fila de Websites (sin cambio, Hostinger verificado)',
    target: 'websites:apturio-com#stack',
    loadAt: 'corte',
    current: liveSite('apturio-com'),
    status: 'propuesto',
    gate: 'propuesto',
    chosen: 'sin-cambio',
    recommended: 'sin-cambio',
    options: {
      'sin-cambio': {
        es: 'No cambiar nada: Next.js, Payload CMS y Hostinger se verifican desde fuera, y Neon Postgres no se puede verificar',
        en: 'Change nothing: Next.js, Payload CMS and Hostinger check out from the outside, and Neon Postgres cannot be verified',
        note: 'La fila no es un dato viejo en lo que se pudo comprobar. Juan confirma solo la base de datos.',
      },
    },
    source: `${PROD_API}/websites?where[slug][equals]=apturio-com (lectura)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: EVIDENCE_APTURIO,
    note: 'Hallazgo: la premisa de que esta fila estaba desactualizada no se sostiene para Hostinger. Las cabeceras de apturio.com dicen platform hostinger y panel hpanel. Juan confirma si la base de datos es Neon.',
  },
  {
    id: 'CUT-websites-aprendoclub-com',
    kind: 'websites-row',
    label: 'Aprendoclub: stack y linea de hosting de la fila de Websites (Vercel detras de Cloudflare)',
    target: 'websites:aprendoclub-com#stack,highlights',
    loadAt: 'corte',
    current: liveSite('aprendoclub-com'),
    desired: siteValue(['Next.js', 'Payload CMS', 'Neon Postgres', 'Vercel', 'Cloudflare'], {
      highlights: {
        es: [
          'Plataforma Next.js + Payload CMS + Postgres para cursos online',
          'Desplegada en Vercel detrás de Cloudflare',
          'Estructura de contenido pensada para escalar cursos y lecciones',
        ],
        en: [
          'Next.js + Payload CMS + Postgres platform for online courses',
          'Deployed on Vercel behind Cloudflare',
          'Content structure built to scale courses and lessons',
        ],
      },
      challenges: LIVE_WEBSITES['aprendoclub-com'].challenges,
    }),
    status: 'propuesto',
    gate: 'aprobado',
    chosen: 'propuesto',
    recommended: 'propuesto',
    options: {
      'solo-quitar': {
        es: 'Solo quitar Hostinger y la linea de hosting, sin agregar nada',
        en: 'Only remove Hostinger and the hosting line, adding nothing',
        note: 'Cambio minimo, puede dejar un stack incompleto',
      },
      dejar: {
        es: 'Dejar la fila como esta',
        en: 'Leave the row as it is',
        note: 'Dice Hostinger y el sitio corre en Vercel',
      },
    },
    source: `${PROD_API}/websites?where[slug][equals]=aprendoclub-com (lectura)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: EVIDENCE_APRENDOCLUB,
    note: 'Cambia Hostinger por Vercel y suma Cloudflare, ambos verificados por cabeceras. Neon Postgres se conserva sin verificar: Juan confirma. aprendoseo.com redirige a este mismo sitio.',
  },
  {
    id: 'CUT-websites-loopsgrowth-com',
    kind: 'websites-row',
    label: 'Loops Growth como fila de Websites (no crear)',
    target: 'websites:loopsgrowth-com (fila inexistente)',
    loadAt: 'corte',
    current: 'Sin fila: produccion y dev listan 6 sitios y ninguno tiene el slug loopsgrowth-com',
    status: 'propuesto',
    gate: 'propuesto',
    chosen: 'no-crear',
    recommended: 'no-crear',
    options: {
      'no-crear': {
        es: 'No crear la fila: Juan no dio contenido y los marcadores del sandbox nunca llegan a Payload',
        en: 'Do not create the row: Juan gave no content and the sandbox placeholders never reach Payload',
        note: 'Loops Growth queda solo en Sobre mi, con la frase de D-12',
      },
      crear: {
        es: 'Crear la fila con datos que Juan dicte',
        en: 'Create the row with data Juan dictates',
        note: 'Verificado desde fuera: Astro y Cloudflare. Highlights, retos, rol y año los dicta Juan. Seria una fila nueva en el corte.',
      },
    },
    source: `${PROD_API}/websites (lectura, 6 filas)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: EVIDENCE_LOOPS,
    note: 'Sin desired: no hay nada que cargar con la opcion recomendada.',
  },
]

// ---------------------------------------------------------------------------
// 2. Testimonio, autor y traduccion de recursividad
// ---------------------------------------------------------------------------

export const RECURSIVIDAD_EN_BACKUP =
  'EN servido hoy: titulo "Recursion algorithms", 36 de 109 bloques de contenido del ES, 535 de 3831 palabras (14 %), meta title y meta description vacios; la pagina sale con noindex, follow. src/lib/translation-gaps.ts la mide en 22 % (4368 a 966 palabras, 2026-08-20)'

export const CUT_PEOPLE_AND_POSTS: CutItem[] = [
  {
    id: 'CUT-testimonial-patricia-ibarra',
    kind: 'testimonial',
    label: 'Cita de Patricia Ibarra (Estylopia, CEO): la ES y la EN no dicen lo mismo',
    target: `testimonials:${LIVE_TESTIMONIAL.id} (${LIVE_TESTIMONIAL.name}, ${LIVE_TESTIMONIAL.company}, ${LIVE_TESTIMONIAL.role})`,
    loadAt: 'corte',
    current: { es: LIVE_TESTIMONIAL.es, en: LIVE_TESTIMONIAL.en },
    status: 'propuesto',
    gate: 'propuesto',
    chosen: 'dejar',
    recommended: 'dejar',
    options: {
      dejar: {
        es: 'Dejar las dos citas como estan',
        en: 'Leave both quotes as they are',
        note: 'Cero cambios. ES y EN dicen cosas distintas: la EN es mas larga y cambia el sentido.',
      },
      confirmo: {
        es: 'Juan dice cual es la cita real en ES y EN y se alinea la traduccion en el corte',
        en: 'Juan says which quote is the real one in ES and EN and the translation is aligned at the cut',
        note: 'Juan pega el texto real en los dos idiomas. No se inventa ninguna cita (T-56-48).',
      },
    },
    source: `${PROD_API}/testimonials?locale=es y locale=en (lectura, totalDocs 1)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: ['GET /api/testimonials: una sola fila, id 1; el HTML de dev no trae ningun marcador de testimonio'],
    note: 'Se conserva solo el de Patricia Ibarra (D-20). La coleccion testimonials la lee master: un testimonio nuevo que Juan pegue en el admin aparece en produccion al instante, sin esperar al corte.',
  },
  {
    id: 'CUT-author-aprendoclub-experience',
    kind: 'author',
    label: 'Autor Juan Carlos Angulo: la experiencia de aprendoclub dice nov 2022 a feb 2026 y debe decir hoy',
    target: 'authors:juan-carlos-angulo#experience[1]',
    loadAt: 'corte',
    current: experienceValue(LIVE_AUTHOR_EXPERIENCE),
    desired: experienceValue({
      es: LIVE_AUTHOR_EXPERIENCE.es.map((r, i) => (i === 1 ? { ...r, endDate: null } : r)),
      en: LIVE_AUTHOR_EXPERIENCE.en.map((r, i) => (i === 1 ? { ...r, endDate: null } : r)),
    }),
    status: 'propuesto',
    gate: 'aprobado',
    chosen: 'propuesto',
    recommended: 'propuesto',
    options: {
      dejar: {
        es: 'Dejar la fecha de fin',
        en: 'Leave the end date',
        note: 'Contradice nov 2022 a hoy, que Juan aprobo en la linea de tiempo de Sobre mi (D-11)',
      },
    },
    source: `${PROD_API}/authors?locale=es y locale=en (lectura)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: ['56-04-SUMMARY, item abierto 3: la fila de autor contradice nov 2022 a hoy'],
    note: 'Solo cambia endDate de la fila de AprendoSEO a vacio (hoy). El nombre de la empresa en la fila (AprendoSEO) no se toca: renombrarlo a aprendoclub es decision de Juan. Un PATCH del arreglo reemplaza las tres filas, por eso el respaldo trae las tres completas.',
  },
  {
    id: 'CUT-post-translation-recursividad',
    kind: 'post-translation',
    label: 'Traduccion EN de /en/blog/cs-fundamentals/recursividad (aviso, traducir o diferir)',
    target: 'posts:recursividad#content(en)',
    loadAt: 'corte',
    current: { es: RECURSIVIDAD_EN_BACKUP, en: RECURSIVIDAD_EN_BACKUP },
    desired: 'Sin cambio de contenido: la pagina sigue sirviendo el aviso de traduccion y el noindex que ya existen (src/lib/translation-gaps.ts y TranslationNotice)',
    status: 'propuesto',
    gate: 'propuesto',
    chosen: 'aviso',
    recommended: 'aviso',
    options: {
      aviso: {
        es: 'Servir el aviso de traduccion existente (recomendada)',
        en: 'Keep serving the existing translation notice (recommended)',
        note: 'No cambia produccion y no cuesta trabajo. El aviso ya existe en la rama del rediseño y sale en dev; la pagina ya tiene noindex.',
      },
      traducir: {
        es: 'Traducir el post completo ahora',
        en: 'Translate the whole post now',
        note: 'Excede el presupuesto de este plan. Si Juan lo elige se planea aparte con /gsd-plan-phase 56 --gaps y se carga en el corte, porque el post lo lee master.',
      },
      diferir: {
        es: 'Diferir',
        en: 'Defer',
        note: 'Queda como deuda previa junto a los otros posts sin EN',
      },
    },
    source: `${PROD_API}/posts?where[slug][equals]=recursividad&locale=en (lectura); https://dev.juan-tech.com/search?q=recursividad (slug y ruta)`,
    capturedAt: CUT_CAPTURED_AT,
    evidence: [
      'Ruta confirmada: /blog/cs-fundamentals/recursividad (el slug es recursividad)',
      'Medicion de hoy sobre los nodos de texto de Lexical: ES 3831 palabras y 109 bloques, EN 535 palabras y 36 bloques',
      'El 22 % que cita la tarea sale de src/lib/translation-gaps.ts (2026-08-20, HTML servido: 4368 a 966 palabras); mi medicion de hoy sobre el contenido da 14 % por palabras y 33 % por bloques. Son instrumentos distintos.',
      'dev.juan-tech.com sirve el aviso (2 apariciones de "not available in English yet"); produccion de master solo trae el noindex',
    ],
    note: 'Ninguna opcion cambia el contenido en el corte, salvo traducir.',
  },
]

// ---------------------------------------------------------------------------
// 3. Fecha legal
// ---------------------------------------------------------------------------

export const CUT_LEGAL_DATE: CutItem = {
  id: 'CUT-legal-date-efectiva',
  kind: 'legal-date',
  label: 'Fecha efectiva de la politica de privacidad y de los terminos (el dia del corte)',
  target: 'legal-pages#effectiveDate (global sombra de 56-08)',
  loadAt: 'corte',
  current: 'Sin fecha: LegalView de master no muestra ninguna fecha de actualizacion y los docs pages privacy y terms no tienen ese campo',
  ...(LEGAL_EFFECTIVE_DATE !== '' ? { desired: LEGAL_EFFECTIVE_DATE } : {}),
  status: LEGAL_EFFECTIVE_DATE !== '' ? 'aprobado' : 'pendiente',
  gate: 'aprobado',
  chosen: 'dia-del-corte',
  recommended: 'dia-del-corte',
  options: {
    'dia-del-corte': {
      es: 'El dia del corte (D-09): un unico valor, LEGAL_EFFECTIVE_DATE en 56-legal-copy.ts, que fija el plan 56-14 justo antes del merge',
      en: 'The day of the cut (D-09): a single value, LEGAL_EFFECTIVE_DATE in 56-legal-copy.ts, set by plan 56-14 right before the merge',
      note: 'Pendiente por diseño hasta ese dia. No se inventa una fecha hoy.',
    },
  },
  source: 'scripts/db/data/56-legal-copy.ts LEGAL_EFFECTIVE_DATE; RESEARCH seccion 3',
  capturedAt: CUT_CAPTURED_AT,
  note: 'El gate de la fase 57 exige que el HTML de /privacy y /terms, en ES y EN, traiga la fecha.',
}

// ---------------------------------------------------------------------------
// 4. Items gobernados por decisiones que ya existen (alt, lecciones, CTAs, encabezados)
// ---------------------------------------------------------------------------

export const CUT_ALTS: CutItem[] = CAPTURE_ALTS.map((row) => ({
  id: `CUT-media-alt-${row.key}`,
  kind: 'media-alt' as const,
  label: `Alt de la captura ${row.key} (Media que master tambien lee)`,
  target: `media:${row.mediaSlug}#alt`,
  loadAt: 'corte' as const,
  current: { es: row.actualEs, en: row.actualEn },
  ...(row.loadable ? { desired: { es: row.es, en: row.en } } : {}),
  status: row.status,
  gate: 'aprobado' as const,
  governedBy: `ALT-${row.key}`,
  source: row.source,
  capturedAt: CUT_CAPTURED_AT,
  note: row.loadable
    ? 'El estado lo manda ALT-' + row.key + '. El respaldo es el alt que sirve hoy, en ES y EN.'
    : 'No cargable: la captura es una pagina de Vercel en pausa y Juan debe recapturar el sitio antes de redactar el alt. El estado lo manda ALT-' + row.key + '.',
}))

export const CUT_LESSONS: CutItem[] = flatLessons().map(({ slug, lesson }) => ({
  id: `CUT-lessons-${slug}-${lesson.n}`,
  kind: 'lessons' as const,
  label: `Leccion ${lesson.n} del caso ${slug}`,
  target: `case-studies:${slug}#lessons[${lesson.n - 1}]`,
  loadAt: 'corte' as const,
  current: 'Sin lecciones: el campo lessons no existe en el admin de master y la API de produccion no lo devuelve (case-studies trae 22 campos, ninguno es lessons)',
  desired: { es: { title: lesson.es.title, body: lesson.es.body }, en: { title: lesson.en.title, body: lesson.en.body } },
  status: lesson.status,
  gate: 'aprobado' as const,
  governedBy: lessonId(slug, lesson.n),
  source: caseUrl(slug),
  capturedAt: CUT_CAPTURED_AT,
  note: `El estado lo manda ${lessonId(slug, lesson.n)}. Un guardado en el admin de master podria borrar el campo, por eso se cargan en el corte (D-03).`,
}))

const ctaCorte = CTA_MAP.filter((e) => e.loadAt === 'corte')

export const CUT_CTAS: CutItem[] = ctaCorte.map((e): CutItem => {
  const governed = e.estado === 'aprobado' || e.estado === 'pendiente'
  const base = {
    id: `CUT-cta-master-${e.id}`,
    kind: 'cta-master' as const,
    label: `CTA ${e.id} (lo lee master)`,
    target: `${e.archivo} :: ${e.clave}`,
    loadAt: 'corte' as const,
    gate: governed ? ('aprobado' as const) : ('propuesto' as const),
    source: `scripts/db/data/56-cta-map.ts (${e.id})`,
    capturedAt: CUT_CAPTURED_AT,
  }
  if (governed) {
    return {
      ...base,
      current: { es: e.vigenteEs },
      ...(e.estado === 'aprobado' && e.en ? { desired: { es: e.es, en: e.en } } : {}),
      status: e.estado as DecisionStatus,
      governedBy: `CTA-${e.id}`,
      note: `El estado lo manda CTA-${e.id}. ${e.nota ?? ''}`.trim(),
    }
  }
  return {
    ...base,
    current: 'Bloques de CTA de cada landing de servicio (docs pages); no se tocan en esta fase y por eso no hay texto uno a uno',
    status: 'propuesto',
    chosen: 'dejar',
    recommended: 'dejar',
    options: { dejar: { es: 'Dejar los CTA de las landings como estan', en: 'Leave the landing CTAs as they are' } },
    note: 'Las landings de servicio las lee master y Juan no pidio cambios. Lima y Madrid quedan fuera de alcance.',
  }
})

const MASTER_HEADING_GROUPS: HeadingGroup[] = ['legal', 'codefixes', 'servicios', 'stack', 'busqueda']

const headingLine = (r: (typeof HEADINGS)[number], field: 'antes' | 'despues'): string =>
  `h${r.level} [${r.locale}] ${r[field]}`

export const CUT_HEADINGS: CutItem[] = MASTER_HEADING_GROUPS.map((g): CutItem => {
  const rows = HEADINGS.filter((r) => r.group === g && r.real && r.viveEn === 'master')
  const gov = HEAD_DECISIONS.find((d) => d.id === `HEAD-${g}`)
  const replace = rows.length > 0 && rows.every((r) => r.accion === 'reemplazar-al-cortar')
  return {
    id: `CUT-heading-master-${g}`,
    kind: 'heading-master' as const,
    label: `Encabezados con punto o coma que master sirve: grupo ${g} (${rows.length})`,
    target: `docs pages y messages del grupo ${g} (ver 56-headings-table.ts)`,
    loadAt: 'corte' as const,
    current: rows.map((r) => headingLine(r, 'antes')),
    ...(replace ? { desired: rows.map((r) => headingLine(r, 'despues')) } : {}),
    status: (gov?.status ?? 'pendiente') as DecisionStatus,
    gate: (gov?.gate ?? 'aprobado') as DecisionGate,
    governedBy: `HEAD-${g}`,
    source: 'scripts/db/data/56-headings-table.ts',
    capturedAt: CUT_CAPTURED_AT,
    note: replace
      ? `El texto legal nuevo reemplaza estos encabezados. El estado lo manda HEAD-${g}.`
      : `Afectan al SEO: no se cambian sin decision de Juan. El estado lo manda HEAD-${g}.`,
  }
})

// ---------------------------------------------------------------------------
// Conjunto y decisiones
// ---------------------------------------------------------------------------

export const CUTOVER_ITEMS: CutItem[] = [
  ...CUT_WEBSITES,
  ...CUT_PEOPLE_AND_POSTS,
  CUT_LEGAL_DATE,
  ...CUT_ALTS,
  ...CUT_LESSONS,
  ...CUT_CTAS,
  ...CUT_HEADINGS,
]

/** La decision de un item propio. `actual` y `propuesto` salen de current y desired. */
export function toDecision(item: CutItem): Decision {
  const cur = bilingual(item.current)
  const options: Record<string, DecisionOption> = {
    actual: { es: cur.es, en: cur.en, note: `Respaldo leido por GET el ${item.capturedAt}` },
  }
  if (item.desired !== undefined) {
    const des = bilingual(item.desired)
    options.propuesto = { es: des.es, en: des.en, ...(item.note ? { note: item.note } : {}) }
  }
  Object.assign(options, item.options)
  const chosen = item.chosen ?? (item.desired !== undefined ? 'propuesto' : 'actual')
  return {
    id: item.id,
    label: item.label,
    status: item.status,
    gate: item.gate,
    chosen,
    recommended: item.recommended ?? chosen,
    options,
    preview: item.evidence ? { es: `Evidencia:\n${item.evidence.join('\n')}` } : undefined,
    source: `${item.source} (carga: ${item.loadAt}; destino: ${item.target})`,
  }
}

/** Items propios: los gobernados ya tienen su decision en ALT-, LESSON-, CTA- o HEAD-. */
export const OWNED_ITEMS: CutItem[] = CUTOVER_ITEMS.filter((i) => i.governedBy === undefined)

export const DECISIONS: Decision[] = OWNED_ITEMS.map(toDecision)
