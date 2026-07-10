import type { ReactNode } from 'react'

import type { Page } from '@/payload-types'

import { HeroComponent } from '@/blocks/Hero/Component'
import { ContentComponent } from '@/blocks/Content/Component'
import { CallToActionComponent } from '@/blocks/CallToAction/Component'
import { FAQComponent } from '@/blocks/FAQ/Component'
import { MediaBlockComponent } from '@/blocks/MediaBlock/Component'
import { CodeComponent } from '@/blocks/Code/Component'
import { SectionComponent } from '@/blocks/Section/Component'
import { ArchiveBlockComponent } from '@/blocks/ArchiveBlock/Component'
import { TestimonialsCarouselComponent } from '@/blocks/TestimonialsCarousel/Component'
import { RelatedPostsComponent } from '@/blocks/RelatedPosts/Component'
import { TableOfContentsBlockComponent } from '@/blocks/TableOfContentsBlock/Component'
import { ResultsSectionComponent } from '@/blocks/ResultsSection/Component'
import { FeaturedPostsBlockComponent } from '@/blocks/FeaturedPostsBlock/Component'
import { FeaturedCaseStudiesBlockComponent } from '@/blocks/FeaturedCaseStudiesBlock/Component'
import { ClientLogosBlockComponent } from '@/blocks/ClientLogosBlock/Component'
import { ContactFormBlockComponent } from '@/blocks/ContactFormBlock/Component'

type LayoutBlocks = Page['content']['layout']
type LayoutBlock = LayoutBlocks[number]

// Single source of truth mapping each registered Pages block slug (blockType
// discriminant) to its renderer. Do NOT duplicate this as a switch/if chain
// elsewhere — extend this map only (05-04 Task 1/2 precedent).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockComponents: Record<string, (props: any) => ReactNode> = {
  hero: HeroComponent,
  content: ContentComponent,
  callToAction: CallToActionComponent,
  faq: FAQComponent,
  mediaBlock: MediaBlockComponent,
  code: CodeComponent,
  section: SectionComponent,
  archiveBlock: ArchiveBlockComponent,
  testimonialsCarousel: TestimonialsCarouselComponent,
  relatedPosts: RelatedPostsComponent,
  tableOfContentsBlock: TableOfContentsBlockComponent,
  resultsSection: ResultsSectionComponent,
  featuredPostsBlock: FeaturedPostsBlockComponent,
  featuredCaseStudiesBlock: FeaturedCaseStudiesBlockComponent,
  clientLogosBlock: ClientLogosBlockComponent,
  contactFormBlock: ContactFormBlockComponent,
}

export function RenderBlocks({ blocks }: { blocks: LayoutBlocks | undefined | null }) {
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map((block: LayoutBlock, i: number) => {
        const Comp = blockComponents[block.blockType]

        if (!Comp) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`RenderBlocks: no renderer registered for blockType "${block.blockType}"`)
          }
          return null
        }

        return <Comp key={block.id ?? i} {...(block as unknown as Record<string, unknown>)} />
      })}
    </>
  )
}
