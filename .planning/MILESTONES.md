# Milestones

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
