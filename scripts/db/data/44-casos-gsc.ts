/**
 * Textos y cifras corregidos de los casos 21 a 24 (aprobados por Juan el 2026-11-24).
 *
 * Fuente: Search Console, solo lectura. Periodos equivalentes de 134 días con los mismos
 * días de la semana: 2025-07-13 a 2025-11-23 contra 2026-07-12 a 2026-11-22. El primer día
 * con datos disponible el 2026-11-24 era el 2025-07-13 (retención de 16 meses).
 *
 * Las etiquetas de la fila de clics NO empiezan por "Clics orgánicos anuales" a propósito:
 * así estos casos quedan fuera de la tabla comparativa (`buildCaseComparison`), que mezclaba
 * periodos de distinta duración.
 *
 * El caso 24 no lleva nombre ni dominio del cliente.
 */
export type L = { es: string; en: string }

export type CaseFix = {
  id: number
  slug: string
  title: L
  heroMetric: L
  heroSubtitle: L
  sector: L
  kpis: { value: string; label: L }[]
  clientContext: L
  challenge: L[]
  lessons: { title: L; body: L }[]
  metrics: { before: string; after: string; label: L }[]
  conclusion: L
  metaDescription: L
}

export const PERIOD = '2026-07-12 / 2026-11-22'
export const PERIOD_BEFORE = '2025-07-13 / 2025-11-23'
export const PERIOD_AFTER = PERIOD

export const SERVICES: L[] = [
  { es: 'Optimización SEO', en: 'SEO optimization' },
  { es: 'Estrategia', en: 'Strategy' },
]

export const SOLUTION: { title: L; description: L } = {
  title: { es: 'Optimizaciones SEO y de estrategia', en: 'SEO and strategy work' },
  description: {
    es: 'Hice optimizaciones SEO y de estrategia para este sitio. Las cifras describen lo que cambió en Search Console y no demuestran que cada cambio venga de ese trabajo.',
    en: 'I carried out SEO and strategy work for this site. The figures describe what changed in Search Console and do not prove that each change came from that work.',
  },
}

const CLICKS: L = { es: 'Clics orgánicos en 134 días', en: 'Organic clicks over 134 days' }
const IMPRESSIONS: L = { es: 'Impresiones en 134 días', en: 'Impressions over 134 days' }
const POSITION: L = { es: 'Posición media', en: 'Average position' }

