// Sin 'use client' (fase 60): no tiene nada interactivo.
import { useTranslations } from 'next-intl'

import { PostCard } from '@/components/mui/PostCard'
import type { BlogPostItem } from '@/lib/blog-data'

/**
 * Posts relacionados de la misma categoria (hasta 3, sin el actual). Banda con
 * su h2 (`post-related-t`, id reservado en lexical-toc) y una lista de
 * PostCard con encabezado h3. Sin entradas no se pinta nada.
 */
export function PostRelated({ items }: { items: BlogPostItem[] }) {
  const t = useTranslations('post.related')
  if (items.length === 0) return null

  return (
    <section className="jt-post-related" aria-labelledby="post-related-t">
      <div className="jt-container">
        <h2 id="post-related-t" className="jt-h4 jt-post-related__title">
          {t('title')}
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
      </div>
    </section>
  )
}
