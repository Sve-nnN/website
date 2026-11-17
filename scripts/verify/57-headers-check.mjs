// Verificador de cabeceras y caché (plan 57-06, D-04 F1, F2 y F13). Solo GET.
//
// Uso:
//   node scripts/verify/57-headers-check.mjs --selftest   cabeceras sintéticas, sin red
//   node scripts/verify/57-headers-check.mjs --static     importa next.config.mjs y llama a headers()
//   BASE_URL=https://dev.juan-tech.com node scripts/verify/57-headers-check.mjs
//   node scripts/verify/57-headers-check.mjs --base https://juan-tech.com --no-post-cache
//
// Modo vivo (BASE_URL por defecto https://dev.juan-tech.com):
//   - / , /en y el post no traen critical-ch, accept-ch ni x-powered-by, y su vary no
//     contiene Sec-CH-Prefers-Color-Scheme (F2, F13)
//   - siguen presentes HSTS, nosniff, Referrer-Policy y X-Frame-Options (T-57-19)
//   - el post /blog/seo/estrategia-seo trae s-maxage y no trae no-store (F1);
//     --no-post-cache omite esta comprobación (sirve para medir producción, que aún no la tiene)
//   - /admin conserva Accept-CH con la pista (decisión 14); en el preview /admin da 404 a
//     propósito, pero las cabeceras de next.config se aplican igual por ruta
// Sale con 0 si todo pasa y 1 ante cualquier FAIL.

import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

import {
  ADMIN_SOURCE,
  COLOR_SCHEME_HINT,
  stripPublicClientHints,
} from '../../src/lib/client-hint-headers.mjs'

const POST_PATH = '/blog/seo/estrategia-seo'
const SECURITY_KEYS = ['strict-transport-security', 'x-content-type-options', 'referrer-policy', 'x-frame-options']

let failed = 0
function check(name, ok, reason) {
  if (ok) console.log(`PASS ${name}`)
  else {
    failed++
    console.log(`FAIL ${name}: ${reason}`)
  }
}

/** Normaliza un objeto Headers o un objeto plano a un Map en minúsculas. */
function toMap(headers) {
  const map = new Map()
  if (headers && typeof headers.forEach === 'function' && !(headers instanceof Map)) {
    headers.forEach((value, key) => map.set(key.toLowerCase(), value))
  } else if (headers instanceof Map) {
    for (const [k, v] of headers) map.set(k.toLowerCase(), v)
  } else {
    for (const [k, v] of Object.entries(headers ?? {})) map.set(k.toLowerCase(), v)
  }
  return map
}

/** Problemas de pista de tema y x-powered-by en una respuesta pública. */
export function publicHeaderProblems(headers) {
  const h = toMap(headers)
  const problems = []
  if (h.has('critical-ch')) problems.push(`critical-ch: ${h.get('critical-ch')}`)
  if (h.has('accept-ch')) problems.push(`accept-ch: ${h.get('accept-ch')}`)
  if (h.has('x-powered-by')) problems.push(`x-powered-by: ${h.get('x-powered-by')}`)
  const vary = h.get('vary') ?? ''
  if (vary.toLowerCase().includes(COLOR_SCHEME_HINT.toLowerCase())) problems.push(`vary: ${vary}`)
  for (const key of SECURITY_KEYS) if (!h.has(key)) problems.push(`falta ${key}`)
  return problems
}

/** Problemas de caché del post: debe traer s-maxage y no traer no-store. */
export function postCacheProblems(headers) {
  const cc = (toMap(headers).get('cache-control') ?? '').toLowerCase()
  const problems = []
  if (!/s-maxage=\d+/.test(cc)) problems.push(`sin s-maxage (cache-control: ${cc || 'ausente'})`)
  if (cc.includes('no-store')) problems.push(`no-store (cache-control: ${cc})`)
  return problems
}

/** Problemas de la lista de reglas de headers() de la config final. */
export function rulesProblems(rules) {
  const problems = []
  const pub = rules.filter((r) => r.source === '/:path*')
  for (const rule of pub) {
    for (const header of rule.headers) {
      const key = header.key.toLowerCase()
      if (['accept-ch', 'critical-ch', 'x-powered-by'].includes(key)) problems.push(`/:path* trae ${header.key}`)
      if (key === 'vary' && String(header.value).toLowerCase().includes(COLOR_SCHEME_HINT.toLowerCase())) {
        problems.push(`/:path* trae Vary ${header.value}`)
      }
    }
  }
  const keys = new Set(pub.flatMap((r) => r.headers.map((h) => h.key.toLowerCase())))
  for (const key of SECURITY_KEYS) if (!keys.has(key)) problems.push(`/:path* perdió ${key}`)
  const admin = rules.find((r) => r.source === ADMIN_SOURCE)
  const adminKeys = new Set((admin?.headers ?? []).map((h) => h.key.toLowerCase()))
  for (const key of ['accept-ch', 'vary', 'critical-ch']) {
    if (!adminKeys.has(key)) problems.push(`${ADMIN_SOURCE} no conserva ${key}`)
  }
  return problems
}

// ---------------------------------------------------------------------------

function payloadLikeRules({ preview = false } = {}) {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ...(preview ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
      ],
    },
    {
      source: '/:path*',
      headers: [
        { key: 'Accept-CH', value: COLOR_SCHEME_HINT },
        { key: 'Vary', value: COLOR_SCHEME_HINT },
        { key: 'Critical-CH', value: COLOR_SCHEME_HINT },
      ],
    },
  ]
}

