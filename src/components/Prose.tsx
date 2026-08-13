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
 * from 05-UI-SPEC.md: text-heading (Khand) / text-display (Array) for headings,
 * text-body (Geist Sans) for paragraphs, accent-colored in-copy links.
 */
export function Prose({ children, className, ...props }: ProseProps) {
  return (
    <div
      className={cn(
        'text-body font-sans text-foreground',
        '[&_h1]:font-display [&_h1]:text-display [&_h1]:mb-6 [&_h1]:tracking-tight',
        '[&_h2]:font-heading [&_h2]:text-heading [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:tracking-tight',
        '[&_h3]:font-heading [&_h3]:text-heading [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:tracking-tight [&_h3]:opacity-90',
        // POLISH: prose paragraphs ran the full width of whatever contained
        // them — measured ~130ch on the author bio at 1440px, roughly double
        // the reading measure. A max-width on the paragraph itself keeps
        // narrower containers untouched.
        '[&_p]:text-body [&_p]:mb-4 [&_p]:max-w-[70ch]',
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4',
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4',
        '[&_li]:mb-2',
        // POLISH: in-copy links were `text-primary` (#F7581E), which is 3.15:1
        // on the light background at body size — below AA. `primary-text`
        // (#D03D07) is 4.61:1. This is the same substitution already applied
        // across the blocks; it was missed here, so it affected every rich-text
        // link on the site.
        '[&_a]:text-primary-text [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80',
        '[&_strong]:font-semibold',
        '[&_blockquote]:font-heading [&_blockquote]:text-heading [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-6 [&_blockquote]:my-8 [&_blockquote]:text-foreground/80',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
