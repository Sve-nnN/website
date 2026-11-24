---
phase: 56-contenido-pendiente-de-juan
plan: 10
subsystem: content-data
tags: [cta, inventory, live-verifier, messages, d-15, d-02, tracer]
requires:
  - phase: 56-contenido-pendiente-de-juan
    provides: CTA_LOTE1 y 56-juan-inputs.json (56-02), cargados con la tabla de 13 filas por 56-09 (commit 834196d); gate, content-guard y review-export (56-01)
provides:
  - CTA_MAP con 24 filas (origen, archivo, clave, lo lee master, loadAt, rutas ES y EN, texto aprobado) y 8 decisiones CTA-MAP-<id> para las filas sin texto
  - 56-cta-map.json generado desde CTA_MAP, que lee el verificador vivo
  - 56-cta-live.mjs con --selftest, --export, --messages, --only y --cut
affects: [56-12, 56-14, 57]
tech-stack:
  added: []
  patterns:
    - "El verificador vivo lee el texto VISIBLE (sin script ni style): los mensajes de next-intl viajan en el payload RSC de todas las paginas y un grep crudo da falsos positivos"
    - "Filas que lee master solo se exigen con --cut (56-14); lo demas se exige despues de la siembra de 56-12"
key-files:
  created:
    - scripts/db/data/56-cta-map.ts
    - scripts/db/data/56-cta-map.json
    - scripts/verify/56-cta-live.mjs
  modified: []
key-decisions:
  - "messages/es.json y messages/en.json NO cambian: las 13 claves de messages que sostienen filas aprobadas ya tienen exactamente el texto del lote 1, y las de filas pendientes conservan el vigente (lo prueba --messages)"
  - "No se tocan common.seeService ni services.index.viewService aunque las tarjetas visibles digan 'Ver servicio' y lo aprobado en la fila 8 sea 'Explorar servicio': cambiarlas rompe 54-home-ssr (cuenta 'Ver servicio' tres veces) y la fila 8 apunta a una clave que ya dice lo aprobado. Queda como pregunta para Juan"
  - "Las filas header-cta y auditor-cta quedan loadAt corte (las lee master) aunque su respaldo en messages ya dice lo aprobado"
  - "Landings de servicio quedan corte sin decision; Lima y Madrid quedan excluido (D-fuera de alcance)"
requirements-completed: []
duration: 35min
completed: 2026-11-10
status: complete
commits: 1
plan_head_before: 1ed58f559a954acf800152969bd9baa456f3830d
actuals:
  tokens: 10900
  tasks: 2
  commits: 1
---

# Phase 56 Plan 10: Inventario de CTAs y verificador vivo Summary

Inventario de 24 CTAs con origen y momento de carga, y un verificador que comprueba contra el HTML servido que cada texto aprobado aparece en su idioma y que la frase retirada del cierre no aparece en ninguna ruta. Los CTAs de messages ya coincidían con el lote 1, así que no cambió ninguna clave. Cero escrituras a la base.

## Qué quedó hecho

**Task 1 (tracer): inventario y verificador de punta a punta.** Commit f7c0f20.
- `56-cta-map.ts`: `CTA_MAP` une metadatos propios (origen, archivo, clave, `messageKeys`, `master`, `loadAt`, rutas ES y EN) con el texto de `CTA_LOTE1` por id. No hay texto nuevo en el plan. `validateCtaMap` exige: toda fila del lote 1 con metadatos, origen y clave presentes, lo que lee master nunca con `loadAt` ahora (T-56-33), `excluido` solo para Lima y Madrid, y el cierre exacto de D-15. `DECISIONS` emite `CTA-MAP-<id>` solo para las 8 filas pendientes.
- `56-cta-map.json`: generado con `node scripts/verify/56-cta-live.mjs --export` (importa el TS con tsx). La autoprueba falla si el JSON no está al día.
- `56-cta-live.mjs`: descarga cada ruta, saca el texto visible, exige el texto aprobado en el idioma correcto (también el `lang` del `<html>`) y la ausencia de "empiezo por mirar qué ve Google hoy" en 14 rutas. `{tool}` se lee como un nombre de herramienta que no sea "el auditor". Sin `BASE_URL` falla con mensaje claro.
- Barrera del tracer: `AUTO_CFG` no se activó; la verificación automatizada corrió de punta a punta y pasó antes de la Task 2.

