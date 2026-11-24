// Análisis estático de alcance (plan 57-07, CAL-03, D-06, T-57-23).
//
// Parte de las raíces de la app y sigue los imports con la API del compilador de
// TypeScript (ts.preProcessFile para leer los imports y ts.resolveModuleName con las
// opciones de tsconfig.json, así los alias @/* y @payload-config resuelven igual que en
// el build). Lista los archivos de src/components, src/blocks y src/lib que nadie
// alcanza desde las raíces.
//
// Raíces:
//   - src/app/** completo: (frontend), (payload) con su importMap.js del admin,
//     global-not-found.tsx y los route handlers sueltos (actions, api, go, llms, sitemap).
//     El plan nombra (frontend), (payload) y global-not-found; sumar el resto solo hace
//     el análisis más conservador (menos candidatos a borrar).
//   - src/middleware.ts, src/payload.config.ts y next.config.mjs.
// Además, cualquier literal '@/ruta' o '@/ruta#Export' dentro de un archivo alcanzado
// cuenta como import: Payload declara componentes del admin como cadenas.
//
// Los scripts de scripts/verify y scripts/db no son raíces de producción, pero si un
// archivo solo lo alcanzan ellos, el reporte lo dice ("solo scripts") para que el retiro
// no rompa la regresión sin avisar.
//
// Uso:
//   node scripts/verify/57-unreachable-components.mjs            lista inalcanzables
//   node scripts/verify/57-unreachable-components.mjs --json     salida JSON
//   node scripts/verify/57-unreachable-components.mjs --who <archivo>
//                                                    quién importa ese archivo (alcanzados)
//   node scripts/verify/57-unreachable-components.mjs --selftest mini proyecto en memoria
//
// Solo lee archivos. No escribe nada ni toca la base.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC_EXT = /\.(tsx?|mts|mjs|cjs|js|jsx)$/
const SCAN_DIRS = ['src/components', 'src/blocks', 'src/lib']

/**
 * Host mínimo sobre un "sistema de archivos": real o en memoria (selftest).
 * files: Map<rutaAbsoluta, contenido> para memoria; null para disco.
 */
function makeFs(files) {
  if (!files) {
    return {
      exists: (p) => existsSync(p) && statSync(p).isFile(),
      dirExists: (p) => existsSync(p) && statSync(p).isDirectory(),
      read: (p) => readFileSync(p, 'utf8'),
      walk(dir) {
        const out = []
        if (!existsSync(dir)) return out
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          if (e.name === 'node_modules' || e.name.startsWith('.')) continue
          const p = join(dir, e.name)
          if (e.isDirectory()) out.push(...this.walk(p))
          else if (SRC_EXT.test(e.name)) out.push(p)
        }
        return out
      },
    }
  }
  return {
    exists: (p) => files.has(p),
    dirExists: (p) => [...files.keys()].some((f) => f.startsWith(p + sep)),
    read: (p) => files.get(p),
    walk: (dir) => [...files.keys()].filter((f) => f.startsWith(dir + sep) && SRC_EXT.test(f)),
  }
}

function compilerOptions(root, fs) {
  const raw = ts.parseConfigFileTextToJson('tsconfig.json', fs.read(join(root, 'tsconfig.json'))).config ?? {}
  const co = raw.compilerOptions ?? {}
  return {
    baseUrl: root,
    paths: co.paths ?? {},
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    allowJs: true,
    jsx: ts.JsxEmit.Preserve,
    resolveJsonModule: true,
  }
}

