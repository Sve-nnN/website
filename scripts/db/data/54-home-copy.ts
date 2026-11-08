/**
 * Copy ES aprobado del sandbox (designs/design-system-mui) para el global
 * `home-page`. Verbatim: no se reescribe ni se inventa nada.
 *
 * Solo ES. El inglés cae al español por el respaldo (fallback true).
 *
 * Lo que NO se siembra a propósito:
 *   - `sites.note`: el sandbox la fecha el 6 de noviembre de 2026, pero la
 *     tarjeta muestra los puntajes reales de Payload (capturados el 14 de
 *     julio). La vista arma esa nota desde messages con la fecha real.
 *   - Ninguna ranura de testimonio del sandbox (cita, nombre, rol y empresa de
 *     muestra). Solo se siembra el título de la sección.
 */
export const HOME_COPY_ES = {
  tagline:
    'Abro tu código, encuentro lo que Google no logra leer y lo arreglo yo mismo. Después vuelvo a Search Console para ver si el cambio funcionó.',
  hero: {
    eyebrow: 'Ingeniero de software y consultor SEO técnico',
    titleLine1: 'Arreglo el SEO',
    titleLine2: 'desde el código',
    lead: 'Entro al código, corrijo lo que frena a Google en tu sitio y mido el resultado en Search Console. Trabajo en español e inglés.',
    ctaLabel: 'Pedir auditoría 360',
    ctaHref: '#contacto',
    statValue: '+406 %',
    statCaption: 'clics interanuales en un caso de salud',
  },
  vitals: {
    title: 'Medición antes de tocar el código',
    lead: 'Cuatro lecturas me dicen dónde duele un sitio. La barra de cada una marca el rango que Google considera bueno, mejorable y pobre.',
    measurementNote:
      'Medido en juan-tech.com el 6 de noviembre de 2026 con PageSpeed Insights en móvil (laboratorio). El TTFB sale de curl. INP no aparece porque el sitio aún no tiene datos de campo de Chrome, así que lo reemplaza el TBT.',
    items: [
      {
        name: 'LCP',
        desc: 'Cuánto tarda en pintarse el elemento principal',
        value: '1.9 s',
        label: '1.9 segundos',
        goodPct: 41.7,
        midPct: 25,
        poorPct: 33.3,
        markerPct: 31.7,
        note: 'Bueno: hasta 2.5 s',
      },
      {
        name: 'CLS',
        desc: 'Cuánto se mueve el diseño mientras carga',
        value: '0',
        label: '0',
        goodPct: 25,
        midPct: 37.5,
        poorPct: 37.5,
        markerPct: 1.5,
        note: 'Bueno: hasta 0.1',
      },
      {
        name: 'TBT',
        desc: 'Cuánto bloquea el JavaScript a la página mientras carga',
        value: '13 ms',
        label: '13 milisegundos',
        goodPct: 20,
        midPct: 40,
        poorPct: 40,
        markerPct: 1.3,
        note: 'Bueno: hasta 200 ms',
      },
      {
        name: 'TTFB',
        desc: 'Cuánto tarda el servidor en dar el primer byte',
        value: '0.7 s',
        label: '0.7 segundos',
        goodPct: 32,
        midPct: 40,
        poorPct: 28,
        markerPct: 28.8,
        note: 'Bueno: hasta 0.8 s',
      },
    ],
  },
  services: {
    title: 'Servicios de SEO técnico y desarrollo',
    lead: 'Trabajo yo mismo en cada proyecto. Empiezo por lo que ve Googlebot y de ahí decido qué tocar.',
    ctaLabel: 'Hablemos de tu sitio',
    items: [
      {
        icon: 'search',
        title: 'SEO técnico',
        body: 'Audito rastreo, indexación y datos estructurados. Empiezo por lo que ve Googlebot y de ahí decido qué tocar.',
        tags: [{ tag: 'hreflang' }, { tag: 'canonical' }, { tag: 'sitemap' }, { tag: 'schema' }],
        servicePage: 'seo-technical-audit',
      },
      {
        icon: 'code',
        title: 'Desarrollo con Next.js y Payload',
        body: 'Construyo con Next.js y Payload CMS y dejo el SEO resuelto desde el primer commit: rutas, metadatos, sitemap y datos estructurados.',
        tags: [{ tag: 'Next.js' }, { tag: 'Payload CMS' }, { tag: 'PostgreSQL' }],
        servicePage: 'fullstack-development',
      },
      {
        icon: 'server',
        title: 'Infraestructura y servidores',
        body: 'Configuro el servidor, los headers y la caché. Cuando el TTFB sube, casi siempre el problema está en el servidor.',
        tags: [{ tag: 'TTFB' }, { tag: 'headers' }, { tag: 'caché' }],
      },
      {
        icon: 'gauge',
        title: 'Rendimiento web',
        body: 'Mido LCP, CLS e INP y ataco primero lo que más pesa: imágenes, fuentes y JavaScript.',
        tags: [{ tag: 'LCP' }, { tag: 'CLS' }, { tag: 'INP' }],
      },
      {
        icon: 'sparkles',
        title: 'SEO para IA y GEO',
        body: 'Estructuro el contenido para que ChatGPT, Perplexity y las respuestas de IA de Google puedan citarlo.',
        tags: [{ tag: 'ChatGPT' }, { tag: 'Perplexity' }],
        servicePage: 'ai-seo-geo',
      },
    ],
  },
  cases: {
    title: 'Resultados en Search Console',
    lead: 'Cada cifra compara los clics de un año contra el año anterior, en el mismo periodo.',
    ctaLabel: 'Ver todos los casos',
    metricSuffix: 'clics interanuales',
    note: 'Los datos salen de Search Console. Mantengo anónimos a los clientes.',
  },
  process: {
    title: 'Mi proceso de la auditoría a la medición',
    steps: [
      {
        icon: 'search',
        title: 'Audito',
        body: 'Reviso rastreo, indexación, Core Web Vitals y datos estructurados. Parto de lo que Google ve hoy.',
      },
      {
        icon: 'list',
        title: 'Priorizo',
        body: 'Ordeno los hallazgos por el impacto que tienen en el tráfico, sin importar cuántos avisos genere cada herramienta.',
      },
      {
        icon: 'wrench',
        title: 'Corrijo',
        body: 'Aplico el cambio en el código o dejo el cambio exacto para que lo aplique tu equipo.',
      },
      {
        icon: 'chart',
        title: 'Mido',
        body: 'Comparo Search Console y los Core Web Vitals reales antes y después.',
      },
    ],
  },
  sites: {
    title: 'Sitios web que construí',
    ctaLabel: 'Ver todos los sitios',
  },
  about: {
    title: 'Ingeniero de software que trabaja el SEO',
    seoLabel: 'proyectos de SEO',
    devLabel: 'proyectos de desarrollo',
    paragraphs: [
      {
        text: 'Trabajo el SEO desde el código. Construyo con Next.js y con un CMS headless como Payload, resuelvo el SEO desde el primer commit y audito antes de construir.',
      },
      { text: 'Cuido la accesibilidad y parto del móvil para diseñar. Trabajo en español e inglés.' },
    ],
    chips: [
      { label: 'SEO técnico' },
      { label: 'Rendimiento web' },
      { label: 'Infraestructura' },
      { label: 'Arquitectura escalable' },
      { label: 'Accesibilidad' },
    ],
    // Solo caption. Las imágenes las enlaza el script 21 tras subirlas a Cloudinary.
    photos: [{ caption: 'Taller de SEO técnico en Venezuela SEO Fest 2024' }, {}, {}],
  },
  testimonials: {
    title: 'Clientes que trabajaron conmigo',
  },
  faq: {
    title: 'Preguntas frecuentes',
    items: [
      {
        question: '¿Qué incluye la Auditoría 360?',
        answer:
          'Reviso rastreo, indexación, Core Web Vitals, datos estructurados, contenido y SEO para IA. Entrego un plan de corrección ordenado por impacto.',
      },
      {
        question: '¿Qué recibo y cuánto tarda?',
        answer:
          'Recibes un informe con el plan de corrección ordenado por impacto, y lo entrego en 10 días hábiles. Escríbeme y te cuento cómo lo adapto al tamaño de tu sitio.',
      },
      {
        question: '¿Trabajas con mi equipo de desarrollo?',
        answer:
          'Sí. Corrijo el código yo mismo o dejo el cambio exacto para que tu equipo lo aplique.',
      },
      {
        question: '¿Cómo mido el éxito de las optimizaciones?',
        answer:
          'Comparo Search Console y Core Web Vitals reales antes y después. Las cifras de los casos salen de ahí.',
      },
      {
        question: '¿En qué idiomas trabajas?',
        answer: 'Trabajo en español e inglés. Audito, escribo y construyo en los dos idiomas.',
      },
    ],
  },
  cta: {
    title: 'Hablemos de tu sitio',
    lead: '¿Tienes un proyecto en mente? Cuéntame de qué se trata y empiezo por mirar qué ve Google hoy.',
  },
  contact: {
    stepsTitle: 'Cómo empezamos',
    faqTitle: 'Antes de escribir',
    steps: [
      {
        title: 'Me cuentas el proyecto',
        body: 'Cuéntame de qué se trata y qué problema quieres resolver.',
      },
      {
        title: 'Miro qué ve Google hoy',
        body: 'Empiezo por revisar tu sitio como lo ve el buscador.',
      },
      {
        title: 'Te digo por dónde empezar',
        body: 'Te propongo el servicio que encaja y los primeros pasos.',
      },
    ],
    infoRows: [
      { icon: 'clock', title: 'Respuesta', text: 'Suelo responder en menos de 48 horas.' },
      {
        icon: 'map-pin',
        title: 'Dónde estoy',
        text: 'Lima, Perú. Trabajo con clientes de toda Latinoamérica, España y Estados Unidos.',
      },
      { icon: 'globe', title: 'Idiomas', text: 'Español e inglés.' },
    ],
  },
}

