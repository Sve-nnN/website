---
phase: 56-contenido-pendiente-de-juan
plan: 05
subsystem: content
tags: [legal, privacy, terms, lexical, evidence, legal-facts, live-verifier, cont-03, d-06, d-07, d-08, d-09]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: 56-01 (registro de decisiones, 56-gate, guardia de contenido, 56-run-all) y 56-03 (global legal-pages sombra)
provides:
  - Constructor Lexical puro sectionsToLexical (h2, parrafo, lista con vinetas, enlaces https y mailto) aceptado por extractHeadings
  - PRIVACY_ES (11 secciones) y TERMS_ES (9 secciones) en primera persona de Juan, con evidencia por bloque y sin fecha
  - LEGAL_FACTS (6 hechos por confirmar) con status, valor y evidencia, y buildPrivacyEs/buildTermsEs que reconstruyen el texto desde los hechos
  - LEGAL_EFFECTIVE_DATE vacia (D-09) y 6 DECISIONS LEGAL-FACT-* con gate aprobado
  - 56-legal-copy-selftest.ts y 56-legal-live.mjs (cuatro rutas, con --selftest y --expect-date)
affects: [56-08, 56-11, 56-12, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "Cada parrafo y cada elemento de lista lleva un campo evidence tipado: la autoprueba rechaza un bloque sin evidencia, asi la regla no depende de un comentario"
    - "El texto legal es una funcion de LEGAL_FACTS: cambiar un valor o un status es una linea y el texto se reconstruye"
    - "Un hecho sin dato (region, buzon) no se inventa: el texto usa una formula general hasta que Juan lo confirme"
key-files:
  created:
    - scripts/db/data/56-legal-lexical.ts
    - scripts/db/data/56-legal-copy.ts
    - scripts/verify/56-legal-copy-selftest.ts
    - scripts/verify/56-legal-live.mjs
  modified: []
key-decisions:
  - "El formulario de contacto NO guarda nada en la base (contact.ts solo hace sendEmail): el texto lo dice asi y corrige D-08"
  - "Seis hechos propuestos con gate aprobado: el trabajo no se bloquea, el corte si hasta que Juan los apruebe en el plan 56-11"
  - "El texto declara los registros tecnicos del servidor (IP, fecha, pagina) por prudencia, aunque no se verificaron en el VPS: si no existen, Juan lo quita"
  - "Los enlaces dentro del texto son absolutos https (privacidad a https://juan-tech.com/privacy) porque el constructor solo admite https y mailto, segun el plan"
patterns-established:
  - "Un modulo scripts/db/data/56-*.ts de solo funciones exporta DECISIONS vacio: 56-gate lo exige aunque no registre decisiones"
requirements-completed: []
duration: 55min
completed: 2026-11-10
status: complete
commits: 8
plan_head_before: 54357b8ee1d5c49f01fb826697793e305848589f
actuals:
  tokens: 14700
  tasks: 2
  commits: 8
---

# Phase 56 Plan 05: Texto legal en español y verificador del HTML servido Summary

Privacidad y términos en español, en primera persona de Juan, construidos sobre la plantilla CC0 de General-Legal y escritos desde lo que el código y el HTML realmente hacen: sin analítica, una sola cookie funcional (NEXT_LOCALE), formulario de contacto que solo envía un correo por Resend, suscriptores con doble confirmación y proveedores reales (Resend, Cloudinary, Hetzner con Dokploy, Cloudflare solo DNS). Cada afirmación lleva su evidencia, cada hecho dudoso vive en una constante de una línea y no hay fecha efectiva (D-09). Cero escrituras a la base.

## Qué quedó hecho

**Task 1 (tracer): constructor, privacidad y autoprueba.**
- `56-legal-lexical.ts`: `sectionsToLexical` produce un h2 por sección, párrafos, lista con viñetas y enlaces. El texto entra como nodos de texto, nunca como HTML. `assertSafeHref` rechaza todo lo que no sea https o mailto. Parte de `heading`, `paragraph` y `richTextDoc` de `seed-legal-pages.ts`, que no se importa porque ejecuta efectos al cargar.
- `56-legal-copy.ts`: `LEGAL_FACTS`, `LEGAL_EFFECTIVE_DATE` vacía, `PRIVACY_ES` con 11 secciones (quién soy, qué datos recojo, qué no uso, cookies, proveedores, afiliados, cuánto guardo, derechos, transferencias, menores, cambios) y encabezados sin número, punto ni coma.
- `56-legal-copy-selftest.ts`: valida el estado Lexical con `extractHeadings`, los enlaces, los hechos, las cadenas requeridas y prohibidas, que un cambio en `LEGAL_FACTS` cambie el texto, y que la propia autoprueba rechace 12 fixtures defectuosos.
- Barrera del tracer: con `HUMAN_VERIFY_MODE=end-of-phase` y verificación solo automatizada se volvió a correr de punta a punta (autoprueba, guardia, gate, tsc) y pasó antes de expandir.

**Task 2: términos y verificador vivo.**
- `TERMS_ES` con 9 secciones (aceptación, qué es el sitio, propiedad intelectual y cómo citarme, afiliados, terceros, sin garantías y límite de responsabilidad, cambios, ley aplicable, cómo contactarme). La ley aplicable sale de `LEGAL_FACTS.GOVERNING_LAW`. Ninguna sección nombra un proveedor; la autoprueba lo exige contra `LEGAL_FACTS` y se prueba con un fixture.
- `56-legal-live.mjs`: descarga `/privacy`, `/terms`, `/en/privacy` y `/en/terms` de `BASE_URL` (solo GET). Exige 200, cero hosting anterior, analítica anterior y Cloudflare Insights, cero marcadores, un solo h1, h2 de `main` sin punto, coma ni número inicial, y en privacy los seis nombres reales. Con `--expect-date` exige un `<time datetime>` con fecha. `--selftest` corre 3 casos buenos y 13 malos sin red.

## Verificación

- `tsx scripts/verify/56-legal-copy-selftest.ts`: PASS (todos los casos).
- `node scripts/verify/56-legal-live.mjs --selftest`: PASS (3 buenos, 13 malos).
- `node scripts/verify/56-content-guard.mjs --data` y `--selftest`: PASS (12 archivos de datos).
- `tsx scripts/verify/56-gate.ts`: sale 0; lista las 6 decisiones `LEGAL-FACT-*` como `propuesto` con gate `aprobado`.
- `npx tsc --noEmit`: sin errores.
- `node scripts/verify/56-run-all.mjs --selftests`: salida 0, 147 PASS, 0 FAIL, los SKIP son scripts de planes posteriores.
- `node scripts/verify/56-legal-live.mjs` con `BASE_URL=https://juan-tech.com` (solo GET, sin escribir nada): FAIL en las cuatro rutas, como debe ser. Prueba que el verificador detecta el texto vivo de hoy (hosting anterior, Google Analytics, Cloudflare Insights, encabezados numerados, sin Hetzner ni NEXT_LOCALE).
- Humanizer: el texto se redactó con la muestra de voz y las reglas de `voice-and-tone-juan.md` y se pasó por los patrones del humanizer (sin rayas, sin negrita mecánica, sin cierres genéricos, ritmo mixto). No hay emojis ni comillas curvas.
- Plantillas CC0 leídas (solo lectura) de `raw.githubusercontent.com/General-Legal/legal-templates/main/templates/{privacy-policy-gdpr,terms-of-use,cookie-notice}/template.md`; se omitió el aviso de leyes de estados de EE. UU. y la cláusula de arbitraje.
- Las cuatro URL de políticas de proveedores enlazadas en el texto (Resend, Cloudinary, Hetzner, Cloudflare) responden HTTP 200.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `56-legal-lexical.ts` rompía `56-gate`**
- **Found during:** Task 2, al correr `56-run-all --selftests` (el paso `56-gate` salía 1).
- **Issue:** `56-gate` descubre todo `scripts/db/data/56-*.ts` y exige un export `DECISIONS`. El constructor Lexical no lo tenía. El commit de la Task 1 (bf75f5b) pasó la autoprueba legal pero dejó `56-gate` en rojo.
- **Fix:** `export const DECISIONS: Decision[] = []` en `56-legal-lexical.ts`, siguiendo la convención de 56-01. Va en el commit de la Task 2.
- **Files modified:** `scripts/db/data/56-legal-lexical.ts`
- **Commit:** e1d2fda

**2. [Rule 2 - Missing critical] Evidencia tipada por bloque, no solo comentario**
- **Found during:** Task 1. El plan pide un comentario de evidencia por afirmación.
- **Issue:** un comentario no lo verifica nadie, y T-56-15 es de severidad alta.
- **Fix:** los bloques y los elementos de lista llevan un campo `evidence` obligatorio en el tipo. La autoprueba rechaza uno vacío. No se renderiza ni entra al estado Lexical.
- **Files modified:** `scripts/db/data/56-legal-lexical.ts`, `scripts/db/data/56-legal-copy.ts`, `scripts/verify/56-legal-copy-selftest.ts`
- **Commit:** bf75f5b

### Notas de proceso

- `commits: 8` es el conteo medido de `git rev-list` desde `plan_head_before`. Solo dos son de este plan (bf75f5b y e1d2fda). Los otros seis son de los planes 56-06 y 56-07, que corrieron en paralelo en el mismo checkout.
- El plan decía "Todos con gate aprobado" y la instrucción de ejecución pedía hechos `propuesto` con valor recomendado. Se cumplen las dos: status `propuesto` (no bloquea el trabajo) y gate `aprobado` (bloquea el corte hasta que Juan responda).
- El plan listaba seis hechos; la región del servidor, el plazo de los registros de acceso y la ley de datos peruana entran como `details` de `HOSTING` y de `GOVERNING_LAW`, para que el recuento de seis decisiones coincida con lo que espera el plan 56-11.

## Auth gates

Ninguno. El plan no abre la base ni usa `.env`.

## Known Stubs

Ninguno. La fecha efectiva vacía es intencional (D-09) y la fija el plan 56-14 el día del corte.

## Threat Flags

Ninguno. No se agregan endpoints, rutas de autenticación ni acceso a archivos fuera del repo. El verificador vivo solo hace GET.

## Items abiertos para Juan (se resuelven en el plan 56-11)

1. **Región del servidor Hetzner.** Vacía: el texto no nombra país hasta que la confirmes (Alemania, Finlandia o EE. UU. según el centro de datos). Una línea en `LEGAL_FACTS.HOSTING.details.region`.
2. **Proveedor del buzón `hello@juan-tech.com`.** Vacío: el texto dice "un proveedor de correo". Una línea en `LEGAL_FACTS.MAILBOX_PROVIDER.value`.
3. **Plazos de retención.** 12 meses para los correos del formulario y 12 meses tras la baja de un suscriptor (el texto vivo decía 12). No existe borrado automático en el código: el plazo se cumple a mano. Confirma el número o cámbialo.
4. **Registros técnicos del servidor.** El texto declara que el servidor puede anotar IP, fecha y página, con un plazo propuesto de 30 días. No lo verifiqué en el VPS (proxy de Dokploy). Si no hay registros de acceso, quita esa viñeta y la línea de la sección de plazos.
5. **Banner de cookies.** La conclusión "no hace falta" porque NEXT_LOCALE es funcional es mía, no de un abogado. Confírmala.
6. **Ley aplicable y ley de datos.** Perú propuesto. La mención de la Ley 29733 es un supuesto por validar. Elige mencionar u omitir.
7. **Revisión legal profesional opcional tras el corte** (D-10): el texto no es asesoría legal. Esta nota va en el handoff, no en el sitio.
8. **EN y la aprobación del texto** son del plan 56-11; la siembra al global es del 56-12; la fecha efectiva del 56-14.

## Self-Check: PASSED

Archivos presentes: `scripts/db/data/56-legal-lexical.ts`, `scripts/db/data/56-legal-copy.ts`, `scripts/verify/56-legal-copy-selftest.ts`, `scripts/verify/56-legal-live.mjs`. Commits bf75f5b y e1d2fda presentes en la rama feat/mui-redesign.
