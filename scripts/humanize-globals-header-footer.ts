/**
 * Phase 30 Plan 01, Task 2 — humanize Header + Footer globals, fix the 2 real
 * locale-parity bugs PATTERNS.md found:
 *   1. Header.ctaButton.label is "Get in Touch" in BOTH es and en (the es
 *      locale was never actually localized to a collaborative Spanish CTA).
 *   2. Footer.legalLinks[2] (the "/sitemap.html" entry) has an es label but
 *      no en label at all.
 *
 * Reads the LIVE global state via `locale: 'all'` first (per-item ids are
 * shared across locales, not per-locale), reuses those ids on every
 * per-locale write so Payload's array full-replace behavior on `updateGlobal`
 * doesn't orphan the other locale's rows (same discipline as the 2026-07-12
 * incident fix — see CLAUDE.md's Database Safety section).
 *
 * Most navItems/columns/dynamicColumns/copyrightText values were confirmed
 * already in Juan's calibrated voice (short, direct, no em dash, no AI
 * tells) via a live read-only check before this script was written — those
 * are echoed back unchanged. Only ctaButton.label and legalLinks[2].label
 * are genuinely rewritten.
 *
 * Run with:
 *   node --env-file=.env node_modules/.bin/tsx scripts/humanize-globals-header-footer.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

type Locale = 'es' | 'en'
const LOCALES: Locale[] = ['es', 'en']

async function run() {
  const payload = await getPayload({ config })

  // ---------------------------------------------------------------------
  // HEADER
  // ---------------------------------------------------------------------
  const header = await payload.findGlobal({ slug: 'header', locale: 'all' })
  const navItems = (header.navItems ?? []) as Array<{
    id: string
    link: { type: 'custom'; url: string; newTab: boolean; label: Record<string, string> }
  }>

  // navItems labels confirmed already in-voice (short nav copy, no anglicisms,
  // no em dash) — echo back unchanged, ids reused.
  const buildNavItems = (locale: Locale) =>
    navItems.map((item) => ({
      id: item.id,
      link: {
        type: item.link.type,
        url: item.link.url,
        newTab: item.link.newTab,
        label: item.link.label[locale],
      },
    }))

  // Real bug fix: ctaButton.label was "Get in Touch" in BOTH locales.
  // Collaborative CTA per VOICE-PROFILE ("Hablemos" > "Contáctame ahora").
  const ctaLabelByLocale: Record<Locale, string> = {
    es: 'Hablemos',
    en: "Let's talk",
  }

  for (const locale of LOCALES) {
    await payload.updateGlobal({
      slug: 'header',
      locale,
      data: {
        navItems: buildNavItems(locale),
        ctaButton: {
          label: ctaLabelByLocale[locale],
          href: header.ctaButton?.href ?? '/contact', // non-localized, untouched
        },
      },
    })
  }
  console.log('Header: navItems echoed (ids reused), ctaButton.label bug fixed (es/en now distinct)')

  // ---------------------------------------------------------------------
  // FOOTER
  // ---------------------------------------------------------------------
  const footer = await payload.findGlobal({ slug: 'footer', locale: 'all' })

  type FooterColumn = {
    id: string
    title: Record<string, string>
    links: Array<{
      id: string
      link: { type: 'custom'; url: string; newTab: boolean; label: Record<string, string> }
    }>
  }
  const columns = (footer.columns ?? []) as FooterColumn[]

  // columns[].title and nested links[].link.label confirmed already in-voice
  // — echo back unchanged, ids reused (top-level column id + nested link id).
  const buildColumns = (locale: Locale) =>
    columns.map((col) => ({
      id: col.id,
      title: col.title[locale],
      links: col.links.map((l) => ({
        id: l.id,
        link: {
          type: l.link.type,
          url: l.link.url,
          newTab: l.link.newTab,
          label: l.link.label[locale],
        },
      })),
    }))

  type DynamicColumn = {
    id: string
    title: Record<string, string>
    source: 'latestPosts' | 'latestCaseStudies'
    limit: number
  }
  const dynamicColumns = (footer.dynamicColumns ?? []) as DynamicColumn[]

  // dynamicColumns[].title confirmed already in-voice — echo back unchanged.
  const buildDynamicColumns = (locale: Locale) =>
    dynamicColumns.map((dc) => ({
      id: dc.id,
      title: dc.title[locale],
      source: dc.source,
      limit: dc.limit,
    }))

  // socialLinks is NOT localized — pass through as-is, untouched.
  const socialLinks = (footer.socialLinks ?? []) as Array<{
    id: string
    platform: string
    url: string
  }>

  type LegalLink = { id: string; href: string; label: Record<string, string> }
  const legalLinks = (footer.legalLinks ?? []) as LegalLink[]

  // Real bug fix: legalLinks[2] (the /sitemap.html entry) has an es label
  // ("Sitemap") but no en label at all. "Sitemap" is the standard English
  // term too (already used untranslated in plenty of Spanish tech copy,
  // same convention as "Blog" elsewhere on this site) — write it for en.
  const legalLinkLabelOverrides: Record<string, Partial<Record<Locale, string>>> = {}
  for (const link of legalLinks) {
    if (link.href === '/sitemap.html' && !link.label.en) {
      legalLinkLabelOverrides[link.id] = { en: 'Sitemap' }
    }
  }

  const buildLegalLinks = (locale: Locale) =>
    legalLinks.map((link) => ({
      id: link.id,
      href: link.href, // non-localized, untouched
      label: legalLinkLabelOverrides[link.id]?.[locale] ?? link.label[locale],
    }))

  const copyrightTextByLocale = footer.copyrightText as Record<Locale, string>

  for (const locale of LOCALES) {
    await payload.updateGlobal({
      slug: 'footer',
      locale,
      data: {
        columns: buildColumns(locale),
        dynamicColumns: buildDynamicColumns(locale),
        socialLinks,
        legalLinks: buildLegalLinks(locale),
        // copyrightText already confirmed in-voice — echoed back unchanged.
        copyrightText: copyrightTextByLocale[locale],
      },
    })
  }
  console.log(
    'Footer: columns/dynamicColumns/copyrightText echoed (ids reused), legalLinks[sitemap].label.en bug fixed',
  )

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
