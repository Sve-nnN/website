/**
 * Publica la traduccion inglesa completa de los 14 posts que /en servia en noindex
 * (src/lib/translation-gaps.ts): 7 sin fila en `en` (servian el espanol por fallback) y
 * 7 con un ingles truncado.
 *
 * Alcance en `en`: title, excerpt, content, meta.title, meta.description.
 * Alcance en `es`: solo donde la entrada trae `esContent` o `esMetaDescription`, que son
 * correcciones de errores inequivocos del original (FID por INP, codigo C++ roto, el componente
 * <Activity /> ausente, fecha de CSS, BASE, nombres de producto cambiados).
 * No toca slug, categorias, autor ni fecha. No borra documentos.
 * Lo que sustituye queda en el respaldo (--backup) y en las versiones de Payload.
 *
 * Escribe un post cada vez, con una pausa entre escrituras (--pause <ms>, 5000 por defecto).
 *
 * Datos: scripts/db/data/40-en-posts.json, armado a partir del arbol Lexical en espanol, con
 * `sourceUpdatedAt` por post. Si el post cambio despues de traducirlo, el script no lo escribe.
 * Idempotente: un post cuyo EN ya coincide se salta.
 *
 * Los bloques `faq` y `code-block` que ya existen en el contenido no estan registrados en el editor
 * de Posts de master (arreglo pendiente en feat/seo-pilares), asi que el script los registra en
 * memoria para que la validacion de Lexical acepte el documento.
 *
 * Seguridad (CLAUDE.md): imprime host, puerto y base, nunca usuario ni clave. Dry-run por defecto.
 *
 *   DATABASE_URI=<tunel> PAYLOAD_SECRET=... NEXT_PUBLIC_SERVER_URL=https://juan-tech.com \
 *     node_modules/.bin/tsx scripts/db/40-en-posts-translation.ts \
 *       --backup <ruta.json> [--only slug,slug] [--apply --db-checked]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'

import { assertSafeTarget, safeTarget } from './data/54-seed-lib'

type Entry = {
  slug: string
  id: number
  sourceUpdatedAt: string
  title: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  content: { root: unknown }
  esContent?: { root: unknown }
  esMetaDescription?: string
}

type Doc = Record<string, unknown> & {
  title?: string | null
  excerpt?: string | null
  content?: unknown
  meta?: { title?: string | null; description?: string | null; image?: unknown } | null
  updatedAt: string
  _status?: string
}

// Campos que no deben cambiar al escribir el ingles.
const UNTOUCHED = ['title', 'excerpt', 'content', 'meta', 'slug', 'categories', 'author', 'publishedAt', 'heroImage', '_status']
const pick = (d: Doc) => Object.fromEntries(UNTOUCHED.map((k) => [k, d[k] ?? null]))

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const arg = (name: string) => {
    const i = args.indexOf(name)
    return i >= 0 ? args[i + 1] : undefined
  }
  const backupPath = arg('--backup')
  const only = arg('--only')?.split(',')

  console.log(`=== ${apply ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} · posts EN ===`)
  console.log(`  base: ${safeTarget(process.env.DATABASE_URI)}`)
  assertSafeTarget(process.env.DATABASE_URI, apply, args.includes('--db-checked'))
  if (apply && !backupPath) throw new Error('--apply exige --backup <ruta.json>')

  const all = JSON.parse(readFileSync(new URL('./data/40-en-posts.json', import.meta.url), 'utf8')) as Entry[]
  const entries = only ? all.filter((e) => only.includes(e.slug)) : all

  const { BlocksFeature, lexicalEditor } = await import('@payloadcms/richtext-lexical')
  const { Posts } = await import('../../src/collections/Posts')
  const { AffiliateInlineBlock } = await import('../../src/blocks/AffiliateInlineBlock/config')
  const { EmailCaptureBlock } = await import('../../src/blocks/EmailCaptureBlock/config')
  const { Code } = await import('../../src/blocks/Code/config')
  const { FAQ } = await import('../../src/blocks/FAQ/config')
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
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })

  const read = async (id: number, locale: 'es' | 'en') =>
    (await payload.findByID({ collection: 'posts', id, locale, fallbackLocale: false, depth: 0 })) as unknown as Doc

  const matches = (en: Doc, e: Entry) =>
    en.title === e.title &&
    en.excerpt === e.excerpt &&
    en.meta?.title === e.metaTitle &&
    en.meta?.description === e.metaDescription &&
    isDeepStrictEqual(en.content, e.content)

  /** Lo que debe leer el locale `es` al terminar: igual que antes salvo las correcciones. */
  const expectedEs = (before: Doc, e: Entry) => {
    const want = pick(before) as Record<string, unknown>
    if (e.esContent) want.content = e.esContent
    if (e.esMetaDescription) want.meta = { ...(before.meta ?? {}), description: e.esMetaDescription }
    return want
  }
  const matchesEs = (es: Doc, e: Entry) =>
    (!e.esContent || isDeepStrictEqual(es.content, e.esContent)) &&
    (!e.esMetaDescription || es.meta?.description === e.esMetaDescription)

  const backup: Record<string, { es: Doc; en: Doc }> = {}
  const todo: Entry[] = []
  for (const e of entries) {
    const es = await read(e.id, 'es')
    const en = await read(e.id, 'en')
    if (es.slug !== e.slug) throw new Error(`${e.slug}: el id ${e.id} es ${String(es.slug)}`)
    const latest = await payload.findVersions({
      collection: 'posts',
      where: { parent: { equals: e.id } },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
    })
    const draftPending = (latest.docs[0]?.version as { _status?: string } | undefined)?._status === 'draft'
    backup[e.slug] = { es, en }
    if (matches(en, e) && matchesEs(es, e)) console.log(`  = ${e.slug}: ya esta al dia`)
    else if (es.updatedAt !== e.sourceUpdatedAt && !matches(en, e)) console.log(`  ! ${e.slug}: cambio despues de traducir (${es.updatedAt}), se salta`)
    else if (es._status !== 'published' || draftPending) console.log(`  ! ${e.slug}: no publicado o con borrador pendiente, se salta`)
    else {
      todo.push(e)
      console.log(`  ~ ${e.slug}: EN "${en.title ?? '(vacio)'}" -> "${e.title}" (contenido ${JSON.stringify(en.content ?? '').length} -> ${JSON.stringify(e.content).length})${e.esContent || e.esMetaDescription ? ' + correccion ES' : ''}`)
    }
  }
  if (backupPath) {
    writeFileSync(backupPath, JSON.stringify(backup, null, 1), { mode: 0o600, flag: 'wx' })
    console.log(`  respaldo JSON (es + en) escrito en ${backupPath}`)
  }

  if (!apply) {
    console.log(`  se escribirian ${todo.length} posts`)
    process.exit(0)
  }

  const sleep = () => new Promise((r) => setTimeout(r, Number(arg('--pause') ?? 5000)))
  const diffKeys = (got: Doc, want: Record<string, unknown>) =>
    UNTOUCHED.filter((k) => !isDeepStrictEqual(got[k] ?? null, want[k] ?? null))

  for (const e of todo) {
    const before = backup[e.slug]
    if (!matches(before.en, e)) {
      await payload.update({
        collection: 'posts',
        id: e.id,
        locale: 'en',
        draft: false,
        depth: 0,
        data: {
          title: e.title,
          excerpt: e.excerpt,
          content: e.content as never,
          meta: { ...(before.en.meta ?? {}), title: e.metaTitle, description: e.metaDescription } as never,
          slug: e.slug,
          _status: 'published',
        },
      })
      const changed = diffKeys(await read(e.id, 'es'), pick(before.es))
      if (changed.length) throw new Error(`${e.slug}: el ES cambio al escribir EN (${changed.join(', ')}). Respaldo en ${backupPath}`)
      if (!matches(await read(e.id, 'en'), e)) throw new Error(`${e.slug}: el EN releido no coincide con lo escrito`)
      console.log(`  OK ${e.slug}: EN escrito, ES intacto`)
      await sleep()
    }
    if (!matchesEs(before.es, e)) {
      await payload.update({
        collection: 'posts',
        id: e.id,
        locale: 'es',
        draft: false,
        depth: 0,
        data: {
          ...(e.esContent ? { content: e.esContent as never } : {}),
          ...(e.esMetaDescription
            ? { meta: { ...(before.es.meta ?? {}), description: e.esMetaDescription } as never }
            : {}),
          slug: e.slug,
          _status: 'published',
        },
      })
      const changed = diffKeys(await read(e.id, 'es'), expectedEs(before.es, e))
      if (changed.length) throw new Error(`${e.slug}: el ES no quedo como se esperaba (${changed.join(', ')}). Respaldo en ${backupPath}`)
      if (!matches(await read(e.id, 'en'), e)) throw new Error(`${e.slug}: el EN cambio al corregir el ES. Respaldo en ${backupPath}`)
      console.log(`  OK ${e.slug}: correccion ES escrita, EN intacto`)
      await sleep()
    }
  }
  console.log(`=== ${todo.length} posts escritos ===`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
