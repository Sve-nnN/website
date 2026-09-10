/**
 * Phase 49 Plan 03, Task 1 — el gate empírico de GATE-01 (ROADMAP.md) para la
 * única pieza de riesgo real que queda abierta en la fase: leer
 * `searchParams` en `blog/[category]/[slug]/page.tsx` (Wave 2, Plan 49-02)
 * saca esa ruta de ISR hacia render dinámico per-request.
 *
 * Metodología: la MISMA que 45-02-PLAN.md usó para el baseline de la fase
 * (`scripts/lighthouse-mobile.mjs`, mediana de N corridas, misma clasificación
 * de bandas CWV good/needs-improvement/poor). No se inventa una herramienta
 * nueva.
 *
 * Nota de honestidad metodológica (documentada también en el SUMMARY): las 14
 * rutas del baseline de Phase 45 (Home, /en, 8 landings de servicio, 4 geo)
 * NO incluyen ninguna ruta de post — no existe una "ruta de post comparable"
 * literal contra la cual diffear archivo-contra-archivo. Comparar un build
 * local contra los números de Phase 45 (capturados contra PRODUCCIÓN live)
 * sería además una comparación metodológicamente inválida por sí misma
 * (latencia de red, infraestructura), sin importar la ruta elegida.
 *
 * Por eso el gate real y automatizable de este script es la comparación
 * explícitamente pedida por el <action> del plan: variante (a) URL plana vs
 * variante (b) con `?subscribed=pending` agregado, AMBAS contra el MISMO
 * build local, MISMA ruta, mismo método — para confirmar que el parámetro en
 * sí no agrega costo por encima del costo de render dinámico que la ruta ya
 * paga incondicionalmente (la clasificación de Next.js es todo-o-nada). El
 * bar aplicado a esa comparación es exactamente el de GATE-01: sin caída de
 * más de 5 puntos de performance, sin cruce de banda de CWV, delta de CLS
 * 0.00. Los números absolutos de la variante (a) se reportan además junto al
 * rango que Phase 45 observó en sus 14 rutas, como contexto de cordura, no
 * como gate estricto (mismatch metodológico ya explicado).
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.dirname(__dirname)
const LIGHTHOUSE_SCRIPT = path.join(__dirname, 'lighthouse-mobile.mjs')
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const OUT_ARTIFACT = path.join(
  REPO_ROOT,
  '.planning/phases/49-captura-de-email-resend-env-gated/lh-phase49-post-capture.json',
)

type Scores = {
  performance: number
  accessibility: number
  'best-practices': number
  seo: number
  lcpMs: number
  cls: number
  tbtMs: number
  error?: string
}

const METRICS = ['performance', 'accessibility', 'best-practices', 'seo', 'lcpMs', 'cls', 'tbtMs'] as const

function median(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b)
  const n = s.length
  return n % 2 === 1 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2
}

function bandLcp(ms: number): 'good' | 'needs-improvement' | 'poor' {
  return ms <= 2500 ? 'good' : ms <= 4000 ? 'needs-improvement' : 'poor'
}
function bandCls(v: number): 'good' | 'needs-improvement' | 'poor' {
  return v <= 0.1 ? 'good' : v <= 0.25 ? 'needs-improvement' : 'poor'
}
function bandTbt(ms: number): 'good' | 'needs-improvement' | 'poor' {
  return ms <= 200 ? 'good' : ms <= 600 ? 'needs-improvement' : 'poor'
}
const BAND_RANK = { good: 0, 'needs-improvement': 1, poor: 2 }

function runOnce(routePath: string): Scores {
  const tmpDir = mkdtempSync(path.join(tmpdir(), 'lh49-'))
  const outFile = path.join(tmpDir, 'out.json')
  const result = spawnSync(
    'node',
    [LIGHTHOUSE_SCRIPT, '--base-url', BASE_URL, '--routes-only', routePath, '--out', outFile],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  if (result.status !== 0 && !result.stdout?.includes('Scores written')) {
    console.error(result.stdout)
    console.error(result.stderr)
    throw new Error(`lighthouse-mobile.mjs failed for ${routePath} (exit ${result.status})`)
  }
  const raw = JSON.parse(readFileSync(outFile, 'utf-8'))
  const scores = raw[routePath] as Scores
  if (!scores || scores.error) {
    throw new Error(`lighthouse-mobile.mjs returned an error for ${routePath}: ${scores?.error}`)
  }
  return scores
}

/** Mediana de 3 corridas; si el spread de performance supera 15 puntos, escala a 5 (mismo patrón de 45-02-PLAN.md). */
function measureMedian(routePath: string, runs: number): { median: Scores; raw: Scores[]; escalated: boolean } {
  const readings: Scores[] = []
  for (let i = 0; i < runs; i++) {
    console.log(`  corrida ${i + 1}/${runs} -> ${routePath}`)
    readings.push(runOnce(routePath))
  }
  const perfSpread = Math.max(...readings.map((r) => r.performance)) - Math.min(...readings.map((r) => r.performance))
  let escalated = false
  if (runs === 3 && perfSpread > 15) {
    escalated = true
    console.log(`  spread de performance ${perfSpread} > 15 en ${routePath} -> escalando a 5 lecturas`)
    for (let i = 0; i < 2; i++) {
      console.log(`  corrida extra ${i + 1}/2 -> ${routePath}`)
      readings.push(runOnce(routePath))
    }
  }
  const out: any = {}
  for (const m of METRICS) {
    out[m] = median(readings.map((r) => r[m] as number))
  }
  return { median: out as Scores, raw: readings, escalated }
}

