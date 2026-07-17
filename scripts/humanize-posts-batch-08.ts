/**
 * Phase 31 Plan 09 (batch 8 of 13) — humanize Posts ids [45,46,47,48,49]
 * (slugs: nextjs-portfolio, headless-cms-seo, xml-sitemap-automation,
 * ssr-vs-csr-seo, schema-markup-guide), both es and en locales, calibrated
 * against research/voice-sample-juan.md + 29-VOICE-PROFILE.md via the
 * humanizer skill.
 *
 * Rewrite strategy (in-place, structure-preserving):
 * For each heading/paragraph/listitem node, this script groups its DIRECT
 * children into "runs" of consecutive `text` nodes (a run ends whenever a
 * non-text child — e.g. a `link` — appears). This mirrors the plan's
 * `rewriteProse` interface but operates per-run instead of per-leaf, so
 * that SEO-keyword bold insertions split into multiple text-node siblings
 * (a recurring artifact in this batch's real content) get consolidated
 * into one coherent, rewritten sentence instead of being rewritten
 * fragment-by-fragment (which risked breaking grammar around a retained
 * link's anchor text). `block` and `table` nodes are never entered; `link`
 * nodes are walked but their own text children keep parentType 'link' and
 * are never touched (anchor labels stay as-is, per the plan's interface).
 *
 * REWRITES[id][locale] is a plain array of (string | null), one entry per
 * run, in the exact depth-first order the tree walk below produces (this
 * order was captured once against the live document during authoring and
 * is stable since no other batch touches these ids). `null` means "leave
 * this run's text byte-identical" — used for headings that carry
 * SEO-load-bearing keywords, short list-item labels/spec names, inline
 * code/command fragments, and any run immediately adjacent to a link
 * where rewriting only one side risked breaking the sentence's grammar
 * against the (never-touched) anchor text.
 *
 * KNOWN PRE-EXISTING DATA ISSUES found during authoring (out of scope per
 * plan's SCOPE BOUNDARY — logged here, not fixed, see SUMMARY.md):
 *   - Post 47 (xml-sitemap-automation) `en` locale body is missing
 *     entirely — only the "See Also" related-links section exists (1
 *     run). No article prose to rewrite; REWRITES[47].en is a single-item
 *     null array. Flagged for a future content-authoring pass, not
 *     invented here.
 *   - Post 49 (schema-markup-guide) `es` locale body was never actually
 *     translated to Spanish — it contains full English prose (different
 *     wording than the `en` locale, but still English). This is treated
 *     as a Rule 1 bug (broken locale, not just "wrong voice") and this
 *     script both TRANSLATES and humanizes it into real Spanish, since a
 *     voice-only pass would leave the ES page rendering English body
 *     copy to Spanish readers. Schema.org type-name headings (e.g.
 *     "Organization Schema") are conventionally kept in English in both
 *     locales and are left untouched (`null`).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-08.ts
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import { getPayload } from "payload"

import config from "../src/payload.config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const IDS = [45, 46, 47, 48, 49] as const
const LOCALES = ["es", "en"] as const
const VOCEO_RE =
  /\b(vos|ten[eé]s|pod[eé]s|quer[eé]s|sab[eé]s|us[aá]s|necesit[aá]s|trabaj[aá]s|sospech[aá]s|prefer[ií]s|mir[aá])\b/i
const EM_DASH_RE = /—/

const PROGRESS_PATH = path.resolve(
  __dirname,
  "../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-08.json",
)

type LexicalNode = {
  type: string
  text?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

type Locale = (typeof LOCALES)[number]

// ---------------------------------------------------------------------
// REWRITES data (authored against the live document during planning)
// ---------------------------------------------------------------------
const REWRITES: Record<number, Record<Locale, Array<string | null>>> = {
  "45": {
    "es": [
      "Next.js se volvió la opción por defecto para armar portafolios rápidos y bien indexados. Es un framework construido sobre React, y da control real sobre rendimiento y SEO, dos cosas que cualquier desarrollador o diseñador necesita si quiere que su trabajo se vea y se encuentre.",
      "Aquí repaso cómo sacarle provecho a Next.js para construir un portafolio que muestre tus proyectos y además se sienta bien de usar. Vamos a ver técnicas, estructura de carpetas y algunas opciones de nextjs templates portfolio que ahorran tiempo.",
      null,
      "Next.js es un framework de React pensado para construir aplicaciones web y sitios estáticos con rendimiento y SEO como prioridad, no como añadido. Lo mantiene Vercel, y ganó terreno justamente por eso: te da herramientas para crear sitios visualmente atractivos y, al mismo tiempo, indexables desde el día uno. Para un portafolio, esa combinación es difícil de igualar con otras opciones.",
      null,
      "La gran ventaja de Next.js está en la modularidad: armas componentes reutilizables que ordenan el código y aceleran el desarrollo. El sistema de rutas automáticas y las API routes hacen que escalar o personalizar un portafolio sea simple, sin tener que montar un backend aparte. Y como soporta CSS y Sass de forma nativa, el diseño responsivo no requiere herramientas extra.",
      null,
      null,
      null,
      null,
      "Rendimiento y SEO van de la mano cuando construyes un portafolio, y Next.js resuelve los dos frentes. El renderizado del lado del servidor baja los tiempos de carga, lo que mejora la experiencia del usuario y también el posicionamiento. La optimización automática de imágenes y un buen manejo de enlaces internos terminan de cerrar el círculo: un portafolio bien armado con Next.js no solo se ve bien, también aparece cuando alguien busca tu trabajo. Las plantillas de Next.js para portfolios ayudan a arrancar más rápido, con ejemplos concretos de cómo aprovechar el framework.",
      null,
      "Construir un portafolio en Next.js es también una oportunidad para aplicar, en un proyecto real, técnicas de optimización que mejoran rendimiento y visibilidad. Estos son los pasos que sigo para armar uno desde cero con este framework basado en React.",
      null,
      "Para arrancar, crea el proyecto con npx create-next-app nombre-del-proyecto. Esto genera una estructura básica de carpetas que después ajustas a tu gusto. Tener los archivos bien organizados desde el principio evita dolores de cabeza cuando el proyecto crece. Estas son las carpetas que conviene definir:",
      null,
      null,
      null,
      null,
      null,
      "El diseño responsivo no es opcional: tu portafolio tiene que verse bien en cualquier tamaño de pantalla. Usar CSS Modules o Styled Components ayuda a mantener el estilo consistente y evita choques de nombres entre clases. Con media queries adaptas cada elemento según el dispositivo, sin duplicar código.",
      null,
      "Al estar basado en React, Next.js facilita construir componentes reutilizables, la base de un desarrollo ordenado. Algunos que conviene tener en cualquier portafolio:",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "Para el despliegue, Vercel es la opción más directa porque está construida pensando en proyectos Next.js. El proceso es rápido, se integra con git para actualizaciones automáticas, y aplica optimizaciones de rendimiento sin que tengas que configurarlas a mano.",
      "Siguiendo estos pasos armas un portafolio que se ve bien y además es encontrable, que es lo que realmente importa si buscas que llegue a más gente y se note en tu perfil profesional.",
      null,
      "Usar un template bien hecho ahorra tiempo real: eliges bien y ya arrancas con un diseño profesional, optimizado en rendimiento y experiencia de usuario. Hay varias opciones según el estilo que busques, así sea uno minimalista, orientado a desarrolladores o pensado para diseñadores. Estas son las categorías que más se repiten.",
      null,
      "Pensadas para diseñadores gráficos y visuales que quieren que su trabajo hable por sí solo. Suelen traer elementos visuales fuertes y espacio de sobra para imágenes en alta calidad.",
      null,
      null,
      null,
      "Para desarrolladores, lo que importa es la funcionalidad y cómo se presentan los proyectos de software. Casi siempre traen secciones para habilidades técnicas, proyectos anteriores y experiencia laboral.",
      null,
      null,
      null,
      "Sirven para profesionales de distintas disciplinas, porque se adaptan a estilos de contenido variados.",
      null,
      null,
      "Al elegir una plantilla para tu portafolio en Next.js, mira más allá de la estética: que sea responsive, que genere metadatos automáticos y que use URLs amigables. La mayoría de estos templates se pueden modificar sin drama, así que puedes ajustarlos a lo que necesitas sin empezar de cero. Un buen template de Next.js, bien personalizado, es la diferencia entre un portafolio genérico y uno que realmente refleja tu forma de trabajar.",
      null,
      null,
      null
    ],
    "en": [
      "Building a personal portfolio got a lot easier once Next.js became the default choice. It's a React framework built around performance and a better user experience, not bolted-on afterthoughts.",
      "Here I go through how to use Next.js for a personal portfolio, from the core features to actually shipping it. By the end you'll have what you need to build a nextjs personal portfolio that looks like you, not like a template nobody customized.",
      null,
      "Next.js caught on with developers building personal portfolios mostly because it's a solid, well-maintained framework built on React. Here's a look at the core features and why it works so well for showing off individual projects.",
      null,
      "Next.js ships with a handful of features that make building fast sites and apps a lot less painful. The core ones worth knowing:",
      null,
      null,
      null,
      null,
      null,
      "Put together, these features let you spend more time on design and less time fighting the framework, which is exactly why Next.js fits so well for a nextjs personal portfolio.",
      null,
      "Building your portfolio in Next.js pays off in a few concrete ways, mostly around visibility and performance. Here's what actually matters:",
      null,
      null,
      null,
      null,
      null,
      "Put these together and you get a portfolio that actually stands out, not just another template site. Next.js's feature set plus its community means you don't have to trade creativity for functionality.",
      null,
      "A personal portfolio built in Next.js is a fast way to show your skills and past work without extra overhead. The framework's own features do most of the heavy lifting for you, both visually and in terms of speed.",
      null,
      "A good number of developers have their Next.js personal portfolio projects up on GitHub, which is worth browsing before you start your own. A few worth checking:",
      null,
      null,
      null,
      null,
      null,
      null,
      "Sticking to solid design patterns and current tooling makes a real difference in the final quality of a Next.js personal portfolio. Worth paying attention to:",
      null,
      null,
      null,
      null,
      null,
      "A portfolio isn't a one-and-done project. Keeping a Next.js personal portfolio relevant means revisiting it regularly. A few ways to do that:",
      null,
      null,
      null,
      null,
      "Follow these guidelines and you end up with a personal portfolio that actually reflects what you can do, technically solid and easy to use, not just good-looking on the surface.",
      null,
      "Building a personal portfolio with Next.js comes down to a handful of phases: initial setup, structuring your components, wiring up navigation, and deploying. Skip a step and it shows, so it's worth going through each one properly for your Next.js personal portfolio.",
      null,
      "The initial setup is the easy part. Running create-next-app bootstraps a new project in seconds, with a folder structure that already includes what you need, so you spend your time customizing instead of configuring. That simplicity is why both beginners and experienced developers can get a Next.js personal portfolio running fast.",
      null,
      "How you structure the portfolio affects the user experience more than people expect. Next.js's reusable components keep the codebase clean and help load times. A layout component wrapping your pages keeps design and functionality consistent, and something like Tailwind CSS lets you build responsive layouts fast, without extra media-query gymnastics.",
      null,
      "Dynamic routing makes navigation inside the portfolio a lot easier. File-based routing means a dedicated page per project or blog post takes almost no setup. The Link component handles client-side navigation, so pages transition smoothly instead of full-reloading, which matters when a Next.js personal portfolio needs to present several projects in a way that still feels coherent.",
      null,
      "Once the portfolio is built, deployment is the next step. Vercel and Netlify are both built around hosting Next.js apps, with automatic scaling and git-based continuous deployment out of the box. A few things worth doing for performance:",
      null,
      null,
      null,
      null,
      "Get these deployment details right and the Next.js personal portfolio doesn't just work, it feels fast to whoever's looking at it, which is usually the whole point.",
      null,
      null,
      null,
      null
    ]
  },
  "46": {
    "es": [
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "Un CMS headless separa el almacenamiento y la gestión de contenido del back-end de cómo se presenta ese contenido en el front-end. El contenido vive en un sistema al que accedes vía API, así que distintas aplicaciones y dispositivos pueden consumir la misma información sin depender de una sola capa de presentación. Esa separación te deja usar cualquier tecnología en el front-end, algo útil cuando el proyecto necesita personalización fuerte o sirve varias plataformas a la vez, sitio web, app móvil u otros canales.",
      null,
      "La diferencia real entre un CMS tradicional y uno headless se nota en el impacto sobre SEO. Un CMS tradicional junta gestión de contenido y presentación en una sola plataforma, lo que limita cuánto puedes escalar o rediseñar sin tocar las dos capas a la vez. Un headless separa eso: cambias contenido o diseño sin que uno arrastre al otro, y eso facilita cumplir buenas prácticas de SEO, como estructura de URLs o rendimiento del sitio, sin pelearte con la plataforma.",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "WordPress como backend y Next.js como front-end es una combinación que funciona bien en la práctica. WordPress en modo headless sigue aportando lo que siempre hizo bien, gestión de contenido, mientras Next.js se encarga de la experiencia de usuario y el SEO. WordPress queda conectado vía API REST o GraphQL, así que puedes crear y modificar contenido sin tocar la capa de presentación.",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "Trabajando con headless CMS WordPress y Next.js, la estructura de URLs y los metadatos no son un detalle menor. Las URLs deben ser limpias y descriptivas, con las palabras clave relevantes, sin volverse eternas. Los títulos y descripciones se pueden generar dinámicamente desde la API de WordPress, así cada página termina con sus propios metadatos, únicos, y eso ayuda a indexar y posicionar mejor.",
      null,
      "Headless CMS WordPress junto con Next.js le da a una organización varias ventajas reales para mejorar su presencia en línea. Las que más pesan:",
      null,
      null,
      null,
      null,
      null,
      null,
      "La escalabilidad es de los beneficios más grandes de un headless CMS. Con esta arquitectura una empresa gestiona grandes volúmenes de contenido sin perder coherencia entre plataformas y canales digitales. Y ese contenido estructurado y flexible es justo lo que necesitas para que el SEO funcione bien en un entorno multicanal.",
      null,
      "Cuando necesitas páginas específicas por ubicación física o segmento de mercado, el modelado de contenido estructurado deja de ser opcional. Un headless CMS te permite crear plantillas que se adaptan a necesidades locales, lo cual facilita estrategias de SEO geolocalizado. Una cadena de tiendas, por ejemplo, puede generar automáticamente una página por local con horarios, promociones y contacto propios, y eso multiplica las oportunidades de indexación.",
      null,
      "El contenido duplicado aparece casi siempre que un sitio escala a varias plataformas. Un CMS headless centraliza esa gestión, así que puedes mostrar versiones únicas por ubicación sin duplicar nada, lo que protege el valor SEO y evita penalizaciones. Sumarle canonicalización y control de acceso vía API termina de mantener cada pieza de contenido como algo único, aunque el sitio esté distribuido.",
      null,
      "Si el objetivo es internacional, la localización del contenido no es un extra. Un headless CMS facilita crear y gestionar contenido en varios idiomas, así que cada mercado puede tener su propio SEO. Las etiquetas hreflang se encargan de que cada versión de idioma se indexe donde corresponde y llegue al usuario correcto. Con un buen sistema de traducción integrado, el contenido termina siendo relevante para cada región, no una traducción genérica.",
      null,
      "La automatización de contenido es otro terreno donde un headless CMS da ventaja. Meter herramientas de IA en la creación de contenido acelera la publicación, y bien usadas también mejoran la calidad del resultado. Pueden generar metadatos SEO automáticamente, ajustando títulos y descripciones según lo que se busca en ese momento, y sostener una producción constante de contenido fresco, que es lo que realmente mantiene competitivo a un sitio. Combinado con headless CMS WordPress Next.js, esto termina de maximizar la eficiencia de la estrategia SEO.",
      null,
      null,
      null,
      null,
      null,
      "Las API son las que realmente le dan flexibilidad a un headless CMS. Con ellas optimizas contenido de forma dinámica, entregando lo relevante según cómo interactúa cada usuario. En la práctica eso significa personalizar por preferencias, ubicación o comportamiento histórico, lo que mejora la experiencia y puede empujar los rankings hacia arriba. Y como los cambios se aplican en tiempo real vía API, el contenido se mantiene alineado con las prácticas de SEO más recientes sin esperar un despliegue.",
      null,
      "La velocidad de carga pesa mucho en SEO, y en un headless CMS todavía más. Cache bien pensado más una CDN hacen la mayor parte del trabajo: contenido estático y dinámico servido desde servidores distribuidos geográficamente, para que el usuario reciba todo más rápido sin importar dónde esté. Eso mejora la experiencia y también los Core Web Vitals, que el buscador sí toma en cuenta para posicionar. Un headless CMS combinado con Next.js y su SSR es un ejemplo directo de cómo se logra esto en la práctica.",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "Un headless CMS trae ventajas reales, pero también sus propios problemas de SEO. Estos son los que más aparecen, y cómo resolverlos.",
      null,
      "El problema más común con un headless CMS es el renderizado en el lado del cliente (CSR): si no lo manejas bien, el buscador simplemente no rastrea el contenido como corresponde. Para evitarlo conviene apoyarse en técnicas como:",
      null,
      null,
      null,
      "Combinar estas técnicas, sobre todo en frameworks como Next.js, es lo que garantiza que el contenido llegue a los motores de búsqueda y, de paso, mejora la experiencia del usuario.",
      null,
      null,
      null,
      null,
      null,
      null,
      "Esto ayuda a la indexación y de paso mejora cómo se siente navegar el sitio.",
      null,
      "Las etiquetas meta y Open Graph importan mucho para el SEO en un CMS headless, y la separación entre back-end y front-end puede complicar esa integración. Para resolverlo:",
      null,
      null,
      null,
      "Así el contenido que se comparte en redes o aparece en resultados de búsqueda se ve bien y está optimizado, no es cosa de suerte.",
      null,
      "Un headless CMS es dinámico por naturaleza, así que el SEO necesita mantenimiento activo, no configurarlo una vez y olvidarse. Esto debería incluir:",
      null,
      null,
      null,
      "Automatizar estas tareas ayuda bastante, en especial en implementaciones como headless CMS WordPress Next.js, donde puedes combinar una gestión de contenido eficiente con estándares de SEO altos sin duplicar el trabajo."
    ],
    "en": [
      "Headless CMS changed how content management and SEO work together. Decoupling backend from frontend gives a business more room to optimize for search engines without the two getting in each other's way.",
      null,
      null,
      null,
      null,
      "A headless CMS separates the backend, where content gets created and managed, from the frontend, where it actually shows up. That split gives teams more room to push content across platforms, websites, mobile apps, even IoT devices, without rebuilding anything on the content side. Instead of being locked to one presentation layer, it uses APIs to hand content off to whichever channel needs it.",
      "That separation lets content creators organize material without waiting on developers, and it lets developers pick whatever rendering technology fits the job. That freedom to use modern frameworks is what actually moves the needle on SEO metrics like page load time and user experience.",
      null,
      "A headless CMS is built to work across multiple channels without extra plumbing. A structured API handles the distribution, so a company can publish an article to its website, push a notification to its app, and update digital signage content, all from the same backend.",
      null,
      null,
      null,
      null,
      "Managing content dynamically also makes it easier to actually apply SEO best practices, because teams can adjust presentation and structure per channel without touching the backend. That's a big part of why headless CMS keeps showing up in modern content strategies as expectations around personalization go up.",
      null,
      "SEO works differently once a headless CMS enters the picture, from how content gets created to how it eventually gets optimized for search engines. Developers, technical SEOs, and business owners all need to understand those differences if visibility and engagement actually matter to them.",
      null,
      "Headless SEO is just SEO applied to content delivered through a headless CMS. Traditional CMS platforms tie backend and frontend together tightly; a headless CMS pulls them apart, which gives more room to customize meta tags, structured data, and URL structures across channels. That flexibility means a team can react faster when search algorithms or user behavior shift.",
      null,
      "A common misconception is that a headless CMS makes SEO harder. In practice, splitting backend from frontend usually helps a team more than it hurts them. Traditional CMS platforms tend to box in how content gets optimized and displayed across environments. With a headless setup, developers use APIs to keep SEO best practices consistent everywhere. And the idea that headless CMS lacks SEO tooling doesn't really hold up anymore, plenty of modern frameworks and free headless CMS options for Next.js come with solid tools for this.",
      null,
      "The real difference between headless SEO and traditional SEO comes down to flexibility. Traditional SEO is stuck working around whatever a monolithic CMS allows, which makes structural changes slow. Headless SEO lets a team test and ship SEO changes faster: adjusting URL structure for keywords, managing metadata, without a template getting in the way. It's a more agile approach, and it fits how search optimization actually works today.",
      null,
      null,
      "A headless CMS centralizes content management around a single repository, so teams aren't maintaining the same content in three different places. That single source of truth keeps quality consistent across website, app, or whatever other platform, and it cuts down on the kind of errors that quietly hurt SEO rankings.",
      null,
      "Traditional CMS platforms tend to lock you into a rigid URL structure, and that becomes a real SEO barrier. Headless CMS gives developers room to build SEO-friendly URLs with the right keywords baked in. Clean, well-structured URLs help user experience and engagement, and search engines factor both into ranking.",
      null,
      "A headless CMS scales well, which matters for a business expecting real growth or needing a lot of pages fast. New content types deploy quickly, without duplicating work or burning resources. That means a business can manage a large content architecture and still adapt to the market without SEO falling apart along the way.",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "Technical SEO matters more, not less, once you're in headless territory. Traditional CMS platforms keep front-end and back-end tightly coupled; headless systems need their own technical strategy to perform well in search. Here's what actually matters for technical SEO in a headless CMS.",
      null,
      null,
      ") versus client-side rendering (CSR). SSR renders HTML on the server for every request, so search engines get fully-formed content ready to index. That alone avoids most of the SEO problems that come from incomplete content delivery.",
      "CSR, on the other hand, leans on JavaScript to render content in the browser. It's great for a dynamic interface, but it can trip up search engines that struggle to index JavaScript-heavy pages, especially with limited crawling capability. Balancing user experience against SEO needs usually comes down to picking a rendering strategy that doesn't force you to choose one over the other.",
      null,
      "Metadata management matters a lot for SEO, and even more in a headless CMS where the same content shows up across platforms. Getting accurate title tags, meta descriptions, and header tags on every page does a lot of the visibility work. Canonical tags handle the rest, telling search engines which version of a page is the one that counts.",
      "Being structured about metadata and canonical tags gives you real control over how content gets indexed and shown in search results. Plenty of headless CMS platforms let you automate metadata management, so outputs stay consistent no matter which channel they land on.",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "Structured data surfaces the key information about your content directly in search results, which tends to help both rankings and click-through rate. It's worth building into the technical SEO strategy from day one, not bolting on later.",
      "Getting technical SEO right in a headless CMS takes planning across rendering, metadata, sitemaps, and structured data, all at once, not one at a time. If you're evaluating options, several free headless CMS for Next.js already ship tools that cover most of this.",
      null,
      null,
      "Next.js integrates cleanly with most free headless CMS platforms, which is part of why it's such a common pairing. Strapi, Contentful's free tier, and Sanity are the ones that come up most, each with its own take on structured content management, and each headless enough that SEO stays manageable from the start.",
      null,
      "Picking a headless CMS for a Next.js project means weighing the trade-offs of each option honestly. Here's where the popular free ones stand:",
      null,
      null,
      null,
      null,
      "A free headless CMS paired with Next.js can genuinely help SEO, if it's set up right. Worth following:",
      "1. Server-Side Rendering (SSR): use Next.js's SSR so search engines can crawl content without friction. It also helps page load speed and Core Web Vitals.",
      "2. Metadata management: keep it dynamic, pulled straight from the headless CMS as content changes, instead of manually updated. It shows up directly in click-through rates.",
      "3. Structured data: schema markup gives search engines context on what they're actually looking at, and it's usually what unlocks rich snippets in results.",
      "Put Next.js and a free headless CMS together and you get fast, SEO-friendly apps without much extra effort on the user experience side.",
      null,
      null,
      "A headless CMS brings its own SEO problems if you're not paying attention. The big one is indexing: without SSR set up properly, bots can struggle with JavaScript-rendered content and just fail to index it. Juggling multiple frontend frameworks across a team without alignment makes SEO practices inconsistent too. And because there's no default SEO setup out of the box, it's easy to skip meta tags, structured data, or canonical links entirely.",
      null,
      "Fixing these problems usually starts with server-side rendering or pre-rendering, so content is actually there for search engines to crawl. Monitoring crawl behavior with the right tools catches indexing issues early. Keeping the sitemap current and robots.txt correctly configured helps too, and auditing metadata and structured data regularly keeps every page in shape for discovery.",
      null,
      "Headless SEO problems mostly get solved when development and SEO teams actually talk to each other regularly. Good communication means both sides understand what's technically possible and what SEO actually needs. Practices worth keeping:",
      null,
      null,
      null,
      null,
      "That kind of partnership keeps SEO baked into development instead of bolted on afterward, which is where content optimization actually pays off, especially with free headless CMS for Next.js in the mix.",
      null,
      "A solid headless cms seo setup starts with SSR or pre-rendering, so crawlers get full HTML fast. From there, keep metadata generation and schema rules consistent across pages and locales. And check indexation and Core Web Vitals monthly, because headless cms seo performance holds up only when technical quality and publishing discipline both stay in place."
    ]
  },
  "47": {
    "es": [
      null,
      null,
      "Aquí reviso las ventajas de automatizar sitemaps XML y cómo implementarlo bien, con foco en el impacto real sobre la arquitectura SEO y un método accesible para generarlos.",
      null,
      null,
      "Un sitemap XML es, en esencia, un archivo con la lista de URLs de tu sitio en un formato que el buscador entiende sin esfuerzo. Le dice a Google cómo están organizadas tus páginas, cómo se relacionan entre sí y cuál pesa más que cuál. También puede llevar metadatos por URL: fecha de última modificación, frecuencia de actualización, prioridad relativa. Sin sitemap, algunas URLs simplemente quedan fuera del radar del buscador y nunca se indexan. Por eso terminó siendo una pieza básica de cualquier estrategia SEO seria.",
      null,
      null,
      null,
      null,
      "La automatización en la creación de sitemaps XML libera tiempo real de SEO. Con Octopus.do, esa tarea se simplifica bastante, así que los equipos de marketing y desarrollo pueden enfocarse en otras cosas mientras el sitio se mantiene bien indexado.",
      null,
      "Octopus.do se ganó su lugar como herramienta para automatizar sitemaps XML, sobre todo porque no exige curva de aprendizaje. Lo que más se usa de ella:",
      null,
      null,
      null,
      null,
      null,
      null,
      "Octopus.do no solo agiliza el armado de sitemaps XML, también trae beneficios concretos para el SEO:",
      null,
      null,
      null,
      ": un sitemap XML bien estructurado ordena el crawl budget, así el buscador enfoca el rastreo en las páginas que de verdad importan.",
      null,
      "Octopus.do genera el sitemap automáticamente mediante un rastreo eficiente. Así funciona el proceso, paso por paso:",
      null,
      null,
      null,
      "Con estos pasos automatizados, armar sitemaps a mano queda en el pasado, y el equipo puede enfocarse en estrategia de SEO y contenido de verdad, con el sitio siempre actualizado para rendir bien en los buscadores.",
      null,
      "Automatizar la creación de sitemaps XML es una palanca real para el rendimiento SEO de un sitio. Hay varios métodos para lograr que un sitemap sea eficiente, esté actualizado y se entienda bien por el buscador. Estas son las estrategias que más rinden.",
      null,
      "El rastreo completo escanea cada página y elemento del sitio para armar un sitemap XML integral. Vale especialmente para sitios grandes o con contenido dinámico, porque asegura que ninguna URL relevante se quede afuera. De paso recopila también las etiquetas SEO importantes, títulos y descripciones, lo que hace que el sitemap tenga más sentido.",
      "La tabla siguiente resume las consideraciones y beneficios del rastreo completo:",
      null,
      "Si ya tienes un sitemap XML, partir de ahí es más rápido: te da una base real de la estructura actual del sitio. Eso sí, hay que revisar que esté completo y actualizado, porque un sitemap deficiente termina representando mal la estructura real del sitio.",
      null,
      null,
      null,
      "Automatizar la creación de sitemaps también significa poder actualizarlos solos, algo clave para que sigan siendo útiles. Estas son las consideraciones técnicas que ayudan:",
      null,
      null,
      null,
      "Estas consideraciones le facilitan la vida al administrador del sitio y de paso mejoran bastante la eficiencia de indexación, lo que termina reflejándose en mejor experiencia de usuario y mejor rendimiento SEO.",
      null
    ],
    "en": [
      null
    ]
  },
  "48": {
    "es": [
      "La arquitectura de renderizado que elijas afecta directamente cómo Google descubre y clasifica tu contenido. Si obligas al buscador a interpretar JavaScript del lado del cliente en cada visita, los retrasos de indexación se disparan. Para 2026, Server-Side Rendering (SSR) y Static Site Generation (SSG) siguen siendo los que ganan tráfico orgánico de forma consistente.",
      "Te explico por qué el Client-Side Rendering (CSR) conviene reservarlo para plataformas cerradas, y cómo planificar tu proyecto web sin equivocarte en esta decisión técnica.",
      null,
      "El debate de fondo es dónde se resuelve el código: en el servidor o en el navegador. Esa decisión define qué tan rápido y qué tan limpio le llega tu contenido a los rastreadores.",
      null,
      ". Para mí esto no se negocia: cualquier contenido pensado para capturar una búsqueda tiene que llegar como HTML ya renderizado, servido directamente en la primera respuesta del servidor.",
      null,
      null,
      "En Client-Side Rendering (CSR), el servidor entrega un HTML casi vacío junto con paquetes pesados de JavaScript (típico de una SPA). El navegador del usuario es quien paga el costo: descargar, compilar y ejecutar esos scripts para armar el DOM y traer los datos.",
      "Impacto SEO práctico: un sitio en CSR obliga a Googlebot a mandar tu contenido a la cola diferida de su Web Rendering Service (WRS). Eso retrasa la interpretación del contenido y consume recursos de rastreo que podrían ir a otras páginas. Yo evito este patrón en cualquier proyecto donde el tráfico orgánico compita de verdad.",
      null,
      "En Server-Side Rendering (SSR), el backend intercepta la solicitud, corre la lógica de la aplicación, consulta la base de datos y arma el HTML final completo antes de devolverlo al visitante.",
      "Impacto SEO práctico: es la solución que uso para necesidades dinámicas, portales de noticias, resultados transaccionales. El rastreador recibe el HTML ya resuelto, sin pasar por la cola diferida del WRS, lo que da rastreo más rápido y predecible.",
      null,
      null,
      null,
      null,
      ", que reduce el TTFB prácticamente a cero. Para enciclopedias, plataformas corporativas que cambian poco y redes de blogs, es la que recomiendo sin dudarlo.",
      null,
      "Incremental Static Regeneration (ISR) permite ir refrescando páginas estáticas de a poco, regenerando partes puntuales del sitio en segundo plano sin detener nada. Es la evolución más moderna que existe hoy sobre SSG puro.",
      null,
      null,
      null,
      null,
      "Antes de escribir código de producción, evalúa qué arquitectura le conviene a tu proyecto con esta matriz:",
      null
    ],
    "en": [
      null,
      ", picking between Server-Side Rendering (SSR) and Client-Side Rendering (CSR) changes how content actually gets delivered and indexed. This piece walks through the real differences behind ssr vs csr seo, benefits and trade-offs included.",
      "Developers and business owners optimizing for both performance and search visibility need to understand how these rendering approaches actually work under the hood, and what each one means for SEO.",
      null,
      "With Server-Side Rendering (SSR), the server builds and sends a fully-formed HTML document as soon as a request comes in. Client-Side Rendering (CSR) works the other way: the browser runs scripts to render content after the initial HTML has already loaded. That difference matters for SEO, because how content shows up changes how it gets crawled and indexed.",
      null,
      "With SSR, the server processes the request, pulls the data it needs, and renders the full HTML before sending anything back. So the page arrives with text, images, and metadata already in place, no extra JavaScript execution required before the browser can show it. That's good for the user, and it's good for SEO, because bots can crawl and index the content without guessing what's supposed to render.",
      null,
      "SSR has a real edge over CSR for SEO, mostly because the rendered content is already sitting in the HTML from the start. What that buys you:",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      "With Client-Side Rendering (CSR), the browser takes over rendering after the initial page load, leaning heavily on JavaScript frameworks to update content dynamically without a full page reload. That's why CSR shows up so much in single-page apps, dashboards, and real-time collaboration tools, places where users expect a lot of interactivity and hate waiting on page refreshes.",
      null,
      "CSR is great for interactivity, but it comes with real SEO trade-offs. The main ones:",
      null,
      null,
      null,
      null,
      null,
      "Leaning on CSR tends to hurt loading speed and engagement metrics. Since rendering depends on a chain of JavaScript operations, users can wait noticeably longer before anything becomes interactive, which shows up directly in First Contentful Paint (FCP) and Time to Interactive (TTI). And because search engines weigh performance heavily in ranking, the csr vs ssr seo trade-off becomes a real competitive factor, not just a technical detail.",
      null,
      "SSR versus CSR ends up shaping how a site performs and shows up in search results. Here's a direct comparison: crawling and indexing differences, metadata handling, and user experience metrics.",
      null,
      "SSR hands over a fully rendered HTML document on request, which makes crawling and indexing straightforward. All the critical information sits in that initial response. CSR struggles here: since content renders dynamically in the browser after load, search engines can miss essential data, and indexing suffers. For sites where SEO actually matters, that crawling efficiency alone tends to tip the decision toward SSR.",
      null,
      null,
      null,
      null,
      "User experience drives engagement and overall site performance more than people give it credit for. SSR delivers content fast, which improves First Contentful Paint (FCP) and matches up well with Google's Core Web Vitals, both of which affect SEO ranking. CSR tends to introduce delays, since the browser has to execute scripts before anything renders, and that shows up in worse user experience metrics. Line them up side by side and SSR usually wins on performance, which matters for both retention and rankings.",
      null,
      "SSR versus CSR is a decision with real SEO weight behind it. Both approaches shape how content gets indexed and rendered, which then shows up directly in visibility and performance.",
      null,
      "Indexation completeness is the core concern in the CSR vs SSR SEO debate. SSR generates fully rendered HTML on the server and delivers it to search engines without delay, so crawlers can grab everything right away. CSR depends on the browser rendering content after load, which means critical elements can be missing from the initial HTML. Search engine bots then skip over parts of the page, and that shows up as incomplete indexation and lower visibility.",
      "That incomplete indexation hits hardest on pages with dynamic content or heavy JavaScript rendering. If key data isn't there on the initial load, it may never get indexed, which quietly caps organic traffic. That's the real reason content availability between CSR and SSR is worth understanding before optimizing for SEO, not after.",
      null,
      "Googlebot has gotten a lot better at rendering JavaScript, but it's not perfect. SSR still has a consistent edge, since bots receive fully-rendered HTML and interpret it accurately. With CSR, the bot has to execute scripts to render the page, and that's where inconsistencies creep in. Relying only on JavaScript-rendered content leaves real room for SEO problems.",
      "The environment bots operate in has its own limits, and that affects how well they handle JavaScript. Pages leaning on asynchronous data fetching or complex client-side frameworks can fail to execute correctly, which raises the odds of incomplete rendering and indexing problems. Bot behavior is something worth factoring in before betting on CSR for an SEO strategy.",
      null,
      "Metadata and Open Graph tags need to be accurate and available, since they shape both search results and how content looks when shared on social media. With SSR, metadata comes baked into the server-rendered HTML, so search engines see title tags, meta descriptions, and Open Graph data right away, all of which drive click-through rates.",
      "CSR makes metadata management messier. If those tags only get populated dynamically via JavaScript and aren't in the initial HTML, search engines can miss or misindex them. That inconsistency shows up in how listings display and can quietly undercut a brand's presence on social platforms too.",
      "Good metadata management is where a lot of SEO value actually comes from, and it's one more reason SSR tends to win out over CSR for sites that care about visibility and brand representation across platforms.",
      null,
      "Choosing SSR over CSR can move the needle on SEO results in a real way. Knowing when to reach for SSR matters most in competitive markets, where visibility and performance both count.",
      null,
      "SSR pays off most for sites that need content delivered fast, both to users and to bots. Where it tends to shine:",
      null,
      null,
      null,
      null,
      null,
      "Going with SSR means budgeting for specific technical requirements up front. Worth evaluating before committing:",
      null,
      null,
      null,
      null,
      null,
      null,
      "SSR pays off especially well on certain kinds of sites. E-commerce, news, and content-heavy sites all show how SSR closes the gap between user experience and SEO. What it brings:",
      null,
      null,
      null,
      "In the csr vs ssr seo debate, SSR tends to build a stronger digital footprint over time, especially once it's tuned for heavy content and real user engagement.",
      null,
      "CSR does have SEO trade-offs, but that doesn't rule it out everywhere. In applications where interaction and interface responsiveness matter more than search visibility, CSR still makes sense despite the SEO cost.",
      null,
      "CSR is at its best in highly interactive interfaces: single-page apps, real-time dashboards, social networks. In those cases user experience comes first, and dynamic updates, live notifications, and rich interactivity aren't optional extras. That's reason enough for a business to pick CSR if it drives retention. A project management tool is a good example: users interact constantly without waiting on a server round trip for every click.",
      null,
      "CSR's SEO problems aren't unfixable. Pre-rendering helps a lot: generate the initial content on the server and serve it on first load, which improves load times and gets critical content into the HTML where it can actually be indexed. Adding server-side rendering just for the pages that matter, inside an otherwise client-rendered app, is often the practical middle ground between interactivity and SEO.",
      "Structured data markup is worth adding regardless. Mark up the relevant information correctly and search engines understand and index the content a lot better. Dynamic rendering helps too: it lets search engines see a fully rendered page as if it came from SSR, while users still get the CSR interface. That combination covers a lot of CSR's SEO gaps without giving up the interactivity.",
      null,
      "Combining SSR and CSR gets you the strengths of both. SSR handles the initial load, so essential content is there for indexing and for the user right away. From there, CSR takes over for navigation and interface updates, so those interactions stay fast without hitting the server every time. It's a setup that helps SEO and user experience at once, without trading one for the other.",
      null,
      null,
      null,
      "Beyond the basic csr vs ssr seo debate, there are more advanced techniques worth knowing that address the real limitations of both rendering strategies.",
      null,
      "Pre-rendering through Static Site Generation (SSG) is a solid answer for SEO performance. Pages get built at build time instead of runtime, so users and search engines both get a fully generated page. That cuts load times and improves First Contentful Paint (FCP), which matters for both users and rankings. Because the critical information is already sitting in the HTML, indexation improves too, solving one of CSR's core problems. SSG works especially well for blogs or documentation sites where content doesn't change often.",
      null,
      "Dynamic rendering is a practical fix for SEO problems on heavily JavaScript-dependent sites. It detects the user-agent and serves pre-rendered HTML to search bots while regular users still get the full CSR experience. That way search engines crawl and index the content properly without losing the interactivity CSR offers users. It's a bridge between CSR and SSR, and it works especially well for e-commerce sites or large product catalogs built around real-time interaction.",
      null,
      "Modern frameworks like Next.js make SEO optimization easier in both SSR and CSR setups. Its automatic static optimization generates pages statically by default, which gives you SSR's speed and indexability while still allowing dynamic content when it's needed. That combination handles the slow-load and incomplete-indexing problems usually tied to CSR. Next.js also has built-in metadata management, so consistency and visibility in search results don't require extra tooling. A modern framework like this lets a site take what it needs from both SSR and CSR instead of picking one.",
      null,
      "Measuring the actual SEO impact of SSR versus CSR matters if you want to optimize web performance instead of guessing. Understanding how each rendering technique affects specific SEO metrics is what lets developers and technical SEOs make an informed call.",
      null,
      null,
      null,
      "Crawlers, Googlebot included, prefer content that's easy to get to. That's why SSR usually boosts indexing, the fully rendered HTML is just there. CSR can introduce delays that hurt indexing instead. Regular audits with these tools keep a web app competitive in the csr vs ssr seo landscape.",
      null,
      "Google Search Console is the tool for diagnosing rendering issues that come from CSR. Performance data there shows exactly which pages struggle to get indexed properly. Metrics like Crawl Errors and Mobile Usability give a deeper read on how rendering affects visibility and rankings, and developers can pinpoint the cases where JavaScript execution causes incomplete indexing, a common CSR pitfall.",
      "Digging into these metrics over time often reveals whether it's time to move to SSR, or at least clean up the CSR implementation. Data beats guesswork here, and it's what actually sharpens decisions in the csr vs ssr seo debate.",
      null,
      "Strong SEO performance isn't a one-time setup, whether you're on SSR or CSR. A/B testing different pieces of the site architecture tends to reveal which rendering strategy actually fits the business goals. Rolling out changes in a controlled way keeps the site adapting to user needs without losing track of SEO outcomes.",
      "Reviewing performance metrics and Search Console data regularly lets a technical team iterate fast on what they find. Pre-rendering and dynamic rendering both help mitigate CSR's SEO issues without giving up its interactivity. Keep that cycle of review and improvement going, and a business stays ahead on both search visibility and user experience.",
      null
    ]
  },
  "49": {
    "es": [
      "El schema markup es una pieza clave del ",
      " moderno: ayuda a los buscadores a entender y mostrar mejor tu contenido. En esta guía repaso lo esencial del schema markup, sus tipos, cómo implementarlo, y los beneficios reales que aporta a tu estrategia de SEO en 2026.",
      "Con los datos que aporta el schema markup mejoras la visibilidad de tu sitio y el engagement de quien lo visita. Así seas desarrollador, especialista en SEO técnico o dueño del negocio, aquí vas a encontrar lo que necesitas para optimizar tu presencia online.",
      "Entendiendo el Schema Markup",
      "Definición y conceptos clave",
      "El schema markup es un tipo de dato estructurado que se incrusta en el HTML de un sitio para darle al buscador pistas explícitas sobre qué significa el contenido de una página. A diferencia del HTML tradicional, que solo se ocupa de cómo se presenta el contenido, el schema markup agrega una capa de detalle que ayuda al buscador a entender la relación entre distintas entidades y sus propiedades. Esa estructura es lo que termina mejorando cómo se indexa la página, y con eso, su visibilidad en los resultados de búsqueda.",
      "La idea central del schema markup es describir los elementos de una página con un formato estandarizado, así sea un producto, una organización, un evento o una reseña. Usarlo bien hace que tu información se represente con más precisión en los resultados de búsqueda, y que a la gente le sea más fácil encontrar justo lo que busca.",
      "El rol del vocabulario de Schema.org",
      "Schema.org es la base de todo esto: un vocabulario colaborativo que desarrollaron en conjunto Google, Bing, Yahoo y Yandex. Da un marco estandarizado para presentar información. Desde que arrancó en 2011, creció hasta cubrir más de 800 tipos de schema, cada uno pensado para un tipo de contenido o escenario distinto.",
      "Adoptar el vocabulario de schema te deja definir entidades y sus atributos de una forma que el buscador reconoce sin ambigüedad. El schema \"Person\", por ejemplo, te permite marcar el nombre, el cargo y los perfiles sociales de una persona. Esa representación detallada es la que alimenta los knowledge graphs, la base de los rich snippets y de una mejor experiencia de búsqueda en general.",
      "En resumen: el schema markup y el vocabulario de Schema.org definen cómo el buscador interpreta y muestra tu contenido, y eso termina impactando directamente en el engagement y en qué tan efectiva es tu estrategia de SEO, en 2026 y después.",
      "Cómo funciona el schema markup",
      "El schema markup arma una estructura de información que le facilita al buscador entender el contenido de una página, y esa comprensión es la que determina si aparecen resultados enriquecidos y relevantes ante una búsqueda. Sus piezas básicas son entidades, propiedades y relaciones, y de esas tres depende que la técnica funcione.",
      "Entidades, propiedades y relaciones",
      "En el fondo, el schema markup define entidades, así sean personas, lugares, productos, conceptos o eventos. Cada entidad tiene un set de propiedades, los atributos que la describen en detalle: un producto, por ejemplo, tiene nombre, precio y disponibilidad. Y más allá de las entidades y sus propiedades, el schema markup también define cómo se relacionan entre sí. Entender esas conexiones es lo que le permite al buscador armar una representación más coherente de toda la información disponible.",
      "Esa estructura es la que permite construir knowledge graphs, una representación visual de cómo se relacionan las entidades. El buscador usa esos grafos para mejorar la relevancia y precisión de lo que le muestra al usuario. Con schema markup bien implementado, tu contenido se entiende mejor, y eso se traduce en más visibilidad en los resultados de búsqueda (SERPs).",
      "Knowledge graphs y mejoras en la búsqueda",
      "Los knowledge graphs son clave para enriquecer la experiencia de búsqueda. Organizando bien los datos, el schema markup ayuda a construir esos grafos, que resaltan información de contexto alrededor de cada búsqueda. Cuando alguien busca algo, el buscador usa ese dato estructurado para entregar respuestas relevantes y con más detalle.",
      "Un restaurante que implementa schema markup, por ejemplo, puede terminar con un listado que muestra calificaciones, horarios y el menú directamente en los resultados de búsqueda. Eso mejora la experiencia porque la información está ahí, de un vistazo, y aumenta la probabilidad de clic gracias a un resultado que se ve mejor. Los negocios que lo implementan bien suelen ver mejoras reales en el CTR y en el engagement, porque el usuario llega más informado y decide más rápido.",
      "En general, entender cómo funciona el schema markup es la base para optimizar bien tu contenido. La relación entre entidades, propiedades y cómo alimentan los knowledge graphs es lo que termina definiendo la visibilidad y el rendimiento de un sitio en los rankings.",
      "Beneficios SEO del schema markup",
      "Implementar schema markup le suma ventajas reales a una estrategia de SEO, sobre todo en visibilidad y rendimiento. Al darle al buscador un dato estructurado, entiende mejor tu contenido, y eso mejora cómo se muestra en los resultados.",
      "Impacto en el CTR",
      "Uno de los beneficios más claros del schema markup es el aumento en el CTR. Los sitios que lo usan para generar rich snippets ven un salto real en engagement. Algunos estudios muestran que los resultados enriquecidos con schema pueden subir el CTR entre 20% y 30%, porque listados con calificación en estrellas, precio y disponibilidad simplemente llaman más la atención. Y un CTR más alto no solo trae más tráfico, también le dice al buscador que el contenido es relevante, lo que puede terminar mejorando el ranking.",
      "Mejorando el contexto y la relevancia del contenido",
      "El schema markup ayuda mucho a darle contexto al contenido dentro de los resultados de búsqueda. Al definir entidades, propiedades y relaciones con datos estructurados, le facilita al buscador entender de qué se trata cada pieza. El schema de Article, por ejemplo, ayuda a distinguir una noticia de un post de blog, así el usuario ve resultados más relevantes para lo que busca. Con el contexto claro, el contenido calza mejor con la intención de búsqueda, y eso se nota en mejor engagement y menos rebote.",
      "Schema markup para búsquedas potenciadas por IA",
      "A medida que el buscador mete más IA en sus algoritmos, el schema markup se vuelve más importante, no menos. Funciones como los featured snippets o la búsqueda por voz dependen fuerte de datos estructurados para entregar información precisa y en contexto. El schema markup es la base de esas aplicaciones de IA: le da claridad y especificidad a cada elemento del contenido. Si lo implementas bien, tus páginas tienen más chance de que un sistema de IA las elija para mostrar información, y eso suma visibilidad en un entorno cada vez más competido.",
      "Tipos esenciales de schema markup",
      "Cada tipo de schema markup cambia cómo el buscador interpreta el contenido de una página. Vale la pena saber cuáles le sirven a tu modelo de negocio y a tu estrategia de contenido. Estos son los tipos que más pesan para la visibilidad de tu sitio.",
      null,
      "Organization Schema define la entidad detrás de un negocio o sitio web, y le permite al buscador conectar esa entidad con sus distintas presencias online. Incluye datos como:",
      "Nombre de la organización",
      "URL del logo",
      "Información de contacto",
      "Perfiles en redes sociales",
      "Con Organization Schema bien implementado, pueden aparecer knowledge panels en los resultados, que le dan al usuario un vistazo rápido de la marca y suman confianza.",
      null,
      "Local Business Schema extiende a Organization Schema agregando detalles de ubicación, algo clave para negocios con local físico. Incluye:",
      "Horario de atención",
      "Reseñas de clientes",
      "Servicios que ofrece",
      "Dirección y coordenadas geográficas",
      "Implementado bien, Local Business Schema mejora el SEO local y hace que sea más fácil que te encuentren en plataformas como Google Maps.",
      null,
      "Product Schema da información detallada sobre los productos de un sitio de e-commerce. Incluye atributos como:",
      "Nombre",
      "Descripción",
      "Imagen",
      "Precio",
      "Estado de disponibilidad",
      "Usar Product Schema mejora la visibilidad de tus productos en los resultados de búsqueda, y suele traducirse en rich snippets que suben el CTR.",
      null,
      "Article Schema se enfoca en la visibilidad del contenido escrito, y le facilita al buscador entender de qué trata un artículo. Al implementarlo, datos como:",
      "Titular",
      "Información del autor",
      "Fecha de publicación",
      "Imagen destacada",
      "se comunican mejor, y eso mejora tus chances de posicionar más arriba en los resultados.",
      null,
      "Review Schema le permite a un negocio mostrar reseñas y calificaciones de forma destacada en los resultados. Puede incluir:",
      "Calificación en estrellas",
      "Fragmentos de reseñas",
      "Autor de la reseña",
      "Review Schema ayuda a generar confianza con clientes potenciales, y de paso hace que el resultado en el buscador se vea más atractivo.",
      "Métodos para implementar schema markup",
      "Implementar bien el schema markup es la base para que el buscador entienda tu contenido. Hay varios métodos disponibles, cada uno con sus ventajas y sus propias buenas prácticas.",
      "Formato JSON-LD y buenas prácticas",
      "JSON-LD (JavaScript Object Notation for Linked Data) es hoy el formato más recomendado para implementar schema markup. Te deja incrustar el dato estructurado dentro de un tag script en el HTML, separado del contenido visible. Esa separación facilita el mantenimiento y evita choques con otros atributos del HTML.",
      "Con JSON-LD conviene seguir un par de buenas prácticas. Primero, que el markup refleje de verdad el contenido de la página. Usa el vocabulario oficial de Schema.org para definir entidades y propiedades correctamente, con el tipo correcto (organización, producto, lo que sea), así el buscador interpreta bien el dato. Y coloca el JSON-LD cerca del final de la sección, o justo antes del tag de cierre, para evitar problemas de renderizado sin afectar la velocidad de carga.",
      "Microdata y RDFa",
      "Microdata y RDFa (Resource Description Framework in Attributes) son alternativas para agregar schema markup directo en el HTML de la página. Microdata incrusta el markup dentro de los elementos HTML existentes, lo que hace la estructura más integrada al documento. Puede complicar un poco el código, pero deja una relación clara entre el contenido y su dato estructurado.",
      "RDFa, por su parte, extiende HTML5 con atributos adicionales para meter dato estructurado directo en el contenido. Puede ser eficiente, pero suele dejar un HTML más pesado, por eso se usa menos que JSON-LD en la mayoría de los casos. Con cualquiera de los dos métodos hay que tener cuidado de que el markup refleje bien el contenido, para no confundir al buscador con inconsistencias.",
      "Cómo elegir el formato correcto para tu sitio",
      "Qué formato elegir depende de las necesidades del sitio y de qué tan cómodo esté el equipo de desarrollo con cada opción. Para la mayoría, JSON-LD es la opción preferida justo por su simplicidad y porque queda separado del contenido, lo que reduce el riesgo de errores y encaja bien con las prácticas actuales.",
      "Microdata puede convenir en sitios simples, o donde tenga sentido meter el dato directo en el HTML. RDFa es potente, pero rinde mejor en entornos con relaciones de datos más complejas. Al final, la elección pasa por qué tan fácil es de implementar, cómo se mantiene a futuro, y si es compatible con el CMS que ya tienes.",
      "Validar y probar el schema markup",
      "Validar y probar el schema markup no es un paso opcional: un error ahí puede hacer que los rich snippets simplemente no aparezcan, y se pierde todo el beneficio. Por eso conviene apoyarse en herramientas confiables para validar y corregir la implementación.",
      "Herramientas para validar schema",
      "Hay varias herramientas buenas para esto. La más usada es el Google Rich Results Test, que no solo revisa si el dato estructurado es válido, también dice si puede generar rich results. Con solo pegar una URL o el código, tienes feedback inmediato sobre cualquier problema, y hasta sugerencias de cómo corregirlo.",
      "Otra herramienta clave es el Schema Markup Validator, que reemplazó a la vieja Structured Data Testing Tool. Valida tu schema markup contra las especificaciones más recientes de Schema.org, y da un desglose completo de errores o advertencias.",
      "Si prefieres algo más integrado, varios CMS y herramientas de SEO como Moz o SEMrush ya traen validación de schema incorporada, como parte de un análisis de SEO más amplio.",
      "Resolver los errores más comunes",
      "Incluso con buenas herramientas, es normal que aparezcan errores al implementar schema markup: atributos requeridos que faltan, errores de schema anidado, tipos de dato incorrectos. Hay que resolverlos rápido. Con Product Schema, por ejemplo, si te falta la propiedad price o availability, simplemente no vas a tener rich results.",
      "Otro error común: que el markup no coincida con el contenido visible de la página. El buscador compara ambos, y las inconsistencias pueden traer advertencias o hasta penalizaciones. Mantener el dato estructurado alineado con el contenido HTML real no es negociable.",
      "Las actualizaciones al vocabulario de schema también pueden dejar propiedades obsoletas. Revisar la documentación y las herramientas de validación de forma regular ayuda a detectar y corregir eso antes de que afecte tu visibilidad.",
      "Monitorear y probar de forma continua es lo que mantiene el schema markup funcionando bien a medida que cambian los estándares y los algoritmos. Mantenerte al día con las herramientas de validación termina reflejándose en mejor rendimiento en los resultados de búsqueda.",
      "Cómo medir el impacto del schema markup en el SEO",
      "Medir el impacto real del schema markup es lo que te dice si de verdad está funcionando, en visibilidad y en engagement. Una implementación bien estructurada cambia bastante cómo se presenta tu contenido en los resultados. Siguiendo las métricas correctas puedes ajustar la estrategia y sacarle más valor.",
      "Cómo seguir el rendimiento de los rich results",
      "Los rich results son listados de búsqueda mejorados, que muestran información extra, y pueden subir bastante el CTR y el engagement. Para seguir cómo rinden, conviene apoyarse en herramientas como ",
      ". Esa plataforma te muestra cómo están rindiendo tus rich results: visibilidad en búsqueda, impresiones y clics asociados a cada tipo de schema. La tabla siguiente resume las métricas clave para evaluar ese rendimiento:",
      "Con esas métricas, un especialista en SEO puede medir si el schema markup está funcionando y ajustar la estrategia según lo que ve.",
      "Métricas de analítica a seguir",
      "Más allá de los rich results, conviene mirar las métricas generales del sitio para entender el impacto real del schema en el SEO. Google Analytics te da datos de comportamiento, fuentes de tráfico y conversión, que ayudan a ver si el esfuerzo está dando resultado. Las métricas que más importan: - Fuentes de tráfico: de dónde viene tu visitante y si el schema markup está empujando tráfico orgánico. - Tasa de rebote: si baja, suele indicar que los rich results están atrayendo tráfico más calificado. - Duración de sesión: cuánto tiempo se queda alguien que llegó por un rich result, para medir si el contenido de verdad calza con lo que buscaba. - Conversiones: qué acciones toma la gente, formularios, compras, para saber si el rich result realmente lleva a algo. Combinando el rendimiento de los rich results con estas métricas generales, puedes tomar decisiones más informadas para lo que sigue.",
      "Mantenimiento y actualización del schema markup",
      "Mantener y actualizar el schema markup es lo que asegura que el dato estructurado siga siendo relevante y siga ayudando a tu visibilidad. Como el buscador cambia y Schema.org sigue creciendo, hacer auditorías y actualizaciones regulares es necesario para no quedarte atrás de las buenas prácticas.",
      "Mantenerte al día con los cambios de Schema.org",
      "Schema.org es un proyecto colaborativo que agrega tipos y propiedades nuevas todo el tiempo, para representar mejor los matices de cada tipo de contenido. Estar al tanto de esos cambios es clave para que tu estrategia de schema siga siendo efectiva. Revisar el sitio de Schema.org de forma regular, o suscribirte a algún newsletter o foro relacionado, te mantiene al día.",
      "Además, buscadores como Google también cambian sus lineamientos sobre cómo interpretan o muestran cada tipo de schema. Cuando mejoran cómo los knowledge panels recogen datos del schema markup, por ejemplo, eso suele abrir nuevas oportunidades para destacar tu oferta. Conviene implementar esos cambios pronto, para aprovechar lo nuevo y no perder visibilidad.",
      "Auditar y refinar tu markup con el tiempo",
      "Auditar tu implementación de schema markup de forma regular debería ser rutina, no una excepción. Eso ayuda a detectar contenido desactualizado, errores o inconsistencias que puedan estar afectando el rendimiento. Revisar propiedades obsoletas, confirmar que todo cumple con el estándar más reciente de Schema.org, y verificar que el markup refleje el contenido real de tu sitio, son parte de esa auditoría.",
      "Refinar el schema markup con el tiempo también suma. Si tu sitio o tu negocio cambian, el dato estructurado debería cambiar con ellos: actualizar los tipos de schema para que reflejen productos o servicios nuevos, o un modelo de negocio distinto. Esos ajustes se traducen en mejor representación en los resultados y mejor CTR.",
      "Usar herramientas de validación de forma constante ayuda a corregir errores y mantener el estándar. Prestarle atención al feedback que dan las herramientas del buscador te dice qué tan bien está rindiendo tu markup y dónde se puede mejorar.",
      "Mantener el schema markup no es algo que se hace una vez y ya. Requiere estar atento, porque el entorno digital cambia rápido. Manteniéndote al día con las actualizaciones de Schema.org y haciendo auditorías regulares, tu dato estructurado sigue siendo relevante y sigue aportando al SEO.",
      null
    ],
    "en": [
      "Understanding schema markup matters if you want your site's ",
      " to actually improve in 2026. This guide covers what schema markup does and why it helps search engines understand your content and boosts visibility.",
      "I'll go through the different schema types, what each one actually does, and how to implement them properly. By the end you'll have what you need to use schema markup well.",
      null,
      null,
      "Schema markup is structured data added to a page's HTML that gives search engines explicit clues about what the content actually means. That clarity helps them classify and interpret it more accurately. The vocabulary behind it comes from Schema.org, a joint effort by Google, Bing, Yahoo, and Yandex that started back in 2011. Implement it well and search engines can pick out entities, properties, and how they relate, which shows up as better visibility in results.",
      null,
      "Schema markup's main job is helping search engines understand context, instead of leaving everything to algorithmic guesswork. It gives a clear framework for identifying products, organizations, events, reviews, whatever the page is actually about, so results end up more relevant. That's also what triggers rich snippets, which tend to boost click-through rate and engagement.",
      null,
      "Schema.org's vocabulary has grown a lot since it started, past 800 types of structured data by now, covering everything from businesses to products to creative works. As search queries get more complex and users expect more contextually relevant answers, schema markup keeps mattering more, not less, especially as AI-driven search leans harder on structured data for context.",
      null,
      "Schema markup genuinely helps visibility and performance in search results. As search engines keep evolving, structured data has become close to a requirement for a solid SEO strategy, and knowing why is what gives you an edge.",
      null,
      "The biggest, most measurable benefit of schema markup is click-through rate. Sites using structured data well often see CTR jump 20-30% over standard listings, mostly because rich snippets give users context before they even click, star ratings, images, pricing, availability, all of which make a listing more attractive.",
      null,
      "Schema markup is also what unlocks rich results and featured snippets. The right schema type, Product or Recipe, for example, lets a listing show reviews, prices, or cooking times directly in the SERP. Featured snippets, the concise answers at the top of the page, depend on well-structured data too. Sites that use schema well end up with a real shot at those prime positions, and that usually means more organic traffic.",
      null,
      "Schema markup also improves contextual relevance. Explicit cues about how entities and attributes relate to each other help search engines understand what a page is actually about, and how relevant it is to a given query. Sites using structured data tend to match search intent more precisely, which shows up in rankings for the keywords that matter.",
      null,
      "AI-driven search has raised the stakes for schema markup. Features like Google's Generative Search Experience lean on structured data to answer queries directly, and sites with schema in place are simply easier for those systems to recognize and understand. Skip it, and you're leaving visibility on the table, since these systems prioritize sites with clear, well-defined data. At this point structured data isn't optional if visibility and engagement matter to you.",
      null,
      "Which schema types you implement matters as much as implementing schema at all. Here are the core ones worth knowing.",
      null,
      "Organization schema gives search engines the basics about a business, name, logo, address, contact info, and it's foundational for establishing an online presence. Done right, it uses properties like sameAs to link social profiles and defines the organization type (corporation, local business, non-profit). It's a straightforward way to improve brand recognition in search.",
      null,
      "Local business schema builds on organization schema with location-specific details, and it matters a lot for any business trying to attract local customers, since it directly affects visibility in local search and Google Maps. Worth including:",
      null,
      null,
      null,
      null,
      "Get these in place and a local business shows up better in search and connects more easily with nearby customers.",
      null,
      "Product schema is close to essential for e-commerce, since it puts price, availability, and reviews right into search results. It improves how product information displays and helps search engines match products to what people are actually searching for. It's also what tends to unlock rich results, which usually means a better click-through rate and, often, a real influence on purchase decisions.",
      null,
      "For anyone publishing content, article and blogPost schema improve how articles show up in search. It tells search engines the title, author, publish date, and other metadata clearly. Done well, it improves indexing and can bring richer snippets, images or ratings next to your article in search results, which pulls in more clicks.",
      null,
      "For anyone hosting events, event schema matters for promoting time-sensitive activities well in search. It lets search engines show key details like:",
      null,
      null,
      null,
      null,
      "Event schema makes an event easier to find and engage with, which in practice means better attendance and wider awareness among the people you're trying to reach.",
      null,
      "Implementing schema markup means embedding structured data into a page's HTML so search engines can index and display information properly. Getting it right takes knowing the different formats, sticking to best practices, and using the right validation tools.",
      null,
      "Developers usually pick between three formats for schema markup: JSON-LD, Microdata, and RDFa. Each has its own trade-offs.",
      "JSON-LD (JavaScript Object Notation for Linked Data): Google's recommended format, mostly because it's simple to implement. It goes in as a script tag in the head section, cleanly separated from the visible content.",
      "Microdata: embeds schema markup directly into the page's HTML elements. It keeps the structured data close to the content, but it tends to clutter the HTML and gets harder to manage at scale.",
      "RDFa (Resource Description Framework in Attributes): similar idea to Microdata, embedding metadata in HTML attributes. More flexible, but also trickier to get exactly right.",
      null,
      "Adding schema markup properly comes down to a handful of practices worth following:",
      null,
      null,
      null,
      null,
      null,
      null,
      "Getting schema markup right matters more than just adding it. These tools help validate and test what you've implemented:",
      null,
      null,
      null,
      null,
      "Implemented well, schema markup genuinely moves SEO performance, better indexing, better visibility, not just a checkbox exercise.",
      null,
      "As digital marketing keeps shifting, the more advanced schema markup techniques start to matter for maximizing visibility. They improve data accuracy and, in practice, the overall search experience for users too.",
      null,
      "Nested schema markup lets you embed one schema type inside another, which is useful for showing complex relationships between entities. A product schema nested inside an organization schema, for example, shows that a specific business offers that product. That clarity helps search engines deliver richer snippets, as long as the nested elements are well-defined hierarchically, which matters more for SEO every year.",
      null,
      "Schema.org's standard types cover most use cases, but sometimes a business needs something custom. That usually means extending an existing schema or adding new properties for a specific attribute. A niche e-commerce site selling subscriptions, for instance, might build a custom schema around billing frequency and content access. It's more work, but it can pay off in niche search visibility that generic schema wouldn't capture.",
      null,
      "Putting multiple schema types on one page can enrich how the content gets represented, but it takes care to keep the markup coherent. Product, review, and article schema together, say, can improve the user experience and the odds of showing up in Google's rich results, as long as you avoid redundancy and keep the structure clear. Cross-referencing schema types even helps search engines understand the different contexts on a single page, which ends up mattering for a wider range of queries.",
      null,
      "Monitoring schema markup's actual effectiveness is what tells you if it's delivering the SEO benefits you expected. A handful of tools and techniques can assess that performance and show the real impact on visibility and engagement.",
      null,
      "Google Search Console is the go-to tool for tracking schema markup performance. The Enhancements report shows how Google is actually interpreting your structured data, which schema types it recognizes, and whether anything's blocking them from showing up in search. Keeping an eye on errors and warnings there catches implementation problems before they cost you rich results.",
      "The Coverage report in GSC is also worth checking, since it shows how schema markup is affecting indexability. Google changes its algorithms and reporting features often enough that GSC is worth a regular look, not a one-time setup.",
      null,
      "You can measure rich result performance a few different ways. Organic traffic and CTR are the most direct signal of whether schema is actually working. Google Analytics adds behavioral data, how people interact with rich snippets, and metrics like bounce rate and session duration round out the picture of how users respond to schema-enhanced content.",
      "Third-party tools can add to internal analytics here too, giving a fuller picture of how rich results influence traffic and engagement. Those numbers are what actually tell you whether schema markup is meeting its goal, more visibility, more conversions, not just theoretical benefit.",
      null,
      "Monitoring schema markup usually turns up the same common problems: errors in the structured data, missing properties, wrong data types. Fixing those quickly is what actually gets you the full benefit of schema. Regular validation with the Schema Markup Validator or the Rich Results Test catches most of it before it costs visibility.",
      "Keeping up with Schema.org's documentation and best practices makes troubleshooting a lot easier, since you catch changes before they affect your schema's effectiveness. Being proactive about monitoring and fixing issues, instead of waiting for something to break, is what keeps schema markup actually working over time.",
      null,
      null,
      "In healthcare, schema markup helps medical practices, professionals, and services show up properly in search. Types like MedicalOrganization, Physician, and MedicalCondition give search engines tailored information, which improves result relevancy. For a healthcare provider that might mean specialties, accepted insurance, and office hours, all the details a patient actually needs fast.",
      null,
      "Real estate benefits a lot from schema types like RealEstateAgent and RentalApartment, which let search engines highlight listings with pricing, availability, and location right in the snippet. Beyond SEO, that also means buyers and renters get the vital information faster, and done right, it improves visibility on Google Maps, which translates into actual foot traffic at open houses.",
      null,
      "Educational institutions can use schema markup to showcase courses and programs directly in search. Course and EducationalOrganization types highlight curriculum, instructors, and prerequisites, which makes educational content easier to find and helps prospective students decide with actual information instead of guessing. It can also surface reviews and ratings that reflect program quality.",
      null,
      "Recipe Schema is close to mandatory for food and cooking sites, since it puts ratings, prep time, and ingredients directly into the search result as a preview. That preview both improves visibility and encourages clicks. It also raises the odds of showing up in voice search, which matters more as people look for hands-free recipe answers.",
      null,
      "SEO keeps changing, and schema markup keeps being one of the parts that changes fastest. As search engines adopt new technology and user behavior shifts, a few trends are worth watching if visibility is something you actually care about maintaining.",
      null,
      "Voice search keeps growing, and optimizing for it means dealing with longer, more conversational queries than typed search. Schema markup helps here by clarifying relationships and context, which is what lets search engines give more accurate voice answers. Structured data raises the odds of content getting picked for a voice search result, which matters more every year as optimization stops being purely about text.",
      null,
      "As AI gets more embedded in search, schema markup matters even more, since machine learning algorithms lean on structured data to analyze relationships and context. Sites with schema in place have a real edge, more likely to get picked for featured answers inside AI frameworks. Keeping up with structured data best practices is what keeps that edge as the technology moves forward.",
      null,
      "Schema.org keeps evolving, and staying on top of new standards is part of doing SEO well now. Every new structured data type is a chance at better indexing and richer results. The community behind Schema.org keeps building schemas for emerging trends, so implementing new ones as they land is what keeps a site relevant, not falling behind while competitors adopt them first.",
      null,
      null,
      null
    ]
  }
}

// ---------------------------------------------------------------------
// Tree walk (mirrors the run-grouping used to author REWRITES above)
// ---------------------------------------------------------------------
function rewriteTree(
  node: LexicalNode,
  id: number,
  locale: Locale,
  counter: { i: number },
): LexicalNode {
  if (!node || typeof node !== "object") return node
  if (node.type === "block" || node.type === "table") return node

  if (
    (node.type === "heading" || node.type === "paragraph" || node.type === "listitem") &&
    Array.isArray(node.children)
  ) {
    const newChildren: LexicalNode[] = []
    let run: LexicalNode[] = []
    const flush = () => {
      if (run.length > 0) {
        const idx = counter.i++
        const replacement = REWRITES[id]?.[locale]?.[idx]
        if (replacement !== null && replacement !== undefined) {
          run.forEach((n, i) => {
            n.text = i === 0 ? replacement : ""
          })
        }
        run = []
      }
    }
    for (const child of node.children) {
      if (child.type === "text") {
        run.push(child)
        newChildren.push(child)
      } else {
        flush()
        newChildren.push(rewriteTree(child, id, locale, counter))
      }
    }
    flush()
    return { ...node, children: newChildren }
  }

  if (Array.isArray(node.children)) {
    return { ...node, children: node.children.map((c) => rewriteTree(c, id, locale, counter)) }
  }
  return node
}

// ---------------------------------------------------------------------
// Self-check helpers
// ---------------------------------------------------------------------
function extractText(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (Array.isArray(value)) return value.map(extractText).join("")
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    let out = ""
    if (typeof obj.text === "string") out += obj.text
    if (Array.isArray(obj.children)) out += extractText(obj.children)
    return out
  }
  return ""
}

// Collects every `block`/`table` node found in a tree, keyed by a stable
// path string, for byte-identical pre/post comparison.
function collectStructuralNodes(node: unknown, path: string, out: Map<string, unknown>): void {
  if (!node || typeof node !== "object") return
  const n = node as Record<string, unknown>
  if (n.type === "block" || n.type === "table") {
    out.set(path, JSON.parse(JSON.stringify(n)))
    return
  }
  if (Array.isArray(n.children)) {
    n.children.forEach((child, i) => collectStructuralNodes(child, `${path}.${i}`, out))
  }
}

function structuralNodesMatch(before: Map<string, unknown>, after: Map<string, unknown>): boolean {
  if (before.size !== after.size) return false
  for (const [key, value] of before) {
    if (!after.has(key)) return false
    if (JSON.stringify(after.get(key)) !== JSON.stringify(value)) return false
  }
  return true
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------
async function main() {
  const payload = await getPayload({ config })

  const progress: Record<string, "done"> = fs.existsSync(PROGRESS_PATH)
    ? JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf8"))
    : {}
  const persistProgress = () => {
    fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true })
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
  }

  // Confirm every id exists before touching anything.
  for (const id of IDS) {
    const doc = await payload.findByID({ collection: "posts", id, depth: 0 }).catch(() => null)
    if (!doc) {
      console.error(`FATAL: posts.id=${id} does not exist. Aborting before any writes.`)
      process.exit(1)
    }
  }

  let allDone = true

  for (const id of IDS) {
    if (progress[String(id)] === "done") {
      console.log(`id=${id} already done, skipping.`)
      continue
    }
    allDone = false

    const before = await payload.findByID({ collection: "posts", id, locale: "all", depth: 0 })
    const beforeContent = (before as unknown as { content: Record<Locale, unknown> }).content

    const structuralBefore = new Map<string, unknown>()
    for (const locale of LOCALES) {
      collectStructuralNodes((beforeContent[locale] as { root?: unknown })?.root, `${locale}`, structuralBefore)
    }

    for (const locale of LOCALES) {
      const wrapper = JSON.parse(JSON.stringify(beforeContent[locale])) as { root: LexicalNode }
      const counter = { i: 0 }
      wrapper.root = rewriteTree(wrapper.root, id, locale, counter)

      const expected = REWRITES[id]?.[locale]?.length ?? 0
      if (counter.i !== expected) {
        console.error(
          `FATAL: id=${id} locale=${locale} produced ${counter.i} runs but REWRITES has ${expected}. Document structure may have changed since authoring. Aborting this id.`,
        )
        process.exit(1)
      }

      await payload.update({
        collection: "posts",
        id,
        locale,
        data: { content: wrapper as unknown as Record<string, unknown> },
      })
      console.log(`id=${id} locale=${locale}: wrote ${expected} run(s), ${counter.i} matched.`)
    }

    // Read back and self-check.
    const after = await payload.findByID({ collection: "posts", id, locale: "all", depth: 0 })
    const afterContent = (after as unknown as { content: Record<Locale, unknown> }).content

    const structuralAfter = new Map<string, unknown>()
    for (const locale of LOCALES) {
      collectStructuralNodes((afterContent[locale] as { root?: unknown })?.root, `${locale}`, structuralAfter)
    }

    let failed = false

    if (!structuralNodesMatch(structuralBefore, structuralAfter)) {
      console.error(`SELF-CHECK FAIL id=${id}: block/table nodes are not byte-identical pre/post write.`)
      failed = true
    }

    const esText = extractText(afterContent.es)
    if (EM_DASH_RE.test(esText)) {
      console.error(`SELF-CHECK FAIL id=${id}: em dash found in es content.`)
      failed = true
    }
    if (VOCEO_RE.test(esText)) {
      const match = esText.match(VOCEO_RE)
      console.error(`SELF-CHECK FAIL id=${id}: voceo marker found in es content ("${match?.[0]}").`)
      failed = true
    }
    const enText = extractText(afterContent.en)
    if (EM_DASH_RE.test(enText)) {
      console.error(`SELF-CHECK FAIL id=${id}: em dash found in en content.`)
      failed = true
    }

    if (failed) {
      console.error(`id=${id} NOT marked done due to self-check failure above.`)
      process.exit(1)
    }

    progress[String(id)] = "done"
    persistProgress()
    console.log(`id=${id}: self-check passed, marked done.`)
  }

  if (allDone) {
    console.log(`${IDS.length}/${IDS.length} already done. Re-running self-check on all ids...`)
    let anyFail = false
    for (const id of IDS) {
      const doc = await payload.findByID({ collection: "posts", id, locale: "all", depth: 0 })
      const content = (doc as unknown as { content: Record<Locale, unknown> }).content
      const esText = extractText(content.es)
      if (EM_DASH_RE.test(esText) || VOCEO_RE.test(esText)) {
        console.error(`RE-CHECK FAIL id=${id}: em-dash/voceo present in es content.`)
        anyFail = true
      }
      if (EM_DASH_RE.test(extractText(content.en))) {
        console.error(`RE-CHECK FAIL id=${id}: em-dash present in en content.`)
        anyFail = true
      }
    }
    if (anyFail) process.exit(1)
    console.log("Zero em-dash/voceo findings across all 5 posts. Done.")
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
