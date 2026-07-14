/**
 * Phase 30 Plan 03 (Task 2) — Humanize fullstack-development + ai-seo-geo
 * landing pages, both locales, via Payload Local API.
 *
 * Same in-place block-patching strategy as
 * scripts/humanize-services-index-and-landings-a.ts (see that file's header
 * comment for the full rationale): live `content.layout` for both pages now
 * has 10 blocks (hero, content, serviceScopeCard, callToAction, content,
 * clientLogosBlock, testimonialsCarousel, relatedCaseStudyBlock, faq,
 * callToAction), not the original 4-block shape assumed in PATTERNS.md — a
 * full-array rebuild would delete the 4 blocks added after Phase 19.
 * Instead, each locale's live layout is fetched fresh and patched block by
 * block; only hero/content(both)/faq/callToAction are rewritten, everything
 * else (including `ai-seo-geo`'s extra proofLinks columns) passes through
 * untouched, ids intact because every patched block is spread from the live
 * block object itself.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-services-landings-b.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'
import { SERVICE_SLUGS } from '../src/lib/services-data'

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

function lexicalWithH2Heading(heading: string, paragraphs: string[]) {
  const doc = lexicalWithHeading(heading, paragraphs)
  ;(doc.root.children[0] as { tag: string }).tag = 'h2'
  return doc
}

/** Copied near-verbatim from scripts/seed-phase19-service-pages.ts. */
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
interface ProofLinkCopy {
  description: string
}
interface LandingCopy {
  heroTitle: string
  heroSubtitle: string
  hook: HookCopy
  includes: SectionCopy
  process: SectionCopy
  proofLinks?: ProofLinkCopy[]
  faqs: FaqCopy[]
  ctaText: string
  ctaLinkLabel: string
}

