# Phase 47: Ruta /go + Fix de Middleware + Registro de Clics - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous) — 1 área presentada, aceptada por Juan sin cambios

<domain>
## Phase Boundary

Un clic en un link de afiliado no-Amazon llega a destino: `/go/[slug]` devuelve 302 con `no-store` leyendo el destino exclusivamente del documento autorizado en el admin, el matcher del middleware deja de tragarse `/go`, `robots.txt` lo bloquea, y el clic queda registrado sin pesar en la respuesta.

Fase deliberadamente chica: el fix del matcher es una línea con radio de impacto sitewide. Queda fuera: arreglar el mismo bug latente en `api`/`admin` (follow-up, no se amplía el diff de esta fase), la página `/stack` y los links inline (Phase 48), cualquier UI que emita un href `/go/` (esta fase se verifica sola, por curl, antes de que exista esa UI).

</domain>

<decisions>
## `/go` sin slug
- `/go` pelado (sin slug) responde **404**. No hay a dónde mandar a alguien que pega la ruta pelada — no existe página de stack todavía (Phase 48) — y un 404 no agrega lógica extra que nadie va a ejercitar.

### Claude's Discretion
- Estructura interna exacta del handler de `/go/[slug]` (route handler vs. middleware rewrite), mientras cumpla runtime Node + `no-store` + lectura exclusiva del documento admin.
- Forma exacta de reusar la detección de bots y el throttle por IP de `contact.ts` (copiar función vs. extraer a util compartido) — decisión de implementación, no de producto.
- Nombre exacto de los campos de `affiliate-clicks` más allá de lo que ya fija GO-04 (append-only, slug, timestamp, descartar bots/throttle).

</decisions>

<code_context>
## Existing Code Insights

- `src/middleware.ts` — el matcher actual excluye `api`/`admin` sin barra, mismo bug latente que este fix corrige solo para `go`. No tocar `api`/`admin` en esta fase (ROADMAP: "no ampliar el diff... dejarlo como follow-up").
- `src/i18n/navigation.ts` — `isPrefixableHref` ya resuelve el mismo tipo de trampa (`/en` vs `/entrevistas`) partiendo el primer segmento en vez de `startsWith`. Leer el comentario ahí antes de escribir la línea del matcher.
- `contact.ts` (ruta exacta a confirmar en research) — ya tiene detección de bots y throttle por IP; GO-04 pide reusar ese mismo patrón para `affiliate-clicks`, no reinventarlo.
- Dos investigadores independientes ya confirmaron el defecto actual: `/go/notion` no tiene punto y no es `api`/`admin`/`_next`/`_vercel`, entra al matcher, dispara `fetch` loopback a `/api/redirects-lookup`, y `createIntlMiddleware` lo reescribe a `/es/go/notion` → 404 en cada clic real.

</code_context>

<specifics>
## Specific Ideas

- La tabla `affiliate-clicks` se agrega con su propia migración puramente aditiva, leída antes de aplicarse — mismo protocolo que Phase 46. El boundary de Phase 46 (matriz de localización congelada) no aplica acá porque no hay reshape, solo tabla append-only nueva.
- Verificación por curl contra matriz de rutas control (`/`, `/en`, `/servicios`, `/en/services`, `/blog`) más al menos un slug señuelo que empiece con "go" (ej. `/golang-para-seo`), comparando contra el comportamiento pre-fix.

</specifics>

<deferred>
## Deferred Ideas

- Arreglar el mismo bug de matcher por prefijo en `api`/`admin` — follow-up explícito, fuera de esta fase.
- Página `/stack` y links inline en contenido — Phase 48.

</deferred>
