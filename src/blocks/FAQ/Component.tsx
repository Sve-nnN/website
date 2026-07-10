import type { FAQBlock as FAQBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'

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
      <div className="divide-y divide-border">
        {faqs?.map((item, i) => (
          <details key={i} className="py-4 group">
            <summary className="cursor-pointer font-sans font-semibold text-body list-none flex items-center justify-between">
              {item.question}
              <span className="ml-4 text-primary group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="mt-3">
              <RichTextRenderer data={item.answer} />
            </div>
          </details>
        ))}
      </div>
    </Container>
  )
}
