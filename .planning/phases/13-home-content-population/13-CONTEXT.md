# Phase 13: Home Content Population (AboutSection Features + FAQ) - Context

**Gathered:** 2026-07-11
**Status:** Ready for planning

<domain>
## Phase Boundary

`AboutSection` block extendido con `features[]` (4 items: icon+título+descripción) + `ctaText`/`ctaLink`, poblado en Home con la sección "Mi enfoque en Consultoría Técnica". `FAQ` block (ya existe, nunca poblado) agregado al layout de Home con las 5 preguntas reales. Nueva capacidad de admin: selector visual de iconos (popup con grid, no `<select>` plano) para el nuevo campo `features[].icon`.

</domain>

<decisions>
## Implementation Decisions

### Contenido y estructura
- Copy verbatim del sitio de referencia (`localhost:3000`, ya scrapeado): eyebrow "Estrategia y datos. Más allá del código", título "Mi enfoque en Consultoría Técnica", párrafo de descripción, CTA "Hablemos de tu proyecto", 4 features (SEO Técnico / Rendimiento web / Arquitectura escalable / Ingeniería de UX) con su copy exacto
- FAQ: 5 preguntas/respuestas reales ya scrapeadas (diferencia SEO tradicional vs técnico, auditoría vs implementación, stack/plataformas, medición de éxito, proceso para empezar)
- Iconos por feature: `TrendingUp` (SEO Técnico) / `Zap` (Rendimiento web) / `Code` (Arquitectura escalable) / `Monitor` (Ingeniería de UX) — lucide-react, mismo patrón ya usado en `AuthorCard`/`SiteFooter`, sin nueva librería
- CTA del AboutSection → `#contact` (ancla al `ContactFormBlock` ya presente en el home, mismo comportamiento que el sitio de referencia)
- Orden en el home: `AboutSection` (ya poblado desde Phase 10.7) recibe features+CTA in-place, sin mover su posición; `FAQ` se agrega al final del layout, antes del `ContactFormBlock`

### Icon picker de admin (NUEVO — pedido explícito de Juan)
- Cuando un campo de Payload permite elegir un icono, debe abrir un **popup/modal con grid visual de todos los iconos disponibles** para seleccionar, en vez de un `<select>` de texto plano
- Aplica ahora al campo nuevo `AboutSection.features[].icon` (el que dispara este pedido)
- Implementación: componente custom de campo Payload (`admin.components.Field` override) — modal/popup con grid de iconos lucide-react (buscador simple por nombre, preview visual de cada ícono, click para seleccionar), guarda el string del nombre del icono como hoy (compatible con el mapeo `iconMap` ya usado en el frontend)
- **Backlog explícito, NO en scope de esta fase:** `ContactFormBlock.contactInfo[].icon` es el único otro campo icon-select existente en el codebase — queda como candidato a retrofit con el mismo componente en una fase futura, no se toca ahora (evitar scope creep dentro de Phase 13)

