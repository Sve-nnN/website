/**
 * Copy ES y EN del global `home-page` (home y Contacto), plan 56-09.
 *
 * Fuente unica del copy de la home. Se arma desde:
 *   - las decisiones D-22a a D-22g de 56-options-home.ts (titulo, texto y tagline del hero,
 *     estadistica, titulo y texto de la medicion, lead de servicios, item SEO tecnico);
 *   - la tabla del lote 1 de CTAs de 56-cta-lote1.ts (aprobada por Juan el 2026-11-10);
 *   - el copy vigente del sandbox (54), verbatim, para todo lo que Juan no pidio cambiar.
 *
 * Cambiar una eleccion es cambiar la linea "Elegida:" de .planning/phase-56-prep/textos-pendientes-juan.md
 * y regenerar scripts/db/data/56-juan-inputs.json. Aqui no se inventan opciones.
 *
 * D-23: el copy NO tiene claves de title ni de meta description de pagina. Solo campos del global.
 *
 * Valores vacios a proposito (mergeGroup de 54-seed-lib conserva las claves que el copy no trae,
 * asi que una clave omitida dejaria vivo el valor viejo de la base):
 *   - hero.statValue y hero.statCaption: '' cuando Juan eligio "ninguna" estadistica (D-22c).
 *     Hero.tsx solo pinta la tarjeta cuando statValue tiene texto.
 *   - vitals.items[].note: '' porque se quitan las notas "Bueno: hasta" (D-22e).
 *
 * El EN omite los campos no localizados (icon, tags, servicePage, porcentajes, ctaHref): la escritura
 * EN conserva los de la fila existente. El centinela del respaldo de idioma es `tagline` (cache.ts):
 * si queda vacio, TODA la pagina muestra el aviso de traduccion. Por eso siempre se siembra.
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision } from './56-content-decisions'
import { resolveDecision } from './56-content-decisions'
import { CTA_LOTE1 } from './56-cta-lote1'
import {
  HERO_MUESTRA_ESTADISTICA,
  HERO_STATS,
  HOME_DECISIONS,
  QUITAR_FRASE_GOOGLEBOT,
  QUITAR_NOTAS_BUENO_HASTA,
} from './56-options-home'

export type HomeLocale = 'es' | 'en'

type DeepPartial<T> = T extends readonly (infer U)[]
  ? DeepPartial<U>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T

/** Campos que no son de texto localizado: el EN no los lleva. */
export const NON_LOCALIZED_KEYS = ['icon', 'tags', 'servicePage', 'goodPct', 'midPct', 'poorPct', 'markerPct', 'ctaHref'] as const

/** Textos EN que quedaron sin traduccion pegada por Juan y cayeron al ES. La autoprueba exige que este vacio. */
export const EN_FALLBACKS: string[] = []

/** Divide el titulo del hero en dos lineas: la primera termina en "tecnico/a" (ES) o "consultant/consulting" (EN). */
export function splitHeroTitle(title: string, locale: HomeLocale): [string, string] {
  const re = locale === 'es' ? /^(.*?técnic[oa])\s+(.+)$/ : /^(.*?(?:consultant|consulting))\s+(.+)$/
  const m = re.exec(title)
  return m ? [m[1], m[2]] : [title, '']
}

/** Quita la oracion sobre Googlebot y deja las demas (D-22g). */
export function stripGooglebot(text: string): string {
  const parts = text.split(/(?<=[.!?])\s+/).filter((s) => !/googlebot/i.test(s))
  return parts.join(' ')
}

function option(id: string) {
  const d: Decision | undefined = HOME_DECISIONS[id]
  if (!d) throw new Error(`56-home-copy: falta la decision ${id}`)
  return resolveDecision(d) ?? {}
}

function ctaRow(id: string) {
  const r = CTA_LOTE1.find((x) => x.id === id)
  if (!r) throw new Error(`56-home-copy: falta la fila ${id} del lote 1`)
  return r
}

