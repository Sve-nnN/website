/**
 * Phase 40 Plan 01 — populates the 6 real `Websites` documents
 * (ariannalupi.com, aprendoclub.com, estylopia.com,
 * drmanuelvargashidalgo.com, apturio.com, juan-tech.com) with real captured
 * data: a live full-page Playwright screenshot uploaded to Cloudinary via
 * Media, a real one-time Lighthouse (mobile) audit against the live URL,
 * stack tags confirmed by Juan (see 40-CONTEXT.md), and the real `client`
 * relationship where one exists.
 *
 * `role`/`industry`/`year`/`highlights`/`challenges` copy is inferred from
 * each site's public content and Juan's own knowledge of these projects
 * (per 40-CONTEXT.md "Claude's Discretion") — reasonable defaults, not
 * fabricated metrics. `relatedCaseStudy` is left unset on all 6 docs: no
 * real match was confirmed against the existing `case-studies` collection
 * (see 40-CONTEXT.md).
 *
 * Idempotent by slug: re-running finds the existing doc and skips the
 * screenshot/Lighthouse capture (real network operations, run once), only
 * refreshing the localized text fields.
 *
 * Sequential (not concurrent) — one Playwright screenshot + one Lighthouse
 * audit per site, in order, no retry loop. Continue-on-failure: a failure
 * on one site is logged and does not abort the run for the remaining
 * sites.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase40-websites.ts
 */
import { install, computeExecutablePath, resolveBuildId, detectBrowserPlatform, Browser } from '@puppeteer/browsers'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import { chromium } from 'playwright'
import { getPayload } from 'payload'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHROME_CACHE_DIR = path.join(path.dirname(__dirname), '.lighthouse-chrome')

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

interface LocalizedList {
  es: string[]
  en: string[]
}

interface SiteDefinition {
  slug: string
  domain: string
  titleByLocale: Record<Locale, string>
  roleByLocale: Record<Locale, string>
  industryByLocale: Record<Locale, string>
  year: number
  stack: string[]
  clientId: number | null
  highlightsByLocale: LocalizedList
  challengesByLocale: LocalizedList
}

