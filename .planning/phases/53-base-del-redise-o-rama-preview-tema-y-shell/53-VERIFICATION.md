---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
verified: 2026-11-07T21:00:00Z
status: passed
score: 4/5 must-haves verified
covered_files:
  - .planning/REQUIREMENTS.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-01-PLAN.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-01-SUMMARY.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-02-PLAN.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-02-SUMMARY.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-03-PLAN.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-03-SUMMARY.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-04-PLAN.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-04-SUMMARY.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-05-PLAN.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-05-SUMMARY.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-06-PLAN.md
  - .planning/phases/53-base-del-redise-o-rama-preview-tema-y-shell/53-06-SUMMARY.md
  - next.config.mjs
  - src/app/robots.ts
  - src/components/shell/HeaderView.tsx
  - src/components/shell/SiteFooter.tsx
  - src/components/shell/SiteHeader.tsx
  - src/lib/preview-flag.mjs
  - src/lib/preview-guard.ts
  - src/lib/preview.ts
  - src/middleware.ts
  - src/theme/Providers.tsx
  - src/theme/motion.tsx
  - src/theme/theme.ts
covered_digest: "v1:sha256:48670a5753c5c8da4beb97b72068c8873233ef1fd0f1cff1efcda2c40701d42c"
behavior_unverified: 1
overrides_applied: 0
behavior_unverified_items:
  - truth: "Juan cambia un enlace en el admin real y aparece en el preview tras la revalidacion (ROADMAP SC4, D-12)"
    test: "En el admin de produccion, editar una etiqueta del global Header (o Footer), guardar, y recargar https://dev.juan-tech.com a los 60 y 120 s sin redeploy"
    expected: "El preview muestra la etiqueta nueva en 2 minutos como maximo. Despues, restaurar la etiqueta original"
    why_human: "El hook afterChange (revalidateTag) corre en el proceso de produccion y no puede invalidar la cache del proceso del preview. El cambio solo llega por el TTL de 60 s de unstable_cache mas el ISR de la pagina. Ninguna prueba ejercita esa cadena y escribir en produccion queda fuera del alcance del verificador."
human_verification:
  - test: "Revalidacion de nav y footer desde el admin real (ver behavior_unverified_items)"
    expected: "El cambio aparece en el preview en menos de 2 minutos, sin redeploy"
    why_human: "Cadena TTL mas ISR entre dos procesos, requiere una escritura real en produccion"
  - test: "Lectores de pantalla: NVDA con Firefox y VoiceOver con Safari sobre el selector de idioma, el Drawer movil y el toggle de movimiento"
    expected: "Landmarks con nombre distinto, Drawer anunciado como dialogo con nombre, aria-pressed del toggle anunciado una sola vez, idioma activo con aria-current"
    why_human: "El comportamiento de tecnologias de asistencia no se prueba con Playwright"
  - test: "Revision visual del shell en el preview a 900, 1024 y 1280 px"
    expected: "Pill de nav sin desborde con 6 enlaces, contraste del texto secundario de al menos 4.5:1 sobre el pill translucido, footer y Drawer fieles al sandbox aprobado"
    why_human: "Fidelidad de diseno y contraste sobre fondo variable"
  - test: "Foco visible del enlace de salto y no tapado por el header y el toggle fijos (SC 2.4.11)"
    expected: "Al pulsar Tab desde la carga, el enlace de salto aparece a 8 px del borde superior y es visible. El foco recorrido en una pagina larga no queda oculto"
    why_human: "El chequeo automatico de foco de 53-computed-styles.mjs es intermitente (ver Anti-Patterns). La captura debe confirmarla una persona"
  - test: "Admin local sin MUI: abrir /admin/login con el servidor local contra una base de pruebas"
    expected: "Se ve igual que antes, sin atributos data-emotion ni variables --jt- en el DOM"
    why_human: "Verificacion estatica OK (manifiestos y chunks de (payload) sin MUI), pero la comprobacion visual del admin real no se puede hacer en el preview porque el admin esta bloqueado ahi"
---

# Phase 53: Base del rediseno, rama, preview, tema y shell, Verification Report

**Phase Goal:** Juan abre `dev.juan-tech.com` y ve el shell MUI funcionando con datos reales de Payload, sin que el admin ni produccion cambien.
**Verified:** 2026-11-07
**Status:** human_needed
**Re-verification:** No, verificacion inicial (no existia VERIFICATION.md previo)

