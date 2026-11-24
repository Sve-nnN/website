---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
plan: 03
subsystem: ui
tags: [motion, a11y, next-intl, hrefs, unstable-cache, revalidate, payload-globals]

requires:
  - phase: 53-01
    provides: tema MUI, Providers y capas CSS
provides:
  - MOTION_INIT_SCRIPT y MOTION_STORAGE_KEY (src/theme/motion-init.ts)
  - MotionStateProvider y useMotion() con { paused, toggle } (src/theme/motion.tsx)
  - variables --jt-motion-* y reglas html[data-motion=paused]; regla reduced-motion acotada
  - nav-links.ts (sanitizeHref, resolveLinkHref, normalizeNavPath, buildLocaleSwitchHref)
  - getCachedHeader, getCachedFooter y hooks revalidateHeaderCache y revalidateFooterCache
affects: [53-04, 53-05, 53-06, 54, 55, 56, 57]

plan_head_before: 167473f6902f6ac27021a9467ae531fc31859fe9

actuals:
  tokens: 7000
  tasks: 4
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Estado de movimiento en el atributo data-motion de html: el script inline lo fija antes del primer pintado y useSyncExternalStore lo observa con MutationObserver"
    - "Helpers de enlaces como modulo puro (solo importa ./service-slugs) verificado por casos con tsx"
    - "Globals Header y Footer leidos con unstable_cache sin overrideAccess:false, igual que featured-content"

key-files:
  created:
    - src/theme/motion-init.ts
    - src/theme/motion.tsx
    - src/lib/nav-links.ts
    - scripts/verify/53-motion-script.ts
    - scripts/verify/53-nav-links.ts
  modified:
    - src/theme/Providers.tsx
    - src/theme/theme.ts
    - src/app/globals.css
    - src/components/MotionProvider.tsx
    - src/components/HeroGrainGradientShader.tsx
    - src/lib/cache-tags.ts
    - src/lib/cache.ts
    - src/globals/Header/index.ts
    - src/globals/Footer/index.ts

key-decisions:
  - "MotionConfig del proveedor viejo pasa de reducedMotion=user a paused ? always : never, porque el script inicial ya convierte la preferencia del sistema en paused"
  - "La regla global de prefers-reduced-motion se acota a html:not([data-motion=running]) para que reanudar de forma explicita se respete (SC 2.2.2)"
  - "Sin cambio de esquema en Header ni Footer: solo hooks, sin migracion ni payload migrate"

requirements-completed: []
requirements-advanced: [BASE-03]

coverage:
  - id: D1
    description: "MOTION_INIT_SCRIPT decide data-motion segun guardado valido, reduce y error, ejecutado en vm"
    requirement: BASE-03
    verification:
      - kind: unit
        ref: "node_modules/.bin/tsx scripts/verify/53-motion-script.ts -> OK (siete casos)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Pausa de CSS, transiciones, hover de botones, scroll, motion/react y shader cableada en codigo"
    requirement: BASE-03
    verification:
      - kind: other
        ref: "tsc --noEmit, 53-layer-check.mjs OK, greps de aceptacion de la tarea 2"
        status: pass
    human_judgment: false
    rationale: "El comportamiento en navegador (pausar y reanudar con el toggle) se comprueba cuando el plan 05 monte el toggle y el script en el layout."
  - id: D3
    description: "Helpers de enlaces: saneo de esquemas peligrosos, referencias, slugs duales y href canonico de idioma"
    requirement: BASE-03
    verification:
      - kind: unit
        ref: "node_modules/.bin/tsx scripts/verify/53-nav-links.ts -> OK (seis grupos; RED confirmado antes por modulo ausente)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Header y Footer con cache de 60 s y hooks afterChange, sin tocar campos"
    requirement: BASE-03
    verification:
      - kind: other
        ref: "git diff master --numstat de ambos globals: 4 lineas agregadas, 0 eliminadas; sin archivos nuevos en src/migrations; tsc OK"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-11-07
status: complete
---

# Phase 53 Plan 03: Movimiento, enlaces y cache de Header y Footer Summary

**Estado de movimiento con script inicial y contexto sobre data-motion, resolutor de enlaces saneado con selector de idioma canonico, y lectura cacheada de Header y Footer con hooks de revalidacion, sin cambio de esquema.**

## Performance

- **Duration:** aprox. 25 min
- **Started:** 2026-11-07T16:20:00Z (aprox.)
- **Completed:** 2026-11-07T16:44:00Z
- **Tasks:** 4 (Task 1 tracer, Tasks 2 a 4 auto)
- **Files modified:** 14

## Accomplishments

