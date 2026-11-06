/**
 * READ-ONLY. Verifica de forma determinista que la salida compilada de
 * `src/app/globals.css` queda entera dentro de `@layer tailwind` y que el orden
 * `@layer tailwind, mui;` es lo primero del archivo (D-07, plan A de capas).
 *
 * Por qué existe: Tailwind v3 no emite capas nativas, y una regla sin capa gana
 * siempre a `@layer mui`. Si el plugin `postcss-tailwind-layer.cjs` deja de
 * correr, el reset de Tailwind aplasta los estilos de MUI sin ningún error de
 * build. Esta comprobación atrapa esa regresión sin abrir un navegador.
 *
 * Control negativo: procesa el mismo CSS solo con `tailwindcss` y `autoprefixer`
 * y exige que existan reglas de primer nivel sin capa. Si no existen, el script
 * no discrimina (pasaría igual con o sin plugin) y por eso falla.
 *
 * No toca la base de datos ni la red.
 *
 * Run (desde la raíz del repo):
 *   node scripts/verify/53-layer-check.mjs
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const require = createRequire(resolve(ROOT, 'package.json'))
const postcss = require('postcss')

const CSS_PATH = resolve(ROOT, 'src/app/globals.css')

function fail(reason) {
  console.log(`FAIL: ${reason}`)
  process.exit(1)
}

function loadPlugin(name, options) {
  const mod = require(name)
  const factory = mod && mod.default ? mod.default : mod
  return typeof factory === 'function' ? factory(options) : factory
}

// Plugins reales, tal cual los declara postcss.config.js (los './' se
// resuelven desde la raíz del repo, igual que hace Next).
const configUrl = pathToFileURL(resolve(ROOT, 'postcss.config.js')).href
const { default: postcssConfig } = await import(configUrl)
const entries = Object.entries(postcssConfig.plugins ?? {})
if (entries.length === 0) fail('postcss.config.js no declara plugins')

const css = readFileSync(CSS_PATH, 'utf8')

const withPlugin = await postcss(entries.map(([n, o]) => loadPlugin(n, o))).process(css, {
  from: CSS_PATH,
})
const nodes = withPlugin.root.nodes.filter((n) => n.type !== 'comment')

if (nodes.length !== 2) {
  fail(`la raíz tiene ${nodes.length} nodos (se esperaban exactamente 2)`)
}
const [order, layer] = nodes
if (order.type !== 'atrule' || order.name !== 'layer' || order.params.replace(/\s+/g, ' ') !== 'tailwind, mui') {
  fail('el primer nodo no es la sentencia `@layer tailwind, mui`')
}
if (order.nodes && order.nodes.length > 0) {
  fail('la sentencia de orden tiene cuerpo (debe ser una sentencia sin hijos)')
}
if (layer.type !== 'atrule' || layer.name !== 'layer' || layer.params.trim() !== 'tailwind') {
  fail('el segundo nodo no es `@layer tailwind`')
}
if (!layer.nodes || layer.nodes.length === 0) {
  fail('`@layer tailwind` está vacío')
}

let sawButtonReset = false
layer.walkRules((rule) => {
  if (rule.selector.split(',').map((s) => s.trim()).includes('button')) {
    rule.walkDecls('background-color', (d) => {
      if (d.value.trim() === 'transparent') sawButtonReset = true
    })
  }
})
if (!sawButtonReset) {
  fail('dentro de la capa no hay `button { background-color: transparent }` (Tailwind no corrió)')
}

// Control negativo: sin el plugin local debe haber reglas de primer nivel sin capa.
const baseOnly = entries.filter(([n]) => !n.startsWith('./'))
const withoutPlugin = await postcss(baseOnly.map(([n, o]) => loadPlugin(n, o))).process(css, {
  from: CSS_PATH,
})
const unlayered = withoutPlugin.root.nodes.filter((n) => n.type === 'rule')
if (unlayered.length === 0) {
  fail('control negativo: sin el plugin no hay reglas sin capa, el script no discrimina')
}

console.log(
  `OK (capa tailwind con ${layer.nodes.length} nodos; control negativo: ${unlayered.length} reglas sin capa sin el plugin)`,
)
