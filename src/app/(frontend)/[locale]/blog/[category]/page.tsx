import { notFound, permanentRedirect } from 'next/navigation'

import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
import { PostCard } from '@/components/PostCard'
import { ScrollReveal } from '@/components/ScrollReveal'
import { BlogCategoryTabs } from '@/components/BlogCategoryTabs'
import { CategoryBridge } from '@/components/CategoryBridge'
import { BlogClosing } from '@/components/BlogClosing'
import { JsonLd } from '@/components/JsonLd'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { buildBlogTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import {
  getCachedArchive,
  getCachedCategories,
  getCachedPostCategoryMap,
  type CategoryData,
  type PostCardData,
} from '@/lib/cache'
import { blogCategoryPath, blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'

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

// Category listings are finite (66 published posts across 5 categories today),
// so they are not paginated — one page per category is the whole category.
const CATEGORY_POST_LIMIT = 100

const COPY = {
  es: {
    emptyHeading: 'Todavía no hay artículos en esta categoría',
    emptyBody: 'Explora el resto del blog mientras tanto.',
    listingHeading: 'Artículos de esta categoría',
    count: (n: number) => (n === 1 ? '1 artículo' : `${n} artículos`),
  },
  en: {
    emptyHeading: 'No posts in this category yet',
    emptyBody: 'Browse the rest of the blog in the meantime.',
    listingHeading: 'Posts in this category',
    count: (n: number) => (n === 1 ? '1 post' : `${n} posts`),
  },
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
    title,
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

  const result = await getCachedArchive({
    relationTo: 'posts',
    limit: CATEGORY_POST_LIMIT,
    locale,
    categoryId: category.id,
  })

  const docs = result.docs as PostCardData[]
  const t = COPY[locale] ?? COPY.es
  const trail = buildBlogTrail(locale, { slug: categorySlug, title: category.title })

  return (
    <main>
      <PageHero
        variant="index"
        trail={trail}
        title={category.title}
        subtitle={category.description}
        // El conteo es la orientación más barata que puede dar una categoría:
        // dice si acá hay dos artículos o veinte antes de que el visitante
        // scrollee para averiguarlo.
        meta={[t.count(result.totalDocs)]}
      />

      <Container className="py-12 md:py-16">
        <BlogCategoryTabs locale={locale} categories={categories} activeSlug={categorySlug} />

        {docs.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-heading text-heading">{t.emptyHeading}</p>
            <p className="mt-2 text-body text-muted-foreground">{t.emptyBody}</p>
          </div>
        ) : (
          <>
            {/* SEO-10.2: cada tarjeta lleva su titulo en h3 y arriba solo
                estaba la h1 de la categoria, o sea que la pagina saltaba un
                nivel. La grilla ES una seccion, lo que le faltaba era el
                encabezado: va oculto porque el titulo de la pagina ya dice de
                que categoria se trata y repetirlo en pantalla seria ruido. */}
            <h2 className="sr-only">{t.listingHeading}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((doc, i) => {
              // Same above-the-fold rule as ArchiveBlock: the first row must
              // not be SSR-hidden behind ScrollReveal's opacity:0 nor
              // lazy-load its thumbnail (LCP).
              const isAboveFold = i < 3
              return (
                <ScrollReveal key={doc.id} priority={isAboveFold}>
                  <PostCard
                    post={doc}
                    priority={isAboveFold}
                    href={blogPostPath(resolvePrimaryCategorySlug(doc.categories), doc.slug ?? '')}
                  />
                </ScrollReveal>
                )
              })}
            </div>
          </>
        )}
      </Container>

      <CategoryBridge locale={locale} categories={categories} currentSlug={categorySlug} />

      <BlogClosing locale={locale} categoryId={category.id} />

      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
