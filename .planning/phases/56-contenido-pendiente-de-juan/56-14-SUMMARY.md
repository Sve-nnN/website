---
phase: 56-contenido-pendiente-de-juan
plan: 14
subsystem: db-cutover
tags: [cutover, loader, dry-run, handoff, checkpoint, d-01, d-02, d-03, d-09, d-10, cont-01, cont-02, cont-03, tracer, tdd]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: CUTOVER_ITEMS y el selftest de datos (56-13), siembra sombra y verificadores vivos (56-12), lecciones, alt y copy legal (56-05 a 56-11)
provides:
  - 28-phase56-cutover-load.ts, cargador del corte con dry-run por defecto, probado solo contra una Local API falsa y marcado para el corte (fase 57)
  - 56-cutover-selftest.ts extendido con una Local API falsa que modela la perdida del ES y la despublicacion sin draft false (122 casos)
  - 56-CUTOVER-HANDOFF.md, insumo del gate de la fase 57 con orden del corte, aprobaciones, via de regreso y decisiones abiertas
affects: [57]
tech-stack:
  added: []
  patterns:
    - "Cargador con run() inyectable: la autoprueba le pasa items, fecha legal, reloj y una Local API falsa, y una base de Neon nunca llega a importar Payload"
    - "Plan completo de solo lectura antes de la primera escritura; con --apply, un item negado entre los elegidos aborta todo sin escribir nada"
    - "Arreglos con subcampos localizados: grupo completo fusionado, ES, relectura de id de fila, EN con esos id, relectura y comparacion"
key-files:
  created:
    - scripts/db/28-phase56-cutover-load.ts
    - .planning/phases/56-contenido-pendiente-de-juan/56-CUTOVER-HANDOFF.md
  modified:
    - scripts/verify/56-cutover-selftest.ts
    - scripts/db/data/56-cutover-data.ts
key-decisions:
  - "Recortar filas exige --allow-shrink-rows (bandera nueva): el plan decia abortar ante un desired que reduce filas, pero el stack de Arianna pasa de 4 a 2 tags y sin esa via nunca se podria cargar. El dry-run lista las filas que se descartarian y la bandera exige la frase de Juan"
  - "cta-master y heading-master no se escriben de forma generica: sus targets son archivos de codigo o bloques de docs pages sin localizador por id. Solo el boton del header (CUT-cta-master-header-cta) tiene aplicador; los demas salen como MANUAL"
  - "post-translation aborta solo cuando la decision elegida es traducir; con aviso o diferir sale SIN CARGA. El item real existe en CUTOVER_ITEMS con la opcion aviso y el dry-run debe poder listarlo"
  - "--apply es todo o nada sobre los items elegidos: si queda uno pendiente o propuesto con gate aprobado, aborta antes de escribir y se usa --only para un subconjunto"
status: checkpoint-pending
completed: 2026-11-10
duration: 150min
commits: 5
plan_head_before: 48146fe7010d0a68bfe1feecd4c1586cd47904eb
requirements-completed: []
actuals:
  tokens: 26200
  tasks: 3
  commits: 5
---

# Phase 56 Plan 14: Cargador del corte y handoff Summary (checkpoint pendiente)

Cargador del corte probado en seco contra una Local API falsa, con negativas por estado, por fecha y por tipo, y el handoff para el gate de la fase 57. Las tareas 1 a 3 quedaron hechas y comprobadas sin tocar ninguna base. El plan se detiene en la tarea 4, el dry-run de solo lectura que corre Juan contra la base de produccion por el tunel.

Nota sobre `commits: 5`: es el conteo medido con `git rev-list --count ${PLAN_HEAD_BEFORE}..HEAD`. De los 5, cuatro son de este plan (`2e4ba80`, `2727f2a`, `d12c756`, `ff6abc9`) y uno, `12b1a3f` (registro de las recomendaciones aceptadas en bloque por Juan), lo hizo el orquestador durante la ejecucion. El commit de este SUMMARY no entra en el conteo.

## Que quedo hecho

**Task 1 (tracer), commit 2e4ba80.** El cargador corre de punta a punta con las lecciones de un caso: dry-run por defecto, `--apply` exige `--db-checked`, `assertSafeTarget` antes de importar Payload, `--only`, `--print-current` y `--overwrite-lessons`. Cada caso escribe ES con `draft: false`, relee para obtener los id de fila, escribe EN con esos id, relee ES y EN con `fallbackLocale: false` y compara; el status `published` debe seguir igual. Se niega ante un item pendiente, ante un propuesto con gate aprobado y ante lecciones existentes que difieran sin `--overwrite-lessons`. Barrera del tracer: se volvio a correr el `<verify>` completo antes de pasar a la tarea 2 y paso.