## Resumen

El objetivo se cumple en lo observable: el preview responde en vivo con el shell MUI, datos reales de Payload, noindex y sin escrituras. Todos los scripts de contrato pasan contra `https://dev.juan-tech.com` en esta sesion. Quedan 5 comprobaciones humanas (revalidacion cruzada, lectores de pantalla, revision visual, foco visible, admin local). Ninguna es un fallo conocido. Una de ellas, la revalidacion, es una verdad dependiente de comportamiento que ninguna prueba ejercita.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `dev.juan-tech.com` desplegado desde `feat/mui-redesign` responde con noindex (meta y X-Robots-Tag), su robots.txt no permite rastreo y no publica sitemap | VERIFIED | En vivo: `/robots.txt` 200 con `Disallow: /` y sin `Sitemap:`; `/sitemap.xml` 404; cabecera `x-robots-tag: noindex, nofollow` en `/`, `/robots.txt`, `/admin`, `/api/*`; HTML trae `<meta name="robots" content="noindex, nofollow"/>`; canonical sigue en `https://juan-tech.com`. `53-preview-contract.mjs` y `53-wait-preview.mjs` PASS. `origin/feat/mui-redesign` esta en `a3a41e1`, igual que el HEAD local. |
| 2 | El preview lee la DB de produccion sin escribir: credenciales de solo lectura y rutas que escriben inertes | VERIFIED (parte DB por evidencia aportada) | Codigo: `isPreviewReadonly()` (falla cerrado via `parsePreviewFlag`) gobierna las seis rutas (`go/[slug]`, `subscribe`, `subscribe-lead-magnet`, `contact`, `newsletter/confirm`, `newsletter/unsubscribe`); `/admin` y REST/GraphQL de Payload envueltos con `guardPreviewRoute` o `notFound()`. `53-write-gates.mjs` OK, `53-preview-contract.mjs --config-check` OK. En vivo: `/go/dinorank` 302. Crawl de 169 URLs del sitemap de produccion contra el preview: 0 diferencias. Rol `juantech_preview_ro` (SELECT ok, INSERT falla, `users` denegada) y 0 lineas `permission denied`: evidencia aportada por el solicitante, no reproducida aqui porque el verificador no lee credenciales. |
| 3 | Tema MUI v9 oscuro con tokens y Geist aplicado en `(frontend)`, y `/admin` se ve igual sin estilos MUI filtrados | VERIFIED (el aspecto visual del admin va como human-check) | `53-computed-styles.mjs` seccion `styles` PASS en vivo (body `rgb(24,24,24)`, boton MUI contained `rgb(255,122,69)`). Layout: `AppRouterCacheProvider enableCssLayer` + `InitColorSchemeScript` + `Providers` solo en `src/app/(frontend)/[locale]/layout.tsx`. `@layer tailwind,mui` declarado, 42 bloques `@layer mui` en el HTML. `MuiCssBaseline` ya no trae el reset global `ul, ol` (fix CR-01 desplegado: ausente en el HTML servido). `grep` de `@mui`, `@emotion`, `src/theme` y `components/shell` en `src/app/(payload)`: sin resultados. Build local: los 7 modulos MUI de `page_client-reference-manifest.js` del admin tienen `chunks: []` (falso positivo documentado de Next 15), `.next/static/chunks/app/(payload)` sin `emotion` ni `@mui`, y los CSS de entrada del admin sin `jt-`, `MuiCssBaseline` ni `@layer tailwind`. Next sigue en 15.4.11, MUI 9.5.0. |
| 4 | Nav y footer muestran los enlaces de los globals Header y Footer; un cambio en el admin aparece en el preview tras la revalidacion | PRESENT_BEHAVIOR_UNVERIFIED | Wiring verificado: `SiteHeader`/`SiteFooter` leen `getCachedHeader`/`getCachedFooter` (`findGlobal`, tag `header`/`footer`, TTL 60 s), hooks `afterChange` en ambos globals, sin migracion. HTML en vivo: nav `Principal` con `/blog`, `/case-studies`, `/authors`, `/contact`, `/servicios` y CTA `Hablemos`; footer con cinco columnas y legales. La mitad "aparece tras la revalidacion" depende de TTL mas ISR entre el admin de produccion y el proceso del preview (`revalidateTag` no cruza procesos) y ninguna prueba la ejerce. Va a human_verification. |
| 5 | El selector de idioma cambia EN/ES conservando la ruta y el toggle de movimiento pausa y recuerda la eleccion | VERIFIED | `53-computed-styles.mjs` en vivo: `motion` PASS (toggle con persistencia tras recarga), `lang` PASS (`/servicios` a `/en/services` y de vuelta), `skip`, `overflow`, `drawer` PASS. `53-shell-contract.mjs` PASS en `/` y `/en` (un solo `main`, landmarks, enlace de salto, lang); su `--selftest` rechaza fixtures malos. `53-motion-script.ts` y `53-nav-links.ts` OK. |

