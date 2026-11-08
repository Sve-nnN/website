---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
fixed_at: 2026-11-07T00:00:00Z
review_path: /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 11
skipped: 0
status: all_fixed
---

# Phase 53: Code Review Fix Report

**Fixed at:** 2026-11-07
**Source review:** /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 11 (1 Critical, 10 Warning; los 5 Info quedan fuera de `fix_scope: critical_warning`)
- Fixed: 11
- Skipped: 0

**Donde se verifico:** en el checkout principal (`workflow.use_worktrees=false`), rama `feat/mui-redesign`, sin worktree aislado. Verificacion global tras cada fix: `npx tsc --noEmit` (limpio en todos). Ademas se corrio `npx next build` completo al final (OK, 56 s, sin errores) y `53-layer-check.mjs` despues del build (OK). No se hizo push, no se toco master, no se tocaron datos ni migraciones de la base.

## Fixed Issues

### CR-01: Los resets de `CssBaseline` (capa `mui`) aplastan las utilidades Tailwind de las paginas heredadas

**Files modified:** `src/theme/theme.ts`, `src/components/shell/HeaderView.tsx`, `src/components/shell/FooterView.tsx`, `scripts/verify/53-layer-check.mjs`
**Commit:** 563cf19
**Applied fix:** Cambio minimo: se elimino solo la regla `'ul, ol': { listStyle: 'none', margin: 0, padding: 0 }` de `MuiCssBaseline`. El preflight de Tailwind (capa `tailwind`) ya resetea las listas, asi que el resto del sitio no cambia, y `list-disc`, `pl-6`, `mb-4` y `mt-6` del contenido heredado (Prose, case studies, websites) vuelven a ganar. Las tres `ul` del shell (nav del Header, columnas y enlaces legales del Footer) declaran `listStyle: 'none', m: 0, p: 0` en su propio `sx`, por lo que su aspecto no cambia. El tema aprobado (paleta, tipografia, componentes, `:focus-visible`, `html`, `body`) queda intacto. `53-layer-check.mjs` gana una guarda estatica que falla si `theme.ts` vuelve a declarar un reset global `ul, ol`.
**Verificacion:** `53-layer-check.mjs` OK antes y despues de `next build`; `tsc` limpio. No se verifico visualmente en navegador.
**Nota:** el `:focus-visible` global de `MuiCssBaseline` (mencionado en el texto de CR-01) NO se toco: sigue ganando a `focus:outline-none` de Tailwind en el sitio heredado. Es una decision de a11y (SC 2.4.7) y quitarlo cambia el tema aprobado; queda para decision de Juan. Tampoco se anadio la comprobacion de `listStyleType` a `53-computed-styles.mjs` (necesita Chromium y un post real servido, no se pudo ejecutar sin red); la guarda estatica del layer-check cubre la regresion de este reset concreto.

### WR-01: El shader del hero ignora la decision explicita de reanudar

**Files modified:** `src/components/HeroGrainGradientShader.tsx`
**Commit:** cb24723
**Status:** fixed: requires human verification
**Applied fix:** `motionProps` usa solo `paused` (que ya incorpora la preferencia del sistema como valor inicial via `motion-init.ts`). `reducedMotion` se conserva solo para el atributo `data-motion` del contenedor. `53-motion-script.ts` OK.

### WR-02: La bandera de solo lectura falla abierta con cualquier valor distinto de `'true'`

**Files modified:** `src/lib/preview-flag.mjs` (nuevo), `src/lib/preview.ts`, `next.config.mjs`
**Commit:** aa2f8c8
**Status:** fixed: requires human verification
**Applied fix:** Se creo un modulo puro `preview-flag.mjs` con `parsePreviewFlag(raw)`: activa si el valor esta presente y, ya normalizado (trim y minusculas), no es vacio, `false` ni `0`. Lo importan `isPreviewReadonly()` y `next.config.mjs`, asi las dos lecturas no pueden divergir. Archivo nuevo justificado por la sugerencia del review (funcion `.mjs` compartida). Probado con 11 valores (`TRUE`, `1`, `true `, `"true"` activan; `undefined`, vacio, `false`, `0`, ` false ` no). `53-preview-contract.mjs --config-check` y `53-write-gates.mjs` OK.