**Task 2 (tdd), commits 2727f2a (RED) y d12c756 (GREEN).** Se agregaron los items restantes: `media-alt` (solo el campo alt, ES y EN, sin tocar otros campos), `legal-date` (un unico valor, vacio o a mas de un dia de hoy se niega), filas de Websites, autor, testimonio y boton del header con grupo completo fusionado, `draft: false` y status intacto. El RED fallo con 11 casos antes de implementar. Los cinco tests del plan estan cubiertos, mas los de ids de fila, recorte de filas, `DRIFT` y `MANUAL`.

**Task 3, commit ff6abc9.** `56-CUTOVER-HANDOFF.md`: que se carga en el corte, orden exacto, quien aprueba cada escritura, via de regreso con respaldos, decisiones abiertas desde el gate (70 problemas con `--gate`), notas de contenido fuera de alcance, nota legal D-10 y confirmacion de D-23. Incluye las aceptaciones en bloque de Juan que aun no estan pasadas a `aprobado` en el registro.

## Verificacion

- `node_modules/.bin/tsx scripts/verify/56-cutover-selftest.ts`: PASS, 122 casos.
- `node scripts/verify/56-content-guard.mjs --scripts`: PASS (assertSafeTarget, `--apply`, `--db-checked`, sin borrados, `draft: false`).
- `node_modules/.bin/tsx scripts/verify/56-seed-selftest.ts`: PASS.
- `node_modules/.bin/tsx scripts/verify/56-gate.ts`: sale 0 con 14 avisos. `56-gate.ts --gate` sale 1 con 70 problemas, que es lo esperado hasta que Juan responda.
- `npx tsc --noEmit`: sin errores.
- `! grep -Eq "deleteGlobal|payload\.delete" scripts/db/28-phase56-cutover-load.ts`: se cumple.
- `node scripts/verify/56-run-all.mjs --selftests --strict`: sale 0, 79 pasos PASS, 0 FAIL, 0 SKIP.
- `BASE_URL=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/56-run-all.mjs --live --no-wait --strict`: sale 1, 23 pasos PASS y 4 FAIL. Ningun paso queda en SKIP. Los 4 fallos son de despliegue y no del cargador: `56-no-marker-live`, `56-cta-live`, `56-legal-live` y `54-page-contract` (regresion de la 54) porque el preview sirve la compilacion anterior a la fase 56 (`origin/feat/mui-redesign` esta 49 commits atras) y la siembra sombra de 56-12 no corrio. Pasan `55-seo-parity` de home y legales, `56-cases-lessons-live` y toda la regresion viva de la 55.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] `--allow-shrink-rows` para recortar filas**
- **Found during:** Task 2
- **Issue:** el plan manda abortar si el desired reduciria filas. El stack de Arianna Lupi pasa de 4 a 2 tags, asi que sin una via explicita ese item nunca se podria cargar.
- **Fix:** bandera `--allow-shrink-rows`. Sin ella el cargador aborta y el dry-run lista las filas con `DESCARTA`. Con ella, Juan debe haber escrito la frase de aprobacion por nombre (esta en el handoff).
- **Files modified:** scripts/db/28-phase56-cutover-load.ts
- **Commit:** d12c756

**2. [Rule 1 - Bug] La clave de retos en ES era `retos` y en EN `challenges`**
- **Found during:** Task 2
- **Issue:** `siteValue` de 56-13 usaba `retos` en el lado ES y `challenges` en el EN. El campo de Payload se llama `challenges` y el cargador no podia leer los dos lados con la misma clave.
- **Fix:** el lado ES pasa a `challenges`.
- **Files modified:** scripts/db/data/56-cutover-data.ts
- **Commit:** d12c756

**3. [Rule 3 - Blocking] cta-master y heading-master no tienen aplicador generico**
- **Found during:** Task 2
- **Issue:** el plan los agrupa en la actualizacion generica, pero sus targets son archivos de codigo (`src/blocks/...`, `messages`) o bloques dentro de docs pages, sin coleccion ni id que el cargador pueda localizar.
- **Fix:** solo el boton del header (global `header`, `ctaButton.label`) tiene aplicador. Los demas salen como `MANUAL` en el dry-run, no se escriben y el handoff los lista. Viajan con el merge o se cargan a mano.
- **Commit:** d12c756

