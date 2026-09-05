/**
 * Phase 48 Plan 02, Task 2 — STACK-02..06:
 *
 * Reescribe COMPLETO el `content.layout[toolStack]` del doc `pages` slug
 * `stack` (creado por Plan 48-01 con un solo tool de tracer) con la forma
 * final: 4 categoryGroups (9 tools totales), 13 gearItems, elegiriaHoy, y
 * noCommissionPick apuntando al doc `google-search-console`.
 *
 * Esto SUPERSEDE el contenido parcial del tracer — no hace falta preservar
 * los ids que dejó 48-01, este task reemplaza el array entero de una sola
 * vez por locale. Mismo patrón `reapplyIds` que
 * scripts/seed-phase48-tracer.ts / scripts/humanize-services-index-and-landings-a.ts:
 * se escribe primero `locale:'es'`, se relee para capturar los ids que
 * Payload asignó, y esos mismos ids se reutilizan al escribir `locale:'en'`
 * — sin esto Payload genera ids distintos por locale y las dos versiones
 * dejan de compartir fila (el bug que rompió el Home CTA en 2026-07-12).
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-stack-content.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

type ReferenceLink =
  | { type: 'custom'; url: string }
  | { type: 'caseStudy'; caseStudy: number | string }

interface ToolSeed {
  name: string
  affiliateSlug: string | null // null = "sin afiliado todavía" (DigitalOcean/Kinsta/Hostinger)
  narrative: Record<Locale, string>
  pro: Record<Locale, string>
  con?: Record<Locale, string>
  referenceLink: (caseStudyId: number | string) => ReferenceLink
}

interface CategoryGroupSeed {
  heading: Record<Locale, string>
  tools: ToolSeed[]
}

// ---------------------------------------------------------------------
// Contenido real (48-CONTEXT.md), humanizado (primera persona, sin em
// dash, español neutro sin voceo) — cada narrative >=100 palabras por
// locale, medido sobre el HTML renderizado real en el <verify> de Task 3.
// ---------------------------------------------------------------------

const CATEGORY_GROUPS: CategoryGroupSeed[] = [
  {
    heading: { es: 'Investigación y contenido SEO', en: 'SEO research & content' },
    tools: [
      {
        name: 'DinoRANK',
        affiliateSlug: 'dinorank',
        narrative: {
          es: 'DinoRANK es la suite de SEO que uso todos los días con prácticamente todos mis clientes. La elegí en su momento porque la relación entre precio y funcionalidad no la igualan las herramientas más caras del mercado, y porque cubre casi todo mi trabajo diario desde un solo lugar: investigación de keywords, auditoría técnica y un redactor de contenido que uso seguido para armar primeros borradores antes de editarlos a mano y ajustarlos a la voz de cada cliente. Nunca me quedo solo con sus datos de keywords, los cruzo siempre contra otras fuentes antes de cerrar una estrategia, porque ninguna herramienta acierta sola todo el tiempo. Lo que menos me convence es su inteligencia artificial de investigación de keywords, que muchas veces simplemente no devuelve resultados útiles, y el mapa de SEO local, que puede tardar bastante en generarse cuando necesito la data rápido para una reunión con un cliente.',
          en: "DinoRANK is the SEO suite I use every day with almost all of my clients. I picked it because the balance between price and features is hard to beat, even against much more expensive tools, and it covers most of my daily work in one place: keyword research, technical audits, and a content writer I use often to put together first drafts before editing them by hand and adjusting the tone for each client. I never rely only on its keyword data. I always cross-check it against other sources before locking in a strategy, because no single tool gets it right every time. What convinces me the least is its keyword-research AI, which often just returns no results at all, and the local SEO map, which can take a long time to generate whenever I need the data quickly for a client meeting.",
        },
        pro: { es: 'Precio y funcionalidad, además del redactor de contenido.', en: 'Price versus features, plus the content writer.' },
        con: {
          es: 'La IA de investigación de keywords no siempre arroja resultados, y el mapa de SEO local tarda bastante en generarse.',
          en: "The keyword-research AI doesn't always return results, and the local SEO map takes a long time to generate.",
        },
        referenceLink: () => ({ type: 'custom', url: '/case-studies' }),
      },
      {
        name: 'DataForSEO',
        affiliateSlug: 'dataforseo',
        narrative: {
          es: 'DataForSEO lo uso para investigación de keywords en volumen, cuando necesito data de cientos o miles de términos de una vez y no tiene sentido hacerlo a mano herramienta por herramienta. Con su API construí varias aplicaciones internas para bajar datos de keywords de mis clientes directamente a una base propia y armar la estrategia sobre eso, en vez de exportar reportes sueltos desde una interfaz. Es la pieza que me permite automatizar research que antes hacía manual. Lo que más valoro es que los tokens no vencen, así que puedo recargar cuando me conviene sin sentir presión de gastarlos antes de una fecha. La única fricción real es que la recarga mínima es de 50 dólares, que para research puntual pequeño se siente un poco elevada, aunque para el volumen que manejo normalmente termina siendo rentable de todas formas.',
          en: "I use DataForSEO for bulk keyword research, when I need data on hundreds or thousands of terms at once and doing it tool by tool by hand just doesn't make sense. With its API I built several internal apps that pull my clients' keyword data straight into my own database, so I can build strategy on top of that instead of exporting one-off reports from an interface. It's the piece that lets me automate research I used to do manually. What I value most is that the tokens never expire, so I can top up whenever it makes sense without feeling pressure to spend them before some deadline. The real friction is the minimum recharge of 50 dollars, which feels a bit steep for small one-off research, though at the volume I normally work with it still pays off.",
        },
        pro: { es: 'Los tokens no vencen.', en: 'Tokens never expire.' },
        con: { es: 'La recarga mínima es $50, un poco elevada.', en: 'The minimum recharge is $50, a bit steep.' },
        referenceLink: () => ({ type: 'custom', url: '/case-studies' }),
      },
    ],
  },
  {
    heading: { es: 'Hosting e infraestructura', en: 'Hosting & infrastructure' },
    tools: [
      {
        name: 'Hostinger',
        affiliateSlug: null,
        narrative: {
          es: 'Hostinger es el hosting que recomiendo por defecto a todos mis clientes, y donde termino alojando casi todos mis proyectos propios también. Lo elegí porque la relación entre velocidad y precio es de las mejores que he probado, y porque no bloquea funcionalidades del servidor como sí hacen otros hostings compartidos más baratos, algo que valoro mucho cuando necesito configurar algo específico para un proyecto de cliente sin pedir permiso ni pagar un plan superior solo para desbloquear una opción básica. La configuración es libre de verdad: puedo entrar, ajustar lo que necesito y seguir trabajando, en vez de pelear con un panel que me esconde el control real del servidor. Hasta ahora no tengo una queja real que reportar. Lo he usado en proyectos de distintos tamaños y nunca me ha dado un problema que me haga dudar de seguir recomendándolo.',
          en: "Hostinger is the hosting I recommend to clients by default, and where I end up hosting most of my own projects too. I picked it because the balance between speed and price is among the best I've tested, and because it doesn't lock down server functionality the way cheaper shared hosts often do, which matters a lot when I need to configure something specific for a client project without asking permission or upgrading a plan just to unlock a basic option. The configuration is genuinely open: I can go in, adjust what I need, and keep working instead of fighting a panel that hides real control of the server. So far I don't have a real complaint to report. I've used it across projects of very different sizes and it hasn't given me a reason to stop recommending it.",
        },
        pro: { es: 'Velocidad, precios accesibles y configuración libre.', en: 'Speed, accessible pricing, and open configuration.' },
        // Sin `con`: Juan no reportó ninguno — el componente muestra la copy
        // honesta-vacía en su lugar (nunca fabricar un negativo).
        referenceLink: (caseStudyId) => ({ type: 'caseStudy', caseStudy: caseStudyId }),
      },
      {
        name: 'DigitalOcean',
        affiliateSlug: null,
        narrative: {
          es: 'A DigitalOcean recurro cuando un cliente necesita un VPS específico, sin las capas de un hosting administrado de por medio. Lo uso sobre todo en proyectos personales donde quiero control total del servidor desde cero, sin depender de un panel que decide por mí cómo se configura algo. Configurar un droplet nuevo toma minutos, y una vez arriba responde rápido para lo que suelo necesitar: levantar una API, correr un proceso en segundo plano o probar algo antes de llevarlo a un entorno más definitivo. Lo que me limita un poco es el número de centros de datos disponibles, que es más chico que el de otros proveedores, así que a veces la latencia hacia cierta región termina siendo un poco peor de lo que me gustaría. No tengo un case study público con DigitalOcean porque el uso ha sido casi siempre en proyectos personales, no en trabajos de cliente entregados.',
          en: "I turn to DigitalOcean when a client needs a specific VPS, without the extra layers a managed host usually adds. I use it mostly on personal projects where I want full control of the server from scratch, instead of depending on a panel that decides how something gets configured. Spinning up a new droplet takes minutes, and once it's up it responds fast for what I usually need: standing up an API, running a background process, or testing something before moving it to a more permanent environment. What limits me a bit is the number of available data centers, which is smaller than other providers, so latency to certain regions sometimes ends up a little worse than I'd like. I don't have a public case study with DigitalOcean because the use has mostly been on personal projects, not delivered client work.",
        },
        pro: { es: 'Facilidad de uso y configuración, rapidez.', en: 'Ease of use and setup, speed.' },
        con: { es: 'Número limitado de centros de datos.', en: 'Limited number of data centers.' },
        referenceLink: () => ({ type: 'custom', url: '/servicios/fullstack-development' }),
      },
      {
        name: 'Kinsta',
        affiliateSlug: null,
        narrative: {
          es: 'Kinsta la uso para tres cosas puntuales: hostear las bases de datos de mis proyectos personales principales, alojar sitios en WordPress cuando un cliente lo pide específicamente, y levantar hosting temporal para proyectos universitarios que solo necesitan estar arriba unas semanas. Corre sobre la infraestructura de Google Cloud, y se nota: es de los hostings más rápidos que he probado, y viene con entornos de staging incluidos, así que puedo probar cambios antes de tocar el sitio en producción sin configurar nada aparte. La parte que me pesa es el precio, que es alto comparado con otras opciones que hacen algo similar, y en el caso específico de WordPress se siente bastante limitado en lo que se puede tocar del lado del servidor. Tampoco tengo un case study público con Kinsta, porque el uso ha sido en proyectos personales o de universidad, no en entregas de cliente.',
          en: "I use Kinsta for three specific things: hosting the databases of my main personal projects, hosting WordPress sites when a client specifically asks for it, and spinning up temporary hosting for university projects that only need to stay up for a few weeks. It runs on Google Cloud infrastructure, and it shows: it's one of the fastest hosts I've tried, and it comes with staging environments included, so I can test changes before touching the production site without setting up anything extra. What weighs on me is the price, which is high compared to other options doing something similar, and specifically with WordPress it feels fairly limited in what you can touch on the server side. I also don't have a public case study with Kinsta, since the use has been on personal or university projects, not client deliveries.",
        },
        pro: {
          es: 'Muy rápido (corre sobre GCP) y entornos de staging incluidos.',
          en: 'Very fast (runs on GCP) and staging environments included.',
        },
        con: { es: 'Caro, y limitado para WordPress.', en: 'Expensive, and limited for WordPress.' },
        referenceLink: () => ({ type: 'custom', url: '/servicios/fullstack-development' }),
      },
    ],
  },
  {
    heading: { es: 'Desarrollo, CMS y medios', en: 'Development, CMS & media' },
    tools: [
      {
        name: 'Payload',
        affiliateSlug: 'payload',
        narrative: {
          es: 'Payload es mi alternativa a WordPress cuando construyo un sitio desde cero, y es literalmente lo que corre detrás de este mismo sitio. Lo elegí porque me permite optimizar cada parte del sitio al máximo, algo que en WordPress termina peleando contra plugins y capas que uno no controla del todo. La velocidad de juan-tech.com es la prueba más directa: puedo tocar el código de la aplicación completa, no solo el contenido, y eso se traduce en un sitio que carga rápido de verdad, no solo rápido en el papel. La contraparte es que la curva de aprendizaje es más alta para clientes o usuarios que vienen de un mundo tipo WordPress, donde todo se edita desde una interfaz. Acá el mantenimiento de fondo es a código, así que si un cliente quiere ajustar algo estructural, necesita a alguien que sepa programar, no solo entrar al panel de administración.',
          en: "Payload is my alternative to WordPress whenever I build a site from scratch, and it's literally what runs behind this very site. I picked it because it lets me optimize every part of the site to the max, something that in WordPress usually ends up fighting against plugins and layers you don't fully control. The speed of juan-tech.com is the most direct proof: I can touch the code of the whole application, not just the content, and that translates into a site that's genuinely fast, not just fast on paper. The tradeoff is a steeper learning curve for clients or users coming from a WordPress-style world, where everything gets edited from an interface. Maintenance here happens at the code level, so if a client wants to change something structural, they need someone who can actually program, not just log into the admin panel.",
        },
        pro: { es: 'Permite optimizar los sitios al máximo.', en: 'Lets you optimize sites to the max.' },
        con: {
          es: 'Curva de aprendizaje más alta, y el mantenimiento es a código.',
          en: 'Steeper learning curve, and maintenance happens at the code level.',
        },
        referenceLink: (caseStudyId) => ({ type: 'caseStudy', caseStudy: caseStudyId }),
      },
      {
        name: 'Cloudinary',
        affiliateSlug: 'cloudinary',
        narrative: {
          es: 'Cloudinary es donde guardo y edito las imágenes del sitio, y es la pieza que genera las OG images que se ven cuando alguien comparte una página de juan-tech.com en redes. Lo que más aprovecho es la edición on-the-fly: puedo pedir una versión recortada, redimensionada o con texto superpuesto de una imagen simplemente cambiando la URL, sin abrir un editor ni generar archivos duplicados a mano. Eso me ahorra bastante tiempo cuando necesito variantes de una misma imagen para distintos formatos o idiomas. Hasta ahora no tengo un contra real que reportar. Lo he usado en varios proyectos, personales y de cliente, y no me ha dado un problema que me haga considerar cambiarlo por otra cosa.',
          en: "Cloudinary is where I store and edit the site's images, and it's the piece that generates the OG images you see when someone shares a page from juan-tech.com on social media. What I use the most is on-the-fly editing: I can request a cropped, resized, or text-overlaid version of an image just by changing the URL, without opening an editor or generating duplicate files by hand. That saves me a good amount of time whenever I need several variants of the same image for different formats or languages. So far I don't have a real complaint to report. I've used it across several projects, personal and client work alike, and it hasn't given me a reason to consider switching to something else.",
        },
        pro: { es: 'Edición on-the-fly.', en: 'On-the-fly editing.' },
        // Sin `con`: Juan no reportó ninguno.
        referenceLink: (caseStudyId) => ({ type: 'caseStudy', caseStudy: caseStudyId }),
      },
      {
        name: 'Resend',
        affiliateSlug: 'resend',
        narrative: {
          es: 'Resend es lo que uso para el manejo de correos transaccionales del sitio, y hasta ahora el tier gratuito me ha alcanzado sin problema para el volumen que manejo. Lo que más valoro es lo fácil que fue implementarlo: en poco tiempo tenía el envío de correos funcionando de forma confiable, con buena velocidad de entrega y sin los dolores de cabeza típicos de configurar SMTP a mano o pelear con proveedores más viejos. Simplemente funciona, y eso para un servicio de correo es más valioso de lo que suena. Lo que todavía no he explorado son sus automatizaciones para armar un flujo completo de email marketing directamente desde ahí, algo que me interesa probar más adelante pero que por ahora sigue fuera de mi flujo de trabajo diario.',
          en: "Resend is what I use for the site's transactional email, and so far the free tier has been more than enough for the volume I handle. What I value most is how easy it was to set up: within a short time I had reliable email sending working, with good delivery speed and none of the usual headaches of configuring SMTP by hand or fighting older providers. It just works, and for an email service that's worth more than it sounds. What I haven't explored yet are its automations for building a full email marketing flow directly from there, something I'm interested in trying eventually but that stays outside my daily workflow for now.",
        },
        pro: { es: 'Fácil de implementar, buena velocidad y entrega.', en: 'Easy to set up, good speed and delivery.' },
        con: {
          es: 'Aún no he explorado las automatizaciones de email marketing.',
          en: "Haven't explored the email marketing automations yet.",
        },
        referenceLink: (caseStudyId) => ({ type: 'caseStudy', caseStudy: caseStudyId }),
      },
    ],
  },
  {
    heading: { es: 'Medición', en: 'Measurement' },
    tools: [
      {
        name: 'Ahrefs',
        affiliateSlug: 'ahrefs',
        narrative: {
          es: 'Ahrefs lo uso principalmente en el arranque de proyectos de cliente nuevos, para tener una foto clara de dónde está parado el sitio antes de tocar nada. Me da una visión bastante completa de cómo empieza un proyecto y cómo va escalando con el tiempo, algo que uso para justificar decisiones frente al cliente con datos concretos en vez de solo intuición. Esa visión de progreso es lo que más rescato de la herramienta: puedo mostrar de forma clara qué cambió entre el mes uno y el mes seis de una estrategia. El problema es el precio. Es de las herramientas más caras que tengo en mi stack, y eso hace que no siempre sea la primera opción para un proyecto chico, donde termino recurriendo a alternativas más accesibles para lo mismo.',
          en: "I use Ahrefs mainly at the start of new client projects, to get a clear picture of where the site stands before touching anything. It gives me a fairly complete view of how a project starts and how it scales over time, which I use to justify decisions to the client with concrete data instead of just intuition. That view of progress is what I value most about the tool: I can clearly show what changed between month one and month six of a strategy. The problem is the price. It's one of the most expensive tools in my stack, which means it isn't always the first option for a small project, where I end up reaching for more affordable alternatives instead.",
        },
        pro: { es: 'Visión clara de cómo escala un proyecto.', en: 'Clear view of how a project scales.' },
        con: { es: 'Muy caro.', en: 'Very expensive.' },
        referenceLink: () => ({ type: 'custom', url: '/case-studies' }),
      },
    ],
  },
]

const GEAR_ITEMS: { name: string; href: string }[] = [
  { name: 'AMD RYZEN 7 9800X3D', href: 'https://www.amazon.com/dp/B0DKFMSMYK?tag=juantech02-20' },
  { name: 'Samsung SSD 990 PRO 2TB', href: 'https://www.amazon.com/dp/B0BHJJ9Y77?tag=juantech02-20' },
  {
    name: 'CORSAIR Vengeance DDR5 32GB (2x16GB)',
    href: 'https://www.amazon.com/dp/B0CJ8ZHMVF?tag=juantech02-20',
  },
  { name: 'MSI MAG B850 Tomahawk MAX', href: 'https://www.amazon.com/dp/B0DT58JK2W?tag=juantech02-20' },
  { name: 'Fractal Design North Chalk White', href: 'https://www.amazon.com/dp/B09Y9FSZFX?tag=juantech02-20' },
  { name: 'ARCTIC MX-7', href: 'https://www.amazon.com/dp/B0FT2TC2NW?tag=juantech02-20' },
  {
    name: 'Apple 2022 MacBook Air M2, 13", 8GB RAM, 256GB SSD',
    href: 'https://www.amazon.com/dp/B0BLYG2JBR?tag=juantech02-20',
  },
  {
    name: 'ASUS Prime GeForce RTX 5070 12GB GDDR7 OC',
    href: 'https://www.amazon.com/dp/B0DS6WPTLL?tag=juantech02-20',
  },
  { name: 'MSI PRO A1000PL PCIE5', href: 'https://www.amazon.com/dp/B0GY1RBQRH?tag=juantech02-20' },
  {
    name: 'Noctua NH-D15 G2 chromax.Black',
    href: 'https://www.amazon.com/dp/B0FXGWKHND?tag=juantech02-20',
  },
  { name: 'Logitech G305', href: 'https://www.amazon.com/dp/B07CMS5Q6P?tag=juantech02-20' },
  { name: 'Logitech G435', href: 'https://www.amazon.com/dp/B0FXYGKNZ4?tag=juantech02-20' },
  {
    name: 'LG UltraWide Monitor 29U511A 29"',
    href: 'https://www.amazon.com/dp/B0FHLN6M8Y?tag=juantech02-20',
  },
]

// Verificación defensiva en el propio script: ningún href de Gear puede
// llevar la subcadena `amzn.to` (shortlink prohibido, ver 48-CONTEXT.md).
for (const item of GEAR_ITEMS) {
  if (item.href.includes('amzn.to')) {
    throw new Error(`GEAR_ITEMS contiene un shortlink amzn.to sin resolver: ${item.name}`)
  }
}

const GEAR_INTRO: Record<Locale, string> = {
  es: 'Todos mis componentes de PC los compro en Amazon. Uso Amazon Prime sobre todo por la entrega rápida y porque de vez en cuando cae una oferta real, aunque soy sincero: no aprovecho del todo el resto de Prime, casi no uso Prime Video ni Prime Music.',
  en: "I buy all my PC components on Amazon. I use Amazon Prime mostly for the fast delivery and the occasional real deal, though I'll be honest: I don't take full advantage of the rest of Prime, I barely use Prime Video or Prime Music.",
}

const ELEGIRIA_HOY: Record<Locale, string> = {
  es: 'Si empezara de cero hoy, combinaría DataForSEO con DinoRANK para obtener datos de clientes: DataForSEO para el research en volumen y DinoRANK para el trabajo diario más económico. Para levantar cualquier proyecto de cliente usaría Hostinger, que sigue siendo mi base de hosting por defecto. Para medición me quedaría con Google Search Console, el tier gratuito de Ahrefs y Google Analytics 4, una combinación que cubre casi todo sin gastar de más. Y para el stack de código seguiría la misma regla que uso ahora: si el proyecto necesita un CMS, uso Payload; si es un sitio estático, uso Astro; y si el sitio ya existe o el cliente prefiere WordPress específicamente, lo instalo directo en Hostinger sin pelear la decisión. Aprovecharía los tier gratuitos de Resend y Cloudinary desde el primer día, porque hacen que todo el stack responda rápido sin agregar costo mientras el proyecto todavía es chico.',
  en: "If I were starting from zero today, I'd combine DataForSEO with DinoRANK to get client data: DataForSEO for bulk research and DinoRANK for the cheaper day-to-day work. To spin up any client project I'd use Hostinger, which is still my default hosting base. For measurement I'd stick with Google Search Console, Ahrefs' free tier, and Google Analytics 4, a combination that covers almost everything without overspending. And for the code stack I'd follow the same rule I use now: if the project needs a CMS, I use Payload; if it's a static site, I use Astro; and if the site already exists or the client specifically prefers WordPress, I install it directly on Hostinger without fighting the decision. I'd lean on the free tiers of Resend and Cloudinary from day one, because they keep the whole stack responsive without adding cost while the project is still small.",
}

const STACK_PAGE_TITLE: Record<Locale, string> = {
  es: 'Mi stack',
  en: 'My stack',
}

/** Mismo patrón que scripts/seed-phase48-tracer.ts. */
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

    if (block.blockType === 'toolStack') {
      const refGroups = (refBlock.categoryGroups as Record<string, unknown>[] | undefined) ?? []
      withId.categoryGroups = ((block.categoryGroups as Record<string, unknown>[]) ?? []).map(
        (group, gi) => {
          const refGroup = refGroups[gi]
          if (!refGroup) return group

          const refTools = (refGroup.tools as Record<string, unknown>[] | undefined) ?? []
          return {
            ...group,
            id: refGroup.id,
            tools: ((group.tools as Record<string, unknown>[]) ?? []).map((tool, ti) =>
              refTools[ti] ? { ...tool, id: refTools[ti].id } : tool,
            ),
          }
        },
      )

      const refGearItems = (refBlock.gearItems as Record<string, unknown>[] | undefined) ?? []
      withId.gearItems = ((block.gearItems as Record<string, unknown>[]) ?? []).map((item, ii) =>
        refGearItems[ii] ? { ...item, id: refGearItems[ii].id } : item,
      )
    }

    return withId
  })
}

