/**
 * Tabla antes y despues de los encabezados con punto o coma (plan 56-07, D-17).
 *
 * ORIGEN REPRODUCIBLE. No existe en el repo ninguna lista de "36 encabezados". La tabla sale de
 *   BASE_URL=https://dev.juan-tech.com node scripts/verify/54-page-contract.mjs
 * (solo HTTP de lectura), corrida el 2026-11-10: 66 avisos de h2 y h3 en 30 rutas, 52 textos
 * unicos (nivel y texto), de los cuales 13 son falsos positivos y 39 llevan punto o coma de
 * verdad. Con las 2 lecciones nuevas que todavia no estan en dev, la tabla lista 41 reales.
 * El 40 de RESEARCH 7 sale de contar "Dr. Manuel A. Vargas Hidalgo" como real: ese punto es de
 * la abreviatura y de la inicial, no de puntuacion del encabezado.
 *
 * SOLO SE DOCUMENTA. Ninguna fila cambia un encabezado en ningun archivo ni en la base
 * (T-56-23). Todos los "despues" son PROPUESTAS en la voz de Juan (research/voice-and-tone-juan.md,
 * regla 9: sin puntos, comas, dos puntos, punto y coma, puntos suspensivos ni exclamaciones; en
 * primera persona; sin agencia). Los EN van marcados `propuesto` junto con todo lo demas: nada
 * esta aprobado. Lo que `master` ya sirve afecta SEO (cada h2 y h3 indexado cuenta) y por defecto
 * NO se toca: Juan decide por grupo (ids HEAD-<grupo>).
 *
 * Los falsos positivos son el regex del contrato, que cuenta cualquier "." o ",": ".js" de Next.js
 * y llms.txt, el separador de miles de 86,000, la abreviatura Dr. y la inicial A. Se propone afinar
 * el regex a un punto o coma seguido de espacio o de fin de cadena (ver isRealPunctuation).
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision } from './56-content-decisions'

export type HeadingGroup = 'legal' | 'lecciones' | 'codefixes' | 'servicios' | 'stack' | 'busqueda' | 'falso-positivo'
export type HeadingLocale = 'es' | 'en' | 'ambos'
/** Donde vive el encabezado hoy: `master` lo sirve, `nuevo` solo existe en contenido nuevo de la rama. */
export type HeadingLivesIn = 'master' | 'nuevo'
export type HeadingAction =
  | 'reemplazar-al-cortar'
  | 'decidir-juan'
  | 'resuelta-en-56-06'
  | 'ninguna-falso-positivo'

export type HeadingRow = {
  id: string
  level: 2 | 3
  /** Texto servido hoy. */
  antes: string
  /** Propuesta. Vacio solo en falsos positivos. */
  despues: string
  locale: HeadingLocale
  /** Rutas de dev donde aparece (sin el prefijo /en cuando el locale es en: va completa). */
  routes: string[]
  group: HeadingGroup
  /** true si lleva punto o coma de puntuacion real. */
  real: boolean
  /** true si el contrato contra dev lo vio (las lecciones nuevas todavia no estan en dev). */
  enDev: boolean
  viveEn: HeadingLivesIn
  accion: HeadingAction
  nota?: string
}

/**
 * Regex afinado: punto o coma de puntuacion = seguido de espacio o de fin de cadena, despues de
 * descontar abreviaturas (Dr., Dra., Sr., Lic., Ing.) e iniciales sueltas (A.). No cuenta ".js",
 * ".txt" ni el separador de miles (86,000).
 */
export function isRealPunctuation(text: string): boolean {
  const t = text
    .replace(/\b(?:Dr|Dra|Sr|Sra|Lic|Ing|Mr|Mrs|Ms)\./g, 'X')
    .replace(/\b[A-ZÁÉÍÓÚÑ]\./g, 'X')
  return /[.,](?:\s|$)/.test(t)
}