/** Imports de un archivo: estáticos, dinámicos, re-exports y cadenas '@/...' (admin de Payload). */
export function importsOf(text) {
  const info = ts.preProcessFile(text, true, true)
  const specs = info.importedFiles.map((f) => f.fileName)
  for (const m of text.matchAll(/['"`](@\/[^'"`#\s]+)(?:#[\w$]+)?['"`]/g)) specs.push(m[1])
  return [...new Set(specs)]
}

/** Construye el grafo desde las raíces. Devuelve Map<archivo, Set<importador>> de lo alcanzado. */
export function reach({ root, roots, fs }) {
  const options = compilerOptions(root, fs)
  const host = {
    fileExists: fs.exists,
    readFile: fs.read,
    directoryExists: fs.dirExists,
    getCurrentDirectory: () => root,
  }
  const importers = new Map()
  const queue = []
  for (const r of roots) if (!importers.has(r)) (importers.set(r, new Set()), queue.push(r))
  while (queue.length) {
    const file = queue.shift()
    let text
    try {
      text = fs.read(file)
    } catch {
      continue
    }
    if (text == null) continue
    for (const spec of importsOf(text)) {
      const res = ts.resolveModuleName(spec, file, options, host).resolvedModule
      if (!res || res.isExternalLibraryImport) continue
      const target = resolve(res.resolvedFileName)
      if (!target.startsWith(root + sep) || target.includes(`${sep}node_modules${sep}`)) continue
      if (target.endsWith('.d.ts')) continue
      if (!importers.has(target)) {
        importers.set(target, new Set())
        queue.push(target)
      }
      importers.get(target).add(file)
    }
  }
  return importers
}

export function appRoots(root, fs) {
  const roots = [...fs.walk(join(root, 'src', 'app'))]
  for (const f of ['src/middleware.ts', 'src/payload.config.ts', 'next.config.mjs']) {
    const p = join(root, f)
    if (fs.exists(p)) roots.push(p)
  }
  return roots
}

export function scriptRoots(root, fs) {
  return [...fs.walk(join(root, 'scripts'))]
}

export function analyze({ root = ROOT, fs = makeFs(null), scanDirs = SCAN_DIRS } = {}) {
  const app = reach({ root, roots: appRoots(root, fs), fs })
  const scripts = reach({ root, roots: scriptRoots(root, fs), fs })
  const scanned = scanDirs.flatMap((d) => fs.walk(join(root, d))).sort()
  const rel = (p) => relative(root, p)
  const unreachable = []
  const scriptsOnly = []
  for (const f of scanned) {
    if (app.has(f)) continue
    if (scripts.has(f)) scriptsOnly.push({ file: rel(f), importers: [...scripts.get(f)].map(rel).sort() })
    else unreachable.push(rel(f))
  }
  return { app, scripts, unreachable, scriptsOnly, rel }
}

// ---------------------------------------------------------------- selftest

function selftest() {
  const R = resolve('/virtual/proj')
  const files = new Map(
    Object.entries({
      'tsconfig.json': JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }),
      'src/app/(frontend)/[locale]/page.tsx': "import { A } from '@/components/A'\nexport default A",
      'src/app/global-not-found.tsx': "import '../components/G'\n",
      'src/app/(payload)/admin/importMap.js': "export const m = { x: '@/components/Admin#Field' }",
      'src/components/A.tsx': "export { B } from './B'\nexport const A = 1",
      'src/components/B.tsx': "const C = () => import('@/lib/C')\nexport const B = C",
      'src/lib/C.ts': 'export const C = 1',
      'src/components/G.tsx': 'export const G = 1',
      'src/components/Admin.tsx': 'export const Field = 1',
      'src/components/Dead.tsx': "import { A } from './A'\nexport const Dead = A",
      'src/components/OnlyScript.tsx': 'export const S = 1',
      'scripts/verify/x.ts': "import { S } from '../../src/components/OnlyScript'",
      'src/blocks/Old/Component.tsx': 'export const Old = 1',
      'src/blocks/Old/config.ts': 'export const OldConfig = {}',
      'src/payload.config.ts': "import { OldConfig } from './blocks/Old/config'\nexport default OldConfig",
    }).map(([k, v]) => [join(R, k), v]),
  )
  const fs = makeFs(files)
  const { unreachable, scriptsOnly } = analyze({ root: R, fs })
  const checks = [
    ['un archivo sin importadores sale inalcanzable', unreachable.includes('src/components/Dead.tsx')],
    ['el Component.tsx de bloque sin vista sale inalcanzable', unreachable.includes('src/blocks/Old/Component.tsx')],
    ['el config de bloque que usa payload.config se alcanza', !unreachable.includes('src/blocks/Old/config.ts')],
    ['import directo con alias @/ alcanza', !unreachable.includes('src/components/A.tsx')],
    ['re-export transitivo alcanza', !unreachable.includes('src/components/B.tsx')],
    ['import dinámico con alias alcanza', !unreachable.includes('src/lib/C.ts')],
    ['import relativo de solo efecto desde global-not-found alcanza', !unreachable.includes('src/components/G.tsx')],
    ["cadena '@/ruta#Export' del admin alcanza", !unreachable.includes('src/components/Admin.tsx')],
    [
      'lo que solo importa un script sale como "solo scripts"',
      scriptsOnly.some((s) => s.file === 'src/components/OnlyScript.tsx') && !unreachable.includes('src/components/OnlyScript.tsx'),
    ],
  ]
  let fail = 0
  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`)
    if (!ok) fail++
  }
  console.log(`selftest: ${checks.length - fail}/${checks.length}`)
  process.exit(fail ? 1 : 0)
}

// ---------------------------------------------------------------- main

const args = process.argv.slice(2)
if (args.includes('--selftest')) selftest()
else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { app, scripts, unreachable, scriptsOnly, rel } = analyze()
  const who = args.indexOf('--who')
  if (who >= 0) {
    const target = resolve(ROOT, args[who + 1])
    const a = app.get(target)
    const s = scripts.get(target)
    console.log(`app: ${a ? [...a].map(rel).join(', ') || '(raíz)' : 'no alcanzado'}`)
    console.log(`scripts: ${s ? [...s].map(rel).join(', ') || '(raíz)' : 'no alcanzado'}`)
  } else if (args.includes('--json')) {
    console.log(JSON.stringify({ unreachable, scriptsOnly }, null, 2))
  } else {
    console.log(`Inalcanzables desde la app (${unreachable.length}):`)
    for (const f of unreachable) console.log(`  ${f}`)
    console.log(`Solo los alcanzan scripts (${scriptsOnly.length}):`)
    for (const s of scriptsOnly) console.log(`  ${s.file}  <- ${s.importers.join(', ')}`)
  }
}
