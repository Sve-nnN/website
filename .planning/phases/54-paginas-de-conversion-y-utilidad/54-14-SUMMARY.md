---
phase: 54-paginas-de-conversion-y-utilidad
plan: 14
subsystem: ui
tags: [mui, home, payload-globals, featured-content, local-api, ssr-selftest, a11y, seo-03]

requires:
  - phase: 54-paginas-de-conversion-y-utilidad
    provides: plan 08 (getHomeData, HomeView con la primera mitad), plan 06 (CaseMetricCard, split-hero-metric, ScoreRing), plan 05 (Section, FaqAccordion, TestimonialCards, TechChips, IconTile, lists), plan 12 (CtaSection y getCtaData)
provides:
  - src/lib/home-data-b.ts (mapHomeGlobalB, mapFeaturedCases, mapWebsite, mapTestimonials, mapLegacyBlocks, assembleHomeSectionsB, getHomeSectionsB y los lectores)
  - ocho secciones nuevas (Process, Cases, Sites con SiteCard, About, Testimonials, Faq) y tres bloques portados (CodeFixes, AuditorHighlightCard, AuditOffer)
  - HomeView completa en el orden aprobado de UI-SPEC, con cierre CtaSection
  - scripts/verify/54-home-b-ssr.ts, autoprueba de 133 casos
affects: [54-15, 54-16]

plan_head_before: 2a2da502737452a206ad5fd8709e4d9fccc21956
actuals:
  tokens: 25900
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Mapeadores puros (mapHomeGlobalB, mapFeaturedCases, mapWebsite, mapLegacyBlocks, assemble*) alimentados por el fixture HOME_COPY_ES; los lectores aparte y a prueba de errores"
    - "Cada lectura de la segunda mitad falla por separado con console.error('[home]') y deja su seccion en null; getHomeSectionsB nunca lanza"
    - "home-data-b no importa en ejecucion de home-data (que importa a home-data-b): sin ciclo"
    - "Websites destacados: ids de featured-content y relectura con overrideAccess false para descartar borradores"

key-files:
  created:
    - src/lib/home-data-b.ts
    - src/components/home/Process.tsx
    - src/components/home/Cases.tsx
    - src/components/home/SiteCard.tsx
    - src/components/home/Sites.tsx
    - src/components/home/About.tsx
    - src/components/home/Testimonials.tsx
    - src/components/home/Faq.tsx
    - src/components/home/CodeFixes.tsx
    - src/components/home/AuditorHighlightCard.tsx
    - src/components/home/AuditOffer.tsx
    - scripts/verify/54-home-b-ssr.ts
  modified:
    - src/lib/home-data.ts
    - src/components/home/HomeView.tsx

key-decisions:
  - "HomeData gana el campo sectionsB (HomeSectionsB) en lugar de mezclar las secciones nuevas en el nivel raiz: mapHomeGlobal no cambia de contrato y 54-home-ssr.ts sigue pasando sin tocarse"
  - "El enlace de cada SiteCard va a /websites/<slug> (pagina interna del sitio) y no al dominio externo del sandbox; el dominio mono sale del hostname de clientes.websiteUrl y se omite si falta"
  - "La rejilla de Sitios se adapta al conteo: con 5 o mas, tres de 2 columnas y el resto de 3; con 4, dos renglones de 2; con 3, tres de 2; con 1 o 2, mitades. Maximo 5 sitios"
  - "El CTA de la oferta toma el rotulo del primer enlace del bloque y, sin el, el rotulo del hero; sin ninguno no hay boton (no se inventa copy)"
  - "El auditor conserva las cuatro cifras verificables de AUDITOR_STATS con los rotulos de messages auditorHighlight.*: son texto indexable del bloque actual (SEO-03) y vienen de constantes, no de copy nuevo"
  - "Los verificadores heredados de la fase 48 (verify-stack-word-count.ts y verify-stack-page.ts) NO se adaptan ahora: se retiran con el corte de la fase 57 (ver Deferred Issues)"

patterns-established:
  - "Seccion con encabezado propio y sin datos: devuelve null, sin h2 huerfano (cubierto por una prueba por componente)"
  - "En EN con isFallback, las secciones del global van en lang es; los bloques del doc home (errores reales, auditor, oferta) tienen su propio idioma y el cierre decide con cta.isFallback"

requirements-completed: []

