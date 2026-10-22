# Roadmap: Juan Carlos Angulo — Portfolio (Payload rebuild)

## Milestones

- ✅ **v1.0–v1.7 UI & Content Foundation** — Phases 1-36 (shipped 2026-07)
- ✅ **v1.8 Case Studies Fix** — Phase 37 (shipped 2026-07)
- ✅ **v1.9 Websites Portfolio** — Phases 38-40 (shipped 2026-07)
- ✅ **v2.0 OG Image & Meta Tags** — Phases 41-43 (shipped 2026-08)
- ✅ **v2.1 Monetización del Sitio (Research + Fundaciones)** — Phases 44-50 (shipped 2026-09-22)
- 🚧 **v2.3 Rediseño Visual v3 (mockups HTML)** — Phases 51-55 (activo, iniciado 2026-10-15)
- 📋 **v2.2 Productos Digitales y Tienda Polar** — en cola, sin fases asignadas todavía (no se renumera)

## Phases

### 🚧 v2.3 Rediseño Visual v3 (mockups HTML) (Phases 51-55) ACTIVO

**Restricción dura del milestone:** todos los entregables son HTML estático bajo `designs/redesign-v3/`. Ninguna fase toca `src/`, Payload, colecciones, schema ni la base de datos. La implementación en Payload es un milestone posterior.

- [x] **Phase 51: Sistema visual** - Tokens, tipografía, componentes base, catálogo de efectos contra reactbits.dev y fallbacks estáticos en `system.html`
- [ ] **Phase 52: Home mockup y gate de revisión** - Home completa en EN/ES con presupuesto de performance y accesibilidad cumplido, más aprobación explícita de Juan antes de seguir
- [ ] **Phase 53: Servicios y landings locales** - Índice de servicios, una landing representativa y las landings locales de Lima y Madrid
- [ ] **Phase 54: Blog y case studies** - Listado y detalle de blog y de case studies, con modo lectura
- [ ] **Phase 55: Páginas restantes e índice** - Autor, contacto, websites, stack, búsqueda, legales e `index.html` que enlaza todo

## Phase Details

### Phase 51: Sistema visual

**Goal**: Juan tiene en `designs/redesign-v3/system.html` un sistema visual completo, medido y con fallbacks, sobre el que se construyen todas las páginas. Los entregables son HTML estático bajo `designs/redesign-v3/` únicamente; no hay cambios en `src/`, Payload, schema ni base de datos.
**Depends on**: Nothing (first phase of v2.3)
**Requirements**: SYS-01, SYS-02, SYS-03, SYS-04, SYS-05
**Success Criteria** (what must be TRUE):

  1. Juan abre `system.html` y ve la paleta (negro tinta, gradiente grainy violeta a coral a ámbar, verde fósforo reservado para ASCII y estados), la tipografía y la escala de espaciado.
  2. Cada par texto/fondo del sistema muestra su ratio de contraste calculado y todos cumplen WCAG 2.2 AA.
  3. La biblioteca de componentes (botones, cards, badges, nav, footer, formulario, bloque terminal CRT, bloque ASCII) muestra estados hover, focus, disabled y reduced-motion que Juan puede probar en el navegador.
  4. Cada efecto (grainy gradient, pattern waves, CRT warp, micro slats, pixel, ASCII) indica el nombre exacto del componente de origen en el catálogo de reactbits.dev y su costo de peso.
  5. Con JavaScript desactivado, en mobile, con `prefers-reduced-motion` o con `saveData`, cada efecto se ve bien con su fallback CSS (gradiente más ruido SVG).

**Plans**: 3 plans

Plans:

- [x] 51-01-PLAN.md: Cimientos (tracer del grainy gradient, fuentes autohospedadas, tokens y tabla de contraste por script)
- [x] 51-02-PLAN.md: Efectos (fallbacks CSS de los 6 efectos y de los 8 adicionales del scout, motor de slot único, catálogo contra reactbits.dev y pesos)
- [x] 51-03-PLAN.md: Componentes con estados, verificación final (chequeo estático, Lighthouse, capturas) y commit de designs/redesign-v3

**UI hint**: yes

### Phase 51.1: Entorno React de mockups con componentes originales de React Bits (INSERTED)

**Goal:** Juan ve los componentes de React Bits tal cual, no aproximaciones. Se monta una app Vite + React + TS aislada en `designs/redesign-v3/app/` (su propio `package.json`, sin tocar el `package.json` ni `src/` del proyecto) con los componentes originales instalados desde el registro de React Bits y una galería `/system` servida en un dev server. Sigue prohibido tocar `src/`, Payload, schema y base de datos.
**Requirements**: REACT-01, REACT-02, REACT-03, REACT-04
**Depends on:** Phase 51
**Success criteria:**

