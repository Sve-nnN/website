import { Check } from 'lucide-react'

import { Container } from '@/components/Container'
import { Link } from '@/i18n/navigation'
import { GrainTexture } from '@/components/GrainTexture'
import { buttonVariants } from '@/components/ui/button-variants'
import { getCachedBlogPromo } from '@/lib/cache'
import { resolveBlogPromo } from '@/lib/blog-promo'

/**
 * Banda que cierra /blog, cada categoría y cada post.
 *
 * Es la última pantalla de una superficie de lectura, así que llega después de
 * que el visitante recibió algo: por eso acá sí se pide la acción, y una sola
 * vez por página.
 *
 * Usa el grano estático (`GrainTexture`), no el shader animado. El shader tiene
 * un techo de dos canvas por página fijado en la home, y una superficie que se
 * repite en 70+ rutas no es el lugar para gastarlo — este sitio se vende por
 * rendimiento.
 */
export async function BlogClosing({
  locale,
  categoryId,
}: {
  locale: 'es' | 'en'
  /** Categoría del post o del listado, para servir su versión del texto. */
  categoryId?: number | null
}) {
  const promo = await getCachedBlogPromo(locale)
  const { closing } = resolveBlogPromo(promo, categoryId)

  if (!closing?.heading) return null

  const points = (closing.points ?? []).filter((row) => Boolean(row.item))

  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <GrainTexture />
      <Container className="relative z-10 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-x-16">
          <div>
            <h2 className="font-heading text-heading tracking-tight text-balance">
              {closing.heading}
            </h2>
            {closing.body && (
              <p className="mt-4 max-w-[65ch] text-body opacity-85">{closing.body}</p>
            )}
            {points.length > 0 && (
              <ul className="mt-8 flex flex-col gap-3">
                {points.map((row) => (
                  <li key={row.id ?? row.item} className="flex items-start gap-3 text-body">
                    <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="opacity-90">{row.item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(closing.primaryLabel || closing.secondaryLabel) && (
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              {closing.primaryLabel && closing.primaryUrl && (
                <Link
                  href={closing.primaryUrl}
                  className={buttonVariants({ variant: 'default', size: 'lg' })}
                >
                  {closing.primaryLabel}
                </Link>
              )}
              {closing.secondaryLabel && closing.secondaryUrl && (
                <Link
                  href={closing.secondaryUrl}
                  className="inline-flex h-10 items-center justify-center rounded-md px-4 text-label underline-offset-4 opacity-85 transition-opacity duration-fast ease-out hover:opacity-100 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
                >
                  {closing.secondaryLabel}
                </Link>
              )}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
