---
phase: 55-casos-websites-blog-y-autores
plan: 07
subsystem: ui
tags: [richtext, lexical, mui, a11y, scroll-region, faq, affiliate, email-capture, post-card, ssr-test]
requires:
  - phase: 55-casos-websites-blog-y-autores
    provides: MuiRichText con ctx y headingIds, arnés SSR 55, nota de filename en populate de media (plan 55-05 y 55-01)
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: FaqAccordion, links.ts (linkFor), RichTextLink, format-date, tema MUI
provides:
  - ScrollRegion, región desplazable que solo es enfocable cuando el contenido desborda
  - muiBlockConverters(ctx) con code-block, table, faq, affiliate-inline y email-capture en MUI
  - MuiRichText con prop overrides y convertidores de bloque MUI por defecto cuando recibe ctx
  - CopyCodeButton, botón Copiar real con región role status
  - PostCard compartida para índice, categoría, relacionados y perfil de autor
  - namespace richText en ES y EN y 55-richtext-blocks-ssr.ts (51 comprobaciones)
affects: [55-10 (post con TOC y cuerpo partido), 55-09 (tabla comparativa de casos usa ScrollRegion), 55-11 (divulgación antes del cuerpo), 55-12 (perfil de autor usa PostCard)]
tech-stack:
  added: []
  patterns:
    - "Los convertidores de bloque del servidor reciben traductores por namespace dentro de ctx (se resuelven con hooks en MuiRichText), así los bloques son síncronos y se prueban sin stub de next-intl/server"
    - "El CTA de afiliado sale como AffiliateLink dentro de un Box que le da el estilo de botón, porque pasar AffiliateLink como component de un Button de MUI cruzaría la frontera RSC con una función"
    - "La FAQ recibe sus respuestas ya renderizadas como ReactNode y su prefijo de ids sale del id del bloque, único aunque el cuerpo se parta en dos mitades"
key-files:
  created:
    - src/components/mui/ScrollRegion.tsx
    - src/components/mui/rich-text/blocks.tsx
    - src/components/mui/rich-text/CopyCodeButton.tsx
    - src/components/mui/PostCard.tsx
    - scripts/verify/55-richtext-blocks-ssr.ts
  modified:
    - src/components/mui/rich-text/MuiRichText.tsx
    - messages/es.json
    - messages/en.json
    - scripts/verify/55-richtext-ssr.ts
key-decisions:
  - "El email-capture MUI es síncrono y recibe las etiquetas por ctx, en vez del Server Component asíncrono EmailCaptureCard. Misma acción, mismos cuatro campos y mismo namespace emailCapture"
  - "Las tablas no llevan caption: Payload no guarda título de tabla y no se inventa texto. La etiqueta de región de ScrollRegion no repite texto visible"
  - "El color de fondo por celda que traía el editor no se aplica a las tablas MUI: sobre el tema oscuro podía romper el contraste"
  - "El nombre accesible del botón Copiar es Copiar más una palabra oculta (código), que contiene el texto visible (SC 2.5.3)"
requirements-completed: []
duration: 55min
completed: 2026-11-10
status: complete
commits: 5
plan_head_before: 6b7196bc631622da2d6beca17b54c4cf36ec612f
actuals:
  tokens: 10500
  tasks: 3
  commits: 3
---

# Phase 55 Plan 07: Bloques del cuerpo en MUI, ScrollRegion y PostCard Summary

Los cinco tipos de bloque del corpus de los 58 posts (code-block, table, faq, affiliate-inline y email-capture) se re-visten con MUI sobre MuiRichText, con ScrollRegion que solo se vuelve enfocable cuando desborda y con PostCard lista para el blog y los autores.

## Qué quedó hecho