const fullstackCopy: Record<Locale, LandingCopy> = {
  es: {
    heroTitle: 'Desarrollo Full-Stack con SEO integrado',
    heroSubtitle:
      'Un sitio armado sobre WordPress genérico y parchado con plugins de SEO llega con el techo puesto: JavaScript que bloquea el renderizado, Core Web Vitals que nunca terminan de arreglarse del todo, y datos estructurados agregados a último momento. El SEO no se parchea, se diseña.',
    hook: {
      heading: 'El SEO que se agrega al final siempre deja un techo',
      paragraphs: [
        'Un sitio armado sobre un builder genérico y parchado con plugins de SEO llega con límites ya incorporados: JavaScript que bloquea el renderizado, imágenes sin optimizar, datos estructurados agregados a último momento sin entender el contenido real del sitio.',
        'Esos límites no se arreglan instalando otro plugin. Se arreglan diseñando la arquitectura, el modelo de contenido y el renderizado desde el principio, con el SEO adentro de esa decisión y no como una capa que se agrega encima después.',
      ],
    },
    includes: {
      title: 'Qué incluye',
      paragraphs: [
        'Desarrollo en Next.js con renderizado en servidor y streaming, para que Google (y cualquier crawler) reciba contenido completo desde la primera respuesta, sin depender de que el JavaScript del cliente termine de ejecutarse.',
        'CMS headless (Payload) con el SEO modelado en el schema desde el día uno: metadatos, datos estructurados y campos editoriales viven en la misma capa que el contenido, no como un plugin aparte que puede romperse en cualquier actualización.',
        'Core Web Vitals como parte de la arquitectura, no una optimización posterior: presupuesto de JavaScript, estrategia de imágenes y carga diferida, decididos antes de escribir la primera línea de código de una página.',
        'Datos estructurados (schema.org) diseñados junto con el modelo de datos, no retrofiteados con un plugin genérico que no entiende el contenido real del sitio.',
        'Sin builders ni page builders de terceros que generan HTML inflado. Código propio, auditable, sin dependencias que se abandonan.',
      ],
    },
    process: {
      title: 'Cómo trabajo',
      paragraphs: [
        'El SEO entra en la conversación desde el diseño de la arquitectura y el modelo de datos, no en una revisión final antes del lanzamiento.',
        'Cada decisión técnica, de rutas, de renderizado, de estructura del CMS, se evalúa también por su impacto en crawleabilidad e indexación, además de por rendimiento y mantenibilidad.',
        'Este mismo sitio, el que estás viendo ahora, es la prueba: construido en Next.js y Payload, con SEO técnico integrado desde el primer commit, no agregado después.',
      ],
    },
    faqs: [
      {
        question: '¿Por qué Next.js/Payload en vez de WordPress?',
        answer:
          'Por control real sobre el renderizado: en Next.js decido exactamente qué se sirve al crawler y cuándo, sin depender de un plugin de caché o un tema de terceros. Payload permite modelar campos de SEO y datos estructurados directamente en el schema del contenido, en vez de vivir como configuración externa en un plugin que se puede desactivar o romper en cualquier actualización. El resultado es menos bloat, menos dependencias frágiles y control total sobre cada aspecto técnico que afecta el posicionamiento.',
      },
      {
        question: '¿Esto significa que hay que migrar todo el sitio existente?',
        answer:
          'No necesariamente. Puedo evaluar tu stack actual y proponer una migración completa si el sitio está genuinamente limitado por su plataforma, o trabajar sobre mejoras puntuales si el problema es más acotado. La auditoría técnica es un buen primer paso para saber cuál aplica.',
      },
      {
        question: '¿Qué tan rápido queda un sitio construido así?',
        answer:
          'El objetivo son Core Web Vitals en el rango "bueno" desde el lanzamiento, no como meta a perseguir después. Al decidir la estrategia de renderizado y el presupuesto de JavaScript desde el diseño, se evita la deuda técnica de performance que normalmente aparece meses después de un lanzamiento.',
      },
      {
        question: '¿Puedo ver ejemplos de proyectos reales construidos así?',
        answer:
          'Sí. Los casos de éxito en este mismo sitio muestran proyectos reales, no mockups. Y el propio sitio que estás navegando es un ejemplo vivo de esta arquitectura en producción.',
      },
    ],
    ctaText:
      'Si tu próximo sitio necesita rendimiento y SEO desde el primer día, no como una promesa para "después del lanzamiento", hablemos.',
    ctaLinkLabel: 'Contarme tu proyecto',
  },
  en: {
    heroTitle: 'Full-Stack Development with SEO Built In',
    heroSubtitle:
      "A site built on generic WordPress and patched with SEO plugins ships with a ceiling already in place: render-blocking JavaScript, Core Web Vitals that never quite get fixed, and structured data bolted on at the last minute. SEO isn't a patch, it's a design decision.",
    hook: {
      heading: 'SEO bolted on at the end always leaves a ceiling',
      paragraphs: [
        "A site built on a generic builder and patched with SEO plugins ships with limits already baked in: render-blocking JavaScript, unoptimized images, structured data added at the last minute without understanding the site's actual content.",
        "Those limits don't get fixed by installing another plugin. They get fixed by designing the architecture, the content model, and the rendering strategy from the start, with SEO inside that decision instead of stacked on top afterward.",
      ],
    },
    includes: {
      title: "What's included",
      paragraphs: [
        'Next.js development with server rendering and streaming, so Google (and any crawler) gets full content on the first response, without depending on client-side JavaScript finishing execution.',
        'Headless CMS (Payload) with SEO modeled into the schema from day one: metadata, structured data, and editorial fields live in the same layer as the content, not as a separate plugin that can break on any update.',
        "Core Web Vitals as part of the architecture, not a later optimization: JavaScript budget, image strategy, and lazy loading decided before the first line of a page's code is written.",
        'Structured data (schema.org) designed alongside the data model, not retrofitted with a generic plugin that has no understanding of the actual content.',
        'No third-party page builders generating bloated HTML. Proprietary, auditable code, with no abandoned dependencies.',
      ],
    },
    process: {
      title: 'How I work',
      paragraphs: [
        'SEO enters the conversation at the architecture and data-model design stage, not as a final review before launch.',
        'Every technical decision, routing, rendering strategy, CMS structure, is evaluated for its crawlability and indexation impact, alongside performance and maintainability.',
        "This site, the one you're on right now, is the proof: built in Next.js and Payload, with technical SEO integrated from the first commit, not added later.",
      ],
    },
    faqs: [
      {
        question: 'Why Next.js/Payload instead of WordPress?',
        answer:
          "For real control over rendering: in Next.js I decide exactly what gets served to the crawler and when, without a caching plugin or third-party theme getting in the way. Payload lets me model SEO fields and structured data directly in the content schema, instead of living as external plugin config that can get disabled or break on any update. The result is less bloat, fewer fragile dependencies, and full control over every technical factor that affects rankings.",
      },
      {
        question: 'Does this mean migrating the entire existing site?',
        answer:
          "Not necessarily. I can evaluate your current stack and propose a full migration if the site is genuinely limited by its platform, or work on targeted improvements if the problem is narrower. A technical audit is a good first step to figure out which one applies.",
      },
      {
        question: 'How fast does a site built this way end up?',
        answer:
          "The goal is Core Web Vitals in the 'good' range from launch, not as a target to chase afterward. Deciding the rendering strategy and JavaScript budget at the design stage avoids the performance debt that usually shows up months after launch.",
      },
      {
        question: 'Can I see real projects built this way?',
        answer:
          "Yes. The case studies on this site show real projects, not mockups. And the very site you're browsing is a live example of this architecture in production.",
      },
    ],
    ctaText:
      "If your next site needs performance and SEO from day one, not as a promise for after launch, let's talk.",
    ctaLinkLabel: 'Tell me about your project',
  },
}

