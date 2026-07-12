# Phase 15 — Deferred Items

Out-of-scope discoveries found during Phase 15 execution/verification. Not fixed in this phase per scope-boundary rule (only auto-fix issues directly caused by the current task's changes).

## 1. Header global — ES locale `navItems[].link.label` empty (SEO/UX-critical)

**Found during:** 15-02 sanity pass (curl against real dev server homepage, ES locale)

**Symptom:** The main site nav (`Header` global, desktop `NavigationMenu`) renders `<a href="/blog"></a>`, `<a href="/case-studies"></a>`, `<a href="/authors"></a>`, `<a href="/contact"></a>` — empty link text — on the ES homepage (`/`). The EN homepage (`/en`) renders correctly with visible labels ("Blog", "Case Studies", "Authors", "Contact").

**Root cause (same pattern as the Footer fix in this phase, and the bugs fixed in Phases 5/13/14):** `Header.navItems[].link.label` is a `localized: true` field (same `link()` field builder as Footer's `linkGroup`). The ES locale write got orphaned at some point by a later EN-only `updateGlobal` call replacing the shared, non-localized `navItems` array (and its item ids), the same class of bug already diagnosed in `05-12`/`13-02`/`14-01`/this phase's Footer fix.

**Why not fixed now:** `src/globals/Header/index.ts` and its seed data are a different global from `Footer` (out of scope for Phase 15's `SITEMAP-01`/`SITEMAP-02`). Fixing it correctly requires the same id-preserving backfill technique used for Footer in `scripts/seed-phase15-sitemap-footer-link.ts`, but against `scripts/seed-header-footer-content.ts`'s `navItemsEs` data (`Blog`, `Casos de éxito`, `Autores`, `Contacto`).

**Severity:** High — this is a real, live, SEO-critical, user-visible defect on the production-bound ES homepage (main navigation has no visible link text for Spanish visitors). Recommend a follow-up quick-fix pass (same technique as Phase 15's Footer backfill) before the v1.2 milestone is considered fully closed.

**Status:** Flagged to Juan directly in the Phase 15 execution report. Not auto-fixed — awaiting his go-ahead per scope-boundary + prior confirmation precedent in this same phase.