/** Arma el copy completo de un idioma. En EN omite los campos no localizados (ver NON_LOCALIZED_KEYS). */
export function buildHomeCopy(locale: 'es'): HomeCopy
export function buildHomeCopy(locale: 'en'): HomeCopyEn
export function buildHomeCopy(locale: HomeLocale): HomeCopy | HomeCopyEn
export function buildHomeCopy(locale: HomeLocale): HomeCopy | HomeCopyEn {
  const es = locale === 'es'
  /** Elige el texto del idioma. */
  const t = (esText: string, enText: string): string => (es ? esText : enText)

  /** Texto de una decision D-22 en el idioma pedido. Si el EN no existe cae al ES y se registra. */
  const dec = (id: string): string => {
    const o = option(id)
    const esText = o.es ?? ''
    if (es) return esText
    if (o.en) return o.en
    EN_FALLBACKS.push(id)
    return esText
  }

  /** Texto de una fila del lote 1: el aprobado, o el vigente ES / la traduccion fiel EN si la fila sigue pendiente. */
  const cta = (id: string, enTranslation?: string): string => {
    const r = ctaRow(id)
    if (es) return r.es
    if (r.en) return r.en
    if (enTranslation) return enTranslation
    EN_FALLBACKS.push(`CTA-${id}`)
    return r.es
  }

  // D-22a: titulo en dos lineas.
  const [titleLine1, titleLine2] = splitHeroTitle(dec('D-22a'), locale)

  // D-22c: estadistica. Con "ninguna" las dos claves van vacias (ver nota del encabezado).
  let statValue = ''
  let statCaption = ''
  if (HERO_MUESTRA_ESTADISTICA) {
    const key = HOME_DECISIONS['D-22c'].chosen as string
    const stat = HERO_STATS[key]
    if (stat) {
      statValue = stat.valor
      const enLeyenda = option('D-22c').en
      if (es) statCaption = stat.leyenda
      else if (enLeyenda) statCaption = enLeyenda
      else {
        EN_FALLBACKS.push('D-22c')
        statCaption = stat.leyenda
      }
    }
  }

  const noGooglebot = (s: string): string => (QUITAR_FRASE_GOOGLEBOT ? stripGooglebot(s) : s)
  const vitalNote = (esNote: string, enNote: string): string => (QUITAR_NOTAS_BUENO_HASTA ? '' : t(esNote, enNote))

  const copy = {
    tagline: dec('D-22d'),
    hero: {
      eyebrow: t('Ingeniero de software y consultor SEO técnico', 'Software engineer and technical SEO consultant'),
      titleLine1,
      titleLine2,
      lead: dec('D-22b'),
      ctaLabel: cta('hero-cta'),
      ctaHref: '#contacto',
      statValue,
      statCaption,
    },
    vitals: {
      title: dec('D-22e'),
      lead: dec('D-22f'),
      measurementNote: t(
        'Medido en juan-tech.com el 6 de noviembre de 2026 con PageSpeed Insights en móvil (laboratorio). El TTFB sale de curl. INP no aparece porque el sitio aún no tiene datos de campo de Chrome, así que lo reemplaza el TBT.',
        'Measured on juan-tech.com on November 6, 2026 with PageSpeed Insights on mobile (lab). TTFB comes from curl. INP does not appear because the site does not have Chrome field data yet, so TBT replaces it.',
      ),
      items: [
        {
          name: 'LCP',
          desc: t('Cuánto tarda en pintarse el elemento principal', 'How long the main element takes to paint'),
          value: '1.9 s',
          label: t('1.9 segundos', '1.9 seconds'),
          goodPct: 41.7,
          midPct: 25,
          poorPct: 33.3,
          markerPct: 31.7,
          note: vitalNote('Bueno: hasta 2.5 s', 'Good: up to 2.5 s'),
        },
        {
          name: 'CLS',
          desc: t('Cuánto se mueve el diseño mientras carga', 'How much the layout shifts while it loads'),
          value: '0',
          label: '0',
          goodPct: 25,
          midPct: 37.5,
          poorPct: 37.5,
          markerPct: 1.5,
          note: vitalNote('Bueno: hasta 0.1', 'Good: up to 0.1'),
        },
        {
          name: 'TBT',
          desc: t(
            'Cuánto bloquea el JavaScript a la página mientras carga',
            'How much JavaScript blocks the page while it loads',
          ),
          value: '13 ms',
          label: t('13 milisegundos', '13 milliseconds'),
          goodPct: 20,
          midPct: 40,
          poorPct: 40,
          markerPct: 1.3,
          note: vitalNote('Bueno: hasta 200 ms', 'Good: up to 200 ms'),
        },
        {
          name: 'TTFB',
          desc: t('Cuánto tarda el servidor en dar el primer byte', 'How long the server takes to send the first byte'),
          value: '0.7 s',
          label: t('0.7 segundos', '0.7 seconds'),
          goodPct: 32,
          midPct: 40,
          poorPct: 28,
          markerPct: 28.8,
          note: vitalNote('Bueno: hasta 0.8 s', 'Good: up to 0.8 s'),
        },
      ],
    },
    services: {
      title: t('Servicios de SEO técnico y desarrollo', 'Technical SEO and development services'),
      lead: noGooglebot(dec('D-22g')),
      ctaLabel: cta('services-cta'),
      items: [
        {
          icon: 'search',
          title: t('SEO técnico', 'Technical SEO'),
          body: noGooglebot(dec('D-22g-item')),
          tags: [{ tag: 'hreflang' }, { tag: 'canonical' }, { tag: 'sitemap' }, { tag: 'schema' }],
          servicePage: 'seo-technical-audit',
        },
        {
          icon: 'code',
          title: t('Desarrollo con Next.js y Payload', 'Development with Next.js and Payload'),
          body: t(
            'Construyo con Next.js y Payload CMS y dejo el SEO resuelto desde el primer commit: rutas, metadatos, sitemap y datos estructurados.',
            'I build with Next.js and Payload CMS and leave the SEO solved from the first commit: routes, metadata, sitemap and structured data.',
          ),
          tags: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }, { tag: 'PostgreSQL' }],
          servicePage: 'fullstack-development',
        },
        {
          icon: 'server',
          title: t('Infraestructura y servidores', 'Infrastructure and servers'),
          body: t(
            'Configuro el servidor, los headers y la caché. Cuando el TTFB sube, casi siempre el problema está en el servidor.',
            'I set up the server, the headers and the cache. When TTFB goes up, the problem is almost always in the server.',
          ),
          tags: [{ tag: 'TTFB' }, { tag: 'headers' }, { tag: 'caché' }],
        },
        {
          icon: 'gauge',
          title: t('Rendimiento web', 'Web performance'),
          body: t(
            'Mido LCP, CLS e INP y ataco primero lo que más pesa: imágenes, fuentes y JavaScript.',
            'I measure LCP, CLS and INP and go after what weighs the most first: images, fonts and JavaScript.',
          ),
          tags: [{ tag: 'LCP' }, { tag: 'CLS' }, { tag: 'INP' }],
        },
        {
          icon: 'sparkles',
          title: t('SEO para IA y GEO', 'SEO for AI and GEO'),
          body: t(
            'Estructuro el contenido para que ChatGPT, Perplexity y las respuestas de IA de Google puedan citarlo.',
            "I structure the content so ChatGPT, Perplexity and Google's AI answers can cite it.",
          ),
          tags: [{ tag: 'ChatGPT' }, { tag: 'Perplexity' }],
          servicePage: 'ai-seo-geo',
        },
      ],
    },
    cases: {
      title: t('Resultados en Search Console', 'Results in Search Console'),
      lead: t(
        'Cada caso indica los periodos que compara.',
        'Each case states the periods it compares.',
      ),
      ctaLabel: cta('cases-cta'),
      metricSuffix: t('clics interanuales', 'year-over-year clicks'),
      note: t(
        'Los datos salen de Search Console.',
        'The data comes from Search Console.',
      ),
    },
    process: {
      title: t('Mi proceso de la auditoría a la medición', 'My process from audit to measurement'),
      steps: [
        {
          icon: 'search',
          title: t('Audito', 'Audit'),
          body: t(
            'Reviso rastreo, indexación, Core Web Vitals y datos estructurados. Parto de lo que Google ve hoy.',
            'I review crawling, indexing, Core Web Vitals and structured data. I start from what Google sees today.',
          ),
        },
        {
          icon: 'list',
          title: t('Priorizo', 'Prioritize'),
          body: t(
            'Ordeno los hallazgos por el impacto que tienen en el tráfico, sin importar cuántos avisos genere cada herramienta.',
            'I rank the findings by the impact they have on traffic, no matter how many warnings each tool generates.',
          ),
        },
        {
          icon: 'wrench',
          title: t('Corrijo', 'Fix'),
          body: t(
            'Aplico el cambio en el código o dejo el cambio exacto para que lo aplique tu equipo.',
            'I apply the change in the code or leave the exact change for your team to apply.',
          ),
        },
        {
          icon: 'chart',
          title: t('Mido', 'Measure'),
          body: t(
            'Comparo Search Console y los Core Web Vitals reales antes y después.',
            'I compare Search Console and real Core Web Vitals before and after.',
          ),
        },
      ],
    },
    sites: {
      title: t('Sitios web que construí', 'Websites I built'),
      ctaLabel: cta('sites-cta'),
    },
    about: {
      title: t('Ingeniero de software que trabaja el SEO', 'Software engineer who works on SEO'),
      seoLabel: t('proyectos de SEO', 'SEO projects'),
      devLabel: t('proyectos de desarrollo', 'development projects'),
      paragraphs: [
        {
          text: t(
            'Trabajo el SEO desde el código. Construyo con Next.js y con un CMS headless como Payload, resuelvo el SEO desde el primer commit y audito antes de construir.',
            'I work on SEO from the code. I build with Next.js and a headless CMS like Payload, solve the SEO from the first commit and audit before building.',
          ),
        },
        {
          text: t(
            'Cuido la accesibilidad y parto del móvil para diseñar. Trabajo en español e inglés.',
            'I care about accessibility and design starting from mobile. I work in Spanish and English.',
          ),
        },
      ],
      chips: [
        { label: t('SEO técnico', 'Technical SEO') },
        { label: t('Rendimiento web', 'Web performance') },
        { label: t('Infraestructura', 'Infrastructure') },
        { label: t('Arquitectura escalable', 'Scalable architecture') },
        { label: t('Accesibilidad', 'Accessibility') },
      ],
      // Solo caption. Las imágenes las enlaza el script 21 tras subirlas a Cloudinary.
      photos: [
        { caption: t('Taller de SEO técnico en Venezuela SEO Fest 2024', 'Technical SEO workshop at Venezuela SEO Fest 2024') },
        {},
        {},
      ],
    },
    testimonials: {
      title: t('Clientes que trabajaron conmigo', 'Clients who worked with me'),
    },
    faq: {
      title: t('Preguntas frecuentes', 'Frequently asked questions'),
      items: [
        {
          question: t('¿Qué incluye la Auditoría 360?', 'What does the 360 Audit include?'),
          answer: t(
            'Reviso rastreo, indexación, Core Web Vitals, datos estructurados, contenido y SEO para IA. Entrego un plan de corrección ordenado por impacto.',
            'I review crawling, indexing, Core Web Vitals, structured data, content and SEO for AI. I deliver a fix plan ordered by impact.',
          ),
        },
        {
          question: t('¿Qué recibo y cuánto tarda?', 'What do I get and how long does it take?'),
          answer: t(
            'Recibes un informe con el plan de corrección ordenado por impacto, y lo entrego en 10 días hábiles. Escríbeme y te cuento cómo lo adapto al tamaño de tu sitio.',
            'You get a report with the fix plan ordered by impact, and I deliver it in 10 business days. Write to me and I will tell you how I adapt it to the size of your site.',
          ),
        },
        {
          question: t('¿Trabajas con mi equipo de desarrollo?', 'Do you work with my development team?'),
          answer: t(
            'Sí. Corrijo el código yo mismo o dejo el cambio exacto para que tu equipo lo aplique.',
            'Yes. I fix the code myself or leave the exact change for your team to apply.',
          ),
        },
        {
          question: t('¿Cómo mido el éxito de las optimizaciones?', 'How do you measure the success of the optimizations?'),
          answer: t(
            'Comparo Search Console y Core Web Vitals reales antes y después. Las cifras de los casos salen de ahí.',
            'I compare Search Console and real Core Web Vitals before and after. The figures in the case studies come from there.',
          ),
        },
        {
          question: t('¿En qué idiomas trabajas?', 'Which languages do you work in?'),
          answer: t(
            'Trabajo en español e inglés. Audito, escribo y construyo en los dos idiomas.',
            'I work in Spanish and English. I audit, write and build in both languages.',
          ),
        },
      ],
    },
    cta: {
      title: cta('cierre-titulo'),
      lead: cta('cierre-lead'),
    },
    contact: {
      stepsTitle: t('Cómo empezamos', 'How we start'),
      faqTitle: t('Antes de escribir', 'Before you write'),
      steps: [
        {
          title: cta('contact-step-1', 'You tell me about the project'),
          body: t(
            'Cuéntame de qué se trata y qué problema quieres resolver.',
            'Tell me what it is about and what problem you want to solve.',
          ),
        },
        {
          title: cta('contact-step-2', 'I look at what Google sees today'),
          body: t(
            'Empiezo por revisar tu sitio como lo ve el buscador.',
            'I start by reviewing your site the way the search engine sees it.',
          ),
        },
        {
          title: cta('contact-step-3', 'I tell you where to start'),
          body: t(
            'Te propongo el servicio que encaja y los primeros pasos.',
            'I suggest the service that fits and the first steps.',
          ),
        },
      ],
      infoRows: [
        { icon: 'clock', title: t('Respuesta', 'Response'), text: cta('contact-response-note') },
        {
          icon: 'map-pin',
          title: t('Dónde estoy', 'Where I am'),
          text: t(
            'Lima, Perú. Trabajo con clientes de toda Latinoamérica, España y Estados Unidos.',
            'Lima, Peru. I work with clients across Latin America, Spain and the United States.',
          ),
        },
        { icon: 'globe', title: t('Idiomas', 'Languages'), text: t('Español e inglés.', 'Spanish and English.') },
      ],
    },
  }

  return es ? copy : (stripNonLocalized(copy) as HomeCopyEn)
}

