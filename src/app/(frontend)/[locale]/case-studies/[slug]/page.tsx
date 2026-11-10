import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/JsonLd'
import { CtaSection } from '@/components/mui/CtaSection'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'
import { CaseDetailView } from '@/components/pages/cases/CaseDetailView'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'
import { buildCaseStudiesTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { getCachedCaseStudiesIndex, getCachedCaseStudyBySlug } from '@/lib/cache'
import {
  buildCaseStudyJsonLd,
  pickRelatedCases,
  toCaseDetailProps,
  toCaseIndexProps,
  type CaseDocLike,
} from '@/lib/case-study-data'
import { getCtaData } from '@/lib/cta-data'

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

// Lectura por la capa cacheada (overrideAccess false y select dentro). Si la
// lectura falla lanza: unstable_cache no guarda la excepcion y la ruta no
// responde un 404 falso por un fallo transitorio.
function getCaseStudy(locale: string, slug: string) {
  return getCachedCaseStudyBySlug(slug, locale as 'es' | 'en')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getCaseStudy(locale, slug)

  if (!doc) {
    return {}
  }

  const meta = doc.meta
  const title = meta?.title ?? doc.title
  const description = meta?.description ?? doc.heroSubtitle ?? ''

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en/case-studies/${slug}` : `/case-studies/${slug}`,
      locale: locale as 'es' | 'en',
      slug,
      metaImage: meta?.image,
      heroImage: doc.heroImage,
      // SEO-47: un caso de exito se comparte como pieza firmada, no como
      // pagina institucional.
      //
      // Sin `publishedTime` a proposito: la coleccion no tiene campo de
      // publicacion, y el JSON-LD de esta misma pagina ya decidio no hacer
      // pasar `createdAt` por `datePublished` (ver el comentario en el bloque
      // de structured data). Emitir aca una fecha que alla se descarto seria
      // contradecirnos en la misma respuesta.
      article: {
        modifiedTime: doc.updatedAt ?? undefined,
        authors: ['Juan Carlos Angulo'],
      },
    }),
    alternates: buildAlternates(
      locale as 'es' | 'en',
      `/case-studies/${slug}`,
      `/en/case-studies/${slug}`,
    ),
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const loc = locale as 'es' | 'en'
  const doc = await getCaseStudy(locale, slug)

  if (!doc) {
    notFound()
  }

  const detail = toCaseDetailProps(doc, loc)
  if (!detail) {
    notFound()
  }

  const trail = buildCaseStudiesTrail(loc, {
    slug: doc.slug ?? slug,
    title: doc.title,
  })

  // "Mas casos de exito" sale del indice cacheado. Si esa lectura falla, el
  // detalle se sirve igual sin esa seccion (la lectura lanza dentro de la
  // cache, asi que el fallo no se fija).
  let indexDocs: ReadonlyArray<CaseDocLike> = []
  try {
    indexDocs = await getCachedCaseStudiesIndex(loc)
  } catch (err) {
    console.error('[case-studies]', err)
  }
  const related = pickRelatedCases(toCaseIndexProps(indexDocs, loc), detail.slug)

  const ctaData = await getCtaData(loc)

  return (
    <>
      <CaseDetailView
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        caseStudy={detail}
        clientContent={detail.clientContext ? <MuiRichText data={detail.clientContext} /> : null}
        conclusionContent={detail.conclusion ? <MuiRichText data={detail.conclusion} /> : null}
        related={related}
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
      <JsonLd data={buildCaseStudyJsonLd(doc, loc, slug)} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </>
  )
}
