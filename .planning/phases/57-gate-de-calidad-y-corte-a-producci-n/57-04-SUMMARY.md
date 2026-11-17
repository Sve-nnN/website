---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 04
subsystem: frontend-mui
status: complete
tags: [deferred-cleanup, contact-form, i18n, services-index, a11y]
requires: [57-01]
provides:
  - CopyEmailButton como unica implementacion de copiar correo (IN-01)
  - borrador del formulario de contacto que sobrevive a ?sent=false (IN-02)
  - keys estables en StackView (IN-03)
  - cadenas de servicios y CodeFixes en messages (IN-04)
  - columna "Te sirve si" desde la primera oracion del porque (extra aprobado por Juan)
affects: [57-07, 57-11]
tech-stack:
  added: []
  patterns:
    - borrador en sessionStorage solo en el cliente, sin tocar el contrato de la accion del servidor
    - formateadores inyectados (joinRole) para que los mapeadores puros no lleven cadenas fijas
key-files:
  created:
    - scripts/verify/57-contact-draft.ts
  modified:
    - src/components/pages/contact/CopyEmailButton.tsx
    - src/components/mui/CtaPanel.tsx
    - src/components/mui/ContactForm.tsx
    - src/components/pages/StackView.tsx
    - src/lib/stack-data.ts
    - src/lib/service-view-data.ts
    - src/components/home/CodeFixes.tsx
    - src/lib/sitemap-data.ts
    - src/lib/services-index-data.ts
    - messages/es.json
    - messages/en.json
    - scripts/verify/54-contact-form.mjs
    - scripts/verify/54-service-ssr.ts
    - scripts/verify/54-home-b-ssr.ts
    - scripts/verify/54-index-ssr.ts
decisions:
  - "IN-02 sin tocar la accion: ContactForm guarda lo escrito en sessionStorage antes de enviar y lo devuelve con ?sent=false; useActionState habria cambiado el contrato del servidor, que el plan prohibe"
  - "IN-04 conserva el separador ' · ' de servicios en ES y EN (testimonialsCarousel.roleCompany) en vez de reutilizar roleAt: el plan exige que el HTML en espanol no cambie; unificar con la home queda como decision de copy"
  - "El sitemap no suma CACHE_TAGS.websites() ni authors(): SEO-02 exige igualdad con master; solo cambia el comentario"
  - "Te sirve si = primera oracion del primer parrafo del bloque del porque, con el H2 como respaldo si el bloque no trae parrafo"
metrics:
  duration: 47m
  completed: 2026-11-17
actuals:
  tokens: 11800
  tasks: 3
  commits: 3
plan_head_before: b31a6bc9be2faa553b2f3968be453dca7bf0ee9f
plan_head_after: 67a86c2f3c66fabd47dec23a3ca02545f3b36b35
---

# Phase 57 Plan 04: sobras diferidas de las fases 54 y 55 Summary

Copiar correo con una sola implementacion, el formulario que ya no pierde el mensaje cuando el envio falla, keys estables en /stack, las cadenas sueltas movidas a messages y la columna "Te sirve si" del indice de servicios mostrando una oracion real en vez del H2. El HTML SSR de contacto, CtaPanel, servicios y home no cambio.

## Estado de cada item de D-05

| Item | Estado | Detalle |
|---|---|---|
| IN-01 copiar correo duplicado | Aplicado | `CopyEmailButton` acepta `variant`, `sx` e `icon`; `CtaPanel` lo usa y perdio su propio portapapeles. El HTML SSR de CtaPanel, CopyEmailButton y ContactForm (16 variantes, ES y EN) salio identico byte a byte antes y despues |
| IN-02 el formulario pierde el mensaje | Aplicado | Borrador en `sessionStorage` (clave `jt-contact-draft`): se guarda en el envio valido, vuelve a los tres campos con `?sent=false` (la etiqueta MUI queda arriba) y se borra; con `?sent=true` se descarta. Nunca va a la URL ni a la consola (T-57-13). El error sigue en `role="alert"` con foco |
| IN-03 key de StackView | Aplicado | `StackTool` y `StackGearItem` llevan `id` de la fila de Payload (respaldo `indice-nombre`) y la vista lo usa como key |
| IN-04 cadenas fijas | Aplicado | `testimonialsCarousel.roleCompany` ("{role} · {company}") y `home.codeFixes.commitFallback` ("commit") en ES y EN |
| Claves sin uso `websites.detail.screenshotsTitle` y `externalNotice` | Aplicado | Fuera de ES y EN; grep en src y scripts sin usos |
| Comentario de `sitemap-data.ts` | Aplicado | Solo lineas de comentario (`git diff -U0` revisado): ahora dice que Authors y Websites tienen hooks y que el sitemap no los suma por SEO-02 |
| Supuesto A7 | Confirmado | Ver abajo |
| Gate de revalidacion admin a preview (T-55-15) | Pasado a otro plan | Es una compuerta humana del gate de Juan (57-11), no limpieza de codigo |
| Retiro de componentes viejos y verificadores de la fase 48 | Pasado a otro plan | Corresponde al retiro de Tailwind y codigo muerto (57-07) |
| Archivos `_tmp-*-b0303.ts` sin versionar | Descartado, ya resuelto | No existen ni en el worktree ni en la copia principal de Juan (`scripts/_tmp*` vacio) |
| Columna "Te sirve si" (extra aprobado por Juan el 2026-11-17) | Aplicado | Ver abajo |

