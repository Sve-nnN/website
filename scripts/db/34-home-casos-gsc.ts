/**
 * feat/home-casos-gsc: crea 4 casos nuevos con su captura de Search Console y
 * deja la home curada con los tres que ya tienen captura.
 *
 *   1. Sube cada captura a Media (Cloudinary) con alt ES y EN.
 *   2. Crea el caso en ES y lo completa en EN, publicado (draft:false).
 *   3. Cura featured-content.featuredCaseStudies con los tres casos con captura
 *      (guarda el valor anterior en --backup-file para poder revertir).
 *
 * Nota: `create` con draft:false no publica; por eso el data lleva `_status: 'published'`.
 * (La primera corrida los dejó en borrador y el script 35 los publicó.)
 *
 * Solo crea filas nuevas (Media y case-studies) y actualiza featured-content.
 * No borra nada. Idempotente: si el slug o el archivo ya existen, los reutiliza.
 *
 * DRY-RUN POR DEFECTO. Con `--apply` exige `--db-checked` (04-which-database.ts).
 * Mismas guardas de base que los scripts 21 y 33.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/34-home-casos-gsc.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/34-home-casos-gsc.ts --apply --db-checked
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { assertSafeTarget, missingCloudinaryVars, safeTarget } from './data/54-seed-lib'
import { CASES, type CaseSeed } from './data/34-casos-gsc'

const APPLY = process.argv.includes('--apply')
const DB_CHECKED = process.argv.includes('--db-checked')
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const AUTHOR_ID = 1
/** Orden de la home: los tres con captura y mejor cifra con nombre de cliente visible. */
const HOME_KEYS = ['phixser', 'vitawallet', 'deltacloudz']

const backupArg = process.argv.find((a) => a.startsWith('--backup-file='))
const BACKUP_FILE = backupArg ? backupArg.split('=')[1]! : join(tmpdir(), 'featured-content-backup-34.json')

function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          textFormat: 0,
          children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
        },
      ],
    },
  }
}

type Row = Record<string, unknown>

