# Roadmap: Juan Carlos Angulo Portfolio (Payload rebuild)

## Milestones

- ✅ **v1.0 a v1.7 UI & Content Foundation** - Phases 1-36 (shipped 2026-07)
- ✅ **v1.8 Case Studies Fix** - Phase 37 (shipped 2026-07)
- ✅ **v1.9 Websites Portfolio** - Phases 38-40 (shipped 2026-07)
- ✅ **v2.0 OG Image & Meta Tags** - Phases 41-43 (shipped 2026-08)
- ✅ **v2.1 Monetización del Sitio (Research + Fundaciones)** - Phases 44-50 (shipped 2026-09-22)
- 🗄 **v2.3 Rediseño Visual v3 (mockups HTML)** - Phases 51-52 (reemplazado por v2.4 el 2026-11-06; detalle en `.planning/milestones/v2.3-ROADMAP.md`)
- 🚧 **v2.4 Rediseño MUI en producción** - Phases 53-57 (activo, iniciado 2026-11-06)
- 📋 **v2.2 Productos Digitales y Tienda Polar** - en cola, sin fases asignadas todavía (no se renumera)

## Phases

### 🚧 v2.4 Rediseño MUI en producción (Phases 53-57) ACTIVO

**Estrategia del milestone:** rama única `feat/mui-redesign`, preview en `dev.juan-tech.com` (Dokploy), un solo merge a master al final. No conviven Tailwind y MUI en producción.

**Reglas que cruzan todas las fases:**

- Solo migraciones aditivas (`CREATE TABLE`, `ADD COLUMN`, índices nuevos). Cualquier `DROP`, `TRUNCATE`, `delete` o cambio de forma con pérdida de datos necesita la aprobación explícita de Juan por nombre.
- La DB de producción es única. Antes de escribir contenido o correr una migración se ejecuta `node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts` y se confirma que el host es el de Dokploy.
- El preview lee la DB de producción en solo lectura y nunca escribe.
- Cada fase de páginas conserva head, hreflang, canonical y JSON-LD de las páginas que migra. Las fases 54 y 55 hacen revisiones rápidas por página; la verificación formal de SEO, a11y y rendimiento vive en la Phase 57.
- Idiomas EN y ES con paridad, modo oscuro único, WCAG 2.2 AA según A11Y.md.

- [x] **Phase 53: Base del rediseño: rama, preview, tema y shell** - Rama `feat/mui-redesign`, preview seguro en `dev.juan-tech.com`, tema MUI v9 oscuro y shell (nav, footer, idioma, movimiento) conectado a Payload (completed 2026-11-07)
- [ ] **Phase 54: Páginas de conversión y utilidad** - Home, servicios, landings Lima y Madrid, búsqueda, sobre mí, contacto, stack, legales y 404 en MUI desde Payload
- [ ] **Phase 55: Casos, websites, blog y autores** - Las superficies de prueba y contenido editorial en MUI desde Payload, incluidos los 58 posts
- [ ] **Phase 56: Contenido pendiente de Juan** - Resolución de marcadores `{{pendiente}}`, textos CTA, lecciones de casos y texto legal; corre en paralelo y bloquea solo el corte
- [ ] **Phase 57: Gate de calidad y corte a producción** - Gate de SEO, accesibilidad y rendimiento contra el preview, limpieza de Tailwind y shadcn, confirmación explícita de Juan, merge, validación live y rollback documentado

## Phase Details

### Phase 53: Base del rediseño: rama, preview, tema y shell

