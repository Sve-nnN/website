/**
 * Verifica los helpers puros de enlaces del shell (fase 53, D-10, D-14,
 * T-53-20). Corre las funciones reales de src/lib/nav-links.ts, no lee el
 * código. Seis grupos de casos:
 *
 *   1. resolveLinkHref con url personalizada y slugs duales de servicios
 *   2. esquemas peligrosos, protocol-relative y vacíos dan null
 *   3. referencias a posts y páginas (incluida home) y referencia sin poblar
 *   4. sanitizeHref con ancla, mailto y relativa sin barra
 *   5. normalizeNavPath (no confunde /entrevistas con /en)
 *   6. buildLocaleSwitchHref canónico por idioma
 *
 * Run:
 *   node_modules/.bin/tsx scripts/verify/53-nav-links.ts
 */
import assert from 'node:assert'

import {
  buildLocaleSwitchHref,
  normalizeNavPath,
  resolveLinkHref,
  sanitizeHref,
} from '../../src/lib/nav-links'

const groups: Array<[string, () => void]> = [
  [
    '1 url personalizada con slugs duales',
    () => {
      assert.strictEqual(resolveLinkHref({ type: 'custom', url: '/services' }, 'es'), '/servicios')
      assert.strictEqual(resolveLinkHref({ type: 'custom', url: '/services' }, 'en'), '/en/services')
    },
  ],
  [
    '2 esquemas peligrosos y vacios',
    () => {
      assert.strictEqual(resolveLinkHref({ type: 'custom', url: 'https://example.com/x' }, 'es'), 'https://example.com/x')
      for (const bad of ['javascript:alert(1)', 'data:text/html,x', '//evil.com', '/\\evil.com', '', '   ', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)']) {
        assert.strictEqual(resolveLinkHref({ type: 'custom', url: bad }, 'es'), null, `debia ser null: ${JSON.stringify(bad)}`)
      }
      assert.strictEqual(resolveLinkHref(null, 'es'), null)
      assert.strictEqual(resolveLinkHref(undefined, 'es'), null)
    },
  ],
  [
    '3 referencias a posts y paginas',
    () => {
      assert.strictEqual(
        resolveLinkHref({ type: 'reference', reference: { relationTo: 'posts', value: { slug: 'mi-post' } } }, 'es'),
        '/blog/mi-post',
      )
      assert.strictEqual(
        resolveLinkHref({ type: 'reference', reference: { relationTo: 'pages', value: { slug: 'contact' } } }, 'es'),
        '/contact',
      )
      assert.strictEqual(
        resolveLinkHref({ type: 'reference', reference: { relationTo: 'pages', value: { slug: 'home' } } }, 'es'),
        '/',
      )
      assert.strictEqual(resolveLinkHref({ type: 'reference', reference: { relationTo: 'pages', value: 12 } }, 'es'), null)
    },
  ],
  [
    '4 sanitizeHref',
    () => {
      assert.strictEqual(sanitizeHref('#contacto', 'es'), '#contacto')
      assert.strictEqual(sanitizeHref('mailto:a@b.co', 'es'), 'mailto:a@b.co')
      assert.strictEqual(sanitizeHref('tel:+573001112233', 'es'), 'tel:+573001112233')
      assert.strictEqual(sanitizeHref('foo/bar', 'es'), null)
      assert.strictEqual(sanitizeHref('ftp://x.com/a', 'es'), null)
    },
  ],
  [
    '5 normalizeNavPath',
    () => {
      assert.strictEqual(normalizeNavPath('/en/services/'), '/services')
      assert.strictEqual(normalizeNavPath('/en'), '/')
      assert.strictEqual(normalizeNavPath('/servicios/seo-consulting?x=1#h'), '/servicios/seo-consulting')
      assert.strictEqual(normalizeNavPath('/entrevistas'), '/entrevistas')
    },
  ],
  [
    '6 buildLocaleSwitchHref',
    () => {
      assert.strictEqual(buildLocaleSwitchHref('/', 'en'), '/en')
      assert.strictEqual(buildLocaleSwitchHref('/', 'es'), '/')
      assert.strictEqual(buildLocaleSwitchHref('/services', 'es'), '/servicios')
      assert.strictEqual(buildLocaleSwitchHref('/servicios/seo-consulting', 'en'), '/en/services/seo-consulting')
      assert.strictEqual(buildLocaleSwitchHref('/blog/development/react-19', 'en'), '/en/blog/development/react-19')
    },
  ],
]

let failed = false
for (const [name, fn] of groups) {
  try {
    fn()
  } catch (err) {
    failed = true
    console.log(`FAIL ${name}: ${(err as Error).message}`)
  }
}

if (failed) process.exit(1)
console.log('OK')
