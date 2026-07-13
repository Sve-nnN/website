# Requirements: Juan Carlos Angulo — Portfolio (Payload rebuild)

**Defined:** 2026-07-13
**Core Value:** El sitio debe demostrar de forma tangible la pericia de Juan como ingeniero de software y experto SEO — tanto en el contenido (case studies, blog) como en la ejecución técnica (rendimiento y SEO impecables). Si el rendimiento o el SEO fallan, el sitio no cumple su propósito.

## v1.6 Requirements — UI/UX Pro Max II: Componentes, Motion y Voz

Requirements para el milestone v1.6. Dos tracks independientes: (1) pasada de diseño + micro-animaciones sobre componentes que v1.5 no tocó, (2) humanización de todo el copy real de la DB en la voz de Juan. Ver `.planning/research/SUMMARY-v1.6.md` para el detalle completo del research.

### UI/UX Polish

- [x] **UIPOL-01**: El bloque CTA (`CallToAction`) deja de ser full-width `vw` — usa el mismo wrapper `Container` que el resto de los bloques del sitio
- [x] **UIPOL-02**: El navbar (`SiteHeader`) gana tratamiento visual pulido (estado de scroll y/o indicador de ruta activa), consistente con los tokens de elevación/motion ya establecidos
- [ ] **UIPOL-03**: Las variantes de Hero `listing`/`post-header`/`case-study-header` quedan visualmente diferenciadas entre sí (hoy son pixel-idénticas salvo breadcrumbs), manteniendo el H1/breadcrumbs/JSON-LD intactos
- [x] **UIPOL-04**: El bloque FAQ gana tratamiento visual pulido (hoy es funcional pero template-default)
- [x] **UIPOL-05**: La sección de clientes (`ClientLogosBlock`) gana tratamiento visual pulido
- [x] **UIPOL-06**: La sección de testimonios (`TestimonialsCarousel`) gana tratamiento visual pulido
- [ ] **UIPOL-07**: La grilla de blog (`/blog`) gana tratamiento visual pulido
- [ ] **UIPOL-08**: La grilla de blog destacados (`FeaturedPostsBlock`) gana tratamiento visual pulido
- [x] **UIPOL-09**: La página de case studies (listado + detalle) gana tratamiento visual pulido, incluyendo trail de breadcrumbs visual real (hoy el detalle solo emite JSON-LD propio, desalineado del helper `buildTrail()` de Servicios) unificado con el mismo patrón de fuente única

### Micro-animaciones

- [ ] **MOTION-01**: Librería `motion` (paquete npm `motion`, vía `LazyMotion`+`m`+`domAnimation`) adoptada como única dependencia de animación del sitio, costo real de bundle verificado contra el build de producción (no solo estimado)
- [ ] **MOTION-02**: Hook compartido `useReducedMotion()` (SSR-safe, sin mismatch de hidratación — mismo patrón ya probado en `HeroGrainGradient`) usado por todo componente animado, respetando `prefers-reduced-motion` de forma consistente
- [ ] **MOTION-03**: Micro-interacciones (scroll-reveal + hover) aplicadas de forma consistente en los componentes de la pasada UIPOL-01..09, siguiendo la estética ya validada del hero de Home
- [ ] **MOTION-04**: Cero regresión de Lighthouse/CWV atribuible a las animaciones nuevas, verificado contra un baseline pre-pase (mismo patrón de gate que v1.5 Phase 25)

### Voz y Humanización de Contenido

- [ ] **VOICE-01**: Auditoría pre-vuelo de todo campo de texto público en cada colección/global de Payload, clasificando localizado vs no-localizado, documentada antes de escribir nada
- [ ] **VOICE-02**: `TestimonialsCarousel.title` migrado a `localized: true` con backfill correcto (migración leída antes de aplicar, aprobación nombrada de Juan) — cierra el patrón de bug repetido 3 veces en v1.5
- [ ] **VOICE-03**: `CaseStudies.services[].service` resuelto de forma locale-segura (fix de schema si aplica, o decisión documentada) — trap nuevo encontrado por el research, sin workaround previo
- [ ] **VOICE-04**: Snapshot completo del copy real actual (no solo metadata) tomado antes de reescribir nada, diffable por Juan y usable como base de rollback más allá del point-in-time restore de Neon
- [ ] **VOICE-05**: Perfil de voz escrito (español neutro, sin voceo, profesional-directo, primera persona con reclamos de credenciales directos estilo Arianna Lupi, framing de CTA colaborativo) derivado del research de tono de Arianna Lupi y Aleyda Solis, usado como brief para la skill `humanizer`
- [ ] **VOICE-06**: Todo el copy real en globals, pages, servicios, posts y case studies reescrito vía skill `humanizer` con el perfil de voz de VOICE-05 — sin em/en dash, sin marcas de escritura de IA
- [ ] **VOICE-07**: Verificación post-sweep: paridad de locale sin campos pisados entre idiomas, JSON-LD sigue válido, `meta.title`/`meta.description` de SEO no rotos, cero regresión contra el snapshot de VOICE-04

## Future Requirements

- Fase 6 (Deploy + Cutover) — sigue en pausa, fuera de scope de v1.6, retoma con el visto bueno explícito de Juan y credenciales reales de Hostinger/DNS/Resend

## Out of Scope

- Reemplazar el shader `HeroGrainGradient` del hero de Home — ya validado en v1.3, esta milestone solo agrega motion al resto de los componentes
- Migrar el listado de Case Studies a `ArchiveBlock` para paridad completa con Blog — señalado por el research como decisión P2, no resuelta acá, no bloquea el polish visual de UIPOL-09
- Reescribir contenido nuevo o expandir copy más allá de humanizar lo ya existente — esta milestone no agrega secciones de contenido nuevas (eso fue v1.2/v1.5), solo pule voz/tono de lo que ya está

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UIPOL-01 | Phase 26 | Done |
| UIPOL-02 | Phase 26 | Done |
| UIPOL-03 | Phase 28 | Pending |
| UIPOL-04 | Phase 26 | Done |
| UIPOL-05 | Phase 26 | Done |
| UIPOL-06 | Phase 26 | Done |
| UIPOL-07 | Phase 28 | Pending |
| UIPOL-08 | Phase 28 | Pending |
| UIPOL-09 | Phase 26 | Done |
| MOTION-01 | Phase 27 | Pending |
| MOTION-02 | Phase 27 | Pending |
| MOTION-03 | Phase 28 | Pending |
| MOTION-04 | Phase 28 | Pending |
| VOICE-01 | Phase 29 | Pending |
| VOICE-02 | Phase 29 | Pending |
| VOICE-03 | Phase 29 | Pending |
| VOICE-04 | Phase 29 | Pending |
| VOICE-05 | Phase 29 | Pending |
| VOICE-06 | Phase 31 | Pending |
| VOICE-07 | Phase 31 | Pending |
