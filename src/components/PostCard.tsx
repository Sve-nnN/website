'use client'

import type { ReactNode } from 'react'
import * as m from 'motion/react-m'
import Image from 'next/image'
import { useParams } from 'next/navigation'

import { Link } from '@/i18n/navigation'

import type { PostCardData } from '@/lib/cache'

import { getFallbackHeroImage } from '@/lib/heroImageFallback'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Card, CardContent } from '@/components/ui/card'
import { blogPostPath, resolvePrimaryCategorySlug } from '@/lib/blog-paths'

export function PostCard({
  post,
  priority = false,
  href,
}: {
  post: PostCardData
  priority?: boolean
  // Posts live at /blog/<category>/<slug>. The card derives that from the
  // post's own populated `categories` by default, but callers whose query
  // returns categories as bare ids (FeaturedPostsBlock, which reads the
  // depth-1 FeaturedContent global) resolve the slug themselves and pass the
  // finished href in.
  href?: string
}) {
  const reducedMotion = useReducedMotion()
  // `useParams` y no `useLocale`: esta card también se renderiza fuera del
  // árbol de next-intl (la vista previa del admin de Payload), y ahí
  // `useLocale` lanza "No intl context found" y tumba toda la página. El
  // segmento de ruta siempre está disponible en el front, y fuera de él el
  // fallback es el locale por defecto.
  const params = useParams<{ locale?: string }>()
  const locale = params?.locale === 'en' ? 'en' : 'es'
  const heroImage = typeof post.heroImage === 'object' ? post.heroImage : null
  const imageUrl = heroImage?.url ?? getFallbackHeroImage(post.slug ?? String(post.id))
  const postHref =
    href ?? blogPostPath(resolvePrimaryCategorySlug(post.categories), post.slug ?? '')

  // El nombre de la categoría llega poblado por el `populate` de
  // getCachedArchive. Cuando la card se renderiza desde un contexto que solo
  // trae ids (FeaturedPostsBlock lee el global a depth 1), simplemente no hay
  // nombre que mostrar y la fila se queda con la fecha. Nada se inventa.
  const categoryTitle = post.categories?.flatMap((c) =>
    typeof c === 'object' && c !== null && c.title ? [c.title] : [],
  )[0]

  const meta: { key: string; node: ReactNode }[] = []
  if (categoryTitle) meta.push({ key: 'category', node: categoryTitle })
  if (post.publishedAt) {
    meta.push({
      key: 'date',
      node: (
        <time dateTime={post.publishedAt}>
          {new Intl.DateTimeFormat(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC',
          }).format(new Date(post.publishedAt))}
        </time>
      ),
    })
  }

  return (
    // POLISH: h-full on the link + card so cards sharing a grid row share a
    // bottom edge. A 3-line title previously made its card ~70px taller than
    // its neighbours (426px vs 358px on the home page's featured row).
    <Link href={postHref} className="block h-full">
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-[16/10] bg-muted">
          <m.div
            className="h-full w-full"
            whileHover={{ scale: reducedMotion ? 1 : 1.05 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <Image
              src={imageUrl}
              // The whole card is one <Link> wrapping this image and the <h3>
              // below it, so the link's accessible name already carries the
              // post title. Falling back to `post.title` here made a screen
              // reader announce the same sentence twice per card, which axe
              // flags as `image-redundant-alt` across six listing routes.
              //
              // An alt authored in the CMS that says something different is
              // still worth reading, so it is kept. Anything else — missing, or
              // a copy of the title — makes the image decorative in this
              // context, and an empty alt is the correct way to say so.
              alt={heroImage?.alt && heroImage.alt !== post.title ? heroImage.alt : ''}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
            />
          </m.div>
        </div>
        <CardContent className="flex flex-1 flex-col p-6">
          <h3 className="font-heading text-heading">{post.title}</h3>
          {post.excerpt && <p className="mt-2 text-body text-muted-foreground line-clamp-2">{post.excerpt}</p>}
          {/* Fila de metadatos: sin ella las 66 cards del blog son
              indistinguibles entre sí y el visitante no tiene con qué elegir.
              Va al pie de la card, no sobre el título — un rótulo encima del
              encabezado es la etiqueta que el propio encabezado ya carga.
              `mt-auto` la ancla abajo para que todas las cards de una fila
              alineen su metadata aunque los títulos midan distinto. */}
          {meta.length > 0 && (
            <p className="mt-auto pt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-muted-foreground">
              {meta.map((entry, i) => (
                <span key={entry.key} className="flex items-center gap-x-2">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {entry.node}
                </span>
              ))}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