function selftest() {
  const security = {
    'strict-transport-security': 'max-age=63072000',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-frame-options': 'SAMEORIGIN',
  }
  check('respuesta con critical-ch falla', publicHeaderProblems({ ...security, 'critical-ch': COLOR_SCHEME_HINT }).length > 0, 'no lo detectó')
  check('respuesta con accept-ch falla', publicHeaderProblems({ ...security, 'accept-ch': COLOR_SCHEME_HINT }).length > 0, 'no lo detectó')
  check('respuesta con x-powered-by falla', publicHeaderProblems({ ...security, 'x-powered-by': 'Next.js, Payload' }).length > 0, 'no lo detectó')
  check('vary con la pista falla', publicHeaderProblems({ ...security, vary: `RSC, ${COLOR_SCHEME_HINT}, Accept-Encoding` }).length > 0, 'no lo detectó')
  const noHsts = Object.fromEntries(Object.entries(security).filter(([k]) => k !== 'strict-transport-security'))
  check('respuesta sin HSTS falla', publicHeaderProblems(noHsts).length === 1, 'no lo detectó')
  check('respuesta limpia pasa', publicHeaderProblems({ ...security, vary: 'RSC, Next-Router-State-Tree, Accept-Encoding' }).length === 0, publicHeaderProblems({ ...security, vary: 'RSC' }).join('; '))
  check('post con no-store falla', postCacheProblems({ 'cache-control': 'private, no-cache, no-store, max-age=0, must-revalidate' }).length === 2, 'no lo detectó')
  check('post con s-maxage pasa', postCacheProblems({ 'cache-control': 's-maxage=60, stale-while-revalidate=31535940' }).length === 0, 'falló sin motivo')

  const before = payloadLikeRules({ preview: true })
  const after = stripPublicClientHints(before)
  check('reglas de Payload sin filtrar fallan', rulesProblems(before).length > 0, 'no lo detectó')
  check('filtro quita las tres pistas de /:path* y las deja en /admin', rulesProblems(after).length === 0, rulesProblems(after).join('; '))
  const pubKeys = after.filter((r) => r.source === '/:path*').flatMap((r) => r.headers.map((h) => h.key))
  check(
    'filtro conserva las cabeceras de seguridad y X-Robots-Tag en orden',
    JSON.stringify(pubKeys) ===
      JSON.stringify(['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options', 'X-Robots-Tag']),
    pubKeys.join(', '),
  )
  const otherVary = stripPublicClientHints([{ source: '/:path*', headers: [{ key: 'Vary', value: 'Accept-Language' }] }])
  check('filtro no toca un Vary ajeno a la pista', otherVary[0]?.headers?.[0]?.value === 'Accept-Language' && otherVary.length === 1, JSON.stringify(otherVary))
  check('filtro no altera reglas de otras rutas', stripPublicClientHints([{ source: '/x', headers: [{ key: 'Accept-CH', value: COLOR_SCHEME_HINT }] }])[0].source === '/x', 'alteró la regla')
}

async function staticMode() {
  const mod = await import(pathToFileURL(resolve(process.cwd(), 'next.config.mjs')).href)
  const config = typeof mod.default === 'function' ? await mod.default('phase-production-build', {}) : mod.default
  check('config exportada con poweredByHeader en false', config.poweredByHeader === false, `poweredByHeader=${config.poweredByHeader}`)
  const rules = await config.headers()
  const problems = rulesProblems(rules)
  check('headers() sin pistas públicas, con seguridad y con la regla /admin', problems.length === 0, problems.join('; '))
}

async function get(url) {
  const res = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'juantech-57-headers-check' } })
  await res.arrayBuffer().catch(() => {})
  return res
}

async function liveMode(base, { postCache }) {
  for (const path of ['/', '/en', POST_PATH]) {
    const res = await get(base + path)
    check(`${path} responde 200`, res.status === 200, `status ${res.status}`)
    const problems = publicHeaderProblems(res.headers)
    check(`${path} sin pistas de tema ni x-powered-by, con seguridad`, problems.length === 0, problems.join('; '))
    if (path === POST_PATH) {
      const cc = res.headers.get('cache-control') ?? ''
      console.log(`INFO ${path} cache-control: ${cc}`)
      if (postCache) {
        const cp = postCacheProblems(res.headers)
        check(`${path} cacheable (s-maxage, sin no-store)`, cp.length === 0, cp.join('; '))
      }
    }
  }
  const admin = await get(base + '/admin')
  const accept = admin.headers.get('accept-ch') ?? ''
  check('/admin conserva Accept-CH con la pista de tema', accept.toLowerCase().includes(COLOR_SCHEME_HINT.toLowerCase()), `status ${admin.status}, accept-ch "${accept}"`)
}

const args = process.argv.slice(2)
if (args.includes('--selftest')) {
  selftest()
} else if (args.includes('--static')) {
  await staticMode()
} else {
  const i = args.indexOf('--base')
  const base = (i >= 0 ? args[i + 1] : process.env.BASE_URL || 'https://dev.juan-tech.com').replace(/\/$/, '')
  console.log(`INFO base ${base}`)
  await liveMode(base, { postCache: !args.includes('--no-post-cache') })
}
console.log(failed === 0 ? 'OK' : `${failed} FAIL`)
process.exit(failed === 0 ? 0 : 1)
