/**
 * Idempotent seed script for Phase 2 (bilingüe + SEO) end-to-end verification.
 *
 * Standalone script — run outside Next.js's build/runtime, so it imports
 * `payload.config.ts` via a relative path (Next's `@payload-config` alias is
 * not resolvable here).
 *
 * Run with: npx tsx scripts/seed-phase2.ts
 *
 * Creates minimal bilingual test content proving the full i18n/SEO pipeline
 * (I18N-01 through I18N-06) works end to end against real seeded data:
 * Author, Category, Page (home), Post, CaseStudy, Redirect, Llms global.
 *
 * Idempotent — re-running skips any entity that already exists (matched by
 * slug / from field), so this script is safe to re-run for manual testing.
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, version: 1 }],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

async function seed() {
  const payload = await getPayload({ config })

  const createdIds: Record<string, string | number> = {}

  // 1. Author
  const existingAuthor = await payload.find({
    collection: 'authors',
    where: { slug: { equals: 'juan-carlos-angulo' } },
    limit: 1,
  })
  let authorId: string | number
  if (existingAuthor.docs.length > 0) {
    authorId = existingAuthor.docs[0].id
    console.log('Author: already exists, skipping')
  } else {
    const author = await payload.create({
      collection: 'authors',
      locale: 'es',
      data: {
        name: 'Juan Carlos Angulo',
        slug: 'juan-carlos-angulo',
        jobTitle: 'Ingeniero de Software y Experto SEO',
        bio: 'Biografía de prueba para Fase 2.',
      },
    })
    authorId = author.id
    await payload.update({
      collection: 'authors',
      id: authorId,
      locale: 'en',
      data: {
        jobTitle: 'Software Engineer & SEO Expert',
        bio: 'Test bio for Phase 2.',
      },
    })
    console.log('Author: created', authorId)
  }
  createdIds.author = authorId

  // 2. Category
  const existingCategory = await payload.find({
    collection: 'categories',
    where: { slug: { equals: 'seo' } },
    limit: 1,
  })
  let categoryId: string | number
  if (existingCategory.docs.length > 0) {
    categoryId = existingCategory.docs[0].id
    console.log('Category: already exists, skipping')
  } else {
    const category = await payload.create({
      collection: 'categories',
      locale: 'es',
      data: {
        title: 'SEO Técnico',
        slug: 'seo',
        description: 'Categoría de prueba.',
      },
    })
    categoryId = category.id
    await payload.update({
      collection: 'categories',
      id: categoryId,
      locale: 'en',
      data: {
        title: 'Technical SEO',
        description: 'Test category.',
      },
    })
    console.log('Category: created', categoryId)
  }
  createdIds.category = categoryId

  // 3. Page (home)
  const existingPage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })
  let pageId: string | number
  if (existingPage.docs.length > 0) {
    pageId = existingPage.docs[0].id
    console.log('Page (home): already exists, skipping')
  } else {
    const page = await payload.create({
      collection: 'pages',
      locale: 'es',
      data: {
        title: 'Inicio',
        slug: 'home',
        _status: 'published',
        content: { layout: [{ blockType: 'content', columns: [] }] },
      },
    })
    pageId = page.id
    await payload.update({
      collection: 'pages',
      id: pageId,
      locale: 'en',
      data: {
        title: 'Home',
      },
    })
    // SEO tab metadata per locale (proves I18N-02 end to end)
    await payload.update({
      collection: 'pages',
      id: pageId,
      locale: 'es',
      data: {
        meta: {
          title: 'Juan Carlos Angulo — Inicio',
          description: 'Ingeniero de software y experto SEO.',
        },
      },
    })
    await payload.update({
      collection: 'pages',
      id: pageId,
      locale: 'en',
      data: {
        meta: {
          title: 'Juan Carlos Angulo — Home',
          description: 'Software engineer and SEO expert.',
        },
      },
    })
    console.log('Page (home): created', pageId)
  }
  createdIds.page = pageId

  // 4. Post
  const existingPost = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'test-post' } },
    limit: 1,
  })
  let postId: string | number
  if (existingPost.docs.length > 0) {
    postId = existingPost.docs[0].id
    console.log('Post: already exists, skipping')
  } else {
    const post = await payload.create({
      collection: 'posts',
      locale: 'es',
      data: {
        title: 'Post de prueba Fase 2',
        slug: 'test-post',
        excerpt: 'Excerpt de prueba.',
        content: lexicalParagraph('Contenido de prueba en español.'),
        author: authorId,
        categories: [categoryId],
        publishedAt: new Date().toISOString(),
        _status: 'published',
        meta: {
          title: 'Post de prueba | Juan Carlos Angulo',
          description: 'Excerpt de prueba.',
        },
      },
    })
    postId = post.id
    await payload.update({
      collection: 'posts',
      id: postId,
      locale: 'en',
      data: {
        title: 'Phase 2 Test Post',
        excerpt: 'Test excerpt.',
        content: lexicalParagraph('Test content in English.'),
        meta: {
          title: 'Test Post | Juan Carlos Angulo',
          description: 'Test excerpt.',
        },
      },
    })
    console.log('Post: created', postId)
  }
  createdIds.post = postId

  // 5. CaseStudy
  const existingCaseStudy = await payload.find({
    collection: 'case-studies',
    where: { slug: { equals: 'test-case-study' } },
    limit: 1,
  })
  let caseStudyId: string | number
  if (existingCaseStudy.docs.length > 0) {
    caseStudyId = existingCaseStudy.docs[0].id
    console.log('CaseStudy: already exists, skipping')
  } else {
    const caseStudy = await payload.create({
      collection: 'case-studies',
      locale: 'es',
      data: {
        title: 'Caso de éxito de prueba',
        slug: 'test-case-study',
        _status: 'published',
        heroMetric: '+120%',
        heroSubtitle: 'Resultados de prueba Fase 2',
        kpis: [{ label: 'Crecimiento', value: '120%' }],
        clientContext: lexicalParagraph('Contexto de cliente de prueba.'),
        challenge: [{ text: 'Reto de prueba en español.' }],
        solution: [{ title: 'Solución de prueba', description: 'Descripción de solución de prueba.' }],
        results: {
          periodBefore: 'Q1',
          periodAfter: 'Q2',
          metrics: [{ label: 'Tráfico', before: '10', after: '22' }],
        },
        conclusion: lexicalParagraph('Conclusión de prueba en español.'),
      },
    })
    caseStudyId = caseStudy.id
    await payload.update({
      collection: 'case-studies',
      id: caseStudyId,
      locale: 'en',
      data: {
        title: 'Test Case Study',
        heroSubtitle: 'Phase 2 test results',
        kpis: [{ label: 'Growth', value: '120%' }],
        clientContext: lexicalParagraph('Test client context.'),
        challenge: [{ text: 'Test challenge in English.' }],
        solution: [{ title: 'Test solution', description: 'Test solution description.' }],
        results: {
          metrics: [{ label: 'Traffic', before: '10', after: '22' }],
        },
        conclusion: lexicalParagraph('Test conclusion in English.'),
      },
    })
    console.log('CaseStudy: created', caseStudyId)
  }
  createdIds.caseStudy = caseStudyId

  // 6. Redirect (not locale-scoped)
  const existingRedirect = await payload.find({
    collection: 'redirects',
    where: { from: { equals: '/legacy-test-url' } },
    limit: 1,
  })
  let redirectId: string | number
  if (existingRedirect.docs.length > 0) {
    redirectId = existingRedirect.docs[0].id
    console.log('Redirect: already exists, skipping')
  } else {
    const redirect = await payload.create({
      collection: 'redirects',
      data: {
        from: '/legacy-test-url',
        to: { type: 'custom', url: '/' },
      },
    })
    redirectId = redirect.id
    console.log('Redirect: created', redirectId)
  }
  createdIds.redirect = redirectId

  // 7. Llms global (not locale-scoped)
  const existingLlms = await payload.findGlobal({ slug: 'llms' })
  if (existingLlms?.llmsTxt && existingLlms?.llmsFull) {
    console.log('Llms global: already exists, skipping')
  } else {
    await payload.updateGlobal({
      slug: 'llms',
      data: {
        llmsTxt:
          '# Juan Carlos Angulo\n\nPlaceholder llms.txt — Phase 2 plumbing test. Real content arrives Phase 4/5.',
        llmsFull: 'Placeholder llms-full.txt content for Phase 2 plumbing validation.',
      },
    })
    console.log('Llms global: created')
  }

  console.log('\nSeed complete. Doc IDs:', createdIds)
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
