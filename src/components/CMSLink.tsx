import type { ReactNode } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
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
}

/**
 * Renders the shared `link()` field-factory group (src/fields/link.ts) as a
 * navigable link. Resolves internal `reference` docs to their slug-based
 * route, or falls back to a raw `url` for custom links.
 */
export function CMSLink(props: CMSLinkProps) {
  const { type, newTab, reference, url, label, appearance, className, children } = props

  let href = url ?? '#'

  if (type === 'reference' && reference?.value) {
    const slug =
      typeof reference.value === 'object' ? reference.value.slug : undefined
    const collectionPath = reference.relationTo === 'posts' ? '/blog' : ''
    href = slug ? `${collectionPath}/${slug}` : '#'
  }

  const content = children ?? label

  if (appearance) {
    return (
      <Button asChild variant={appearance === 'outline' ? 'outline' : 'default'} className={className}>
        <Link href={href} target={newTab ? '_blank' : undefined} rel={newTab ? 'noopener noreferrer' : undefined}>
          {content}
        </Link>
      </Button>
    )
  }

  return (
    <Link
      href={href}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      className={cn('text-primary underline underline-offset-2', className)}
    >
      {content}
    </Link>
  )
}
