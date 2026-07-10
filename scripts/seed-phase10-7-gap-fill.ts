/**
 * Populates the two new gap-fill blocks (10.7, UI-20/UI-21) with real/
 * realistic content:
 *
 * 1. AboutSection (UI-20): replaces the generic `content` block that
 *    05-06/seed-home-page.ts used as a stand-in for an "about" section on
 *    the real `home` Pages doc, with the new purpose-built block
 *    (eyebrow + title + paragraphs + photo), in both locales.
 *
 * 2. TestimonialSection (UI-21): Postgres currently has 0 real case studies
 *    (confirmed via Local API query before writing this script), so this
 *    creates one realistic case study — modeled on the
 *    "El cliente / El reto / La solución / Resultados" structure from
 *    ariannalupi.com/casos/ referenced in ROADMAP Phase 1 — with a
 *    TestimonialSection embedded between "La solución" and "Resultados".
 *
 * Idempotent: upserts by slug, never delete-then-recreate (05-06 precedent).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase10-7-gap-fill.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

async function seedAboutSection(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs: authorDocs } = await payload.find({ collection: 'authors', limit: 1 })
  const author = authorDocs[0]

  if (!author) {
    console.log('No Author doc found — cannot build AboutSection. Skipping.')
    return
  }

  const { docs: homeDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = homeDocs[0]

  if (!homeDoc) {
    console.log('No `home` Pages doc found by slug — cannot seed AboutSection. Skipping.')
    return
  }

  const currentLayout = (homeDoc.content?.layout ?? []) as Array<Record<string, unknown>>
  const contentBlockIndex = currentLayout.findIndex((b) => b.blockType === 'content')

  // Pre-existing data bug (05-06 seed-home-page.ts id-reuse gap): the CTA
  // block's nested `links[].link.id` was never reused across locale writes,
  // so the `es` locale's link label was silently dropped (last write partially
  // wins on the nested array). Patch it while we're touching this layout
  // anyway — otherwise resubmitting the full layout array below fails
  // validation on the untouched CTA block.
  const ctaLabelByLocale: Record<(typeof LOCALES)[number], string> = {
    es: 'Hablemos',
    en: 'Get in Touch',
  }

  const aboutCopy = {
    es: {
      eyebrow: 'Sobre mí',
      title: 'Ingeniería de software con mentalidad SEO',
      paragraphs: [
        author.bio ??
          'Ingeniero de software especializado en arquitecturas de alto rendimiento y estrategias de crecimiento orgánico, con más de una década trabajando en proyectos donde el código y el posicionamiento no compiten, sino que se refuerzan mutuamente.',
        'Trabajo con equipos técnicos y de marketing para construir sitios que cargan rápido, se indexan sin fricción y convierten — sin sacrificar mantenibilidad ni escalabilidad del lado del desarrollo.',
      ],
    },
    en: {
      eyebrow: 'About Me',
      title: 'Software engineering with an SEO mindset',
      paragraphs: [
        author.bio ??
          'Software engineer specialized in high-performance architectures and organic growth strategies, with over a decade working on projects where code and search rankings reinforce each other instead of competing.',
        'I work with technical and marketing teams to build sites that load fast, index without friction, and convert — without sacrificing maintainability or scalability on the development side.',
      ],
    },
  }

  let savedBlockId: string | undefined

  for (const locale of LOCALES) {
    const copy = aboutCopy[locale]

    const aboutBlock: Record<string, unknown> = {
      blockType: 'aboutSection',
      eyebrow: copy.eyebrow,
      title: copy.title,
      paragraphs: copy.paragraphs.map((text) => ({ text })),
    }

    if (savedBlockId) aboutBlock.id = savedBlockId

    const newLayout = [...currentLayout]

    if (contentBlockIndex >= 0) {
      newLayout[contentBlockIndex] = aboutBlock
    } else {
      newLayout.splice(1, 0, aboutBlock)
    }

    const ctaIndex = newLayout.findIndex((b) => b.blockType === 'callToAction')
    if (ctaIndex >= 0) {
      const cta = newLayout[ctaIndex] as { links?: Array<{ link?: Record<string, unknown> }> }
      cta.links?.forEach((entry) => {
        if (entry.link && !entry.link.label) {
          entry.link.label = ctaLabelByLocale[locale]
        }
      })
    }

    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: newLayout as any,
        },
      },
    })

    if (!savedBlockId) {
      const refetched = await payload.findByID({ collection: 'pages', id: homeDoc.id, depth: 0 })
      const refetchedLayout = (refetched.content?.layout ?? []) as Array<Record<string, unknown>>
      const aboutIndex = refetchedLayout.findIndex((b) => b.blockType === 'aboutSection')
      savedBlockId = refetchedLayout[aboutIndex]?.id as string | undefined
    }

    console.log(`AboutSection: updated home Pages doc (locale=${locale})`)
  }
}

function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

async function seedCaseStudyWithTestimonial(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs: authorDocs } = await payload.find({ collection: 'authors', limit: 1 })
  const author = authorDocs[0]

  const slug = 'migracion-ecommerce-nextjs-seo-tecnico'

  const copy = {
    es: {
      title: 'Migración a Next.js sin perder tráfico orgánico',
      heroMetric: '+68%',
      heroSubtitle: 'Crecimiento de tráfico orgánico tras una migración técnica de e-commerce',
      sector: 'E-commerce',
      period: '2025',
      clientContext:
        'Una tienda online con más de 4,000 SKUs necesitaba migrar de una plantilla de comercio genérica a una arquitectura headless en Next.js, sin perder el posicionamiento acumulado en más de tres años de trabajo SEO.',
      challenge: [
        'El sitio original tenía Core Web Vitals deficientes, con LCP superior a 4 segundos en móvil.',
        'La migración de plataforma implicaba cambiar la estructura de URLs de miles de páginas de producto y categoría.',
        'El equipo de marketing necesitaba mantener el ritmo de publicación de contenido durante toda la migración.',
      ],
      solution: [
        {
          title: 'Arquitectura de redirects 301 mapeada 1:1',
          description:
            'Se congeló el inventario de URLs vivas antes del corte y se construyó una tabla de redirects verificada contra el sitemap anterior, evitando pérdida de equity de enlaces.',
        },
        {
          title: 'Renderizado híbrido con Next.js',
          description:
            'Páginas de producto y categoría se sirvieron con generación estática incremental, bajando el LCP móvil de 4.2s a 1.6s.',
        },
        {
          title: 'Datos estructurados y sitemap dinámico',
          description:
            'Se implementó JSON-LD de Product/BreadcrumbList y un sitemap generado desde la base de datos en tiempo real, reflejando siempre el catálogo vigente.',
        },
      ],
      resultsPeriodBefore: 'Antes',
      resultsPeriodAfter: 'Después (90 días)',
      resultsMetrics: [
        { label: 'Tráfico orgánico mensual', before: '82K', after: '138K' },
        { label: 'LCP móvil promedio', before: '4.2s', after: '1.6s' },
        { label: 'Páginas indexadas', before: '3,100', after: '4,050' },
      ],
      conclusion:
        'La migración se completó sin caída de tráfico en ninguna semana del corte, y el crecimiento posterior confirma que una migración técnica bien planificada puede ser una oportunidad de mejora SEO, no solo un riesgo a mitigar.',
      testimonialQuote:
        'Juan nos guió por una migración que en cualquier otro proyecto hubiera significado meses de recuperación de tráfico. Aquí, en cambio, salimos ganando desde la primera semana.',
      testimonialAuthorRole: 'Directora de Marketing Digital',
    },
    en: {
      title: 'Migrating to Next.js without losing organic traffic',
      heroMetric: '+68%',
      heroSubtitle: 'Organic traffic growth after a technical e-commerce migration',
      sector: 'E-commerce',
      period: '2025',
      clientContext:
        'An online store with over 4,000 SKUs needed to migrate from a generic commerce template to a headless Next.js architecture, without losing the search rankings built over three-plus years of SEO work.',
      challenge: [
        'The original site had poor Core Web Vitals, with mobile LCP above 4 seconds.',
        'The platform migration meant changing the URL structure of thousands of product and category pages.',
        'The marketing team needed to keep publishing content at pace throughout the migration.',
      ],
      solution: [
        {
          title: '301 redirect map, one to one',
          description:
            'The live URL inventory was frozen before cutover, and a redirect table was built and verified against the old sitemap, preventing link equity loss.',
        },
        {
          title: 'Hybrid rendering with Next.js',
          description:
            'Product and category pages moved to incremental static generation, cutting mobile LCP from 4.2s to 1.6s.',
        },
        {
          title: 'Structured data and a dynamic sitemap',
          description:
            'Product/BreadcrumbList JSON-LD went live alongside a database-driven sitemap that always reflects the current catalog.',
        },
      ],
      resultsPeriodBefore: 'Before',
      resultsPeriodAfter: 'After (90 days)',
      resultsMetrics: [
        { label: 'Monthly organic traffic', before: '82K', after: '138K' },
        { label: 'Average mobile LCP', before: '4.2s', after: '1.6s' },
        { label: 'Indexed pages', before: '3,100', after: '4,050' },
      ],
      conclusion:
        'The migration closed without a single week of traffic decline during cutover, and the growth that followed confirms a well-planned technical migration can be an SEO opportunity, not just a risk to manage.',
      testimonialQuote:
        'Juan walked us through a migration that on any other project would have meant months of traffic recovery. Here, we came out ahead from week one.',
      testimonialAuthorRole: 'Head of Digital Marketing',
    },
  }

  const { docs: existing } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const baseData = (locale: (typeof LOCALES)[number]) => {
    const c = copy[locale]
    return {
      title: c.title,
      heroMetric: c.heroMetric,
      heroSubtitle: c.heroSubtitle,
      sector: c.sector,
      period: c.period,
      kpis: [
        { label: locale === 'es' ? 'Crecimiento de tráfico' : 'Traffic growth', value: '+68%' },
        { label: locale === 'es' ? 'Mejora de LCP móvil' : 'Mobile LCP improvement', value: '62%' },
        { label: locale === 'es' ? 'Semanas sin caída' : 'Weeks without a dip', value: '0' },
      ],
      clientContext: lexicalParagraph(c.clientContext),
      challenge: c.challenge.map((text) => ({ text })),
      solution: c.solution,
      results: {
        periodBefore: c.resultsPeriodBefore,
        periodAfter: c.resultsPeriodAfter,
        metrics: c.resultsMetrics,
      },
      conclusion: lexicalParagraph(c.conclusion),
      author: author?.id,
    }
  }

  let caseStudyId: number | string

  if (existing[0]) {
    caseStudyId = existing[0].id
    console.log(`Case study already exists (slug=${slug}, id=${caseStudyId}) — updating.`)
  } else {
    const created = await payload.create({
      collection: 'case-studies',
      locale: 'es',
      data: {
        ...baseData('es'),
        slug,
        _status: 'published',
      },
    })
    caseStudyId = created.id
    console.log(`Created case study (slug=${slug}, id=${caseStudyId})`)
  }

  let savedTestimonialBlockId: string | undefined

  for (const locale of LOCALES) {
    const c = copy[locale]
    const testimonialBlock: Record<string, unknown> = {
      blockType: 'testimonialSection',
      quote: c.testimonialQuote,
      authorName: 'Marcela Ibáñez',
      authorRole: c.testimonialAuthorRole,
    }

    if (savedTestimonialBlockId) testimonialBlock.id = savedTestimonialBlockId

    await payload.update({
      collection: 'case-studies',
      id: caseStudyId,
      locale,
      data: {
        ...baseData(locale),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        testimonialSection: [testimonialBlock] as any,
      },
    })

    if (!savedTestimonialBlockId) {
      const refetched = await payload.findByID({ collection: 'case-studies', id: caseStudyId, depth: 0 })
      const ts = (refetched.testimonialSection ?? []) as Array<Record<string, unknown>>
      savedTestimonialBlockId = ts[0]?.id as string | undefined
    }

    console.log(`Case study: updated locale=${locale} (with TestimonialSection)`)
  }
}

async function main() {
  const payload = await getPayload({ config })

  await seedAboutSection(payload)
  await seedCaseStudyWithTestimonial(payload)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
