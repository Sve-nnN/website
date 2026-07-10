'use client'

import { useEffect, useState } from 'react'

import type { TableOfContentsBlockType } from '@/payload-types'
import { cn } from '@/lib/utils'

interface TocHeading {
  id: string
  text: string
  level: number
}

/**
 * Parses headings from the rendered DOM after mount (the post body renders
 * via RichTextRenderer elsewhere on the page) rather than re-parsing Lexical
 * JSON here, keeping this block decoupled from any single content field.
 */
export function TableOfContentsBlockComponent(props: TableOfContentsBlockType) {
  const { title, position, sticky, minHeadingLevel } = props
  const [headings, setHeadings] = useState<TocHeading[]>([])

  useEffect(() => {
    const minLevel = Number(minHeadingLevel ?? '2')
    const selector = minLevel === 3 ? 'h2, h3' : 'h2'
    const nodes = Array.from(document.querySelectorAll<HTMLHeadingElement>(`article ${selector}`))

    setHeadings(
      nodes.map((node, i) => {
        if (!node.id) node.id = `heading-${i}`
        return {
          id: node.id,
          text: node.textContent ?? '',
          level: Number(node.tagName.replace('H', '')),
        }
      }),
    )
  }, [minHeadingLevel])

  if (headings.length === 0) return null

  return (
    <nav
      className={cn(
        'text-body',
        sticky && 'sticky top-24',
        position === 'right' ? 'order-last' : position === 'top' ? 'mb-8' : '',
      )}
      aria-label={title ?? 'Table of contents'}
    >
      {title && <p className="text-label mb-2">{title}</p>}
      <ul className="space-y-1">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
            <a href={`#${heading.id}`} className="text-muted-foreground hover:text-primary">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
