/**
 * Idempotent upsert (by slug) of the real `contact` Pages doc — without this,
 * /contact has nothing to fetch and 404s regardless of the server action
 * wiring. Not explicitly listed in 05-12-PLAN.md's file list, added as a
 * Rule 2 (missing critical) fix since the contact form literally cannot
 * render without a seeded Pages doc carrying a ContactFormBlock instance.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-contact-page.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

const layoutByLocale: Record<(typeof LOCALES)[number], unknown[]> = {
  es: [
    {
      blockType: 'contactFormBlock',
      eyebrow: 'Contacto',
      title: 'Hablemos',
      description: '¿Tienes un proyecto en mente? Cuéntame de qué se trata.',
      submitLabel: 'Enviar mensaje',
      sidebarTitle: 'Charlemos sobre tu próximo proyecto',
      sidebarDescription: 'Disponible para consultoría en ingeniería de software y SEO técnico.',
      socialProofText: 'Respondo en menos de 48 horas.',
      contactInfo: [
        {
          icon: 'mail',
          title: 'Email',
          value: 'hello@juan-tech.com',
          href: 'mailto:hello@juan-tech.com',
        },
      ],
    },
  ],
  en: [
    {
      blockType: 'contactFormBlock',
      eyebrow: 'Contact',
      title: 'Get in Touch',
      description: 'Have a project in mind? Tell me about it.',
      submitLabel: 'Send message',
      sidebarTitle: "Let's talk about your next project",
      sidebarDescription: 'Available for software engineering and technical SEO consulting.',
      socialProofText: 'I respond within 48 hours.',
      contactInfo: [
        {
          icon: 'mail',
          title: 'Email',
          value: 'hello@juan-tech.com',
          href: 'mailto:hello@juan-tech.com',
        },
      ],
    },
  ],
}

async function main() {
  const payload = await getPayload({ config })

  const { docs: existing } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'contact' } },
    limit: 1,
  })

  let docId = existing[0]?.id

  if (!docId) {
    const created = await payload.create({
      collection: 'pages',
      locale: 'es',
      data: {
        title: 'Contacto',
        slug: 'contact',
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layoutByLocale.es as any,
        },
      },
    })
    docId = created.id
    console.log(`Created contact Pages doc (id=${docId})`)
  }

  // Reuse the same block ids across every locale's update — see 05-12's
  // fix in seed-home-page.ts for the full explanation (otherwise each
  // locale's write orphans the previous locale's localized fields).
  let savedIds: { id?: string }[] | undefined

  for (const locale of LOCALES) {
    const layout = layoutByLocale[locale] as Record<string, unknown>[]

    if (savedIds) {
      layout.forEach((block, i) => {
        if (savedIds![i]?.id) block.id = savedIds![i].id
      })
    }

    await payload.update({
      collection: 'pages',
      id: docId,
      locale,
      data: {
        title: locale === 'es' ? 'Contacto' : 'Contact',
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layout as any,
        },
      },
    })

    if (!savedIds) {
      const refetched = await payload.findByID({ collection: 'pages', id: docId, depth: 0 })
      savedIds = refetched.content?.layout as { id?: string }[] | undefined
    }

    console.log(`Updated contact Pages doc (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
