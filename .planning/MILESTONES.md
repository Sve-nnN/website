# Milestones

## v1.5 v1.5 (Shipped: 2026-07-13)

**Phases completed:** 21 phases, 76 plans, 110 tasks

**Key accomplishments:**

- 1. [Rule 3 - Blocking issue] `.gitignore` `media/` pattern was shadowing `src/collections/Media/`
- Three lean Payload collections — public Authors profile, minimal Clientes logo-carousel, and Testimonials with mandatory name/role/company attribution — ready for Wave 4 config wiring
- Structured CaseStudies collection (hero/metadata/kpis/clientContext/challenge/solution/results/conclusion) matching the ariannalupi.com/casos/ reference model, replacing JuanPortfolio's single rich-text blob.
- 6 consolidated Payload block configs replacing ~35 near-duplicate blocks from the old JuanPortfolio site — Hero's variant discriminator replaces 4+ hero slugs, ArchiveBlock's relationTo+mode replaces 9+ "Featured X" grid blocks.
- Pages collection wired to all 13 consolidated blocks via `content.layout` blocks field, with draft/versioning access control gating unpublished content
- Single source-of-truth Payload config wiring all 9 KEEP-list collections onto a push:false Postgres adapter, with plugin-seo (tabbedUI), plugin-redirects, and email-resend
- next-intl@4.13.1 installed with defaultLocale 'es', localePrefix 'as-needed', and localeDetection disabled, wired into next.config.mjs alongside the existing withPayload wrapper
- Payload localization activated for the first time (es default, en secondary, fallback true), Media.alt localized, Llms global created and registered, seoPlugin generate functions added, and the resulting `_locales` join tables + `llms` table applied to the live Neon Postgres DB via a committed migration
- Composed next-intl locale middleware with URL parity (es unprefixed, en prefixed, no Accept-Language override) plus a redirects-collection lookup delegated to a Node.js Route Handler, and a real `[locale]` home page with Person JSON-LD via JSON.stringify.
- Hand-written Next.js MetadataRoute + Payload Local API routes for /sitemap.xml, /robots.txt, /llms.txt, and /llms-full.txt — no plugins, all four SEO/GEO discoverability endpoints reading live content directly.
- Idempotent Phase 2 seed script plus blog/case-study detail pages with hand-written Article/CreativeWork/BreadcrumbList JSON-LD — closing the phase by exercising every i18n/SEO code path (locale parity, redirects, sitemap, llms.txt, JSON-LD, SEO-tab-to-HTML) against real seeded bilingual content.
- Installed cloudinary@2.10.0 and @payloadcms/plugin-cloud-storage@3.85.2, with cloudinary's legitimacy confirmed live against the npm registry (official repo, official maintainers, 874,251 weekly downloads)
- Built the corrected Cloudinary storage adapter (fixing two real bugs found in the reference implementation), wired it conditionally into payload.config.ts, gated Media's imageSizes to avoid a parallel-upload data-corruption bug, and applied the resulting schema migration to the real Neon database.
- Proved the Cloudinary adapter works against real infrastructure — and in doing so, found and fixed two real bugs that static type-checking never caught: a wrong MIME type on upload, and a broken delete due to a duplicated path prefix.
- 1. [Rule 3 - Blocking issue] `payload.config.kv` missing crashes `getPayload` init against the older sibling config
- 1. [Rule 3 - Blocking issue] No `dotenv` package installed; plain `npx tsx` doesn't load `.env`
- 1. [Rule 1 - Bug] Slug unique-constraint collision with Phase 2's seed script
- 1. [Rule 1 - Bug] Old source data for testimonials was stored as plain strings, not `{es,en}`
- 1. [Rule 3 - Blocking issue] Old schema nests `heroImage`/`tldr`/`content` under a `content` tab-group
- "Que Works viejos se convierten en CaseStudies nuevos vs se descartan"
- Tailwind v3 + shadcn (new-york/neutral/CSS-vars/lucide-react) initialized from a bare repo, with Inter/Fraunces fonts and UI-SPEC color/typography tokens wired as reusable Tailwind theme values.
- Header/Footer/FeaturedContent globals plus Authors credentials/yearsExperience/socialLinks fields, migrated against the real Neon Postgres, with confirmed-clean fixture state.
- FeaturedPostsBlock/FeaturedCaseStudiesBlock/ClientLogosBlock configs plus an ArchiveBlock category-filter toggle, registered on Pages (16 blocks total) and migrated against real Neon Postgres.
- Single RenderBlocks registry resolving all 16 Pages blocks, with FeaturedPosts/FeaturedCaseStudies reading curated docs from the FeaturedContent global and a validated category-filter on ArchiveBlock.
- SiteHeader/SiteFooter rendering the Header/Footer globals site-wide, AuthorByline/AuthorCard E-E-A-T components, and a deterministic FNV-1a hero-image fallback replicating the old site's 53-image Cloudinary pool behavior.
- Home page fully composed via RenderBlocks (Hero, Featured Case Studies, About, Client Logos, Featured Posts, Testimonials, Contact CTA), seeded with real migrated data in both locales.
- /blog listing route with a featured-posts section above a category-filterable chronological grid, verified against a real running server for both the empty state and real category filtering.
- Full post detail page — deterministic hero-image fallback, compact + expanded author E-E-A-T components, rich-text content, related posts, and table of contents — verified end-to-end against real migrated content.
- Case studies listing (grid or localized empty state) and a full structured detail page (KPIs, El cliente/reto/solución, before-after results, author E-E-A-T byline), with the previously-missing CaseStudies.author relationship added and backfilled.
- Authors listing grid and profile page giving CONT-02's E-E-A-T differentiator its own dedicated surface, with real posts/case studies listed per author.
- @payloadcms/plugin-search installed and indexing posts/case-studies/authors, with a /search page returning cross-collection results and exact UI-SPEC empty/error-state copy.
- Real Resend-backed contact form, ported Privacy/Terms legal pages, CONT-06 confirmed clean — plus a real cross-cutting localization bug found and fixed that was silently breaking every seeded bilingual Content block across the whole phase.
- Full bilingual, real-data walkthrough of every Phase 5 page approved directly by Juan against the live dev server and real Neon Postgres data — Phase 5 closes 13/13 with two explicit, non-blocking-for-phase-completion follow-ups logged for pre-deploy.
- Shadow/motion CSS token layer wired into Tailwind, a global prefers-reduced-motion safety net, and an ember/navy `.dark` rebrand verified by a self-written WCAG AA contrast script (all 10 checked pairs pass, script exits 0).
- Replaced every bare/unnamed `shadow` and untimed `transition-colors`/`transition-all` across all 12 shadcn primitives with Phase 7's named `shadow-sm/md/lg/focus` and `duration-fast/base/slow` + `ease-out/standard` tokens, closing the real gap where `theme.extend.boxShadow` has no `DEFAULT` key.
- Restyled global chrome with shadow-elevated sticky header and accent nav indicators, replaced footer's hardcoded border color with the token-driven Separator primitive, and closed the phase with an automated 16-block smoke check (15 PASS, 1 documented SKIP) plus a verified zero-diff gate on config.ts/payload-types.ts.
- Strengthened Hero title/subtitle hierarchy with tracking-tight/muted-subtitle tokens, and added an automated WCAG contrast script that samples all 53 real Cloudinary fallback images (worst case 7.72:1) confirming the existing opacity-30 overlay already passes without adjustment.
- Reinforced metric-number dominance across ResultsSection and case-study KPI/results surfaces via tracking-tight/tabular-nums values and receded uppercase labels, plus aligned case-study section headings to Prose.tsx's mt-10 rhythm — zero heading tag/semantics changes (1 h1, 4 h2 confirmed before/after).
- Added an editorial Fraunces blockquote treatment with a primary-accent left rule to Prose.tsx, strengthened h1/h2/h3 tracking and h2/h3 differentiation via opacity, and aligned the blog article header rhythm to match — zero heading tag/semantics changes (1 h1 confirmed, no h2/h3 outside rich text).
- PostCard, CaseStudyCard, and AuthorCard now compose the Phase 8-refined `Card`/`CardContent` primitive instead of hand-rolled `rounded-lg border ... hover:shadow-md transition-shadow` divs, giving all four card-grid surfaces (ArchiveBlock, FeaturedPostsBlock, FeaturedCaseStudiesBlock, RelatedPosts) identical elevation/radius, and making AuthorCard's years-of-experience read as a KPI-style headline stat with accessible focus-visible social-link icons.
- Seeded, verified, and cleanly removed 7 throwaway fixtures (1 fully-populated Author + 6 CaseStudies) against the real production Postgres database to prove the card-grid consistency and E-E-A-T prominence styling from 10-01 holds at repeater min/max boundaries, in both locales, and against the two longest real Spanish post titles — with zero residual data or altered field values left behind.
- Both-theme WCAG AA contrast checker found and fixed 4 real light-theme failures (unverified since shadcn scaffold); zero hardcoded content and zero schema drift confirmed across the full milestone diff.
- Re-ran and extended the ES layout verification against real content that didn't exist when this plan first ran: Phase 10.7's real case study (with embedded TestimonialSection) and Phase 10.8's Hero CTA/breadcrumbs. All checks pass — zero overflow, zero clipping, zero broken layout — across home, authors, case-studies list/detail, and blog listing, in ES and EN, at 375/768/1280px.
- Captured mobile Lighthouse scores for a local-production-build baseline (pre-Phase-7 commit `4be20f5`) and current HEAD (post 11-01/11-02) across 6 real routes. Accessibility/Best-Practices/SEO show zero regression (Accessibility improved on the blog listing). Performance shows a modest, largely noise-comparable softening on 2 of 6 routes, investigated with multi-sample re-measurement and flagged as a Phase 6 real-production re-baseline follow-up rather than chased with a speculative fix against a noisy local signal.
- Task 1 — Authors collection fields
- Task 1 — 3 new sections
- Task 1 — `scripts/seed-author-eeat.ts`
- STATUS: Task 1 complete and committed. Task 2 (checkpoint:human-verify, gate="blocking") is NOT resolved — flagged for Juan per orchestrator instruction, not auto-approved.
- SpeakingEvents collection
- Extended AboutSection with a features[]/CTA schema and gave `features[].icon` a real searchable Modal-based icon-grid picker (24 lucide-react icons) instead of a plain `<select>`, built on `@payloadcms/ui` primitives since the admin route doesn't load the site's Tailwind/shadcn build.
- Rendered the features grid/CTA on AboutSection, populated Home with the real "Mi enfoque en Consultoría Técnica" content and the FAQ's 5 real Q&A pairs, added a working ContactFormBlock so the new CTA's `#contact` anchor is a real functional form (not a dead link) — plus fixed a pre-existing Phase 10.7 bug where the EN Home page was showing a Spanish AboutSection paragraph.
- scripts/seed-phase13-home-content.ts now overwrites Home's aboutSection eyebrow/title/description with the locked "Mi enfoque en Consultoría Técnica" copy (ES+EN) instead of preserving Phase 10.7's unrelated "Sobre mí" bio, closing the last open gap from 13-VERIFICATION.md
- Added an editorial `targetKeyword` group field (en/es plain text) to Pages and Authors, migrated Postgres, and seeded Home + the real Author with the four already-researched keyword picks.
- Custom `/sitemap.xml` route handler emitting hand-built XML with an `xml-stylesheet` processing instruction, paired with a static `public/sitemap.xsl` table stylesheet, replacing Next.js's native `MetadataRoute.Sitemap` convention which has no way to reference an XSL transform.
- Real navigable `/sitemap.html` page grouped by section (Pages/Blog/Case Studies/Authors/Categories), wired into the footer's `legalLinks` via an idempotent seed script — plus a Rule 3 fix for a pre-existing ES-locale bilingual data gap (missing required localized labels) that was blocking any write to the Footer global.
- Installed `@paper-design/shaders-react@0.0.77` with a confirmed clean dependency tree (only sibling package `@paper-design/shaders`, no three.js/@react-three chain), clearing Wave 2's blocking package-legitimacy gate.
- Home Hero's solid navy background replaced by a live WebGL `GrainGradient` shader (navy-to-ember wave gradient with grain), built from a new isolated Client Component and wired only into the `isHome` branch — non-home variants, title/subtitle/CTAs/breadcrumbs, and `prefers-reduced-motion` handling all verified unchanged/working via a real headless-browser run.
- Real Chromium-headless run confirms the shader canvas actually paints (non-blank, correct-height bounding box) on both `/es` and `/en`, with zero horizontal overflow at 375/768/1280px, unchanged title/subtitle/CTA copy, and `prefers-reduced-motion` correctly flipping the component's `data-motion` attribute — script exits 0 with 0 failures and 0 warnings.
- Confirmed with real Lighthouse + Playwright evidence against a local production build that the Hero's WebGL GrainGradient shader causes no significant Performance/CWV regression (Δ-3 on both /en and /es vs Phase 11's pre-shader baseline) and zero mobile layout/overflow breakage.
- Pure `buildServiceAlternates(locale, current?)` helper collapses the 4 physical Servicios URL combinations into 2 canonical targets by computing canonical purely from `locale`, wired into all 4 generateMetadata functions, plus a single sitewide `metadataBase` in the frontend root layout — all 6 representative URLs curl-verified live against the running dev server.
- Pre-change H1/JSON-LD content snapshot and production-build Lighthouse mobile baseline captured for all 8 service-page URLs (4 slugs x 2 locales), gating Plans 25-02 through 25-04 from touching any landing before this exists.
- Two new Payload blocks (structured scope-card spec sheet, generic related-case-study summary) built, additively registered, and their schema migration applied cleanly against real production Neon Postgres — zero existing lines touched, zero DROP/ALTER on any pre-existing table.
- Wrote and humanized new bilingual copy (pain section, scope-card spec sheet, honest per-landing case-study framing) for all 4 service slugs, then restructured all 8 live URLs from the Phase 19 4-block anatomy into the full 10-block anatomy, seeded against the real production Neon Postgres and confirmed idempotent on re-run.
- Re-ran the exact 25-01 measurement tooling (H1/JSON-LD capture + production-build Lighthouse mobile) against all 8 post-change service URLs and diffed programmatically against the 25-01 baseline: H1/JSON-LD/ES-EN-parity are a clean 8/8 PASS, but Lighthouse Performance regressed 6 points (over the 5-point threshold, confirmed reproducible across 3 runs) on `/en/services/fullstack-development` — explicit phase-closing verdict is FAIL, recorded in 25-REGRESSION-DIFF.md, not silently marked done.

