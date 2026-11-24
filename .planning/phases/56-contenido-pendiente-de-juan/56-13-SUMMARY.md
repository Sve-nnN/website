---
phase: 56-contenido-pendiente-de-juan
plan: 13
subsystem: content-data
tags: [cutover, backup, websites, testimonial, author, d-02, d-13, d-20, d-21, tracer]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: registro de decisiones, gate y review-export (56-01); 56-about-copy con D-11 (56-04); 56-alt-texts, 56-case-lessons, 56-headings-table y 56-legal-copy (56-05 a 56-11); 56-cta-map (56-10)
provides:
  - CUTOVER_ITEMS con 46 cargas del corte, cada una con current leido por GET como respaldo, loadAt corte, estado y gate
  - DECISIONS CUT- con 11 decisiones propias (Websites, testimonio, autor, recursividad, fecha legal, landings); los 35 items restantes siguen el estado de ALT-, LESSON-, CTA- y HEAD-
  - 56-cutover-selftest con reglas de forma, cruce con los archivos de origen y modo --live de solo GET que detecta si produccion cambio desde el respaldo
affects: [56-14, 57]
tech-stack:
  added: []
  patterns:
    - "Items gobernados: el estado lo manda la decision que ya existe y la autoprueba comprueba que coincida, asi el gate no cuenta dos veces el mismo texto"
    - "Respaldo vivo: LIVE_WEBSITES, LIVE_TESTIMONIAL y LIVE_AUTHOR_EXPERIENCE guardan lo que sirvio produccion y --live lo compara con un GET antes del corte"
key-files:
  created:
    - scripts/db/data/56-cutover-data.ts
    - scripts/verify/56-cutover-selftest.ts
  modified: []
key-decisions:
  - "Ninguna decision de Juan llego todavia: las dos tareas checkpoint:decision se resolvieron con los valores por defecto recomendados y quedan en estado propuesto, sin bloquear el trabajo"
  - "Apturio no cambia: su fila dice Hostinger y las cabeceras de apturio.com lo confirman (platform: hostinger, panel: hpanel), asi que la premisa de que estaba desactualizada solo se sostiene para Juan Tech, Aprendoclub y Arianna"
  - "Los highlights y retos de Arianna Lupi quedan pendientes y sin texto: nada se inventa (T-56-47)"
  - "current queda exento de la regla de rayas: es el valor vivo copiado tal cual y las capturas de Websites sirven hoy un alt con raya larga"
requirements-completed: []
duration: 40min
completed: 2026-11-10
status: complete
commits: 1
plan_head_before: d0cfa6f022f03974a5f8ca8b98a5f3e9db580c19
actuals:
  tokens: 13800
  tasks: 3
  commits: 1
---

# Phase 56 Plan 13: Datos del corte con respaldo Summary

Registro de 46 cargas del corte con su valor actual como respaldo, leido solo por GET a la API publica de produccion y a los sitios publicos, y las decisiones de Websites, testimonio y recursividad registradas con sus valores recomendados. Cero escrituras a la base, cero tuneles, cero secretos.

## Que quedo hecho

**Task 1 (tracer), commit 352d141.** El modelo de datos corre de punta a punta con un item real: el stack de Arianna Lupi.
- `56-cutover-data.ts`: tipo `CutItem` (id, kind, target, loadAt corte, current, desired, status, gate, governedBy, evidence). `CUTOVER_ITEMS` junta Websites (6), testimonio (1), autor (1), recursividad (1), fecha legal (1), alt de capturas (6), lecciones (21), CTAs que lee master (4) y encabezados que sirve master (5).
- Un item propio genera una decision `CUT-<prefijo>-<nombre>`. Un item gobernado (alt, lecciones, CTAs, encabezados) apunta a su decision (`ALT-`, `LESSON-`, `CTA-`, `HEAD-`) y hereda su estado.
- `56-cutover-selftest.ts`: reglas de forma probadas con fixtures buenos y malos; las 21 lecciones y las 6 capturas coinciden exactamente con `56-case-lessons.ts` y `56-alt-texts.ts`; el estado de los 35 items gobernados coincide con su decision; modo `--live` de solo GET.
- Barrera del tracer: se volvio a correr la verificacion automatizada completa antes de pasar a las tareas de decision. Paso.

**Tasks 2 y 3 (checkpoint:decision): resueltas con los valores por defecto, sin parar.** El orquestador indico que ninguna decision bloquea y que van como `propuesto` con el valor recomendado. Se registraron en `56-cutover-data.ts` con sus opciones, y la autoprueba corre en PASS.

## Hechos verificados desde fuera (solo GET, cabeceras y marcadores)

