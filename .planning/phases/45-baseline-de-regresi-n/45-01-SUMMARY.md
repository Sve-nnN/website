---
phase: 45-baseline-de-regresi-n
plan: 01
subsystem: seo
tags: [regression-baseline, lighthouse, json-ld, hreflang, canonical, measurement-only]

requires:
  - phase: 32-regression-baseline
    provides: formato exacto de 32-REGRESSION-BASELINE.md y 32-baseline-content.json a replicar
provides:
  - scripts/capture-head-links-snapshot.mjs (script hermano nuevo, canonical + hreflang)
  - 45-baseline-content.json y 45-baseline-headlinks.json con las 14 rutas criticas capturadas
  - 45-REGRESSION-BASELINE.md con las secciones de H1/JSON-LD y Canonical/hreflang completas
affects: [45-02-lighthouse-mediana, 45-03-search-console-trafico, phase-50-gate-cierre]

actuals:
  tokens: 21000
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Script hermano en vez de extender un capturador ancla: capture-head-links-snapshot.mjs sigue el precedente de verify-live-jsonld-meta.mjs (mismo contrato CLI --base-url/--out/--routes, original intacto) para no romper la comparabilidad byte a byte de la serie Phase 32 -> 36 -> 45 -> 50"

key-files:
  created:
    - scripts/capture-head-links-snapshot.mjs
    - .planning/phases/45-baseline-de-regresi-n/45-baseline-content.json
    - .planning/phases/45-baseline-de-regresi-n/45-baseline-headlinks.json
    - .planning/phases/45-baseline-de-regresi-n/lh-phase45-tracer.json
    - .planning/phases/45-baseline-de-regresi-n/45-REGRESSION-BASELINE.md
  modified:
    - .planning/ROADMAP.md

key-decisions:
  - "Task 1 (checkpoint:decision, gate blocking-human): Juan eligio sibling-script. scripts/capture-head-links-snapshot.mjs se crea como script hermano nuevo bajo scripts/, con el mismo contrato CLI (--base-url/--out/--routes) que capture-service-page-snapshot.mjs, que queda sin modificar. Justificacion registrada: el repo ya establecio ese precedente en verify-live-jsonld-meta.mjs, y modificar el capturador ancla rompe la comparabilidad byte a byte de la serie Phase 32 -> 36 -> 45 -> 50."
  - "Deviation Rule 3 (bloqueante, fuera de las tasks del plan): el worktree de ejecucion se habia ramificado antes de que se commitearan los artefactos de planeamiento de la Phase 45 (7ca78ef, aa25c7e), asi que .planning/phases/45-baseline-de-regresi-n/ no existia en este checkout. Se hizo git merge --ff-only de esos dos commits (ambos tocan solo .planning/, verificado con git show --stat) para traerlos, y se copiaron 45-RESEARCH.md/45-PATTERNS.md (sin commitear tambien en el checkout principal, se dejaron igual)."
  - "Deviation Rule 3: la tabla de progreso del ROADMAP seguia marcando Phase 45 como \"0/TBD Blocked (Neon + GSC)\" pese a que el bloqueo ya se habia levantado; gsd-tools roadmap.update-plan-progress fallaba con \"Phase 45 not found\" por el sufijo \"(BLOQUEADA - infraestructura)\" en el header. Se corrio gsd_run query roadmap.update-plan-progress 45 para sincronizar (commit eb3ea65), necesario para que el resto del workflow de ejecucion funcione."

patterns-established:
  - "Los JSON de captura de HTML se guardan condensados (h1Count/h1/jsonLdCount/jsonLdTypes), nunca con el raw de JSON-LD -- mismo shape que 32-baseline-content.json para diff directo entre fases."

requirements-completed: [BASE-01]

