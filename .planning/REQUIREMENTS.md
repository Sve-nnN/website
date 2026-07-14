# Requirements: Juan Carlos Angulo — Portfolio (Payload rebuild) — Milestone v1.7

**Defined:** 2026-07-13
**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en el contenido como en la ejecución técnica (rendimiento y SEO impecables).

**Fuente:** `designs/current-site-real.pen` (comparado componente por componente contra el código real — ver `designs/DESIGN-SYSTEM-PEN.md`). El .pen replica 1:1 el design system actual salvo 2 componentes nuevos para landing locales.

## v1 Requirements

### Local Landing — Componentes Nuevos

- [ ] **LOCAL-01**: Nuevo variant `local-landing` en `src/blocks/Hero/config.ts` + `Component.tsx` — badge de ciudad (icono map-pin + nombre), anillo decorativo (ellipse con stroke, sin fill), stat inline con check-icon, CTA row. Reusa tokens de color/tipografía/espaciado existentes, sin tokens nuevos.
- [ ] **LOCAL-02**: Nuevo block `LocalProofSection` (Payload block config + componente React) — banda de prueba social localizada: 3 stats numéricos + testimonial card con nombre/negocio local, editable desde admin.
- [ ] **LOCAL-03**: `/seo-tecnico-madrid` usa `Hero` variant `local-landing` con anillo a la derecha, opacity 0.25, CTA row con un solo botón primario.
- [ ] **LOCAL-04**: `/seo-tecnico-lima` usa `Hero` variant `local-landing` con anillo espejado (`flipX`) a la izquierda, opacity 0.35, CTA row con botón primario + botón outline ("Ver casos en Lima").
- [ ] **LOCAL-05**: Ambas landings incorporan `LocalProofSection` con stats/testimonial propios de cada ciudad (contenido real, no placeholder).

### Component Polish Pass (28 componentes existentes)

- [ ] **POLISH-01**: Revisión visual (`ui-ux-pro-max`) de UI primitives — Button/*, Input, Textarea, Badge/*, Tabs, Card — comparando contra su definición en el .pen, aplicando micro-mejoras encontradas.
- [ ] **POLISH-02**: Revisión visual de chrome — `SiteHeader`, `SiteFooter` — contra el .pen.
- [ ] **POLISH-03**: Revisión visual de Hero variants existentes — `home`, `listing`, `post-header`, `case-study-header` — contra el .pen, sin tocar el shader `HeroGrainGradient` de Home (ya validado en v1.3).
- [ ] **POLISH-04**: Revisión visual de bloques de contenido — `CallToAction`, `FAQ Item`, `ContactForm`, `ResultsSection`, `ClientLogosBlock`, `AboutSection`, `ServiceScopeCard` — contra el .pen.
- [ ] **POLISH-05**: Revisión visual de componentes de autoría — `AuthorCard`, `AuthorByline` — contra el .pen.
- [ ] **POLISH-06**: Cada micro-mejora encontrada en POLISH-01..05 queda implementada en código (no solo documentada), o descartada con razón explícita si el .pen y el código ya son visualmente equivalentes.

### Regresión

- [ ] **REG-01**: Baseline de Lighthouse/CWV + verificación de H1/JSON-LD tomado antes de tocar componentes existentes (mismo patrón que v1.5 Phase 25 / v1.6 Phase 28).
- [ ] **REG-02**: Gate de cero regresión de performance/SEO al cerrar el milestone, comparado contra el baseline de REG-01.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Rediseño completo de componentes existentes | El .pen es réplica 1:1 del código, no rediseño — solo polish puntual donde haya diferencias reales |
| Nueva librería de micro-animaciones o cambios a las ya adoptadas en v1.6 (Phases 27-28) | Fuera de scope de v1.7, ya cerrado en v1.6 Track A |
| Tercera ciudad de landing local | El .pen y esta milestone cubren solo Lima/Madrid; avisar si se necesita una tercera |
| Reemplazar `HeroGrainGradient` del Hero de Home | Ya validado en v1.3, no se toca |
| Humanización de copy real (voz/tono) | Es v1.6 Track B (fases 29-31), pausado, retoma después de v1.7 |
| TestimonialsCarousel dentro de página completa, TableOfContentsBlock en contexto real, mobile nav (Sheet), estados hover/focus modelados en Pencil | No construidos en el .pen (fuera de esta pasada de diseño) — si Juan los necesita, requiere iteración nueva del .pen primero |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOCAL-01 | Phase 33 | Pending |
| LOCAL-02 | Phase 33 | Pending |
| LOCAL-03 | Phase 34 | Pending |
| LOCAL-04 | Phase 34 | Pending |
| LOCAL-05 | Phase 34 | Pending |
| POLISH-01 | Phase 35 | Pending |
| POLISH-02 | Phase 35 | Pending |
| POLISH-03 | Phase 35 | Pending |
| POLISH-04 | Phase 35 | Pending |
| POLISH-05 | Phase 35 | Pending |
| POLISH-06 | Phase 35 | Pending |
| REG-01 | Phase 32 | Pending |
| REG-02 | Phase 36 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-13*
*Last updated: 2026-07-13 after roadmap creation (milestone v1.7) — 13/13 requirements mapped to Phases 32-36, 0 orphans*