**Goal**: Juan abre `dev.juan-tech.com` y ve el shell MUI funcionando con datos reales de Payload, sin que el admin ni producción cambien.
**Depends on**: Nothing (first phase of v2.4)
**Requirements**: BASE-01, BASE-02, BASE-03
**Success Criteria** (what must be TRUE):

  1. Juan abre `dev.juan-tech.com`, desplegado desde `feat/mui-redesign`, y la respuesta lleva `noindex` (meta y cabecera `X-Robots-Tag`), su `robots.txt` no permite rastreo y no publica sitemap.
  2. El preview lee la DB de producción sin escribir en ella: la conexión usa credenciales de solo lectura y las rutas que escriben (registro de clics de `/go`, doble opt-in, suscriptores) quedan inertes en el preview.
  3. El tema MUI v9 oscuro con los tokens y Geist del sandbox se aplica en `(frontend)`, y `/admin` de Payload se ve igual que antes, sin estilos de MUI filtrados.
  4. Nav y footer muestran los enlaces de los globals Header y Footer: Juan cambia un enlace en el admin y aparece en el preview tras la revalidación.
  5. El selector de idioma cambia entre EN y ES conservando la ruta equivalente, y el toggle de movimiento pausa las animaciones y recuerda la elección.

**Plans**: 6 plans

Plans:

- [x] 53-01-PLAN.md — Rama feat/mui-redesign, MUI 9.5 con control de legitimidad, tema en (frontend) y capas CSS Tailwind v3 bajo MUI
- [x] 53-02-PLAN.md — Preview de solo lectura en código: PREVIEW_READONLY, noindex, robots, 404 de admin y api, escrituras inertes
- [x] 53-03-PLAN.md — Fundaciones del shell: estado de movimiento, helpers de enlaces y caché con hooks de Header y Footer
- [x] 53-04-PLAN.md — Header y footer MUI conectados a los globals de Payload, selector de idioma y mensajes shell
- [x] 53-05-PLAN.md — Ensamblado del layout: enlace de salto, un solo main, toggle de movimiento y scripts de contrato del shell
- [x] 53-06-PLAN.md — Rol Postgres de solo lectura, DNS y token (pasos de Juan), despliegue en Dokploy y verificación en vivo de los 5 criterios

**UI hint**: yes

### Phase 54: Páginas de conversión y utilidad

**Goal**: Juan recorre en el preview, en EN y ES, las páginas que convierten y las de utilidad (home, servicios, landings locales, búsqueda, sobre mí, contacto, stack, legales y 404) con el diseño MUI y datos de Payload.
**Depends on**: Phase 53
**Requirements**: PAG-01, PAG-02, PAG-06, PAG-07, PAG-08, PAG-09, PAG-11, PAG-12
**Success Criteria** (what must be TRUE):

  1. La home muestra todas sus secciones con datos de Pages y globals: Juan edita un campo en el admin y el cambio aparece en la home, sin datos hardcodeados del sandbox.
  2. El índice de servicios, las cuatro landings de servicio, las landings SEO técnico Lima y Madrid y la búsqueda se renderizan en MUI desde Payload bajo las URLs duales actuales (`/servicios` y `/services`), y la búsqueda devuelve resultados reales.
  3. Sobre mí muestra el timeline y la foto nueva desde Payload; la página nueva llega con una migración solo aditiva y no aparece en el sitio live antes del corte.
  4. Contacto conserva el envío con Resend y el honeypot descarta el spam, con su FAQ en MUI (en el preview el envío es simulado por solo lectura; el correo real se prueba una vez contra producción en la fase 57, desviación aceptada el 2026-11-08); Stack muestra los logos de herramientas y sus enlaces `/go` con la divulgación de afiliación visible y `rel="sponsored"`.
  5. Privacy y Terms muestran el índice lateral, y una URL inexistente muestra la 404 dentro del shell del sitio con estado HTTP 404 real.

**Plans**: 16 plans

Plans:

