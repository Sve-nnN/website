import { notFound, permanentRedirect } from 'next/navigation'

import type { Author, Category, Post } from '@/payload-types'
import { Link } from '@/i18n/navigation'
import { JsonLd } from '@/components/JsonLd'
import { Container } from '@/components/Container'
import { PageHero } from '@/components/PageHero'
import { Badge } from '@/components/ui/badge'
import { AuthorByline } from '@/components/AuthorByline'
import { AuthorCard } from '@/components/AuthorCard'
import { RichTextRenderer } from '@/components/RichTextRenderer'
import { RelatedPostsComponent } from '@/blocks/RelatedPosts/Component'
import { TableOfContentsBlockComponent } from '@/blocks/TableOfContentsBlock/Component'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { buildOpenGraph } from '@/lib/og-image'
import { buildAlternates } from '@/lib/canonical'
import { pageTitle } from '@/lib/page-title'
import { buildBlogTrail, buildBreadcrumbJsonLd } from '@/lib/breadcrumbs'
import { SITE_URL } from '@/lib/sitemap-data'
import { getCachedPost, getCachedBlogPromo } from '@/lib/cache'
import { estimateReadingTime, readingTimeLabel } from '@/lib/reading-time'
import { splitContentForOffer } from '@/lib/lexical-split'
import { resolveBlogPromo } from '@/lib/blog-promo'
import { InlineOffer } from '@/components/InlineOffer'
import { RailOffer } from '@/components/RailOffer'
import { ReadingProgress } from '@/components/ReadingProgress'
import { BlogClosing } from '@/components/BlogClosing'
import { blogCategoryPath, blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'
import { personRef, SITE_PERSON_SLUG } from '@/lib/person'
import { websiteRef } from '@/lib/site-schema'
import { EN_TRANSLATION_INCOMPLETE, isEnTranslationIncomplete } from '@/lib/translation-gaps'

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
  const { locale, category, slug } = await params
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

  const author = typeof doc.author === 'object' ? (doc.author as Author) : undefined
  const categories = (doc.categories ?? []).filter(
    (c): c is Category => typeof c === 'object' && c !== null,
  )

  const heroImage = typeof doc.heroImage === 'object' ? doc.heroImage : null
  const heroImageUrl = heroImage?.url ?? getFallbackHeroImage(doc.slug ?? String(doc.id))

  const readingTimeMinutes = estimateReadingTime(doc.content)

  const primaryCategory = categories[0]

  // Los textos de conversión se resuelven contra la categoría primaria: es la
  // que define la URL del post y también el problema con el que llegó el lector.
  const promo = resolveBlogPromo(
    await getCachedBlogPromo(locale as 'es' | 'en'),
    primaryCategory?.id,
  )
  const body = splitContentForOffer(doc.content)
  const trail = buildBlogTrail(
    locale as 'es' | 'en',
    { slug: primaryCategorySlug, title: primaryCategory?.title ?? primaryCategorySlug },
    { slug: doc.slug ?? slug, title: doc.title },
  )

  // SEO-09. Every key below names a real Payload source. Anything without one is
  // omitted rather than filled in — fabricated structured data is a Google
  // Structured Data Guidelines violation, not a cosmetic gap. That is why there
  // is no `publisher.logo` here: the repo has no real logo asset to point at.
  //
  // `mainEntityOfPage` and `image` must be absolute, so they go through
  // SITE_URL. `heroImageUrl` can already be absolute (Cloudinary) or a root
  // path (local/fallback), hence the conditional.
  const articleUrl = `${SITE_URL}${
    locale === 'en'
      ? `/en${blogPostPath(primaryCategorySlug, doc.slug ?? slug)}`
      : blogPostPath(primaryCategorySlug, doc.slug ?? slug)
  }`
  const articleImage = heroImageUrl.startsWith('http')
    ? heroImageUrl
    : `${SITE_URL}${heroImageUrl}`

  const articleData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.title,
    // Previously emitted `""` on ES and `null` on EN. Omit instead.
    ...(doc.excerpt ? { description: doc.excerpt } : {}),
    datePublished: doc.publishedAt,
    // Real Payload timestamp — deliberately NOT a copy of datePublished, which
    // would assert a modification date the CMS never recorded.
    ...(doc.updatedAt ? { dateModified: doc.updatedAt } : {}),
    // SEO-03.3: cuando el autor es el dueno del sitio, el Article referencia
    // el @id canonico en vez de repetir un Person suelto. Asi cada articulo
    // suma al mismo nodo de entidad en lugar de crear uno nuevo por pagina.
    ...(author?.name
      ? {
          author: {
            '@type': 'Person',
            name: author.name,
            ...(author.slug === SITE_PERSON_SLUG ? personRef : {}),
          },
        }
      : {}),
    // Personal portfolio, not an organisation: the publisher IS the person.
    publisher: { '@type': 'Person', name: 'Juan Carlos Angulo', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    image: articleImage,
    articleSection: primaryCategory?.title ?? primaryCategorySlug,
    // SEO-48: ninguno de los 105 Article declaraba `inLanguage`. En un sitio
    // bilingue donde cada articulo existe en dos URLs emparejadas por hreflang,
    // es la senal de desambiguacion mas barata que hay: sin ella, lo unico que
    // dice en que idioma esta el contenido es el `<html lang>`.
    inLanguage: locale === 'en' ? 'en' : 'es',
    isPartOf: websiteRef,
  }

  return (
    <main>
      {/* POLISH: the hero used to stack a 21/9 image band ABOVE the copy, the
          same shape a case study already moved away from — on a 1440x812
          viewport it ate the whole fold and pushed the h1 below it. The image
          is now the hero's scrimmed background and the page renders the shared
          `detail` template, so post, case study and website heroes finally
          agree. The category chips moved out of the slot above the title
          (where they read as a kicker) into the metadata row. */}
      <PageHero
        variant="detail"
        trail={trail}
        title={doc.title}
        image={{ url: heroImageUrl, alt: heroImage?.alt ?? doc.title }}
        metaSlot={
          <>
            {author && <AuthorByline author={author} tone="dark" />}
            <div className="text-label text-secondary-foreground/80">
              {doc.publishedAt && (
                <time dateTime={doc.publishedAt}>
                  {new Date(doc.publishedAt).toLocaleDateString(locale)}
                </time>
              )}
              {' · '}
              {readingTimeLabel(readingTimeMinutes, locale as 'es' | 'en')}
            </div>
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link key={cat.id} href={blogCategoryPath(cat.slug ?? primaryCategorySlug)}>
                    <Badge variant="onDark">{cat.title}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </>
        }
      />

      {/* Mide el artículo, no la página: ver ReadingProgress. Va acá y no
          dentro del Container para poder ocupar el ancho completo. */}
      <ReadingProgress targetId="post-body" />

      <Container className="py-8 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_16rem] gap-12">
        {/* Las dos mitades viven dentro del MISMO <article>: la tabla de
            contenidos lee `article h2` del DOM, así que partirlo en dos
            elementos le escondería la mitad de los encabezados. */}
        <article id="post-body">
          <RichTextRenderer data={body.before} />
          {body.after && (
            <>
              <InlineOffer
                title={promo.inline.title}
                text={promo.inline.text}
                linkLabel={promo.inline.linkLabel}
                linkUrl={promo.inline.linkUrl}
              />
              <RichTextRenderer data={body.after} />
            </>
          )}
        </article>
        {/* La columna derecha es ahora un riel: índice arriba, oferta debajo.
            El sticky vive acá y no en el índice, para que ambos suban y bajen
            como una sola pieza; el bloque del índice se renderiza sin su
            propio sticky para no anidar dos contextos que compiten. */}
        <aside className="order-first flex flex-col md:order-last md:sticky md:top-24 md:self-start">
          <TableOfContentsBlockComponent
            blockType="tableOfContentsBlock"
            title={locale === 'es' ? 'Tabla de contenidos' : 'Table of contents'}
            position="left"
            sticky={false}
            minHeadingLevel="2"
          />
          <RailOffer
            title={promo.rail.title}
            body={promo.rail.body}
            linkLabel={promo.rail.linkLabel}
            linkUrl={promo.rail.linkUrl}
          />
        </aside>
      </Container>

      {author && (
        <Container className="py-8">
          <AuthorCard author={author} />
        </Container>
      )}

      <RelatedPostsComponent
        blockType="relatedPosts"
        title={locale === 'es' ? 'Artículos relacionados' : 'Related Posts'}
        autoSelect
        limit={3}
        currentPostId={doc.id}
        currentCategoryIds={categories.map((c) => c.id)}
      />

      {/* Escalera de cierre: autor, relacionados, y recién ahí el pedido. El
          lector ya recibió el artículo completo antes de que se le pida algo. */}
      <BlogClosing locale={locale as 'es' | 'en'} categoryId={primaryCategory?.id} />

      <JsonLd data={articleData} />
      <JsonLd data={buildBreadcrumbJsonLd(trail)} />
    </main>
  )
}
