import type { Metadata } from 'next'

import type { Media } from '@/payload-types'
import { isSearchConsoleCapture } from '@/lib/case-capture'
import { getFallbackHeroImage } from '@/lib/heroImageFallback'

/** Separa una URL de Cloudinary en la base de la cuenta y el public id, sin transformaciones. */
function splitCloudinaryUrl(url: string): { baseUrl: string; publicId: string } | null {
  const uploadIndex = url.indexOf('/upload/')
  if (uploadIndex === -1) return null

  const baseUrl = url.substring(0, uploadIndex)
  const afterUpload = url.substring(uploadIndex + '/upload/'.length)

  // Strip existing transformation segments to isolate the raw public_id.
  // Transformation segments start with a 1-3 char prefix + underscore (w_, h_, l_, fl_…).
  // Version segments match /^v\d+$/. Everything else is the public_id start.
  // Depends on heroImageFallback.ts's URL shape (f_auto,q_auto + .avif) — keep both in sync.
  const segments = afterUpload.split('/')
  let pidStart = 0
  for (let i = 0; i < segments.length; i++) {
    if (/^v\d+$/.test(segments[i])) {
      pidStart = i
      break
    }
    if (/^[a-z]{1,3}_/.test(segments[i])) {
      pidStart = i + 1
      continue
    }
    pidStart = i
    break
  }
  return { baseUrl, publicId: segments.slice(pidStart).join('/') }
}

/**
 * Texto para una capa `l_text`, recortado a `max` caracteres.
 *
 * In an l_text layer, `,` and `/` are transformation-parameter separators.
 * Cloudinary decodes the URL once before parsing the transform, so a single
 * encode (`%2C`/`%2F`) decodes back to a raw separator and yields HTTP 400 —
 * they must be DOUBLE-encoded (`%252C`/`%252F`) to survive as literal text.
 * Truncate on code points, not UTF-16 code units, so a supplementary-plane
 * character (e.g. an emoji in an editorial title) never gets split into an
 * unpaired surrogate — encodeURIComponent throws URIError on those.
 */
function encodeOverlayText(title: string, max: number): string {
  const truncated = title.length > max ? `${Array.from(title).slice(0, max - 3).join('')}...` : title
  return encodeURIComponent(truncated)
    .replace(/%2C/g, '%252C')
    .replace(/%2F/g, '%252F')
}

/**
 * Imagen social (1200×630) para un fondo que es una captura de datos. El titulo
 * no puede ir encima de la captura: tapa las cifras y ninguno de los dos se lee.
 * Aqui cada uno tiene su franja sobre fondo oscuro:
 *   1. Captura entera (`c_limit`, sin recorte) dentro de 848×448.
 *   2. Margen inferior de 22px y lienzo de 1200×630 (`c_lpad`: rellena sin ampliar).
 *   3. Titulo centrado en la franja superior (155px), en Roboto Bold: la fuente
 *      de puntos del resto de las tarjetas pierde las letras a tamano de miniatura.
 *      Dos lineas a 44px hasta 84 caracteres; mas largo, tres lineas a 38px.
 *
 * @param url   - URL de Cloudinary de la captura (puede traer transformaciones)
 * @param title - Titulo de la pagina
 */
export function getCloudinaryOgWithCapture(url: string, title: string): string {
  if (!url || !url.includes('cloudinary.com')) return url
  const parts = splitCloudinaryUrl(url)
  if (!parts) return url

  const background = 'b_rgb:181818'
  const fit = 'c_limit,w_848,h_448'
  const margin = `c_lpad,w_848,h_470,g_north,${background}`
  const canvas = `c_lpad,w_1200,h_630,g_south,${background}`
  const size = Array.from(title).length > 84 ? 38 : 44
  const text = `l_text:Roboto_${size}_bold_center:${encodeOverlayText(title, 120)},co_rgb:FAFAF7,w_1100,c_fit/fl_layer_apply,g_center,y_-235`

  return `${parts.baseUrl}/upload/${fit}/${margin}/${canvas}/${text}/f_jpg,q_auto:best/${parts.publicId}`
}

/**
 * Generates a Cloudinary OG image URL (1200×630) with a title overlay.
 *
 * Layout:
 *   1. Resize + fill-crop to 1200×630 (standard OG).
 *   2. Dark gradient scrim (portfolio/og-scrim) covers the bottom 300px so
 *      white text is readable on any image — bright or dark.
 *      The scrim is a 1200×300 PNG: transparent-at-top → ~82% black-at-bottom.
 *   3. Title text at bottom-right (50px inset), Array Bold 70px, white,
 *      auto-fitted to 1100px max width.
 *
 * Assets required in Cloudinary (already uploaded to the shared account,
 * cloud_name=dmufha3qv — see 41-CONTEXT.md, zero new uploads this phase):
 *   - raw/authenticated  Array-Bold.woff2  (custom font)
 *   - image/upload       portfolio/og-scrim (dark gradient PNG)
 *
 * @param url   - Any Cloudinary image URL (may already have transforms)
 * @param title - Page / post title to render as overlay
 */
