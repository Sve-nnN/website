# Requirements: Rediseño MUI en producción (v2.4)

**Defined:** 2026-11-06
**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO, en contenido y en ejecución técnica (rendimiento y SEO impecables).

## v1 Requirements

Alcance del milestone v2.4: llevar a producción el diseño MUI aprobado por Juan (`designs/design-system-mui/`), conectado a Payload. Rama única `feat/mui-redesign`, preview en `dev.juan-tech.com`, un solo merge a master al final.

### Base e infraestructura (BASE)

- [x] **BASE-01**: Existe la rama `feat/mui-redesign` y un preview en `dev.juan-tech.com` (Dokploy) que lee la DB de producción en solo lectura, con `noindex` y fuera del sitemap.
- [x] **BASE-02**: El tema MUI v9 (solo oscuro, tokens y Geist del sandbox) está montado en el layout de `(frontend)` sin afectar el admin de Payload.
- [x] **BASE-03**: Nav, footer, selector de idioma y toggle de movimiento funcionan con los globals Header y Footer de Payload y con `[locale]` real EN/ES.

### Páginas conectadas a Payload (PAG)

- [ ] **PAG-01**: La home muestra todas sus secciones con datos de Pages y globals.
- [x] **PAG-02**: Servicios (índice y detalle) se renderizan desde Payload.
- [ ] **PAG-03**: Casos de éxito (índice y detalle) muestran estadísticas, contexto, solución, lecciones aprendidas, casos comparativos y conclusiones (campos nuevos en CaseStudies vía migración aditiva).
- [ ] **PAG-04**: Websites (portafolio y detalle) se renderizan desde la colección Websites.
- [ ] **PAG-05**: El blog (índice con búsqueda, categorías con "ver más" y post con TOC y progreso de lectura) sirve los 58 posts con su rich text.
- [x] **PAG-06**: Sobre mí con timeline y foto nueva se renderiza desde Payload (página nueva, migración aditiva).
- [x] **PAG-07**: Contacto conserva el formulario actual (Resend, honeypot) y su FAQ con el diseño MUI.
- [x] **PAG-08**: Stack muestra logos de herramientas y conserva los enlaces de afiliado `/go` con su divulgación.
- [x] **PAG-09**: Privacy y Terms se renderizan con índice lateral.
- [ ] **PAG-10**: Autores (índice y perfil) se renderizan desde la colección Authors.
- [x] **PAG-11**: La 404 vive dentro del shell del sitio y devuelve estado 404 real.
- [x] **PAG-12**: Las landings SEO técnico Lima y Madrid y la página de búsqueda usan el diseño MUI.

### SEO (SEO)

- [ ] **SEO-01**: Cada URL del sitemap conserva title, meta description, canonical, hreflang, Open Graph y JSON-LD idénticos a producción (verificado con un crawl comparativo preview contra live).
- [ ] **SEO-02**: Sitemap, robots, `llms.txt`, redirects y revalidación ISR funcionan igual que hoy.
- [ ] **SEO-03**: Cada página mantiene un único H1, la jerarquía de encabezados y no reduce el contenido indexable actual.

### Accesibilidad y rendimiento (CAL)

- [ ] **CAL-01**: Cada plantilla cumple WCAG 2.2 AA según A11Y.md, con Lighthouse a11y 100 y revisión manual de teclado.
- [ ] **CAL-02**: El Lighthouse mobile de cada plantilla no empeora frente al baseline de producción (LCP, CLS, INP).
- [ ] **CAL-03**: No queda código de Tailwind ni shadcn/Radix sin usar en el bundle final.

### Contenido pendiente de Juan (CONT)

- [ ] **CONT-01**: Juan resuelve los `{{pendiente}}`: fecha de la marca aprendoclub, stack de Arianna Lupi, datos de Loops Growth, fecha legal y testimonios.
- [ ] **CONT-02**: Juan aprueba el texto de los CTA y las lecciones aprendidas de los casos.
- [ ] **CONT-03**: Juan confirma el texto legal (hosting dice Hostinger y hoy usa Dokploy).

### Corte a producción (GO)

- [ ] **GO-01**: Existe un reporte de gate con SEO, accesibilidad y rendimiento contra el preview.
- [ ] **GO-02**: Juan da confirmación explícita antes del merge a master.
- [ ] **GO-03**: Tras el deploy se valida contra juan-tech.com live y queda documentado el rollback.

## v2 Requirements

- **PROG-01**: SEO programático "Quién bloquea a la IA" (backlog, ver memoria backlog-programmatic-ia-bots).
- **LEAD-01**: Mini auditoría de URL y nuevos lead magnets.
- **I18N-01**: Contenido real en inglés para las páginas nuevas.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cambios de schema destructivos | Producción comparte una sola DB; solo migraciones aditivas |
| Modo claro | Juan decidió dejar el sitio siempre en modo oscuro |
| Convivencia gradual Tailwind y MUI en producción | Juan eligió corte total para evitar dos sistemas de diseño |
| SEO programático y nuevos lead magnets | Backlog, no bloquean el rediseño |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BASE-01 | Phase 53 | Complete |
| BASE-02 | Phase 53 | Complete |
| BASE-03 | Phase 53 | Complete |
| PAG-01 | Phase 54 | Pending |
| PAG-02 | Phase 54 | Complete |
| PAG-03 | Phase 55 | Pending |
| PAG-04 | Phase 55 | Pending |
| PAG-05 | Phase 55 | Pending |
| PAG-06 | Phase 54 | Complete |
| PAG-07 | Phase 54 | Complete |
| PAG-08 | Phase 54 | Complete |
| PAG-09 | Phase 54 | Complete |
| PAG-10 | Phase 55 | Pending |
| PAG-11 | Phase 54 | Complete |
| PAG-12 | Phase 54 | Complete |
| SEO-01 | Phase 57 | Pending |
| SEO-02 | Phase 57 | Pending |
| SEO-03 | Phase 57 | Pending |
| CAL-01 | Phase 57 | Pending |
| CAL-02 | Phase 57 | Pending |
| CAL-03 | Phase 57 | Pending |
| CONT-01 | Phase 56 | Pending |
| CONT-02 | Phase 56 | Pending |
| CONT-03 | Phase 56 | Pending |
| GO-01 | Phase 57 | Pending |
| GO-02 | Phase 57 | Pending |
| GO-03 | Phase 57 | Pending |

**Coverage:** 27/27 requirements mapeados, sin huérfanos ni duplicados.

---
*Requirements defined: 2026-11-06*
*Traceability updated: 2026-11-06 (roadmap v2.4, fases 53-57)*
