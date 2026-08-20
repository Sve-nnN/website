import { Container } from '@/components/Container'
import { Link } from '@/i18n/navigation'
import { blogCategoryPath, blogIndexPath, FALLBACK_CATEGORY_SLUG } from '@/lib/blog-paths'
import type { CategoryData } from '@/lib/cache'

const COPY = {
  es: { heading: 'Otros temas del blog', all: 'Ver todo el blog' },
  en: { heading: 'Other topics on the blog', all: 'Browse the whole blog' },
}

/**
 * Cierra una página de categoría ofreciendo las demás.
 *
 * Existe porque la categoría era un callejón sin salida: se terminaban los
 * artículos y no había ningún lugar al que ir, ni siquiera de vuelta al índice.
 * En una categoría vacía es más importante todavía — era una pantalla que decía
 * "acá no hay nada" y nada más.
 */
export function CategoryBridge({
  locale,
  categories,
  currentSlug,
}: {
  locale: 'es' | 'en'
  categories: CategoryData[]
  currentSlug: string
}) {
  const t = COPY[locale] ?? COPY.es
  const others = categories.filter(
    (c) => c.slug !== currentSlug && c.slug !== FALLBACK_CATEGORY_SLUG,
  )

  if (others.length === 0) return null

  return (
    <Container className="pb-12 md:pb-16">
      <div className="border-t border-border pt-8">
        <h2 className="font-heading text-heading tracking-tight">{t.heading}</h2>
        <ul className="mt-5 flex flex-wrap gap-2">
          {others.map((category) => (
            <li key={category.id}>
              <Link
                href={blogCategoryPath(category.slug ?? String(category.id))}
                className="inline-flex h-9 items-center rounded-md border border-input px-4 text-label transition-colors duration-fast ease-out hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
              >
                {category.title}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={blogIndexPath()}
              className="inline-flex h-9 items-center rounded-md px-4 text-label text-primary-text underline-offset-4 transition-colors duration-fast ease-out hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
            >
              {t.all}
            </Link>
          </li>
        </ul>
      </div>
    </Container>
  )
}
