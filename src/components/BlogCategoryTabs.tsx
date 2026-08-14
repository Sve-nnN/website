import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { blogCategoryPath, blogIndexPath, localizeBlogPath } from '@/lib/blog-paths'

type TabCategory = { id: number; slug?: string | null; title: string }

/**
 * Category navigation for the blog, shared by the blog index (rendered
 * through ArchiveBlock) and the `/blog/<category>` listing so both stay on one
 * implementation.
 *
 * The tabs link to real folders (`/blog/<category>`), not `?category=` query
 * params — a category is a page with its own canonical URL, title and
 * breadcrumb trail, not a filter state on the index.
 *
 * These are raw `<a>` elements inside a Radix `TabsTrigger asChild`, so the
 * locale prefix cannot come from the locale-aware `Link` the way it does
 * elsewhere — it is applied here with `localizeBlogPath`. The transform lives
 * at this call site and NOT inside `blogCategoryPath`/`blogIndexPath` because
 * those helpers are shared with `blogPostPath`, whose callers already render
 * through the locale-aware `Link`; localizing at the source would give those
 * hrefs a second `/en` segment.
 */
export function BlogCategoryTabs({
  locale,
  categories,
  activeSlug,
}: {
  locale: 'es' | 'en'
  categories: TabCategory[]
  activeSlug?: string
}) {
  if (categories.length === 0) return null

  const focusRing =
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus'

  return (
    <Tabs value={activeSlug ?? 'all'} className="mb-8">
      <div className="overflow-x-auto">
        <TabsList
          className="w-max"
          aria-label={locale === 'en' ? 'Filter by category' : 'Filtrar por categoría'}
        >
          <TabsTrigger value="all" asChild>
            <a href={localizeBlogPath(locale, blogIndexPath())} className={focusRing}>
              {locale === 'en' ? 'All' : 'Todas'}
            </a>
          </TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.slug ?? String(cat.id)} asChild>
              <a
                href={localizeBlogPath(locale, blogCategoryPath(cat.slug ?? String(cat.id)))}
                className={focusRing}
              >
                {cat.title}
              </a>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  )
}
