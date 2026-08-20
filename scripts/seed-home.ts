/**
 * Composes the home page layout from the confirmed design brief.
 *
 * Run it with the tunnel open (see scripts/db/tunnel.sh):
 *   export DATABASE_URI="postgresql://juantech_user:<clave>@localhost:15432/juantech?sslmode=disable"
 *   node --env-file=.env node_modules/.bin/tsx scripts/seed-home.ts
 *
 * NON-DESTRUCTIVE BY DESIGN. It reads the current layout first and reuses the
 * existing hero, services and about blocks with whatever content they already
 * carry, rather than writing fresh copies of them. Blocks the brief drops from
 * the home (FAQ, featured posts, the one-line testimonial) are removed from
 * THIS page's layout only; nothing is deleted from any collection, and the
 * blocks stay available in the admin for any other page.
 *
 * Every update passes `draft: false`. Omitting it is a bug this project has
 * already been bitten by: a versioned collection silently un-publishes the
 * document, so the write "succeeds" and production keeps serving the old copy.
 *
 * Idempotent: running it twice produces the same layout.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

type Locale = 'es' | 'en'

const REPO = 'https://github.com/Sve-nnN/website'
const commit = (sha: string) => `${REPO}/commit/${sha}`

/**
 * The three fixes shown on the home page. Every `code` value below is copied
 * out of the commit it links to — see the CodeFixesBlock config for why that
 * is not negotiable. If any of these files change, the snippet stays as it is:
 * it documents what the commit did, not what the file looks like today.
 */
const HREFLANG_CODE = `return stripIntlAlternateLinks(intlMiddleware(request))

function stripIntlAlternateLinks(response: NextResponse): NextResponse {
  const link = response.headers.get('link')
  if (!link) return response

  const kept = link
    .split(/,\\s*(?=<)/)
    .filter((entry) => !/rel="?alternate"?/i.test(entry))
    .join(', ')

  if (kept) {
    response.headers.set('link', kept)
  } else {
    response.headers.delete('link')
  }

  return response
}`

const SITEMAP_CODE = `const getCachedSitemapEntries = unstable_cache(
  fetchSitemapEntries,
  ['sitemap-entries'],
  {
    tags: [CACHE_TAGS.posts(), CACHE_TAGS.caseStudies(), CACHE_TAGS.categories()],
    // Crawlers read the sitemap on their own schedule, so a slightly stale
    // listing costs nothing while a failed request under DB pressure costs
    // the whole file.
    revalidate: 900,
  },
)`

const AVIF_CODE = `images: {
  // AVIF first, WebP as the fallback for anything that cannot decode it.
  // Next picks the first entry the request's \`Accept\` header allows.
  formats: ['image/avif', 'image/webp'],
},`

