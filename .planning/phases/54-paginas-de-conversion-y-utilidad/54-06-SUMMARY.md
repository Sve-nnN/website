---
phase: 54-paginas-de-conversion-y-utilidad
plan: 06
subsystem: ui
tags: [mui, lexical, rich-text, toc, contact-form, cta, logo-marquee, ssr-selftest, a11y]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 01 (GrainBlob, lists, links), plan 02 (getCachedHomePage con isFallback), plan 03 (messages y arnes de render) y plan 05 (primitivas de layout)
provides:
  - MuiRichText (Server Component), lexical-toc (slugify, extractHeadings, buildHeadingIdMap) y Toc, reutilizables por la fase 55
  - LogoMarquee con fitLogo y LogoStaticGrid, TestimonialCards y CaseMetricCard con splitHeroMetric y formatSector
  - ContactForm unico (variantes card y panel) con la accion real sendContactMessage
  - CtaPanel, CtaSection y getCtaData(locale)
  - 54-richtext-toc.ts y 54-conversion-ssr.ts, autopruebas sin base de datos
affects: [54-08, 54-09, 54-10, 54-11, 54-12, 54-13, 54-14, 54-15, 54-16, 55]

plan_head_before: 6130ae6188bd23e1be704efddcf658142e8ffcae
actuals:
  tokens: 18650
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Un solo recorrido de root.children saca los ids de encabezado: el indice y el render coinciden por construccion"
    - "MuiRichText parte de richTextConverters y solo reemplaza heading, paragraph, list, listitem, link, autolink y quote, asi no pierde bloques indexables"
    - "Contrato de enlaces del CMS: sanitizeHref y resolveLinkHref antes de pintar; un esquema no permitido deja solo el texto"
    - "Autoprueba que respeta el cache de Emotion: cada aserto sobre CSS va en el primer render de ese estilo"

key-files:
  created:
    - src/components/mui/rich-text/lexical-toc.ts
    - src/components/mui/rich-text/MuiRichText.tsx
    - src/components/mui/rich-text/Toc.tsx
    - src/components/mui/LogoMarquee.tsx
    - src/components/mui/TestimonialCards.tsx
    - src/components/mui/CaseMetricCard.tsx
    - src/components/mui/split-hero-metric.ts
    - src/components/mui/ContactForm.tsx
    - src/components/mui/CtaPanel.tsx
    - src/components/mui/CtaSection.tsx
    - src/lib/cta-data.ts
    - scripts/verify/54-richtext-toc.ts
    - scripts/verify/54-conversion-ssr.ts
  modified: []

key-decisions:
  - "MuiRichText usa next-intl (useTranslations y useLocale) en el cuerpo del componente y cierra las funciones convertidoras sobre ellos: los convertidores se llaman como funciones, no como componentes, asi que no pueden usar hooks"
  - "Un h1 dentro del cuerpo sigue bajando a h2 por el convertidor del sitio (SEO-44); ese h2 no recibe id ni entra al indice porque extractHeadings solo mira los h2 y h3 literales del documento"
  - "El id del panel del acordeon movil lo pone MUI desde aria-controls del resumen; Toc no repite el id en AccordionDetails para no duplicarlo"
  - "ContactForm toma los ids de campo de useId para que dos formularios en una pagina no repitan ids"

patterns-established:
  - "La fase 55 importa MuiRichText y extractHeadings del mismo modulo y arma el Toc en servidor con el mismo arbol"
  - "Cada pagina que muestre el formulario pasa status ('success' o 'error') leido de searchParams.sent; el formulario mueve el foco al contenedor de estado al montar"

requirements-completed: []

duration: 35min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 06: Primitivas de conversion y renderizador de rich text Summary

**MuiRichText con ids de encabezado compartidos con el indice, marquesina de logos, tarjetas de cita y de caso, formulario de contacto unico sobre la accion real y cierre de conversion con un lector de datos que nunca lanza.**

## Performance

- **Duration:** unos 35 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3
- **Files:** 13 creados, 0 modificados

## Accomplishments

