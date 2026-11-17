/**
 * Cluster GEO (pilar + 3 satélites, en borrador) y rescate de secciones de las
 * tres perdedoras de canibalización hacia sus ganadoras (plan SEO de pilares,
 * research/seo-plan-2026-11/).
 *
 *   ./scripts/db/run-tunneled.sh scripts/db/33-geo-cluster-y-rescate.ts                 # dry-run
 *   ./scripts/db/run-tunneled.sh scripts/db/33-geo-cluster-y-rescate.ts --apply
 *   ./scripts/db/run-tunneled.sh scripts/db/33-geo-cluster-y-rescate.ts --apply --step=geo|rescue
 *
 * ── Qué hace ────────────────────────────────────────────────────────────────
 * geo      Crea /blog/tech-seo/{geo-seo-guia,llms-txt-guia,citabilidad-contenido-ia,
 *          medir-citas-ia} como BORRADOR (draft: true), ES y EN, autor Juan,
 *          categoría tech-seo, meta title y description. El texto vive en
 *          research/seo-plan-2026-11/contenido/<slug>.<locale>.md. Si el post ya
 *          existe en borrador, lo reescribe; si ya está publicado, no lo toca.
 * rescue   Inserta las secciones rescatadas (contenido/rescate-<ganadora>.<locale>.md)
 *          en programación dinámica, estructuras de datos y complejidad
 *          algorítmica, justo antes del bloque "Lee también" / "See Also" y de
 *          la FAQ final. No borra nada del contenido existente. Publica en vivo
 *          (draft: false), con backup previo en research/seo-plan-2026-11/data/.
 *
 * ── Trampas evitadas ────────────────────────────────────────────────────────
 * - `slug` explícito en todo update (el hook lo regenera desde title si falta).
 * - `fallbackLocale: false` en todas las lecturas.
 * - `content` es richText localizado (jsonb por locale): escribir un idioma no
 *   toca filas del otro. Igual, después de cada escritura releo el OTRO idioma
 *   y comparo su contenido con el estado previo byte a byte.
 * - Los nodos existentes se conservan tal cual (con sus ids); solo se insertan
 *   nodos nuevos con ids nuevos.
 * - Enlaces EN a posts con inglés incompleto (EN_TRANSLATION_INCOMPLETE) se
 *   dejan como texto plano, igual que enlaces a URLs que no responden 200.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { EN_TRANSLATION_INCOMPLETE } from '../../src/lib/translation-gaps'

const APPLY = process.argv.includes('--apply')
const STEP = process.argv.find((a) => a.startsWith('--step='))?.split('=')[1] ?? 'all'
const want = (s: string) => STEP === 'all' || STEP === s
const ORIGIN = 'https://juan-tech.com'
const CONTENT_DIR = 'research/seo-plan-2026-11/contenido'
const DATA = 'research/seo-plan-2026-11/data'
const LOCALES = ['es', 'en'] as const
type L = (typeof LOCALES)[number]
type Anyobj = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const AUTHOR_ID = 1
const CATEGORY_TECH_SEO = 5
const GEO_SLUGS = ['geo-seo-guia', 'llms-txt-guia', 'citabilidad-contenido-ia', 'medir-citas-ia']
const RESCUE = [
  { winner: 'dynamic-programming', loser: 'programacion-dinamica' },
  { winner: 'data-structures', loser: 'algoritmos-estructuras-datos' },
  { winner: 'complejidad-algoritmica', loser: 'big-o-notation' },
]
const STOP_HEADINGS = new Set(['lee también', 'keep reading', 'see also', 'ver también'])

// ── enlaces ───────────────────────────────────────────────────────────────────

const statusCache = new Map<string, number>()
async function statusOf(path: string): Promise<number> {
  if (!statusCache.has(path)) {
    try {
      statusCache.set(path, (await fetch(`${ORIGIN}${path}`, { redirect: 'manual' })).status)
    } catch {
      statusCache.set(path, 0)
    }
  }
  return statusCache.get(path)!
}

/** Ruta ES del markdown → ruta del locale. */
function localizePath(url: string, l: L): string {
  if (l === 'es' || !url.startsWith('/')) return url
  const svc = url.match(/^\/servicios\/(.+)$/)
  if (svc) return `/en/services/${svc[1]}`
  return `/en${url}`
}