/** Puntuacion que la regla 9 de la voz prohibe en una propuesta (la interrogacion de un FAQ si se permite). */
export function bannedInProposal(text: string): string[] {
  const out: string[] = []
  if (/[.,;:!¡]/.test(text)) out.push('lleva punto, coma, dos puntos, punto y coma o exclamacion')
  if (text.includes(String.fromCharCode(0x2026))) out.push('lleva puntos suspensivos')
  if (text.includes(String.fromCharCode(0x2014)) || text.includes(String.fromCharCode(0x2013))) out.push('lleva raya larga o media')
  return out
}

/** Lee la salida de 54-page-contract.mjs y devuelve los avisos de encabezado (ruta, nivel, texto). */
export function parseContractWarnings(output: string): { route: string; level: 2 | 3; text: string }[] {
  const rows: { route: string; level: 2 | 3; text: string }[] = []
  for (const line of output.split('\n')) {
    const m = /^WARN (\S+): encabezado con punto o coma \(h([23]): (.*)\)\s*$/.exec(line)
    if (m) rows.push({ route: m[1], level: Number(m[2]) as 2 | 3, text: m[3] })
  }
  return rows
}

const PRIVACY = ['/privacy', '/en/privacy']
const TERMS = ['/terms', '/en/terms']
const SERVICES_ES = ['/servicios/seo-technical-audit', '/servicios/seo-consulting', '/servicios/fullstack-development', '/servicios/ai-seo-geo']

const legal = (
  id: string,
  antes: string,
  despues: string,
  locale: HeadingLocale,
  routes: string[],
): HeadingRow => ({
  id,
  level: 2,
  antes,
  despues,
  locale,
  routes,
  group: 'legal',
  real: true,
  enDev: true,
  viveEn: 'master',
  accion: 'reemplazar-al-cortar',
  nota: 'El punto es la numeración. Se reemplaza por el texto legal nuevo sin numeración (plan 56-08); el encabezado final lo fija 56-legal-copy.ts. Efecto en el corte, no en caliente.',
})

const master = (
  id: string,
  level: 2 | 3,
  group: HeadingGroup,
  locale: HeadingLocale,
  routes: string[],
  antes: string,
  despues: string,
  nota?: string,
): HeadingRow => ({
  id,
  level,
  antes,
  despues,
  locale,
  routes,
  group,
  real: true,
  enDev: true,
  viveEn: 'master',
  accion: 'decidir-juan',
  nota,
})

const falso = (id: string, level: 2 | 3, locale: HeadingLocale, routes: string[], antes: string, nota: string): HeadingRow => ({
  id,
  level,
  antes,
  despues: '',
  locale,
  routes,
  group: 'falso-positivo',
  real: false,
  enDev: true,
  viveEn: 'master',
  accion: 'ninguna-falso-positivo',
  nota,
})

