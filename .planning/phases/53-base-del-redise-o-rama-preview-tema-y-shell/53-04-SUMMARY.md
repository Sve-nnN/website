---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
plan: 04
subsystem: ui
tags: [mui, header, footer, language-switcher, next-intl, a11y, payload-globals]

requires:
  - phase: 53-01
    provides: tema MUI, Providers y capas CSS
  - phase: 53-03
    provides: nav-links.ts (resolveLinkHref, sanitizeHref, normalizeNavPath, buildLocaleSwitchHref), getCachedHeader y getCachedFooter
provides:
  - namespace shell en messages/es.json y messages/en.json (21 rutas de clave)
  - scripts/verify/53-messages-parity.mjs
  - LanguageSwitcher (escritorio con Menu y variante inDrawer)
  - HeaderView y SiteHeader (pill fijo, Drawer movil, shell minimo ante error)
  - FooterView y SiteFooter (columnas del CMS, servicios y dinamicas, shell minimo ante error)
affects: [53-05, 53-06, 54, 55, 56, 57]

plan_head_before: c3c34f9a38c245ffad8efde1d0712580e0f8bd44

actuals:
  tokens: 8300
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Server component que lee el global por la capa cacheada y entrega solo props serializables a una vista cliente MUI"
    - "Componente de enlace por href: isPrefixableHref ? LocaleLink : NextLink, con target _blank y rel noopener noreferrer para externos y newTab"
    - "Selector de idioma con href canonico en cadena sobre next/link plano y hash conservado en el onClick"

key-files:
  created:
    - scripts/verify/53-messages-parity.mjs
    - src/components/shell/LanguageSwitcher.tsx
    - src/components/shell/HeaderView.tsx
    - src/components/shell/SiteHeader.tsx
    - src/components/shell/SiteFooter.tsx
    - src/components/shell/FooterView.tsx
  modified:
    - messages/es.json
    - messages/en.json

key-decisions:
  - "Los tipos de props de HeaderView y FooterView se exportan desde las propias vistas y los server components los importan, para que el contrato de serializacion tenga una sola fuente"
  - "El sufijo para lectores de pantalla de otra pestana usa un sx local (srOnly) y no @mui/utils, que no es dependencia directa del proyecto"
  - "Los iconos sociales se dimensionan con '& svg' en el sx del enlace, sin depender de clases Tailwind"

requirements-completed: []
requirements-advanced: [BASE-03]

coverage:
  - id: D1
    description: "Namespace shell con paridad exacta de claves y variables ICU, sin guiones largos ni cortos y tagline sin punto final"
    requirement: BASE-03
    verification:
      - kind: unit
        ref: "node scripts/verify/53-messages-parity.mjs -> OK"
        status: pass
    human_judgment: false
  - id: D2
    description: "LanguageSwitcher con href canonico en cadena, lang, hreflang, aria-current, role group y hash conservado"
    requirement: BASE-03
    verification:
      - kind: other
        ref: "tsc --noEmit exit 0; greps de aceptacion (buildLocaleSwitchHref, useLocale, aria-haspopup, menu-idioma, hrefLang, aria-current, role=group); ningun Link recibe la prop locale"
        status: pass
    human_judgment: false
    rationale: "El comportamiento en navegador (menu, hash, foco, lector de pantalla) se comprueba cuando el plan 05 monte el header en el layout."
  - id: D3
    description: "HeaderView y SiteHeader con landmarks nombrados, Drawer menu-movil, empty, partial y error con shell minimo"
    requirement: BASE-03
    verification:
      - kind: other
        ref: "tsc --noEmit exit 0; greps de aceptacion de la tarea 1; sin imports de @/components/ui ni Container"
        status: pass
    human_judgment: false
    rationale: "El render real y el desbordamiento del pill a 900 px quedan para la verificacion en el preview (backstop de UI-SPEC)."
  - id: D4
    description: "FooterView y SiteFooter con grilla auto-fit, nav por columna, bloques condicionados por length, hrefs saneados y footer minimo ante fallos"
    requirement: BASE-03
    verification:
      - kind: other
        ref: "tsc --noEmit exit 0; verify automatizado de la tarea 2 (VERIFY_OK) y greps de aceptacion; filtro _status published conservado"
        status: pass
    human_judgment: false

duration: 20min
completed: 2026-11-07
status: complete
---

# Phase 53 Plan 04: Header y footer MUI con selector de idioma Summary

**Header y footer en MUI que leen los globals de Payload por la capa cacheada, con selector de idioma de href canonico, Drawer movil, columnas de servicios, CMS y dinamicas, y degradacion a shell minimo cuando la Local API falla.**

## Performance

- **Duration:** aprox. 20 min
- **Tasks:** 2 (Task 1 tracer, Task 2 auto)
- **Files modified:** 8 (6 nuevos, 2 modificados)

## Accomplishments

- Namespace `shell` en ES y EN con las 21 rutas de clave. El script de paridad compara rutas, variables ICU (`{title}`), guiones largos y cortos y el punto final del tagline solo dentro de `shell`, porque otros namespaces tienen guiones heredados.
- `LanguageSwitcher` emite `buildLocaleSwitchHref(pathname, code)` sobre `next/link` plano. El idioma activo sale de `useLocale()` y la ruta sin prefijo de `usePathname` de `@/i18n/navigation`. Si hay hash, el clic navega con `router.push(href + hash)`.
- `HeaderView` reproduce la estructura de `HomeNav` sin scrollspy ni datos del sandbox. La lista de enlaces solo aparece con items, el CTA cae a `ctaFallback` y `/contact`, y el Drawer (`menu-movil`) se cierra al activar un enlace y al cambiar `pathname`.
- `SiteHeader` omite los enlaces sin etiqueta o sin href resuelto y proyecta solo `id`, `href`, `label`, `newTab`, `logo.url` y `logo.alt`. En error registra `[shell] header` y devuelve la vista minima.
- `SiteFooter` conserva `resolveServicesColumn` y `resolveDynamicColumn` (con el filtro `_status` published), pasa los hrefs del CMS por `resolveLinkHref` y los legales y sociales por `sanitizeHref`, y ordena servicios, CMS y dinamicas. En error registra `[shell] footer` y devuelve el footer minimo.
- `FooterView`: grilla `repeat(auto-fit, minmax(160px, 1fr))`, un `nav` con nombre por columna, `h3` overline, enlaces de 32 px de alto, redes de 44 por 44 px con nombre accesible y sufijo de otra pestana.

