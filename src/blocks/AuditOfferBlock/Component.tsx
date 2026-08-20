import { Check } from 'lucide-react'

import type { AuditOfferBlock as AuditOfferBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { CMSLink } from '@/components/CMSLink'
import { HeroGrainGradient } from '@/components/HeroGrainGradient'

/**
 * Closing band of the home page. See `config.ts` for why the audit is paid
 * and why its price is published.
 *
 * This is the second and last place on the page where the real WebGL shader
 * runs, using its existing `cta` variant: the page opens on that material in
 * the hero and closes on it here, and the bands in between carry the static
 * grain instead (`GrainTexture`). Two animating canvases is a decision; four
 * would be a performance bill on the one site whose whole argument is speed.
 *
 * The price is set as a display element rather than a headline number with a
 * label under it — the surrounding facts (what it includes, the delivery
 * window, the credit) are what make it legible as fair, and burying them
 * under a big figure would turn an honest offer into a pricing-table trick.
 */
export function AuditOfferBlockComponent(props: AuditOfferBlockProps) {
  const {
    title,
    description,
    price,
    priceCaption,
    creditNote,
    includes,
    deliveryNote,
    links,
  } = props

  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground py-16 md:py-24">
      <HeroGrainGradient variant="cta" />
      {/* Scrim between the shader and the copy. The `cta` variant is the
          bolder `ripple` shape at intensity 0.45, so parts of the band go to
          near-full ember, and paper text on #F7581E measures about 2.6:1 —
          under AA, and this is the one band on the page carrying the price
          and the only action. The hero gets away without a scrim because its
          shader sits on near-black. A flat veil keeps the grain and the
          colour movement visible while putting a floor under the contrast. */}
      <div aria-hidden="true" className="absolute inset-0 bg-secondary/70" />
      <Container className="relative z-10">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_22rem] md:items-start md:gap-x-16 md:gap-y-12">
          <div>
            <h2 className="font-heading text-heading tracking-tight text-balance">{title}</h2>

            {description && (
              <p className="mt-4 max-w-[65ch] text-body text-secondary-foreground/85">
                {description}
              </p>
            )}

            {includes && includes.length > 0 && (
              <ul className="mt-8 flex flex-col gap-3">
                {includes.map((row) => (
                  <li key={row.id ?? row.item} className="flex items-start gap-3 text-body">
                    <Check
                      className="mt-1 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span className="text-secondary-foreground/90">{row.item}</span>
                  </li>
                ))}
              </ul>
            )}

          </div>

          {price && (
            <div>
              <div className="rounded-2xl border border-secondary-foreground/20 bg-secondary-foreground/[0.06] p-6">
                <p className="font-display text-display tracking-tight tabular-nums leading-none">
                  {price}
                </p>
                {priceCaption && (
                  <p className="mt-3 text-body text-secondary-foreground/85">{priceCaption}</p>
                )}
                {deliveryNote && (
                  <p className="mt-2 text-label text-secondary-foreground/70">{deliveryNote}</p>
                )}
                {creditNote && (
                  <p className="mt-5 border-t border-secondary-foreground/20 pt-5 text-body text-secondary-foreground/85">
                    {creditNote}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* The action closes the grid rather than sitting inside the left
              column. On a phone the two columns stack, and with the button
              still in the left column the visitor met "Pedir la auditoría"
              BEFORE the 600 USD card — asked to decide before being told the
              price. Last child means the mobile order is title, scope, price,
              action, and on desktop it simply runs under both columns. */}
          {links && links.length > 0 && (
            <div className="flex flex-wrap gap-4 md:col-span-2">
              {links.map((row) => (
                <CMSLink key={row.id ?? row.link?.label} {...row.link} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
