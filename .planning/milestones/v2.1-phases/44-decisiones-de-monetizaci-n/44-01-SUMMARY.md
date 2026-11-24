---
phase: 44-decisiones-de-monetizaci-n
plan: 01
subsystem: planning
tags: [monetizacion, afiliados, amazon-associates, polar, merchant-of-record, decisiones]

requires:
  - phase: v2.1 research
    provides: FEATURES.md, STACK.md, PITFALLS.md y SUMMARY.md con las tarifas, políticas y umbrales verificados el 2026-08-13
provides:
  - DECISIONS.md con las 5 decisiones del milestone escritas y con fuente por cifra
  - Estado real de Amazon Associates con el reloj de 180 días y su fecha de vencimiento
  - Modelo de ingresos paramétrico sobre V, con tramos para V=1.000 y V=10.000
  - Orden de postulación a programas de afiliados con umbrales y bloqueos
  - Polar registrado como merchant of record, sin código
  - Las 4 mitigaciones populares descartadas por escrito
affects: [45-baseline, 46-legal-schema, 48-stack-page, v2.2-productos]

actuals:
  tokens: 4100
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md
  modified:
    - .planning/research/SUMMARY.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "El requisito de Amazon son 3 ventas calificadas, no un monto facturado; el reloj de 180 días vence el 2027-02-09 con punto de control el 2026-11-11"
  - "No se reordenan las fases pese al reloj corriendo: el baseline y el disclosure son gates más caros de romper que el plazo de seis meses"
  - "Polar como merchant of record, decidido ahora e implementado en v2.2; Stripe queda descartado porque no opera en Perú"
  - "Un vendedor establecido en Perú entra por el esquema non-Union OSS, que no tiene umbral de €10.000, así que el MoR es obligatorio y no una comodidad"
  - "Orden de postulación DinoRANK → DigitalOcean → Kinsta; Kinsta queda bloqueado hasta que el disclosure esté publicado en Phase 46"
  - "V queda como incógnita declarada; se sustituye en Phase 45 sin rehacer el documento"

patterns-established:
  - "Regla de procedencia: toda comisión, umbral o cita de política lleva fuente y fecha de verificación; lo no verificado se marca como no verificado en vez de rellenarse con una estimación"

requirements-completed: [DEC-01, DEC-02, DEC-03, DEC-04, DEC-05]

coverage:
  - id: D1
    description: "Estado de Amazon Associates documentado con ID, fecha de alta, vencimiento del reloj de 180 días, punto de control y dependencia del disclosure"
    requirement: DEC-01
    verification:
      - kind: other
        ref: "grep 'DEC-01' + tabla de estado en DECISIONS.md:11-47"
        status: pass
    human_judgment: false
  - id: D2
    description: "Modelo de ingresos con la multiplicación explícita, paramétrico sobre V, con tramos calculados y punto de equilibrio contra DinoRANK"
    requirement: DEC-02
    verification:
      - kind: other
        ref: "DECISIONS.md:51-94 — bloque de fórmula, tabla de tramos y comparación de equilibrio"
        status: pass
    human_judgment: false
  - id: D3
    description: "Polar registrado como merchant of record con razonamiento, alternativas descartadas y pasos de alta manuales"
    requirement: DEC-03
    verification:
      - kind: other
        ref: "DECISIONS.md:98-136"
        status: pass
      - kind: other
        ref: "git diff src/ vacío — cero código de pagos"
        status: pass
    human_judgment: true
    rationale: "La apertura de la cuenta en Polar es una acción manual de Juan, fuera del alcance del plan; queda como pendiente con checkbox en DECISIONS.md"
  - id: D4
    description: "Lista priorizada de postulaciones con umbrales, retenidos y programas sin programa usable nombrados uno por uno"
    requirement: DEC-04
    verification:
      - kind: other
        ref: "DECISIONS.md:140-192 — tres tablas: orden, retenidos, sin programa"
        status: pass
    human_judgment: false
  - id: D5
    description: "Las 4 mitigaciones equivocadas descartadas por escrito con su razón y fuente"
    requirement: DEC-05
    verification:
      - kind: other
        ref: "DECISIONS.md:196-214"
        status: pass
    human_judgment: false
  - id: D6
    description: "El hallazgo del reloj de Amazon propagado a research/SUMMARY.md, ROADMAP Phase 48 y REQUIREMENTS DEC-01"
    verification:
      - kind: other
        ref: "git show --stat 50538b9 — los tres archivos modificados en el mismo commit"
        status: pass
    human_judgment: false
  - id: D7
    description: "Cero cambios renderizados en toda la fase"
    verification:
      - kind: other
        ref: "git diff --stat HEAD -- src/ → vacío; git status --short src/ → vacío"
        status: pass
    human_judgment: false

