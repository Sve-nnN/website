import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { BlogIndexView } from '@/components/pages/blog/BlogIndexView'
import { JsonLd } from '@/components/JsonLd'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'
import { buildBlogTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import {
  getCachedBlogPostList,
  getCachedBlogPromo,
  getCachedCategories,
  getCachedPageBySlug,
} from '@/lib/cache'
import { toBlogIndexProps, toClosingProps } from '@/lib/blog-data'
import { resolveBlogPromo } from '@/lib/blog-promo'

// Rendimiento: el indice respondia `cache-control: private, no-cache, no-store`
// (TTFB de 4 a 10 s en la auditoria movil de 2026-11-24) por dos causas
// encadenadas. `force-dynamic` estaba por una razon real: el build de Dokploy
// corre en un contenedor sin red hacia shared-postgres, asi que cualquier
// prerender en `next build` falla. Y la pagina leia `searchParams`
// (`?newsletter=`) para el aviso de los enlaces del correo, lectura que
// vuelve dinamica toda la ruta aunque `revalidate` este declarado.
//
// Ahora igual que el resto de rutas de contenido: ISR con `generateStaticParams`
// vacio (el build no renderiza ni toca la base) y `dynamicParams` por defecto
// (cada locale se renderiza en la primera visita y queda en la cache
// incremental). El aviso de `?newsletter=` se lee en el cliente
// (BlogNewsletterWithNotice, useSearchParams dentro de Suspense), asi que el
// HTML no depende del parametro. NO volver a leer `searchParams` aqui: con
// `revalidate` eso devuelve 500 (Pitfall 4 de 57-RESEARCH.md). La frescura sigue
// en `revalidatePath` de los hooks de contenido (src/lib/cache-tags.ts).
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string }> {
  return []
}

async function getBlogPage(locale: string) {
  // 43-02: delegates to the shared 43-01 cache fetcher — no explicit depth,
  // preserving the original query's (no-depth) behavior.
  return getCachedPageBySlug('blog', locale as 'es' | 'en')
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const doc = await getBlogPage(locale)
  const meta = doc?.meta

  const title = meta?.title ?? doc?.title ?? 'Blog'
  const description = meta?.description ?? ''
  const url = locale === 'en' ? '/en/blog' : '/blog'

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url,
      locale: locale as 'es' | 'en',
      slug: 'blog',
      metaImage: meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', '/blog', '/en/blog'),
  }
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  // Los componentes de servidor que traducen leen el idioma de aqui (ISR).
  setRequestLocale(locale)
  const loc = locale as 'es' | 'en'
  const doc = await getBlogPage(locale)

  if (!doc) {
    notFound()
  }

  // Las lecturas lanzan dentro de la cache y aqui se dejan propagar (500): un
  // listado vacio por un fallo transitorio no debe servirse como indice vacio.
  const [categories, posts, promo] = await Promise.all([
    getCachedCategories(loc),
    getCachedBlogPostList(loc),
    getCachedBlogPromo(loc),
  ])
  const props = toBlogIndexProps(doc, categories, posts, loc)

  // SEO-09: el indice del blog emite sus migas con URLs correctas por idioma.
  const trail = buildBlogTrail(loc)

  // Un solo cierre por pagina (pregunta abierta 1 de RESEARCH), sin categoria.
  const closing = toClosingProps(resolveBlogPromo(promo).closing, loc)

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
      <BlogIndexView
        {...props}
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        closing={closing}
      />
    </>
  )
}
