import {
  HeaderView,
  type HeaderViewCta,
  type HeaderViewItem,
  type HeaderViewLogo,
} from '@/components/shell/HeaderView'
import { getCachedHeader } from '@/lib/cache'
import { resolveLinkHref, sanitizeHref } from '@/lib/nav-links'

/**
 * Header del shell nuevo (D-10, D-11). Server component: lee el global Header
 * por la capa cacheada (`getCachedHeader`, TTL de 60 s y tag `header`) y entrega
 * a `HeaderView` solo datos serializables (T-53-33): nada del documento de
 * Payload cruza al cliente salvo `id`, `href`, `label`, `newTab`, `logo.url` y
 * `logo.alt`.
 *
 * Si la Local API falla, el shell no devuelve 500 (T-53-31): se registra el
 * error en el servidor y se dibuja la version minima (marca, idioma y CTA de
 * respaldo).
 */
export async function SiteHeader({ locale }: { locale: string }) {
  const typedLocale: 'en' | 'es' = locale === 'en' ? 'en' : 'es'

  let items: HeaderViewItem[] = []
  let cta: HeaderViewCta = null
  let logo: HeaderViewLogo = null

  try {
    const header = await getCachedHeader(typedLocale)

    // Partial: un enlace sin etiqueta o sin destino en este idioma se omite.
    // Nunca se muestra una etiqueta vacia ni el slug.
    items = (header.navItems ?? []).flatMap((item): HeaderViewItem[] => {
      const href = resolveLinkHref(item.link, typedLocale)
      const label = item.link?.label?.trim()
      if (!href || !label) return []
      return [{ id: item.id ?? href, href, label, newTab: !!item.link?.newTab }]
    })

    if (typeof header.logo === 'object' && header.logo !== null && header.logo.url) {
      logo = { url: header.logo.url, alt: header.logo.alt ?? null }
    }

    cta = {
      label: header.ctaButton?.label?.trim() || null,
      href: sanitizeHref(header.ctaButton?.href, typedLocale) ?? '/contact',
    }
  } catch (err) {
    console.error('[shell] header', err)
    items = []
    cta = null
    logo = null
  }

  return <HeaderView locale={typedLocale} items={items} cta={cta} logo={logo} />
}
