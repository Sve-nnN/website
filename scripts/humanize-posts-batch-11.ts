/**
 * Phase 31 Plan 12 (Batch 11 of 13) — humanize Posts ids [61,62,63,64,65]
 * (slugs: guia-keyword-research, estrategia-topic-clusters,
 * enlaces-internos-guia, guia-eeat, programacion-dinamica), both locales,
 * calibrated against research/voice-sample-juan.md and
 * .planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md.
 *
 * `content` is a flat richText field (headings/paragraphs/listitems/lists/
 * tables/code-block embeds) — this script walks the Lexical tree and
 * rewrites ONLY the prose text of `paragraph` and `listitem` nodes (not
 * `heading` — headings are short topic labels already free of AI-tell
 * voice issues, confirmed during authoring; left byte-identical). Any
 * `block` (code-sample embed) or `table` node is skipped entirely, never
 * recursed into, never modified. Inline `link` nodes inside a rewritten
 * paragraph/listitem are preserved by locating their original anchor text
 * verbatim inside the newly authored string and splicing the ORIGINAL link
 * node object back in at that position — so href/fields/format are byte-
 * identical, never touched or rebuilt.
 *
 * Resumable via a checkpoint file: skip any id already marked 'done'.
 * After both locales of a post are written, read back once to confirm the
 * write persisted, then persist progress immediately (not batched).
 *
 * After all 5 ids show 'done', run a self-verification pass: zero em dash /
 * voceo in es content, and byte-identical block/table structure pre vs post.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-posts-batch-11.ts
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const IDS = [61, 62, 63, 64, 65] as const
const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const PROGRESS_PATH = path.resolve(
  __dirname,
  '../.planning/phases/31-content-humanization-posts-case-studies-verificaci-n-final/posts-progress-batch-11.json',
)

type LexNode = {
  type: string
  text?: string
  children?: LexNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

function loadProgress(): Record<string, 'done'> {
  if (fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'))
  }
  return {}
}

function saveProgress(progress: Record<string, 'done'>) {
  fs.mkdirSync(path.dirname(PROGRESS_PATH), { recursive: true })
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2))
}

// Flattens all descendant `text` values (used for reading link anchor text
// and for the final em-dash/voceo self-check extraction).
function flatten(node: LexNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (Array.isArray(node.children)) return node.children.map(flatten).join('')
  return ''
}

function textNode(t: string): LexNode {
  return { mode: 'normal', text: t, type: 'text', style: '', detail: 0, format: 0, version: 1 }
}

// Collects direct/nested `link` nodes within a paragraph/heading/listitem
// (these only ever contain `text` | `link` children per the confirmed live
// schema — no deeper nesting), in document order, each carrying its
// original anchor text and the ORIGINAL node object (reused byte-identical).
function collectLinks(node: LexNode, out: { text: string; node: LexNode }[]) {
  if (node.type === 'link') {
    out.push({ text: flatten(node), node })
    return
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectLinks(child, out)
  }
}

// Rewrites a heading/paragraph/listitem node's children in place: splices
// any original link nodes back in at the position of their anchor text
// inside the newly authored string, everything else becomes a single plain
// text node. Throws if an anchor phrase is missing from the new text (the
// safety net against ever silently dropping a link).
function applyRewrite(node: LexNode, newText: string, blockLabel: string) {
  const links: { text: string; node: LexNode }[] = []
  collectLinks(node, links)

  if (links.length === 0) {
    node.children = [textNode(newText)]
    return
  }

  const newChildren: LexNode[] = []
  let cursor = 0
  for (const link of links) {
    const idx = newText.indexOf(link.text, cursor)
    if (idx === -1) {
      throw new Error(
        `[${blockLabel}] rewritten text is missing required verbatim link anchor "${link.text}" — refusing to drop a link. Fix the authored rewrite to include this exact phrase.`,
      )
    }
    if (idx > cursor) newChildren.push(textNode(newText.slice(cursor, idx)))
    newChildren.push(link.node)
    cursor = idx + link.text.length
  }
  if (cursor < newText.length) newChildren.push(textNode(newText.slice(cursor)))
  if (newChildren.length === 0) newChildren.push(textNode(''))
  node.children = newChildren
}

// REWRITES[postId][locale][blockIndex] = authored replacement text.
// blockIndex is the 0-based position of the node among all heading/
// paragraph/listitem nodes encountered in document order (skipping
// `block`/`table` subtrees entirely) — the SAME numbering used during
// authoring (scripts/_tmp-extract-blocks-links-batch11.ts output).
// Any index NOT present here is left completely untouched (this covers
// every `heading` node, "Ver también"/"See Also" link-only listitems, and
// a handful of paragraphs already confirmed in-voice, e.g. most of post 65
// ES which was authored with much less AI-tell voice to begin with).
const REWRITES: Record<number, { es: Record<number, string>; en: Record<number, string> }> = {
  61: {
    es: {
      0: 'El keyword research es la base de cualquier estrategia de SEO que funcione. En esta guía te comparto las herramientas y el proceso que uso para investigar palabras clave, de forma que el contenido que construyas quede alineado con la intención de búsqueda de tus usuarios.',
      1: 'Vamos a repasar qué es el keyword research, sus elementos clave y las herramientas que uso para hacer este proceso más simple. La idea es que puedas llevar tu estrategia digital al siguiente nivel con pasos concretos, no solo teoría.',
      4: 'El keyword research es el proceso de identificar y analizar los términos y frases que la gente escribe en los buscadores. No se trata solo de juntar una lista de palabras clave, sino de entender la intención detrás de cada búsqueda y qué tan relevante es para tu negocio o sector. El objetivo es optimizar el contenido de un sitio para atraer tráfico de calidad, ese que realmente está alineado con lo que buscan tus usuarios y que termina convirtiendo.',
      5: 'Hacer un buen keyword research te permite encontrar oportunidades de contenido, descubrir términos con menos competencia que son más fáciles de posicionar y ajustar tu estrategia de marketing a lo que tus consumidores buscan de verdad. Al final, es la forma de asegurarte que el esfuerzo de marketing digital se concentre en las áreas que realmente aportan valor y retorno.',
      7: 'El keyword research es un pilar tanto en SEO como en SEM. En SEO lo uso para identificar qué términos deben integrarse en el contenido, las meta descripciones y los encabezados, y así mejorar la relevancia y la posición en los resultados orgánicos. En SEM, en cambio, sirve para elegir las palabras clave correctas en campañas de pago por clic (PPC), de forma que los anuncios lleguen a la audiencia correcta en el momento correcto.',
      8: 'Un buen keyword research mejora la visibilidad de una marca y, de paso, ayuda a segmentar mejor a la audiencia. Cuando entiendes la intención detrás de cada búsqueda, puedes armar campañas más personalizadas y efectivas. Es, básicamente, la guía que sostiene tanto al SEO como al SEM, y la que permite que un negocio hable con su público de forma más directa y llegue a sus objetivos comerciales.',
      10: 'El proceso de keyword research se apoya en varios elementos que son clave para el éxito de cualquier estrategia de SEO: no basta con encontrar palabras clave relevantes, también hay que optimizar el contenido alrededor de ellas y atraer tráfico de calidad. En esta sección reviso tres aspectos: la relevancia de las palabras clave, la autoridad y competencia, y el volumen de búsqueda.',
      12: 'La relevancia es el pilar principal de cualquier estrategia de keyword research. Las palabras clave que elijas deben alinearse con el contenido del sitio y con lo que tu público realmente necesita, no solo con lo que genera tráfico. Se mide en función de qué tan bien las búsquedas de los usuarios se conectan con los temas que abordas en el contenido, y cuando eliges términos que responden a preguntas concretas, atraes tráfico y generas más compromiso y conversión al mismo tiempo.',
      14: 'Otro elemento esencial es la autoridad del sitio en relación con las palabras clave elegidas, es decir, la capacidad del sitio para posicionarse cuando alguien busca ese término. Los sitios con más autoridad suelen tener mejor posicionamiento y generan más confianza a ojos de los motores de búsqueda. También conviene analizar la competencia por cada palabra clave: cuántos y cuáles sitios ya están rankeando ahí. Las keywords con mucha competencia pueden ser difíciles de posicionar, así que recomiendo mezclar términos de distintos niveles de competencia, desde los más disputados hasta alternativas menos concurridas.',
      16: 'El volumen de búsqueda es un indicador clave de qué tan popular es una palabra clave. Un volumen alto suele significar fuerte demanda e interés, lo cual es bueno para atraer visitas, pero casi siempre viene acompañado de una competencia igual de alta. El volumen se clasifica en tres categorías: head, middletail y longtail. Los términos head son más generales y tienen mayor volumen; los longtail son más específicos, con menos competencia y, muchas veces, mejores tasas de conversión. Por eso, en cualquier guía de keyword research conviene equilibrar estos tres tipos.',
      18: 'Clasificar las palabras clave te permite diseñar estrategias que realmente respondan a las necesidades e intenciones de los usuarios, y por eso es un paso que no me salto en ninguna guía de keyword research. Se pueden dividir en dos categorías principales: la intención de búsqueda y el volumen de búsqueda, y cada una te da información valiosa sobre cómo optimizar el contenido para atraer tráfico cualificado.',
      20: 'La intención de búsqueda es el propósito detrás de una consulta en un buscador. Entender esta intención te permite desarrollar contenido que realmente responda a las preguntas y necesidades de tu audiencia. Existen cuatro tipos principales, así sea informativa, navegacional, transaccional o local:',
      22: 'Acá los usuarios buscan información general o específica sobre un tema, sin intención inmediata de comprar. Ejemplos típicos son preguntas como "¿Qué es el marketing digital?" o "Cómo optimizar el SEO de un sitio web". Las palabras clave informativas tienen buen potencial para atraer tráfico orgánico, siempre que el contenido resuelva dudas reales.',
      24: 'En la intención navegacional el usuario ya sabe a dónde quiere llegar, por ejemplo cuando escribe "Facebook login" para llegar directo a la página de inicio de sesión. Entender este tipo de búsqueda es clave para optimizar las páginas de destino y que el usuario encuentre lo que busca rápido.',
      26: 'Acá la intención está orientada a la acción, casi siempre una compra. Un ejemplo es "comprar zapatos en línea". Si identificas bien estas palabras clave transaccionales, puedes diseñar landing pages que dirijan al usuario directo hacia la conversión.',
      28: 'La búsqueda local gira en torno a la ubicación: el usuario busca productos o servicios cercanos, como "restaurantes cerca de mí" o "mecánicos en Guadalajara". Para este tipo de palabras clave es clave optimizar el contenido para los resultados geolocalizados y mejorar la visibilidad en Google Maps.',
      30: 'Otra característica clave en la clasificación de palabras clave es el volumen de búsqueda, que se divide en tres categorías:',
      32: 'Las palabras clave tipo "head" son términos amplios y generales, con mucho volumen de búsqueda pero también mucha competencia. Un ejemplo es "marketing digital". Atraen bastante tráfico, sí, pero necesitas una estrategia diferenciada para posicionarlas.',
      34: 'Este tipo abarca términos más específicos, con un volumen considerable pero con menos competencia que los head. Una frase como "casas baratas en Querétaro" encaja en esta categoría, y este tipo de búsquedas suele ser una buena oportunidad para atraer tráfico cualificado.',
      36: 'Las palabras clave longtail son más detalladas y tienen menos competencia. Suelen convertir mejor, precisamente por su especificidad. Un ejemplo sería "comprar casa barata en Atizapán de Zaragoza", que responde a una necesidad muy concreta y atrae a un público bien segmentado.',
      38: 'Hacer un buen keyword research requiere herramientas que faciliten identificar, analizar y seleccionar palabras clave. Hay varias opciones en el mercado y cada una ofrece algo distinto según las necesidades de tu proyecto. En esta sección reviso las herramientas más relevantes, tomando en cuenta su funcionalidad y su costo.',
      40: 'A continuación te dejo una tabla que compara algunas de las herramientas más populares para keyword research, con sus características principales:',
      42: 'En keyword research existen tanto herramientas gratuitas como de pago. Las gratuitas, como Google Keyword Planner, sirven para investigaciones básicas y son un buen punto de partida si estás empezando en SEO, aunque suelen tener limitaciones en la profundidad del análisis y la cantidad de datos que entregan.',
      43: 'Las de pago, como Ahrefs y SEMrush, dan acceso a análisis más detallados y muchos más datos, algo vital para sitios ya establecidos o campañas avanzadas. Permiten examinar a fondo el volumen de búsqueda, el nivel de competencia y las tendencias de las palabras clave, algo clave para la optimización de contenido y las estrategias de marketing digital.',
      45: 'A la hora de elegir una herramienta de keyword research hay varios factores a considerar. Primero, evalúa el presupuesto disponible y si te conviene una herramienta gratuita o si vale la pena invertir en una de pago según las necesidades del negocio.',
      46: 'También es clave identificar qué funcionalidades realmente necesitas. Si tu enfoque es el SEO, te conviene una herramienta fuerte en análisis de backlinks y auditoría. Si en cambio buscas combinar SEO y SEM, elige una que cubra ambas áreas.',
      47: 'Por último, te recomiendo probar varias herramientas antes de quedarte con una, para ver cuál se adapta mejor a tu proyecto. La experiencia práctica de usarla y qué tan fácil es de manejar también pesan bastante en esta decisión.',
    },
    en: {
      0: 'Keyword research is the foundation of any SEO strategy that actually works. Once you understand the terms and phrases people type into search engines, you can shape your content around what your audience is really looking for.',
      1: "In this guide I walk through the techniques and tools I actually use for keyword research, building on lessons learned since the early keyword research playbooks of 2018. The goal is to help you target and optimize keywords in a way that has real impact, not just theory.",
      4: "Keyword research means identifying and analyzing the terms and phrases people type into search engines. It's the backbone of any solid SEO strategy, because it helps you understand user behavior and shape content around it. Analyze keywords well and you improve visibility in the SERPs, drive organic traffic, and boost conversions. It also shapes what you write in the first place, so the content resonates with the right audience and matches their search intent.",
      5: "Skip keyword research and your content risks attracting the wrong visitors, or none at all. Keywords don't just guide what you write, they influence how a site is structured, which is why choosing them carefully matters so much. Solid keyword research sets up everything that comes after it: on-page optimization, link building, all of it.",
      7: 'Keyword research has changed a lot over the years. Back in the early days of SEO, keyword density and exact match phrases were everything, and most strategies were built around quantity over quality. Then search engines introduced more advanced algorithms and machine learning, and that changed how content gets interpreted and ranked.',
      8: 'Around 2018 the field hit a turning point: search intent and contextual relevance started to matter more than optimizing for a specific keyword. The shift pushed everyone toward high-quality, user-centric content instead of keyword-stuffed pages. Tools got more sophisticated too, letting people track keyword performance over time and refine their strategy around it. Today, long-tail keywords get a lot more respect than before, since they carry less competition and, more often than not, better conversion rates because they reflect what the user genuinely wants.',
      9: 'Digital marketing keeps shifting, so staying on top of how keyword research methodology has evolved is part of doing SEO well. Combine that historical context with current best practices and your SEO initiatives end up a lot more effective.',
      11: "Good keyword research needs a strategy and the right tools behind it. Knowing what's out there lets you uncover keywords that actually align with user intent, instead of guessing. In this section I go through the essential tools, compare their features and use cases, and explain why data analysis matters so much in the process.",
      13: "A handful of tools are essential for thorough keyword research, each covering a different piece of the SEO puzzle. Here are the ones I consider must-haves:",
      14: "Google Keyword Planner: a staple for finding keyword ideas and estimating search volume, especially useful when you're contextualizing keywords for Google Ads campaigns.",
      15: 'Ahrefs: gives you solid data on keyword difficulty and traffic potential, good for evaluating long-term keyword strategies.',
      16: "SEMrush: shines at competitive analysis, showing you what competitors are ranking for and suggesting variations you might have missed.",
      17: "Ubersuggest: an easy entry point for generating keyword suggestions and tracking performance metrics without a steep learning curve.",
      18: 'These tools make any keyword research process a lot more effective, and they keep giving you updated insights as the search landscape keeps changing.',
      20: "When you're picking a keyword research tool, it helps to understand what each one is actually built for. For instance:",
      21: "Google Keyword Planner is ideal if you need data straight from Google, which makes it useful for PPC campaigns and SEO strategies built around Google's own ecosystem.",
      22: 'Ahrefs fits more experienced SEO folks who need in-depth analysis of keyword performance over time, with rich historical data and trend tracking.',
      23: 'SEMrush gives you a full suite for analyzing your competition closely, which makes it easier to spot gaps in your own keyword strategy.',
      24: "Ubersuggest works well if you're newer to this and want a straightforward interface with easy access to keyword suggestions and SEO metrics.",
      25: 'Compare these features side by side and you can pick the tool that actually fits your specific goals, instead of the one with the flashiest dashboard.',
      27: "Data analysis is a big part of keyword research. Understanding volume, trends, and difficulty is what actually shapes a strategy that works. A few things to keep in mind:",
      28: 'Search volume: how many times a keyword gets searched, which tells you how popular it is and how much traffic it could realistically bring.',
      29: 'Trends: seasonal spikes or growing interest in a topic can directly change how effective a keyword is over time.',
      30: "Keyword difficulty: how hard it is to actually rank for a given term. Balancing high-volume, low-difficulty keywords tends to get you the best return on your SEO effort.",
      31: 'Solid data analysis is what lets you make informed calls, so the keywords you pick line up with both current trends and the competitive landscape you\'re actually working in.',
      33: "Targeting and optimizing keywords well is a core part of any SEO strategy that works. It's not just about picking the right keywords, it's about placing them through your content in a way that maximizes visibility. That means paying attention to keyword difficulty, how you categorize keywords, placement and frequency best practices, and understanding user intent.",
      35: "The first step is analyzing keyword difficulty alongside search volume. Difficulty tells you how much competition there is for a keyword, volume tells you how often it gets searched, and getting the balance right between the two is what makes optimization actually work. Keywords with high volume and equally high difficulty usually aren't the best targets for a new or growing site. Low-difficulty, medium-volume keywords, on the other hand, tend to give you quicker wins while you build authority in your niche.",
      37: "Once you've analyzed your keywords, split them into primary and secondary groups. Primary keywords are the ones most relevant to your business, and they should anchor your main landing pages. Secondary keywords are related terms that bring in additional traffic and usually fill out supporting content. This categorization helps with site structure, sure, but it also sharpens your whole content strategy and how you connect with your audience.",
      39: 'Where you place your keywords matters for SEO. As a rule, primary keywords should show up in titles, headings, meta descriptions, and the first 100 words of your content. Secondary keywords should blend in naturally, adding context without breaking the flow. Frequency is a balance too: repeating a keyword helps signal relevance, but overdoing it (what\'s known as keyword stuffing) can get you penalized by search engines instead of rewarded.',
      41: 'Last but not least, understanding user intent is what makes a keyword strategy actually work. User intent is the reason behind a search, whether it\'s informational, navigational, or transactional. Someone searching "keyword research guide" is probably after comprehensive, well-structured information, so your content needs to meet that expectation with language and solutions that answer their specific need. Align your keywords with user intent and you\'ll see it show up directly in engagement, conversion rates, and overall SEO results.',
    },
  },
  62: {
    es: {
      0: 'La estrategia de topic clusters se ha vuelto una metodología clave para mejorar el SEO y la estructura del contenido en un sitio web. Agrupar información relacionada alrededor de un tema central facilita las cosas tanto para los buscadores como para los usuarios. En este artículo te muestro cómo implementar topic clusters paso a paso, qué ventajas tiene y cómo puede cambiar la visibilidad de tu sitio.',
      1: 'Entender los fundamentos de los topic clusters es clave para cualquier estrategia digital que funcione. Voy a repasar los componentes clave, desde las páginas pilar hasta el contenido de soporte, que arman una arquitectura sólida y coherente para tu contenido.',
      4: 'La estrategia de topic clusters es un enfoque que busca mejorar la visibilidad y el posicionamiento de un sitio organizando el contenido alrededor de temas centrales interrelacionados. Este modelo le facilita a los buscadores entender qué tan relevantes son los distintos contenidos entre sí, lo que ayuda a su indexación y posicionamiento. En esencia, se trata de armar un "cluster" donde agrupas distintos tipos de contenido conectados por un tema común.',
      6: 'Este enfoque tiene principalmente dos elementos: las páginas pilar y las páginas de soporte. Ambas son fundamentales para que la estrategia funcione, y trabajan juntas para crear una red de contenido fácil de navegar, tanto para los usuarios como para los buscadores.',
      8: 'La página pilar es la pieza central de cada cluster temático. Cubre un tema amplio y funciona como un recurso completo que aborda todas las áreas relacionadas. Por ejemplo, en un cluster sobre marketing digital, la página pilar podría ser "Guía Completa de Marketing Digital", donde se tocan subtemas como SEO, SEM, redes sociales, entre otros. Es clave que esta página incluya enlaces hacia el contenido de soporte, para que la navegación fluya y se consolide la autoridad del dominio sobre el tema.',
      10: 'Las páginas de soporte son el complemento de la página pilar. Se enfocan en subtemas específicos relacionados con el tema central que aborda la página pilar. Siguiendo el ejemplo anterior, podrían ser artículos que profundicen en estrategias específicas de SEO o guías sobre herramientas para redes sociales. Cada una de estas páginas debe enlazar de vuelta a la página pilar, así se fortalece la estructura del cluster y se refuerza la relación que los buscadores establecen entre los distintos contenidos. Esta interconexión mejora la navegación del usuario y, al mismo tiempo, refuerza la relevancia de todas las páginas involucradas. Implementar bien la estrategia topic clusters es clave para mejorar el SEO y la estructura de contenido de un sitio, y cada vez más gente la usa para optimizar su presencia en línea.',
      12: 'La estrategia de topic clusters trae varias ventajas que impactan directamente en la optimización de contenido y en cómo rinde tu sitio en los buscadores. A continuación te cuento los principales beneficios.',
      14: 'Organizar el contenido en clusters temáticos le facilita a los buscadores entender la jerarquía y la relación entre los distintos temas. Esto ayuda a la indexación, porque las páginas pilar y de soporte están interconectadas, y eso hace que Google y otros buscadores rastreen el contenido de forma más eficiente. Además, al agrupar contenido relevante, la estrategia potencia la posibilidad de posicionar varias páginas para palabras clave relacionadas, lo que incrementa el tráfico orgánico. Todo esto se traduce en mejores rankings, porque los buscadores ven estos clusters como una señal de contenido bien organizado y de calidad.',
      16: 'Un aspecto clave de la experiencia de usuario es qué tan fácil es navegar el sitio. Al implementar topic clusters, armas una estructura lógica que le permite al usuario llegar rápido a contenido relacionado. Esto ayuda a encontrar información específica y, de paso, optimiza el tiempo que pasan en el sitio. Un tiempo de permanencia más largo y una tasa de rebote más baja son señales positivas para los buscadores, lo que a su vez mejora aún más la visibilidad del sitio. Al final, una mejor experiencia de usuario se traduce en mejores métricas SEO a largo plazo.',
      18: 'Usar la estrategia de topic clusters fomenta la creación de contenido interconectado que fortalece la relevancia y la autoridad del dominio. A medida que produces y enlazas contenido de calidad, aumentan las oportunidades de recibir enlaces entrantes (backlinks) de otras páginas. Esto pesa bastante, porque los buscadores valoran mucho la autoridad del dominio como factor de posicionamiento. Un dominio con alta autoridad gana más credibilidad ante los buscadores, lo que se traduce en posiciones más altas y consistentes en los resultados. Así, la estrategia topic clusters mejora la organización interna del sitio y, de paso, construye un camino sólido hacia una presencia en línea más fuerte y respetada.',
      20: 'La investigación de palabras clave es uno de los primeros pasos al implementar topic clusters: se trata de identificar las palabras y frases que la gente usa en los buscadores para encontrar información sobre tu tema. Si eliges bien estas palabras clave, puedes crear contenido que atraiga tráfico y, al mismo tiempo, esté alineado con lo que tus usuarios realmente buscan.',
      22: 'Una parte clave de la investigación de palabras clave es distinguir entre las principales y las secundarias. Las principales reflejan el tema central de la página pilar, mientras que las secundarias se relacionan con los subtemas que van a cubrir las páginas de soporte.',
      23: 'Para elegirlas, sigo estos pasos:',
      24: 'Identifica el tema central: define el tema general de tu página pilar. Por ejemplo, si tu página principal habla de "jardinería sostenible", esa es tu palabra clave principal.',
      25: 'Analiza tendencias de búsqueda: usa herramientas de SEO para encontrar variaciones y combinaciones de tu palabra clave principal. Por ejemplo, "cuidado de plantas sostenibles", "cultivo de huertos urbanos" y "jardinería ecológica" pueden ser buenas palabras clave secundarias.',
      26: 'Estudia a la competencia: revisa qué palabras clave están usando tus competidores directos. Esto te da ideas sobre qué términos y enfoques funcionan en tu nicho.',
      28: 'Hay varias herramientas que facilitan la investigación de palabras clave y hacen que la estrategia de topic clusters rinda mejor. Estas son algunas de las que mejor funcionan:',
      29: 'Google Keyword Planner: ideal para explorar ideas de palabras clave y ver volúmenes de búsqueda estimados.',
      30: 'SEMrush: te deja hacer un análisis competitivo a fondo, viendo qué palabras clave usan otros sitios en tu nicho.',
      31: 'Ahrefs: te da información sobre la dificultad de las palabras clave y datos del tráfico estimado que puedes conseguir.',
      32: 'Cuando integras la investigación de palabras clave en la planificación de tu estrategia de topic clusters, sientas las bases para un contenido interconectado y optimizado que realmente resuena en las búsquedas. Esta alineación mejora el SEO del sitio y, a la vez, mejora la experiencia del usuario al encontrar información valiosa y relevante.',
      34: 'Crear y estructurar bien el contenido pilar es un aspecto clave de la estrategia de topic clusters. Este tipo de contenido es la piedra angular del cluster: ofrece una guía completa sobre un tema amplio y enlaza a las páginas de soporte que profundizan en subtemas más específicos. Al armar una página pilar, hay que tener en cuenta varias características que la hagan efectiva y bien optimizada para los buscadores.',
      36: 'Una página pilar efectiva debe ser integral, abordar el tema desde varios ángulos y darle valor real al lector. Suele ser más larga que un artículo promedio, porque tiene que cubrir el tema a fondo. La claridad y la estructura son esenciales: usar encabezados y subencabezados le permite al usuario escanear el contenido fácilmente y encontrar lo que busca.',
      37: 'El uso estratégico de palabras clave relevantes pesa mucho en el SEO. No basta con incluir las palabras clave principales, conviene sumar sinónimos y términos relacionados que diversifiquen el contenido y mejoren la indexación. El formato también importa: usar listas, imágenes y gráficos hace que la información sea más digerible y atractiva.',
      38: 'La interconexión es otro elemento clave: cada página pilar debe enlazar hacia las páginas de soporte, lo que facilita la navegación y aumenta el tiempo de permanencia del usuario en el sitio. Esto también refuerza la relación temática entre el contenido y mejora la estructura general del sitio de cara al SEO.',
      40: 'Si no enlazas bien el contenido pilar con las páginas de soporte, la estrategia de topic clusters simplemente no funciona. Cada página pilar debe incluir enlaces internos que apunten a los artículos de soporte, porque esto mejora la experiencia del usuario y además ayuda a los buscadores a entender la relación entre los distintos contenidos.',
      41: 'A la hora de crear enlaces, recomiendo usar un texto ancla descriptivo y relevante. En lugar de frases genéricas como "haz clic aquí", usa un texto que refleje el contenido al que apunta, como "lee cómo plantar rosales" si estás enlazando a una página de soporte sobre ese tema. Esta práctica ayuda al SEO y mejora la tasa de clics.',
      42: 'Es igual de importante que las páginas de soporte enlacen de vuelta a la página pilar. Esto crea un circuito de navegación que beneficia al usuario y además solidifica la autoridad del contenido pilar dentro de su cluster temático. Un buen enlazado interno es, al final, lo que potencia toda la estrategia de topic clusters y puede traducirse en mejor posicionamiento.',
      45: 'Desarrollar el contenido de soporte requiere elegir con cuidado los temas específicos que se alineen con la página pilar. Estos subtemas deben ser relevantes y útiles, y dar información más detallada sobre aspectos concretos del tema central. Por ejemplo, si la página pilar es la "Guía Completa de Jardinería", el contenido de soporte podría incluir guías sobre "Cómo Plantar Rosales" o "Cuidado de Plantas de Interior". Esta organización mejora la experiencia del usuario y, de paso, le da a los buscadores un contexto más amplio sobre el tema y las relaciones entre los contenidos. Es clave identificar las preguntas comunes o las necesidades de información de tu audiencia para elegir los temas con más impacto.',
      47: 'El contenido de soporte también necesita optimización técnica para SEO. Eso significa usar las palabras clave que identificaste en tu investigación, asegurándote de que cada página esté bien optimizada, tanto en los encabezados como en el cuerpo del texto. Sumar enlaces internos que apunten a la página pilar y entre las distintas páginas de soporte pesa bastante acá: esa red de enlaces mejora la navegación y, de paso, distribuye la autoridad de la página pilar de forma más eficiente. La estructura de URL, la longitud del contenido y los elementos multimedia también influyen en cómo rinde SEO cada página. Y una buena práctica que siempre recomiendo: usa encabezados claros y concisos que reflejen el contenido específico, así los usuarios y los buscadores entienden rápido de qué trata cada sección.',
      49: 'Sin una buena interconexión entre las páginas de un sitio, la estrategia de topic clusters no llega muy lejos. Implementar bien la arquitectura del sitio mejora el flujo del contenido y optimiza la visibilidad ante los buscadores. Con un esquema claro de enlace interno, Google y otros buscadores entienden mejor la relevancia y el contexto de cada página dentro del tema general.',
      51: 'El enlazado interno sostiene toda la estructura de topic clusters. Para sacarle el máximo provecho SEO, conviene seguir algunas estrategias. Primero, cada página de soporte debe enlazar de vuelta a la página pilar: esto refuerza la conexión temática y puede aumentar el PageRank de la página pilar, distribuyendo el valor SEO por todo el cluster. También conviene enlazar entre las distintas páginas de soporte, porque le da al usuario rutas rápidas a información relacionada, y eso se traduce en más tiempo de permanencia y menor tasa de rebote, dos métricas que los buscadores toman en cuenta para posicionar.',
      52: 'También recomiendo usar texto ancla descriptivo con palabras clave relevantes, evitando términos genéricos: esto orienta al usuario sobre el contenido al que apunta el enlace y le permite a los buscadores entender mejor la temática. Y es clave que los enlaces internos sean accesibles, sin pop-ups o redirecciones que afecten la usabilidad.',
      54: 'La arquitectura del sitio influye directamente en la indexación y en el "crawl budget", el presupuesto de rastreo que los buscadores le asignan a cada página. Una estructura organizada de topic clusters ayuda a que los bots de Google entiendan mejor la jerarquía y la relación entre páginas. Al mejorar la interconexión, cada página relevante se indexa mejor, y evitas que contenido de calidad pase desapercibido por una mala arquitectura.',
      55: 'Una buena arquitectura del sitio también optimiza el uso del crawl budget. Cuando las páginas secundarias están estructuradas alrededor de una página pilar bien enlazada, los buscadores rastrean y entienden más rápido toda la red de contenido. Esto reduce el riesgo de desperdiciar recursos en páginas poco relevantes o mal conectadas, y asegura que el contenido más importante reciba la atención que merece. En resumen, la interconexión y una buena arquitectura de sitio son piezas esenciales de la estrategia de topic clusters, con un impacto directo tanto en la optimización SEO como en la experiencia del usuario.',
      57: 'Monitorear y ajustar la estrategia de topic clusters es lo que mantiene el contenido optimizado para SEO y, a la vez, alineado con lo que tus usuarios esperan y necesitan. Implementarla es solo el primer paso, mantenerla vigente y efectiva con el tiempo es lo que realmente determina el éxito. Para eso, hay que evaluar constantemente el rendimiento del contenido y ajustar en base a datos concretos.',
      59: 'Para evaluar el rendimiento de tu estrategia de topic clusters puedes apoyarte en varias métricas y KPIs que te dan una visión clara de cómo está funcionando el contenido. Estas son algunas de las más relevantes:',
      60: 'Tráfico orgánico: cuántos visitantes llegan a las páginas pilar y de soporte a través de los resultados de búsqueda.',
      61: 'Duración de la sesión: cuánto tiempo pasan los usuarios en las páginas, una señal del interés y la calidad del contenido.',
      62: 'Tasa de rebote: el porcentaje de usuarios que se van del sitio después de ver una sola página, útil para detectar problemas de relevancia en el contenido.',
      63: 'Conversiones: cuántos visitantes realizan la acción que buscas, como suscribirse a un boletín o llenar un formulario de contacto.',
      64: 'Enlaces internos: la cantidad de clics entre las páginas pilar y de soporte, que te da información sobre la interconexión y la estructura del cluster.',
      66: 'Una vez que tienes las métricas clave, el siguiente paso es optimizar el contenido de forma continua. Estas son algunas técnicas efectivas para ajustar tu estrategia de topic clusters:',
      67: 'Reoptimización del contenido: si alguna página de soporte no está generando tráfico, revisa y actualiza su contenido, suma nuevas palabras clave o mejora la calidad de la información.',
      68: 'Mejora de la estructura interna: modifica o agrega enlaces internos que faciliten la navegación entre la página pilar y las de soporte, así aumenta la relevancia general del cluster.',
      69: 'Creación de nuevos clusters: identifica subtemas nuevos a partir de las consultas de tus usuarios y crea clusters adicionales que respondan a esas necesidades, así expandes la cobertura temática de tu sitio.',
      70: 'Test A/B: haz pruebas comparativas entre distintas versiones de contenido para ver qué elementos (títulos, imágenes, formato) funcionan mejor en términos de engagement y conversión.',
      71: 'La clave está en mantener un enfoque proactivo y flexible, usar los datos que recopilas para ajustar la estrategia, y dejar que la estructura de contenido evolucione y siga siendo relevante en un entorno digital que nunca deja de cambiar.',
      73: 'Para ilustrar la estrategia de topic clusters, pensemos en un sitio dedicado a la culinaria mexicana. Es un nicho rico en variedad, con muchos subtemas que se pueden aprovechar con una estructura de contenido bien organizada. La página pilar podría llamarse "Guía Completa de la Cocina Mexicana", cubriendo las distintas tradiciones culinarias, ingredientes básicos, técnicas de cocción y más. Este contenido debe ser extenso, atractivo y optimizado para SEO, sin quedarse en lo superficial. A partir de esta página pilar puedes crear varias páginas de soporte interconectadas, cada una enfocada en un subtema específico. Acá tienes una tabla con algunos ejemplos de contenido de soporte y su relación con la página pilar:',
      74: 'Cada una de estas páginas de soporte debe enlazar hacia la página pilar "Guía Completa de la Cocina Mexicana", y también debe haber enlaces que conecten los artículos entre sí, reforzando la autoridad de toda la estructura y facilitando la navegación del usuario. Al implementar esta estrategia, los buscadores entienden mejor la relación entre los temas y aumenta la relevancia y autoridad del sitio. Esto optimiza la visibilidad de cada página en los resultados de búsqueda y hace que los usuarios encuentren información relevante con facilidad, lo que se traduce en más tiempo de permanencia y menor tasa de rebote. Este ejemplo de topic clusters aplicado a la cocina mexicana muestra cómo una buena organización temática beneficia tanto al posicionamiento SEO como a la experiencia del usuario.',
    },
    en: {
      0: 'Topic clusters are a powerful way to structure content around a central theme and its subtopics, and they help both user experience and SEO at the same time. Done right, this approach lets a business show real expertise and climb the search rankings.',
      1: 'In this article I go through real topic clusters examples, break down the key elements, and outline the benefits of the strategy. Knowing how to use topic clusters well can genuinely move the needle on your digital marketing results.',
      4: 'The topic cluster strategy organizes content by linking everything around a central theme, or "pillar." It improves user navigation and helps search engines understand how your content relates. A pillar page acts as the central hub for a topic, covering it comprehensively, while cluster pages dig into specific subtopics tied to that pillar. A pillar page on "Digital Marketing," for instance, could link out to cluster pages on "SEO," "Content Marketing," and "Social Media Strategies." That interconnected structure creates a coherent framework that boosts relevance and keeps users engaged.',
      6: 'A few components sit at the center of the topic cluster strategy. First, the pillar page: an in-depth resource on a broader subject that covers the main topic extensively while linking out to supporting cluster pages. Those cluster pages zoom in on specific aspects of the main topic, things like detailed guides or how-tos, giving readers a way to go deeper. An effective internal linking strategy matters here too: each cluster page should link back to the pillar page, reinforcing the connection and making it easier for search engines to index the site.',
      8: "A topic cluster strategy can move the needle on SEO in a real way. It improves site architecture and crawlability, and when cluster pages link back to the pillar, they share authority, which helps rankings. Content organized this way also lines up with how modern search algorithms actually work, prioritizing thematic relevance over isolated keywords. Beyond visibility, it builds domain authority too, since search engines read a well-structured site as more credible. Plenty of brands have used topic clusters to build real content ecosystems that drive more traffic and engagement over time.",
      10: 'Understanding the key elements of topic clusters is what lets you actually use this strategy well. At their core, topic clusters are interconnected pieces of content built around one central theme, and that structure improves both user experience and search visibility.',
      12: 'Pillar pages are the foundation of the topic cluster strategy. These are comprehensive pages that dig into a core subject in detail while linking out to related cluster content. A well-optimized pillar page weaves in keywords and topics that genuinely inform the reader. Take "Email Marketing" as the subject: the pillar page could cover everything from best practices to advanced strategies, building authority in that niche. The goal is an authoritative resource that engages users and, as a side effect, attracts backlinks that push its ranking potential further.',
      14: "Cluster content is made up of multiple pieces, each focused on a subtopic related to the pillar page's main theme. These pages link back to the pillar page deliberately, building an internal linking framework that helps search engines understand the content hierarchy. A few examples of effective cluster content:",
      19: "With a diverse set of cluster content, a brand can address the specific questions and interests its audience actually has, which improves engagement and lowers bounce rates. That interconnected structure reinforces the pillar page's relevance and helps solidify the site's authority over the broader topic.",
      21: "A solid internal linking strategy is vital for topic clusters to actually work. Every cluster page should link back to the pillar page and to other related cluster content. That web of links improves navigation and lets search engines crawl the content thoroughly, picking up on the context and relationships between topics. A well-planned linking strategy spreads page authority across the whole cluster and makes sure nothing gets overlooked. With a logical structure like that, it's easier for search algorithms to lift the visibility of the site as a whole.",
      24: "A topic cluster strategy improves user experience by giving people a cohesive, logically organized collection of content to move through. Users can navigate relevant topics and find comprehensive information without extra clicks. The hub-and-cluster structure cuts down on confusion and lets people dig deeper into whatever they're actually interested in. The result: they stay on the site longer, engage with more content, and bounce less.",
      26: 'Another key benefit is domain authority. By focusing on one central theme and building a network of interconnected pages, a site positions itself as an authority in that subject area. Thorough pillar pages combined with relevant cluster content build credibility with both users and search engines. As quality backlinks pile up and internal linking strengthens the site structure, domain authority rises, and that tends to show up directly in rankings. Plenty of businesses have used this exact approach to boost their online presence and, ultimately, compete better in their market.',
      28: "Search algorithms increasingly prioritize contextual relevance and thematic depth over simple keyword matching. A well-implemented topic cluster strategy lines up perfectly with that shift, since it emphasizes comprehensive topic coverage instead of isolated, keyword-focused articles. Grouping content meaningfully helps search engines understand how different pieces of information relate, which boosts visibility. That alignment doesn't just improve rankings today, it keeps the content relevant to how search engines actually work going forward.",
      30: 'The topic cluster framework also makes it easier to keep creating relevant content sustainably, because it defines clear themes to build around. With a central hub page outlining the core topic, you can keep expanding through cluster pages that cover subtopics in depth. That doesn\'t just prompt new material, it keeps everything interconnected and relevant. Over time this builds a content library that keeps evolving with current trends and user needs, so the site stays fresh instead of stale.',
      33: "Solid topic and keyword research is the foundation of any topic cluster strategy that works. Start by identifying the primary topic that'll become your pillar page, then use tools to analyze search volume, competition, and related keywords. Look at the questions and problems potential visitors are actually trying to solve to understand their intent. This research phase is what lets you create content that resonates with your audience and fills real gaps in the current content landscape. When you pick subtopics for your cluster pages, make sure they're relevant and can link back to the central theme, so the whole thing stays cohesive.",
      35: "The pillar page is the cornerstone of your topic cluster. It should give a thorough overview of the main topic while linking out to all the relevant cluster content. Go for depth here, covering the topic's various angles comprehensively. Images, videos, or infographics help with engagement and understanding. A good pillar page does more than centralize content, it becomes a resource hub that increases page authority and relevance across the whole SEO landscape.",
      37: "Cluster pages dig deeper into specific subtopics tied to your pillar. Each one should cover its topic thoroughly while keeping a clear link back to the pillar page. Keyword optimization matters here too, targeting long-tail keywords that match search intent. The content should answer real user questions and add value, complementing the hub rather than repeating it. Get the cluster pages right and the overall quality and usefulness for your visitors goes up significantly, which shows up in your SEO too.",
      39: "Internal linking is a critical piece of any topic cluster strategy. It improves navigation and helps search engines understand how different pieces of content relate to each other. When you're building your network structure, focus on this:",
      44: "Follow these steps and your internal linking structure will support both user navigation and search engine crawling, which shows up directly in your SEO results.",
      46: "Measuring how well your topic clusters are actually working is crucial for understanding their impact on SEO and content marketing overall. The right metrics and analytics tools give you real insight into what's working and where you need to adjust.",
      48: "Clear KPIs are essential for evaluating whether your topic cluster strategy is actually working. The key metrics: organic traffic, bounce rate, dwell time, and conversion rates. Organic traffic tells you how well the content is attracting visitors through search. A lower bounce rate suggests users find the content relevant and engaging, and longer dwell time means they're actually spending time with it.",
      49: "Conversion rates matter too, since they measure how well the content drives people to take the action you want, whether that's signing up for a newsletter or making a purchase. Tracking backlink growth to your pillar and cluster pages also gives you a read on the authority you've built through good content organization.",
      51: "Good analytics tools make tracking these KPIs a lot simpler. Google Analytics and SEMrush both offer solid features for monitoring site performance, user engagement, and content effectiveness. Google Search Console is invaluable too, for seeing exactly how the site ranks for specific keywords. Together these tools give you deeper insight into traffic sources, user behavior, and how the pillar and cluster content relate to each other, so you can tell whether your topic clusters are actually performing the way you expected.",
      53: "Keeping topic clusters effective is an ongoing job, not a one-time setup. Analyzing the data from those KPIs and tools reveals patterns and areas that need refinement. If a specific cluster page is underperforming on traffic or engagement, going back to optimize the content, adding internal links to related cluster pages, or just updating the information can turn things around. Looking at user feedback and engagement also helps guide the adjustments that actually improve the user experience.",
      54: "At the end of the day, measuring and analyzing your topic clusters well is what lets a business get the most out of its SEO effort, keep users satisfied, and stay relevant in a digital landscape that never stops changing.",
      56: "Implementing a topic cluster strategy isn't without its challenges. Businesses run into various hurdles that can get in the way of the approach working well, so it helps to know these common problems and how to solve them.",
      58: 'One of the biggest challenges is content overlap and keyword cannibalization. When multiple cluster pages target similar keywords or themes, they end up competing against each other in the rankings instead of supporting the pillar. That confuses search engines and dilutes the pillar page\'s authority.',
      59: 'To fix this, do thorough keyword research up front so each cluster page focuses on a genuinely unique aspect of the central theme. Write clear content outlines that define the purpose and target keywords for each page before you start. Regular content audits also help catch overlaps, which you can resolve by consolidating similar pages or reassigning keywords.',
      61: 'Another challenge is keeping quality consistent across all the cluster pages. When different authors contribute to different sections, discrepancies in tone, depth, or style creep in, and the user experience ends up feeling fragmented.',
      62: "To keep quality consistent, set clear guidelines and standards for content creation and run a real editorial process with peer reviews and feedback cycles. Training sessions for content creators on the overall strategy and the specific goals of the cluster also help, so everyone's effort actually points toward the same objective: a better user experience and more authority on the subject.",
      64: "Technical SEO issues are another obstacle. This strategy leans heavily on a well-defined internal linking structure connecting cluster pages back to their pillar pages, and poorly configured links can cost you crawl opportunities and ranking potential.",
      65: "To get ahead of these technical issues, map out the internal linking structure before you publish anything. Use descriptive anchor text that clearly shows the relationship between the cluster and hub pages, and monitor link health regularly, fixing broken links or bad redirects as you find them. Do this well and you optimize the SEO performance of individual pages while reinforcing the thematic consistency of the whole cluster.",
      68: "Different industries have used topic cluster strategies to boost their SEO in real ways. A few notable examples:",
      69: 'Healthcare: a healthcare site could build a pillar page on "Nutrition Basics" and link out to cluster articles like "Vitamins and Minerals," "Healthy Eating Habits," and "Impact of Sugar on Health." This consolidates knowledge around nutrition while improving page authority.',
      70: 'Finance: a finance platform could build a pillar page on "Investment Strategies," with clusters covering "Stock Market Basics," "Real Estate Investment," and "Cryptocurrency Fundamentals." This positions the site as an authority for finance-related queries.',
      71: 'Travel: a travel blog could have a pillar page on "Travel Planning," with clusters on "Top Destinations," "Budget Travel Tips," and "Travel Insurance." This segmentation lets readers find information tailored to their specific travel needs.',
      73: "Several companies have seen measurable benefits from adopting topic cluster strategies. A couple of implementations worth mentioning:",
      74: 'HubSpot: known for its marketing resources, HubSpot uses topic clusters extensively. Its pillar page on "In-depth Marketing Strategies" links out to cluster articles on email marketing, social media strategies, and content marketing tactics, and this method has substantially increased its organic search traffic.',
      75: 'Neil Patel: his site runs a topic cluster strategy around SEO itself. The pillar content, "The Ultimate Guide to SEO," connects to cluster pages on local SEO, backlinks, and keyword research techniques, and that arrangement improves both user navigation and search rankings.',
      77: "Successful topic cluster implementations offer a few valuable lessons:",
      78: "Thorough research: do the in-depth work on target keywords and user intent before you build any pillar or cluster content. It's what lets you create material that's actually relevant and meets your audience's needs.",
      79: "Quality over quantity: each cluster piece needs to deliver real value and insight. Avoid shallow content, because that's what makes users see the site as a reliable source.",
      80: 'Consistent updates: regularly revisiting and updating pillar and cluster pages keeps the content fresh, which lines up with what search engines want to see too: up-to-date information.',
      82: 'SEO keeps evolving, and topic cluster strategy is no exception. As digital marketing practices shift, the approach to content organization has to shift with it. The trends worth watching right now: deeper integration with advanced technologies, cross-channel content frameworks, and staying adaptable to algorithm updates. Let\'s look at what these mean for topic clustering going forward.',
      84: "AI and semantic search are changing how content gets created and structured. AI tools can now analyze huge datasets to figure out the actual intent behind a search query, which raises the importance of topic clusters that address comprehensive themes instead of isolated keywords. Organizations can use AI to guide content creation so each piece of cluster content stays tied to the core subject of the hub page. That helps with indexing and delivers a better user experience by matching content to what people actually need.",
      86: 'Modern consumers engage with content across multiple platforms: websites, social media, email newsletters, and more. A solid cross-channel content strategy lets a brand use its topic cluster framework more effectively across all of them. A business could build a central hub on its website around a major topic, like digital marketing strategies, while promoting the associated cluster content across other platforms. That amplifies reach and strengthens brand authority, since everything stays interconnected. Engagement data across channels can then be used to keep refining the clusters over time.',
      88: "As Google keeps refining its algorithms, structured content matters more, not less. Recent updates favor in-depth, relevant content that actually addresses what users are searching for comprehensively. Adapting your topic cluster strategy to these updates means continuously refining pillar pages and cluster content based on real performance data. If a specific cluster is getting strong engagement, redirect resources to optimize it further or build out related clusters. Staying on top of algorithm changes is what keeps visibility high over time.",
    },
  },
  63: {
    es: {
      0: 'Los enlaces internos sostienen la estructura de cualquier sitio, funcionan como puentes entre las distintas páginas. En este artículo te muestro cómo implementarlos bien, tanto para el SEO como para mejorar de verdad la experiencia del usuario.',
      1: 'En esta guía repaso desde la definición y los fundamentos hasta las estrategias y prácticas que recomiendo para maximizar su efectividad, incluyendo cómo gestionar los enlaces internos en HTML. Vas a ver cómo estos elementos pueden llevar tu sitio a otro nivel.',
      4: 'Los enlaces internos son hipervínculos que conectan distintas páginas dentro de un mismo dominio. Su función es facilitar una navegación fluida y organizada, tanto para los usuarios como para los buscadores. Si un artículo de blog menciona otro artículo, ese enlace lleva al lector directo a la página relacionada, mejorando su experiencia de navegación. También le permite a las arañas rastrear y entender la estructura del contenido del sitio, algo esencial para que la indexación funcione bien.',
      6: 'Implementar bien los enlaces internos contribuye mucho a la arquitectura de un sitio. Ayudan a distribuir la autoridad entre páginas internas, algo vital para el SEO, porque Google y otros buscadores valoran la relevancia y el valor del contenido según qué tan interconectado está. Un sistema de enlaces internos bien organizado le permite a los buscadores entender mejor la relación entre los temas, lo que facilita categorizar bien el sitio y, al final, mejora el posicionamiento en los resultados.',
      7: 'Los enlaces internos también influyen en las métricas de engagement, como el tiempo que los usuarios pasan en el sitio y las páginas vistas por visita. Si los enlaces están bien distribuidos y son relevantes, es más probable que el visitante explore más contenido, lo que favorece tanto la experiencia de usuario como el rendimiento SEO. Y conviene no olvidar el HTML: usar los atributos correctos y una estructura lógica en los enlaces internos puede optimizar aún más su rendimiento.',
      8: 'En pocas palabras, los enlaces internos son una herramienta fundamental tanto para el SEO como para el diseño web: facilitan la navegación y, de paso, ayudan a establecer la relevancia y autoridad del contenido, algo que impacta directamente en cómo rinde un sitio en los buscadores.',
      10: 'Los enlaces internos y externos cumplen roles distintos dentro de una estrategia SEO, y entender esa diferencia es clave para optimizar bien. Acá te dejo las características que distinguen a estos dos tipos de enlaces.',
      12: 'Una de las principales diferencias es el control que tienes sobre ellos. Los enlaces internos los gestiona por completo el dueño del sitio, lo que permite optimizar de forma más ágil: se pueden modificar, agregar o eliminar según cambien las necesidades del contenido o de la estrategia SEO. Los enlaces externos, en cambio, dependen de otros sitios, así que tu capacidad de influir en su calidad o cantidad es limitada.',
      13: 'Los enlaces internos también se pueden posicionar estratégicamente para guiar a los usuarios hacia páginas relevantes o prioritarias. Ese control es clave para dirigir el flujo de tráfico y mejorar la experiencia de usuario, algo que no puedes replicar de la misma forma con enlaces externos.',
      15: 'Otra diferencia importante está en cómo se distribuye la autoridad dentro de un sitio. Los enlaces internos son esenciales para transferir autoridad de dominio entre páginas: cuando enlazas a una página con buena autoridad, esa autoridad se reparte también hacia otras páginas internas a través del enlace. Esta distribución ayuda a mejorar el posicionamiento y, en general, el SEO del sitio.',
      16: 'Los enlaces externos también contribuyen a la autoridad del sitio, pero de otra forma. Normalmente requieren esfuerzo para conseguirlos, y su efectividad varía según la calidad y relevancia del sitio que enlaza. Por eso su impacto en el SEO es menos predecible que el de los enlaces internos.',
      18: 'Los enlaces internos suelen ir en lugares estratégicos: el cuerpo del texto, los menús de navegación, el pie de página. Esa ubicación le da al usuario acceso fácil a información relacionada y mejora la navegación general del sitio. Incluirlos bien en el HTML de cada página también facilita que los buscadores indexen el contenido.',
      19: 'Los enlaces externos, en cambio, suelen ir donde el autor considera pertinente mandar al lector a una fuente externa. Pero su ubicación no es tan central para la estructura de navegación del sitio como la de los enlaces internos, así que son menos efectivos para guiar al usuario en una experiencia de navegación fluida.',
      20: 'Entender estas diferencias te permite construir una estrategia de enlaces que maximice tanto el SEO como la experiencia de usuario: el foco principal en crear y gestionar buenos enlaces internos, complementado de vez en cuando con enlaces externos relevantes.',
      22: 'Implementar bien los enlaces internos es una estrategia clave que trae varias ventajas, tanto para el SEO como para la experiencia de usuario. Una red de enlaces bien estructurada facilita el rastreo de contenido por parte de los buscadores y, de paso, mejora cómo interactúa el usuario con el sitio. Te dejo las principales ventajas de incluir enlaces internos en el diseño de tu web.',
      24: 'Los enlaces internos juegan un papel fundamental en la optimización SEO de un sitio. Al enlazar distintas páginas dentro del mismo dominio, armas una jerarquía de contenido que le permite a los buscadores entender la importancia y la relación entre las distintas áreas de tu sitio. Esto trae estos beneficios:',
      29: 'Los enlaces internos son valiosos para el SEO y, además, mejoran bastante la experiencia de usuario. Al ofrecer enlaces contextualizados, el visitante encuentra fácil información relacionada y relevante. Esto se traduce en varias ventajas:',
      34: 'Usar bien los enlaces internos también ayuda a establecer credibilidad y relevancia en tu contenido. Al vincular páginas relacionadas, muestras conexiones lógicas que validan la calidad de la información que das. Estas son las razones más destacadas:',
      39: 'Por último, una buena estrategia de enlaces internos puede aumentar bastante las oportunidades de conversión en tu sitio. Al guiar a los usuarios hacia páginas de productos, servicios o formularios de contacto con enlaces contextuales, logras estos objetivos:',
      43: 'Implementar los enlaces internos con cuidado va a beneficiar tu SEO y, al mismo tiempo, va a construir una experiencia de usuario más rica y con mejor conversión.',
      45: 'Optimizar los enlaces internos mejora de forma directa la visibilidad y el rendimiento SEO de un sitio. Para que la estrategia funcione, hay que implementar prácticas que garanticen que tanto los usuarios como los buscadores puedan navegar de forma eficiente por el contenido. Te dejo varias estrategias que ayudan a maximizar el impacto de tus enlaces internos.',
      47: 'Uno de los primeros pasos es identificar qué contenido tiene más relevancia y valor. Con herramientas analíticas puedes ver qué páginas tienen más tráfico y cuáles generan más interacción. Esas páginas clave deben ser el centro de tu estrategia de enlaces internos: dirigir tráfico hacia ellas le da valor al usuario y mejora la distribución de autoridad dentro del dominio. Y enlazar contenido nuevo o poco visitado hacia esas páginas principales garantiza que se beneficien del tráfico que ya tienen.',
      49: 'El texto de anclaje, o anchor text, es crucial para optimizar los enlaces internos. Debe ser descriptivo y relevante para el contenido al que enlaza. Meter palabras clave pertinentes de forma natural ayuda al usuario a entender a dónde lo va a llevar el enlace, y le da a los buscadores información valiosa sobre la relación entre páginas. Eso sí, hay que evitar la sobreoptimización, porque puede jugar en contra del SEO. El equilibrio es la clave acá.',
      51: 'Dónde ubicas los enlaces internos también afecta su efectividad. Poner los enlaces importantes cerca del inicio del contenido aumenta su visibilidad tanto para los usuarios como para los buscadores. También conviene incluirlos en áreas estratégicas como menús, barras laterales o el pie de página, dando acceso fácil a las secciones clave del sitio. Este tipo de posicionamiento mejora la experiencia de usuario y ayuda a que los buscadores exploren el sitio de forma más eficiente.',
      53: 'Otra práctica efectiva es enlazar hacia categorías y etiquetas dentro del contenido. Esto mejora la indexación por parte de los buscadores y facilita la navegación para el usuario. Si estructuras tu contenido en categorías y etiquetas relevantes, armas una jerarquía intuitiva y fácil de seguir, lo que puede mejorar la retención de usuarios en el sitio. Recomiendo enlazar a taxonomías que agrupen contenido similar, para darle contexto a la experiencia del visitante.',
      55: 'La automatización puede ser una gran aliada para gestionar enlaces internos. Hay varias herramientas y plugins que ayudan a monitorear y crear enlaces internos de forma más eficiente, identificando oportunidades para enlaces nuevos y evaluando la estructura de los que ya tienes. Usar las herramientas correctas te ahorra tiempo y asegura que no se te pase ninguna área importante. Combinado con un enfoque analítico, esto te lleva a un sitio más optimizado y con mejor SEO.',
      58: 'La estructura del código HTML para enlaces internos importa tanto para la experiencia de usuario como para el SEO. Un enlace interno se define con la etiqueta `<a>`, que conecta distintas páginas dentro del mismo dominio. Cada enlace debe incluir un atributo `href` que apunte directamente a la URL correcta. Además, las URLs deben ser relevantes y descriptivas, tanto para los buscadores como para que el usuario entienda a dónde va a llegar al hacer clic. Mantener una jerarquía clara en el contenido y usar un diseño semántico adecuado ayuda tanto a los usuarios como a los rastreadores a entender mejor la información.',
      60: 'Los atributos HTML en los enlaces internos también juegan un papel importante en el SEO. Uno de los más relevantes es `title`, que da información adicional sobre el propósito del enlace: un título claro puede mejorar la experiencia de usuario y ayuda a los buscadores a entender mejor el contexto del enlace. Recomiendo evitar el uso excesivo de `target="_blank"` (que abre los enlaces en pestañas nuevas) a menos que sea realmente necesario, porque puede afectar la experiencia de navegación. Y el atributo `rel="nofollow"` puede servir en los casos donde no quieres distribuir autoridad hacia ciertas páginas.',
      62: 'Implementar enlaces internos en HTML tiene sus errores típicos, y pueden afectar tanto la navegación como el SEO de tu sitio. Uno de los más comunes son los enlaces rotos, que frustran al usuario y le pegan a la autoridad del dominio: revisa tus enlaces con regularidad y asegúrate de que todos apunten a contenido que existe. Otro error es el "overlinking", meter demasiados enlaces en un solo contenido, lo que diluye la relevancia de cada uno y confunde a los buscadores. La idea es buscar un equilibrio entre informar y dirigir al usuario, sin saturar el contenido. Y presta atención a la consistencia en el anchor text: un lenguaje claro y conciso evita confusiones y ayuda a entender mejor lo que estás enlazando.',
      64: 'Medir y analizar cómo rinden tus enlaces internos es un paso esencial para optimizar la estructura del sitio y mejorar tanto el SEO como la experiencia de usuario. Cuando identificas cómo afectan al comportamiento del usuario y a la indexación por parte de los buscadores, puedes hacer ajustes estratégicos que potencien los resultados.',
      66: 'Para medir la efectividad de los enlaces internos conviene centrarse en un conjunto de indicadores que te dan información valiosa. Algunos de los más relevantes:',
      68: 'Interpretar bien los datos de tráfico relacionados con enlaces internos es clave para entender cómo rinde tu contenido. Con herramientas como Google Analytics puedes ver patrones en el comportamiento de los usuarios: un aumento en las visitas a páginas enlazadas internamente suele reflejar que la distribución de autoridad está funcionando. Pero si detectas tasas de rebote altas en esas páginas, puede ser una señal de que el contenido no cumple las expectativas del usuario. También es útil ver, con mapas de calor, cómo interactúan los usuarios con tus enlaces internos, para saber cuáles son más atractivos y cuáles pasan desapercibidos. Con esa información ajustas tu estrategia de links, mandando tráfico a las secciones que necesitan más visibilidad.',
      70: 'Con esos datos puedes hacer ajustes estratégicos en la estructura de tus enlaces internos. Si algunos enlaces tienen un CTR bajo, prueba modificar el anchor text para hacerlo más atractivo. Reforzar los enlaces en contenido relevante y popular también ayuda a redistribuir autoridad hacia páginas que necesitan mejorar su posicionamiento. Y hacer pruebas A/B con distintas estrategias de enlazado te ayuda a identificar qué métodos generan más interacción, para seguir optimizando tanto la experiencia de usuario como el SEO. La medición constante y la disposición a adaptarte al comportamiento del usuario son la clave acá.',
      72: 'Implementar bien los enlaces internos puede transformar la estructura y el rendimiento SEO de un sitio. Te dejo algunos casos prácticos que muestran cómo distintas estrategias pueden maximizar su impacto.',
      74: 'En sitios con mucho volumen de contenido, como blogs o plataformas de noticias, los enlaces internos juegan un papel crítico tanto en la navegación como en el SEO. Una plataforma de noticias, por ejemplo, puede enlazar artículos relacionados para que el lector acceda a información relevante sin salir del sitio. Esto mejora la experiencia de usuario y ayuda a distribuir la autoridad de página entre varios artículos, optimizando el posicionamiento. Usar los enlaces internos de forma estratégica te permite guiar a los usuarios hacia contenido de interés y aumentar el tiempo de permanencia en el sitio.',
      75: 'Un ejemplo exitoso es un sitio de reseñas de libros que usa enlaces internos para conectar reseñas entre sí, con secciones de autor y con listas de recomendaciones. Esto ayuda al usuario a encontrar contenido relacionado y, de paso, mejora la indexación, porque los buscadores interpretan fácil la relación entre artículos y categorías.',
      77: 'Las tiendas en línea y los sitios B2B se benefician mucho de un buen uso de enlaces internos. En una tienda en línea puedes enlazar productos relacionados para incentivar más compras: en una tienda de moda, por ejemplo, cada producto puede enlazar a artículos complementarios como zapatos, accesorios o prendas recomendadas. Esto mejora la experiencia de usuario y aumenta las oportunidades de conversión, al ofrecer opciones relevantes que le pueden interesar al cliente.',
      78: 'Los sitios B2B, por su parte, pueden enlazar productos o servicios a sus categorías y a casos de estudio. Un proveedor de software, por ejemplo, puede enlazar su herramienta de gestión de proyectos con artículos sobre mejores prácticas o testimonios de clientes. Esta estrategia le da valor al visitante y refuerza la relevancia del contenido frente a lo que buscan los usuarios.',
      79: 'En ambos casos, el anchor text tiene que ser claro y relevante, para que tanto los usuarios como los buscadores entiendan el contexto del enlace. Una implementación estratégica de enlaces internos puede ser determinante para mejorar el SEO y la navegación en estos casos, y al final, para cumplir los objetivos de negocio.',
    },
    en: {
      0: "Internal linking is a crucial part of web design, it improves user experience and boosts SEO at the same time. By connecting different pages within your site, internal links create a clear structure that guides both users and search engines.",
      1: "In this guide I go over the fundamental concepts of internal linking, its benefits, and how to implement strategies that actually optimize your site. This matters whether you're a developer, a technical SEO, or a business owner trying to grow your online presence.",
      4: "Internal linking means hyperlinks that connect one page of a website to another page on the same domain. These links play a pivotal role in both user navigation and SEO. Think of internal links as pathways through a website, the same way hallways connect rooms in a house. Done strategically, they create a coherent structure for the content, so visitors can easily reach related information.",
      5: "Internal linking also helps establish a hierarchy within the site. It lets a site owner emphasize certain pages over others, based on how many and how good the links pointing to them are. That hierarchy matters both for user experience and for how search engines navigate and index the site. Use internal links well and you improve the site's overall authority and visibility in search results.",
      7: "Site structure is critical for both usability and SEO, and internal linking is a fundamental part of that. Internal links create a network of connections among pages, which helps search engines understand how pieces of content relate to each other. A well-structured site with clear internal links is easier to crawl and index, which increases the odds that content actually ranks.",
      8: "Internal links also help distribute page authority throughout the site. Every page carries a certain amount of authority, shaped by things like inbound links and content quality, and linking important pages to other relevant ones passes some of that authority along, helping newer or lesser-known content get found. That distribution is what keeps every page getting the attention it deserves, and it's what makes for a balanced, effective site structure.",
      9: "Understanding what internal linking is and how it shapes site structure lays the groundwork for a solid SEO strategy. Done right, it improves the user experience and amplifies how the site performs in search engines.",
      11: "Internal linking isn't just a technical detail of web design, it's a strategic move that can significantly improve both user experience and SEO. Implement it well and you get a more navigable site that keeps visitors engaged while boosting visibility in search results at the same time.",
      13: "One of the biggest benefits of internal linking is better user navigation. Place internal links strategically throughout the site and users can easily reach related content, which keeps them engaged and encourages them to explore other areas of the site. A well-structured internal linking strategy makes this happen:",
      17: "When a user can move smoothly from one relevant article to another, they're more likely to find what they're looking for, and the whole interaction with the site ends up more satisfying.",
      19: "Internal links play a crucial role in distributing page authority across a site. Every page carries some amount of authority, and that authority can be shared with other pages through internal linking. This helps the whole site by giving lower-authority pages a boost from links coming off higher-authority ones. The key aspects of authority distribution:",
      23: "Spread link equity around and it's not just the homepage or the popular articles that gain visibility, newer or less-visited pages can climb the rankings too.",
      25: "Search engines rely on internal links to crawl and index pages effectively. A site with a coherent internal linking structure lets search bots discover new content quickly and understand how different pages relate. Optimized internal linking gives you:",
      29: "At the end of the day, a good internal linking strategy has a real impact on how search engines perceive the whole site, which makes it critical for overall SEO performance.",
      31: "Taking a strategic approach to internal linking is crucial for both user experience and SEO. Link pages thoughtfully and you improve navigation, distribute authority, and support search engine crawling and indexing all at once. Here's what an effective internal linking strategy looks like.",
      33: 'Anchor text plays a big role in giving context about the linked page. Descriptive anchor text gives users and search engines a clear idea of what to expect when they click. Avoid generic phrases like "click here" and use text that accurately reflects the linked content instead, "learn about our investment strategies" works a lot better than "click here." This helps users understand what they\'re getting, and it helps SEO by aligning the anchor text with target keywords.',
      35: "Internal links should sit naturally within the content, keeping a seamless flow for the reader. Forced or excessive linking hurts the user experience and can even trigger search engine penalties for looking manipulative. Place links where they naturally fit the narrative, pointing users to more information without breaking their reading flow. Contextual relevance is the key here: links should add to the content, not distract from it.",
      37: "A well-structured site architecture makes navigation intuitive and helps distribute authority throughout the site. Organize pages into a logical hierarchy and essential content stays easily accessible from the homepage and other primary pages. Core pages should be just a few clicks from the homepage, with supporting pages linked closely nearby. This improves navigation and maximizes the SEO benefit of internal linking at the same time.",
      39: "Internal linking matters, but overloading a page with too many links causes confusion and dilutes the value of each one. There's no official limit on how many internal links a page can have, but keeping the number reasonable is smart. Think about the context of the content and the reader's journey, and aim for clarity: every link should serve a purpose and add to the content, not just pad it out.",
      41: "Regularly reviewing and updating internal links is essential to keep the linking strategy relevant and effective. As you add new content and revise older pages, check that existing links still point to relevant content. Broken links hurt the user experience and can hurt SEO too. Set up a routine for checking and updating internal links, and the site stays functional and easy to use.",
      44: 'Internal linking within blogs and articles does double duty for user experience and SEO. When you\'re writing blog content, weave in links to related posts strategically. An article on "Saving Strategies," for instance, should link to posts on "Debt Management" or "Investment Planning." That gives the reader extra value and keeps them engaged by pointing them to complementary content.',
      45: 'The anchor text for these links should be descriptive and relevant. Instead of a generic "click here," use something specific like "learn more about effective savings," which gives users a clear idea of what\'s coming. It also helps search engines understand the context of the linked content, improving SEO for both the original and the linked page.',
      46: "Keeping a balanced number of internal links within a blog post matters too. Too many overwhelm the reader, too few miss opportunities to guide traffic to important pages. A good rule of thumb is 2 to 5 relevant links per post, depending on how long and complex the content is.",
      48: 'Service pages are critical for conversion, and good internal linking can make a real difference in how they perform. On a service page, link to related testimonial pages or case studies that show the value of the service in action. A "Financial Advisory Services" page, for example, could link to a case study showing how the service helped an actual client. That gives potential customers a real-world application of the service, which builds trust and credibility.',
      49: 'Linking to blog articles that go deeper into aspects of the service also helps. A service page on financial advising, for instance, could link to an article on "Investment Strategies" for users looking for more comprehensive information, which helps them make a better decision.',
      50: "Updating internal links on service pages regularly matters just as much. As content evolves and new services come online, keeping those links relevant and functional is essential for a seamless user experience. It supports proper site navigation and strengthens the overall SEO strategy by keeping important pages accessible and interconnected.",
      52: "Using the right tools makes internal linking strategies a lot more effective. The two I'd point to for analyzing and optimizing internal links are Google Analytics and Screaming Frog, both give real insight into user behavior, site structure, and how well your links are actually performing.",
      54: "Google Analytics is a powerful tool for tracking user interactions on a site. It lets you monitor how visitors navigate through the site, which pages they visit most, and how long they stay on each one, all crucial information for understanding the actual impact of your internal links.",
      55: "Analyze these metrics and you can spot trends and optimize your internal linking to improve both navigation and SEO performance.",
      57: "Screaming Frog is a comprehensive SEO spider tool that gives detailed insight into a site's internal link structure. It crawls the site and pulls out valuable information, so you can analyze your internal linking strategy properly.",
      58: "With Screaming Frog you can run these analyses on your internal linking:",
      63: "Use Screaming Frog alongside Google Analytics and you get a well-rounded approach to optimizing internal linking, one that improves both user experience and SEO outcomes.",
    },
  },
  64: {
    es: {
      // Most of this post's ES content was already close to Juan's real
      // voice (first person, direct, "así sea"-style rhythm) — only the
      // one "no solo... sino" formulaic sentence (flagged by
      // 29-VOICE-PROFILE.md as an AI-tell to avoid) and one stray markdown
      // artifact needed a rewrite. Everything else is left byte-identical.
      35: 'Usa términos técnicos precisos que refuercen tu expertise en contenido.',
      37: 'Ignorar el E-E-A-T en 2026 es planificar el fracaso de tu sitio. Si te enfocas en la autoridad de marca, la transparencia técnica y en aportar valor humano único (Information Gain), vas a complacer a los algoritmos de Google, sí, pero sobre todo vas a construir una relación duradera y de confianza con tu audiencia real.',
    },
    en: {
      0: 'E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trustworthiness, and by 2026 it\'s become the most important quality filter Google runs on your SEO content. In this guide I break down each component and show how they actually influence rankings and user perception.',
      1: 'From understanding why first-hand experience matters to implementing the best practices in content creation, this is for technical SEOs, developers, and business owners who want to grow their online presence for real.',
      4: 'E-E-A-T stands for Experience, Expertise, Authoritativeness, and Trustworthiness, and together they form the framework Google uses to evaluate content quality and its sources. In SEO terms, E-E-A-T shapes how well a site ranks on the SERPs. Each piece matters on its own: Experience is about firsthand knowledge and real-world application, Expertise is specialized knowledge, especially critical in sensitive areas like health and finance, Authoritativeness is being recognized as a leading source in your niche, and Trustworthiness is about building a reliable, secure online presence.',
      6: 'Back in 2022, Google added "Experience" as the first component of E-E-A-T. That change put real weight behind content that reflects practical knowledge and actual firsthand encounters with a topic, not just secondhand research. Sites that can show a genuine, lived understanding of what they\'re writing about tend to rank higher. It was a clear signal: authentic, relatable content beats generic content, because it resonates more with people who are actually looking for something useful.',
      8: "Google's Search Quality Rater Guidelines are the foundational resource for understanding how E-E-A-T actually gets assessed. They spell out, in detail, the factors Google's human raters weigh when they judge content quality: depth of information, author qualifications, overall user experience. Raters also look at a site's reputation and its contributors' expertise, especially on YMYL topics, ones that could affect someone's health or finances. Follow these guidelines and your E-E-A-T improves, which translates into better visibility and more trust from both users and search engines.",
      11: "First-hand experience shapes content quality directly. Google prioritizes information that comes from real-world knowledge, because it tends to be more authentic and relevant. When a creator shares insight based on something they actually did, using a product, visiting a destination, it adds a level of credibility that generic content just doesn't have. Content grounded in real practical involvement resonates better with readers, and that shows up in the engagement metrics search engines read as quality signals.",
      13: "Experience-driven content shows up in different forms across industries. A few notable examples:",
      19: "Showcasing experience effectively in your web content strengthens E-E-A-T. A few strategies that help:",
      24: "Implement these strategies and content creators can demonstrate their practical knowledge more clearly, improving their odds of ranking higher while actually delivering value to their audience.",
      26: "Establishing expertise is crucial for E-E-A-T in any content strategy, especially on YMYL (Your Money or Your Life) topics. In these sensitive areas, accuracy and reliability can directly impact someone's health, finances, or life decisions, which is why Google prioritizes content produced by qualified experts. When someone searches for health, finance, or legal information, they want guidance from a trusted source with a real track record.",
      28: "In YMYL topics, the stakes are exceptionally high. Financial advice, medical information, legal counsel, all of it needs to be accurate and trustworthy, because misinformation here has real consequences. Google pushes content creators to demonstrate genuine expertise in these fields, and sites that don't meet that bar tend to see their visibility drop. That's why it matters to have qualified people actually producing this content, not just anyone with a keyword list.",
      30: "A critical step in establishing expertise is verifying author credentials. The author should actually hold relevant academic degrees, certifications, or professional experience in the field, and that should be clearly presented, usually in an author bio. Linking to professional profiles like LinkedIn or a personal site adds credibility too. Google and other search engines increasingly factor these qualifications into their algorithmic assessments, so it's worth making the legitimacy of your content creators obvious, not implied.",
      32: "Building out solid contributor and author profiles is a vital practice for demonstrating expertise. A profile should give a full picture of the author's background: education, professional experience, areas of specialization. Testimonials, industry affiliations, and published work all add authority on top of that. Keep it consistent across every platform the contributor appears on, so their credentials are easy to verify. This supports user trust and lines up with how search algorithms favor content from established experts.",
      34: "Establishing authoritativeness matters for content that actually resonates with both users and search engines. It's essentially a site's recognition as a credible, reliable source within its niche, and Google evaluates it through several signals that feed directly into rankings.",
      36: "External signals of authority play a crucial role in a site's credibility. Backlinks from reputable sources tell Google other experts recognize the value of your content, and mentions in trusted media outlets add to that perceived authority. These endorsements show relevance and help users spot reliable sources. Citations in scholarly articles or industry reports contribute to building authority too.",
      38: "Building effective link building strategies matters for growing a site's authority. Relationships with influencers and industry leaders lead to valuable backlinks, and content marketing tactics like guest blogging on reputable sites or building high-quality infographics attract organic backlinks from credible sources too. Original research or genuinely unique insights create content other people naturally want to reference, which grows backlinks on its own. Monitoring and analyzing your backlink profile regularly keeps authority growing and surfaces new opportunities you'd otherwise miss.",
      40: "Brand mentions and citations from authoritative sources can significantly boost perceived authority. When a brand gets referenced in a reputable context, linked or not, it still builds credibility. A few strategies that work:",
      45: "Each of these strategies amplifies authority and positions the brand as a thought leader in its field. Build relationships with credible sources, keep generating quality content consistently, and recognition follows, which feeds directly into user trust and SEO performance. Do this systematically and authoritativeness becomes a core part of the SEO strategy, with long-term payoff for organic visibility and engagement.",
      47: "Trustworthiness is a pillar of E-E-A-T, covering both reliability and transparency. As search engines prioritize user safety and accurate information, how a site demonstrates trustworthiness has become pivotal for SEO success.",
      49: "Security is non-negotiable for building trust. A site needs solid security protocols, HTTPS to encrypt user data at minimum. That encryption protects sensitive information and signals to both users and search engines that the site is secure. Visible security certificates and compliance with standards like GDPR add to user confidence, and regular security audits catch vulnerabilities before they become a problem. Being transparent about all this solidifies a site's integrity and shows real commitment to user safety.",
      51: "A site with clear contact information builds trust by making it easy for users to reach out with questions or concerns. A good contact section includes multiple ways to get in touch: email, phone, links to social profiles. That openness reassures people the business is legitimate and accountable. A dedicated customer support section with prompt response times adds to reliability too, users should feel their questions actually get taken seriously.",
      53: "Every site runs into negative feedback eventually, but how a business responds says a lot about its trustworthiness. Address concerns transparently, offer real solutions, and show the improvements you actually made because of user feedback. That approach limits the damage from negative reviews and shows you're willing to engage with your audience, and that perception of accountability influences trust more than the negative review itself does. Good service that earns positive reviews naturally counterbalances the occasional bad one too.",
      55: "E-E-A-T has changed a lot since it was introduced, tracking broader shifts in the digital landscape and Google's ongoing effort to assess content quality better. As how people find and consume information online keeps evolving, so does how E-E-A-T gets understood and applied in SEO.",
      57: "Google's focus was originally on expertise, authority, and trustworthiness (E-A-T). Adding \"Experience\" as the first element in 2022 marked a real shift, one that put weight behind firsthand knowledge and authentic engagement with a topic. That wasn't a cosmetic change, it reshaped how content gets evaluated. Since then, Google has kept refining its Search Quality Rater Guidelines around these principles, pushing creators to demonstrate genuine experience, especially where real-world engagement actually adds value.",
      59: "E-E-A-T shows up differently depending on the type of query. YMYL queries need a higher degree of expertise and authority from the content creator, since misinformation there has real consequences. Google prioritizes content that meets E-E-A-T standards and addresses the specific intent behind the query, whether it's informational, transactional, or navigational. As queries get more nuanced, adapting E-E-A-T to these different contexts becomes essential for actually meeting user needs and improving search visibility.",
      61: "Given how varied online content is, SEO professionals need to tailor their E-E-A-T strategy to the content type they're working with. A medical website should emphasize author credentials and showcase both experience and expertise directly. Lifestyle blogs, on the other hand, benefit more from personal narratives that highlight firsthand experience. Interactive elements and community feedback can bolster trustworthiness across either type. Adapt the content strategy this way and you satisfy the algorithm and enrich the user experience at the same time, which drives better engagement and better rankings.",
      63: "In SEO, E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) gets shaped by several critical signals. Understanding them gives you real insight into how Google assesses content quality, and helps you optimize toward better rankings. Here are the signals that matter most.",
      65: "Backlinks remain one of the strongest indicators of E-E-A-T. When reputable sites link back to yours, it reflects your content quality and signals authority in your specific field. High-quality backlinks from established sources mean the content has been vetted and recognized by peers, which boosts credibility in Google's eyes. A medical article that gets links from respected medical journals, for example, signals both expertise and trust at once. Keep an eye on the quantity, quality, and relevance of your backlinks as part of the overall SEO strategy.",
      67: "Brand mentions across the internet, even without a direct backlink, work as critical signals of authority and trustworthiness. A brand that keeps getting mentioned in reputable publications or by industry influencers reinforces its position as an authoritative source, and Google values that external validation as part of its E-E-A-T assessment. This is a real argument for organizations to invest in PR, getting their brand narrative shared positively across media outlets, which strengthens overall authority in the niche.",
      69: "A site's reputation has a real impact on perceived trustworthiness, and by extension, on its E-E-A-T. Positive reviews on established platforms boost confidence among potential users and signal to search engines that the site delivers value. A pile of negative reviews does the opposite. Actively managing online reputation, addressing concerns promptly, encouraging satisfied customers to leave reviews, matters here. Transparent communication around customer experience cultivates a trustworthy image, which is vital for strong E-E-A-T over time.",
      72: "Creating content that actually lives up to E-E-A-T principles requires a clear strategy focused on delivering value through expertise and authenticity. Good content is well-researched, accurate, and gives a comprehensive understanding of the topic. A few best practices that get you there:",
      79: "Technical SEO is fundamental to supporting E-E-A-T goals. A well-structured site improves the user experience and reinforces the perception of authority and trustworthiness. The key technical considerations:",
      86: "Keeping a strong E-E-A-T profile requires ongoing monitoring and auditing. Regular assessments surface your strengths and weaknesses so you can make timely improvements. A few practices that matter:",
    },
  },
  65: {
    es: {
      // This post's ES content was already authored in a direct,
      // rhetorical-question-driven voice very close to Juan's real voice
      // sample (first/second person, "Imagina que...", "Piensa en esto
      // como...") — confirmed no em dash, no voceo, no AI-tell padding.
      // Only the intro paragraph needed a light tighten for flow; the rest
      // (including all Big-O complexity-analysis lines, which must stay
      // technically exact) is left byte-identical.
      1: 'Esta técnica se usa en campos que van desde la informática, con aplicaciones en optimización de rutas, inteligencia artificial y procesamiento de datos, hasta la economía, la biología y la ingeniería. Su esencia está en una observación simple pero profunda: muchos problemas complejos tienen estructuras que se repiten y soluciones óptimas que pueden construirse a partir de componentes más pequeños.',
      2: 'En este artículo desgloso la Programación Dinámica: sus conceptos fundamentales, sus dos enfoques principales (memoización y tabulación), algoritmos clásicos y aplicaciones prácticas, todo con ejemplos de código claros para que puedas aplicarla en tus propios proyectos.',
      39: 'Aunque Dijkstra es un algoritmo voraz, la Programación Dinámica entra en juego en problemas de caminos más cortos cuando hay pesos negativos o cuando se buscan caminos con propiedades específicas (como el número de aristas). Algoritmos como Bellman-Ford y Floyd-Warshall utilizan principios de PD para encontrar caminos más cortos en grafos, incluso con ciclos negativos en el caso de Bellman-Ford (detectándolos) o entre todos los pares de nodos en el caso de Floyd-Warshall.',
      71: 'La Programación Dinámica busca resolver problemas de la manera más eficiente posible.',
    },
    en: {
      0: 'Dynamic programming is one of those techniques that turns a complex problem into something manageable, by reusing values you\'ve already computed instead of recalculating them every time. It\'s a small idea with a huge payoff in efficiency.',
      1: "In this guide I go through the core concepts, practical applications, and benefits of dynamic programming, including how it applies to classic problems and the kind of DP challenges you'll run into on LeetCode. By the end you should have a real handle on how to design efficient algorithms with it.",
      3: "Dynamic programming is a powerful approach that significantly improves the efficiency of an algorithm. Break a complex problem into simpler subproblems and you can optimize the whole process and cut out unnecessary recalculation. It's essential if you need to deliver high-performance solutions, and it shows up constantly in technical interviews, especially the kind of DP problems you'll see on LeetCode.",
      5: "At its core, dynamic programming works by storing the results of previous computations so you can reuse them later, instead of recalculating the same thing over and over. It applies whenever a problem breaks down into subproblems that share sub-subproblems. Remember previously computed results, whether through memoization or tabulation, and you avoid all that redundant work, which is where the performance gain comes from.",
      7: "At the heart of dynamic programming is a simple principle: optimize by preserving what you've already computed. It requires a shift in thinking, from a purely recursive mindset to one focused on computational efficiency. Memoization, for instance, stores intermediate results in a data structure, which is what fixes the time complexity problem that plagues naive recursive methods. This thinking shows up across software development and it's particularly useful for the algorithmic challenges you'll hit in technical interviews, including the classic dynamic programming LeetCode problems.",
      9: "Memoization and tabulation are the two main strategies in dynamic programming, and they work differently. Memoization is top-down: it caches the results of expensive function calls and reuses them when the same input shows up again, useful when the number of unique subproblems stays relatively small. Tabulation is bottom-up: you store subproblem solutions in a table, built iteratively from the smallest subproblems up. Either one can take an algorithm from exponential to polynomial time in the best cases.",
      11: "Dynamic programming is a solid framework for solving a wide range of complex problems by breaking them into simpler subproblems. It shows up constantly in real-world applications and coding challenges, computational biology, finance, resource allocation, anywhere you need to optimize an algorithm.",
      13: "Some of the most classic problems in computing have a DP solution that turns something intimidating into something manageable. The Fibonacci sequence, the knapsack problem, and longest common subsequence are staples of any computer science curriculum, for good reason.",
      18: "One hallmark of dynamic programming is taking a recursive function and improving it with memoization. Store the results you've already computed and performance improves dramatically.",
      19: "Take calculating the nth Fibonacci number: plain recursion without memoization ends up doing exponentially many calculations. Add memoization and each Fibonacci number gets computed once and stored, dropping the time complexity to a clean O(n).",
      21: "Another practical DP-adjacent application: finding two numbers in an array that sum to a target value. The naive approach, nested loops, lands you at O(n²). A hash map gets that down to O(n).",
      28: "LeetCode has a huge collection of challenges that are genuinely good for practicing dynamic programming. Working through them sharpens both your algorithmic thinking and your actual coding chops.",
      32: "These challenges reinforce the principles of dynamic programming and prepare you for technical interviews at the same time, giving you concrete examples of the theory in practice.",
      34: "Using dynamic programming brings several real advantages to problem-solving efficiency in software development. Understand the benefits and the trade-offs, and you can judge when it actually applies, including the kind of challenges you'll see on dynamic programming LeetCode problems.",
      36: "One of the biggest benefits of dynamic programming is cutting time complexity through smart problem decomposition. Store subproblem results and reuse them, and you avoid redundant computation entirely. Instead of recalculating values like a naive Fibonacci algorithm does, DP gets you to linear time, O(n), just by storing intermediate results. That difference matters a lot on larger datasets or more complex algorithms, anywhere time constraints are tight.",
      38: "Another advantage that doesn't get talked about enough: code maintainability and easier debugging. Memoization simplifies recursive calls and keeps track of previously calculated results, which cuts down the odds of errors creeping into deep recursion and leaves you with clearer, more manageable code. Breaking the algorithm into smaller subproblems also makes the logic more transparent, so when something does go wrong, you find and fix it faster.",
      40: "Dynamic programming applies across a huge range of problem domains, which is what makes it such a versatile tool in application development. From optimization problems in operations research to algorithmic challenges in competitive programming, DP techniques adapt to a lot of different scenarios. If you're working through dynamic programming LeetCode problems, that flexibility is exactly why it's worth mastering, it sharpens your skill set and your ability to deliver solid software solutions.",
    },
  },
}

function walkAndRewrite(
  node: LexNode,
  rewrites: Record<number, string>,
  counterRef: { i: number },
  postId: number,
  locale: Locale,
) {
  if (node.type === 'block' || node.type === 'table') return
  if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'listitem') {
    const idx = counterRef.i
    counterRef.i += 1
    const replacement = rewrites[idx]
    if (replacement !== undefined) {
      applyRewrite(node, replacement, `post ${postId} ${locale} block[${idx}]`)
    }
    return
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkAndRewrite(child, rewrites, counterRef, postId, locale)
  }
}

const EM_DASH = '—'
const VOCEO_MARKERS = [
  /\bvos\b/i,
  /\btenés\b/i,
  /\bpodés\b/i,
  /\bquerés\b/i,
  /\bsabés\b/i,
  /\busás\b/i,
  /\bnecesitás\b/i,
  /\btrabajás\b/i,
  /\bsospechás\b/i,
  /\bpreferís\b/i,
  /\bmirá\b/i,
]

// Collects {type, node} for every block/table subtree found (for the
// pre/post byte-identical self-check).
function collectStructuralNodes(node: LexNode, out: LexNode[]) {
  if (node.type === 'block' || node.type === 'table') {
    out.push(node)
    return
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectStructuralNodes(child, out)
  }
}

async function main() {
  const payload = await getPayload({ config })
  const progress = loadProgress()

  // Confirm every id exists live before processing anything.
  for (const id of IDS) {
    try {
      await payload.findByID({ collection: 'posts', id, depth: 0 })
    } catch (err) {
      console.error(`FATAL: post id=${id} does not exist live — aborting. ${String(err)}`)
      process.exit(1)
    }
  }

  for (const id of IDS) {
    if (progress[String(id)] === 'done') {
      console.log(`id=${id}: already done, skipping`)
      continue
    }

    const before = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const beforeContent = before.content as unknown as Record<Locale, LexNode>

    // Snapshot structural (block/table) nodes pre-write for the byte-
    // identical self-check, per locale.
    const preStructural: Record<Locale, LexNode[]> = { es: [], en: [] }
    for (const locale of LOCALES) {
      collectStructuralNodes(beforeContent[locale].root as unknown as LexNode, preStructural[locale])
    }

    for (const locale of LOCALES) {
      const tree = JSON.parse(JSON.stringify(beforeContent[locale])) as { root: LexNode }
      const counterRef = { i: 0 }
      walkAndRewrite(tree.root, REWRITES[id][locale], counterRef, id, locale)

      await payload.update({
        collection: 'posts',
        id,
        locale,
        data: { content: tree as unknown as Record<string, unknown> },
      })
      console.log(`id=${id} locale=${locale}: written (${counterRef.i} blocks walked)`)
    }

    // Read back to confirm persistence.
    const after = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const afterContent = after.content as unknown as Record<Locale, LexNode>

    let structOk = true
    for (const locale of LOCALES) {
      const postStructural: LexNode[] = []
      collectStructuralNodes(afterContent[locale].root as unknown as LexNode, postStructural)
      const preJson = JSON.stringify(preStructural[locale])
      const postJson = JSON.stringify(postStructural)
      if (preJson !== postJson) {
        structOk = false
        console.error(`id=${id} locale=${locale}: FAIL — block/table structure changed after write`)
      }
    }

    if (!structOk) {
      console.error(`id=${id}: NOT marking done — structural self-check failed`)
      process.exit(1)
    }

    progress[String(id)] = 'done'
    saveProgress(progress)
    console.log(`id=${id}: done, checkpoint saved`)
  }

  // Final self-verification across all 5 ids.
  console.log('\nRunning final self-verification (em dash / voceo / structure)...')
  let anyFail = false
  for (const id of IDS) {
    const doc = await payload.findByID({ collection: 'posts', id, locale: 'all', depth: 0 })
    const content = doc.content as unknown as Record<Locale, LexNode>

    const esText = flatten(content.es.root as unknown as LexNode)
    if (esText.includes(EM_DASH)) {
      anyFail = true
      console.error(`id=${id} es: FAIL — em dash found`)
    }
    for (const marker of VOCEO_MARKERS) {
      if (marker.test(esText)) {
        anyFail = true
        console.error(`id=${id} es: FAIL — voceo marker ${marker} found`)
      }
    }
    const enText = flatten(content.en.root as unknown as LexNode)
    if (enText.includes(EM_DASH)) {
      anyFail = true
      console.error(`id=${id} en: FAIL — em dash found`)
    }
  }

  if (anyFail) {
    console.error('\nRESULT: FAIL — see failures above')
    process.exit(1)
  }

  const doneCount = IDS.filter((id) => progress[String(id)] === 'done').length
  console.log(`\nRESULT: PASS — ${doneCount}/${IDS.length} posts done, zero em-dash/voceo findings`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
