---
phase: 56-contenido-pendiente-de-juan
plan: 06
subsystem: contenido-casos
tags: [case-lessons, cont-02, d-16, d-03, d-17, verifiers, checkpoint-pending]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: registro de decisiones con estado, 56-gate y 56-review-export del plan 56-01
provides:
  - 56-case-lessons.ts con las 21 lecciones de los 7 casos en ES y EN, figures por leccion, estado propuesto, gate aprobado y 21 decisiones LESSON-<slug>-<n>
  - 56-cases-lessons-live.mjs, verificador vivo que exige cada cifra en el HTML del caso por idioma (con --expect-loaded reservado al gate del corte)
  - 56-lessons-selftest.ts, autoprueba de estructura, títulos, rayas, voz, cifras sin respaldo y porcentajes
affects: [56-14, 57]
tech-stack:
  added: []
  patterns:
    - "Cada cifra de una lección lleva el fragmento exacto del caso (figures) y el verificador vivo lo busca en el HTML servido, sin contar la propia sección de lecciones"
    - "Una leccion con porcentaje guarda from, to y pct: el verificador recalcula y exige que el caso muestre el porcentaje"
key-files:
  created:
    - scripts/db/data/56-case-lessons.ts
    - scripts/verify/56-cases-lessons-live.mjs
    - scripts/verify/56-lessons-selftest.ts
  modified: []
key-decisions:
  - "Las 21 lecciones quedan en estado propuesto con gate aprobado: el cargador del corte (56-14) no las carga hasta que Juan las apruebe por escrito"
  - "Una lección solo afirma lo que el caso afirma: donde el caso dice 'para capturar' o 'sugiere', la lección dice lo mismo y no presenta un resultado"
  - "El verificador vivo excluye del texto del caso la sección id=lecciones, para que una cifra no se respalde a sí misma tras el corte"
requirements-completed: []
duration: 35min
completed: 2026-11-11
status: checkpoint-pending
commits: 2
plan_head_before: bf75f5bfa5871eefe5012c2c479a5502f33cb544
actuals:
  tokens: 11400
  tasks: 2
  commits: 2
---

# Phase 56 Plan 06: Lecciones de los 7 casos Summary

Las 21 lecciones (3 por caso, ES y EN) están redactadas con las cifras que cada caso ya muestra, verificadas contra el HTML real de los 7 casos en los dos idiomas y a la espera de la aprobación escrita de Juan. Nada se cargó a Payload ni a ninguna base (D-03). Las tareas 1 y 2 están hechas; la tarea 3 (checkpoint de decisión) sigue abierta y no se marca ningún requisito CONT como completo.

## Qué quedó hecho

**Tarea 1 (tracer) y tarea 2: datos, autoprueba y verificación viva.**
- `56-case-lessons.ts` exporta `CASE_LESSONS` (mapa por slug), `DECISIONS` (21 ids `LESSON-<slug>-<n>`, estado `propuesto`, gate `aprobado`, fuente con la URL pública del caso y vista previa con las cifras respaldadas), `caseUrl`, `lessonId` y `flatLessons`. La forma de cada lección es la del campo `lessons` de `CaseStudies`: `title` y `body` de texto, por idioma.
- Cada lección trae `figures`: el fragmento exacto del caso que respalda cada cifra, con `textEn` cuando el fragmento cambia de idioma, y `from`, `to` y `pct` donde el caso muestra un porcentaje (83, 47 negativo en posición de escritorio, 319, 309, 47, 82, 406, 67, 104 y 62).
- `56-cases-lessons-live.mjs`: por `BASE_URL` descarga ES y EN de cada caso, extrae el texto visible sin script, style, noscript ni svg, y exige cada fragmento en el idioma que corresponde y el porcentaje mostrado (`+83%`, `-47%`). Modos `--only <slug>`, `--selftest` (14 casos con HTML sintético) y `--expect-loaded`, que además exige los títulos como h3 de `#lecciones` y es solo del gate del corte. Imprime SKIP para un caso sin lecciones.
- `56-lessons-selftest.ts` (25 comprobaciones): 7 casos y 21 lecciones, títulos sin punto ni coma, sin rayas ni marcador, sin voz de agencia, toda cifra del texto con su fragmento, porcentajes recalculados, los ajustes PARCIAL, una decisión por lección y fixtures defectuosos que deben fallar.

