/**
 * Fase 54: sube los 9 logos de herramientas del stack a Cloudinary (Media) y
 * enlaza cada uno al campo nuevo `logo` de `categoryGroups[].tools[]` del doc
 * `stack` de la colección pages.
 *
 * ES UNA ESCRITURA A UN DOC LIVE con bloques localizados (Pitfall 8 de
 * RESEARCH). Por eso tiene guardias que ninguno de los otros scripts de la fase
 * necesita:
 *
 *   1. Lee el doc `stack` en EN y en ES con `fallbackLocale: false`,
 *      `draft: false` y `depth: 0`, y localiza el bloque toolStack.
 *   2. Calcula el layout nuevo agregando SOLO la clave `logo` a las herramientas
 *      cuyo nombre normalizado coincide con el de un logo del manifiesto.
 *   3. ANTES de escribir compara el layout nuevo contra el actual ignorando solo
 *      las claves `logo`. Si queda cualquier otra diferencia (ids de bloque,
 *      orden, textos), o si `_status` no es `published`, ABORTA y no escribe.
 *   4. Escribe en el mismo orden que scripts/db/09-newsletter-block.ts: inglés
 *      primero y español después (el array con ids falla si se escribe primero
 *      en el locale secundario), con `draft: false` en cada update.
 *   5. Tras CADA escritura relee ambos locales, vuelve a comparar (el otro
 *      locale no debe haber cambiado) y confirma que `_status` sigue en
 *      `published`. Si algo no cuadra se detiene sin escribir el locale que
 *      falta e informa: NO cae en silencio a otra opción (la opción B del plan,
 *      servir los logos desde public/img/stack, la decide Juan).
 *
 * Nunca llama a una operación de borrado. Solo crea docs nuevos de Media y
 * actualiza el doc `stack`.
 *
 * Guardias de base y de Cloudinary: iguales a las del script 21 (rechaza toda
 * base que no sea la de producción vía túnel o shared-postgres, `--apply` exige
 * `--db-checked`, y aborta si falta cualquiera de CLOUDINARY_CLOUD_NAME,
 * CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET; solo se comprueba presencia).
 *
 * DRY-RUN POR DEFECTO. El efecto sale tras el TTL de 60 s del unstable_cache:
 * verifica contra el HTML servido de /stack, no contra el OK de este script.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/22-phase54-stack-logos.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/22-phase54-stack-logos.ts --apply --db-checked
 */
import { existsSync, statSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  assertSafeTarget,
  findOrCreateMedia,
  formatBytes,
  layoutDiffIgnoring,
  missingCloudinaryVars,
  normalizeName,
  prepareImage,
  safeTarget,
} from './data/54-seed-lib'
import { MEDIA_MANIFEST } from './data/54-media-manifest'

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const WEBP_THRESHOLD_BYTES = 20 * 1024
// Orden de escritura de 09-newsletter-block.ts: inglés primero y español después.
const WRITE_ORDER = ['en', 'es'] as const
type Locale = (typeof WRITE_ORDER)[number]

type Tool = Record<string, unknown> & { name?: string; logo?: unknown }
type Block = Record<string, unknown> & { blockType?: string; categoryGroups?: { tools?: Tool[] }[] }
type StackDoc = {
  id: number | string
  _status?: string
  content?: { layout?: Block[] }
}

function die(msg: string): never {
  console.error(`ABORT: ${msg}`)
  process.exit(1)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function readStack(payload: any, locale: Locale): Promise<StackDoc> {
  const res = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'stack' } },
    locale,
    fallbackLocale: false,
    draft: false,
    depth: 0,
    limit: 1,
  })
  const doc = res.docs[0] as StackDoc | undefined
  if (!doc) die(`no existe el doc stack (locale ${locale}).`)
  return doc
}

function findToolStack(doc: StackDoc, locale: Locale): { block: Block; index: number } {
  const layout = doc.content?.layout ?? []
  const index = layout.findIndex((b) => b.blockType === 'toolStack')
  if (index === -1) die(`el doc stack (${locale}) no tiene bloque toolStack.`)
  return { block: layout[index], index }
}

function assertPublished(doc: StackDoc, locale: Locale, when: string) {
  if (doc._status !== 'published') {
    die(`_status del doc stack (${locale}) es "${doc._status}" ${when}: no es published. No se escribe.`)
  }
}

/** Layout nuevo: copia del actual con `logo` agregado a las herramientas que coinciden. */
function withLogos(layout: Block[], logoIdByNorm: Map<string, number | string>): Block[] {
  const next = JSON.parse(JSON.stringify(layout)) as Block[]
  for (const block of next) {
    if (block.blockType !== 'toolStack') continue
    for (const group of block.categoryGroups ?? []) {
      for (const tool of group.tools ?? []) {
        const id = logoIdByNorm.get(normalizeName(String(tool.name ?? '')))
        if (id !== undefined && !tool.logo) tool.logo = id
      }
    }
  }
  return next
}

