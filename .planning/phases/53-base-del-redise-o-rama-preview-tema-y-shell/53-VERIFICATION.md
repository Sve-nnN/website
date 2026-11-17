---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
verified: 2026-11-17T12:00:00Z
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
  - src/app/global-not-found.tsx
  - src/app/robots.ts
  - src/components/shell/FooterView.tsx
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
covered_digest: "v4:sha256:2001c6f298dfed3c56731a3c52e31b07c9147e23d8e1ea396c0dfeb3728b48da"
behavior_unverified: 1
overrides_applied: 0
re_verification:
  previous_status: passed
  previous_score: 4/5
  gaps_closed: []
  gaps_remaining: []
  regressions: []
behavior_unverified_items:
  - truth: "Nav y footer muestran los enlaces de los globals Header y Footer: Juan cambia un enlace en el admin y aparece en el preview tras la revalidacion (ROADMAP SC4)"
    test: "En el admin de produccion, editar una etiqueta del global Header (o Footer), guardar, y recargar https://dev.juan-tech.com a los 60 y 120 s sin redeploy. Restaurar la etiqueta original"
    expected: "El preview muestra la etiqueta nueva en 2 minutos como maximo"
    why_human: "El hook afterChange (revalidateTag) corre en el proceso de produccion y no invalida la cache del proceso del preview. El cambio llega solo por el TTL de 60 s de unstable_cache mas el ISR de la pagina. Ninguna prueba ejercita esa cadena y el verificador no escribe en produccion"
human_verification:
  - test: "Revalidacion de nav y footer desde el admin real (ver behavior_unverified_items)"
    expected: "El cambio aparece en el preview en menos de 2 minutos, sin redeploy"
    why_human: "Cadena TTL mas ISR entre dos procesos; requiere una escritura real en produccion"
  - test: "Lectores de pantalla: NVDA con Firefox y VoiceOver con Safari sobre el selector de idioma, el Drawer movil y el toggle de movimiento"
    expected: "Landmarks con nombre distinto, Drawer anunciado como dialogo con nombre, aria-pressed del toggle anunciado una sola vez, idioma activo con aria-current"
    why_human: "Playwright no reproduce tecnologias de asistencia reales"
  - test: "Revision visual del shell en el preview a 900, 1024 y 1280 px"
    expected: "Pill de nav sin desborde (ahora con 7 enlaces por el Sobre mi del preview), contraste del texto secundario de al menos 4.5:1 sobre el pill translucido, footer y Drawer fieles al sandbox"
    why_human: "Fidelidad de diseno y contraste sobre fondo variable"
  - test: "Admin local sin MUI: abrir /admin/login con el servidor local contra una base de pruebas"
    expected: "Se ve igual que antes, sin atributos data-emotion ni variables --jt- en el DOM"
    why_human: "El admin esta bloqueado en el preview (404). La evidencia estatica es favorable, pero la comprobacion visual exige un admin real"
---

# Phase 53: Base del rediseno, rama, preview, tema y shell. Verification Report

**Phase Goal:** Juan abre `dev.juan-tech.com` y ve el shell MUI funcionando con datos reales de Payload, sin que el admin ni produccion cambien.
**Verified:** 2026-11-17
**Status:** human_needed
**Re-verification:** Si. El reporte del 2026-11-07 quedo obsoleto porque cambiaron `.planning/REQUIREMENTS.md`, `next.config.mjs`, `HeaderView.tsx`, `SiteHeader.tsx` y `theme.ts` (fases 54 a 56). Este reporte vuelve a verificar todo contra el codigo de `62c1b2f` y contra el preview en vivo.

## Resumen

El objetivo se sostiene. Los cambios posteriores a la fase 53 no rompen ninguna verdad: el preview sigue con noindex, robots cerrado, admin y API de Payload en 404, escrituras inertes, tema MUI aplicado y shell con datos reales. Produccion sigue intacta (indexable, robots abierto con sitemap, admin en 200). Los 10 scripts de verificacion de la fase pasan hoy, incluido el chequeo de foco que antes fallaba de forma intermitente (40 paradas de Tab medidas, PASS).

