/**
 * Phase 13 (Home Content Population — ABOUT-02 / FAQ-01):
 *
 * 1. In-place update of Home's existing `aboutSection` block (populated by
 *    Phase 10.7) — sets `eyebrow`/`title`/`paragraphs` to this phase's
 *    locked "Mi enfoque en Consultoría Técnica" copy (13-CONTEXT.md
 *    <specifics>, gap closure 13-03) and adds `features[]` (4 real items) +
 *    `ctaText`/`ctaLink` ("Hablemos de tu proyecto" -> #contact).
 * 2. Adds a `faq` block to Home's layout (5 real Q&A pairs, ES+EN) right
 *    after `aboutSection`, if not already present.
 * 3. Adds a `contactFormBlock` to the end of Home's layout (reusing the
 *    exact live /contact copy from scripts/seed-contact-page.ts), if not
 *    already present — this is what makes the new CTA's `#contact` anchor
 *    resolve to a real, functional form instead of a dead link (13-02-PLAN.md
 *    <objective> gap).
 *
 * Idempotent: re-running does not duplicate any block, and updates existing
 * blocks in place by blockType lookup.
 *
 * IMPORTANT: each locale's full layout is fetched fresh via `findByID` with
 * that locale explicitly set, so sibling blocks' already-correct localized
 * content for that locale is preserved verbatim in the write-back (never
 * cross-contaminated with the other locale's values). New blocks (faq,
 * contactFormBlock) reuse the same server-assigned `id` across both locale
 * writes (captured after the first locale's write) — otherwise the second
 * locale's write creates a duplicate block row and orphans the first
 * locale's localized fields (the exact bug already hit and fixed once in
 * seed-phase10-7-gap-fill.ts / seed-home-page.ts). The same id-reuse
 * discipline applies to the nested `aboutSection.features[]` and
 * `aboutSection.paragraphs[]` arrays, and to `faq.faqs[]`.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase13-home-content.ts
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

const featuresCopy: Record<Locale, { icon: string; title: string; description: string }[]> = {
  es: [
    {
      icon: 'trendingUp',
      title: 'SEO Técnico',
      description:
        'Optimización profunda de infraestructura, Rendering y esquema (Schema) para maximizar la visibilidad en motores de búsqueda.',
    },
    {
      icon: 'zap',
      title: 'Rendimiento web',
      description:
        'Obsesión por el 100/100. Optimización de la ruta crítica de renderizado para tiempos de carga inmediatos.',
    },
    {
      icon: 'code',
      title: 'Arquitectura escalable',
      description:
        'Diseño de sistemas modulares y limpios. Código mantenible que facilita el crecimiento del proyecto sin deuda técnica.',
    },
    {
      icon: 'monitor',
      title: 'Ingeniería de UX',
      description:
        'Interfaces adaptables y accesibles (A11Y). Desarrollo Mobile-First real, no solo visual, sino funcional.',
    },
  ],
  en: [
    {
      icon: 'trendingUp',
      title: 'Technical SEO',
      description:
        'Deep optimization of infrastructure, rendering, and schema markup to maximize visibility in search engines.',
    },
    {
      icon: 'zap',
      title: 'Web Performance',
      description:
        'An obsession with 100/100 scores. Critical rendering path optimization for instant load times.',
    },
    {
      icon: 'code',
      title: 'Scalable Architecture',
      description:
        'Modular, clean system design. Maintainable code that lets a project grow without piling up technical debt.',
    },
    {
      icon: 'monitor',
      title: 'UX Engineering',
      description:
        'Adaptable, accessible (A11Y) interfaces. Real mobile-first development — functional, not just visual.',
    },
  ],
}

const ctaCopy: Record<Locale, string> = {
  es: 'Hablemos de tu proyecto',
  en: "Let's talk about your project",
}

// Gap closure (13-03): Home's aboutSection eyebrow/title/description must
// read as this phase's "Mi enfoque en Consultoría Técnica" section (locked
// in 13-CONTEXT.md's <specifics>), not Phase 10.7's original "Sobre mí" bio
// intro. This fully replaces the old two-paragraph bio copy with a single
// description paragraph, so the Phase-10.7 leftover-Spanish-on-EN patch
// that used to live here (ABOUT_PARAGRAPH_1_BROKEN_EN_TEXT/FIXED_EN_TEXT)
// is now moot — the old bio text it targeted no longer exists at all.
const aboutHeaderCopy: Record<Locale, { eyebrow: string; title: string; description: string }> = {
  es: {
    eyebrow: 'Estrategia y datos. Más allá del código',
    title: 'Mi enfoque en Consultoría Técnica',
    description:
      'No veo el SEO y el desarrollo web como disciplinas aisladas. Los motores de búsqueda modernos evalúan la limpieza del código, la velocidad de carga y la arquitectura de la información. Mi metodología se basa en auditar y construir soluciones donde la infraestructura técnica se convierte en el motor principal para el crecimiento orgánico, asegurando que tu web no solo funcione perfectamente, sino que domine en los resultados de búsqueda.',
  },
  en: {
    eyebrow: 'Data and strategy. Beyond the code',
    title: 'My Approach to Technical Consulting',
    description:
      "I don't see SEO and web development as separate disciplines. Modern search engines evaluate code quality, load speed, and information architecture. My approach is built on auditing and building solutions where technical infrastructure becomes the primary driver of organic growth — making sure your site not only runs flawlessly, but dominates the search results too.",
  },
}

const faqCopy: Record<Locale, { title: string; faqs: { question: string; answer: string }[] }> = {
  es: {
    title: 'Preguntas frecuentes',
    faqs: [
      {
        question: '¿Cuál es la diferencia entre el SEO tradicional y tu consultoría de SEO Técnico?',
        answer:
          'El SEO tradicional prioriza la redacción de contenido y la adquisición de enlaces. Mi consultoría interviene la infraestructura de la web. Optimizo el Crawl Budget, los patrones de renderizado y la arquitectura de información para resolver cuellos de botella que impiden la correcta indexación de tu sitio.',
      },
      {
        question: '¿Entregas solo la auditoría o también implementas los cambios en el código?',
        answer:
          'Cubro ambas fases. Detecto las vulnerabilidades de la infraestructura y diseño la solución técnica. Puedo implementar las mejoras directamente en el código base o documentar las tareas para guiar a tu equipo de desarrollo durante la ejecución.',
      },
      {
        question: '¿En qué stack tecnológico y plataformas te especializas?',
        answer:
          'Trabajo principalmente con arquitecturas modernas y sistemas Headless. Mi enfoque técnico abarca frameworks como Next.js y React, gestores de contenido como PayloadCMS, y plataformas de e-commerce como Shopify y WordPress.',
      },
      {
        question: '¿Cómo medimos el éxito de las optimizaciones implementadas?',
        answer:
          'Evaluamos el progreso mediante datos objetivos. Monitorizamos la mejora en las métricas de los Core Web Vitals (LCP, INP, CLS) para medir el rendimiento. A nivel de buscadores, medimos la corrección de errores en Google Search Console y el aumento del porcentaje de URLs válidas indexadas.',
      },
      {
        question: '¿Cuál es el proceso para empezar a trabajar contigo?',
        answer:
          'Recomiendo iniciar con una auditoría de SEO Técnico inicial. Esto me permite evaluar la salud actual de tu infraestructura, identificar bloqueos de renderizado y establecer una hoja de ruta priorizada antes de comprometer recursos de desarrollo.',
      },
    ],
  },
  en: {
    title: 'Frequently asked questions',
    faqs: [
      {
        question: "What's the difference between traditional SEO and your Technical SEO consulting?",
        answer:
          'Traditional SEO focuses on content writing and link building. My consulting works on the infrastructure of the site itself. I optimize crawl budget, rendering patterns, and information architecture to fix the bottlenecks that keep a site from being properly indexed.',
      },
      {
        question: 'Do you only deliver the audit, or do you also implement the code changes?',
        answer:
          'I cover both phases. I find the infrastructure issues and design the technical solution, then either implement the improvements directly in the codebase or document the tasks so your development team can execute them.',
      },
      {
        question: 'What tech stack and platforms do you specialize in?',
        answer:
          'I mainly work with modern, headless architectures. My technical focus covers frameworks like Next.js and React, content management systems like PayloadCMS, and e-commerce platforms like Shopify and WordPress.',
      },
      {
        question: 'How do we measure the success of the optimizations?',
        answer:
          'We track objective data. We monitor Core Web Vitals (LCP, INP, CLS) to measure performance improvements, and on the search side, we track error fixes in Google Search Console along with the growth in the percentage of valid indexed URLs.',
      },
      {
        question: "What's the process for getting started?",
        answer:
          'I recommend starting with an initial Technical SEO audit. That lets me assess the current health of your infrastructure, identify rendering blockers, and put together a prioritized roadmap before committing development resources.',
      },
    ],
  },
}

const contactCopy: Record<Locale, Record<string, unknown>> = {
  es: {
    blockType: 'contactFormBlock',
    eyebrow: 'Contacto',
    title: 'Hablemos',
    description: '¿Tienes un proyecto en mente? Cuéntame de qué se trata.',
    submitLabel: 'Enviar mensaje',
    sidebarTitle: 'Charlemos sobre tu próximo proyecto',
    sidebarDescription: 'Disponible para consultoría en ingeniería de software y SEO técnico.',
    socialProofText: 'Respondo en menos de 48 horas.',
    contactInfo: [
      {
        icon: 'mail',
        title: 'Email',
        value: 'hello@juan-tech.com',
        href: 'mailto:hello@juan-tech.com',
      },
    ],
  },
  en: {
    blockType: 'contactFormBlock',
    eyebrow: 'Contact',
    title: 'Get in Touch',
    description: 'Have a project in mind? Tell me about it.',
    submitLabel: 'Send message',
    sidebarTitle: "Let's talk about your next project",
    sidebarDescription: 'Available for software engineering and technical SEO consulting.',
    socialProofText: 'I respond within 48 hours.',
    contactInfo: [
      {
        icon: 'mail',
        title: 'Email',
        value: 'hello@juan-tech.com',
        href: 'mailto:hello@juan-tech.com',
      },
    ],
  },
}

async function main() {
  const payload = await getPayload({ config })

  const { docs: homeDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = homeDocs[0]

  if (!homeDoc) {
    console.log('No `home` Pages doc found by slug — cannot seed Phase 13 content. Skipping.')
    process.exit(1)
  }

  // Reused across locale writes so the second locale's write updates the
  // same block/sub-array rows instead of creating duplicates (id-reuse
  // pattern from seed-phase10-7-gap-fill.ts / seed-contact-page.ts). Applies
  // to top-level blocks (faq, contactFormBlock) AND to the nested
  // aboutSection.features[]/paragraphs[] sub-arrays — Payload full-replaces
  // array fields on update, so omitting ids on the second locale write
  // orphans the first locale's already-written values (Rule 1 fix, found
  // during this script's first run: es features[].title/description came
  // back undefined after the en write).
  let faqBlockId: string | undefined
  let contactBlockId: string | undefined
  let featureIds: (string | undefined)[] | undefined
  let paragraphIds: (string | undefined)[] | undefined
  let faqItemIds: (string | undefined)[] | undefined

  for (const locale of LOCALES) {
    const doc = await payload.findByID({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      depth: 0,
    })

    const layout = [...((doc.content?.layout ?? []) as Array<Record<string, unknown>>)]

    // 1. In-place update of the existing aboutSection block.
    const aboutIndex = layout.findIndex((b) => b.blockType === 'aboutSection')
    if (aboutIndex === -1) {
      console.log(`No aboutSection block found in Home layout (locale=${locale}) — skipping features/CTA update.`)
    } else {
      const features = featuresCopy[locale].map((f, i) => {
        const withId = featureIds?.[i] ? { ...f, id: featureIds[i] } : f
        return withId
      })

      const paragraphs = [
        {
          text: aboutHeaderCopy[locale].description,
          ...(paragraphIds?.[0] ? { id: paragraphIds[0] } : {}),
        },
      ]

      layout[aboutIndex] = {
        ...layout[aboutIndex],
        eyebrow: aboutHeaderCopy[locale].eyebrow,
        title: aboutHeaderCopy[locale].title,
        paragraphs,
        features,
        ctaText: ctaCopy[locale],
        ctaLink: '#contact',
      }
    }

    // 2. Insert or update the faq block, immediately after aboutSection.
    const faqIndex = layout.findIndex((b) => b.blockType === 'faq')
    const faqBlock: Record<string, unknown> = {
      blockType: 'faq',
      title: faqCopy[locale].title,
      // Same sub-array id-reuse requirement as aboutSection.features[] above
      // — faqs[] is itself a nested array field, full-replaced on update.
      faqs: faqCopy[locale].faqs.map((f, i) => ({
        ...(faqItemIds?.[i] ? { id: faqItemIds[i] } : {}),
        question: f.question,
        answer: lexicalParagraph(f.answer),
      })),
    }
    if (faqBlockId) faqBlock.id = faqBlockId

    if (faqIndex === -1) {
      const insertAt = aboutIndex === -1 ? layout.length : aboutIndex + 1
      layout.splice(insertAt, 0, faqBlock)
    } else {
      if (!faqBlockId && layout[faqIndex]?.id) faqBlock.id = layout[faqIndex].id as string
      layout[faqIndex] = faqBlock
    }

    // 3. Insert or update the contactFormBlock, at the end of the layout.
    const contactIndex = layout.findIndex((b) => b.blockType === 'contactFormBlock')
    const contactBlock: Record<string, unknown> = { ...contactCopy[locale] }
    if (contactBlockId) contactBlock.id = contactBlockId

    if (contactIndex === -1) {
      layout.push(contactBlock)
    } else {
      if (!contactBlockId && layout[contactIndex]?.id) contactBlock.id = layout[contactIndex].id as string
      layout[contactIndex] = contactBlock
    }

    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layout as any,
        },
      },
    })

    if (!faqBlockId || !contactBlockId || !featureIds || !paragraphIds || !faqItemIds) {
      const refetched = await payload.findByID({ collection: 'pages', id: homeDoc.id, locale, depth: 0 })
      const refetchedLayout = (refetched.content?.layout ?? []) as Array<Record<string, unknown>>
      if (!featureIds || !paragraphIds) {
        const refetchedAbout = refetchedLayout.find((b) => b.blockType === 'aboutSection') as
          | { features?: { id?: string }[]; paragraphs?: { id?: string }[] }
          | undefined
        if (!featureIds) featureIds = refetchedAbout?.features?.map((f) => f.id)
        if (!paragraphIds) paragraphIds = refetchedAbout?.paragraphs?.map((p) => p.id)
      }
      if (!faqItemIds) {
        const refetchedFaq = refetchedLayout.find((b) => b.blockType === 'faq') as
          | { faqs?: { id?: string }[] }
          | undefined
        faqItemIds = refetchedFaq?.faqs?.map((f) => f.id)
      }
      if (!faqBlockId) {
        faqBlockId = refetchedLayout.find((b) => b.blockType === 'faq')?.id as string | undefined
      }
      if (!contactBlockId) {
        contactBlockId = refetchedLayout.find((b) => b.blockType === 'contactFormBlock')?.id as
          | string
          | undefined
      }
    }

    console.log(`Phase 13 home content: updated home Pages doc (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