- [x] 54-01-PLAN.md — 404 dentro del shell con estado real (tracer) y primer despliegue en el preview
- [x] 54-02-PLAN.md — Esquema sombra aditivo: globals home-page y about-page, clientes.onDark, logo del stack y migración leída
- [x] 54-03-PLAN.md — Mensajes de interfaz ES y EN de la fase, guardia de paridad y arnés de render de servidor
- [x] 54-04-PLAN.md — Scripts de datos sombra, fotos y logos del stack con guardias de base y dry-run
- [ ] 54-05-PLAN.md — Primitivas de layout MUI: Section, PageHero, Crumbs, IconTile, ScoreRing, FaqAccordion y aviso de traducción
- [ ] 54-06-PLAN.md — Primitivas de conversión y MuiRichText con índice: marquesina, testimonios, caso, formulario único y cierre
- [ ] 54-07-PLAN.md — Aplicar la migración, sembrar con Juan y despliegue de humo con el esquema nuevo
- [ ] 54-08-PLAN.md — Home primera mitad: Hero, marquesina, Tagline, Vitals y Servicios desde Payload
- [ ] 54-09-PLAN.md — Detalle de las cuatro landings de servicio por ranuras sobre los bloques reales
- [ ] 54-10-PLAN.md — Privacy y Terms con índice lateral sticky
- [ ] 54-11-PLAN.md — Búsqueda con la consulta conservada y vista MUI
- [ ] 54-12-PLAN.md — Contacto con formulario real y FAQ, y Stack con logos y afiliados con divulgación
- [ ] 54-13-PLAN.md — Sobre mí con timeline de @mui/lab (tras checkpoint de legitimidad), foto y enlace de nav solo en el preview
- [ ] 54-14-PLAN.md — Home segunda mitad: Casos, Proceso, Sitios, Sobre mí, Testimonios, FAQ, cierre y los tres bloques existentes
- [ ] 54-15-PLAN.md — Índice de servicios con tabla comparativa y landings SEO técnico Lima y Madrid
- [ ] 54-16-PLAN.md — Contrato por ruta con paridad de SEO, auditoría sin datos del sandbox, batería en vivo y despliegue final

**UI hint**: yes

### Phase 55: Casos, websites, blog y autores

**Goal**: Juan recorre en el preview, en EN y ES, las superficies de prueba y de contenido editorial (casos de éxito, websites, blog y autores) con el diseño MUI y datos de Payload.
**Depends on**: Phase 53 (sin dependencia técnica de la Phase 54; pueden avanzar en paralelo)
**Requirements**: PAG-03, PAG-04, PAG-05, PAG-10
**Success Criteria** (what must be TRUE):

  1. El índice y el detalle de casos de éxito muestran estadísticas, contexto, solución, lecciones aprendidas, casos comparativos y conclusiones desde los campos nuevos de CaseStudies; la migración es solo aditiva y los casos existentes conservan sus datos.
  2. El portafolio de Websites y el detalle de cada sitio se renderizan desde la colección Websites con sus datos reales.
  3. El índice del blog tiene búsqueda, las categorías tienen "ver más" y cada post muestra TOC y progreso de lectura; los 58 posts responden 200 con su rich text completo (bloques de código, FAQ, enlaces de afiliado inline con su divulgación y captura de email).
  4. El índice de autores y el perfil de Juan se renderizan desde Authors, con sus secciones de experiencia, educación, expertise y eventos.

**Plans**: TBD
**UI hint**: yes

### Phase 56: Contenido pendiente de Juan

**Goal**: Juan cierra los textos que solo él puede decidir, para que ningún borrador del sandbox llegue a producción. Esta fase no bloquea el avance técnico de las Phases 54 y 55, pero la Phase 57 no cierra sin ella.
**Depends on**: Phase 53 (el preview permite revisar cada texto en contexto); corre en paralelo a las Phases 54 y 55 y bloquea la Phase 57
**Requirements**: CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):

  1. El HTML renderizado del preview, en EN y ES, no contiene ningún marcador `{{pendiente}}`: la fecha de la marca aprendoclub, el stack de Arianna Lupi, los datos de Loops Growth, la fecha legal y los testimonios tienen el valor que Juan aprobó.
  2. Juan aprueba por escrito el texto de cada CTA y las lecciones aprendidas de cada caso, y el contenido aprobado vive en Payload en lugar del `case-lessons.ts` del sandbox.
  3. Privacy y Terms describen la infraestructura real (hoy Dokploy en lugar de Hostinger) o el texto que Juan confirme, en EN y ES.

