// Módulo puro: sin imports de Payload, de React ni de `@/i18n`, así que sirve
// igual en Server Components y en Client Components. Importa `./service-slugs`
// con ruta relativa para que `tsx` lo ejecute en los scripts de verify sin
// depender del alias `@/`.
import { normalizeServiceHref } from './service-slugs'

export type NavLocale = 'es' | 'en'

/**
 * Forma del grupo `link` del repo (src/fields/link.ts) tal como llega de la
 * Local API con `depth: 1`. `reference` va poblado (objeto con `slug`) o solo
 * como id numérico cuando la profundidad no alcanzó.
 */
export type NavLinkInput = {
  type?: 'reference' | 'custom' | null
  newTab?: boolean | null
  reference?: { relationTo?: string; value?: number | string | { slug?: string | null } | null } | null
  url?: string | null
  label?: string | null
}

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/**
 * Sanea un href escrito en el admin (T-53-20, ASVS V5). Los href de Header y
 * Footer los teclea un editor y se renderizan en todas las páginas, así que un
 * `javascript:` ahí ejecutaría código en cada visita.
 *
 * Acepta: ancla (`#x`), ruta con una sola barra (pasa por `normalizeServiceHref`
 * para respetar los slugs duales `/servicios` y `/services`) y URL absoluta con
 * protocolo `http:`, `https:`, `mailto:` o `tel:`. Todo lo demás da `null`:
 * vacío, `//host` (protocol-relative), `/\host` (el navegador lo trata como
 * `//`), cualquier otro esquema y rutas relativas sin barra inicial.
 */
export function sanitizeHref(raw: string | null | undefined, locale: NavLocale): string | null {
  if (typeof raw !== 'string') return null
  const href = raw.trim()
  if (href === '') return null
  // Los navegadores eliminan tabulaciones y saltos de linea dentro de una URL antes de
  // parsearla: `/<TAB>/evil.com` se resolveria como `//evil.com`. Se rechaza todo
  // caracter de control (WR-06).
  if (/[\u0000-\u001f\u007f]/.test(href)) return null
  if (href.startsWith('#')) return href
  if (href.startsWith('//') || href.startsWith('/\\')) return null
  if (href.startsWith('/')) return normalizeServiceHref(href, locale)
  // Absoluta solo si empieza con un esquema válido. Una cadena como
  // `java\tscript:x` no calza el patrón y cae a "relativa sin barra" (null).
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)) {
    try {
      const url = new URL(href)
      return ALLOWED_PROTOCOLS.includes(url.protocol) ? href : null
    } catch {
      return null
    }
  }
  return null
}

/**
 * Resuelve el destino de un enlace del shell. Replica el cálculo de `CMSLink`
 * para que header, footer y contenido apunten al mismo sitio: la referencia a
 * `posts` antepone `/blog`, la página con slug `home` es la raíz y una
 * referencia sin objeto poblado no tiene destino (`null`, nunca `#`).
 *
 * Un destino `/blog/<slug>` sin categoría es válido: el sitio ya lo redirige
 * con 308 a su ruta categorizada (redirects de next.config).
 */
export function resolveLinkHref(link: NavLinkInput | null | undefined, locale: NavLocale): string | null {
  if (!link) return null

  if (link.type === 'reference') {
    const value = link.reference?.value
    if (!value || typeof value !== 'object') return null
    const slug = value.slug
    if (!slug) return null
    if (link.reference?.relationTo === 'posts') return sanitizeHref(`/blog/${slug}`, locale)
    if (slug === 'home') return '/'
    return sanitizeHref(`/${slug}`, locale)
  }

  return sanitizeHref(link.url, locale)
}

/**
 * Deja una ruta lista para comparar con el enlace activo: sin query, sin hash,
 * sin prefijo de idioma y sin barra final (salvo la raíz). El prefijo se quita
 * solo si es un segmento completo igual a `en` o `es`; `/entrevistas` no se
 * confunde con `/en`.
 */
export function normalizeNavPath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? ''
  const segments = withoutQuery.split('/').filter(Boolean)
  if (segments[0] === 'en' || segments[0] === 'es') segments.shift()
  return segments.length === 0 ? '/' : `/${segments.join('/')}`
}

/**
 * Href canónico del selector de idioma (D-14). Parte de la ruta SIN prefijo
 * que entrega `usePathname` de next-intl: español queda igual y el inglés
 * antepone `/en`. El resultado pasa por `normalizeServiceHref` para traducir
 * los slugs de servicios (`/servicios/x` a `/en/services/x`).
 *
 * Nunca depende de la prop `locale` del `Link` de next-intl: con español
 * emite `/es/...` y el sitio responde con un 308 extra.
 */
export function buildLocaleSwitchHref(strippedPath: string, target: NavLocale): string {
  const path = strippedPath === '' ? '/' : strippedPath
  const raw = target === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path
  const href = normalizeServiceHref(raw, target)
  return href === '' ? '/' : href
}