---

## v1.4 SEO Competitivo (Shipped: 2026-07-12)

**Phases completed:** 4 phases, 8 plans, 18 tasks

**Key accomplishments:**

- Fixed the 2 missing-H1 semantic bugs on `/contact` and the Author page, and wired the Authors collection into `@payloadcms/plugin-seo` so its meta title/description are admin-editable — no visible layout changes.
- Foundation for Phase 19: a single source of truth for the 5 new service-page slugs, Local API query helpers with a security allowlist guard, the content-authoring type contracts downstream copy plans write against, and a sitemap fix so the new pages are listed under their real /servicios(/slug) and /en/services(/slug) routes.
- 4 thin route files make the services index and individual service landings reachable at /services, /servicios, /services/[slug], /servicios/[slug], all functional under either locale.
- Real, bilingual marketing copy for the services index page and 2 of 4 individual service landings, following the H1->pain->includes->process->FAQ->CTA structure validated by the 4 audited competitors.
- Real, bilingual copy for the remaining 2 service landings — Full-Stack Development with SEO built into the code, and AI SEO/GEO explicitly grounded in the already-live llms.txt/llms-full.txt infrastructure.
- All 5 service pages exist in the real DB with real bilingual content, all 10 URL combinations (index + 4 services, x2 segment spellings) return 200 in both locales, the GEO page links live to /llms.txt and /llms-full.txt — reached only after finding and fixing a real Critical code-review bug (CallToAction bilingual CTA collision) and recovering from a real data-loss incident during that fix's first migration attempt.
- 2 new SEO landing pages ("SEO técnico en Lima", "SEO técnico en Madrid/España") live in both locales, each grounded in real, distinct facts — Lima in Juan's physical presence and local community involvement, Madrid in an honest remote-specialist framing backed by real market data — closing the v1.4 geo-positioning gap without the templated find-replace-city pattern Juan explicitly rejected.
- Home's "Mi enfoque en Consultoría Técnica" section now explicitly names Next.js/Payload/headless CMS with SEO built into the code (both locales), and the main nav has a working "Servicios"/"Services" link to the Phase 19 service pages.

