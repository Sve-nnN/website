---
phase: 54-paginas-de-conversion-y-utilidad
plan: 12
subsystem: ui
tags: [mui, contact, stack, affiliates, ssr-selftest, a11y, playwright]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 05 (PageHero, Section, FaqAccordion, IconTile, lists, links, TranslationNotice), plan 06 (ContactForm) y plan 07 (namespaces contact, stack y stackPage de messages)
provides:
  - getContactData y assembleContactData, lector y mapeador de Contacto sobre el doc contact y el global home-page
  - ContactView y CopyEmailButton, vista MUI de Contacto con formulario real, Como empezamos y FAQ
  - La ruta de Contacto reescrita sobre ContactView con force-dynamic, generateMetadata y JSON-LD ContactPage intactos
  - buildStackViewData, mapeador puro del bloque toolStack
  - StackView y StackToolCard, vista MUI de Stack con logos opcionales, aviso role note y enlaces /go
  - AFFILIATE_REL, constante unica del rel de afiliado exportada desde AffiliateLink
  - 54-contact-ssr.ts y 54-stack-ssr.ts, autopruebas de render (51 y 49 comprobaciones)
  - 54-contact-form.mjs y 54-stack-affiliate.mjs, contratos para el preview con selftest

affects: [54-14, 54-16]

plan_head_before: 5ad99c4c323eb7f3af6a308629ef229fe80c110e
actuals:
  tokens: 25500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "El mapeador es una funcion pura exportada (assembleContactData, buildStackViewData) y el lector que toca el CMS es una funcion aparte que nunca propaga el error del global sombra"
    - "Un contrato HTTP exporta su funcion de chequeo y la autoprueba de render le pasa el HTML real de la vista (patron de 54-11)"
    - "Un contrato de navegador exporta collectSnapshot y los chequeos puros trabajan sobre el snapshot serializado, asi el selftest no abre navegador"

key-files:
  created:
    - src/lib/contact-data.ts
    - src/components/pages/ContactView.tsx
    - src/components/pages/contact/CopyEmailButton.tsx
    - src/lib/stack-data.ts
    - src/components/pages/StackView.tsx
    - src/components/pages/stack/StackToolCard.tsx
    - scripts/verify/54-contact-ssr.ts
    - scripts/verify/54-stack-ssr.ts
    - scripts/verify/54-contact-form.mjs
    - scripts/verify/54-stack-affiliate.mjs
  modified:
    - src/app/(frontend)/[locale]/contact/page.tsx
    - src/app/(frontend)/[locale]/stack/page.tsx
    - src/components/AffiliateLink.tsx

key-decisions:
  - "ContactData lleva schemaName (meta.title, luego titulo del doc, luego respaldo) para que el name del JSON-LD ContactPage siga siendo el mismo que antes del rediseno, distinto de crumbLabel y del h1"
  - "El correo del mensaje de fallo del formulario sale de contactInfo y, si el doc no lo trae, de process.env.CONTACT_TO_EMAIL (la ruta lo calcula y se lo pasa a la vista); nunca hay correo escrito en el codigo"
  - "El lead de Contacto sale del subtitle del bloque hero del doc y, sin hero, de contactFormBlock.description; ambos vienen del doc, ninguno se inventa"
  - "La etiqueta del chip de Donde lo use es el href para una url libre (como hacia produccion), porque Payload no trae etiqueta ni hay copy aprobado en EN para rotular /case-studies o los servicios"
  - "Las anclas de categoria van en un contenedor propio con scroll-margin-top de 96px y la Section conserva su propio id; asi no se modifico la Section compartida"
  - "Los enlaces a Search Console y al auditor llevan solo noopener (no son afiliado) y el sufijo de otra pestana; los /go y los de Amazon salen siempre con AFFILIATE_REL"
  - "--submit contra una base que no es el preview exige ALLOW_REAL_SEND=1 ademas del flag, porque enviaria un correo real"

patterns-established:
  - "Una pagina con global sombra en EN envuelve en lang es solo las secciones que salen del global, no el h1 ni el correo que salen del doc"