const COPY = {
  es: {
    logosTitle: 'Con quiénes trabajé',
    fixes: {
      title: 'Errores reales, con el commit que los corrige',
      intro:
        'Cada uno de estos problemas estaba en este mismo sitio, y abajo está el cambio exacto que lo resolvió. El repositorio es público, así que podés abrir el commit y leerlo completo, no solo el pedazo que elegí mostrar.',
      repoLabel: 'Ver el repositorio completo',
      items: [
        {
          symptom: 'Google recibía dos anotaciones de hreflang que se contradecían',
          cause:
            'El middleware de next-intl arma los alternates a partir del prefijo de idioma: toma el pathname y le antepone /en. Eso acierta en todas las plantillas que comparten slug y falla justo en la única que lo tiene traducido, /servicios contra /en/services. En /servicios anunciaba por header un /en/servicios que resuelve, pero cuyo canonical apunta a otra URL, así que la misma respuesta se desmentía a sí misma.',
          filePath: 'src/middleware.ts',
          language: 'ts',
          code: HREFLANG_CODE,
          commitUrl: commit('23646a1'),
          commitSha: '23646a1',
          outcome: 'Una sola anotación, la del head',
        },
        {
          symptom: 'El sitemap devolvía 500 y un urlset vacío en producción',
          cause:
            'Corría cinco consultas en Promise.all más una sexta en secuencia, o sea hasta seis conexiones simultáneas contra la conexión directa de Postgres, que es la que no pasa por el pooler. Bajo esa presión el archivo se caía entero y quedaba servido el fallback vacío que la ruta ya tenía cableado para exactamente ese caso.',
          filePath: 'src/lib/sitemap-data.ts',
          language: 'ts',
          code: SITEMAP_CODE,
          commitUrl: commit('6849e95'),
          commitSha: '6849e95',
          outcome: 'De 6 conexiones a 1 consulta cacheada',
        },
        {
          symptom: 'Las imágenes salían en WebP aunque el navegador aceptaba AVIF',
          cause:
            'El array de formats de Next tenía WebP y nada más. Next devuelve el primer formato de esa lista que el header Accept del pedido permite, así que con una sola entrada nunca había nada mejor para elegir, por más que el navegador lo estuviera pidiendo.',
          filePath: 'next.config.mjs',
          language: 'js',
          code: AVIF_CODE,
          commitUrl: commit('4f8942e'),
          commitSha: '4f8942e',
          outcome: 'AVIF servido donde el navegador lo acepta',
        },
      ],
    },
    audit: {
      title: 'Empecemos por una auditoría técnica',
      description:
        'Reviso rastreo, indexación, renderizado, Core Web Vitals y datos estructurados sobre tu código, no sobre lo que dice un reporte automático. Te entrego los problemas ordenados por impacto y, al lado de cada uno, la corrección concreta que hay que hacer.',
      price: '600 USD',
      priceCaption: 'Auditoría SEO técnica completa',
      deliveryNote: 'Entrega en 10 días hábiles',
      creditNote:
        'Si después me contratas la implementación, esos 600 se descuentan del trabajo. La auditoría no es un producto aparte, es por donde empiezo.',
      includes: [
        'Rastreo e indexación: qué ve Google de tu sitio y qué se está perdiendo',
        'Renderizado: qué contenido depende de JavaScript y qué llega ya en el HTML',
        'Core Web Vitals medidos en campo, no solo en laboratorio',
        'Datos estructurados, validados contra lo que realmente emite el sitio',
        'Cada problema con su corrección concreta, ordenado por impacto',
      ],
      ctaLabel: 'Pedir la auditoría',
    },
  },
  en: {
    logosTitle: 'Who I have worked with',
    fixes: {
      title: 'Real bugs, with the commit that fixes them',
      intro:
        'Every one of these was a problem on this site, and below each is the exact change that resolved it. The repository is public, so you can open the commit and read the whole thing, not just the part I chose to show.',
      repoLabel: 'See the full repository',
      items: [
        {
          symptom: 'Google was getting two hreflang annotations that contradicted each other',
          cause:
            "next-intl's middleware builds its alternates from the locale prefix: it takes the pathname and puts /en in front of it. That is right for every template sharing a slug across languages, and wrong for the only one with a translated slug, /servicios against /en/services. On /servicios it advertised /en/servicios in the header, a URL that resolves but whose canonical points somewhere else, so the same response argued with itself.",
          filePath: 'src/middleware.ts',
          language: 'ts',
          code: HREFLANG_CODE,
          commitUrl: commit('23646a1'),
          commitSha: '23646a1',
          outcome: 'One annotation, the one in the head',
        },
        {
          symptom: 'The sitemap was returning 500s and an empty urlset in production',
          cause:
            'It ran five queries in Promise.all plus a sixth in sequence, up to six simultaneous connections against the direct Postgres connection, the one that does not go through the pooler. Under that pressure the whole file fell over and what got served was the empty fallback the route already had wired for exactly this case.',
          filePath: 'src/lib/sitemap-data.ts',
          language: 'ts',
          code: SITEMAP_CODE,
          commitUrl: commit('6849e95'),
          commitSha: '6849e95',
          outcome: 'From 6 connections to 1 cached query',
        },
        {
          symptom: 'Images were served as WebP even when the browser accepted AVIF',
          cause:
            "Next's formats array listed WebP and nothing else. Next returns the first format in that list the request's Accept header allows, so with a single entry there was never anything better to pick, no matter what the browser was asking for.",
          filePath: 'next.config.mjs',
          language: 'js',
          code: AVIF_CODE,
          commitUrl: commit('4f8942e'),
          commitSha: '4f8942e',
          outcome: 'AVIF served wherever the browser takes it',
        },
      ],
    },
    audit: {
      title: 'We start with a technical audit',
      description:
        'I go through crawling, indexing, rendering, Core Web Vitals and structured data against your code, not against whatever an automated report says. You get the problems ranked by impact and, next to each one, the specific fix it needs.',
      price: '600 USD',
      priceCaption: 'Full technical SEO audit',
      deliveryNote: 'Delivered in 10 working days',
      creditNote:
        'If you hire me for the implementation afterwards, those 600 come off the work. The audit is not a separate product, it is where I start.',
      includes: [
        'Crawling and indexing: what Google sees of your site and what it is missing',
        'Rendering: what depends on JavaScript and what already ships in the HTML',
        'Core Web Vitals measured in the field, not only in the lab',
        'Structured data, validated against what the site actually emits',
        'Every problem with its concrete fix, ranked by impact',
      ],
      ctaLabel: 'Request the audit',
    },
  },
} as const

