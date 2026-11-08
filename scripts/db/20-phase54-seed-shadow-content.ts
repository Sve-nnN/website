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
  assertPendingMarkersOnlyIn,
  assertSafeTarget,
  buildDiff,
  mergeGroup,
  normalizeName,
  safeTarget,
} from './data/54-seed-lib'
import { ABOUT_COPY_ES, ABOUT_PENDING_PATHS } from './data/54-about-copy'
import { HOME_COPY_ES, SANDBOX_LOGOS } from './data/54-home-copy'

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')

type Copy = Record<string, unknown>

const GLOBALS: { slug: 'home-page' | 'about-page'; copy: Copy; pendingPaths: readonly string[] }[] = [
  { slug: 'home-page', copy: HOME_COPY_ES, pendingPaths: [] },
  { slug: 'about-page', copy: ABOUT_COPY_ES, pendingPaths: ABOUT_PENDING_PATHS },
]

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

/**
 * Mapeo de `clientes.onDark` por nombre normalizado (supuesto A8 de RESEARCH).
 * Imprime la tabla COMPLETA para que Juan la revise a mano antes de aplicar.
 * Un nombre ambiguo (un logo del sandbox que coincide con más de un cliente)
 * aborta. Solo escribe `onDark: true` en los coincidentes que aún no lo tienen.
 *
 * Se divide en plan (solo lectura, corre ANTES de cualquier escritura para que
 * una ambigüedad aborte sin dejar nada a medias) y escritura.
 */
type OnDarkWrite = { id: number | string; name: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function planOnDark(payload: any): Promise<{ ok: boolean; toWrite: OnDarkWrite[] }> {
  const res = await payload.find({
    collection: 'clientes',
    limit: 100,
    depth: 0,
    fallbackLocale: false,
    pagination: false,
  })
  const clients = res.docs as { id: number | string; name: string; onDark?: boolean | null }[]

  const byNorm = new Map<string, typeof clients>()
  for (const c of clients) {
    const key = normalizeName(c.name)
    byNorm.set(key, [...(byNorm.get(key) ?? []), c])
  }

  console.log(`\n--- clientes.onDark (${clients.length} clientes, ${SANDBOX_LOGOS.length} logos del sandbox) ---`)
  console.log('  Revisa esta tabla a mano antes de aplicar (supuesto A8).')

  const ambiguous: string[] = []
  const toWrite: OnDarkWrite[] = []
  const matchedClientIds = new Set<number | string>()

  for (const logo of SANDBOX_LOGOS) {
    const base = logo.file.replace(/\.[a-z0-9]+$/i, '')
    // Se prueba por nombre de archivo y por alt; si ambos apuntan a clientes distintos es ambiguo.
    const hits = new Map<number | string, (typeof clients)[number]>()
    for (const key of [normalizeName(base), normalizeName(logo.alt)]) {
      for (const c of byNorm.get(key) ?? []) hits.set(c.id, c)
    }
    const list = [...hits.values()]
    const flag = logo.onDark ? 'onDark' : '      '
    if (list.length === 0) {
      console.log(`  ${flag}  ${logo.file.padEnd(36)} SIN COINCIDENCIA`)
    } else if (list.length > 1) {
      console.log(`  ${flag}  ${logo.file.padEnd(36)} AMBIGUO -> ${list.map((c) => `${c.name} (#${c.id})`).join(' | ')}`)
      ambiguous.push(logo.file)
    } else {
      const c = list[0]
      matchedClientIds.add(c.id)
      const state = c.onDark ? 'ya tiene onDark' : logo.onDark ? 'se marcará onDark' : 'sin cambio'
      console.log(`  ${flag}  ${logo.file.padEnd(36)} -> ${c.name} (#${c.id}) [${state}]`)
      if (logo.onDark && !c.onDark) toWrite.push({ id: c.id, name: c.name })
    }
  }

  const duplicates = [...byNorm.entries()].filter(([, v]) => v.length > 1)
  for (const [key, v] of duplicates) {
    console.log(`  aviso: nombres normalizados repetidos entre clientes (${key}): ${v.map((c) => `#${c.id}`).join(', ')}`)
  }
  const unmatched = clients.filter((c) => !matchedClientIds.has(c.id))
  console.log(`  clientes sin logo del sandbox: ${unmatched.length} (no se tocan)`)

  if (ambiguous.length > 0) {
    console.error(`ABORT: nombre ambiguo en ${ambiguous.join(', ')}. No se escribe nada.`)
    return { ok: false, toWrite: [] }
  }
  const missingOnDark = SANDBOX_LOGOS.filter((l) => l.onDark).filter((l) => {
    const base = l.file.replace(/\.[a-z0-9]+$/i, '')
    return !(byNorm.has(normalizeName(base)) || byNorm.has(normalizeName(l.alt)))
  })
  if (missingOnDark.length > 0) {
    console.log(`  aviso: logo claro sin cliente: ${missingOnDark.map((l) => l.file).join(', ')}`)
  }

  if (toWrite.length === 0) console.log('  nada que escribir (idempotente)')
  else if (!APPLY) console.log(`  DRY-RUN: se marcaría onDark en ${toWrite.map((c) => c.name).join(', ')}.`)
  return { ok: true, toWrite }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function writeOnDark(payload: any, toWrite: OnDarkWrite[]): Promise<boolean> {
  let ok = true
  for (const c of toWrite) {
    await payload.update({
      collection: 'clientes',
      id: c.id,
      data: { onDark: true },
      draft: false,
      fallbackLocale: false,
    })
    const after = await payload.findByID({
      collection: 'clientes',
      id: c.id,
      depth: 0,
      fallbackLocale: false,
    })
    const good = after.onDark === true
    ok = ok && good
    console.log(`  ${good ? 'OK   ' : 'FALLA'} clientes #${c.id} ${c.name}: onDark releído = ${after.onDark}`)
  }
  return ok
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

  // Antes de escribir: sin guiones ni marcadores de ranura del sandbox. El único
  // marcador pendiente permitido es la fecha de la etapa de aprendoclub.
  for (const g of GLOBALS) {
    assertNoForbiddenChars(g.copy, g.pendingPaths)
    assertPendingMarkersOnlyIn(g.copy, g.pendingPaths)
  }

  // Import dinámico: nada de Payload se carga si la guardia de base aborta.
  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  // Plan de clientes.onDark (solo lectura) ANTES de cualquier escritura: una
  // ambigüedad aborta sin dejar los globals sembrados a medias.
  let onDarkPlan: { ok: boolean; toWrite: OnDarkWrite[] }
  try {
    onDarkPlan = await planOnDark(payload)
  } catch (err) {
    console.error(
      `ABORT leyendo clientes: ${(err as Error).message}\n  (¿la migración phase54_shadow_content ya está aplicada?)`,
    )
    process.exit(1)
  }
  if (!onDarkPlan.ok) process.exit(1)

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

  if (APPLY && onDarkPlan.toWrite.length > 0) {
    try {
      allOk = (await writeOnDark(payload, onDarkPlan.toWrite)) && allOk
    } catch (err) {
      console.error(`ABORT escribiendo clientes.onDark: ${(err as Error).message}`)
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
