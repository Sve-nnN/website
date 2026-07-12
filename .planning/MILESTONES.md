# Milestones

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