- `lexical-toc.ts` es un modulo puro: `slugify` con el mismo algoritmo del sandbox, `extractHeadings` y `buildHeadingIdMap` salen de un solo recorrido, con deduplicado `-2`, `-3` (y sin choques si un encabezado literal ya se llama `x-2`). Un texto vacio usa `seccion`.
- `MuiRichText` es Server Component sin HTML en crudo. Encabezados h2 y h3 con `id` y `scroll-margin-top: 96px`, parrafos 16/24, listas con vineta o numeracion explicita, enlaces subrayados en `accentText` (los externos con `target="_blank"`, `rel="noopener noreferrer"` y el sufijo de `common.opensInNewTab`). Los bloques desconocidos caen a `richTextBlockConverters`.
- Probado contra el documento real de Privacy de produccion: 8 encabezados, cada id aparece una vez en el HTML.
- `Toc` muestra un `nav` sticky desde `lg` y un acordeon con resumen h2 debajo, `aria-current="true"` en el activo y un IntersectionObserver solo como refuerzo. Con menos de 2 encabezados no renderiza.
- `LogoMarquee` calcula el tamano con `fitLogo` (tope 220 por 56, nunca amplia, 120 por 48 sin dimensiones), pone chip oscuro a los `onDark`, marca la segunda copia `aria-hidden` con `alt` vacio y, con `useMotion().paused`, usa `LogoStaticGrid` (cada logo una vez, `flex-wrap`).
- `TestimonialCards` respeta cero, uno (760px), dos (dos columnas desde md) y tres o mas. `CaseMetricCard` pinta la cifra de 72px con enlace estirado y foco en la tarjeta con `:has(a:focus-visible)`.
- `ContactForm` envia por `action={sendContactMessage}` (funciona sin JavaScript), con `locale` oculto, honeypot `company_website` en contenedor `aria-hidden`, sin campo de servicio ni de sitio web. La validacion cliente solo agrega. `success` es una tarjeta `role="status"` y `error` un `Alert` `role="alert"`; ambos reciben el foco al montar.
- `CtaPanel` y `CtaSection` reciben titulo, lead, correo, avatar y nombre por props. `getCtaData` lee `homePage.cta`, el `mailto:` de `contactInfo` del doc `contact` y el avatar del autor, todo con `try` y `catch`.
- `src/app/actions/contact.ts` no se toco: el contrato de envio (name, email, message, company_website, locale, redireccion `?sent=`) y las compuertas `isPreviewReadonly()` quedan intactos.

## Task Commits

1. **Task 1 (tracer): MuiRichText con ids de encabezado probado contra Privacy real** - `cc067a4` (feat)
2. **Task 2: Toc, LogoMarquee, TestimonialCards y CaseMetricCard** - `7a384ad` (feat)
3. **Task 3: ContactForm unico, CtaPanel, CtaSection y getCtaData** - `73bb21e` (feat)

La rama NO se empujo (regla de la fase: solo 54-07 empuja).

## Verificacion

- `tsx scripts/verify/54-richtext-toc.ts`: 20 PASS, salida 0 (incluye el caso real de Privacy y los enlaces con `javascript:`, externo e interno en ES y EN).
- `tsx scripts/verify/54-conversion-ssr.ts`: 77 PASS, salida 0 (helpers, fitLogo, marquesina, rejilla estatica, cero, uno, dos, tres y cuatro testimonios, tarjeta de caso, Toc, ContactForm en ES y EN con los estados success y error, CtaPanel, CtaSection y `emailFromContactPage`).
- `npx tsc --noEmit`: salida 0.
- `grep` de aceptacion: sin `dangerouslySetInnerHTML`, sin `prefers-reduced-motion` ni `body.paused`, sin `component="ul|ol"` fuera de `lists.tsx`, sin `/logos/`, sin `<main`, sin `hello@juan-tech.com` en `cta-data.ts` ni `CtaPanel.tsx`.
- No se corrio ningun script de escritura de base de datos (20, 21, 22) ni migracion, y no se empujo nada.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] id duplicado en el panel del acordeon del Toc**
- **Found during:** Tarea 2 (inspeccion del HTML emitido)
- **Issue:** MUI pone el `id` del panel (region) desde `aria-controls` del resumen. Repetirlo en `AccordionDetails`, como hace el sandbox, emite dos elementos con el mismo id.
- **Fix:** `Toc` deja el id solo en el resumen y en `aria-controls`; el panel lo recibe de MUI.
- **Files modified:** `src/components/mui/rich-text/Toc.tsx`
- **Commit:** `7a384ad`

