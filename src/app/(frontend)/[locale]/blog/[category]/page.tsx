import { notFound, permanentRedirect } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { CategoryPageView } from '@/components/pages/blog/CategoryPageView'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'
import { buildBlogTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import {
  getCachedBlogPostList,
  getCachedBlogPromo,
  getCachedCategories,
  getCachedPostCategoryMap,
  type CategoryData,
} from '@/lib/cache'
import { toCategoryProps, toClosingProps } from '@/lib/blog-data'
import { resolveBlogPromo } from '@/lib/blog-promo'
import { blogCategoryPath, blogPostPath } from '@/lib/blog-paths'

// SEO-06: estas rutas servian `cache-control: no-store` y re-ejecutaban el SSR
// completo en cada request. Venia de `force-dynamic`, que estaba por una razon
// real: el build de Dokploy corre en un contenedor sin red hacia
// shared-postgres, asi que cualquier prerender en `next build` falla.
//
// ISR resuelve las dos cosas: `generateStaticParams` devuelve una lista VACIA,
// o sea que el build no renderiza ni una ruta y nunca toca la base;
// `dynamicParams` (true por defecto) deja que cada URL se renderice en la
// primera visita y quede en la cache incremental, y de ahi salen las
// siguientes. Verificado en el prerender-manifest: cero rutas prerenderizadas.
//
// La frescura no depende del TTL: los hooks de contenido llaman
// `revalidatePath` (src/lib/cache-tags.ts), asi que publicar en el admin
// actualiza la pagina sin esperar los 60 s. El TTL es la red de seguridad.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string; category: string }> {
  return []
}

async function findCategory(locale: 'es' | 'en', slug: string): Promise<CategoryData | undefined> {
  const categories = await getCachedCategories(locale)
  return categories.find((c) => c.slug === slug)
}

/**
 * Before the URL restructure, posts lived at `/blog/<slug>`, which now
 * collides with this route's `<category>` segment. Rather than lose those
 * URLs (66 published posts, already indexed), a segment that is not a real
 * category but IS a known post slug resolves to the post's new home so the
 * caller can 308 there.
 */
async function legacyPostRedirectPath(
  locale: 'es' | 'en',
  segment: string,
): Promise<string | null> {
  const postCategoryMap = await getCachedPostCategoryMap(locale)
  const categorySlug = postCategoryMap[segment]

  if (!categorySlug) return null

  const path = blogPostPath(categorySlug, segment)
  return locale === 'en' ? `/en${path}` : path
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale, category: categorySlug } = await params
  const category = await findCategory(locale as 'es' | 'en', categorySlug)

  if (!category) return {}

  const path = blogCategoryPath(categorySlug)
  const title = category.title
  const description = category.description ?? ''

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en${path}` : path,
      locale: locale as 'es' | 'en',
      slug: categorySlug,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', path, `/en${path}`),
  }
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale: rawLocale, category: categorySlug } = await params
  const locale = rawLocale as 'es' | 'en'

  const [category, categories] = await Promise.all([
    findCategory(locale, categorySlug),
    getCachedCategories(locale),
  ])

  if (!category) {
    const legacyPath = await legacyPostRedirectPath(locale, categorySlug)
    if (legacyPath) permanentRedirect(legacyPath)
    notFound()
  }

  // La lectura lanza dentro de la cache y aqui se deja propagar (500): una lista
  // vacia por un fallo transitorio se serviria como categoria vacia con 200 y
  // la fijaria la cache de ruta durante el TTL.
  const posts = await getCachedBlogPostList(locale)
  const props = toCategoryProps(category, posts, categories, locale)
  const trail = buildBlogTrail(locale, { slug: categorySlug, title: category.title })

  // Un solo cierre por pagina, con el texto de la categoria (blog-promo).
  const promo = await getCachedBlogPromo(locale)
  const closing = toClosingProps(resolveBlogPromo(promo, category.id).closing)

  return (
    <>
      <CategoryPageView
        {...props}
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        closing={closing}
      />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </>
  )
}