## Supuesto A7

Comprobado por HTTP de solo lectura contra https://dev.juan-tech.com, sin tocar ninguna base:

- `/` responde 200 con h1 "Consultor SEO tecnico que tambien programa" y las 13 secciones de la home (inicio, clientes, medicion, codigo, servicios, casos, auditor, proceso, sitios, sobre, testimonios, oferta, faq). Ese h1 no existe en `src` ni en `messages`; el respaldo seria "Inicio", el titulo del doc `home` de pages. `/en` da "Technical SEO consultant who also codes".
- `/sobre-mi` responde 200 con h2 "Donde se cruzan el codigo y el SEO" y las secciones de areas, experiencia, educacion y charlas. Ese texto solo existe en la siembra (`scripts/db/data/56-about-copy.ts`), no en el codigo. `/en/sobre-mi` da "Where code and SEO meet".

Conclusion: el rol de lectura del preview lee `home_page*` y `about_page*`. A7 es verdadero.

## Columna "Te sirve si"

`buildCompareRows` usa `fitsIfOf`: primera oracion del primer parrafo de la primera columna del primer `content` (el bloque del porque). Si no hay parrafo cae al H2, que era la fuente anterior. `firstSentence` corta en `.`, `!`, `?` o `…` seguido de espacio y mayuscula, asi que no rompe dominios ni decimales. Las filas solo alimentan la tabla: title, meta y JSON-LD no cambian.

Valores que salen hoy de produccion:

- ES: "Los errores tecnicos silenciosos no se ven al navegar el sitio: ...", "Un informe de auditoria envejece en cuanto el sitio cambia.", "Un sitio armado sobre un builder generico ...", "Escribir mas contenido no lo arregla."
- EN: las mismas oraciones en ingles desde el doc localizado.

Ojo de copy para Juan: dos celdas quedan largas (auditoria y desarrollo) y "Escribir mas contenido no lo arregla." se lee raro bajo "Te sirve si" sin el H2 al lado. El codigo hace lo pedido; si quiere otra frase, se cambia el primer parrafo en el admin.

## Verificacion

- `npx tsc --noEmit`: 0
- `54-contact-ssr`: PASS; `54-contact-form --selftest`: 45 PASS (incluye los chequeos de codigo nuevos de IN-01 e IN-02 y sus versiones rotas)
- `57-contact-draft.ts` (nuevo, happy-dom, sin red ni envio): 21 PASS
- Paridades `53`, `54` y `55-messages-parity` y `56-content-guard --messages`: PASS
- `54-service-ssr`, `54-home-b-ssr` (chip sin sha en ES y EN), `54-stack-ssr`: PASS
- `54-index-ssr`: PASS, con chequeos nuevos: la celda no repite el H2, es la primera oracion real y es una sola oracion, mas casos sinteticos de respaldo
- `56-run-all --selftests --strict`: 79 pasos en PASS, salida 0

Ningun paso envio el formulario real ni llamo a la accion del servidor (D-08). No hubo push, ni escrituras a base, ni cambios en master.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Worktree creado sobre master y no sobre feat/mui-redesign**
- **Found during:** arranque
- **Issue:** el worktree apuntaba a `6e9b02a` (master); la fase 57 no existia ahi.
- **Fix:** `git reset --hard feat/mui-redesign` al arrancar, con el arbol limpio (HEAD era ancestro de la rama).
- **Commit:** ninguno

**2. [Rule 2 - Missing] IN-03 necesitaba un id en los datos**
- **Issue:** `StackTool` y `StackGearItem` no traian identificador, y el plan pide key estable en vez del indice cuando existe uno.
- **Fix:** `stack-data.ts` (fuera de la lista de archivos del plan) agrega `id` desde la fila de Payload.
- **Commit:** 1bce3cd

**3. [Entorno] `54-seed-selftest` falla en un worktree sin `designs/design-system-mui`**
- **Issue:** esa carpeta del sandbox no esta versionada y no existe en el worktree; el selftest exige los archivos de origen en disco.
- **Fix:** para la corrida se enlazo la carpeta de la copia principal y se quito despues. Con ella, `56-run-all --selftests --strict` sale 0. No es un defecto del plan.

**4. Alcance extra aprobado por Juan:** la columna "Te sirve si" (commit 67a86c2), pedido por el orquestador con la aprobacion de Juan del 2026-11-17.

## Commits

| Tarea | Commit | Descripcion |
|---|---|---|
| 1 | 1bce3cd | IN-01, IN-02 e IN-03 con 57-contact-draft y chequeos en 54-contact-form |
| 2 | 9485946 | IN-04, claves sin uso y comentario del sitemap |
| extra | 67a86c2 | "Te sirve si" desde la primera oracion del porque |
| 3 | sin commit | A7 y regresion: sin cambios de codigo |

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-57-12: solo pruebas estaticas, de render y de cliente sin envio. T-57-13: el borrador vive en `sessionStorage` de la pestana y se borra al usarlo. T-57-14: `sitemap-data.ts` cambio solo comentarios.

## Self-Check: PASSED

- FOUND: scripts/verify/57-contact-draft.ts, src/lib/services-index-data.ts, src/components/pages/contact/CopyEmailButton.tsx
- FOUND: 1bce3cd, 9485946, 67a86c2 (ancestros de HEAD)
