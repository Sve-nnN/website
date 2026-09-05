import { AffiliateDisclosure } from '@/components/AffiliateDisclosure'

/**
 * Phase 48: primer frame visual real para `AffiliateDisclosure` (hoy un
 * `<p>` sin estilo — su contrato de legal copy + prop queda intacto,
 * NUNCA se toca ese archivo). `role="note"` (no `role="alert"`): esto es
 * contenido informativo persistente, no un anuncio de live-region. El
 * borde + `bg-muted` cumplen el estándar FTC "clear and conspicuous" sin
 * gastar color de acento en un aviso legal.
 */
export function AffiliateDisclosureFrame({
  hasAmazonLinks,
  locale,
}: {
  hasAmazonLinks: boolean
  locale?: 'es' | 'en'
}) {
  return (
    <div
      role="note"
      className="rounded-lg border border-border bg-muted p-4 [&_p]:text-label [&_p]:text-muted-foreground"
    >
      <AffiliateDisclosure hasAmazonLinks={hasAmazonLinks} locale={locale} />
    </div>
  )
}