function stripNonLocalized(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripNonLocalized)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      if ((NON_LOCALIZED_KEYS as readonly string[]).includes(k)) continue
      out[k] = stripNonLocalized(v)
    }
    return out
  }
  return value
}

/** Forma del copy ES completo (la que leen los verificadores de 54 y 55). */
export type HomeCopy = {
  tagline: string
  hero: {
    eyebrow: string
    titleLine1: string
    titleLine2: string
    lead: string
    ctaLabel: string
    ctaHref: string
    statValue: string
    statCaption: string
  }
  vitals: {
    title: string
    lead: string
    measurementNote: string
    items: {
      name: string
      desc: string
      value: string
      label: string
      goodPct: number
      midPct: number
      poorPct: number
      markerPct: number
      note: string
    }[]
  }
  services: {
    title: string
    lead: string
    ctaLabel: string
    items: {
      icon: string
      title: string
      body: string
      tags: { tag: string }[]
      servicePage?: string
    }[]
  }
  cases: { title: string; lead: string; ctaLabel: string; metricSuffix: string; note: string }
  process: { title: string; steps: { icon: string; title: string; body: string }[] }
  sites: { title: string; ctaLabel: string }
  about: {
    title: string
    seoLabel: string
    devLabel: string
    paragraphs: { text: string }[]
    chips: { label: string }[]
    photos: { caption?: string }[]
  }
  testimonials: { title: string }
  faq: { title: string; items: { question: string; answer: string }[] }
  cta: { title: string; lead: string }
  contact: {
    stepsTitle: string
    faqTitle: string
    steps: { title: string; body: string }[]
    infoRows: { icon: string; title: string; text: string }[]
  }
}

