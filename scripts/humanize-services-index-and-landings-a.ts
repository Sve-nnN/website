/**
 * Phase 30 Plan 03 (Task 1) — Humanize Services index + seo-technical-audit +
 * seo-consulting landing pages, both locales, via Payload Local API.
 *
 * These 3 `pages` docs already exist and are populated (Phase 19 seeded
 * them, Phase 24+ later appended serviceScopeCard/clientLogosBlock/
 * testimonialsCarousel/relatedCaseStudyBlock to the 2 landing pages' live
 * `content.layout`, so the layout on disk is now longer/richer than the
 * 4-block shape `seed-phase19-service-pages.ts` originally wrote).
 *
 * Two different update strategies are used here, both reusing the
 * reapplyIds discipline from seed-phase19-service-pages.ts:
 *
 * 1. `services` index: live layout is still exactly [hero, content,
 *    callToAction] (3 blocks, unchanged since Phase 19) — safe to rebuild
 *    with a fresh `buildIndexLayout` + `reapplyIds` + full-array `update`,
 *    same pattern as the analog.
 *
 * 2. `seo-technical-audit` / `seo-consulting`: live layout now has 10
 *    blocks (hero, content, serviceScopeCard, callToAction, content,
 *    clientLogosBlock, testimonialsCarousel, relatedCaseStudyBlock, faq,
 *    callToAction) — rebuilding from a hardcoded 4-block shape would DELETE
 *    the serviceScopeCard/clientLogosBlock/testimonialsCarousel/
 *    relatedCaseStudyBlock blocks (T-30-07 in practice, discovered live
 *    during this plan's execution, not assumed in PATTERNS.md). Instead,
 *    each locale's CURRENT layout is fetched fresh via `findByID({ locale
 *    })`, then patched in place block-by-block (only hero/content(both
 *    instances)/faq/callToAction get new copy; serviceScopeCard,
 *    clientLogosBlock, testimonialsCarousel, relatedCaseStudyBlock are
 *    copied through untouched). Because every patched block is built by
 *    spreading the LIVE block object (which already carries its own id),
 *    no id can ever be orphaned — reapplyIds is still run as a defense-in-
 *    depth no-op check before each write.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-services-index-and-landings-a.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { SERVICES_INDEX_SLUG, SERVICE_SLUGS } from '../src/lib/services-data'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

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

function lexicalWithHeading(heading: string, paragraphs: string[]) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h3' as const,
          version: 1,
          children: [{ type: 'text', version: 1, text: heading }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
        },
        ...paragraphs.map((text) => ({
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        })),
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

// Same h2-headed variant used by the "hook" content block added after
// Phase 19 (single full-width column, h2 instead of h3).
function lexicalWithH2Heading(heading: string, paragraphs: string[]) {
  const doc = lexicalWithHeading(heading, paragraphs)
  ;(doc.root.children[0] as { tag: string }).tag = 'h2'
  return doc
}

/**
 * Copied near-verbatim from scripts/seed-phase19-service-pages.ts. Only
 * used here for the `services` index (see file header) where the live
 * layout shape still matches the original 3-block assumption exactly.
 */
function reapplyIds(
  freshLayout: Record<string, unknown>[],
  referenceLayout: Record<string, unknown>[] | undefined,
): Record<string, unknown>[] {
  if (!referenceLayout) return freshLayout

  return freshLayout.map((block, i) => {
    const refBlock = referenceLayout[i] as Record<string, unknown> | undefined
    if (!refBlock || refBlock.blockType !== block.blockType) {
      if (refBlock) {
        console.warn(
          `reapplyIds: blockType mismatch at index ${i} (fresh=${block.blockType}, ref=${refBlock.blockType}) — skipping id reuse for this block`,
        )
      }
      return block
    }

    const withId: Record<string, unknown> = { ...block, id: refBlock.id }

    if (block.blockType === 'content' && Array.isArray(block.columns)) {
      const refColumns = (refBlock.columns as Record<string, unknown>[] | undefined) ?? []
      withId.columns = (block.columns as Record<string, unknown>[]).map((col, ci) =>
        refColumns[ci] ? { ...col, id: refColumns[ci].id } : col,
      )
    }

    if (block.blockType === 'faq' && Array.isArray(block.faqs)) {
      const refFaqs = (refBlock.faqs as Record<string, unknown>[] | undefined) ?? []
      withId.faqs = (block.faqs as Record<string, unknown>[]).map((f, fi) =>
        refFaqs[fi] ? { ...f, id: refFaqs[fi].id } : f,
      )
    }

    if (block.blockType === 'callToAction' && Array.isArray(block.links)) {
      const refLinks = (refBlock.links as Record<string, unknown>[] | undefined) ?? []
      withId.links = (block.links as Record<string, unknown>[]).map((l, li) =>
        refLinks[li] ? { ...l, id: refLinks[li].id } : l,
      )
    }

    return withId
  })
}