| Sitio | Lo que se verifico | Lo que no se puede verificar |
|---|---|---|
| ariannalupi.com | Astro (7 `astro-island`, 4 `_astro/`, 0 `_next/static`), `server: cloudflare`, IP y NS de Cloudflare | el hosting de origen (queda tras el proxy), por eso Hostinger NO se afirma |
| aprendoclub.com | 307 a www; Next.js y Payload (`x-powered-by: Next.js, Payload`, `/api/users/me` con forma de Payload), Vercel (`x-vercel-id`), Cloudflare. aprendoseo.com redirige 301 al mismo sitio | Neon Postgres |
| apturio.com | Next.js, Payload (`/api/users/me` y `/admin` responden como Payload), Hostinger (`server: LiteSpeed`, `platform: hostinger`, `panel: hpanel`, A 82.25.87.50). No pasa por el proxy de Cloudflare | Neon Postgres |
| juan-tech.com | Next.js y Payload (`x-powered-by`), Hetzner (A 116.203.79.125 con rDNS `your-server.de`) | Postgres, Dokploy, Cloudinary y Resend (vienen de D-08 y de lo que Juan dio) |
| loopsgrowth.com | 200, titulo "Agencia de SEO/GEO Growth \| loops growth", Astro (30 `_astro/`), Cloudflare | nada que cargar: no se crea fila |

## Decisiones registradas (todas `propuesto`, salvo lo que no existe)

| Item | Defecto registrado | Estado y gate |
|---|---|---|
| CUT-websites-ariannalupi-stack | stack Astro y Cloudflare, cargado en el corte | propuesto, gate aprobado |
| CUT-websites-ariannalupi-textos | Juan dicta highlights y retos; sin desired | pendiente, gate aprobado |
| CUT-websites-juan-tech-com | Next.js, Payload CMS, Postgres, Hetzner, Dokploy, Cloudinary, Resend; la linea de hosting pasa a "VPS de Hetzner con Dokploy" | propuesto, gate aprobado |
| CUT-websites-apturio-com | sin cambio (Hostinger verificado) | propuesto, gate propuesto |
| CUT-websites-aprendoclub-com | Hostinger sale; entran Vercel y Cloudflare; la linea de hosting pasa a "Desplegada en Vercel detras de Cloudflare" | propuesto, gate aprobado |
| CUT-websites-loopsgrowth-com | no crear fila | propuesto, gate propuesto |
| CUT-testimonial-patricia-ibarra | dejar las dos citas como estan | propuesto, gate propuesto |
| CUT-post-translation-recursividad | servir el aviso de traduccion existente | propuesto, gate propuesto |
| CUT-author-aprendoclub-experience | endDate de la fila AprendoSEO pasa de feb 2026 a vacio (hoy) | propuesto, gate aprobado |
| CUT-legal-date-efectiva | el dia del corte (`LEGAL_EFFECTIVE_DATE` vacia hasta entonces) | pendiente, gate aprobado |
| CUT-cta-master-landings-servicio | dejar | propuesto, gate propuesto |

## Verificacion

- `node_modules/.bin/tsx scripts/verify/56-cutover-selftest.ts`: PASS (41 casos).
- `node scripts/verify/56-run-all.mjs --selftests`: PASS, incluida la regresion de la 54 y de la 55.
- `node_modules/.bin/tsx scripts/verify/56-cutover-selftest.ts --live` (solo GET a produccion): PASS. Las 4 filas de Websites, el testimonio, la fila del autor y la ausencia del campo `lessons` siguen igual que el respaldo.
- `node scripts/verify/56-content-guard.mjs --data`: PASS (16 archivos de datos revisados).
- `node_modules/.bin/tsx scripts/verify/56-gate.ts`: sale 0, con las 11 decisiones CUT- listadas.
- `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only CUT`: imprime el actual y el deseado de Arianna Lupi.
- `npx tsc --noEmit`: sin errores.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El prefijo del id sigue los comandos del plan, no el nombre largo del kind**
- **Found during:** Task 1
- **Issue:** el plan pide `--only CUT-websites` y `--only CUT-testimonial CUT-post`, pero el kind se llama `websites-row`, y un id `CUT-websites-row-...` no los encuentra.
- **Fix:** `CUT_ID_PREFIX` mapea cada kind a un prefijo corto (`websites-row` a `websites`). Los ids salen como `CUT-websites-ariannalupi-stack` y `CUT-post-translation-recursividad`.
- **Commit:** 352d141

