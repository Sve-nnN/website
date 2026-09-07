/**
 * Barrido de aceptacion de 48.5-01-PLAN.md Task 2 — datos verificables,
 * contrato de link, y no-confusion con AuditOfferBlock. Corre contra el dev
 * server real (ya debe estar arriba en http://localhost:3000). No mockea
 * nada, no escribe datos — solo lee HTML servido.
 *
 * Run (con el dev server ya arriba):
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-phase48-5-home-auditor.ts
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

/**
 * Mismo principio que verify-stack-page.ts: Next.js App Router repite el
 * HTML servido dentro del payload de hidratacion JSON-escapado
 * (`self.__next_f.push(...)`). Truncar en el primer script tag de ese tipo
 * aisla el DOM visible real sin necesitar un parser de HTML.
 */
function visibleDomOnly(html: string): string {
  const flightPayloadStart = html.indexOf('self.__next_f.push')
  return flightPayloadStart === -1 ? html : html.slice(0, flightPayloadStart)
}

/** Tokeniza en palabras en minusculas, sin puntuacion. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
}

/** true si hay una corrida contigua de mas de 3 tokens compartida entre a y b. */
function sharesLongTokenRun(a: string, b: string): boolean {
  const tokensA = tokenize(a)
  const tokensB = tokenize(b)
  for (let i = 0; i < tokensA.length; i++) {
    for (let len = 4; i + len <= tokensA.length; len++) {
      const run = tokensA.slice(i, i + len).join(' ')
      if (tokensB.join(' ').includes(run)) return true
    }
  }
  return false
}

const statLabels: Record<'es' | 'en', { checks: string; categories: string; urls: string; cwv: string }> = {
  es: {
    checks: 'checks técnicos',
    categories: 'categorías',
    urls: 'URLs por auditoría',
    cwv: 'Core Web Vitals (PageSpeed Insights)',
  },
  en: {
    checks: 'technical checks',
    categories: 'categories',
    urls: 'URLs per audit',
    cwv: 'Core Web Vitals (PageSpeed Insights)',
  },
}

const freeTierNote: Record<'es' | 'en', string> = {
  es: 'Plan gratuito: 1 auditoría por semana, por email verificado.',
  en: 'Free tier: 1 audit per week, per verified email.',
}

// Headings reales, leidos directamente de la base (48.5-01-PLAN.md Task 2
// read_first): AuditOfferBlock.title real en produccion, y AboutSection.title
// (identico en ambos locales hoy — gap de contenido pre-existente, fuera de
// alcance de esta fase, no algo que este script deba "corregir").
const auditOfferHeading: Record<'es' | 'en', string> = {
  es: 'Empecemos por una auditoría técnica',
  en: 'We start with a technical audit',
}
const aboutSectionHeading = 'Mi enfoque en Consultoría Técnica'