export const HEADINGS: HeadingRow[] = [
  // ---- legal: 25 unicos (13 en ES, 12 en EN; "6. Cookies" es el mismo texto en los dos idiomas)
  legal('H-01', '1. Información que Recopilamos', 'Qué datos recojo', 'es', ['/privacy']),
  legal('H-02', '2. Cómo Usamos tus Datos', 'Cómo uso tus datos', 'es', ['/privacy']),
  legal('H-03', '3. Servicios de Terceros', 'Proveedores que tratan datos', 'es', ['/privacy']),
  legal('H-04', '4. Retención de Datos', 'Cuánto tiempo guardo tus datos', 'es', ['/privacy']),
  legal('H-05', '5. Tus Derechos', 'Tus derechos y cómo ejercerlos', 'es', ['/privacy']),
  legal('H-06', '6. Cookies', 'Cookies', 'ambos', PRIVACY),
  legal('H-07', '7. Formulario de Alta al Correo', 'Formulario de suscripción por correo', 'es', ['/privacy']),
  legal('H-08', '8. Retención y Baja', 'Cómo darte de baja', 'es', ['/privacy']),
  legal('H-09', '1. Aceptación de los Términos', 'Aceptación de los términos', 'es', ['/terms']),
  legal('H-10', '2. Servicios', 'Servicios', 'es', ['/terms']),
  legal('H-11', '3. Propiedad Intelectual', 'Propiedad intelectual', 'es', ['/terms']),
  legal('H-12', '4. Limitación de Responsabilidad', 'Limitación de responsabilidad', 'es', ['/terms']),
  legal('H-13', '5. Contacto', 'Contacto', 'es', ['/terms']),
  legal('H-14', '1. Information We Collect', 'What data I collect', 'en', ['/en/privacy']),
  legal('H-15', '2. How We Use Your Data', 'How I use your data', 'en', ['/en/privacy']),
  legal('H-16', '3. Third-Party Services', 'Third-party providers', 'en', ['/en/privacy']),
  legal('H-17', '4. Data Retention', 'How long I keep your data', 'en', ['/en/privacy']),
  legal('H-18', '5. Your Rights', 'Your rights', 'en', ['/en/privacy']),
  legal('H-19', '7. Newsletter Sign-up Form', 'Newsletter sign-up form', 'en', ['/en/privacy']),
  legal('H-20', '8. Retention and Opt-Out', 'How to unsubscribe', 'en', ['/en/privacy']),
  legal('H-21', '1. Acceptance of Terms', 'Acceptance of the terms', 'en', ['/en/terms']),
  legal('H-22', '2. Services', 'Services', 'en', ['/en/terms']),
  legal('H-23', '3. Intellectual Property', 'Intellectual property', 'en', ['/en/terms']),
  legal('H-24', '4. Limitation of Liability', 'Limitation of liability', 'en', ['/en/terms']),
  legal('H-25', '5. Contact', 'Contact', 'en', ['/en/terms']),

  // ---- lecciones nuevas (borrador del sandbox, ya resueltas en 56-case-lessons.ts del plan 56-06)
  {
    id: 'H-26',
    level: 3,
    antes: 'Escalar exige contenido específico, no solo marca',
    despues: 'Escalar exige contenido específico y no solo marca',
    locale: 'es',
    routes: ['/case-studies/pittsburgh-criminal-defense-legal-content-seo'],
    group: 'lecciones',
    real: true,
    enDev: false,
    viveEn: 'nuevo',
    accion: 'resuelta-en-56-06',
    nota: 'Borrador del sandbox, todavía no está en dev. Contenido nuevo: ya quedó sin coma en 56-case-lessons.ts. Verificar que la ruta del caso coincida cuando se cargue.',
  },
  {
    id: 'H-27',
    level: 3,
    antes: 'En un sitio nuevo, lo primero es que Google lo rastree',
    despues: 'En un sitio nuevo lo primero es que Google lo rastree',
    locale: 'es',
    routes: ['/case-studies/talleres-costura-miami-lanzamiento-seo-local'],
    group: 'lecciones',
    real: true,
    enDev: false,
    viveEn: 'nuevo',
    accion: 'resuelta-en-56-06',
    nota: 'Borrador del sandbox, todavía no está en dev. Contenido nuevo: ya quedó sin coma en 56-case-lessons.ts.',
  },

  // ---- home, bloque CodeFixes (lo sirve master desde el doc pages home)
  master('H-28', 2, 'codefixes', 'es', ['/'], 'Errores reales, con el commit que los corrige', 'Errores reales y el commit que los corrige', 'Bloque codeFixesBlock del doc pages home (semilla scripts/seed-home.ts).'),
  master('H-29', 2, 'codefixes', 'en', ['/en'], 'Real bugs, with the commit that fixes them', 'Real bugs and the commit that fixes them', 'Mismo bloque, locale EN.'),

  // ---- landings de servicio (las sirve master desde docs pages)
  master('H-30', 3, 'servicios', 'es', ['/servicios/seo-technical-audit'], 'También tengo un auditor automatizado, gratis', 'También tengo un auditor automatizado y gratis', 'Es también el respaldo del mensaje auditorCallout.heading de messages/es.json: si se cambia, se cambia en los dos sitios.'),
  master('H-31', 2, 'servicios', 'es', ['/servicios/seo-consulting'], 'El informe envejece, el sitio no deja de cambiar', 'El informe envejece y el sitio no deja de cambiar'),
  master('H-32', 2, 'servicios', 'es', ['/servicios/ai-seo-geo'], 'Si tu contenido no es citable, la respuesta cita a otro', 'Si tu contenido no es citable la respuesta cita a otro', 'Sin la coma la frase se lee seguida; alternativa a decidir: "Un contenido que no se puede citar lo cita otro".'),
  master('H-33', 3, 'servicios', 'en', ['/en/services/seo-technical-audit'], 'Do you just hand off a report, or do you also implement the fixes?', 'Do you only hand off a report or do you also implement the fixes?', 'Es una pregunta de FAQ: Juan aún no decidió si los FAQ conservan el signo de interrogación (voice-and-tone, pregunta abierta 2).'),
  master('H-34', 2, 'servicios', 'en', ['/en/services/seo-consulting'], 'The report goes stale, the site never stops changing', 'The report goes stale and the site never stops changing'),
  master('H-35', 2, 'servicios', 'en', ['/en/services/ai-seo-geo'], "If your content isn't citable, someone else gets the mention", "Content that isn't citable gives the mention to someone else"),

  // ---- stack
  master('H-36', 2, 'stack', 'es', ['/stack'], 'Desarrollo, CMS y medios', 'Desarrollo con CMS y medios', 'Doc pages stack. Es el nombre de una categoría de herramientas; el cambio de forma altera un poco el sentido.'),
  master('H-37', 2, 'stack', 'en', ['/en/stack'], 'Development, CMS & media', 'Development with CMS and media', 'Doc pages stack, locale EN. Además cambia el "&" por "and".'),
  master('H-38', 2, 'stack', 'en', ['/en/stack'], "What I'd choose today, starting from zero", "What I'd choose today if I started from zero", 'Clave de messages stackPage.elegiriaHoyHeading (EN). El ES ya no lleva coma: "Qué elegiría hoy si empezara de cero".'),

  // ---- titulos de posts en /search?q=seo (colecciones posts y case-studies)
  master('H-39', 2, 'busqueda', 'ambos', ['/search?q=seo', '/en/search?q=seo'], 'Estrategia SEO Global 2026: Arquitectura, Contenido y Autoridad', 'Estrategia SEO global 2026 de la arquitectura a la autoridad', 'Título de un post. Cambiarlo toca el h1, el meta título y la URL indexada del post: recomendado no tocar.'),
  master('H-40', 2, 'busqueda', 'ambos', ['/search?q=seo', '/en/search?q=seo'], 'Topic clusters SEO: Mejora tu posicionamiento y organización de con...', 'Topic clusters SEO para mejorar tu posicionamiento y la organización de tu contenido', 'El título de la base (post id 39, slug topic-clusters-seo) ya viene cortado con puntos suspensivos: es un defecto del dato, no de la vista. La propuesta completa el título, confirmar con Juan el texto original.'),
  master('H-41', 2, 'busqueda', 'ambos', ['/search?q=seo', '/en/search?q=seo'], 'Core Web Vitals Guide 2026: Optimizing LCP, CLS, and INP', 'Core Web Vitals Guide 2026 to optimize LCP and CLS and INP', 'Título de un post en inglés. Una lista de tres métricas no se escribe sin comas sin sonar forzada: recomendado no tocar.'),

  // ---- falsos positivos (13): el regex cuenta cualquier "." o ","
  falso('H-42', 3, 'es', ['/', '/en'], 'Desarrollo con Next.js y Payload', 'El punto es el ".js" del nombre Next.js (home-page.services.items[1].title).'),
  falso('H-43', 3, 'ambos', ['/', '/en'], 'Dr. Manuel A. Vargas Hidalgo', 'Abreviatura Dr. e inicial A. del nombre propio de un cliente. Cuenta como real si se aplica el criterio de RESEARCH 7 (40) y como falso positivo con el regex afinado (39).'),
  falso('H-44', 3, 'es', ['/'], 'Escalar el contenido legal educativo a más de 86,000 clics orgánicos anuales para un despacho de defensa criminal', 'La coma es el separador de miles de 86,000 (título del caso en la home).'),
  falso('H-45', 2, 'ambos', ['/search?q=seo', '/en/search?q=seo'], 'Escalar el contenido legal educativo a más de 86,000 clics orgánicos anuales para un despacho de defensa criminal', 'Separador de miles en el título del caso.'),
  falso('H-46', 3, 'en', ['/en'], 'Scaling educational legal content to over 86,000 annual organic clicks for a criminal defense firm', 'Separador de miles en el título del caso (EN).'),
  falso('H-47', 3, 'es', ['/servicios/seo-technical-audit', '/servicios/seo-consulting', '/servicios/fullstack-development', '/servicios/ai-seo-geo'], 'Migración a Next.js sin perder tráfico orgánico', 'El punto es el ".js" de Next.js; aparece en las cuatro landings de servicio.'),
  falso('H-48', 3, 'en', ['/en/services/seo-technical-audit', '/en/services/seo-consulting', '/en/services/fullstack-development', '/en/services/ai-seo-geo'], 'Migrating to Next.js without losing organic traffic', 'El punto es el ".js" de Next.js; aparece en las cuatro landings de servicio EN.'),
  falso('H-49', 2, 'ambos', ['/search?q=seo', '/en/search?q=seo'], 'Migración a Next.js sin perder tráfico orgánico', '".js" de Next.js en el título del caso dentro de la búsqueda.'),
  falso('H-50', 2, 'ambos', ['/search?q=seo', '/en/search?q=seo'], 'Next.js SEO Best Practices for Optimal Visibility', '".js" de Next.js en el título de un post.'),
  falso('H-51', 3, 'es', ['/servicios/fullstack-development'], '¿Por qué Next.js/Payload en vez de WordPress?', '".js" de Next.js. La pregunta lleva signos de interrogación, que no cuentan como puntuación prohibida mientras Juan decida que los FAQ los conservan.'),
  falso('H-52', 3, 'es', ['/servicios/ai-seo-geo'], '¿Qué es exactamente el archivo llms.txt?', '".txt" del nombre del archivo llms.txt.'),
  falso('H-53', 3, 'en', ['/en/services/fullstack-development'], 'Why Next.js/Payload instead of WordPress?', '".js" de Next.js.'),
  falso('H-54', 3, 'en', ['/en/services/ai-seo-geo'], 'What exactly is the llms.txt file?', '".txt" del nombre del archivo llms.txt.'),
]

