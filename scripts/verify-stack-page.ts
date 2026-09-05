/**
 * Verifica STACK-01 (Task 1 + Task 2 de 48-01-PLAN.md) contra el dev server
 * real (ya debe estar corriendo en http://localhost:3000) conectado al
 * Postgres real de Dokploy, DESPUÉS de correr
 * scripts/seed-phase48-tracer.ts. Este archivo NO crea/borra datos — solo
 * lee HTML servido.
 *
 * Run (con el dev server ya arriba y el tracer ya sembrado):
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-stack-page.ts
 */
const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'

const failures: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

function countH1(html: string): number {
  return (html.match(/<h1[\s>]/g) ?? []).length
}

async function fetchHtml(path: string): Promise<{ res: Response; html: string }> {
  const res = await fetch(`${BASE_URL}${path}`)
  const html = await res.text()
  return { res, html }
}

async function verifyLocale(path: string, locale: 'es' | 'en') {
  const { res, html } = await fetchHtml(path)
  check(res.status === 200, `${path}: esperaba 200, obtuvo ${res.status}`)

  // Canonical/hreflang: canonical apunta a la ruta propia del locale, y
  // ambos hreflang (es/en) están presentes con x-default = es.
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/)
  const expectedCanonicalPath = locale === 'es' ? '/stack' : '/en/stack'
  check(
    !!canonicalMatch && canonicalMatch[1].endsWith(expectedCanonicalPath),
    `${path}: canonical esperado terminando en "${expectedCanonicalPath}", obtuvo "${canonicalMatch?.[1]}"`,
  )
  // Next.js server-renders the attribute as `hrefLang` (camelCase, per React's
  // DOM prop name) — match case-insensitively so this doesn't false-negative
  // against a correctly-rendered page.
  check(
    /<link rel="alternate" hrefLang="es" href="[^"]*\/stack"/i.test(html),
    `${path}: falta hreflang="es" apuntando a /stack`,
  )
  check(
    /<link rel="alternate" hrefLang="en" href="[^"]*\/en\/stack"/i.test(html),
    `${path}: falta hreflang="en" apuntando a /en/stack`,
  )
  check(
    /<link rel="alternate" hrefLang="x-default" href="[^"]*\/stack"/i.test(html),
    `${path}: falta hreflang="x-default" apuntando a /stack (es)`,
  )

  // Exactamente un <h1> (el que renderiza PageHero) por locale.
  const h1Count = countH1(html)
  check(h1Count === 1, `${path}: esperaba exactamente 1 <h1>, encontró ${h1Count}`)

  // Breadcrumb visible — mismo marcador que websites/case-studies/authors
  // (PageHero's HeroBreadcrumbs: <nav aria-label="Breadcrumb">).
  check(
    html.includes('aria-label="Breadcrumb"'),
    `${path}: falta el breadcrumb visible (nav aria-label="Breadcrumb")`,
  )

  // Disclosure (role="note") debe aparecer ANTES del primer link sponsored.
  const noteIndex = html.indexOf('role="note"')
  const sponsoredIndex = html.indexOf('rel="sponsored nofollow noopener"')
  check(noteIndex !== -1, `${path}: falta el frame de disclosure (role="note")`)
  check(
    sponsoredIndex === -1 || noteIndex < sponsoredIndex,
    `${path}: el disclosure (role="note", index ${noteIndex}) debe preceder al primer link sponsored (index ${sponsoredIndex})`,
  )

  // DinoRANK CTA -> /go/dinorank.
  check(html.includes('/go/dinorank'), `${path}: falta un href a /go/dinorank`)

  // Ningún href debe contener la subcadena literal "undefined".
  const undefinedHrefs = html.match(/href="[^"]*undefined[^"]*"/g)
  check(
    !undefinedHrefs || undefinedHrefs.length === 0,
    `${path}: hrefs con "undefined": ${JSON.stringify(undefinedHrefs)}`,
  )

  // Task 2: al menos 1 GearCard renderizado ("Ver en Amazon" / "View on Amazon").
  check(
    html.includes('Ver en Amazon') || html.includes('View on Amazon'),
    `${path}: no se encontró ningún GearCard renderizado (falta el CTA "Ver en Amazon"/"View on Amazon")`,
  )

  // Task 2: heading de "elegiría hoy" presente.
  const elegiriaHoyHeading =
    locale === 'es'
      ? 'Qué elegiría hoy si empezara de cero'
      : "What I'd choose today, starting from zero"
  check(
    html.includes(elegiriaHoyHeading),
    `${path}: falta el heading de "elegiría hoy" ("${elegiriaHoyHeading}")`,
  )

  // Task 2 (opcional — solo si el tracer ya sembró un noCommissionPick):
  // ningún link dentro del callout de no-commission lleva rel="sponsored".
  const noCommissionHeading =
    locale === 'es' ? 'Mi recomendación sin comisión' : 'My pick that pays me nothing'
  const noCommissionIndex = html.indexOf(noCommissionHeading)
  if (noCommissionIndex !== -1) {
    const calloutSlice = html.slice(noCommissionIndex, noCommissionIndex + 2000)
    check(
      !calloutSlice.includes('rel="sponsored'),
      `${path}: el callout de no-commission pick no debe llevar rel="sponsored" en ningún link`,
    )
  }

  return html
}

async function main() {
  await verifyLocale('/stack', 'es')
  await verifyLocale('/en/stack', 'en')

  if (failures.length > 0) {
    console.log(`FAIL: ${failures.join(' | ')}`)
    process.exitCode = 1
    process.exit(1)
  }

  console.log('PASS')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  console.log('FAIL: excepción no controlada, ver stderr arriba')
  process.exitCode = 1
  process.exit(1)
})