async function main() {
  console.log(`BASE_URL=${BASE_URL}`)
  console.log('=== ES: variante (a) plana vs (b) ?subscribed=pending — mediana de 3 (escala a 5 si spread > 15) ===')

  const esRouteA = '/blog/tech-seo/technical-seo-checklist'
  const esRouteB = '/blog/tech-seo/technical-seo-checklist?subscribed=pending'
  const esA = measureMedian(esRouteA, 3)
  const esB = measureMedian(esRouteB, 3)

  console.log('ES (a) mediana:', esA.median)
  console.log('ES (b) mediana:', esB.median)

  console.log('=== EN: mismo protocolo que ES (mediana de 3, escala a 5 si spread > 15) ===')
  const enRouteA = '/en/blog/tech-seo/technical-seo-checklist'
  const enRouteB = '/en/blog/tech-seo/technical-seo-checklist?subscribed=pending'
  const enA = measureMedian(enRouteA, 3)
  const enB = measureMedian(enRouteB, 3)
  console.log('EN (a) mediana:', enA.median)
  console.log('EN (b) mediana:', enB.median)

  // --- Gate GATE-01 aplicado a (a) vs (b), ES y EN por igual ---
  function gateCheck(label: string, a: Scores, b: Scores) {
    const perfDrop = a.performance - b.performance
    const lcpBandA = bandLcp(a.lcpMs)
    const lcpBandB = bandLcp(b.lcpMs)
    const tbtBandA = bandTbt(a.tbtMs)
    const tbtBandB = bandTbt(b.tbtMs)
    const clsBandA = bandCls(a.cls)
    const clsBandB = bandCls(b.cls)
    const clsDelta = Number((b.cls - a.cls).toFixed(3))
    const lcpCrossed = BAND_RANK[lcpBandB] > BAND_RANK[lcpBandA]
    const tbtCrossed = BAND_RANK[tbtBandB] > BAND_RANK[tbtBandA]
    const clsCrossed = BAND_RANK[clsBandB] > BAND_RANK[clsBandA]
    const localReasons: string[] = []
    if (perfDrop > 5) localReasons.push(`[${label}] performance cae ${perfDrop} puntos de (a)=${a.performance} a (b)=${b.performance} (> 5)`)
    if (lcpCrossed) localReasons.push(`[${label}] LCP cruza de banda ${lcpBandA} -> ${lcpBandB} (a=${a.lcpMs}ms, b=${b.lcpMs}ms)`)
    if (tbtCrossed) localReasons.push(`[${label}] TBT cruza de banda ${tbtBandA} -> ${tbtBandB} (a=${a.tbtMs}ms, b=${b.tbtMs}ms)`)
    if (clsCrossed) localReasons.push(`[${label}] CLS cruza de banda ${clsBandA} -> ${clsBandB} (a=${a.cls}, b=${b.cls})`)
    if (Math.abs(clsDelta) > 0) localReasons.push(`[${label}] delta de CLS ${clsDelta} distinto de 0.00 (a=${a.cls}, b=${b.cls})`)
    return { perfDrop, lcpBandA, lcpBandB, tbtBandA, tbtBandB, clsBandA, clsBandB, clsDelta, reasons: localReasons }
  }

  const esGate = gateCheck('ES', esA.median, esB.median)
  const enGate = gateCheck('EN', enA.median, enB.median)
  const { perfDrop, lcpBandA, lcpBandB, tbtBandA, tbtBandB, clsBandA, clsBandB, clsDelta } = esGate
  const reasons = [...esGate.reasons, ...enGate.reasons]

  // Chequeo de cordura informativo contra el rango observado en las 14 rutas
  // del baseline de Phase 45 (producción live) — NO es un gate estricto por
  // el mismatch metodológico documentado arriba (local build vs producción,
  // sin ruta de post en ese baseline).
  const phase45Range = {
    performance: [64, 87],
    lcpMsWorstBand: 'poor (hasta 5461ms observado en /)',
    clsAllGood: true,
    tbtRangeMs: [30, 202],
  }
  console.log('\nContexto (NO gate estricto): rango observado en las 14 rutas de lh-phase45-baseline.json:', phase45Range)
  console.log(`ES (a) absolute: performance=${esA.median.performance}, lcpMs=${esA.median.lcpMs} (${lcpBandA}), cls=${esA.median.cls} (${clsBandA}), tbtMs=${esA.median.tbtMs} (${tbtBandA})`)

  const artifact = {
    baseUrl: BASE_URL,
    capturedAt: new Date().toISOString(),
    methodologyNote:
      'Comparación (a) plana vs (b) ?subscribed=pending sobre la MISMA ruta y el MISMO build local (scripts/lighthouse-mobile.mjs, mediana de 3, escalado a 5 si spread>15 — mismo patrón que 45-02-PLAN.md). Phase 45 no tiene ninguna ruta de post en su baseline de 14 rutas; comparar un build local contra sus números (capturados contra producción live) sería ademas metodológicamente inválido por la ruta elegida. Por eso el gate estricto de GATE-01 se aplica al delta (a)->(b), y los números absolutos de (a) se reportan solo como contexto frente al rango de Phase 45.',
    es: { routeA: esRouteA, routeB: esRouteB, medianA: esA.median, medianB: esB.median, rawA: esA.raw, rawB: esB.raw, escalatedA: esA.escalated, escalatedB: esB.escalated },
    en: { routeA: enRouteA, routeB: enRouteB, medianA: enA.median, medianB: enB.median, rawA: enA.raw, rawB: enB.raw, escalatedA: enA.escalated, escalatedB: enB.escalated },
    gate: { es: esGate, en: enGate, perfDrop, lcpBandA, lcpBandB, tbtBandA, tbtBandB, clsBandA, clsBandB, clsDelta, reasons },
    phase45ContextRange: phase45Range,
  }
  writeFileSync(OUT_ARTIFACT, JSON.stringify(artifact, null, 2) + '\n')
  console.log(`\nArtefacto escrito en ${OUT_ARTIFACT}`)

  if (reasons.length === 0) {
    console.log('\nGATE-01 (a)->(b): PASS — sin caída de performance > 5 puntos, sin cruce de banda de CWV, delta de CLS 0.00.')
    console.log('LIGHTHOUSE_PASS')
  } else {
    console.log('\nGATE-01 (a)->(b): NO PASA. Razones:')
    for (const r of reasons) console.log(`  - ${r}`)
    console.log(
      '\nPer el plan 49-03: NO se aplica en silencio el fallback de 49-RESEARCH.md (redirigir a una superficie separada). Se escala a checkpoint:decision.',
    )
    console.log('LIGHTHOUSE_ESCALATED')
  }
}

main().catch((err) => {
  console.error('verify-phase49-lighthouse.ts crashed:', err)
  process.exit(1)
})