/** Claves de messages con puntuacion en una clave Heading o Title, para el handoff. Informativo, no son filas. */
export const MESSAGE_KEYS_NOTE: { key: string; locale: 'es' | 'en'; value: string; estado: string }[] = [
  { key: 'auditorCallout.heading', locale: 'es', value: 'También tengo un auditor automatizado, gratis', estado: 'Respaldo del bloque; mismo texto que H-30. Lo sirve el sitio vivo.' },
  { key: 'stackPage.elegiriaHoyHeading', locale: 'en', value: "What I'd choose today, starting from zero", estado: 'Igual a H-38. Lo sirve el sitio vivo.' },
  { key: 'home.heroTitle', locale: 'es', value: 'Juan Carlos Angulo: Ingeniería de Software y SEO Técnico', estado: 'Código muerto: sin uso en src. Se puede borrar sin efecto visible.' },
  { key: 'home.heroSubtitle', locale: 'es', value: 'Arquitecturas de alto rendimiento y estrategias de crecimiento orgánico', estado: 'Código muerto: sin uso en src.' },
]

// ---------------------------------------------------------------------------- decisiones

const GROUP_LABEL: Record<Exclude<HeadingGroup, 'falso-positivo'>, string> = {
  legal: 'Encabezados numerados de privacidad y términos',
  lecciones: 'Encabezados de las lecciones nuevas',
  codefixes: 'Encabezado del bloque de errores de la home',
  servicios: 'Encabezados de las landings de servicio',
  stack: 'Encabezados de la página Stack',
  busqueda: 'Títulos de posts que salen en la búsqueda',
}