// ---------------------------------------------------------------------
// Copy — Services index
// ---------------------------------------------------------------------

const indexHero: Record<Locale, { title: string; subtitle: string }> = {
  es: {
    title: 'Servicios',
    subtitle:
      'Auditoría técnica, consultoría continua y desarrollo full-stack con SEO integrado desde el código, no parchado encima de un sitio que ya juega en contra.',
  },
  en: {
    title: 'Services',
    subtitle:
      'Technical audits, ongoing consulting, and full-stack development with SEO built into the code, not bolted onto a site that already fights against it.',
  },
}

const indexServices: Record<
  Locale,
  { slug: string; name: string; description: string }[]
> = {
  es: [
    {
      slug: 'seo-technical-audit',
      name: 'Auditoría SEO Técnica',
      description:
        'Diagnóstico técnico completo de crawl budget, renderizado, indexación y Core Web Vitals, con los hallazgos ordenados por impacto real, no por checklist.',
    },
    {
      slug: 'seo-consulting',
      name: 'Consultoría SEO',
      description:
        'Acompañamiento técnico continuo para equipos que necesitan una estrategia sostenida en el tiempo, no un informe que nadie termina de implementar.',
    },
    {
      slug: 'fullstack-development',
      name: 'Desarrollo Full-Stack con SEO integrado',
      description:
        'Sitios construidos en Next.js y CMS headless, con el SEO diseñado en la arquitectura desde el inicio, no agregado al final.',
    },
    {
      slug: 'ai-seo-geo',
      name: 'SEO para IA / GEO',
      description:
        'Estructuro tu contenido para que los motores de respuesta con IA (ChatGPT, Perplexity, Google AI Overviews) puedan citarte.',
    },
  ],
  en: [
    {
      slug: 'seo-technical-audit',
      name: 'Technical SEO Audit',
      description:
        'A full technical diagnostic of crawl budget, rendering, indexation, and Core Web Vitals, with findings ordered by real impact, not by checklist.',
    },
    {
      slug: 'seo-consulting',
      name: 'SEO Consulting',
      description:
        "Ongoing technical support for teams that need a strategy that holds up over time, not a one-off report nobody gets around to implementing.",
    },
    {
      slug: 'fullstack-development',
      name: 'Full-Stack Development with SEO Built In',
      description:
        'Sites built in Next.js and a headless CMS, with SEO designed into the architecture from the start, not tacked on at the end.',
    },
    {
      slug: 'ai-seo-geo',
      name: 'AI SEO / GEO',
      description:
        'I structure your content so AI answer engines (ChatGPT, Perplexity, Google AI Overviews) can cite it.',
    },
  ],
}

const indexCta: Record<Locale, { text: string; linkLabel: string }> = {
  es: {
    text: '¿No estás seguro de cuál servicio necesitas? Cuéntame qué problema tienes y te digo por dónde empezar.',
    linkLabel: 'Hablemos',
  },
  en: {
    text: "Not sure which service fits? Tell me what's broken and I'll tell you where to start.",
    linkLabel: "Let's talk",
  },
}