Queda una verdad dependiente de comportamiento sin prueba: la revalidacion entre el admin de produccion y el preview (SC4). `53-UAT.md` registra que Juan renuncio a las cinco revisiones manuales el 2026-11-08; eso cierra la UAT pero no aporta evidencia, asi que la verdad sigue sin verificar y el estado correcto es `human_needed`. Si Juan quiere aceptarla sin prueba, basta con agregar un `overrides:` para SC4.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `dev.juan-tech.com`, desde `feat/mui-redesign`, responde con noindex (meta y X-Robots-Tag), robots.txt no permite rastreo y no publica sitemap | VERIFIED | `53-preview-contract.mjs` en vivo: 22 lineas PASS (robots 200 con `Disallow: /`, sin `Sitemap:`, `x-robots-tag` noindex en `/`, `/en` y `/robots.txt`, meta `noindex, nofollow`, `/sitemap.xml` y `/sitemap.html` 404). `53-wait-preview` no se repitio; el contrato cubre lo mismo. Local y `origin/feat/mui-redesign` en `62c1b2f`. El preview sirve codigo reciente de la rama (enlace `/sobre-mi` de la fase 54 presente en el HTML). |
| 2 | El preview lee la DB de produccion sin escribir: credenciales de solo lectura y rutas que escriben inertes | VERIFIED (rol de solo lectura por evidencia aportada en 53-06) | `53-write-gates.mjs` OK; `53-preview-contract.mjs --config-check` PASS (sin bandera: sin X-Robots-Tag y `rewrites()` vacio). En vivo: `/admin`, `/admin/login`, `/api/users`, `/api/graphql` 404; `/go/dinorank` 302. `53-crawl-parity.mjs`: 166 URLs del sitemap de produccion, 0 diferencias. El rol `juantech_preview_ro` descansa en la evidencia de 53-06; el verificador no lee credenciales. |
| 3 | Tema MUI v9 oscuro con tokens y Geist en `(frontend)`, y `/admin` igual que antes sin estilos MUI | VERIFIED (aspecto visual del admin como human-check) | `53-computed-styles.mjs` `styles` PASS en vivo. `53-layer-check.mjs` OK (646 nodos en la capa tailwind; control negativo 600 reglas sin capa). `grep` de `@mui`, `@emotion`, `src/theme` y `components/shell` en `src/app/(payload)`: sin resultados. Cambio de `theme.ts` desde la fase 53: solo `fontWeight` 500 a 400 en `mono` y `MuiChip` (fase 54), sin efecto en el aislamiento. `npx tsc --noEmit` limpio. |
| 4 | Nav y footer muestran los enlaces de los globals Header y Footer; un cambio en el admin aparece en el preview tras la revalidacion | PRESENT_BEHAVIOR_UNVERIFIED | Lectura del CMS verificada: `SiteHeader` sigue leyendo `getCachedHeader` y el HTML en vivo trae `/blog`, `/case-studies`, `/authors`, `/contact`, `/servicios` del global, y el footer sus columnas y legales. Cambio nuevo en `SiteHeader.tsx`: inyecta `/sobre-mi` solo cuando `isPreviewReadonly()` es verdadero (fase 54, se retira en la 57); no toca el global ni produccion. La mitad "aparece tras la revalidacion" no tiene prueba que la ejercite (ver Human Verification). |
| 5 | El selector de idioma cambia EN/ES conservando la ruta y el toggle de movimiento pausa y recuerda la eleccion | VERIFIED | `53-computed-styles.mjs` en vivo: `motion`, `lang`, `skip`, `overflow`, `drawer` y `focus` PASS. `53-shell-contract.mjs` PASS en `/` y `/en`; `--selftest` OK. `53-motion-script.ts` y `53-nav-links.ts` OK. |

**Score:** 4/5 truths verified (1 presente, comportamiento sin verificar)

### Cambios posteriores a la fase 53 revisados

