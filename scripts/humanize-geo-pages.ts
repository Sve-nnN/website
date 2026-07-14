/**
 * Phase 30 Plan 03 (Task 3) — Humanize seo-tecnico-madrid + seo-tecnico-lima
 * geo-pages, both locales, via Payload Local API.
 *
 * Live layout for both geo-pages (confirmed by reading them before writing,
 * as required by this plan) is `[hero, localProofSection, content, faq,
 * callToAction]` — 5 blocks, not the 4-block `[hero, content, faq,
 * callToAction]` shape assumed in PATTERNS.md/30-03-PLAN.md's interfaces
 * section (a `localProofSection` block was inserted at index 1 by a later
 * phase, per the plan's own "confirm during execution" caution). A
 * full-array rebuild from the original 4-block shape would both delete the
 * localProofSection block AND misalign every block after it. Same in-place
 * patching strategy as the other two scripts in this plan is used instead:
 * each locale's live layout is fetched fresh and patched block by block.
 *
 * localProofSection handling (T-30-09): both pages' `stats[]`/`testimonial`
 * fields were inspected before writing. `seo-tecnico-madrid` has ALL three
 * stats and the testimonial marked `[PLACEHOLDER]` — that whole block is
 * left completely untouched. `seo-tecnico-lima` has one REAL stat ("18
 * asistentes en el taller SEO + IA 2025 con Arianna Lupi" / matching EN)
 * plus two placeholder stats and a placeholder testimonial — this plan's
 * scope only covers hero/content/faq/callToAction copy (localProofSection
 * isn't in the fields-to-rewrite list), so the ENTIRE localProofSection
 * block is passed through unchanged on both pages, real stat included,
 * rather than risk rewriting a placeholder as if it were real prose.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-geo-pages.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

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

/** Copied near-verbatim from scripts/seed-phase20-geo-pages.ts. */
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

interface SectionCopy {
  title: string
  paragraphs: string[]
}
interface FaqCopy {
  question: string
  answer: string
}
interface GeoCopy {
  heroTitle: string
  heroSubtitle: string
  whyRemote: SectionCopy
  howIWork: SectionCopy
  faqs: FaqCopy[]
  ctaText: string
  ctaLinkLabel: string
}