function buildIndexLayout(locale: Locale): Record<string, unknown>[] {
  return [
    {
      blockType: 'hero',
      variant: 'listing',
      title: indexHero[locale].title,
      subtitle: indexHero[locale].subtitle,
    },
    {
      blockType: 'content',
      columns: indexServices[locale].map((s) => ({
        size: 'half',
        richText: lexicalWithHeading(s.name, [s.description]),
        enableLink: true,
        link: {
          type: 'custom',
          // NOTE (known pre-existing issue, not introduced by this task —
          // see script footer comment / SUMMARY "Deviations"): `link.url`
          // on the shared Link field (src/fields/link.ts) is NOT a
          // localized field, only `link.label` is. Writing a locale-
          // branched url here per-locale still only persists the LAST
          // locale processed (`en`, since LOCALES=['es','en']) for BOTH
          // locales server-side. Preserved as-is (same logic the Phase 19
          // analog used) since fixing it requires a schema change to a
          // shared field used across Header/CTA links too — out of scope
          // for a content-only script per this plan and CLAUDE.md's
          // migration-safety rule.
          url: locale === 'es' ? `/servicios/${s.slug}` : `/en/services/${s.slug}`,
          label: locale === 'es' ? 'Ver más' : 'Learn more',
          appearance: 'default',
        },
      })),
    },
    {
      blockType: 'callToAction',
      richText: lexicalParagraph(indexCta[locale].text),
      links: [
        {
          link: {
            type: 'custom',
            url: '/contact',
            label: indexCta[locale].linkLabel,
            appearance: 'default',
          },
        },
      ],
    },
  ]
}

async function humanizeServicesIndex(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: SERVICES_INDEX_SLUG } },
    limit: 1,
  })

  if (docs.length === 0) {
    console.warn(`SKIP: slug=${SERVICES_INDEX_SLUG} not found — expected to already exist`)
    return
  }
  const docId = docs[0].id
  console.log(`Pages doc slug=${SERVICES_INDEX_SLUG} already exists (id=${docId}) — updating both locales (update-only path)`)

  const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
  const referenceLayout = refetched.content?.layout as Record<string, unknown>[] | undefined

  for (const locale of LOCALES) {
    const freshLayout = buildIndexLayout(locale)
    const layoutWithIds = reapplyIds(freshLayout, referenceLayout)

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: indexHero[locale].title,
        content: { layout: layoutWithIds as never },
      },
    })
  }
}

// ---------------------------------------------------------------------
// Copy — seo-technical-audit / seo-consulting (in-place block patching)
// ---------------------------------------------------------------------

interface HookCopy {
  heading: string
  paragraphs: string[]
}
interface SectionCopy {
  title: string
  paragraphs: string[]
}
interface FaqCopy {
  question: string
  answer: string
}
interface LandingCopy {
  heroTitle: string
  heroSubtitle: string
  hook: HookCopy
  includes: SectionCopy
  process: SectionCopy
  faqs: FaqCopy[]
  ctaText: string
  ctaLinkLabel: string
}

