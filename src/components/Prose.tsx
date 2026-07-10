import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

/**
 * Typographic frame for serialized Lexical rich text (`richText`/`content`/
 * `clientContext`/`conclusion` fields across Posts, CaseStudies, Pages Content
 * block). Purely styling — does NOT implement the Lexical-to-JSX converter,
 * which is each page plan's own concern. Applies the Typography contract
 * from 05-UI-SPEC.md: text-heading/text-display (Fraunces) for headings,
 * text-body (Inter) for paragraphs, accent-colored in-copy links.
 */
export function Prose({ children, className, ...props }: ProseProps) {
  return (
    <div
      className={cn(
        'text-body font-sans text-foreground',
        '[&_h1]:font-display [&_h1]:text-display [&_h1]:mb-6 [&_h1]:tracking-tight',
        '[&_h2]:font-display [&_h2]:text-heading [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight',
        '[&_h3]:font-display [&_h3]:text-heading [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:tracking-tight [&_h3]:opacity-90',
        '[&_p]:text-body [&_p]:mb-4',
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4',
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4',
        '[&_li]:mb-2',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80',
        '[&_strong]:font-semibold',
        '[&_blockquote]:font-display [&_blockquote]:text-heading [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-6 [&_blockquote]:my-8 [&_blockquote]:text-foreground/80',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
