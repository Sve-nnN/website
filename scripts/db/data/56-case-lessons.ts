/**
 * Lecciones aprendidas de los 7 casos (plan 56-06, CONT-02, D-16, D-03, D-17).
 *
 * Parten del borrador de designs/design-system-mui/src/data/case-lessons.ts y se
 * reescribieron contra el texto que cada caso ya muestra en su pagina publica
 * (https://juan-tech.com/case-studies/<slug> y /en/case-studies/<slug>). Ninguna cifra ni
 * afirmacion sale de otro lado: cada leccion lista en `figures` los fragmentos exactos del
 * caso que la respaldan, y scripts/verify/56-cases-lessons-live.mjs exige que cada uno
 * aparezca en el HTML del caso, en su idioma.
 *
 * NO se carga nada a Payload en esta fase (D-03): el admin de master no conoce el campo
 * `lessons` y un guardado alli podria borrarlas. El cargador es del plan 56-14 y se corre
 * en el corte (fase 57), solo con lecciones en estado `aprobado`.
 *
 * Forma de cada leccion = campo `lessons` de src/collections/CaseStudies/index.ts: un
 * arreglo de { title, body } localizados. CaseDetailView pinta cada title como h3, por eso
 * ningun titulo lleva punto ni coma (regla de voz, D-17).
 *
 * Ajustes obligatorios de RESEARCH seccion 6 ya aplicados:
 *   - baldosa leccion 3: sin afirmar que la indexabilidad vino antes de publicar mas paginas;
 *   - migracion leccion 2: titulo sin la cola "sin esperar al lanzamiento";
 *   - dos titulos sin coma (pittsburgh 1 y talleres 1);
 *   - edtech leccion 3 se mantiene: las Conclusiones del caso dicen la caida del 25 %.
 * Ajustes extra por la misma regla de cero afirmaciones inventadas (ver SUMMARY 56-06):
 *   baldosa 1 y 2, inmigracion 2 y 3, edtech 1 y talleres 1 y 2 dejan de afirmar resultados
 *   que el caso presenta como intencion o como sospecha ("para capturar", "sugiere").
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision, DecisionStatus } from './56-content-decisions'

export type LessonText = { title: string; body: string }

/**
 * Una cifra o frase del caso que respalda la leccion.
 *   text     fragmento tal como aparece en el caso en espanol (para cifras, igual en los dos idiomas)
 *   textEn   fragmento tal como aparece en el caso en ingles; si falta se usa `text`
 *   from, to, pct   solo en cifras con porcentaje: el verificador recalcula
 *                   round((to - from) / from * 100) y exige que el caso muestre ese porcentaje
 */
export type Figure = { text: string; textEn?: string; from?: number; to?: number; pct?: number }

export type Lesson = {
  /** Numero de la leccion dentro del caso (1 a 3). */
  n: number
  es: LessonText
  en: LessonText
  figures: Figure[]
  status: DecisionStatus
}

const BASE = 'https://juan-tech.com'

/** URL publica del caso en produccion (lectura). */
export const caseUrl = (slug: string, locale: 'es' | 'en' = 'es'): string =>
  `${BASE}${locale === 'en' ? '/en' : ''}/case-studies/${slug}`

export const lessonId = (slug: string, n: number): string => `LESSON-${slug}-${n}`