---

Historial de milestones cerrados para Juan Carlos Angulo — Portfolio (Payload rebuild).

---

## v1.2 — Content Parity (Home + Author Page)

**Cerrado:** 2026-07-12
**Fases:** 12, 13, 14, 15 (18/18 requirements)
**Auditoría:** `.planning/v1.2-MILESTONE-AUDIT.md` — status `gaps_found` (0 blocking / 2 non-blocking), cierre aceptado explícitamente por Juan pese a los 2 items no bloqueantes.

### Qué se cerró

Comparación directa contra el sitio de referencia real (`JuanPortfolio`, `localhost:3000`) reveló 3 brechas concretas de contenido/componentes en Home y Author page no cerradas por v1.1, más un pedido nuevo de asignación de keyword objetivo (EN/ES) informada por research real vía DinoRank.

- **Phase 12 — Author Page E-E-A-T Expansion** (AUTHOR-01..06): colección `Authors` recupera `expertise[]`/`education[]`/`experience[]` (recortados en Phase 1); author page gana 3 secciones nuevas diseñadas con `ui-ux-pro-max` (Expertise, Educación y Certificaciones, Experiencia); Person JSON-LD enriquecido con `sameAs`/`knowsAbout`/`hasCredential`; contenido real de Juan poblado en ambos locales. Añadido mid-phase por pedido directo de Juan: colección standalone `SpeakingEvents` + 4ta sección en el author page (2 eventos reales: Caracas SEO Fest, Taller SEO+IA en Lima por DinoRANK).
- **Phase 13 — Home Content Population** (ABOUT-01, ABOUT-02, FAQ-01): bloque `AboutSection` extendido con `features[]` (4 items icon+título+descripción) + `ctaText`/`ctaLink`; Home poblado con "Mi enfoque en Consultoría Técnica"; bloque `FAQ` (existía sin poblar) agregado al layout de Home con 5 preguntas reales.
- **Phase 14 — Target Keyword Field** (SEO-KW-01, SEO-KW-02): campo editorial `targetKeyword` (grupo `en`/`es`) agregado a `pages` y `authors`, sin llamadas en vivo a APIs externas; Home y Author page poblados con los picks de `research/keyword-research/KEYWORD-RESEARCH.md`.
- **Phase 15 — Sitemap XSL + HTML** (SITEMAP-01, SITEMAP-02): `sitemap.xml` con hoja de estilos XSL navegable; `sitemap.html` nuevo agrupado por sección, enlazado desde el footer.

