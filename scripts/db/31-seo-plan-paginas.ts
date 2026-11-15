/**
 * Reescribe las tres landings de servicio, las descripciones de los hubs del
 * blog y el pie del sitio (plan SEO de pilares, research/seo-plan-2026-11/).
 *
 *   ./scripts/db/run-tunneled.sh scripts/db/31-seo-plan-paginas.ts            # dry-run
 *   ./scripts/db/run-tunneled.sh scripts/db/31-seo-plan-paginas.ts --apply
 *   ./scripts/db/run-tunneled.sh scripts/db/31-seo-plan-paginas.ts --apply --step=pages|categories|footer
 *
 * ── Qué cambia ───────────────────────────────────────────────────────────────
 * pages        hero, bloques de texto, casos reales con cifras, guías relacionadas,
 *              FAQ, meta title y meta description de seo-consulting,
 *              seo-technical-audit y ai-seo-geo, en español e inglés. La
 *              auditoría suma "desde 600 USD" y la garantía acordada.
 * categories   `description` de las categorías seo y tech-seo (es la meta
 *              description del hub y su texto de introducción).
 * footer       "Últimos artículos" (los 5 más recientes, que fijaban la
 *              autoridad en lo último publicado) pasa a una columna fija de
 *              guías clave. "Últimos casos de éxito" se queda.
 *
 * Nada se borra del contenido: las páginas se actualizan sobre el mismo doc con
 * `draft: false`. El único borrado es la fila `latestPosts` del array
 * `dynamicColumns` del pie, y se guarda un backup en
 * research/seo-plan-2026-11/data/backup-*.json antes de tocarla.
 *
 * Trampas evitadas: `slug` explícito en todo update de `pages`, `draft: false`,
 * `fallbackLocale: false` al leer, y verificación contra el HTML servido (el
 * script imprime qué comprobar; las escrituras no invalidan caché antes de 60 s).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { EN_TRANSLATION_INCOMPLETE } from '../../src/lib/translation-gaps'

const APPLY = process.argv.includes('--apply')
const STEP = process.argv.find((a) => a.startsWith('--step='))?.split('=')[1] ?? 'all'
const DATA = 'research/seo-plan-2026-11/data'
const want = (s: string) => STEP === 'all' || STEP === s
type L = 'es' | 'en'
type Anyobj = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

// ── Lexical ───────────────────────────────────────────────────────────────────

const text = (t: string, bold = false) => ({
  type: 'text', text: t, version: 1, detail: 0, format: bold ? 1 : 0, mode: 'normal', style: '',
})

function inline(src: string, tpl: Anyobj | null): unknown[] {
  const out: unknown[] = []
  for (const part of src.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/).filter(Boolean)) {
    const b = part.match(/^\*\*([^*]+)\*\*$/)
    const a = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (b) out.push(text(b[1], true))
    else if (a)
      out.push({
        type: 'link',
        version: tpl?.version ?? 3,
        direction: 'ltr',
        format: '',
        indent: 0,
        fields: { ...(tpl?.fields ?? {}), url: a[2], newTab: false, linkType: 'custom' },
        children: [text(a[1])],
      })
    else out.push(text(part))
  }
  return out
}

type Spec = ['h2' | 'h3' | 'p', string] | ['ul' | 'ol', string[]]

function lexical(spec: Spec[], tpl: Anyobj | null) {
  const base = { version: 1, direction: 'ltr', format: '', indent: 0 }
  const children = spec.map(([kind, v]) => {
    if (kind === 'h2' || kind === 'h3')
      return { type: 'heading', tag: kind, ...base, children: inline(v as string, tpl) }
    if (kind === 'p') return { type: 'paragraph', ...base, textFormat: 0, children: inline(v as string, tpl) }
    return {
      type: 'list',
      listType: kind === 'ul' ? 'bullet' : 'number',
      tag: kind,
      start: 1,
      ...base,
      children: (v as string[]).map((item, i) => ({
        type: 'listitem', value: i + 1, ...base, children: inline(item, tpl),
      })),
    }
  })
  return { root: { type: 'root', ...base, children } }
}

function findLinkTemplate(node: unknown): Anyobj | null {
  if (Array.isArray(node)) {
    for (const c of node) {
      const r = findLinkTemplate(c)
      if (r) return r
    }
    return null
  }
  if (!node || typeof node !== 'object') return null
  const n = node as Anyobj
  if (n.type === 'link' && n.fields) return n
  for (const v of Object.values(n)) {
    const r = findLinkTemplate(v)
    if (r) return r
  }
  return null
}

// ── Contenido ─────────────────────────────────────────────────────────────────

const u = (l: L, p: string) => (l === 'en' ? `/en${p}` : p)
const svc = (l: L, slug: string) => (l === 'en' ? `/en/services/${slug}` : `/servicios/${slug}`)

/** Guía → [categoría, anclaje es, anclaje en]. */
const GUIDES: Record<string, [string, string, string]> = {
  'estrategia-seo': ['seo', 'estrategia SEO', 'SEO strategy'],
  'canibalizacion-seo': ['seo', 'canibalización SEO', 'SEO cannibalization'],
  'enlaces-internos-guia': ['seo', 'enlaces internos', 'internal linking'],
  'topic-clusters-seo': ['seo', 'topic clusters', 'topic clusters'],
  'guia-eeat': ['seo', 'E-E-A-T', 'E-E-A-T'],
  'technical-seo-guide': ['tech-seo', 'SEO técnico para desarrolladores', 'technical SEO for developers'],
  'technical-seo-checklist': ['tech-seo', 'checklist de SEO técnico', 'technical SEO checklist'],
  'core-web-vitals-guide': ['tech-seo', 'Core Web Vitals', 'Core Web Vitals'],
  'auditoria-seo': ['tech-seo', 'cómo hacer una auditoría SEO', 'how to run an SEO audit'],
  'structured-data-seo': ['tech-seo', 'datos estructurados', 'structured data'],
}

