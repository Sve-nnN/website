import Link from 'next/link'
import { getPayload } from 'payload'

import config from '@payload-config'
import { Container } from '@/components/Container'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MAX_QUERY_LENGTH = 200

const copy = {
  es: {
    title: 'Buscar',
    placeholder: 'Buscar artículos, casos de éxito, autores...',
    submit: 'Buscar',
    noResultsHeading: (q: string) => `Sin resultados para "${q}"`,
    noResultsBody: 'Prueba con otro término, o explora artículos y casos de estudio directamente.',
    errorHeading: 'La búsqueda no está disponible por el momento. Intenta de nuevo en unos minutos.',
    typeLabels: { posts: 'Artículo', 'case-studies': 'Caso de éxito', authors: 'Autor' },
  },
  en: {
    title: 'Search',
    placeholder: 'Search posts, case studies, authors...',
    submit: 'Search',
    noResultsHeading: (q: string) => `No results for "${q}"`,
    noResultsBody: 'Try a different term, or browse posts and case studies directly.',
    errorHeading: 'Search is temporarily unavailable. Please try again in a moment.',
    typeLabels: { posts: 'Post', 'case-studies': 'Case Study', authors: 'Author' },
  },
}

function hrefFor(relationTo: string, slug: string) {
  if (relationTo === 'posts') return `/blog/${slug}`
  if (relationTo === 'case-studies') return `/case-studies/${slug}`
  if (relationTo === 'authors') return `/authors/${slug}`
  return '#'
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = copy[locale as 'es' | 'en'] ?? copy.es
  return { title: t.title }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { locale } = await params
  const { q } = await searchParams
  const t = copy[locale as 'es' | 'en'] ?? copy.es

  // T-05-11-02: bound query length before it reaches a DB query.
  const query = q?.slice(0, MAX_QUERY_LENGTH)

  let results: Awaited<ReturnType<typeof runSearch>> = []
  let searchFailed = false

  if (query) {
    try {
      results = await runSearch(query, locale)
    } catch (err) {
      console.error('Search backend failure:', err)
      searchFailed = true
    }
  }

  return (
    <main>
      <Container className="py-16">
        <h1 className="font-display text-display">{t.title}</h1>

        <form className="mt-8 flex gap-2 max-w-xl" action="" method="get">
          <Input type="search" name="q" defaultValue={query} placeholder={t.placeholder} />
          <Button type="submit">{t.submit}</Button>
        </form>

        {searchFailed && (
          <div className="mt-12 text-center py-16">
            <p className="text-body text-destructive">{t.errorHeading}</p>
          </div>
        )}

        {!searchFailed && query && results.length === 0 && (
          <div className="mt-12 text-center py-16">
            <p className="font-display text-heading">{t.noResultsHeading(query)}</p>
            <p className="mt-2 text-body text-muted-foreground">{t.noResultsBody}</p>
          </div>
        )}

        {!searchFailed && results.length > 0 && (
          <div className="mt-12 space-y-4">
            {results.map((result) => (
              <Link
                key={result.id}
                href={hrefFor(result.doc.relationTo, result.slug ?? '')}
                className="block rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t.typeLabels[result.doc.relationTo]}</Badge>
                  <p className="font-display text-heading">{result.meta?.title ?? result.title}</p>
                </div>
                {result.meta?.description && (
                  <p className="mt-1 text-body text-muted-foreground">{result.meta.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}

async function runSearch(query: string, locale: string) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'search',
    locale: locale as 'es' | 'en',
    pagination: false,
    where: {
      or: [
        { title: { like: query } },
        { 'meta.title': { like: query } },
        { 'meta.description': { like: query } },
        { slug: { like: query } },
      ],
    },
  })

  return docs
}
