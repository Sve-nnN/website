# Phase 49: Captura de Email (Resend, env-gated) - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning
**Mode:** Discuss directo con Juan (lead magnet + ubicación del bloque, no smart-discuss con defaults fabricados)

<domain>
## Phase Boundary

Un visitante deja su email en un bloque inline (nunca popup ni modal) dentro del rich text de posts, lo confirma por un doble opt-in implementado en el propio sitio, y recibe un lead magnet por una URL firmada de Cloudinary que caduca — sin JavaScript de cliente, y degradando limpio mientras `RESEND_API_KEY` fuera un placeholder (ya dejó de serlo: Juan configuró la key real el 2026-09-07).

Queda fuera: unificar esta lista con la del auditor (nota v2.2, decisión de arquitectura de datos personales, no de esta fase), cualquier tienda o venta (v2.2, MAIL-05 solo prepara el terreno con helpers separados).

</domain>

<decisions>
## Lead magnet
- Juan no tenía un archivo armado — lo genera Claude. Contenido: checklist de auditoría SEO técnica, basado en las categorías típicas que Juan mismo ya usó en la auditoría SEO de agosto de este mismo sitio (research/ de este repo): rastreo/indexación, rendimiento/CWV, datos estructurados, mobile/accesibilidad, seguridad/canonicalización.
- **No inventar números específicos del auditor real** (auditor.juan-tech.com) que Claude no conoce — el checklist es contenido propio de Juan sobre SEO técnico en general, no una copia de los checks internos del auditor. Evitar cualquier frase que implique "esto es exactamente lo que audita mi herramienta" con precisión que no está verificada.
- Formato: PDF simple, generado a partir de contenido en Markdown/HTML — sin diseño elaborado, prioriza contenido honesto y accionable sobre estética. Subido a Cloudinary por Claude como parte de la ejecución (recurso privado, servido solo vía URL firmada).
- Bilingüe: ES y EN, dos archivos separados (o el mismo archivo con ambos idiomas, a decidir en planning — mientras la URL firmada por locale sea inequívoca).

## Ubicación del bloque de captura
- Inline dentro de `posts.content`, mismo patrón de bloque reusable que `AffiliateInlineBlock` (Phase 48) — el blog es donde ya hay tráfico orgánico real medido en el baseline de Phase 45.
- No en footer, no en `/stack`, no como página dedicada — decisión explícita de Juan.

## Reconciliación con el sistema de newsletter existente (hallazgo del research)
- Ya existe en producción, de una tarea quick del 2026-08-20: colección `Subscribers`, `subscribeAction`, `/api/newsletter/confirm`, `/unsubscribe`, bloque `NewsletterBlock` — pero ese formulario es `'use client'` (sí emite JS), incompatible con MAIL-01.
- **Decisión de Juan**: reusar la tabla `Subscribers` existente (migración aditiva sobre ella, no una tabla paralela), pero el bloque inline nuevo (`EmailCaptureBlock`, en posts) usa su propia Server Action nueva sin JavaScript de cliente — no tocar `NewsletterForm.tsx` ni su flujo `'use client'` actual. Los dos sistemas comparten la tabla de suscriptores pero tienen entry points de captura separados.
- PDF bilingüe: **dos archivos separados** (uno ES, uno EN), no un único PDF con ambos idiomas — más simple de generar y servir con URL firmada inequívoca por locale.

### Claude's Discretion
- Copy exacta del bloque de captura (heading, CTA, microcopy de privacidad — reusando el disclosure/`/privacy` ya construido en Phase 46).
- Redacción completa del checklist (contenido real y honesto, sin fabricar credenciales o números no verificados).
- Diseño exacto del PDF (estructura de encabezados, checkboxes de texto plano vs. HTML simple renderizado a PDF).
- Nombre exacto de las colecciones/tablas (`subscribers`, `lead-magnets`) más allá de lo ya fijado en el ROADMAP.
- Mecanismo exacto de generación del PDF (librería a elegir en research — priorizar algo ligero, sin JS de cliente, corrido en build/seed time, no en runtime de request).

</decisions>

<code_context>
## Existing Code Insights

- `src/blocks/AffiliateInlineBlock/` (Phase 48) — patrón de referencia exacto para un bloque inline reusable en `posts.content`, incluyendo el hazard de TDZ/circular-import ya documentado (`richTextBlockConverters.tsx`).
- `research/` de este repo (auditoría SEO de agosto 2026) — fuente real para las categorías del checklist, ya verificadas por Juan en su propio trabajo, no inventadas para esta fase.
- Colección `AffiliateLinks`/`AffiliateClicks` (Phase 46/47) — patrón de migración aditiva a replicar para `subscribers`/`lead-magnets`.
- `/privacy` (Phase 46) — ya cubre Resend como encargado del tratamiento, retención y proceso de baja; el copy del bloque de captura debe referenciarlo, no duplicar la política.

</code_context>

<specifics>
## Specific Ideas

- `RESEND_API_KEY` ya está configurada (real, no placeholder) desde 2026-09-07 — el flujo puede verificarse de punta a punta, no solo en modo degradado. La constraint de "degradar limpio sin la key" sigue siendo un requirement de código (MAIL-04) aunque ahora se pueda probar el camino feliz también.
- `secure-download.ts` y `download-token.ts` deben quedar completamente separados de la lógica de suscripción — MAIL-05 lo exige explícitamente para que v2.2 (tienda) los reutilice sin reescribir nada.
- Página de confirmación del doble opt-in vive dentro de `[locale]`, con `robots: { index: false }`, sin tocar el middleware.

</specifics>

<deferred>
## Deferred Ideas

- Unificar la lista de suscriptores con la del auditor (bases separadas, Prisma vs. Payload) — v2.2.
- Tienda/venta reutilizando `secure-download.ts`/`download-token.ts` — v2.2, esta fase solo deja los helpers listos.

</deferred>
