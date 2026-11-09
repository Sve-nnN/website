// Guarda estatica de la frontera RSC (review 54, CR-01).
//
// `renderToString` no impone el limite Server/Client, asi que 54-richtext-toc.ts
// no puede detectar que un Server Component pase `linkFor()` (un forwardRef con
// funcion `render`) como `component` de un Link o Button de MUI: en la ruta real
// React Flight lanza "Functions cannot be passed directly to Client Components"
// y la pagina responde 500.
//
// Esta guarda recorre src/ y falla si un archivo SIN 'use client' llama a
// `linkFor(` (salvo links.ts, que lo define). La verificacion de extremo a
// extremo es `next build` (prerender/SSR de /privacy y de una landing con enlace
// interno), que corre el limite real.
//
// Uso:
//   node scripts/verify/54-rsc-boundary.mjs [--selftest]
// Sale con 1 ante cualquier hallazgo.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SRC = join(ROOT, 'src')

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full))
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full)
  }
  return out
}

/** True si la primera sentencia del archivo es la directiva 'use client'. */
export function isClientModule(source) {
  const body = source.replace(/^(\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/))*/, '').trimStart()
  return /^(['"])use client\1/.test(body)
}

/** Devuelve las lineas (1-based) donde un modulo de servidor llama a linkFor(. */
export function findServerLinkForCalls(source) {
  if (isClientModule(source)) return []
  const hits = []
  source.split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '')
    if (/\blinkFor\s*\(/.test(code)) hits.push(i + 1)
  })
  return hits
}

function selftest() {
  const cases = [
    ['servidor con linkFor', `import { linkFor } from './links'\nconst a = <Link component={linkFor(h)} />`, true],
    ['cliente con linkFor', `'use client'\nconst a = <Link component={linkFor(h)} />`, false],
    ['cliente tras comentario', `// nota\n'use client'\nlinkFor(x)`, false],
    ['servidor sin linkFor', `const a = 1`, false],
    ['linkFor solo en comentario', `// linkFor(x)\nconst a = 1`, false],
  ]
  let failed = 0
  for (const [name, src, expectHit] of cases) {
    const hit = findServerLinkForCalls(src).length > 0
    if (hit === expectHit) console.log(`PASS selftest ${name}`)
    else {
      failed += 1
      console.log(`FAIL selftest ${name}: esperaba ${expectHit}, obtuvo ${hit}`)
    }
  }
  return failed
}

function main() {
  if (process.argv.includes('--selftest')) {
    process.exit(selftest() === 0 ? 0 : 1)
  }
  let failed = 0
  for (const file of walk(SRC)) {
    const rel = relative(ROOT, file)
    if (rel.endsWith(join('components', 'mui', 'links.ts'))) continue
    const hits = findServerLinkForCalls(readFileSync(file, 'utf8'))
    for (const line of hits) {
      failed += 1
      console.log(`FAIL ${rel}:${line} llama a linkFor() en un modulo de servidor (mueve el enlace a un componente 'use client')`)
    }
  }
  if (failed === 0) console.log('PASS 54-rsc-boundary: ningun Server Component llama a linkFor()')
  process.exit(failed === 0 ? 0 : 1)
}

main()
