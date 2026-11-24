---
phase: 55-casos-websites-blog-y-autores
fixed_at: 2026-11-10T00:00:00Z
review_path: /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/phases/55-casos-websites-blog-y-autores/55-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 55: Code Review Fix Report

**Fixed at:** 2026-11-10
**Source review:** /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/phases/55-casos-websites-blog-y-autores/55-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (0 Critical, 5 Warning; los 8 Info quedan fuera del alcance `critical_warning`)
- Fixed: 5
- Skipped: 0

**Donde se verifico:** en el checkout principal (`workflow.use_worktrees=false`), rama `feat/mui-redesign`, sin worktree aislado. Tras cada fix: `npx tsc --noEmit` (limpio) y los scripts `55-*-ssr.ts` que cubren el archivo tocado. Al final: `npm run build` con variables falsas (`PAYLOAD_SECRET=build-only`, `DATABASE_URI` falsa a 127.0.0.1, sin `.env`), exit 0; `node scripts/verify/55-run-all.mjs --selftests --strict`, 55 pasos de la fase mas la regresion de la 54, todo PASS, 0 FAIL, 0 SKIP. No se hizo push, no se toco master, no se uso `--env-file=.env` y no se escribio en ninguna base de datos.

**Limite de la verificacion:** `next build` no ejercita las rutas ISR reales (`generateStaticParams` vacio, el render ocurre en la primera visita contra la base). WR-01, WR-02 y WR-04 solo se pueden confirmar de verdad contra el preview: provocar un fallo de lectura en un indice, editar un autor y mirar el post, y abrir `?subscribed=error` en un post.

## Fixed Issues

### WR-01: Los tres índices tragan el error de lectura y ISR fija una lista vacía con 200

**Files modified:** `src/app/(frontend)/[locale]/case-studies/page.tsx`, `src/app/(frontend)/[locale]/websites/page.tsx`, `src/app/(frontend)/[locale]/authors/page.tsx`
**Commit:** fa7ff7b
**Status:** fixed: requires human verification
**Applied fix:** Se quito el `try/catch` de las tres rutas: `const docs = await getCached...Index(loc)`. Un fallo de lectura sube, y si ocurre durante una regeneracion ISR Next conserva el ultimo HTML bueno. El estado vacio (`emptyTitle`) sigue apareciendo solo con la coleccion realmente vacia. Se quitaron los tipos `*DocLike` que dejaron de usarse en los imports. Los detalles conservan su `try/catch`. Los comentarios de `cache.ts` de los tres indices se corrigieron en el commit de WR-02 porque decian que la ruta captura el error.

### WR-02: Un cambio de autor, categoría o cliente no invalida el detalle del post ni los casos

**Files modified:** `src/lib/cache.ts`, `src/lib/cache-tags.ts`, `scripts/verify/55-cache-tags.ts`
**Commit:** 9853a75
**Status:** fixed: requires human verification
**Applied fix:** `getCachedPost` suma `CACHE_TAGS.authors()` y `CACHE_TAGS.categories()` (puebla autor y categoria a depth 2). `getCachedCaseStudyBySlug` y `getCachedCaseStudiesIndex` suman `CACHE_TAGS.authors()` (puebla el autor). Con eso los hooks de Authors y Categories ya existentes invalidan de verdad esas lecturas; no hizo falta agregar `case-studies:all` al hook de Authors, y se actualizaron los comentarios de `cache-tags.ts` para que digan lo que ocurre. Se aplico la guia de no ampliar mas alla de las lecturas que pueblan esas relaciones: no se tocaron `websites`/`clientes` (el review los marcaba como "considerar"; `clientes` no tiene tag ni hook y el cambio exige decision aparte). Se amplio `55-cache-tags.ts`: ahora recorre tambien `cache.ts` y exige esos tags por clave de cache (`post`, `case-study`, `case-studies-index`), con dos fixtures nuevos.

### WR-03: `parseMetricNumber` convierte cualquier unidad que empiece con "m" en millones

