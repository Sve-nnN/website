# Phase 25: Service-page visual polish - Context

**Gathered:** 2026-07-13
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) + 1 direct question to Juan on a genuine content-honesty ambiguity (case study data availability). Fase de mayor superficie/riesgo del milestone — corre última, con gates explícitos de regresión.

<domain>
## Phase Boundary

Las 4 landings de servicio (`servicios/[slug]` + `services/[slug]`, ES/EN) ganan anatomía visual completa por bloques (H1 → dolor/problema → qué incluye → proceso → prueba social → FAQ → CTA), prueba social reforzada, tarjeta de alcance sin precio, case study relacionado, CTA repetido arriba/abajo — sin perder H1/JSON-LD existente ni regresar Core Web Vitals (SVCPOL-01..09).

</domain>

<decisions>
## Implementation Decisions

### Case study relacionado (decisión directa de Juan, 2026-07-13)
- Solo existe 1 case study real y publicado en la DB (`migracion-ecommerce-nextjs-seo-tecnico`, id 14), con `services[]` vacío — no hay 4 case studies distintos para vincular 1 a 1 por servicio.
- **Juan confirmó explícitamente**: mostrar el mismo case study real en las 4 landings, con framing honesto ("Un caso real de cómo trabajo" / "A real example of how I work" en vez de fingir que es específico de cada servicio). Cero contenido inventado, cero case studies ficticios.
- El componente que renderiza esta sección debe ser genérico (no asumir 1:1 servicio↔case-study) para no bloquear que en el futuro se agreguen más case studies y sí se pueda filtrar por `services[]` real.

### Prueba social reforzada
- Ya existen: 6 `clientes` (logos) vía `ClientLogosBlock` (patrón ya usado en Home) y 1 `testimonial` real vía `TestimonialSection`/`TestimonialsCarousel` (verificar cuál bloque exacto está en uso) — ambos assets reales, cero necesidad de generar contenido ficticio adicional. El único case study real también aporta KPIs cuantificados reutilizables como "resultados" (`results.metrics[]`).
- Reutilizar estos 3 bloques/fuentes existentes (logos + testimonio + KPIs del case study) en vez de inventar nuevo contenido de prueba social — satisface el criterio "testimonios y/o logos y/o resultados cuantificados" (OR, no las tres a la vez son obligatorias, pero como las 3 fuentes ya existen reales, usarlas todas suma sin costo de contenido inventado).

### Anatomía visual / tarjeta de alcance
- "Tarjeta de alcance del servicio" (alcance/resultado/tiempo, sin precio) es contenido nuevo por servicio — debe ser copy real y específico de cada uno de los 4 servicios (no template genérico repetido), grounded en el research de competencia ya citado en ROADMAP.md/PROJECT.md (Arianna Lupi, Aleyda Solis) y en el contenido ya seedeado de cada landing en Phase 19.
- Estructura de bloques por landing debe reusar bloques ya existentes en el repo donde sea posible (Content/Section para dolor-problema/qué-incluye/proceso, FAQ ya existe como bloque, CallToAction ya existe) — evaluar en plan-phase/UI-SPEC si falta algún bloque nuevo (ej. "tarjeta de alcance") o si compone con primitivas shadcn existentes dentro de un bloque Section genérico.

### Humanizer (regla dura, no negociable)
- Todo copy nuevo o reescrito, en ambos idiomas, pasa por la skill humanizer (`~/.claude/skills/humanizer/SKILL.md`) antes de publicarse — sin em/en dash, sin marcas de escritura de IA, voz natural variada. Esto aplica tanto al copy de "dolor/problema"/"qué incluye"/"proceso" como al framing del case study y a la tarjeta de alcance.

### Regresión / baseline
- Antes de tocar las 4 landings, capturar baseline real (Lighthouse mobile + snapshot de H1/JSON-LD actuales) para las 8 URLs (4 slugs x 2 locales) — comparar contra ese baseline al cerrar, no contra una expectativa teórica.
- Ningún cambio debe eliminar o duplicar el H1 único, ni el `BreadcrumbList`/`Person` JSON-LD ya cerrado en Phases 22/23.

### Claude's Discretion
Orden exacto de bloques dentro de cada landing (siempre que respete H1→dolor→qué incluye→proceso→prueba social→FAQ→CTA), nombres de slugs de bloques nuevos si hacen falta, copy exacto de cada sección (grounded en investigación de competencia + contenido ya seedeado, pasado por humanizer), si la tarjeta de alcance es un bloque Payload nuevo o una variante de un bloque existente.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/blocks/FAQ/`, `src/blocks/CallToAction/`, `src/blocks/Content/`, `src/blocks/Section/`, `src/blocks/TestimonialSection/`, `src/blocks/TestimonialsCarousel/`, `src/blocks/ClientLogosBlock/`, `src/blocks/ResultsSection/` — inventario completo de bloques ya existentes, varios directamente aplicables a esta fase sin crear nada nuevo.
- `src/lib/services-data.ts` (`SERVICE_SLUGS`, `getServicePage`, ahora con `overrideAccess: false` per Phase 24 fix) y `src/lib/canonical.ts`/`src/lib/breadcrumbs.ts` (Phases 22/23) — no deben romperse, son las fuentes de H1/canonical/breadcrumb que este phase debe preservar.
- Case study real: `CaseStudy` collection ya tiene `heroMetric`, `kpis[]`, `results.metrics[]`, `client` (relationship a `clientes`) — toda la data para una tarjeta "case study relacionado" ya existe, solo falta el componente que la lea y renderice en el contexto de una landing de servicio (no de su propia página).

### Established Patterns
- Páginas server-side hacen `getPayload`/fetch y pasan a `RenderBlocks` — mismo patrón en las 4 fases previas de este milestone.
- Seed scripts idempotentes por fase (`scripts/seed-phaseNN-*.ts`) — seguir el mismo patrón para poblar el contenido nuevo de las 4 landings.

### Integration Points
- Los 4 `page.tsx` de Servicios (mismos de Phases 22/23/24)
- Layout de cada landing en Payload (poblado vía seed, no admin manual)
- Cualquier bloque Payload nuevo necesita registro aditivo en `Pages/index.ts` + `RenderBlocks.tsx` + `payload generate:types` + migración leída antes de aplicar (mismo protocolo que Phase 24)

</code_context>

<specifics>
## Specific Ideas

- Modelo de case study ya citado en PROJECT.md ("Key Decisions"/"Context"): hero con métrica principal, metadatos, KPIs en tarjetas, "El cliente", "El reto", "La solución", "Resultados", conclusión, CTA doble — este es el patrón de referencia de competencia (ariannalupi.com/casos/) que ya inspiró el modelo de `CaseStudy` collection. La landing de servicio no necesita replicar esto completo, solo mostrar una tarjeta-resumen que enlace al case study real.
- research/SUMMARY.md del milestone (citado en ROADMAP.md línea 17) ya identificó que Arianna Lupi y Aleyda Solis (competencia directa auditada) NO tienen URLs de servicio dedicadas ni breadcrumbs — la arquitectura de landings individuales ya es ventaja estructural; esta fase pule esas landings para que compitan también en profundidad de contenido/prueba social, no solo en arquitectura.

</specifics>

<deferred>
## Deferred Ideas

- Escribir 3 case studies adicionales (uno por servicio restante) para tener vinculación 1:1 real — explícitamente fuera de alcance de esta fase por decisión de Juan (usar el único case study real en las 4, con framing honesto, en vez de inventar contenido).

</deferred>
