---
phase: 54-paginas-de-conversion-y-utilidad
plan: 08
subsystem: ui
tags: [mui, home, payload-globals, local-api, ssr-selftest, a11y, ascii-portrait]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 05 (Section, FaqAccordion, IconTile, TechChips, TranslationNotice), plan 06 (LogoMarquee, GrainBlob) y plan 07 (global home-page migrado y sembrado)
provides:
  - getHomeData, getHomeClients y mapHomeGlobal (src/lib/home-data.ts)
  - HomeView con Hero, marquesina, Tagline, Vitals y Servicios
  - 54-home-ssr.ts, autoprueba de 55 casos con el copy sembrado como fixture
affects: [54-09, 54-14, 54-16]

plan_head_before: 4588a4c6f0e477a65eb532f63267d7719c5986ea
actuals:
  tokens: 21500
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Mapeador puro mapHomeGlobal (sin Payload) alimentado por el fixture HOME_COPY_ES; el lector de servidor aparte y a prueba de errores"
    - "Cada lectura de la home (global y clientes) falla por separado con console.error('[home]') y deja su seccion en null"
    - "Server Component que necesita un estilo de ocultar no importa visuallyHidden de un modulo use client: usa un CSSProperties local"

key-files:
  created:
    - src/lib/home-data.ts
    - src/components/home/HomeView.tsx
    - src/components/home/Hero.tsx
    - src/components/home/Tagline.tsx
    - src/components/home/Vitals.tsx
    - src/components/home/Services.tsx
    - src/components/home/ascii-grid.ts
    - scripts/verify/54-home-ssr.ts
  modified:
    - src/app/(frontend)/[locale]/page.tsx
    - src/components/mui/FaqAccordion.tsx
    - scripts/verify/54-primitives-ssr.ts

key-decisions:
  - "Una seccion sin encabezado propio (Vitals o Servicios sin titulo) se omite aunque tenga items: el h2 es su nombre accesible y no se inventa copy"
  - "La marquesina se omite si el bloque clientLogosBlock del doc home no trae titulo, por la misma razon"
  - "El mapeador entrega servicePage validado y Services arma el href con buildServiceHref(locale, slug), asi el destino por idioma vive en un solo lugar"
  - "Un CTA sin href valido no se pinta: un boton sin accion es un control muerto para teclado y lector de pantalla"

patterns-established:
  - "La home nunca responde 500 por una lectura de Payload: getHomeData captura y registra"
  - "HomeView envuelve en lang es solo las secciones de home-page cuando EN cae al respaldo; la marquesina queda fuera porque sale del doc home y de clientes"

requirements-completed: []

duration: 50min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 08: Primera mitad de la home en MUI con datos de Payload Summary

**Home servida desde el global home-page y la coleccion clientes: Hero con h1 en dos lineas y retrato ASCII gobernado por useMotion, marquesina de logos, Tagline que se enciende por palabra, Vitals con cuatro lecturas y Servicios con acordeon y columna sticky, sin ningun dato del sandbox y sin 500 si la lectura falla.**

## Performance

- **Duration:** unos 50 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3 (la 1 es tracer)
- **Files:** 8 creados, 3 modificados

## Accomplishments

