/**
 * Verifica FEAT-03/FEAT-02/FEAT-04/FEAT-05 (esta superficie: la landing
 * "Auditoría SEO Técnica") contra el dev server real (ya debe estar
 * corriendo en http://localhost:3000) conectado al Postgres real de
 * Dokploy, DESPUÉS de correr scripts/seed-phase48-5-landing-auditor.ts.
 * Este archivo NO crea/borra datos — solo lee HTML servido.
 *
 * Run (con el dev server ya arriba y el contenido ya sembrado):
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-phase48-5-landing-auditor.ts
 */
const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'

const failures: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

async function fetchHtml(path: string): Promise<{ res: Response; html: string }> {
  const res = await fetch(`${BASE_URL}${path}`)
  const html = await res.text()
  return { res, html }
}

async function verifyLocale(
  path: string,
  locale: 'es' | 'en',
  headings: { scopeCard: string; clientLogos: string },
) {
  const { res, html } = await fetchHtml(path)
  check(res.status === 200, `${path}: esperaba 200, obtuvo ${res.status}`)

  // (1) Heading + narrative con los 4 datos verificables tejidos en el texto.
  const expectedHeading =
    locale === 'es'
      ? 'También tengo un auditor automatizado, gratis'
      : 'I also built a free automated auditor'
  check(html.includes(expectedHeading), `${path}: falta el heading "${expectedHeading}"`)

  const calloutIndex = html.indexOf(expectedHeading)
  check(calloutIndex !== -1, `${path}: no se pudo ubicar el indice del heading del callout`)
  const calloutSlice = calloutIndex !== -1 ? html.slice(calloutIndex, calloutIndex + 3000) : ''

  for (const fact of ['29', '5', '500', 'PageSpeed Insights']) {
    check(
      calloutSlice.includes(fact),
      `${path}: falta el dato verificable "${fact}" en la ventana del callout del auditor`,
    )
  }

  // (2) Contrato de link: rel="noopener" unico, target="_blank", sr-only de
  // nueva pestana. Nunca sponsored/nofollow.
  const linkMatch = calloutSlice.match(/<a[^>]*href="https:\/\/auditor\.juan-tech\.com"[^>]*>/)
  check(!!linkMatch, `${path}: no se encontro un <a href="https://auditor.juan-tech.com"> dentro del callout`)
  if (linkMatch) {
    const anchorTag = linkMatch[0]
    check(anchorTag.includes('target="_blank"'), `${path}: el link del auditor no tiene target="_blank"`)
    check(anchorTag.includes('rel="noopener"'), `${path}: el link del auditor no tiene rel="noopener" (exacto)`)
    check(!anchorTag.includes('sponsored'), `${path}: el link del auditor NUNCA debe llevar "sponsored"`)
    check(!anchorTag.includes('nofollow'), `${path}: el link del auditor NUNCA debe llevar "nofollow"`)
  }
  const newTabSuffix = locale === 'es' ? 'se abre en una pestaña nueva' : 'opens in a new tab'
  check(
    calloutSlice.includes(`class="sr-only"`) && calloutSlice.includes(newTabSuffix),
    `${path}: falta el <span class="sr-only"> con el sufijo de nueva pestana ("${newTabSuffix}")`,
  )

  // (3) NO debe aparecer ningun Badge/chip de "no-commission" alrededor de
  // este callout — buscamos las clases de badgeVariants inmediatamente
  // antes/despues del bloque de texto del auditor.
  const badgeWindow = html.slice(Math.max(0, calloutIndex - 500), calloutIndex + 3500)
  check(
    !badgeWindow.includes('no-commission') &&
      !badgeWindow.includes('Recomendación sin comisión') &&
      !badgeWindow.includes('No-commission pick'),
    `${path}: no debe aparecer ningun badge/chip de "no-commission" alrededor del callout del auditor`,
  )

  // (4) Orden: el callout debe aparecer despues del heading de ServiceScopeCard
  // y antes del heading de ClientLogosBlock, en ese orden exacto.
  const scopeCardIndex = html.indexOf(headings.scopeCard)
  const clientLogosIndex = html.indexOf(headings.clientLogos)
  check(scopeCardIndex !== -1, `${path}: no se encontro el heading de ServiceScopeCard ("${headings.scopeCard}")`)
  check(clientLogosIndex !== -1, `${path}: no se encontro el heading de ClientLogosBlock ("${headings.clientLogos}")`)
  check(
    scopeCardIndex !== -1 &&
      calloutIndex !== -1 &&
      clientLogosIndex !== -1 &&
      scopeCardIndex < calloutIndex &&
      calloutIndex < clientLogosIndex,
    `${path}: orden incorrecto — esperaba scopeCard(${scopeCardIndex}) < auditorCallout(${calloutIndex}) < clientLogos(${clientLogosIndex})`,
  )

  // (5) Ningun href debe contener "undefined".
  const undefinedHrefs = html.match(/href="[^"]*undefined[^"]*"/g)
  check(
    !undefinedHrefs || undefinedHrefs.length === 0,
    `${path}: hrefs con "undefined": ${JSON.stringify(undefinedHrefs)}`,
  )

  return html
}

async function main() {
  await verifyLocale('/servicios/seo-technical-audit', 'es', {
    scopeCard: 'Alcance de esta auditoría',
    clientLogos: 'Clientes',
  })
  await verifyLocale('/en/services/seo-technical-audit', 'en', {
    scopeCard: 'Scope of this audit',
    clientLogos: 'Clients',
  })

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
