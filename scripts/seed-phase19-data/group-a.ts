import type { BilingualIndexCopy, BilingualServiceCopy } from './types'

export const indexPageCopy: BilingualIndexCopy = {
  es: {
    hero: {
      title: 'Servicios',
      subtitle:
        'Auditoría técnica, consultoría continua y desarrollo full-stack con SEO integrado desde el código — no SEO parchado encima de un sitio que ya lo dificulta.',
    },
    services: [
      {
        slug: 'seo-technical-audit',
        name: 'Auditoría SEO Técnica',
        description:
          'Diagnóstico a fondo de crawl budget, renderizado, indexación y Core Web Vitals, con hallazgos priorizados por impacto real.',
      },
      {
        slug: 'seo-consulting',
        name: 'Consultoría SEO',
        description:
          'Acompañamiento continuo para equipos que necesitan una estrategia técnica sostenida, no un informe puntual que nadie implementa.',
      },
      {
        slug: 'fullstack-development',
        name: 'Desarrollo Full-Stack con SEO integrado',
        description:
          'Construcción de sitios en Next.js y CMS headless donde el SEO se diseña en la arquitectura, no se agrega después.',
      },
      {
        slug: 'ai-seo-geo',
        name: 'SEO para IA / GEO',
        description:
          'Estructuro el contenido para que los motores de respuesta con IA (ChatGPT, Perplexity, Google AI Overviews) puedan citarte.',
      },
    ],
    ctaText:
      '¿No estás seguro de cuál servicio necesitás? Contame qué problema tenés y te digo por dónde empezar.',
    ctaLinkLabel: 'Hablemos',
  },
  en: {
    hero: {
      title: 'Services',
      subtitle:
        'Technical audits, ongoing consulting, and full-stack development with SEO built into the code — not bolted onto a site that already fights against it.',
    },
    services: [
      {
        slug: 'seo-technical-audit',
        name: 'Technical SEO Audit',
        description:
          'A deep diagnostic of crawl budget, rendering, indexation, and Core Web Vitals, with findings prioritized by real impact.',
      },
      {
        slug: 'seo-consulting',
        name: 'SEO Consulting',
        description:
          'Ongoing support for teams that need a sustained technical strategy, not a one-off report nobody implements.',
      },
      {
        slug: 'fullstack-development',
        name: 'Full-Stack Development with SEO Built In',
        description:
          'Next.js and headless CMS builds where SEO is designed into the architecture, not added after launch.',
      },
      {
        slug: 'ai-seo-geo',
        name: 'AI SEO / GEO',
        description:
          'I structure content so AI answer engines (ChatGPT, Perplexity, Google AI Overviews) can cite you.',
      },
    ],
    ctaText:
      "Not sure which service fits? Tell me what's broken and I'll tell you where to start.",
    ctaLinkLabel: "Let's talk",
  },
}

