import { setRequestLocale } from 'next-intl/server'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'

import type { Category } from '@/payload-types'
import { JsonLd } from '@/components/JsonLd'
import { PostView } from '@/components/pages/blog/PostView'
import { buildHeadingIdMap, type LexicalRootLike } from '@/components/mui/rich-text/lexical-toc'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'
import { buildBlogTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { SITE_URL } from '@/lib/sitemap-data'
import { getCachedBlogPostList, getCachedBlogPromo, getCachedPost } from '@/lib/cache'
import {
  buildArticleJsonLd,
  categoryItems,
  pickPrevNext,
  pickRelated,
  toClosingProps,
  toInlineOffer,
  toPostViewProps,
  toRailOffer,
} from '@/lib/blog-data'
import { resolveBlogPromo } from '@/lib/blog-promo'
import { postHasAffiliateInline, postHasAmazonAffiliateInline } from '@/lib/post-affiliate-scan'
import { splitContentForOffer } from '@/lib/lexical-split'
import { blogPostPath, localizeBlogPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'
import { personRef, SITE_PERSON_SLUG } from '@/lib/person'
import { websiteRef } from '@/lib/site-schema'
import { EN_TRANSLATION_INCOMPLETE, isEnTranslationIncomplete } from '@/lib/translation-gaps'

// SEO-06: estas rutas servian `cache-control: no-store` y re-ejecutaban el SSR
// completo en cada request. El build de Dokploy corre en un contenedor sin red
// hacia shared-postgres, asi que ningun prerender puede tocar la base en
// `next build`: `generateStaticParams` devuelve una lista VACIA y
// `dynamicParams` (true por defecto) deja que cada URL se renderice en la
// primera visita y quede en la cache incremental.
//
// Historia (Phase 49-03): la pagina leia `searchParams` para el estado
// pending/already/error del bloque de captura de email, y esa lectura en el
// fallback ISR revento con `DynamicServerError` (500 en TODOS los posts). Se
// resolvio con `force-dynamic`, que dejo el post sin cache y con TTFB de 1,6 a
// 2 s (hallazgo F1 de la muestra de auditoria).
//
// Fase 57 (D-04 F1): la pagina ya NO lee `searchParams`. El estado lo lee en el
// cliente `EmailCaptureState` (useSearchParams dentro de Suspense, ver
// src/components/mui/rich-text/blocks.tsx), y el HTML del servidor es el mismo
// con o sin `?subscribed=`. Por eso la ruta vuelve a ISR con el mismo
// `revalidate` que el resto de rutas de contenido. NO volver a leer
// `searchParams` aqui: con `revalidate` eso devuelve 500 en todos los posts
// (Pitfall 4 de 57-RESEARCH.md). La frescura sigue dependiendo de
// `revalidatePath` en los hooks de contenido (src/lib/cache-tags.ts) y los tags
// de `unstable_cache` no cambian.
export const revalidate = 60

export function generateStaticParams(): Array<{ locale: string; category: string; slug: string }> {
  return []
}

function getPost(locale: string, slug: string) {
  return getCachedPost(slug, locale as 'es' | 'en')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { locale, slug } = await params
  const doc = await getPost(locale, slug)

  if (!doc) {
    return {}
  }

  // Metadata always describes the CANONICAL path, never the requested one —
  // a request on a non-primary category segment is about to be redirected
  // anyway (see the guard in the page component below).
  const path = blogPostPath(resolvePrimaryCategorySlug(doc.categories), slug)

  const meta = doc.meta
  const title = meta?.title ?? doc.title
  const description = meta?.description ?? doc.excerpt ?? ''

  return {
    title: pageTitle(title),
    description,
    openGraph: buildOpenGraph({
      title,
      description,
      url: locale === 'en' ? `/en${path}` : path,
      locale: locale as 'es' | 'en',
      slug,
      metaImage: meta?.image,
      heroImage: doc.heroImage,
      // SEO-47: mismos valores que ya emite el JSON-LD de Article mas abajo en
      // esta pagina, para no abrir una segunda fuente de verdad.
      article: {
        publishedTime: doc.publishedAt ?? undefined,
        modifiedTime: doc.updatedAt ?? undefined,
        authors: ['Juan Carlos Angulo'],
        section: resolvePrimaryCategorySlug(doc.categories),
      },
    }),
    alternates: buildAlternates(locale as 'es' | 'en', path, `/en${path}`, {
      omitEn: EN_TRANSLATION_INCOMPLETE.has(slug),
    }),
    // SEO-07: la version inglesa de estos posts tiene menos de la mitad del
    // contenido del español, y en un caso ni siquiera existe (sirve el español
    // por fallback). Indexarlas le muestra a Google paginas delgadas bajo
    // /en que compiten con el original sin aportar nada.
    //
    // `follow` se mantiene: los enlaces internos de la pagina siguen valiendo,
    // lo que no queremos es la pagina en el indice. Sale de la lista sola
    // cuando se completa la traduccion (src/lib/translation-gaps.ts).
    ...(isEnTranslationIncomplete(locale, slug)
      ? { robots: { index: false, follow: true } }
      : {}),
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { locale: rawLocale, category, slug } = await params
  // Los componentes de servidor que traducen leen el idioma de aqui (ISR).
  setRequestLocale(rawLocale)
  const locale = rawLocale as 'es' | 'en'
  const doc = await getPost(locale, slug)

  if (!doc) {
    notFound()
  }

  const primaryCategorySlug = resolvePrimaryCategorySlug(doc.categories)

  // One post, one indexable URL. A post reached through any other category
  // segment (a stale link, a multi-category post, or a hand-typed path)
  // 308s to the canonical one instead of rendering duplicate content.
  if (category !== primaryCategorySlug) {
    permanentRedirect(
      locale === 'en'
        ? `/en${blogPostPath(primaryCategorySlug, slug)}`
        : blogPostPath(primaryCategorySlug, slug),
    )
  }

  const categories = (doc.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )
  const primaryCategory = categories[0]

  const trail = buildBlogTrail(
    locale,
    { slug: primaryCategorySlug, title: primaryCategory?.title ?? primaryCategorySlug },
    { slug: doc.slug ?? slug, title: doc.title },
  )

  // MAIL-01: ruta del post con prefijo de idioma. La Server Action del bloque
  // email-capture redirige de vuelta a esta misma URL con `?subscribed=...`
  // tras el envio (el estado se lee en el cliente, ver arriba), y el JSON-LD la
  // usa como `mainEntityOfPage`.
  const localizedPostPath = localizeBlogPath(locale, blogPostPath(primaryCategorySlug, doc.slug ?? slug))

  // Ids de encabezado: UN mapa sobre el contenido COMPLETO (Pitfall 2). Las dos
  // mitades del cuerpo (la oferta inline va entre ellas) y el indice salen de
  // aqui, asi que comparten numeracion y ningun id se repite.
  const body = splitContentForOffer(doc.content)
  const headingIds = buildHeadingIdMap(doc.content?.root as unknown as LexicalRootLike | undefined)

  const t = await getTranslations({ locale, namespace: 'post' })
  const view = toPostViewProps(doc, { locale, routeSlug: slug })

  // Los textos de conversion se resuelven contra la categoria primaria: es la
  // que define la URL del post y tambien el problema con el que llego el lector.
  const promo = resolveBlogPromo(await getCachedBlogPromo(locale), primaryCategory?.id)

  // Relacionados y anterior/siguiente salen de la lista ligera cacheada, que se
  // lee con `overrideAccess: false` (un borrador no entra, T-55-42). La lectura
  // lanza si falla y aqui se deja propagar (500): una lista vacia por un fallo
  // transitorio se serviria sin relacionados con 200 durante el TTL.
  const posts = await getCachedBlogPostList(locale)
  const related = pickRelated(posts, {
    slug: doc.slug ?? slug,
    categorySlugs: categories.flatMap((c) => (c.slug ? [c.slug] : [])),
  })
  const prevNext = pickPrevNext(categoryItems(posts, primaryCategorySlug), doc.slug ?? slug)

  // INL-02: el escaneo cubre `doc.content` ENTERO (no `body.before` ni
  // `body.after`, recortados por splitContentForOffer): la divulgacion debe
  // aparecer antes del cuerpo sin importar en que punto inserto el editor el
  // bloque inline.
  const disclosure = postHasAffiliateInline(doc.content)
    ? { amazon: postHasAmazonAffiliateInline(doc.content) }
    : null

  // SEO-09. Cada clave nombra una fuente real de Payload; lo que no la tiene se
  // omite (ver buildArticleJsonLd, extraido sin cambios).
  const articleData = buildArticleJsonLd(doc, {
    locale,
    routeSlug: slug,
    localizedPostPath,
    categoryTitle: primaryCategory?.title ?? primaryCategorySlug,
    refs: { siteUrl: SITE_URL, sitePersonSlug: SITE_PERSON_SLUG, personRef, websiteRef },
  })

  return (
    <>
      <PostView
        post={view}
        crumbs={trail.map((c) => ({ label: c.label, href: c.url }))}
        tocLabel={t('toc.label')}
        progressLabel={t('progress.label')}
        disclosure={disclosure}
        inlineOffer={toInlineOffer(promo.inline, locale)}
        railOffer={toRailOffer(promo.rail, locale)}
        related={related}
        prevNext={prevNext}
        closing={toClosingProps(promo.closing, locale)}
        before={body.before}
        after={body.after}
        headingIds={headingIds}
        ctx={{ postPath: localizedPostPath }}
      />
      <JsonLd data={articleData} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </>
  )
}