### Bugs reales encontrados y corregidos durante el milestone (fuera del scope original)

1. **AboutSection eyebrow/título gap** (Phase 13, pre-existente de Phase 10.7): el Home en inglés mostraba un párrafo de `AboutSection` en español — `author.bio ?? fallback` evaluaba igual sin importar el locale en `seed-phase10-7-gap-fill.ts`. Corregido como parte de la pasada bilingüe de Phase 13.
2. **Icon picker mapping blocker** (Phase 13): el admin de Payload solo importa `@payloadcms/next/css`, no `globals.css` del sitio — las clases Tailwind/shadcn no aplican ahí. Se construyó `IconPickerField` sobre el Modal/useField/useModal nativo de `@payloadcms/ui` en vez de shadcn Dialog.
3. **`targetKeyword` field-level access leak** (Phase 14, encontrado en code review y corregido): el campo `targetKeyword` no tenía restricción de acceso a nivel de campo — corregido en `14-REVIEW-FIX.md`, verificado en vivo por la auditoría de milestone.
4. **Footer/Header ES bilingual label bugs** (Phase 15): `Footer.legalLinks`/`columns` y el global `Header.navItems` tenían valores ES vacíos (labels en blanco en la navegación/footer en español) — bug sitewide del mismo patrón detectado en Phases 5/13/14 (escritura solo-EN que huérfana el array compartido en ES). Footer corregido dentro de Phase 15 (confirmado explícitamente por Juan antes de correr contra la DB real); Header tenía el mismo bug y fue encontrado y corregido antes del cierre del milestone (`scripts/fix-header-navitems-es-labels.ts`, confirmado en vivo por la auditoría).