/** Block types the brief removes from the home page layout. */
const DROPPED = new Set(['faq', 'featuredPostsBlock', 'testimonialSection', 'testimonialsCarousel'])

/**
 * Block ids captured after the first locale is written.
 *
 * WHY THIS EXISTS — `layout` is not a localized field, so the block STRUCTURE
 * is shared between locales and only the fields marked `localized: true`
 * inside each block store a per-locale value. Passing a block without its
 * `id` on the second pass therefore does not update the Spanish block: Payload
 * reads it as a brand new one, replaces the old row, and the Spanish values
 * that lived on the replaced row are gone. First run of this script produced
 * exactly that — every localized title on the home page rendered empty,
 * because writing `en` had wiped what writing `es` had just stored.
 *
 * So the first locale creates the structure, we read the ids back, and the
 * second locale updates those same blocks in place.
 */
type SavedLayout = any[]

/**
 * Rewrites an already-saved layout with another locale's copy, keeping every
 * `id` — the block's own and the ids of each row inside its arrays.
 *
 * The array rows need this as much as the blocks do: the first fix of the
 * localized-title bug preserved block ids but rebuilt `fixes` and `includes`
 * from scratch, so the second pass replaced those rows and the Spanish
 * symptom/cause/outcome disappeared while the Spanish block title survived.
 */
function applyLocaleCopy(saved: SavedLayout, copy: (typeof COPY)[Locale]): SavedLayout {
  return saved.map((block: any) => {
    if (block.blockType === 'clientLogosBlock') {
      return { ...block, title: copy.logosTitle }
    }

    if (block.blockType === 'codeFixesBlock') {
      return {
        ...block,
        title: copy.fixes.title,
        intro: copy.fixes.intro,
        repoLabel: copy.fixes.repoLabel,
        fixes: (block.fixes ?? []).map((row: any, i: number) => ({
          ...row,
          ...(copy.fixes.items[i] ?? {}),
        })),
      }
    }

    if (block.blockType === 'auditOfferBlock') {
      return {
        ...block,
        title: copy.audit.title,
        description: copy.audit.description,
        price: copy.audit.price,
        priceCaption: copy.audit.priceCaption,
        deliveryNote: copy.audit.deliveryNote,
        creditNote: copy.audit.creditNote,
        includes: (block.includes ?? []).map((row: any, i: number) => ({
          ...row,
          item: copy.audit.includes[i] ?? row.item,
        })),
        links: (block.links ?? []).map((row: any) => ({
          ...row,
          link: { ...row.link, label: copy.audit.ctaLabel },
        })),
      }
    }

    return block
  })
}