const auditCopy: Record<Locale, LandingCopy> = {
  es: {
    heroTitle: 'Auditoría SEO Técnica',
    heroSubtitle:
      'Si tu sitio pierde crawl budget en URLs que no importan, renderiza contenido que Google nunca llega a ver a tiempo, o tiene huecos de indexación que nadie detectó, ninguna estrategia de contenido compensa eso.',
    hook: {
      heading: 'Tu sitio pierde tráfico y nadie te dice por qué',
      paragraphs: [
        'Los buscadores no perdonan los errores técnicos silenciosos: crawl budget desperdiciado en URLs que no importan, JavaScript que tarda en renderizar, contenido que nunca llega a aparecer en el índice. Nada de esto se nota navegando el sitio a simple vista.',
        'Para cuando la caída de tráfico aparece en Search Console, el problema ya lleva semanas instalado. Sin un diagnóstico técnico real, es casi imposible saber si la causa es de rastreo, de renderizado, de indexación o algo distinto por completo.',
      ],
    },
    includes: {
      title: 'Qué incluye',
      paragraphs: [
        'Análisis de crawl budget y arquitectura de la información: qué rastrea Google hoy, qué debería rastrear, y en qué páginas de bajo valor se está desperdiciando ese presupuesto.',
        'Diagnóstico de renderizado: la diferencia entre lo que sirve el servidor y lo que Google indexa realmente, con foco en JavaScript crítico y contenido que carga tarde.',
        'Core Web Vitals medidos en condiciones reales, no solo en laboratorio, con la causa raíz identificada en el código y no solo el síntoma que reporta PageSpeed.',
        'Revisión de indexación: canonicalización, robots.txt, sitemaps y páginas huérfanas que nunca reciben enlaces internos.',
        'Auditoría de datos estructurados (schema.org) contra lo que Google realmente usa para mostrar rich results.',
      ],
    },
    process: {
      title: 'Cómo trabajo',
      paragraphs: [
        'La auditoría no termina en un PDF que nadie lee. Entrego hallazgos priorizados por impacto real y esfuerzo de implementación, no una lista de doscientos ítems sin ningún orden.',
        'Como también soy desarrollador, puedo implementar las correcciones directamente en tu código en vez de solo señalarlas. Cubro el diagnóstico y la solución, cuando el proyecto lo requiere.',
      ],
    },
    faqs: [
      {
        question: '¿Cuánto dura una auditoría técnica?',
        answer:
          'Depende del tamaño del sitio. Uno de tamaño medio, hasta unas 500 URLs indexables, suele tomar entre una y dos semanas, desde el acceso a las herramientas hasta la entrega del informe priorizado.',
      },
      {
        question: '¿Entregan solo el informe o también implementan las correcciones?',
        answer:
          'Las dos opciones existen. Por defecto entrego un informe priorizado y accionable para que tu equipo lo implemente. Si prefieres que yo mismo implemente las correcciones en el código, lo conversamos como una extensión del alcance: no hace falta contratar a otra persona para la parte técnica.',
      },
      {
        question: '¿Qué herramientas usas?',
        answer:
          'Combino crawlers técnicos, Google Search Console y Analytics, Lighthouse y CrUX para medir Core Web Vitals en campo, y revisión manual de código para los casos que las herramientas automáticas no detectan, sobre todo problemas de renderizado en frameworks de JavaScript.',
      },
      {
        question: '¿La auditoría sirve si mi sitio no está construido por mí?',
        answer:
          'Sí. La mayoría de las auditorías que hago son sobre sitios que no construí yo. El diagnóstico es agnóstico de stack; la implementación de las correcciones depende de qué tan accesible sea tu codebase.',
      },
    ],
    ctaText: 'Si sospechas que tienes un problema técnico y no sabes exactamente cuál, empecemos por ahí.',
    ctaLinkLabel: 'Pedir una auditoría',
  },
  en: {
    heroTitle: 'Technical SEO Audit',
    heroSubtitle:
      "If your site burns crawl budget on URLs that don't matter, renders content Google never sees in time, or has indexation gaps nobody caught, no content strategy makes up for that.",
    hook: {
      heading: "Losing traffic and nobody's telling you why",
      paragraphs: [
        "Search engines don't forgive silent technical issues: wasted crawl budget on URLs that don't matter, JavaScript that takes too long to render, content that never quite makes it into the index. None of it shows up just from browsing the site.",
        "By the time the traffic drop shows up in Search Console, the problem has usually been sitting there for weeks. Without a real technical diagnostic, there's almost no way to tell if the cause is crawling, rendering, indexation, or something else altogether.",
      ],
    },
    includes: {
      title: "What's included",
      paragraphs: [
        'Crawl budget and information architecture analysis: what Google is actually crawling today, what it should be crawling, and which low-value pages are eating that budget.',
        'Rendering diagnostics: the gap between what the server serves and what Google actually indexes, with a focus on render-blocking JavaScript and late-loading content.',
        'Core Web Vitals measured under real conditions, not just in the lab, with root causes traced back to the code instead of just the symptom PageSpeed reports.',
        'Indexation review: canonicalization, robots.txt, sitemaps, and orphaned pages that never get internal links.',
        'Structured data (schema.org) audited against what Google actually uses to show rich results.',
      ],
    },
    process: {
      title: 'How I work',
      paragraphs: [
        "The audit doesn't end at a PDF nobody reads. I deliver findings prioritized by real impact and implementation effort, not a 200-item list with no order.",
        "Since I'm also a developer, I can implement the fixes directly in your codebase instead of just pointing at them. I cover both the diagnosis and the fix, when the project calls for it.",
      ],
    },
    faqs: [
      {
        question: 'How long does a technical audit take?',
        answer:
          'It depends on the size of the site. A mid-sized one, up to around 500 indexable URLs, usually takes one to two weeks, from tool access to the prioritized report.',
      },
      {
        question: 'Do you just hand off a report, or do you also implement the fixes?',
        answer:
          "Both options exist. By default I deliver a prioritized, actionable report for your team to implement. If you'd rather I implement the fixes in the code myself, we scope that as an extension: no need to bring in a separate developer for the technical part.",
      },
      {
        question: 'What tools do you use?',
        answer:
          'A mix of technical crawlers, Google Search Console and Analytics, Lighthouse and CrUX for field Core Web Vitals, and manual code review for the cases automated tools miss, mostly rendering issues in JS frameworks.',
      },
      {
        question: "Does the audit work if I didn't build my own site?",
        answer:
          "Yes. Most audits I run are on sites I didn't build. The diagnosis is stack-agnostic; implementing the fixes depends on how accessible your codebase is.",
      },
    ],
    ctaText: "If you suspect there's a technical problem and can't pinpoint it, let's start there.",
    ctaLinkLabel: 'Request an audit',
  },
}

