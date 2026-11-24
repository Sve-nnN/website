/**
 * Verifica MOTION_INIT_SCRIPT (fase 53, D-15, T-53-22, T-53-23) ejecutándolo de
 * verdad en un sandbox `vm` contra un `document`, un `localStorage` y un
 * `matchMedia` falsos. No confía en leer el código: lo corre.
 *
 * Casos:
 *   1. guardado `paused` gana aunque matchMedia no reduzca
 *   2. guardado `running` gana aunque matchMedia reduzca
 *   3. sin valor y con reduce da `paused`
 *   4. sin valor y sin reduce da `running`
 *   5. valor guardado inválido cae al criterio de matchMedia
 *   6. si getItem lanza, da `running`
 *   7. la cadena mide menos de 400 caracteres y no cierra la etiqueta script
 *
 * Run:
 *   node_modules/.bin/tsx scripts/verify/53-motion-script.ts
 */
import assert from 'node:assert'
import vm from 'node:vm'

import { MOTION_INIT_SCRIPT, MOTION_STORAGE_KEY } from '../../src/theme/motion-init'

type Env = { stored: string | null; reduce: boolean; throwOnRead?: boolean }

function run({ stored, reduce, throwOnRead }: Env): string | null {
  let attr: string | null = null
  const sandbox = {
    localStorage: {
      getItem(key: string) {
        if (throwOnRead) throw new Error('storage bloqueado')
        return key === MOTION_STORAGE_KEY ? stored : null
      },
    },
    matchMedia: (q: string) => ({ matches: q.includes('prefers-reduced-motion') ? reduce : false }),
    document: {
      documentElement: {
        setAttribute(name: string, value: string) {
          if (name === 'data-motion') attr = value
        },
      },
    },
  }
  vm.runInNewContext(MOTION_INIT_SCRIPT, sandbox)
  return attr
}

const cases: Array<[string, () => void]> = [
  ['guardado paused gana sin reduce', () => assert.strictEqual(run({ stored: 'paused', reduce: false }), 'paused')],
  ['guardado running gana con reduce', () => assert.strictEqual(run({ stored: 'running', reduce: true }), 'running')],
  ['sin valor y con reduce da paused', () => assert.strictEqual(run({ stored: null, reduce: true }), 'paused')],
  ['sin valor y sin reduce da running', () => assert.strictEqual(run({ stored: null, reduce: false }), 'running')],
  [
    'valor invalido cae a matchMedia',
    () => {
      assert.strictEqual(run({ stored: 'x', reduce: true }), 'paused')
      assert.strictEqual(run({ stored: 'x', reduce: false }), 'running')
    },
  ],
  ['getItem lanza da running', () => assert.strictEqual(run({ stored: 'paused', reduce: true, throwOnRead: true }), 'running')],
  [
    'cadena corta y sin cierre de script',
    () => {
      assert.ok(MOTION_INIT_SCRIPT.length < 400, `longitud ${MOTION_INIT_SCRIPT.length}`)
      assert.ok(!/<\/script/i.test(MOTION_INIT_SCRIPT), 'contiene cierre de script')
    },
  ],
]

let failed = false
for (const [name, fn] of cases) {
  try {
    fn()
  } catch (err) {
    failed = true
    console.log(`FAIL ${name}: ${(err as Error).message}`)
  }
}

if (failed) process.exit(1)
console.log('OK')
