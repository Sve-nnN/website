'use client'

import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

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
  // En escritorio el índice vive en su columna y se ve siempre. En mobile caía
  // debajo del artículo entero, o sea después de lo que debía ayudar a navegar,
  // y ocupaba una pantalla completa de enlaces antes del primer párrafo cuando
  // se lo subía. Colapsado resuelve las dos: está arriba, disponible, y cuesta
  // una línea.
  const [expanded, setExpanded] = useState(false)

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
        // El sticky solo tiene sentido cuando el índice tiene una columna
        // propia. En una sola columna, fijarlo lo deja tapando el texto.
        // `self-start` es obligatorio con sticky dentro de un grid: por defecto
        // el item se estira a la altura de la fila, y un elemento tan alto como
        // su contenedor nunca tiene margen para pegarse. Con esto el índice
        // vuelve a acompañar el scroll en vez de quedarse arriba del artículo.
        sticky && 'md:sticky md:top-24 md:self-start',
        // `order-last` lo manda al final de la grilla, que en escritorio es su
        // columna derecha y en mobile sería después del artículo completo.
        position === 'right' ? 'order-first md:order-last' : position === 'top' ? 'mb-8' : '',
        'border-b border-border pb-4 md:border-0 md:pb-0',
      )}
      aria-label={title ?? 'Table of contents'}
    >
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-controls="toc-list"
        className="flex w-full items-center justify-between gap-2 rounded-md text-label transition-colors duration-fast ease-out hover:text-primary-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus md:hidden"
      >
        {title ?? 'Table of contents'}
        <ChevronDown
          className={cn('size-4 transition-transform duration-fast ease-standard', expanded && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {title && <p className="mb-2 hidden text-label md:block">{title}</p>}

      <ul id="toc-list" className={cn('space-y-1 pt-3 md:pt-0', expanded ? 'block' : 'hidden md:block')}>
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? 'ml-4' : ''}>
            <a
              href={`#${heading.id}`}
              onClick={() => setExpanded(false)}
              className="rounded-sm text-muted-foreground underline-offset-4 transition-colors duration-fast ease-out hover:text-primary-text hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
