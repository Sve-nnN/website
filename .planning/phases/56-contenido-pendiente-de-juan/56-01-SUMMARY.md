---
phase: 56-contenido-pendiente-de-juan
plan: 01
subsystem: verification
tags: [decisions-registry, content-guard, messages, i18n, tracer, d-01, d-19, d-22]
requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: 54-seed-lib (assertSafeTarget, assertNoForbiddenChars, findPendingMarkers), 54-messages-parity y el molde del orquestador
  - phase: 55-casos-websites-blog-y-autores
    provides: 55-run-all con la regresion viva y de autopruebas, y 55-seo-parity
provides:
  - Registro de decisiones con estado (aprobado, propuesto, pendiente) y gate minimo por texto, con helpers puros resolveDecision, gateFailures y validateDecisions
  - 56-gate.ts que descubre por si solo todo scripts/db/data/56-*.ts y junta su export DECISIONS (modo --gate para la fase 57)
  - 56-content-guard.mjs, guardia estatica de datos y de scripts 2N-phase56-* (D-01, T-56-01, T-56-02)
  - 56-run-all.mjs con todos los pasos de la fase declarados por nombre, SKIP, --strict y regresion de la 55
  - 56-review-export.ts, que imprime en markdown los textos que Juan debe aprobar, por prefijo de id
  - messages sin rayas, emailCapture en voz de Juan y vigilado por la paridad, y la clave legal.effectiveOn
