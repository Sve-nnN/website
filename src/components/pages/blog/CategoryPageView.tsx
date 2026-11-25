// Sin 'use client' (fase 60): la lista es estatica; solo el boton del estado
// vacio y el cierre son componentes cliente.
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { PageHero } from '@/components/mui/PageHero'
import { PostCard } from '@/components/mui/PostCard'
import { LinkButton } from '@/components/static/LinkButton'
import type { BlogClosingData, CategoryPageProps } from '@/lib/blog-data'
import { blogIndexPath } from '@/lib/blog-paths'

import { BlogClosingMui } from './BlogClosingMui'
import { CategoryNav } from './CategoryNav'

type Props = CategoryPageProps & {
  /** Migas de `buildBlogTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Cierre del blog resuelto para esta categoria, o null. */
  closing: BlogClosingData | null
}

/**
 * Pagina de categoria del blog: PageHero con el nombre y la descripcion de
 * Payload, navegacion de categorias y UNA lista con TODAS las entradas.
 *
 * No hay estado de revelado ni recorte en el cliente (Pitfall 5, D-18): cada
 * entrada tiene su enlace en el HTML del servidor. `general` llega sin entradas
 * y muestra el estado vacio con su mismo 200. No declara landmark principal.
 */
export function CategoryPageView({ crumbs, category, items, nav, closing }: Props) {
  const t = useTranslations('blog.category')
  const empty = items.length === 0

  return (
    <>
      <PageHero crumbs={crumbs} title={category.title} lead={category.description ?? undefined}>
        <CategoryNav items={nav} activeSlug={category.slug} />
        {!empty && <p className="jt-body2">{t('count', { count: items.length })}</p>}
      </PageHero>

      <section className="jt-blog-list" aria-labelledby="blog-list-t">
        <div className="jt-container">
          {empty ? (
            <div className="jt-blog-empty">
              <h2 id="blog-list-t" className="jt-h3">
                {t('emptyTitle')}
              </h2>
              <p className="jt-body1">{t('emptyText')}</p>
              <LinkButton href={blogIndexPath()} variant="outlined" sx={{ minHeight: 40 }}>
                {t('backToBlog')}
              </LinkButton>
            </div>
          ) : (
            <>
              <h2 id="blog-list-t" className="jt-h3 jt-sr-only">
                {t('listTitle')}
              </h2>
              <ul className="jt-cardgrid" role="list" aria-label={t('listLabel')}>
                {items.map((item) => (
                  <li key={item.href}>
                    <PostCard
                      href={item.href}
                      title={item.title}
                      excerpt={item.excerpt}
                      dateISO={item.dateISO}
                      image={item.image}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {closing && <BlogClosingMui closing={closing} />}
    </>
  )
}
