/**
 * READ-ONLY. Comprobación inversa de capas y de retiro de Tailwind (plan 57-07, CAL-03, D-06).
 *
 * Hasta la fase 56 este script exigía que Tailwind existiera y que su salida quedara entera
 * dentro de `@layer tailwind`. Tailwind salió del repo, así que ahora protege lo contrario:
 *
 *   1. No existen tailwind.config.*, postcss.config.*, postcss-tailwind-layer.cjs ni components.json.
 *   2. package.json no declara tailwindcss, tailwindcss-animate, tailwind-merge,
 *      class-variance-authority, clsx, autoprefixer ni ningún @radix-ui/react-*.
 *   3. Nada de src importa esos paquetes.
 *   4. src/app/globals.css no tiene directivas de Tailwind (@tailwind, @apply, @config, theme())
 *      y su contenido queda entero en `@layer reset`, con `@layer reset, mui;` como primer nodo.
 *      El reinicio base sigue en una capa por debajo de `mui` por la razón de siempre: una
 *      regla sin capa gana a cualquier capa y aplastaría los estilos de MUI sin ningún error.
 *   5. Providers.tsx repite la sentencia de orden `@layer reset, mui;` y el tema no nombra `tailwind`.
 *
 * Control negativo: el detector de globals.css se prueba contra tres CSS malos (una directiva de
 * Tailwind, una regla suelta sin capa y el orden invertido) y debe marcar los tres. Si alguno
 * pasa, el script no discrimina y por eso falla.
 *
 * No toca la base de datos ni la red.
 *
 * Run (desde la raíz del repo):
 *   node scripts/verify/53-layer-check.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const require = createRequire(resolve(ROOT, 'package.json'))
const postcss = require('postcss')

const CSS_PATH = resolve(ROOT, 'src/app/globals.css')

const REMOVED_FILES = [
  'tailwind.config.ts',
  'tailwind.config.js',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
  'postcss.config.js',
  'postcss.config.mjs',
  'postcss.config.cjs',
  'postcss-tailwind-layer.cjs',
  'components.json',
]

const REMOVED_PACKAGES = [
  'tailwindcss',
  'tailwindcss-animate',
  'tailwind-merge',
  'class-variance-authority',
  'clsx',
  'autoprefixer',
]
const isRemovedPackage = (name) => REMOVED_PACKAGES.includes(name) || name.startsWith('@radix-ui/')

function fail(reason) {
  console.log(`FAIL: ${reason}`)
  process.exit(1)
}

/** Motivos por los que un CSS no cumple el contrato de capas. Vacío si cumple. */
export function cssProblems(css) {
  const problems = []
  const root = postcss.parse(css)
  const nodes = root.nodes.filter((n) => n.type !== 'comment')

  root.walkAtRules((rule) => {
    if (['tailwind', 'apply', 'config', 'screen', 'variants', 'responsive'].includes(rule.name)) {
      problems.push(`directiva de Tailwind @${rule.name}`)
    }
  })
  root.walkDecls((d) => {
    if (/\btheme\(/.test(d.value)) problems.push(`función theme() de Tailwind en ${d.prop}`)
  })

  const [order, layer, ...rest] = nodes
  if (!order || order.type !== 'atrule' || order.name !== 'layer' || order.params.replace(/\s+/g, ' ') !== 'reset, mui') {
    problems.push('el primer nodo no es la sentencia `@layer reset, mui`')
  } else if (order.nodes && order.nodes.length > 0) {
    problems.push('la sentencia de orden tiene cuerpo (debe ser una sentencia sin hijos)')
  }
  if (!layer || layer.type !== 'atrule' || layer.name !== 'layer' || layer.params.trim() !== 'reset') {
    problems.push('el segundo nodo no es `@layer reset`')
  } else if (!layer.nodes || layer.nodes.length === 0) {
    problems.push('`@layer reset` está vacío')
  }
  if (rest.length > 0) {
    problems.push(`hay ${rest.length} nodo(s) fuera de la capa (una regla sin capa gana a la capa mui)`)
  }
  return problems
}

// 1. Archivos retirados.
for (const f of REMOVED_FILES) {
  if (existsSync(resolve(ROOT, f))) fail(`existe ${f}, y Tailwind ya salió del repo`)
}

// 2. Dependencias retiradas.
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies })
const stillDeclared = declared.filter(isRemovedPackage)
if (stillDeclared.length > 0) fail(`package.json aún declara ${stillDeclared.join(', ')}`)

// 3. Ningún import de esos paquetes en src.
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(tsx?|mjs|cjs|js|jsx|css)$/.test(e)) out.push(p)
  }
  return out
}
const importRe = /(?:from\s+|import\s*\(\s*|require\s*\(\s*|import\s+)['"]([^'"]+)['"]/g
const offenders = []
for (const file of walk(resolve(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(importRe)) {
    const spec = m[1]
    const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
    if (isRemovedPackage(name)) offenders.push(`${file.slice(ROOT.length + 1)} importa ${spec}`)
  }
}
if (offenders.length > 0) fail(`quedan imports de paquetes retirados:\n  ${offenders.join('\n  ')}`)

// 4. globals.css cumple el contrato.
const css = readFileSync(CSS_PATH, 'utf8')
const problems = cssProblems(css)
if (problems.length > 0) fail(`globals.css: ${problems.join('; ')}`)

// Control positivo: el reinicio base sí está dentro de la capa (el botón sin fondo es suyo).
const parsed = postcss.parse(css)
const layerNode = parsed.nodes.filter((n) => n.type !== 'comment')[1]
let sawButtonReset = false
layerNode.walkRules((rule) => {
  if (rule.selector.split(',').map((s) => s.trim()).includes('button')) {
    rule.walkDecls('background-color', (d) => {
      if (d.value.trim() === 'transparent') sawButtonReset = true
    })
  }
})
if (!sawButtonReset) fail('dentro de `@layer reset` no hay `button { background-color: transparent }`')

// Control negativo del detector.
const bad = [
  ['directiva de Tailwind', '@layer reset, mui;\n@layer reset { a { color: red } }\n@tailwind base;'],
  ['regla suelta sin capa', '@layer reset, mui;\n@layer reset { a { color: red } }\nbody { margin: 0 }'],
  ['orden invertido', '@layer mui, reset;\n@layer reset { a { color: red } }'],
]
for (const [name, sample] of bad) {
  if (cssProblems(sample).length === 0) fail(`control negativo: el detector no marcó "${name}", el script no discrimina`)
}

// 5. Providers y tema.
const providers = readFileSync(resolve(ROOT, 'src/theme/Providers.tsx'), 'utf8')
if (!/@layer reset, mui;/.test(providers)) fail('Providers.tsx no declara `@layer reset, mui;`')
const themeSrc = readFileSync(resolve(ROOT, 'src/theme/theme.ts'), 'utf8')
if (/tailwind/i.test(providers.replace(/\/\*[\s\S]*?\*\//g, '')) || /tailwind/i.test(themeSrc.replace(/\/\/.*$/gm, ''))) {
  fail('Providers.tsx o theme.ts siguen nombrando la capa tailwind en código')
}

console.log(
  `OK (sin Tailwind: ${REMOVED_FILES.length} archivos ausentes, ${REMOVED_PACKAGES.length}+ paquetes fuera, ` +
    `globals.css en @layer reset con ${layerNode.nodes.length} nodos; control negativo: ${bad.length}/${bad.length} marcados)`,
)
