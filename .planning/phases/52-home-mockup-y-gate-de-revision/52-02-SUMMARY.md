---
phase: 52-home-mockup-y-gate-de-revision
plan: 02
subsystem: designs/redesign-v3/app (copy lint y primitivas de la home)
tags: [voz, lint, copy, pendientes, ui-primitives, d-05]
requires: []
provides:
  - "pending.ts: splitPending, countPending, hasMalformedPending, PENDING_RE"
  - "links.ts: isAllowedHref (lista cerrada de destinos, compartida por V14 y SafeLink)"
  - "scripts/check-copy.mjs: lint V01 a V16, --selftest, --json, salidas 0, 1 y 2"
  - "ui.tsx: Lang, pick, Pending, Text, SectionShell, SafeLink"
  - "copy/types.ts: Localized, NumberSource, AllowEntry, CopyFile"
affects: [52-01, 52-03, 52-04, 52-05, 52-07]
tech-stack:
  added: []
  patterns:
    - "Node 24 importa .ts con extension sin compilar (solo sintaxis borrable)"
    - "Una sola fuente de verdad para el marcador de pendiente y para los destinos permitidos"
key-files:
  created:
    - designs/redesign-v3/app/src/home/pending.ts
    - designs/redesign-v3/app/src/home/links.ts
    - designs/redesign-v3/app/src/home/ui.tsx
    - designs/redesign-v3/app/src/home/copy/types.ts
    - designs/redesign-v3/app/scripts/test-pending.mjs
    - designs/redesign-v3/app/scripts/check-copy.mjs
    - designs/redesign-v3/app/scripts/lib/voice-rules.mjs
    - designs/redesign-v3/app/scripts/fixtures/copy-bad.json
    - designs/redesign-v3/app/scripts/fixtures/copy-good.json
  modified: []
key-decisions:
  - "SafeLink siempre lanza ante un destino fuera de lista (el copy es estatico y el harness sirve la build de produccion)"
  - "Una carpeta src/home/copy inexistente cuenta como vacia: INFO y salida 0"
  - "Pending separa la insignia (nowrap del kit) de la descripcion para que esta pueda partirse en lineas"
requirements-completed: [HOME-03, HOME-04]
status: complete
commits: 3
plan_head_before: 48e78573ddf3ae00e65a9f174b72794b3731cb17
actuals:
  tokens: 12700
  tasks: 3
  commits: 3
metrics:
  completed: 2026-10-15
---

# Phase 52 Plan 02: Lint de voz y primitivas de la home Summary

Guía de voz y D-05 como verificación ejecutable: `check-copy.mjs` aplica las reglas V01 a V16 sobre los JSON de copy de la home, y `ui.tsx` deja las seis primitivas que 52-03, 52-04 y 52-05 comparten.

## Resultados

- `node --test scripts/test-pending.mjs`: 8 pruebas, 8 pasan.
- `node scripts/check-copy.mjs --selftest`: `RESULT selftest pass=70 fail=0`, salida 0.
  - El fixture malo dispara exactamente `_expect` (V01 a V16; V15 como WARN, el resto FAIL) y el bueno no dispara nada.
  - 28 comprobaciones en línea: falsos positivos, `_allow`, `quote`, `_numbers`, pendientes, paridad, encabezados, destinos y códigos de salida de la CLI (carpeta vacía, archivo inexistente, opción desconocida).
- `npm run typecheck` y `npm run build` en verde.
- `git status --short -- package.json package-lock.json pnpm-lock.yaml yarn.lock src` en la raíz: sin salida.
- Ningún archivo nuevo contiene el carácter real de guion largo o corto (comprobado con grep y dentro del selftest).

## Reglas implementadas

| Id | Nivel | Guía | Qué detecta |
|----|-------|------|-------------|
| V01 | FAIL | 4.1 regla 1 | guion largo o corto en cualquier cadena |
| V02 | FAIL | 4.1 regla 9, D-07 | `, . : ; ... !` en encabezados; `¿?` solo en `question`; cifra agrupada con punto o coma |
| V03 | FAIL | 4.1 regla 3 | voseo y regionalismos de la lista (ES) |
| V04 | FAIL | 4.1 regla 2 | voz pasiva heurística ES y EN; admite `_allow` |
| V05 | FAIL | 4.3 y brief | vocabulario y estructuras de IA o folleto, ES y EN |
| V06 | FAIL | 4.1 regla 11 | agencia, plural mayestático, Sapling, "we", "our", "us" |
| V07 | FAIL | 4.1 regla 4, D-05 | cifra sin entrada con fuente en `_numbers` |
| V08 | FAIL | D-05 | marcador mal formado o distinto conteo ES y EN |
| V09 | FAIL | 4.1 regla 7 | árbol de claves, longitud de listas, cadenas vacías, encabezados idénticos |
| V10 | FAIL | 4.1 regla 10 | `meta.title` de más de 60, con punto o coma, sin sufijo ` | Juan Carlos Angulo` |
| V11 | FAIL | 4.2 | `!` y `¡`; sin excepción |
| V12 | FAIL | 6 | `terminal` de más de 3 palabras |
| V13 | FAIL | 4.2 | Title Case en encabezados EN de 3 o más palabras; admite `_allow` |
| V14 | FAIL | T-52-02 | `href`, `url`, `repoUrl`, `commitUrl` fuera de la lista |
| V15 | WARN | 4.2 | frases de más de 40 palabras; admite `_allow` |
| V16 | FAIL | 4.1 regla 7, D-06 | 2 o más palabras vacías del otro idioma; admite `_allow` |

