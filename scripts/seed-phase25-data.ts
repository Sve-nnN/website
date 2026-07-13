/**
 * Phase 25 Plan 03 (Service-page visual polish, SVCPOL-01/02/05/06):
 *
 * Humanized bilingual copy for the 3 new content beats each of the 4
 * service landings gains in this plan: `pain` (the problem section that
 * justifies the existing "includes" copy), `scopeCard` (the new
 * ServiceScopeCard block's fields, never a price), and `caseStudyFraming`
 * (the new RelatedCaseStudyBlock's honest per-landing framing text).
 *
 * Deliberately dependency-free (no import from `src/lib/services-data.ts`),
 * mirroring the convention in `scripts/seed-phase19-data/types.ts`. The
 * shape is defined locally here as `ServiceLandingCopy`.
 *
 * Consumed by `scripts/seed-phase25-service-landings.ts`.
 *
 * This file holds the FINAL, humanized copy (both locales independently
 * passed through the humanizer skill per ~/.claude/skills/humanizer/SKILL.md,
 * no em/en dashes, no AI-writing tells, varied sentence rhythm).
 */

export type Locale = 'es' | 'en'

export interface ServiceLandingCopy {
  pain: {
    title: string
    paragraphs: string[]
  }
  scopeCard: {
    title?: string
    scope: string
    outcome: string
    timeline: string
  }
  caseStudyFraming: {
    title?: string
    framingText: string
  }
}

export type BilingualServiceLandingCopy = Record<Locale, ServiceLandingCopy>