async function main() {
  const payload = await getPayload({ config })

  let savedLayout: SavedLayout | null = null

  for (const locale of ['es', 'en'] as Locale[]) {
    const found = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'home' } },
      locale,
      depth: 0,
      limit: 1,
    })

    const home = found.docs[0]
    if (!home) throw new Error(`No home page found for locale ${locale}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current: any[] = (home.content as any)?.layout ?? []
    const byType = (t: string) => current.find((b) => b.blockType === t)
    const copy = COPY[locale]

    const hero = byType('hero')
    const services = byType('servicesShowcase')
    const about = byType('aboutSection')
    const caseStudies = byType('featuredCaseStudiesBlock')
    const logos = byType('clientLogosBlock')
    const contact = byType('contactFormBlock')

    // Reuse the existing layout whenever the new blocks are already in it, on
    // BOTH passes. Rebuilding from scratch on the first locale would hand
    // Payload block objects with no `id`, which it reads as new blocks — it
    // would replace the rows and wipe the other locale's values, the exact
    // bug this script hit the first time it ran. So a copy edit now updates
    // in place instead of rebuilding, and the script can be re-run safely
    // every time the wording changes.
    const alreadyComposed =
      current.some((b) => b.blockType === 'codeFixesBlock') &&
      current.some((b) => b.blockType === 'auditOfferBlock')

    const layout = savedLayout
      ? applyLocaleCopy(savedLayout, copy)
      : alreadyComposed
        ? applyLocaleCopy(current, copy)
        : [
      // 1. Hero, kept exactly as it is apart from the portrait Juan uploads
      //    in the admin. Its copy is already in his voice and the brief did
      //    not ask to replace it.
      hero,

      // 2. The named proof, high. Grouped by type of work now that Clientes
      //    carries `workType`.
      { ...(logos ?? { blockType: 'clientLogosBlock' }), title: copy.logosTitle },

      // 3. The focal block: real fixes from the public repo.
      {
        blockType: 'codeFixesBlock',
        title: copy.fixes.title,
        intro: copy.fixes.intro,
        repoUrl: REPO,
        repoLabel: copy.fixes.repoLabel,
        fixes: copy.fixes.items.map((f) => ({ ...f })),
      },

      // 4. Client results. The repo supplied the cause; these supply the
      //    numbers, with the client anonymised.
      caseStudies ?? { blockType: 'featuredCaseStudiesBlock', limit: 3 },

      // 5. How he works.
      services,

      // 6. Who he is. This is the block the recruiter came for, and it sits
      //    below the sales argument on purpose: the cold client has already
      //    decided by here, the recruiter keeps scrolling.
      about,

      // 7. The single action.
      {
        blockType: 'auditOfferBlock',
        title: copy.audit.title,
        description: copy.audit.description,
        price: copy.audit.price,
        priceCaption: copy.audit.priceCaption,
        deliveryNote: copy.audit.deliveryNote,
        creditNote: copy.audit.creditNote,
        includes: copy.audit.includes.map((item) => ({ item })),
        links: [
          {
            link: {
              type: 'custom',
              url: locale === 'en' ? '/en/contact' : '/contact',
              label: copy.audit.ctaLabel,
              appearance: 'default',
            },
          },
        ],
      },

      // Contact form stays last if the page already had one.
      contact,
        ].filter(Boolean)

    const dropped = current.filter((b) => DROPPED.has(b.blockType)).map((b) => b.blockType)

    await payload.update({
      collection: 'pages',
      id: home.id,
      locale,
      draft: false,
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: { ...((home.content as any) ?? {}), layout },
      },
    })

    // Read the ids Payload assigned so the next locale updates these very
    // blocks instead of replacing them (see the BlockIds note above).
    const saved = await payload.findByID({
      collection: 'pages',
      id: home.id,
      locale,
      depth: 0,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    savedLayout = ((saved.content as any)?.layout ?? []) as SavedLayout

    console.log(
      `[${locale}] layout: ${layout.length} blocks -> ${layout.map((b: any) => b.blockType).join(', ')}`,
    )
    if (dropped.length > 0) console.log(`[${locale}] removed from this page: ${dropped.join(', ')}`)
  }

  console.log('\nDone. The hero portrait still needs to be uploaded in the admin.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