**Task 2: messages. Sin cambios, y es el resultado esperado.** Cada clave de messages con texto aprobado ya dice exactamente lo aprobado, así que `git diff --stat -- messages` queda vacío. Se añadió el modo `--messages` (mismo commit) que lo prueba: aprobadas igual al lote 1 en es y en, pendientes iguales al vigente.

| Clave de messages | Fila | ES / EN (ya vigente) |
|---|---|---|
| `shell.ctaFallback` | 1 (respaldo del encabezado) | Pedir auditoría 360 / Request a 360 audit |
| `services.index.talkCta` | 7 | Hablar con Juan / Talk to Juan |
| `servicesShowcase.cta` | 8 | Explorar servicio / Explore service |
| `auditorHighlight.cta` | 9 | Probar el auditor / Try the auditor |
| `auditorCallout.cta` y `stackPage.auditorCta` | 10 | Ir al auditor / Go to the auditor |
| `stackPage.ctaDefault` | 11 | Probar {tool} / Try {tool} |
| `stackPage.ctaAmazon` | 12 | Ver en Amazon / View on Amazon |
| `contact.cta.responseNote` | 13 | Suelo responder en menos de 48 horas. / I usually reply within 48 hours. |

Siguen pendientes y sin cambio: `contact.writeEmail`, `contact.form.submit`, `emailCapture.submitLabel`, `blog.newsletter.submitLabel`.

## Dónde vive cada CTA

| Dónde vive | Filas | Momento |
|---|---|---|
| Global sombra `home-page` (lo siembra 56-12 desde 56-home-copy.ts) | hero-cta, services-cta, cierre-titulo, cierre-lead, cases-cta, sites-cta, contact-response-note (infoRows), contact-step-1 a 3 | ahora (aprobadas, salvo los pasos de contacto, pendientes) |
| `messages` (código de la rama) | services-index-talk, service-card-cta, auditor-notice-cta, stack-tool-link, stack-amazon, contact-write-email, contact-submit, emailcapture-submit, newsletter-submit | ahora, ya alineadas |
| Lo que lee master | header-cta (global header, campo `ctaButton`, hoy "Hablemos"), auditor-cta (bloque), audit-offer-cta (bloque), landings de servicio | corte, 56-14 (D-02) |
| Lima y Madrid | landings-lima-madrid | excluido |

## Verificación

- `node scripts/verify/56-cta-live.mjs --selftest`: PASS (25 casos, incluye rechazar el HTML con la frase retirada, el texto que solo vive en un `<script>` y el lead viejo).
- `node scripts/verify/56-cta-live.mjs --messages`: PASS (13 claves).
- `56-content-guard.mjs --data` y `--messages`: PASS. `56-gate.ts`: sale 0, con las 8 decisiones `CTA-MAP-*` como pendientes. `56-review-export.ts --only CTA-MAP` las lista con archivo, clave y carga. `npx tsc --noEmit`: 0. Paridad 54 y 55, sin rayas, `56-home-inputs-selftest` y `56-run-all --selftests` (lógica de SKIP): PASS.
- Lectura de solo HTTP contra dev, antes de la siembra (informativo, no es el modo vivo oficial): FAIL esperado. Sobre las rutas ES de hoy ya pasan `/contact`, `/stack` y `/en/stack`; fallan la frase retirada (sigue en varias rutas, incluidas las EN) y los textos EN del global sombra (`/en` sigue en español). Eso lo cierra la siembra de 56-12; el modo vivo se corre allí con `BASE_URL`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Tres orígenes del JSON de 56-02 apuntaban a un espacio de nombres sin CTAs**
- **Found during:** Task 1
- **Issue:** `56-juan-inputs.json` (cargado por 56-09) ponía `serviceScopeCard.auditorCta`, `serviceScopeCard.ctaDefault` y `serviceScopeCard.ctaAmazon`. En messages, `serviceScopeCard` solo trae título y etiquetas; las claves reales son `auditorCallout.cta` y `stackPage.auditorCta`, `stackPage.ctaDefault` y `stackPage.ctaAmazon`.
- **Fix:** `CTA_MAP` lleva el origen y las claves correctas, sin editar el JSON (archivo de 56-09). El texto aprobado no cambia.
- **Commit:** f7c0f20

