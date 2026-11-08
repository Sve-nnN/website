/**
 * Fase 54: sube las 4 fotos del sandbox a Cloudinary (vía la colección Media) y
 * las enlaza en los globals nuevos:
 *
 *   - about-page  hero.photo            <- juan-sobre-mi.webp
 *   - home-page   about.photos[0..2]    <- taller.jpg, escritorio.png, retrato-v2.jpg
 *
 * Solo crea docs nuevos de Media y escribe en globals nuevos. No borra nada.
 *
 * DRY-RUN POR DEFECTO: imprime cada archivo, su tamaño, si se convertirá a WebP
 * y el alt que se va a usar. Con `--apply` exige además `--alts-confirmed`, que
 * significa que Juan leyó cada alt en el dry-run y lo aprobó (el alt de la foto
 * de Sobre mí es un BORRADOR de A11Y-DECISIONS.md).
 *
 * Guardias (CLAUDE.md, Database Safety; incidente 2026-08-17):
 *   - rechaza toda base que no sea la de producción vía túnel o shared-postgres;
 *   - `--apply` exige `--db-checked` (Juan corrió 04-which-database.ts);
 *   - aborta si falta cualquiera de CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y
 *     CLOUDINARY_API_SECRET (solo comprueba presencia, nunca imprime valores).
 *     Sin credenciales, Juan sube por el admin real y enlaza el id aparte.
 *
 * Imágenes pesadas: escritorio.png (1,9 MB, Pitfall 10) se convierte a WebP con
 * sharp, ancho máximo 1600 px, en un directorio temporal del sistema. Nunca se
 * escribe dentro del repo.
 *
 * Idempotente: si el campo destino ya tiene imagen, no sube. Lee con
 * `fallbackLocale: false`, fusiona y envía el grupo completo, y relee para comparar.
 * El efecto sale tras el TTL de 60 s del unstable_cache: verifica contra el HTML.
 *
 * Requiere que el script 20 ya haya sembrado las filas de home-page about.photos.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/21-phase54-upload-media.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/21-phase54-upload-media.ts --apply --db-checked --alts-confirmed
 */
import { existsSync, statSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assertSafeTarget,
  buildDiff,
  findOrCreateMedia,
  formatBytes,
  mergeGroup,
  missingCloudinaryVars,
  prepareImage,
  safeTarget,
} from './data/54-seed-lib'
import { MEDIA_MANIFEST, type PhotoEntry } from './data/54-media-manifest'

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')
const ALTS_CONFIRMED = process.argv.includes('--alts-confirmed')

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

type Row = Record<string, unknown>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readGlobal(payload: any, slug: string): Promise<Record<string, any>> {
  return payload.findGlobal({ slug, locale: 'es', fallbackLocale: false, depth: 0 })
}

