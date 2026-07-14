/**
 * Phase 30 Plan 02, Task 3 — Humanize Privacy and Terms pages (VOICE-06).
 *
 * Rewrites only the `body` prose of each `{ heading, body }` section pair
 * on the `privacy` (6 sections) and `terms` (5 sections) Pages docs, both
 * locales, calibrated against research/voice-sample-juan.md and
 * 29-VOICE-PROFILE.md — same section count/order/headings as the live
 * copy, no legal meaning/obligation altered (same data collected, same
 * third-party services named, same 12-month retention period, same IP/
 * liability terms). This is prose-rhythm humanization, not a policy change.
 *
 * Also removes 2 stray em dashes found live in Terms' EN section 3
 * ("All content on this site — including ... — is the exclusive property")
 * — the voice profile's hard "zero em dash" rule applies here too.
 *
 * Lexical builder helpers (`heading`/`paragraph`/`richTextDoc`) copied
 * verbatim from scripts/seed-legal-pages.ts.
 *
 * IMPORTANT (id-reuse discipline, T-30-04/T-30-05): `blockId`/`columnId`
 * are captured after the first locale's write-then-refetch and echoed back
 * on the second locale's write, for `privacy` and `terms` independently —
 * identical discipline to seed-legal-pages.ts lines 198-236.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/humanize-legal-pages.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

function heading(text: string) {
  return {
    type: 'heading',
    tag: 'h2',
    version: 1,
    children: [{ type: 'text', version: 1, text }],
  }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    version: 1,
    children: [{ type: 'text', version: 1, text }],
  }
}

function richTextDoc(sections: { heading: string; body: string }[]) {
  return {
    root: {
      type: 'root',
      children: sections.flatMap((s) => [heading(s.heading), paragraph(s.body)]),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// Same 6 headings as the live doc, only `body` rewritten — no section
// added/removed/reordered, no data practice or third-party service changed.
const privacySections = {
  es: [
    {
      heading: '1. Información que Recopilamos',
      body: 'Este sitio recopila lo mínimo necesario: los datos que envías por el formulario de contacto (nombre, email y mensaje) y analíticas anónimas vía Google Analytics y Cloudflare Insights. No uso cookies más allá de lo estrictamente técnico para que la sesión funcione.',
    },
    {
      heading: '2. Cómo Usamos tus Datos',
      body: 'Uso los datos del formulario de contacto únicamente para responder tu consulta, nada más. Las analíticas las reviso de forma agregada, para entender cómo mejorar el sitio, y nunca vendo tus datos a terceros.',
    },
    {
      heading: '3. Servicios de Terceros',
      body: 'Este sitio corre sobre Cloudinary para el almacenamiento de imágenes, Hostinger para el hosting, Google Analytics para el análisis de tráfico y Cloudflare para seguridad y rendimiento. Cada uno de estos servicios tiene su propia política de privacidad, independiente de esta.',
    },
    {
      heading: '4. Retención de Datos',
      body: 'Guardo los envíos del formulario de contacto hasta 12 meses, para poder darle seguimiento a la conversación si hace falta. Puedes pedirme que los elimine en cualquier momento.',
    },
    {
      heading: '5. Tus Derechos',
      body: 'Tienes derecho a acceder, corregir o eliminar cualquier dato personal que tenga sobre ti. Para ejercer cualquiera de estos derechos, escríbeme directamente desde la página de contacto.',
    },
    {
      heading: '6. Cookies',
      body: 'Este sitio solo usa cookies técnicas necesarias para funcionar, por ejemplo para la previsualización de borradores. No uso cookies de publicidad de terceros.',
    },
  ],
  en: [
    {
      heading: '1. Information We Collect',
      body: "This site collects the bare minimum: what you send through the contact form (name, email, and message) and anonymous analytics via Google Analytics and Cloudflare Insights. I don't set cookies beyond what's strictly needed to keep a session working.",
    },
    {
      heading: '2. How We Use Your Data',
      body: 'I use contact form data only to answer your message, nothing else. I review analytics in aggregate to understand how to improve the site, and I never sell your data to third parties.',
    },
    {
      heading: '3. Third-Party Services',
      body: "This site runs on Cloudinary for image storage, Hostinger for hosting, Google Analytics for traffic analysis, and Cloudflare for security and performance. Each of these services has its own privacy policy, separate from this one.",
    },
    {
      heading: '4. Data Retention',
      body: 'I keep contact form submissions for up to 12 months, so I can follow up on the conversation if needed. You can ask me to delete them at any point.',
    },
    {
      heading: '5. Your Rights',
      body: 'You have the right to access, correct, or delete any personal data I hold about you. To exercise any of these rights, reach out to me directly through the contact page.',
    },
    {
      heading: '6. Cookies',
      body: "This site only uses technical cookies required for it to work, for example for draft previews. I don't use third-party advertising cookies.",
    },
  ],
}

// Same 5 headings as the live doc, only `body` rewritten — same IP
// ownership, liability limitation, and acceptance/services description.
const termsSections = {
  es: [
    {
      heading: '1. Aceptación de los Términos',
      body: 'Si entras y usas este sitio (juan-tech.com), aceptas cumplir con estos Términos de Servicio. Si no estás de acuerdo con ellos, te pido que no uses el sitio.',
    },
    {
      heading: '2. Servicios',
      body: 'Este sitio es mi portafolio y blog personal. Aquí publico contenido técnico, casos de estudio y ofrezco servicios de consultoría profesional en ingeniería de software y SEO técnico.',
    },
    {
      heading: '3. Propiedad Intelectual',
      body: 'Todo el contenido de este sitio, artículos, ejemplos de código, diseños y casos de estudio incluidos, es de mi propiedad exclusiva salvo que se indique lo contrario. Puedes citarlo o referenciarlo siempre que des la atribución correcta y enlaces al original.',
    },
    {
      heading: '4. Limitación de Responsabilidad',
      body: 'El contenido de este sitio es solo informativo. No garantizo que sea exacto o esté completo en todo momento, y no me hago responsable de ningún daño que resulte de usar este sitio.',
    },
    {
      heading: '5. Contacto',
      body: 'Si tienes preguntas sobre estos términos, escríbeme a través de la página de contacto.',
    },
  ],
  en: [
    {
      heading: '1. Acceptance of Terms',
      body: "By accessing and using this site (juan-tech.com), you agree to follow these Terms of Service. If you don't agree with them, please don't use the site.",
    },
    {
      heading: '2. Services',
      body: 'This site is my personal portfolio and blog. I publish technical content and case studies here, and I offer professional consulting services in software engineering and technical SEO.',
    },
    {
      heading: '3. Intellectual Property',
      body: 'All the content on this site, including articles, code samples, designs, and case studies, belongs to me exclusively unless stated otherwise. You can quote or reference it as long as you give proper attribution and link back to the original.',
    },
    {
      heading: '4. Limitation of Liability',
      body: "The content on this site is for informational purposes only. I don't guarantee it's accurate or complete at all times, and I'm not liable for any damages that come from using this site.",
    },
    {
      heading: '5. Contact',
      body: 'If you have questions about these terms, reach out through the contact page.',
    },
  ],
}

async function humanizeLegalPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: 'privacy' | 'terms',
  sectionsByLocale: Record<(typeof LOCALES)[number], { heading: string; body: string }[]>,
) {
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const doc = docs[0]

  if (!doc) {
    console.error(`No \`${slug}\` Pages doc found by slug — cannot humanize. Aborting.`)
    process.exit(1)
  }

  let blockId: string | undefined
  let columnId: string | undefined

  for (const locale of LOCALES) {
    await payload.update({
      collection: 'pages',
      id: doc.id,
      locale,
      data: {
        content: {
          layout: [
            {
              id: blockId,
              blockType: 'content',
              columns: [
                {
                  id: columnId,
                  size: 'full',
                  richText: richTextDoc(sectionsByLocale[locale]),
                  enableLink: false,
                },
              ],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          ],
        },
      },
    })

    if (!blockId) {
      const refetched = await payload.findByID({ collection: 'pages', id: doc.id, depth: 0 })
      const block = refetched.content?.layout?.[0] as { id?: string; columns?: { id?: string }[] } | undefined
      blockId = block?.id
      columnId = block?.columns?.[0]?.id
    }

    console.log(`Humanized ${slug} Pages doc (locale=${locale})`)
  }
}

async function main() {
  const payload = await getPayload({ config })

  await humanizeLegalPage(payload, 'privacy', privacySections)
  await humanizeLegalPage(payload, 'terms', termsSections)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
