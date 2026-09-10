/**
 * Verifica Phase 48.5 Plan 03 (3ra instancia de StackHighlightCallout en
 * /stack, el auditor) contra el dev server LOCAL (nunca contra
 * https://juan-tech.com, que hoy 404 en /stack porque Phase 48 no llegó a
 * master todavía — 48.5-RESEARCH.md Pitfall 3). Este archivo NO crea/borra
 * datos — solo lee HTML servido.
 *
 * Run (con el dev server ya arriba y scripts/seed-phase48-5-stack-auditor.ts
 * ya corrido):
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-phase48-5-stack-auditor.ts
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

async function verifyLocale(path: string, locale: 'es' | 'en') {
  const { res, html } = await fetchHtml(path)
  check(res.status === 200, `${path}: esperaba 200, obtuvo ${res.status}`)

  // EN heading has 'd (apostrophe) which Next renders as the HTML entity
  // &#x27; in the served markup — a literal apostrophe here would never
  // match the real DOM. Anchor on the apostrophe-free tail instead.
  const elegiriaHoyHeading =
    locale === 'es' ? 'Qué elegiría hoy si empezara de cero' : 'choose today, starting from zero'
  const noCommissionHeading =
    locale === 'es' ? 'Mi recomendación sin comisión' : 'My pick that pays me nothing'
  const auditorHeading = locale === 'es' ? 'El auditor que construí' : 'The auditor I built'

  const elegiriaHoyIndex = html.indexOf(elegiriaHoyHeading)
  const noCommissionIndex = html.indexOf(noCommissionHeading)
  const auditorIndex = html.indexOf(auditorHeading)

  check(elegiriaHoyIndex !== -1, `${path}: falta el heading "${elegiriaHoyHeading}"`)
  check(noCommissionIndex !== -1, `${path}: falta el heading "${noCommissionHeading}"`)
  check(auditorIndex !== -1, `${path}: falta el heading "${auditorHeading}"`)

  // Orden exacto: elegiriaHoy -> noCommissionPick -> auditorHighlight.
  check(
    elegiriaHoyIndex !== -1 && noCommissionIndex !== -1 && elegiriaHoyIndex < noCommissionIndex,
    `${path}: "${elegiriaHoyHeading}" debe aparecer ANTES que "${noCommissionHeading}"`,
  )
  check(
    noCommissionIndex !== -1 && auditorIndex !== -1 && noCommissionIndex < auditorIndex,
    `${path}: "${noCommissionHeading}" debe aparecer ANTES que "${auditorHeading}"`,
  )

  if (auditorIndex !== -1) {
    // Ventana acotada al 3er callout completo (heading + narrative + link).
    const calloutSlice = html.slice(auditorIndex, auditorIndex + 3000)

    // (1) Los 4 datos verificables mencionados en la narrativa.
    check(calloutSlice.includes('29'), `${path}: la narrativa del auditor no menciona "29"`)
    check(calloutSlice.includes('5 ') || /5\s*categor/i.test(calloutSlice), `${path}: la narrativa del auditor no menciona "5 categorías"`)
    check(calloutSlice.includes('500'), `${path}: la narrativa del auditor no menciona "500"`)
    check(
      /Core Web Vitals/i.test(calloutSlice),
      `${path}: la narrativa del auditor no menciona "Core Web Vitals"`,
    )

    // (2) Contrato de link: rel="noopener" único (nunca sponsored/nofollow),
    // target="_blank", href a auditor.juan-tech.com, sr-only de nueva pestaña.
    const anchorMatch = calloutSlice.match(
      /<a\s+href="https:\/\/auditor\.juan-tech\.com"[^>]*>[\s\S]*?<\/a>/,
    )
    check(!!anchorMatch, `${path}: no se encontró el anchor hacia auditor.juan-tech.com`)
    if (anchorMatch) {
      const anchorHtml = anchorMatch[0]
      check(
        anchorHtml.includes('rel="noopener"'),
        `${path}: el anchor del auditor debe llevar rel="noopener" (único)`,
      )
      check(
        !anchorHtml.includes('sponsored') && !anchorHtml.includes('nofollow'),
        `${path}: el anchor del auditor NO debe llevar sponsored/nofollow — no es una relación de afiliado`,
      )
      check(
        anchorHtml.includes('target="_blank"'),
        `${path}: el anchor del auditor debe llevar target="_blank"`,
      )
      check(
        anchorHtml.includes('class="sr-only"'),
        `${path}: el anchor del auditor debe incluir un <span class="sr-only"> con el sufijo de nueva pestaña`,
      )
    }

    // (3) Sin badge/chip de "no-commission" alrededor de este 3er callout.
    const noCommissionBadge =
      locale === 'es' ? 'Recomendación sin comisión' : 'No-commission pick'
    check(
      !calloutSlice.includes(noCommissionBadge),
      `${path}: el callout del auditor no debe llevar el badge "${noCommissionBadge}"`,
    )
  }

  // (5) Ningún href debe contener la subcadena literal "undefined".
  const undefinedHrefs = html.match(/href="[^"]*undefined[^"]*"/g)
  check(
    !undefinedHrefs || undefinedHrefs.length === 0,
    `${path}: hrefs con "undefined": ${JSON.stringify(undefinedHrefs)}`,
  )

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
