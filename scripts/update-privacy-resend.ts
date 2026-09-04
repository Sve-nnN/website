/**
 * Phase 46 Plan 02, Task 4 — extends the `privacy` Pages doc (both locales)
 * with 2 new sections covering the newsletter sign-up form, Resend as data
 * processor for that delivery, and the retention/opt-out process (LEG-03).
 *
 * Payload replaces the full `richText` tree on every `update()` — omitting
 * the existing 6 sections here would delete them from production. This
 * script reproduces those 6 sections VERBATIM from
 * `scripts/humanize-legal-pages.ts` (its `privacySections`, lines 64-117)
 * and appends 2 new ones per locale, keeping heading/order/count of the
 * existing sections untouched.
 *
 * Lexical builder helpers (`heading`/`paragraph`/`richTextDoc`) and the
 * blockId/columnId reuse-across-locales discipline are copied verbatim from
 * `scripts/humanize-legal-pages.ts`.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/update-privacy-resend.ts
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

// Las 6 secciones existentes, copiadas VERBATIM de
// scripts/humanize-legal-pages.ts (privacySections, líneas 64-117) — NO se
// tocan. Se agregan 2 secciones nuevas al final de cada locale (LEG-03).
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
    {
      heading: '7. Formulario de Alta al Correo',
      body: 'Si te suscribes al blog, te pido tu email y guardo el idioma en el que te diste de alta. Los uso solo para avisarte cuando publico contenido nuevo. El envío de esos correos pasa por Resend, que actúa como encargado del tratamiento: procesa el envío en mi nombre y no usa tu email para nada más.',
    },
    {
      heading: '8. Retención y Baja',
      body: 'Guardo tu email mientras tu suscripción siga activa, dentro de los mismos 12 meses que ya menciono en la sección 4. Puedes darte de baja cuando quieras con el enlace que trae cada correo, o escribiéndome desde la página de contacto.',
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
    {
      heading: '7. Newsletter Sign-up Form',
      body: "If you subscribe to the blog, I ask for your email and store the language you signed up in. I only use them to let you know when I publish new content. Sending those emails goes through Resend, which acts as data processor: it handles delivery on my behalf and doesn't use your email for anything else.",
    },
    {
      heading: '8. Retention and Opt-Out',
      body: 'I keep your email while your subscription stays active, within the same 12 months I already mention in section 4. You can unsubscribe anytime using the link in any email, or by writing to me through the contact page.',
    },
  ],
}

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'privacy' } },
    limit: 1,
  })

  const doc = docs[0]

  if (!doc) {
    console.error("No se encontró el Pages doc `privacy` -- no se puede actualizar. Abortando.")
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
                  richText: richTextDoc(privacySections[locale]),
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

    console.log(`Updated privacy Pages doc (locale=${locale}) with sections 7-8`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
