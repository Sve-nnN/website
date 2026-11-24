// Fase 57 (D-04 F2, decisión 14 de Juan del 2026-11-17): `withPayload` de
// @payloadcms/next agrega a TODA respuesta (regla `/:path*`) tres cabeceras con
// la pista de tema `Sec-CH-Prefers-Color-Scheme`: Accept-CH, Vary y Critical-CH.
// Critical-CH obliga al navegador a repetir la primera petición con la pista,
// que se ve como un 307 interno y suma un viaje de ida y vuelta al TTFB del
// sitio público. El sitio público usa un solo tema oscuro y no la necesita.
//
// Solo el admin de Payload la lee (getRequestTheme, tema "auto"), así que el
// filtro la saca de la regla `/:path*` y la devuelve en una regla propia para
// `/admin/:path*` (que también alcanza `/admin`). No se parchea node_modules.

export const COLOR_SCHEME_HINT = 'Sec-CH-Prefers-Color-Scheme'
export const ADMIN_SOURCE = '/admin/:path*'

const HINT_KEYS = new Set(['accept-ch', 'vary', 'critical-ch'])

/** True si la cabecera es una de las tres de la pista de tema de Payload. */
export function isColorSchemeHint(header) {
  return (
    Boolean(header) &&
    typeof header.key === 'string' &&
    HINT_KEYS.has(header.key.toLowerCase()) &&
    typeof header.value === 'string' &&
    header.value.trim().toLowerCase() === COLOR_SCHEME_HINT.toLowerCase()
  )
}

/**
 * Quita las pistas de tema de la regla `/:path*` y las deja solo en
 * `/admin/:path*`. Las demás cabeceras y reglas pasan sin cambios y en el mismo
 * orden (HSTS, nosniff, Referrer-Policy, X-Frame-Options, X-Robots-Tag del
 * preview). Una regla `/:path*` que queda sin cabeceras se descarta.
 */
export function stripPublicClientHints(rules) {
  if (!Array.isArray(rules)) return rules
  const out = []
  const hints = []
  for (const rule of rules) {
    if (!rule || rule.source !== '/:path*' || !Array.isArray(rule.headers)) {
      out.push(rule)
      continue
    }
    const kept = []
    for (const header of rule.headers) {
      if (isColorSchemeHint(header)) {
        if (!hints.some((h) => h.key.toLowerCase() === header.key.toLowerCase())) hints.push(header)
      } else {
        kept.push(header)
      }
    }
    if (kept.length > 0) out.push({ ...rule, headers: kept })
  }
  if (hints.length > 0) out.push({ source: ADMIN_SOURCE, headers: hints })
  return out
}

/** Envuelve la config final para que su headers() pase por el filtro. */
export function withoutPublicClientHints(config) {
  const original = config.headers
  if (typeof original !== 'function') return config
  return {
    ...config,
    async headers() {
      return stripPublicClientHints(await original())
    },
  }
}
