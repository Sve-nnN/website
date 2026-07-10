/**
 * Idempotent upsert (by slug, never delete-then-recreate — T-05-06-01) of the
 * real `home` Pages doc's block composition, plus curation of the
 * `featured-content` global with real migrated data.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-home-page.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

async function main() {
  const payload = await getPayload({ config })

  const { docs: authorDocs } = await payload.find({ collection: 'authors', limit: 1 })
  const author = authorDocs[0]

  if (!author) {
    console.log('No Author doc found — cannot build the About section. Aborting seed.')
    process.exit(1)
  }

  const { docs: recentPosts } = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-publishedAt',
  })

  const { docs: homeDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  const homeDoc = homeDocs[0]

  if (!homeDoc) {
    console.log('No `home` Pages doc found by slug — cannot seed. Aborting.')
    process.exit(1)
  }

  const layoutByLocale: Record<(typeof LOCALES)[number], unknown[]> = {
    es: [
      {
        blockType: 'hero',
        variant: 'home',
        title: 'Juan Carlos Angulo: Ingeniero de Software y Experto SEO',
        subtitle: 'Arquitecturas de alto rendimiento y estrategias de crecimiento orgánico',
      },
      {
        blockType: 'featuredCaseStudiesBlock',
        title: 'Casos de éxito destacados',
        limit: 3,
      },
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [{ type: 'text', version: 1, text: author.bio ?? '' }],
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            enableLink: false,
          },
        ],
      },
      {
        blockType: 'clientLogosBlock',
        title: 'Clientes',
      },
      {
        blockType: 'featuredPostsBlock',
        title: 'Artículos destacados',
        limit: 3,
      },
      {
        blockType: 'testimonialsCarousel',
        title: 'Testimonios',
        showRating: true,
        limit: 8,
      },
      {
        blockType: 'callToAction',
        richText: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [{ type: 'text', version: 1, text: '¿Listo para trabajar juntos?' }],
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        links: [
          {
            link: {
              type: 'custom',
              url: '/contact',
              label: 'Hablemos',
              appearance: 'default',
            },
          },
        ],
      },
    ],
    en: [
      {
        blockType: 'hero',
        variant: 'home',
        title: 'Juan Carlos Angulo: Software Engineer & SEO Expert',
        subtitle: 'High-performance architectures and organic growth strategies',
      },
      {
        blockType: 'featuredCaseStudiesBlock',
        title: 'Featured Case Studies',
        limit: 3,
      },
      {
        blockType: 'content',
        columns: [
          {
            size: 'full',
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [{ type: 'text', version: 1, text: author.bio ?? '' }],
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            enableLink: false,
          },
        ],
      },
      {
        blockType: 'clientLogosBlock',
        title: 'Clients',
      },
      {
        blockType: 'featuredPostsBlock',
        title: 'Featured Posts',
        limit: 3,
      },
      {
        blockType: 'testimonialsCarousel',
        title: 'Testimonials',
        showRating: true,
        limit: 8,
      },
      {
        blockType: 'callToAction',
        richText: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                version: 1,
                children: [{ type: 'text', version: 1, text: 'Ready to work together?' }],
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
        links: [
          {
            link: {
              type: 'custom',
              url: '/contact',
              label: 'Get in Touch',
              appearance: 'default',
            },
          },
        ],
      },
    ],
  }

  for (const locale of LOCALES) {
    await payload.update({
      collection: 'pages',
      id: homeDoc.id,
      locale,
      data: {
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layoutByLocale[locale] as any,
        },
      },
    })
    console.log(`Updated home Pages doc (locale=${locale})`)
  }

  // FeaturedContent: curate by most-recent publishedAt (no existing "featured"
  // signal to migrate from). Leave featuredCaseStudies empty — 0 real case
  // studies exist yet (04-VERIFICATION.md) — never fabricate placeholder docs.
  await payload.updateGlobal({
    slug: 'featured-content',
    data: {
      featuredPosts: recentPosts.map((p) => p.id),
      featuredCaseStudies: [],
    },
  })

  console.log(`Curated FeaturedContent.featuredPosts with ${recentPosts.length} real posts.`)
  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