Solo V04, V13, V15 y V16 admiten `_allow`, con `reason` obligatorio. Una entrada para otra regla se ignora y además se reporta como error de esquema. Cada excepción aplicada se imprime como `INFO archivo ALLOW regla | ruta | motivo` (y sale en `--json` bajo `allowed`), para que el reporte de 52-07 las liste.

## Falsos positivos ajustados

Se ajustaron las reglas, no los fixtures.

- "así sea X, Y o Z": no marca V04 (`sea` no va seguido de participio) ni V05 (`ya sea` es otra cadena). Cubierto en el selftest, junto con la comprobación de que "ya sea" sí marca V05.
- `A11Y`, `H1`, `23646a1`, `6849e95`: los números pegados a letras no cuentan como cifra (lookbehind y lookahead Unicode). Cubierto en el selftest.
- `Next.js` en encabezados: el punto solo falla si va seguido de espacio o fin de cadena, así que `Next.js` no marca V02.
- Participios ES en V04: exige al menos 2 letras antes de `ado/ido`, así que "es lado", "es dado" no marcan.
- Participios EN en V04: lista de excepciones en `-ed` que no son participios (speed, need, seed, feed, embed, proceed, succeed, exceed, indeed, hundred).
- Los `[PENDIENTE: ...]` se quitan antes de V02 a V07, V15 y V16, porque son anotaciones de revisión en español incluso dentro del inglés y marcarían V16.
- Prueba con cadenas reales del mapa de copy (clientes, servicios, auditor, FAQ): 0 hallazgos.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Archivo extra `src/home/links.ts`**
- **Found during:** Tarea 2
- **Issue:** La lista de destinos permitidos tenía que vivir en dos sitios (V14 en el lint y `SafeLink` en `ui.tsx`). Dos copias divergen, y la amenaza T-52-02 depende de que coincidan.
- **Fix:** una función pura `isAllowedHref` en `src/home/links.ts`, sin importaciones, que importan el lint (con extensión `.ts`) y `ui.tsx`. Dentro de `designs/redesign-v3/app/**`. Rechaza además `//host`, `/\host`, credenciales en la URL, puerto, espacios y control; exige límite de ruta en `github.com/Sve-nnN/website` y `linkedin.com/in/juancangulo`.
- **Files modified:** `designs/redesign-v3/app/src/home/links.ts` (nuevo)
- **Commit:** 543bc14

**2. [Rule 2 - Missing critical] Carpeta de copy inexistente cuenta como vacía**
- **Found during:** Tarea 2, al correr la CLI sin argumentos en un checkout limpio
- **Issue:** `src/home/copy/` no existe hasta que 52-03 escribe el primer JSON y la CLI salía con 2.
- **Fix:** `ENOENT` en la carpeta por defecto se trata como carpeta vacía (INFO y salida 0); cualquier otro error de lectura sigue saliendo con 2.
- **Commit:** 543bc14

**3. [Detalle de implementación] Escapes Unicode en los archivos nuevos**
- La herramienta de escritura convirtió las secuencias `—` y `–` en los caracteres reales. Se reemplazaron con `perl` por las secuencias de escape en `check-copy.mjs`, `voice-rules.mjs` y `copy-bad.json`, y el selftest quedó verificando que no haya caracteres reales en los fixtures.

Sin otras desviaciones. `designs/redesign-v3/app/package.json`, `src/gallery` y los archivos de 52-01 no se tocaron. No se instaló ningún paquete (`npm install` en la app solo restauró las dependencias ya declaradas).

## Limitación de cobertura de `ui.tsx`

`ui.tsx` pasa `typecheck` y `build`, pero ningún módulo de la app lo importa todavía, así que la build lo descarta por tree-shaking y no se ejecuta en el navegador. Verificación adicional hecha fuera del repo: renderizado en servidor con Vite `ssrLoadModule` y `renderToStaticMarkup` (script desechable en el scratchpad). Confirmó el HTML de `SectionShell` (`id`, `data-section`, `aria-labelledby`, `data-surface="reading"`), de `Text` con un `[PENDIENTE: ...]` (insignia `badge badge--pending pixel-label` con `lang="es"` y descripción en un `span` aparte), de `SafeLink` (`rel="noopener noreferrer"` y `target="_blank"` con `newTab`) y que `SafeLink` lanza ante `https://evil.example`. La primera cobertura en el navegador llega con el stage `proof` de 52-03.

Decisión de `SafeLink`: lanza siempre, también en producción. El plan lo pide en desarrollo y en la build de pruebas, y el harness sirve la build de producción; como el copy es estático y V14 lo valida antes, un destino inválido no debe llegar a la página.

## Known Stubs

Ninguno. `src/home/copy/` aún no tiene JSON: los escriben 52-03 a 52-05.

## Threat Flags

Ninguno. Las amenazas T-52-02, T-52-07, T-52-09 y T-52-SC del plan quedan mitigadas como se describe: `isAllowedHref` con lanzamiento en `SafeLink` y V14, V07/V08/V09 contra cifras inventadas, `_allow` restringido con motivo obligatorio, y cero instalaciones.

## Self-Check: PASSED

- Archivos creados verificados: pending.ts, links.ts, ui.tsx, copy/types.ts, test-pending.mjs, check-copy.mjs, voice-rules.mjs, copy-bad.json, copy-good.json.
- Commits verificados: 1becedf, 543bc14, e8a7500.
