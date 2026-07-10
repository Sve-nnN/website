import type { CallToActionBlock as CallToActionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { CMSLink } from '@/components/CMSLink'

export function CallToActionComponent(props: CallToActionBlockProps) {
  const { richText, links } = props

  return (
    <Container className="py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
      <div className="flex-1">
        <RichTextRenderer data={richText} />
      </div>
      {links && links.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {links.map(({ link }, i) => (
            <CMSLink key={i} {...link} />
          ))}
        </div>
      )}
    </Container>
  )
}