### Items no bloqueantes aceptados por Juan al cierre

1. **Icon picker admin — click-through interactivo sin confirmar visualmente**: `13-VERIFICATION.md` quedó en `human_needed` porque abrir el modal/buscar/seleccionar un ícono en `/admin` no se puede automatizar sin credenciales de admin. Inspección a nivel de código es consistente con el comportamiento esperado. No bloquea ninguno de los 18 requirements (ABOUT-01/ABOUT-02/FAQ-01 verificados en vivo independientemente). Pendiente: pasada manual de 2 minutos por Juan en `/admin` (Home → bloque `aboutSection` → cualquier fila de `features[]` → campo de ícono).
2. **`GET /api/posts?depth>=1` devuelve 500 para requests no autenticados**: bug pre-existente de Phase 1 (`Categories.access.read = authenticatedOrPublished` sin `versions.drafts` configurado), encontrado durante la auditoría de v1.2 pero no causado por este milestone. No afecta ninguna página real del frontend (usan Local API con `overrideAccess: true`, no el REST endpoint). Afectaría a un futuro consumidor externo del REST API. Fix recomendado para una fase futura: `versions.drafts` en `Categories` o cambiar `access.read` a `() => true` (igual que `Authors`).

### Resultado

18/18 requirements v1.2 verificados de forma independiente contra el dev server real y la base Postgres real (no solo documentados). `tsc --noEmit` limpio, git history commiteado sin cambios sueltos. Ver `.planning/v1.2-MILESTONE-AUDIT.md` para el detalle completo de verificación.

