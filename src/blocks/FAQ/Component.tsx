import { Plus } from 'lucide-react'

import type { FAQBlock as FAQBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { ScrollReveal } from '@/components/ScrollReveal'

/**
 * shadcn's installed set (05-01) has no Accordion primitive — a plain,
 * accessible <details>/<summary> pair avoids hand-rolled, ARIA-incomplete JS
 * toggles while staying keyboard/screen-reader friendly natively.
 */
export function FAQComponent(props: FAQBlockProps) {
  const { title, faqs } = props

  return (
    <Container className="py-12">
      {title && <h2 className="font-heading text-heading mb-6">{title}</h2>}
      <div className="space-y-3">
        {faqs?.map((item, i) => (
          <ScrollReveal key={item.id ?? i}>
            {/* POLISH: `has-[summary:focus-visible]` puts the focus treatment on
                the bordered <details> shell rather than the borderless summary
                row, so the whole control reads as focused. `list-none` removes
                the native marker, and the summary had `outline: none` with no
                replacement — measured on production, a keyboard user tabbing
                through the FAQ got no visible focus at all (WCAG 2.4.7). */}
            <details className="group rounded-lg border border-border bg-card px-6 shadow-sm hover:shadow-md transition-shadow duration-base ease-standard has-[summary:focus-visible]:ring-1 has-[summary:focus-visible]:ring-ring has-[summary:focus-visible]:shadow-focus">
              <summary className="cursor-pointer font-sans font-semibold text-body list-none flex items-center justify-between py-4 focus-visible:outline-none">
                {item.question}
                <Plus
                  className="ml-4 size-5 text-primary transition-transform duration-fast ease-out group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              {/* POLISH: the answer opened flush against the question with no
                  separation, so an expanded item read as one run-on block. A
                  hairline plus top padding groups the pair while still
                  distinguishing question from answer. */}
              <div className="border-t border-border pt-4 pb-5 max-w-[70ch]">
                <RichTextRenderer data={item.answer} />
              </div>
            </details>
          </ScrollReveal>
        ))}
      </div>
    </Container>
  )
}
