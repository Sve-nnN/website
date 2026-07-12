# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.4 — SEO Competitivo: Auditoría y Optimización

**Shipped:** 2026-07-12
**Phases:** 4 (18-21) | **Plans:** 8 | **Sessions:** 1 (long autonomous run)

### What Was Built
- H1 semántico real en `/contact` y Author page, Authors sumada a `@payloadcms/plugin-seo` (Phase 18)
- Página "Servicios" + 4 landings individuales (Auditoría SEO Técnica, Consultoría SEO, Desarrollo Full-Stack con SEO integrado, SEO para IA/GEO), rutas duales `/servicios`+`/services`, copy bilingüe real, sin precios (Phase 19)
- 2 geo-pages genuinamente diferenciadas: Lima (presencia física real, taller DinoRANK/Arianna Lupi) y Madrid (framing remoto honesto + datos reales de keyword research ES) (Phase 20)
- Home reforzado con el ángulo Next.js/Payload/SEO-en-el-código + link "Servicios" en el nav (Phase 21)

### What Worked
- Reusar la colección `Pages` existente (bloques Hero/Content/FAQ/CallToAction) para páginas de servicio y geo-pages, en vez de colecciones nuevas — cero migraciones de schema en 3 de las 4 fases.
- El patrón de seed script con id-reuse (`reapplyIds`/`upsertPage`) probado en fase 19 se reusó verbatim y sin fricción en fase 20.
- Verificación en vivo (curl contra dev server real + lectura directa de Payload Local API) atrapó bugs reales que un review solo-de-código no hubiera visto (CTA no localizado en fase 19, colisión de label en fase 21).

### What Was Inefficient
- Varios cortes de conexión de API durante ejecución de agentes delegados (código review, planner) causaron trabajo duplicado y reinicios — pasar a ejecución directa en el mismo contexto (sin delegar a sub-agentes y esperarlos) resultó más confiable para el resto del run.
- Fase 19 quedó sin `SUMMARY.md` por plan durante la ejecución — se detectó y corrigió recién en la auditoría de cierre de milestone, no durante la fase misma.

### Patterns Established
- Pre-flight check obligatorio: antes de escribir un seed script que usa un bloque compartido (ej. `CallToAction`), grep del config del bloque para confirmar `localized: true` en cualquier campo que vaya a llevar texto distinto por idioma — evita repetir el incidente de fase 19.
- `Header.navItems` (y cualquier array global no-localizado con sub-campos localizados) requiere filtrar filas existentes por `id` antes de re-appendear en el segundo locale write, o se corre riesgo de colisión de id.
- Regla de Database Safety: aprobación humana explícita y directa en el hilo (no relay) antes de cualquier escritura destructiva contra la DB real; escrituras aditivas/normales corren directo.

### Key Lessons
1. Una migración que localiza un campo con datos existentes SIEMPRE necesita backfill explícito antes del DROP — Payload no lo hace solo, y `payload migrate:create` no lo genera automáticamente.
2. Verificar con curl contra un servidor real (no solo `tsc`/build) es la única forma confiable de atrapar bugs de localización — el build pasa igual aunque el contenido esté mal.
3. Cuando un array field no está localizado a nivel de field (solo sus sub-campos lo están), cualquier script que lo edite por locale debe tratar cuidadosamente el orden de lectura/escritura para no duplicar ni perder filas.

### Cost Observations
- Sesión larga y no interactiva con múltiples delegaciones a sub-agentes (gsd-planner, gsd-code-reviewer, gsd-code-fixer, gsd-integration-checker) y ejecución directa para el resto.
- Notable: los cortes de conexión de API durante agentes delegados fueron el mayor costo de tiempo de la sesión, no el trabajo en sí.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.2 | - | 4 | Content parity, bugs de labels ES vacíos encontrados y corregidos |
| v1.3 | - | 2 | Shader Hero, verificación Lighthouse contra build de producción |
| v1.4 | 1 | 4 | Ejecución autónoma no interactiva de punta a punta; regla de Database Safety introducida tras incidente real |

### Top Lessons (Verified Across Milestones)

1. Bugs de contenido bilingüe (labels ES vacíos, CTA no localizado) son un patrón recurrente en este codebase — cualquier fase que toque un global o colección con arrays compartidos entre locales debe verificar explícitamente el reuso de ids.
2. Migraciones de schema contra la DB real de producción (sin ambiente de staging) requieren revisión humana del SQL antes de aplicar, especialmente para cambios que tocan columnas con datos existentes.
