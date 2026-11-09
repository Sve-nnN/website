import { getPayload } from 'payload'
import { getTranslations } from 'next-intl/server'

import config from '@payload-config'
import { SearchView, type SearchResult } from '@/components/pages/SearchView'
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
  const t = await getTranslations({ locale, namespace: 'search' })
  const title = t('title')
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

  // T-05-11-02: bound query length before it reaches a DB query.
  const query = q?.slice(0, MAX_QUERY_LENGTH)

  let docs: Awaited<ReturnType<typeof runSearch>> = []
  let searchFailed = false
  let postCategories: Record<string, string> = {}

  if (query) {
    try {
      ;[docs, postCategories] = await Promise.all([
        runSearch(query, locale),
        getCachedPostCategoryMap(locale as 'es' | 'en'),
      ])
    } catch (err) {
      console.error('Search backend failure:', err)
      searchFailed = true
    }
  }

  const results: SearchResult[] | null =
    query && !searchFailed
      ? docs.map((result) => ({
          id: result.id,
          type: result.doc.relationTo,
          title: result.meta?.title ?? result.title ?? '',
          description: result.meta?.description,
          href: hrefFor(result.doc.relationTo, result.slug ?? '', postCategories),
        }))
      : null

  return <SearchView query={query ?? null} results={results} failed={searchFailed} />
}

async function runSearch(query: string, locale: string) {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'search',
    // La coleccion search tiene lectura abierta (plugin-search); con
    // overrideAccess false ese acceso se aplica y un borrador nunca sale.
    overrideAccess: false,
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
