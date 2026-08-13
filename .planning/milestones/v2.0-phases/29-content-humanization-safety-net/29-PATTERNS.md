# Phase 29: Content Humanization Safety Net - Pattern Map

**Mapped:** 2026-07-14
**Files analyzed:** 5 deliverables (2 pure docs, 2 schema migrations + collection config edits, 1 script extension)
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.planning/phases/29-content-humanization-safety-net/29-FIELD-AUDIT.md` (new doc) | config-audit doc | batch/read-only | `.planning/milestones/v1.7-MILESTONE-AUDIT.md` (table format) + `research/JUAN-PROFILE.md` (living-doc style) | role-match |
| `src/blocks/TestimonialsCarousel/config.ts` (modified — `title` field) | model (Block field config) | CRUD | `src/blocks/CallToAction/config.ts` (already-localized `richText` field, post-fix) | exact (same block-config shape) |
| `src/migrations/2026XXXX_phase29_testimonialscarousel_title_localized.ts` (new, **BLOCKING — needs Juan's named approval**) | migration | batch (backfill + DDL) | `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` (the corrected post-incident version) | exact |
| `src/collections/CaseStudies/index.ts` (`services[].service` — investigate only, maybe no change) | model (CollectionConfig field) | CRUD | `src/collections/Websites/index.ts` `stack[].tag` (sibling array-of-text-tag field, same non-localized shape, added one phase later with same review) | exact |
| `scripts/content-freeze-snapshot.ts` (extend, or new `scripts/content-humanization-snapshot.ts`) | utility/script | batch/file-I/O | itself, `scripts/content-freeze-snapshot.ts` (existing metadata-only snapshot) + `scripts/verify-content-freeze.ts` (diff companion) | role-match (needs extension, not copy) |
| `.planning/phases/29-content-humanization-safety-net/29-VOICE-PROFILE.md` (new doc) | config/doc | transform (research → brief) | `research/JUAN-PROFILE.md` (voice/bio source material) + `.planning/research/SUMMARY-v1.6.md` (already-derived voice bullet) | role-match |

## Pattern Assignments

### 1. Pre-flight field audit doc

**Analog:** `.planning/milestones/v1.7-MILESTONE-AUDIT.md` (table format, lines 34-62) for structure; raw material is `grep -nE "name:|localized: true|type: '(text|textarea|richText)'"` across `src/collections/*/index.ts`, `src/globals/*/index.ts`, `src/blocks/*/config.ts` (already run in full for this pattern map — reuse the results below verbatim rather than re-grepping).

**Recommended table format** (mirrors the audit doc's `| Req ID | ... | Status |` convention, adapted to field-level):
```markdown
| Collection/Global | Field path | Type | localized? | Public-facing? | Notes |
|---|---|---|---|---|---|
| CaseStudies | title | text | true | yes | |
| CaseStudies | services[].service | text | **false** | yes | flagged VOICE-03, see success criterion 3 |
| TestimonialsCarousel (block) | title | text | **false** | yes | flagged VOICE-02, migration required |
| Header (global) | navItems[].link.url | text | false | no (URL, not copy) | correct as-is — URL is not editorial content |
| Header (global) | navItems[].link.label | text | true | yes | correct |
| Llms (global) | llmsTxt / llmsFull | textarea | **false** | yes (AI-facing copy) | open question from SUMMARY-v1.6 — flag for VOICE-02/03 style review, decide if backfill needed like TestimonialsCarousel |
```

**Complete raw findings from this session's grep sweep** (use directly, do not re-derive):

*Collections:*
- `Authors`: `name` (not localized — proper noun, correct), `jobTitle` ✅loc, `bio` ✅loc, `credentials[].label` ✅loc, `expertise[].topic` ✅loc, `education[].degree/institution/description` ✅loc (`logo`/dates not text), `experience[].company/role/description` ✅loc, `socialLinks[].url` not loc (correct, URL), `yearsExperience` (number, n/a)
- `CaseStudies`: `title` ✅loc, `heroMetric` ✅loc, `heroSubtitle` ✅loc, `sector` ✅loc, `period` **not loc** (short date/range string — low risk but public-facing, flag), `services[].service` **not loc** (flagged — success criterion 3), `kpis[].label` ✅loc (`kpis[].value` not loc, numeric-like string, acceptable), `clientContext` (richText) ✅loc, `challenge[].text` ✅loc, `solution[].title/description` ✅loc, `results.metrics[].label` ✅loc (`before`/`after` not loc, numeric-like, acceptable), `conclusion` (richText) ✅loc
- `Categories`: `title` ✅loc, `description` ✅loc
- `Clientes`: `name` not loc (proper noun, correct), `websiteUrl` not loc (correct, URL)
- `Media`: `alt` ✅loc
- `Pages`: `title` ✅loc; `content` blocks — audit delegates to each block's own config (see Blocks section below)
- `Posts`: `title` ✅loc, `excerpt` ✅loc, `content` (richText) ✅loc
- `SpeakingEvents`: `title` ✅loc, `description` ✅loc, `role` ✅loc, `coSpeakers[].name` not loc (proper noun, correct), `location` **not loc** (flag — city names are usually proper nouns but confirm), `link` not loc (correct, URL)
- `Testimonials`: `name` not loc (proper noun, correct — matches CONTEXT decision "no anonymous quotes"), `role` ✅loc, `company` not loc (proper noun, correct), `testimonial` ✅loc
- `Users`: `name` not loc (internal admin user, not public-facing — correct)
- `Websites`: `title` ✅loc, `role` ✅loc, `industry` ✅loc, `highlights[].text` ✅loc, `stack[].tag` **not loc** (same shape as `CaseStudies.services[].service` — intentional per Phase 38 pattern map, tags like "Next.js"/"Payload" are proper nouns, likely correct but confirm same logic applies), `challenges[].text` ✅loc

*Globals:*
- `Footer`: `columns[].title` ✅loc, `dynamicColumns[].title` ✅loc, `legalLinks[].label` ✅loc (`.href` not loc, correct), `socialLinks[].url` not loc (correct), `copyrightText` ✅loc
- `Header`: `navItems[].link.label` ✅loc (via shared `link()` helper, `src/fields/link.ts` line 108), `navItems[].link.url` not loc (correct — URL), `ctaButton.label` ✅loc, `ctaButton.href` not loc (correct)
- `Llms`: `llmsTxt` **not loc**, `llmsFull` **not loc** — both public AI-facing copy, flagged as open question in `.planning/research/SUMMARY-v1.6.md` line 12; audit must make an explicit call (localize or document why not)
- `FeaturedContent`: no text fields (relationship-only fields to posts/case-studies/websites)

*Blocks (registered on Pages via `content` blocks field):*
- `AboutSection`: `eyebrow` ✅loc, `title` ✅loc, `paragraphs[].text` ✅loc, `features[].title/description` ✅loc, `ctaText` ✅loc, `ctaLink` not loc (correct, URL)
- `ArchiveBlock`: `emptyStateHeading` ✅loc, `emptyStateBody` ✅loc
- `CallToAction`: `richText` ✅loc (fixed by the 2026-07-12 incident migration — reference pattern)
- `ClientLogosBlock`: `title` ✅loc
- `Code`: no localized-relevant text fields (`language`/`code` are technical, not editorial copy)
- `ContactFormBlock`: `eyebrow`/`title`/`description`/`submitLabel`/`sidebarTitle`/`sidebarDescription`/`socialProofText` all ✅loc; `contactInfo[].title/value` ✅loc, `.href` not loc (correct)
- `Content`: `richText` ✅loc
- `FAQ`: `title` ✅loc, `faqs[].question` ✅loc, `faqs[].answer` (richText) ✅loc
- `FeaturedCaseStudiesBlock` / `FeaturedPostsBlock` / `FeaturedWebsitesBlock`: `title` ✅loc (all three consistent)
- `Hero`: `title` ✅loc, `subtitle` ✅loc, `breadcrumbs[].label` ✅loc (`.url` not loc, correct), `cityName` ✅loc, `inlineStat` ✅loc
- `LocalProofSection`: `stats[].value/label` ✅loc, `testimonial.quote` ✅loc, `.authorName` not loc (proper noun, correct), `.authorBusiness` ✅loc
- `MediaBlock`: no text fields
- `RelatedCaseStudyBlock`: `title` ✅loc, `framingText` ✅loc
- `RelatedPosts`: `title` ✅loc
- `ResultsSection`: `title` ✅loc, `description` ✅loc, `stats[].value/label` ✅loc
- `Section`: no direct editorial text (container/layout only); nested `blocks` inherit their own audit entries
- `ServiceScopeCard`: `title` ✅loc, `scope` ✅loc, `outcome` ✅loc, `timeline` ✅loc
- `ServicesShowcase`: `title` ✅loc
- `TableOfContentsBlock`: `title` ✅loc
- `TestimonialsCarousel`: `title` **not loc** — this is the confirmed VOICE-02 target (see below), `showRating`/`limit` not text
- `TestimonialSection`: `quote` ✅loc, `authorName` not loc (proper noun, correct), `authorRole` ✅loc

**Confirmed flagged fields for the audit's "action needed" section:** `TestimonialsCarousel.title` (success criterion 2, migration below), `CaseStudies.services[].service` (success criterion 3, investigate), `Llms.llmsTxt`/`Llms.llmsFull` (new finding this session, not previously in ROADMAP text — flag for Juan's discretion, likely same-value-both-locales is fine since llms.txt is English-only-by-convention in most sites, but document the decision explicitly), `SpeakingEvents.location` (minor, low risk, city name likely fine as-is but flag for completeness), `Websites.stack[].tag` (same shape/reasoning as CaseStudies.services, likely correct as non-localized tech-name tags but flag for consistency of documented reasoning).

---

### 2. `TestimonialsCarousel.title` → `localized: true` migration (BLOCKING — Juan's named approval required before apply)

**Current state confirmed** (`src/blocks/TestimonialsCarousel/config.ts`, full file, 31 lines):
```typescript
{
  name: 'title',
  type: 'text',
  label: 'Título',
  required: false,
  defaultValue: 'Testimonios',
},
```
Not localized today — this is the exact field named in ROADMAP.md's "bug repeated 3 times in v1.5" list (`CallToAction.richText`, `Header.navItems.url`, `TestimonialsCarousel.title`).

**Config fix** — add `localized: true`:
```typescript
{
  name: 'title',
  type: 'text',
  label: 'Título',
  required: false,
  localized: true,
  defaultValue: 'Testimonios',
},
```

**Reference migration — the CORRECT backfill-then-drop pattern to replicate exactly**, `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` (full file, 48 lines, already fixed post-incident):
```typescript
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_call_to_action_locales" (
    "rich_text" jsonb,
    "id" serial PRIMARY KEY NOT NULL,
    "_locale" "_locales" NOT NULL,
    "_parent_id" varchar NOT NULL
  );
  -- ... second _v (versions) table created identically ...
  ALTER TABLE "pages_blocks_call_to_action_locales" ADD CONSTRAINT ... FOREIGN KEY ("_parent_id") REFERENCES ...;
  CREATE UNIQUE INDEX ... USING btree ("_locale","_parent_id");

  -- Backfill: copy the existing (pre-localization) value into BOTH
  -- locale rows before dropping the shared column, so no copy is lost.
  -- 'es'/'en' come from CREATE TYPE "public"."_locales" AS ENUM('es', 'en')
  INSERT INTO "pages_blocks_call_to_action_locales" ("rich_text", "_locale", "_parent_id")
  SELECT "rich_text", locale::"_locales", "id"
  FROM "pages_blocks_call_to_action", unnest(ARRAY['es', 'en']) AS locale
  WHERE "rich_text" IS NOT NULL;
  -- ... identical INSERT for the _v (versions) table ...

  ALTER TABLE "pages_blocks_call_to_action" DROP COLUMN "rich_text";
  ALTER TABLE "_pages_v_blocks_call_to_action" DROP COLUMN "rich_text";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_call_to_action_locales" CASCADE;
  DROP TABLE "_pages_v_blocks_call_to_action_locales" CASCADE;
  ALTER TABLE "pages_blocks_call_to_action" ADD COLUMN "rich_text" jsonb;
  ALTER TABLE "_pages_v_blocks_call_to_action" ADD COLUMN "rich_text" jsonb;`)
}
```

**The critical pattern to replicate for `TestimonialsCarousel.title`:**
1. `payload migrate:create` will generate the raw table/column DDL (block table name will be `pages_blocks_testimonials_carousel` and `_pages_v_blocks_testimonials_carousel`, or whatever the actual generated names are — Claude must run `migrate:create` and read the generated SQL rather than guess exact table names).
2. Insert an explicit `INSERT ... SELECT ... FROM <table>, unnest(ARRAY['es','en']) AS locale WHERE "title" IS NOT NULL` backfill step BEFORE the `DROP COLUMN`, copying the pre-localization value into both locale rows, exactly mirroring lines 24-36 of the reference file.
3. Only after the backfill INSERTs succeed does the migration `DROP COLUMN "title"` from both the live table and its `_v` (versions) shadow table.
4. Per CONTEXT.md hard gate: generate this migration, read it in full, then present it to Juan for named approval before running `payload migrate` against the real Neon instance. Do NOT auto-apply.

---

### 3. `CaseStudies.services[].service` — investigate, may be doc-only

**Current field** (`src/collections/CaseStudies/index.ts` lines 36-39):
```typescript
{
  name: 'services',
  type: 'array',
  fields: [{ name: 'service', type: 'text', required: true }],
},
```
Not localized. Content is likely short service-name tags ("SEO Técnico", "Desarrollo Web") that plausibly need translation per locale (unlike `Clientes.name` or `Testimonials.company`, which are proper nouns correctly left unlocalized).

**Comparison analog — `Websites.stack[].tag`** (`src/collections/Websites/index.ts` lines 32-35, built one phase later in Phase 38, reviewed/approved by Juan in that phase's CONTEXT.md):
```typescript
{
  name: 'stack',
  type: 'array',
  fields: [{ name: 'tag', type: 'text', required: true }],
},
```
Also intentionally left non-localized — `stack` holds tech-stack names (Next.js, Payload, PostgreSQL) that are proper nouns, correctly not localized. This is the precedent for "same shape, deliberately not localized, because content is proper-noun-like."

**Decision guidance for planner:** if the actual data in `services[].service` across existing CaseStudies docs are short descriptive service names (not proper nouns) — e.g. "SEO Técnico" needs to become "Technical SEO" in EN — then this needs the same backfill-migration treatment as `TestimonialsCarousel.title` (reuse the exact same reference pattern from `20260712_202954_phase19_calltoaction_localized.ts`). If the actual values ARE proper-noun-like or brand terms that shouldn't translate, document that decision in the audit doc instead of migrating — no schema change needed. Read the actual live `services` values via MCP `juan-payload` or Local API before deciding (per Phase 37's hard lesson: verify via live read, don't assume).

---

### 4. Full content snapshot (VOICE-04)

**Analog — extend, don't rewrite from scratch:** `scripts/content-freeze-snapshot.ts` (full file, 87 lines) already has the exact CLI/output scaffolding needed (`--tag` arg, `getPayload({ config })`, `payload.find({ collection, locale: 'all', depth: 0 })`, JSON written to a phase-scoped directory) — but its `normalized` mapper (lines 61-67) only extracts `{ id, slug, updatedAt }`, explicitly metadata-only ("count + ids + updatedAt", per its own header comment lines 1-5). VOICE-04 needs full text content, not just metadata.

**Companion diff tool to reuse as-is or extend:** `scripts/verify-content-freeze.ts` (full file, ~90+ lines) already diffs two snapshots by id/updatedAt drift — can be extended with a text-level diff (e.g. per-field string comparison) once the snapshot itself carries full field values, or a new sibling script can do a deep-diff pass.

**Recommended approach:** create `scripts/content-humanization-snapshot.ts` copying the CLI/file-output/collection-loop skeleton verbatim from `content-freeze-snapshot.ts`, but:
1. Expand `COLLECTIONS` to cover every collection identified in the field audit (add `speaking-events` if missing, drop `redirects` if not editorial copy).
2. Change the `normalized` mapper to keep the FULL doc (or at minimum every field flagged as public-facing text in the audit doc), still with `locale: 'all', depth: 0` so both locale variants are captured per document.
3. Keep the same output convention (`.planning/phases/29-.../content-snapshots/<tag>-<ISO>.json`) — following the existing precedent's directory-per-phase pattern (`06-deploy-cutover/freeze-snapshots/`).
4. Format: JSON (matches existing tooling and the diff script's `JSON.parse` expectation) — CONTEXT.md leaves exact format ("JSON, markdown, o ambos") to discretion; JSON is the correct choice for reuse with `verify-content-freeze.ts`-style diffing. A markdown export can be a secondary, human-readable companion if desired, but JSON must be the source of truth for diffing.

---

### 5. Voice profile document (VOICE-05)

**Primary source already in repo — do not re-research from scratch:**
- `research/JUAN-PROFILE.md` (full file, 77 lines) — living profile doc with confirmed bio text (lines 20), professional positioning (lines 55-65), and the Arianna Lupi relationship (lines 51-53, "vínculo profesional real y activo").
- `.planning/research/SUMMARY-v1.6.md` line 42 — already contains the exact voice-profile brief in one sentence: *"Voice profile grounded in named-competitor analysis: first-person like Arianna Lupi (not third-person like Aleyda Solis), direct-quantified credential claims, collaborative-imperative CTAs ('Hablemos', 'Trabajemos juntos'), neutral Spanish (no voceo)"* — this is the spec to expand into a full document, not invent new positioning.
- `.planning/research/FEATURES.md.v1.6` also references the same Arianna Lupi/Aleyda Solis distinction (grep hit, not re-read in full here — same content as SUMMARY-v1.6 line 39-42, no new information expected).

**Bio-as-voice-reference** (Phase 37/JUAN-PROFILE.md, exact text, first-person, direct credential claims, neutral Spanish, no voceo):
> "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda..."

This bio is the closest in-repo exemplar of the target voice: first-person ("Soy... me he especializado... Ayudo a empresas..."), quantified credentials ("más de cuatro años"), no voceo, professional-direct register — the voice profile doc should extract these exact stylistic rules (sentence structure, credential-framing pattern, verb choice) as reusable guidance rather than just restating the bio.

**Recommended structure for the voice profile doc** (no exact in-repo analog for this doc type — closest structural precedent is `research/JUAN-PROFILE.md`'s section-based living-doc format: `## Identidad`, `## Tono y voz`, `## Reglas` sections, "Última actualización" header, explicit "no se completa con suposiciones" discipline):
```markdown
# Perfil de Voz — Humanización de Contenido (Phase 29 brief for humanizer skill)

## Reglas de tono
- Español neutro, sin voceo (nunca "vos"/"tenés")
- Primera persona ("hago", "ayudo", "he trabajado con")
- Credenciales directas y cuantificadas (ej. "más de 4 años", "18+ clientes")
- CTA colaborativo ("Hablemos", "Trabajemos juntos") — no imperativo unilateral ("Contrátame ya")

## Referencia positiva (ya en la voz correcta)
[cite Author bio verbatim, from research/JUAN-PROFILE.md]

## Contraste con competidores
- Arianna Lupi: primera persona (adoptar este ángulo)
- Aleyda Solis: tercera persona / tono más corporativo (NO adoptar)

## Aplicación por tipo de contenido
[globals / pages / services / posts / case studies — cross-ref Phase 30/31 scope]
```

---

## Shared Patterns

### Migration backfill-before-drop (the single most important pattern in this phase)
**Source:** `src/migrations/20260712_202954_phase19_calltoaction_localized.ts` (full file, 48 lines)
**Apply to:** Both `TestimonialsCarousel.title` migration and `CaseStudies.services[].service` migration (if the investigation concludes a migration is needed). Non-negotiable: `INSERT ... SELECT ... unnest(ARRAY['es','en'])` backfill into the new `_locales` table for BOTH the live collection/block table and its `_v` (versions/drafts) shadow table, BEFORE any `DROP COLUMN`. Never generate a migration that drops a populated column without this backfill step present and verified by reading the generated SQL end-to-end first.

### Database Safety approval gate
**Source:** `CLAUDE.md` "Database Safety" section (this repo's root CLAUDE.md, project instructions) + `29-CONTEXT.md` lines 17-25.
**Apply to:** Any migration file this phase generates. Additive migrations (new tables/columns) can run unattended; anything with `DROP COLUMN`/reshaping an existing populated column requires generating + reading the SQL, then Juan's explicit named approval before `payload migrate` runs against the real Neon instance. No exceptions for this phase given the 2026-07-12 incident.

### Snapshot/diff script pairing
**Source:** `scripts/content-freeze-snapshot.ts` + `scripts/verify-content-freeze.ts` (existing pair, CLI-arg driven, JSON-file based).
**Apply to:** The new full-text snapshot script for VOICE-04 — reuse the same CLI ergonomics (`--tag` flag, `getPayload({ config })`, phase-scoped output directory) so the diff tool can be extended/reused rather than building parallel infrastructure.

## No Analog Found

| File/Pattern | Role | Data Flow | Reason |
|---|---|---|---|
| Voice profile document type | doc | n/a | No prior "voice profile" doc exists in this repo — closest precedent is `research/JUAN-PROFILE.md`'s living-doc section structure, used here as a structural (not content) template. |
| Full-text (non-metadata) content snapshot | script | file-I/O | `content-freeze-snapshot.ts` is metadata-only by design (id/slug/updatedAt) for a different purpose (proving nothing changed during a freeze window) — VOICE-04 needs the actual field values, which is a genuinely new script behavior, not a copy-paste. |

## Metadata

**Analog search scope:** `src/collections/*/index.ts` (11 files), `src/globals/*/index.ts` (4 files), `src/blocks/*/config.ts` (24 files), `src/fields/link.ts`, `src/migrations/20260712_202954_phase19_calltoaction_localized.ts`, `scripts/content-freeze-snapshot.ts`, `scripts/verify-content-freeze.ts`, `research/JUAN-PROFILE.md`, `.planning/research/SUMMARY-v1.6.md`, `.planning/milestones/v1.7-MILESTONE-AUDIT.md`
**Files scanned:** ~45 files (grep sweep across all collections/globals/blocks) + 6 files read in full
**Pattern extraction date:** 2026-07-14
