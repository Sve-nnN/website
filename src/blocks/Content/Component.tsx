import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { CMSLink } from '@/components/CMSLink'

const sizeToColSpan: Record<string, string> = {
  oneThird: 'md:col-span-4',
  half: 'md:col-span-6',
  twoThirds: 'md:col-span-8',
  full: 'md:col-span-12',
}

export function ContentComponent(props: ContentBlockProps) {
  const { columns } = props

  return (
    <Container className="py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {columns?.map((col, i) => (
          <div key={i} className={sizeToColSpan[col.size ?? 'oneThird']}>
            <RichTextRenderer data={col.richText} />
            {col.enableLink && col.link && <CMSLink {...col.link} className="mt-4 inline-block" />}
          </div>
        ))}
      </div>
    </Container>
  )
}
