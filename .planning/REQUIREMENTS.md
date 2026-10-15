# Requirements: Rediseño Visual v3 (mockups HTML)

**Defined:** 2026-10-15
**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO, en contenido y en ejecución técnica (rendimiento y SEO impecables).

## v1 Requirements

Alcance del milestone v2.3: mockups HTML estáticos en `designs/redesign-v3/`. Nada de este milestone toca `src/`, Payload, schema ni base de datos.

### Sistema visual (SYS)

- [ ] **SYS-01**: Juan puede abrir `designs/redesign-v3/system.html` y ver los tokens del sistema: paleta (negro tinta `#0B0B12`, gradiente grainy violeta `#5B3DF5` a coral `#FF4D6D` a ámbar `#FFB020`, verde fósforo `#B6FF3B` solo para ASCII y estados), tipografía y escala de espaciado.
- [ ] **SYS-02**: El sistema documenta cada par texto/fondo con su ratio de contraste calculado y todos cumplen WCAG 2.2 AA.
- [ ] **SYS-03**: Existe una biblioteca de componentes en HTML (botones, cards, badges, nav, footer, formulario, bloque terminal CRT, bloque ASCII) con estados hover, focus, disabled y reduced-motion.
- [ ] **SYS-04**: Cada efecto inspirado en React Bits (grainy gradient, pattern waves, CRT warp, micro slats, pixel, ASCII) está identificado contra el catálogo real de reactbits.dev, con nombre exacto del componente de origen y su costo de peso.
- [ ] **SYS-05**: Cada efecto tiene un fallback estático en CSS (gradiente + ruido SVG) que se ve bien sin JavaScript y es lo que ve mobile, `prefers-reduced-motion` y `saveData`.

### Home (HOME)

- [ ] **HOME-01**: Juan puede abrir `designs/redesign-v3/home.html` en desktop y mobile y ver la home completa con todas las secciones actuales (hero, servicios, case studies, websites, about, testimonios, FAQ, contacto).
- [ ] **HOME-02**: El primer viewport muestra un H1 real en HTML sobre gradiente grainy, un bloque ASCII decorativo `aria-hidden` y un CTA de contacto visible sin scroll.
- [ ] **HOME-03**: El contenido es el de la home actual en EN y ES, sin cifras, clientes ni credenciales inventadas; los datos faltantes quedan visibles como pendientes.
- [ ] **HOME-04**: Juan puede alternar EN/ES en el mockup con paridad total de contenido.

### Performance y accesibilidad (PERF)

- [ ] **PERF-01**: Cada mockup activa como máximo 1 efecto WebGL/canvas a la vez y 2 por página; el resto es CSS o SVG.
- [ ] **PERF-02**: Todo efecto pesado se carga después de LCP y solo cuando entra al viewport, y se pausa al salir.
- [ ] **PERF-03**: Lighthouse sobre cada mockup (servido localmente) reporta performance mobile >= 90, CLS 0 y LCP < 2.0 s, con el reporte guardado en `designs/redesign-v3/reports/`.
- [ ] **PERF-04**: Cada mockup pasa las reglas de A11Y.md: H1 único, landmarks, foco visible, objetivos táctiles, `prefers-reduced-motion`, ASCII decorativo oculto a lectores de pantalla.

### Resto de páginas (PAGE), sujeto a aprobación de Juan sobre la home

- [ ] **PAGE-01**: Mockups de servicios (índice + una landing representativa) y de las landings locales Lima y Madrid.
- [ ] **PAGE-02**: Mockups de blog (listado + detalle) y case studies (listado + detalle), con modo lectura donde el efecto cede ante el texto.
- [ ] **PAGE-03**: Mockups de autor, contacto, websites (listado + detalle), stack y búsqueda.
- [ ] **PAGE-04**: Mockups de privacy y terms, más un índice `designs/redesign-v3/index.html` que enlaza todas las páginas.

## v2 Requirements

- **IMPL-01**: Implementar el sistema aprobado en Next.js + Payload (milestone posterior, requiere aprobación explícita de Juan sobre los mockups).
- **IMPL-02**: Migrar los bloques de `src/blocks` al nuevo sistema visual.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cualquier cambio en `src/`, Payload, colecciones, schema o DB | Juan pidió ver la visión primero en HTML; la base es la de producción |
| Reemplazar fuentes de contenido o copy factual | Es un rediseño visual, no editorial |
| Dependencia nueva en `package.json` | Los mockups son archivos estáticos y no deben alterar el proyecto |
| Implementación de React Bits en el proyecto | Llega con el milestone de implementación |
| Tienda Polar y productos digitales | Pertenece al milestone v2.2, en cola |

## Traceability

Cada requirement pertenece a exactamente una fase. PERF-01 a PERF-04 se establecen y miden en Phase 52 sobre la home y las Phases 53 a 55 los heredan como criterio de aceptación por página.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYS-01 | Phase 51 | Pending |
| SYS-02 | Phase 51 | Pending |
| SYS-03 | Phase 51 | Pending |
| SYS-04 | Phase 51 | Pending |
| SYS-05 | Phase 51 | Pending |
| HOME-01 | Phase 52 | Pending |
| HOME-02 | Phase 52 | Pending |
| HOME-03 | Phase 52 | Pending |
| HOME-04 | Phase 52 | Pending |
| PERF-01 | Phase 52 | Pending |
| PERF-02 | Phase 52 | Pending |
| PERF-03 | Phase 52 | Pending |
| PERF-04 | Phase 52 | Pending |
| PAGE-01 | Phase 53 | Pending |
| PAGE-02 | Phase 54 | Pending |
| PAGE-03 | Phase 55 | Pending |
| PAGE-04 | Phase 55 | Pending |

**Cobertura:** 17/17 requirements mapeados, 0 huérfanos, 0 duplicados.

---
*Requirements defined: 2026-10-15*
