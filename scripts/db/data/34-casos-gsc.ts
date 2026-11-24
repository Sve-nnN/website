/**
 * Cuatro casos nuevos con captura de Search Console (feat/home-casos-gsc).
 *
 * Fuente de las cifras: Search Console (cuenta con acceso a cada propiedad),
 * 2024-11-24..2025-11-23 contra 2025-11-24..2026-11-22. Los clics son la suma
 * de escritorio, móvil y tableta. Las cifras de páginas y consultas salen de la
 * comparación de periodos por página, consulta y país.
 *
 * Los textos describen lo que muestran los datos y la estrategia que reflejan.
 * Ninguna fila afirma un trabajo concreto de Juan sin que los datos lo sostengan;
 * las filas de `services` y de "solution" están listadas en el reporte para que
 * Juan las confirme.
 *
 * El caso del software administrativo de Venezuela va SIN nombre ni dominio en
 * ningún texto, alt, archivo ni slug (decisión de Juan, 2026-11-24).
 */

export type Loc = { es: string; en: string }

export type CaseSeed = {
  key: string
  slug: string
  /** id de la colección `clientes`, o null. */
  clientId: number | null
  title: Loc
  heroMetric: Loc
  heroSubtitle: Loc
  sector: Loc
  period: Loc
  services: Loc[]
  kpis: { value: string; label: Loc }[]
  clientContext: Loc
  challenge: Loc[]
  solution: { title: Loc; description: Loc }[]
  periodBefore: string
  periodAfter: string
  metrics: { before: string; after: string; label: Loc }[]
  lessons: { title: Loc; body: Loc }[]
  conclusion: Loc
  /** Captura recortada (research/gsc-capturas) y nombre limpio con el que se sube. */
  image: { source: string; uploadName: string; alt: Loc }
}

const PERIOD_BEFORE = 'Nov 2024 a Nov 2025'
const PERIOD_AFTER = 'Nov 2025 a Nov 2026'

