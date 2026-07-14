---
phase: 30-content-humanization-globals-core-pages-services-geo
plan: 02
subsystem: content
tags: [content-humanization, voice-calibration, pages-collection, local-api, legal-content]
dependency-graph:
  requires: ["30-01"]
  provides: ["home-page-humanized", "contact-page-humanized", "legal-pages-humanized"]
  affects: ["pages collection (slugs: home, contact, privacy, terms)"]
tech-stack:
  added: []
  patterns:
    - "reapplyIds id-reuse discipline for content.layout blocks/sub-arrays across locale writes"
    - "per-locale fresh findByID fetch before mutating, never trusting stale layout"
key-files:
  created:
    - scripts/humanize-home-page.ts
    - scripts/humanize-contact-page.ts
    - scripts/humanize-legal-pages.ts
  modified: []
decisions:
  - "Home hero rewritten to first person (not kept as a structural third-person exception) — a page's main hero heading is prose, per VOICE-PROFILE"
  - "Home CallToAction's duplicated 'Ready to work together?' (identical ES/EN) rewritten into a real Spanish version, plus its link label fixed for locale parity"
  - "3 locale-collapse bugs found live and fixed as Rule-1 fixes: clientLogosBlock/featuredPostsBlock/featuredCaseStudiesBlock.title had EN identical to ES"
  - "Contact page treated as light polish (already close to calibrated voice) rather than full rewrite, per plan instruction"
  - "Legal pages: only body prose rewritten, same section count/order/headings, no legal meaning/obligation changed"
metrics:
  duration: "~35 minutes"
  completed: 2026-07-14
---

# Phase 30 Plan 02: Home, Contact, Privacy, Terms Content Humanization Summary

Rewrote the real editorial copy of Home, Contact, Privacy, and Terms Pages docs in Juan's calibrated voice (first person, mixed-rhythm sentences, zero em dash, quantified concreteness), both ES and EN locales, via three new one-off Local API scripts run against production Neon Postgres — reusing every block/sub-array id across locale writes so no data was orphaned.

## What Was Built

### Task 1: `scripts/humanize-home-page.ts`
Rewrote Home's `hero`, `aboutSection`, `faq`, `callToAction`, `contactFormBlock`, `clientLogosBlock`, `featuredPostsBlock`, `featuredCaseStudiesBlock`, and `servicesShowcase` blocks, both locales. `testimonialsCarousel` left untouched (out of scope, not a placeholder).

**Before/after samples:**

- Hero title (ES): `"Juan Carlos Angulo: Ingeniero de Software y Experto SEO"` → `"Construyo software rápido y hago que se encuentre en Google"`
- Hero title (EN): `"Juan Carlos Angulo: Software Engineer & SEO Expert"` → `"I build fast software and get it found on Google"`
- CallToAction richText (ES): `"Ready to work together?"` (duplicate of EN — bug) → `"¿Empezamos a trabajar juntos?"`
- `aboutSection.features[2].description` (ES): removed an em dash (`"...sistemas modulares y limpios sobre Next.js y CMS headless (Payload) — código mantenible..."` → `"...sistemas modulares y limpios sobre Next.js y CMS headless como Payload: código propio, auditable y mantenible..."`)
- `clientLogosBlock.title` (EN): `"Clientes"` (locale-collapse bug) → `"Clients"`
- `featuredPostsBlock.title` (EN): `"Artículos destacados"` (locale-collapse bug) → `"Featured Articles"`
- `featuredCaseStudiesBlock.title` (EN): `"Casos de éxito destacados"` (locale-collapse bug) → `"Featured Case Studies"`

### Task 2: `scripts/humanize-contact-page.ts`
Light polish of the standalone `contact` page's `contactFormBlock` — already close to the calibrated collaborative voice, so this pass tightened rhythm rather than rewrote wholesale.

**Before/after samples:**

- `title` (EN): `"Get in Touch"` → `"Let's Talk"` (mirrors ES `"Hablemos"` more directly)
- `description` (EN): `"Have a project in mind? Tell me about it."` → `"Got a project in mind? Tell me about it."`
- `socialProofText` (ES): `"Respondo en menos de 48 horas."` → `"Suelo responder en menos de 48 horas."` (kept the concrete 48-hour claim, no invented number)
- `contactInfo[0].href` — untouched (`mailto:hello@juan-tech.com`)

### Task 3: `scripts/humanize-legal-pages.ts`
Rewrote body prose of all 6 Privacy sections and 5 Terms sections, both locales, same headings/order, no legal meaning changed.

**Before/after samples:**