## Ajustes sobre el borrador del sandbox

Los dos PARCIAL de RESEARCH 6 y los dos títulos con coma, tal como pedía el plan:

| Lección | Cambio |
|---|---|
| baldosa 3 | Sin afirmar que la indexabilidad vino antes de publicar más páginas. Título "Un catálogo grande necesita rastreo consistente" (sin "primero") y cuerpo que describe lo que las mejoras buscaban |
| migración 2 | Título "El renderizado híbrido mejora el rendimiento" (sin la cola "sin esperar al lanzamiento") |
| pittsburgh 1 | "Escalar exige contenido específico y no solo marca" (sin coma) |
| talleres 1 | "En un sitio nuevo lo primero es que Google lo rastree" (sin coma) |
| edtech 3 | Se mantiene: las Conclusiones del caso dicen la caída del 25 % frente al semestre anterior con impresiones estables. Solo usa esa afirmación (sin la hipótesis de algoritmo o estacionalidad) |

Por la misma regla de cero afirmaciones inventadas, además reescribí lecciones donde el borrador presentaba como resultado algo que el caso presenta como intención o como sospecha:

| Lección | Qué cambié y por qué |
|---|---|
| baldosa 1 | "pequeño" pasa a "artesanal": el caso nunca dice pequeño |
| baldosa 2 | El caso dice "para capturar búsquedas informacionales", no que las capturó. El cuerpo habla de cubrirlas y se apoya en la falta de contenido educativo que el caso declara en el reto. Título "cubre lo que el catálogo no cubre" |
| inmigración 2 | El caso no dice que esas páginas "ganaron visibilidad". Ahora dice qué páginas se crearon y que el contenido educativo fue uno de los motores del salto |
| inmigración 3 | El caso dice "sugiere", no afirma. El cuerpo conserva el verbo |
| talleres 1 | Quité "la condición para todo lo demás", que es interpretación. Queda el trabajo técnico inicial que el caso describe |
| talleres 2 | "primer año" pasa a "primer año medible", que es lo que el caso dice |
| edtech 1 | El título "optimizar primero" afirmaba un orden que el caso no fija. Queda "Vale la pena optimizar el artículo ancla" |

## Verificación

- `node_modules/.bin/tsx scripts/verify/56-lessons-selftest.ts`: 25 PASS, 0 FAIL.
- `node scripts/verify/56-cases-lessons-live.mjs --selftest`: 14 PASS.
- `BASE_URL=https://dev.juan-tech.com node scripts/verify/56-cases-lessons-live.mjs`: PASS para los 7 casos en ES y EN (14 combinaciones). Mismo resultado con `BASE_URL=https://juan-tech.com` (producción, solo GET).
- `node scripts/verify/56-content-guard.mjs --data`: PASS (11 archivos de datos 56).
- `node_modules/.bin/tsx scripts/verify/56-gate.ts`: lista 21 filas LESSON, todas `propuesto` con gate `aprobado`.
- `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only LESSON-pittsburgh`: muestra las tres lecciones con sus cifras respaldadas.
- `node scripts/verify/56-run-all.mjs --selftests`: `56-lessons-selftest` y `56-cases-lessons-live --selftest` en PASS dentro de la batería. `tsc --noEmit` sin errores en los archivos del plan.
- Barrera del tracer: con `AUTO_CFG` falso y `HUMAN_VERIFY_MODE` en `end-of-phase` se volvió a correr la verificación automatizada completa de punta a punta antes de expandir a los seis casos restantes, y pasó.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `grep -c LESSON | grep -qx 21` del plan da 42, no 21**
- **Found during:** Tarea 2, al correr la verificación automatizada.
- **Issue:** `56-gate.ts` sin `--gate` imprime la fila de la tabla y además una línea INFO por cada decisión `propuesto` con gate `aprobado`, así que cada lección aparece dos veces.
- **Fix:** no cambié el gate (es de 56-01). Cuento las filas con `grep -c "^LESSON"`, que da 21. El criterio de aceptación "lista 21 decisiones LESSON en estado propuesto" se cumple.
- **Files modified:** ninguno.