requirements-completed: []

duration: 55min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 12: Contacto y Stack MUI Summary

**Contacto usa el formulario real con su FAQ, Como empezamos y filas de informacion desde Payload; Stack muestra logos opcionales, el aviso role note antes de cualquier /go y todos los enlaces de afiliado con rel sponsored nofollow noopener desde una sola constante, sin tocar la accion de contacto, la ruta /go ni el SEO de ninguna de las dos paginas.**

## Accomplishments

- **Contacto (tracer):** `getContactData` lee el doc `contact` y `homePage` por las capas cacheadas; el error de `homePage` se registra con `console.error('[contact]')` y deja pasos, filas y FAQ en null, nunca un 500. `ContactView` compone PageHero, rejilla `0.8fr / 1.2fr` con el formulario primero en movil, tarjeta de correo (mono 16px, `user-select: all`, boton `mailto:` y `CopyEmailButton` con region `aria-live`), tres filas con `IconTile`, franja band de tres pasos con numeral `aria-hidden`, y FAQ con `FaqAccordion` mas el enlace "Mira los servicios". La ruta conserva `force-dynamic`, `generateMetadata` y el nodo `ContactPage` exactamente como estaban y solo cambia el cuerpo.
- **Stack:** `buildStackViewData` es puro (sin Payload): categorias con ancla por `slugify`, herramientas con `logoUrl` solo si hay Media poblado, cta con `resolveAffiliateCta`, referencia saneada con `sanitizeHref` (T-54-51) y los tres destacados. `StackView` pone el aviso `Alert` con `role="note"` y la navegacion de categorias dentro del hero. `StackToolCard` dibuja el tile de 56px solo con logo (sin logo no hay tile, letra ni icono), `alt=""`, pro y contra con icono y color solo en el encabezado, y el boton `/go/<slug>` con `target="_blank"`, `rel={AFFILIATE_REL}` y sufijo accesible. La ruta conserva `generateMetadata`, `revalidate = 60`, `generateStaticParams` y el JSON-LD de migas.
- **Contratos:** `54-stack-affiliate.mjs` (18 PASS en selftest: valido, valido en preview, rel en otro orden y 14 defectuosos) y `54-contact-form.mjs` (29 PASS en selftest sobre snapshots de DOM). El modo en vivo del formulario abre Chromium, espera a que React hidrate antes de pulsar y no envia nunca con datos validos sin `--submit`.

## Task Commits

1. **Task 1 (tracer): Contacto de punta a punta con formulario real, datos de Payload y FAQ** - `153bbf5` (feat)
2. **Task 2: Stack con logos, aviso de afiliados primero y enlaces /go con rel sponsored** - `0e4ae75` (feat)
3. **Task 3: scripts de contrato del formulario (navegador) y de afiliados de Stack** - `22fdec7` (feat)

La rama NO se empujo (regla de la fase: el empuje final lo hacen 54-14 o 54-16).

## Verificacion