const warnings: string[] = []

/** Devuelve la URL final o null si el enlace debe quedar como texto. */
async function resolveLink(url: string, l: L): Promise<string | null> {
  const path = localizePath(url, l)
  const m = url.match(/^\/blog\/[^/]+\/([^/?#]+)/)
  const slug = m?.[1]
  if (l === 'en' && slug && EN_TRANSLATION_INCOMPLETE.has(slug)) {
    warnings.push(`[${l}] ${path}: inglés incompleto, queda como texto`)
    return null
  }
  if (slug && GEO_SLUGS.includes(slug)) return path // borradores: 404 hasta publicar
  if (!path.startsWith('/')) return path
  const code = await statusOf(path)
  if (code !== 200) {
    warnings.push(`[${l}] ${path} responde ${code}, queda como texto`)
    return null
  }
  return path
}

// ── Lexical ───────────────────────────────────────────────────────────────────

const BASE = { version: 1, direction: 'ltr', format: '', indent: 0 }
const textNode = (t: string, format = 0) => ({ type: 'text', text: t, version: 1, detail: 0, format, mode: 'normal', style: '' })
const blockId = () => `${Date.now()}${randomBytes(3).toString('hex')}`
const rowId = () => randomBytes(12).toString('hex')

async function inline(src: string, l: L): Promise<unknown[]> {
  const out: unknown[] = []
  for (const part of src.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/).filter(Boolean)) {
    const b = part.match(/^\*\*([^*]+)\*\*$/)
    const c = part.match(/^`([^`]+)`$/)
    const a = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (b) out.push(textNode(b[1], 1))
    else if (c) out.push(textNode(c[1], 16))
    else if (a) {
      const url = await resolveLink(a[2], l)
      if (url)
        out.push({ type: 'link', ...BASE, fields: { url, newTab: false, linkType: 'custom' }, children: [textNode(a[1])] })
      else out.push(textNode(a[1]))
    } else out.push(textNode(part))
  }
  return out
}

const LANG: Record<string, string> = { javascript: 'javascript', js: 'javascript', css: 'css' }

async function toNodes(md: string, l: L): Promise<unknown[]> {
  const lines = md.split('\n')
  const nodes: unknown[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i++
      continue
    }
    const h = line.match(/^(#{2,4}) (.+)$/)
    if (h) {
      nodes.push({ type: 'heading', tag: `h${h[1].length}`, ...BASE, children: await inline(h[2], l) })
      i++
      continue
    }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++])
      i++
      nodes.push({
        type: 'block',
        fields: { id: blockId(), code: code.join('\n'), language: LANG[lang] ?? 'typescript', blockName: '', blockType: 'code-block' },
        format: '',
        version: 2,
      })
      continue
    }
    if (line.startsWith(':::faq')) {
      const title = line.slice(6).trim()
      const faqs: Anyobj[] = []
      i++
      while (i < lines.length && !lines[i].startsWith(':::')) {
        const q = lines[i].match(/^\?\? (.+)$/)
        if (q) {
          const ans: string[] = []
          i++
          while (i < lines.length && !lines[i].startsWith('?? ') && !lines[i].startsWith(':::')) {
            if (lines[i].trim()) ans.push(lines[i])
            i++
          }
          const children = []
          for (const a of ans) children.push({ type: 'paragraph', ...BASE, textFormat: 0, children: await inline(a, l) })
          faqs.push({ id: rowId(), question: q[1], answer: { root: { type: 'root', ...BASE, children } } })
        } else i++
      }
      i++
      nodes.push({
        type: 'block',
        fields: { id: blockId(), title, faqs, blockName: '', blockType: 'faq' },
        format: '',
        version: 2,
      })
      continue
    }
    const isUl = (s: string) => /^- /.test(s)
    const isOl = (s: string) => /^\d+\. /.test(s)
    if (isUl(line) || isOl(line)) {
      const ordered = isOl(line)
      const items: string[] = []
      while (i < lines.length && (ordered ? isOl(lines[i]) : isUl(lines[i])))
        items.push(lines[i++].replace(ordered ? /^\d+\. / : /^- /, ''))
      const children = []
      for (const [k, it] of items.entries())
        children.push({ type: 'listitem', value: k + 1, ...BASE, children: await inline(it, l) })
      nodes.push({ type: 'list', listType: ordered ? 'number' : 'bullet', tag: ordered ? 'ol' : 'ul', start: 1, ...BASE, children })
      continue
    }
    if (line.startsWith('> ')) {
      const q: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) q.push(lines[i++].slice(2))
      nodes.push({ type: 'quote', ...BASE, children: await inline(q.join(' '), l) })
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{2,4} |```|:::|- |\d+\. |> )/.test(lines[i])) para.push(lines[i++])
    nodes.push({ type: 'paragraph', ...BASE, textFormat: 0, children: await inline(para.join(' '), l) })
  }
  return nodes
}