**Plans**: TBD

### Phase 57: Gate de calidad y corte a producción

**Goal**: Juan tiene evidencia de que el preview iguala o mejora a producción en SEO, accesibilidad y rendimiento, decide con confirmación explícita si corta, y el sitio live queda validado con una vía de regreso documentada.
**Depends on**: Phase 54, Phase 55 y Phase 56
**Requirements**: SEO-01, SEO-02, SEO-03, CAL-01, CAL-02, CAL-03, GO-01, GO-02, GO-03
**Success Criteria** (what must be TRUE):

  1. Un crawl comparativo preview contra live confirma que cada URL del sitemap conserva title, meta description, canonical, hreflang, Open Graph y JSON-LD idénticos; el único H1 por página y la jerarquía de encabezados se mantienen, y el contenido indexable no disminuye.
  2. Sitemap, robots, `llms.txt`, redirects y revalidación ISR funcionan igual que en producción, verificados con curl contra el preview.
  3. Cada plantilla tiene Lighthouse a11y 100 y revisión manual de teclado según A11Y.md, y su Lighthouse mobile (LCP, CLS, INP) no es peor que el baseline medido contra producción.
  4. El build final no incluye Tailwind ni shadcn/Radix sin usar, y existe un reporte de gate con SEO, accesibilidad y rendimiento contra el preview que Juan puede leer completo.
  5. **Gate humano (GO-02):** Juan da confirmación explícita antes del merge a master; sin esa confirmación no hay merge.
  6. Tras el deploy, el sitio juan-tech.com live pasa el mismo crawl y la misma medición, y queda documentado y probado el rollback (revertir el merge y redesplegar el commit anterior en Dokploy; la DB no necesita regreso porque las migraciones son aditivas).

**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 53. Base del rediseño: rama, preview, tema y shell | 6/6 | Complete    | 2026-11-07 |
| 54. Páginas de conversión y utilidad | 3/16 | In Progress|  |
| 55. Casos, websites, blog y autores | 0/TBD | Not started | - |
| 56. Contenido pendiente de Juan | 0/TBD | Not started | - |
| 57. Gate de calidad y corte a producción | 0/TBD | Not started | - |

<details>
<summary>🗄 v2.3 Rediseño Visual v3 (mockups HTML) - REEMPLAZADO por v2.4 el 2026-11-06</summary>

Los mockups HTML de `designs/redesign-v3/` se sustituyeron por el sandbox MUI aprobado por Juan. Las Phases 51 (Sistema visual), 51.1 (Entorno React de mockups) y 52 (Home mockup) se archivaron; las Phases 53 a 55 de v2.3 nunca se crearon. Detalle completo en `.planning/milestones/v2.3-ROADMAP.md`.

</details>

<details>
<summary>✅ v2.1 Monetización del Sitio (Phases 44-50) - SHIPPED 2026-09-22</summary>

- [x] Phase 44: Decisiones de Monetización (1/1 plans) - completed 2026-08-30
- [x] Phase 45: Baseline de Regresión (3/3 plans) - completed 2026-09-03
- [x] Phase 46: Disclosure Legal + Esquema de Links de Afiliado (2/2 plans) - completed 2026-09-03
- [x] Phase 47: Ruta /go + Fix de Middleware + Registro de Clics (1/1 plans) - completed 2026-09-04
- [x] Phase 48: Página de Stack + Links Inline en Contenido (3/3 plans) - completed 2026-09-05
- [x] Phase 48.5: Auditor Destacado (3/3 plans) - completed 2026-09-07
- [x] Phase 49: Captura de Email (Resend, env-gated) (3/3 plans) - completed 2026-09-08
- [x] Phase 50: Gate de Cierre de Monetización (3/3 plans) - completed 2026-09-10

</details>

<details>
<summary>⏸ Paused / On Hold</summary>

- [ ] Phase 6: Deploy + Cutover (en pausa, pendiente de decisión de infraestructura de Juan)

</details>
