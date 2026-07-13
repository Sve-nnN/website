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
          <ScrollReveal key={i}>
            <details className="group rounded-lg border border-border bg-card px-6 shadow-sm hover:shadow-md transition-shadow duration-base ease-standard">
              <summary className="cursor-pointer font-sans font-semibold text-body list-none flex items-center justify-between py-4">
                {item.question}
                <Plus
                  className="ml-4 size-5 text-primary transition-transform duration-fast ease-out group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <div className="pb-4">
                <RichTextRenderer data={item.answer} />
              </div>
            </details>
          </ScrollReveal>
        ))}
      </div>
    </Container>
  )
}
