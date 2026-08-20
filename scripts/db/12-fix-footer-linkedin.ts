/**
 * Corrige el LinkedIn del footer en producción (issue #3.2).
 *
 * El perfil real es linkedin.com/in/juancangulo. El footer sirve
 * linkedin.com/in/juancarlosangulo, que no es de Juan, en los dos idiomas.
 * Vino de `scripts/seed-header-footer-content.ts`, que sembraba el handle mal
 * escrito mientras `seed-author-eeat.ts` sembraba el correcto en el `sameAs`
 * del schema. En /authors/juan-carlos-angulo convivían los dos.
 *
 * El seed ya quedó corregido, pero re-sembrarlo pisaría columnas, links legales
 * y copyright que se editaron en el admin desde entonces. Este script toca UNA
 * sola cosa: la URL de la red social, y solo si es la incorrecta.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/12-fix-footer-linkedin.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/12-fix-footer-linkedin.ts --apply
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

const WRONG = 'juancarlosangulo'
const CORRECT_URL = 'https://linkedin.com/in/juancangulo'

async function main() {
  const payload = await getPayload({ config })
  console.log(`${APPLY ? '=== APLICANDO' : '=== DRY-RUN (nada se escribe)'} ===`)

  for (const locale of ['es', 'en'] as const) {
    const footer = await payload.findGlobal({ slug: 'footer', locale })
    const links = footer.socialLinks ?? []

    console.log(`\n--- footer [${locale}] ---`)
    for (const link of links) console.log(`  ${link.platform}: ${link.url}`)

    const needsFix = links.some((link) => link.url?.includes(WRONG))
    if (!needsFix) {
      console.log('  sin el handle incorrecto, no hay nada que hacer')
      continue
    }

    const fixed = links.map((link) =>
      link.url?.includes(WRONG) ? { ...link, url: CORRECT_URL } : link,
    )

    if (!APPLY) {
      console.log('  quedaría:')
      for (const link of fixed) console.log(`    ${link.platform}: ${link.url}`)
      continue
    }

    await payload.updateGlobal({ slug: 'footer', locale, data: { socialLinks: fixed } })

    const after = await payload.findGlobal({ slug: 'footer', locale })
    const stillWrong = (after.socialLinks ?? []).some((link) => link.url?.includes(WRONG))
    console.log(`  escrito. ¿Sigue el handle incorrecto? ${stillWrong ? 'SÍ' : 'no'}`)
    if (stillWrong) process.exitCode = 1
  }

  if (!APPLY) console.log('\nCorré con --apply para escribir.')
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