const consultingCopy: Record<Locale, LandingCopy> = {
  es: {
    heroTitle: 'Consultoría SEO',
    heroSubtitle:
      'Una auditoría puntual detecta el problema de hoy. Un sitio que crece necesita a alguien monitoreando, priorizando y ajustando la estrategia técnica de forma continua, no una foto tomada una vez al año.',
    hook: {
      heading: 'El informe envejece, el sitio no deja de cambiar',
      paragraphs: [
        'Un informe de auditoría queda desactualizado rápido. Un sitio que cambia cada semana, con lanzamientos, migraciones y ajustes de contenido, necesita a alguien monitoreando el impacto SEO de cada cambio, no una revisión que se hace una vez al año.',
        'La mayoría de los consultores de SEO solo hablan el idioma del contenido. Cuando el problema vive en el código, como una migración mal hecha o un deploy que rompió el renderizado, esas recomendaciones tienen que traducirse a otra persona, y ahí es donde se pierden semanas enteras.',
      ],
    },
    includes: {
      title: 'Qué incluye',
      paragraphs: [
        'Estrategia técnica continua: un roadmap priorizado que se ajusta según lo que muestran los datos, no un plan fijo escrito una sola vez.',
        'Monitoreo de Search Console, rankings y Core Web Vitals en el tiempo, para detectar regresiones antes de que se conviertan en caídas de tráfico.',
        'Colaboración directa con tu equipo de desarrollo y de marketing. Hablo el idioma técnico de ambos, algo poco común en consultores que solo conocen el lado de contenido.',
        'Revisión de cada release o deploy con impacto potencial en SEO (cambios de arquitectura, migraciones, rediseños) antes de que salga a producción, no después.',
      ],
    },
    process: {
      title: 'Cómo trabajo',
      paragraphs: [
        'La cadencia se define según el tamaño y la velocidad de cambio del sitio: desde revisiones mensuales hasta acompañamiento semanal en proyectos con lanzamientos frecuentes.',
        'Cada ciclo entrega hallazgos priorizados y un reporte claro de qué cambió, qué se implementó y qué impacto tuvo. Nada de dashboards que nadie interpreta.',
        'Como también desarrollo (Next.js, CMS headless), puedo revisar pull requests o implementar directamente los cambios técnicos, no solo recomendarlos.',
      ],
    },
    faqs: [
      {
        question: '¿Cómo se estructura un contrato de consultoría continua?',
        answer:
          'Se define una cadencia (mensual, quincenal o semanal, según la necesidad) con un alcance claro de qué se revisa en cada ciclo. No es un contrato abierto sin objetivos: cada ciclo tiene entregables concretos y el alcance se puede ajustar con el tiempo.',
      },
      {
        question: '¿En qué se diferencia de la auditoría técnica?',
        answer:
          'La auditoría es un diagnóstico puntual, enfocado en un momento específico. La consultoría es continua: monitoreo, ajuste de prioridades y revisión de cambios en el tiempo, para sitios que evolucionan constantemente y no pueden depender de una sola foto.',
      },
      {
        question: '¿Trabajas directamente con mi equipo de desarrollo?',
        answer:
          'Sí, y es donde más valor aporto frente a un consultor tradicional. Al ser también desarrollador full-stack, puedo revisar código, participar en decisiones de arquitectura o implementar cambios yo mismo, en vez de limitarme a entregar recomendaciones que el equipo de desarrollo tiene que traducir.',
      },
      {
        question: '¿Cuál es el compromiso mínimo?',
        answer:
          'Depende del proyecto. Lo conversamos según el estado actual del sitio y la velocidad de cambio esperada. No hay un paquete fijo: la cotización se arma a medida, después de entender el contexto.',
      },
    ],
    ctaText:
      'Si tu sitio cambia constantemente y necesitas que alguien vigile el SEO técnico de forma continua, hablemos de cómo estructurar el acompañamiento.',
    ctaLinkLabel: 'Conversar sobre consultoría',
  },
  en: {
    heroTitle: 'SEO Consulting',
    heroSubtitle:
      "A one-off audit catches today's problem. A growing site needs someone monitoring, prioritizing, and adjusting the technical strategy continuously, not a snapshot taken once a year.",
    hook: {
      heading: 'The report goes stale, the site never stops changing',
      paragraphs: [
        "An audit report goes out of date fast. A site that changes every week, with releases, migrations, and content updates, needs someone tracking the SEO impact of each change, not a review that happens once a year.",
        "Most SEO consultants only speak the content side of the language. When the problem lives in the code, like a botched migration or a deploy that broke rendering, those recommendations need translating to someone else, and that's where whole weeks get lost.",
      ],
    },
    includes: {
      title: "What's included",
      paragraphs: [
        "Ongoing technical strategy: a prioritized roadmap that adjusts based on what the data shows, not a fixed plan written once.",
        'Search Console, rankings, and Core Web Vitals monitoring over time, to catch regressions before they turn into traffic drops.',
        'Direct collaboration with your dev and marketing teams. I speak both technical languages, which is uncommon among consultants who only know the content side.',
        'Review of every release or deploy with potential SEO impact (architecture changes, migrations, redesigns) before it ships, not after.',
      ],
    },
    process: {
      title: 'How I work',
      paragraphs: [
        "Cadence is set based on the site's size and rate of change: from monthly reviews to weekly involvement on projects with frequent releases.",
        "Every cycle delivers prioritized findings and a clear report of what changed, what got implemented, and what impact it had. No dashboards nobody interprets.",
        'Since I also build (Next.js, headless CMS), I can review pull requests or implement the technical changes directly, not just recommend them.',
      ],
    },
    faqs: [
      {
        question: 'How is an ongoing consulting engagement structured?',
        answer:
          "We set a cadence (monthly, biweekly, or weekly depending on need) with a clear scope for what gets reviewed each cycle. It's not an open-ended contract with no goals: every cycle has concrete deliverables, and scope can adjust over time.",
      },
      {
        question: 'How is this different from the technical audit?',
        answer:
          "The audit is a point-in-time diagnostic focused on a specific moment. Consulting is continuous: monitoring, re-prioritizing, and reviewing changes over time, for sites that keep evolving and can't rely on a single snapshot.",
      },
      {
        question: 'Do you work directly with my dev team?',
        answer:
          "Yes, and that's where I add the most value versus a traditional consultant. Since I'm also a full-stack developer, I can review code, take part in architecture decisions, or implement changes myself, instead of just handing off recommendations the dev team has to translate.",
      },
      {
        question: "What's the minimum commitment?",
        answer:
          "It depends on the project. We figure it out based on the site's current state and expected rate of change. There's no fixed package: the quote is scoped after understanding the context.",
      },
    ],
    ctaText:
      "If your site changes constantly and you need someone watching technical SEO on an ongoing basis, let's talk about how to structure it.",
    ctaLinkLabel: 'Talk about consulting',
  },
}