const SITES: SiteDefinition[] = [
  {
    slug: 'ariannalupi-com',
    domain: 'https://ariannalupi.com',
    titleByLocale: { es: 'Arianna Lupi', en: 'Arianna Lupi' },
    roleByLocale: {
      es: 'Desarrollo full-stack y SEO técnico',
      en: 'Full-stack development and technical SEO',
    },
    industryByLocale: { es: 'Marca personal / coaching', en: 'Personal brand / coaching' },
    year: 2025,
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    clientId: 29,
    highlightsByLocale: {
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
    challengesByLocale: {
      es: [
        'Migrar la plataforma sin perder posicionamiento orgánico existente',
        'Mantener tiempos de carga bajos con contenido rico en imágenes',
      ],
      en: [
        'Migrating platforms without losing existing organic rankings',
        'Keeping load times low with image-heavy content',
      ],
    },
  },
  {
    slug: 'aprendoclub-com',
    domain: 'https://aprendoclub.com',
    titleByLocale: { es: 'Aprendoclub', en: 'Aprendoclub' },
    roleByLocale: { es: 'Arquitectura full-stack', en: 'Full-stack architecture' },
    industryByLocale: { es: 'Educación online', en: 'Online education' },
    year: 2025,
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    clientId: 4,
    highlightsByLocale: {
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
    challengesByLocale: {
      es: [
        'Modelar cursos/lecciones de forma flexible en el CMS',
        'Asegurar rendimiento con un catálogo de cursos en crecimiento',
      ],
      en: [
        'Modeling courses/lessons flexibly in the CMS',
        'Ensuring performance as the course catalog grows',
      ],
    },
  },
  {
    slug: 'estylopia-com',
    domain: 'https://estylopia.com',
    titleByLocale: { es: 'Estylopia', en: 'Estylopia' },
    roleByLocale: {
      es: 'Implementación y configuración WordPress + Elementor',
      en: 'WordPress + Elementor implementation and setup',
    },
    industryByLocale: { es: 'Retail / estilo personal', en: 'Retail / personal styling' },
    year: 2023,
    stack: ['WordPress', 'Elementor'],
    clientId: 1,
    highlightsByLocale: {
      es: [
        'Sitio construido sobre WordPress + Elementor',
        'Configuración de theme y plugins ajustada a la marca',
        'Estructura de páginas orientada a conversión',
      ],
      en: [
        'Site built on WordPress + Elementor',
        "Theme and plugin setup tailored to the brand",
        'Page structure oriented toward conversion',
      ],
    },
    challengesByLocale: {
      es: [
        'Balancear la flexibilidad de Elementor con la velocidad de carga',
        'Mantener consistencia visual entre secciones',
      ],
      en: [
        "Balancing Elementor's flexibility with load speed",
        'Keeping visual consistency across sections',
      ],
    },
  },
  {
    slug: 'drmanuelvargashidalgo-com',
    domain: 'https://drmanuelvargashidalgo.com',
    titleByLocale: { es: 'Dr. Manuel A. Vargas Hidalgo', en: 'Dr. Manuel A. Vargas Hidalgo' },
    roleByLocale: {
      es: 'Implementación y configuración WordPress + Elementor',
      en: 'WordPress + Elementor implementation and setup',
    },
    industryByLocale: { es: 'Salud / consulta médica', en: 'Healthcare / medical practice' },
    year: 2023,
    stack: ['WordPress', 'Elementor'],
    clientId: 8,
    highlightsByLocale: {
      es: [
        'Sitio institucional en WordPress + Elementor',
        'Información de contacto y servicios clara para pacientes',
        'Optimización básica de SEO on-page',
      ],
      en: [
        'Institutional site on WordPress + Elementor',
        'Clear contact and services information for patients',
        'Basic on-page SEO optimization',
      ],
    },
    challengesByLocale: {
      es: [
        'Presentar información médica de forma clara y confiable',
        'Facilitar el contacto y agendamiento desde el sitio',
      ],
      en: [
        'Presenting medical information clearly and credibly',
        'Making contact and scheduling easy from the site',
      ],
    },
  },
  {
    slug: 'apturio-com',
    domain: 'https://apturio.com',
    titleByLocale: { es: 'Apturio', en: 'Apturio' },
    roleByLocale: { es: 'Producto full-stack', en: 'Full-stack product' },
    industryByLocale: { es: 'Software / SaaS', en: 'Software / SaaS' },
    year: 2025,
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    clientId: 28,
    highlightsByLocale: {
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
    challengesByLocale: {
      es: [
        'Diseñar un modelo de datos flexible para el producto',
        'Mantener buen rendimiento en Postgres con pooling adecuado',
      ],
      en: [
        'Designing a flexible data model for the product',
        'Keeping good Postgres performance with proper connection pooling',
      ],
    },
  },
  {
    slug: 'juan-tech-com',
    domain: 'https://juan-tech.com',
    titleByLocale: { es: 'Juan Tech', en: 'Juan Tech' },
    roleByLocale: {
      es: 'Sitio personal (desarrollador y autor)',
      en: 'Personal site (developer and author)',
    },
    industryByLocale: {
      es: 'Servicios profesionales / consultoría técnica',
      en: 'Professional services / technical consulting',
    },
    year: 2025,
    stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger'],
    clientId: null,
    highlightsByLocale: {
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
    challengesByLocale: {
      es: [
        'Mantener el sitio como referencia viva del stack sin descuidar el SEO propio',
        'Balancear tiempo entre proyectos de clientes y el sitio propio',
      ],
      en: [
        "Keeping the site as a living reference for the stack without neglecting its own SEO",
        'Balancing time between client projects and the personal site',
      ],
    },
  },
]

async function getChromePath(): Promise<string> {
  const platform = detectBrowserPlatform()
  const buildId = await resolveBuildId(Browser.CHROME, platform, 'stable')
  const existing = computeExecutablePath({ browser: Browser.CHROME, buildId, cacheDir: CHROME_CACHE_DIR, platform })
  try {
    await import('node:fs/promises').then((fs) => fs.access(existing))
    return existing
  } catch {
    const result = await install({ browser: Browser.CHROME, buildId, cacheDir: CHROME_CACHE_DIR })
    return result.executablePath
  }
}

interface LighthouseScores {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
}

async function runLighthouse(url: string, chromePath: string): Promise<LighthouseScores> {
  const chrome = await launch({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox'] })
  try {
    const result = await lighthouse(
      url,
      { port: chrome.port, output: 'json', logLevel: 'error' },
      {
        extends: 'lighthouse:default',
        settings: {
          formFactor: 'mobile',
          screenEmulation: { mobile: true, width: 375, height: 812, deviceScaleFactor: 2, disabled: false },
        },
      },
    )
    const categories = result!.lhr.categories
    return {
      performance: Math.round(categories.performance.score! * 100),
      accessibility: Math.round(categories.accessibility.score! * 100),
      bestPractices: Math.round(categories['best-practices'].score! * 100),
      seo: Math.round(categories.seo.score! * 100),
    }
  } finally {
    await chrome.kill()
  }
}

async function captureScreenshot(url: string): Promise<Buffer> {
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })
    const buffer = await page.screenshot({ fullPage: true })
    await page.close()
    return buffer
  } finally {
    await browser.close()
  }
}

/**
 * `highlights`/`challenges` are arrays whose ONLY localized field is the
 * nested `text` — the array structure/ids themselves are shared across
 * locales. Writing a locale's array without reusing the ids the OTHER
 * locale's write already assigned makes Payload treat it as a brand-new
 * set of items, orphaning the other locale's saved text (same bug pattern
 * documented in scripts/seed-phase19-service-pages.ts's reapplyIds). Always
 * fetch the current item ids first and reuse them for every locale write.
 */
function withReusedIds(
  existingItems: { id?: string | number }[] | undefined,
  texts: string[],
): { id?: string | number; text: string }[] {
  return texts.map((text, i) => {
    const id = existingItems?.[i]?.id
    return id !== undefined ? { id, text } : { text }
  })
}

async function upsertWebsite(
  payload: Awaited<ReturnType<typeof getPayload>>,
  chromePath: string,
  site: SiteDefinition,
) {
  const { docs } = await payload.find({
    collection: 'websites',
    where: { slug: { equals: site.slug } },
    limit: 1,
  })

  let docId: number | string

  if (docs.length === 0) {
    console.log(`[${site.slug}] capturing screenshot from ${site.domain} ...`)
    const buffer = await captureScreenshot(site.domain)

    console.log(`[${site.slug}] uploading screenshot to Media/Cloudinary ...`)
    const mediaDoc = await payload.create({
      collection: 'media',
      locale: 'es',
      data: { alt: `${site.titleByLocale.es} — captura de pantalla completa` },
      file: {
        data: buffer,
        mimetype: 'image/png',
        name: `${site.slug}-screenshot.png`,
        size: buffer.length,
      },
    })

    console.log(`[${site.slug}] running Lighthouse (mobile) against ${site.domain} ...`)
    const lhScores = await runLighthouse(site.domain, chromePath)
    const lighthouseCapturedAt = new Date().toISOString()
    console.log(`[${site.slug}] Lighthouse scores:`, lhScores)

    const created = await payload.create({
      collection: 'websites',
      locale: 'es',
      data: {
        title: site.titleByLocale.es,
        role: site.roleByLocale.es,
        industry: site.industryByLocale.es,
        year: site.year,
        highlights: site.highlightsByLocale.es.map((text) => ({ text })),
        stack: site.stack.map((tag) => ({ tag })),
        challenges: site.challengesByLocale.es.map((text) => ({ text })),
        screenshots: [{ image: mediaDoc.id }],
        lighthouse: lhScores,
        lighthouseCapturedAt,
        client: site.clientId ?? null,
        slug: site.slug,
        _status: 'published',
      },
    })
    docId = created.id
    console.log(`[${site.slug}] Created websites doc (id=${docId})`)
  } else {
    docId = docs[0].id
    console.log(`[${site.slug}] Skipped (already exists, id=${docId}) — refreshing localized text only`)
  }

  // Fetch current array item ids (shared across locales) so the locale
  // writes below reuse them instead of minting new ones per locale.
  const current = await payload.findByID({ collection: 'websites', id: docId, depth: 0 })
  const existingHighlights = current.highlights as { id?: string | number }[] | undefined
  const existingChallenges = current.challenges as { id?: string | number }[] | undefined

  for (const locale of LOCALES) {
    await payload.update({
      collection: 'websites',
      id: docId,
      locale,
      data: {
        title: site.titleByLocale[locale],
        role: site.roleByLocale[locale],
        industry: site.industryByLocale[locale],
        highlights: withReusedIds(existingHighlights, site.highlightsByLocale[locale]),
        challenges: withReusedIds(existingChallenges, site.challengesByLocale[locale]),
      },
    })
  }
}

async function main() {
  const payload = await getPayload({ config })
  const chromePath = await getChromePath()
  console.log(`Using Chrome at: ${chromePath}`)

  const failures: { slug: string; reason: string }[] = []

  for (const site of SITES) {
    try {
      await upsertWebsite(payload, chromePath, site)
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.error(`[${site.slug}] FAILED:`, err)
      failures.push({ slug: site.slug, reason })
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} site(s) failed:`)
    for (const f of failures) console.error(`  - ${f.slug}: ${f.reason}`)
    process.exitCode = 1
    return
  }

  console.log('\nAll 6 sites processed successfully.')
  process.exit(0)
}

main().catch((err) => {
  console.error('seed-phase40-websites.ts crashed:', err)
  process.exit(1)
})