const lines = (rows: HeadingRow[], locale: 'es' | 'en') =>
  rows
    .filter((r) => r.locale === locale || r.locale === 'ambos')
    .map((r) => `${r.antes}  =>  ${r.despues}`)
    .join('\n')

const group = (g: HeadingGroup) => HEADINGS.filter((r) => r.group === g && r.real)

function masterDecision(g: Exclude<HeadingGroup, 'falso-positivo' | 'legal' | 'lecciones'>): Decision {
  const rows = group(g)
  return {
    id: `HEAD-${g}`,
    label: `${GROUP_LABEL[g]} (${rows.length})`,
    status: 'aprobado',
    gate: 'aprobado',
    chosen: 'no-tocar',
    recommended: 'no-tocar',
    options: {
      'no-tocar': {
        note: 'Default. Master ya sirve estos encabezados y son SEO: no se cambian sin tu decisión.',
      },
      cambiar: {
        es: lines(rows, 'es'),
        en: lines(rows, 'en'),
        note: 'Se cargarían en el corte con respaldo del valor actual. Cada encabezado indexado que cambia es una decisión de SEO.',
      },
    },
    preview: { es: lines(rows, 'es'), en: lines(rows, 'en') },
    source:
      'scripts/verify/54-page-contract.mjs contra dev, 2026-11-10; no-tocar aprobado por Juan 2026-11-10 (aprobaciones-juan.md)',
  }
}

