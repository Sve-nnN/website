/**
 * Auditoría SEO 2026-11. Honestidad del contenido y metas de Lima y Madrid.
 *
 *  1. Aviso de conflicto de interés al inicio de la guía de cursos de SEO. Los
 *     hechos que declara ya están publicados en /sobre-mi.
 *  2. Rotula como hipotéticos los ejemplos con resultados que no corresponden a
 *     ningún cliente documentado (Core Web Vitals, datos estructurados y SEO
 *     off page) y retira un porcentaje sin fuente.
 *  3. Meta título y meta descripción propios para las landings de Lima y Madrid.
 *  4. Quita el voseo de cuatro meta descripciones en español.
 *
 * Escribe un campo localizado por vez y después relee el otro idioma para
 * comprobar que no cambió. Es idempotente. Nada se borra.
 *
 *   tsx scripts/db/43-geo-avisos-y-metas.ts
 *   tsx scripts/db/43-geo-avisos-y-metas.ts --apply --db-checked
 */
import { isDeepStrictEqual } from 'node:util'
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { assertSafeTarget } from './data/54-seed-lib'

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')

type Locale = 'es' | 'en'
type Node = { type?: string; text?: string; children?: Node[]; [key: string]: unknown }

/** Reemplaza el texto completo del párrafo o encabezado que empieza por `from`. */
type Replacement = { from: string; to: string; exact?: boolean }

const REPLACEMENTS: Record<string, Partial<Record<Locale, Replacement[]>>> = {
  'core-web-vitals-guide': {
    es: [
      {
        from: 'Caso Práctico: Optimización de un Sitio Web B2B',
        to: 'Ejemplo hipotético de optimización de un sitio B2B',
      },
      {
        from: 'Pensemos en un sitio B2B',
        to: 'Este ejemplo es hipotético y sus cifras sirven solo para ilustrar el método, porque no corresponden a ningún cliente real. Imagina un sitio B2B con problemas de Core Web Vitals y estos valores de partida:',
      },
      { from: 'Valor Actual', to: 'Valor de partida supuesto', exact: true },
      {
        from: 'Las acciones tomadas incluyeron',
        to: 'En ese escenario, el plan consiste en comprimir imágenes, optimizar la carga de scripts y aplicar carga diferida. Como meta ilustrativa, el LCP bajaría a 2.2 segundos, el CLS a 0.05 y el INP a 150 ms. El efecto en el tráfico y en el tiempo de visita hay que medirlo en el sitio real.',
      },
    ],
  },
  'structured-data-seo': {
    es: [
      {
        from: 'Casos de uso y ejemplos reales de datos estructurados SEO',
        to: 'Casos de uso y ejemplos hipotéticos de datos estructurados',
      },
      {
        from: 'Caso de éxito en mejora de CTR con artículos optimizados',
        to: 'Ejemplo hipotético de CTR en artículos optimizados',
      },
      {
        from: 'Un blog de viajes que aplica datos estructurados',
        to: 'Imagina un blog de viajes que marca sus artículos con el autor, la fecha de publicación y una descripción corta. El marcado ayuda al buscador a entender cada pieza y puede cambiar cómo aparece en los resultados. No doy un porcentaje de mejora porque depende de la consulta y de la competencia, así que mídelo en tu propio sitio con Search Console.',
      },
      {
        from: 'Después de implementar datos estructurados, siempre vale la pena',
        to: 'Después de implementar datos estructurados, siempre vale la pena medir el antes y el después. Un sitio de recetas, por ejemplo, puede comparar tráfico orgánico y tiempo en página antes y después del marcado. Las dos cifras pueden subir, bajar o quedarse igual, y por eso conviene revisar también qué más cambió en ese periodo. Con esos datos en la mano, ajustar la estrategia SEO deja de ser una suposición y se vuelve una decisión basada en evidencia.',
      },
    ],
    en: [
      {
        from: 'Case Study: Using Schema.org and JSON-LD in Real Projects',
        to: 'A Hypothetical Example of Schema.org and JSON-LD on a Store Site',
      },
      {
        from: 'Take a fictional ecommerce site',
        to: 'This example is hypothetical: it describes no real client and no measured result. Picture an ecommerce site that starts with only basic metadata and no structured data markup, which limits how its pages can appear in search results. The plan is to audit the HTML and add Schema.org markup in JSON-LD with the product name, description, price and genuine reviews, so that search engines get a clearer reading of what the site sells.',
      },
      {
        from: 'We tracked performance for three months',
        to: 'To judge the change, compare at least three months of Search Console and analytics data with an equivalent earlier period: organic clicks, click-through rate on pages eligible for rich results, time on site and pages per session. I give no expected percentage, because the effect depends on the query, the page and the competition, and structured data never guarantees a rich result.',
      },
      {
        from: 'The biggest takeaway: validate and test the markup',
        to: 'The habit worth keeping is continuous validation. The Rich Results Test and the Schema Markup Validator catch syntax and property errors that would otherwise go unnoticed and hurt eligibility. Follow changes to the Schema.org vocabulary and to Google’s documentation so that every relevant property stays accurate. On WordPress, plugins such as Yoast SEO automate a good share of the markup. Keep the schema current, review performance regularly and judge the work by your own data.',
      },
    ],
  },
  'seo-off-page-guia': {
    es: [
      { from: 'Casos prácticos y errores comunes en SEO off page', to: 'Ejemplos y errores comunes en SEO off page' },
      {
        from: 'Ejemplos de campañas exitosas de SEO off page',
        to: 'Ejemplos hipotéticos de campañas de SEO off page',
      },
      {
        from: 'Hay varios ejemplos de campañas de SEO off page',
        to: 'Los dos ejemplos que siguen son hipotéticos: ilustran cada enfoque y no describen clientes ni resultados medidos. Imagina una plataforma de cursos en línea que crea contenido útil para atraer enlaces de blogs educativos y especializados. Su objetivo es mejorar la posición en las SERP y el tráfico, y puede comprobarlo si compara dominios de referencia y clics orgánicos antes y después.',
      },
      {
        from: 'Otro ejemplo es el de un negocio local',
        to: 'En el segundo ejemplo, un negocio local gestiona sus reseñas en Google y participa en comunidades de su zona para ganar visibilidad en las búsquedas geolocalizadas. Puede medir el efecto con las impresiones locales, las llamadas y las visitas a la tienda.',
      },
    ],
  },
}

