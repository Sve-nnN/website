import { getPayload } from 'payload'

import config from '@payload-config'
import { Link } from '@/i18n/navigation'
import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'
import { getCachedPostCategoryMap } from '@/lib/cache'
import { blogIndexPath, blogPostPath } from '@/lib/blog-paths'

// Self-hosted deploy (Dokploy/Nixpacks) builds in a container with no
// network access to shared-postgres -- force dynamic (request-time)
// rendering here so `next build` never tries to query the DB during
// static generation. See infra/apps/LESSONS-LEARNED.md.
export const dynamic = 'force-dynamic'

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

// Posts live at /blog/<category>/<slug>, but the search index only stores the
// post slug — `postCategories` is the cached postSlug -> categorySlug map the
// page resolves them through. A post missing from the map (indexed but since
// unpublished) falls back to the blog index rather than a dead URL.
function hrefFor(relationTo: string, slug: string, postCategories: Record<string, string>) {
  if (relationTo === 'posts') {
    const categorySlug = postCategories[slug]
    return categorySlug ? blogPostPath(categorySlug, slug) : blogIndexPath()
  }
  if (relationTo === 'case-studies') return `/case-studies/${slug}`
  if (relationTo === 'authors') return `/authors/${slug}`
  return '#'
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = copy[locale as 'es' | 'en'] ?? copy.es
  const title = t.title
  return {
    title: pageTitle(title),
    // SEO-46: las paginas de resultados de busqueda interna son el caso de
    // manual de lo que Google pide no indexar. `/search` y `/en/search` se
    // servian 200 sin `noindex` y con 169 enlaces internos entre las dos.
    //
    // Google ya lo habia resuelto por su cuenta: la inspeccion de URL las da
    // como "Rastreada, actualmente sin indexar" desde el 18 de junio de 2026.
    // O sea que el costo real hoy es rastreo gastado, no basura en el indice.
    // Se declara igual, porque depender de que el buscador adivine bien no es
    // lo mismo que decirselo.
    //
    // `follow: true` a proposito: los enlaces de la pagina de resultados
    // siguen sirviendo para descubrimiento, lo que no queremos es la pagina en
    // si. Es la combinacion que recomienda Google para resultados internos.
    robots: { index: false, follow: true },
    openGraph: buildOpenGraph({
      title,
      url: locale === 'en' ? '/en/search' : '/search',
      locale: locale as 'es' | 'en',
      slug: 'search',
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/search', '/en/search'),
  }
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
  let postCategories: Record<string, string> = {}

  if (query) {
    try {
      ;[results, postCategories] = await Promise.all([
        runSearch(query, locale),
        getCachedPostCategoryMap(locale as 'es' | 'en'),
      ])
    } catch (err) {
      console.error('Search backend failure:', err)
      searchFailed = true
    }
  }

  return (
    <main>
      <PageHero variant="index" title={t.title} />

      <Container className="py-12 md:py-16">
        <form className="flex gap-2 max-w-xl" action="" method="get">
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
            <p className="font-heading text-heading">{t.noResultsHeading(query)}</p>
            <p className="mt-2 text-body text-muted-foreground">{t.noResultsBody}</p>
          </div>
        )}

        {!searchFailed && results.length > 0 && (
          <div className="mt-12 space-y-4">
            {results.map((result) => (
              <Link
                key={result.id}
                href={hrefFor(result.doc.relationTo, result.slug ?? '', postCategories)}
                className="block rounded-lg border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{t.typeLabels[result.doc.relationTo]}</Badge>
                  <p className="font-heading text-heading">{result.meta?.title ?? result.title}</p>
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
