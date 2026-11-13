/**
 * Aplica el plan SEO de pilares y enlazado (research/seo-plan-2026-11/).
 *
 * Cuatro pasos independientes, cada uno idempotente. Por defecto es DRY-RUN:
 * imprime qué haría y no escribe nada.
 *
 *   # con el túnel abierto (./scripts/db/tunnel.sh) y DATABASE_URI exportada:
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/29-seo-plan-pilares.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/29-seo-plan-pilares.ts --apply
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/29-seo-plan-pilares.ts --apply --step=titles
 *
 * Pasos (en este orden cuando no se pasa --step):
 *   titles   titles, H1 y meta descriptions de research/seo-plan-2026-11/data/titles.json
 *   merge    fusiones: redirect 301 ES+EN, backup JSON y despublicación de la perdedora
 *   fixes    enlaces internos a 404 o 308, y voseo en el texto ES
 *   links    bloque "Lee también" al final de cada artículo (matriz de enlazado)
 *
 * ── Trampas que este script ya evita (ver CLAUDE.md y la memoria del repo) ──
 *
 * 1. `slug` se deriva de `title` en un hook beforeValidate: si un update trae
 *    `title` y no trae `slug`, el hook REGENERA el slug y rompe la URL. Todo
 *    update que toca `title` pasa `slug` explícito.
 * 2. `draft: false` en todo update sobre doc publicado, o se despublica.
 * 3. `fallbackLocale: false` en las lecturas que deciden si hay que escribir:
 *    Payload devuelve el valor español al leer un campo inglés vacío.
 * 4. Nada se borra. Las perdedoras de una fusión pasan a borrador y su JSON
 *    completo queda en research/canibalizacion/.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { EN_TRANSLATION_INCOMPLETE } from '../../src/lib/translation-gaps'

const APPLY = process.argv.includes('--apply')
const STEP = process.argv.find((a) => a.startsWith('--step='))?.split('=')[1] ?? 'all'
const ORIGIN = 'https://juan-tech.com'
const PLAN_DIR = 'research/seo-plan-2026-11'
const BACKUP_DIR = 'research/canibalizacion'
const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

const want = (s: string) => STEP === 'all' || STEP === s

// ── utilidades ────────────────────────────────────────────────────────────────

type Anyobj = Record<string, unknown>

async function statusOf(path: string): Promise<number> {
  try {
    return (await fetch(`${ORIGIN}${path}`, { redirect: 'manual' })).status
  } catch {
    return 0
  }
}

/** Parte una URL guardada en origen, prefijo de locale, path y sufijo. */
function parseInternal(url: string) {
  let rest = url
  let origin = ''
  if (rest.startsWith(ORIGIN)) {
    origin = ORIGIN
    rest = rest.slice(ORIGIN.length)
  } else if (/^https?:\/\//.test(rest)) return null
  if (!rest.startsWith('/')) return null
  const cut = rest.search(/[?#]/)
  const suffix = cut === -1 ? '' : rest.slice(cut)
  let path = cut === -1 ? rest : rest.slice(0, cut)
  let localePrefix = ''
  if (path === '/en' || path.startsWith('/en/')) {
    localePrefix = '/en'
    path = path.slice(3) || '/'
  }
  return { origin, localePrefix, path: path.replace(/\/$/, '') || '/', suffix }
}

function textNode(text: string) {
  return { type: 'text', text, version: 1, detail: 0, format: 0, mode: 'normal', style: '' }
}

/** Busca un nodo de enlace existente para copiar su forma exacta. */
function findLinkTemplate(node: unknown): Anyobj | null {
  if (Array.isArray(node)) {
    for (const c of node) {
      const r = findLinkTemplate(c)
      if (r) return r
    }
    return null
  }
  if (!node || typeof node !== 'object') return null
  const n = node as Anyobj
  if (n.type === 'link' && n.fields) return n
  for (const v of Object.values(n)) {
    const r = findLinkTemplate(v)
    if (r) return r
  }
  return null
}

function linkNode(url: string, label: string, tpl: Anyobj | null) {
  return {
    type: 'link',
    version: (tpl?.version as number) ?? 3,
    direction: 'ltr',
    format: '',
    indent: 0,
    fields: { ...((tpl?.fields as Anyobj) ?? {}), url, newTab: false, linkType: 'custom' },
    children: [textNode(label)],
  }
}

function headingNode(text: string) {
  return {
    type: 'heading',
    tag: 'h2',
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: [textNode(text)],
  }
}

function paragraphNode(children: unknown[]) {
  return { type: 'paragraph', version: 1, direction: 'ltr', format: '', indent: 0, textFormat: 0, children }
}

function listNode(items: unknown[][]) {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    version: 1,
    direction: 'ltr',
    format: '',
    indent: 0,
    children: items.map((children, i) => ({
      type: 'listitem',
      value: i + 1,
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children,
    })),
  }
}

function plainText(node: unknown): string {
  if (Array.isArray(node)) return node.map(plainText).join(' ')
  if (!node || typeof node !== 'object') return ''
  const n = node as Anyobj
  const own = typeof n.text === 'string' ? n.text : ''
  return own + ' ' + Object.values(n).filter((v) => typeof v === 'object').map(plainText).join(' ')
}

// ── paso 1: titles ────────────────────────────────────────────────────────────

type TitleEntry = {
  path: string
  slug: string
  kind: 'post' | 'page'
  field: 'title+h1' | 'meta.title' | 'meta.description'
  value: string
  locale?: Locale
}

async function stepTitles(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n══ PASO titles ══')
  const entries: TitleEntry[] = JSON.parse(readFileSync(`${PLAN_DIR}/data/titles.json`, 'utf-8'))
  let n = 0
  for (const e of entries) {
    if (e.kind !== 'post') continue
    const locale: Locale = e.locale ?? 'es'
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: e.slug } },
      limit: 1,
      depth: 0,
      locale,
      fallbackLocale: false,
    })
    const doc = docs[0] as (Anyobj & { id: number; _status?: string; slug: string; title?: string }) | undefined
    if (!doc) {
      console.log(`  SALTA ${e.slug} (${locale}): no existe`)
      continue
    }
    const meta = ((doc.meta as Anyobj | null) ?? {}) as Anyobj
    const current =
      e.field === 'meta.description' ? (meta.description as string) : e.field === 'meta.title' ? (meta.title as string) : doc.title
    if (current === e.value) {
      console.log(`  igual  ${e.slug} ${e.field}`)
      continue
    }
    const data: Anyobj = { slug: doc.slug } // sin esto, tocar title regenera el slug
    if (e.field === 'title+h1') {
      data.title = e.value
      data.meta = { ...meta, title: e.value }
    } else if (e.field === 'meta.title') {
      data.meta = { ...meta, title: e.value }
    } else {
      data.meta = { ...meta, description: e.value }
    }
    console.log(`  ${APPLY ? 'ESCRIBE' : 'escribiría'} ${e.slug} [${locale}] ${e.field}\n      antes:  ${String(current ?? '(vacío)').slice(0, 90)}\n      ahora:  ${e.value}`)
    n++
    if (APPLY) {
      await payload.update({
        collection: 'posts',
        id: doc.id,
        locale,
        draft: doc._status === 'published' ? false : undefined,
        data: data as never,
      })
    }
  }
  console.log(`  → ${n} cambio(s) de title/meta`)
}