function parseFile(path: string) {
  const raw = readFileSync(path, 'utf-8')
  const fm: Record<string, string> = {}
  let body = raw
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (m) {
    for (const line of m[1].split('\n')) {
      const k = line.indexOf(':')
      if (k > 0) fm[line.slice(0, k).trim()] = line.slice(k + 1).trim()
    }
    body = m[2]
  }
  return { fm, body }
}

function plain(node: unknown): string {
  if (Array.isArray(node)) return node.map(plain).join(' ')
  if (!node || typeof node !== 'object') return ''
  const n = node as Anyobj
  if (n.type === 'text') return n.text
  if (n.type === 'block') {
    const f = n.fields ?? {}
    if (f.blockType === 'faq') return (f.faqs ?? []).map((q: Anyobj) => `${q.question} ${plain(q.answer?.root)}`).join(' ')
    return ''
  }
  return plain(n.children ?? n.root ?? [])
}
const words = (n: unknown) => plain(n).split(/\s+/).filter(Boolean).length
// jsonb reordena las claves: comparo con claves ordenadas.
const canon = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(canon)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.keys(v as Anyobj).sort().map((k) => [k, canon((v as Anyobj)[k])]))
      : v
const same = (a: unknown, b: unknown) => JSON.stringify(canon(a)) === JSON.stringify(canon(b))
// --verify: solo lectura, compara lo guardado contra lo que el script escribiría.
const VERIFY = process.argv.includes('--verify')

// ── paso geo ─────────────────────────────────────────────────────────────────

type P = Awaited<ReturnType<typeof getPayload>>