export const CASES: CaseFix[] = [
  // ------------------------------------------------------------------ Phixser
  {
    id: 23,
    slug: 'phixser-seo-local-servicios-del-hogar-florida',
    title: {
      es: 'Phixser pasó de 392 a 926 clics orgánicos',
      en: 'Phixser grew from 392 to 926 organic clicks',
    },
    heroMetric: {
      es: '+136% clics frente a las mismas fechas de 2025',
      en: '+136% clicks against the same dates in 2025',
    },
    heroSubtitle: {
      es: 'Del 12 de julio al 22 de noviembre de 2026 el sitio sumó 926 clics frente a 392 un año antes. El volumen sigue siendo pequeño.',
      en: 'From July 12 to November 22, 2026, the site earned 926 clicks against 392 a year earlier. Volume remains small.',
    },
    sector: { es: 'Servicios del hogar, Florida', en: 'Home services, Florida' },
    kpis: [
      { value: '+136%', label: { es: 'Clics frente a las mismas fechas', en: 'Clicks against the same dates' } },
      { value: '926', label: { es: 'Clics orgánicos', en: 'Organic clicks' } },
      { value: '679,895', label: IMPRESSIONS },
      { value: '19.3', label: { es: 'Posición media (antes 53.8)', en: 'Average position (was 53.8)' } },
    ],
    clientContext: {
      es: 'Phixser Solutions ofrece servicios del hogar en Florida y Carolina del Norte.',
      en: 'Phixser Solutions offers home services in Florida and North Carolina.',
    },
    challenge: [
      {
        es: 'Entre el 13 de julio y el 23 de noviembre de 2025 el sitio sumó 392 clics, con una posición media de 53.8.',
        en: 'Between July 13 and November 23, 2025, the site earned 392 clicks at an average position of 53.8.',
      },
      {
        es: 'Casi la mitad de esos clics, 191, venía de búsquedas con el nombre de la empresa. Las consultas visibles sin el nombre aportaban 7.',
        en: 'Almost half of those clicks, 191, came from searches with the company name. Visible queries without the name brought 7.',
      },
    ],
    metrics: [
      { before: '392', after: '926', label: CLICKS },
      { before: '82,531', after: '679,895', label: IMPRESSIONS },
      { before: '53.8', after: '19.3', label: POSITION },
      { before: '129', after: '213', label: { es: 'Clics desde el enlace de la ficha de Google', en: 'Clicks from the Google listing link' } },
    ],
    lessons: [
      {
        title: { es: 'Más impresiones no significan más clics en la misma medida', en: 'More impressions do not mean clicks in the same measure' },
        body: {
          es: 'Las impresiones crecieron mucho más que los clics y el CTR bajó de 0.47% a 0.14%.',
          en: 'Impressions grew far more than clicks, and CTR fell from 0.47% to 0.14%.',
        },
      },
    ],
    conclusion: {
      es: 'Páginas por ciudad que un año antes no recibían clics, como las de Raleigh y Carolina del Norte, ya los reciben, y el enlace de la ficha de Google subió de 129 a 213 clics. El volumen sigue siendo pequeño: las consultas visibles sin el nombre de la empresa aportan 45 clics.',
      en: 'City pages that earned no clicks a year earlier, such as the Raleigh and North Carolina ones, now earn them, and the Google listing link rose from 129 to 213 clicks. Volume remains small: visible queries without the company name bring 45 clicks.',
    },
    metaDescription: {
      es: 'Phixser pasó de 392 a 926 clics orgánicos en 134 días comparables de 2026 frente a 2025, con datos de Search Console.',
      en: 'Phixser grew from 392 to 926 organic clicks over 134 comparable days in 2026 against 2025, based on Search Console data.',
    },
  },

  // ------------------------------------------------------------------ Vitawallet
  {
    id: 21,
    slug: 'vitawallet-seo-programatico-latinoamerica',
    title: {
      es: 'Vitawallet ganó impresiones y posición mientras perdió clics',
      en: 'Vitawallet gained impressions and ranking while losing clicks',
    },
    heroMetric: {
      es: '-52% clics frente a las mismas fechas de 2025',
      en: '-52% clicks against the same dates in 2025',
    },
    heroSubtitle: {
      es: 'Del 12 de julio al 22 de noviembre de 2026 los clics bajaron de 84,660 a 40,539 frente a las mismas fechas de 2025.',
      en: 'From July 12 to November 22, 2026, clicks fell from 84,660 to 40,539 against the same dates in 2025.',
    },
    sector: { es: 'Fintech, envíos y cambio de divisas', en: 'Fintech, money transfers and currency exchange' },
    kpis: [
      { value: '-52%', label: { es: 'Clics frente a las mismas fechas', en: 'Clicks against the same dates' } },
      { value: '40,539', label: { es: 'Clics orgánicos', en: 'Organic clicks' } },
      { value: '+72%', label: { es: 'Impresiones', en: 'Impressions' } },
      { value: '9.0', label: { es: 'Posición media (antes 11.2)', en: 'Average position (was 11.2)' } },
    ],
    clientContext: {
      es: 'Vitawallet es una fintech de envíos de dinero y cambio de divisas.',
      en: 'Vitawallet is a money transfer and currency exchange fintech.',
    },
    challenge: [
      {
        es: 'Entre el 13 de julio y el 23 de noviembre de 2025 el sitio sumó 84,660 clics. La portada aportaba 24,561.',
        en: 'Between July 13 and November 23, 2025, the site earned 84,660 clicks. The home page brought 24,561.',
      },
      {
        es: 'Un año después los clics de consultas relacionadas con la marca bajaron de 25,624 a 15,033 y los de otras consultas visibles de 18,310 a 7,216.',
        en: 'A year later, clicks from brand queries had fallen from 25,624 to 15,033 and clicks from other visible queries from 18,310 to 7,216.',
      },
    ],
    metrics: [
      { before: '84,660', after: '40,539', label: CLICKS },
      { before: '13.35M', after: '22.94M', label: IMPRESSIONS },
      { before: '11.2', after: '9.0', label: POSITION },
      { before: '24,561', after: '16,708', label: { es: 'Clics de la portada', en: 'Home page clicks' } },
    ],
    lessons: [
      {
        title: { es: 'Mejorar la posición media no garantiza más clics', en: 'A better average position does not guarantee more clicks' },
        body: {
          es: 'La posición media mejoró y las impresiones crecieron, pero el CTR bajó de 0.63% a 0.18% y los clics cayeron a menos de la mitad.',
          en: 'Average position improved and impressions grew, yet CTR fell from 0.63% to 0.18% and clicks dropped to less than half.',
        },
      },
    ],
    conclusion: {
      es: 'Funcionaron dos páginas de conversión de divisas: una pasó de 6 a 1,112 clics y otra de 10 a 902. No funcionó el conjunto: los clics totales cayeron 52%, la portada retrocedió y el artículo sobre cobros de streamers pasó de 2,104 a 50 clics.',
      en: 'Two currency converter pages worked: one went from 6 to 1,112 clicks and another from 10 to 902. The site as a whole did not: total clicks fell 52%, the home page lost ground and the article on streamer payouts went from 2,104 to 50 clicks.',
    },
    metaDescription: {
      es: 'Los clics de Vitawallet cayeron 52% en 134 días comparables mientras las impresiones y la posición media mejoraron.',
      en: 'Vitawallet clicks fell 52% over 134 comparable days while impressions and average position improved.',
    },
  },

  // ------------------------------------------------------------------ Delta Cloudz
  {
    id: 22,
    slug: 'deltacloudz-ecommerce-guias-de-uso-estados-unidos',
    title: {
      es: 'Delta Cloudz sumó guías nuevas con menos clics que el año anterior',
      en: 'Delta Cloudz added new guides while earning fewer clicks than a year earlier',
    },
    heroMetric: {
      es: '-27% clics frente a las mismas fechas de 2025',
      en: '-27% clicks against the same dates in 2025',
    },
    heroSubtitle: {
      es: 'Del 12 de julio al 22 de noviembre de 2026 los clics bajaron de 60,621 a 44,104 frente a las mismas fechas de 2025.',
      en: 'From July 12 to November 22, 2026, clicks fell from 60,621 to 44,104 against the same dates in 2025.',
    },
    sector: { es: 'Comercio electrónico, vapeo', en: 'E-commerce, vaping' },
    kpis: [
      { value: '-27%', label: { es: 'Clics frente a las mismas fechas', en: 'Clicks against the same dates' } },
      { value: '44,104', label: { es: 'Clics orgánicos', en: 'Organic clicks' } },
      { value: '-4%', label: { es: 'Impresiones', en: 'Impressions' } },
      { value: '10.9', label: { es: 'Posición media (antes 15.6)', en: 'Average position (was 15.6)' } },
    ],
    clientContext: {
      es: 'Delta Cloudz es una tienda en línea de vapeo desechable.',
      en: 'Delta Cloudz is an online disposable vape store.',
    },
    challenge: [
      {
        es: 'Entre el 13 de julio y el 23 de noviembre de 2025 el sitio sumó 60,621 clics. La colección de Backpack Boyz aportaba 6,574.',
        en: 'Between July 13 and November 23, 2025, the site earned 60,621 clicks. The Backpack Boyz collection brought 6,574.',
      },
      {
        es: 'Un año después varias de las páginas que más traían tráfico habían perdido la mayor parte de sus clics.',
        en: 'A year later, several of the pages that used to bring the most traffic had lost most of their clicks.',
      },
    ],
    metrics: [
      { before: '60,621', after: '44,104', label: CLICKS },
      { before: '2.57M', after: '2.46M', label: IMPRESSIONS },
      { before: '15.6', after: '10.9', label: POSITION },
      { before: '6,574', after: '226', label: { es: 'Clics de la colección Backpack Boyz', en: 'Backpack Boyz collection clicks' } },
    ],
    lessons: [
      {
        title: { es: 'Las páginas nuevas no compensan solas las pérdidas', en: 'New pages alone do not make up for losses' },
        body: {
          es: 'Las guías nuevas sumaron miles de clics y aun así el total quedó 27% por debajo.',
          en: 'The new guides earned thousands of clicks and the total still ended 27% lower.',
        },
      },
    ],
    conclusion: {
      es: 'Funcionaron las guías de uso: la de Boutiq Switch sumó 5,842 clics y la de Big Chief Duo 2,147. No funcionó la defensa de páginas que antes rendían: la colección de Backpack Boyz pasó de 6,574 a 226 clics, la comparación de potencia de 2,066 a 44 y la guía de Cake de 6,202 a 1,593.',
      en: 'Usage guides worked: the Boutiq Switch guide earned 5,842 clicks and the Big Chief Duo guide 2,147. Holding on to former top pages did not: the Backpack Boyz collection went from 6,574 to 226 clicks, the strength comparison from 2,066 to 44 and the Cake guide from 6,202 to 1,593.',
    },
    metaDescription: {
      es: 'Los clics de Delta Cloudz cayeron 27% en 134 días comparables. Qué guías funcionaron y qué páginas perdieron tráfico.',
      en: 'Delta Cloudz clicks fell 27% over 134 comparable days. Which guides worked and which pages lost traffic.',
    },
  },

  // ------------------------------------------------------------------ Software administrativo (anónimo)
  {
    id: 24,
    slug: 'software-administrativo-venezuela-demanda-de-marca',
    title: {
      es: 'La demanda de marca impulsó a un software administrativo en Venezuela',
      en: 'Brand demand drove growth for a Venezuelan business software company',
    },
    heroMetric: {
      es: '+661% clics, casi todos por la marca',
      en: '+661% clicks, almost all from brand demand',
    },
    heroSubtitle: {
      es: 'Del 12 de julio al 22 de noviembre de 2026 los clics pasaron de 20,285 a 154,270 frente a las mismas fechas de 2025. El crecimiento viene sobre todo de quienes ya buscaban la marca.',
      en: 'From July 12 to November 22, 2026, clicks went from 20,285 to 154,270 against the same dates in 2025. The growth comes mostly from people already looking for the brand.',
    },
    sector: { es: 'Software administrativo, Venezuela', en: 'Business software, Venezuela' },
    kpis: [
      { value: '+661%', label: { es: 'Clics, sobre todo de marca', en: 'Clicks, mostly from brand demand' } },
      { value: '154,270', label: { es: 'Clics orgánicos', en: 'Organic clicks' } },
      { value: '140,322', label: { es: 'Clics de consultas de marca', en: 'Clicks from brand queries' } },
      { value: '3.7', label: { es: 'Posición media (antes 6.6)', en: 'Average position (was 6.6)' } },
    ],
    clientContext: {
      es: 'Es una empresa venezolana de software administrativo. El cliente prefiere no figurar con su nombre.',
      en: 'This is a Venezuelan business software company. The client prefers not to be named.',
    },
    challenge: [
      {
        es: 'Entre el 13 de julio y el 23 de noviembre de 2025 el sitio sumó 20,285 clics, de los cuales 15,795 venían de consultas relacionadas con el nombre de la marca.',
        en: 'Between July 13 and November 23, 2025, the site earned 20,285 clicks, 15,795 of them from queries related to the brand name.',
      },
      {
        es: 'Las demás consultas visibles aportaban 77 clics.',
        en: 'The other visible queries brought 77 clicks.',
      },
    ],
    metrics: [
      { before: '20,285', after: '154,270', label: CLICKS },
      { before: '86,880', after: '429,311', label: IMPRESSIONS },
      { before: '15,795', after: '140,322', label: { es: 'Clics de consultas de marca', en: 'Clicks from brand queries' } },
      { before: '77', after: '572', label: { es: 'Clics de otras consultas visibles', en: 'Clicks from other visible queries' } },
    ],
    lessons: [
      {
        title: { es: 'Separar la marca cambia la lectura', en: 'Splitting out the brand changes the reading' },
        body: {
          es: 'El total parece una gran victoria de SEO. Al separar las consultas de marca queda claro que casi todo el aumento viene de personas que ya conocían la empresa.',
          en: 'The total looks like a major SEO win. Splitting out brand queries shows that almost all of the increase comes from people who already knew the company.',
        },
      },
    ],
    conclusion: {
      es: 'La portada concentra 97% de los clics. Fuera de la marca el avance es pequeño. Los tutoriales y algunos artículos del blog que un año antes no recibían clics ya los reciben, con un CTR bajo.',
      en: 'The home page holds 97% of the clicks. Beyond the brand the gain is small. Tutorials and some blog articles that earned no clicks a year earlier now earn them, at a low CTR.',
    },
    metaDescription: {
      es: 'Los clics de un software administrativo en Venezuela pasaron de 20,285 a 154,270 en 134 días comparables, sobre todo por demanda de marca.',
      en: 'Clicks for a Venezuelan business software company went from 20,285 to 154,270 over 134 comparable days, mostly from brand demand.',
    },
  },
]
