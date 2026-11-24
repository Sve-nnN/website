---
phase: 56-contenido-pendiente-de-juan
plan: 12
subsystem: db-seed
tags: [seed, shadow-globals, legal-pages, home-page, about-page, dry-run, checkpoint, d-02, d-14, cont-01, cont-02, cont-03]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: 56-03 (migracion phase56_legal_shadow, 56-seed-lib, 25-verify-schema), 56-04 (ABOUT_COPY), 56-09 (HOME_COPY), 56-11 (PRIVACY/TERMS ES y EN)
provides:
  - 26-phase56-seed-shadow.ts (home-page y about-page, ES por defecto, EN opt-in, centinela EN, recorte explicito, respaldo)
  - 27-phase56-seed-legal.ts (privacy y terms en Lexical, nunca effectiveDate)
  - 25-phase56-verify-schema.ts con --es-only
  - 56-shadow-seed-selftest.ts (44 casos con Local API falsa) y 56-no-marker-live.mjs (17 casos con HTML sintetico)
affects: [56-13, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "Script de siembra con run() inyectable: la autoprueba le pasa una Local API falsa y una base de Neon sin abrir Payload"
    - "El plan completo (solo lectura) corre antes de la primera escritura, asi un recorte sin bandera aborta sin dejar nada a medias"
    - "El EN es opt-in por script mientras su decision siga propuesta: --include-en, y --allow-proposed-en si el registro no esta aprobado"
key-files:
  created:
    - scripts/db/26-phase56-seed-shadow.ts
    - scripts/db/27-phase56-seed-legal.ts
    - scripts/verify/56-shadow-seed-selftest.ts
    - scripts/verify/56-no-marker-live.mjs
  modified:
    - scripts/db/25-phase56-verify-schema.ts
    - scripts/db/data/56-seed-lib.ts
key-decisions:
  - "El EN de home, about y legal NO se siembra por defecto: HOME-EN, ABOUT-EN y LEGAL-*-EN siguen propuestos. Se abre con --include-en (y --allow-proposed-en mientras el registro no diga aprobado). Instruccion del orquestador por encima del plan, que decia 'centinela EN siempre'"
  - "El centinela EN se exige cuando el EN se incluye (el script aborta si tagline, hero.lead de home o hero.lead de about quedan vacios)"
  - "Comparacion tolerante: una cadena vacia y un valor ausente cuentan como iguales, porque el copy manda cadena vacia para quitar notas y cifras y Payload puede devolver null"
  - "El dry-run con 5 etapas contra 4 sale 0 y lista la fila; --apply sin --allow-shrink-stages aborta sin escribir ningun global; --allow-shrink-stages sin --apply aborta"
  - "27 trata como pendiente solo el estado pendiente; una decision LEGAL propuesta del ES no bloquea (orden del orquestador)"
requirements-completed: []
duration: 55min
completed: 2026-11-11
status: checkpoint-pending
commits: 2
plan_head_before: 4bb2dad231972e7524f38c835ef7ccda8b667498
actuals:
  tokens: 17300
  tasks: 1
  commits: 2
---

# Phase 56 Plan 12: Siembra sombra y verificacion Summary (checkpoint pendiente)

Task 1 (tracer) terminada y comprobada sin tocar ninguna base: dos scripts de siembra con dry-run por defecto, guardia de base antes de importar Payload, EN opt-in, recorte de etapas explicito y autoprueba con Local API falsa, mas el verificador vivo de cero marcadores. El plan se detiene en el checkpoint Task 2 (migracion y siembra con Juan). Task 3 (push, espera del despliegue y verificacion contra dev) no se ejecuto: exige el push, que este agente no hace.

## Que quedo hecho

**Task 1 (tracer), commits a46547b y f0ef124.**
- `26-phase56-seed-shadow.ts`: siembra `home-page` y `about-page`. Lee con `fallbackLocale: false`, envia el grupo completo fusionado, relee y compara. Banderas `--apply`, `--db-checked`, `--only home|about`, `--include-en`, `--allow-proposed-en`, `--allow-shrink-stages`, `--print-current`. `--print-current` manda el JSON a stdout y los avisos a stderr, para poder redirigirlo a un archivo.
- Antes de abrir Payload: `assertSafeTarget`, cero rayas y cero marcadores (`assertNoForbiddenChars` sin rutas permitidas), ninguna clave de master (`title`, `meta`, `slug`, `description`, `seo`), y con EN incluido el estado de la decision y el centinela. Ya con Payload abierto valida que cada clave del copy exista en el global.
- Plan de solo lectura de todos los globals y locales antes de la primera escritura. Si hay filas de mas y falta `--allow-shrink-stages`, no se escribe ni la home.
- `27-phase56-seed-legal.ts`: `privacy.body` y `terms.body` con `sectionsToLexical`. Compara por texto aplanado (encabezados, parrafos, elementos de lista). `assertNoEffectiveDate` lanza si el dato trae la fecha; ningun dato la lleva. Imprime el estado de cada decision LEGAL y aborta si alguna esta `pendiente` salvo `--allow-pending`.
- `25-phase56-verify-schema.ts` y `56-seed-lib.ts`: bandera `--es-only` (sin ella, con el EN sin sembrar, los pasos de verificacion fallarian por el centinela EN y por privacy y terms EN).
- `56-shadow-seed-selftest.ts`: 44 casos PASS. Dry-run sin escritura; `--apply` sin `--db-checked`; base de Neon y base con otro nombre antes de importar nada; solo ES por defecto; idempotencia; null por cadena vacia; EN propuesto aborta; centinela vacio aborta; copy con `title`, clave ajena, raya o marcador aborta; 5 etapas contra 4 con y sin bandera, conservando ids; `--print-current`; script 27 sin `effectiveDate` nunca.
- `56-no-marker-live.mjs`: 18 rutas ES y EN, marcador en texto visible y en payload RSC por separado, aviso de traduccion en `/en` y `/en/sobre-mi`, un solo testimonio de produccion (verificado ahora: hay 1, Patricia Ibarra) y su nombre en la home. `--allow-en-notice` para cuando el EN no se sembro a proposito.

## Verificacion

- `tsx scripts/verify/56-shadow-seed-selftest.ts`: 44 PASS, salida 0.
- `node scripts/verify/56-no-marker-live.mjs --selftest`: 17 PASS.
- `node scripts/verify/56-content-guard.mjs`: PASS en datos (16 archivos) y scripts (25, 26 y 27 revisados). `--selftest` PASS.
- `tsx scripts/db/25-phase56-verify-schema.ts --selftest`: PASS con los casos nuevos de `--es-only`.
- `npx tsc --noEmit`: sin errores.
- `56-run-all.mjs --selftests` completo: 0 FAIL (incluye `56-shadow-seed-selftest`, `56-no-marker-live --selftest` y la regresion de la 55 y la 54).
- Los dos scripts, corridos como programa sin `DATABASE_URI` o con un host de Neon, imprimen `ABORT` y salen 1 sin abrir Payload. Ninguna base fue abierta.
- Barrera del tracer (`AUTO_CFG` falso, `HUMAN_VERIFY_MODE=end-of-phase`, verificacion solo automatizada): se volvio a correr de punta a punta el `<verify>` de Task 1 y paso antes de seguir.

## Checkpoint pendiente: Task 2 (Juan, base de produccion)

Los comandos exactos van en el mensaje de retorno del agente. Resumen del orden: tunel, `DATABASE_URI` en vivo por ssh, pre-flight (`<usuario> 127.0.0.1 15432 /juantech ?sslmode=disable`), `04-which-database`, leer el SQL, `payload migrate`, verificar con el dueno y con `juantech_preview_ro`, respaldo con `--print-current`, dry-run de 26 y 27, aplicar home ES y legal ES, recorte de about con la frase "apruebo recortar etapas de about-page de 5 a 4", verificar con `--es-only` con los dos roles. El EN es un bloque aparte y opcional que Juan abre solo tras aprobar HOME-EN, ABOUT-EN y los cuatro documentos legales.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] El EN no se siembra por defecto**
- **Found during:** diseno de Task 1, por instruccion del orquestador.
- **Issue:** el plan dice que el centinela EN se siembra siempre. HOME-EN, ABOUT-EN y LEGAL-*-EN siguen `propuesto`, y sembrarlos hace visible texto que Juan no aprobo en el preview.
- **Fix:** EN opt-in con `--include-en`; mientras el registro no diga `aprobado` exige ademas `--allow-proposed-en`. El centinela se exige cuando el EN entra.
- **Consecuencia:** hasta sembrar el EN, `/en` y `/en/sobre-mi` muestran el aviso de traduccion y el criterio 1 en su parte EN no se cumple. El verificador acepta `--allow-en-notice` para ese estado intermedio.
- **Files modified:** `26-phase56-seed-shadow.ts`, `27-phase56-seed-legal.ts`
- **Commit:** a46547b