function guideList(l: L, slugs: string[]): string[] {
  return slugs
    .filter((s) => l === 'es' || !EN_TRANSLATION_INCOMPLETE.has(s))
    .map((s) => `[${GUIDES[s][l === 'es' ? 1 : 2]}](${u(l, `/blog/${GUIDES[s][0]}/${s}`)})`)
}

type PageSpec = {
  metaTitle: string
  metaDescription: string
  heroTitle: string
  heroSubtitle: string
  why: Spec[]
  /** columnas del bloque "Qué incluye" */
  columns: Spec[][]
  cases: Array<{ slug: string; title: string; framing: string }>
  guides?: { title: string; slugs: string[] }
  price?: Spec[]
  faqReplace?: Record<number, { q: string; a: Spec[] }>
  faqAppend: Array<{ q: string; a: Spec[] }>
}

function pageSpec(slug: string, l: L): PageSpec {
  const es = l === 'es'
  if (slug === 'seo-consulting')
    return {
      metaTitle: es ? 'Consultor SEO técnico para equipos con desarrollo propio' : 'Technical SEO consultant for teams with in-house development',
      metaDescription: es
        ? 'Soy consultor SEO y también programo. Reviso cada release antes de que salga y corrijo el código cuando hace falta. Casos con hasta +309% de clics.'
        : 'I am an SEO consultant who also codes. I review every release before it ships and fix the code when needed. Cases with up to +309% clicks.',
      heroTitle: es ? 'Consultor SEO técnico' : 'Technical SEO consultant',
      heroSubtitle: es
        ? 'Cuando el problema de SEO vive en el código, un consultor que solo habla de contenido te deja una lista de tareas que alguien más tiene que traducir. Yo reviso el sitio, hablo directo con tu equipo de desarrollo y, si hace falta, abro el pull request.'
        : 'When the SEO problem lives in the code, a consultant who only talks about content leaves you a task list someone else has to translate. I review the site, talk directly to your development team and, when needed, open the pull request.',
      why: es
        ? [
            ['h2', 'Por qué un informe único no alcanza'],
            ['p', 'Un informe de auditoría envejece en cuanto el sitio cambia. Cada lanzamiento, cada migración y cada ajuste de plantilla mueve algo en el rastreo, el renderizado o la indexación. Si nadie mira ese impacto semana a semana, el tráfico cae primero y la explicación llega después.'],
          ]
        : [
            ['h2', 'Why a one-off report is not enough'],
            ['p', 'An audit report goes stale the moment the site changes. Every launch, migration and template tweak moves something in crawling, rendering or indexing. If nobody watches that impact week by week, traffic drops first and the explanation arrives later.'],
          ],
      columns: es
        ? [
            [
              ['h2', 'Qué incluye la consultoría'],
              ['ul', [
                'Un roadmap técnico priorizado por impacto, que cambia en cada ciclo según lo que muestran Search Console y tus propios datos.',
                'Monitoreo de Search Console, rankings y Core Web Vitals para detectar regresiones antes de que se vean en el tráfico.',
                'Revisión de cada release o deploy con efecto posible en SEO, antes de que salga a producción.',
                'Trabajo directo con tu equipo de desarrollo y con el de marketing, sin intermediarios.',
                'Implementación de los cambios en Next.js o en tu CMS headless cuando prefieres que los haga yo.',
              ]],
            ],
            [
              ['h2', 'Cómo trabajo cada ciclo'],
              ['ol', [
                'Fijamos la cadencia según el tamaño del sitio y la velocidad de cambio: desde revisiones mensuales hasta acompañamiento semanal.',
                'Cada ciclo termina con hallazgos priorizados y un reporte corto: qué cambió, qué se implementó y qué efecto tuvo. Sin dashboards que nadie interpreta.',
                'Reviso pull requests o los escribo yo, así la recomendación no se pierde entre equipos.',
              ]],
            ],
          ]
        : [
            [
              ['h2', 'What the consulting covers'],
              ['ul', [
                'A technical roadmap prioritized by impact, adjusted every cycle based on what Search Console and your own data show.',
                'Monitoring of Search Console, rankings and Core Web Vitals to catch regressions before they show up in traffic.',
                'Review of every release or deploy that could affect SEO, before it goes to production.',
                'Direct work with your development and marketing teams, with no go-betweens.',
                'Implementation of the changes in Next.js or your headless CMS when you prefer that I do them.',
              ]],
            ],
            [
              ['h2', 'How I work each cycle'],
              ['ol', [
                'We set the cadence by site size and speed of change, from monthly reviews to weekly support.',
                'Each cycle ends with prioritized findings and a short report: what changed, what shipped and what effect it had. No dashboards nobody reads.',
                'I review pull requests or write them myself, so the recommendation does not get lost between teams.',
              ]],
            ],
          ],
      cases: es
        ? [
            { slug: 'pittsburgh-criminal-defense-legal-content-seo', title: 'Resultados reales con clientes', framing: 'Despacho de defensa criminal en Pittsburgh: +83% de clics interanuales y 86.000 clics orgánicos en 12 meses (Search Console, julio de 2025 a junio de 2026).' },
            { slug: 'immigration-law-atlanta-seo', title: 'Despacho de inmigración en Atlanta', framing: '+309% de clics interanuales y 39.323 clics orgánicos en el año.' },
            { slug: 'fabricante-baldosa-hidraulica-seo-espana', title: 'Fabricante de baldosas hidráulicas en España', framing: '+143% de clics interanuales en un sitio que competía por consultas genéricas de alto volumen.' },
          ]
        : [
            { slug: 'pittsburgh-criminal-defense-legal-content-seo', title: 'Real results with clients', framing: 'Criminal defense firm in Pittsburgh: +83% year over year clicks and 86,000 organic clicks in 12 months (Search Console, July 2025 to June 2026).' },
            { slug: 'immigration-law-atlanta-seo', title: 'Immigration law firm in Atlanta', framing: '+309% year over year clicks and 39,323 organic clicks in the year.' },
            { slug: 'fabricante-baldosa-hidraulica-seo-espana', title: 'Hydraulic tile manufacturer in Spain', framing: '+143% year over year clicks on a site competing for generic high volume queries.' },
          ],
      guides: { title: es ? 'Guías para ir preparando el terreno' : 'Guides to prepare the ground', slugs: ['estrategia-seo', 'canibalizacion-seo', 'enlaces-internos-guia', 'topic-clusters-seo'] },
      faqAppend: es
        ? [
            { q: '¿Cuánto tarda en notarse el resultado?', a: [['p', 'Depende del punto de partida del sitio. Los casos publicados miden 12 meses, y por eso no prometo plazos más cortos. Lo que sí hago es medir cada ciclo para que veas el efecto de cada cambio.']] },
            { q: '¿Cuánto cuesta la consultoría?', a: [['p', 'Depende de la cadencia y del tamaño del sitio. Te doy una cifra por escrito después de una llamada sin costo, para que no pagues por un alcance que no necesitas.']] },
          ]
        : [
            { q: 'How long until I see results?', a: [['p', 'It depends on where the site starts. The published cases measure 12 months, so I do not promise shorter timelines. What I do is measure every cycle so you see the effect of each change.']] },
            { q: 'How much does the consulting cost?', a: [['p', 'It depends on the cadence and the size of the site. I give you a figure in writing after a free call, so you do not pay for scope you do not need.']] },
          ],
    }

  if (slug === 'seo-technical-audit')
    return {
      metaTitle: es ? 'Auditoría SEO técnica con plan priorizado' : 'Technical SEO audit with a prioritized plan',
      metaDescription: es
        ? 'Auditoría SEO técnica de rastreo, renderizado, Core Web Vitals e indexación, con hallazgos ordenados por impacto. Puedo corregirlo en tu código.'
        : 'Technical SEO audit covering crawling, rendering, Core Web Vitals and indexing, with findings ranked by impact. I can fix it in your code.',
      heroTitle: es ? 'Auditoría SEO técnica' : 'Technical SEO audit',
      heroSubtitle: es
        ? 'Si Google rastrea URLs que no importan, tarda en renderizar tu contenido o deja huecos de indexación que nadie detectó, ninguna estrategia de contenido lo compensa. La auditoría te dice cuál de esos problemas tienes y en qué orden conviene resolverlo.'
        : 'If Google crawls URLs that do not matter, takes too long to render your content or leaves indexing gaps nobody noticed, no content strategy makes up for it. The audit tells you which of those problems you have and in what order to fix them.',
      why: es
        ? [
            ['h2', 'Por qué tu tráfico baja y nadie sabe explicarlo'],
            ['p', 'Los errores técnicos silenciosos no se ven al navegar el sitio: presupuesto de rastreo gastado en URLs sin valor, JavaScript que tarda en renderizar, contenido que nunca entra al índice. Cuando la caída aparece en Search Console, el problema ya lleva semanas instalado. Sin un diagnóstico técnico real es casi imposible saber si falla el rastreo, el renderizado o la indexación.'],
          ]
        : [
            ['h2', 'Why your traffic drops and nobody can explain it'],
            ['p', 'Silent technical errors do not show when you browse the site: crawl budget spent on worthless URLs, JavaScript that renders late, content that never reaches the index. By the time the drop shows up in Search Console, the problem has been there for weeks. Without a real technical diagnosis it is almost impossible to tell whether crawling, rendering or indexing is failing.'],
          ],
      columns: es
        ? [
            [
              ['h2', 'Qué revisa la auditoría'],
              ['ul', [
                '**Rastreo y arquitectura:** qué rastrea Google hoy, qué debería rastrear y en qué páginas de poco valor se gasta ese presupuesto.',
                '**Renderizado:** la diferencia entre lo que sirve el servidor y lo que Google indexa, con foco en JavaScript crítico y contenido que carga tarde.',
                '**Core Web Vitals en campo:** mediciones en condiciones reales y la causa raíz en el código, no solo el síntoma que reporta PageSpeed.',
                '**Indexación:** canonicalización, robots.txt, sitemaps y páginas huérfanas que nunca reciben enlaces internos.',
                '**Datos estructurados:** el schema que emites contra el que Google usa de verdad para mostrar resultados enriquecidos.',
              ]],
            ],
            [
              ['h2', 'Qué recibes y cuánto tarda'],
              ['p', 'Un informe con los hallazgos ordenados por impacto y esfuerzo, no una lista de doscientos ítems sin orden. Un sitio de hasta 500 URLs indexables toma entre una y dos semanas, desde que tengo acceso a las herramientas hasta la entrega. Si prefieres que corrija yo el código, lo acordamos como extensión del alcance.'],
            ],
          ]
        : [
            [
              ['h2', 'What the audit reviews'],
              ['ul', [
                '**Crawling and architecture:** what Google crawls today, what it should crawl and which low value pages waste that budget.',
                '**Rendering:** the gap between what the server sends and what Google indexes, focused on critical JavaScript and late loading content.',
                '**Field Core Web Vitals:** measurements under real conditions and the root cause in the code, not just the symptom PageSpeed reports.',
                '**Indexing:** canonicalization, robots.txt, sitemaps and orphan pages that never receive internal links.',
                '**Structured data:** the schema you emit against what Google actually uses to show rich results.',
              ]],
            ],
            [
              ['h2', 'What you get and how long it takes'],
              ['p', 'A report with findings ordered by impact and effort, not a list of two hundred items in no order. A site of up to 500 indexable URLs takes one to two weeks, from the moment I get access to the tools until delivery. If you prefer that I fix the code, we agree on it as an extension of the scope.'],
            ],
          ],
      price: es
        ? [
            ['h2', 'Cuánto cuesta y qué te garantizo'],
            ['p', '**Desde 600 USD**, acreditables al 100% si después contratas la implementación. El monto final depende del tamaño del sitio y se confirma por escrito después de una llamada sin costo.'],
            ['ul', [
              'Si la auditoría no encuentra al menos 3 hallazgos críticos que se puedan implementar, te devuelvo los 600 USD.',
              'Si la corrección que contrates supera el tope de horas acordado por escrito, las horas extra las pongo yo.',
            ]],
            ['p', 'Para pedir una cotización usa el botón de abajo. Respondo en un día hábil.'],
          ]
        : [
            ['h2', 'What it costs and what I guarantee'],
            ['p', '**From 600 USD**, credited 100% if you later hire the implementation. The final amount depends on the size of the site and is confirmed in writing after a free call.'],
            ['ul', [
              'If the audit does not find at least 3 critical, implementable findings, I refund the 600 USD.',
              'If the fix you hire goes over the hour cap agreed in writing, I cover the extra hours.',
            ]],
            ['p', 'To request a quote use the button below. I reply within one business day.'],
          ],
      cases: es
        ? [{ slug: 'migracion-ecommerce-nextjs-seo-tecnico', title: 'Un caso real de auditoría y migración', framing: 'Una tienda online con más de 4.000 productos migró a Next.js. Antes de tocar nada audité el sitio: el LCP móvil pasaba de 4 segundos y la migración cambiaba la URL de miles de páginas. Resultado: +68% de tráfico orgánico, 62% de mejora en el LCP móvil y cero semanas de caída.' }]
        : [{ slug: 'migracion-ecommerce-nextjs-seo-tecnico', title: 'A real audit and migration case', framing: 'An online store with more than 4,000 products moved to Next.js. Before touching anything I audited the site: mobile LCP was over 4 seconds and the migration changed the URL of thousands of pages. Result: +68% organic traffic, 62% better mobile LCP and zero weeks of decline.' }],
      guides: { title: es ? 'Guías para entender el informe' : 'Guides to understand the report', slugs: ['technical-seo-guide', 'technical-seo-checklist', 'core-web-vitals-guide', 'auditoria-seo'] },
      faqAppend: es
        ? [{ q: '¿Cuánto cuesta la auditoría?', a: [['p', 'Desde 600 USD, acreditables al 100% si después contratas la implementación. Te confirmo el monto final por escrito después de una llamada sin costo. Incluye una garantía: si no encuentro al menos 3 hallazgos críticos que se puedan implementar, te devuelvo el dinero.']] }]
        : [{ q: 'How much does the audit cost?', a: [['p', 'From 600 USD, credited 100% if you later hire the implementation. I confirm the final amount in writing after a free call. It includes a guarantee: if I do not find at least 3 critical, implementable findings, I refund the money.']] }],
    }

  // ai-seo-geo
  return {
    metaTitle: es ? 'GEO SEO para que ChatGPT y Perplexity citen tu sitio' : 'GEO SEO so ChatGPT and Perplexity cite your site',
    metaDescription: es
      ? 'GEO SEO: estructuro tu contenido para que ChatGPT, Perplexity y Google AI Overviews lo citen, con llms.txt y datos estructurados.'
      : 'GEO SEO: I structure your content so ChatGPT, Perplexity and Google AI Overviews cite it, using llms.txt and structured data.',
    heroTitle: es ? 'SEO para IA y GEO' : 'SEO for AI and GEO',
    heroSubtitle: es
      ? 'Cada vez más búsquedas terminan en una respuesta generada por IA sin que nadie haga clic. Si tu contenido no tiene pasajes claros y autocontenidos, esos sistemas no pueden extraerlo ni citarlo, y la respuesta cita a tu competencia.'
      : 'More and more searches end in an AI generated answer with no click at all. If your content lacks clear, self contained passages, those systems cannot extract or cite it, and the answer cites your competitor.',
    why: es
      ? [
          ['h2', 'Por qué la IA cita a otros y no a ti'],
          ['p', 'Escribir más contenido no lo arregla. Lo que suele faltar es estructura: respuestas directas al inicio de cada sección, definiciones que se entienden sin el contexto de la página y datos estructurados que confirmen quién escribió qué. Reorganizo lo que ya tienes para que lo lean bien los buscadores tradicionales y los motores de respuesta.'],
        ]
      : [
          ['h2', 'Why AI cites others and not you'],
          ['p', 'Writing more content does not fix it. What is usually missing is structure: direct answers at the start of each section, definitions that make sense without the rest of the page, and structured data that confirms who wrote what. I reorganize what you already have so traditional search engines and answer engines both read it well.'],
        ],
    columns: es
      ? [
          [
            ['h2', 'Qué incluye'],
            ['ul', [
              'Estructura de contenido en pasajes que un sistema de IA pueda extraer y citar.',
              'Implementación y mantenimiento de `llms.txt` y `llms-full.txt`, ajustados cada vez que el sitio suma contenido. Un matiz que prefiero dejar claro: Google no usa este archivo para posicionar. Sirve a agentes de IA que lo consultan, y por eso lo trato como un complemento y no como la palanca principal.',
              'Revisión del marcado semántico y de los datos estructurados existentes.',
              'Una medición base de citas en ChatGPT, Perplexity y Google AI Overviews para un conjunto fijo de preguntas, repetida cada mes.',
            ]],
          ],
          [
            ['h2', 'Puedes verificarlo en este sitio'],
            ['ul', [
              '[/llms.txt](/llms.txt) y [/llms-full.txt](/llms-full.txt) funcionando en producción.',
              'Datos estructurados Person y ProfessionalService en la home, y Article con fecha de modificación en cada guía.',
              'Un robots.txt abierto a todos los rastreadores.',
            ]],
          ],
          [
            ['h2', 'Cómo se mide el resultado'],
            ['p', 'Defino un conjunto de 20 a 30 preguntas que tus clientes hacen de verdad y reviso cada mes si ChatGPT, Perplexity y AI Overviews citan tu sitio. Mido apariciones, no promesas. Ningún proveedor puede garantizar una cita, y conviene desconfiar de quien lo haga.'],
          ],
          [
            ['h2', 'Guías relacionadas'],
            ['ul', guideList(l, ['structured-data-seo', 'guia-eeat', 'technical-seo-guide'])],
          ],
        ]
      : [
          [
            ['h2', 'What is included'],
            ['ul', [
              'Content structured into passages an AI system can extract and cite.',
              'Implementation and upkeep of `llms.txt` and `llms-full.txt`, adjusted whenever the site adds content. One caveat I prefer to state clearly: Google does not use this file for ranking. It serves AI agents that consult it, so I treat it as a complement and not the main lever.',
              'Review of the existing semantic markup and structured data.',
              'A baseline measurement of citations in ChatGPT, Perplexity and Google AI Overviews for a fixed set of questions, repeated every month.',
            ]],
          ],
          [
            ['h2', 'You can verify it on this site'],
            ['ul', [
              '[/llms.txt](/llms.txt) and [/llms-full.txt](/llms-full.txt) running in production.',
              'Person and ProfessionalService structured data on the home page, and Article with a modified date on every guide.',
              'A robots.txt open to all crawlers.',
            ]],
          ],
          [
            ['h2', 'How the result is measured'],
            ['p', 'I define a set of 20 to 30 questions your customers really ask and check every month whether ChatGPT, Perplexity and AI Overviews cite your site. I measure appearances, not promises. No provider can guarantee a citation, and you should be wary of anyone who does.'],
          ],
          [
            ['h2', 'Related guides'],
            ['ul', guideList(l, ['structured-data-seo', 'guia-eeat', 'technical-seo-guide'])],
          ],
        ],
    cases: es
      ? [{ slug: 'migracion-ecommerce-nextjs-seo-tecnico', title: 'Un caso real de cómo trabajo', framing: 'Todavía no tengo un caso de GEO con cifras de un cliente. Prefiero decírtelo antes de enseñarte un resultado que no existe. Este es el caso real que sí tengo publicado, como referencia de cómo trabajo.' }]
      : [{ slug: 'migracion-ecommerce-nextjs-seo-tecnico', title: 'A real case of how I work', framing: 'I do not have a GEO case with client figures yet. I would rather tell you than show a result that does not exist. This is the real case I do have published, as a reference for how I work.' }],
    faqAppend: es
      ? [{ q: '¿El llms.txt mejora mi posición en Google?', a: [['p', 'No. Google no usa ese archivo para posicionar. Es un complemento barato y útil para agentes de IA que lo consultan, y lo implemento porque cuesta poco, no porque cambie el ranking.']] }]
      : [{ q: 'Does llms.txt improve my Google ranking?', a: [['p', 'No. Google does not use that file for ranking. It is a cheap, useful complement for AI agents that consult it, and I implement it because it costs little, not because it changes the ranking.']] }],
  }
}