### Claude's Discretion
- Diseño visual exacto del popup de iconos (tamaño de grid, columnas, estilo de búsqueda) — usar primitivas shadcn ya disponibles (Dialog/Popover si existen instaladas) y tokens de Phase 7/8
- Set exacto de iconos ofrecidos en el picker — al menos los ya usados en el codebase (Zap, Monitor, Code, TrendingUp, Shield, Rocket, Palette, Lightbulb — mismo set que tenía `AboutWithFeatures` en el sitio viejo) más margen razonable de iconos lucide-react comunes

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/blocks/AboutSection/Component.tsx` — ya renderiza eyebrow/title/paragraphs/photo, se le agrega features grid + CTA button
- `src/blocks/AboutSection/config.ts` — se le agrega `features[]` (icon select/text/textarea) + `ctaText`/`ctaLink`
- `src/blocks/FAQ/config.ts` y `Component.tsx` — ya completos y funcionales (usa `<details>/<summary>` nativo, sin dependencia de Accordion), solo falta poblarse en el home
- Patrón de icon-select existente: `src/blocks/ContactFormBlock/config.ts` (`contactInfo[].icon`, plain `<select>`) — referencia de qué NO replicar (es el caso a retrofittear después)

### Established Patterns
- Seed scripts idempotentes vía Payload Local API (Phase 4, 10.x, 12)
- Iconos lucide-react mapeados por string en un objeto `iconMap` en el componente de render (mismo patrón que `socialIconMap` en `AuthorCard.tsx`)

### Integration Points
- `src/blocks/AboutSection/config.ts` y `Component.tsx`
- `src/blocks/FAQ/` — sin cambios de código, solo contenido via seed
- Seed script nuevo o extensión de uno existente para poblar Home
- Componente custom de admin field (icon picker) — probablemente `src/fields/IconPicker/` o similar, registrado en `admin.components.Field` del campo `features[].icon`

</code_context>

<specifics>
## Specific Ideas

Contenido real fuente exacta (scrapeado de `localhost:3000`, español):
- Eyebrow: "ESTRATEGIA Y DATOS. MÁS ALLÁ DEL CÓDIGO"
- Título: "Mi enfoque en Consultoría Técnica"
- Descripción: "No veo el SEO y el desarrollo web como disciplinas aisladas. Los motores de búsqueda modernos evalúan la limpieza del código, la velocidad de carga y la arquitectura de la información. Mi metodología se basa en auditar y construir soluciones donde la infraestructura técnica se convierte en el motor principal para el crecimiento orgánico, asegurando que tu web no solo funcione perfectamente, sino que domine en los resultados de búsqueda."
- CTA: "Hablemos de tu proyecto" → `#contact`
- Feature 1: "SEO Técnico" — "Optimización profunda de infraestructura, Rendering y esquema (Schema) para maximizar la visibilidad en motores de búsqueda."
- Feature 2: "Rendimiento web" — "Obsesión por el 100/100. Optimización de la ruta crítica de renderizado para tiempos de carga inmediatos."
- Feature 3: "Arquitectura escalable" — "Diseño de sistemas modulares y limpios. Código mantenible que facilita el crecimiento del proyecto sin deuda técnica."
- Feature 4: "Ingeniería de UX" — "Interfaces adaptables y accesibles (A11Y). Desarrollo Mobile-First real, no solo visual, sino funcional."

FAQ (5 preguntas, ES):
1. "¿Cuál es la diferencia entre el SEO tradicional y tu consultoría de SEO Técnico?" — "El SEO tradicional prioriza la redacción de contenido y la adquisición de enlaces. Mi consultoría interviene la infraestructura de la web. Optimizo el Crawl Budget, los patrones de renderizado y la arquitectura de información para resolver cuellos de botella que impiden la correcta indexación de tu sitio."
2. "¿Entregas solo la auditoría o también implementas los cambios en el código?" — "Cubro ambas fases. Detecto las vulnerabilidades de la infraestructura y diseño la solución técnica. Puedo implementar las mejoras directamente en el código base o documentar las tareas para guiar a tu equipo de desarrollo durante la ejecución."
3. "¿En qué stack tecnológico y plataformas te especializas?" — "Trabajo principalmente con arquitecturas modernas y sistemas Headless. Mi enfoque técnico abarca frameworks como Next.js y React, gestores de contenido como PayloadCMS, y plataformas de e-commerce como Shopify y WordPress."
4. "¿Cómo medimos el éxito de las optimizaciones implementadas?" — "Evaluamos el progreso mediante datos objetivos. Monitorizamos la mejora en las métricas de los Core Web Vitals (LCP, INP, CLS) para medir el rendimiento. A nivel de buscadores, medimos la corrección de errores en Google Search Console y el aumento del porcentaje de URLs válidas indexadas."
5. "¿Cuál es el proceso para empezar a trabajar contigo?" — "Recomiendo iniciar con una auditoría de SEO Técnico inicial. Esto me permite evaluar la salud actual de tu infraestructura, identificar bloqueos de renderizado y establecer una hoja de ruta priorizada antes de comprometer recursos de desarrollo."

Traducción EN debe escribirse en el seed script (mismo criterio que Phase 12: traducir, no dejar en español).

</specifics>

<deferred>
## Deferred Ideas

- Retrofit del icon picker visual a `ContactFormBlock.contactInfo[].icon` (campo existente, no tocado en esta fase) — candidato a fase futura o quick-fix posterior

</deferred>
