// Sin 'use client' (fase 60): destacada y secciones se pintan en el servidor y
// no se hidratan. La busqueda, el alta al correo y el cierre siguen en cliente.
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Suspense } from 'react'

import type { Crumb } from '@/components/mui/Crumbs'
import { PageHero } from '@/components/mui/PageHero'
import { PostCard } from '@/components/mui/PostCard'
import { LinkButton } from '@/components/static/LinkButton'
import type { BlogClosingData, BlogIndexProps, BlogPostItem, NewsletterNotice } from '@/lib/blog-data'

import { BlogClosingMui } from './BlogClosingMui'
import { BlogNewsletter, BlogNewsletterWithNotice } from './BlogNewsletter'
import { BlogSearch } from './BlogSearch'
import { CategoryNav } from './CategoryNav'

type Props = BlogIndexProps & {
  /** Migas de `buildBlogTrail`, ya con `href`. */
  crumbs: Crumb[]
  /**
   * Estado fijado desde fuera (pruebas SSR). La pagina NO lo pasa: el estado de
   * `?newsletter=` se lee en el cliente, ver BlogNewsletterWithNotice.
   */
  newsletterNotice?: NewsletterNotice | null
  /** Cierre del blog (promo global), o null. */
  closing: BlogClosingData | null
}

function card(item: BlogPostItem, withCategory = false, featured = false) {
  return (
    <PostCard
      href={item.href}
      title={item.title}
      excerpt={item.excerpt}
      dateISO={item.dateISO}
      image={item.image}
      categoryLabel={withCategory ? item.categoryLabel : null}
      featured={featured}
    />
  )
}

/**
 * Indice del blog: h1 y subtitulo del documento Pages blog, navegacion de
 * categorias, la entrada mas reciente destacada, una seccion por categoria con
 * las primeras 6 entradas y un enlace real "Ver mas" a /blog/<slug>, la franja
 * de newsletter y el cierre unico. No declara landmark principal.
 *
 * Todas las tarjetas y todos los enlaces estan en el HTML del servidor (D-17,
 * D-18): nada se revela en el cliente.
 */
export function BlogIndexView({
  crumbs,
  title,
  lead,
  latest,
  sections,
  nav,
  searchList,
  viewAllLabel,
  newsletter,
  newsletterNotice,
  closing,
}: Props) {
  const t = useTranslations('blog.index')

  return (
    <>
      <PageHero crumbs={crumbs} title={title} lead={lead ?? undefined}>
        <CategoryNav items={nav} />
      </PageHero>

      <BlogSearch posts={searchList}>
        {latest && (
          <section className="jt-blog-latest" aria-labelledby="blog-latest-t">
            <div className="jt-container">
              <h2 id="blog-latest-t" className="jt-overline jt-accent jt-blog-latest__title">
                {t('latestTitle')}
              </h2>
              {card(latest, true, true)}
            </div>
          </section>
        )}

        {sections.map((section, i) => (
          <section
            key={section.slug}
            className={i % 2 === 1 ? 'jt-blog-section jt-blog-section--alt' : 'jt-blog-section'}
            aria-labelledby={`blog-cat-${section.slug}`}
          >
            <div className="jt-container">
              <div className="jt-blog-section__head">
                <div className="jt-blog-section__text">
                  <p className="jt-overline jt-accent">{t('count', { count: section.total })}</p>
                  <h2 id={`blog-cat-${section.slug}`} className="jt-h3">
                    {section.title}
                  </h2>
                  {section.description && <p className="jt-body1">{section.description}</p>}
                </div>
                {section.hasMore && (
                  <LinkButton
                    href={section.href}
                    variant="outlined"
                    sx={{ minHeight: 40 }}
                    endIcon={<ArrowRight size={18} aria-hidden="true" />}
                  >
                    {viewAllLabel ?? t('viewMore')}
                    <span className="jt-sr-only">{`: ${section.title}`}</span>
                  </LinkButton>
                )}
              </div>
              <ul className="jt-cardgrid" role="list" aria-label={t('sectionListLabel', { category: section.title })}>
                {section.items.map((item) => (
                  <li key={item.href}>{card(item)}</li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </BlogSearch>

      {newsletter && (
        <Suspense fallback={<BlogNewsletter data={newsletter} notice={newsletterNotice ?? null} />}>
          <BlogNewsletterWithNotice data={newsletter} forced={newsletterNotice} />
        </Suspense>
      )}
      {closing && <BlogClosingMui closing={closing} />}
    </>
  )
}
