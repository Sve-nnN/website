import { getLocale } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'

import type { BlogCategoryRowsBlock as BlogCategoryRowsBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { PostCard } from '@/components/PostCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { Link } from '@/i18n/navigation'
import { getCachedArchive, getCachedCategories, type PostCardData } from '@/lib/cache'
import { blogCategoryPath, blogPostPath, resolvePrimaryCategorySlug, FALLBACK_CATEGORY_SLUG } from '@/lib/blog-paths'

interface BlogCategoryRowsComponentProps extends BlogCategoryRowsBlockProps {
  /**
   * Ids que la página ya mostró arriba (hoy: el post destacado). Se excluyen de
   * las filas para que el mismo artículo no aparezca dos veces en la misma
   * pantalla. Llega como sharedProp desde la página, igual que `activeCategory`
   * en ArchiveBlock: los bloques no conocen el contexto de request.
   */
  excludePostIds?: number[]
}

const COPY = {
  es: { posts: (n: number) => (n === 1 ? '1 artículo' : `${n} artículos`) },
  en: { posts: (n: number) => (n === 1 ? '1 post' : `${n} posts`) },
}

export async function BlogCategoryRowsComponent(props: BlogCategoryRowsComponentProps) {
  const { postsPerCategory, categoryOrder, viewAllLabel, excludePostIds } = props
  const locale = (await getLocale()) as 'es' | 'en'
  const perCategory = postsPerCategory ?? 3
  const t = COPY[locale] ?? COPY.es
  const excluded = new Set(excludePostIds ?? [])

  const categories = await getCachedCategories(locale)

  // `general` es el fallback de URL para posts sin categoría, no un tema. Si
  // llegara a tener contenido, ese contenido está mal clasificado y la
  // respuesta es arreglar el dato, no darle una fila en el índice.
  const listable = categories.filter((c) => c.slug !== FALLBACK_CATEGORY_SLUG)

  // Orden explícito del CMS si existe; si no, el alfabético que ya trae
  // getCachedCategories. Una categoría referenciada que fue borrada se ignora
  // en vez de romper la página.
  const ordered = categoryOrder?.length
    ? categoryOrder
        .map((row) => {
          const id = typeof row.category === 'object' ? row.category?.id : row.category
          return listable.find((c) => c.id === id)
        })
        .filter((c): c is (typeof listable)[number] => Boolean(c))
    : listable

  const rows = await Promise.all(
    ordered.map(async (category) => {
      const result = await getCachedArchive({
        relationTo: 'posts',
        // Se pide uno de más para que excluir el destacado no deje la fila
        // corta. Sin esto, la categoría del post destacado mostraría 2 de 3.
        limit: perCategory + (excluded.size > 0 ? 1 : 0),
        locale,
        categoryId: category.id,
      })

      const docs = (result.docs as PostCardData[])
        .filter((doc) => !excluded.has(doc.id))
        .slice(0, perCategory)

      return { category, docs, total: result.totalDocs }
    }),
  )

  const visible = rows.filter((row) => row.docs.length > 0)

  if (visible.length === 0) return null

  return (
    <Container className="py-12 md:py-16">
      <div className="flex flex-col gap-14 md:gap-20">
        {visible.map(({ category, docs, total }, rowIndex) => {
          const categorySlug = category.slug ?? String(category.id)
          const categoryHref = blogCategoryPath(categorySlug)
          const hasMore = total > docs.length

          return (
            <section key={category.id} aria-labelledby={`category-${categorySlug}`}>
              {/* El encabezado se apoya en una regla de 1px en vez de en una
                  card: la fila ES la sección, y meter la sección dentro de una
                  tarjeta pondría cards dentro de cards. */}
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border pb-4">
                <div className="min-w-0">
                  <h2 id={`category-${categorySlug}`} className="font-heading text-heading tracking-tight">
                    <Link
                      href={categoryHref}
                      className="rounded-sm underline-offset-4 transition-colors duration-fast ease-out hover:text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                    >
                      {category.title}
                    </Link>
                  </h2>
                  {category.description && (
                    <p className="mt-2 max-w-[65ch] text-body text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-label text-muted-foreground tabular-nums">
                    {t.posts(total)}
                  </span>
                  {hasMore && (
                    <Link
                      href={categoryHref}
                      className="group inline-flex items-center gap-1 rounded-sm text-label text-primary-text underline-offset-4 transition-colors duration-fast ease-out hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                    >
                      {viewAllLabel ?? (locale === 'en' ? 'View more' : 'Ver más')}
                      <span className="sr-only">: {category.title}</span>
                      <ArrowRight
                        className="size-4 transition-transform duration-fast ease-standard group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {docs.map((doc, i) => {
                  // Misma regla que ArchiveBlock: lo que entra en el primer
                  // viewport no se esconde detrás del opacity:0 de ScrollReveal
                  // ni difiere la carga de su miniatura (LCP). Acá solo aplica
                  // a la primera fila de la primera categoría — el destacado va
                  // arriba y empuja al resto fuera del fold.
                  const isAboveFold = rowIndex === 0 && i < 3
                  return (
                    <ScrollReveal key={doc.id} priority={isAboveFold}>
                      <PostCard
                        post={doc}
                        priority={isAboveFold}
                        href={blogPostPath(resolvePrimaryCategorySlug(doc.categories), doc.slug ?? '')}
                      />
                    </ScrollReveal>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </Container>
  )
}