async function verifyLocale(path: string, locale: 'es' | 'en') {
  const { res, html } = await fetchHtml(path)
  check(res.status === 200, `${path}: esperaba 200, obtuvo ${res.status}`)

  const domOnly = visibleDomOnly(html)

  // (5) Ningun href debe contener la subcadena literal "undefined".
  const undefinedHrefs = domOnly.match(/href="[^"]*undefined[^"]*"/g)
  check(
    !undefinedHrefs || undefinedHrefs.length === 0,
    `${path}: hrefs con "undefined": ${JSON.stringify(undefinedHrefs)}`,
  )

  // Ventana aislada alrededor del anchor de salida — el bloque completo
  // (icono+titulo+descripcion, stats, CTA, freeTierNote) vive antes y
  // despues de "auditor.juan-tech.com" en ese orden de DOM.
  const anchorIndex = domOnly.indexOf('auditor.juan-tech.com')
  check(anchorIndex !== -1, `${path}: no se encontro ningun href a auditor.juan-tech.com`)
  if (anchorIndex === -1) return

  const windowStart = Math.max(0, anchorIndex - 3000)
  const windowEnd = Math.min(domOnly.length, anchorIndex + 1500)
  const blockSlice = domOnly.slice(windowStart, windowEnd)

  // (1) Los 4 valores exactos, cada uno junto a su label traducido, dentro
  // de la ventana del bloque (no sueltos en cualquier parte de la pagina).
  const labels = statLabels[locale]
  check(
    blockSlice.includes('>29<') && blockSlice.includes(labels.checks),
    `${path}: no se encontro el stat "29" junto a "${labels.checks}" en el bloque`,
  )
  check(
    blockSlice.includes('>5<') && blockSlice.includes(labels.categories),
    `${path}: no se encontro el stat "5" junto a "${labels.categories}" en el bloque`,
  )
  check(
    blockSlice.includes('>500<') && blockSlice.includes(labels.urls),
    `${path}: no se encontro el stat "500" junto a "${labels.urls}" en el bloque`,
  )
  check(
    blockSlice.includes('>CWV<') && blockSlice.includes(labels.cwv),
    `${path}: no se encontro el stat "CWV" junto a "${labels.cwv}" en el bloque`,
  )

  // (2) freeTierNote visible (nunca sr-only).
  const noteText = freeTierNote[locale]
  const noteIndex = blockSlice.indexOf(noteText)
  check(noteIndex !== -1, `${path}: no se encontro el texto del freeTierNote ("${noteText}") en el bloque`)
  if (noteIndex !== -1) {
    // Retroceder hasta la apertura del tag <p ...> que envuelve el texto.
    const tagOpenIndex = blockSlice.lastIndexOf('<p', noteIndex)
    const tagCloseIndex = blockSlice.indexOf('>', tagOpenIndex)
    const openTag = blockSlice.slice(tagOpenIndex, tagCloseIndex + 1)
    check(
      !openTag.includes('sr-only'),
      `${path}: el freeTierNote NO debe estar en un elemento sr-only (tag encontrado: "${openTag}")`,
    )
  }

  // (3) Contrato del link: rel="noopener" unico, target="_blank", sr-only de
  // nueva pestana en el texto del link.
  const anchorTagMatch = blockSlice.match(/<a\s+href="https:\/\/auditor\.juan-tech\.com"[^>]*>/)
  check(!!anchorTagMatch, `${path}: no se encontro el tag <a> completo hacia auditor.juan-tech.com`)
  if (anchorTagMatch) {
    const anchorTag = anchorTagMatch[0]
    check(anchorTag.includes('rel="noopener"'), `${path}: el anchor debe llevar rel="noopener" (tag: "${anchorTag}")`)
    check(
      !anchorTag.includes('sponsored') && !anchorTag.includes('nofollow'),
      `${path}: el anchor NUNCA debe llevar sponsored ni nofollow (tag: "${anchorTag}")`,
    )
    check(anchorTag.includes('target="_blank"'), `${path}: el anchor debe llevar target="_blank" (tag: "${anchorTag}")`)

    const anchorEnd = (anchorTagMatch.index ?? 0) + anchorTag.length
    const anchorBodyEnd = blockSlice.indexOf('</a>', anchorEnd)
    const anchorBody = blockSlice.slice(anchorEnd, anchorBodyEnd === -1 ? undefined : anchorBodyEnd)
    check(
      anchorBody.includes('class="sr-only"') || anchorBody.includes('className="sr-only"'),
      `${path}: el texto del link debe incluir un <span class="sr-only"> con el sufijo de nueva pestaña (body: "${anchorBody}")`,
    )
  }

  // (4) No-confusion con AuditOfferBlock: ninguna corrida de >3 tokens
  // compartida entre el heading real de AuditOfferBlock y el de
  // AuditorHighlight; AboutSection aparece en un indice intermedio (buffer).
  const auditOfferIndex = domOnly.indexOf(auditOfferHeading[locale])
  check(auditOfferIndex !== -1, `${path}: no se encontro el heading real de AuditOfferBlock ("${auditOfferHeading[locale]}")`)

  const aboutSectionIndex = domOnly.indexOf(aboutSectionHeading)
  check(aboutSectionIndex !== -1, `${path}: no se encontro el heading de AboutSection ("${aboutSectionHeading}")`)

  if (auditOfferIndex !== -1 && aboutSectionIndex !== -1) {
    check(
      anchorIndex < aboutSectionIndex && aboutSectionIndex < auditOfferIndex,
      `${path}: AboutSection (index ${aboutSectionIndex}) debe quedar ENTRE AuditorHighlight (index ${anchorIndex}) y AuditOfferBlock (index ${auditOfferIndex}) — buffer no confirmado`,
    )
  }

  check(
    !sharesLongTokenRun(auditOfferHeading[locale], 'Construí mi propio auditor SEO') &&
      !sharesLongTokenRun(auditOfferHeading[locale], 'I built my own SEO auditor'),
    `${path}: el heading de AuditOfferBlock comparte una corrida de más de 3 palabras con el de AuditorHighlight`,
  )
}

async function main() {
  await verifyLocale('/', 'es')
  await verifyLocale('/en', 'en')

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
