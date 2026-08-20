import {
  blogCategoryPath,
  blogIndexPath,
  localizeBlogPath,
  FALLBACK_CATEGORY_SLUG,
} from '@/lib/blog-paths'

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
 * Rendered as a `<nav>` of links, NOT as a Radix tablist. It used to be one,
 * purely for the styling, and that produced invalid ARIA on six routes: Radix
 * emits `role="tab"` plus an `aria-controls` pointing at a tabpanel that never
 * exists here, because every "tab" navigates to its own page instead of
 * revealing a sibling panel. A screen reader announced a relationship with
 * nothing on the other end. The visual classes are lifted verbatim below, so
 * the strip is unchanged; `aria-current="page"` now carries what
 * `data-state="active"` used to mean semantically.
 *
 * These are raw `<a>` elements, so the locale prefix cannot come from the
 * locale-aware `Link` the way it does elsewhere — it is applied here with `localizeBlogPath`. The transform lives
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
  // `general` es el segmento de reserva para posts sin categoría, no un tema
  // del blog. Ofrecerlo como pestaña manda al visitante a una lista vacía.
  const listable = categories.filter((cat) => cat.slug !== FALLBACK_CATEGORY_SLUG)

  if (listable.length === 0) return null

  const active = activeSlug ?? 'all'

  const items = [
    { key: 'all', href: localizeBlogPath(locale, blogIndexPath()), label: locale === 'en' ? 'All' : 'Todas' },
    ...listable.map((cat) => {
      const slug = cat.slug ?? String(cat.id)
      return { key: slug, href: localizeBlogPath(locale, blogCategoryPath(slug)), label: cat.title }
    }),
  ]

  return (
    <nav
      className="mb-8"
      aria-label={locale === 'en' ? 'Blog categories' : 'Categorías del blog'}
    >
      <div className="overflow-x-auto">
        <ul className={LIST_CLASS}>
          {items.map((item) => {
            const isActive = item.key === active
            return (
              <li key={item.key}>
                <a
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  data-state={isActive ? 'active' : 'inactive'}
                  className={ITEM_CLASS}
                >
                  {item.label}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

// Lifted verbatim from the Radix `TabsList` / `TabsTrigger` styles these used
// to render through, so the strip looks pixel-identical. The
// `data-[state=active]` selectors still drive the active pill; the attribute is
// now written directly instead of being managed by Radix.
const LIST_CLASS =
  'w-max inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground list-none m-0'

const ITEM_CLASS =
  'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-[color,background-color,box-shadow] duration-fast ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