const madridCopy: Record<Locale, GeoCopy> = {
  es: {
    heroTitle: 'SEO Técnico en Madrid / España',
    heroSubtitle:
      'Trabajo de forma remota con empresas en España como especialista senior en SEO técnico, sin la estructura ni el costo fijo de una agencia local, con la misma capacidad técnica.',
    whyRemote: {
      title: 'Por qué un especialista remoto tiene sentido para tu empresa en España',
      paragraphs: [
        'Soy transparente sobre esto: no tengo oficina física en Madrid. Trabajo de forma remota, lo cual me permite ofrecer disponibilidad flexible y un costo más eficiente que contratar una agencia local con oficina, equipo comercial y overhead, sin sacrificar profundidad técnica.',
        'El mercado español de SEO técnico tiene demanda real y medible: la investigación de keywords que uso para este mismo sitio confirma volumen de búsqueda comercial genuino para términos como "SEO técnico" (260 búsquedas al mes, CPC de 3,22 euros en el mercado ES). No es una suposición, es una decisión basada en datos reales de mercado.',
        'Trabajar en remoto no significa perder el pulso del mercado español: entiendo el registro del idioma, los competidores locales en el SERP español y el contexto de cumplimiento europeo (GDPR) que afecta cómo se implementa el SEO técnico en sitios que operan en la UE.',
      ],
    },
    howIWork: {
      title: 'Cómo trabajo con empresas en España',
      paragraphs: [
        'La coordinación es 100% remota: llamadas, revisiones de código, reportes, con horarios flexibles para acomodar la diferencia horaria con Lima cuando hace falta.',
        'Si tu equipo de desarrollo está en España, colaboro directamente con ellos (revisión de PRs, pair programming si el proyecto lo requiere) en vez de solo entregar un informe que alguien más tiene que traducir a código.',
        'Para proyectos de desarrollo completo, ofrezco la misma propuesta de Desarrollo Full-Stack con SEO integrado que uso a nivel global, pensada especialmente para empresas que quieren evitar reconstruir todo en WordPress con plugins genéricos.',
      ],
    },
    faqs: [
      {
        question: '¿Trabajas físicamente en Madrid?',
        answer:
          'No. Trabajo de forma remota desde Lima, Perú. Lo digo de forma directa porque prefiero ser honesto en vez de dar la impresión de tener una oficina local que no existe. La ventaja real está en la profundidad técnica y en el costo, no en la presencia física.',
      },
      {
        question: '¿Cómo se coordina el trabajo con la diferencia horaria?',
        answer:
          'Lima está a -6/-7 horas de Madrid según el horario de verano europeo. En la práctica esto deja varias horas de solapamiento durante la mañana europea, suficientes para llamadas y coordinación en tiempo real; el resto del trabajo (auditorías, implementación de código, reportes) no depende de solapamiento horario.',
      },
      {
        question: '¿Qué tan real es la demanda de SEO técnico en España?',
        answer:
          'Real y medible: el propio keyword research de este sitio confirma volumen de búsqueda comercial genuino para términos de SEO técnico en el mercado español (por ejemplo, "SEO técnico" con 260 búsquedas al mes y CPC de 3,22 euros), lo cual indica intención comercial real, no solo curiosidad informativa.',
      },
      {
        question: '¿Por qué elegir un especialista remoto en vez de una agencia local en Madrid?',
        answer:
          'Una agencia local tiene overhead de oficina, equipo comercial y, en muchos casos, subcontrata el trabajo técnico real a otra persona de todas formas. Trabajando conmigo directamente accedes al mismo nivel de profundidad técnica (auditoría más implementación en código) sin esa capa intermedia.',
      },
    ],
    ctaText: 'Si tu empresa en España necesita SEO técnico serio, sin el costo de una agencia local, hablemos.',
    ctaLinkLabel: 'Conversar sobre tu proyecto',
  },
  en: {
    heroTitle: 'Technical SEO in Madrid / Spain',
    heroSubtitle:
      'I work remotely with companies in Spain as a senior technical SEO specialist, without the structure or fixed cost of a local agency, at the same technical depth.',
    whyRemote: {
      title: 'Why a remote specialist makes sense for your company in Spain',
      paragraphs: [
        "I'll be upfront about this: I don't have a physical office in Madrid. I work remotely, which lets me offer flexible availability and a more efficient cost structure than hiring a local agency with an office, sales team, and overhead, without sacrificing technical depth.",
        'The Spanish technical SEO market has real, measurable demand: the keyword research I use for this very site confirms genuine commercial search volume for terms like "SEO técnico" (260 searches a month, a €3.22 CPC in the ES market). This isn\'t a guess, it\'s a decision grounded in real market data.',
        'Working remotely doesn\'t mean losing touch with the Spanish market: I understand the language register, the local competitors in the Spanish SERP, and the European compliance context (GDPR) that affects how technical SEO gets implemented on sites operating in the EU.',
      ],
    },
    howIWork: {
      title: 'How I work with companies in Spain',
      paragraphs: [
        'Coordination is 100% remote: calls, code reviews, reports, with flexible scheduling to accommodate the time difference with Lima when needed.',
        "If your dev team is in Spain, I collaborate directly with them (PR review, pair programming when the project calls for it) instead of just handing off a report someone else has to translate into code.",
        'For full-build projects, I offer the same Full-Stack Development with SEO Built In service I provide globally, built especially for companies that want to avoid rebuilding everything on WordPress with generic plugins.',
      ],
    },
    faqs: [
      {
        question: 'Do you work physically in Madrid?',
        answer:
          "No. I work remotely from Lima, Peru. I say this directly because I'd rather be upfront than give the impression of a local office that doesn't exist. The real advantage is in technical depth and cost, not physical presence.",
      },
      {
        question: 'How does work get coordinated across the time difference?',
        answer:
          "Lima is -6/-7 hours from Madrid depending on European summer time. In practice this leaves several overlapping hours during the European morning, enough for real-time calls and coordination; the rest of the work (audits, code implementation, reports) doesn't depend on overlap.",
      },
      {
        question: 'How real is the demand for technical SEO in Spain?',
        answer:
          'Real and measurable: this site\'s own keyword research confirms genuine commercial search volume for technical SEO terms in the Spanish market (for example, "SEO técnico" at 260 searches a month with a €3.22 CPC), which signals real commercial intent, not just informational curiosity.',
      },
      {
        question: 'Why choose a remote specialist over a local agency in Madrid?',
        answer:
          'A local agency carries office overhead, a sales team, and in many cases still outsources the actual technical work to someone else anyway. Working with me directly gets you the same depth of technical work (audit plus code implementation) without that middle layer.',
      },
    ],
    ctaText: 'If your company in Spain needs serious technical SEO without the cost of a local agency, let\'s talk.',
    ctaLinkLabel: 'Talk about your project',
  },
}