async function stepGeo(payload: P) {
  console.log('\n══ PASO geo (borradores) ══')
  for (const slug of GEO_SLUGS) {
    const src: Record<L, { fm: Record<string, string>; content: Anyobj }> = {} as never
    for (const l of LOCALES) {
      const { fm, body } = parseFile(`${CONTENT_DIR}/${slug}.${l}.md`)
      src[l] = { fm, content: { root: { type: 'root', ...BASE, children: await toNodes(body, l) } } }
      console.log(`  ${slug} [${l}] "${fm.title}" · ${words(src[l].content.root)} palabras · meta "${fm.metaTitle}" (${fm.metaTitle.length})`)
    }
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true, locale: 'es', fallbackLocale: false })
    const existing = found.docs[0]
    if (existing && existing._status === 'published') {
      console.log(`    ya está PUBLICADO (id ${existing.id}); no lo toco`)
      continue
    }
    if (existing) {
      const en = await payload.findByID({ collection: 'posts', id: existing.id, locale: 'en', depth: 0, draft: true, fallbackLocale: false })
      const file = `${DATA}/backup-geo-${slug}-${Date.now()}.json`
      if (APPLY) writeFileSync(file, JSON.stringify({ es: existing, en }, null, 2))
      console.log(`    existe en borrador (id ${existing.id}); ${APPLY ? `backup ${file} y reescribo` : 'lo reescribiría'}`)
    }
    if (VERIFY && existing) {
      for (const l of LOCALES) {
        const d = (await payload.findByID({ collection: 'posts', id: existing.id, locale: l, depth: 0, draft: true, fallbackLocale: false })) as Anyobj
        const ok = d.title === src[l].fm.title && plain(d.content) === plain(src[l].content) && d.meta?.title === src[l].fm.metaTitle && d.meta?.description === src[l].fm.metaDescription && d._status === 'draft'
        console.log(`    verificación [${l}] id ${existing.id} ${ok ? 'OK' : 'FALLA'} · estado ${d._status} · ${words(d.content?.root)} palabras · bloques ${d.content?.root?.children?.length}/${src[l].content.root.children.length}`)
        if (!ok) process.exitCode = 1
      }
      continue
    }
    if (!APPLY) continue
    const data = (l: L) => ({
      title: src[l].fm.title,
      excerpt: src[l].fm.excerpt,
      content: src[l].content,
      meta: { title: src[l].fm.metaTitle, description: src[l].fm.metaDescription },
      slug,
    })
    let id = existing?.id
    if (!id) {
      const doc = await payload.create({
        collection: 'posts',
        locale: 'es',
        draft: true,
        data: {
          ...data('es'),
          author: AUTHOR_ID,
          categories: [CATEGORY_TECH_SEO],
          publishedAt: new Date().toISOString(),
          _status: 'draft',
        } as never,
      })
      id = doc.id
      console.log(`    creado borrador id ${id} [es]`)
    } else {
      await payload.update({ collection: 'posts', id, locale: 'es', draft: true, data: { ...data('es'), _status: 'draft' } as never })
      console.log(`    actualizado [es]`)
    }
    const esBefore = await payload.findByID({ collection: 'posts', id, locale: 'es', depth: 0, draft: true, fallbackLocale: false })
    await payload.update({ collection: 'posts', id, locale: 'en', draft: true, data: { ...data('en'), _status: 'draft' } as never })
    console.log(`    actualizado [en]`)
    // Verificación de lectura: los dos idiomas, sin fallback.
    for (const l of LOCALES) {
      const d = (await payload.findByID({ collection: 'posts', id, locale: l, depth: 0, draft: true, fallbackLocale: false })) as Anyobj
      const ok = d.title === src[l].fm.title && same(d.content, src[l].content) && d.meta?.title === src[l].fm.metaTitle && d._status === 'draft'
      console.log(`    verificación [${l}] ${ok ? 'OK' : 'FALLA'} · estado ${d._status} · ${words(d.content?.root)} palabras`)
      if (!ok) process.exitCode = 1
      if (l === 'es' && !same(d.content, (esBefore as Anyobj).content)) {
        console.error('    ¡el ES cambió al escribir el EN!')
        process.exitCode = 1
      }
    }
    const pub = await payload.find({ collection: 'posts', where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: false })
    console.log(`    estado en la colección: ${pub.docs[0]?._status ?? 'sin doc'} (la Local API ignora el acceso; la URL pública da 404 mientras sea borrador)`)
  }
}

// ── paso rescue ──────────────────────────────────────────────────────────────

function insertIndex(children: Anyobj[]): number {
  let idx = children.findIndex(
    (c) => c.type === 'heading' && c.tag === 'h2' && STOP_HEADINGS.has(plain(c).trim().toLowerCase()),
  )
  if (idx === -1) idx = children.length
  while (idx > 0 && children[idx - 1].type === 'block' && children[idx - 1].fields?.blockType === 'faq') idx--
  return idx
}