**2. [Rule 3 - Blocking] 25-phase56-verify-schema.ts no podia verificar una siembra solo ES**
- **Found during:** Task 1.
- **Issue:** `--expect-seeded --expect-shadow-seeded` exigen centinela EN y privacy y terms EN, asi que los pasos 12 y 13 del checkpoint fallarian con el EN sin sembrar.
- **Fix:** bandera `--es-only` en el verificador y en los evaluadores de `56-seed-lib.ts`, con casos de autoprueba.
- **Commit:** a46547b

**3. [Rule 1 - Bug] Comparacion estricta marcaria diferencia donde no la hay**
- **Found during:** Task 1.
- **Issue:** el copy de la home manda `''` para quitar notas y cifras; Payload puede devolver `null`, y `buildDiff` de la 54 los trata como distintos (repetir la siembra reescribiria siempre y la relectura fallaria).
- **Fix:** `diffLenient` (cadena vacia igual a ausente) en el script 26, con caso de autoprueba.
- **Commit:** a46547b

**4. [Rule 2 - Missing critical] Pre-flight con usuario y query, sin pegar la clave**
- El pre-flight de las instrucciones imprime tambien el usuario y el `?sslmode=disable`, como pidio el orquestador, y el `DATABASE_URI` del rol del preview se arma dentro de un subshell para que la clave nunca se imprima en pantalla.

