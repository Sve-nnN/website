/**
 * SOLO LECTURA. Verifica el esquema y la siembra de la fase 54 en la base a la
 * que apunte DATABASE_URI: globals home-page y about-page, clientes.onDark y
 * logos del doc `stack`.
 *
 * No contiene ninguna llamada de escritura. Imprime host, puerto y base
 * (nunca usuario ni contraseña), así que es seguro pegar la salida en el chat.
 *
 * Se corre dos veces, con el usuario dueño (juantech_user) y con el rol de solo
 * lectura del preview (juantech_preview_ro). Si el rol del preview no puede leer
 * las tablas nuevas, el error `permission denied` sale aquí y no en una página
 * rota del preview (Pitfall 3 de RESEARCH).
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/23-phase54-verify-schema.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/23-phase54-verify-schema.ts --expect-seeded
 *   node_modules/.bin/tsx scripts/db/23-phase54-verify-schema.ts --selftest
 */
import {
  evaluateShadowState,
  safeTarget,
  type ShadowResult,
  type ShadowState,
} from './data/54-seed-lib'

const EXPECT_SEEDED = process.argv.includes('--expect-seeded')
const SELFTEST = process.argv.includes('--selftest')

function report(results: ShadowResult[]): number {
  let fails = 0
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}: ${r.why}`)
    if (!r.ok) fails++
  }
  return fails
}

function selftest(): never {
  const seeded: ShadowState = {
    home: {
      tagline: 'Texto',
      hero: { titleLine1: 'Linea' },
      services: { items: [1, 2, 3, 4, 5].map((n) => ({ n })) },
      process: { steps: [1, 2, 3, 4].map((n) => ({ n })) },
      vitals: { items: [1, 2, 3, 4].map((n) => ({ n })) },
      faq: { items: [1, 2, 3, 4, 5].map((n) => ({ n })) },
      contact: { steps: [1, 2, 3].map((n) => ({ n })), infoRows: [1, 2, 3].map((n) => ({ n })) },
    },
    about: { hero: { lead: 'Lead' }, experience: { stages: [1, 2, 3, 4, 5].map((n) => ({ n })) } },
    clientes: [{ onDark: false }, { onDark: true }],
    stackTools: { total: 25, withLogo: 9 },
  }
  const empty: ShadowState = {
    home: {},
    about: {},
    clientes: [{ onDark: false }],
    stackTools: { total: 25, withLogo: 0 },
  }
  let bad = 0
  const expect = (label: string, results: ShadowResult[], wantFails: 'none' | 'some') => {
    const fails = results.filter((r) => !r.ok).length
    const good = wantFails === 'none' ? fails === 0 : fails > 0
    console.log(`${good ? 'PASS' : 'FAIL'} ${label} (${fails} resultado(s) en FAIL)`)
    if (!good) bad++
  }
  expect('estado vacío válido sin expectSeeded', evaluateShadowState(empty, { expectSeeded: false }), 'none')
  expect('estado sembrado válido con expectSeeded', evaluateShadowState(seeded, { expectSeeded: true }), 'none')
  expect('estado vacío con expectSeeded produce FAIL', evaluateShadowState(empty, { expectSeeded: true }), 'some')
  process.exit(bad > 0 ? 1 : 0)
}

async function main() {
  if (SELFTEST) selftest()

  console.log('=== Verificación de esquema y siembra de la fase 54 (solo lectura) ===')
  console.log(`  host/base: ${safeTarget(process.env.DATABASE_URI)}`)
  console.log(`  modo: ${EXPECT_SEEDED ? 'esquema + siembra (--expect-seeded)' : 'solo esquema'}`)

  const { getPayload } = await import('payload')
  const { default: config } = await import('../../src/payload.config')
  const payload = await getPayload({ config })

  const denied: string[] = []
  async function attempt<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn()
    } catch (err) {
      const msg = err instanceof Error ? `${err.message} ${String((err as { cause?: unknown }).cause ?? '')}` : String(err)
      if (msg.toLowerCase().includes('permission denied')) {
        denied.push(label)
      } else {
        console.log(`  (lectura de ${label} falló: ${msg.slice(0, 200)})`)
      }
      return null
    }
  }

  const home = await attempt('home-page', () =>
    payload.findGlobal({ slug: 'home-page', locale: 'es', fallbackLocale: false, depth: 0 }),
  )
  const about = await attempt('about-page', () =>
    payload.findGlobal({ slug: 'about-page', locale: 'es', fallbackLocale: false, depth: 0 }),
  )
  const clientesRes = await attempt('clientes', () =>
    payload.find({
      collection: 'clientes',
      limit: 100,
      depth: 0,
      locale: 'es',
      fallbackLocale: false,
      select: { onDark: true },
    }),
  )
  const stackRes = await attempt('pages/stack', () =>
    payload.find({
      collection: 'pages',
      where: { slug: { equals: 'stack' } },
      locale: 'es',
      fallbackLocale: false,
      draft: false,
      depth: 0,
      limit: 1,
    }),
  )

  let stackTools: ShadowState['stackTools'] = null
  if (stackRes && stackRes.docs[0]) {
    const layout = ((stackRes.docs[0] as unknown as { content?: { layout?: unknown[] } }).content?.layout ?? []) as {
      blockType?: string
      categoryGroups?: { tools?: { logo?: unknown }[] }[]
    }[]
    let total = 0
    let withLogo = 0
    for (const b of layout) {
      if (b.blockType !== 'toolStack') continue
      for (const g of b.categoryGroups ?? []) {
        for (const t of g.tools ?? []) {
          total++
          if (t.logo) withLogo++
        }
      }
    }
    stackTools = { total, withLogo }
  }

  const state: ShadowState = {
    home: (home as unknown as Record<string, unknown>) ?? null,
    about: (about as unknown as Record<string, unknown>) ?? null,
    clientes: clientesRes ? (clientesRes.docs as unknown as { onDark?: boolean | null }[]) : null,
    stackTools,
  }

  if (denied.length > 0) {
    console.log(
      `FAIL permission denied al leer: ${denied.join(', ')}. El rol conectado no puede leer las tablas nuevas; la causa probable es que la migración no la aplicó juantech_user (Pitfall 3), así que el rol de solo lectura no heredó SELECT.`,
    )
  }
  const fails = report(evaluateShadowState(state, { expectSeeded: EXPECT_SEEDED })) + denied.length
  console.log(fails === 0 ? '\nTodo en PASS' : `\n${fails} resultado(s) en FAIL`)
  process.exit(fails === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
