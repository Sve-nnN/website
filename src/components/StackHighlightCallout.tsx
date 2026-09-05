import { Badge } from '@/components/ui/badge'
import { Prose } from '@/components/Prose'

/**
 * Un componente, dos instancias ("qué elegiría hoy" / no-commission pick) —
 * comparten la misma firma visual en vez de inventar dos superficies
 * distintas. El link de GSC (cuando aplica) es deliberadamente un `<a>`
 * plano, NUNCA `AffiliateLink` — Google Search Console no es una relación
 * de afiliado, nunca lleva `rel="sponsored"`.
 */
export function StackHighlightCallout({
  heading,
  narrative,
  badge,
  gscHref,
  gscLabel,
}: {
  heading: string
  narrative: string
  badge?: string
  gscHref?: string
  gscLabel?: string
}) {
  return (
    <div className="rounded-lg bg-secondary p-8 text-secondary-foreground">
      <h2 className="font-heading text-heading">{heading}</h2>
      {badge && (
        <div className="mt-2">
          <Badge variant="default">{badge}</Badge>
        </div>
      )}
      <div className="mt-4">
        <Prose className="text-secondary-foreground">
          <p>{narrative}</p>
        </Prose>
      </div>
      {gscHref && (
        <a
          href={gscHref}
          target="_blank"
          rel="noopener"
          className="text-secondary-foreground underline underline-offset-2"
        >
          {gscLabel}
        </a>
      )}
    </div>
  )
}
