import type { GlobalConfig } from 'payload'

export const FeaturedContent: GlobalConfig = {
  slug: 'featured-content',
  label: 'Featured Content',
  admin: {
    group: 'Site',
    description:
      'Manual curation of which posts/case studies appear in "featured" sections site-wide (Home, Blog listing) — not derived from recency alone.',
  },
  fields: [
    {
      name: 'featuredPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: {
        description: 'Drives the Home page and Blog listing "Featured Posts" sections.',
      },
    },
    {
      name: 'featuredCaseStudies',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: true,
      admin: {
        description: 'Drives the Home page "Featured Case Studies" section.',
      },
    },
  ],
}