coverage:
  - id: D1
    description: "Las 14 rutas criticas resuelven 200 directo contra https://juan-tech.com, verificado por curl, con el 308 de /es documentado (vs 307 de Phase 32 contra localhost, diferencia esperada)"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "curl -s -o /dev/null -w '%{http_code}' contra las 14 rutas + /es, 2026-09-03 -- todas 200 directo, /es 308 hacia /"
        status: pass
    human_judgment: false
  - id: D2
    description: "45-baseline-content.json cubre las 14 rutas con H1 (count+texto) y tipos JSON-LD, forma condensada de 32-baseline-content.json, cero {error}"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "node -e assertion sobre las 14 keys (h1Count>=1, sin campo error) -- ver Task 3 <verify> del plan, salida ALL_14_OK"
        status: pass
    human_judgment: false
  - id: D3
    description: "45-baseline-headlinks.json cubre las 14 rutas con canonical (string) y hreflang (array de 3: es/en/x-default), capturado por el script hermano nuevo"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "node -e assertion sobre las 14 keys (canonical string, hreflang array no vacio) -- Task 3 <verify>, salida ALL_14_OK"
        status: pass
    human_judgment: false
  - id: D4
    description: "45-REGRESSION-BASELINE.md tiene las 6 secciones del formato Phase 32 + Canonical/hreflang + Search Console + Trafico real y V, con las tablas de H1/JSON-LD y Canonical/hreflang completas (14 filas cada una)"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "grep -qF por cada uno de los 6 headers + por los 4 slugs de servicio y las 2 geo -- Task 2 y Task 3 <verify>, todos FOUND"
        status: pass
    human_judgment: false
  - id: D5
    description: "scripts/capture-service-page-snapshot.mjs queda sin modificar (decision sibling-script)"
    requirement: "BASE-01"
    verification:
      - kind: other
        ref: "git diff --quiet -- scripts/capture-service-page-snapshot.mjs (no aparece en ningun commit de este plan)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Hallazgo: el H1 de /en renderiza en espanol (identico al de /) en vez de ingles, pese a que title/og:locale si estan correctos en ingles -- documentado en el baseline, NO corregido (fuera de alcance de una fase de solo medicion)"
    verification: []
    human_judgment: true
    rationale: "Es un hallazgo de contenido real del sitio, no una tarea de este plan de medicion. Juan debe decidir si amerita una fase/quick-task de fix; la decision de si eso 'importa' o cuando se corrige requiere su criterio, no es verificable por automatizacion."

duration: 45min
completed: 2026-09-03
status: complete
---

# Phase 45 Plan 01: Tracer del Pipeline del Baseline Summary

**Script hermano `capture-head-links-snapshot.mjs` capturando canonical/hreflang, mas H1/JSON-LD, de las 14 rutas criticas contra produccion live, con el esqueleto de `45-REGRESSION-BASELINE.md` listo para que 45-02/45-03 completen Lighthouse y Search Console.**

## Performance

- **Duration:** ~45 min
- **Tasks:** 3 (1 checkpoint:decision + 1 tracer + 1 expansion)
- **Files modified:** 6 (5 nuevos del plan + 1 sync de ROADMAP.md)

## Accomplishments

- Decision resuelta por Juan (checkpoint:decision, gate blocking-human): `sibling-script`. `scripts/capture-head-links-snapshot.mjs` extrae canonical y hreflang con el mismo contrato CLI que `capture-service-page-snapshot.mjs`, que queda intacto — la serie Phase 32 → 36 → 45 → 50 sigue comparable byte a byte.
- Tracer de punta a punta sobre `/` probo las 5 capas del pipeline (resolucion curl, captura H1/JSON-LD, captura canonical/hreflang, pasada de calentamiento de Lighthouse, esqueleto del documento) antes de gastar la hora completa de Lighthouse en 45-02.
- Las 14 rutas criticas resuelven 200 directo contra `https://juan-tech.com`; `/es` confirma su 308 permanente hacia `/` (Phase 32 lo midio como 307 contra localhost — diferencia esperada, documentada para que la Phase 50 no la lea como cambio).
- `45-baseline-content.json` y `45-baseline-headlinks.json` cubren las 14 rutas sin un solo `{error}`: la home y `/en` emiten 3 bloques JSON-LD, las 8 landings de servicio 2, las 4 geo 1; las 14 rutas tienen canonical propio y las 3 variantes de hreflang (es/en/x-default).
- Hallazgo real del sitio documentado (no corregido): el H1 de `/en` sale en español, identico al de `/`, mientras que `<title>` y `og:locale` si estan en ingles.

## Task Commits

