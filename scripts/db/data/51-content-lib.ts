/**
 * Utilidades de los scripts de contenido 49, 51, 52 y 53 (decisiones de Juan del 2026-11-25).
 *
 * Un cambio se declara como ruta + valor anterior + valor nuevo. El runner lee es y en con
 * fallbackLocale false, exige que cada ruta tenga el valor anterior (o ya el nuevo), escribe un
 * documento y un idioma cada vez con pausa, y compara el documento entero: solo pueden cambiar
 * las rutas declaradas (y updatedAt). Dry-run por defecto.
 *
 *   DATABASE_URI=<tunel> PAYLOAD_SECRET=... node_modules/.bin/tsx scripts/db/<script>.ts \
 *     --backup <ruta.json> [--only clave,clave] [--pause 20000] [--apply --db-checked]
 */
import { writeFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'

import { assertSafeTarget, safeTarget } from './54-seed-lib'

export const LOCALES = ['es', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export type Op = { path: string; old: unknown; new: unknown }

export type DocPlan = {
  key: string
  /** Coleccion o global. */
  collection?: string
  global?: string
  id?: number
  /** Slug esperado: protege contra un id equivocado. */
  slug?: string
  ops: Record<Locale, Op[]>
  /** Cambio estructural compartido por ambos idiomas (se aplica despues de las ops). */
  shared?: { label: string; apply: (doc: Doc) => Doc }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PayloadLike = any

export function getPath(doc: unknown, path: string): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce<any>((cur, k) => (cur == null ? undefined : cur[k]), doc)
}

function setPath(doc: Doc, path: string, value: unknown): void {
  const keys = path.split('.')
  const last = keys.pop() as string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parent = keys.reduce<any>((cur, k) => cur?.[k], doc)
  if (parent == null) throw new Error(`ruta inexistente: ${path}`)
  parent[last] = value
}

/** Aplica las ops sobre una copia. Devuelve las que de verdad cambian algo. */
export function applyOps(doc: Doc, ops: Op[], label: string): { doc: Doc; changed: Op[] } {
  const out = structuredClone(doc)
  const changed: Op[] = []
  for (const op of ops) {
    const cur = getPath(out, op.path) ?? null
    if (isDeepStrictEqual(cur, op.new ?? null)) continue
    if (!isDeepStrictEqual(cur, op.old ?? null)) {
      throw new Error(
        `${label}: ${op.path} no tiene el valor esperado.\n  esperado: ${JSON.stringify(op.old)}\n  actual:   ${JSON.stringify(cur)}`,
      )
    }
    setPath(out, op.path, structuredClone(op.new))
    changed.push(op)
  }
  return { doc: out, changed }
}

/** Rutas cuyo valor difiere entre dos documentos. */
export function changedPaths(a: unknown, b: unknown, path = ''): string[] {
  if (isDeepStrictEqual(a, b)) return []
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    return [...keys].flatMap((k) =>
      changedPaths((a as Doc)[k], (b as Doc)[k], path ? `${path}.${k}` : k),
    )
  }
  return [path]
}

const withoutStamp = (d: Doc): Doc => {
  const { updatedAt: _u, ...rest } = d
  return rest
}

export const sameDoc = (a: Doc, b: Doc): string[] => changedPaths(withoutStamp(a), withoutStamp(b))

export function parseCli(title: string) {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const arg = (name: string) => {
    const i = args.indexOf(name)
    return i >= 0 ? args[i + 1] : undefined
  }
  const backupPath = arg('--backup')
  const only = arg('--only')?.split(',')
  const pause = Number(arg('--pause') ?? 20000)
  console.log(`=== ${apply ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} · ${title} ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)
  assertSafeTarget(process.env.DATABASE_URI, apply, args.includes('--db-checked'))
  if (apply && !backupPath) throw new Error('--apply exige --backup <ruta.json>')
  return { apply, backupPath, only, pause }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function writeBackup(path: string | undefined, data: unknown): void {
  if (!path) return
  writeFileSync(path, JSON.stringify(data, null, 1), { mode: 0o600, flag: 'wx' })
  console.log(`  respaldo JSON (es + en) escrito en ${path}`)
}

/**
 * Abre Payload. Registra en memoria los bloques `faq` y `code-block` que algunos posts ya
 * traen en su contenido y que el editor de Posts de master no declara (igual que el script 40).
 */
export async function openPayload(): Promise<PayloadLike> {
  const { BlocksFeature, lexicalEditor } = await import('@payloadcms/richtext-lexical')
  const { Posts } = await import('../../../src/collections/Posts')
  const { AffiliateInlineBlock } = await import('../../../src/blocks/AffiliateInlineBlock/config')
  const { EmailCaptureBlock } = await import('../../../src/blocks/EmailCaptureBlock/config')
  const { Code } = await import('../../../src/blocks/Code/config')
  const { FAQ } = await import('../../../src/blocks/FAQ/config')
  const contentField = Posts.fields.find((f) => 'name' in f && f.name === 'content') as { editor?: unknown }
  contentField.editor = lexicalEditor({
    features: ({ rootFeatures }) => [
      ...rootFeatures,
      BlocksFeature({
        blocks: [AffiliateInlineBlock, EmailCaptureBlock, FAQ, { ...Code, slug: 'code-block', interfaceName: undefined }],
      }),
    ],
  })
  const { getPayload } = await import('payload')
  const config = (await import('../../../src/payload.config')).default
  return getPayload({ config })
}

export async function readDoc(payload: PayloadLike, p: Pick<DocPlan, 'collection' | 'global' | 'id'>, locale: Locale): Promise<Doc> {
  if (p.global) return (await payload.findGlobal({ slug: p.global, locale, fallbackLocale: false, depth: 0 })) as Doc
  return (await payload.findByID({ collection: p.collection, id: p.id, locale, fallbackLocale: false, depth: 0 })) as Doc
}

/** Un borrador pendiente significa que publicar pisaria trabajo ajeno: se aborta. */
export async function assertNoPendingDraft(payload: PayloadLike, p: Pick<DocPlan, 'collection' | 'id' | 'key'>, doc: Doc): Promise<void> {
  if (!('_status' in doc)) return
  if (doc._status !== 'published') throw new Error(`${p.key}: el documento no esta publicado (${String(doc._status)})`)
  const latest = await payload.findVersions({
    collection: p.collection,
    where: { parent: { equals: p.id } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
  })
  const status = (latest.docs[0]?.version as { _status?: string } | undefined)?._status
  if (status === 'draft') throw new Error(`${p.key}: hay un borrador pendiente, se aborta`)
}

/** Campos de primer nivel que se envian: los que tocan las ops o el cambio compartido. */
function topFields(before: Doc, after: Doc): string[] {
  return [...new Set(sameDoc(before, after).map((p) => p.split('.')[0] as string))]
}

export async function runPlans(title: string, plans: DocPlan[]): Promise<void> {
  const cli = parseCli(title)
  const selected = cli.only ? plans.filter((p) => cli.only?.includes(p.key)) : plans
  if (selected.length === 0) throw new Error('--only no coincide con ningun documento')
  const payload = await openPayload()

  const prepared = []
  const backup: Record<string, Record<Locale, Doc>> = {}
  for (const p of selected) {
    const before = { es: await readDoc(payload, p, 'es'), en: await readDoc(payload, p, 'en') }
    backup[p.key] = before
    if (p.slug && before.es.slug !== p.slug) throw new Error(`${p.key}: el id ${p.id} es ${String(before.es.slug)}`)
    if (p.collection) await assertNoPendingDraft(payload, p, before.es)
    const final = {} as Record<Locale, Doc>
    console.log(`\n[${p.key}]`)
    for (const l of LOCALES) {
      const { doc, changed } = applyOps(before[l], p.ops[l], `${p.key} [${l}]`)
      final[l] = p.shared ? p.shared.apply(doc) : doc
      for (const op of changed) console.log(`  ${l} ${op.path}\n     - ${JSON.stringify(op.old)}\n     + ${JSON.stringify(op.new)}`)
      if (p.shared && sameDoc(doc, final[l]).length > 0) console.log(`  ${l} ${p.shared.label}`)
    }
    prepared.push({ p, before, final })
  }
  writeBackup(cli.backupPath, backup)

  const pending = prepared.filter(({ before, final }) => LOCALES.some((l) => sameDoc(before[l], final[l]).length > 0))
  if (!cli.apply) {
    console.log(`\nDry-run: se escribirian ${pending.length} documento(s).`)
    process.exit(0)
  }

  for (const { p, before, final } of pending) {
    for (const l of LOCALES) {
      const now = await readDoc(payload, p, l)
      if (sameDoc(now, final[l]).length === 0) continue
      // Se reconstruye sobre lo leido ahora para no pisar nada que haya cambiado en medio.
      const { doc } = applyOps(now, p.ops[l], `${p.key} [${l}]`)
      const next = p.shared ? p.shared.apply(doc) : doc
      const data: Doc = {}
      for (const f of topFields(now, next)) data[f] = next[f]
      if (p.global) {
        await payload.updateGlobal({ slug: p.global, locale: l, data, depth: 0 })
      } else {
        if ('_status' in next) {
          data._status = 'published'
          data.slug = next.slug
        }
        await payload.update({ collection: p.collection, id: p.id, locale: l, data, draft: false, fallbackLocale: false, depth: 0 })
      }
      for (const check of LOCALES) {
        const got = await readDoc(payload, p, check)
        // El idioma ya escrito debe quedar como su final; el otro, igual que antes mas lo compartido.
        const done = check === l || (check === 'es' && l === 'en')
        const want = done ? final[check] : p.shared ? p.shared.apply(structuredClone(before[check])) : before[check]
        const diff = sameDoc(want, got)
        if (diff.length > 0) {
          throw new Error(`${p.key}: tras escribir ${l}, ${check} difiere en ${diff.slice(0, 10).join(', ')}. Respaldo en ${cli.backupPath}`)
        }
      }
      console.log(`  OK ${p.key} [${l}] escrito y releido en ambos idiomas`)
      await sleep(cli.pause)
    }
  }
  console.log(`=== ${pending.length} documento(s) escritos ===`)
  process.exit(0)
}

export function fail(err: unknown): never {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}