duration: 95min
completed: 2026-11-08
status: complete
---

# Phase 54 Plan 14: Segunda mitad de la home y bloques existentes Summary

**Home completa en MUI: Proceso, Casos con cifra separada de su etiqueta, Sitios con puntajes reales y nota de fecha real, Sobre mi con contadores por workType, Testimonios sin ranuras, FAQ y cierre, mas los tres bloques que produccion ya sirve (errores reales con el commit, auditor y oferta con precio), todo en el orden aprobado y con cada lectura aislada.**

## Performance

- **Duration:** unos 95 min
- **Completed:** 2026-11-08
- **Tasks:** 3 de 3 (la 1 es tracer)
- **Files:** 12 creados, 2 modificados

## Accomplishments

- `getHomeData` suma `sectionsB`, que arma `getHomeSectionsB(locale, global)`: casos, sitios, conteos, testimonios, bloques del doc home y cierre se leen en paralelo y cada lector captura su error con `console.error('[home]')`. Una lectura caida deja solo su seccion en null (T-54-60). Metadata, ISR y los tres JSON-LD de `page.tsx` no cambian (el diff de `page.tsx` es cero).
- Casos: `mapFeaturedCases` toma los poblados de `getCachedFeaturedContent` (sin consulta nueva), omite ids sin poblar y entradas sin slug, titulo o cifra, y se queda con tres. La cifra pasa por `splitHeroMetric` y el sector por `formatSector`; la etiqueta ausente cae a `metricSuffix`.
- Sitios: `getHomeSites` toma los ids de `featuredWebsites` y relee con `overrideAccess: false` (descarta borradores), `select` minimo y `populate` solo de los campos publicos de Media y del cliente. Un anillo con puntaje null se omite y la lista entera si los cuatro son null (el doc `juan-tech-com`). La nota usa `home.sites.note` con la fecha mas reciente de `lighthouseCapturedAt`, formateada con `Intl.DateTimeFormat` en UTC; sin fecha no hay nota.
- Sobre mi: contadores desde `payload.count` de clientes por workType (cada contador en cero o sin rotulo se omite), parrafos y chips del global, hasta tres figuras con alt de Media y ancho y alto declarados; sin imagenes el texto ocupa el ancho completo.
- Testimonios: solo documentos de la coleccion, rol con `home.testimonials.roleAt`; cero sin seccion, uno en 760px, nunca ranuras.
- Bloques existentes: `mapLegacyBlocks` lleva `codeFixesBlock`, `auditorHighlight` y `auditOfferBlock` a props. Los hrefs de repo y commit solo aceptan http o https absolutos tras `sanitizeHref`. El codigo del arreglo es una region desplazable (`tabIndex 0`, `role="region"`, `aria-label` con el sintoma) y entra como texto.
- `HomeView`: Hero, marquesina, Tagline, Vitals, errores reales, Servicios, Casos, Auditor, Proceso, Sitios, Sobre mi, Testimonios, oferta, FAQ y cierre con `CtaSection`.

## Task Commits

1. **Task 1 (tracer): casos y proceso de punta a punta** - `2aedeb2` (feat)
2. **Task 2: sitios, sobre mi, testimonios y FAQ con datos reales** - `1dde954` (feat)
3. **Task 3: errores reales, auditor, oferta y ensamblado final** - `ac1a442` (feat)

El plan no manda empujar (el empuje y el despliegue son del plan 54-16). La rama NO se empujo, no se toco la app `web` de produccion ni `juantech-preview`, no se leyo `.env` y no se escribio en ninguna base.

## Verificacion

