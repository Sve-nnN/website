import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { targetKeywordField } from '@/fields/targetKeyword'
import { revalidatePagesCache, revalidatePagesCacheOnDelete } from '@/lib/cache-tags'

import { Hero } from '@/blocks/Hero/config'
import { Content } from '@/blocks/Content/config'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { FAQ } from '@/blocks/FAQ/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { TestimonialsCarousel } from '@/blocks/TestimonialsCarousel/config'
import { ContactFormBlock } from '@/blocks/ContactFormBlock/config'
import { Code } from '@/blocks/Code/config'
import { RelatedPosts } from '@/blocks/RelatedPosts/config'
import { TableOfContentsBlock } from '@/blocks/TableOfContentsBlock/config'
import { ResultsSection } from '@/blocks/ResultsSection/config'
import { Section } from '@/blocks/Section/config'
import { FeaturedPostsBlock } from '@/blocks/FeaturedPostsBlock/config'
import { FeaturedCaseStudiesBlock } from '@/blocks/FeaturedCaseStudiesBlock/config'
import { FeaturedWebsitesBlock } from '@/blocks/FeaturedWebsitesBlock/config'
import { ClientLogosBlock } from '@/blocks/ClientLogosBlock/config'
import { AboutSection } from '@/blocks/AboutSection/config'
import { ServicesShowcase } from '@/blocks/ServicesShowcase/config'
import { ServiceScopeCard } from '@/blocks/ServiceScopeCard/config'
import { RelatedCaseStudyBlock } from '@/blocks/RelatedCaseStudyBlock/config'
import { LocalProofSection } from '@/blocks/LocalProofSection/config'

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  // Phase 43 (43-01): invalidates the unstable_cache entry (src/lib/cache.ts
  // getCachedPageBySlug) tagged pages:<slug> so edits/publishes reflect
  // without waiting for the 60s TTL safety net.
  hooks: {
    afterChange: [revalidatePagesCache],
    afterDelete: [revalidatePagesCacheOnDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'group',
      label: 'Content',
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          required: true,
          admin: {
            initCollapsed: true,
          },
          blocks: [
            Hero,
            Content,
            ArchiveBlock,
            CallToAction,
            FAQ,
            MediaBlock,
            TestimonialsCarousel,
            ContactFormBlock,
            Code,
            RelatedPosts,
            TableOfContentsBlock,
            ResultsSection,
            Section,
            FeaturedPostsBlock,
            FeaturedCaseStudiesBlock,
            FeaturedWebsitesBlock,
            ClientLogosBlock,
            AboutSection,
            ServicesShowcase,
            ServiceScopeCard,
            RelatedCaseStudyBlock,
            LocalProofSection,
          ],
        },
      ],
    },
    slugField(),
    targetKeywordField(),
  ],
}