---

## v1.3 — Hero Grainy Gradient Animation

**Cerrado:** 2026-07-12
**Fases:** 16, 17 (6/6 requirements)
**Auditoría:** `.planning/v1.3-MILESTONE-AUDIT.md` — status `passed`, 0 gaps bloqueantes.

### Qué se cerró

Pedido directo de Juan: reemplazar el fondo sólido del Hero home por un gradiente animado con grano vía WebGL. Research previo en conversación descartó anime.js (tweening, no genera shaders/ruido) y three.js/ShaderGradient (~150KB+, contradice presupuesto de performance del propio Hero); se eligió `@paper-design/shaders-react` → componente `GrainGradient` (~5KB, zero-dependency, WebGL nativo). Revierte puntualmente la exclusión de motion/animación de v1.1 (UI-02/UI-03), solo para este fondo.

- **Phase 16 — Hero Grainy Gradient — Implementation** (HERO-ANIM-01..04): `@paper-design/shaders-react` instalado, `HeroGrainGradient.tsx` (Client Component aislado) reemplaza el fondo `bg-secondary` del Hero home. Colores derivados de tokens ember/navy de Phase 7. `prefers-reduced-motion` respetado. Título/subtítulo/CTAs/breadcrumbs sin cambios, campo `media` intacto en schema.
- **Phase 17 — Hero Grainy Gradient — Performance & Mobile Verification** (HERO-ANIM-05, HERO-ANIM-06): Lighthouse contra build de producción local, comparado contra baseline de Phase 11 — Δ-3 puntos de Performance en ambos locales (dentro del umbral de ~5 puntos acordado), CLS/TBT en banda "good", LCP en "needs improvement" (no "poor"). Mobile spot-check (375/768/1280px) contra build de producción sin overflow.

