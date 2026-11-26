// Sin 'use client' (fase 60): marcado estatico con las clases de
// `src/theme/static.css`. Conserva la estructura que daba `Breadcrumbs` de MUI.
import { ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Fragment } from 'react'

import { AppLink } from '@/components/static/AppLink'

export type Crumb = { label: string; href?: string }

/**
 * Ruta de migas. La pagina actual (la ultima) va como texto con
 * `aria-current="page"` y peso 600. El nombre accesible de la navegacion sale
 * de messages (`common.breadcrumbsLabel`); las etiquetas llegan por props.
 *
 * Los hrefs que llegan de `buildTrail` ya traen el prefijo de idioma y los
 * internos sin prefijo los resuelve `AppLink` con `isPrefixableHref`.
 */
export function Crumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations('common')
  return (
    <nav className="jt-body1 jt-crumbs" aria-label={t('breadcrumbsLabel')}>
      <ol className="jt-crumbs__list">
        {items.map((c, i) => (
          <Fragment key={`${i}-${c.label}`}>
            {i > 0 && (
              <li className="jt-crumbs__separator" aria-hidden="true">
                <ChevronRight size={14} aria-hidden="true" />
              </li>
            )}
            <li>
              {c.href && i < items.length - 1 ? (
                <AppLink className="jt-link jt-link--hover jt-crumbs__link" href={c.href}>
                  {c.label}
                </AppLink>
              ) : (
                <p className="jt-body1 jt-crumbs__current" aria-current="page">
                  {c.label}
                </p>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