async function stepRescue(payload: P) {
  console.log('\n══ PASO rescue (en vivo) ══')
  mkdirSync(DATA, { recursive: true })
  for (const r of RESCUE) {
    console.log(`\n  ${r.loser} → ${r.winner}`)
    const found = await payload.find({ collection: 'posts', where: { slug: { equals: r.winner } }, limit: 1, depth: 0, draft: false })
    const doc = found.docs[0]
    if (!doc || doc._status !== 'published') {
      console.error('    la ganadora no está publicada; se salta')
      process.exitCode = 1
      continue
    }
    const read = async (l: L) =>
      (await payload.findByID({ collection: 'posts', id: doc.id, locale: l, depth: 0, draft: false, fallbackLocale: false })) as Anyobj
    const before = { es: await read('es'), en: await read('en') }
    const backup = `${DATA}/backup-rescate-${r.winner}.json`
    if (APPLY && !existsSync(backup)) {
      writeFileSync(backup, JSON.stringify(before, null, 2))
      console.log(`    backup ${backup}`)
    } else console.log(`    ${existsSync(backup) ? 'backup ya existe' : 'haría backup en ' + backup}`)

    for (const l of LOCALES) {
      const other: L = l === 'es' ? 'en' : 'es'
      const current = await read(l)
      const children: Anyobj[] = current.content?.root?.children ?? []
      if (!children.length) {
        console.log(`    [${l}] sin contenido; se salta`)
        continue
      }
      const { body } = parseFile(`${CONTENT_DIR}/rescate-${r.winner}.${l}.md`)
      const nodes = (await toNodes(body, l)) as Anyobj[]
      const marker = plain(nodes[0]).trim()
      if (children.some((c) => c.type === 'heading' && plain(c).trim() === marker)) {
        if (VERIFY && existsSync(backup)) {
          const orig: Anyobj[] = JSON.parse(readFileSync(backup, 'utf-8'))[l].content.root.children
          const at = insertIndex(orig)
          const exp = [...orig.slice(0, at), ...nodes, ...orig.slice(at)]
          const strip = (a: Anyobj[]) => a.map((n) => (n.type === 'block' ? { ...n, fields: { ...n.fields, id: '' } } : n))
          const ok = same(strip(children), strip(exp)) && current._status === 'published'
          const keptOk = same(children.slice(0, at), orig.slice(0, at)) && same(children.slice(at + nodes.length), orig.slice(at))
          console.log(`    [${l}] verificación ${ok ? 'OK' : 'FALLA'} · originales intactos ${keptOk ? 'OK' : 'FALLA'} · ${words(children)} palabras`)
          if (!ok || !keptOk) process.exitCode = 1
        } else console.log(`    [${l}] ya tiene "${marker}"; no se duplica`)
        continue
      }
      const at = insertIndex(children)
      const next = children[at] ? `${children[at].type} ${plain(children[at]).slice(0, 40)}` : 'final'
      const newContent = { ...current.content, root: { ...current.content.root, children: [...children.slice(0, at), ...nodes, ...children.slice(at)] } }
      console.log(`    [${l}] +${nodes.length} nodos · +${words(nodes)} palabras · antes de: ${next} · total ${words(children)} → ${words(newContent.root)}`)
      if (!APPLY) continue
      const otherBefore = await read(other)
      await payload.update({ collection: 'posts', id: doc.id, locale: l, draft: false, data: { content: newContent, slug: doc.slug } as never })
      const after = await read(l)
      const otherAfter = await read(other)
      const okSelf = same(after.content, newContent) && after._status === 'published'
      const okOther = same(otherAfter.content, otherBefore.content) && otherAfter.title === otherBefore.title
      const okKept = children.every((c) => after.content.root.children.some((n: Anyobj) => same(n, c)))
      console.log(`    [${l}] escrito: ${okSelf ? 'OK' : 'FALLA'} · nodos previos intactos: ${okKept ? 'OK' : 'FALLA'} · [${other}] intacto: ${okOther ? 'OK' : 'FALLA'}`)
      if (!okSelf || !okOther || !okKept) process.exitCode = 1
    }
  }
}

async function main() {
  console.log(APPLY ? '>>> APPLY: escribe en producción' : '>>> DRY-RUN: no escribe nada')
  const payload = await getPayload({ config })
  if (want('geo')) await stepGeo(payload)
  if (want('rescue')) await stepRescue(payload)
  if (warnings.length) console.log(`\nAvisos de enlaces:\n  ${[...new Set(warnings)].join('\n  ')}`)
  process.exit(process.exitCode ?? 0)
}
main()