// ── Aplicación ────────────────────────────────────────────────────────────────

type P = Awaited<ReturnType<typeof getPayload>>

async function stepPages(payload: P) {
  console.log('\n══ PASO pages ══')
  // Plantilla de enlace tomada de un post real.
  const post = await payload.find({ collection: 'posts', limit: 1, depth: 0, locale: 'es', where: { slug: { equals: 'estrategia-seo' } } })
  const tpl = findLinkTemplate(post.docs[0]?.content)

  const caseIds = new Map<string, number>()
  for (const slug of [
    'pittsburgh-criminal-defense-legal-content-seo',
    'immigration-law-atlanta-seo',
    'fabricante-baldosa-hidraulica-seo-espana',
    'migracion-ecommerce-nextjs-seo-tecnico',
  ]) {
    const r = await payload.find({ collection: 'case-studies', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
    if (r.docs[0]) caseIds.set(slug, r.docs[0].id as number)
    else console.log(`  AVISO: no existe el caso ${slug}`)
  }

  for (const slug of ['seo-consulting', 'seo-technical-audit', 'ai-seo-geo']) {
    for (const l of ['es', 'en'] as L[]) {
      const s = pageSpec(slug, l)
      const { docs } = await payload.find({
        collection: 'pages', where: { slug: { equals: slug } }, limit: 1, depth: 0, locale: l, fallbackLocale: false, draft: false,
      })
      const doc = docs[0] as Anyobj | undefined
      if (!doc) { console.log(`  SALTA ${slug} [${l}]: no existe`); continue }
      const layout: Anyobj[] = JSON.parse(JSON.stringify(doc.content.layout))
      const hero = layout.find((b) => b.blockType === 'hero')!
      if (hero.title === s.heroTitle) { console.log(`  ya aplicado ${slug} [${l}]`); continue }
      hero.title = s.heroTitle
      hero.subtitle = s.heroSubtitle

      const contents = layout.filter((b) => b.blockType === 'content')
      const strip = (cols: Anyobj[]) => cols.map(({ id, ...c }) => c) // eslint-disable-line @typescript-eslint/no-unused-vars
      const mkContent = (tmpl: Anyobj, specs: Spec[][]) => {
        const { id, ...rest } = tmpl // eslint-disable-line @typescript-eslint/no-unused-vars
        return { ...rest, columns: specs.map((sp) => ({ ...(strip(tmpl.columns)[0] ?? { size: 'full' }), richText: lexical(sp, tpl) })) }
      }
      Object.assign(contents[0], mkContent(contents[0], [s.why]), { id: contents[0].id })
      Object.assign(contents[1], mkContent(contents[1], s.columns), { id: contents[1].id })

      // El layout es compartido entre idiomas: el primer idioma que se escribe
      // crea los bloques nuevos y el segundo solo rellena sus campos localizados
      // en el mismo lugar. Añadir bloques otra vez los duplicaría.
      const tmpl = contents[1]
      const extra = (specs: Spec[][]) => mkContent(tmpl, specs)
      const structureDone = contents.length === 2 + (s.price ? 1 : 0) + (s.guides ? 1 : 0)
      const fill = (target: Anyobj, specs: Spec[][]) => Object.assign(target, mkContent(tmpl, specs), { id: target.id })

      if (structureDone) {
        const cIdx = layout.indexOf(contents[1])
        if (s.price) fill(layout[cIdx + 1], [s.price])
        const faqAt = layout.findIndex((b) => b.blockType === 'faq')
        if (s.guides) {
          const gl = guideList(l, s.guides.slugs)
          if (gl.length) fill(layout[faqAt - 1], [[['h2', s.guides.title], ['ul', gl]]])
        }
        const rcs = layout.filter((b) => b.blockType === 'relatedCaseStudyBlock')
        s.cases.forEach((c, i) => { if (rcs[i]) { rcs[i].title = c.title; rcs[i].framingText = c.framing } })
        const faqB = layout[faqAt]
        const base = faqB.faqs.length - s.faqAppend.length
        s.faqAppend.forEach((f, i) => { Object.assign(faqB.faqs[base + i], { question: f.q, answer: lexical(f.a, tpl) }) })
      } else {
        // Bloque de precio (solo auditoría), justo después del bloque "Qué incluye".
        let idx = layout.indexOf(contents[1]) + 1
        if (s.price) layout.splice(idx++, 0, extra([s.price]))

        // Casos reales: el bloque existente toma el primero; el resto se inserta detrás.
        const rcIdx = layout.findIndex((b) => b.blockType === 'relatedCaseStudyBlock')
        const rc = layout[rcIdx]
        const blocks = s.cases.map((c, i) => {
          const id = caseIds.get(c.slug)
          const { id: _id, ...rest } = rc // eslint-disable-line @typescript-eslint/no-unused-vars
          return i === 0
            ? { ...rc, caseStudy: id ?? rc.caseStudy, title: c.title, framingText: c.framing }
            : { ...rest, caseStudy: id ?? rc.caseStudy, title: c.title, framingText: c.framing }
        })
        layout.splice(rcIdx, 1, ...blocks)

        // Guías relacionadas, antes de la FAQ.
        if (s.guides) {
          const faqIdx = layout.findIndex((b) => b.blockType === 'faq')
          const gl = guideList(l, s.guides.slugs)
          if (gl.length) layout.splice(faqIdx, 0, extra([[['h2', s.guides.title], ['ul', gl]]]))
        }

        // FAQ: se conservan las preguntas actuales y se agregan las nuevas.
        const faq = layout.find((b) => b.blockType === 'faq')!
        for (const f of s.faqAppend)
          faq.faqs.push({ question: f.q, answer: lexical(f.a, tpl) })
      }

      const meta = { ...(doc.meta ?? {}), title: s.metaTitle, description: s.metaDescription }
      console.log(`  ${APPLY ? 'ESCRIBE' : 'escribiría'} pages/${slug} [${l}]  bloques ${doc.content.layout.length} → ${layout.length}\n      meta.title: ${s.metaTitle}`)
      if (APPLY) {
        await payload.update({
          collection: 'pages', id: doc.id, locale: l, draft: false,
          data: { slug: doc.slug, title: s.heroTitle, meta, content: { ...doc.content, layout } } as never,
        })
      }
    }
  }
}

const CAT: Record<string, Record<L, string>> = {
  seo: {
    es: 'Guías de estrategia SEO ordenadas como ruta de lectura: palabras clave, contenido, topic clusters, enlaces internos y canibalización.',
    en: 'SEO strategy guides in reading order: keywords, content, topic clusters, internal linking and cannibalization.',
  },
  'tech-seo': {
    es: 'Guías de SEO técnico para desarrolladores: rastreo, indexación, Core Web Vitals, renderizado, datos estructurados y auditoría.',
    en: 'Technical SEO guides for developers: crawling, indexing, Core Web Vitals, rendering, structured data and auditing.',
  },
}

async function stepCategories(payload: P) {
  console.log('\n══ PASO categories ══')
  for (const [slug, texts] of Object.entries(CAT)) {
    for (const l of ['es', 'en'] as L[]) {
      const r = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1, depth: 0, locale: l, fallbackLocale: false })
      const doc = r.docs[0] as Anyobj | undefined
      if (!doc) continue
      if (doc.description === texts[l]) { console.log(`  igual ${slug} [${l}]`); continue }
      console.log(`  ${APPLY ? 'ESCRIBE' : 'escribiría'} categories/${slug} [${l}] (${texts[l].length} car.)`)
      if (APPLY) await payload.update({ collection: 'categories', id: doc.id, locale: l, data: { slug: doc.slug, description: texts[l] } as never })
    }
  }
}