- `MOTION_INIT_SCRIPT` (cadena constante, menos de 400 caracteres) se ejecuta en un sandbox `vm` y pasa los siete casos: guardado gana, reduce da paused, sin reduce da running, valor invalido cae a `matchMedia`, error da running.
- `useMotion()` expone `{ paused, toggle }` sobre `useSyncExternalStore` y `MutationObserver`; `toggle` solo escribe `paused` o `running`.
- Pausar detiene animaciones CSS, pone las variables `--jt-motion-*` en 0ms, quita el hover de `MuiButton`, fuerza `scroll-behavior: auto`, pausa `motion/react` (via `MotionProvider`) y congela el shader del hero.
- La red de seguridad de `prefers-reduced-motion` ya no pisa una reanudacion explicita.
- `nav-links.ts` bloquea `javascript:`, `data:`, `//host` y `/\host`, replica `CMSLink` (posts con `/blog`, home a `/`) y entrega el href canonico del selector de idioma.
- `getCachedHeader` y `getCachedFooter` con TTL de 60 s; los hooks invalidan tag y todas las rutas.

## Task Commits

1. **Task 1: Nucleo de movimiento (tracer)** - `1bde7f6` (feat)
2. **Task 2: Cableado de pausa en tema, estilos, MotionProvider y shader** - `930ab44` (feat)
3. **Task 3: Helpers puros de enlaces** - `a454d90` (feat)
4. **Task 4: Cache y hooks de Header y Footer** - `41d93bf` (feat)

**Plan metadata:** commit docs de cierre (ver el log de la rama)

## Decisions Made

- El tracer feedback gate se resolvio con la rama interactiva `end-of-phase` y `<verify>` solo automatizado: se volvio a correr el verify de punta a punta (OK) y se siguio.
- Refleja un cambio de enlace del preview: el preview no recibe `revalidateTag` del admin de produccion (otro proceso), asi que un cambio llega por el TTL de 60 s de `unstable_cache` mas el de 60 s del ISR de cada pagina, entre 60 y 120 s. En produccion los hooks dejan el cambio inmediato.

## Deviations from Plan

None - plan executed exactly as written.

Detalles menores sin cambio de alcance: `src/lib/nav-links.ts` rechaza tambien `/\host` (el navegador lo trata como `//`) y se agregaron casos negativos para `JaVaScRiPt:` y `java\tscript:`. Esto refuerza T-53-20 y entra en la misma tarea.

## Auth Gates

Ninguno.

## Verification Results

| Comprobacion | Resultado |
|---|---|
| `node_modules/.bin/tsx scripts/verify/53-motion-script.ts` | `OK`, exit 0 |
| `node_modules/.bin/tsx scripts/verify/53-nav-links.ts` | `OK`, exit 0 (antes de implementar: `ERR_MODULE_NOT_FOUND`, RED) |
| `npx tsc --noEmit` (tras cada tarea) | exit 0 |
| `node scripts/verify/53-layer-check.mjs` | `OK (capa tailwind con 674 nodos; control negativo: 628 reglas sin capa sin el plugin)` |
| greps de aceptacion de la tarea 2 (`MotionStateProvider`, `var(--jt-motion-base`, `useMotion` x2, 3 selectores `html:not([data-motion='running'])`) | pasan |
| `git diff master --numstat` Header y Footer | `4 0` y `4 0` (cero lineas eliminadas) |
| `src/migrations` y `src/payload-types.ts` | sin cambios |
| `node scripts/verify/53-write-gates.mjs` (regresion plan 02) | `OK` |

No se corrio `npm run build`: el plan no lo pide y `53-layer-check.mjs` compila el CSS real. No se toco ninguna base de datos ni se ejecuto `payload migrate`.

## Deferred

- Falta insertar `MOTION_INIT_SCRIPT` en el `<head>` del layout y montar el toggle visible. El plan 03 no modifica el layout; lo cubre el plan de shell (04 o 05). Hasta entonces `data-motion` no se fija y `useMotion().paused` vale `false`, y la regla de `globals.css` sigue activa por `html:not([data-motion='running'])`.
- Prueba en navegador de pausar y reanudar con el toggle, cuando exista.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. No hay endpoints, rutas de auth ni cambios de esquema nuevos.

## Issues Encountered

Ninguno. `state.update-progress` y `roadmap.update-plan-progress` no actualizan los contadores (aviso heredado); la lista de control de ROADMAP.md se marca a mano. BASE-03 no se marca completo hasta que aterricen los planes 04, 05 y 06.

## Next Phase Readiness

- Planes 04 y 05 tienen el contrato de datos y de movimiento que necesitan: `getCachedHeader` y `getCachedFooter` para leer, `resolveLinkHref` y `buildLocaleSwitchHref` para enlaces e idioma, `useMotion` para el toggle.
- Pendiente para ellos: inyectar `MOTION_INIT_SCRIPT` en el `<head>` del layout.

## Self-Check: PASSED

- Archivos creados presentes: `src/theme/motion-init.ts`, `src/theme/motion.tsx`, `src/lib/nav-links.ts`, `scripts/verify/53-motion-script.ts`, `scripts/verify/53-nav-links.ts`.
- Commits `1bde7f6`, `930ab44`, `a454d90` y `41d93bf` presentes en `feat/mui-redesign`.
