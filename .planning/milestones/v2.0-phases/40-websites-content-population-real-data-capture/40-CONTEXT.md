# Phase 40: Websites — Content Population (Real Data Capture) - Context

**Gathered:** 2026-07-14
**Status:** Ready for planning
**Mode:** Interactive (stack confirmed with Juan, one site at a time, per phase's own success criteria)

<domain>
## Phase Boundary

Los 6 sitios reales que Juan construyó existen como documentos completos y verídicos en `Websites` — stack confirmado por Juan sitio por sitio, screenshots reales, y Lighthouse real capturado una sola vez con su fecha, sin ninguna infraestructura de re-auditoría en vivo.

</domain>

<decisions>
## Implementation Decisions

### Stack confirmado por Juan (uno a la vez, 2026-07-14)

| Sitio | Stack (tal como lo dijo Juan) | Clientes match |
|-------|-------------------------------|-----------------|
| ariannalupi.com | Next, Payload CMS, Neon database, Hostinger hosting | id 29 "Arianna Lupi" |
| aprendoclub.com | Next.js + Payload + Neon + Hostinger | id 4 "Aprendoclub" |
| estylopia.com | WordPress + Elementor | id 1 "Estylopia" |
| drmanuelvargashidalgo.com | WordPress + Elementor | id 8 "Dr. Manuel A. Vargas Hidalgo" |
| apturio.com | Next.js + Payload + Neon + Hostinger | id 28 "Apturio" |
| juan-tech.com | Next.js + Payload + Neon + Hostinger | ninguno (sitio propio de Juan, sin doc en Clientes) |

Stack tags van en el campo `stack` (array `{ tag: string }`, no localizado). Sugerido, uno o varios tags por tecnología mencionada (ej. para ariannalupi.com: "Next.js", "Payload CMS", "Neon Postgres", "Hostinger").

### relatedCaseStudy

Se consultó `case-studies` (7 documentos existentes, ids 14-20) — ninguno tiene `client` poblado y ninguno de los títulos/slugs corresponde a estos 6 dominios (son los case studies borrador de Phase 37, en cola, pendientes de anonimización/fix — dominio distinto de negocio). **Ningún match real encontrado.** `relatedCaseStudy` queda vacío en los 6 documentos — no inventar ni forzar una relación que no existe. Si Juan confirma un match real durante la ejecución, poblarlo; si no, dejarlo `null`.

### client

Poblar `client` con el ID de Clientes encontrado en la tabla arriba. `juan-tech.com` queda sin `client` (no existe doc de Clientes para el propio sitio de Juan — es correcto, no crear uno).

</decisions>

<code_context>
## Existing Code Insights

- `scripts/lighthouse-mobile.mjs` — runner de Lighthouse existente, pensado para build local (`--base-url http://localhost:3000`). Para Phase 40 se debe adaptar/reusar el mismo patrón (misma lib: `lighthouse` + `chrome-launcher` + `@puppeteer/browsers`) pero apuntando a la URL EN VIVO de cada uno de los 6 sitios externos, corriendo UNA sola vez por sitio (no infraestructura de re-auditoría).
- No existe MCP tool para `websites` (`findWebsites`/`createWebsites` no están registrados en el server `juan-payload`) — la población debe hacerse vía script `tsx`/`payload run` usando el Local API (`payload.create({ collection: 'websites', ... })`), siguiendo el patrón de los scripts `seed-phase*.ts` existentes en `scripts/`.
- Media/Cloudinary: seguir el pipeline de Media ya existente (`payload.create({ collection: 'media', file: ... })` con el adapter Cloudinary ya configurado) — nunca fetch/iframe en tiempo de request.
- Screenshots full-page: usar Playwright (ya debe estar disponible como dependencia del proyecto — confirmar en package.json durante research) contra la URL en vivo de cada sitio, correr una sola vez, subir el buffer resultante a Media/Cloudinary.
- `Websites` collection (Phase 38): `src/collections/Websites/index.ts` — campos: title, role, industry, year, highlights[], stack[], challenges[], screenshots[](upload), lighthouse{performance,accessibility,bestPractices,seo}, lighthouseCapturedAt (required, sibling to lighthouse group), client (relationTo clientes), relatedCaseStudy (relationTo case-studies), slug.

</code_context>

<specifics>
## Specific Ideas

- 6 documentos reales, uno por dominio: ariannalupi.com, aprendoclub.com, estylopia.com, drmanuelvargashidalgo.com, apturio.com, juan-tech.com.
- Lighthouse corre UNA VEZ contra cada URL en vivo (mobile, mismo patrón que lighthouse-mobile.mjs) — `lighthouseCapturedAt` = fecha real de esa corrida.
- Screenshot full-page real vía Playwright, subido a Cloudinary por el pipeline de Media — no iframe en vivo, no captura en tiempo de request.
- `role`/`industry`/`highlights`/`challenges` se infieren del contenido público de cada sitio (código/copy visible) cuando Juan no los especificó explícitamente — no inventar métricas o afirmaciones no verificables.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
