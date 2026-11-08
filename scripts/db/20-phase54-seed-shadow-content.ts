/**
 * Fase 54: siembra el contenido sombra (copy aprobado del sandbox) en la base.
 *
 * Qué escribe, y solo esto:
 *   - global `home-page`  (copy ES de la home y de Contacto)
 *   - global `about-page` (copy ES de Sobre mí)
 *   - `clientes.onDark`   (logos claros que necesitan chip oscuro)
 *
 * Nada existente se sobrescribe: los globals son nuevos y `onDark` es una
 * columna nueva. Este script NO borra nada (ninguna operación de borrado de
 * la Local API) y solo escribe ES: el inglés cae al español por el respaldo.
 *
 * DRY-RUN POR DEFECTO. Sin `--apply` solo lee e imprime el diff.
 *
 * Seguridad de la base (CLAUDE.md, Database Safety; incidente 2026-08-17):
 *   - Imprime contra qué base apunta (host, puerto y nombre, nunca usuario ni
 *     contraseña) y rechaza toda base que no sea la de producción vía túnel o
 *     shared-postgres, ANTES de abrir ninguna conexión.
 *   - `--apply` exige `--db-checked`: Juan confirma que corrió
 *       node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts
 *
 * Trampas de scripts contra Payload (memoria del proyecto):
 *   - `fallbackLocale: false` cuando la lectura decide si escribir.
 *   - `draft: false` en todo update de colecciones con borradores.
 *   - El grupo se envía COMPLETO (leído y fusionado), nunca parcial.
 *   - Cada escritura vuelve a leer y compara.
 *   - Las escrituras por script no invalidan el tag de `unstable_cache`: el
 *     efecto sale tras el TTL de 60 s. Verificar contra el HTML servido, no
 *     contra el OK de este script.
 *
 * Requiere el túnel a producción (./scripts/db/tunnel.sh) y la migración
 * phase54_shadow_content ya aplicada (plan 54-07).
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/20-phase54-seed-shadow-content.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/20-phase54-seed-shadow-content.ts --apply --db-checked
 */
import {
  assertNoForbiddenChars,
  assertSafeTarget,
  buildDiff,
  mergeGroup,
  safeTarget,
} from './data/54-seed-lib'
import { HOME_COPY_ES } from './data/54-home-copy'

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')

type Copy = Record<string, unknown>

const GLOBALS: { slug: 'home-page'; copy: Copy }[] = [{ slug: 'home-page', copy: HOME_COPY_ES }]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedGlobal(payload: any, slug: string, copy: Copy): Promise<boolean> {
  const current = (await payload.findGlobal({
    slug,
    locale: 'es',
    fallbackLocale: false,
    depth: 0,
  })) as Record<string, unknown>

  const data: Record<string, unknown> = {}
  console.log(`\n--- global ${slug} (locale es) ---`)
  for (const key of Object.keys(copy)) {
    const diff = buildDiff(current[key], copy[key], key)
    if (diff.length === 0) {
      console.log(`  igual   ${key}`)
      continue
    }
    console.log(`  difiere ${key}: ${diff.length} campo(s)${diff.length <= 6 ? ` -> ${diff.join(', ')}` : ''}`)
    // Grupo COMPLETO: lo leído fusionado con el copy, nunca un grupo parcial.
    data[key] = mergeGroup(current[key], copy[key], key)
  }

  if (Object.keys(data).length === 0) {
    console.log('  nada que escribir (idempotente)')
    return true
  }
  if (!APPLY) {
    console.log('  DRY-RUN: no se escribe. Vuelve a correr con --apply --db-checked.')
    return true
  }

  await payload.updateGlobal({ slug, locale: 'es', data })

  const after = (await payload.findGlobal({
    slug,
    locale: 'es',
    fallbackLocale: false,
    depth: 0,
  })) as Record<string, unknown>
  const remaining = buildDiff(after, copy)
  console.log(
    remaining.length === 0
      ? `  OK   ${slug}: releído y comparado, sin diferencias`
      : `  FALLA ${slug}: tras escribir siguen difiriendo ${remaining.join(', ')}`,
  )
  return remaining.length === 0
}

async function main() {
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (nada se escribe)'} ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)

  try {
    assertSafeTarget(process.env.DATABASE_URI, APPLY, DB_CHECKED)
  } catch (err) {
    console.error(`ABORT: ${(err as Error).message}`)
    process.exit(1)
  }

  for (const g of GLOBALS) assertNoForbiddenChars(g.copy)

  // Import dinámico: nada de Payload se carga si la guardia de base aborta.
  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  let allOk = true
  for (const g of GLOBALS) {
    try {
      allOk = (await seedGlobal(payload, g.slug, g.copy)) && allOk
    } catch (err) {
      console.error(
        `ABORT en ${g.slug}: ${(err as Error).message}\n  (¿la migración phase54_shadow_content ya está aplicada?)`,
      )
      process.exit(1)
    }
  }

  if (APPLY) {
    console.log(
      '\nRecordatorio: el efecto sale tras el TTL de 60 s del unstable_cache. Verifica contra el HTML servido, no contra este OK.',
    )
  }
  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
