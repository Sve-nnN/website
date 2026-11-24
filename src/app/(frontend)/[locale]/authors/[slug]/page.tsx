import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { CtaSection } from '@/components/mui/CtaSection'
import { AuthorProfileView } from '@/components/pages/authors/AuthorProfileView'
import {
  buildAuthorPersonJsonLd,
  pickAuthorCases,
  toAuthorProfileProps,
  type AuthorEventDocLike,
} from '@/lib/authors-data'
import { getCachedSpeakingEvents } from '@/lib/about-data'
import { buildAuthorsTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import {
  getCachedAuthorBySlug,
  getCachedAuthorPosts,
  getCachedCaseStudiesIndex,
} from '@/lib/cache'
import { buildAlternates } from '@/lib/canonical'
import { getCtaData } from '@/lib/cta-data'
import { buildOpenGraph } from '@/lib/og-image'
import { pageTitle } from '@/lib/page-title'

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

export function generateStaticParams(): Array<{ locale: string; slug: string }> {
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getCachedAuthorBySlug(slug, locale as 'es' | 'en')

  if (!doc) return {}

  const title = doc.meta?.title ?? doc.name
  const description = doc.meta?.description ?? doc.jobTitle ?? ''

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en/authors/${slug}` : `/authors/${slug}`,
      locale: locale as 'es' | 'en',
      slug: doc.slug ?? slug,
      metaImage: doc.meta?.image,
    }),
    alternates: buildAlternates(locale as 'es' | 'en', `/authors/${slug}`, `/en/authors/${slug}`),
  }
}

export default async function AuthorProfilePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const loc = locale as 'es' | 'en'
  const doc = await getCachedAuthorBySlug(slug, loc)

  if (!doc) {
    notFound()
  }

  // SEO-03: el perfil enlaza TODOS los posts y TODOS los casos del autor en el
  // HTML del servidor. Antes eran `limit: 50` (8 de los 58 posts sin enlace desde
  // aqui). Las lecturas pasan por la cache con `overrideAccess: false` (SEO-40:
  // sin borradores) y lanzan si fallan, para que ISR no fije una pagina sin posts.
  // Las ponencias si se protegen: faltarian solo ellas y no afectan el enlazado.
  const [posts, cases, events] = await Promise.all([
    getCachedAuthorPosts(doc.id, loc),
    getCachedCaseStudiesIndex(loc),
    getCachedSpeakingEvents(loc).catch((err: unknown) => {
      console.error('[authors]', err)
      return [] as AuthorEventDocLike[]
    }),
  ])

  const profile = toAuthorProfileProps(doc, events as AuthorEventDocLike[], loc, {
    posts,
    cases: pickAuthorCases(cases, doc.id),
  })
  if (!profile) {
    notFound()
  }

  // El nodo Person sale de authors-data.ts: el dueno del sitio, con el @id
  // canonico de src/lib/person.ts, y cualquier otro autor con su propio nodo.
  const personData = await buildAuthorPersonJsonLd(doc, loc)

  // POLISH: el BreadcrumbList y la ruta visible salen del mismo arreglo, por el
  // mismo helper que usa el resto de las secciones.
  const trail = buildAuthorsTrail(loc, {
    slug: doc.slug ?? slug,
    title: doc.name,
  })
  const ctaData = await getCtaData(loc)

  return (
    <>
      <AuthorProfileView
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        profile={profile}
      />
      {ctaData && (
        <div lang={ctaData.isFallback && locale === 'en' ? 'es' : undefined}>
          <CtaSection
            title={ctaData.title}
            lead={ctaData.lead}
            email={ctaData.email}
            name={ctaData.name}
            avatarUrl={ctaData.avatarUrl}
          />
        </div>
      )}

      <JsonLd data={personData} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </>
  )
}
