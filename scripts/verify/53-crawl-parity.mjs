// Compara el estado HTTP de cada URL del sitemap de producción contra el preview.
// Uso: PREVIEW_BASE=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com node scripts/verify/53-crawl-parity.mjs
const previewBase = process.env.PREVIEW_BASE
const prodBase = process.env.PROD_BASE
const CONCURRENCY = 4

if (!previewBase || !prodBase) {
  console.error('FAIL PREVIEW_BASE y PROD_BASE son obligatorias')
  process.exit(1)
}

const sitemapUrl = `${prodBase}/sitemap.xml`
const sitemapRes = await fetch(sitemapUrl)
if (!sitemapRes.ok) {
  console.error(`FAIL ${sitemapUrl} respondió ${sitemapRes.status}`)
  process.exit(1)
}
const xml = await sitemapRes.text()
const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
  const url = new URL(match[1].trim())
  return url.pathname + url.search
})

const pathOf = (location) => {
  if (!location) return ''
  try {
    const url = new URL(location, prodBase)
    return url.pathname + url.search
  } catch {
    return location
  }
}

const probe = async (base, path) => {
  try {
    const res = await fetch(base + path, { redirect: 'manual' })
    return { status: res.status, location: pathOf(res.headers.get('location')) }
  } catch (error) {
    return { status: 0, location: error instanceof Error ? error.message : String(error) }
  }
}

const results = []
let cursor = 0
const worker = async () => {
  while (cursor < paths.length) {
    const path = paths[cursor++]
    const [preview, prod] = await Promise.all([probe(previewBase, path), probe(prodBase, path)])
    results.push({ path, preview, prod })
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

const failures = []
for (const { path, preview, prod } of results) {
  if (preview.status >= 500 || preview.status === 0) {
    failures.push(`${path}: el preview devolvió ${preview.status || 'error'} ${preview.location}`)
  } else if (preview.status !== prod.status) {
    failures.push(`${path}: estado distinto, preview ${preview.status}, producción ${prod.status}`)
  } else if (preview.status >= 300 && preview.status < 400 && preview.location !== prod.location) {
    failures.push(`${path}: redirige distinto, preview ${preview.location}, producción ${prod.location}`)
  }
}

console.log(`URLs revisadas: ${results.length}`)
console.log(`Diferencias: ${failures.length}`)
for (const failure of failures) console.log(`FAIL ${failure}`)
if (failures.length > 0) process.exit(1)
console.log('PASS crawl contra el sitemap de producción')