const DISCLOSURE_SLUG = 'mejores-cursos-seo-espanol'
const DISCLOSURE: Record<Locale, { label: string; body: string }> = {
  es: {
    label: 'Aviso de conflicto de interés: ',
    body: 'trabajo en aprendoclub como Senior Tech SEO Analyst y como coach de SEO técnico de su Diplomado SEO + AIO, y colaboro con Arianna Lupi, su fundadora. DinoRANK, cuya academia también aparece en esta guía, es la suite oficial de aprendoclub. Ten presente esa relación cuando leas lo que digo sobre ambas y compáralas con las demás opciones antes de decidir.',
  },
  en: {
    label: 'Conflict of interest notice: ',
    body: 'I work at aprendoclub as a Senior Tech SEO Analyst and as the technical SEO coach of its SEO + AIO Diploma, and I collaborate with Arianna Lupi, its founder. DinoRANK, whose academy also appears in this guide, is aprendoclub’s official suite. Bear that relationship in mind when you read what I say about either, and compare them with the other options before you decide.',
  },
}

const METAS: Record<string, Record<Locale, { title: string; description: string }>> = {
  'seo-tecnico-lima': {
    es: {
      title: 'SEO técnico en Lima con reuniones presenciales',
      description:
        'Vivo en Lima y me reúno en persona cuando el proyecto lo pide. Audito tu sitio y corrijo el código junto a tu equipo de desarrollo, sin intermediarios.',
    },
    en: {
      title: 'Technical SEO in Lima with in-person meetings',
      description:
        'I live in Lima and meet in person when the project calls for it. I audit your site and fix the code alongside your developers, with no middlemen.',
    },
  },
  'seo-tecnico-madrid': {
    es: {
      title: 'SEO técnico en Madrid en remoto y sin agencia',
      description:
        'Trabajo en remoto desde Lima con empresas de España y no tengo oficina en Madrid. Auditoría, revisión de código y trato directo con tu equipo técnico.',
    },
    en: {
      title: 'Remote technical SEO for companies in Madrid',
      description:
        'I work remotely from Lima with companies in Spain and have no Madrid office. Audits, code reviews and direct work with your development team.',
    },
  },
}