export const CASES: CaseSeed[] = [
  // ------------------------------------------------------------------ Vitawallet
  {
    key: 'vitawallet',
    slug: 'vitawallet-seo-programatico-latinoamerica',
    clientId: null,
    title: {
      es: 'Cómo Vitawallet duplicó sus clics orgánicos en ocho mercados de Latinoamérica',
      en: 'How Vitawallet doubled its organic clicks across eight Latin American markets',
    },
    heroMetric: { es: '+107% clics interanuales', en: '+107% YoY clicks' },
    heroSubtitle: {
      es: 'Una fintech de envíos y pagos internacionales pasó de 85,000 a 176,000 clics orgánicos en doce meses',
      en: 'A cross-border payments fintech grew from 85,000 to 176,000 organic clicks in twelve months',
    },
    sector: { es: 'Fintech, envíos y pagos internacionales', en: 'Fintech, cross-border payments' },
    period: { es: 'Nov 2025 a Nov 2026', en: 'Nov 2025 to Nov 2026' },
    services: [
      { es: 'SEO programático', en: 'Programmatic SEO' },
      { es: 'SEO internacional', en: 'International SEO' },
    ],
    kpis: [
      { value: '+107%', label: { es: 'Crecimiento interanual de clics', en: 'YoY clicks growth' } },
      { value: '+433%', label: { es: 'Crecimiento interanual de impresiones', en: 'YoY impressions growth' } },
      { value: '175,844', label: { es: 'Clics orgánicos (12 meses)', en: 'Organic clicks (12 months)' } },
      { value: '8.6', label: { es: 'Posición media (antes 11.3)', en: 'Average position (was 11.3)' } },
    ],
    clientContext: {
      es: 'Vitawallet es una fintech que mueve dinero entre países, convierte divisas y permite cobrar en dólares. Su sitio recibe búsquedas de ocho mercados a la vez: Venezuela, Chile, Colombia, Argentina, México, España, Bolivia y Perú.',
      en: 'Vitawallet is a fintech that moves money between countries, converts currencies and lets people get paid in dollars. Its site gets searches from eight markets at once: Venezuela, Chile, Colombia, Argentina, Mexico, Spain, Bolivia and Peru.',
    },
    challenge: [
      {
        es: 'El sitio ya sumaba unos 85,000 clics al año, pero cerca de 3 de cada 10 llegaban por búsquedas del nombre de la marca.',
        en: 'The site already earned about 85,000 clicks a year, but close to 3 in 10 came from searches for the brand name.',
      },
      {
        es: 'La demanda real está en preguntas muy concretas: cuánto vale una divisa frente a otra, qué es un código SWIFT en cada país, cómo enviar dinero de un país a otro por Yape. Cada pregunta pide su propia página.',
        en: 'Real demand sits in very specific questions: what one currency is worth against another, what a SWIFT code is in each country, how to send money from one country to another through Yape. Each question needs its own page.',
      },
      {
        es: 'Las impresiones crecieron mucho más rápido que los clics, de 13.4 M a 71.4 M, y el CTR medio bajó de 0.6% a 0.2%. Había que convertir esa visibilidad en visitas.',
        en: 'Impressions grew far faster than clicks, from 13.4M to 71.4M, and average CTR fell from 0.6% to 0.2%. That visibility had to turn into visits.',
      },
    ],
    solution: [
      {
        title: { es: 'Una página por par de divisas', en: 'One page per currency pair' },
        description: {
          es: 'Los datos muestran una familia de páginas de conversor por par y por monto. La de bolívares a pesos colombianos por 5,000 pasó de 6 a 1,985 clics, y la de pesos colombianos a bolívares por 1 pasó de 10 a 1,639.',
          en: 'The data shows a family of converter pages by pair and amount. The page for bolivars to Colombian pesos at 5,000 went from 6 to 1,985 clicks, and the one for Colombian pesos to bolivars at 1 went from 10 to 1,639.',
        },
      },
      {
        title: { es: 'Una página por corredor de envío', en: 'One page per sending corridor' },
        description: {
          es: 'Las páginas de transferencias a Perú por país de origen y por medio de pago crecen entre 93% y 230%. Enviar de Colombia a Yape pasó de 898 a 2,964 clics y subió de la posición 8.4 a la 4.8.',
          en: 'The pages for transfers to Peru by country of origin and payment method grow between 93% and 230%. Sending from Colombia to Yape went from 898 to 2,964 clicks and moved from position 8.4 to 4.8.',
        },
      },
      {
        title: { es: 'Páginas de referencia por país', en: 'Reference pages by country' },
        description: {
          es: 'Los códigos SWIFT por país siguen la misma lógica: la página de Venezuela pasó de 1,115 a 2,560 clics. Las preguntas frecuentes sobre retiros de dinero crecieron 266%.',
          en: 'SWIFT codes by country follow the same logic: the Venezuela page went from 1,115 to 2,560 clicks. The withdrawals FAQ grew 266%.',
        },
      },
    ],
    periodBefore: PERIOD_BEFORE,
    periodAfter: PERIOD_AFTER,
    metrics: [
      { before: '85,065', after: '175,844', label: { es: 'Clics orgánicos anuales', en: 'Annual organic clicks' } },
      { before: '13.4M', after: '71.4M', label: { es: 'Impresiones orgánicas anuales', en: 'Annual organic impressions' } },
      { before: '11.3', after: '8.6', label: { es: 'Posición media', en: 'Average position' } },
      { before: '24,654', after: '60,335', label: { es: 'Clics de la home', en: 'Home page clicks' } },
    ],
    lessons: [
      {
        title: { es: 'Una pregunta concreta, una página', en: 'One specific question, one page' },
        body: {
          es: 'Las páginas que más suben responden una sola pregunta, como convertir 5,000 bolívares a pesos o enviar dinero de Colombia a Yape. Una página pasó de 6 a 1,985 clics siendo la respuesta exacta.',
          en: 'The pages that grow most answer a single question, like converting 5,000 bolivars to pesos or sending money from Colombia to Yape. One page went from 6 to 1,985 clicks by being the exact answer.',
        },
      },
      {
        title: { es: 'Crecer en varios países reparte el riesgo', en: 'Growing in several countries spreads the risk' },
        body: {
          es: 'Los ocho mercados principales crecieron entre 48% y 141%. Ningún país carga con el resultado, y por eso la caída de una página, como la de Ecuador en SWIFT, apenas se nota en el total.',
          en: 'The eight main markets grew between 48% and 141%. No single country carries the result, which is why the drop of one page, like the Ecuador SWIFT page, barely shows in the total.',
        },
      },
    ],
    conclusion: {
      es: 'No todo creció. El artículo sobre cobrar en dólares como streamer bajó 63% y la página SWIFT de Ecuador bajó 60%. Cerca de 3 de cada 10 clics siguen llegando por la marca. Lo que sostiene el resultado es la combinación de páginas con una intención muy concreta y la presencia en varios países a la vez.',
      en: 'Not everything grew. The article on getting paid in dollars as a streamer fell 63% and the Ecuador SWIFT page fell 60%. Close to 3 in 10 clicks still come from the brand. What holds the result together is the mix of pages with a very specific intent and presence in several countries at once.',
    },
    image: {
      source: 'research/gsc-capturas/gsc-vitawallet.io-2025-11-24_2026-11-22.jpg',
      uploadName: 'gsc-vitawallet-clics-12-meses.jpg',
      alt: {
        es: 'Gráfico de Search Console de Vitawallet que compara los últimos doce meses con los doce anteriores: 176 mil clics frente a 85 mil y 71.4 millones de impresiones frente a 13.4 millones',
        en: 'Search Console chart for Vitawallet comparing the last twelve months with the previous twelve: 176 thousand clicks against 85 thousand and 71.4 million impressions against 13.4 million',
      },
    },
  },

  // ------------------------------------------------------------------ Delta Cloudz
  {
    key: 'deltacloudz',
    slug: 'deltacloudz-ecommerce-guias-de-uso-estados-unidos',
    clientId: 19,
    title: {
      es: 'Guías de uso que llevaron a una tienda en línea de vapeo de 61 mil a 104 mil clics',
      en: 'Usage guides that took a vape online store from 61 thousand to 104 thousand clicks',
    },
    heroMetric: { es: '+70% clics interanuales', en: '+70% YoY clicks' },
    heroSubtitle: {
      es: 'Una tienda en línea de vapeo desechable creció de 61,000 a 104,000 clics orgánicos en doce meses, casi todos desde Estados Unidos',
      en: 'An online disposable vape store grew from 61,000 to 104,000 organic clicks in twelve months, almost all from the United States',
    },
    sector: { es: 'E-commerce, vapeo en Estados Unidos', en: 'E-commerce, vaping in the United States' },
    period: { es: 'Nov 2025 a Nov 2026', en: 'Nov 2025 to Nov 2026' },
    services: [
      { es: 'Estrategia de contenido', en: 'Content strategy' },
      { es: 'SEO para e-commerce', en: 'E-commerce SEO' },
    ],
    kpis: [
      { value: '+70%', label: { es: 'Crecimiento interanual de clics', en: 'YoY clicks growth' } },
      { value: '+137%', label: { es: 'Crecimiento interanual de impresiones', en: 'YoY impressions growth' } },
      { value: '103,793', label: { es: 'Clics orgánicos (12 meses)', en: 'Organic clicks (12 months)' } },
      { value: '12.8', label: { es: 'Posición media (antes 15.7)', en: 'Average position (was 15.7)' } },
    ],
    clientContext: {
      es: 'Delta Cloudz es una tienda en línea que vende vapeo desechable de varias marcas. Cerca de 94% de sus clics llegan desde Estados Unidos.',
      en: 'Delta Cloudz is an online store that sells disposable vapes from several brands. About 94% of its clicks come from the United States.',
    },
    challenge: [
      {
        es: 'Una tienda que revende marcas ajenas compite contra esas mismas marcas y contra grandes distribuidores. Las páginas de colección y de producto, por sí solas, no cubren lo que la gente busca después de comprar.',
        en: 'A store that resells other brands competes against those same brands and against large distributors. Collection and product pages alone do not cover what people search for after buying.',
      },
      {
        es: 'Las colecciones más fuertes del año anterior perdieron terreno: la de una marca bajó 69% en clics y un artículo de comparación de potencia cayó 88%, de la posición 11.7 a la 33.2.',
        en: 'The strongest collections of the previous year lost ground: one brand collection fell 69% in clicks and a strength comparison article fell 88%, from position 11.7 to 33.2.',
      },
      {
        es: 'El nombre de la tienda aporta poco, unos 2,600 clics al año, 2.5% del total. El crecimiento tenía que venir de búsquedas sin marca.',
        en: 'The store name adds little, about 2,600 clicks a year, 2.5% of the total. Growth had to come from non-brand searches.',
      },
    ],
    solution: [
      {
        title: { es: 'Guías de uso por marca y modelo', en: 'Usage guides by brand and model' },
        description: {
          es: 'Las páginas que más suben son artículos del tipo cómo usar, qué hacer si no carga y cómo distinguir la versión original. Una sola guía pasó de 0 a 12,465 clics y otras cinco suman más de 11,000.',
          en: 'The pages that grow most are articles like how to use it, what to do if it does not charge and how to spot the original version. One guide alone went from 0 to 12,465 clicks and five more add up to over 11,000.',
        },
      },
      {
        title: { es: 'Consultas de intención muy concreta', en: 'Queries with very specific intent' },
        description: {
          es: 'Búsquedas como las instrucciones de un modelo o cómo usarlo en su versión 5 traen un CTR de 15% a 39% con posiciones entre 1.8 y 3.1.',
          en: 'Searches like the instructions for a model or how to use its version 5 bring a CTR of 15% to 39% with positions between 1.8 and 3.1.',
        },
      },
      {
        title: { es: 'Portada y fichas de producto', en: 'Home page and product pages' },
        description: {
          es: 'La home duplicó sus clics, de 1,511 a 3,245 (+115%), y una ficha de producto nueva llegó a 1,287 clics con un CTR de 9%.',
          en: 'The home page doubled its clicks, from 1,511 to 3,245 (+115%), and a new product page reached 1,287 clicks with a 9% CTR.',
        },
      },
    ],
    periodBefore: PERIOD_BEFORE,
    periodAfter: PERIOD_AFTER,
    metrics: [
      { before: '61,126', after: '103,793', label: { es: 'Clics orgánicos anuales', en: 'Annual organic clicks' } },
      { before: '2.59M', after: '6.14M', label: { es: 'Impresiones orgánicas anuales', en: 'Annual organic impressions' } },
      { before: '15.7', after: '12.8', label: { es: 'Posición media', en: 'Average position' } },
      { before: '0', after: '12,465', label: { es: 'Clics de la guía que más creció', en: 'Clicks of the fastest growing guide' } },
    ],
    lessons: [
      {
        title: { es: 'Lo que la gente busca después de comprar también es tráfico', en: 'What people search for after buying is traffic too' },
        body: {
          es: 'Las guías de uso responden dudas de quien ya tiene el producto o está por comprarlo. Seis guías que no existían el año anterior suman más de 23,000 clics.',
          en: 'Usage guides answer questions from people who already own the product or are about to buy it. Six guides that did not exist the year before add up to over 23,000 clicks.',
        },
      },
      {
        title: { es: 'Concentrar el tráfico en una página tiene un costo', en: 'Concentrating traffic on one page has a cost' },
        body: {
          es: 'Una sola guía aporta 12% de los clics del año. Si pierde posición, el total lo nota, por eso conviene repetir la fórmula en más marcas y proteger las colecciones que ya venden.',
          en: 'A single guide brings 12% of the year\'s clicks. If it loses position, the total feels it, which is why it pays to repeat the formula across more brands and protect the collections that already sell.',
        },
      },
    ],
    conclusion: {
      es: 'El crecimiento se apoya en pocas páginas y no es parejo: las guías suben mucho y dos páginas comerciales retrocedieron. Aun así, con la marca aportando solo 2.5% de los clics, el aumento viene de búsquedas sin marca. La siguiente tarea está clara: repetir la fórmula de las guías en más marcas y recuperar las colecciones que perdieron posición.',
      en: 'Growth rests on a few pages and is uneven: the guides climb a lot and two commercial pages fell back. Even so, with the brand adding only 2.5% of clicks, the increase comes from non-brand search. The next task is clear: repeat the guide formula across more brands and recover the collections that lost position.',
    },
    image: {
      source: 'research/gsc-capturas/gsc-deltacloudz.com-2025-11-24_2026-11-22.jpg',
      uploadName: 'gsc-deltacloudz-clics-12-meses.jpg',
      alt: {
        es: 'Gráfico de Search Console de Delta Cloudz que compara los últimos doce meses con los doce anteriores: 104 mil clics frente a 61 mil y 6.14 millones de impresiones frente a 2.59 millones',
        en: 'Search Console chart for Delta Cloudz comparing the last twelve months with the previous twelve: 104 thousand clicks against 61 thousand and 6.14 million impressions against 2.59 million',
      },
    },
  },

  // ------------------------------------------------------------------ Phixser
  {
    key: 'phixser',
    slug: 'phixser-seo-local-servicios-del-hogar-florida',
    clientId: null,
    title: {
      es: 'SEO local para una empresa de servicios del hogar en Florida que multiplicó por cuatro sus clics',
      en: 'Local SEO for a Florida home services company that quadrupled its clicks',
    },
    heroMetric: { es: '+339% clics interanuales', en: '+339% YoY clicks' },
    heroSubtitle: {
      es: 'Una empresa de servicios del hogar multiplicó por más de cuatro sus clics orgánicos y subió de la posición 54 a la 21',
      en: 'A home services company grew its organic clicks more than fourfold and moved from position 54 to 21',
    },
    sector: { es: 'Servicios del hogar, Florida', en: 'Home services, Florida' },
    period: { es: 'Nov 2025 a Nov 2026', en: 'Nov 2025 to Nov 2026' },
    services: [
      { es: 'SEO local', en: 'Local SEO' },
      { es: 'Google Business Profile', en: 'Google Business Profile' },
    ],
    kpis: [
      { value: '+339%', label: { es: 'Crecimiento interanual de clics', en: 'YoY clicks growth' } },
      { value: '+948%', label: { es: 'Crecimiento interanual de impresiones', en: 'YoY impressions growth' } },
      { value: '1,728', label: { es: 'Clics orgánicos (12 meses)', en: 'Organic clicks (12 months)' } },
      { value: '20.9', label: { es: 'Posición media (antes 53.9)', en: 'Average position (was 53.9)' } },
    ],
    clientContext: {
      es: 'Phixser Solutions ofrece servicios del hogar, como electricidad, aire acondicionado y plomería, en ciudades de Florida y de Carolina del Norte. El sitio es pequeño y 87% de sus clics vienen de Estados Unidos.',
      en: 'Phixser Solutions offers home services, such as electrical work, air conditioning and plumbing, in cities across Florida and North Carolina. The site is small and 87% of its clicks come from the United States.',
    },
    challenge: [
      {
        es: 'El sitio partía de una base baja: 394 clics en el año y una posición media de 53.9, es decir, en la sexta página de resultados. Casi no tenía presencia en búsquedas de servicio.',
        en: 'The site started from a low base: 394 clicks in the year and an average position of 53.9, which means page six of the results. It had almost no presence in service searches.',
      },
      {
        es: 'Un negocio local compite por ciudad y por servicio a la vez. Sin una página para cada combinación, Google no tiene qué mostrar cuando alguien busca una reparación cerca.',
        en: 'A local business competes by city and by service at once. Without a page for each combination, Google has nothing to show when someone searches for a repair nearby.',
      },
      {
        es: 'Cerca de 43% de los clics venía de buscar el nombre de la empresa, no de clientes nuevos.',
        en: 'About 43% of clicks came from people searching for the company name, not from new customers.',
      },
    ],
    solution: [
      {
        title: { es: 'Páginas por ciudad y por servicio', en: 'Pages by city and by service' },
        description: {
          es: 'Aparecen páginas nuevas para Miami Gardens, Tampa, Orlando, Raleigh y Carolina del Norte. Cada una nace de cero y suma entre 763 y 3,540 impresiones.',
          en: 'New pages appear for Miami Gardens, Tampa, Orlando, Raleigh and North Carolina. Each one starts from zero and earns between 763 and 3,540 impressions.',
        },
      },
      {
        title: { es: 'La ficha de Google Business Profile', en: 'The Google Business Profile listing' },
        description: {
          es: 'Las visitas que llegan desde la ficha, marcadas con parámetros de campaña, pasaron de 129 a 476 clics (+269%) y de 5,561 a 67,267 impresiones.',
          en: 'Visits arriving from the listing, tagged with campaign parameters, went from 129 to 476 clicks (+269%) and from 5,561 to 67,267 impressions.',
        },
      },
      {
        title: { es: 'Reseñas y áreas de servicio', en: 'Reviews and service areas' },
        description: {
          es: 'Las páginas de reseñas y de áreas de servicio suben: reseñas pasó de 6 a 28 clics y áreas de servicio de 10 a 32.',
          en: 'The reviews and service area pages climb: reviews went from 6 to 28 clicks and service areas from 10 to 32.',
        },
      },
    ],
    periodBefore: PERIOD_BEFORE,
    periodAfter: PERIOD_AFTER,
    metrics: [
      { before: '394', after: '1,728', label: { es: 'Clics orgánicos anuales', en: 'Annual organic clicks' } },
      { before: '83.6K', after: '876K', label: { es: 'Impresiones orgánicas anuales', en: 'Annual organic impressions' } },
      { before: '53.9', after: '20.9', label: { es: 'Posición media', en: 'Average position' } },
      { before: '129', after: '476', label: { es: 'Clics desde la ficha de Google Business Profile', en: 'Clicks from the Google Business Profile listing' } },
    ],
    lessons: [
      {
        title: { es: 'En local, la ficha de Google pesa tanto como el sitio', en: 'In local search, the Google listing weighs as much as the site' },
        body: {
          es: 'Los clics que llegan desde la ficha y la home suman 62% del total. Una ficha completa y reseñas visibles trabajan junto con las páginas por ciudad.',
          en: 'Clicks arriving from the listing and the home page add up to 62% of the total. A complete listing and visible reviews work together with the city pages.',
        },
      },
      {
        title: { es: 'Una página nueva tarda en convertir impresiones en clics', en: 'A new page takes time to turn impressions into clicks' },
        body: {
          es: 'Las páginas por ciudad ya acumulan entre 763 y 3,540 impresiones, pero cada una trae de 13 a 26 clics. Subir de posición en esas búsquedas es el trabajo que sigue.',
          en: 'The city pages already earn between 763 and 3,540 impressions, but each brings 13 to 26 clicks. Moving up in those searches is the work that comes next.',
        },
      },
    ],
    conclusion: {
      es: 'Es un volumen pequeño y conviene decirlo: el caso muestra el arranque de un sitio local, no uno maduro. Las búsquedas de servicio por ciudad, como reparación de aire acondicionado, todavía aportan pocos clics, con posiciones entre 17 y 46. Lo que sí queda claro es la dirección: más páginas por ciudad y por servicio, y una ficha de Google que ya trae casi cuatro veces las visitas de hace un año.',
      en: 'The volume is small and that is worth saying: this case shows the start of a local site, not a mature one. Service searches by city, like air conditioning repair, still bring few clicks, with positions between 17 and 46. What is clear is the direction: more pages by city and by service, and a Google listing that already brings almost four times the visits of a year ago.',
    },
    image: {
      source: 'research/gsc-capturas/gsc-phixser.com-2025-11-24_2026-11-22.jpg',
      uploadName: 'gsc-phixser-clics-12-meses.jpg',
      alt: {
        es: 'Gráfico de Search Console de Phixser que compara los últimos doce meses con los doce anteriores: 1,730 clics frente a 394 y 876 mil impresiones frente a 83.6 mil',
        en: 'Search Console chart for Phixser comparing the last twelve months with the previous twelve: 1,730 clicks against 394 and 876 thousand impressions against 83.6 thousand',
      },
    },
  },

  // ------------------------------------------------------------------ Software administrativo (anónimo)
  {
    key: 'software-venezuela',
    slug: 'software-administrativo-venezuela-demanda-de-marca',
    clientId: null,
    title: {
      es: 'Software administrativo en Venezuela: la demanda de marca multiplicó por diez los clics',
      en: 'Business software in Venezuela: brand demand multiplied clicks tenfold',
    },
    heroMetric: { es: '+958% clics interanuales', en: '+958% YoY clicks' },
    heroSubtitle: {
      es: 'Una empresa de software administrativo pasó de 20,000 a 215,000 clics orgánicos en doce meses, sobre todo por búsquedas de su propia marca',
      en: 'A business software company went from 20,000 to 215,000 organic clicks in twelve months, mostly from searches for its own brand',
    },
    sector: { es: 'Software administrativo (SaaS), Venezuela', en: 'Business software (SaaS), Venezuela' },
    period: { es: 'Nov 2025 a Nov 2026', en: 'Nov 2025 to Nov 2026' },
    services: [
      { es: 'Analítica de búsqueda', en: 'Search analytics' },
      { es: 'SEO de producto', en: 'Product SEO' },
    ],
    kpis: [
      { value: '+958%', label: { es: 'Crecimiento interanual de clics', en: 'YoY clicks growth' } },
      { value: '+679%', label: { es: 'Crecimiento interanual de impresiones', en: 'YoY impressions growth' } },
      { value: '215,398', label: { es: 'Clics orgánicos (12 meses)', en: 'Organic clicks (12 months)' } },
      { value: '3.8', label: { es: 'Posición media (antes 6.6)', en: 'Average position (was 6.6)' } },
    ],
    clientContext: {
      es: 'Es una empresa venezolana de software administrativo y punto de venta para comercios, restaurantes y pymes. Cerca de 96% de sus clics vienen de Venezuela. El cliente prefiere no figurar con su nombre.',
      en: 'This is a Venezuelan company that sells business management and point of sale software to shops, restaurants and small businesses. About 96% of its clicks come from Venezuela. The client prefers not to be named.',
    },
    challenge: [
      {
        es: 'Cuando una empresa de software se hace conocida, el tráfico crece aunque el SEO no cambie: más gente la busca por su nombre. Aquí conviene separar las dos cosas con honestidad.',
        en: 'When a software company becomes well known, traffic grows even if SEO does not change: more people search for it by name. Here it pays to separate the two things honestly.',
      },
      {
        es: 'El 94% de los clics (203,387) cae en la home, y más de 80% de todos los clics viene de búsquedas de la marca o de inicio de sesión. Eso no es posicionamiento de contenido.',
        en: '94% of clicks (203,387) land on the home page, and more than 80% of all clicks come from brand or login searches. That is not content ranking.',
      },
      {
        es: 'Debajo de esa capa hay un trabajo sin marca que aún rinde poco: funcionalidades, tutoriales y software para comercios están en las posiciones 1.2 a 1.7 con 125,000 a 181,000 impresiones cada una y solo 200 a 700 clics.',
        en: 'Beneath that layer sits non-brand work that still pays little: features, tutorials and software for shops sit at positions 1.2 to 1.7 with 125,000 to 181,000 impressions each and only 200 to 700 clicks.',
      },
    ],
    solution: [
      {
        title: { es: 'Qué impulsó el salto: la marca', en: 'What drove the jump: the brand' },
        description: {
          es: 'Las búsquedas por el nombre de la empresa y por iniciar sesión pasaron de unos 15,000 a unos 179,000 clics. Es demanda de marca, y no se presenta como una mejora de SEO de contenido.',
          en: 'Searches for the company name and for logging in went from about 15,000 to about 179,000 clicks. That is brand demand, and it is not presented as a content SEO gain.',
        },
      },
      {
        title: { es: 'Producto y blog en primeras posiciones', en: 'Product and blog in top positions' },
        description: {
          es: 'Las páginas de funcionalidades, software para comercios y tutoriales, y artículos como cómo calcular el precio de venta o sistema en la nube frente a escritorio, rankean entre las posiciones 1.2 y 7.3.',
          en: 'The features, software for shops and tutorials pages, and articles like how to calculate a sale price or cloud versus desktop systems, rank between positions 1.2 and 7.3.',
        },
      },
      {
        title: { es: 'Páginas por tipo de negocio', en: 'Pages by type of business' },
        description: {
          es: 'Existen páginas para restaurantes y para pymes, con posiciones entre 1.4 y 3.6. Todavía convierten pocas impresiones en clics.',
          en: 'There are pages for restaurants and for small businesses, with positions between 1.4 and 3.6. They still turn few impressions into clicks.',
        },
      },
    ],
    periodBefore: PERIOD_BEFORE,
    periodAfter: PERIOD_AFTER,
    metrics: [
      { before: '20,363', after: '215,398', label: { es: 'Clics orgánicos anuales', en: 'Annual organic clicks' } },
      { before: '87.3K', after: '680K', label: { es: 'Impresiones orgánicas anuales', en: 'Annual organic impressions' } },
      { before: '6.6', after: '3.8', label: { es: 'Posición media', en: 'Average position' } },
      { before: '16,013', after: '203,387', label: { es: 'Clics de la home', en: 'Home page clicks' } },
    ],
    lessons: [
      {
        title: { es: 'Medir la marca por separado cambia la conversación', en: 'Measuring the brand separately changes the conversation' },
        body: {
          es: 'Sin separar las búsquedas de marca, el +958% parece una victoria de SEO. Separadas, muestran que el aumento viene de gente que ya conocía la marca.',
          en: 'Without splitting out brand searches, the +958% looks like an SEO win. Split out, they show that the increase comes from people who already knew the brand.',
        },
      },
      {
        title: { es: 'Estar primero y no recibir el clic es la oportunidad', en: 'Ranking first and not getting the click is the opportunity' },
        body: {
          es: 'Las páginas de producto aparecen en las posiciones 1.2 a 1.7 con cientos de miles de impresiones, y ahí está el crecimiento sin marca que aún falta capturar.',
          en: 'The product pages appear at positions 1.2 to 1.7 with hundreds of thousands of impressions, and that is the non-brand growth still left to capture.',
        },
      },
    ],
    conclusion: {
      es: 'Para un cliente así, el SEO protege la marca y abre lo que viene después. La parte que se puede atribuir al contenido es pequeña hoy, y por eso es la que más margen tiene: las páginas de producto y el blog ya están arriba, y el trabajo pendiente es lograr que esas impresiones se conviertan en visitas.',
      en: 'For a client like this, SEO protects the brand and opens what comes next. The part attributable to content is small today, which is why it has the most room: product pages and the blog are already near the top, and the pending work is turning those impressions into visits.',
    },
    image: {
      source: 'research/gsc-capturas/gsc-cliente-anonimo-2025-11-24_2026-11-22.jpg',
      uploadName: 'gsc-software-administrativo-venezuela-clics-12-meses.jpg',
      alt: {
        es: 'Gráfico de Search Console de una empresa de software administrativo que compara los últimos doce meses con los doce anteriores: 215 mil clics frente a 20 mil y 680 mil impresiones frente a 87 mil',
        en: 'Search Console chart for a business software company comparing the last twelve months with the previous twelve: 215 thousand clicks against 20 thousand and 680 thousand impressions against 87 thousand',
      },
    },
  },
]