- Privacy §2 (ES): `"Los datos del formulario de contacto se usan únicamente para responder tu consulta. Los datos de analíticas se usan de forma agregada..."` → `"Uso los datos del formulario de contacto únicamente para responder tu consulta, nada más. Las analíticas las reviso de forma agregada..."` (first person, same meaning)
- Terms §3 (EN): `"All content on this site — including articles, code samples, designs, and case studies — is the exclusive property of Juan Carlos Angulo..."` (2 em dashes) → `"All the content on this site, including articles, code samples, designs, and case studies, belongs to me exclusively unless stated otherwise..."` (em dashes removed, same IP ownership terms)
- Terms §5 (ES): `"Para preguntas sobre estos términos, contáctame a través de la página de contacto."` → `"Si tienes preguntas sobre estos términos, escríbeme a través de la página de contacto."`

## Verification

- All 3 scripts ran successfully (`exit 0`) against production Neon.
- Home doc re-read post-write (both locales): all 10 block ids unchanged from pre-write state; `aboutSection.features[]`/`paragraphs[]`, `faq.faqs[]`, `contactFormBlock.contactInfo[]`, `callToAction.links[]`/`hero.links[]` sub-array ids all preserved; no sibling block/field lost data.
- Contact doc re-read post-write (both locales): block/contactInfo ids unchanged; `contactInfo[0].href` untouched.
- Privacy/Terms docs re-read post-write (both locales): 6/5 sections respectively, same headings, block/column ids unchanged; a full-text scan of both docs' richText confirmed zero em dash (`—`) remaining.
- `meta.title`/`meta.description`/`targetKeyword` confirmed untouched on all 4 pages (verified via direct re-read after each script run).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed 3 locale-collapse bugs on Home block titles**
- **Found during:** Task 1, live-read of Home doc before writing copy
- **Issue:** `clientLogosBlock.title`, `featuredPostsBlock.title`, and `featuredCaseStudiesBlock.title` all had identical ES/EN text live (e.g. `"Clientes"`/`"Clientes"`, `"Artículos destacados"`/`"Artículos destacados"`) — the EN locale was never actually translated, same bug class already found and fixed for Header's `ctaButton.label` in 30-01.
- **Fix:** Translated the EN value for each (`"Clients"`, `"Featured Articles"`, `"Featured Case Studies"`).
- **Files modified:** `scripts/humanize-home-page.ts`
- **Commit:** a1a023d

**2. [Rule 1 - Bug] Fixed Home CallToAction's duplicated placeholder richText and link label**
- **Found during:** Task 1, live-read of Home doc
- **Issue:** `callToAction.richText` was the literal English string `"Ready to work together?"` in BOTH `es` and `en` — an untranslated placeholder, not a real Spanish CTA. Its `links[0].link.label` and `hero.links[0].link.label` were also both `"Hablemos"` in ES and EN (should differ).
- **Fix:** Rewrote the ES richText to `"¿Empezamos a trabajar juntos?"` and set EN link labels to `"Let's talk"`.
- **Files modified:** `scripts/humanize-home-page.ts`
- **Commit:** a1a023d

**3. [Rule 1 - Bug] Removed 2 em dashes from live Terms EN section 3**
- **Found during:** Task 3, live-read of Terms doc
- **Issue:** Live EN body of Terms §3 used an em dash twice (`"— including articles..."`/`"...case studies —"`), violating the hard "zero em dash" rule from CLAUDE.md/VOICE-PROFILE.
- **Fix:** Rewrote the sentence without em dashes, same meaning (IP ownership, attribution requirement unchanged).
- **Files modified:** `scripts/humanize-legal-pages.ts`
- **Commit:** c550b85

No architectural deviations, no auth gates encountered (Local API against an already-configured `.env` `DATABASE_URI`).

## Known Stubs

None — all touched fields now carry real, distinct ES/EN prose.

## Threat Flags

None — no new network endpoint, auth path, or schema change introduced. All writes went through the existing `payload.update`/Local API surface already covered by T-30-04/T-30-05 in this plan's own threat model.

## Self-Check: PASSED

- `scripts/humanize-home-page.ts` — FOUND
- `scripts/humanize-contact-page.ts` — FOUND
- `scripts/humanize-legal-pages.ts` — FOUND
- Commit a1a023d — FOUND (`git log --oneline --all | grep a1a023d`)
- Commit 45c5fcf — FOUND (`git log --oneline --all | grep 45c5fcf`)
- Commit c550b85 — FOUND (`git log --oneline --all | grep c550b85`)