affects: [56-02, 56-03, 56-04, 56-05, 56-06, 56-07, 56-08, 56-09, 56-10, 56-11, 56-12, 56-13, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "Una decision es una constante con estado y gate; el gate de la fase 57 lee el estado y no la memoria"
    - "Descubrimiento por convencion: cada plan crea su archivo scripts/db/data/56-*.ts con DECISIONS y nunca edita el registro ni el orquestador"
    - "SKIP por script ausente en el orquestador, con --strict para el ultimo plan"
key-files:
  created:
    - scripts/db/data/56-content-decisions.ts
    - scripts/db/data/56-messages-voice.ts
    - scripts/verify/56-gate.ts
    - scripts/verify/56-content-guard.mjs
    - scripts/verify/56-seed-selftest.ts
    - scripts/verify/56-run-all.mjs
    - scripts/verify/56-review-export.ts
  modified:
    - messages/es.json
    - messages/en.json
    - scripts/verify/54-messages-parity.mjs
    - scripts/verify/55-seo-parity.mjs
key-decisions:
  - "El gate trata un modulo 56-*.ts sin export DECISIONS como problema de forma: la convencion es obligatoria, aunque el arreglo pueda ir vacio"
  - "La guardia exige --apply y --db-checked solo a los scripts que escriben; un verificador de solo lectura (como 25-phase56-verify-schema) solo debe importar y llamar assertSafeTarget"
  - "La revision de messages/*.json va en un modo aparte (--messages) para que el plan que los limpia pueda correr --data antes de terminar"
  - "La paridad SEO de home y legales se hace con una bandera nueva --paths de 55-seo-parity, porque su lista de rutas no incluye home ni privacy ni terms"
patterns-established:
  - "Prefijos de id de decision: D-22a a D-22g y D-11 (home y Sobre mi), CTA-, LEGAL-, LESSON-, ALT-, HEAD-, CUT-, MSG-"
requirements-completed: []
duration: 12min
completed: 2026-11-10
status: complete
commits: 5
plan_head_before: f7a87f3312cb0b88e007d9e849211b4680bca8c1
actuals:
  tokens: 17500
  tasks: 3
  commits: 5
---

# Phase 56 Plan 01: Base de verificacion y pasada de voz de messages Summary

Registro de decisiones con estado por texto, guardia estatica que rechaza cualquier script de la fase sin dry-run ni assertSafeTarget, orquestador con todos los pasos de la fase ya declarados, y messages sin rayas con el namespace emailCapture en voz de Juan y vigilado por la paridad. Cero escrituras a la base y cero acceso a ella.

## Qué quedó hecho

**Task 1 (tracer): decision de punta a punta, del dato al gate.**
- `56-content-decisions.ts`: tipos `Decision` y `DecisionStatus`, y los helpers puros `resolveDecision`, `gateFailures` y `validateDecisions`. Un `pendiente` falla el corte siempre; un `propuesto` falla solo si su gate es `aprobado`; el resto sale como aviso para el handoff.
- `56-gate.ts`: descubre los módulos `56-*.ts` con `fs`, junta `DECISIONS`, valida id único, estado válido y `chosen` dentro de `options`. Modos `--gate`, `--json` y `--selftest`. Con cero módulos sale 0.
- `56-content-guard.mjs`: `--data` rechaza rayas largas, rayas medias y marcador de ranura (armados por código); `--scripts` exige por cada `scripts/db/2N-phase56-*.ts` que importe y llame `assertSafeTarget`, que no cargue `.env` por bandera ni con dotenv, que no borre (Local API ni SQL), que todo `payload.update` de colección lleve `draft: false` y que no imprima `DATABASE_URI`. Los comentarios se descartan antes de revisar, así que documentar "no uses `--env-file`" no dispara la guardia. La autoprueba tiene 20 fixtures buenos y malos.
- `56-seed-selftest.ts`: autoprueba del registro y de los helpers de `54-seed-lib` que la fase usa.
- `56-run-all.mjs`: todos los pasos de la fase declarados por nombre. Un script ausente imprime SKIP y no falla; con `--strict` cuenta como FAIL. Importa la regresión de la 55 (que importa la de la 54).

**Task 2: rayas fuera de emailCapture (D-19), `legal.effectiveOn` y paridad vigilando emailCapture.**
- Las 7 rayas (3 en ES, 4 en EN) salieron con la tabla de RESEARCH sección 8, en singular. `privacyPrefix`, `privacySuffix` y el `pendingBody` EN pasaron de "nosotros" a "yo".
- `legal.effectiveOn` existe en ES ("Vigente desde el {date}") y EN ("Effective as of {date}"), para que el plan 56-08 no edite mensajes.
- `emailCapture` entró a `REVIEWED` de `54-messages-parity.mjs`; la 55 lo hereda sin tocarla. La autoprueba suma dos casos: emailCapture vigilado y clave ausente en un solo idioma.
- `56-messages-voice.ts`: una decisión `MSG-emailCapture-*` por clave cambiada, estado `propuesto`, gate `propuesto`, con antes y después en ES y EN.

**Task 3: exportador de revisión.**
- `56-review-export.ts --only <prefijos>` imprime markdown, una sección por decisión (estado, gate, elegida, recomendada, opciones con ES y EN, vista previa). Sin `--only` agrupa por prefijo. Solo lee archivos del repo.

## Verificación

- Task 1 (todo en verde): guardia `--selftest`, guardia sin banderas, `56-gate --selftest`, `56-gate` (tabla vacía y salida 0), `56-seed-selftest`, `56-run-all --selftest`, `node --check`. Barrera del tracer: con `AUTO_CFG` falso y `HUMAN_VERIFY_MODE=end-of-phase` se volvió a correr la verificación automatizada de punta a punta y pasó; se siguió con la expansión.
- Task 2: paridad 54 (`--selftest` y real) con emailCapture en PASS, paridad 55, comprobación Node de rayas y `{date}`, guardia `--data` y `--messages`, `npx tsc --noEmit`.
- Task 3: `56-review-export --selftest` y `--only MSG` lista las 6 decisiones con antes y después.
- `node scripts/verify/56-run-all.mjs --selftests` completo (sin `--strict`): 63 pasos PASS, 0 FAIL, 16 SKIP. Los 16 SKIP son scripts de planes posteriores (56-inputs-check, 56-migration-additive, 25-phase56-verify-schema, las autopruebas de datos y los verificadores vivos). Incluye la regresión completa de la 55 y la 54.
- `55-seo-parity.mjs --paths /,/en,/privacy` contra producción consigo misma (solo GET): 3 PASS, valida el comparador con la bandera nueva.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] La paridad SEO de home y legales no se podía hacer con `55-seo-parity --routes`**
- **Found during:** Task 1, al declarar el paso vivo "55-seo-parity con las rutas de home y legales en es y en".
- **Issue:** `allRoutes` de `55-seo-parity.mjs` arma la lista desde producción con casos, websites, blog y autores; no incluye `/`, `/en`, `/privacy` ni `/terms`. `--routes /,/privacy,...` habría respondido "no coincide con ninguna ruta de la lista" y fallado siempre.
- **Fix:** bandera aditiva `--paths a,b,c` en `55-seo-parity.mjs` que compara esas rutas exactas sin construir la lista desde producción. `56-run-all.mjs` la usa con las seis rutas (`/`, `/en`, `/privacy`, `/en/privacy`, `/terms`, `/en/terms`).
- **Files modified:** `scripts/verify/55-seo-parity.mjs` (fuera de `files_modified` del plan; ningún otro plan de la fase lo edita)
- **Commit:** d7f442e