const FAQ_TITLE: Record<Locale, string> = {
  es: 'Preguntas frecuentes',
  en: 'Frequently asked questions',
}

/**
 * Patches a single service-landing block in place, preserving every field
 * (and id) that isn't part of this plan's editorial scope. Blocks outside
 * scope (serviceScopeCard, clientLogosBlock, testimonialsCarousel,
 * relatedCaseStudyBlock) are returned completely unchanged.
 */
function patchLandingBlock(
  block: Record<string, unknown>,
  copy: LandingCopy,
  locale: Locale,
  contentBlockCounter: { seen: number },
): Record<string, unknown> {
  const blockType = block.blockType

  if (blockType === 'hero') {
    return { ...block, title: copy.heroTitle, subtitle: copy.heroSubtitle }
  }

  if (blockType === 'content') {
    contentBlockCounter.seen += 1
    const columns = (block.columns as Record<string, unknown>[]) ?? []

    if (contentBlockCounter.seen === 1) {
      // Hook section — single full-width column, h2 heading.
      return {
        ...block,
        columns: [
          {
            ...columns[0],
            richText: lexicalWithH2Heading(copy.hook.heading, copy.hook.paragraphs),
          },
        ],
      }
    }

    if (contentBlockCounter.seen === 2) {
      // "Qué incluye" / "Cómo trabajo" — first two columns only; any
      // additional columns (proofLinks, ai-seo-geo only, not used by
      // audit/consulting) are preserved untouched.
      return {
        ...block,
        columns: [
          { ...columns[0], richText: lexicalWithHeading(copy.includes.title, copy.includes.paragraphs) },
          { ...columns[1], richText: lexicalWithHeading(copy.process.title, copy.process.paragraphs) },
          ...columns.slice(2),
        ],
      }
    }

    return block
  }

  if (blockType === 'faq') {
    const faqBlocks = (block.faqs as Record<string, unknown>[]) ?? []
    return {
      ...block,
      title: FAQ_TITLE[locale],
      faqs: faqBlocks.map((f, i) => ({
        ...f,
        question: copy.faqs[i]?.question ?? f.question,
        answer: copy.faqs[i] ? lexicalParagraph(copy.faqs[i].answer) : f.answer,
      })),
    }
  }

  if (blockType === 'callToAction') {
    const links = (block.links as Record<string, unknown>[]) ?? []
    return {
      ...block,
      richText: lexicalParagraph(copy.ctaText),
      links: links.map((l) => ({
        ...l,
        link: { ...(l.link as Record<string, unknown>), label: copy.ctaLinkLabel },
      })),
    }
  }

  // serviceScopeCard, clientLogosBlock, testimonialsCarousel,
  // relatedCaseStudyBlock — untouched, out of this plan's editorial scope.
  return block
}