export function getCloudinaryOgWithTitle(url: string, title: string): string {
  if (!url || !url.includes('cloudinary.com')) return url

  const parts = splitCloudinaryUrl(url)
  if (!parts) {
    console.warn(`[og-image] Cloudinary URL missing /upload/ segment, skipping title overlay: ${url}`)
    return url
  }
  const { baseUrl, publicId } = parts

  // Truncate long titles and URL-encode for the Cloudinary text parameter.
  const encodedTitle = encodeOverlayText(title, 65)

  // Step 1 — base resize
  const baseTransform = 'w_1200,h_630,c_fill,g_auto,f_jpg,q_auto'

  // Step 2 — dark gradient scrim (1200×300, uploaded once).
  // Placed at the bottom; ensures text readability on bright images.
  // 1200×300 exact match avoids Cloudinary's megapixel limit on large upscales.
  const scrimLayer = 'l_portfolio:og-scrim/w_1200,h_300,c_fill/fl_layer_apply,g_south'

  // Step 3 — title text: Array Bold 70px, white, bottom-right with 50px inset.
  // fl_layer_apply positions the layer; gravity g_south_east + x_50,y_50 gives the inset.
  // w_1100 leaves 50px breathing room on the left side too.
  const textLayer = `l_text:Array-Bold.woff2_70_right:${encodedTitle},co_white,w_1100,c_fit/fl_layer_apply,g_south_east,x_50,y_50`

  return `${baseUrl}/upload/${baseTransform}/${scrimLayer}/${textLayer}/${publicId}`
}

/** Narrows a Payload upload relationship to its populated `Media` shape (depth >= 1). */
function isPopulatedMedia(value: unknown): value is Media {
  return typeof value === 'object' && value !== null && 'url' in value
}

/**
 * Resolves the background image for an OG card following the 3-tier priority
 * locked in 41-CONTEXT.md: editorial `meta.image` (plugin-seo) wins, then a
 * per-doc `heroImage` if it's a Cloudinary URL, else the deterministic
 * per-slug fallback from the existing 53-image pool.
 */
function resolveOgBackground(params: {
  metaImage?: (number | null) | Media
  heroImage?: (number | null) | Media
  slug: string
}): { url: string; capture: boolean } {
  for (const media of [params.metaImage, params.heroImage]) {
    if (isPopulatedMedia(media) && media.url?.includes('cloudinary.com')) {
      return { url: media.url, capture: isSearchConsoleCapture(media) }
    }
  }
  return { url: getFallbackHeroImage(params.slug), capture: false }
}

/**
 * Builds the `openGraph` object for a page's Next.js Metadata, wiring the
 * Cloudinary title-overlay mechanism into every call site. `url` must always
 * be passed in already locale-correct and relative (e.g. `/en/blog/my-post`)
 * — Next resolves it against `metadataBase` (set in `[locale]/layout.tsx`).
 */
export function buildOpenGraph(params: {
  title: string
  description?: string
  url: string
  locale: 'es' | 'en'
  slug: string
  metaImage?: (number | null) | Media
  heroImage?: (number | null) | Media
  /**
   * SEO-47: pasalo en las paginas que SON un articulo (posts y casos de exito)
   * para que emitan `og:type: article` con sus fechas y su autor, en vez del
   * `website` generico que emitian las 169 paginas del sitio.
   *
   * No cambia ranking. Cambia como se ve el enlace cuando alguien lo comparte:
   * `article` es lo que habilita la tarjeta con fecha y autor en LinkedIn, que
   * es de donde viene la mayor parte de la difusion de este sitio. Hasta ahora
   * un articulo se compartia con la misma tarjeta que la pagina de terminos.
   *
   * Los tres valores ya existen en el JSON-LD de esas mismas paginas, asi que
   * esto reusa el dato en vez de abrir una segunda fuente de verdad.
   */
  article?: {
    publishedTime?: string
    modifiedTime?: string
    authors?: string[]
    section?: string
  }
}): NonNullable<Metadata['openGraph']> {
  const background = resolveOgBackground({
    metaImage: params.metaImage,
    heroImage: params.heroImage,
    slug: params.slug,
  })
  const ogImageUrl = background.capture
    ? getCloudinaryOgWithCapture(background.url, params.title)
    : getCloudinaryOgWithTitle(background.url, params.title)

  const shared = {
    title: params.title,
    description: params.description,
    url: params.url,
    siteName: 'Juan Carlos Angulo',
    locale: params.locale === 'es' ? 'es_ES' : 'en_US',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: params.title,
      },
    ],
  }

  if (params.article) {
    return {
      ...shared,
      type: 'article',
      publishedTime: params.article.publishedTime,
      modifiedTime: params.article.modifiedTime,
      authors: params.article.authors,
      section: params.article.section,
    }
  }

  return { ...shared, type: 'website' }
}
