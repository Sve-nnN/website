/**
 * Auditoría SEO 2026-11. /llms.txt y /llms-full.txt con español, inglés y blog.
 *
 * Reemplaza al texto de scripts/db/11-llms-txt.ts. Los listados de servicios,
 * casos y artículos salen de lo que está publicado en el momento de correr el
 * script, así que conviene volver a ejecutarlo después de publicar, retitular o
 * traducir contenido. En inglés quedan fuera los artículos sin texto propio y
 * los que el sitio marca con noindex (src/lib/translation-gaps.ts).
 *
 * Guarda el texto anterior en el respaldo de scripts/db/41.
 *
 *   tsx scripts/db/42-llms-txt-bilingue.ts
 *   tsx scripts/db/42-llms-txt-bilingue.ts --apply --db-checked
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { blogPostPath, resolvePrimaryCategorySlug } from '../../src/lib/blog-paths'
import { isEnTranslationIncomplete } from '../../src/lib/translation-gaps'
import { assertSafeTarget } from './data/54-seed-lib'

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')
const SITE = 'https://juan-tech.com'

type Locale = 'es' | 'en'

const SERVICE_SLUGS: Record<string, string> = {
  'seo-technical-audit': 'seo-technical-audit',
  'seo-consulting': 'seo-consulting',
  'fullstack-development': 'fullstack-development',
  'ai-seo-geo': 'ai-seo-geo',
}
const CATEGORY_ORDER = ['tech-seo', 'seo', 'development', 'cs-fundamentals']

const COPY = {
  es: {
    prefix: '',
    services: '/servicios',
    pages: 'Páginas',
    servicesTitle: 'Servicios',
    cases: 'Casos de éxito',
    blog: 'Blog',
    pageList: [
      ['Inicio', '/', 'quién soy, resultados en Search Console y formas de trabajar conmigo'],
      ['Sobre mí', '/sobre-mi', 'trayectoria, experiencia, formación y charlas'],
      ['Servicios', '/servicios', 'las formas de trabajar conmigo'],
      ['Casos de éxito', '/case-studies', 'trabajos con el punto de partida, lo que se hizo y las cifras'],
      ['Blog', '/blog', 'artículos de SEO técnico, estrategia, desarrollo e informática'],
      ['Sitios web', '/websites', 'sitios que construí'],
      ['SEO técnico en Lima', '/seo-tecnico-lima', 'trabajo con empresas peruanas'],
      ['SEO técnico en Madrid', '/seo-tecnico-madrid', 'trabajo en remoto con empresas de España'],
      ['Contacto', '/contact', 'formulario de contacto'],
    ],
  },
  en: {
    prefix: '/en',
    services: '/en/services',
    pages: 'Pages',
    servicesTitle: 'Services',
    cases: 'Case studies',
    blog: 'Blog',
    pageList: [
      ['Home', '/en', 'who I am, Search Console results and ways to work with me'],
      ['About', '/en/sobre-mi', 'career, experience, education and talks'],
      ['Services', '/en/services', 'the ways to work with me'],
      ['Case studies', '/en/case-studies', 'projects with the starting point, the work and the figures'],
      ['Blog', '/en/blog', 'articles on technical SEO, strategy, development and computer science'],
      ['Websites', '/en/websites', 'sites I built'],
      ['Technical SEO in Lima', '/en/seo-tecnico-lima', 'work with companies in Peru'],
      ['Technical SEO in Madrid', '/en/seo-tecnico-madrid', 'remote work with companies in Spain'],
      ['Contact', '/en/contact', 'contact form'],
    ],
  },
} as const

const INTRO_ES = `# Juan Carlos Angulo

> Ingeniero de software y consultor de SEO técnico en Lima. Audito sitios,
> corrijo el código y mido el resultado. El sitio está en español, sin prefijo,
> y en inglés bajo /en. This file has an English section further down.`

const ABOUT = {
  es: `Soy ingeniero de software y consultor de SEO técnico. Vivo en Lima y trabajo
en remoto. Trabajo en dos empresas de SEO a la vez: aprendoclub, desde
noviembre de 2022, donde además soy coach de SEO técnico de su Diplomado
SEO + AIO, y Loops Growth, desde 2024. Más detalle en ${SITE}/sobre-mi.`,
  en: `I am a software engineer and technical SEO consultant. I live in Lima and work
remotely. I work at two SEO companies at the same time: aprendoclub, since
November 2022, where I also coach technical SEO in its SEO + AIO Diploma, and
Loops Growth, since 2024. More detail at ${SITE}/en/sobre-mi.`,
}

const NOTE = {
  es: `## Cómo citar

Si citas algo de este sitio, enlaza la URL original. El listado completo de
páginas está en ${SITE}/sitemap.xml y el código del sitio es público en
https://github.com/Sve-nnN/website.`,
  en: `## How to cite

If you quote anything from this site, link to the original URL. The full list of
pages is at ${SITE}/sitemap.xml and the source code of the site is public at
https://github.com/Sve-nnN/website.`,
}

const clean = (value: unknown): string =>
  String(value ?? '')
    .replace(/\s*[–—]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()

// El campo `textarea` de Payload admite 40.000 caracteres: en la versión larga
// cada artículo lleva solo la primera oración de su resumen.
const firstSentence = (value: unknown): string => clean(value).split(/(?<=[.?!])\s/)[0] ?? ''

const link = (title: string, path: string, description?: string): string =>
  `- [${clean(title).replace(/[[\]]/g, '')}](${SITE}${path === '/' ? '/' : path})${
    description ? `: ${clean(description)}` : ''
  }`

async function main() {
  assertSafeTarget(process.env.DATABASE_URI, APPLY, DB_CHECKED)
  const payload = await getPayload({ config })
  console.log(APPLY ? '=== APLICANDO ===' : '=== DRY-RUN (nada se escribe) ===')

  async function published(collection: 'posts' | 'pages' | 'case-studies' | 'categories', locale: Locale) {
    const { docs } = await payload.find({
      collection,
      locale,
      fallbackLocale: false,
      depth: collection === 'posts' ? 1 : 0,
      limit: 500,
      pagination: false,
      // Solo lo que ve un visitante anónimo.
      overrideAccess: false,
      sort: collection === 'categories' ? 'id' : '-createdAt',
    })
    return docs as any[]
  }

  async function section(locale: Locale, full: boolean): Promise<string> {
    const t = COPY[locale]
    const [pages, cases, posts, categories] = [
      await published('pages', locale),
      await published('case-studies', locale),
      await published('posts', locale),
      await published('categories', locale),
    ]
    const lang = locale === 'en' ? 'English: ' : ''
    const out: string[] = []

    out.push(`## ${lang}${t.pages}`, '', ...t.pageList.map(([a, b, c]) => link(a, b, c)), '')

    out.push(`## ${lang}${t.servicesTitle}`, '')
    for (const slug of Object.keys(SERVICE_SLUGS)) {
      const page = pages.find((p) => p.slug === slug)
      if (!page?.title) throw new Error(`falta la página de servicio ${slug} [${locale}]`)
      out.push(link(page.title, `${t.services}/${slug}`, page.meta?.description))
    }
    out.push('')

    out.push(`## ${lang}${t.cases}`, '')
    for (const c of cases.filter((c) => c.title && c.slug)) {
      out.push(link(c.title, `${t.prefix}/case-studies/${c.slug}`, c.heroSubtitle))
    }
    out.push('')

    const listed = posts.filter(
      (p) => p.title && p.slug && p.content && !isEnTranslationIncomplete(locale, p.slug),
    )
    let count = 0
    for (const slug of CATEGORY_ORDER) {
      const category = categories.find((c) => c.slug === slug)
      const items = listed.filter((p) => resolvePrimaryCategorySlug(p.categories) === slug)
      if (!category || items.length === 0) continue
      out.push(`## ${lang}${t.blog}: ${clean(category.title)}`, '')
      if (full && category.description) out.push(clean(category.description), '')
      for (const p of items) {
        out.push(
          link(
            p.title,
            `${t.prefix}${blogPostPath(slug, p.slug)}`,
            full ? firstSentence(p.excerpt || p.meta?.description) : undefined,
          ),
        )
        count++
      }
      out.push('')
    }
    console.log(
      `  [${locale}${full ? ' full' : ''}] casos ${cases.length}, artículos ${count} de ${posts.length} publicados`,
    )
    if (count !== listed.length) console.log(`  AVISO: ${listed.length - count} artículos fuera de las categorías listadas`)
    return out.join('\n')
  }

  async function build(full: boolean): Promise<string> {
    const parts = [INTRO_ES, '']
    if (full) parts.push(ABOUT.es, '')
    parts.push(await section('es', full), NOTE.es, '')
    if (full) parts.push('## English: About', '', ABOUT.en, '')
    parts.push(await section('en', full), NOTE.en.replace('## How to cite', '## English: How to cite'), '')
    return parts.join('\n')
  }

  const llmsTxt = await build(false)
  const llmsFull = await build(true)

  for (const [name, text] of [['llms.txt', llmsTxt], ['llms-full.txt', llmsFull]]) {
    if (text.length > 40000) throw new Error(`${name} pasa de 40.000 caracteres (${text.length})`)
    if (/[–—]/.test(text)) throw new Error(`${name} lleva rayas`)
    if (/undefined|null\)|\[object/.test(text)) throw new Error(`${name} lleva un valor roto`)
    console.log(`\n===== ${name} (${text.length} caracteres) =====\n${text}`)
  }

  if (!APPLY) return

  await payload.updateGlobal({ slug: 'llms', data: { llmsTxt, llmsFull } })
  const after = await payload.findGlobal({ slug: 'llms' })
  if (after.llmsTxt !== llmsTxt || after.llmsFull !== llmsFull) {
    throw new Error('Lo leído no coincide con lo escrito')
  }
  console.log('\nEscrito y verificado.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
