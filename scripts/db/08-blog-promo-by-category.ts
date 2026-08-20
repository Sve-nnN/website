/**
 * Versiones por categoría de los textos de conversión del blog.
 *
 * El texto general sigue existiendo y es el que se usa cuando una categoría no
 * tiene fila propia, o cuando la fila deja un campo vacío: la mezcla es por
 * campo (ver src/lib/blog-promo.ts). Acá se cargan solo los campos que de
 * verdad cambian según con quién se está hablando.
 *
 * Lectura de audiencia detrás de cada versión:
 *
 *   tech-seo        → dev o SEO técnico mirando su propio código. Habla de
 *                     renderizado, indexación y Core Web Vitals medidos.
 *   seo             → quien gestiona el contenido de un sitio que ya existe,
 *                     casi siempre WordPress, Webflow o Shopify. Su problema no
 *                     es el código, es que publica y no pasa nada.
 *   development     → quien está construyendo el sitio ahora. Le sirve más
 *                     evitar el rehacer que auditar algo terminado.
 *   cs-fundamentals → estudiante o dev repasando teoría. Intención comercial
 *                     casi nula, así que acá NO se vende la auditoría: se le
 *                     muestra trabajo real y se lo deja leer. Meterle precio a
 *                     alguien que vino a repasar complejidad algorítmica es la
 *                     forma más rápida de que no vuelva.
 *
 * SE CORRE UNA VEZ POR IDIOMA, en procesos separados y EN ESTE ORDEN, que no
 * es el intuitivo:
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/08-blog-promo-by-category.ts --locale en --apply
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/08-blog-promo-by-category.ts --locale es --apply
 *
 * Inglés PRIMERO. Motivo, medido contra la base real, no supuesto:
 *
 *   - Escribir el array con `id` en cada fila funciona en el locale por defecto
 *     (`es`) y FALLA en el secundario (`en`) con
 *     `ValidationError: id — Value must be unique` sobre la tabla `blog_promo`.
 *     Falla igual en un proceso limpio, así que no es un problema de estado.
 *   - Escribir el array SIN ids funciona en cualquier locale, pero recrea las
 *     filas con ids nuevos y deja al otro idioma colgando de filas que ya no
 *     existen. Pasó durante el desarrollo de este script: el español quedó en
 *     blanco.
 *
 * De ahí el orden: el pase `en` crea las filas sin ids (única forma de que el
 * locale secundario escriba), y el pase `es` las completa apuntando a ESOS ids,
 * que es la combinación que sí acepta. Invertirlo vacía uno de los dos idiomas.
 *
 * DRY-RUN POR DEFECTO: sin `--apply` no escribe nada.
 *
 * Requiere el túnel a producción (./scripts/db/tunnel.sh) y DATABASE_URI
 * exportada hacia localhost:15432.
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

const localeArg = process.argv[process.argv.indexOf('--locale') + 1]
const LOCALE = localeArg === 'en' ? 'en' : localeArg === 'es' ? 'es' : null

if (!LOCALE) {
  console.error('Falta --locale es | --locale en')
  process.exit(1)
}

type Variant = {
  inline: { title: string; text: string; linkLabel: string; linkUrl: string }
  rail: { title: string; body: string; linkLabel: string; linkUrl: string }
  closing: {
    heading: string
    body: string
    points?: string[]
    primaryLabel: string
    primaryUrl: string
  }
}

const VARIANTS: Record<string, { es: Variant; en: Variant }> = {
  'tech-seo': {
    es: {
      inline: {
        title: 'Esto mismo lo reviso sobre tu código',
        text: 'Rastreo, renderizado y Core Web Vitals medidos en campo, no en un laboratorio ni en un reporte automático. Cada problema sale con la corrección concreta al lado.',
        linkLabel: 'Pedir la auditoría',
        linkUrl: '/contact',
      },
      rail: {
        title: '¿Google no ve lo que publicas?',
        body: 'Reviso indexación, renderizado y rendimiento sobre tu repositorio y te digo qué corregir primero.',
        linkLabel: 'Ver la auditoría',
        linkUrl: '/contact',
      },
      closing: {
        heading: 'Veamos qué está viendo Google de tu sitio',
        body: 'Auditoría sobre el código, no sobre un crawl genérico: qué se indexa, qué depende de JavaScript, qué miden tus Core Web Vitals en usuarios reales y qué emite tu marcado estructurado.',
        primaryLabel: 'Pedir la auditoría',
        primaryUrl: '/contact',
      },
    },
    en: {
      inline: {
        title: 'This is what I check against your code',
        text: 'Crawling, rendering and Core Web Vitals measured in the field, not in a lab and not in an automated report. Every problem comes with the concrete fix next to it.',
        linkLabel: 'Request the audit',
        linkUrl: '/contact',
      },
      rail: {
        title: "Google not seeing what you publish?",
        body: 'I check indexing, rendering and performance against your repository and tell you what to fix first.',
        linkLabel: 'See the audit',
        linkUrl: '/contact',
      },
      closing: {
        heading: "Let's see what Google is actually seeing",
        body: 'An audit against the code, not a generic crawl: what gets indexed, what depends on JavaScript, what your Core Web Vitals measure on real users and what your structured data emits.',
        primaryLabel: 'Request the audit',
        primaryUrl: '/contact',
      },
    },
  },

  seo: {
    es: {
      inline: {
        title: 'Publicas y no pasa nada',
        text: 'Suele ser el sitio, no el contenido. En WordPress, Webflow o Shopify hay plantillas y plugins que bloquean el rastreo, duplican URLs o entierran lo que escribes. Eso se ve entrando al sitio.',
        linkLabel: 'Que revise tu sitio',
        linkUrl: '/contact',
      },
      rail: {
        title: '¿Escribes y no rankeas?',
        body: 'Reviso si el problema es el contenido o el sitio donde vive: WordPress, Webflow, Shopify o lo que uses.',
        linkLabel: 'Ver la auditoría',
        linkUrl: '/contact',
      },
      closing: {
        heading: 'Antes de escribir otro artículo, veamos por qué no rankean los que ya tienes',
        body: 'Reviso arquitectura, canibalización, enlazado interno y las trabas técnicas que tu CMS mete sin avisar. Sale una lista por impacto, con la corrección concreta, tanto de contenido como de sitio.',
        points: [
          'Sirve igual sobre WordPress, Webflow, Shopify o un stack a medida',
          'Auditoría completa por 600 USD, acreditables si seguimos con la implementación',
          'Entrega en 10 días hábiles',
        ],
        primaryLabel: 'Pedir la auditoría',
        primaryUrl: '/contact',
      },
    },
    en: {
      inline: {
        title: 'You publish and nothing happens',
        text: 'It is usually the site, not the writing. WordPress, Webflow and Shopify ship templates and plugins that block crawling, duplicate URLs or bury what you write. That shows up the moment someone looks at the site.',
        linkLabel: 'Have me look at your site',
        linkUrl: '/contact',
      },
      rail: {
        title: 'Writing but not ranking?',
        body: 'I check whether the problem is the content or the site it lives on: WordPress, Webflow, Shopify or whatever you use.',
        linkLabel: 'See the audit',
        linkUrl: '/contact',
      },
      closing: {
        heading: 'Before you write another post, let us find out why the existing ones do not rank',
        body: 'I go through architecture, cannibalisation, internal linking and the technical blocks your CMS adds without telling you. You get a list ranked by impact, with the concrete fix, for both content and site.',
        points: [
          'Works the same on WordPress, Webflow, Shopify or a custom stack',
          'Full audit for 600 USD, credited back if we go ahead with the implementation',
          'Delivered in 10 business days',
        ],
        primaryLabel: 'Request the audit',
        primaryUrl: '/contact',
      },
    },
  },

  development: {
    es: {
      inline: {
        title: 'Si estás construyendo esto ahora',
        text: 'Rendering, rutas, metadatos y datos estructurados se deciden mientras armas el sitio. Resolverlos ahí cuesta una conversación; resolverlos después de lanzar cuesta rehacer.',
        linkLabel: 'Hablemos del proyecto',
        linkUrl: '/contact',
      },
      rail: {
        title: '¿Estás armando el sitio?',
        body: 'Reviso las decisiones de arquitectura antes de que se conviertan en deuda: rendering, rutas, metadatos.',
        linkLabel: 'Hablemos',
        linkUrl: '/contact',
      },
      closing: {
        heading: 'El SEO se decide mientras construyes, no después',
        body: 'Trabajo Next.js y Payload todos los días, y el sitio que estás leyendo es la demostración. Puedo revisar tu arquitectura antes de lanzar, o encargarme del build completo.',
        points: [
          'Revisión de arquitectura antes de lanzar: rendering, rutas, metadatos, datos estructurados',
          'También el desarrollo completo, con el SEO técnico ya adentro',
          'Auditoría completa por 600 USD, acreditables si seguimos con la implementación',
        ],
        primaryLabel: 'Hablemos del proyecto',
        primaryUrl: '/contact',
      },
    },
    en: {
      inline: {
        title: 'If you are building this right now',
        text: 'Rendering, routes, metadata and structured data get decided while you build. Solving them there costs a conversation; solving them after launch costs a rebuild.',
        linkLabel: "Let's talk about the project",
        linkUrl: '/contact',
      },
      rail: {
        title: 'Building the site right now?',
        body: 'I review the architecture decisions before they turn into debt: rendering, routes, metadata.',
        linkLabel: "Let's talk",
        linkUrl: '/contact',
      },
      closing: {
        heading: 'SEO gets decided while you build, not afterwards',
        body: 'I work with Next.js and Payload every day, and the site you are reading is the proof. I can review your architecture before launch, or take on the whole build.',
        points: [
          'Architecture review before launch: rendering, routes, metadata, structured data',
          'Or the full build, with technical SEO already inside it',
          'Full audit for 600 USD, credited back if we go ahead with the implementation',
        ],
        primaryLabel: "Let's talk about the project",
        primaryUrl: '/contact',
      },
    },
  },

  'cs-fundamentals': {
    es: {
      inline: {
        title: 'Dónde termina esto en producción',
        text: 'La complejidad deja de ser un ejercicio cuando una consulta tarda 800ms y el LCP se va con ella. Tengo casos con números reales de Search Console, con el cliente anonimizado.',
        linkLabel: 'Ver los casos',
        linkUrl: '/case-studies',
      },
      rail: {
        title: 'De la teoría al sitio real',
        body: 'Casos con métricas reales de Search Console, donde estas decisiones terminan siendo tráfico.',
        linkLabel: 'Ver los casos',
        linkUrl: '/case-studies',
      },
      closing: {
        heading: 'Esto mismo, aplicado a sitios reales',
        body: 'Soy ingeniero de software y consultor SEO técnico. Estos fundamentos son la mitad del trabajo; la otra mitad es lo que pasa cuando se aplican sobre un sitio con usuarios y con tráfico que perder.',
        points: [
          'Casos con clics, impresiones y posiciones reales de Search Console',
          'Cliente anonimizado en todos: se muestran resultados, nunca identidad',
        ],
        primaryLabel: 'Ver los casos',
        primaryUrl: '/case-studies',
      },
    },
    en: {
      inline: {
        title: 'Where this lands in production',
        text: 'Complexity stops being an exercise when a query takes 800ms and LCP goes with it. I have case studies with real Search Console numbers, client anonymised.',
        linkLabel: 'See the case studies',
        linkUrl: '/case-studies',
      },
      rail: {
        title: 'From theory to a real site',
        body: 'Case studies with real Search Console metrics, where these decisions turn into traffic.',
        linkLabel: 'See the case studies',
        linkUrl: '/case-studies',
      },
      closing: {
        heading: 'The same thing, applied to real sites',
        body: 'I am a software engineer and technical SEO consultant. These fundamentals are half the job; the other half is what happens when you apply them to a site with users and traffic to lose.',
        points: [
          'Case studies with real clicks, impressions and positions from Search Console',
          'Client anonymised in every one: results are shown, identity never is',
        ],
        primaryLabel: 'See the case studies',
        primaryUrl: '/case-studies',
      },
    },
  },
}

async function main() {
  const payload = await getPayload({ config })
  console.log(`${APPLY ? '=== APLICANDO' : '=== DRY-RUN (nada se escribe)'} — locale ${LOCALE} ===`)

  const { docs: cats } = await payload.find({ collection: 'categories', limit: 100 })
  const catId = new Map(cats.map((c) => [c.slug ?? '', c.id]))

  const missing = Object.keys(VARIANTS).filter((slug) => !catId.has(slug))
  if (missing.length > 0) {
    console.error(`ABORT: categorías inexistentes: ${missing.join(', ')}`)
    process.exit(1)
  }

  const slugs = Object.keys(VARIANTS)

  for (const slug of slugs) {
    console.log(`\n  ${slug}`)
    console.log(`    ${LOCALE}: "${VARIANTS[slug][LOCALE].inline.title}" -> ${VARIANTS[slug][LOCALE].closing.primaryUrl}`)
  }

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correr con --apply para escribir.')
    process.exit(0)
  }

  // El pase `en` crea las filas sin ids. El pase `es` reusa esos ids: una fila
  // con id nuevo sería una fila distinta y el global terminaría con dos listas
  // que no coinciden entre idiomas. Ver la cabecera para por qué el orden es
  // inglés primero.
  let rowIds: (string | null | undefined)[] = []

  if (LOCALE === 'es') {
    const current = (await payload.findGlobal({ slug: 'blog-promo', locale: 'en' })) as {
      byCategory?: { id?: string | null; category?: { id: number } | number | null }[]
    }
    const existing = current.byCategory ?? []

    if (existing.length !== slugs.length) {
      console.error(
        `ABORT: el global tiene ${existing.length} filas y este script escribe ${slugs.length}. ` +
          'Corré primero el pase --locale en.',
      )
      process.exit(1)
    }

    // Se ordenan por categoría, no por posición: el orden del array en el admin
    // puede haber cambiado y escribir por índice pisaría la fila equivocada.
    rowIds = slugs.map((slug) => {
      const id = catId.get(slug)
      return existing.find((r) => (typeof r.category === 'object' ? r.category?.id : r.category) === id)?.id
    })

    const orphan = slugs.filter((slug, i) => !rowIds[i])
    if (orphan.length > 0) {
      console.error(`ABORT: no hay fila en inglés para: ${orphan.join(', ')}`)
      process.exit(1)
    }
  }

  const rows = slugs.map((slug, i) => {
    const v = VARIANTS[slug][LOCALE]
    return {
      ...(rowIds[i] ? { id: rowIds[i] } : {}),
      category: catId.get(slug),
      inline: { ...v.inline },
      rail: { ...v.rail },
      closing: {
        heading: v.closing.heading,
        body: v.closing.body,
        primaryLabel: v.closing.primaryLabel,
        primaryUrl: v.closing.primaryUrl,
        ...(v.closing.points ? { points: v.closing.points.map((item) => ({ item })) } : {}),
      },
    }
  })

  await payload.updateGlobal({
    slug: 'blog-promo',
    locale: LOCALE,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { byCategory: rows } as any,
  })

  // ---- verificación ----
  console.log('\n=== VERIFICACIÓN ===')
  let fallos = 0

  for (const locale of [LOCALE] as const) {
    const promo = (await payload.findGlobal({ slug: 'blog-promo', locale })) as {
      inline?: { title?: string | null }
      byCategory?: {
        category?: { id: number } | number | null
        inline?: { title?: string | null }
        closing?: { primaryUrl?: string | null }
      }[]
    }

    const rows = promo.byCategory ?? []

    if (rows.length !== slugs.length) {
      fallos++
      console.log(`  FALLA [${locale}]: ${rows.length} filas, se esperaban ${slugs.length}`)
      continue
    }

    for (const slug of slugs) {
      const id = catId.get(slug)
      const row = rows.find((r) => (typeof r.category === 'object' ? r.category?.id : r.category) === id)
      const expected = VARIANTS[slug][locale]
      const ok =
        row?.inline?.title === expected.inline.title &&
        row?.closing?.primaryUrl === expected.closing.primaryUrl
      if (!ok) fallos++
      console.log(`  ${ok ? 'OK  ' : 'FALLA'} [${locale}] ${slug}: "${row?.inline?.title ?? 'VACÍO'}"`)
    }

    // El texto general tiene que seguir intacto: es el fallback de cualquier
    // categoría sin fila propia.
    const baseOk = Boolean(promo.inline?.title)
    if (!baseOk) fallos++
    console.log(`  ${baseOk ? 'OK  ' : 'FALLA'} [${locale}] texto general intacto`)
  }

  console.log(fallos === 0 ? '\nVerificado.' : `\n${fallos} verificaciones fallaron.`)
  process.exit(fallos === 0 ? 0 : 1)
}

main()
