---
phase: 56-contenido-pendiente-de-juan
plan: 11
subsystem: content
tags: [legal, privacy, terms, english, lexical, legal-facts, parity, cont-03, d-06, d-07, d-08, d-09, d-10]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: 56-01 (registro de decisiones, 56-gate, 56-review-export) y 56-05 (PRIVACY_ES, TERMS_ES, LEGAL_FACTS, constructor Lexical)
provides:
  - PRIVACY_EN (11 secciones) y TERMS_EN (9 secciones), adaptacion fiel del espanol, con la evidencia copiada por posicion del ES
  - buildPrivacyEn y buildTermsEn, funciones de LEGAL_FACTS como las del ES
  - LEGAL_FACTS con valueEn y detailsEn por hecho
  - withEvidenceFrom (paridad estructural ES y EN por construccion) y sectionsToPlain (vista previa)
  - DECISIONS LEGAL: LEGAL-PRIVACY-ES/EN, LEGAL-TERMS-ES/EN y los seis LEGAL-FACT, con es y en
  - Autoprueba extendida: 71 comprobaciones PASS (paridad ES y EN, hechos, decisiones, ingles sin espanol)
affects: [56-12, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "El EN se escribe sin evidencia propia y la toma por posicion del ES: si las estructuras difieren, el modulo lanza al cargarse (T-56-36)"
    - "Un hecho se afirma en los dos idiomas o en ninguno: valor y valueEn los dos llenos o los dos vacios, verificado por la autoprueba"
    - "Las banderas (mentionDataLaw) se leen de details y no se duplican en detailsEn"
key-files:
  created: []
  modified:
    - scripts/db/data/56-legal-copy.ts
    - scripts/verify/56-legal-copy-selftest.ts
key-decisions:
  - "Los hechos abiertos quedan propuesto con gate aprobado (no bloquean el trabajo, si el corte): region del servidor vacia, buzon sin nombrar, 12 meses para contacto y suscriptores, 30 dias para registros, banner no necesario, Peru y Ley 29733 mencionada"
  - "El checkpoint del plan (task 3) no se detuvo: por instruccion del orquestador se resolvio por la via defaults. Juan no respondio, asi que ningun estado pasa a aprobado y no se registra fecha de aprobacion"
  - "Las cuatro decisiones de documento llevan el texto completo como preview para 56-review-export --only LEGAL"
patterns-established:
  - "Cuando Juan apruebe: cambiar status a 'aprobado' en una decision es una linea; cambiar un hecho es una linea en LEGAL_FACTS (value y valueEn)"
requirements-completed: []
duration: 40min
completed: 2026-11-10
status: complete
commits: 8
plan_head_before: 8c0d45160f973380b2b4316672703010b3775907
actuals:
  tokens: 10400
  tasks: 3
  commits: 2
---

# Phase 56 Plan 11: Texto legal en inglés y decisiones de aprobación Summary

Privacy y terms en inglés, adaptados fielmente del español de 56-05: mismas secciones, mismos hechos, mismos proveedores (Resend, Cloudinary, Hetzner con Dokploy, Cloudflare solo DNS), la cookie NEXT_LOCALE y hello@juan-tech.com, con la misma evidencia por afirmación y encabezados sin número, punto ni coma. Los hechos que solo Juan confirma siguen como `propuesto` con valor recomendado, y el texto de los cuatro documentos espera su aprobación. Cero escrituras a la base, cero `.env`, sin push.

Este texto no es asesoría legal (D-10). Juan no es abogado. La revisión legal profesional opcional tras el corte va en el handoff de 56-14, no en el sitio.

## Qué quedó hecho

**Task 1 (tracer): privacy en inglés con paridad.**
- `PRIVACY_EN` con las 11 secciones del ES en el mismo orden: Who I am and how to contact me, What data I collect, What I don't use, Cookies, Providers that process data, Affiliate links, How long I keep your data, Your rights and how to use them, International transfers, Children, Changes to this policy.
- Los siete derechos con el vocabulario de la plantilla CC0 (access, correction, deletion, portability, restriction, objection, withdrawing consent). Estructura tomada de la plantilla, texto reescrito en primera persona, frases cortas, sin rayas.
- `LegalFact` gana `valueEn` y `detailsEn`. Así "12 meses" es "12 months", "Perú" es "Peru", "Ley 29733 de Protección de Datos Personales" es "Law 29733 on Personal Data Protection" y los plazos de registros "30 días" es "30 days".
- `withEvidenceFrom(es, en, doc)`: el EN no repite la evidencia, la copia por posición del ES y lanza si hay otra cantidad de secciones, bloques o elementos de lista. Es la mitigación de T-56-36 por construcción.
- Barrera del tracer: con `HUMAN_VERIFY_MODE=end-of-phase` y verificación solo automatizada, se volvió a correr de punta a punta (autoprueba, guardia, gate, tsc) antes de expandir.

**Task 2: terms en inglés y decisiones.**
- `TERMS_EN` con las 9 secciones del ES. El enlace a privacidad apunta a `https://juan-tech.com/en/privacy`. La ley aplicable sale de `LEGAL_FACTS.GOVERNING_LAW.valueEn`.
- `DECISIONS` pasa de 6 a 10: `LEGAL-PRIVACY-ES`, `LEGAL-PRIVACY-EN`, `LEGAL-TERMS-ES`, `LEGAL-TERMS-EN` (status `propuesto`, gate `aprobado`, preview con el texto completo) y los seis `LEGAL-FACT-*` ahora con es y en, y alternativas razonables (región: Alemania, Finlandia, Estados Unidos; plazos: 6, 12, 24 meses).
- `sectionsToPlain` genera la vista previa legible (h2, párrafos, viñetas, enlaces como `texto (url)`).

**Task 3 (checkpoint:decision): resuelto por la vía "defaults".** El orquestador pidió no tratar los hechos legales como bloqueo. Nada pasó a `aprobado`, no hay fecha de aprobación registrada y el gate de la fase 57 los marca como no aprobados hasta que Juan responda.

## Verificación

- `tsx scripts/verify/56-legal-copy-selftest.ts`: 71 PASS, 0 FAIL, salida 0. Cubre: paridad de secciones, bloques, enlaces, evidencia y proveedores entre ES y EN para privacy y terms; hechos en los dos idiomas o en ninguno; encabezados sin punto, coma ni número; el EN sin tildes, eñes ni signos de apertura; sin hosting anterior, analítica anterior, Cloudflare Insights, rayas, marcadores ni fecha efectiva; cambio de un hecho cambia el texto EN (región, buzón, plazos, ley); `mentionDataLaw=no` quita la ley de datos; `withEvidenceFrom` lanza ante otra estructura; fixtures defectuosos rechazados; extractHeadings acepta los cuatro estados Lexical; las cuatro decisiones de documento y las seis de hechos son válidas con gate aprobado.
- `tsx scripts/verify/56-review-export.ts --only LEGAL`: lista 10 decisiones con el texto completo de cada documento.
- `tsx scripts/verify/56-gate.ts`: sale 0. Lista las cuatro decisiones de documento y las seis de hechos como `propuesto` con gate `aprobado`.
- `node scripts/verify/56-content-guard.mjs --data` y `--selftest`: PASS.
- `npx tsc --noEmit`: sin errores.
- `node scripts/verify/56-run-all.mjs --selftests`: PASS, salida 0 (corrió con los cambios de los otros planes en paralelo ya presentes en el checkout).
- Humanizer: el EN se redactó contra la muestra de voz de Juan y las reglas de voz (sin rayas, sin cierres genéricos, ritmo mixto, primera persona, sin vocabulario de plantilla corporativa). No hay emojis.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Evidencia compartida por construcción, no copiada a mano**
- **Found during:** Task 1.
- **Issue:** el plan pide "cada afirmación con su comentario de evidencia (el mismo del ES)". Duplicar 40 cadenas a mano deja que ES y EN diverjan sin que nadie lo note (T-56-36, severidad alta).
- **Fix:** `withEvidenceFrom` toma la evidencia del ES por posición y lanza si la estructura difiere. La autoprueba comprueba además que la evidencia coincide.
- **Files modified:** `scripts/db/data/56-legal-copy.ts`, `scripts/verify/56-legal-copy-selftest.ts`
- **Commit:** 5f7bbda

**2. [Rule 2 - Missing critical] Hechos con valor por idioma**
- **Found during:** Task 1. `LEGAL_FACTS` guardaba "12 meses", "Perú" y "30 días" solo en español; reutilizarlos en el EN habría metido español en el texto inglés.
- **Fix:** `valueEn` y `detailsEn` por hecho, con una comprobación de que cada hecho está lleno o vacío en los dos idiomas a la vez. Cambiar un hecho sigue siendo una línea por idioma, en el mismo bloque de `LEGAL_FACTS`.
- **Commit:** 5f7bbda

### Notas de proceso

- El plan 56-05 dejó `DECISIONS.length === 6` en su autoprueba. Se actualizó a 10 (4 documentos y 6 hechos), tal como pide este plan.
- `commits: 8` en el frontmatter es el conteo medido de `git rev-list` desde `plan_head_before`. Solo dos son de este plan (5f7bbda y 69625d2). Los otros seis son de 56-08, 56-09 y 56-10, que corrieron en paralelo en el mismo checkout. `actuals.commits: 2` es el conteo propio.
- El checkpoint de la Task 3 no devolvió control a Juan por instrucción del orquestador.
- Las alternativas de región no se verificaron: `whois 116.203.79.125` solo devuelve el bloque genérico de RIPE, sin país del centro de datos. La región se queda vacía y el texto usa la fórmula general hasta que Juan la confirme en el panel de Hetzner.

## Auth gates

Ninguno. El plan no abre la base, no usa `.env` ni hace push.

## Known Stubs

Ninguno. La región vacía y el buzón sin nombrar son intencionales: el texto usa una fórmula general hasta que Juan los confirme (T-56-37).

## Threat Flags

Ninguno. No se agregan endpoints, rutas de autenticación ni acceso a archivos fuera del repo.

## Items para Juan (decisiones propuestas, no bloquean el trabajo)

Todas viven como `LEGAL-FACT-*` con gate `aprobado`. Se leen con `node_modules/.bin/tsx scripts/verify/56-review-export.ts --only LEGAL`. Respuesta en una línea, según el plan: `region=...`, `buzon=...`, `retencion-contacto=...`, `retencion-suscriptores=...`, `cookies=confirmado|cambia(texto)`, `ley=peru|otra(texto)`, `ley-datos=mencionar|omitir`, `texto=aprobado|cambios(documento: texto)`.

1. **Región del servidor Hetzner.** Propuesta: vacía hasta que confirmes (Alemania, Finlandia o EE. UU. según el centro de datos). Con el valor vacío el texto no nombra país.
2. **Proveedor del buzón `hello@juan-tech.com`.** Propuesta: sin nombrar ("un proveedor de correo").
3. **Retención del correo de contacto: 12 meses.** El texto vivo decía 12. No existe borrado automático: el plazo se cumple a mano.
4. **Retención de suscriptores tras la baja: 12 meses.** Misma observación.
5. **Registros del servidor: 30 días.** No se verificó en el VPS. Si no hay registros de acceso, quitar la viñeta de qué recojo y la de cuánto guardo.
6. **Banner de cookies: no hace falta** porque NEXT_LOCALE es funcional. Es una conclusión mía, no de un abogado.
7. **Ley aplicable: Perú, y mencionar la Ley 29733** como supuesto por validar (`mentionDataLaw`).
8. **Aprobación explícita de los cuatro documentos** (privacy y terms, ES y EN). Hasta que respondas, el gate de la fase 57 los marca como no aprobados.
9. **Revisión legal profesional opcional tras el corte** (D-10): va en el handoff de 56-14.

La siembra al global `legal-pages` es de 56-12 y la fecha efectiva del día del corte la fija 56-14 (D-09: ningún texto trae fecha).

## Self-Check: PASSED

Archivos presentes: `scripts/db/data/56-legal-copy.ts`, `scripts/verify/56-legal-copy-selftest.ts`. Commits 5f7bbda y 69625d2 presentes en la rama feat/mui-redesign. `PRIVACY_EN`, `TERMS_EN`, `buildPrivacyEn`, `buildTermsEn` y `DECISIONS` exportados y verificados por la autoprueba.