function fieldsFor(c: CaseSeed, lang: 'es' | 'en', imageId: number | string, ids?: Row) {
  const pick = <T extends { es: string; en: string }>(l: T) => l[lang]
  const idOf = (arr: string, i: number) => (ids && Array.isArray(ids[arr]) ? { id: (ids[arr] as Row[])[i]?.id } : {})
  return {
    title: pick(c.title),
    heroMetric: pick(c.heroMetric),
    heroSubtitle: pick(c.heroSubtitle),
    sector: pick(c.sector),
    period: c.periodAfter,
    ...(c.clientId ? { client: c.clientId } : {}),
    services: c.services.map((s, i) => ({ ...idOf('services', i), service: pick(s) })),
    kpis: c.kpis.map((k, i) => ({ ...idOf('kpis', i), value: k.value, label: pick(k.label) })),
    clientContext: lexicalParagraph(pick(c.clientContext)),
    challenge: c.challenge.map((t, i) => ({ ...idOf('challenge', i), text: pick(t) })),
    solution: c.solution.map((s, i) => ({ ...idOf('solution', i), title: pick(s.title), description: pick(s.description) })),
    results: {
      periodBefore: c.periodBefore,
      periodAfter: c.periodAfter,
      metrics: c.metrics.map((m, i) => ({
        ...(ids && (ids.results as Row | undefined)?.metrics
          ? { id: ((ids.results as Row).metrics as Row[])[i]?.id }
          : {}),
        before: m.before,
        after: m.after,
        label: pick(m.label),
      })),
    },
    lessons: c.lessons.map((l, i) => ({ ...idOf('lessons', i), title: pick(l.title), body: pick(l.body) })),
    conclusion: lexicalParagraph(pick(c.conclusion)),
    heroImage: imageId,
    author: AUTHOR_ID,
    slug: c.slug,
    _status: 'published' as const,
  }
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
    console.error(`ABORT: faltan variables de Cloudinary: ${missing.join(', ')} (solo se comprueba presencia).`)
    process.exit(1)
  }
  for (const c of CASES) {
    const abs = resolve(REPO_ROOT, c.image.source)
    if (!existsSync(abs)) {
      console.error(`ABORT: falta la captura ${c.image.source}`)
      process.exit(1)
    }
    console.log(`  ${c.key}: ${c.slug}  (captura ${c.image.uploadName})`)
  }
  if (!APPLY) {
    console.log(`\nDry-run listo. Home curada con: ${HOME_KEYS.join(', ')}. Corre con --apply --db-checked para escribir.`)
    return
  }

  const { getPayload } = await import('payload')
  const config = (await import('../../src/payload.config')).default
  const payload = await getPayload({ config })
  const tmp = await mkdtemp(join(tmpdir(), 'gsc-casos-'))
  const caseIds: Record<string, number | string> = {}

  for (const c of CASES) {
    console.log(`\n--- ${c.key} ---`)
    // 1. Media
    const base = c.image.uploadName.replace(/\.jpg$/, '')
    const found = await payload.find({
      collection: 'media',
      where: { filename: { like: base } },
      limit: 2,
      depth: 0,
      fallbackLocale: false,
    })
    if (found.docs.length > 1) throw new Error(`Hay ${found.docs.length} Media con "${base}": resuélvelo a mano.`)
    let mediaId: number | string
    if (found.docs.length === 1) {
      mediaId = found.docs[0]!.id
      console.log(`  media reutilizada id=${mediaId}`)
    } else {
      mkdirSync(tmp, { recursive: true })
      const dest = join(tmp, c.image.uploadName)
      copyFileSync(resolve(REPO_ROOT, c.image.source), dest)
      const doc = await payload.create({
        collection: 'media',
        data: { alt: c.image.alt.es },
        locale: 'es',
        filePath: dest,
      })
      mediaId = doc.id
      console.log(`  media creada id=${mediaId}`)
    }
    await payload.update({
      collection: 'media',
      id: mediaId,
      locale: 'en',
      data: { alt: c.image.alt.en },
      draft: false,
      fallbackLocale: false,
      depth: 0,
    })
    const esAlt = (await payload.findByID({ collection: 'media', id: mediaId, locale: 'es', fallbackLocale: false, depth: 0 })) as { alt?: string; url?: string }
    const enAlt = (await payload.findByID({ collection: 'media', id: mediaId, locale: 'en', fallbackLocale: false, depth: 0 })) as { alt?: string; url?: string }
    if (esAlt.alt !== c.image.alt.es || enAlt.alt !== c.image.alt.en) throw new Error(`alt ES/EN no coincide en media ${mediaId}`)
    console.log(`  alt ES y EN OK  url=${esAlt.url}`)

    // 2. Caso
    const existing = await payload.find({
      collection: 'case-studies',
      where: { slug: { equals: c.slug } },
      limit: 1,
      depth: 0,
      draft: false,
      fallbackLocale: false,
    })
    let caseId: number | string
    if (existing.docs.length === 1) {
      caseId = existing.docs[0]!.id
      console.log(`  caso ya existe id=${caseId}: no se recrea`)
    } else {
      const created = await payload.create({
        collection: 'case-studies',
        locale: 'es',
        draft: false,
        data: fieldsFor(c, 'es', mediaId) as never,
      })
      caseId = created.id
      console.log(`  caso creado id=${caseId} (ES)`)
      const es = (await payload.findByID({ collection: 'case-studies', id: caseId, locale: 'es', fallbackLocale: false, depth: 0, draft: false })) as unknown as Row
      await payload.update({
        collection: 'case-studies',
        id: caseId,
        locale: 'en',
        draft: false,
        fallbackLocale: false,
        depth: 0,
        data: fieldsFor(c, 'en', mediaId, es) as never,
      })
      console.log('  caso completado en EN')
    }
    caseIds[c.key] = caseId

    // 3. Relectura de los dos idiomas (trampa: ids de filas y fallbackLocale)
    for (const lang of ['es', 'en'] as const) {
      const d = (await payload.findByID({ collection: 'case-studies', id: caseId, locale: lang, fallbackLocale: false, depth: 0, draft: false })) as unknown as Row
      const okTitle = d.title === c.title[lang]
      const okMetric = d.heroMetric === c.heroMetric[lang]
      const okRows =
        (d.challenge as Row[]).every((r, i) => r.text === c.challenge[i]![lang]) &&
        (d.solution as Row[]).every((r, i) => r.title === c.solution[i]!.title[lang]) &&
        (d.kpis as Row[]).every((r, i) => r.label === c.kpis[i]!.label[lang]) &&
        (d.lessons as Row[]).every((r, i) => r.title === c.lessons[i]!.title[lang])
      console.log(`  ${lang}: título ${okTitle ? 'OK' : 'FALLA'}, cifra ${okMetric ? 'OK' : 'FALLA'}, filas ${okRows ? 'OK' : 'FALLA'}, estado ${String(d._status)}`)
      if (!okTitle || !okMetric || !okRows) throw new Error(`relectura ${lang} de ${c.key} no coincide`)
    }
  }

  // 4. featured-content
  const fc = (await payload.findGlobal({ slug: 'featured-content', depth: 0, locale: 'es', fallbackLocale: false })) as unknown as Row
  writeFileSync(BACKUP_FILE, JSON.stringify({ featuredCaseStudies: fc.featuredCaseStudies ?? [] }, null, 1), { mode: 0o600 })
  console.log(`\nfeatured-content anterior guardado en ${BACKUP_FILE}: ${JSON.stringify(fc.featuredCaseStudies ?? [])}`)
  const wanted = HOME_KEYS.map((k) => caseIds[k]!)
  await payload.updateGlobal({
    slug: 'featured-content',
    locale: 'es',
    data: { featuredCaseStudies: wanted } as never,
    depth: 0,
  })
  const after = (await payload.findGlobal({ slug: 'featured-content', depth: 0, locale: 'es', fallbackLocale: false })) as unknown as Row
  console.log(`featured-content ahora: ${JSON.stringify(after.featuredCaseStudies)} (esperado ${JSON.stringify(wanted)})`)
  console.log('\nIDs:', JSON.stringify(caseIds))
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