### Notas de proceso

- Task 3 no se ejecuto: necesita `git push origin feat/mui-redesign` despues de que Juan migre y siembre, y el orquestador pidio no empujar.
- Se usa `pathToFileURL(process.argv[1])` para que los scripts exporten `run()` para la autoprueba y solo corran `main()` cuando se invocan directo; comprobado arrancandolos como programa.
- `scripts/verify/56-cutover-selftest.ts` (de otro plan) estaba sin seguimiento en el checkout y no se toco. `.planning/state.json`, `research/*` y los demas archivos sucios previos tampoco.
- No se edito STATE.md ni ROADMAP.md (instruccion del orquestador).

## Auth gates

Task 2 es un `checkpoint:human-action` con `gate="blocking-human"`: Claude no abre el relay ni el tunel ni toca la base. Es el flujo esperado, no una desviacion.

## Known Stubs

Ninguno. Que el EN quede sin sembrar es una decision de aprobacion pendiente, no un stub en codigo.

## Threat Flags

Ninguno fuera del registro del plan. T-56-39 (guardia + `--db-checked` + pre-flight), T-56-42 (bandera, fila impresa, respaldo y frase), T-56-43 (clave solo en el shell) y T-56-44 (solo globals sombra, nunca title ni meta) quedan cubiertos en codigo y autoprueba; T-56-40, T-56-41 y T-56-45 dependen de lo que Juan pegue en el checkpoint.

## Items abiertos para Juan

1. Correr el checkpoint (comandos en el mensaje de retorno) y pegar las salidas de los pasos de verificacion.
2. Aprobar o no el recorte de etapas con la frase exacta "apruebo recortar etapas de about-page de 5 a 4".
3. Aprobar HOME-EN, ABOUT-EN y LEGAL-PRIVACY-EN, LEGAL-TERMS-EN (y el ES de ambos documentos) para abrir el bloque EN; sin eso `/en` y `/en/sobre-mi` siguen con el aviso de traduccion.
4. Task 3 queda para cuando se autorice el push.

## Self-Check: PASSED

Archivos presentes: `scripts/db/26-phase56-seed-shadow.ts`, `scripts/db/27-phase56-seed-legal.ts`, `scripts/verify/56-shadow-seed-selftest.ts`, `scripts/verify/56-no-marker-live.mjs`, `scripts/db/25-phase56-verify-schema.ts`, `scripts/db/data/56-seed-lib.ts`. Commits a46547b y f0ef124 presentes en la rama feat/mui-redesign.