export const serviceLandingCopy: Record<string, BilingualServiceLandingCopy> = {
  'seo-technical-audit': {
    es: {
      pain: {
        title: 'Tu sitio pierde tráfico y nadie te dice por qué',
        paragraphs: [
          'Los motores de búsqueda tratan mal a los sitios con errores técnicos silenciosos: crawl budget desperdiciado en URLs que no importan, JavaScript que tarda en renderizar, contenido que nunca llega a aparecer en el índice. Nada de esto se nota a simple vista navegando el sitio.',
          'Para cuando la caída de tráfico se ve en Search Console, el problema ya lleva semanas instalado. Sin un diagnóstico técnico real, es casi imposible saber si la causa es de rastreo, de renderizado, de indexación, o algo distinto por completo.',
        ],
      },
      scopeCard: {
        title: 'Alcance de esta auditoría',
        scope:
          'Diagnóstico completo de crawl budget, renderizado, Core Web Vitals e indexación, con los hallazgos ordenados por impacto real, no por orden alfabético.',
        outcome:
          'Un informe accionable que muestra qué está frenando tu posicionamiento y en qué orden conviene resolverlo, sin relleno.',
        timeline: '1 a 2 semanas',
      },
      caseStudyFraming: {
        title: 'Un caso real de cómo trabajo',
        framingText:
          'Todavía no tengo un caso publicado específico de auditorías técnicas, pero acá tenés un ejemplo real de cómo trabajo con clientes.',
      },
    },
    en: {
      pain: {
        title: "Losing traffic and nobody's telling you why",
        paragraphs: [
          "Search engines don't treat sites with silent technical issues kindly: wasted crawl budget on URLs that don't matter, JavaScript that takes too long to render, content that never quite makes it into the index. None of it shows up just from browsing the site.",
          "By the time the traffic drop shows up in Search Console, the problem has usually been sitting there for weeks. Without a real technical diagnostic, there's almost no way to tell if the cause is crawling, rendering, indexation, or something else altogether.",
        ],
      },
      scopeCard: {
        title: 'Scope of this audit',
        scope:
          "A full diagnostic of crawl budget, rendering, Core Web Vitals, and indexation, with findings ordered by real impact, not alphabetically.",
        outcome:
          "An actionable report showing what's holding back your rankings and the order to fix it in, with no filler.",
        timeline: '1 to 2 weeks',
      },
      caseStudyFraming: {
        title: 'A real example of how I work',
        framingText:
          "I don't have a published case study specific to technical audits yet, but here's a real look at how I work with clients.",
      },
    },
  },

  'seo-consulting': {
    es: {
      pain: {
        title: 'El informe envejece, el sitio no deja de cambiar',
        paragraphs: [
          'Un informe de auditoría queda desactualizado rápido. Un sitio que cambia todas las semanas, con releases, migraciones y ajustes de contenido, necesita a alguien monitoreando el impacto SEO de cada cambio, no una revisión que se hace una vez al año.',
          'La mayoría de los consultores de SEO solo hablan el idioma del contenido. Cuando el problema vive en el código, como una migración mal hecha o un deploy que rompió el renderizado, esas recomendaciones tienen que traducirse a alguien más, y ahí es donde se pierden semanas enteras.',
        ],
      },
      scopeCard: {
        title: 'Alcance de esta consultoría',
        scope:
          'Monitoreo continuo de Search Console, rankings y Core Web Vitals, con revisión de cada release que pueda afectar el SEO técnico antes de que salga a producción.',
        outcome:
          'Un roadmap técnico que se ajusta según los datos reales del sitio, en vez de un plan fijo que queda obsoleto al mes de escribirlo.',
        timeline: 'Continuo, ajustado a alcance',
      },
      caseStudyFraming: {
        title: 'Un caso real de cómo trabajo',
        framingText:
          'No tengo todavía un caso publicado de consultoría continua, pero este es un ejemplo real de cómo encaro el trabajo con clientes.',
      },
    },
    en: {
      pain: {
        title: 'The report goes stale, the site never stops changing',
        paragraphs: [
          "An audit report goes out of date fast. A site that changes every week, with releases, migrations, and content updates, needs someone tracking the SEO impact of each change, not a review that happens once a year.",
          "Most SEO consultants only speak the content side of the language. When the problem lives in the code, like a botched migration or a deploy that broke rendering, those recommendations need translating to someone else, and that's where whole weeks get lost.",
        ],
      },
      scopeCard: {
        title: 'Scope of this engagement',
        scope:
          'Ongoing monitoring of Search Console, rankings, and Core Web Vitals, with review of every release that could affect technical SEO before it ships.',
        outcome:
          "A technical roadmap that adjusts based on the site's real data, instead of a fixed plan that goes stale a month after it's written.",
        timeline: 'Ongoing, scoped per engagement',
      },
      caseStudyFraming: {
        title: 'A real example of how I work',
        framingText:
          "There isn't a published case study for ongoing consulting yet, but here's a genuine example of how I approach working with clients.",
      },
    },
  },

  'fullstack-development': {
    es: {
      pain: {
        title: 'El SEO que se agrega al final siempre deja un techo',
        paragraphs: [
          'Un sitio armado sobre un builder genérico y parchado con plugins de SEO llega con límites ya incorporados: JavaScript que bloquea el renderizado, imágenes sin optimizar, datos estructurados agregados a último momento sin entender el contenido real del sitio.',
          'Esos límites no se arreglan instalando otro plugin. Se arreglan diseñando la arquitectura, el modelo de contenido y el renderizado desde el principio, con el SEO adentro de esa decisión y no como una capa que se agrega encima después.',
        ],
      },
      scopeCard: {
        title: 'Alcance de este desarrollo',
        scope:
          'Desarrollo en Next.js con CMS headless, con el modelo de datos, el renderizado y los datos estructurados pensados juntos desde el primer commit.',
        outcome:
          'Un sitio con Core Web Vitals en rango bueno desde el lanzamiento, sin la deuda técnica de performance que suele aparecer recién meses después.',
        timeline: 'Continuo, ajustado a alcance',
      },
      caseStudyFraming: {
        title: 'Un caso real de cómo trabajo',
        framingText:
          'Este es el único caso publicado que tengo por ahora. No es específico de desarrollo full-stack, pero muestra bien cómo trabajo de punta a punta.',
      },
    },
    en: {
      pain: {
        title: 'SEO bolted on at the end always leaves a ceiling',
        paragraphs: [
          "A site built on a generic builder and patched with SEO plugins ships with limits already baked in: render-blocking JavaScript, unoptimized images, structured data added at the last minute without understanding the site's actual content.",
          "Those limits don't get fixed by installing another plugin. They get fixed by designing the architecture, the content model, and the rendering strategy from the start, with SEO inside that decision instead of stacked on top afterward.",
        ],
      },
      scopeCard: {
        title: 'Scope of this build',
        scope:
          'Next.js development with a headless CMS, where the data model, rendering, and structured data are worked out together from the first commit.',
        outcome:
          "A site with Core Web Vitals in the good range from launch, without the performance debt that usually shows up months later.",
        timeline: 'Ongoing, scoped per engagement',
      },
      caseStudyFraming: {
        title: 'A real example of how I work',
        framingText:
          "This is the only published case study I have right now. It isn't specific to full-stack builds, but it shows how I work end to end.",
      },
    },
  },

  'ai-seo-geo': {
    es: {
      pain: {
        title: 'Si tu contenido no es citable, la respuesta cita a otro',
        paragraphs: [
          'Cada vez más búsquedas terminan en una respuesta generada por IA sin que nadie haga clic en ningún resultado. Si tu contenido está disperso por la página, sin pasajes claros y autocontenidos, un sistema de IA no lo puede extraer ni citar.',
          'Escribir más contenido no resuelve esto. Lo que hace falta es reorganizar lo que ya existe, de modo que quede legible tanto para buscadores tradicionales como para los motores de respuesta que están cambiando cómo la gente busca.',
        ],
      },
      scopeCard: {
        title: 'Alcance de este trabajo',
        scope:
          'Estructuración del contenido para que sea citable, más la implementación y el mantenimiento de un manifiesto legible por máquinas (`llms.txt`/`llms-full.txt`).',
        outcome:
          'Contenido con más probabilidad de aparecer citado en respuestas de ChatGPT, Perplexity y Google AI Overviews, no solo indexado.',
        timeline: '2 a 3 semanas',
      },
      caseStudyFraming: {
        title: 'Un caso real de cómo trabajo',
        framingText:
          'Todavía no armé un caso específico de GEO, así que te muestro el único caso real que sí tengo publicado, como referencia de cómo trabajo.',
      },
    },
    en: {
      pain: {
        title: "If your content isn't citable, someone else gets the mention",
        paragraphs: [
          "More and more searches end in an AI-generated answer with no click on any result at all. If your content is scattered across the page, without clear, self-contained passages, an AI system can't pull it out or cite it.",
          "More content isn't the fix. The fix is restructuring what already exists so it's readable by both traditional search engines and the answer engines that are changing how people search.",
        ],
      },
      scopeCard: {
        title: 'Scope of this work',
        scope:
          'Structuring content to be citable, plus implementing and maintaining a machine-readable manifest (`llms.txt`/`llms-full.txt`).',
        outcome:
          "Content with a better shot at getting cited in ChatGPT, Perplexity, and Google AI Overviews answers, not just indexed.",
        timeline: '2 to 3 weeks',
      },
      caseStudyFraming: {
        title: 'A real example of how I work',
        framingText:
          "I haven't put together a GEO-specific case study yet, so here's the one real case study I do have published, as a reference for how I work.",
      },
    },
  },
}
