import { Badge } from '@/components/ui/badge'
import { Prose } from '@/components/Prose'

/**
 * Un componente, multiples instancias no-afiliadas ("qué elegiría hoy" /
 * no-commission pick en /stack, y el callout del auditor en la landing de
 * Auditoria SEO Tecnica) — comparten la misma firma visual en vez de
 * inventar una superficie distinta por caller. El link externo (cuando
 * aplica) es deliberadamente un `<a>` plano, NUNCA `AffiliateLink` — ninguno
 * de estos casos es una relación de afiliado, nunca llevan `rel="sponsored"`.
 */
export function StackHighlightCallout({
  heading,
  narrative,
  badge,
  linkHref,
  linkLabel,
  linkOpensInNewTabLabel,
}: {
  heading: string
  narrative: string
  badge?: string
  linkHref?: string
  linkLabel?: string
  linkOpensInNewTabLabel?: string
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
      {linkHref && (
        <a
          href={linkHref}
          target="_blank"
          rel="noopener"
          className="text-secondary-foreground underline underline-offset-2"
        >
          {linkLabel}
          {linkOpensInNewTabLabel && (
            <span className="sr-only"> ({linkOpensInNewTabLabel})</span>
          )}
        </a>
      )}
    </div>
  )
}