**2. [Rule 1 - Bug] `current` queda exento de la regla de rayas de la autoprueba**
- **Found during:** Task 1
- **Issue:** el plan pide que ninguna cadena traiga raya larga ni media, pero el respaldo del alt de las capturas es el valor vivo, que lleva raya larga. Limpiarlo falsearia el respaldo.
- **Fix:** la regla de rayas y de marcador aplica a `desired` y a todo el texto de revision; `current` solo se revisa por marcador. Hay un fixture que prueba la excepcion.
- **Commit:** 352d141

**3. [Rule 2 - Missing critical] Items gobernados en lugar de decisiones duplicadas**
- **Found during:** Task 1
- **Issue:** emitir una decision CUT- por cada alt, leccion, CTA y encabezado habria contado dos veces el mismo texto en el gate de la fase 57.
- **Fix:** esos 35 items llevan `governedBy` y no generan decision; la autoprueba exige que su estado coincida con la decision de origen.
- **Commit:** 352d141

### Cambios respecto a los valores por defecto del plan

- **Otras filas de Websites:** el plan ponia "otras=dicto sin datos todavia y por tanto pendiente". Por instruccion del orquestador, que dio el stack real, quedan `propuesto` con valores concretos. Apturio es la excepcion: no cambia, porque Hostinger se verifica por cabeceras.
- **Recursividad, "22 %":** el 22 % sale de `src/lib/translation-gaps.ts` (medicion del 2026-08-20 sobre HTML servido, 4368 a 966 palabras). Mi medicion de hoy sobre los nodos de texto de Lexical da 14 % por palabras (535 de 3831) y 33 % por bloques (36 de 109). Son instrumentos distintos; el respaldo registra los tres.

## Auth gates

Ninguno.

## Known Stubs

Ninguno. Los dos items sin `desired` (`CUT-websites-ariannalupi-textos` y `CUT-legal-date-efectiva`) son pendientes de verdad, no marcadores: el primero espera lo que Juan dicte y el segundo espera el dia del corte (D-09).

## Threat Flags

Ninguno. Solo archivos de datos y lecturas GET. T-56-46, T-56-47 y T-56-48 mitigados: ningun script escribe en la base, todo item es loadAt corte con respaldo, y no se inventaron stack, highlights, retos ni citas.

## Items abiertos para Juan

1. **Arianna Lupi:** confirma que el stack es Astro (los marcadores del HTML lo confirman) y dicta los highlights y retos reales de ese sitio, en ES y EN. Hasta entonces el item bloquea el gate de la fase 57 y la fila seguiria contando una migracion a Next.js y Payload.
2. **Juan Tech y Aprendoclub:** confirma el stack propuesto. En Juan Tech decide si Cloudinary y Resend van como tags de stack o se quedan como servicios. En Aprendoclub confirma si la base de datos sigue siendo Neon.
3. **Apturio:** no se toca porque Hostinger se verifica por cabeceras. Confirma solo si la base de datos es Neon.
4. **Loops Growth:** no se crea fila en Websites (recomendado). Si prefieres crearla, dicta highlights, retos, rol y año.
5. **Cita de Patricia Ibarra:** ES "Trabajar con Juan fue lo mejor." y EN "Working with Juan was the best decision we made." no dicen lo mismo. Dime cual es la real. Aviso: un testimonio nuevo que pegues en el admin aparece en produccion al instante porque `master` lee esa coleccion.
6. **Recursividad EN:** la recomendacion es servir el aviso de traduccion que ya existe (dev ya lo muestra, produccion ya tiene noindex). Si eliges traducir, el orquestador lo planea aparte con `/gsd-plan-phase 56 --gaps`.
7. **Captura de Juan Tech:** la imagen de Payload es una pagina de Vercel en pausa. Hay que recapturar juan-tech.com antes de redactar su alt (`ALT-juan-tech` sigue pendiente).
8. **Fila de autor:** la fecha de fin de AprendoSEO pasa a "hoy" en el corte. El nombre de la empresa en esa fila (AprendoSEO) no se toca: renombrarlo a aprendoclub es decision tuya.

## Notas para 56-14 y 57

- El cargador del corte debe leer `CUTOVER_ITEMS` y, antes de escribir, correr `56-cutover-selftest.ts --live` (solo GET) para confirmar que produccion no cambio desde el respaldo (DRIFT).
- Un PATCH del arreglo `experience` del autor reemplaza las tres filas: el respaldo ya trae las tres completas, en ES y EN.
- La fecha legal la fija 56-14 en `LEGAL_EFFECTIVE_DATE`; la autoprueba exige que el item pase a `aprobado` con ese valor.
- No se marco ningun CONT-* como completo.

## Self-Check: PASSED

Archivos presentes: `scripts/db/data/56-cutover-data.ts`, `scripts/verify/56-cutover-selftest.ts`. Commit 352d141 presente en la rama feat/mui-redesign.