- `node_modules/.bin/tsx scripts/verify/54-contact-ssr.ts`: 51 PASS, salida 0 (mapeo, h1 unico, tres campos con etiqueta asociada, `locale` y honeypot, tres tarjetas en `ol` con numerales `aria-hidden`, cinco respuestas de FAQ en el HTML con cuatro cerradas, `role="status"` sin formulario, `role="alert"` con el correo, sin datos ninguna seccion huerfana, EN con `lang="es"` y `role="note"`).
- `node_modules/.bin/tsx scripts/verify/54-stack-ssr.ts`: 49 PASS, salida 0, contra el doc real de `https://juan-tech.com/api/pages` (9 herramientas en 4 categorias, 13 piezas de equipo, 6 `/go/` activos). Incluye el contrato de `54-stack-affiliate.mjs` sobre el render real de la vista en es y en, y una verificacion por CSS de que "Medicion" (una herramienta) usa una columna y las otras tres dos desde md.
- `node scripts/verify/54-stack-affiliate.mjs --selftest`, `node scripts/verify/54-contact-form.mjs --selftest` y `node --check` de ambos: salida 0.
- `collectSnapshot` de `54-contact-form.mjs` se probo ademas en Chromium real sobre el HTML renderizado de la vista (es, en, `sent=true`, `sent=false`): cero fallos de `checkFormSnapshot` y `checkSentSnapshot`. Eso valido la deteccion de etiquetas, honeypot fuera de pantalla y regiones vivas, y destapo que el CSS de Emotion se colaba en el texto (corregido, ver abajo). La parte de validacion cliente (foco, `aria-invalid`) solo se puede probar con la pagina hidratada, asi que queda para el preview.
- `npx tsc --noEmit`: salida 0. `node scripts/verify/53-layer-check.mjs`: OK. `54-home-ssr.ts` y `54-conversion-ssr.ts` siguen en salida 0.
- Criterios de aceptacion de las tres tareas por `grep`: todos cumplen (`getCachedHomePage`, `console.error('[contact]'`, `FaqAccordion`, `ContactForm`, `searchParams`, `company_website` e `isPreviewReadonly` en `contact.ts`, `AFFILIATE_REL`, `role="note"`, `revalidate = 60`, `sponsored nofollow noopener`, `resolveAffiliateCta`, `buildBreadcrumbJsonLd`, `scrollMarginTop`, `--submit`, ninguna vista declara main). `src/app/actions/contact.ts` no tiene un solo cambio respecto a `5ad99c4`.
- No se corrio contra el preview: sigue en el SHA 5fa327d con las dos paginas viejas y esta plan no empuja. Los dos contratos en vivo quedan para 54-16.

## Supuesto A7 (pendiente, no medido)

Contacto lee `home_page*` en cuanto el preview corra este codigo. En este plan no se empujo, asi que el preview no ha leido esas tablas con el codigo nuevo y no hubo logs que revisar. Cuando 54-14 o 54-16 empujen, hay que revisar por SSH (solo lectura) los logs del contenedor del preview y confirmar 0 `permission denied`; si aparece, el arreglo es un `GRANT SELECT` que decide Juan. El codigo ya esta cubierto: si el permiso falta, Contacto sale sin pasos, filas ni FAQ y registra `[contact]`, sin 500.

## Decisiones para Juan

1. **h1 de Contacto.** El doc `contact` en produccion no tiene bloque `hero` (solo `contactFormBlock` con titulo "Hablemos" y ninguna descripcion). El sandbox dice "Charlemos sobre tu proximo proyecto" con un lead, pero ese copy no esta en Payload y no se invento. Hoy el h1 sera el titulo del doc ("Contacto" / "Contact") y no habra lead. Si quieres el h1 y el lead del sandbox, hay que cargarlos en un bloque `hero` del doc `contact` o decidir otra fuente.
2. **Etiqueta de "Donde lo use".** Para una `referenceLink` de url libre el chip muestra la ruta (por ejemplo `/case-studies`), igual que produccion. Tres herramientas apuntan a `/case-studies` o a `/servicios/fullstack-development`. El sandbox rotulaba esas rutas como "Casos de exito" y "Desarrollo full-stack"; falta la version EN aprobada, asi que no se copio.
3. **Ancho completo de "Medicion".** Es la unica categoria con una herramienta (Ahrefs) y ocupa una columna a ancho completo, como pide la spec.

No hay cadenas nuevas sin aprobar: todo el texto de interfaz reutiliza claves ya existentes de `contact`, `stack`, `stackPage`, `common` y `affiliateDisclosure`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El texto de las regiones vivas incluia CSS de Emotion en el selector del navegador**
- **Found during:** Tarea 3 (prueba de `collectSnapshot` en Chromium real sobre el HTML de la vista)
- **Issue:** Emotion deja etiquetas `style` dentro del arbol, y `textContent` de una etiqueta o region viva devolvia su CSS como si fuera texto. La etiqueta de `Nombre` salia como `Nombre.css-...{color:...}` y los `role="status"` y `role="alert"` traian centenares de caracteres de CSS.
- **Fix:** `collectSnapshot` lee el texto de un clon sin `style` ni `script`.
- **Files modified:** `scripts/verify/54-contact-form.mjs`
- **Commit:** `22fdec7`