export const CASE_LESSONS: Record<string, Lesson[]> = {
  'pittsburgh-criminal-defense-legal-content-seo': [
    {
      n: 1,
      es: {
        title: `Escalar exige contenido específico y no solo marca`,
        body: `El despacho ya sumaba 47,108 clics al año y llegó a 86,000. El crecimiento se apoyó en decenas de artículos sobre situaciones concretas de Pensilvania, como el sistema de puntos de tránsito y las paradas policiales de identificación.`,
      },
      en: {
        title: `Scaling takes specific content and not only branded search`,
        body: `The firm already had 47,108 clicks a year and reached 86,000. The growth rested on dozens of articles about concrete Pennsylvania legal situations, such as the traffic points system and police identification stops.`,
      },
      figures: [
        { text: `47,108` },
        { text: `86,000`, from: 47108, to: 86000, pct: 83 },
        {
          text: `decenas de artículos sobre situaciones legales concretas de Pensilvania`,
          textEn: `Dozens of articles on concrete Pennsylvania legal situations`,
        },
      ],
      status: 'propuesto',
    },
    {
      n: 2,
      es: {
        title: `La optimización on-page rinde cuando cubre el catálogo completo`,
        body: `Trabajé títulos, encabezados e intención de búsqueda en todo el contenido legal y no solo en páginas aisladas.`,
      },
      en: {
        title: `On-page optimization pays off when it covers the whole catalog`,
        body: `I worked on titles, headings and search intent across all the legal content, not only on isolated pages.`,
      },
      figures: [
        {
          text: `títulos, encabezados e intención de búsqueda aplicado a todo el catálogo de contenido legal`,
          textEn: `Title, heading, and search-intent work applied systematically across the legal content catalog`,
        },
      ],
      status: 'propuesto',
    },
    {
      n: 3,
      es: {
        title: `La base técnica sostiene el volumen`,
        body: `Las mejoras de indexabilidad y estructura sostuvieron un volumen de contenido mucho mayor sin perder rastreabilidad, y la posición promedio en escritorio bajó de 36.3 a 19.2.`,
      },
      en: {
        title: `The technical base carries the volume`,
        body: `The indexability and structure improvements held up a much larger volume of content without losing crawlability, and the average desktop position went from 36.3 to 19.2.`,
      },
      figures: [
        { text: `36.3` },
        { text: `19.2`, from: 36.3, to: 19.2, pct: -47 },
        {
          text: `sostener un volumen de contenido mucho mayor sin perder rastreabilidad`,
          textEn: `support a much larger content volume without losing crawlability`,
        },
      ],
      status: 'propuesto',
    },
  ],

  'fabricante-baldosa-hidraulica-seo-espana': [
    {
      n: 1,
      es: {
        title: `Un fabricante artesanal sí puede capturar demanda genérica`,
        body: `La consulta "baldosa hidráulica" pasó de 78 a 327 clics al año frente a marketplaces y grandes distribuidores con presupuestos de contenido mucho mayores.`,
      },
      en: {
        title: `An artisan manufacturer can capture generic demand`,
        body: `The query "baldosa hidráulica" went from 78 to 327 clicks a year against marketplaces and large distributors with far bigger content budgets.`,
      },
      figures: [
        { text: `78` },
        { text: `327`, from: 78, to: 327, pct: 319 },
        { text: `presupuestos de contenido mucho mayores`, textEn: `far bigger content budgets` },
      ],
      status: 'propuesto',
    },
    {
      n: 2,
      es: {
        title: `El contenido educativo cubre lo que el catálogo no cubre`,
        body: `El catálogo de más de 300 modelos no tenía contenido educativo que lo conectara con lo que la gente busca sobre el material. Escribí piezas sobre mantenimiento y limpieza de suelos hidráulicos para atender esas búsquedas informacionales.`,
      },
      en: {
        title: `Educational content covers what the catalog does not`,
        body: `The 300+ model catalog had no educational content tying it to what people search about the material. I wrote pieces on hydraulic floor maintenance and cleaning to cover those informational searches.`,
      },
      figures: [
        { text: `más de 300 modelos`, textEn: `300+ model catalog` },
        { text: `mantenimiento y limpieza de suelos hidráulicos`, textEn: `hydraulic-floor maintenance and cleaning` },
        { text: `búsquedas informacionales relacionadas con el producto`, textEn: `product-related informational searches` },
      ],
      status: 'propuesto',
    },
    {
      n: 3,
      es: {
        title: `Un catálogo grande necesita rastreo consistente`,
        body: `Con más de 300 modelos, las mejoras de indexabilidad buscaron que el catálogo entero se rastreara e indexara de forma consistente.`,
      },
      en: {
        title: `A large catalog needs consistent crawling`,
        body: `With more than 300 models, the indexability improvements aimed at getting the whole catalog crawled and indexed consistently.`,
      },
      figures: [
        { text: `más de 300 modelos`, textEn: `300+ model catalog` },
        { text: `se rastree e indexe de forma consistente`, textEn: `gets crawled and indexed consistently` },
      ],
      status: 'propuesto',
    },
  ],

  'immigration-law-atlanta-seo': [
    {
      n: 1,
      es: {
        title: `Depender de la marca limita el techo`,
        body: `El sitio sumaba apenas 9,621 clics al año, casi todos de búsquedas de marca. Al construir contenido sobre preguntas reales del proceso migratorio llegó a 39,323.`,
      },
      en: {
        title: `Relying on the brand caps the ceiling`,
        body: `The site had just 9,621 clicks a year, almost all from branded search. Building content around real questions about the immigration process took it to 39,323.`,
      },
      figures: [
        { text: `9,621` },
        { text: `39,323`, from: 9621, to: 39323, pct: 309 },
        { text: `casi por completo de búsquedas de marca`, textEn: `relied almost entirely on branded search` },
      ],
      status: 'propuesto',
    },
    {
      n: 2,
      es: {
        title: `Responder lo que el solicitante busca durante su caso funciona`,
        body: `Creé páginas sobre categorías de green card, estatus de caso en USCIS y tiempos de trámite de la visa U, preguntas que los solicitantes buscan durante su propio caso. El sitio competía en desventaja con fuentes oficiales como USCIS.gov y aun así el contenido educativo fue uno de los motores del salto.`,
      },
      en: {
        title: `Answering what applicants search for during their case works`,
        body: `I built pages on green card categories, USCIS case status and U visa processing times, questions applicants search for during their own case. The site competed at a disadvantage against official sources like USCIS.gov, and educational content still drove a meaningful share of the jump.`,
      },
      figures: [
        { text: `estatus de caso en USCIS`, textEn: `USCIS case status` },
        { text: `tiempos de trámite de la visa U`, textEn: `U visa processing times` },
        { text: `fue uno de los motores del salto`, textEn: `drove a meaningful share of the jump` },
      ],
      status: 'propuesto',
    },
    {
      n: 3,
      es: {
        title: `El crecimiento vino sobre todo de lo informacional`,
        body: `La consulta local "immigration lawyer atlanta" mejoró de forma más moderada, de 128 a 188 clics (+47 %). Eso sugiere que el crecimiento vino sobre todo de captar demanda informacional que antes no se atendía.`,
      },
      en: {
        title: `Growth came mostly from informational search`,
        body: `The local query "immigration lawyer atlanta" improved more modestly, from 128 to 188 clicks (+47%). That suggests the growth came mainly from capturing informational demand that was not being served before.`,
      },
      figures: [
        { text: `128` },
        { text: `188`, from: 128, to: 188, pct: 47 },
        {
          text: `captar demanda informacional que antes no se atendía`,
          textEn: `capturing informational demand that was not being served before`,
        },
      ],
      status: 'propuesto',
    },
  ],

  'talleres-costura-miami-lanzamiento-seo-local': [
    {
      n: 1,
      es: {
        title: `En un sitio nuevo lo primero es que Google lo rastree`,
        body: `Sin historial de indexación no existían consultas de marca ni locales asociadas al dominio. Por eso el primer trabajo técnico fue asegurar que Google rastreara e indexara el sitio recién lanzado desde cero.`,
      },
      en: {
        title: `On a new site the first job is getting Google to crawl it`,
        body: `With no indexing history there were no brand or local queries tied to the domain. So the first technical work was making sure Google crawled and indexed the newly launched site from scratch.`,
      },
      figures: [
        {
          text: `Sin historial de indexación, no existían consultas de marca ni locales asociadas al dominio`,
          textEn: `With no indexing history, there were no brand or local queries associated with the domain`,
        },
        {
          text: `rastreado e indexado correctamente por Google desde cero`,
          textEn: `crawled and indexed correctly by Google from scratch`,
        },
      ],
      status: 'propuesto',
    },
    {
      n: 2,
      es: {
        title: `La marca y lo local se capturan primero`,
        body: `En su primer año medible el sitio llegó a 56 clics, 4 de ellos de búsquedas de marca, con la página principal en la posición 8.4.`,
      },
      en: {
        title: `Brand and local search come first`,
        body: `In its first measurable year the site reached 56 clicks, 4 of them from branded search, with the homepage at position 8.4.`,
      },
      figures: [
        { text: `56` },
        { text: `8.4` },
        { text: `4 (branded search)` },
        {
          text: `capturar sus primeras búsquedas de marca y locales de alta intención`,
          textEn: `capturing its first high-intent branded and local searches`,
        },
      ],
      status: 'propuesto',
    },
    {
      n: 3,
      es: {
        title: `Una escala pequeña también es una base`,
        body: `Las cifras son modestas: de cero a 56 clics y 1,307 impresiones. Aun así, pasar de cero presencia a las primeras búsquedas locales de alta intención es la base que hace falta antes de escalar el contenido.`,
      },
      en: {
        title: `A small scale is still a foundation`,
        body: `The numbers are modest: from zero to 56 clicks and 1,307 impressions. Even so, going from no presence to the first high-intent local searches is the foundation you need before scaling content.`,
      },
      figures: [
        { text: `56` },
        { text: `1,307` },
        {
          text: `la base que hace falta antes de poder escalar`,
          textEn: `the foundation you need before any content strategy can scale`,
        },
      ],
      status: 'propuesto',
    },
  ],

  'urologo-seo-local-salud-santiago-rd': [
    {
      n: 1,
      es: {
        title: `El contenido educativo por condición mueve la aguja`,
        body: `El artículo sobre riñón ectópico subió de la posición 43.8 a la 8.0 y multiplicó por 38 sus impresiones anuales.`,
      },
      en: {
        title: `Condition-specific educational content moves the needle`,
        body: `The ectopic kidney article climbed from position 43.8 to 8.0 and multiplied its annual impressions by 38.`,
      },
      figures: [
        { text: `43.8` },
        { text: `8.0`, from: 43.8, to: 8.0, pct: -82 },
        { text: `multiplicando por 38 sus impresiones anuales`, textEn: `multiplying its annual impressions 38x` },
      ],
      status: 'propuesto',
    },
    {
      n: 2,
      es: {
        title: `La autoridad de marca se construye con trabajo on-page`,
        body: `Tras un trabajo on-page dirigido a consolidar las búsquedas de marca del doctor, esas búsquedas pasaron de cero clics registrados a captar tráfico real.`,
      },
      en: {
        title: `Brand authority is built with on-page work`,
        body: `After on-page work aimed at locking in the doctor's brand searches, those searches went from zero recorded clicks to capturing real traffic.`,
      },
      figures: [
        {
          text: `pasaron de cero clics registrados a captar tráfico real`,
          textEn: `went from zero recorded clicks to capturing real traffic`,
        },
      ],
      status: 'propuesto',
    },
    {
      n: 3,
      es: {
        title: `El crecimiento porcentual es real aunque la escala sea modesta`,
        body: `Es el sitio de un solo profesional. Los clics pasaron de 48 a 243 (+406 %) y el avance se sostuvo durante un año completo.`,
      },
      en: {
        title: `Percentage growth is real even when the scale is modest`,
        body: `This is a single practitioner's site. Clicks went from 48 to 243 (+406%) and the gain held up across a full year.`,
      },
      figures: [
        { text: `48` },
        { text: `243`, from: 48, to: 243, pct: 406 },
        { text: `se sostuvo a lo largo de un año completo`, textEn: `held up across a full year` },
      ],
      status: 'propuesto',
    },
  ],

  'edtech-financiera-infantil-crecimiento-organico-seo': [
    {
      n: 1,
      es: {
        title: `Vale la pena optimizar el artículo ancla`,
        body: `La guía ancla de libros de finanzas para niños estaba en la posición 25.2. El trabajo sobre título, encabezados e intención de búsqueda la llevó a la 8.2 en un año.`,
      },
      en: {
        title: `It pays to optimize the anchor article`,
        body: `The anchor guide on kids' finance books sat at position 25.2. Work on its title, headings and search intent took it to 8.2 in a year.`,
      },
      figures: [
        { text: `25.2` },
        { text: `8.2`, from: 25.2, to: 8.2, pct: -67 },
        { text: `título, encabezados e intención de búsqueda`, textEn: `title, headings, and search intent` },
      ],
      status: 'propuesto',
    },
    {
      n: 2,
      es: {
        title: `Un clúster temático refuerza la autoridad`,
        body: `Reforcé la red de artículos relacionados, como los billetes de juguete para imprimir y las actividades para enseñar finanzas, para consolidar autoridad temática y capturar más variantes de búsqueda.`,
      },
      en: {
        title: `A topic cluster reinforces authority`,
        body: `I strengthened the network of related articles, such as printable play money and activities for teaching finance, to consolidate topical authority and capture more query variants.`,
      },
      figures: [
        {
          text: `consolidar autoridad temática y capturar más variantes de búsqueda`,
          textEn: `consolidate topical authority and capture more query variants`,
        },
        { text: `billetes de juguete para imprimir`, textEn: `printable play money` },
      ],
      status: 'propuesto',
    },
    {
      n: 3,
      es: {
        title: `Una cifra anual puede esconder un semestre flojo`,
        body: `El año completo cerró con +104 % en clics. Aun así, los últimos seis meses del periodo, de enero a junio de 2026, muestran una caída del 25 % en clics frente al semestre anterior con las impresiones estables. Por eso miro también los periodos más cortos.`,
      },
      en: {
        title: `A yearly figure can hide a weak half`,
        body: `The full year closed at +104% in clicks. Still, the last six months of the period, January to June 2026, show a 25% drop in clicks against the prior six months while impressions held steady. That is why I also look at shorter periods.`,
      },
      figures: [
        { text: `12,485`, from: 6113, to: 12485, pct: 104 },
        {
          text: `caída del 25% en clics frente al semestre anterior, aunque las impresiones se mantuvieron estables`,
          textEn: `25% click decline versus the prior six months, even as impressions held steady`,
        },
        { text: `enero-junio 2026`, textEn: `Jan-Jun 2026` },
      ],
      status: 'propuesto',
    },
  ],

  'migracion-ecommerce-nextjs-seo-tecnico': [
    {
      n: 1,
      es: {
        title: `El mapa de redirecciones 301 uno a uno protege el posicionamiento`,
        body: `Congelé el inventario de URLs en vivo antes del corte y verifiqué la tabla de redirecciones contra el sitemap anterior para no perder link equity. La migración cerró sin una sola semana de caída de tráfico.`,
      },
      en: {
        title: `A one to one 301 redirect map protects rankings`,
        body: `I froze the live URL inventory before cutover and checked the redirect table against the old sitemap so no link equity was lost. The migration went through without a single week of traffic decline.`,
      },
      figures: [
        { text: `Mapa de redirecciones 301, uno a uno`, textEn: `301 redirect map, one to one` },
        { text: `El inventario de URLs en vivo se congeló antes del corte`, textEn: `The live URL inventory was frozen before cutover` },
        {
          text: `sin que hubiera una sola semana de caída de tráfico durante el corte`,
          textEn: `without a single week of traffic decline during cutover`,
        },
      ],
      status: 'propuesto',
    },
    {
      n: 2,
      es: {
        title: `El renderizado híbrido mejora el rendimiento`,
        body: `Las páginas de producto y categoría pasaron a generación estática incremental y el LCP móvil bajó de 4.2s a 1.6s.`,
      },
      en: {
        title: `Hybrid rendering improves performance`,
        body: `Product and category pages moved to incremental static generation and mobile LCP dropped from 4.2s to 1.6s.`,
      },
      figures: [
        { text: `4.2s` },
        { text: `1.6s`, from: 4.2, to: 1.6, pct: -62 },
        { text: `generación estática incremental`, textEn: `incremental static generation` },
      ],
      status: 'propuesto',
    },
    {
      n: 3,
      es: {
        title: `Los datos estructurados y el sitemap dinámico mantienen el catálogo al día`,
        body: `Implementé JSON-LD de Product y BreadcrumbList y un sitemap generado desde la base de datos que refleja siempre el catálogo actual.`,
      },
      en: {
        title: `Structured data and a dynamic sitemap keep the catalog current`,
        body: `I added Product and BreadcrumbList JSON-LD and a sitemap generated from the database that always reflects the current catalog.`,
      },
      figures: [
        { text: `JSON-LD de Product/BreadcrumbList`, textEn: `Product/BreadcrumbList JSON-LD` },
        {
          text: `sitemap generado desde base de datos que siempre refleja el catálogo actual`,
          textEn: `database-driven sitemap that always reflects the current catalog`,
        },
      ],
      status: 'propuesto',
    },
  ],
}

