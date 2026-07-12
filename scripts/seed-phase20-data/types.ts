/**
 * Content-authoring contracts for Phase 20 (SEO Local Geo-pages).
 *
 * Self-contained (not imported from scripts/seed-phase19-data/types.ts) per
 * project convention of one seed-data folder per phase — the shape is
 * structurally identical to Phase 19's ServiceCopy, since both phases use
 * the same H1->context->includes->process->FAQ->CTA page pattern.
 */

export type Locale = 'es' | 'en'

export interface FaqItem {
  question: string
  answer: string
}

export interface GeoPageCopy {
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
  ctaText: string
  ctaLinkLabel: string
}

export type BilingualGeoPageCopy = Record<Locale, GeoPageCopy>
