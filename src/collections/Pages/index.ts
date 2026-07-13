import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { authenticatedOrPublished } from '@/access/authenticatedOrPublished'
import { slugField } from '@/fields/slug'
import { targetKeywordField } from '@/fields/targetKeyword'

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
import { ClientLogosBlock } from '@/blocks/ClientLogosBlock/config'
import { AboutSection } from '@/blocks/AboutSection/config'
import { ServicesShowcase } from '@/blocks/ServicesShowcase/config'

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
            ClientLogosBlock,
            AboutSection,
            ServicesShowcase,
          ],
        },
      ],
    },
    slugField(),
    targetKeywordField(),
  ],
}