### WR-03: Rewrites y headers se fijan en build, el codigo lee la bandera en runtime, y nada comprueba que coincidan

**Files modified:** `src/lib/preview-guard.ts` (nuevo), `src/app/(payload)/api/[...slug]/route.ts`, `src/app/(payload)/api/graphql/route.ts`, `src/app/(payload)/api/graphql-playground/route.ts`, `src/app/(payload)/admin/[[...segments]]/page.tsx`
**Commit:** 55728b6
**Status:** fixed: requires human verification
**Applied fix:** `guardPreviewRoute(handler)` responde 404 plano en runtime cuando `isPreviewReadonly()` es verdadero y conserva el tipo del handler. Envuelve todos los handlers REST, GraphQL y el playground. La pagina del admin llama `notFound()` bajo la misma condicion (el layout `(payload)` no se toco porque `notFound()` en un layout raiz produce 500, ver SEO-39). Probado con `tsx`: 404 con `TRUE`, 200 con `false`. Los archivos generados por la plantilla de Payload llevan aviso de "DO NOT MODIFY": una actualizacion de plantilla puede reescribirlos y hay que reaplicar la guarda; `53-write-gates.mjs` ahora lo detecta (ver WR-07). Pendiente fuera de codigo: documentar en el runbook que la variable debe marcarse como build-time en Dokploy y correr `53-preview-contract.mjs` contra la URL desplegada.

### WR-04: El alta a lead magnet degrada a suscriptores `confirmed` y rota su token

**Files modified:** `src/app/actions/subscribe-lead-magnet.tsx`
**Commit:** 3d0be95
**Status:** fixed: requires human verification
**Applied fix:** Para un suscriptor `confirmed` que no es el caso `alreadyHasThisMagnet`, el `update` solo fija `optInReason` y `leadMagnet` (y `token` unicamente si la ficha no tenia uno). Ya no toca `status`, `confirmedAt`, `unsubscribedAt`, `locale`, `source` ni el token existente. El correo de entrega reutiliza el token actual, de modo que el enlace solo funciona para quien controla el buzon, y el endpoint `/api/newsletter/confirm` redirige a la descarga porque la ficha ya tiene `leadMagnet`. Los demas caminos (nuevo, `pending`, `unsubscribed`) no cambian. No se pudo probar contra datos reales (no se escribe en la base).

### WR-05: `postPath` del formulario va sin validar al `redirect()` y se guarda sin limite de longitud

**Files modified:** `src/app/actions/subscribe-lead-magnet.tsx`
**Commit:** 45142d2
**Applied fix:** `postPath` solo se acepta si coincide con `^\/(?!\/)[^\s\\]*$` (ruta interna, sin `//`, espacios ni barra invertida) y se corta a 200 caracteres; si no, cae en `/blog`. Probado con `//evil.com`, `https://e.com`, `/\evil`, `/<TAB>/x`, vacio (todos a `/blog`) y rutas validas del blog. Los valores reales (`/blog/<cat>/<slug>`, `/en/blog/...`) pasan.

### WR-06: `sanitizeHref` deja pasar `/\t/host` y `/\n/host`

**Files modified:** `src/lib/nav-links.ts`, `scripts/verify/53-nav-links.ts`
**Commit:** c51cef1
**Applied fix:** `sanitizeHref` devuelve `null` si el href contiene cualquier caracter de control (`\u0000-\u001f`, `\u007f`) tras el `trim()`. Se anadieron `'/\t/evil.com'` y `'/\n/evil.com'` a los casos malos de `53-nav-links.ts`, que pasa (OK).

### WR-07: La auditoria `53-write-gates.mjs` tiene puntos ciegos que dan falsos OK