**2. [Rule 2 - Missing critical functionality] El verificador vivo podía respaldar una cifra con la propia lección**
- **Found during:** Tarea 1, al diseñar `--expect-loaded`.
- **Issue:** tras el corte, las cifras de la lección aparecen en la sección de lecciones y una comprobación de texto completo pasaría aunque el caso no mostrara la cifra.
- **Fix:** `caseText` excluye la sección `id="lecciones"` antes de comparar. Hay un caso de autoprueba para eso.
- **Commit:** 8685387

**3. [Rule 2 - Missing critical functionality] Las cifras de porcentaje no estaban cubiertas por el plan**
- **Issue:** el plan pedía `from` y `to` solo "para recalcular". Sin comprobar que el caso muestre el porcentaje, una lección podría afirmar +83 % sin que el caso lo diga.
- **Fix:** el verificador vivo exige también el `pct` con el formato del caso (`+83%`, `-47%`) y la autoprueba cuenta el porcentaje como respaldo de la cifra.
- **Commit:** 8685387

**4. [Rule 1 - Bug] El campo `figures.text` del plan no basta para dos idiomas**
- **Issue:** algunos fragmentos cambian de idioma ("decenas de artículos..." y "Dozens of articles...").
- **Fix:** cada figure lleva `text` (ES, o igual en los dos idiomas para cifras) y `textEn` opcional. Las cifras con formato igual en ES y EN ("47,108", "4.2s") no repiten el campo.
- **Commit:** 11a8abc

### Notas de proceso

- **Los commits no son uno por tarea.** Escribí el archivo de datos completo (los 7 casos) antes de los verificadores, así que quedó en un commit de datos (11a8abc) y otro de verificadores (8685387). El conteo medido de `git rev-list` desde `plan_head_before` es 2, y los dos son de este plan. Los planes 56-05 y 56-07 corrieron en paralelo en la misma rama y sus commits quedan antes de la base registrada.
- **Fuente de las cifras:** usé producción (`https://juan-tech.com`) como indicó la orden y dev (`https://dev.juan-tech.com`) como indica el plan. Los dos devuelven los mismos números de cada caso. La `source` de cada decisión apunta a producción.
- `56-gate.ts` sin `--gate` sale con 1 en este momento por `56-legal-lexical.ts` (archivo del plan 56-05 en curso, sin export `DECISIONS`). No es de este plan.
- La normalización del verificador unifica comillas, espacios y el espacio junto a `+` y `%`, pero no los separadores de miles: exige "47,108" y "4.2s" tal cual los muestra el caso en los dos idiomas.

## Auth gates

Ninguno. El plan solo hace GET públicos y lee archivos del repo. No abre la base, no usa túnel y no toca `.env`.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. El plan no agrega endpoints, rutas de autenticación ni acceso a archivos fuera del repo.

## Items abiertos para Juan

1. **Tarea 3, checkpoint de decisión (pendiente).** Aprobar las 21 lecciones. Se leen con `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only LESSON`. Respuesta esperada: `aprobado` (las 21), `cambios: <slug>-<n>: <texto>` (una por línea) o `defaults` (quedan propuestas y el gate del corte las marca como no aprobadas). Tras tu respuesta hay que pasar cada lección a `aprobado` con la fecha, reaplicar las cifras con el verificador vivo y correr `56-gate.ts`.
2. **Lo que debes mirar primero:** los siete ajustes extra de la tabla de arriba, en especial baldosa 2, inmigración 2 y edtech 1, donde el título o el cuerpo cambió más que en el borrador.
3. **Avisos de contenido de los casos, fuera de las lecciones (van al handoff):**
   - el caso de migración muestra los periodos en inglés dentro de la página en español ("Después: After (90 days)");
   - el caso edtech muestra +142 % de impresiones en la tabla y +141 % en el titular y en las Conclusiones; ninguna lección usa esa cifra;
   - el caso talleres rotula "4 (branded search)" en inglés en la página española.
4. **Carga a Payload:** no se hizo ni se hará en esta fase. El cargador es del plan 56-14 y se corre en el corte, solo con lecciones `aprobado` (T-56-20 y T-56-21).

## Self-Check: PASSED

Archivos creados presentes: `scripts/db/data/56-case-lessons.ts`, `scripts/verify/56-cases-lessons-live.mjs`, `scripts/verify/56-lessons-selftest.ts`. Commits 11a8abc y 8685387 presentes en la rama feat/mui-redesign.
