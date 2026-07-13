import Image from 'next/image'

import type { SectionBlock as SectionBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { cn } from '@/lib/utils'

const paddingYMap: Record<string, string> = {
  none: 'py-0',
  sm: 'py-8',
  md: 'py-16',
  lg: 'py-24',
}

export function SectionComponent(props: SectionBlockProps) {
  const {
    container,
    paddingY,
    backgroundStyle,
    backgroundColor,
    backgroundMedia,
    anchorId,
    className,
    blocks,
  } = props

  const bgImage = typeof backgroundMedia === 'object' ? backgroundMedia : null

  const sectionClassName = cn(
    'relative',
    paddingYMap[paddingY ?? 'md'],
    backgroundStyle === 'color' && backgroundColor,
    className,
  )

  const content = (
    // Recursively delegate to the same RenderBlocks map — never duplicate
    // the block-type switch logic here (05-04 hard rule).
    <RenderBlocks blocks={blocks as never} />
  )

  return (
    <section id={anchorId || undefined} className={sectionClassName}>
      {backgroundStyle === 'image' && bgImage?.url && (
        <div className="absolute inset-0 -z-10">
          <Image src={bgImage.url} alt={bgImage.alt ?? ''} fill className="object-cover" sizes="100vw" />
        </div>
      )}
      {container === 'full' ? content : <Container>{content}</Container>}
    </section>
  )
}
