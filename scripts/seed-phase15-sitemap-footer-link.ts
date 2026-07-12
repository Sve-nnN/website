/**
 * Phase 15 (Sitemap XSL + HTML Navegable — SITEMAP-02):
 *
 * Idempotently adds a "Sitemap" entry to the Footer global's `legalLinks`
 * array, pointing to `/sitemap.html`, for both `es` and `en` locales.
 *
 * 15-CONTEXT.md corrected a wrong assumption from REQUIREMENTS.md — the
 * footer did NOT already have a "Sitemap" link, so this seed adds it as a
 * new editable array item rather than editing an existing one.
 *
 * Idempotency: matches by `href === '/sitemap.html'` (the non-localized
 * field), not by `label` (localized, could theoretically differ) — running
 * this script twice must not create duplicate entries.
 *
 * Deviation (Rule 3 - blocking bug, pre-existing): the ES locale is missing
 * localized `label`/`title` values on the *existing* legalLinks (Privacy,
 * Terms) and columns/links (Site/Contact + their nested link labels) — a
 * sitewide bilingual data gap of the same shape already found/fixed in
 * Phases 5 and 14 (an ES-locale write got orphaned by a later EN-only
 * update overwriting the shared array ids). Since Payload validates the
 * FULL merged global document (not just the field being updated) on every
 * `updateGlobal` call, these missing required+localized fields block ANY
 * ES-locale update to this global, including this seed's own append.
 * Backfilled from the known-correct ES copy already authored in
 * `scripts/seed-header-footer-content.ts` (preserving each item's existing
 * `id` so the shared, non-localized array structure isn't reset again).
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase15-sitemap-footer-link.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const

// Known-correct ES translations, matching scripts/seed-header-footer-content.ts.
const LEGAL_LABEL_ES: Record<string, string> = {
  '/privacy': 'Privacidad',
  '/terms': 'Términos',
}

const COLUMN_TITLE_ES: Record<string, string> = {
  Site: 'Sitio',
  Contact: 'Contacto',
}

const LINK_LABEL_ES: Record<string, string> = {
  '/blog': 'Blog',
  '/case-studies': 'Casos de éxito',
  '/authors': 'Autores',
  '/contact': 'Contáctame',
  '/search': 'Buscar',
}

async function main() {
  const payload = await getPayload({ config })

  const enFooter = await payload.findGlobal({ slug: 'footer', locale: 'en' })

  for (const locale of LOCALES) {
    const footer = await payload.findGlobal({ slug: 'footer', locale })
    const legalLinks = footer.legalLinks ?? []
    const columns = footer.columns ?? []

    let backfilled = false

    if (locale === 'es') {
      // Backfill missing legalLinks labels (existing items), preserving ids.
      for (const link of legalLinks) {
        if (!link.label && LEGAL_LABEL_ES[link.href]) {
          link.label = LEGAL_LABEL_ES[link.href]
          backfilled = true
        }
      }

      // Backfill missing column titles + nested link labels, preserving ids.
      // Match column-by-column against the EN structure by the array row's
      // stable `id` (Payload auto-generates one per row) rather than by
      // positional index — index-based matching would silently backfill
      // the wrong ES title onto the wrong column if `columns` is ever
      // reordered or its length diverges between locales (WR-07).
      columns.forEach((column) => {
        const enColumn = enFooter.columns?.find((candidate) => candidate.id === column.id)

        if (!enColumn) {
          console.warn(
            `No matching EN column found for ES column id "${column.id}" — skipping title backfill for this column.`,
          )
        } else if (!column.title && enColumn.title) {
          const mappedTitle = COLUMN_TITLE_ES[enColumn.title]
          if (mappedTitle) {
            column.title = mappedTitle
            backfilled = true
          } else {
            console.warn(
              `No ES title mapping found for EN column title "${enColumn.title}" (column id "${column.id}") — leaving title blank.`,
            )
          }
        }

        column.links?.forEach((linkItem) => {
          const url = linkItem.link?.url

          if (linkItem.link?.type !== 'custom') {
            console.warn(
              `Skipping footer link item with link.type=${String(linkItem.link?.type)} (not 'custom') — cannot match by URL.`,
            )
            return
          }

          if (!url) return

          if (!linkItem.link?.label) {
            const mappedLabel = LINK_LABEL_ES[url]
            if (mappedLabel) {
              linkItem.link.label = mappedLabel
              backfilled = true
            } else {
              console.warn(`No ES label mapping found for footer link URL "${url}" — leaving label blank.`)
            }
          }
        })
      })

      if (backfilled) {
        console.log('Backfilled missing ES localized labels on legalLinks/columns (pre-existing data gap)')
      }
    }

    const alreadyExists = legalLinks.some((link) => link.href === '/sitemap.html')

    if (!alreadyExists) {
      legalLinks.push({ label: 'Sitemap', href: '/sitemap.html' })
    }

    if (alreadyExists && !backfilled) {
      console.log(`Sitemap link already present, skipped (${locale})`)
      continue
    }

    await payload.updateGlobal({
      slug: 'footer',
      locale,
      data: {
        legalLinks,
        columns,
      },
    })

    if (!alreadyExists) {
      console.log(`Sitemap link added to footer.legalLinks (${locale})`)
    } else {
      console.log(`Sitemap link already present, backfill applied (${locale})`)
    }
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