export const auditServiceCopy: BilingualServiceCopy = {
  es: {
    slug: 'seo-technical-audit',
    hero: {
      title: 'Auditoría SEO Técnica',
      subtitle:
        'Si tu sitio pierde crawl budget en URLs que no importan, renderiza contenido que Google nunca ve a tiempo, o tiene gaps de indexación que nadie detectó, ninguna estrategia de contenido va a compensar eso.',
    },
    includes: {
      title: 'Qué incluye',
      paragraphs: [
        'Análisis de crawl budget y arquitectura de la información: qué está rastreando Google, qué debería rastrear, y dónde se está desperdiciando presupuesto de rastreo en páginas de bajo valor.',
        'Diagnóstico de renderizado: diferencias entre lo que sirve el servidor y lo que Google indexa realmente, con foco en JavaScript crítico y contenido que carga tarde.',
        'Core Web Vitals medidos en condiciones reales (no solo síntesis), con causas raíz identificadas en el código, no solo el síntoma reportado por PageSpeed.',
        'Revisión de indexación: canonicalización, robots.txt, sitemaps, y páginas huérfanas que nunca reciben enlaces internos.',
        'Auditoría de datos estructurados (schema.org) contra lo que Google realmente consume para rich results.',
      ],
    },
    process: {
      title: 'Cómo trabajo',
      paragraphs: [
        'La auditoría no termina en un PDF que nadie lee. Entrego hallazgos priorizados por impacto real y esfuerzo de implementación, no una lista de 200 ítems sin orden.',
        'Como también soy desarrollador, puedo implementar las correcciones directamente en tu código en vez de solo señalarlas — cubro tanto el diagnóstico como la solución, cuando el proyecto lo requiere.',
      ],
    },
    faqs: [
      {
        question: '¿Cuánto dura una auditoría técnica?',
        answer:
          'Depende del tamaño del sitio, pero un sitio de tamaño medio (hasta unas 500 URLs indexables) suele tomar entre 1 y 2 semanas, desde el acceso a las herramientas hasta la entrega del informe priorizado.',
      },
      {
        question: '¿Entregan solo el informe o también implementan las correcciones?',
        answer:
          'Las dos opciones existen. Por defecto entrego un informe priorizado y accionable para que tu equipo lo implemente. Si preferís que yo mismo implemente las correcciones en el código, lo conversamos como una extensión del alcance — no hace falta contratar a otra persona para la parte técnica.',
      },
      {
        question: '¿Qué herramientas usás?',
        answer:
          'Combino crawlers técnicos, Google Search Console y Analytics, Lighthouse/CrUX para Core Web Vitals en campo, y revisión manual de código para los casos que las herramientas automatizadas no detectan (sobre todo problemas de renderizado en frameworks JS).',
      },
      {
        question: '¿La auditoría sirve si mi sitio no está construido por mí?',
        answer:
          'Sí. La mayoría de las auditorías que hago son sobre sitios que no construí yo. El diagnóstico es agnóstico de stack; la implementación de las correcciones depende de qué tan accesible sea tu codebase.',
      },
    ],
    ctaText:
      'Si sospechás que tenés un problema técnico y no sabés exactamente cuál, empecemos por ahí.',
    ctaLinkLabel: 'Pedir una auditoría',
  },
  en: {
    slug: 'seo-technical-audit',
    hero: {
      title: 'Technical SEO Audit',
      subtitle:
        "If your site burns crawl budget on URLs that don't matter, renders content Google never sees in time, or has indexation gaps nobody caught, no content strategy is going to make up for that.",
    },
    includes: {
      title: "What's included",
      paragraphs: [
        "Crawl budget and information architecture analysis: what Google is actually crawling, what it should be crawling, and where crawl budget is being wasted on low-value pages.",
        'Rendering diagnostics: the gap between what the server serves and what Google actually indexes, with a focus on render-blocking JavaScript and late-loading content.',
        'Core Web Vitals measured under real conditions (not just lab synthesis), with root causes traced back to the code, not just the symptom PageSpeed reports.',
        'Indexation review: canonicalization, robots.txt, sitemaps, and orphaned pages that never receive internal links.',
        "Structured data (schema.org) audited against what Google actually consumes for rich results.",
      ],
    },
    process: {
      title: 'How I work',
      paragraphs: [
        "The audit doesn't end at a PDF nobody reads. I deliver findings prioritized by real impact and implementation effort, not a 200-item list with no order.",
        "Since I'm also a developer, I can implement the fixes directly in your codebase instead of just pointing at them — covering both the diagnosis and the fix, when the project calls for it.",
      ],
    },
    faqs: [
      {
        question: 'How long does a technical audit take?',
        answer:
          'It depends on the size of the site, but a mid-sized site (up to around 500 indexable URLs) usually takes 1 to 2 weeks, from tool access to the prioritized report.',
      },
      {
        question: 'Do you just hand off a report, or do you also implement the fixes?',
        answer:
          "Both options exist. By default I deliver a prioritized, actionable report for your team to implement. If you'd rather I implement the fixes in the code myself, we scope that as an extension — no need to bring in a separate developer for the technical part.",
      },
      {
        question: 'What tools do you use?',
        answer:
          "A mix of technical crawlers, Google Search Console and Analytics, Lighthouse/CrUX for field Core Web Vitals, and manual code review for the cases automated tools miss — mostly rendering issues in JS frameworks.",
      },
      {
        question: "Does the audit work if I didn't build my own site?",
        answer:
          "Yes. Most audits I run are on sites I didn't build. The diagnosis is stack-agnostic; implementing the fixes depends on how accessible your codebase is.",
      },
    ],
    ctaText:
      "If you suspect there's a technical problem and can't pinpoint it, let's start there.",
    ctaLinkLabel: 'Request an audit',
  },
}