/**
 * Logos del sandbox (designs/design-system-mui/src/data/logos.ts): archivo,
 * texto alternativo y si es un logo claro que necesita chip oscuro. El sandbox
 * no está bajo git, así que la lista se copia aquí.
 */
export const SANDBOX_LOGOS: readonly { file: string; alt: string; onDark: boolean }[] = [
  { file: 'aprendoclub.webp', alt: 'Aprendoclub', onDark: false },
  { file: 'apturio.webp', alt: 'Apturio', onDark: false },
  { file: 'childrenchic.webp', alt: 'Children Chic', onDark: false },
  { file: 'credito-uss.webp', alt: 'Crédito USS', onDark: false },
  { file: 'cresory.webp', alt: 'Cresory', onDark: false },
  { file: 'delta-cloudz.webp', alt: 'Delta Cloudz', onDark: false },
  { file: 'dr-manuel-a-vargas-hidalgo.webp', alt: 'Dr. Manuel A. Vargas Hidalgo', onDark: false },
  { file: 'dslx.webp', alt: 'DSLX', onDark: false },
  { file: 'estylopia.webp', alt: 'Estylopia', onDark: false },
  { file: 'felipe-vergara.webp', alt: 'Felipe Vergara', onDark: false },
  { file: 'florida-health-care-academy.webp', alt: 'Florida Health Care Academy', onDark: false },
  { file: 'florida-top-roofs.webp', alt: 'Florida Top Roofs', onDark: false },
  { file: 'holafly.webp', alt: 'Holafly', onDark: false },
  { file: 'luxembourg-philharmonie.webp', alt: 'Philharmonie Luxembourg', onDark: false },
  { file: 'money-com.webp', alt: 'Money.com', onDark: false },
  { file: 'pro-torque-diesel.webp', alt: 'Pro Torque Diesel', onDark: false },
  { file: 'puntada-con-amor.webp', alt: 'Puntada con Amor', onDark: false },
  { file: 'souma-hotel.webp', alt: 'Souma Hotel', onDark: false },
  { file: 'storybook-app.webp', alt: 'Storybook App', onDark: false },
  { file: 'the-sosa-team.webp', alt: 'The Sosa Team', onDark: false },
  { file: 'thesmokybox.webp', alt: 'The Smoky Box', onDark: false },
  { file: 'thesmokyrolling.webp', alt: 'The Smoky Rolling', onDark: false },
  { file: 'tumundosalud.webp', alt: 'Tu Mundo Salud', onDark: false },
  { file: 'tursi-digital-nomads.webp', alt: 'Tursi Digital Nomads', onDark: false },
  { file: 'vallas-venezuela.webp', alt: 'Vallas Venezuela', onDark: false },
  { file: 'winaypaq.webp', alt: 'Winaypaq', onDark: true },
]

/** Archivos del sandbox con `onDark` verdadero. */
export const ON_DARK_FILES: string[] = SANDBOX_LOGOS.filter((l) => l.onDark).map((l) => l.file)
