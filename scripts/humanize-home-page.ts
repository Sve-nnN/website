/**
 * Phase 30 Plan 02, Task 1 — Humanize Home page (VOICE-06).
 *
 * Rewrites the real editorial copy of Home's `hero`, `aboutSection`, `faq`,
 * `callToAction`, `contactFormBlock`, `clientLogosBlock`, `featuredPostsBlock`,
 * `featuredCaseStudiesBlock`, and `servicesShowcase` blocks in both locales,
 * calibrated against research/voice-sample-juan.md and 29-VOICE-PROFILE.md.
 * Does NOT touch `testimonialsCarousel` or any `meta.*`/`targetKeyword` field.
 *
 * Hero rewrite: the live title/subtitle read as a third-person corporate
 * tagline ("Juan Carlos Angulo: Ingeniero de Software y Experto SEO"). Per
 * VOICE-PROFILE, a page's main hero heading is prose, not a structural
 * exception (JSON-LD/card-kicker) — rewritten into first person.
 *
 * Also fixes 3 real locale-collapse bugs found live during execution
 * (EN value identical to ES, or vice versa, on fields that should differ):
 * `clientLogosBlock.title` ("Clientes"/"Clientes" -> "Clientes"/"Clients"),
 * `featuredPostsBlock.title` (-> "Featured Articles" in EN),
 * `featuredCaseStudiesBlock.title` (-> "Featured Case Studies" in EN),
 * `callToAction.richText` ("Ready to work together?" duplicated verbatim in
 * ES -> now a real Spanish rewrite), and `callToAction.links[0].link.label`
 * ("Hablemos"/"Hablemos" -> "Hablemos"/"Let's talk").
 *
 * IMPORTANT (id-reuse discipline, T-30-04): every locale's full layout is
 * fetched fresh via `findByID({ locale })` before mutating, only the 9
 * targeted blocks' fields are overwritten (every other block/field is
 * spread through byte-identical), and a `reapplyIds` pass echoes back the
 * ids captured from the first locale's post-write refetch on every
 * subsequent locale write — top-level block ids AND the nested
 * `aboutSection.features[]`/`paragraphs[]`, `faq.faqs[]`, and
 * `contactFormBlock.contactInfo[]` sub-array ids. Payload full-replaces
 * `blocks`/`array` fields on `update`, so omitting an id on locale B's write
 * would orphan locale A's already-written localized values (the exact bug
 * class behind the 2026-07-12 CTA data-loss incident, applied here at the
 * content-script layer per 30-PATTERNS.md).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-home-page.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]
type Block = Record<string, unknown>

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

// ---------------------------------------------------------------------------
// Copy, calibrated against research/voice-sample-juan.md (mixed long/short
// rhythm, first person, concrete opening, zero em dash, zero AI filler) and
// 29-VOICE-PROFILE.md's "páginas core" guidance (full voice surface).
// ---------------------------------------------------------------------------

const heroCopy: Record<Locale, { title: string; subtitle: string }> = {
  es: {
    title: 'Construyo software rápido y hago que se encuentre en Google',
    subtitle: 'Ingeniería de software y SEO técnico, trabajados como una sola disciplina, no por separado.',
  },
  en: {
    title: 'I build fast software and get it found on Google',
    subtitle: 'Software engineering and technical SEO, treated as one discipline, not two.',
  },
}

// Home CTA link label parity fix (Rule 1 — locale collapse: live ES/EN both
// read "Hablemos"). Only the label text changes; url/appearance untouched.
const heroCtaLinkLabel: Record<Locale, string> = {
  es: 'Hablemos',
  en: "Let's talk",
}

const ctaRichTextCopy: Record<Locale, string> = {
  es: '¿Empezamos a trabajar juntos?',
  en: 'Ready to work together?',
}

const ctaLinksLabel: Record<Locale, string> = {
  es: 'Hablemos',
  en: "Let's talk",
}

const aboutCopy: Record<
  Locale,
  {
    eyebrow: string
    title: string
    paragraph: string
    ctaText: string
    features: { title: string; description: string }[]
  }
> = {
  es: {
    eyebrow: 'Estrategia y datos, más allá del código',
    title: 'Mi enfoque en Consultoría Técnica',
    paragraph:
      'No veo el SEO y el desarrollo web como disciplinas aisladas. Los motores de búsqueda modernos evalúan la limpieza del código, la velocidad de carga y la arquitectura de la información, y por eso construyo sobre Next.js y CMS headless como Payload, con el SEO técnico diseñado en el código desde el primer commit en vez de parchado después con plugins genéricos sobre un WordPress estándar. Mi metodología parte de auditar antes de construir, hasta que la infraestructura técnica se vuelve el motor principal del crecimiento orgánico y tu web no solo funciona bien, sino que gana terreno real en los resultados de búsqueda.',
    ctaText: 'Hablemos de tu proyecto',
    features: [
      {
        title: 'SEO Técnico',
        description:
          'Auditoría profunda de infraestructura, rendering y datos estructurados (Schema) para mejorar la visibilidad en buscadores.',
      },
      {
        title: 'Rendimiento web',
        description:
          'Mi obsesión es el 100/100. Optimizo la ruta crítica de renderizado para que la carga se sienta prácticamente inmediata.',
      },
      {
        title: 'Arquitectura escalable',
        description:
          'Diseño sistemas modulares y limpios sobre Next.js y CMS headless como Payload: código propio, auditable y mantenible, sin builders ni plugins de terceros, que le permite al proyecto crecer sin acumular deuda técnica.',
      },
      {
        title: 'Ingeniería de UX',
        description:
          'Construyo interfaces adaptables y accesibles (A11Y), con un enfoque mobile-first real: no solo visual, funcional también.',
      },
    ],
  },
  en: {
    eyebrow: 'Data and strategy, beyond the code',
    title: 'My Approach to Technical Consulting',
    paragraph:
      "I don't see SEO and web development as separate disciplines. Modern search engines evaluate code quality, load speed, and information architecture, and that's why I build on Next.js and headless CMS like Payload, with technical SEO designed into the code from the first commit instead of patched on later with generic plugins on a standard WordPress build. My approach starts with the audit before the build, until the technical infrastructure becomes the main driver of organic growth and your site doesn't just run well, it actually gains ground in search results.",
    ctaText: "Let's talk about your project",
    features: [
      {
        title: 'Technical SEO',
        description:
          'Deep audits of infrastructure, rendering, and structured data (Schema) to improve visibility in search engines.',
      },
      {
        title: 'Web Performance',
        description:
          'My obsession is the 100/100 score. I optimize the critical rendering path so load times feel practically instant.',
      },
      {
        title: 'Scalable Architecture',
        description:
          'I design modular, clean systems on Next.js and headless CMS like Payload: proprietary, auditable, maintainable code with no third-party builders or plugins, built so a project can grow without piling up technical debt.',
      },
      {
        title: 'UX Engineering',
        description:
          'I build adaptable, accessible (A11Y) interfaces with a real mobile-first approach: not just visual, functional too.',
      },
    ],
  },
}

const faqCopy: Record<Locale, { title: string; faqs: { question: string; answer: string }[] }> = {
  es: {
    title: 'Preguntas frecuentes',
    faqs: [
      {
        question: '¿Cuál es la diferencia entre el SEO tradicional y tu consultoría de SEO Técnico?',
        answer:
          'El SEO tradicional se enfoca en redactar contenido y conseguir enlaces. Mi trabajo entra directo a la infraestructura de la web: optimizo el crawl budget, los patrones de renderizado y la arquitectura de información para resolver los cuellos de botella que le impiden a tu sitio indexarse bien.',
      },
      {
        question: '¿Entregas solo la auditoría o también implementas los cambios en el código?',
        answer:
          'Cubro las dos fases. Encuentro los problemas de infraestructura, diseño la solución técnica, y después decido contigo si la implemento yo mismo en el código o la documento para que tu equipo la ejecute.',
      },
      {
        question: '¿En qué stack tecnológico y plataformas te especializas?',
        answer:
          'Trabajo sobre todo con arquitecturas modernas y headless. Uso Next.js y React del lado del framework, PayloadCMS como gestor de contenido, y plataformas como Shopify o WordPress cuando el proyecto ya vive ahí.',
      },
      {
        question: '¿Cómo medimos el éxito de las optimizaciones implementadas?',
        answer:
          'Mido con datos, no con impresiones. Reviso la evolución de los Core Web Vitals (LCP, INP, CLS) para el rendimiento, y del lado de buscadores, reviso los errores corregidos en Search Console y el porcentaje de URLs indexadas correctamente.',
      },
      {
        question: '¿Cuál es el proceso para empezar a trabajar contigo?',
        answer:
          'Casi siempre empiezo con una auditoría de SEO técnico. Esto me deja ver la salud real de tu infraestructura, encontrar los bloqueos de renderizado, y armar una hoja de ruta priorizada antes de tocar una sola línea de desarrollo.',
      },
    ],
  },
  en: {
    title: 'Frequently asked questions',
    faqs: [
      {
        question: "What's the difference between traditional SEO and your Technical SEO consulting?",
        answer:
          "Traditional SEO focuses on writing content and building links. My work goes straight into the infrastructure of the site: I optimize crawl budget, rendering patterns, and information architecture to fix whatever bottleneck is keeping your site from indexing properly.",
      },
      {
        question: 'Do you only deliver the audit, or do you also implement the code changes?',
        answer:
          'I cover both phases. I find the infrastructure issues, design the technical fix, and then we decide together whether I implement it myself in the codebase or document it so your team can run with it.',
      },
      {
        question: 'What tech stack and platforms do you specialize in?',
        answer:
          "I mainly work with modern, headless architectures. Next.js and React on the framework side, PayloadCMS as the content layer, and platforms like Shopify or WordPress when that's where the project already lives.",
      },
      {
        question: 'How do we measure the success of the optimizations?',
        answer:
          'I measure with data, not impressions. I track Core Web Vitals (LCP, INP, CLS) for performance, and on the search side, I track the errors fixed in Search Console and the percentage of URLs indexed correctly.',
      },
      {
        question: "What's the process for getting started?",
        answer:
          'I almost always start with a technical SEO audit. That lets me see the real health of your infrastructure, find the rendering blockers, and put together a prioritized roadmap before touching a single line of development.',
      },
    ],
  },
}

const contactCopy: Record<
  Locale,
  {
    eyebrow: string
    title: string
    description: string
    submitLabel: string
    sidebarTitle: string
    sidebarDescription: string
    socialProofText: string
    contactInfo: { title: string; value: string }[]
  }
> = {
  es: {
    eyebrow: 'Contacto',
    title: 'Hablemos',
    description: '¿Tienes un proyecto en mente? Cuéntame de qué se trata.',
    submitLabel: 'Enviar mensaje',
    sidebarTitle: 'Charlemos sobre tu próximo proyecto',
    sidebarDescription: 'Disponible para consultoría en ingeniería de software y SEO técnico.',
    socialProofText: 'Suelo responder en menos de 48 horas.',
    contactInfo: [{ title: 'Email', value: 'hello@juan-tech.com' }],
  },
  en: {
    eyebrow: 'Contact',
    title: "Let's Talk",
    description: 'Got a project in mind? Tell me about it.',
    submitLabel: 'Send message',
    sidebarTitle: "Let's talk about your next project",
    sidebarDescription: 'Available for software engineering and technical SEO consulting.',
    socialProofText: 'I usually reply within 48 hours.',
    contactInfo: [{ title: 'Email', value: 'hello@juan-tech.com' }],
  },
}

const clientLogosTitle: Record<Locale, string> = { es: 'Clientes', en: 'Clients' }
const featuredPostsTitle: Record<Locale, string> = { es: 'Artículos destacados', en: 'Featured Articles' }
const featuredCaseStudiesTitle: Record<Locale, string> = {
  es: 'Casos de éxito destacados',
  en: 'Featured Case Studies',
}
const servicesShowcaseTitle: Record<Locale, string> = { es: 'Cómo puedo ayudarte', en: 'How I Can Help' }

// ---------------------------------------------------------------------------
// id-reuse discipline (T-30-04) — mirrors the reapplyIds/upsertPage pattern
// documented in seed-phase19-service-pages.ts / seed-phase20-geo-pages.ts and
// standardized in 30-PATTERNS.md. Every block here already exists (no new
// rows are created), so this is a defense-in-depth pass on top of the
// per-locale fresh-fetch discipline below: it echoes back the ids captured
// from the reference layout onto the freshly-mutated layout, for both
// top-level blocks and the touched nested sub-arrays.
// ---------------------------------------------------------------------------
function reapplyIds(freshLayout: Block[], referenceLayout: Block[] | undefined): Block[] {
  if (!referenceLayout) return freshLayout
  return freshLayout.map((block, i) => {
    const ref = referenceLayout[i] as Block | undefined
    if (!ref || ref.blockType !== block.blockType) {
      if (ref) {
        console.warn(`reapplyIds: blockType mismatch at index ${i} (fresh=${block.blockType}, ref=${ref.blockType})`)
      }
      return block
    }
    const withId: Block = { ...block, id: ref.id }

    if (block.blockType === 'aboutSection') {
      const refFeatures = (ref.features as Block[] | undefined) ?? []
      const refParagraphs = (ref.paragraphs as Block[] | undefined) ?? []
      withId.features = ((block.features as Block[] | undefined) ?? []).map((f, idx) =>
        refFeatures[idx]?.id ? { ...f, id: refFeatures[idx].id } : f,
      )
      withId.paragraphs = ((block.paragraphs as Block[] | undefined) ?? []).map((p, idx) =>
        refParagraphs[idx]?.id ? { ...p, id: refParagraphs[idx].id } : p,
      )
    }

    if (block.blockType === 'faq') {
      const refFaqs = (ref.faqs as Block[] | undefined) ?? []
      withId.faqs = ((block.faqs as Block[] | undefined) ?? []).map((f, idx) =>
        refFaqs[idx]?.id ? { ...f, id: refFaqs[idx].id } : f,
      )
    }

    if (block.blockType === 'contactFormBlock') {
      const refContactInfo = (ref.contactInfo as Block[] | undefined) ?? []
      withId.contactInfo = ((block.contactInfo as Block[] | undefined) ?? []).map((c, idx) =>
        refContactInfo[idx]?.id ? { ...c, id: refContactInfo[idx].id } : c,
      )
    }

    if (block.blockType === 'callToAction') {
      const refLinks = (ref.links as Block[] | undefined) ?? []
      withId.links = ((block.links as Block[] | undefined) ?? []).map((l, idx) =>
        refLinks[idx]?.id ? { ...l, id: refLinks[idx].id } : l,
      )
    }

    if (block.blockType === 'hero') {
      const refLinks = (ref.links as Block[] | undefined) ?? []
      withId.links = ((block.links as Block[] | undefined) ?? []).map((l, idx) =>
        refLinks[idx]?.id ? { ...l, id: refLinks[idx].id } : l,
      )
    }

    return withId
  })
}

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = docs[0]

  if (!homeDoc) {
    console.error('No `home` Pages doc found by slug — cannot humanize. Aborting.')
    process.exit(1)
  }

  // Captured after the first locale's write-then-refetch, echoed back on
  // every subsequent locale write (T-30-04 discipline).
  let referenceLayout: Block[] | undefined

  for (const locale of LOCALES) {
    const doc = await payload.findByID({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      depth: 0,
    })

    const currentLayout = [...((doc.content?.layout ?? []) as Block[])]

    const mutated = currentLayout.map((block): Block => {
      switch (block.blockType) {
        case 'hero':
          return {
            ...block,
            title: heroCopy[locale].title,
            subtitle: heroCopy[locale].subtitle,
            links: ((block.links as Block[] | undefined) ?? []).map((l) => {
              const link = l.link as Block | undefined
              if (!link) return l
              return { ...l, link: { ...link, label: heroCtaLinkLabel[locale] } }
            }),
          }
        case 'aboutSection': {
          const copy = aboutCopy[locale]
          const existingParagraphs = (block.paragraphs as Block[] | undefined) ?? []
          const existingFeatures = (block.features as Block[] | undefined) ?? []
          return {
            ...block,
            eyebrow: copy.eyebrow,
            title: copy.title,
            ctaText: copy.ctaText,
            paragraphs: [{ ...existingParagraphs[0], text: copy.paragraph }],
            features: copy.features.map((f, i) => ({
              ...existingFeatures[i],
              title: f.title,
              description: f.description,
            })),
          }
        }
        case 'faq': {
          const copy = faqCopy[locale]
          const existingFaqs = (block.faqs as Block[] | undefined) ?? []
          return {
            ...block,
            title: copy.title,
            faqs: copy.faqs.map((f, i) => ({
              ...existingFaqs[i],
              question: f.question,
              answer: lexicalParagraph(f.answer),
            })),
          }
        }
        case 'callToAction':
          return {
            ...block,
            richText: lexicalParagraph(ctaRichTextCopy[locale]),
            links: ((block.links as Block[] | undefined) ?? []).map((l) => {
              const link = l.link as Block | undefined
              if (!link) return l
              return { ...l, link: { ...link, label: ctaLinksLabel[locale] } }
            }),
          }
        case 'contactFormBlock': {
          const copy = contactCopy[locale]
          const existingContactInfo = (block.contactInfo as Block[] | undefined) ?? []
          return {
            ...block,
            eyebrow: copy.eyebrow,
            title: copy.title,
            description: copy.description,
            submitLabel: copy.submitLabel,
            sidebarTitle: copy.sidebarTitle,
            sidebarDescription: copy.sidebarDescription,
            socialProofText: copy.socialProofText,
            contactInfo: existingContactInfo.map((c, i) => ({
              ...c,
              title: copy.contactInfo[i]?.title ?? c.title,
              value: copy.contactInfo[i]?.value ?? c.value,
            })),
          }
        }
        case 'clientLogosBlock':
          return { ...block, title: clientLogosTitle[locale] }
        case 'featuredPostsBlock':
          return { ...block, title: featuredPostsTitle[locale] }
        case 'featuredCaseStudiesBlock':
          return { ...block, title: featuredCaseStudiesTitle[locale] }
        case 'servicesShowcase':
          return { ...block, title: servicesShowcaseTitle[locale] }
        default:
          return block
      }
    })

    const withIds = reapplyIds(mutated, referenceLayout ?? currentLayout)

    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: withIds as any,
        },
      },
    })

    if (!referenceLayout) {
      const refetched = await payload.findByID({ collection: 'pages', id: homeDoc.id, depth: 0 })
      referenceLayout = (refetched.content?.layout ?? []) as Block[]
    }

    console.log(`Home page humanized (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
