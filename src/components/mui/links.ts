import NextLink from 'next/link'

import { Link as LocaleLink, isPrefixableHref } from '@/i18n/navigation'

/**
 * Componente de enlace para un `href` de las vistas de la fase 54.
 *
 * Devuelve el `Link` de next-intl cuando el destino es una ruta interna sin
 * prefijo (next-intl agrega `/en` solo en ingles) y `next/link` plano en el
 * resto: rutas que ya traen el prefijo de idioma (las de `buildServiceHref`),
 * anclas, `mailto:` y URLs absolutas, que no deben recibir un segundo prefijo.
 * Es el mismo criterio de `HeaderView` y `FooterView`.
 *
 * Toda vista de la fase lo pasa como `component` de `Link` y `Button` de MUI;
 * ninguna decide a mano entre los dos enlaces.
 */
export function linkFor(href: string): typeof LocaleLink | typeof NextLink {
  return isPrefixableHref(href) ? LocaleLink : NextLink
}