**Files modified:** `scripts/verify/53-write-gates.mjs`
**Commit:** 50ac93d
**Applied fix:** El escaneo cubre todo `src/` y trata como punto de entrada cualquier archivo con `'use server'` o `route.ts(x)/js`; falla si escribe sin `isPreviewReadonly` (o `guardPreviewRoute`). `WRITE_CALLS` incluye `.updateGlobal(`, `.duplicate(`, `.restoreVersion(`, `.login(`, `.forgotPassword(`, `.resetPassword(`, `.jobs.queue(` y `.db.`. Nueva lista cerrada `WRITER_HELPERS` (vacia hoy: el `.update(` de `src/lib/download-token.ts` es un HMAC, no una escritura) que exige la compuerta a quien importe un helper que escriba. Nueva comprobacion de que las cuatro rutas de Payload llevan la guarda de WR-03. Probado con un archivo temporal `'use server'` + `.updateGlobal(` en `src/components` (FAIL, luego eliminado) y el estado real del repo (OK). Limite que se mantiene y esta documentado en el encabezado del script: sigue siendo analisis textual, no de flujo de control, asi que una compuerta dentro de un `if` que no cubra todas las ramas necesita revision humana.

### WR-08: `SiteFooter` es todo-o-nada, salta la capa de cache y puede emitir enlaces `/case-studies/null`

**Files modified:** `src/lib/cache.ts`, `src/components/shell/SiteFooter.tsx`
**Commit:** b2b4f46
**Status:** fixed: requires human verification
**Applied fix:** Las dos consultas dinamicas pasaron a `cache.ts` como `getCachedLatestPostLinks` y `getCachedLatestCaseStudyLinks` (`unstable_cache`, tags `posts` y `case-studies`, TTL de 60 s, `overrideAccess: false`, `select` de `title`, `slug` y `categories`, `populate` de categorias a `slug`). `SiteFooter` filtra los docs sin `slug` y resuelve servicios y columnas dinamicas con `Promise.allSettled`: una consulta fallida se registra y el resto del footer (columnas del CMS, legales, redes) se conserva. No se pudo contrastar contra la base real; conviene mirar el footer del preview al desplegar.

### WR-09: El Drawer movil pone `aria-label` en un `div` sin rol

**Files modified:** `src/components/shell/HeaderView.tsx`
**Commit:** 04a487e
**Applied fix:** `slotProps.paper` ahora lleva `role: 'dialog'`, `'aria-modal': true`, el `id` existente y el `aria-label` existente. El `id="menu-movil"` y el `aria-controls` no cambian, asi que la seccion `drawer` de `53-computed-styles.mjs` sigue apuntando al mismo selector. No se corrio esa seccion (necesita Chromium y una pagina servida).

### WR-10: El plugin PostCSS decide por sufijo de nombre de archivo, no por la ruta exacta

**Files modified:** `postcss-tailwind-layer.cjs`
**Commit:** 1be4cbc
**Applied fix:** Compara `path.resolve(file)` con `path.resolve(__dirname, 'src/app/globals.css')`. `53-layer-check.mjs` OK y `next build` completo OK tras el cambio (el CSS compilado sigue envuelto en `@layer tailwind`).

## Skipped Issues

None. Todos los hallazgos en alcance se aplicaron.

## Fuera de alcance

Los cinco hallazgos Info (IN-01 a IN-05) no se tocaron por `fix_scope: critical_warning`. IN-02 (`53-wait-preview.mjs` debe exigir 404 en `/admin` y `/api/users`) complementa WR-03 y conviene aplicarlo antes de usar ese script como compuerta del preview.

## Notas de estado del repositorio

Los archivos modificados sin commit que ya existian antes de esta ejecucion (`.planning/state.json`, `research/JUAN-PROFILE.md`, `research/voice-and-tone-juan.md`) y los untracked previos no se tocaron. Esta ejecucion dejo el arbol de trabajo sin cambios propios pendientes.

---

_Fixed: 2026-11-07_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
