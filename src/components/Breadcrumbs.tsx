import Link from 'next/link'

import type { BreadcrumbItem } from '@/lib/breadcrumbs'

/**
 * Visible breadcrumb trail for pages rendered on the light surface (the navy
 * hero variants render their own inline trail against `secondary-foreground`).
 *
 * Pair it with `buildBreadcrumbJsonLd()` over the SAME trail array: structured
 * data is supposed to describe what the page actually shows, and an author
 * profile that emitted `BreadcrumbList` markup while rendering no trail at all
 * was telling crawlers about navigation the visitor never got.
 */
export function Breadcrumbs({
  trail,
  className,
}: {
  trail: BreadcrumbItem[]
  className?: string
}) {
  if (trail.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-muted-foreground">
        {trail.map((crumb, i) => {
          const isLast = i === trail.length - 1
          return (
            <li key={crumb.url} className="flex items-center gap-x-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {isLast ? (
                <span aria-current="page" className="text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.url}
                  className="rounded-sm underline-offset-2 transition-colors duration-fast ease-out hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
