import type { Block } from 'payload'

/**
 * Surfaces `auditor.juan-tech.com` — Juan's own live SEO auditor product —
 * on Home. Genuinely distinct from `AuditOfferBlock` (the PAID, 600 USD,
 * human-delivered audit): different icon (Gauge, not Search), no shared
 * fields, no shared taxonomy, no `linkGroup()`/`CMSLink`. See
 * 48.5-UI-SPEC.md "Home Block: AuditorHighlight" for the full contract.
 *
 * The 4 verifiable stats (29 checks, 5 categories, up to 500 URLs, CWV via
 * PageSpeed Insights) are NOT fields here — they live in `src/lib/auditor.ts`
 * as hardcoded constants, because they are facts about a product Juan
 * controls the accuracy of, not editorial copy an editor should be able to
 * inflate.
 */
export const AuditorHighlight: Block = {
  slug: 'auditorHighlight',
  interfaceName: 'AuditorHighlightBlock',
  labels: { singular: 'Auditor Highlight', plural: 'Auditor Highlight Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Vacío -> heading sr-only, mismo patrón SEO-10.2 que ServicesShowcase.title, nunca saltar un nivel de heading.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      required: true,
      admin: {
        description:
          '1-2 oraciones, sin line-clamp — este es un bloque de feature único, no una grilla de 4.',
      },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      localized: true,
      admin: {
        description: 'Vacío -> fallback i18n auditorHighlight.cta.',
      },
    },
    {
      name: 'freeTierNote',
      type: 'textarea',
      localized: true,
      required: true,
      admin: {
        description:
          'La disclosure honesta del plan gratuito. Renderiza como texto visible, NUNCA sr-only, NUNCA solo debajo del fold.',
      },
    },
  ],
}
