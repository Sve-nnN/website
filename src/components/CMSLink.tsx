import type { ReactNode } from 'react'
import PlainLink from 'next/link'

import { Button } from '@/components/ui/button'
import { Link as LocaleLink, isPrefixableHref } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface CMSLinkProps {
  type?: 'reference' | 'custom' | null
  newTab?: boolean | null
  // Deliberately loose — accepts whatever shape Payload's generated types
  // produce for the `link()` field factory's `reference` relationship
  // (varies per collection union), we only ever read `.value`/`.relationTo`.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reference?: { value: number | { slug?: string | null }; relationTo?: string } | null | any
  url?: string | null
  label?: string | null
  appearance?: 'default' | 'outline' | null
  className?: string
  children?: ReactNode
  /** Forwarded verbatim to the rendered anchor for active-route indication (e.g. SiteHeaderChrome). */
  'aria-current'?: 'page' | boolean
}

/**
 * Renders the shared `link()` field-factory group (src/fields/link.ts) as a
 * navigable link. Resolves internal `reference` docs to their slug-based
 * route, or falls back to a raw `url` for custom links.
 */
export function CMSLink(props: CMSLinkProps) {
  const { type, newTab, reference, url, label, appearance, className, children } = props
  const ariaCurrent = props['aria-current']

  let href = url ?? '#'

  if (type === 'reference' && reference?.value) {
    const slug =
      typeof reference.value === 'object' ? reference.value.slug : undefined
    const collectionPath = reference.relationTo === 'posts' ? '/blog' : ''
    href = slug ? `${collectionPath}/${slug}` : '#'
  }

  const content = children ?? label

  // These hrefs are admin-authored, so the guard picks the component ONCE for
  // both render branches (they must never drift). It protects three real
  // shapes an editor can type: an absolute external URL, a bare `#fragment`,
  // and a path they already prefixed by hand (`/en/contact`) — none of which
  // may be given a locale prefix. A `type === 'reference'` link always resolves
  // to an internal unprefixed path, so references always take the
  // locale-aware branch.
  const LinkComponent = isPrefixableHref(href) ? LocaleLink : PlainLink

  if (appearance) {
    return (
      <Button asChild variant={appearance === 'outline' ? 'outline' : 'default'} className={className}>
        <LinkComponent
          href={href}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noopener noreferrer' : undefined}
          aria-current={ariaCurrent}
        >
          {content}
        </LinkComponent>
      </Button>
    )
  }

  return (
    <LinkComponent
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      className={cn('text-primary underline underline-offset-2', className)}
      aria-current={ariaCurrent}
    >
      {content}
    </LinkComponent>
  )
}