duration: 25min
completed: 2026-08-30
status: complete
---

# Phase 44 — Plan 01 Summary

**Las cinco decisiones del milestone quedan escritas con su multiplicación y su fuente, y el hallazgo que las gatilla (el reloj de Amazon corriendo hasta el 2027-02-09) ya está propagado al roadmap y al research.**

## Performance

- **Duration:** ~25 min de escritura (2026-08-13) más el cierre de artefactos (2026-08-30)
- **Tasks:** 3 de 3
- **Files modified:** 4 (1 creado, 3 actualizados)

## Accomplishments

- `DECISIONS.md` cubre DEC-01 a DEC-05 con regla de procedencia: cada comisión, umbral y cita de política lleva fuente y fecha. Lo que el research no verificó (el precio de los planes de DinoRANK, el tratamiento del impuesto a la renta peruano) queda marcado como no verificado en vez de rellenarse con un número plausible.
- El dato de Amazon cambia el encuadre del milestone: el requisito son **3 ventas calificadas**, no facturación. Eso reordena qué significa "éxito" en los próximos seis meses y está escrito con el riesgo dimensionado sin adornos — a 1.000 visitas mensuales, llegar a 3 ventas toma entre 1,2 y 7,5 meses contra un plazo de 6.
- El modelo de ingresos queda paramétrico sobre `V` con los tramos ya calculados, así que Phase 45 solo sustituye el número sin rehacer el documento.
- El punto de equilibrio deja la conclusión operativa clara: un suscriptor recurrente de DinoRANK vale unas 12 ventas de Amazon, así que el esfuerzo editorial va a los programas recurrentes.
- La propagación del hallazgo llegó a los tres destinos: la open question del research quedó tachada y resuelta, Phase 48 del roadmap lleva su nota de deadline duro, y DEC-01 en REQUIREMENTS refleja que la cuenta ya está creada.

## Task Commits

1. **Task 1 — Escribir `DECISIONS.md`** y **Task 2 — Propagar el hallazgo del reloj** - `50538b9` (docs). Ambas tareas entraron juntas porque la propagación es una consecuencia directa del dato escrito en DEC-01 y separar el commit habría dejado el roadmap citando un documento inexistente.
2. **Task 3 — Verificación y cierre de artefactos** - este commit (docs)

## Files Created/Modified

- `.planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md` — el documento de decisiones, 239 líneas
- `.planning/research/SUMMARY.md` — open question del reloj de Amazon marcada como resuelta con el dato real
- `.planning/ROADMAP.md` — nota de deadline duro en Phase 48 (Página de Stack), con el punto de control del 2026-11-11
- `.planning/REQUIREMENTS.md` — DEC-01 reescrito: la cuenta está creada, no pendiente de reactivación

## Decisions Made

Ninguna fuera de las cinco que el documento registra. La única elección de proceso fue no reordenar las fases pese al reloj corriendo, y está argumentada en el propio DECISIONS.md: adelantar la página de stack exigiría saltear el baseline o el disclosure, y romper cualquiera de los dos cuesta más que el plazo de seis meses.

## Deviations from Plan

Ninguna. El plan se ejecutó como está escrito.

## Issues Encountered

Ninguno. La fase no toca código, base de datos ni infraestructura, así que no dependió de nada externo — que es exactamente por qué se separó del baseline.

## User Setup Required

Hay acciones manuales de Juan que este plan no puede ejecutar y que quedan como checklist al final de `DECISIONS.md`: abrir la cuenta en Polar, postular a DinoRANK y DigitalOcean, postular a Kinsta después del disclosure, confirmar el precio real de los planes de DinoRANK, consultar a un contador el impuesto a la renta peruano, y el control de Amazon a mitad de plazo el 2026-11-11.

## Next Phase Readiness

Phase 45 (Baseline de Regresión) sigue bloqueada por infraestructura externa, no por esta fase. Cuando entregue el número de tráfico, lo único que cambia en `DECISIONS.md` es sustituir `V` y recalcular la tabla de tramos. Phase 46 (Legal + Schema) ya tiene su urgencia fijada: el disclosure bloquea tanto los links de Amazon como la solicitud a Kinsta.

---
*Phase: 44-decisiones-de-monetizaci-n*
*Completed: 2026-08-30*