1. `npm install && npm run dev` dentro de `designs/redesign-v3/app/` levanta un dev server y `/system` muestra los componentes originales (Grainient, PatternWaves, CRTWarp, MicroSlats, PixelBlast, PixelCard, GradientASCII, ASCIIText y los del top 8 del scout que Juan elija) con la paleta y los tokens de la fase 51.
2. El `package.json` y `src/` del proyecto no tienen cambios (`git status` limpio fuera de `designs/redesign-v3/`).
3. Una página `/rendimiento` o el propio `/system` registra el build de producción medido con Lighthouse (mobile y desktop) y documenta el peso real de cada componente original frente al porte vanilla de la fase 51.
4. El aviso de licencia MIT + Commons Clause está en `designs/redesign-v3/app/LICENSES.md` y cada componente conserva su cabecera de origen.
5. Se respeta 1 efecto pesado activo a la vez, carga diferida después de LCP, fallback estático y `prefers-reduced-motion`, y Juan puede pausar las animaciones.

**Plans:** 2 plans

Plans:

- [x] 51.1-01-PLAN.md: cimiento Vite + React + TS aislado, instalador del registro, tracer Grainient y 16 originales
- [x] 51.1-02-PLAN.md: galeria /system, medicion Lighthouse y peso, README

### Phase 52: Home mockup y gate de revisión

**Goal**: Juan revisa la home completa en HTML, con el presupuesto de performance y accesibilidad ya cumplido, y decide si la dirección visual avanza al resto de las páginas. Los entregables son HTML estático bajo `designs/redesign-v3/` únicamente; no hay cambios en `src/`, Payload, schema ni base de datos.
**Depends on**: Phase 51
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, PERF-01, PERF-02, PERF-03, PERF-04
**Success Criteria** (what must be TRUE):

  1. Juan abre `home.html` en desktop y mobile y ve todas las secciones actuales (hero, servicios, case studies, websites, about, testimonios, FAQ, contacto); el primer viewport muestra un H1 real en HTML sobre gradiente grainy, un bloque ASCII decorativo `aria-hidden` y un CTA de contacto visible sin scroll.
  2. Juan alterna EN/ES en el mockup y ve el mismo contenido en ambos idiomas, sin cifras, clientes ni credenciales inventadas; los datos faltantes aparecen visibles como pendientes.
  3. La home activa como máximo 1 efecto WebGL/canvas a la vez y 2 en total; cada efecto pesado carga después de LCP, solo al entrar al viewport, y se pausa al salir; el resto es CSS o SVG.
  4. El reporte de Lighthouse mobile guardado en `designs/redesign-v3/reports/` muestra performance >= 90, CLS 0 y LCP < 2.0 s, y la home cumple las reglas de A11Y.md (H1 único, landmarks, foco visible, objetivos táctiles, reduced-motion, ASCII oculto a lectores de pantalla).
  5. **Gate humano:** Juan revisa la home y la aprueba o entrega feedback; el feedback se aplica y se vuelve a presentar dentro de esta fase, y las Phases 53 a 55 no empiezan hasta que Juan apruebe explícitamente.

**Plans**: 7 plans

Plans:

- [x] 52-01-PLAN.md: tracer de la home (ruta `/` y `/en`, hero con H1, ASCII y CTA, Grainient diferido, cabecera y pie, medición Lighthouse del hero)
- [x] 52-02-PLAN.md: guía de voz ejecutable (lint de copy con selftest, parser de pendientes y primitivas compartidas)
- [x] 52-03-PLAN.md: secciones de prueba (clientes, errores reales con commit, casos, websites y testimonio)
- [x] 52-04-PLAN.md: secciones de método (servicios, auditor propio, about, oferta de auditoría y FAQ)
- [x] 52-05-PLAN.md: contacto con formulario sin envío, banda CRTWarp como segundo efecto y pie completo
- [x] 52-06-PLAN.md: verificación de i18n, accesibilidad, presupuesto de efectos y aislamiento, con correcciones
- [ ] 52-07-PLAN.md: medición final, reporte para Juan, README y gate humano (checkpoint de decisión)

**UI hint**: yes

### Phase 53: Servicios y landings locales