function targetLabel(p: PhotoEntry): string {
  return p.target.global === 'about-page'
    ? 'about-page hero.photo'
    : `home-page about.photos[${p.target.index}].image`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function currentImage(p: PhotoEntry, about: Record<string, any>, home: Record<string, any>) {
  if (p.target.global === 'about-page') return about.hero?.photo ?? null
  return home.about?.photos?.[p.target.index]?.image ?? null
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

  const missing = missingCloudinaryVars(process.env)
  if (missing.length > 0) {
    console.error(
      `ABORT: faltan variables de Cloudinary: ${missing.join(', ')} (solo se comprueba presencia).\n` +
        '  Sin credenciales, sube las fotos por el admin real (Media existe en master) y enlaza el id aparte.',
    )
    process.exit(1)
  }
  if (APPLY && !ALTS_CONFIRMED) {
    console.error(
      'ABORT: --apply exige --alts-confirmed. Lee en el dry-run cada alt (el de Sobre mí es un borrador de A11Y-DECISIONS) y aprueba.',
    )
    process.exit(1)
  }

  console.log('\n--- fotos del manifiesto ---')
  const absent: string[] = []
  for (const p of MEDIA_MANIFEST.photos) {
    const abs = resolve(REPO_ROOT, p.file)
    if (!existsSync(abs)) {
      absent.push(p.file)
      console.log(`  FALTA ${p.file}`)
      continue
    }
    console.log(
      `  ${p.key}\n    archivo : ${p.file} (${formatBytes(statSync(abs).size)}, ${p.width}x${p.height})\n    destino : ${targetLabel(p)}\n    WebP    : ${p.heavy ? 'sí, ancho máximo 1600 px' : 'no, se sube tal cual'}\n    alt     : ${p.alt}`,
    )
  }
  if (absent.length > 0) {
    console.error(`ABORT: faltan archivos de origen (el sandbox debe existir en esta máquina): ${absent.join(', ')}`)
    process.exit(1)
  }

  // Import dinámico: nada de Payload se carga si una guardia aborta.
  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  let about: Record<string, unknown>
  let home: Record<string, unknown>
  try {
    about = await readGlobal(payload, 'about-page')
    home = await readGlobal(payload, 'home-page')
  } catch (err) {
    console.error(
      `ABORT leyendo los globals: ${(err as Error).message}\n  (¿la migración phase54_shadow_content ya está aplicada?)`,
    )
    process.exit(1)
  }

  const photosRows = ((home.about as Row | undefined)?.photos as unknown[] | undefined) ?? []
  const pending = MEDIA_MANIFEST.photos.filter((p) => !currentImage(p, about, home))
  console.log('\n--- estado de los destinos ---')
  for (const p of MEDIA_MANIFEST.photos) {
    console.log(`  ${currentImage(p, about, home) ? 'ya tiene imagen' : 'vacío         '}  ${targetLabel(p)}`)
  }

  if (pending.some((p) => p.target.global === 'home-page') && photosRows.length < 3) {
    console.error(
      `ABORT: home-page about.photos tiene ${photosRows.length} filas y se esperan 3. Corre primero el script 20 con --apply.`,
    )
    process.exit(1)
  }
  if (pending.length === 0) {
    console.log('\nNada que subir (idempotente).')
    process.exit(0)
  }
  if (!APPLY) {
    console.log(`\nDRY-RUN: se subirían ${pending.length} foto(s). Vuelve a correr con --apply --db-checked --alts-confirmed.`)
    process.exit(0)
  }

  // ---- escritura ----
  const tmp = await mkdtemp(join(tmpdir(), 'phase54-media-'))
  let ok = true
  try {
    const ids: Record<string, number | string> = {}
    for (const p of pending) {
      const prepared = await prepareImage(resolve(REPO_ROOT, p.file), p.heavy, tmp, `p54-${p.key}`)
      console.log(
        `\n  subiendo ${p.key}: ${formatBytes(prepared.bytes)}${prepared.converted ? ' (convertido a WebP)' : ''}`,
      )
      const media = await findOrCreateMedia(payload, {
        alt: p.alt,
        filePath: prepared.path,
        baseName: `p54-${p.key}`,
      })
      ids[p.key] = media.id
      console.log(`    media #${media.id}${media.reused ? ' (ya existía, reutilizado)' : ' creado'}`)
    }

    // Enlace: releer, fusionar el grupo completo y escribir.
    const aboutPending = pending.find((p) => p.target.global === 'about-page')
    if (aboutPending) {
      const cur = await readGlobal(payload, 'about-page')
      const heroDesired = { photo: ids[aboutPending.key] }
      await payload.updateGlobal({
        slug: 'about-page',
        locale: 'es',
        data: { hero: mergeGroup(cur.hero, heroDesired, 'hero') },
      })
      const after = await readGlobal(payload, 'about-page')
      const diff = buildDiff(after.hero, heroDesired, 'hero')
      console.log(`  ${diff.length === 0 ? 'OK   ' : 'FALLA'} about-page hero.photo releído${diff.length ? `: ${diff.join(', ')}` : ''}`)
      ok = ok && diff.length === 0
    }

    const homePending = pending.filter((p) => p.target.global === 'home-page')
    if (homePending.length > 0) {
      const cur = await readGlobal(payload, 'home-page')
      const rows = ((cur.about?.photos as Row[] | undefined) ?? []).map((_, i) => {
        const p = homePending.find((x) => x.target.global === 'home-page' && x.target.index === i)
        return p ? { image: ids[p.key] } : {}
      })
      const aboutDesired = { photos: rows }
      await payload.updateGlobal({
        slug: 'home-page',
        locale: 'es',
        data: { about: mergeGroup(cur.about, aboutDesired, 'about') },
      })
      const after = await readGlobal(payload, 'home-page')
      const diff = buildDiff(after.about, aboutDesired, 'about')
      const captions = (after.about?.photos as Row[] | undefined)?.[0]?.caption
      console.log(
        `  ${diff.length === 0 ? 'OK   ' : 'FALLA'} home-page about.photos releído${diff.length ? `: ${diff.join(', ')}` : ''}; caption conservado: ${captions ? 'sí' : 'NO'}`,
      )
      ok = ok && diff.length === 0 && Boolean(captions)
    }
  } finally {
    // Solo el directorio temporal que creó este script.
    await rm(tmp, { recursive: true, force: true })
  }

  console.log(
    '\nRecordatorio: el efecto sale tras el TTL de 60 s del unstable_cache. Verifica contra el HTML servido, no contra este OK.',
  )
  process.exit(ok ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
