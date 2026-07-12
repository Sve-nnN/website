/**
 * Content-authoring contracts for Phase 19 (Service Pages).
 *
 * Copy plans (19-03, 19-04) export data against these shapes; the seed
 * orchestrator (19-05) consumes them to build Payload `Pages` docs.
 *
 * Deliberately dependency-free (no import from `src/lib/services-data.ts`)
 * to avoid an import cycle — `slug` is typed as `string` here, not
 * `ServiceSlug`.
 */

export type Locale = 'es' | 'en'

export interface FaqItem {
  question: string
  answer: string
}

/**
 * Used only by the SEO-para-IA/GEO service (D-05) to link `/llms.txt` and
 * `/llms-full.txt` as concrete, already-live proof of the offering. Optional
 * on `ServiceCopy`, omitted by the other 3 services.
 */
export interface ProofLink {
  url: string
  label: string
  description: string
}

export interface ServiceCopy {
  slug: string
  hero: {
    title: string
    subtitle: string
  }
  includes: {
    title: string
    paragraphs: string[]
  }
  process: {
    title: string
    paragraphs: string[]
  }
  faqs: FaqItem[]
  proofLinks?: ProofLink[]
  ctaText: string
  ctaLinkLabel: string
}

export type BilingualServiceCopy = Record<Locale, ServiceCopy>

export interface IndexPageCopy {
  hero: {
    title: string
    subtitle: string
  }
  services: {
    slug: string
    name: string
    description: string
  }[]
  ctaText: string
  ctaLinkLabel: string
}

export type BilingualIndexCopy = Record<Locale, IndexPageCopy>