- `node_modules/.bin/tsx scripts/verify/54-home-b-ssr.ts`: 133 casos en PASS, salida 0. Cubre mapeadores, estados cero, uno y muchos, ids unicos, `aria-controls` y `aria-labelledby` resueltos, orden de las catorce secciones, un solo h1, niveles de encabezado sin saltos, escape del codigo del CMS, `javascript:` rechazado, lang es en el respaldo EN y que una seccion caida no se lleve a las demas.
- Pruebas de mutacion: se rompio a proposito la rejilla de Sitios y el orden de Auditor y Casos; la autoprueba fallo en los dos casos y se restauro el codigo.
- `node_modules/.bin/tsx scripts/verify/54-home-ssr.ts` (plan 08): sigue en PASS.
- `npx tsc --noEmit`: salida 0.
- `npm run build` (variables de solo build): salida 0.
- `node scripts/verify/53-layer-check.mjs`: OK. `node scripts/verify/54-messages-parity.mjs`: PASS.
- Greps de aceptacion de las tres tareas: todos en verde (sin `main`, sin `component="ul|ol"`, sin imports del sandbox, `buildProfessionalService` sigue en la ruta).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] El auditor conserva sus cuatro cifras verificables**
- **Found during:** Tarea 3
- **Issue:** el plan describe la tarjeta del auditor sin las cuatro cifras (29 checks, 5 categorias, 500 URLs, CWV) que el bloque actual ya muestra. Quitarlas reduce contenido indexable, lo que el propio plan dice evitar por SEO-03.
- **Fix:** una lista de cuatro cifras mono con los rotulos ya existentes en `messages.auditorHighlight.*` y los valores de `AUDITOR_STATS`. No hay copy nuevo.
- **Files modified:** `src/components/home/AuditorHighlightCard.tsx`
- **Commit:** `ac1a442`

**2. [Rule 1 - Bug] `getHomeSites` y `getHomeCases` lanzaban al llamador**
- **Found during:** Tareas 1 y 2
- **Issue:** el plan pide que cada lector este protegido con try y catch y `console.error('[home]')`; la primera version dejaba la captura al ensamblador.
- **Fix:** cada lector publico captura, registra y devuelve null; la parte cacheada queda aparte.
- **Commits:** `2aedeb2`, `1dde954`

### Interpretaciones

**3. [Interpretacion] Dominio y enlace de la tarjeta de sitio.** La coleccion `websites` no tiene campo de dominio ni URL. El dominio mono sale del hostname de `clientes.websiteUrl` (sin `www.`, solo http o https) y se omite si falta. El enlace estirado apunta a `/websites/<slug>` (la pagina interna que ya existe), no al sitio externo como en el sandbox: pasa por `linkFor`, suma enlace interno y no necesita el aviso de pestana nueva.

**4. [Interpretacion] Rejilla adaptativa de Sitios y tope de cinco.** El plan fija "3 y 2 tarjetas"; con menos de cinco destacados esa regla dejaba huecos. La funcion `spanFor` cubre 1 a 5 o mas sitios y la lectura toma como maximo cinco.

**5. [Interpretacion] Casos y metrica sin cifra.** Una entrada sin `heroMetric` se omite (una cifra vacia de 72px no dice nada). Una cifra que no calza el patron ("0 → 56 clics") se muestra entera y la etiqueta cae a `metricSuffix`, como pide el plan.

**6. [Interpretacion] `getHomeSectionsB(locale, global)` sin `isFallback`.** El plan lista un tercer argumento. `HomeData.isFallback` ya viaja desde `mapHomeGlobal` y la vista decide `lang es` con el, asi que no hace falta pasarlo; el cierre trae el suyo en `cta.isFallback`.

**7. [Interpretacion] Secciones mixtas en el respaldo EN.** Casos, Sitios y Testimonios mezclan titulos del global (en espanol en el respaldo) con datos de colecciones que si estan localizados. Se envuelven enteras en `lang="es"` como pide el plan; si EN llega a tener contenido de colecciones y global sin traducir, el lector de pantalla leera esas tarjetas con la voz en espanol.

**Total:** 2 correcciones automaticas y 5 interpretaciones. El contrato de SEO (metadata, ISR, JSON-LD) no cambia.

## Decision sobre los verificadores heredados de la fase 48

`scripts/verify-stack-word-count.ts` y `scripts/verify-stack-page.ts` **no se adaptan en este plan y se retiran con el corte de la fase 57**, junto con `ToolCard`, `GearCard`, `StackHighlightCallout` y `AffiliateDisclosureFrame`.

- Motivo: los dos dependen de marcado Tailwind que ya no existe en `/stack`, de un servidor de desarrollo local en `localhost:3000` y de `--env-file=.env` contra la base de produccion. Ningun script, `package.json` ni documento vigente los invoca (solo aparecen en artefactos de la fase 48 y en un worktree viejo).
- Cobertura que los reemplaza: `54-stack-ssr.ts` (estructura, h1, migas, logos, rotulos) y `54-stack-affiliate.mjs` (contrato `/go/`, aviso antes del primer enlace, `sponsored`, un solo h1).
- **Hueco que queda abierto:** ninguno de los scripts `54-*` comprueba el minimo de 100 palabras por narrativa de herramienta (STACK-02 de la fase 48). La narrativa ahora es un `Typography` dentro de `StackToolCard`. Si Juan quiere conservar esa regla, hay que agregarla a `54-stack-ssr.ts` (se puede leer `narrative` del doc ya descargado) en 54-16 o en la verificacion de fase.
- La decision queda anotada en `deferred-items.md`.