- **Tarea 1 (tracer), commit dc3dc26:** `ScrollRegion` mide `scrollWidth` contra `clientWidth` con `ResizeObserver` (observa el contenedor y su primer hijo) y solo entonces agrega `tabIndex 0`, `role="region"` y el `aria-label` que recibe por prop. `blocks.tsx` arranca con `code-block`: contenedor oscuro con el lenguaje como rótulo, `pre` dentro de ScrollRegion con la tipografía mono (14/24) y `CopyCodeButton` (button real, íconos Copy y Check, `role="status"` siempre presente que anuncia copiado o fallo). `MuiRichText` acepta `overrides` y, con `ctx`, usa `muiBlockConverters` como valor por defecto; sin `ctx` Privacy y Terms no cambian. Namespace `richText` en ES y EN.
- **Tarea 2, commit 234d9ca:** `table` (MUI Table con `thead` y `scope="col"` o `"row"`, respeta `headerState` si alguna celda lo declara, dentro de ScrollRegion), `faq` (FaqAccordion con todas las respuestas en el HTML, título en h2 con rol h4 y preguntas en h3, `idPrefix` desde el id del bloque), `affiliate-inline` (tres estados de `resolveAffiliateCta`, `rel` fijado por `AffiliateLink`, sin divulgación) y `email-capture` (form hacia `subscribeToLeadMagnetAction` con `postPath`, `locale`, `email` y honeypot `company_website`, estados `?subscribed=`).
- **Tarea 3, commit 025dc78:** `PostCard` cliente con `linkFor` propio, imagen opcional con `width`, `height` y `alt` de Payload, categoría, `h{headingLevel}` con enlace estirado, resumen, `<time dateTime>` y rótulo "Leer el artículo" decorativo. Sin tiempo de lectura. Clave `richText.readPost`.

## Resultados de verificación

| Comprobación | Resultado |
|---|---|
| `npx tsc --noEmit` | PASS tras cada tarea |
| `55-richtext-blocks-ssr.ts` | PASS, 51 comprobaciones, incluidos 8 fixtures defectuosos que fallan |
| `55-richtext-ssr.ts` (motor de 55-05) | PASS (una comprobación actualizada, ver desviaciones) |
| `53-write-gates.mjs` | OK |
| `54-rsc-boundary.mjs` | PASS |
| `55-messages-parity.mjs` | PASS (richText en ES y EN, sin guiones largos ni cortos) |
| `55-no-sandbox-data.mjs` | PASS (345 archivos) |
| `54-legal-ssr`, `54-richtext-toc`, `54-primitives-ssr` | PASS (Privacy y Terms sin cambios) |
| Criterios por grep (ResizeObserver, sin `tabIndex={0}` en blocks, AffiliateLink, company_website, sin RichTextRenderer ni AffiliateDisclosure, linkFor y use client en PostCard, sin sandbox ni `@/data/`) | PASS |

Lo que cubre `55-richtext-blocks-ssr.ts`: code-block con pre, botón Copiar, role status y ningún tabindex fuera del botón de MUI (que lleva el suyo), texto de código escapado, ES y EN, y sin código no pinta nada. Tabla con encabezado inferido, con `headerState` declarado y sin etiqueta de región en el HTML del servidor. FAQ con dos bloques sin ids repetidos y jerarquía h2 y h3. Afiliado activo con `rel="sponsored nofollow noopener"` exacto, pendiente sin enlace, GSC sin enlace ni insignia y documento sin poblar sin nada. Captura con los cuatro campos, estados `pending`, `already` y `error` y un valor desconocido sin interpolar. PostCard con href, `time`, nivel de encabezado, EN con prefijo `/en`, sin imagen y con imagen. Auditoría estática de `blocks.tsx`: sin importaciones del ciclo prohibido, sin `dangerouslySetInnerHTML` y sin `tabIndex={0}`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Comprobación de 55-05 contradecía el cambio pedido por el plan**
- **Found during:** Tarea 2
- **Issue:** `55-richtext-ssr.ts` esperaba que con `ctx` el bloque email-capture llegara a un Server Component asíncrono (el render suspendía). El plan cablea un convertidor MUI síncrono, así que esa aserción pasaba a FAIL.
- **Fix:** la aserción ahora exige que con `ctx` el HTML traiga `name="email"` y `name="company_website"` y que Payload no registre otro "no converter". Es el cambio de comportamiento pedido, no una relajación.
- **Files modified:** scripts/verify/55-richtext-ssr.ts
- **Commit:** 234d9ca