/** Ids de logo de todas las herramientas, en orden de recorrido (null si no tiene). */
function collectLogos(layout: Block[]): (number | string | null)[] {
  return layout
    .filter((b) => b.blockType === 'toolStack')
    .flatMap((b) => (b.categoryGroups ?? []).flatMap((g) => (g.tools ?? []).map((t) => (t.logo as number | string | null | undefined) ?? null)))
    .map((v) => (v !== null && typeof v === 'object' ? ((v as { id?: number | string }).id ?? null) : v))
}

function toolNames(block: Block): { name: string; hasLogo: boolean }[] {
  return (block.categoryGroups ?? []).flatMap((g) =>
    (g.tools ?? []).map((t) => ({ name: String(t.name ?? ''), hasLogo: Boolean(t.logo) })),
  )
}

async function main() {
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (nada se escribe)'} ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)

  try {
    assertSafeTarget(process.env.DATABASE_URI, APPLY, DB_CHECKED)
  } catch (err) {
    die((err as Error).message)
  }
  const missing = missingCloudinaryVars(process.env)
  if (missing.length > 0) {
    die(
      `faltan variables de Cloudinary: ${missing.join(', ')} (solo se comprueba presencia).\n` +
        '  Sin credenciales, sube los logos por el admin real y enlaza los ids aparte.',
    )
  }

  console.log('\n--- logos del manifiesto ---')
  const absent: string[] = []
  for (const l of MEDIA_MANIFEST.logos) {
    const abs = resolve(REPO_ROOT, l.file)
    if (!existsSync(abs)) {
      absent.push(l.file)
      console.log(`  FALTA ${l.file}`)
      continue
    }
    const bytes = statSync(abs).size
    console.log(
      `  ${l.toolName.padEnd(12)} ${l.file} (${formatBytes(bytes)}${bytes > WEBP_THRESHOLD_BYTES ? ', se convertirá a WebP' : ''}) alt "${l.alt}"`,
    )
  }
  if (absent.length > 0) die(`faltan archivos de origen: ${absent.join(', ')}`)

  // Import dinámico: nada de Payload se carga si una guardia aborta.
  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  const docs = {} as Record<Locale, StackDoc>
  try {
    for (const locale of WRITE_ORDER) docs[locale] = await readStack(payload, locale)
  } catch (err) {
    die(`${(err as Error).message}\n  (¿la migración phase54_shadow_content ya está aplicada?)`)
  }
  for (const locale of WRITE_ORDER) assertPublished(docs[locale], locale, 'antes de escribir')
  if (docs.en.id !== docs.es.id) die('el doc stack tiene ids distintos en EN y ES.')

  // Sin ids reales todavía: en dry-run se usa un id de marcador solo para el cálculo del layout.
  const placeholder = new Map<string, number | string>(
    MEDIA_MANIFEST.logos.map((l) => [normalizeName(l.toolName), -1]),
  )

  console.log('\n--- herramientas del doc stack ---')
  const first = findToolStack(docs.en, 'en').block
  const tools = toolNames(first)
  const logoNorms = new Set(MEDIA_MANIFEST.logos.map((l) => normalizeName(l.toolName)))
  const withLogo = tools.filter((t) => logoNorms.has(normalizeName(t.name)))
  const withoutLogo = tools.filter((t) => !logoNorms.has(normalizeName(t.name)))
  const toolNorms = new Set(tools.map((t) => normalizeName(t.name)))
  const logosWithoutTool = MEDIA_MANIFEST.logos.filter((l) => !toolNorms.has(normalizeName(l.toolName)))
  console.log(`  con logo (${withLogo.length}): ${withLogo.map((t) => `${t.name}${t.hasLogo ? ' [ya tiene]' : ''}`).join(', ') || '(ninguna)'}`)
  console.log(`  sin logo (${withoutLogo.length}): ${withoutLogo.map((t) => t.name).join(', ') || '(ninguna)'}`)
  console.log(`  logos sin herramienta (${logosWithoutTool.length}): ${logosWithoutTool.map((l) => l.toolName).join(', ') || '(ninguno)'}`)

  // Guardia de diff, en seco: el layout nuevo solo puede diferir en `logo`.
  for (const locale of WRITE_ORDER) {
    const cur = docs[locale].content?.layout ?? []
    const diff = layoutDiffIgnoring(cur, withLogos(cur, placeholder), ['logo'])
    if (diff.length > 0) {
      die(`el layout nuevo (${locale}) difiere en algo más que logo: ${diff.slice(0, 10).join(', ')}. No se escribe.`)
    }
  }
  console.log('\n  guardia de diff (antes): OK, solo cambia la clave logo; _status published en EN y ES')

  // Pendiente por locale: un corte a medias (EN con logos y ES sin ellos) se completa al repetir.
  const pendingByLocale = {} as Record<Locale, number>
  for (const locale of WRITE_ORDER) {
    const { block } = findToolStack(docs[locale], locale)
    pendingByLocale[locale] = toolNames(block).filter((t) => logoNorms.has(normalizeName(t.name)) && !t.hasLogo).length
  }
  console.log(`  logos por enlazar: EN ${pendingByLocale.en}, ES ${pendingByLocale.es}`)
  if (pendingByLocale.en === 0 && pendingByLocale.es === 0) {
    console.log('\nNada que enlazar (idempotente).')
    process.exit(0)
  }
  if (!APPLY) {
    console.log('\nDRY-RUN: no se escribe. Vuelve a correr con --apply --db-checked.')
    process.exit(0)
  }

  // ---- escritura ----
  const tmp = await mkdtemp(join(tmpdir(), 'phase54-logos-'))
  try {
    const logoIdByNorm = new Map<string, number | string>()
    for (const l of MEDIA_MANIFEST.logos) {
      if (!toolNorms.has(normalizeName(l.toolName))) continue
      const abs = resolve(REPO_ROOT, l.file)
      const slug = normalizeName(l.toolName)
      const prepared = await prepareImage(abs, statSync(abs).size > WEBP_THRESHOLD_BYTES, tmp, `p54-stack-${slug}`)
      const media = await findOrCreateMedia(payload, {
        alt: l.alt,
        filePath: prepared.path,
        baseName: `p54-stack-${slug}`,
      })
      logoIdByNorm.set(slug, media.id)
      console.log(`  ${l.toolName.padEnd(12)} media #${media.id}${media.reused ? ' (reutilizado)' : ' creado'}${prepared.converted ? ', WebP' : ''}`)
    }

    // Estado de partida de cada locale, para comparar tras cada escritura.
    const before: Record<Locale, Block[]> = {
      en: docs.en.content?.layout ?? [],
      es: docs.es.content?.layout ?? [],
    }
    const expected: Record<Locale, Block[]> = {
      en: withLogos(before.en, logoIdByNorm),
      es: withLogos(before.es, logoIdByNorm),
    }

    const done: Locale[] = []
    for (const locale of WRITE_ORDER) {
      // Relectura fresca justo antes de escribir: el doc no debe haber cambiado desde el dry-run.
      const fresh = await readStack(payload, locale)
      assertPublished(fresh, locale, 'justo antes de escribir')
      // `logo` no es un campo localizado: las filas de herramientas se comparten entre
      // locales, así que tras escribir EN el ES ya los muestra. En ese caso no se reescribe.
      const stillPending = toolNames(findToolStack(fresh, locale).block).filter(
        (t) => logoNorms.has(normalizeName(t.name)) && !t.hasLogo,
      ).length
      if (stillPending === 0) {
        console.log(`\n  [${locale}] ya tiene todos los logos (campo compartido entre locales), no se reescribe`)
        done.push(locale)
        continue
      }
      const freshDiff = layoutDiffIgnoring(fresh.content?.layout ?? [], before[locale], ['logo'])
      if (freshDiff.length > 0) die(`el doc stack (${locale}) cambió mientras corría el script: ${freshDiff.slice(0, 5).join(', ')}.`)

      await payload.update({
        collection: 'pages',
        id: docs[locale].id,
        locale,
        draft: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { content: { layout: expected[locale] } } as any,
      })
      done.push(locale)
      console.log(`\n  escrito [${locale}]`)

      // Releer AMBOS locales: el escrito debe tener los logos y nada más; el otro no debe haber cambiado.
      let bad = ''
      for (const check of WRITE_ORDER) {
        const after = await readStack(payload, check)
        if (after._status !== 'published') bad += ` _status de ${check} es "${after._status}".`
        const layout = after.content?.layout ?? []
        const otherChanges = layoutDiffIgnoring(layout, before[check], ['logo'])
        if (otherChanges.length > 0) bad += ` ${check}: cambió algo más que logo (${otherChanges.slice(0, 5).join(', ')}).`
        const got = JSON.stringify(collectLogos(layout))
        const isExpected = got === JSON.stringify(collectLogos(expected[check]))
        const isBefore = got === JSON.stringify(collectLogos(before[check]))
        // El locale ya escrito debe tener los logos esperados. El otro puede tenerlos (campo
        // compartido) o seguir como estaba, pero nunca otra cosa.
        if (!(isExpected || (!done.includes(check) && isBefore))) {
          bad += ` ${check}: los logos releídos no coinciden con los esperados.`
        }
      }
      if (bad) {
        console.error(
          `\nDETENIDO tras escribir [${locale}]:${bad}\n  No se escribe el locale que falta. Informa a Juan: puede hacer falta restaurar el doc stack. No se cae a otra opción en silencio.`,
        )
        process.exit(1)
      }
      console.log(`  OK   [${locale}] releído: solo cambió logo, _status published, el otro locale intacto`)
    }
  } finally {
    // Solo el directorio temporal que creó este script.
    await rm(tmp, { recursive: true, force: true })
  }

  console.log(
    '\nRecordatorio: el efecto sale tras el TTL de 60 s del unstable_cache. Verifica contra el HTML servido de /stack, no contra este OK.',
  )
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