| Archivo | Cambio | Efecto sobre la fase 53 |
|---------|--------|-------------------------|
| `next.config.mjs` | `experimental.globalNotFound: true` (fase 54) | Ninguno sobre preview o admin: `--config-check` PASS y rewrites del preview intactos. `global-not-found.tsx` importa `globals.css` y `SiteDocument`, pero solo renderiza URLs sin ruta; `/admin/*` lo resuelve el catch-all de Payload |
| `SiteHeader.tsx` | Enlace `/sobre-mi` solo en preview | Ninguno sobre produccion; condicionado por la bandera fail-closed |
| `HeaderView.tsx`, `FooterView.tsx` | `srOnly` con unidades `px` explicitas; titulos de columna del pie de `h3` a `h2` | Mejora de accesibilidad; contrato del shell PASS |
| `theme.ts` | Peso 400 en `mono` y `MuiChip` | Solo tipografia |
| `.planning/REQUIREMENTS.md` | BASE-01..03 marcados `[x]` / Complete | Trazabilidad al dia |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/theme/{theme,Providers,motion}.ts(x)` | Tema oscuro y estado de movimiento | VERIFIED | Estilos computados reales en vivo |
| `postcss-tailwind-layer.cjs` | `globals.css` en `@layer tailwind` | VERIFIED | layer-check OK |
| `src/lib/preview.ts`, `preview-flag.mjs`, `preview-guard.ts` | Bandera fail-closed y guarda | VERIFIED | write-gates y config-check OK |
| `src/components/shell/*` | Shell MUI | VERIFIED | Renderiza en vivo con datos de Payload |
| `scripts/verify/53-*` (10 scripts) | Verificacion determinista | VERIFIED | Todos ejecutados hoy, todos PASS |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `next.config.mjs` | `src/app/preview-blocked/route.ts` | rewrites `beforeFiles` con bandera | WIRED | admin y API 404 en vivo; `/api/redirects-lookup` y `/api/newsletter/*` abiertos |
| `middleware.ts` / `robots.ts` / `SiteHeader.tsx` | `src/lib/preview.ts` | `isPreviewReadonly()` | WIRED | Comportamiento confirmado en vivo |
| `SiteHeader` / `SiteFooter` | `getCachedHeader` / `getCachedFooter` | `findGlobal` | WIRED | Enlaces del CMS en el HTML |
| Globals Header/Footer | `cache-tags.ts` | `afterChange` | WIRED | Efecto entre procesos sin ejercer (SC4) |
| `MotionToggle` | `src/theme/motion.tsx` | `useMotion()` | WIRED | `motion` PASS con persistencia |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `HeaderView` | `items`, `cta`, `logo` | `getCachedHeader` a `findGlobal('header')` | Si, mas `/sobre-mi` inyectado solo en preview | FLOWING |
| `FooterView` | columnas, legales | `getCachedFooter` | Si | FLOWING |
| `LanguageSwitcher` | href alterno | `buildLocaleSwitchHref` | Si (`lang` PASS) | FLOWING |

### Behavioral Spot-Checks (ejecutados el 2026-11-17)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Contrato del shell | `BASE_URL=https://dev.juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/53-shell-contract.mjs` | PASS `/` (es) y `/en` (en), exit 0 | PASS |
| Paridad de crawl | `PREVIEW_BASE=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com node scripts/verify/53-crawl-parity.mjs` | 166 URLs, 0 diferencias, exit 0 | PASS |
| Contrato del preview | `BASE_URL=https://dev.juan-tech.com node scripts/verify/53-preview-contract.mjs` | 22 PASS, exit 0 | PASS |
| Config con y sin bandera | `53-preview-contract.mjs --config-check` | PASS | PASS |
| Navegador | `53-computed-styles.mjs` (REQUIRE_BUTTON=1) | styles, motion, skip, lang, overflow, drawer, focus PASS | PASS |
| Compuertas, capas, mensajes | `53-write-gates`, `53-layer-check`, `53-messages-parity` | OK | PASS |
| Helpers | `53-nav-links.ts`, `53-motion-script.ts`, `53-shell-contract --selftest` | OK | PASS |
| Produccion intacta | `curl` a `https://juan-tech.com` | `/` 200 sin x-robots-tag ni meta noindex; robots `Allow: /` con `Sitemap:`; `/admin` 200 | PASS |
| Tipos | `npx tsc --noEmit` | Sin errores | PASS |

### Probe Execution

SKIPPED: la fase no declara probes `scripts/*/tests/probe-*.sh`. Los scripts `53-*` cubren esa funcion y corrieron arriba.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BASE-01 | 53-01, 53-02, 53-06 | Rama, preview con DB de produccion en solo lectura, noindex y fuera del sitemap | SATISFIED | SC1 y SC2 |
| BASE-02 | 53-01, 53-05 | Tema MUI v9 oscuro en `(frontend)` sin afectar el admin | SATISFIED | SC3; revision visual del admin como human-check |
| BASE-03 | 53-03 a 53-06 | Nav, footer, selector de idioma y toggle con globals y `[locale]` reales | NEEDS HUMAN | Todo verificado salvo la revalidacion entre procesos (SC4) |

Sin requisitos huerfanos. REQUIREMENTS.md ya marca los tres como Complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| Archivos de la fase | n/a | `TBD`, `FIXME`, `XXX`, `TODO`, `HACK`, `PLACEHOLDER` | OK | Ninguno |
| `scripts/verify/53-wait-preview.mjs` | n/a | IN-02 del review sin aplicar (no exige 404 en `/admin` y `/api/users`) | Info | `53-preview-contract.mjs` lo exige y pasa |
| `src/migrations/*phase54*`, `*phase55*`, `*phase56*` | n/a | La rama ya trae migraciones de fases posteriores | Info | No pertenecen a la fase 53 (que no agrego ninguna); se evaluan en sus fases y en el corte de la 57 |

### Human Verification Required

#### 1. Revalidacion de nav y footer desde el admin real

**Test:** En el admin de produccion, cambiar una etiqueta del global Header (o Footer), guardar y recargar el preview a los 60 y 120 s sin redeploy. Restaurar el valor original.
**Expected:** El preview muestra la etiqueta nueva en 2 minutos como maximo.
**Why human:** `revalidateTag` corre en el proceso de produccion y no invalida la cache del preview; la propagacion depende del TTL de 60 s mas el ISR y exige una escritura real.

#### 2. Lectores de pantalla

**Test:** NVDA con Firefox y VoiceOver con Safari sobre el selector de idioma, el Drawer y el toggle de movimiento.
**Expected:** Landmarks con nombre propio, Drawer como dialogo con nombre, `aria-pressed` anunciado una vez, `aria-current` en el idioma activo.
**Why human:** Tecnologias de asistencia reales.

#### 3. Revision visual del shell

**Test:** Recorrer el preview a 900, 1024 y 1280 px.
**Expected:** Pill de nav sin desborde con los 7 enlaces del preview, contraste del texto secundario de al menos 4.5:1, footer y Drawer fieles al sandbox.
**Why human:** Fidelidad de diseno y contraste sobre fondo variable.

#### 4. Admin sin MUI

**Test:** Abrir `/admin/login` en local contra una base de pruebas.
**Expected:** Igual que antes, sin `data-emotion` ni variables `--jt-`.
**Why human:** El admin esta bloqueado en el preview; la evidencia estatica es favorable.

Nota: `53-UAT.md` registra que Juan renuncio a estas revisiones el 2026-11-08. El chequeo de foco visible, que antes era la quinta revision manual, ahora pasa de forma automatica (40 paradas de Tab) y sale de la lista.

### Gaps Summary

No hay gaps bloqueantes. Ninguna verdad quedo FAILED, no falta ningun artefacto y todos los enlaces clave estan cableados. Los cambios de las fases 54 a 56 sobre archivos de la fase 53 no causan regresiones: los 10 scripts pasan hoy contra el preview y produccion sigue igual. El estado `human_needed` responde a la revalidacion entre procesos (SC4), que ninguna prueba ejercita, mas tres revisiones que solo una persona puede cerrar.

---

_Verified: 2026-11-17_
_Verifier: Claude (gsd-verifier)_

## Validación humana (2026-11-17)

Juan escribió "acepto todo lo que esta" sobre los ítems human_needed de este informe. Se registran como excepción aceptada y el estado pasa a passed.
