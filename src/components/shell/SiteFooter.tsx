import { getTranslations } from 'next-intl/server'

import type { Footer as FooterType } from '@/payload-types'

import {
  FooterView,
  type FooterViewColumn,
  type FooterViewLegal,
  type FooterViewLogo,
  type FooterViewSocial,
} from '@/components/shell/FooterView'
import { blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'
import {
  getCachedFooter,
  getCachedHeader,
  getCachedLatestCaseStudyLinks,
  getCachedLatestPostLinks,
} from '@/lib/cache'
import { getLocalLandingPage } from '@/lib/local-landing-data'
import { LOCAL_LANDINGS, buildLocalLandingHref } from '@/lib/local-landing-slugs'
import { resolveLinkHref, sanitizeHref } from '@/lib/nav-links'
import { buildServiceHref, buildServicesIndexHref } from '@/lib/service-slugs'
import { SERVICE_SLUGS, getServicePage } from '@/lib/services-data'

const COPYRIGHT_FALLBACK = 'Juan Carlos Angulo'

type ColumnItem = { id: string; label: string; href: string }
type ColumnResult = { id: string; title: string | null; items: ColumnItem[] }

/**
 * Las landings de servicio y de SEO local, mas el indice de servicios, armadas
 * desde SERVICE_SLUGS y LOCAL_LANDINGS y no desde las columnas del CMS: una
 * lista en codigo no puede desincronizarse de las rutas reales. Los hrefs de
 * `buildServiceHref` ya son correctos por idioma (el segmento esta traducido).
 */
async function resolveServicesColumn(
  locale: 'en' | 'es',
  copy: { servicesTitle: string; servicesIndex: string },
): Promise<ColumnResult | null> {
  const [pages, localPages] = await Promise.all([
    Promise.all(SERVICE_SLUGS.map((slug) => getServicePage(locale, slug))),
    Promise.all(LOCAL_LANDINGS.map((landing) => getLocalLandingPage(locale, landing.slug))),
  ])

  const items = pages.flatMap((page, i): ColumnItem[] =>
    page ? [{ id: String(page.id), label: page.title, href: buildServiceHref(locale, SERVICE_SLUGS[i]) }] : [],
  )

  // SEO-42: las dos landings locales necesitan el mismo enlazado que el resto
  // de paginas de servicio. Van dentro de la columna de Servicios.
  const localItems = localPages.flatMap((page, i): ColumnItem[] =>
    page
      ? [{ id: String(page.id), label: page.title, href: buildLocalLandingHref(locale, LOCAL_LANDINGS[i].slug) }]
      : [],
  )

  if (items.length === 0 && localItems.length === 0) return null

  return {
    id: 'services',
    title: copy.servicesTitle,
    items: [
      ...items,
      { id: 'services-index', label: copy.servicesIndex, href: buildServicesIndexHref(locale) },
      ...localItems,
    ],
  }
}

async function resolveDynamicColumn(
  entry: NonNullable<FooterType['dynamicColumns']>[number],
  locale: 'en' | 'es',
): Promise<ColumnResult | null> {
  const limit = entry.limit ?? 5
  const id = entry.id ?? `dynamic-${entry.source}`
  const title = entry.title?.trim() || null

  if (entry.source === 'latestPosts') {
    // Un doc sin slug no tiene destino: se descarta en lugar de emitir `/blog/<cat>/`.
    const docs = (await getCachedLatestPostLinks(locale, limit)).filter((doc) => doc.slug)
    if (docs.length === 0) return null
    return {
      id,
      title,
      items: docs.map((doc) => ({
        id: String(doc.id),
        label: doc.title,
        href: blogPostPath(resolvePrimaryCategorySlug(doc.categories), doc.slug as string),
      })),
    }
  }

  if (entry.source === 'latestCaseStudies') {
    // Un doc sin slug daria `/case-studies/null`: se descarta.
    const docs = (await getCachedLatestCaseStudyLinks(locale, limit)).filter((doc) => doc.slug)
    if (docs.length === 0) return null
    return {
      id,
      title,
      items: docs.map((doc) => ({
        id: String(doc.id),
        label: doc.title,
        href: `/case-studies/${doc.slug}`,
      })),
    }
  }

  return null
}

/**
 * Footer del shell nuevo (D-10, D-11). Server component: lee el global Footer y
 * el logo del Header por la capa cacheada, junto con las columnas derivadas de
 * servicios y de posts o casos recientes, y entrega a `FooterView` solo datos
 * serializables (T-53-33).
 *
 * Todo href del CMS pasa por `resolveLinkHref` o `sanitizeHref` (T-53-30, y
 * ademas por `normalizeServiceHref` para los slugs duales). Si la Local API
 * falla, se registra en el servidor y se dibuja un footer minimo, nunca un 500
 * (T-53-31).
 */
export async function SiteFooter({ locale }: { locale: string }) {
  const typedLocale: 'en' | 'es' = locale === 'en' ? 'en' : 'es'
  const t = await getTranslations({ locale: typedLocale, namespace: 'shell' })

  let columns: FooterViewColumn[] = []
  let socialLinks: FooterViewSocial[] = []
  let legalLinks: FooterViewLegal[] = []
  let copyrightText = COPYRIGHT_FALLBACK
  let logo: FooterViewLogo = null

  try {
    const [footer, header] = await Promise.all([getCachedFooter(typedLocale), getCachedHeader(typedLocale)])

    // allSettled: si falla una consulta de columna (servicios o dinamica), el resto del
    // footer (columnas del CMS, legales, redes) se conserva.
    const [servicesResult, ...dynamicResults] = await Promise.allSettled([
      resolveServicesColumn(typedLocale, {
        servicesTitle: t('servicesTitle'),
        servicesIndex: t('servicesIndex'),
      }),
      ...(footer.dynamicColumns ?? []).map((entry) => resolveDynamicColumn(entry, typedLocale)),
    ])

    if (servicesResult.status === 'rejected') console.error('[shell] footer services column', servicesResult.reason)
    const servicesColumn = servicesResult.status === 'fulfilled' ? servicesResult.value : null

    const dynamicColumns: ColumnResult[] = []
    for (const result of dynamicResults) {
      if (result.status === 'rejected') {
        console.error('[shell] footer dynamic column', result.reason)
      } else if (result.value) {
        dynamicColumns.push(result.value)
      }
    }

    // Columnas curadas en el admin. Partial: se omite el item sin etiqueta o
    // sin destino, y la columna que se queda sin items.
    const cmsColumns = (footer.columns ?? []).flatMap((column, i): ColumnResult[] => {
      const items = (column.links ?? []).flatMap((entry, j): ColumnItem[] => {
        const href = resolveLinkHref(entry.link, typedLocale)
        const label = entry.link?.label?.trim()
        if (!href || !label) return []
        return [{ id: entry.id ?? `${i}-${j}`, label, href }]
      })
      if (items.length === 0) return []
      return [{ id: column.id ?? `cms-${i}`, title: column.title?.trim() || null, items }]
    })

    // Orden: servicios, columnas del CMS, dinamicas.
    columns = [...(servicesColumn ? [servicesColumn] : []), ...cmsColumns, ...dynamicColumns]

    socialLinks = (footer.socialLinks ?? []).flatMap((social, i): FooterViewSocial[] => {
      const url = sanitizeHref(social.url, typedLocale)
      if (!url) return []
      return [{ id: social.id ?? `social-${i}`, platform: social.platform, url }]
    })

    legalLinks = (footer.legalLinks ?? []).flatMap((legal, i): FooterViewLegal[] => {
      const href = sanitizeHref(legal.href, typedLocale)
      const label = legal.label?.trim()
      if (!href || !label) return []
      return [{ id: legal.id ?? `legal-${i}`, label, href }]
    })

    copyrightText = footer.copyrightText?.trim() || COPYRIGHT_FALLBACK

    if (typeof header.logo === 'object' && header.logo !== null && header.logo.url) {
      logo = { url: header.logo.url, alt: header.logo.alt ?? null }
    }
  } catch (err) {
    console.error('[shell] footer', err)
    columns = []
    socialLinks = []
    legalLinks = []
    copyrightText = COPYRIGHT_FALLBACK
    logo = null
  }

  return (
    <FooterView
      columns={columns}
      socialLinks={socialLinks}
      legalLinks={legalLinks}
      copyrightText={copyrightText}
      logo={logo}
    />
  )
}
