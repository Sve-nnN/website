import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'

import { HeroComponent } from '@/blocks/Hero/Component'
import { ContentComponent } from '@/blocks/Content/Component'
import { CallToActionComponent } from '@/blocks/CallToAction/Component'
import { FAQComponent } from '@/blocks/FAQ/Component'
import { MediaBlockComponent } from '@/blocks/MediaBlock/Component'
import { CodeComponent } from '@/blocks/Code/Component'
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
import { ServiceScopeCardComponent } from '@/blocks/ServiceScopeCard/Component'
import { RelatedCaseStudyBlockComponent } from '@/blocks/RelatedCaseStudyBlock/Component'
import { LocalProofSectionComponent } from '@/blocks/LocalProofSection/Component'

// MAINTAINABILITY (circular-dependency): the registry, RenderBlocks.tsx, and
// Section/Component.tsx form a natural recursive relationship -- Section
// renders nested blocks via the same registry that also renders Section
// itself. A static import of SectionComponent here would keep the cycle
// (registry -> Section/Component.tsx -> RenderBlocks.tsx -> registry).
// `next/dynamic` resolves the module via a deferred promise instead of a
// static ES module binding, which removes Section from this file's static
// import graph and breaks the cycle, while still rendering identically at
// runtime (Next.js supports dynamic() in Server Components).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SectionComponent = dynamic(() =>
  import('@/blocks/Section/Component').then((mod) => mod.SectionComponent),
) as (props: any) => ReactNode

// Single source of truth mapping each registered Pages block slug (blockType
// discriminant) to its renderer. Do NOT duplicate this as a switch/if chain
// elsewhere — extend this map only (05-04 Task 1/2 precedent).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const blockComponents: Record<string, (props: any) => ReactNode> = {
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
  serviceScopeCard: ServiceScopeCardComponent,
  relatedCaseStudyBlock: RelatedCaseStudyBlockComponent,
  localProofSection: LocalProofSectionComponent,
}