/** Slugs de los casos, en el orden del archivo. */
export const CASE_SLUGS: string[] = Object.keys(CASE_LESSONS)

/** Todas las lecciones en lista plana, con su slug. */
export function flatLessons(): Array<{ slug: string; lesson: Lesson }> {
  return CASE_SLUGS.flatMap((slug) => CASE_LESSONS[slug].map((lesson) => ({ slug, lesson })))
}

function figuresBlock(lesson: Lesson, locale: 'es' | 'en'): string {
  const lines = lesson.figures.map((f) => {
    const text = locale === 'en' ? (f.textEn ?? f.text) : f.text
    const calc = f.pct !== undefined ? ` (${f.from} a ${f.to}: ${f.pct > 0 ? '+' : ''}${f.pct} %)` : ''
    return `- "${text}"${calc}`
  })
  return `${locale === 'en' ? 'Figures backed by the case' : 'Cifras respaldadas por el caso'}:\n${lines.join('\n')}`
}

/**
 * Una decision por leccion, id LESSON-<slug>-<n>. Estado `propuesto` hasta que Juan apruebe
 * por escrito; el gate exige `aprobado` (T-56-21): el cargador del corte no carga lecciones
 * propuestas.
 */
export const DECISIONS: Decision[] = flatLessons().map(({ slug, lesson }) => ({
  id: lessonId(slug, lesson.n),
  label: `Lección ${lesson.n} del caso ${slug}`,
  status: lesson.status,
  gate: 'aprobado',
  source: caseUrl(slug),
  preview: {
    es: `${lesson.es.title}\n${lesson.es.body}\n${figuresBlock(lesson, 'es')}`,
    en: `${lesson.en.title}\n${lesson.en.body}\n${figuresBlock(lesson, 'en')}`,
  },
}))