### Decisiones dentro del margen del plan

- Archivo extra `src/components/mui/rich-text/CopyCodeButton.tsx` (cliente) que el plan no listaba: el portapapeles y el estado necesitan un componente cliente y `blocks.tsx` es de servidor.
- El `ctx` interno de los convertidores lleva traductores (`richText`, `common`, `emailCapture`, `stackPage`) que `MuiRichText` resuelve con hooks. Las etiquetas del bloque de email y del afiliado siguen saliendo de los namespaces `emailCapture` y `stackPage` existentes, por eso no hizo falta agregar claves de FAQ, afiliado ni email a `richText`.
- Conteo de commits: el checkout es compartido con el plan 55-08, así que `git rev-list plan_head_before..HEAD` da 5 e incluye commits de 55-08. Los commits propios son 3 (`git log --grep "(55-07)"`).

## Elementos para la revisión humana de Juan

1. **Navegador real:** el desborde de ScrollRegion y el botón Copiar solo se pueden probar en un navegador (el HTML del servidor sale sin `tabindex` ni `role` a propósito). Cuando 55-10 sirva un post con tablas y código, conviene mirar en el preview que una tabla ancha en móvil se enfoque con Tab y se desplace con flechas, y que una tabla angosta no sume una parada de tabulador.
2. **Etiquetas en inglés del namespace `richText`:** son literales y están pendientes de tu aprobación (`Copy`, `Copied`, `Code copied`, `The code could not be copied`, `Code with horizontal scrolling`, `Table with horizontal scrolling`, `Read the article`).
3. **Texto con guion largo ya existente:** el namespace `emailCapture` (oferta del checklist) trae guiones largos en ES y EN (`description`, `alreadyBody`, `errorBody`, `privacySuffix`). Ya estaban antes de este plan y la paridad de la fase 55 no revisa ese namespace; no los reescribí porque es copy de oferta. Si quieres, se limpian en la fase 56.
4. **Tablas:** no llevan caption porque Payload no guarda título de tabla, y el color de fondo por celda del editor ya no se aplica (riesgo de contraste sobre el tema oscuro). Dime si alguna tabla real depende de ese color.
5. **Divulgación de afiliados:** la tarjeta inline no la renderiza. Si 55-11 no la coloca antes del cuerpo, el post con afiliado inline quedaría sin divulgación.
6. **Estilo del botón de afiliado:** es un enlace `AffiliateLink` estilizado como botón por CSS del contenedor, no un `Button` de MUI, para no cruzar una función por la frontera RSC. Visualmente debería leerse igual; vale una mirada cuando exista un post con el bloque.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-55-23 (HTML inyectado) mitigado: todo el texto va como hijo de React y la prueba lo comprueba con un fixture de código con `<`, `&` y comillas. T-55-24 (rel de afiliado) mitigado y exigido por la prueba. T-55-25 (escritura desde el preview) mitigado: el formulario conserva la misma acción con su compuerta `PREVIEW_READONLY` y `53-write-gates` sigue en OK. T-55-26 aceptado: honeypot y limitación de ritmo sin cambios.

## Self-Check: PASSED

Archivos `ScrollRegion.tsx`, `blocks.tsx`, `CopyCodeButton.tsx`, `PostCard.tsx` y `55-richtext-blocks-ssr.ts` existen; commits dc3dc26, 234d9ca y 025dc78 verificados con `git log`. Sin push en este plan.