- `mapHomeGlobal(global, locale, isFallback)` es puro: cada seccion sin contenido da null, los numeros faltantes de Vitals pasan a 0, el icono y la pagina de servicio se validan contra `SERVICE_ICON_NAMES` y `isServiceSlug`, y el href del CTA pasa por `sanitizeHref` (T-54-31).
- `getHomeData` junta el global (`getCachedHomePage`, con `isFallback`) y `getHomeClients` en paralelo, cada uno con su `try` y `catch` y `console.error('[home]', err)`. Un error en una lectura no se lleva a la otra y la pagina no lanza (T-54-33).
- `getHomeClients` replica la seleccion de `ClientLogosBlock` (lista explicita del bloque en su orden, o todos), con `overrideAccess: false`, `select` minimo, `unstable_cache` de 60 s y la etiqueta `pages:home`. Omite clientes sin `logo.url` (T-54-32).
- `page.tsx` conserva `revalidate = 60`, `generateStaticParams` vacio, `generateMetadata`, el calculo de los tres nodos y los tres `JsonLd`; solo cambia `RenderBlocks` por `HomeView`. El diff toca solo el cuerpo de render y los imports.
- `HomeView` emite siempre un h1: el del Hero o, sin hero, uno visualmente oculto con el titulo del doc home. En EN con `isFallback` muestra `TranslationNotice` (`esHref="/"`) y envuelve las secciones del global en `lang="es"`.
- `Hero`: h1 con dos `span` en bloque y sin `br`, CTA `Button` contained con `linkFor`, GrainBlob `feather={18}`, tarjeta de cifra sobre vidrio. El retrato lee `useMotion()`: con `paused` se dibuja estatico y no registra la revelacion por puntero. Sin `matchMedia`, sin media query de movimiento reducido y sin `useColorScheme` (tinta clara fija).
- `Tagline`: frase completa en span oculto y palabras en span `aria-hidden`; con `paused` o sin IntersectionObserver aparece completa.
- `Vitals`: cuatro tarjetas h3 en una `UL`, cifra mono de 30/36 peso 600, barra con tramos `success`, `warning`, `error` y marcador, `role="img"` con el nombre armado desde `home.vitals.ariaLabel`. Cifra y nota siempre en texto (SC 1.4.1).
- `Services`: 5fr y 7fr, izquierda `position: sticky` desde md con `top: 112px` y `max-height: calc(100vh - 144px)`, `FaqAccordion` con el primer panel abierto y el texto de los cerrados en el HTML, detalle con `pl: 8` (64px), `TechChips` con `common.topicsLabel` y "Ver servicio" solo con pagina.

## Task Commits

1. **Task 1 (tracer): home de punta a punta con Tagline, lector y render de prueba** - `112d0c5` (feat)
2. **Task 2: Hero con retrato ASCII y marquesina de logos desde clientes** - `34a96e7` (feat)
3. **Task 3: Vitals y Servicios con acordeon y columna sticky** - `6373a5d` (feat)

La rama NO se empujo (regla del plan: la home esta incompleta hasta 54-14). No se toco ninguna base ni se escribio en el preview.

## Verificacion

