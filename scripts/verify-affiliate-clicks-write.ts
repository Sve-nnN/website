/**
 * Verifica GO-04 (escritura): un clic normal deja fila vía after(); un bot y
 * un IP throttled no dejan fila pero sí reciben el 302 correcto.
 *
 * Requiere el dev server corriendo con:
 *   GO_CLICK_THROTTLE_WINDOW_MS=60000 GO_CLICK_THROTTLE_MAX_HITS=2 npm run dev
 *
 * Run:
 *   node --env-file=.env node_modules/.bin/tsx scripts/verify-affiliate-clicks-write.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const BASE_URL = process.env.VERIFY_BASE_URL ?? 'http://localhost:3000'
const TEST_SLUG = 'go-verify-clicks-writer'
const TARGET_URL = 'https://example.com/go-verify-clicks-target'
const NORMAL_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Verify/1.0'
const BOT_UA = 'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)'

const failures: string[] = []

function check(condition: boolean, message: string) {
  if (!condition) failures.push(message)
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Drena el body de la respuesta explícitamente: dejar un ReadableStream sin
// consumir puede mantener el socket half-open entre requests sucesivos y
// afectar cuándo Next corre after() en el server bajo next dev.
async function goRequest(url: string, userAgent: string): Promise<Response> {
  const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': userAgent } })
  await res.text()
  return res
}

async function clickCount(payload: Awaited<ReturnType<typeof getPayload>>): Promise<number> {
  const { totalDocs } = await payload.count({
    collection: 'affiliate-clicks',
    where: { slug: { equals: TEST_SLUG } },
  })
  return totalDocs
}

// after() corre en segundo plano tras enviar la respuesta — la primera
// llamada de este proceso a getPayload() dentro de after() paga el costo de
// inicialización completa de Payload (registro de colecciones + pool de
// Postgres vía el túnel SSH), que puede superar holgadamente un timeout fijo
// corto. Poll con timeout generoso en vez de un `wait` fijo.
async function waitForClickCount(
  payload: Awaited<ReturnType<typeof getPayload>>,
  expected: number,
  timeoutMs = 10000,
): Promise<number> {
  const start = Date.now()
  let last = await clickCount(payload)
  while (last !== expected && Date.now() - start < timeoutMs) {
    await wait(300)
    last = await clickCount(payload)
  }
  return last
}

async function main() {
  const payload = await getPayload({ config })

  const linkDoc = await payload.create({
    collection: 'affiliate-links',
    data: {
      name: 'GO Verify Clicks Writer',
      slug: TEST_SLUG,
      program: 'other',
      active: true,
      destinations: [{ marketplace: 'default', url: TARGET_URL }],
    },
  })

  try {
    check((await clickCount(payload)) === 0, 'count inicial de affiliate-clicks para este slug debería ser 0')

    // Dos clics normales seguidos: el conteo debe llegar a 2 (máximo
    // permitido por GO_CLICK_THROTTLE_MAX_HITS=2 en el dev server de este
    // script).
    for (let i = 1; i <= 2; i++) {
      const res = await goRequest(`${BASE_URL}/go/${TEST_SLUG}`, NORMAL_UA)
      check(res.status === 302, `clic normal #${i}: esperaba 302, obtuvo ${res.status}`)
      check(
        res.headers.get('location') === TARGET_URL,
        `clic normal #${i}: Location esperado "${TARGET_URL}", obtuvo "${res.headers.get('location')}"`,
      )
    }
    const countAfterTwo = await waitForClickCount(payload, 2)
    check(countAfterTwo === 2, `tras 2 clics normales, count esperado 2, obtuvo ${countAfterTwo}`)

    // Tercer clic normal: throttled — 302 correcto, sin fila nueva.
    const thirdRes = await goRequest(`${BASE_URL}/go/${TEST_SLUG}`, NORMAL_UA)
    check(thirdRes.status === 302, `clic #3 (throttled): esperaba 302, obtuvo ${thirdRes.status}`)
    check(
      thirdRes.headers.get('location') === TARGET_URL,
      `clic #3 (throttled): Location esperado "${TARGET_URL}", obtuvo "${thirdRes.headers.get('location')}"`,
    )
    // Sin fila nueva esperada: no hay valor "correcto" que esperar con poll,
    // así que se da un margen generoso fijo y se confirma que sigue en 2.
    await wait(3000)
    const countAfterThrottled = await clickCount(payload)
    check(countAfterThrottled === 2, `tras clic throttled, count debería seguir en 2, obtuvo ${countAfterThrottled}`)

    // Cuarto clic con User-Agent de bot: 302 correcto, sin fila nueva.
    const fourthRes = await goRequest(`${BASE_URL}/go/${TEST_SLUG}`, BOT_UA)
    check(fourthRes.status === 302, `clic #4 (bot): esperaba 302, obtuvo ${fourthRes.status}`)
    check(
      fourthRes.headers.get('location') === TARGET_URL,
      `clic #4 (bot): Location esperado "${TARGET_URL}", obtuvo "${fourthRes.headers.get('location')}"`,
    )
    await wait(3000)
    const countAfterBot = await clickCount(payload)
    check(countAfterBot === 2, `tras clic de bot, count debería seguir en 2, obtuvo ${countAfterBot}`)
  } finally {
    // Limpieza: filas de affiliate-clicks con este slug + el doc de prueba.
    const { docs: clickDocs } = await payload.find({
      collection: 'affiliate-clicks',
      where: { slug: { equals: TEST_SLUG } },
      limit: 100,
    })
    for (const clickDoc of clickDocs) {
      await payload.delete({ collection: 'affiliate-clicks', id: clickDoc.id })
    }
    await payload.delete({ collection: 'affiliate-links', id: linkDoc.id })

    const finalCount = await clickCount(payload)
    check(finalCount === 0, `tras limpieza, count debería volver a 0, obtuvo ${finalCount}`)
  }

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
