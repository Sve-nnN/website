import { ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { GrainTexture } from '@/components/GrainTexture'

/**
 * Tarjeta de conversión de la columna derecha del post, debajo de la tabla de
 * contenidos.
 *
 * Acompaña al lector durante todo el artículo porque comparte el sticky de la
 * columna, así que su registro tiene que ser MÁS bajo que el de la oferta
 * inline: grano estático en vez del shader, sin animación, sin botón relleno.
 * Un elemento que está en pantalla todo el tiempo y encima se mueve deja de ser
 * una oferta y pasa a ser un anuncio.
 *
 * Solo escritorio. En mobile la columna se apila arriba del artículo, donde
 * esta tarjeta se comería la primera pantalla de lectura, y ahí el lector ya
 * recibe la oferta inline y la banda de cierre.
 */
export function RailOffer({
  title,
  body,
  linkLabel,
  linkUrl,
}: {
  title?: string | null
  body?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
}) {
  if (!title) return null

  return (
    <aside className="relative mt-6 hidden overflow-hidden rounded-2xl bg-secondary text-secondary-foreground md:block">
      <GrainTexture />
      <div className="relative z-10 p-5">
        {/* La regla en brasa arriba es el mismo gesto que cierra los heroes
            (`border-b-4`), a escala de tarjeta. */}
        <div aria-hidden="true" className="mb-4 h-0.5 w-10 bg-primary" />
        <p className="font-heading text-heading tracking-tight">{title}</p>
        {body && <p className="mt-2 text-body opacity-85">{body}</p>}
        {linkLabel && linkUrl && (
          <Link
            href={linkUrl}
            className="group mt-4 inline-flex items-center gap-1 rounded-sm text-label text-primary underline-offset-4 transition-colors duration-fast ease-out hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
          >
            {linkLabel}
            <ArrowRight
              className="size-4 transition-transform duration-fast ease-standard group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>
    </aside>
  )
}