// ── paso 2: merge ─────────────────────────────────────────────────────────────

const MERGES = [
  {
    winner: 'dynamic-programming',
    winnerPath: '/blog/cs-fundamentals/dynamic-programming',
    loser: 'programacion-dinamica',
    loserPath: '/blog/cs-fundamentals/programacion-dinamica',
    reason: '747 impresiones contra 0 en 90 días (GSC 2026-11-13)',
  },
  {
    winner: 'data-structures',
    winnerPath: '/blog/cs-fundamentals/data-structures',
    loser: 'algoritmos-estructuras-datos',
    loserPath: '/blog/cs-fundamentals/algoritmos-estructuras-datos',
    reason: '1.369 impresiones y 15 clics contra 0',
  },
  {
    winner: 'complejidad-algoritmica',
    winnerPath: '/blog/cs-fundamentals/complejidad-algoritmica',
    loser: 'big-o-notation',
    loserPath: '/blog/cs-fundamentals/big-o-notation',
    reason: 'ninguna tiene impresiones: gana la guía de 5.726 palabras',
  },
]

async function stepMerge(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n══ PASO merge ══')
  if (APPLY) mkdirSync(BACKUP_DIR, { recursive: true })
  for (const m of MERGES) {
    console.log(`\n  ${m.loser} → ${m.winner}  (${m.reason})`)
    const w = await payload.find({ collection: 'posts', where: { slug: { equals: m.winner } }, limit: 1, depth: 0 })
    if (!w.docs[0] || w.docs[0]._status !== 'published') {
      console.error(`    LA GANADORA NO ESTÁ PUBLICADA (${m.winner}); se salta`)
      process.exitCode = 1
      continue
    }
    for (const prefix of ['', '/en']) {
      const code = await statusOf(`${prefix}${m.winnerPath}`)
      if (code !== 200) {
        console.error(`    destino ${prefix}${m.winnerPath} responde ${code}; se salta`)
        process.exitCode = 1
        continue
      }
    }
    const l = await payload.find({
      collection: 'posts',
      where: { slug: { equals: m.loser } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    const doc = l.docs[0]
    if (!doc) {
      console.log('    la perdedora no existe')
    } else {
      // Backup completo de ambos locales antes de tocar nada.
      const es = await payload.findByID({ collection: 'posts', id: doc.id, locale: 'es', depth: 0, fallbackLocale: false })
      const en = await payload.findByID({ collection: 'posts', id: doc.id, locale: 'en', depth: 0, fallbackLocale: false })
      const file = `${BACKUP_DIR}/${m.loser}.json`
      if (APPLY && !existsSync(file)) {
        writeFileSync(file, JSON.stringify({ es, en }, null, 2))
        console.log(`    backup ${file}`)
      } else console.log(`    ${existsSync(file) ? 'backup ya existe' : 'haría backup en ' + file}`)
      if (doc._status === 'published') {
        console.log(`    ${APPLY ? 'despublica' : 'despublicaría'} ${m.loser}`)
        if (APPLY) {
          await payload.update({ collection: 'posts', id: doc.id, data: { _status: 'draft', slug: doc.slug } as never })
        }
      } else console.log('    ya está en borrador')
    }
    for (const prefix of ['', '/en']) {
      const from = `${prefix}${m.loserPath}`
      const to = `${prefix}${m.winnerPath}`
      const ex = await payload.find({ collection: 'redirects', where: { from: { equals: from } }, limit: 1 })
      if (ex.docs[0]) {
        console.log(`    redirect ya existe ${from}`)
        continue
      }
      console.log(`    ${APPLY ? 'crea' : 'crearía'} redirect ${from} → ${to}`)
      if (APPLY) await payload.create({ collection: 'redirects', data: { from, to: { type: 'custom', url: to } } as never })
    }
  }
}

// ── paso 3: fixes (enlaces 404/308 y voseo) ───────────────────────────────────

const LINK_MAP: Record<string, string> = {
  '/blog/general/tech-seo-guide': '/blog/tech-seo/technical-seo-guide',
  '/blog/general/non-developers-guide': '/blog/tech-seo/non-developers-guide',
  '/blog/general/ssr-vs-csr-seo': '/blog/tech-seo/ssr-vs-csr-seo',
  '/blog/general/tablas-hash': '/blog/cs-fundamentals/tablas-hash',
  '/blog/general/nextjs-seo-optimization': '/blog/tech-seo/nextjs-seo',
  '/blog/cs-fundamentals/experiencia-de-usuario': '/blog/development/experiencia-de-usuario',
  '/blog/cs-fundamentals/sql-vs-nosql': '/blog/development/sql-vs-nosql',
  '/blog/seo/seo-copywriting': '/blog/seo/redaccion-seo',
  '/blog/seo/seo-copywriting-guide': '/blog/seo/redaccion-seo',
  '/blog/seo/content-pillar': '/blog/seo/pillar-page-seo',
  '/blog/development/payloadcms-vs-strapi': '/blog/development/payload-cms-guide',
  '/blog/development/nextjs-portfolio': '/websites/juan-tech-com',
  '/blog/development/nextjs-server-components': '/blog/development/react-19',
  // fusiones del paso merge
  [MERGES[0].loserPath]: MERGES[0].winnerPath,
  [MERGES[1].loserPath]: MERGES[1].winnerPath,
  [MERGES[2].loserPath]: MERGES[2].winnerPath,
}

const VOSEO: Array<[RegExp, string]> = [
  [/\bacá\b/g, 'aquí'],
  [/\bAcá\b/g, 'Aquí'],
  [/\btenés\b/g, 'tienes'],
  [/\bpodés\b/g, 'puedes'],
  [/\bquerés\b/g, 'quieres'],
  [/\bsabés\b/g, 'sabes'],
  [/\bnecesitás\b/g, 'necesitas'],
  [/\bfijate\b/g, 'fíjate'],
  [/\bmirá\b/g, 'mira'],
  [/\bhacé\b/g, 'haz'],
  [/\bdecime\b/g, 'dime'],
  [/\bcontame\b/g, 'cuéntame'],
  [/\bescribime\b/g, 'escríbeme'],
]

type Counter = { links: number; voseo: number }

function fixNode<T>(node: T, locale: Locale, c: Counter, inCode = false): T {
  if (Array.isArray(node)) return node.map((x) => fixNode(x, locale, c, inCode)) as unknown as T
  if (!node || typeof node !== 'object') return node
  const n = node as Anyobj
  const code = inCode || n.type === 'code'
  const copy: Anyobj = {}
  for (const [k, v] of Object.entries(n)) {
    if (k === 'url' && typeof v === 'string') {
      const p = parseInternal(v)
      const target = p ? LINK_MAP[p.path] : undefined
      if (p && target) {
        copy[k] = `${p.origin}${p.localePrefix}${target}${p.suffix}`
        c.links++
        continue
      }
      copy[k] = v
    } else if (k === 'text' && typeof v === 'string' && locale === 'es' && !code && !((n.format as number) & 16)) {
      let t = v
      for (const [re, rep] of VOSEO) t = t.replace(re, () => (c.voseo++, rep))
      copy[k] = t
    } else if (v && typeof v === 'object') copy[k] = fixNode(v, locale, c, code)
    else copy[k] = v
  }
  return copy as T
}

async function stepFixes(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n══ PASO fixes ══')
  // Un enlace nuevo a una URL que no responde 200 es peor que el 308 que reemplaza.
  const targets = [...new Set(Object.values(LINK_MAP))]
  const dead = new Set<string>()
  for (const t of targets)
    for (const prefix of ['', '/en']) {
      const code = await statusOf(`${prefix}${t}`)
      if (code !== 200) {
        dead.add(t)
        console.log(`  AVISO destino ${prefix}${t} responde ${code}: se omiten los enlaces hacia ${t}`)
      }
    }
  for (const t of dead) for (const [from, to] of Object.entries(LINK_MAP)) if (to === t) delete LINK_MAP[from]

  let total = { links: 0, voseo: 0 }
  for (const locale of LOCALES) {
    for (const collection of ['posts', 'pages'] as const) {
      const { docs } = await payload.find({
        collection,
        limit: 0,
        pagination: false,
        depth: 0,
        locale,
        fallbackLocale: false,
        draft: false,
      })
      for (const doc of docs as unknown as Array<Anyobj & { id: number; slug: string; _status?: string }>) {
        const c: Counter = { links: 0, voseo: 0 }
        const content = fixNode(doc.content, locale, c)
        if (c.links + c.voseo === 0) continue
        total = { links: total.links + c.links, voseo: total.voseo + c.voseo }
        console.log(`  ${APPLY ? 'ESCRIBE' : 'escribiría'} ${collection}/${doc.slug} [${locale}]  enlaces=${c.links} voseo=${c.voseo}`)
        if (APPLY) {
          await payload.update({
            collection,
            id: doc.id,
            locale,
            draft: doc._status === 'published' ? false : undefined,
            data: { slug: doc.slug, content } as never,
          })
        }
      }
    }
  }
  console.log(`  → ${total.links} enlace(s) y ${total.voseo} palabra(s) de voseo`)
}

// ── paso 4: links (bloque "Lee también") ──────────────────────────────────────

type PlanPost = { title: string; keyword: string; url: string }
type Plan = { pillar: { keyword: string; url: string }; clusters: Array<{ name: string; posts: PlanPost[] }> }

const SERVICE: Record<string, { es: string; en: string; esLabel: string; enLabel: string; esLead: string; enLead: string }> = {
  seo: {
    es: '/servicios/seo-consulting',
    en: '/en/services/seo-consulting',
    esLabel: 'consultoría SEO técnica',
    enLabel: 'technical SEO consulting',
    esLead: '¿Quieres que alguien aplique esto en tu sitio? Mira mi ',
    enLead: 'Want someone to apply this on your site? See my ',
  },
  tech: {
    es: '/servicios/seo-technical-audit',
    en: '/en/services/seo-technical-audit',
    esLabel: 'auditoría SEO técnica',
    enLabel: 'technical SEO audit',
    esLead: 'Si prefieres un diagnóstico en lugar de revisarlo tú, pide una ',
    enLead: 'Prefer a diagnosis over checking it yourself? Request a ',
  },
  cs: {
    es: '/servicios/fullstack-development',
    en: '/en/services/fullstack-development',
    esLabel: 'desarrollo full-stack con SEO integrado',
    enLabel: 'full-stack development with built-in SEO',
    esLead: 'Si necesitas llevar esto a un proyecto real, mira el ',
    enLead: 'Need this in a real project? See ',
  },
  dev: {
    es: '/servicios/fullstack-development',
    en: '/en/services/fullstack-development',
    esLabel: 'desarrollo full-stack con SEO integrado',
    enLabel: 'full-stack development with built-in SEO',
    esLead: 'Si necesitas llevar esto a un proyecto real, mira el ',
    enLead: 'Need this in a real project? See ',
  },
}
const PILLAR_LABEL: Record<string, { es: string; en: string }> = {
  seo: { es: 'estrategia SEO', en: 'SEO strategy' },
  tech: { es: 'SEO técnico', en: 'technical SEO' },
  cs: { es: 'estructuras de datos', en: 'data structures' },
  dev: { es: 'CMS headless', en: 'headless CMS' },
}
const HEADING = { es: 'Lee también', en: 'Keep reading' }

function shortEn(title: string): string {
  const t = title.split(/[:|]/)[0].trim()
  return t.length > 70 ? t.slice(0, 67).trimEnd() + '…' : t
}

async function stepLinks(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\n══ PASO links ══')
  const plans: Record<string, Plan> = {}
  for (const k of ['seo', 'tech', 'cs', 'dev'])
    plans[k] = JSON.parse(readFileSync(`${PLAN_DIR}/cluster-plan-${k}.json`, 'utf-8'))

  // Mapa slug → anchor por locale, y qué slugs tienen inglés usable.
  const enTitle = new Map<string, string>()
  const enOk = new Set<string>()
  const { docs: enDocs } = await payload.find({
    collection: 'posts',
    limit: 0,
    pagination: false,
    depth: 0,
    locale: 'en',
    fallbackLocale: false,
    draft: false,
  })
  for (const d of enDocs as unknown as Array<Anyobj & { slug: string; title?: string; content?: unknown }>) {
    if (d.title && plainText(d.content).trim().length > 200 && !EN_TRANSLATION_INCOMPLETE.has(d.slug)) {
      enOk.add(d.slug)
      enTitle.set(d.slug, shortEn(d.title))
    }
  }
  const slugOf = (url: string) => url.split('/').pop() as string
  const live = new Map<string, number>()
  const alive = async (path: string) => {
    if (!live.has(path)) live.set(path, await statusOf(path))
    return live.get(path) === 200
  }

  let blocks = 0
  for (const [key, plan] of Object.entries(plans)) {
    const pillarSlug = slugOf(plan.pillar.url)
    const members = plan.clusters.flatMap((c) => c.posts)
    const all = [{ title: '', keyword: plan.pillar.keyword, url: plan.pillar.url } as PlanPost, ...members]

    for (const locale of LOCALES) {
      for (const post of all) {
        const slug = slugOf(post.url)
        if (locale === 'en' && !enOk.has(slug)) continue
        const isPillar = slug === pillarSlug
        const cluster = plan.clusters.find((c) => c.posts.some((p) => slugOf(p.url) === slug))
        const pick: PlanPost[] = []
        if (isPillar) pick.push(...members)
        else {
          pick.push({ title: '', keyword: PILLAR_LABEL[key][locale], url: plan.pillar.url })
          const sib = cluster!.posts
          const i = sib.findIndex((p) => slugOf(p.url) === slug)
          for (const d of [1, 2]) if (sib.length > d) pick.push(sib[(i + d) % sib.length])
          if (i === 0) {
            const ci = plan.clusters.indexOf(cluster!)
            const nxt = plan.clusters[(ci + 1) % plan.clusters.length]
            if (nxt !== cluster) pick.push(nxt.posts[0])
          }
        }
        const uniq = [...new Map(pick.filter((p) => slugOf(p.url) !== slug).map((p) => [p.url, p])).values()]
        const targets: Array<{ url: string; label: string }> = []
        for (const p of uniq) {
          const s = slugOf(p.url)
          if (locale === 'en' && !enOk.has(s)) continue
          const url = locale === 'en' ? `/en${p.url}` : p.url
          const label = locale === 'en' ? (s === pillarSlug ? p.keyword : (enTitle.get(s) ?? p.keyword)) : p.keyword
          if (await alive(url)) targets.push({ url, label })
        }
        if (targets.length === 0) continue

        const { docs } = await payload.find({
          collection: 'posts',
          where: { slug: { equals: slug } },
          limit: 1,
          depth: 0,
          locale,
          fallbackLocale: false,
        })
        const doc = docs[0] as unknown as (Anyobj & { id: number; _status?: string; content: Anyobj }) | undefined
        if (!doc || !doc.content) continue
        const root = (doc.content as { root?: { children?: unknown[] } }).root
        if (!root?.children) continue
        if (plainText(root.children).includes(HEADING[locale])) {
          console.log(`  ya tiene bloque  ${slug} [${locale}]`)
          continue
        }
        const tpl = findLinkTemplate(root.children)
        const svc = SERVICE[key]
        const svcUrl = locale === 'es' ? svc.es : svc.en
        const items = targets.map((t) => [linkNode(t.url, t.label, tpl)])
        const cta = paragraphNode([
          textNode(locale === 'es' ? svc.esLead : svc.enLead),
          linkNode(svcUrl, locale === 'es' ? svc.esLabel : svc.enLabel, tpl),
          textNode('.'),
        ])
        const content = {
          ...doc.content,
          root: { ...root, children: [...root.children, headingNode(HEADING[locale]), listNode(items), cta] },
        }
        blocks++
        console.log(`  ${APPLY ? 'ESCRIBE' : 'escribiría'} ${slug} [${locale}]  ${targets.length} enlace(s) + servicio`)
        if (APPLY) {
          await payload.update({
            collection: 'posts',
            id: doc.id,
            locale,
            draft: doc._status === 'published' ? false : undefined,
            data: { slug, content } as never,
          })
        }
      }
    }
  }
  console.log(`  → ${blocks} bloque(s) "Lee también"`)
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`=== ${APPLY ? 'APLICANDO' : 'DRY-RUN (no se escribe nada)'} · paso=${STEP} ===`)
  const payload = await getPayload({ config })
  if (want('titles')) await stepTitles(payload)
  if (want('merge')) await stepMerge(payload)
  if (want('fixes')) await stepFixes(payload)
  if (want('links')) await stepLinks(payload)
  console.log(APPLY ? '\nListo. Verifica contra el HTML servido (espera 60 s por el TTL de caché).' : '\nCorre con --apply para escribir.')
  process.exit(process.exitCode ?? 0)
}

main()
