/**
 * Idempotent upsert (by slug) of the real `blog` Pages doc's block
 * composition — mirrors scripts/seed-home-page.ts's pattern.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-blog-page.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

const layoutByLocale: Record<(typeof LOCALES)[number], unknown[]> = {
  es: [
    {
      blockType: 'hero',
      variant: 'listing',
      title: 'Blog',
      subtitle: 'Artículos sobre ingeniería de software, SEO técnico y crecimiento orgánico.',
    },
    {
      blockType: 'featuredPostsBlock',
      title: 'Destacados',
      limit: 3,
    },
    {
      blockType: 'archiveBlock',
      relationTo: 'posts',
      mode: 'latest',
      limit: 12,
      enableCategoryFilter: true,
      emptyStateHeading: 'Todavía no hay nada aquí',
      emptyStateBody: 'Esta categoría todavía no tiene artículos. Explora todos los artículos.',
    },
  ],
  en: [
    {
      blockType: 'hero',
      variant: 'listing',
      title: 'Blog',
      subtitle: 'Articles on software engineering, technical SEO, and organic growth.',
    },
    {
      blockType: 'featuredPostsBlock',
      title: 'Featured',
      limit: 3,
    },
    {
      blockType: 'archiveBlock',
      relationTo: 'posts',
      mode: 'latest',
      limit: 12,
      enableCategoryFilter: true,
      emptyStateHeading: 'Nothing here yet',
      emptyStateBody: "This category doesn't have any posts yet. Browse all posts instead.",
    },
  ],
}

async function main() {
  const payload = await getPayload({ config })

  const { docs: existing } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'blog' } },
    limit: 1,
  })

  let blogDocId = existing[0]?.id

  if (!blogDocId) {
    const created = await payload.create({
      collection: 'pages',
      locale: 'es',
      data: {
        title: 'Blog',
        slug: 'blog',
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layoutByLocale.es as any,
        },
      },
    })
    blogDocId = created.id
    console.log(`Created blog Pages doc (id=${blogDocId})`)
  }

  for (const locale of LOCALES) {
    await payload.update({
      collection: 'pages',
      id: blogDocId,
      locale,
      data: {
        title: 'Blog',
        content: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          layout: layoutByLocale[locale] as any,
        },
      },
    })
    console.log(`Updated blog Pages doc (locale=${locale})`)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
