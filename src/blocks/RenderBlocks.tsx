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
import { AboutSectionComponent } from '@/blocks/AboutSection/Component'
import { TestimonialSectionComponent } from '@/blocks/TestimonialSection/Component'
import { ServicesShowcaseComponent } from '@/blocks/ServicesShowcase/Component'

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
  aboutSection: AboutSectionComponent,
  testimonialSection: TestimonialSectionComponent,
  servicesShowcase: ServicesShowcaseComponent,
}

interface RenderBlocksProps {
  blocks: LayoutBlocks | undefined | null
  // Merged into every block's props — used to forward page-level request
  // context (e.g. blog listing's ?category= searchParam, or a post detail
  // page's current post id/categories for RelatedPosts) without forcing
  // RenderBlocks itself to know about any single block's needs. Prefer
  // `blockProps` (below) for props that only make sense for one specific
  // block type — sharedProps reaches every block on the page.
  sharedProps?: Record<string, unknown>
  // Merged only into the props of the matching `blockType`'s renderer (e.g.
  // `{ contactFormBlock: { onSubmit, contactEmail, locale } }`), so props
  // that only one block type consumes (like the contact form's server
  // action) don't get spread onto unrelated blocks (RenderBlocks WR-03).
  blockProps?: Partial<Record<string, Record<string, unknown>>>
}

export function RenderBlocks({ blocks, sharedProps, blockProps }: RenderBlocksProps) {
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

        return (
          <Comp
            key={block.id ?? i}
            {...(block as unknown as Record<string, unknown>)}
            {...sharedProps}
            {...blockProps?.[block.blockType]}
          />
        )
      })}
    </>
  )
}