**2. [Rule 1 - Bug] `--apply` y `--db-checked` exigidos a scripts de solo lectura**
- **Found during:** Task 1, al contrastar la guardia con el plan 56-03 (`25-phase56-verify-schema.ts` es de solo lectura y su verificación corre la guardia sin banderas).
- **Issue:** exigir las banderas a todo `2N-phase56-*` habría hecho fallar ese verificador sin motivo. D-01 pide las banderas a quien escribe.
- **Fix:** la guardia exige `--apply` y `--db-checked` solo si el script contiene una escritura (`payload.create`, `update`, `updateGlobal`, `duplicate` o `findOrCreateMedia`). Todo script, escriba o no, debe importar y llamar `assertSafeTarget`.
- **Files modified:** `scripts/verify/56-content-guard.mjs`
- **Commit:** d7f442e

**3. [Rule 1 - Bug] La guardia de datos sin banderas habría fallado antes de limpiar messages**
- **Found during:** Task 1. El plan pide que `node scripts/verify/56-content-guard.mjs` pase en la Task 1, pero las rayas de messages se quitan en la Task 2.
- **Fix:** el escaneo de `messages/*.json` va en un modo propio `--messages` (solo rayas), que `56-run-all` corre como paso. `--data` y el modo sin banderas cubren solo `56-*.ts` y `56-*.json`.
- **Files modified:** `scripts/verify/56-content-guard.mjs`, `scripts/verify/56-run-all.mjs`
- **Commit:** d7f442e

### Notas de proceso

- `commits: 5` es el conteo medido de `git rev-list` desde `plan_head_before`. Tres son de este plan (d7f442e, 09d9198, eb8cb68). Los otros dos (1a47eb0 y 10130fc) son commits de documentación del orquestador que registran las decisiones de Juan sobre la home en `.planning/phase-56-prep/aprobaciones-juan.md`, entraron en la rama mientras corría el plan y no tocan archivos de este plan.
- El registro de decisiones del lote 1 de CTAs y de la home no se crea aquí: este plan solo deja el mecanismo. Los consume el plan 56-02 (entrada de Juan y datos tipados) y el 56-10 (aplicación de CTAs).

## Auth gates

Ninguno. El plan no abre la base ni la red.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. El plan no agrega endpoints, rutas de autenticación ni acceso a archivos fuera del repo.

## Items abiertos para Juan

1. **`emailCapture.pendingBody` en español sigue en plural.** Dice "Te enviamos un enlace...", mientras el EN pasó a "I sent you...". El plan no pedía cambiarlo, así que no lo toqué. Si quieres singular, la propuesta es "Te envié un enlace para confirmar tu suscripción y desbloquear la descarga." (una línea en `messages/es.json`).
2. **Las seis decisiones `MSG-emailCapture-*` están en estado `propuesto`** con gate `propuesto`. Las ves con `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only MSG`.
3. **El plan 56-12 debe usar `55-seo-parity --paths`** (no `--routes`) si compara home, privacy o terms con producción.

## Self-Check: PASSED

Archivos creados presentes: `56-content-decisions.ts`, `56-messages-voice.ts`, `56-gate.ts`, `56-content-guard.mjs`, `56-seed-selftest.ts`, `56-run-all.mjs`, `56-review-export.ts`. Commits d7f442e, 09d9198 y eb8cb68 presentes en la rama feat/mui-redesign.
