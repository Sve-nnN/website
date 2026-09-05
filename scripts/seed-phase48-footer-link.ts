/**
 * Phase 48 Plan 02, Task 3 (Paso 1) — STACK-05:
 *
 * Agrega la entrada "Mi stack"/"My stack" -> /stack al Footer global,
 * PRESERVANDO el resto de `legalLinks` (Privacidad/Términos) con sus ids
 * existentes intactos. `updateGlobal` reemplaza el array completo, así que
 * este script SIEMPRE lee el array vigente primero y hace push de la nueva
 * entrada, nunca reconstruye el array desde cero — la reconstrucción desde
 * cero ya causó pérdida de contenido bilingüe en este proyecto (Fases
 * 5/13/14/19/21/40, ver STATE.md).
 *
 * Idempotente: si ya existe una entrada con href='/stack', no duplica.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-footer-link.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const STACK_LABEL: Record<Locale, string> = {
  es: 'Mi stack',
  en: 'My stack',
}

async function upsertFooterStackLink(payload: Awaited<ReturnType<typeof getPayload>>, locale: Locale) {
  const footer = await payload.findGlobal({ slug: 'footer', locale })
  const existingLegalLinks = (footer.legalLinks ?? []) as { id?: string | null; label: string; href: string }[]

  const existingIndex = existingLegalLinks.findIndex((link) => link.href === '/stack')

  // IMPORTANTE: `href` NO es localized en el schema de Footer.legalLinks,
  // así que la fila (incluido su `id`) es compartida entre locales — solo
  // `label` varía por locale. Si el check de idempotencia se basara
  // únicamente en "¿ya existe href=/stack?" y saltara el write completo, el
  // SEGUNDO locale procesado nunca escribiría su propio `label` y quedaría
  // con el valor del PRIMER locale (bug real encontrado al verificar: el
  // primer run dejó el label en inglés mostrando "Mi stack"). Por eso acá
  // SIEMPRE se escribe/actualiza el label de ESTE locale, exista o no la
  // fila todavía — solo el `push` de una fila nueva es lo que se evita al
  // re-correr.
  let updatedLegalLinks: { id?: string | null; label: string; href: string }[]

  if (existingIndex === -1) {
    updatedLegalLinks = [...existingLegalLinks, { label: STACK_LABEL[locale], href: '/stack' }]
    console.log(`Footer.legalLinks (locale=${locale}): agregando fila nueva -> ${STACK_LABEL[locale]}`)
  } else if (existingLegalLinks[existingIndex].label !== STACK_LABEL[locale]) {
    updatedLegalLinks = existingLegalLinks.map((link, i) =>
      i === existingIndex ? { ...link, label: STACK_LABEL[locale] } : link,
    )
    console.log(
      `Footer.legalLinks (locale=${locale}): fila /stack ya existe con label incorrecto ("${existingLegalLinks[existingIndex].label}") — corrigiendo a "${STACK_LABEL[locale]}"`,
    )
  } else {
    console.log(`Footer.legalLinks (locale=${locale}) ya tiene /stack con el label correcto — no-op.`)
    return
  }

  await payload.updateGlobal({
    slug: 'footer',
    locale,
    data: { legalLinks: updatedLegalLinks },
  })
}

async function main() {
  const payload = await getPayload({ config })

  for (const locale of LOCALES) {
    await upsertFooterStackLink(payload, locale)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
