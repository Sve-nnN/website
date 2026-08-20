import { ArrowRight } from 'lucide-react'

import { Link } from '@/i18n/navigation'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

/**
 * La oferta que aparece dentro del artículo, entre dos secciones.
 *
 * PRIMERA VERSIÓN (descartada): una regla en brasa con texto gris y un enlace.
 * Se probó en vivo y desaparecía. Dentro de un artículo de 20 minutos, un
 * bloque que usa la misma tipografía, el mismo color y el mismo ancho que los
 * párrafos que lo rodean no es sobrio, es invisible. La sobriedad se consigue
 * apareciendo una sola vez, no apareciendo a medias.
 *
 * Ahora es un panel navy con el shader granulado, el mismo material que abre la
 * home y cierra el bloque CallToAction. Corta la columna de lectura por
 * contraste de superficie, no por gritar: sigue sin tener badge, sin urgencia y
 * sin segundo botón.
 *
 * Es el ÚNICO canvas animado de la página del post. La tarjeta lateral y la
 * banda de cierre usan el grano estático justamente para que este siga siendo
 * el momento y no un efecto repetido.
 */
export function InlineOffer({
  title,
  text,
  linkLabel,
  linkUrl,
}: {
  title?: string | null
  text?: string | null
  linkLabel?: string | null
  linkUrl?: string | null
}) {
  if (!text) return null

  return (
    <aside className="not-prose my-12 overflow-hidden rounded-2xl">
      <div className="relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-secondary-foreground/10">
        <HeroGrainGradient variant="cta" />
        {/* Mismo criterio que AuditOfferBlock: la variante `cta` llega a casi
            brasa plena en algunos cuadros, y papel sobre #F7581E mide 2.6:1.
            El velo plano pone un piso de contraste sin apagar el movimiento. */}
        <div aria-hidden="true" className="absolute inset-0 bg-secondary/70" />
        <div className="relative z-10 p-6 text-secondary-foreground md:p-8">
          {title && <p className="font-heading text-heading tracking-tight">{title}</p>}
          <p className="mt-3 max-w-[55ch] text-body opacity-90">{text}</p>
          {linkLabel && linkUrl && (
            <Link
              href={linkUrl}
              className="group mt-5 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-label text-primary-foreground shadow-sm transition-[background-color,box-shadow,transform] duration-fast ease-out hover:bg-primary/90 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:shadow-focus"
            >
              {linkLabel}
              <ArrowRight
                className="size-4 transition-transform duration-fast ease-standard group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
