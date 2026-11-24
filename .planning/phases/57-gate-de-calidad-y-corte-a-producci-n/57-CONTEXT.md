# Phase 57: Gate de calidad y corte a producción - Context

**Gathered:** 2026-11-10 (discuss-phase --auto, modo no interactivo)
**Status:** Ready for planning
**Requisitos:** SEO-01, SEO-02, SEO-03, CAL-01, CAL-02, CAL-03, GO-01, GO-02, GO-03

<domain>
## Phase Boundary

Esta fase entrega evidencia de que el preview (rama `feat/mui-redesign`) iguala o mejora a producción en SEO, accesibilidad y rendimiento. Después Juan decide con confirmación escrita si corta. Si corta, el sitio live queda validado con rollback documentado. Incluye la retirada de Tailwind, shadcn y componentes viejos.

Fuera de alcance: Phase 58 (prueba y confianza, `.planning/phase-56-prep/fase-58-prueba-y-confianza.md`), cualquier rediseño nuevo, UI-SPEC (el diseño es el sandbox aprobado).

La planificación NO ejecuta nada. Nada toca master, ninguna base de datos ni `--env-file=.env` durante la planificación. En la ejecución, los pasos con base de datos o producción son checkpoints de Juan.
</domain>

<decisions>
## Implementation Decisions (auto, recomendadas)

### Gate de calidad contra el preview
- D-01: Paridad SEO de las 169 URLs contra producción con `scripts/verify/53-crawl-parity.mjs` ampliado (title, meta description, canonical, hreflang, OG, JSON-LD, H1 único, jerarquía de encabezados, conteo de palabras indexables). Sitemap, robots, `llms.txt`, redirects y revalidación con curl contra el preview. Reporte legible por Juan (GO-01).
- D-02: Accesibilidad: axe (o Lighthouse a11y) por plantilla más recorrido de teclado automatizado. Lo humano queda listado como checkpoints de Juan: NVDA, VoiceOver, 375/900/1024/1280 px y zoom 200%.
- D-03: Rendimiento: LCP, TTFB, TBT, CLS e INP del preview contra producción en home, una página de servicio y un post del blog (mobile, varias corridas, mediana). El preview no puede ser peor que el baseline (CAL-02).
- D-04: Verificar explícitamente si el rediseño corrige los hallazgos de la muestra `founder/kit-confianza/muestra-auditoria-juan-tech.md`: (a) LCP del blog 9,3 s y TTFB 1,8 a 2,2 s, (b) header `Critical-CH` que causa un 307 interno de reintento, (c) imagen LCP sin `fetchpriority`, (d) 17 posts solo en español con gemelo EN `noindex` y hreflang sin versión inglesa, (e) página de autor de 2,7 MB de HTML. Cada uno es un gate: si el preview no lo corrige, se arregla en esta fase antes del corte, o queda como excepción aceptada por Juan por escrito.
- D-05: Sobras diferidas de las fases 54 y 55 (`deferred-items.md`: IN-01..IN-04 y el resto), comentario del sitemap-data a quitar, gate de revalidación del admin al preview y verificaciones de estilo A7 entran como tareas de limpieza o se descartan con motivo documentado.

### Retirada de Tailwind, shadcn y componentes viejos (CAL-03)
- D-06: Retirar Tailwind, shadcn/Radix y componentes antiguos sin referencias, con `scripts/verify/53-layer-check.mjs` y chequeos de bundle antes y después. Va después del gate de paridad visual y antes del reporte final, en un plan propio, sin cambiar el aspecto.

### Pasos de Juan (checkpoints bloqueantes)
- D-07: Decisiones y aprobaciones pendientes salen de `tsx scripts/verify/56-gate.ts --gate` (tomar el listado vigente; fuente `.planning/phase-56-prep/aprobaciones-juan.md`). Mientras haya ítems abiertos, no hay corte.
- D-08: Prueba real del formulario de contacto, una sola vez contra producción, a `hello@juan-tech.com` (desviación aceptada el 2026-11-08). Checkpoint de Juan.
- D-09: Corrida del cargador del corte `scripts/db/28-phase56-cutover-load.ts --apply` es checkpoint de Juan con aprobaciones nombradas según `56-CUTOVER-HANDOFF.md`. Antes de cualquier escritura se corre `scripts/db/04-which-database.ts` y se confirma que el host es el de Dokploy. Solo se corre con `--env-file` si Juan lo autoriza en el checkpoint; la planificación no lo hace.
- D-10: Backups de base verificados antes del `--apply` (parte del rollback).

### Merge, deploy y post-merge (GO-02, GO-03)
- D-11: Merge a master SOLO con confirmación escrita explícita de Juan. El orden del corte, quién aprueba qué y el rollback salen de `56-CUTOVER-HANDOFF.md`.
- D-12: Verificación del deploy de la app `web` de producción en Dokploy por la API (credenciales en `~/.config/juantech/dokploy.env`, nunca imprimir). Revisión de disco del VPS antes de cada build (llegó a 95% el 2026-11-10; `docker image prune -a` liberó 12 GB).
- D-13: Validación live posterior al deploy con el mismo crawl y la misma medición, reenvío de sitemap en Search Console, plan de monitoreo de 404 e indexación (ventana definida en el plan).
- D-14: Rollback documentado y ensayado en lo posible: revertir el merge y redesplegar el commit anterior en Dokploy; backups de DB. Las migraciones son aditivas, pero el cargador escribe contenido, por eso hay backup previo.
- D-15: La fecha de corte D = 2026-12-01 es una propuesta, no un compromiso.

### Claude's Discretion
Herramientas concretas de medición (Lighthouse CLI, axe-core, Playwright), formato del reporte y nombres de scripts nuevos (prefijo `57-`), siguiendo el patrón de `scripts/verify/`.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` (Phase 57), `.planning/REQUIREMENTS.md`
- `.planning/phases/56-contenido-pendiente-de-juan/56-CUTOVER-HANDOFF.md` y summaries 56-12, 56-14
- `.planning/phases/54-paginas-de-conversion-y-utilidad/deferred-items.md`, `.planning/phases/55-casos-websites-blog-y-autores/deferred-items.md`
- Artefactos de fases 53 a 56 (CONTEXT, VERIFICATION, REVIEW, scripts `scripts/verify/53-*` a `56-*`)
- `.planning/phase-56-prep/aprobaciones-juan.md`, `fase-58-prueba-y-confianza.md` (58 fuera de alcance)
- `founder/kit-confianza/muestra-auditoria-juan-tech.md`
- `CLAUDE.md` (Database Safety, Hostinger/Dokploy), memoria: deploy Dokploy al mergear a master, acceso a DB de producción, trampas de scripts contra Payload
</canonical_refs>

<code_context>
Scripts existentes reutilizables: `scripts/verify/53-crawl-parity.mjs`, `53-layer-check.mjs`, `53-wait-preview.mjs`, `53-preview-contract.mjs`, `56-gate.ts`, `56-run-all.mjs`. Cargador: `scripts/db/28-phase56-cutover-load.ts`. Verificador de base: `scripts/db/04-which-database.ts`.
</code_context>

<deferred>
## Deferred Ideas
- Phase 58 (prueba y confianza) entera.
- Next 16 u otras mejoras de plataforma.
</deferred>