**2. [Rule 2 - Missing critical] Verificador sobre el texto visible, no sobre el HTML crudo**
- **Found during:** Task 1
- **Issue:** un grep crudo sobre dev da coincidencias en todas las páginas porque next-intl serializa todos los mensajes en el payload RSC (el "Explorar servicio" aparecía en cada ruta sin pintarse en ninguna).
- **Fix:** `visibleText` descarta script y style y decodifica entidades (`Let&#x27;s`).
- **Commit:** f7c0f20

**3. Archivos añadidos fuera de `files_modified`:** `scripts/db/data/56-cta-map.json` (lo permite la acción de la Task 1). `messages/*.json` no se modificó: Task 2 terminó sin cambios.

## Items para Juan

1. **Fila 8, "Tarjeta de cada servicio: Explorar servicio / Explore service".** La clave que ya dice eso (`servicesShowcase.cta`) no se pinta en ninguna ruta de dev. Las tarjetas que ve el visitante (home y `/servicios`) dicen "Ver servicio" / "View service" desde `common.seeService` y `services.index.viewService`, y el sandbox también decía "Ver servicio". Si quieres "Explorar servicio" en las tarjetas visibles, son dos claves y un ajuste en `54-home-ssr.ts`, que cuenta "Ver servicio". Decide tú; no lo cambié.
2. **Header:** la fila 1 aprueba "Pedir auditoría 360" también para el botón del encabezado. Hoy el global `header.ctaButton` de master dice "Hablemos" y se cambia en el corte (56-14). Confirma que ese es el efecto que querías.
3. **Siguen sin texto aprobado:** pasos de Contacto (3 filas, lote 2), `audit-offer-cta` ("Pedir la auditoría"), "Escribir un correo", "Enviar mensaje", "Enviarme el checklist" y "Suscribirme". Conservan el texto vigente y bloquean el gate del corte hasta que respondas.

## Known Stubs

Ninguno. Las filas pendientes conservan su texto vigente real, no un marcador.

## Threat Flags

Ninguno. Solo GET de lectura y archivos de datos; sin endpoints nuevos ni cambios de href (T-56-35 aceptado).

## Notes for later plans

- **56-12:** tras sembrar y desplegar, correr `BASE_URL=<dev> node scripts/verify/56-cta-live.mjs`. Si cambia `CTA_LOTE1` o `CTA_MAP`, regenerar con `node scripts/verify/56-cta-live.mjs --export` (la autoprueba lo exige).
- **56-14:** correr con `--cut` para exigir también `header-cta` y `auditor-cta`.
- `plan_head_before` es el HEAD al arrancar; otros planes (56-08, 56-09, 56-05) comitearon en paralelo en el mismo checkout, pero el conteo medido desde ese punto es 1: el commit f7c0f20 es el único de 56-10.

## Self-Check: PASSED

- FOUND: scripts/db/data/56-cta-map.ts, scripts/db/data/56-cta-map.json, scripts/verify/56-cta-live.mjs
- FOUND: commit f7c0f20