1. **Task 1: Decision — script hermano vs extender el capturador** — sin commit propio (decision registrada aqui; el codigo se crea en Task 2)
2. **Task 2: Tracer de punta a punta sobre /** — `71efb8c` (feat)
3. **Task 3: Expandir la captura a las 14 rutas** — `32eb52e` (feat)

**Plan metadata:** (pendiente — commit de cierre de plan al final de este mensaje)

Commit de preparacion de entorno (fuera de las tasks del plan, deviation Rule 3): `eb3ea65` (docs) — sync de la tabla de progreso del ROADMAP, necesario para que `gsd-tools roadmap.update-plan-progress` dejara de fallar con "Phase 45 not found".

## Files Created/Modified

- `scripts/capture-head-links-snapshot.mjs` - script hermano nuevo, extrae canonical + hreflang de HTML renderizado
- `.planning/phases/45-baseline-de-regresi-n/45-baseline-content.json` - H1 + JSON-LD de las 14 rutas, forma condensada
- `.planning/phases/45-baseline-de-regresi-n/45-baseline-headlinks.json` - canonical + hreflang de las 14 rutas
- `.planning/phases/45-baseline-de-regresi-n/lh-phase45-tracer.json` - pasada de calentamiento de Lighthouse sobre `/` (no cuenta como corrida de 45-02)
- `.planning/phases/45-baseline-de-regresi-n/45-REGRESSION-BASELINE.md` - documento entregable, secciones H1/JSON-LD y Canonical/hreflang completas; Lighthouse y Search Console quedan TBD para 45-02/45-03
- `.planning/ROADMAP.md` - sync de progreso de Phase 45 (deviation, ver abajo)

## Decisions Made

- **Task 1:** `sibling-script`, elegida por Juan via el coordinador. Motivo verbatim del plan: mantener `capture-service-page-snapshot.mjs` intacto preserva la comparabilidad byte a byte de la serie Phase 32 → 36 → 45 → 50; el repo ya establecio ese precedente en `verify-live-jsonld-meta.mjs`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree sin los artefactos de planeamiento de la Phase 45**
- **Found during:** Carga inicial de contexto, antes de Task 1
- **Issue:** El worktree de ejecucion (`worktree-agent-a46b0ee620babb4fd`) se habia ramificado desde un commit anterior a que se cargaran `7ca78ef` (contexto + desbloqueo) y `aa25c7e` (los 3 planes) en la rama `docs/seo-handoff` del checkout principal. `.planning/phases/45-baseline-de-regresi-n/` no existia en el worktree.
- **Fix:** `git merge --ff-only aa25c7e` (fast-forward puro, mi rama es ancestro directo; ambos commits tocan solo `.planning/`, verificado con `git show --stat` antes de mergear). Copiados ademas `45-RESEARCH.md` y `45-PATTERNS.md`, que seguian sin commitear tambien en el checkout principal.
- **Files modified:** ninguno de codigo — solo trajo archivos de planeamiento ya existentes
- **Verification:** `gsd_run query init.execute-phase 45` paso de `plans: []` a listar los 3 planes correctamente
- **Committed in:** N/A (fast-forward, no crea un commit nuevo propio)

**2. [Rule 3 - Blocking] ROADMAP.md con la tabla de progreso desincronizada**
- **Found during:** Carga inicial de contexto, antes de Task 1
- **Issue:** El header y la tabla de progreso de Phase 45 seguian diciendo "(BLOQUEADA — infraestructura)" / "0/TBD Blocked (Neon + GSC)" pese a que el bloqueo ya se habia levantado (documentado en 45-CONTEXT.md y STATE.md desde 2026-08-30). Esto rompia `gsd_run query roadmap.update-plan-progress 45` con `Error: Phase 45 not found`.
- **Fix:** Corri `gsd_run query roadmap.update-plan-progress 45`, que sincronizo la fila de la tabla de progreso contra el estado real en disco (0/3 Planned). El header largo ya habia sido corregido por el propio commit `7ca78ef` traido en la deviation anterior.
- **Files modified:** `.planning/ROADMAP.md`
- **Verification:** re-corrida de `gsd_run query roadmap.update-plan-progress 45 --dry-run` devolvio `updated: true`
- **Committed in:** `eb3ea65`

---

**Total deviations:** 2 auto-fixed (ambas Rule 3, bloqueantes de tooling — ninguna toca `src/` ni cambia comportamiento del sitio)
**Impact on plan:** Ambas eran prerequisito de entorno, no trabajo de las tasks del plan. Sin ellas, `gsd-tools` no podia trackear el progreso de la fase. Cero scope creep sobre el objetivo del plan.

## Issues Encountered

- Ninguno bloqueante. La varianza de Lighthouse en la pasada tracer (performance 61 vs. la referencia de 94 en PSI del 2026-08-25) es la variancia de contencion de CPU local que 45-RESEARCH.md ya predijo ("Trampa 1") — no es una senal de regresion, y 45-02 la resuelve con mediana de 3 corridas.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 45-02 puede arrancar de inmediato: el pipeline de Lighthouse ya esta probado (pasada de calentamiento exitosa, Chrome-for-Testing resuelto), y la seccion `## Lighthouse Mobile` del baseline ya tiene el placeholder de las 14 filas listo para la mediana.
- 45-03 tiene la seccion `## Search Console` y `## Trafico real y V` esqueletadas, y las 14 rutas ya normalizadas (path -> URL absoluta) via `45-baseline-headlinks.json`.
- El hallazgo del H1 de `/en` en espanol queda documentado en el baseline para que Juan decida si amerita una fase o quick-task de correccion — no bloquea nada de 45-02/45-03.
- `git diff --stat src/` vacio de principio a fin, confirmado antes de cada commit.

## Self-Check: PASSED

- FOUND: scripts/capture-head-links-snapshot.mjs
- FOUND: .planning/phases/45-baseline-de-regresi-n/45-baseline-content.json
- FOUND: .planning/phases/45-baseline-de-regresi-n/45-baseline-headlinks.json
- FOUND: .planning/phases/45-baseline-de-regresi-n/lh-phase45-tracer.json
- FOUND: .planning/phases/45-baseline-de-regresi-n/45-REGRESSION-BASELINE.md
- FOUND commit: 71efb8c
- FOUND commit: 32eb52e
- FOUND commit: eb3ea65

---
*Phase: 45-baseline-de-regresi-n*
*Completed: 2026-09-03*