**2. [Rule 2 - Missing critical] getCtaData tambien devuelve null si falta el correo**
- **Issue:** el plan solo pedia null sin titulo. Sin correo el cierre no puede copiar nada y el mensaje de fallo del formulario quedaria con un hueco ("escribe directamente a ."). El correo no se puede fijar en el codigo.
- **Fix:** sin entrada `mailto:` en `contactInfo` se registra `console.error('[cta]', ...)` y se devuelve null, con lo que el cierre se omite. `CtaSection` tambien se omite sin titulo o sin correo.
- **Files modified:** `src/lib/cta-data.ts`, `src/components/mui/CtaSection.tsx`
- **Commit:** `73bb21e`

**3. [Rule 2 - Missing critical] El nombre del autor tambien viene de los datos**
- **Issue:** el sandbox fija "Juan Carlos Angulo" dentro del panel. El plan pide que el texto salga de messages o de props.
- **Fix:** `getCtaData` devuelve `name` (campo `name` del autor, con `select` minimo) y `CtaPanel` y `CtaSection` lo reciben como prop opcional. La pastilla con avatar y nombre se omite si faltan los dos.
- **Files modified:** `src/lib/cta-data.ts`, `src/components/mui/CtaPanel.tsx`, `src/components/mui/CtaSection.tsx`
- **Commit:** `73bb21e`

**4. [Ajuste menor] LogoStaticGrid exportado y autopruebas ordenadas por Emotion**
- `useMotion().paused` siempre vale `false` en el render de servidor, asi que la rejilla estatica no se puede alcanzar desde `LogoMarquee` en la autoprueba. Se extrajo como `LogoStaticGrid` exportado y se prueba directo.
- Emotion no repite un estilo ya emitido en el mismo proceso: cada aserto sobre CSS se hace en el primer render de ese estilo y los casos posteriores se prueban por estructura o por igualdad de clase.

**Total:** 3 correcciones o ampliaciones automaticas y un ajuste de la autoprueba. El contrato de UI-SPEC y el de `sendContactMessage` no cambian.

## Interpretaciones a revisar

- UI-SPEC dice "sangria de 16px para h3" en el Toc. Se leyo como 16px mas que un h2: el enlace de nivel 3 lleva `padding-left` de 28px y el de nivel 2 de 12px.
- Un `h1` del cuerpo sigue bajando a `h2` por el convertidor del sitio (SEO-44) y no entra al indice. Si Juan quiere que ese encabezado tambien sea ancla, es un cambio en `extractHeadings` y en el heading de `MuiRichText`.

## Lo que la autoprueba no puede probar

- La accion real: en el arnes de servidor React emite su guarda `action="javascript:throw ..."` en lugar de la referencia de la Server Action. El envio de verdad (con y sin JavaScript, honeypot, `?sent=`) queda para el preview en 54-16.
- El IntersectionObserver del Toc, el temporizador de "Correo copiado" y el foco al montar corren en el navegador; quedan para el preview.
- Mientras `getCtaData` consulte `home-page.cta` con los campos nuevos, depende de la migracion que aplica 54-07: no hay tabla nueva que leer antes de eso, y por eso la rama no se empuja.

## Authentication Gates

Ninguno. No se toco ninguna base de datos.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-54-20 a T-54-22 y T-54-24 quedan mitigados como en el plan (honeypot oculto y sin foco, sin HTML en crudo, enlaces por `sanitizeHref` y `resolveLinkHref`, `getCtaData` sin lanzar).

## Deferred Issues

`src/components/mui/FaqAccordion.tsx` (plan 54-05) repite el `id` del panel en `AccordionDetails`, con el mismo duplicado que se corrigio en `Toc`. Quedo anotado en `deferred-items.md` de la fase, fuera del alcance de este plan.

## Next Phase Readiness

- Los planes de pagina ya pueden consumir `MuiRichText`, `Toc`, `LogoMarquee`, `TestimonialCards`, `CaseMetricCard`, `ContactForm`, `CtaSection` y `getCtaData`.
- Las paginas que muestren el formulario deben pasar `status` desde `searchParams.sent` y `email` desde `getCtaData` o el doc `contact`.
- Los requisitos PAG-01, PAG-02, PAG-07, PAG-09 y PAG-12 siguen abiertos: este plan solo publica las piezas, las paginas llegan en los planes siguientes.

## Self-Check: PASSED