export const consultingServiceCopy: BilingualServiceCopy = {
  es: {
    slug: 'seo-consulting',
    hero: {
      title: 'Consultoría SEO',
      subtitle:
        'Una auditoría puntual detecta el problema de hoy. Un sitio que crece necesita a alguien monitoreando, priorizando y ajustando la estrategia técnica de forma continua, no una foto tomada una vez al año.',
    },
    includes: {
      title: 'Qué incluye',
      paragraphs: [
        'Estrategia técnica continua: roadmap priorizado que se ajusta según lo que muestran los datos, no un plan fijo escrito una sola vez.',
        'Monitoreo de Search Console, rankings y Core Web Vitals en el tiempo, detectando regresiones antes de que se conviertan en caídas de tráfico.',
        'Colaboración directa con tu equipo de desarrollo y marketing — hablo el idioma técnico de ambos, algo poco común en consultores que solo conocen el lado de contenido.',
        'Revisión de cada release/deploy con potencial impacto en SEO (cambios de arquitectura, migraciones, rediseños) antes de que salga a producción, no después.',
      ],
    },
    process: {
      title: 'Cómo trabajo',
      paragraphs: [
        'La cadencia se define según el tamaño y la velocidad de cambio del sitio — desde revisiones mensuales hasta acompañamiento semanal en proyectos con releases frecuentes.',
        'Cada ciclo entrega hallazgos priorizados y un reporte claro de qué cambió, qué se implementó y qué impacto tuvo — nada de dashboards que nadie interpreta.',
        'Como también desarrollo (Next.js, CMS headless), puedo revisar pull requests o implementar directamente los cambios técnicos, no solo recomendarlos.',
      ],
    },
    faqs: [
      {
        question: '¿Cómo se estructura un contrato de consultoría continua?',
        answer:
          'Se define una cadencia (mensual, quincenal o semanal según la necesidad) con un alcance claro de qué se revisa en cada ciclo. No es un contrato abierto sin objetivos — cada ciclo tiene entregables concretos y se puede ajustar el alcance con el tiempo.',
      },
      {
        question: '¿En qué se diferencia de la auditoría técnica?',
        answer:
          'La auditoría es un diagnóstico puntual con foco en un momento específico. La consultoría es continua: monitoreo, ajuste de prioridades y revisión de cambios en el tiempo, para sitios que evolucionan constantemente y no pueden depender de una foto tomada una sola vez.',
      },
      {
        question: '¿Trabajás directamente con mi equipo de desarrollo?',
        answer:
          'Sí, y es donde más valor aporto frente a un consultor tradicional. Al ser también desarrollador full-stack, puedo revisar código, participar en decisiones de arquitectura, o implementar cambios yo mismo, en vez de limitarme a entregar recomendaciones que el equipo de dev tiene que traducir.',
      },
      {
        question: '¿Cuál es el compromiso mínimo?',
        answer:
          'Depende del proyecto — lo conversamos según el estado actual del sitio y la velocidad de cambio esperada. No hay un paquete fijo: la cotización se arma a medida después de entender el contexto.',
      },
    ],
    ctaText:
      'Si tu sitio cambia constantemente y necesitás que alguien vigile el SEO técnico de forma continua, hablemos de cómo estructurar el acompañamiento.',
    ctaLinkLabel: 'Conversar sobre consultoría',
  },
  en: {
    slug: 'seo-consulting',
    hero: {
      title: 'SEO Consulting',
      subtitle:
        "A one-off audit catches today's problem. A growing site needs someone monitoring, prioritizing, and adjusting the technical strategy continuously — not a snapshot taken once a year.",
    },
    includes: {
      title: "What's included",
      paragraphs: [
        "Ongoing technical strategy: a prioritized roadmap that adjusts based on what the data shows, not a fixed plan written once.",
        'Search Console, rankings, and Core Web Vitals monitoring over time, catching regressions before they turn into traffic drops.',
        "Direct collaboration with your dev and marketing teams — I speak both technical languages, which is uncommon among consultants who only know the content side.",
        'Review of every release/deploy with potential SEO impact (architecture changes, migrations, redesigns) before it ships, not after.',
      ],
    },
    process: {
      title: 'How I work',
      paragraphs: [
        'Cadence is set based on the site\'s size and rate of change — from monthly reviews to weekly involvement on projects with frequent releases.',
        "Every cycle delivers prioritized findings and a clear report of what changed, what got implemented, and what impact it had — no dashboards nobody interprets.",
        "Since I also build (Next.js, headless CMS), I can review pull requests or implement the technical changes directly, not just recommend them.",
      ],
    },
    faqs: [
      {
        question: 'How is an ongoing consulting engagement structured?',
        answer:
          "We set a cadence (monthly, biweekly, or weekly depending on need) with a clear scope for what gets reviewed each cycle. It's not an open-ended contract with no goals — every cycle has concrete deliverables, and scope can adjust over time.",
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
          "It depends on the project — we figure it out based on the site's current state and expected rate of change. There's no fixed package: the quote is scoped after understanding the context.",
      },
    ],
    ctaText:
      "If your site changes constantly and you need someone watching technical SEO on an ongoing basis, let's talk about how to structure it.",
    ctaLinkLabel: 'Talk about consulting',
  },
}