/** Español neutro: cambia la forma voseante exacta y nada más. */
const VOSEO: { collection: 'posts' | 'pages'; slug: string; from: string; to: string }[] = [
  { collection: 'posts', slug: 'structured-data-seo', from: 'podés', to: 'puedes' },
  { collection: 'posts', slug: 'que-es-css', from: 'podés', to: 'puedes' },
  { collection: 'pages', slug: 'privacy', from: 'compartís', to: 'compartes' },
  { collection: 'pages', slug: 'contact', from: 'Contame', to: 'Cuéntame' },
]

const BLOCK_TYPES = new Set(['paragraph', 'heading'])

const textOf = (node: Node): string =>
  node.type === 'text' ? (node.text ?? '') : (node.children ?? []).map(textOf).join('')

const textNode = (text: string, format = 0): Node => ({
  type: 'text',
  text,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

function blocks(node: Node, out: Node[] = []): Node[] {
  if (node.type && BLOCK_TYPES.has(node.type)) out.push(node)
  for (const child of node.children ?? []) blocks(child, out)
  return out
}

/** Aplica los reemplazos sobre una copia. Devuelve cuántos cambió. */
function replaceBlocks(root: Node, list: Replacement[], where: string): number {
  let changed = 0
  for (const { from, to, exact } of list) {
    const all = blocks(root)
    if (all.some((n) => textOf(n).trim() === to)) continue
    const hits = all.filter((n) => {
      const text = textOf(n).trim()
      return exact ? text === from : text.startsWith(from)
    })
    if (hits.length !== 1) {
      throw new Error(`${where}: "${from}" aparece ${hits.length} veces; no escribo nada`)
    }
    const hit = hits[0]
    if ((hit.children ?? []).some((c) => c.type !== 'text')) {
      throw new Error(`${where}: "${from}" contiene enlaces u otros nodos; revisarlo a mano`)
    }
    console.log(`  - ${textOf(hit).trim()}\n  + ${to}`)
    hit.children = [textNode(to)]
    changed++
  }
  return changed
}

async function main() {
  assertSafeTarget(process.env.DATABASE_URI, APPLY, DB_CHECKED)
  const payload = await getPayload({ config })
  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada se escribe) ===')

  async function read(collection: 'posts' | 'pages', slug: string, locale: Locale) {
    const { docs } = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      locale,
      fallbackLocale: false,
      depth: 0,
      limit: 1,
      draft: true,
    })
    const doc = docs[0] as any
    if (!doc) throw new Error(`${collection}/${slug} no existe`)
    if (doc._status !== 'published') {
      throw new Error(`${collection}/${slug} tiene un borrador sin publicar; no lo piso`)
    }
    return doc
  }

  // --- Posts: reemplazos y aviso ------------------------------------------
  for (const slug of [DISCLOSURE_SLUG, ...Object.keys(REPLACEMENTS)]) {
    for (const locale of ['es', 'en'] as const) {
      const isDisclosure = slug === DISCLOSURE_SLUG
      const list = REPLACEMENTS[slug]?.[locale]
      if (!isDisclosure && !list) continue

      const doc = await read('posts', slug, locale)
      console.log(`\n## posts/${slug} [${locale}]`)
      if (!doc.content?.root) {
        console.log('  sin contenido en este idioma; no se escribe')
        continue
      }
      const content = structuredClone(doc.content) as { root: Node }
      let changed = 0

      if (isDisclosure) {
        const { label, body } = DISCLOSURE[locale]
        if (textOf(content.root.children![0]).startsWith(label)) {
          console.log('  el aviso ya está')
        } else {
          content.root.children!.unshift({
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            textFormat: 0,
            children: [textNode(label, 1), textNode(body)],
          })
          console.log(`  + ${label}${body}`)
          changed++
        }
      } else {
        changed = replaceBlocks(content.root, list!, `${slug} [${locale}]`)
        if (changed === 0) console.log('  ya estaba aplicado')
      }

      if (!APPLY || changed === 0) continue

      const other: Locale = locale === 'es' ? 'en' : 'es'
      const before = await read('posts', slug, other)
      await payload.update({
        collection: 'posts',
        id: doc.id,
        locale,
        fallbackLocale: false,
        data: { content: content as any, _status: 'published' },
        draft: false,
      })
      const after = await read('posts', slug, locale)
      const otherAfter = await read('posts', slug, other)
      if (!isDeepStrictEqual(after.content, content)) throw new Error(`${slug} [${locale}]: lo leído no coincide`)
      for (const key of ['title', 'excerpt', 'content', 'meta', 'categories', 'publishedAt', 'slug']) {
        if (!isDeepStrictEqual(before[key], otherAfter[key])) {
          throw new Error(`${slug}: cambió ${key} en ${other}; revisar con el respaldo`)
        }
      }
      console.log(`  escrito y verificado (${other} intacto)`)
    }
  }

  // --- Pages: metas de Lima y Madrid ---------------------------------------
  for (const [slug, byLocale] of Object.entries(METAS)) {
    for (const locale of ['es', 'en'] as const) {
      const doc = await read('pages', slug, locale)
      const next = byLocale[locale]
      console.log(`\n## pages/${slug} [${locale}] meta`)
      if (doc.meta?.title === next.title && doc.meta?.description === next.description) {
        console.log('  ya estaba aplicado')
        continue
      }
      console.log(`  - ${doc.meta?.title ?? '(sin título)'} | ${doc.meta?.description}`)
      console.log(`  + ${next.title} (${next.title.length}) | ${next.description} (${next.description.length})`)
      if (!APPLY) continue

      const other: Locale = locale === 'es' ? 'en' : 'es'
      const before = await read('pages', slug, other)
      const self = await read('pages', slug, locale)
      await payload.update({
        collection: 'pages',
        id: doc.id,
        locale,
        fallbackLocale: false,
        data: { meta: { ...self.meta, ...next }, _status: 'published' },
        draft: false,
      })
      const after = await read('pages', slug, locale)
      const otherAfter = await read('pages', slug, other)
      if (after.meta?.title !== next.title || after.meta?.description !== next.description) {
        throw new Error(`${slug} [${locale}]: la meta no quedó escrita`)
      }
      if (!isDeepStrictEqual(after.content, self.content) || after.title !== self.title) {
        throw new Error(`${slug} [${locale}]: cambió el contenido; revisar con el respaldo`)
      }
      for (const key of ['title', 'content', 'meta', 'slug']) {
        if (!isDeepStrictEqual(before[key], otherAfter[key])) {
          throw new Error(`${slug}: cambió ${key} en ${other}; revisar con el respaldo`)
        }
      }
      console.log(`  escrito y verificado (${other} intacto)`)
    }
  }

  // --- Voseo en meta descripciones ------------------------------------------
  for (const { collection, slug, from, to } of VOSEO) {
    const doc = await read(collection, slug, 'es')
    const current: string = doc.meta?.description ?? ''
    console.log(`\n## ${collection}/${slug} [es] voseo`)
    if (!current.includes(from)) {
      console.log('  nada que cambiar')
      continue
    }
    const description = current.replace(from, to)
    console.log(`  - ${current}\n  + ${description}`)
    if (!APPLY) continue

    const before = await read(collection, slug, 'en')
    await payload.update({
      collection,
      id: doc.id,
      locale: 'es',
      fallbackLocale: false,
      data: { meta: { ...doc.meta, description }, _status: 'published' },
      draft: false,
    })
    const after = await read(collection, slug, 'es')
    const otherAfter = await read(collection, slug, 'en')
    if (after.meta?.description !== description || !isDeepStrictEqual(after.content, doc.content)) {
      throw new Error(`${slug}: la escritura no quedó como se esperaba`)
    }
    for (const key of ['title', 'content', 'meta', 'slug']) {
      if (!isDeepStrictEqual(before[key], otherAfter[key])) {
        throw new Error(`${slug}: cambió ${key} en en; revisar con el respaldo`)
      }
    }
    console.log('  escrito y verificado (en intacto)')
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