**4. [Rule 1 - Bug] post-translation aborta solo cuando la decision es traducir**
- **Found during:** Task 2
- **Issue:** el plan dice que un item `post-translation` aborta. El item real existe en `CUTOVER_ITEMS` con la decision `aviso`, asi que abortar siempre impediria que el dry-run de Juan listara los demas items.
- **Fix:** con `aviso` o `diferir` sale `SIN CARGA`. Con `traducir` aborta y remite a un plan aparte. Un kind desconocido aborta siempre.
- **Commit:** d12c756

**5. [Rule 2 - Missing critical] `DRIFT` y `--apply` todo o nada**
- **Found during:** Task 2
- **Issue:** el respaldo registrado es del 2026-11-10. Si Juan edita algo en el admin antes del corte, un `mergeGroup` del desired podria pisar esa edicion sin aviso.
- **Fix:** el dry-run compara lo vivo con el respaldo y avisa `DRIFT` (no bloquea). Con `--apply`, un item negado entre los elegidos aborta antes de la primera escritura.
- **Commit:** d12c756

### Cambios de proceso

- La Local API falsa vive dentro de `56-cutover-selftest.ts` (el plan pide extender ese archivo) en lugar de un archivo nuevo.
- Task 3 no pudo cerrar con la bateria viva en verde: la bateria `--live --strict` sale 1 por los 4 pasos de despliegue descritos arriba. Esos pasos dependen del push de la rama, del despliegue en dev y del checkpoint de 56-12, que este agente no hace. Se reporta tal cual y no se oculta.
- No se edito STATE.md ni ROADMAP.md (instruccion del orquestador). No se hizo push. No hubo acceso a ninguna base.

## Auth gates

La tarea 4 es un `checkpoint:human-action` con `gate="blocking-human"`: Claude no abre el relay ni el tunel. Es el flujo esperado, no una desviacion.

## Checkpoint pendiente: Task 4 (Juan, dry-run solo lectura)

Los comandos exactos van en el mensaje de retorno del agente. Orden: tunel en la terminal A, `DATABASE_URI` sacada en vivo por ssh con el `sed` al puerto 15432, pre-flight que imprime usuario, host, puerto, base y query (debe dar `<usuario> 127.0.0.1 15432 /juantech ?sslmode=disable`), `04-which-database.ts`, dry-run completo del cargador, respaldo con `--print-current` a un archivo fuera del repo y cierre. Nunca se corre `--apply` en esta fase ni se usa `--env-file=.env`.

## Known Stubs

Ninguno. Los items que quedan sin texto (`CUT-websites-ariannalupi-textos`, `ALT-juan-tech`, `CUT-legal-date-efectiva`) son pendientes de verdad que espera Juan o el dia del corte, no marcadores en el codigo.

## Threat Flags

Ninguno fuera del registro del plan. T-56-49 (encabezado, handoff y `--apply` con `--db-checked` y estado aprobado), T-56-50 (lecciones solo en el corte, relectura y verificacion viva), T-56-51 (pre-flight, `04-which-database` y `assertSafeTarget`), T-56-53 (grupo completo y recorte solo con bandera) y T-56-54 (fecha legal unica y a un dia de hoy) quedan cubiertos en codigo y autoprueba. T-56-51 y T-56-52 dependen de lo que Juan pegue en el checkpoint.

## Items abiertos para Juan

1. Correr el checkpoint (comandos en el mensaje de retorno) y pegar las salidas de los pasos 3, 4 y 5.
2. Las decisiones de la lista del handoff, y pasar las aceptaciones en bloque del 2026-11-10 a `aprobado` en el registro antes del gate de la fase 57.
3. Empujar la rama, desplegar dev y cerrar el checkpoint de 56-12 para poner en verde los 4 pasos vivos.

## Self-Check: PASSED

Archivos presentes: `scripts/db/28-phase56-cutover-load.ts`, `scripts/verify/56-cutover-selftest.ts`, `scripts/db/data/56-cutover-data.ts`, `.planning/phases/56-contenido-pendiente-de-juan/56-CUTOVER-HANDOFF.md`. Commits 2e4ba80, 2727f2a, d12c756 y ff6abc9 presentes en la rama feat/mui-redesign.
