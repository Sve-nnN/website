import type { BeforeSync, DocToSync } from '@payloadcms/plugin-search/types'

/**
 * Extends JuanPortfolio's posts-only beforeSync shape across 3 source
 * collections (posts, case-studies, authors) — branches on `collectionSlug`
 * since authors have no `categories` field to resolve.
 */
export const beforeSyncWithSearch: BeforeSync = async ({ collectionSlug, req, originalDoc, searchDoc }) => {
  if (originalDoc._status === 'draft') {
    return searchDoc
  }

  const modifiedDoc: DocToSync = {
    ...searchDoc,
    slug: originalDoc.slug,
    categories: [],
  }

  if (collectionSlug === 'posts') {
    modifiedDoc.meta = {
      title: originalDoc.title,
      description: originalDoc.excerpt ?? '',
    }
  } else if (collectionSlug === 'case-studies') {
    modifiedDoc.meta = {
      title: originalDoc.title,
      description: originalDoc.heroSubtitle ?? '',
    }
  } else if (collectionSlug === 'authors') {
    modifiedDoc.meta = {
      title: originalDoc.name,
      description: originalDoc.jobTitle ?? originalDoc.bio ?? '',
    }
  }

  const categories = originalDoc.categories

  if (categories && Array.isArray(categories) && categories.length > 0) {
    const populatedCategories: { id: string | number; title: string }[] = []

    for (const category of categories) {
      if (!category) continue

      if (typeof category === 'object') {
        populatedCategories.push(category)
        continue
      }

      const doc = await req.payload.findByID({
        collection: 'categories',
        id: category,
        disableErrors: true,
        depth: 0,
        select: { title: true },
        req,
      })

      if (doc !== null) {
        populatedCategories.push(doc)
      } else {
        console.error(
          `Failed. Category not found when syncing collection '${collectionSlug}' with id: '${originalDoc.id}' to search.`,
        )
      }
    }

    modifiedDoc.categories = populatedCategories.map((each) => ({
      relationTo: 'categories',
      categoryID: String(each.id),
      title: each.title,
    }))
  }

  return modifiedDoc
}
