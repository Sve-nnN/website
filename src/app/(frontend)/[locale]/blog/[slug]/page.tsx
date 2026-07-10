import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import type { Author, Category, Post } from '@/payload-types'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { Badge } from '@/components/ui/badge'
import { AuthorByline } from '@/components/AuthorByline'
import { AuthorCard } from '@/components/AuthorCard'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { RelatedPostsComponent } from '@/blocks/RelatedPosts/Component'
import { TableOfContentsBlockComponent } from '@/blocks/TableOfContentsBlock/Component'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'

const WORDS_PER_MINUTE = 200

async function getPost(locale: string, slug: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug } },
    locale: locale as 'es' | 'en',
    depth: 1,
    limit: 1,
  })
  return docs[0]
}

// Rough word-count-over-lexical-JSON estimate — no new dependency needed for
// a plain-text extraction; recursively sums `text` node content.
function extractPlainText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[] }
  let text = n.text ?? ''
  if (Array.isArray(n.children)) {
    text += n.children.map(extractPlainText).join(' ')
  }
  return text
}

function estimateReadingTime(content: Post['content']): number {
  const plainText = extractPlainText(content?.root)
  const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getPost(locale, slug)

  if (!doc) {
    return {}
  }

  const meta = doc.meta

  return {
    title: meta?.title ?? doc.title,
    description: meta?.description ?? doc.excerpt ?? '',
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getPost(locale, slug)

  if (!doc) {
    notFound()
  }

  const author = typeof doc.author === 'object' ? (doc.author as Author) : undefined
  const categories = (doc.categories ?? []).filter(
    (c): c is Category => typeof c === 'object',
  )

  const heroImage = typeof doc.heroImage === 'object' ? doc.heroImage : null
  const heroImageUrl = heroImage?.url ?? getFallbackHeroImage(doc.slug ?? String(doc.id))

  const readingTimeMinutes = estimateReadingTime(doc.content)

  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    description: doc.excerpt,
    datePublished: doc.publishedAt,
    author: { '@type': 'Person', name: author?.name },
  }

  return (
    <main>
      <section className="relative">
        <div className="relative aspect-[21/9] w-full">
          <Image src={heroImageUrl} alt={heroImage?.alt ?? doc.title} fill className="object-cover" priority />
        </div>
        <Container className="py-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map((cat) => (
              <Badge key={cat.id} variant="secondary">
                {cat.title}
              </Badge>
            ))}
          </div>
          <h1 className="font-display text-display tracking-tight">{doc.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            {author && <AuthorByline author={author} />}
            <div className="text-label text-muted-foreground">
              {doc.publishedAt && (
                <time dateTime={doc.publishedAt}>
                  {new Date(doc.publishedAt).toLocaleDateString(locale)}
                </time>
              )}
              {' · '}
              {readingTimeMinutes} {locale === 'es' ? 'min de lectura' : 'min read'}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-8 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_16rem] gap-12">
        <article>
          <RichTextRenderer data={doc.content} />
        </article>
        <TableOfContentsBlockComponent
          blockType="tableOfContentsBlock"
          title={locale === 'es' ? 'Tabla de contenidos' : 'Table of contents'}
          position="right"
          sticky
          minHeadingLevel="2"
        />
      </Container>

      {author && (
        <Container className="py-8">
          <AuthorCard author={author} />
        </Container>
      )}

      <RelatedPostsComponent
        blockType="relatedPosts"
        title={locale === 'es' ? 'Artículos relacionados' : 'Related Posts'}
        autoSelect
        limit={3}
        currentPostId={doc.id}
        currentCategoryIds={categories.map((c) => c.id)}
      />

      <JsonLd data={articleData} />
    </main>
  )
}
