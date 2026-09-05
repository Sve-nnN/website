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

/**
 * Next.js App Router embeds the SSR'd RSC payload a second time as
 * JSON-escaped text inside trailing `<script>self.__next_f.push(...)`
 * hydration tags. Any plain-text search across the full document (e.g.
 * counting row labels) double-counts every string that also happens to
 * appear in that payload — visible DOM occurrences always come first in
 * document order, so truncating at the first such script tag isolates the
 * real rendered content without needing an HTML parser.
 */
function visibleDomOnly(html: string): string {
  const flightPayloadStart = html.indexOf('self.__next_f.push')
  return flightPayloadStart === -1 ? html : html.slice(0, flightPayloadStart)
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

  // Task 3 (d): las 9 herramientas deben renderizar su fila "Dónde lo usé" /
  // "Where I used it" con un href real (nunca vacío ni "#"). El row solo se
  // renderiza cuando `referenceHref` es verdadero (ver ToolCard.tsx), así
  // que contar las apariciones del label también confirma que ninguna
  // tarjeta se quedó sin referencia. Restringido al DOM visible: Next.js
  // repite el mismo texto dentro del payload de hidratación
  // (`self.__next_f.push`) al final del documento, y un conteo sobre el
  // HTML completo lo contaría dos veces (visibleDomOnly arriba).
  const domOnly = visibleDomOnly(html)
  const rowReferenceLabel = locale === 'es' ? 'Dónde lo usé' : 'Where I used it'
  const rowReferenceMatches = [...domOnly.matchAll(new RegExp(rowReferenceLabel, 'g'))]
  check(
    rowReferenceMatches.length === 9,
    `${path}: esperaba 9 filas "${rowReferenceLabel}" (una por tool), encontró ${rowReferenceMatches.length}`,
  )
  for (const m of rowReferenceMatches) {
    const windowStart = m.index ?? 0
    const windowSlice = domOnly.slice(windowStart, windowStart + 600)
    const hrefMatch = windowSlice.match(/href="([^"]*)"/)
    const href = hrefMatch?.[1]
    check(
      !!href && href !== '#' && !href.includes('undefined'),
      `${path}: fila "Dónde lo usé" en posición ${windowStart} no resuelve a una URL real (href="${href}")`,
    )
  }

  return html
}

/**
 * Task 3 (a)+(b)+(c) — footer, página de autor, y ausencia de /stack en el
 * nav del header de Home. Cada chequeo hace su propio fetch (no reutiliza
 * el HTML de /stack).
 */
async function verifyFooterAuthorAndNav() {
  // (a) Footer: '/' y '/en' deben tener un href a /stack con el label
  // correcto por locale.
  const { html: homeEs } = await fetchHtml('/')
  check(
    /href="\/stack"[^>]*>\s*Mi stack\s*</.test(homeEs) || homeEs.includes('>Mi stack<'),
    `/: footer no tiene el link "Mi stack" -> /stack`,
  )
  check(homeEs.includes('href="/stack"'), `/: footer no tiene href="/stack"`)

  const { html: homeEn } = await fetchHtml('/en')
  check(
    homeEn.includes('>My stack<'),
    `/en: footer no tiene el label "My stack"`,
  )
  check(homeEn.includes('href="/en/stack"'), `/en: footer no tiene href="/en/stack"`)

  // (c) Home nav (header): NUNCA debe contener /stack — grep acotado a la
  // región <header>...</header>, no un grep global de la página (el footer
  // de la MISMA página ya tiene el link legítimo, y un grep global daría un
  // falso FAIL).
  for (const [path, html] of [
    ['/', homeEs],
    ['/en', homeEn],
  ] as const) {
    const headerStart = html.indexOf('<header')
    const headerEnd = html.indexOf('</header>')
    check(
      headerStart !== -1 && headerEnd !== -1,
      `${path}: no se encontró la región <header>...</header>`,
    )
    if (headerStart !== -1 && headerEnd !== -1) {
      const headerSlice = html.slice(headerStart, headerEnd)
      check(
        !headerSlice.includes('/stack'),
        `${path}: el nav del header NO debe contener /stack (encontrado dentro de <header>)`,
      )
    }
  }

  // (b) Página de autor: ambos locales deben tener el link a /stack.
  const { html: authorEs } = await fetchHtml('/authors/juan-carlos-angulo')
  check(
    authorEs.includes('href="/stack"') && authorEs.includes('Ver mi stack de herramientas'),
    `/authors/juan-carlos-angulo: falta el link "Ver mi stack de herramientas" -> /stack`,
  )

  const { html: authorEn } = await fetchHtml('/en/authors/juan-carlos-angulo')
  check(
    authorEn.includes('href="/en/stack"') && authorEn.includes('See my tool stack'),
    `/en/authors/juan-carlos-angulo: falta el link "See my tool stack" -> /en/stack`,
  )
}

async function main() {
  await verifyLocale('/stack', 'es')
  await verifyLocale('/en/stack', 'en')
  await verifyFooterAuthorAndNav()

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