const FOOTER_LINKS: Array<{ url: string; es: string; en: string }> = [
  { url: '/blog/seo/estrategia-seo', es: 'Estrategia SEO', en: 'SEO strategy' },
  { url: '/blog/tech-seo/technical-seo-guide', es: 'SEO técnico', en: 'Technical SEO' },
  { url: '/blog/cs-fundamentals/data-structures', es: 'Estructuras de datos', en: 'Data structures' },
  { url: '/servicios/seo-consulting', es: 'Consultoría SEO', en: 'SEO consulting' },
  { url: '/servicios/seo-technical-audit', es: 'Auditoría SEO técnica', en: 'Technical SEO audit' },
  { url: '/servicios/ai-seo-geo', es: 'SEO para IA y GEO', en: 'SEO for AI and GEO' },
]

async function stepFooter(payload: P) {
  console.log('\n══ PASO footer ══')
  mkdirSync(DATA, { recursive: true })
  const es = (await payload.findGlobal({ slug: 'footer', depth: 0, locale: 'es', fallbackLocale: false })) as Anyobj
  const already = (es.columns ?? []).some((c: Anyobj) => c.title === 'Guías clave')
  if (already) { console.log('  ya tiene la columna Guías clave'); return }
  writeFileSync(`${DATA}/backup-footer-es.json`, JSON.stringify(es, null, 2))
  const en = (await payload.findGlobal({ slug: 'footer', depth: 0, locale: 'en', fallbackLocale: false })) as Anyobj
  writeFileSync(`${DATA}/backup-footer-en.json`, JSON.stringify(en, null, 2))

  const dyn = (es.dynamicColumns ?? []).filter((d: Anyobj) => d.source !== 'latestPosts')
  console.log(`  ${APPLY ? 'ESCRIBE' : 'escribiría'} footer: +columna "Guías clave" (${FOOTER_LINKS.length} enlaces), −columna dinámica latestPosts`)
  if (!APPLY) return

  const columns = [
    ...(es.columns ?? []),
    { title: 'Guías clave', links: FOOTER_LINKS.map((f) => ({ link: { type: 'custom', newTab: false, url: f.url, label: f.es } })) },
  ]
  const updated = (await payload.updateGlobal({ slug: 'footer', locale: 'es', depth: 0, data: { columns, dynamicColumns: dyn } as never })) as Anyobj
  const col = updated.columns[updated.columns.length - 1]
  const enColumns = (updated.columns as Anyobj[]).map((c) => {
    if (c.id !== col.id) return c
    return { ...c, title: 'Key guides', links: c.links.map((l: Anyobj, i: number) => ({ ...l, link: { ...l.link, url: FOOTER_LINKS[i].url, label: FOOTER_LINKS[i].en } })) }
  })
  await payload.updateGlobal({ slug: 'footer', locale: 'en', depth: 0, data: { columns: enColumns } as never })
}

async function main() {
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} · paso=${STEP} ===`)
  const payload = await getPayload({ config })
  if (want('pages')) await stepPages(payload)
  if (want('categories')) await stepCategories(payload)
  if (want('footer')) await stepFooter(payload)
  console.log(APPLY
    ? '\nListo. Espera 60 s y verifica contra el HTML servido (titles, H1, enlaces y pie).'
    : '\nCorre con --apply para escribir.')
  process.exit(0)
}
main()