**Goal**: Juan ve las páginas de servicios y las landings locales de Lima y Madrid en el sistema visual aprobado en la home. Los entregables son HTML estático bajo `designs/redesign-v3/` únicamente; no hay cambios en `src/`, Payload, schema ni base de datos.
**Depends on**: Phase 52 (aprobación explícita de Juan sobre la home)
**Requirements**: PAGE-01
**Success Criteria** (what must be TRUE):

  1. Juan abre el índice de servicios y una landing de servicio representativa, y ambas usan los tokens y componentes de `system.html` sin estilos ad hoc.
  2. Juan abre las landings locales de Lima y Madrid y cada una se diferencia estructuralmente de la otra, no solo en el nombre de la ciudad.
  3. Las cuatro páginas funcionan en EN y ES con paridad de contenido, sin datos inventados; las estadísticas o pruebas sociales faltantes quedan visibles como pendientes.
  4. Cada página cumple el presupuesto de efectos (PERF-01, PERF-02) y las reglas de A11Y.md, con su reporte de Lighthouse mobile en `designs/redesign-v3/reports/`.

**Plans**: TBD
**UI hint**: yes

### Phase 54: Blog y case studies

**Goal**: Juan ve el blog y los case studies en el sistema aprobado, con una experiencia de lectura donde el efecto visual cede ante el texto. Los entregables son HTML estático bajo `designs/redesign-v3/` únicamente; no hay cambios en `src/`, Payload, schema ni base de datos.
**Depends on**: Phase 52 (aprobación explícita de Juan sobre la home); sin dependencia técnica de Phase 53
**Requirements**: PAGE-02
**Success Criteria** (what must be TRUE):

  1. Juan abre el listado de blog y un detalle de post, y ambos usan los tokens y componentes de `system.html`.
  2. Juan abre el listado de case studies y un detalle de case study, con la estructura de contenido actual (métrica principal, KPIs, cliente, reto, solución, resultados) sin cifras inventadas.
  3. En los detalles de blog y de case study hay un modo lectura: ningún efecto animado corre detrás del cuerpo del texto, solo el fallback estático, y el texto mantiene contraste AA.
  4. Las cuatro páginas funcionan en EN y ES con paridad de contenido, cumplen PERF-01 a PERF-04 y tienen su reporte de Lighthouse mobile en `designs/redesign-v3/reports/`.

**Plans**: TBD
**UI hint**: yes

### Phase 55: Páginas restantes e índice

**Goal**: Juan tiene todas las páginas restantes del sitio como mockups y un índice único desde donde las recorre. Los entregables son HTML estático bajo `designs/redesign-v3/` únicamente; no hay cambios en `src/`, Payload, schema ni base de datos.
**Depends on**: Phase 52 (aprobación explícita de Juan sobre la home); sin dependencia técnica de Phases 53 y 54
**Requirements**: PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):

  1. Juan abre los mockups de autor, contacto, websites (listado y detalle), stack y búsqueda, y todos usan los tokens y componentes de `system.html`.
  2. Juan abre los mockups de privacy y terms, con el texto legal legible y sin efectos animados detrás del cuerpo.
  3. Juan abre `designs/redesign-v3/index.html` y desde ahí llega a cada mockup del milestone (sistema, home y todas las páginas de las Phases 53 a 55) sin enlaces rotos.
  4. Todas las páginas funcionan en EN y ES con paridad de contenido, cumplen PERF-01 a PERF-04 y tienen su reporte de Lighthouse mobile en `designs/redesign-v3/reports/`.

**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 51. Sistema visual | 3/3 | Complete (human_needed) | 2026-10-15 |
| 52. Home mockup y gate de revisión | 0/7 | Planned | - |
| 53. Servicios y landings locales | 0/TBD | Not started | - |
| 54. Blog y case studies | 0/TBD | Not started | - |
| 55. Páginas restantes e índice | 0/TBD | Not started | - |

<details>
<summary>✅ v2.1 Monetización del Sitio (Phases 44-50) — SHIPPED 2026-09-22</summary>

- [x] Phase 44: Decisiones de Monetización (1/1 plans) — completed 2026-08-30
- [x] Phase 45: Baseline de Regresión (3/3 plans) — completed 2026-09-03
- [x] Phase 46: Disclosure Legal + Esquema de Links de Afiliado (2/2 plans) — completed 2026-09-03
- [x] Phase 47: Ruta /go + Fix de Middleware + Registro de Clics (1/1 plans) — completed 2026-09-04
- [x] Phase 48: Página de Stack + Links Inline en Contenido (3/3 plans) — completed 2026-09-05
- [x] Phase 48.5: Auditor Destacado (3/3 plans) — completed 2026-09-07
- [x] Phase 49: Captura de Email (Resend, env-gated) (3/3 plans) — completed 2026-09-08
- [x] Phase 50: Gate de Cierre de Monetización (3/3 plans) — completed 2026-09-10

</details>

<details>
<summary>⏸ Paused / On Hold</summary>

- [ ] Phase 6: Deploy + Cutover (en pausa — pendiente de decisión de infraestructura de Juan)

</details>