**Score:** 4/5 truths verified (1 presente, comportamiento sin verificar)

### Must-haves de los planes (verificacion puntual)

| Must-have | Status | Evidencia |
|-----------|--------|-----------|
| Rama `feat/mui-redesign` desde master; master sin commits de codigo | VERIFIED | `git merge-base` = `e38cdf4`; `origin/master` sigue en `6e9b02a`. Master local solo avanza con 3 commits `docs(53)` de planificacion (sin codigo) |
| `next` 15.4.11, `@mui/material` 9.5.0, `@mui/material-nextjs` 9.5.0, Emotion 11.14 exactos | VERIFIED | `package.json` lineas 17-21 y 46. `npx tsc --noEmit` limpio |
| `globals.css` entero en `@layer tailwind` bajo `mui` | VERIFIED | `53-layer-check.mjs` OK (660 nodos en la capa, control negativo con 614 reglas sin capa) |
| Un solo `main#main-content`, SkipLink primero, landmarks con nombre | VERIFIED | HTML en vivo: `header[aria-label=Cabecera]`, `nav[Principal]`, `footer[Pie de pagina]`, cada nav de columna con nombre propio; contrato PASS |
| Fixes del review CR-01 y WR-01 a WR-10 aplicados | VERIFIED | 11 commits `fix(53)` en la rama; `53-REVIEW-FIX.md` `all_fixed`; `preview.ts`, `preview-flag.mjs`, `preview-guard.ts` leidos; CR-01 confirmado en el HTML servido |
| Sin migraciones ni cambios de esquema | VERIFIED | `git diff --name-only master...HEAD` sin archivos de migracion; los globals solo ganan `hooks.afterChange` |
| Secretos fuera del repo | VERIFIED | Ninguna credencial en los archivos revisados; el verificador no leyo `~/.config/juantech` |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/theme/{tokens,theme,Providers,motion,motion-init}.ts(x)` | Tema oscuro y estado de movimiento | VERIFIED | Existen, importados desde el layout, datos fluyen (estilos computados reales) |
| `postcss-tailwind-layer.cjs` | Envolver `globals.css` en `@layer tailwind` | VERIFIED | Ruta exacta (WR-10), layer-check OK |
| `src/lib/preview.ts`, `preview-flag.mjs`, `preview-guard.ts` | Bandera fail-closed y guarda de runtime | VERIFIED | Sustantivos y cableados en middleware, layout, robots, seis rutas y cuatro handlers de Payload |
| `src/components/shell/*` (Header/Footer/View, LanguageSwitcher, SkipLink, MotionToggle) | Shell MUI | VERIFIED | Renderizan en vivo con datos de Payload |
| `src/lib/cache.ts`, `cache-tags.ts`, `nav-links.ts` | Capa de cache de globals y helpers de enlaces | VERIFIED | `getCachedHeader/Footer` en uso; helpers cubiertos por `53-nav-links.ts` |
| `scripts/verify/53-*.mjs/.ts` (10 scripts) | Verificacion determinista | VERIFIED | Ejecutados en esta sesion; todos PASS excepto una intermitencia del chequeo de foco |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `(frontend)/[locale]/layout.tsx` | `src/theme/Providers.tsx` | `<Providers>` dentro de `AppRouterCacheProvider` | WIRED | Leido en el layout |
| `postcss.config.js` | `postcss-tailwind-layer.cjs` | Clave de plugin en cadena | WIRED | layer-check OK |
| `next.config.mjs` | `src/app/preview-blocked/route.ts` | Rewrites `beforeFiles` | WIRED | `/admin`, `/api/users`, `/api/graphql` responden 404 en vivo; `/api/redirects-lookup` y `/api/newsletter/*` quedan abiertos |
| `middleware.ts` / `robots.ts` | `src/lib/preview.ts` | `isPreviewReadonly()` | WIRED | grep confirma |
| `SiteHeader` / `SiteFooter` | `getCachedHeader` / `getCachedFooter` | Local API `findGlobal` | WIRED | HTML en vivo con enlaces del CMS |
| `Header/Footer` globals | `cache-tags.ts` | `afterChange: [revalidate*Cache]` | WIRED | Presente; efecto cross-proceso no ejercido (ver SC4) |
| `MotionToggle` | `src/theme/motion.tsx` | `useMotion()` | WIRED | Toggle con persistencia PASS en navegador |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `HeaderView` | `items`, `cta`, `logo` | `getCachedHeader` a `payload.findGlobal('header')` | Si, nav en vivo coincide con el global | FLOWING |
| `FooterView` | columnas CMS, servicios, ultimos posts y casos | `getCachedFooter` y `getCachedLatest*Links` | Si, cinco columnas en el HTML en vivo | FLOWING |
| `LanguageSwitcher` | href alterno | `buildLocaleSwitchHref(pathname)` | Si, navegacion `/servicios` a `/en/services` PASS | FLOWING |

### Behavioral Spot-Checks (ejecutados en esta sesion)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Contrato del preview | `53-preview-contract.mjs` (BASE_URL=dev) | PASS en todas las lineas | PASS |
| Contrato del shell | `53-shell-contract.mjs` (EXPECT_PREVIEW=1) y `--selftest` | PASS en `/` y `/en`; selftest OK | PASS |
| Espera del preview | `53-wait-preview.mjs` | OK | PASS |
| Paridad de crawl | `53-crawl-parity.mjs` (PREVIEW_BASE, PROD_BASE) | 169 URLs, 0 diferencias | PASS |
| Estilos y navegador | `53-computed-styles.mjs` (REQUIRE_BUTTON=1) | styles, motion, skip, lang, overflow, drawer PASS; focus PASS en 2 de 4 corridas | PASS con intermitencia |
| Capas CSS | `53-layer-check.mjs` | OK | PASS |
| Config con y sin bandera | `53-preview-contract.mjs --config-check` | PASS (produccion intacta sin bandera) | PASS |
| Compuertas de escritura | `53-write-gates.mjs` | OK | PASS |
| Motion, enlaces, mensajes | `53-motion-script.ts`, `53-nav-links.ts`, `53-messages-parity.mjs` | OK | PASS |
| Tipos | `npx tsc --noEmit` | Sin errores | PASS |

### Probe Execution

SKIPPED: la fase no declara probes `scripts/*/tests/probe-*.sh`. Los scripts `53-*` ya se ejecutaron arriba.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BASE-01 | 53-01, 53-02, 53-06 | Rama, preview en Dokploy con DB de produccion en solo lectura, noindex y fuera del sitemap | SATISFIED | SC1 y SC2. La parte "rol de solo lectura" descansa en evidencia aportada, respaldada por 0 diferencias de crawl y por compuertas de codigo |
| BASE-02 | 53-01, 53-05 | Tema MUI v9 oscuro montado en `(frontend)` sin afectar el admin | SATISFIED | SC3. Falta solo la revision visual del admin (human-check) |
| BASE-03 | 53-03, 53-04, 53-05, 53-06 | Nav, footer, selector de idioma y toggle de movimiento con globals y `[locale]` reales | NEEDS HUMAN | Todo funcional verificado salvo la revalidacion cruzada, mas las pruebas con lectores de pantalla |

Sin requisitos huerfanos: REQUIREMENTS.md mapea BASE-01, BASE-02 y BASE-03 a la Phase 53 y los seis PLAN los declaran (01: BASE-01 y 02; 02: BASE-01; 03 y 04: BASE-03; 05: BASE-02 y 03; 06: los tres). Nota de trazabilidad: en REQUIREMENTS.md solo BASE-02 aparece marcado `[x]`/Complete; BASE-01 y BASE-03 siguen `Pending`. Hay que actualizarlos cuando se resuelvan los human-checks.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `scripts/verify/53-computed-styles.mjs` | 284 | La seccion `focus` mide `getBoundingClientRect` justo despues de `Tab`. Con `prefers-reduced-motion: reduce` el estilo `&:focus {top: 8}` del SkipLink se aplica con `transition: all 1e-05s`, y en una de cada dos o tres corridas el primer fotograma sigue en `top: -64` | Warning | Falso fallo intermitente (reproducido: 6 de 8 y 1 de 4 mediciones inmediatas dan `top:-64`; a los 800 ms siempre `top:8`). Sin reduccion de movimiento es 4 de 4 correcto. No es un defecto de producto visible (un fotograma), pero el chequeo no es confiable como compuerta. Conviene esperar un fotograma antes de medir |
| `scripts/verify/53-wait-preview.mjs` | n/a | IN-02 del review sin aplicar: no exige 404 en `/admin` y `/api/users` | Info | `53-preview-contract.mjs` si lo exige y pasa |
| Marcadores de deuda `TBD`, `FIXME`, `XXX` y `TODO`, `HACK`, `PLACEHOLDER` en archivos de la fase | n/a | Ninguno encontrado | OK | |

### Human Verification Required

#### 1. Revalidacion de nav y footer desde el admin real

**Test:** En el admin de produccion, cambiar una etiqueta del global Header (o Footer), guardar, y recargar el preview a los 60 y 120 s sin redeploy. Restaurar el valor original.
**Expected:** El preview muestra la etiqueta nueva en 2 minutos como maximo.
**Why human:** `revalidateTag` corre en el proceso de produccion y no invalida la cache del preview. La propagacion depende del TTL de 60 s mas el ISR de la pagina, y requiere una escritura real en produccion.

#### 2. Lectores de pantalla

**Test:** NVDA con Firefox y VoiceOver con Safari sobre el selector de idioma, el Drawer y el toggle de movimiento.
**Expected:** Landmarks con nombre propio, Drawer como dialogo con nombre accesible, `aria-pressed` anunciado una sola vez, `aria-current` en el idioma activo.
**Why human:** Tecnologias de asistencia reales.

#### 3. Revision visual del shell

**Test:** Recorrer el preview a 900, 1024 y 1280 px.
**Expected:** Pill de nav sin desborde, contraste del texto secundario de al menos 4.5:1 (si baja, subir la opacidad del fondo del pill de 72 a 88 por ciento), footer y Drawer fieles al sandbox.
**Why human:** Fidelidad de diseno y contraste sobre fondo variable.

#### 4. Foco visible

**Test:** Pulsar Tab desde la carga y recorrer una pagina larga.
**Expected:** El enlace de salto aparece visible a 8 px del borde superior y el foco nunca queda tapado por el header o el toggle fijos.
**Why human:** El chequeo automatico es intermitente.

#### 5. Admin sin MUI

**Test:** Abrir `/admin/login` en local contra una base de pruebas.
**Expected:** Igual que antes, sin `data-emotion` ni variables `--jt-` en el DOM.
**Why human:** El admin esta bloqueado en el preview. La evidencia estatica es favorable (manifiestos, chunks y CSS de `(payload)` limpios).

### Gaps Summary

No hay gaps bloqueantes. Ninguna verdad quedo FAILED, ningun artefacto esta ausente o es un stub, y ningun enlace clave esta sin cablear. El estado `human_needed` se debe a una verdad dependiente de comportamiento sin prueba automatica (revalidacion entre el admin de produccion y el preview) y a verificaciones que solo una persona puede cerrar (lectores de pantalla, revision visual, foco, admin local).

Observaciones no bloqueantes:
- El chequeo `focus` de `53-computed-styles.mjs` es intermitente por una condicion de carrera de medicion con `prefers-reduced-motion: reduce`. Se recomienda esperar un fotograma antes de medir, antes de usarlo como compuerta en la fase 57.
- El rol de solo lectura `juantech_preview_ro` descansa en la evidencia aportada por el solicitante (SELECT ok, INSERT rechazado, `users` denegada, 0 `permission denied`). El verificador no lo reprodujo porque no puede leer credenciales. Las compuertas de codigo y el crawl sin diferencias la respaldan.
- REQUIREMENTS.md aun marca BASE-01 y BASE-03 como `Pending`.
- Los cinco hallazgos Info del review (IN-01 a IN-05) quedaron fuera de alcance. IN-02 conviene aplicarlo antes de usar `53-wait-preview.mjs` como compuerta en la fase 57.

---

_Verified: 2026-11-07_
_Verifier: Claude (gsd-verifier)_