const limaCopy: Record<Locale, GeoCopy> = {
  es: {
    heroTitle: 'SEO Técnico en Lima',
    heroSubtitle:
      'Con base física en Lima y formación en la Universidad Peruana de Ciencias Aplicadas (UPC), trabajo con empresas peruanas que necesitan SEO técnico serio, no un checklist genérico copiado de un blog.',
    whyRemote: {
      title: 'Por qué trabajar con alguien basado en Lima',
      paragraphs: [
        'Estoy físicamente en Lima, no coordinando desde otro país a través de un intermediario. Eso significa reuniones en el mismo huso horario, entendimiento directo del mercado peruano y ninguna fricción de trabajar con una agencia que subcontrata el trabajo técnico a otro lado.',
        'En 2025 co-dicté un taller de 4 horas de "SEO + IA" en Lima junto con Arianna Lupi (consultora SEO, instructora SEO y fundadora), organizado con Lm Marketing (agencia SEO), con 18 asistentes entre profesionales, marketers y emprendedores. No es una credencial de LinkedIn sin sustento: es trabajo real hecho aquí, con gente real de la comunidad SEO local.',
        'Mi formación de base es en la UPC, lo que combino con mi trabajo en desarrollo full-stack (Next.js, CMS headless). No soy solo "el que hace SEO": entiendo el código sobre el que corre tu sitio.',
      ],
    },
    howIWork: {
      title: 'Cómo trabajo con empresas en Lima',
      paragraphs: [
        'Empiezo con una auditoría técnica real, no una plantilla, para entender exactamente qué está limitando tu sitio en los resultados de búsqueda.',
        'Si tu equipo de desarrollo está en Lima o es remoto, puedo coordinar directamente con ellos en español, sin capas de traducción ni fricción de zona horaria.',
        'Para negocios que están construyendo o rediseñando su sitio, puedo encargarme tanto del desarrollo como del SEO técnico integrado: la misma propuesta de Desarrollo Full-Stack que ofrezco a nivel global, con la ventaja de estar disponible presencialmente en Lima cuando el proyecto lo justifica.',
      ],
    },
    faqs: [
      {
        question: '¿Trabajas presencialmente o solo remoto?',
        answer:
          'Estoy basado físicamente en Lima y puedo trabajar presencialmente cuando el proyecto lo amerita (reuniones, talleres, sesiones de trabajo conjunto con tu equipo), además del día a día remoto.',
      },
      {
        question: '¿Trabajas con negocios locales pequeños o solo con empresas grandes?',
        answer:
          'Mi especialidad es el SEO técnico para sitios con complejidad real: plataformas con mucho contenido, arquitecturas complejas o necesidad de desarrollo a medida, más que el SEO local para negocios de barrio (dentistas, restaurantes). Si tu negocio tiene un sitio con volumen de contenido o necesidades técnicas serias, ahí es donde aporto más valor.',
      },
      {
        question: '¿Puedo ver ejemplos de trabajo real hecho en Lima o con la comunidad SEO local?',
        answer:
          'Sí. El taller de SEO + IA que co-dicté con Arianna Lupi (DinoRANK / Lm Marketing) es un ejemplo público y verificable, con una publicación en LinkedIn que documenta el evento y a los asistentes.',
      },
      {
        question: '¿Qué diferencia a tu servicio de una agencia SEO local tradicional?',
        answer:
          'Además del SEO técnico, puedo implementar directamente las correcciones en el código (también soy desarrollador full-stack en Next.js/CMS headless). Muchas agencias locales solo entregan recomendaciones que después tu equipo de desarrollo tiene que interpretar e implementar por su cuenta.',
      },
    ],
    ctaText:
      'Si tu empresa está en Lima y necesitas SEO técnico hecho por alguien que entiende tanto el mercado local como el código, hablemos.',
    ctaLinkLabel: 'Conversar sobre tu proyecto',
  },
  en: {
    heroTitle: 'Technical SEO in Lima',
    heroSubtitle:
      'Physically based in Lima and trained at Universidad Peruana de Ciencias Aplicadas (UPC), I work with Peruvian businesses that need serious technical SEO, not a generic checklist copied from a blog.',
    whyRemote: {
      title: 'Why work with someone based in Lima',
      paragraphs: [
        "I'm physically in Lima, not coordinating from another country through a middleman. That means meetings in the same timezone, direct understanding of the Peruvian market, and no friction from an agency that outsources the technical work elsewhere.",
        'In 2025 I co-taught a 4-hour "SEO + AI" workshop in Lima together with Arianna Lupi (SEO consultant, SEO instructor, and founder), organized with Lm Marketing (SEO agency), with 18 attendees including professionals, marketers, and entrepreneurs. This isn\'t an unsupported LinkedIn credential: it\'s real work done here, with real people from the local SEO community.',
        "My core education is at UPC, which I combine with my full-stack development work (Next.js, headless CMS). I'm not just 'the SEO guy': I understand the code your site actually runs on.",
      ],
    },
    howIWork: {
      title: 'How I work with businesses in Lima',
      paragraphs: [
        "I start with a real technical audit, not a template, to understand exactly what's limiting your site in search results.",
        'If your dev team is in Lima or remote, I can coordinate directly with them in Spanish, with no translation layer or timezone friction.',
        'For businesses building or redesigning their site, I can take on both development and integrated technical SEO: the same Full-Stack Development offering I provide globally, with the added advantage of being available in person in Lima when the project calls for it.',
      ],
    },
    faqs: [
      {
        question: 'Do you work in person or only remotely?',
        answer:
          "I'm physically based in Lima and can work in person when a project calls for it (meetings, workshops, joint work sessions with your team), in addition to remote day-to-day work.",
      },
      {
        question: 'Do you work with small local businesses or only larger companies?',
        answer:
          'My specialty is technical SEO for sites with real complexity: content-heavy platforms, complex architectures, or custom development needs, more than local SEO for neighborhood businesses (dentists, restaurants). If your business has a site with significant content volume or serious technical needs, that\'s where I add the most value.',
      },
      {
        question: 'Can I see real examples of work done in Lima or with the local SEO community?',
        answer:
          'Yes. The SEO + AI workshop I co-taught with Arianna Lupi (DinoRANK / Lm Marketing) is a public, verifiable example, with a LinkedIn post documenting the event and attendees.',
      },
      {
        question: 'What sets your service apart from a traditional local SEO agency?',
        answer:
          "Beyond technical SEO, I can implement fixes directly in the code (I'm also a full-stack developer in Next.js/headless CMS). Many local agencies only hand off recommendations your dev team then has to interpret and implement on their own.",
      },
    ],
    ctaText:
      'If your business is in Lima and needs technical SEO from someone who understands both the local market and the code, let\'s talk.',
    ctaLinkLabel: 'Talk about your project',
  },
}