async function humanizeLandingPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  copyByLocale: Record<Locale, LandingCopy>,
) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  if (docs.length === 0) {
    console.warn(`SKIP: slug=${slug} not found — expected to already exist`)
    return
  }
  const docId = docs[0].id
  console.log(`Pages doc slug=${slug} already exists (id=${docId}) — updating both locales (update-only path)`)

  let referenceLayout: Record<string, unknown>[] | undefined

  for (const locale of LOCALES) {
    const doc = await payload.findByID({ collection: 'pages', id: docId, locale, depth: 0 })
    const liveLayout = (doc.content?.layout ?? []) as Record<string, unknown>[]

    const counter = { seen: 0 }
    const patched = liveLayout.map((block) =>
      patchLandingBlock(block, copyByLocale[locale], locale, counter),
    )

    if (!referenceLayout) referenceLayout = patched
    // Defense-in-depth: ids are already correct (every patched block was
    // spread from the live block object), this is a no-op safety net, same
    // discipline as the reapplyIds pattern used above for the index page.
    const withIds = reapplyIds(patched, referenceLayout)

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: copyByLocale[locale].heroTitle,
        content: { layout: withIds as never },
      },
    })
  }
}

async function main() {
  const payload = await getPayload({ config })

  await humanizeServicesIndex(payload)
  await humanizeLandingPage(payload, SERVICE_SLUGS[0], auditCopy) // seo-technical-audit
  await humanizeLandingPage(payload, SERVICE_SLUGS[1], consultingCopy) // seo-consulting

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