## Task Commits

1. **Task 1: Header MUI de punta a punta (tracer)** - `ac07fef` (feat)
2. **Task 2: Footer MUI conectado a Payload** - `b5d1b38` (feat)

**Plan metadata:** commit docs de cierre (ver el log de la rama)

## Decisions Made

- El tracer feedback gate se resolvio con la rama interactiva `end-of-phase` y `<verify>` solo automatizado: se volvio a correr el verify completo (paridad, tsc, tres greps) y paso, asi que se siguio con el footer.
- El logo del footer sale de `getCachedHeader` (misma cache que el header), como pide el plan. Si el header falla, el footer completo cae a su version minima porque ambas lecturas comparten el `try`.
- Las columnas del CMS que se quedan sin items tras omitir los enlaces invalidos no se renderizan (evita un titulo huerfano).

## Deviations from Plan

None - plan executed exactly as written.

Detalles menores sin cambio de alcance: los hrefs dinamicos de posts y casos (`blogPostPath`, `/case-studies/<slug>`) no pasan por `sanitizeHref` porque los arma el servidor, no un editor. El HeaderView acepta la prop `locale` en su tipo (contrato del plan) pero no la usa: el idioma activo lo da el contexto de next-intl.

## Auth Gates

Ninguno.

## Verification Results

| Comprobacion | Resultado |
|---|---|
| `node scripts/verify/53-messages-parity.mjs` | `OK`, exit 0 (tras la tarea 1 y de nuevo tras la tarea 2) |
| `npx tsc --noEmit` | exit 0 despues de cada tarea |
| Verify automatizado de la tarea 1 (paridad, tsc, tres greps) | `GATE_OK` |
| Verify automatizado de la tarea 2 (tsc, cuatro greps de footer, paridad) | `VERIFY_OK` |
| Greps de aceptacion restantes de ambas tareas (`getCachedHeader`, `resolveLinkHref`, `sanitizeHref`, `resolveServicesColumn`, `resolveDynamicColumn`, `try`, `catch`, `component="h3"`, `role="group"`, `socialLabels`, `opensInNewTab`, `isPrefixableHref`, `minHeight: 32`, `maxWidth: 280`) | todos presentes |
| `grep` de `@/components/ui` y `@/components/Container` en `src/components/shell/` | sin coincidencias |
| `git diff --diff-filter=D` en ambos commits | sin eliminaciones |

No se corrio `npm run build` ni se renderizo en navegador: el plan solo pide tsc y los greps, y el header y el footer no estan montados en ningun layout hasta el plan 05. No se toco ninguna base de datos, no se ejecuto `payload migrate` y no hay cambios de esquema.

## Deferred

- Render real de header y footer en navegador (menu de idioma, hash, Drawer, foco, desbordamiento del pill a 900, 1024 y 1280 px, contraste sobre los blobs claros): se comprueba cuando el plan 05 monte el shell y en el preview del plan 06.
- Prueba manual con lector de pantalla del selector de idioma y el Drawer (NVDA con Firefox, VoiceOver con Safari): pendiente de Juan, ya anotada como supuesto en UI-SPEC.
- `MotionToggle`, `SkipLink` y el montaje en `[locale]/layout.tsx` quedan para el plan 05.

## Known Stubs

Ninguno. Los valores de respaldo (`ctaFallback`, `/contact`, `Juan Carlos Angulo`) son contrato de UI-SPEC, no datos falsos.

## Threat Flags

Ninguno. No hay endpoints, rutas de auth ni cambios de esquema nuevos. Las mitigaciones T-53-30 a T-53-34 quedaron implementadas: hrefs por `resolveLinkHref` o `sanitizeHref`, `try/catch` con `console.error` solo en servidor, `rel="noopener noreferrer"` en externos y `newTab`, proyeccion de campos y envoltura de texto.

## Issues Encountered

Ninguno. `state.update-progress` y `roadmap.update-plan-progress` no actualizan los contadores (aviso heredado); la lista de control de ROADMAP.md se marca a mano. BASE-03 no se marca completo hasta que aterricen los planes 05 y 06.

## Next Phase Readiness

- El plan 05 puede importar `SiteHeader` y `SiteFooter` desde `@/components/shell/` y montarlos en el layout, junto con `SkipLink`, `<main>` y `MotionToggle`. Los ids `menu-movil` y `menu-idioma` y las cadenas `shell.skipLink`, `shell.motionToggle` y `shell.landmarks.main` ya existen.
- Sigue pendiente inyectar `MOTION_INIT_SCRIPT` en el `<head>` del layout (heredado del plan 03).

## Self-Check: PASSED

- Archivos presentes: `scripts/verify/53-messages-parity.mjs`, `src/components/shell/{LanguageSwitcher,HeaderView,SiteHeader,SiteFooter,FooterView}.tsx`, `messages/es.json` y `messages/en.json` con el namespace `shell`.
- Commits `ac07fef` y `b5d1b38` presentes en `feat/mui-redesign`.