**2. [Rule 1 - Bug] Dos comprobaciones de la autoprueba de Contacto contaban de mas**
- **Found during:** Tarea 1 (primera corrida)
- **Issue:** `MuiBreadcrumbs` tambien es un `ol` y un `nav`, asi que "una sola lista ordenada" daba 2 y, sin datos, quedaba un `ol` de migas. Ademas el orden de atributos del honeypot en el HTML es `tabindex` antes de `name`.
- **Fix:** los pasos se miden dentro de `<section id="contact-steps">` y el honeypot se comprueba con las dos ordenes de atributos.
- **Files modified:** `scripts/verify/54-contact-ssr.ts`
- **Commit:** `153bbf5`

### Ajustes dentro del alcance

- **`schemaName` en `ContactData`:** el plan pide conservar el JSON-LD "exactamente como esta". Su `name` usaba `meta.title ?? title ?? respaldo`, que no es ni el h1 ni la miga, asi que el mapeador lo calcula aparte para no cambiarlo.
- **Correo del mensaje de fallo:** `ContactForm` exige un `email: string`. Si el doc no trae un `mailto:`, la ruta usa `process.env.CONTACT_TO_EMAIL` (lo que hacia la pagina anterior) y, sin ninguno, una cadena vacia. No hay correo en el codigo.
- **`54-stack-ssr.ts` pasa tambien por el contrato HTTP:** se agrego el caso que envuelve el render real de la vista en un `main` minimo y lo pasa por `checkStackPage`, es y en, para que el script de 54-16 no dependa solo de fixtures escritos a mano (mismo criterio que 54-11).
- **Guarda extra en `--submit`:** contra una base que no es el preview exige `ALLOW_REAL_SEND=1` (el plan solo pedia que el envio fuera explicito).
- **Navegacion del hero de Stack:** los items son `li` dentro de `UL role="list"`, y cada `UL` de herramientas lleva `aria-label` con `stack.toolsLabel`, que existia en messages y no se usaba.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno. T-54-47 (honeypot, limite por IP y compuerta de solo lectura intactos en `contact.ts`; el contrato no envia sin `--submit`), T-54-48 (una sola constante `AFFILIATE_REL`, verificada en cada `/go` y cada enlace a Amazon), T-54-49 (aviso `role="note"` antes del primer `/go`, verificado por posicion en el HTML) y T-54-51 (url libre por `sanitizeHref`, probado con `javascript:alert(1)`) quedan mitigados como indica el plan. T-54-50 aceptado: el correo llega de `contactInfo`.

## Pendiente para 54-14 o 54-16

- Correr `BASE_URL=https://dev.juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/54-stack-affiliate.mjs` y `node scripts/verify/54-contact-form.mjs` contra el preview tras el empuje (con `--submit` solo si quieres confirmar el exito simulado).
- Revisar los logs del preview por A7 (arriba).
- Decidir el destino de `scripts/verify-stack-word-count.ts` y `scripts/verify-stack-page.ts` (ver `deferred-items.md`).
- Revision humana que sigue abierta: lector de pantalla en el formulario y el estado `aria-live`, foco no oculto por el header en Stack, y objetivo tactil de los chips-enlace de 40px.

## Self-Check: PASSED

- FOUND: src/lib/contact-data.ts, src/components/pages/ContactView.tsx, src/components/pages/contact/CopyEmailButton.tsx, src/lib/stack-data.ts, src/components/pages/StackView.tsx, src/components/pages/stack/StackToolCard.tsx, scripts/verify/54-contact-ssr.ts, scripts/verify/54-stack-ssr.ts, scripts/verify/54-contact-form.mjs, scripts/verify/54-stack-affiliate.mjs
- FOUND: commits 153bbf5, 0e4ae75 y 22fdec7
