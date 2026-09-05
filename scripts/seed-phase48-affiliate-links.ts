/**
 * Phase 48 Plan 02, Task 1 — STACK-02..06:
 *
 * Crea/actualiza los 6 docs `affiliate-links` restantes que necesita el
 * ToolStack block completo (DataForSEO, Payload, Cloudinary, Resend, Ahrefs,
 * Google Search Console). DinoRANK ya existe desde Plan 48-01
 * (scripts/seed-phase48-tracer.ts) y no se toca acá.
 *
 * Idempotente: si un doc con ese `slug` ya existe, se actualiza en vez de
 * duplicarse (mismo patrón defensivo find-then-create-or-update que
 * seed-phase48-tracer.ts). `cookieWindowDays`/`commissionNote` son campos
 * internos NO localizados: se escriben una sola vez en el write de locale
 * 'es' (o en el update inicial), nunca se repiten en el write de 'en'.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-affiliate-links.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

type Destination = { marketplace: string; url: string }

interface AffiliateLinkSeed {
  name: string
  slug: string
  program: string
  placement: 'stack-page'
  destinations: Destination[]
  commissionNote: string
  tagline?: Record<Locale, string>
  ctaLabel?: Record<Locale, string>
  whyIUseIt?: Record<Locale, string>
}

const SEEDS: AffiliateLinkSeed[] = [
  {
    name: 'DataForSEO',
    slug: 'dataforseo',
    program: 'dataforseo',
    placement: 'stack-page',
    destinations: [
      { marketplace: 'default', url: 'https://dataforseo.com/?aff=1b6bcf57-3342-484a-b84b-44885374c08c' },
      {
        marketplace: 'platform',
        url: 'https://app.dataforseo.com/?aff=1b6bcf57-3342-484a-b84b-44885374c08c',
      },
      {
        marketplace: 'sheets',
        url: 'https://dataforseo.com/google-sheets-connector?connector_aff=1b6bcf57-3342-484a-b84b-44885374c08c',
      },
    ],
    commissionNote: 'Comisión por referido (aff). Recarga mínima $50.',
    tagline: {
      es: 'Datos de keywords al por mayor, con tokens que no vencen',
      en: 'Bulk keyword data, tokens that never expire',
    },
    ctaLabel: { es: 'Probar DataForSEO', en: 'Try DataForSEO' },
  },
  {
    name: 'Payload',
    slug: 'payload',
    program: 'payload',
    placement: 'stack-page',
    destinations: [{ marketplace: 'default', url: 'https://payloadcms.com' }],
    commissionNote: 'Sin programa de afiliados — link directo.',
    tagline: {
      es: 'El CMS que reemplazó a WordPress en mi stack',
      en: 'The CMS that replaced WordPress in my stack',
    },
    ctaLabel: { es: 'Ver Payload CMS', en: 'See Payload CMS' },
  },
  {
    name: 'Cloudinary',
    slug: 'cloudinary',
    program: 'cloudinary',
    placement: 'stack-page',
    destinations: [
      {
        marketplace: 'default',
        url: 'https://cloudinary.com/invites/lpov9zyyucivvxsnalc5/odxm3irnpy6wjrctdf8y?t=default',
      },
    ],
    commissionNote:
      'Créditos por referido (hasta 60), NO comisión en dinero — no confundir con comisión monetaria en ningún copy visible.',
    tagline: {
      es: 'Edición de imágenes on-the-fly, incluidas las OG images del sitio',
      en: "On-the-fly image editing, including the site's own OG images",
    },
    ctaLabel: { es: 'Probar Cloudinary', en: 'Try Cloudinary' },
  },
  {
    name: 'Resend',
    slug: 'resend',
    program: 'resend',
    placement: 'stack-page',
    destinations: [{ marketplace: 'default', url: 'https://resend.com' }],
    commissionNote: 'Sin programa de afiliados — link directo.',
    tagline: {
      es: 'Correo transaccional simple y con buena entrega',
      en: 'Simple transactional email with solid delivery',
    },
    ctaLabel: { es: 'Probar Resend', en: 'Try Resend' },
  },
  {
    name: 'Ahrefs',
    slug: 'ahrefs',
    program: 'ahrefs',
    placement: 'stack-page',
    destinations: [{ marketplace: 'default', url: 'https://ahrefs.com' }],
    commissionNote: 'Sin programa de afiliados (cerrado) — link directo.',
    tagline: {
      es: 'Para ver cómo escala un proyecto de cliente desde el día uno',
      en: "For tracking how a client project scales from day one",
    },
    ctaLabel: { es: 'Ver Ahrefs', en: 'See Ahrefs' },
  },
  {
    name: 'Google Search Console',
    slug: 'google-search-console',
    program: 'google-search-console',
    placement: 'stack-page',
    destinations: [],
    commissionNote: 'Sin programa de afiliados — recomendación sin comisión (STACK-04).',
    whyIUseIt: {
      es: 'Uso Google Search Console todos los días. Es gratis, no tiene ningún programa de afiliados y aun así es la herramienta que más consulto para entender cómo indexa Google mis sitios y los de mis clientes. La recomiendo sin ganar nada a cambio, porque de verdad es parte de mi flujo de trabajo diario.',
      en: 'I use Google Search Console every day. It is free, has no affiliate program of any kind, and it is still the tool I check most to understand how Google indexes my sites and my clients’ sites. I recommend it without earning anything from it, because it genuinely is part of my daily workflow.',
    },
    // Esta card nunca muestra CTA de ningún tipo (per Plan 48-01 Task 2) —
    // ctaLabel/tagline quedan intencionalmente sin escribir.
  },
]

async function upsertAffiliateLink(payload: Awaited<ReturnType<typeof getPayload>>, seed: AffiliateLinkSeed) {
  const { docs } = await payload.find({
    collection: 'affiliate-links',
    where: { slug: { equals: seed.slug } },
    limit: 1,
  })

  const baseData = {
    name: seed.name,
    slug: seed.slug,
    program: seed.program as never,
    active: true,
    placement: seed.placement,
    destinations: seed.destinations,
    commissionNote: seed.commissionNote,
  }

  let docId: number | string

  if (docs.length === 0) {
    const created = await payload.create({
      collection: 'affiliate-links',
      locale: 'es',
      data: {
        ...baseData,
        tagline: seed.tagline?.es,
        ctaLabel: seed.ctaLabel?.es,
        whyIUseIt: seed.whyIUseIt?.es,
      },
    })
    docId = created.id
    console.log(`Created affiliate-links doc slug=${seed.slug} (id=${docId})`)
  } else {
    docId = docs[0].id
    console.log(`affiliate-links doc slug=${seed.slug} ya existe (id=${docId}) — actualizando`)
    await payload.update({
      collection: 'affiliate-links',
      id: docId,
      locale: 'es',
      data: {
        ...baseData,
        tagline: seed.tagline?.es,
        ctaLabel: seed.ctaLabel?.es,
        whyIUseIt: seed.whyIUseIt?.es,
      },
    })
  }

  await payload.update({
    collection: 'affiliate-links',
    id: docId,
    locale: 'en',
    data: {
      tagline: seed.tagline?.en,
      ctaLabel: seed.ctaLabel?.en,
      whyIUseIt: seed.whyIUseIt?.en,
    },
  })

  return docId
}

async function main() {
  const payload = await getPayload({ config })

  for (const seed of SEEDS) {
    await upsertAffiliateLink(payload, seed)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