async function findAffiliateLinkId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
): Promise<number | string> {
  const { docs } = await payload.find({
    collection: 'affiliate-links',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (docs.length === 0) {
    throw new Error(
      `affiliate-links doc slug=${slug} no existe — correr scripts/seed-phase48-affiliate-links.ts (Task 1) primero`,
    )
  }
  return docs[0].id
}

async function findCaseStudyId(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: string,
): Promise<number | string> {
  const { docs } = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (docs.length === 0) {
    throw new Error(`case-studies doc slug=${slug} no existe`)
  }
  return docs[0].id
}

function buildStackLayout(
  locale: Locale,
  affiliateLinkIds: Record<string, number | string>,
  caseStudyId: number | string,
  noCommissionPickId: number | string,
): Record<string, unknown>[] {
  const categoryGroups = CATEGORY_GROUPS.map((group) => ({
    heading: group.heading[locale],
    tools: group.tools.map((tool) => ({
      name: tool.name,
      affiliateLink: tool.affiliateSlug ? affiliateLinkIds[tool.affiliateSlug] : null,
      narrative: tool.narrative[locale],
      pro: tool.pro[locale],
      con: tool.con ? tool.con[locale] : null,
      referenceLink: tool.referenceLink(caseStudyId),
    })),
  }))

  return [
    {
      blockType: 'toolStack',
      categoryGroups,
      gearIntro: GEAR_INTRO[locale],
      gearItems: GEAR_ITEMS,
      elegiriaHoy: ELEGIRIA_HOY[locale],
      noCommissionPick: noCommissionPickId,
    },
  ]
}

async function main() {
  const payload = await getPayload({ config })

  const affiliateLinkIds: Record<string, number | string> = {}
  for (const slug of ['dinorank', 'dataforseo', 'payload', 'cloudinary', 'resend', 'ahrefs']) {
    affiliateLinkIds[slug] = await findAffiliateLinkId(payload, slug)
  }
  const noCommissionPickId = await findAffiliateLinkId(payload, 'google-search-console')
  const caseStudyId = await findCaseStudyId(payload, 'migracion-ecommerce-nextjs-seo-tecnico')

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'stack' } },
    limit: 1,
  })

  if (docs.length === 0) {
    throw new Error(
      'pages doc slug=stack no existe — correr scripts/seed-phase48-tracer.ts (Plan 48-01) primero',
    )
  }
  const docId = docs[0].id

  const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
  const referenceLayout = refetched.content?.layout as Record<string, unknown>[] | undefined

  for (const locale of LOCALES) {
    const freshLayout = buildStackLayout(locale, affiliateLinkIds, caseStudyId, noCommissionPickId)
    const layoutWithIds = reapplyIds(freshLayout, referenceLayout)

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: STACK_PAGE_TITLE[locale],
        _status: 'published',
        content: { layout: layoutWithIds as never },
      },
    })
    console.log(`pages/stack actualizado (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