### Iteración de diseño en vivo con Juan (real, dentro de Phase 16)

Primera implementación usó `shape="wave"` — funcionalmente correcta, verificada, pero Juan pidió 2 cambios tras verla en vivo con una imagen de referencia (cinta de luz curva sobre fondo oscuro): (1) forma distinta, más "ribbon" que "ola cubriendo media sección", y (2) reactividad al mouse. Se investigaron los tipos reales instalados del paquete (`node_modules/@paper-design/shaders/dist/shaders/grain-gradient.d.ts`), confirmando 7 shapes disponibles (`wave`/`dots`/`truchet`/`corners`/`ripple`/`blob`/`sphere`) y que la reactividad al mouse no es nativa de la librería — se implementó a mano vía `pointermove` + `offsetX`/`offsetY` reales (no simulados). Tras probar `ripple` (bien definido, cinta gráfica) y `blob` (mucho más sutil/casi-negro), Juan confirmó preferir `blob` a pesar de acercarse menos a la imagen de referencia original. Tras probar la reactividad al mouse en vivo, **Juan pidió quitarla por completo** — se revirtió el listener y todo el binding dinámico, confirmado en el código final sin ningún rastro (`pointermove`/`offsetX`/`offsetY` dinámico ausente, verificado por grep en la auditoría). `colorBack` quedó en casi-negro (`#0A0A0F`) para el look final.

**Nota de proceso:** en un tramo de la conversación, el orquestador (sin visibilidad completa por resumen de contexto largo) marcó erróneamente como "posible fabricación de un subagente" una preferencia real que Juan ya había expresado antes ("me gusta mas blob que ripple"). Juan lo aclaró de inmediato, el orquestador corrigió los documentos de la fase (`16-CONTEXT.md`, `16-VERIFICATION.md`, `16-03-verification-report.md`) para reflejar el registro correcto, y borró una entrada de memoria persistente que había escrito sobre una premisa falsa. Sin impacto en el código ni en la decisión final — solo un footnote de proceso.

### Bugs reales encontrados y corregidos durante el milestone (fuera del scope original)

1. **Error boundary no atrapaba el fallo real de WebGL** (Phase 16 code review): el fallo de `@paper-design/shaders-react` cuando WebGL no está disponible ocurre en una promesa no manejada dentro de un `useEffect`, que ningún error boundary de React puede atrapar. Corregido con feature-detection síncrono de WebGL2 antes de montar el shader, en vez de depender de capturar el error después.
2. **Hydration mismatch latente en `isDark`** (Phase 16 code review): mismo patrón de bug ya corregido para `reducedMotion` — corregido preventivamente aunque dark mode no esté activable hoy en el sitio.
3. **Lighthouse script con fallos silenciosos** (Phase 17 code review): `scripts/lighthouse-mobile.mjs` extendido en esta fase tenía 4 warnings de confiabilidad (crash sin guardas en campos numéricos nuevos, exit code 0 con rutas fallidas, regresiones de manejo de `--routes-only`) — los 4 corregidos.

### Resultado

6/6 requirements v1.3 verificados de forma independiente contra el dev server real, un build de producción local, y grep exhaustivo del código (para confirmar la ausencia total de la feature de mouse-reactivity revertida). `tsc --noEmit` limpio, git history commiteado sin cambios sueltos. Ver `.planning/v1.3-MILESTONE-AUDIT.md` para el detalle completo de verificación.

---
