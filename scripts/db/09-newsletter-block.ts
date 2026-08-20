/**
 * Pone el bloque de alta al correo en el layout del blog, con su copy y su
 * texto de consentimiento.
 *
 * Hasta ahora el bloque existía en el CMS pero NO estaba en ninguna página, a
 * propósito: el alta no estaba cableada y un formulario que responde "listo" y
 * tira el correo es peor que no tener formulario. Ya está cableada (colección
 * `subscribers` + doble opt-in + baja en un clic), así que entra.
 *
 * Va DESPUÉS de las filas por categoría y antes de la banda de cierre: el
 * visitante ya vio el contenido, y la banda de auditoría sigue siendo el último
 * pedido de la página.
 *
 * MISMO ORDEN QUE 08: inglés primero, después español. Escribir el array de
 * bloques con ids en el locale secundario falla igual que allá. Ver la cabecera
 * de 08-blog-promo-by-category.ts.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/09-newsletter-block.ts --locale en --apply
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/09-newsletter-block.ts --locale es --apply
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

const COPY = {
  es: {
    title: 'Un correo cuando publico algo que sirve',
    description:
      'Sin calendario fijo ni resúmenes de novedades ajenas. Te escribo cuando termino un artículo que resuelve un problema concreto de SEO técnico o de desarrollo.',
    emailLabel: 'Tu correo',
    submitLabel: 'Quiero recibirlo',
    consentText:
      'Te llega un correo para confirmar la dirección. Guardo solo tu correo y el idioma, no lo comparto con nadie, y cada envío lleva un enlace para darte de baja en un clic.',
  },
  en: {
    title: 'An email when I publish something worth reading',
    description:
      'No fixed schedule and no roundups of other people\u2019s news. I write when I finish an article that solves a concrete technical SEO or development problem.',
    emailLabel: 'Your email',
    submitLabel: 'Send it to me',
    consentText:
      'You get one email to confirm the address. I store only your email and language, I do not share it with anyone, and every send carries a one-click unsubscribe link.',
  },
} as const

async function main() {
  const payload = await getPayload({ config })
  console.log(`${APPLY ? '=== APLICANDO' : '=== DRY-RUN (nada se escribe)'} — locale ${LOCALE} ===`)

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'blog' } },
    limit: 1,
    locale: LOCALE,
    depth: 0,
  })

  const page = docs[0] as
    | { id: number; content?: { layout?: Record<string, unknown>[] } }
    | undefined

  if (!page) {
    console.error('ABORT: no existe la página con slug "blog"')
    process.exit(1)
  }

  const layout = page.content?.layout ?? []
  const rowsIndex = layout.findIndex((b) => b.blockType === 'blogCategoryRows')

  if (rowsIndex === -1) {
    console.error('ABORT: la página blog no tiene el bloque blogCategoryRows. Corré 06 primero.')
    process.exit(1)
  }

  const already = layout.findIndex((b) => b.blockType === 'newsletterBlock')
  const t = COPY[LOCALE]

  const newsletterBlock: Record<string, unknown> = {
    ...(already !== -1 ? { id: layout[already].id } : {}),
    blockType: 'newsletterBlock',
    title: t.title,
    description: t.description,
    emailLabel: t.emailLabel,
    submitLabel: t.submitLabel,
    consentText: t.consentText,
  }

  const next =
    already !== -1
      ? layout.map((b, i) => (i === already ? newsletterBlock : b))
      : [...layout.slice(0, rowsIndex + 1), newsletterBlock, ...layout.slice(rowsIndex + 1)]

  console.log(`  antes:   ${layout.map((b) => b.blockType).join(' -> ')}`)
  console.log(`  después: ${next.map((b) => b.blockType).join(' -> ')}`)

  if (!APPLY) {
    console.log('\nDry-run terminado. Volvé a correr con --apply para escribir.')
    process.exit(0)
  }

  await payload.update({
    collection: 'pages',
    id: page.id,
    locale: LOCALE,
    draft: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { content: { layout: next } } as any,
  })

  // ---- verificación sobre el estado publicado ----
  const { docs: after } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'blog' } },
    limit: 1,
    locale: LOCALE,
    depth: 0,
    overrideAccess: false,
  })

  const finalLayout =
    (after[0] as { content?: { layout?: { blockType: string; title?: string }[] } })?.content
      ?.layout ?? []
  const block = finalLayout.find((b) => b.blockType === 'newsletterBlock')
  const ok = Boolean(block) && block?.title === t.title

  console.log('\n=== VERIFICACIÓN ===')
  console.log(`  ${ok ? 'OK  ' : 'FALLA'} [${LOCALE}] ${finalLayout.map((b) => b.blockType).join(' -> ')}`)
  process.exit(ok ? 0 : 1)
}

main()
