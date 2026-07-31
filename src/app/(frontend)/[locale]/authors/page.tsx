import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { Badge } from '@/components/ui/badge'
import { buildOpenGraph } from '@/lib/og-image'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

async function getAuthors(locale: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'authors',
    locale: locale as 'es' | 'en',
    limit: 50,
  })
  return docs
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const title = locale === 'es' ? 'Autores' : 'Authors'
  return {
    title,
    openGraph: buildOpenGraph({
      title,
      url: locale === 'en' ? '/en/authors' : '/authors',
      locale: locale as 'es' | 'en',
      slug: 'authors',
    }),
  }
}

export default async function AuthorsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const authors = await getAuthors(locale)

  return (
    <main>
      <Container className="py-16">
        <h1 className="font-display text-display">{locale === 'es' ? 'Autores' : 'Authors'}</h1>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map((author) => {
            const avatar = typeof author.avatar === 'object' ? author.avatar : null
            const firstCredential = author.credentials?.[0]

            return (
              <Link
                key={author.id}
                href={`/authors/${author.slug}`}
                className="rounded-lg border border-border bg-card p-6 text-center hover:shadow-md transition-shadow"
              >
                {avatar?.url && (
                  <Image
                    src={avatar.url}
                    alt={avatar.alt ?? author.name}
                    width={80}
                    height={80}
                    className="mx-auto rounded-full object-cover"
                  />
                )}
                <p className="mt-4 font-heading text-heading">{author.name}</p>
                {author.jobTitle && <p className="text-body text-muted-foreground">{author.jobTitle}</p>}
                {firstCredential && (
                  <Badge variant="secondary" className="mt-3">
                    {firstCredential.label}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>
      </Container>
    </main>
  )
}