/** El EN omite los campos no localizados. */
export type HomeCopyEn = DeepPartial<HomeCopy>

export const HOME_COPY_ES: HomeCopy = buildHomeCopy('es')
export const HOME_COPY_EN: HomeCopyEn = buildHomeCopy('en')

/**
 * Aprobacion de la copia EN de la home y de Contacto (lote 2 EN, D-14): traduccion fiel del ES,
 * propuesta hasta que Juan la apruebe. La siembra EN de 56-12 espera esa aprobacion.
 * El cierre EN y los CTA del lote 1 ya estan aprobados (ver CTA-<id> en 56-cta-lote1.ts).
 */
export const DECISIONS: Decision[] = [
  {
    id: 'HOME-EN',
    label: 'Copia EN de la home y de Contacto (hoy /en cae al espanol)',
    status: 'aprobado',
    gate: 'aprobado',
    chosen: 'traduccion-fiel',
    recommended: 'traduccion-fiel',
    options: {
      'traduccion-fiel': {
        es: 'Traduccion fiel del ES aprobado. Los EN de D-22 y del lote 1 que Juan aprobo van tal cual.',
        en: [
          HOME_COPY_EN.tagline,
          HOME_COPY_EN.hero?.lead,
          HOME_COPY_EN.services?.lead,
          HOME_COPY_EN.cta?.lead,
        ]
          .filter(Boolean)
          .join(' | '),
        note: 'Propuesta. Texto completo con: tsx scripts/verify/56-review-export.ts --only HOME-EN',
      },
    },
    preview: {
      en: [
        `tagline: ${HOME_COPY_EN.tagline}`,
        `hero: ${HOME_COPY_EN.hero?.eyebrow} | ${HOME_COPY_EN.hero?.titleLine1} ${HOME_COPY_EN.hero?.titleLine2}`,
        `hero.lead: ${HOME_COPY_EN.hero?.lead}`,
        `vitals: ${HOME_COPY_EN.vitals?.title} | ${HOME_COPY_EN.vitals?.lead}`,
        `services: ${HOME_COPY_EN.services?.title} | ${HOME_COPY_EN.services?.lead}`,
        ...(HOME_COPY_EN.services?.items ?? []).map((i) => `  - ${i.title}: ${i.body}`),
        `cases: ${HOME_COPY_EN.cases?.title} | ${HOME_COPY_EN.cases?.lead}`,
        `process: ${HOME_COPY_EN.process?.title}`,
        ...(HOME_COPY_EN.process?.steps ?? []).map((s) => `  - ${s.title}: ${s.body}`),
        `sites: ${HOME_COPY_EN.sites?.title}`,
        `about: ${HOME_COPY_EN.about?.title}`,
        ...(HOME_COPY_EN.about?.paragraphs ?? []).map((p) => `  - ${p.text}`),
        `faq: ${HOME_COPY_EN.faq?.title}`,
        ...(HOME_COPY_EN.faq?.items ?? []).map((i) => `  - ${i.question} ${i.answer}`),
        `cta: ${HOME_COPY_EN.cta?.title} | ${HOME_COPY_EN.cta?.lead}`,
        `contact: ${HOME_COPY_EN.contact?.stepsTitle} | ${HOME_COPY_EN.contact?.faqTitle}`,
        ...(HOME_COPY_EN.contact?.steps ?? []).map((s) => `  - ${s.title}: ${s.body}`),
        ...(HOME_COPY_EN.contact?.infoRows ?? []).map((r) => `  - ${r.title}: ${r.text}`),
      ].join('\n'),
    },
    source: 'scripts/db/data/56-home-copy.ts',
  },
]