const geoCopy: Record<Locale, LandingCopy> = {
  es: {
    heroTitle: 'SEO para IA / GEO',
    heroSubtitle:
      'Cada vez más búsquedas terminan en una respuesta generada por IA (ChatGPT, Perplexity, Google AI Overviews) sin que el usuario haga clic en ningún resultado. Si tu contenido no está estructurado para que esos sistemas lo puedan leer y citar, la respuesta cita a tu competencia.',
    hook: {
      heading: 'Si tu contenido no es citable, la respuesta cita a otro',
      paragraphs: [
        'Cada vez más búsquedas terminan en una respuesta generada por IA sin que nadie haga clic en ningún resultado. Si tu contenido está disperso por la página, sin pasajes claros y autocontenidos, un sistema de IA no lo puede extraer ni citar.',
        'Escribir más contenido no resuelve esto. Lo que hace falta es reorganizar lo que ya existe, para que quede legible tanto para los buscadores tradicionales como para los motores de respuesta que están cambiando la forma en que la gente busca.',
      ],
    },
    includes: {
      title: 'Qué incluye',
      paragraphs: [
        'Estructuración de contenido para que los motores de respuesta con IA puedan extraer y citar pasajes concretos, no solo indexar la página completa.',
        'Implementación y mantenimiento de un manifiesto de contenido legible por máquinas (`llms.txt`/`llms-full.txt`): un archivo que describe explícitamente qué contiene el sitio, en un formato que los agentes de IA pueden consumir directamente.',
        'Datos estructurados y marcado semántico que refuerzan la comprensión del contenido, tanto para buscadores tradicionales como para sistemas de IA generativa.',
        'Este mismo sitio ya implementa esta infraestructura: mira /llms.txt y /llms-full.txt para ver un ejemplo real y funcionando, no una promesa.',
      ],
    },
    process: {
      title: 'Cómo trabajo',
      paragraphs: [
        'Empiezo auditando qué tan citable es tu contenido hoy: si está estructurado en pasajes claros y autocontenidos, o si depende de contexto disperso por toda la página que un sistema de IA no puede reconstruir.',
        'Implemento y mantengo el manifiesto `llms.txt`/`llms-full.txt`, ajustándolo a medida que el sitio suma contenido nuevo. No es un archivo que se genera una vez y se olvida.',
        'Reviso el marcado semántico y los datos estructurados existentes, ajustándolos para que el contenido tenga más probabilidad de ser citado, no solo indexado.',
      ],
    },
    proofLinks: [
      {
        description:
          'Así es como estructuro el manifiesto de contenido de este sitio, para que los agentes de IA lo puedan leer directamente. Un ejemplo real, no una maqueta.',
      },
      {
        description:
          'La versión extendida del manifiesto, con el detalle completo del contenido del sitio en formato legible por máquina.',
      },
    ],
    faqs: [
      {
        question: '¿Qué es GEO y en qué se diferencia del SEO tradicional?',
        answer:
          'GEO (Generative Engine Optimization) es optimizar contenido para que los motores de respuesta con IA lo citen directamente en sus respuestas, en vez de solo posicionarlo en una lista de resultados. Comparte fundamentos con el SEO tradicional (estructura, semántica, autoridad) pero agrega una capa nueva: hacer el contenido legible y citable por sistemas que generan texto, no solo por crawlers que indexan páginas.',
      },
      {
        question: '¿Cómo se mide el éxito de una estrategia GEO?',
        answer:
          'Es un campo más nuevo que el SEO tradicional, así que las métricas todavía están madurando. Hoy se puede rastrear si tu marca aparece citada en respuestas de ChatGPT, Perplexity o AI Overviews para consultas relevantes, y monitorear el tráfico referido desde esas plataformas cuando lo reportan. No hay un "ranking" único todavía como en Google, pero sí señales verificables de citación.',
      },
      {
        question: '¿Qué es exactamente el archivo llms.txt?',
        answer:
          'Es un manifiesto de texto plano, pensado para que los agentes de IA entiendan rápido de qué trata tu sitio y dónde encontrar el contenido relevante, sin tener que rastrear todo el HTML. Es un estándar emergente, similar en espíritu a robots.txt pero orientado a IA en vez de a crawlers tradicionales. Este sitio ya lo implementa: puedes verlo en /llms.txt.',
      },
      {
        question: '¿Esto reemplaza al SEO tradicional?',
        answer:
          'No, lo complementa. El SEO tradicional sigue siendo necesario para aparecer en resultados de búsqueda convencionales. GEO es una capa adicional para el canal de búsqueda que crece más rápido: las respuestas generadas por IA.',
      },
    ],
    ctaText:
      'Si quieres que tu contenido empiece a aparecer citado en respuestas de IA en vez de solo en resultados de búsqueda, hablemos de cómo estructurarlo.',
    ctaLinkLabel: 'Hablar sobre GEO',
  },
  en: {
    heroTitle: 'AI SEO / GEO',
    heroSubtitle:
      "More and more searches end in an AI-generated answer (ChatGPT, Perplexity, Google AI Overviews) with no click on any result at all. If your content isn't structured for those systems to read and cite, the answer cites your competitor instead.",
    hook: {
      heading: 'If your content isn\'t citable, someone else gets the mention',
      paragraphs: [
        "More and more searches end in an AI-generated answer with no click on any result at all. If your content is scattered across the page, without clear, self-contained passages, an AI system can't pull it out or cite it.",
        "More content isn't the fix. The fix is restructuring what already exists so it's readable by both traditional search engines and the answer engines that are changing how people search.",
      ],
    },
    includes: {
      title: "What's included",
      paragraphs: [
        'Structuring content so AI answer engines can extract and cite specific passages, not just index the page as a whole.',
        'Implementation and maintenance of a machine-readable content manifest (`llms.txt`/`llms-full.txt`): a file that explicitly describes what the site contains, in a format AI agents can consume directly.',
        'Structured data and semantic markup that reinforce content understanding for both traditional search engines and generative AI systems.',
        'This very site already implements this infrastructure: check /llms.txt and /llms-full.txt for a real, working example, not a promise.',
      ],
    },
    process: {
      title: 'How I work',
      paragraphs: [
        "I start by auditing how citable your content is today: whether it's structured into clear, self-contained passages, or depends on context scattered across the page that an AI system can't reconstruct.",
        "I implement and maintain the `llms.txt`/`llms-full.txt` manifest, updating it as the site adds new content. It's not a file generated once and forgotten.",
        'I review existing semantic markup and structured data, tuning it to give content a better shot at getting cited, not just indexed.',
      ],
    },
    proofLinks: [
      {
        description:
          "This is exactly how I structure this site's content manifest so AI agents can read it directly. A real example, not a mockup.",
      },
      {
        description:
          "The extended version of the manifest, with the full detail of the site's content in a machine-readable format.",
      },
    ],
    faqs: [
      {
        question: 'What is GEO and how is it different from traditional SEO?',
        answer:
          "GEO (Generative Engine Optimization) is optimizing content so AI answer engines cite it directly in their responses, instead of just ranking it in a results list. It shares fundamentals with traditional SEO (structure, semantics, authority) but adds a new layer: making content readable and citable by systems that generate text, not just crawlers that index pages.",
      },
      {
        question: 'How do you measure the success of a GEO strategy?',
        answer:
          "It's a newer field than traditional SEO, so metrics are still maturing. Today you can track whether your brand gets cited in ChatGPT, Perplexity, or AI Overviews responses for relevant queries, and monitor referral traffic from those platforms when they report it. There's no single 'ranking' yet like in Google, but there are verifiable citation signals.",
      },
      {
        question: 'What exactly is the llms.txt file?',
        answer:
          "It's a plain-text manifest meant to help AI agents quickly understand what your site is about and where to find relevant content, without having to crawl all the HTML. It's an emerging standard, similar in spirit to robots.txt, but aimed at AI instead of traditional crawlers. This site already implements it: you can see it at /llms.txt.",
      },
      {
        question: 'Does this replace traditional SEO?',
        answer:
          "No, it complements it. Traditional SEO is still necessary to show up in conventional search results. GEO is an additional layer for the fastest-growing search channel: AI-generated answers.",
      },
    ],
    ctaText:
      "If you want your content to start showing up cited in AI answers instead of just search results, let's talk about how to structure it.",
    ctaLinkLabel: 'Talk about GEO',
  },
}

const FAQ_TITLE: Record<Locale, string> = {
  es: 'Preguntas frecuentes',
  en: 'Frequently asked questions',
}

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
      const proofLinkColumns = columns.slice(2).map((col, i) => {
        const desc = copy.proofLinks?.[i]?.description
        return desc ? { ...col, richText: lexicalParagraph(desc) } : col
      })
      return {
        ...block,
        columns: [
          { ...columns[0], richText: lexicalWithHeading(copy.includes.title, copy.includes.paragraphs) },
          { ...columns[1], richText: lexicalWithHeading(copy.process.title, copy.process.paragraphs) },
          ...proofLinkColumns,
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

  await humanizeLandingPage(payload, SERVICE_SLUGS[2], fullstackCopy) // fullstack-development
  await humanizeLandingPage(payload, SERVICE_SLUGS[3], geoCopy) // ai-seo-geo

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
