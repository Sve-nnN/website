import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'
import { JsonLd } from '@/components/JsonLd'

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

  const author = typeof doc.author === 'object' ? doc.author : undefined

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
      <h1>{doc.title}</h1>
      {doc.excerpt ? <p>{doc.excerpt}</p> : null}
      {author?.name ? <p>{author.name}</p> : null}
      <JsonLd data={articleData} />
    </main>
  )
}
