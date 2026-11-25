/**
 * Publica la guia GEO (posts/geo-seo-guia, id 74) en espanol y en ingles (decision de Juan,
 * 2026-11-25: "Traducir y publicar").
 *
 * El texto de data/53-guia-geo.json sale del borrador en espanol, con los hechos revisados
 * contra fuentes primarias (arXiv 2311.09735, documentacion de rastreadores de OpenAI,
 * Anthropic, Perplexity y Google, guia de IA generativa de Search Central, ayuda de Search
 * Console y de GA4, analisis de Vercel de 2024 y la propuesta de llms.txt). Se retiran los
 * tres enlaces a guias que siguen en borrador.
 *
 * Orden: es (sigue en borrador), en (sigue en borrador) y por ultimo publicar. Asi /en nunca
 * sirve el espanol por fallback. Categoria, autor y slug no cambian. Sin heroImage, como el
 * resto de posts publicados (la imagen sale del respaldo determinista por slug).
 *
 * Uso: ver data/51-content-lib.ts. Dry-run por defecto.
 */
import { readFileSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'

import {
  fail,
  LOCALES,
  openPayload,
  parseCli,
  readDoc,
  sleep,
  writeBackup,
  type Doc,
  type Locale,
} from './data/51-content-lib'

type Copy = { title: string; excerpt: string; metaTitle: string; metaDescription: string; content: unknown }
type Guide = { id: number; slug: string; sourceContent: unknown; es: Copy; en: Copy }

const guide = JSON.parse(readFileSync(new URL('./data/53-guia-geo.json', import.meta.url), 'utf8')) as Guide
const target = { collection: 'posts', id: guide.id }

const matches = (doc: Doc, c: Copy) =>
  doc.title === c.title &&
  doc.excerpt === c.excerpt &&
  doc.meta?.title === c.metaTitle &&
  doc.meta?.description === c.metaDescription &&
  isDeepStrictEqual(doc.content, c.content)

/** Campos que el script no debe cambiar nunca. */
const fixed = (d: Doc) => ({ slug: d.slug, author: d.author, categories: d.categories, heroImage: d.heroImage ?? null })

async function main() {
  const cli = parseCli('publicar la guia GEO')
  const payload = await openPayload()
  const before = { es: await readDoc(payload, target, 'es'), en: await readDoc(payload, target, 'en') }
  if (before.es.slug !== guide.slug) throw new Error(`el id ${guide.id} es ${String(before.es.slug)}`)
  writeBackup(cli.backupPath, before)

  const latest = await payload.findVersions({
    collection: 'posts',
    where: { parent: { equals: guide.id } },
    sort: '-updatedAt',
    limit: 1,
    locale: 'es',
    depth: 0,
  })
  const latestContent = latest.docs[0]?.version?.content
  const known = [guide.sourceContent, guide.es.content]
  for (const content of [before.es.content, ...(latestContent ? [latestContent] : [])]) {
    if (!known.some((k) => isDeepStrictEqual(k, content))) {
      throw new Error('el borrador en espanol cambio despues de revisarlo: no se escribe')
    }
  }
  console.log(`  estado actual: ${before.es._status}, categorias ${JSON.stringify(before.es.categories)}, autor ${String(before.es.author)}`)
  for (const l of LOCALES) {
    console.log(`  ${l}: "${before[l].title ?? '(vacio)'}" -> "${guide[l].title}" (${matches(before[l], guide[l]) ? 'ya al dia' : 'se escribe'})`)
  }
  if (before.es._status === 'published' && LOCALES.every((l) => matches(before[l], guide[l]))) {
    console.log('  la guia ya esta publicada y al dia')
    process.exit(0)
  }
  if (!cli.apply) {
    console.log('\nDry-run: se escribirian es y en y despues se publicaria.')
    process.exit(0)
  }

  const verify = async (written: Locale[], status: string) => {
    for (const l of LOCALES) {
      const got = await readDoc(payload, target, l)
      if (written.includes(l) && !matches(got, guide[l])) throw new Error(`${l}: la relectura no coincide con lo escrito`)
      if (!isDeepStrictEqual(fixed(got), fixed(before[l]))) throw new Error(`${l}: cambio un campo fijo`)
      if (got._status !== status) throw new Error(`${l}: estado ${String(got._status)} en vez de ${status}`)
    }
  }

  const written: Locale[] = []
  for (const l of LOCALES) {
    const c = guide[l]
    const now = await readDoc(payload, target, l)
    await payload.update({
      collection: 'posts',
      id: guide.id,
      locale: l,
      draft: false,
      fallbackLocale: false,
      depth: 0,
      data: {
        title: c.title,
        excerpt: c.excerpt,
        content: c.content,
        meta: { ...(now.meta ?? {}), title: c.metaTitle, description: c.metaDescription },
        slug: guide.slug,
        _status: before.es._status,
      },
    })
    written.push(l)
    await verify(written, before.es._status)
    console.log(`  OK ${l} escrito (estado ${before.es._status})`)
    await sleep(cli.pause)
  }

  await payload.update({
    collection: 'posts',
    id: guide.id,
    locale: 'es',
    draft: false,
    fallbackLocale: false,
    depth: 0,
    data: { slug: guide.slug, publishedAt: new Date().toISOString(), _status: 'published' },
  })
  await verify([...LOCALES], 'published')
  console.log('  OK publicada: es y en releidos')
  process.exit(0)
}

main().catch(fail)