## Authentication Gates

Ninguno. No se leyo `.env`, no se escribio en la base, no se empujo la rama ni se toco el preview o la app `web`.

## Supuesto A7 (rol de solo lectura del preview)

Sin comprobar en este plan: la rama no se empuja aqui y el preview sigue en el SHA `5fa327d`, sin leer todavia `home_page*` ni `about_page*` con el codigo nuevo. En 54-16, tras el despliegue de `juantech-preview`, hay que revisar por SSH los logs del contenedor y confirmar 0 lineas `permission denied` y 0 `does not exist`, y que la home y `/sobre-mi` sirven contenido sembrado. Si aparece `permission denied`, el `GRANT SELECT ON ... TO juantech_preview_ro;` lo corre Juan (comprobacion: `SELECT has_table_privilege('juantech_preview_ro','home_page','SELECT'), has_table_privilege('juantech_preview_ro','about_page','SELECT');`). Esta segunda mitad suma lecturas nuevas que tambien deben pasar: `websites`, `testimonials`, `clientes` (conteo), `featured-content` y el doc `home` de `pages`.

## Lo que la autoprueba no puede probar

- Las lecturas reales de Payload (`getHomeSites`, `getHomeClientCounts`, `getHomeTestimonials`, `getHomeLegacyBlocks`, `getCtaData`) necesitan la base; la autoprueba usa la forma ya mapeada. En particular, que `featuredWebsites` traiga de verdad los cinco o menos sitios, que `clientes.websiteUrl` llegue poblada con `populate` y que el doc `home` de produccion conserve los tres bloques en los dos idiomas se revisa contra el preview en 54-16.
- El aislamiento por lector (`getHomeSectionsB` nunca lanza) se cubre por diseno (cada lector captura) y por las pruebas de seccion nula; no se simulo una base caida.
- Solape, contraste y foco visible a 375, 900 y 1280 px (criterios `backstop` de UI-SPEC), el desplazamiento horizontal real del bloque de codigo y el aspecto de las figuras de Sobre mi quedan para el preview en 54-16.

## Known Stubs

Ninguno. Las rutas de datos son reales; los textos de prueba viven solo en `scripts/verify/54-home-b-ssr.ts`.

## Threat Flags

Ninguno nuevo. T-54-57 (todo texto y el codigo del CMS entran como hijo de Typography; la autoprueba comprueba el escape), T-54-58 (repo y commit con solo http o https; enlaces externos con `noopener noreferrer` y sufijo), T-54-59 (`overrideAccess: false` y `select` minimo en websites, testimonials y conteo de clientes; `featured-content` se lee sin esa opcion por la excepcion documentada en `cache.ts`), T-54-60 (un lector por seccion, sin 500) y T-54-61 (puntajes y fecha de Payload, nunca del sandbox) quedan mitigados como en el plan.

## Issues Encountered

- `npx eslint` no esta instalado en el proyecto (no hay `eslint.config.*`); el intento hizo que `npx` ofreciera descargarlo y fallo sin tocar el repo. El control de calidad de este plan fue `tsc`, la autoprueba y el build.
- El HTML de `ContactForm` (dentro de `CtaSection`) incluye el marcador `javascript:throw ...` que React 19 emite para todo formulario con action; la autoprueba lo descuenta antes de buscar `javascript:`.

## Next Phase Readiness

- La home esta completa y la rama ya se puede empujar: 54-16 empuja `feat/mui-redesign`, espera el redeploy de `juantech-preview` y resuelve el supuesto A7.
- Los requisitos PAG-* no se marcan: los verifica la fase.

## Self-Check: PASSED

- Archivos verificados en disco (doce creados, dos modificados).
- Commits `2aedeb2`, `1dde954` y `ac1a442` presentes en `git log`; `git rev-list --count` desde `plan_head_before` da 3.