- `node_modules/.bin/tsx scripts/verify/54-home-ssr.ts`: 55 casos en PASS, salida 0. Cubre: frase completa de la tagline, una palabra por `data-w`, un h1 con dos span en bloque (regla `display:block` leida del CSS de Emotion), CTA `#contacto`, `javascript:` rechazado, seis logos con una copia `aria-hidden` cada uno, marquesina sin logos sin encabezado, Vitals (cuatro h3, cuatro barras con el nombre exacto, cifras y notas), Servicios (cinco resumenes, cinco cuerpos en el HTML, un solo panel abierto, "Ver servicio" solo en tres, hrefs `/servicios/` en ES y `/en/services/` en EN), ids unicos, `aria-controls` resueltos, estados vacios y respaldo EN.
- `node_modules/.bin/tsx scripts/verify/54-primitives-ssr.ts`: sigue en PASS con la nueva comprobacion de ids unicos (se probo que falla si se revierte el arreglo).
- `npx tsc --noEmit`: salida 0.
- `npm run build` (variables de solo build): salida 0.
- `node scripts/verify/53-layer-check.mjs`: OK.
- Greps de aceptacion de las tres tareas: todos en verde (sin `matchMedia`, sin `unmountOnExit`, sin `main`, sin `component="ul|ol"`, sin rutas `/logos/` ni imports del sandbox en `src/components/home` y `src/lib/home-data.ts`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FaqAccordion repetia el id del panel (deferred-items de 54-06)**
- **Found during:** Tarea 3 (la autoprueba de ids unicos de la home)
- **Issue:** `AccordionDetails` llevaba `id` y MUI ya pone ese mismo id en la region desde `aria-controls`; Servicios emitia cinco ids duplicados.
- **Fix:** se quito el `id` de `AccordionDetails`. Se agrego la comprobacion de ids unicos a `54-primitives-ssr.ts` y a `54-home-ssr.ts`. El item queda marcado como resuelto en `deferred-items.md`.
- **Files modified:** `src/components/mui/FaqAccordion.tsx`, `scripts/verify/54-primitives-ssr.ts`
- **Commit:** `6373a5d`

**2. [Rule 1 - Bug] visuallyHidden no se puede importar en un Server Component**
- **Found during:** Tarea 1
- **Issue:** `visuallyHidden` vive en `ScoreRing.tsx`, un modulo `use client`; desde `HomeView` (Server Component) el export llegaria como referencia de cliente y no como el objeto de estilo.
- **Fix:** `HomeView` usa un `CSSProperties` local para el h1 oculto. `Tagline` (cliente) si importa `visuallyHidden` como pide el plan.
- **Commit:** `112d0c5`

**3. [Rule 2 - Missing critical] Un CTA sin href valido no se pinta**
- **Issue:** el plan dice que un href nulo "deja el boton sin enlace". Un `button` que no hace nada es un control muerto para teclado y lector de pantalla.
- **Fix:** con `ctaHref` nulo (vacio o rechazado por `sanitizeHref`) el Hero omite el boton. El caso `javascript:` de la autoprueba comprueba que no llega ni el enlace ni el esquema al HTML.
- **Commit:** `34a96e7`

**4. [Interpretacion] Titulo requerido para Vitals, Servicios y marquesina**
- El plan pide null ante una seccion sin contenido y no cubre el caso "hay items pero no titulo". Sin titulo no hay h2 que nombre la seccion (`aria-labelledby`) y no se inventa copy, asi que la seccion se omite. En la marquesina el titulo sale de `clientLogosBlock.title` del doc home; si ese bloque no lo trae la franja no se pinta.

**5. [Interpretacion] href de servicio calculado en la vista**
- El plan pide a la vez "href calculado" en el mapeador y `buildServiceHref` dentro de `Services.tsx` (criterio de aceptacion). El mapeador entrega `servicePage` validado y la vista llama `buildServiceHref(locale, slug)`; el resultado y el criterio coinciden.

**Total:** 3 correcciones automaticas y 2 interpretaciones. El contrato de SEO (metadata, ISR, JSON-LD) no cambia.

## Authentication Gates

Ninguno. No se leyo `.env`, no se escribio en la base, no se empujo la rama ni se toco el preview o la app `web` de produccion.

## Supuesto A7 (rol de solo lectura del preview)

No se pudo ni se debia comprobar en este plan: la rama no se empuja, asi que el preview sigue en el SHA `5fa327d` y todavia no lee `home_page*` con el codigo nuevo. La primera lectura real sera la del plan que despliegue la home completa (54-14 o 54-16). Entonces hay que revisar por SSH los logs del contenedor del preview y confirmar 0 lineas `permission denied`. Si aparece, el `GRANT SELECT ON ... TO juantech_preview_ro;` lo corre Juan.

## Lo que la autoprueba no puede probar

- La revelacion del retrato por puntero, el encendido por scroll de la Tagline y la animacion de la marquesina corren en el navegador; quedan para el preview en 54-16.
- La lectura real de `clientes` y del doc home (`getHomeClients`) necesita la base; la autoprueba usa la forma ya mapeada. El mapeo de `logo.url`, `width`, `height` y `onDark` se revisara contra el preview.
- Que el doc `home` de produccion tenga un `clientLogosBlock` con titulo en los dos idiomas no se pudo confirmar sin leer `.env`. Si falta el titulo en un idioma, la franja no aparece en ese idioma.
- Contraste y solape a 375, 900 y 1280 px (criterios `backstop` de UI-SPEC) quedan para 54-16.

## Known Stubs

Ninguno.

## Threat Flags

Ninguno nuevo. T-54-31 (href del CTA por `sanitizeHref`), T-54-32 (`overrideAccess: false` y `select` minimo en clientes; el global se lee sin esa opcion por diseno), T-54-33 (`try` y `catch` por lectura) y T-54-34 (todo texto como hijo de Typography, sin HTML en crudo) quedan mitigados como en el plan.

## Issues Encountered

La home publica pierde de forma temporal los bloques anteriores (`codeFixesBlock`, `auditorHighlight`, `auditOfferBlock` y las demas secciones) porque `HomeView` reemplaza a `RenderBlocks`. Es el estado previsto por el plan hasta que 54-14 los reincorpore; por eso la rama no se empuja.

## Next Phase Readiness

- 54-14 agrega Casos, Proceso, Sitios, Sobre mi, Testimonios, FAQ, Cierre y los tres bloques existentes dentro de `HomeView`, extendiendo `HomeData` y `mapHomeGlobal` con el mismo patron y el mismo fixture.
- Los requisitos PAG-* no se marcan: la home todavia esta incompleta.
- Antes del primer despliegue con la home nueva: revisar los logs del preview por `permission denied` (supuesto A7).

## Self-Check: PASSED

- Archivos verificados en disco (ocho creados, tres modificados).
- Commits `112d0c5`, `34a96e7` y `6373a5d` presentes en `git log`; `git rev-list --count` desde `plan_head_before` da 3.