const FAQ_TITLE: Record<Locale, string> = {
  es: 'Preguntas frecuentes',
  en: 'Frequently asked questions',
}

function patchGeoBlock(
  block: Record<string, unknown>,
  copy: GeoCopy,
  locale: Locale,
): Record<string, unknown> {
  const blockType = block.blockType

  if (blockType === 'hero') {
    return { ...block, title: copy.heroTitle, subtitle: copy.heroSubtitle }
  }

  // localProofSection (stats[]/testimonial): T-30-09 — left completely
  // untouched on both pages. Madrid has all-placeholder stats/testimonial;
  // Lima has one real stat mixed with placeholders. Neither is in this
  // plan's fields-to-rewrite scope, so we never even inspect subfields here
  // beyond the read-only check already done in the file header comment.
  if (blockType === 'localProofSection') {
    return block
  }

  if (blockType === 'content') {
    const columns = (block.columns as Record<string, unknown>[]) ?? []
    return {
      ...block,
      columns: [
        { ...columns[0], richText: lexicalWithHeading(copy.whyRemote.title, copy.whyRemote.paragraphs) },
        { ...columns[1], richText: lexicalWithHeading(copy.howIWork.title, copy.howIWork.paragraphs) },
        ...columns.slice(2),
      ],
    }
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

async function humanizeGeoPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
  copyByLocale: Record<Locale, GeoCopy>,
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

    const patched = liveLayout.map((block) => patchGeoBlock(block, copyByLocale[locale], locale))

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

  await humanizeGeoPage(payload, 'seo-tecnico-madrid', madridCopy)
  await humanizeGeoPage(payload, 'seo-tecnico-lima', limaCopy)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
