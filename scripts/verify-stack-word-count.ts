/**
 * Phase 48 Plan 02, Task 3 (Paso 3) — STACK-02:
 *
 * Verifica el conteo de palabras REAL sobre el HTML renderizado de /stack y
 * /en/stack (no sobre el contenido crudo del CMS). Para cada
 * `data-tool-narrative="{slug-o-name}"` (marcador agregado por `ToolCard` en
 * Plan 48-01 Task 1, en el `<div>` que envuelve toda la card), extrae el
 * contenido HTML entre esa apertura y su cierre balanceado (contando
 * `<div`/`</div>` anidados — la card tiene varios divs dentro, Card/
 * CardContent/rows), le quita las etiquetas HTML, cuenta palabras y falla si
 * alguna narrativa tiene menos de 100 — reportando el nombre de la
 * herramienta y el conteo real.
 *
 * Sin librerías nuevas (sin cheerio/jsdom, per el Package Legitimacy Audit
 * de 48-RESEARCH.md).
 *
 * Run (con el dev server ya arriba, apuntando al Postgres real):
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-stack-word-count.ts
 */
const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const MIN_WORDS = 100

const failures: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    throw new Error(`${path}: esperaba 200, obtuvo ${res.status}`)
  }
  return res.text()
}

/**
 * Dado el índice de inicio de un atributo `data-tool-narrative="..."`,
 * retrocede hasta encontrar el `<div` que lo contiene, y luego avanza
 * contando aperturas/cierres de `<div` anidados hasta encontrar el cierre
 * balanceado. Retorna el HTML completo del bloque (incluyendo el propio
 * div marcador).
 */
function extractBalancedDiv(html: string, attrIndex: number): string {
  const divOpenStart = html.lastIndexOf('<div', attrIndex)
  if (divOpenStart === -1) {
    throw new Error('No se encontró la apertura <div del marcador data-tool-narrative')
  }

  const divOpenTagEnd = html.indexOf('>', divOpenStart)
  let cursor = divOpenTagEnd + 1
  let depth = 1

  while (depth > 0 && cursor < html.length) {
    const nextOpen = html.indexOf('<div', cursor)
    const nextClose = html.indexOf('</div>', cursor)

    if (nextClose === -1) {
      throw new Error('HTML mal formado: no se encontró cierre </div> balanceado')
    }

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1
      cursor = nextOpen + 4
    } else {
      depth -= 1
      cursor = nextClose + 6
    }
  }

  return html.slice(divOpenStart, cursor)
}

function stripTagsAndCountWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  return text.trim().split(/\s+/).filter(Boolean).length
}

async function verifyLocale(path: string, locale: 'es' | 'en') {
  const html = await fetchHtml(path)

  const markerRegex = /data-tool-narrative="([^"]+)"/g
  const matches = [...html.matchAll(markerRegex)]

  check(matches.length > 0, `${path}: no se encontró ningún data-tool-narrative en el HTML`)

  for (const match of matches) {
    const toolSlug = match[1]
    const attrIndex = match.index ?? 0
    const block = extractBalancedDiv(html, attrIndex)
    const wordCount = stripTagsAndCountWords(block)

    console.log(`  [${locale}] ${toolSlug}: ${wordCount} palabras`)
    check(
      wordCount >= MIN_WORDS,
      `${path}: "${toolSlug}" tiene ${wordCount} palabras, esperaba >=${MIN_WORDS}`,
    )
  }
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
