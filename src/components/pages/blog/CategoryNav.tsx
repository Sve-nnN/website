// Sin 'use client' (fase 60): enlaces estaticos con las clases de
// `src/theme/static.css`.
import { useTranslations } from 'next-intl'

import { AppLink } from '@/components/static/AppLink'
import type { BlogNavItem } from '@/lib/blog-data'
import { blogIndexPath } from '@/lib/blog-paths'

type Props = {
  items: BlogNavItem[]
  /** Slug de la categoria activa. Sin slug, la activa es "Todas" (el indice). */
  activeSlug?: string
}

/**
 * Navegacion de categorias del blog: un `nav` con enlaces reales (cada categoria
 * es una pagina con su URL, no un filtro), `aria-current="page"` en la activa y
 * objetivos de 40 px. El nombre de cada categoria viene de Payload (D-22);
 * `general` no entra porque la lista ya llega sin ella.
 *
 * Los hrefs van sin prefijo de idioma: `AppLink` resuelve el prefijo, igual que
 * el resto de las vistas.
 */
export function CategoryNav({ items, activeSlug }: Props) {
  const t = useTranslations('blog.nav')
  if (items.length === 0) return null

  const all = { slug: '', title: t('all'), href: blogIndexPath() }
  const entries = [all, ...items]
  const active = activeSlug ?? ''

  return (
    <nav aria-label={t('label')}>
      <ul className="jt-catnav" role="list">
        {entries.map((entry) => (
          <li key={entry.href}>
            <AppLink
              className="jt-link jt-catnav__link"
              href={entry.href}
              aria-current={entry.slug === active ? 'page' : undefined}
            >
              {entry.title}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