export const DECISIONS: Decision[] = [
  {
    id: 'HEAD-alcance',
    label: 'Alcance: 39 reales (40 si cuentas al Dr. Vargas) y no 36',
    status: 'aprobado',
    gate: 'aprobado',
    chosen: '39-reales',
    recommended: '39-reales',
    options: {
      '39-reales': {
        note: 'La tabla reproducible: 52 textos únicos, 13 falsos positivos, 39 con punto o coma real (41 con las 2 lecciones nuevas que aún no están en dev).',
      },
      '36-lista-de-juan': {
        note: 'Si tienes la lista de 36, pégala: no existe en el repo y no se reproduce con ningún criterio razonable.',
      },
    },
    source: 'scripts/db/data/56-headings-table.ts',
  },
  {
    id: 'HEAD-legal',
    label: `${GROUP_LABEL.legal} (25)`,
    status: 'propuesto',
    gate: 'propuesto',
    chosen: 'reemplazar-al-cortar',
    recommended: 'reemplazar-al-cortar',
    options: {
      'reemplazar-al-cortar': {
        es: lines(group('legal'), 'es'),
        en: lines(group('legal'), 'en'),
        note: 'El punto es la numeración. Se reemplazan al cortar por el texto legal nuevo sin numeración (plan 56-08). Los encabezados finales los fija 56-legal-copy.ts.',
      },
    },
    source: 'doc pages privacy y terms; texto nuevo en el global sombra legal-pages',
  },
  {
    id: 'HEAD-lecciones',
    label: `${GROUP_LABEL.lecciones} (2)`,
    status: 'propuesto',
    gate: 'propuesto',
    chosen: 'resuelta',
    recommended: 'resuelta',
    options: {
      resuelta: {
        es: lines(group('lecciones'), 'es'),
        note: 'Ya quedaron sin coma en 56-case-lessons.ts (plan 56-06). Contenido nuevo: no afecta a master.',
      },
    },
    source: 'scripts/db/data/56-case-lessons.ts',
  },
  masterDecision('codefixes'),
  masterDecision('servicios'),
  masterDecision('stack'),
  masterDecision('busqueda'),
]