**Files modified:** `src/lib/case-study-data.ts`, `scripts/verify/55-cases-ssr.ts`
**Commit:** 7f96142
**Status:** fixed: requires human verification
**Applied fix:** El review proponia `/^(-?\d+(?:\.\d+)?)\s*([KM])?(?![A-Za-z])/i`, pero esa expresion falla: con el sufijo opcional el motor retrocede y `850ms` daria 85 y `2.1s` daria 2. Se uso `/^(-?\d+(?:\.\d+)?)(?:\s*([KM])(?![A-Za-z]))?/i`, donde el limite solo condiciona el sufijo: si lo sigue una letra, el sufijo no cuenta y el numero entero se conserva. Verificado: `850ms` 850, `45 min` 45, `3 meses` 3, `2.1s` 2.1, `1.25M` 1250000, `533K` y `533K clics` 533000, `47,108` 47108. `55-cases-ssr.ts` gana esos fixtures y una comprobacion de `changeRatio` para `45 min` a `12 min` (cambio negativo mayor que -1) y `850ms` a `2.1s`. Limite conocido: `"5 m"` suelto sigue leyendose como 5 millones (M seguida de fin de cadena); no hay fixtures reales con ese formato.

### WR-04: En el estado de error de la captura de email el formulario desaparece y no hay forma de reintentar

**Files modified:** `src/components/mui/rich-text/blocks.tsx`, `scripts/verify/55-richtext-blocks-ssr.ts`
**Commit:** a26b310
**Status:** fixed: requires human verification
**Applied fix:** El formulario se muestra con `(!state || state === 'error')`; `pending` y `already` siguen reemplazandolo. El mensaje de error lleva `id="email-capture-error"` y `role="alert"`. El campo de correo, solo en estado de error, recibe `error`, `autoFocus` y `aria-describedby="email-capture-error"` (via `slotProps.htmlInput`, API de MUI 9), para que el lector de pantalla y el teclado retomen donde fallo tras la recarga completa de `redirect()`. El correo no viaja en la URL, asi que la persona lo vuelve a escribir (no hay valor que conservar). `55-richtext-blocks-ssr.ts` suma cuatro comprobaciones: formulario completo en `error`, `role="alert"` + `aria-describedby` + `aria-invalid`, estado inicial sin marcas de error y `already` sigue sin formulario. Pendiente de confirmar a mano: que `autoFocus` no resulte brusco al llegar con `?subscribed=error` en un post largo.

### WR-05: Las URLs del global `blog-promo` llegan al `href` sin pasar por `sanitizeHref`

**Files modified:** `src/lib/blog-data.ts`, `src/app/(frontend)/[locale]/blog/page.tsx`, `src/app/(frontend)/[locale]/blog/[category]/page.tsx`, `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx`, `scripts/verify/55-blog-ssr.ts`, `scripts/verify/55-post-ssr.ts`
**Commit:** 2512853
**Applied fix:** `cta()` usa `sanitizeHref(text(url), locale)` de `@/lib/nav-links` (el mismo helper de header, footer, enlaces del cuerpo y redes; ya aplica `normalizeServiceHref`). Una URL insegura (`javascript:`, `//host`, caracteres de control, esquema fuera de lista) descarta la accion. `toClosingProps`, `toInlineOffer` y `toRailOffer` reciben `locale` como segundo parametro (obligatorio, para que ninguna ruta lo olvide) y las tres rutas del blog lo pasan. Los verificadores cubren `javascript:`, `//evil.example`, `/servicios` en EN (`/en/services`), una URL https valida. El fixture de `55-post-ssr.ts` que esperaba `/servicios` en EN pasa ahora a esperar `/en/services`, que es justo la correccion que pedia el review.

## Skipped Issues

None. Todos los hallazgos en alcance se aplicaron.

## Notas fuera de alcance

- `messages/es.json` `emailCapture.errorBody` contiene un guion largo entre "registrar tu correo" e "intenta de nuevo". Es copy anterior, no se toco porque cambia el texto del sitio y `55-messages-parity` lo compara con EN; conviene revisarlo cuando se haga la pasada de voz y tono.
- Los 8 hallazgos Info (IN-01 a IN-08) quedan sin tocar, por el alcance pedido.

---

_Fixed: 2026-11-10_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
