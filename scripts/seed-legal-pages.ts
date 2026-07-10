/**
 * Idempotent upsert (by slug) of the real `privacy` and `terms` Pages docs,
 * porting the real legal copy verbatim from JuanPortfolio's
 * privacy/page.tsx and terms/page.tsx (read in full during planning) into a
 * single `Content` block's richText field — a content port, not a rewrite.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-legal-pages.ts
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

// Ported verbatim from JuanPortfolio/src/app/(frontend)/[locale]/privacy/page.tsx
const privacySections = {
  es: [
    {
      heading: '1. Información que Recopilamos',
      body: 'Este sitio recopila datos mínimos: envíos del formulario de contacto (nombre, email, mensaje) y analíticas anónimas a través de Google Analytics y Cloudflare Insights. No se utilizan cookies más allá de los requisitos técnicos de sesión.',
    },
    {
      heading: '2. Cómo Usamos tus Datos',
      body: 'Los datos del formulario de contacto se usan únicamente para responder tu consulta. Los datos de analíticas se usan de forma agregada para mejorar la experiencia del sitio. Tus datos nunca se venden a terceros.',
    },
    {
      heading: '3. Servicios de Terceros',
      body: 'Este sitio usa Cloudinary para almacenamiento de imágenes, Hostinger para hosting, Google Analytics para análisis de tráfico y Cloudflare para seguridad y rendimiento. Cada servicio tiene su propia política de privacidad.',
    },
    {
      heading: '4. Retención de Datos',
      body: 'Los envíos del formulario de contacto se conservan hasta 12 meses para dar seguimiento a la comunicación. Puedes solicitar su eliminación en cualquier momento.',
    },
    {
      heading: '5. Tus Derechos',
      body: 'Tienes derecho a acceder, corregir o eliminar cualquier dato personal que tengamos sobre ti. Para ejercer estos derechos, contáctanos a través de la página de contacto.',
    },
    {
      heading: '6. Cookies',
      body: 'Este sitio utiliza únicamente cookies técnicas necesarias para el funcionamiento (p. ej. previsualización de borradores). No se utilizan cookies de publicidad de terceros.',
    },
  ],
  en: [
    {
      heading: '1. Information We Collect',
      body: 'This site collects minimal data: contact form submissions (name, email, message) and anonymous analytics through Google Analytics and Cloudflare Insights. No cookies are set beyond technical session requirements.',
    },
    {
      heading: '2. How We Use Your Data',
      body: 'Contact form data is used solely to respond to your inquiry. Analytics data is used in aggregate to improve the site experience. Your data is never sold to third parties.',
    },
    {
      heading: '3. Third-Party Services',
      body: 'This site uses Cloudinary for image storage, Hostinger for hosting, Google Analytics for traffic analysis, and Cloudflare for security and performance. Each service has its own privacy policy.',
    },
    {
      heading: '4. Data Retention',
      body: 'Contact form submissions are retained for up to 12 months to support follow-up communication. You may request deletion at any time.',
    },
    {
      heading: '5. Your Rights',
      body: 'You have the right to access, correct, or delete any personal data we hold about you. To exercise these rights, contact us via the contact page.',
    },
    {
      heading: '6. Cookies',
      body: 'This site uses only technical cookies required for functionality (e.g. draft mode previews). No third-party advertising cookies are set.',
    },
  ],
}

// Ported verbatim from JuanPortfolio/src/app/(frontend)/[locale]/terms/page.tsx
const termsSections = {
  es: [
    {
      heading: '1. Aceptación de los Términos',
      body: 'Al acceder y utilizar este sitio web (juan-tech.com), aceptas y te comprometes a cumplir con estos Términos de Servicio. Si no estás de acuerdo, por favor no uses este sitio.',
    },
    {
      heading: '2. Servicios',
      body: 'Este sitio web es el portafolio y blog personal de Juan Carlos Angulo, que ofrece contenido técnico, casos de estudio y servicios de consultoría profesional en ingeniería de software y SEO técnico.',
    },
    {
      heading: '3. Propiedad Intelectual',
      body: 'Todo el contenido de este sitio —incluyendo artículos, ejemplos de código, diseños y casos de estudio— es propiedad exclusiva de Juan Carlos Angulo salvo que se indique lo contrario. Puedes citar o referenciar el contenido con la atribución correcta y un enlace al original.',
    },
    {
      heading: '4. Limitación de Responsabilidad',
      body: 'El contenido de este sitio se proporciona únicamente con fines informativos. Juan Carlos Angulo no garantiza la exactitud o completitud del contenido y no será responsable de ningún daño derivado del uso de este sitio.',
    },
    {
      heading: '5. Contacto',
      body: 'Para preguntas sobre estos términos, contáctame a través de la página de contacto.',
    },
  ],
  en: [
    {
      heading: '1. Acceptance of Terms',
      body: 'By accessing and using this website (juan-tech.com), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use this site.',
    },
    {
      heading: '2. Services',
      body: 'This website is a personal portfolio and blog by Juan Carlos Angulo, offering technical content, case studies, and professional consulting services in software engineering and technical SEO.',
    },
    {
      heading: '3. Intellectual Property',
      body: 'All content on this site — including articles, code samples, designs, and case studies — is the exclusive property of Juan Carlos Angulo unless otherwise noted. You may quote or reference content with proper attribution and a link back to the original.',
    },
    {
      heading: '4. Limitation of Liability',
      body: 'The content on this site is provided for informational purposes only. Juan Carlos Angulo makes no warranties about the accuracy or completeness of the content and shall not be liable for any damages arising from the use of this site.',
    },
    {
      heading: '5. Contact',
      body: 'For questions about these terms, please reach out via the contact page.',
    },
  ],
}

async function upsertLegalPage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slug: 'privacy' | 'terms',
  titleByLocale: Record<(typeof LOCALES)[number], string>,
  sectionsByLocale: Record<(typeof LOCALES)[number], { heading: string; body: string }[]>,
) {
  const { docs: existing } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
  })

  let docId = existing[0]?.id

  if (!docId) {
    const created = await payload.create({
      collection: 'pages',
      locale: 'es',
      data: {
        title: titleByLocale.es,
        slug,
        content: {
          layout: [
            {
              blockType: 'content',
              columns: [
                {
                  size: 'full',
                  richText: richTextDoc(sectionsByLocale.es),
                  enableLink: false,
                },
              ],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          ],
        },
      },
    })
    docId = created.id
    console.log(`Created ${slug} Pages doc (id=${docId})`)
  }

  // IMPORTANT: array/block rows (content.layout, columns) are NOT localized
  // themselves — only the nested richText field is. Without passing back the
  // SAME block/column ids on every locale's update, Payload treats each
  // update as a brand-new array (fresh random ids), orphaning the previous
  // locale's localized child rows (last update wins, earlier locale's data
  // silently disappears). Fetch the ids once after the first update, then
  // reuse them for every subsequent locale.
  let blockId: string | undefined
  let columnId: string | undefined

  for (const locale of LOCALES) {
    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: titleByLocale[locale],
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
      const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
      const block = refetched.content?.layout?.[0] as { id?: string; columns?: { id?: string }[] } | undefined
      blockId = block?.id
      columnId = block?.columns?.[0]?.id
    }

    console.log(`Updated ${slug} Pages doc (locale=${locale})`)
  }
}

async function main() {
  const payload = await getPayload({ config })

  await upsertLegalPage(
    payload,
    'privacy',
    { es: 'Política de Privacidad', en: 'Privacy Policy' },
    privacySections,
  )

  await upsertLegalPage(payload, 'terms', { es: 'Términos de Servicio', en: 'Terms of Service' }, termsSections)

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
