# Phase 54: Páginas de conversión y utilidad - Research

**Researched:** 2026-11-07
**Domain:** Port de páginas MUI (sandbox) a Payload 3.85 sobre Next 15.4.11, con una base de datos compartida entre producción y preview (migraciones solo aditivas), rutas duales de servicios, 404 real dentro del shell, rich text Lexical en MUI y Sobre mí como página nueva que no puede filtrarse a live
**Confidence:** MEDIUM-HIGH (código, datos públicos y contratos HIGH; comportamiento de despliegue y de la base compartida MEDIUM porque no se pudo ejecutar contra la DB desde esta sesión, ver Assumptions Log)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Origen de los componentes y de los datos**
- Los componentes MUI se portan desde el sandbox `designs/design-system-mui/src/components/{home,site}` a `src/components/`. Se conserva su marcado, sus tokens y sus estados.
- Se eliminan los datos del sandbox (`src/data/*`). Cada página es un Server Component que lee por Local API (con `overrideAccess: false` y `select`, como el footer tras el fix WR-08) y pasa props tipadas al componente de vista.
- Si un campo que la vista necesita no existe en Payload, se agrega con migración solo aditiva. Nada de datos hardcodeados del sandbox en el HTML del preview.
- Las lecturas pasan por `src/lib/cache.ts` con tags de `src/lib/cache-tags.ts`, y los `afterChange` revalidan esos tags (mismo patrón que Header y Footer).

**Home (PAG-01)**
- Todas las secciones del sandbox (Hero, Vitals, Tagline, Services, Process, Cases, Sites, Testimonials, LogoMarquee, About, Faq) salen de la colección Pages y de los globals.
- Los shaders y animaciones respetan el contexto de movimiento de la fase 53 (`useMotion`, `data-motion`).
- Juan edita un campo en el admin real y el cambio aparece en el preview dentro de 60 a 120 s (mismo criterio D-12 de la fase 53).

**Servicios, landings y búsqueda (PAG-02, PAG-12)**
- Índice y detalle usan la colección de servicios actual. Se conservan las URLs duales (`/servicios` y `/services`) con `src/lib/service-slugs.ts` y el `pathnames` de next-intl.
- Las landings SEO técnico Lima y Madrid conservan su contenido y su schema JSON-LD, solo cambian la capa visual.
- La búsqueda conserva su lógica de consulta actual y devuelve resultados reales. Solo se reemplaza la vista.

**Sobre mí (PAG-06)**
- Página nueva con migración solo aditiva (colección o campos nuevos en Pages para timeline y foto). Sin `DROP`, sin reforma de columnas.
- El timeline usa `@mui/lab` Timeline (única pieza beta autorizada en la fase 53).
- La foto nueva sube a Cloudinary vía Media con un script de `scripts/db/` que primero corre `04-which-database.ts` y escribe contra la base de producción. No aparece en el sitio live antes del corte porque `master` no contiene la ruta ni el código.

**Contacto y Stack (PAG-07, PAG-08)**
- Contacto conserva `src/app/actions/contact.ts` (Resend, honeypot, compuertas de `PREVIEW_READONLY`). En el preview el envío responde éxito simulado; el correo real se prueba una vez contra producción en la fase 57. La FAQ pasa al acordeón MUI con roles nativos.
- Stack muestra los logos de herramientas con los enlaces `/go/[slug]` existentes, `rel="sponsored noopener"` y la divulgación de afiliación visible antes de los enlaces.

**Privacy, Terms y 404 (PAG-09, PAG-11)**
- Privacy y Terms usan `LegalPage` con índice lateral sticky que colapsa en móvil, anclas por `id` de encabezado y `aria-labelledby`. El texto sale de Payload tal cual está hoy; la actualización de infraestructura la decide Juan en la fase 56.
- La 404 vive en `src/app/(frontend)/[locale]/not-found.tsx` dentro del shell. Para que la URL inexistente devuelva estado 404 real y no 200, se agrega un catch-all `[...rest]/page.tsx` que llama a `notFound()`.

**Contenido pendiente**
- Los marcadores `{{pendiente}}` del sandbox (fecha de aprendoclub, stack de Arianna Lupi, datos de Loops Growth, fecha legal, testimonios) no se inventan. Si la fase 54 los necesita, se renderizan como están en Payload y la fase 56 los cierra.
- Voz y tono del copy nuevo según la memoria del proyecto: encabezados y meta títulos sin puntos ni comas, se habla de Juan y no de una agencia, tono de experto que enseña. No se escribe copy nuevo sin que venga del sandbox aprobado o de Payload.

**Accesibilidad y verificación**
- Se sigue `A11Y.md` y `designs/design-system-mui/A11Y-DECISIONS.md`. Un solo `main` (lo pone el layout), un `h1` por página, jerarquía h2 y h3 sin saltos.
- Cada página nueva suma comprobaciones a `scripts/verify/` (contrato HTML por ruta y locale, noindex intacto, `rel="sponsored"` en Stack, estado 404 real) y se corren contra `dev.juan-tech.com` tras cada despliegue. El crawl de paridad de la fase 53 se reutiliza para confirmar que ninguna URL actual cambia de estado.
- El preview sigue en solo lectura (`PREVIEW_READONLY`). Los cambios de base de datos se hacen únicamente con migraciones aditivas y scripts verificados con `04-which-database.ts`.

### Claude's Discretion
Nombres de archivos, estructura interna de `src/components/`, orden de las olas, partición en planes, y el diseño exacto de los campos nuevos de Payload siempre que sean aditivos.

### Deferred Ideas (OUT OF SCOPE)
- Casos, websites, blog y autores: fase 55.
- Cierre de `{{pendiente}}`, CTAs aprobados y texto legal de infraestructura: fase 56.
- Retiro de Tailwind y de componentes viejos, y el correo real de Contacto contra producción: fase 57.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAG-01 | La home muestra todas sus secciones con datos de Pages y globals | Mapa campo a campo de la home (sección "Mapa de datos"), global nuevo `homePage` con contenido "sombra", reuso de Clientes, FeaturedContent, Websites y Testimonials, hallazgo de que el sandbox omite 3 bloques que hoy están en la home live |
| PAG-02 | Servicios (índice y detalle) se renderizan desde Payload | No existe colección Services: los servicios son docs de `pages` con slug en `SERVICE_SLUGS`. Composición por ranuras sobre los bloques reales, rutas gemelas `servicios/` y `services/` |
| PAG-06 | Sobre mí con timeline y foto nueva, página nueva, migración aditiva | Global nuevo `aboutPage` (no un doc de Pages, porque `sitemap-data.ts` publicaría la URL en live), `@mui/lab` 9.0.0-beta.10, script de foto con orden de seguridad |
| PAG-07 | Contacto conserva formulario (Resend, honeypot) y su FAQ en MUI | Contrato exacto del server action (`company_website`, `?sent=`), FAQ compartida desde `homePage.faq`, campos del sandbox que la acción hoy ignora |
| PAG-08 | Stack con logos y enlaces `/go` con divulgación | `toolStack` no tiene campo de logo, `AffiliateLink` ya fija el `rel`, diferencia `nofollow` frente a CONTEXT |
| PAG-09 | Privacy y Terms con índice lateral | Lexical sin `id` en encabezados, TOC desde el JSON, mismo `MuiRichText` que reusará la fase 55 |
| PAG-11 | 404 en el shell con estado 404 real | Medido en producción: URL sin ruta da 404 sin shell (página por defecto de Next); docs de Next: 200 si la respuesta se transmite en streaming; catch-all más script de estado |
| PAG-12 | Landings Lima y Madrid y búsqueda en MUI | El sandbox no tiene vista de landing local ni de búsqueda: se componen con piezas del sandbox. Filtro `isPlaceholder` obligatorio. Consulta de búsqueda actual documentada |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Base de datos única: `DATABASE_URI` apunta a Postgres de producción en Dokploy. Antes de escribir o migrar corre `node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts`. Si el host no es el de Dokploy, parar.
- Migraciones aditivas y escrituras normales de contenido corren sin pedir confirmación. `DROP COLUMN`, `DROP TABLE`, `TRUNCATE`, `delete` o reformas con pérdida de datos exigen que Juan lea el SQL y apruebe por nombre. Genera con `payload migrate:create` y lee el SQL antes de aplicar. `push: false`.
- Stack fijado: `next` 15.4.11, `payload`/`@payloadcms/*` 3.85.2, `graphql` ^16.
- Frontend: seguir A11Y.md (WCAG 2.2 AA) y `designs/design-system-mui/A11Y-DECISIONS.md`.
- Entregables escritos: sin guiones largos ni cortos, voz de Juan, encabezados y meta títulos sin puntos ni comas. Cadenas de UI en `messages/{es,en}.json`.
- Arrancar trabajo de archivos por un comando GSD (`/gsd:execute-phase`).
- Producción despliega solo al mergear a `master`. El preview se valida contra `dev.juan-tech.com`, no contra local.
- Memoria operativa: el clasificador bloquea que Claude levante el relay o el `ssh -L`. Juan corre `./scripts/db/tunnel.sh` y `./scripts/db/dev-tunneled.sh`. Scripts contra Payload: `fallbackLocale: false` al decidir si escribir, `draft: false` en todo `update` de colecciones con borradores, contar con `grep -o | wc -l`, esperar el TTL de 60 s, verificar contra el HTML servido.
- Proyecto sin skills propios con patrones de código (`.claude/skills/` solo trae `react-doctor` y `ui-ux-pro-max`).

## Summary

El trabajo no es "portar 12 componentes". El riesgo central es que **preview y producción leen las mismas filas**. El sandbox aprobado tiene copy distinto del que sirve live (h1 de la home, FAQ, vitals, pasos del proceso, línea de tiempo con cinco etapas frente a las tres de Authors, puntajes de PageSpeed del 6 de noviembre frente a los del 14 de julio en Websites). Si el plan reescribe campos existentes, **cambia producción**. Además, el admin real (`master`) no conoce los campos nuevos, así que Juan no los puede editar ahí hasta el corte. La regla que ordena todo el resto: **contenido sombra aditivo**. Todo lo que el diseño nuevo necesita y que difiere de live vive en campos, globals o colecciones nuevos que `master` ignora, y ningún campo existente se sobrescribe.

Tres hallazgos cambian el plan respecto a CONTEXT. **Primero**, `src/lib/sitemap-data.ts` enumera cada doc publicado de `pages` y arma la URL desde el slug, así que un doc de Pages `sobre-mi` publicado aparecería en el `sitemap.xml` live en menos de 15 minutos como URL que devuelve 404. Sobre mí tiene que vivir en un global propio (o en una colección que el sitemap no recorra), no en Pages. **Segundo**, no existe una colección de servicios: los servicios son docs de `pages` con slug en `SERVICE_SLUGS`, armados con bloques (`hero`, `content`, `serviceScopeCard`, `faq`...). La vista MUI tiene que componerse desde esos bloques por ranuras, no desde un modelo `Service` plano como el del sandbox. **Tercero**, el sandbox no trae vista de búsqueda ni de landing local, y omite tres bloques que hoy están en la home live (`codeFixesBlock`, `auditOfferBlock`, `auditorHighlight`), con riesgo directo para SEO-03 (no reducir contenido indexable). Esas tres cosas necesitan una decisión de Juan o un UI-SPEC antes de planificar la ola de la home.

El resto es mecánico y conocido: copias MUI paralelas de los bloques (no editar en sitio, porque la fase 55 todavía usa los de Tailwind), un renderizador Lexical a MUI con `id` en encabezados que comparten fases 54 y 55, un catch-all más `not-found.tsx` para la 404 con verificación de estado HTTP, una migración aditiva con orden estricto (migrar primero, desplegar después, porque el preview lee con rol de solo `SELECT`), y scripts `54-*` que reusan el esqueleto de los `53-*`.

**Primary recommendation:** Construir cada vista MUI como Server Component que lee por una capa cacheada (`src/lib/cache.ts`) y pasa props tipadas a un componente cliente; guardar todo el copy nuevo en dos globals privados aditivos (`homePage`, `aboutPage`) y en dos columnas nuevas (`clientes.onDark`, logo de herramienta en `toolStack`); copiar los bloques a un registro MUI paralelo; migrar la base antes de empujar el código; y no tocar ningún campo ni doc existente de producción.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Lectura de Pages, globals, Clientes, Websites, Testimonials | API / Backend (Local API en Server Component, capa `unstable_cache`) | Database / Storage | El SDK de Payload no puede llegar al bundle cliente. Misma disciplina que `src/lib/cache.ts` |
| Vistas MUI (acordeones, timeline, marquesina, formularios) | Browser / Client (componentes `'use client'`) | Frontend Server (SSR de Emotion por `AppRouterCacheProvider`) | Emotion y los handlers necesitan cliente. El texto de los acordeones tiene que salir en el HTML SSR |
| Composición de ranuras de una página de servicio | Frontend Server | none | Decide qué bloque va en qué ranura antes de cruzar la frontera servidor a cliente con props serializables |
| Renderizado Lexical y TOC | Frontend Server (convertidores JSX) | Browser (scrollspy del índice) | El árbol de nodos se recorre en servidor para sacar `id`s y el índice; solo el resaltado del activo es cliente |
| 404 con estado real | Frontend Server (catch-all más `not-found.tsx`) | none | El estado HTTP lo fija el servidor. Un componente cliente no puede |
| URLs duales de servicios | Frontend Server (carpetas gemelas más helpers puros) | Browser (selector de idioma) | Ya resuelto por `service-slugs.ts` |
| Envío de contacto | API / Backend (server action) | Browser (validación y estados) | La acción ya existe, no se reescribe |
| Búsqueda | API / Backend (`payload.find` sobre `search`) | Browser (formulario GET sin JS necesario) | Consulta actual se conserva |
| Foto y logos | CDN / Static (Cloudinary vía Media) | Database (fila de `media`) | Sin disco local en producción |
| Contenido sombra (copy nuevo) | Database / Storage (globals nuevos) | API / Backend | Aditivo, invisible para `master` |

## Standard Stack

### Core (ya instalado, no cambia)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@mui/material` | 9.5.0 | Componentes y tema | Instalado en la fase 53 [VERIFIED: package.json `"@mui/material": "9.5.0"`] |
| `@mui/material-nextjs` | 9.5.0 | `AppRouterCacheProvider` | Instalado en la fase 53 [VERIFIED: package.json] |
| `@emotion/react` / `@emotion/styled` / `@emotion/cache` | 11.14.0 / 11.14.1 / 11.14.0 | Motor de estilos | Instalados [VERIFIED: package.json] |
| `payload` y `@payloadcms/*` | 3.85.2 | CMS, Local API | Línea fijada por CLAUDE.md [VERIFIED: package.json] |
| `next` | 15.4.11 | App Router | Límite de `@payloadcms/next` [VERIFIED: package.json `"next": "15.4.11"`] |
| `next-intl` | ^4.13.1 | `useTranslations`, `getTranslations`, `getLocale` | Ya en uso [VERIFIED: package.json] |
| `lucide-react` | ^1.24.0 | Iconos (siempre `aria-hidden`) | Ya en uso [VERIFIED: package.json] |
| `playwright` | ^1.61.1 | Verificación de navegador | Ya en devDependencies, Chromium en caché local [VERIFIED: package.json; `ls ~/Library/Caches/ms-playwright`] |

### Nuevo (un solo paquete)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@mui/lab` | 9.0.0-beta.10 | Solo `Timeline`, `TimelineItem`, `TimelineSeparator`, `TimelineDot`, `TimelineConnector`, `TimelineContent` | Solo en la vista de Sobre mí. Única pieza beta autorizada en la fase 53 |

`@mui/lab@9.0.0-beta.10` declara `peerDependencies`: `'@mui/material': '^9.5.0'`, `react ^17 || ^18 || ^19`, `'@emotion/react': '^11.5.0'`, `'@emotion/styled': '^11.3.0'`, `'@mui/material-pigment-css': '^9.5.0'` [VERIFIED: `npm view @mui/lab@9.0.0-beta.10 peerDependencies`]. Compatible con el 9.5.0 instalado. Es el `latest` del registro y se publicó el 2026-10-09 [VERIFIED: `npm view @mui/lab dist-tags`, `time.modified` 2026-10-12]. El sandbox lo usa con `Timeline position="right"` en `components/site/AboutPage.tsx` y compiló con Next 15.5.29. Falta confirmar que compila con 15.4.11 (A5).

En v9 los props de sistema desaparecen de los componentes de Timeline: todo va por `sx` [CITED: github.com/mui/material-ui v9.2.0 `docs/data/material/migration/upgrade-to-v9/upgrade-to-v9.md`, vía Context7]. El sandbox ya usa `sx`.

**Installation:**
```bash
npm install @mui/lab@9.0.0-beta.10
# Antes (checkpoint): npm view @mui/lab@9.0.0-beta.10 version dist.integrity repository.url scripts.postinstall
# Después: npm audit (revisar que no agregue avisos nuevos) y next build con la ruta de Sobre mí
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@mui/lab` Timeline | `Stepper` de `@mui/material` o una lista propia con `Box` | Evita el paquete beta, pero se aparta del diseño aprobado y de la decisión bloqueada. Solo como plan B si `@mui/lab` rompe el build en 15.4.11 |
| Global nuevo para Sobre mí | Doc de `pages` con bloques nuevos | **Descartado**: `sitemap-data.ts` lo publicaría en live (ver Pitfall 1) |
| Global nuevo para copy de la home | Bloques nuevos intercalados en el doc `home` de Pages | Reescribe el doc live y reordena `_order`. Mucho más riesgo que un global aislado |

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@mui/lab` | npm | Paquete de años, versión `9.0.0-beta.10` publicada 2026-10-09 | 3.43M/sem | github.com/mui/material-ui | SUS (`too-new`, por la fecha de la versión) | Aprobado con checkpoint: es el paquete oficial de MUI, el sello mide la antigüedad de la versión y no del paquete |

**Packages removed due to [SLOP] verdict:** ninguno
**Packages flagged as suspicious [SUS]:** `@mui/lab` [WARNING: flagged as suspicious por `too-new`. Verificar antes de instalar]. El planner inserta una tarea `checkpoint:human-verify` antes del `npm install` que muestre `npm view @mui/lab@9.0.0-beta.10 version dist.integrity repository.url scripts.postinstall` y `npm audit`. `postinstall` es `null` [VERIFIED: `gsd-tools query package-legitimacy check --ecosystem npm @mui/lab`, señales `postinstall: null`, `repoUrl: git+https://github.com/mui/material-ui.git`, `weeklyDownloads: 3427995`]. El nombre viene de la decisión bloqueada de CONTEXT y de `designs/design-system-mui/package.json`, no de una búsqueda web.

## Mapa de datos: sandbox contra Payload

Esta es la sección que el planner usa para decidir qué campos faltan. Convención de la columna Estado: **Existe** (hay campo con ese dato), **Derivable** (se calcula de datos existentes sin escribir), **Falta** (hace falta campo nuevo aditivo).

### Principio de contenido sombra (ver Pitfall 1)

Tres hechos medidos en esta sesión sostienen el principio:

1. `home` en producción tiene este layout: `hero > clientLogosBlock > codeFixesBlock > featuredCaseStudiesBlock > servicesShowcase > auditorHighlight > aboutSection > auditOfferBlock > contactFormBlock` [VERIFIED: `GET https://juan-tech.com/api/pages?where[slug][equals]=home&locale=es`]. El sandbox tiene otro orden y otras secciones.
2. El h1 live de la home es "Construyo software rápido y hago que se encuentre en Google"; el del sandbox es "Arreglo el SEO desde el código" [VERIFIED: HTML de `https://juan-tech.com/`; `designs/design-system-mui/src/components/home/Hero.tsx`].
3. Producción corre `master`, que no declara los globals ni los campos nuevos, así que el admin real no los muestra [VERIFIED: `src/payload.config.ts` de esta rama es la única que los tendrá; ASSUMED que master no los declara porque la rama no se ha fusionado, ver A1].

Consecuencia para el planner: pasar a `Payload.update` sobre un doc existente solo para "poner el copy nuevo" **cambia producción**. Los datos nuevos van a globals y colecciones nuevos. Las lecturas de los globals nuevos usan `findGlobal` **sin** `overrideAccess: false` (ver Pitfall 6) y no declaran `access.read` abierto, así que `GET /api/globals/home-page` responde 403 en live y el copy sin aprobar no se filtra por la API pública.

### Home (PAG-01)

Fuente de verdad del diseño: `designs/design-system-mui/src/components/home/*.tsx` y `src/data/home.ts`.

| Sección sandbox | Datos que usa | Fuente Payload hoy | Estado | Acción |
|---|---|---|---|---|
| Hero | eyebrow, h1 con salto de línea, lead, CTA "Pedir auditoría 360" a `#contacto`, estadística "+406 %" con leyenda, retrato ASCII | Bloque `hero` (variant `home`): `title`, `subtitle`, `media` (id 65), `links`. Sin `eyebrow`, sin estadística propia | Falta (copy distinto del live) | Global `homePage.hero`: `eyebrow`, `titleLine1`, `titleLine2`, `lead`, `ctaLabel`, `ctaHref`, `statValue`, `statCaption`. Todos localizados salvo `ctaHref`. El retrato ASCII es un activo estático del diseño (`src/data/asciiGrid.ts`, 2 líneas), no contenido: se porta como módulo estático (A9) |
| LogoMarquee | 25 logos con `file`, `alt`, `w`, `h`, `dw`, `dh`, `onDark` | Colección `clientes` (28 docs): `name`, `logo` (upload), `websiteUrl`, `workType`, `featured`. Título "Con quiénes trabajé" en `clientLogosBlock.title` [VERIFIED: API pública] | Existe, falta `onDark` | Leer `clientes` con `logo.url`, `logo.alt`, `width`, `height`. Tamaño en pantalla: derivado de `width`/`height` con tope y sin ampliar (regla del sandbox). Columna aditiva `clientes.onDark` (checkbox). Valores de `onDark` copiados del `logos.ts` del sandbox por nombre normalizado (A8) |
| Tagline | frase de ~30 palabras | No existe | Falta | `homePage.tagline` (textarea localizado) |
| Vitals | 4 lecturas (LCP, CLS, TBT, TTFB) con valor, barra g/m/p, marcador, nota, etiqueta, texto de medición | No existe. `websites.lighthouse` guarda puntajes 0 a 100, no estas métricas | Falta | `homePage.vitals`: `title`, `lead`, `measurementNote` (localizados) y `items[]`: `name`, `desc`(l), `value`, `goodPct`, `midPct`, `poorPct`, `markerPct`, `note`(l), `ariaLabel`(l). Cifras medidas el 6 de noviembre de 2026 vienen del sandbox: se cargan por script, no se inventan |
| Services | 5 tarjetas: `icon`, `title`, `body`, `tags[]`, `href` opcional | Bloque `servicesShowcase` (solo `title`) más 4 docs `pages` de servicio. Dos de las 5 tarjetas del sandbox ("Infraestructura y servidores", "Rendimiento web") no tienen página | Falta | `homePage.services`: `title`, `lead`, `ctaLabel` y `items[]`: `icon` (select), `title`(l), `body`(l), `tags[]`, `servicePage` (select con `SERVICE_SLUGS`, opcional). El href se construye con `buildServiceHref(locale, slug)` |
| Cases | 3 casos: `slug`, `tag`, `num` ("+406 %"), `title` | `featured-content.featuredCaseStudies` con `populate` de `title`, `slug`, `sector`, `heroMetric`, `client` [VERIFIED: `src/lib/cache.ts:66-104`] | Derivable con costura | `heroMetric` en Payload es una sola cadena: `"+406% clics interanuales"`. El sandbox separa número y etiqueta. `sector` trae una raya larga entre sector y subsector (por ejemplo `Salud`, raya, `Urología`), que el sandbox escribe con coma. Hace falta `splitHeroMetric()` puro (regex sobre `^([+\-−]?\d[\d.,]*\s?%)\s*(.*)$`, con caída a la cadena entera para `"0 → 56 clics"`). Alternativa limpia: campos nuevos en CaseStudies, pero eso es de la fase 55 (PAG-03), coordinar |
| Process | 4 pasos con `icon`, `title`, `body` | No existe | Falta | `homePage.process`: `title`, `steps[]` |
| Sites | 5 sitios con `domain`, `name`, `category`, `image`, `scores`, `tech[]` | `featured-content.featuredWebsites` más colección `websites` (6 docs): `title`, `industry`, `stack[].tag`, `lighthouse{performance,accessibility,bestPractices,seo}`, `lighthouseCapturedAt`, `screenshots[].image` | Existe, con datos distintos | Renderizar lo que hay en Payload. Los puntajes del sandbox (Apturio 96/100/100/100) no coinciden con Payload (83/90/73/100 al 2026-07-14) y "Loops Growth" no existe. **No actualizar `websites` en la fase 54** (cambia live y es de la fase 55/56). `juan-tech-com` trae los cuatro puntajes en `null`: la tarjeta tiene que ocultar el anillo cuando el valor es `null` |
| About | h2, 2 párrafos, 2 contadores (15 y 13), 5 chips, 3 fotos con `alt` y pie | Bloque `aboutSection`: `eyebrow`, `title`, `paragraphs[]`, `photo`, `features[]`. Contadores: la agrupación de `clientes` por `workType` ya da `SEO 15` y `Desarrollo 13` en live | Parcial | Contadores derivables de `clientes` (conteo por `workType`). Texto, chips y 3 fotos: `homePage.about` con `title`, `paragraphs[]`, `chips[]`, `photos[]` (`media`, `alt` localizado, `caption` localizado). Las 3 fotos se suben a Media por script (ver Sobre mí) |
| Testimonials | 3 ranuras: 1 real y 2 con `{{testimonio}}` | Colección `testimonials` con 1 doc (`Patricia Ibarra`, `CEO`, `Estylopia`) [VERIFIED: API pública] | Existe | Mostrar solo lo que haya. **Nunca renderizar las ranuras de muestra.** Con 1 testimonio la rejilla de 3 columnas tiene que degradar a 1 tarjeta. Título "Clientes que trabajaron conmigo": `homePage.testimonials.title` |
| Faq | 5 preguntas y respuestas en texto plano | No existe en la home (existe el bloque `faq` con `answer` Lexical en otras páginas) | Falta | `homePage.faq[]`: `question`(l), `answer`(l, textarea). Se comparte con Contacto (el sandbox usa la misma lista en ambas) |
| CtaSection / CtaPanel | h2 "Hablemos de tu sitio", lead, correo, "Copiar correo", formulario | `contact` Page: `contactFormBlock.contactInfo[]` con `icon: 'mail'`, `href: 'mailto:hello@juan-tech.com'`. El correo ya es público en el HTML de live [VERIFIED: `grep` sobre `https://juan-tech.com/` da `hello@juan-tech.com`] | Parcial | Correo desde `contactInfo` del doc `contact`. Título y lead: `homePage.cta`. Avatar: `authors.avatar` (media id 66). El formulario del panel tiene que usar `sendContactMessage` (ver Contacto) |

**Secciones que existen en live y no están en el sandbox:** `codeFixesBlock` ("Errores reales, con el commit que los corrige", 3 arreglos con código y commit), `auditOfferBlock` (oferta de auditoría con `price`, `includes[]`) y `auditorHighlight` ("Construí mi propio auditor SEO"). CONTEXT lista once secciones y no las incluye. Quitarlas de la home reduce contenido indexable (SEO-03) y rompe la lógica de la oferta que la memoria del proyecto fija como "bloque central = fixes del repo público". Va a Open Questions como bloqueo de la ola de la home.

### Servicios (PAG-02)

No hay `Services`. El doc de índice es `pages` con slug `services` y cada servicio es `pages` con uno de los slugs de `SERVICE_SLUGS`:

```ts
export const SERVICES_INDEX_SLUG = 'services' as const
export const SERVICE_SLUGS = [
  'seo-technical-audit',
  'seo-consulting',
  'fullstack-development',
  'ai-seo-geo',
] as const
```
[VERIFIED: src/lib/service-slugs.ts:9 y 22-27]

Layout real de un servicio: `hero > content > serviceScopeCard > callToAction > content > (auditorCallout solo en seo-technical-audit) > clientLogosBlock > testimonialsCarousel > relatedCaseStudyBlock > faq > callToAction` [VERIFIED: `GET /api/pages?where[slug][equals]=<slug>` para los cuatro slugs, ES]. Índice: `hero > content (4 pares h2 + párrafo, columnas half) > callToAction`.

| Elemento del sandbox `ServiceDetail` | Fuente en el doc real | Estado |
|---|---|---|
| `title`, `lead` | `hero.title`, `hero.subtitle` | Existe |
| Aside "Alcance de este trabajo" (`scope.includes`, `scope.achieves`, `scope.time`) | `serviceScopeCard.scope`, `.outcome`, `.timeline`, título en `.title` | Existe |
| `problemTitle` y `problem[]` | Primer `content`: H2 y párrafos Lexical | Existe, dentro de rich text |
| `includes[]` (tarjetas con check) y `how[]` (pasos numerados) | Segundo `content`: dos columnas, cada una con H3 ("Qué incluye", "Cómo trabajo") y párrafos | Existe como párrafos, no como lista. Fidelidad parcial: ver Open Question 3 |
| `cta.label`, `cta.text` | `callToAction.links[0].link.label`, `callToAction.richText` | Existe |
| `extras` (tarjeta del auditor con enlaces) | `auditorCallout` (`heading`, `narrative`) solo en `seo-technical-audit` | Existe |
| Caso real | `relatedCaseStudyBlock` (`title`, `framingText`, `caseStudy`) | Existe |
| Testimonio | `testimonialsCarousel` con colección `testimonials` | Existe |
| Preguntas | `faq.faqs[]` (`question`, `answer` Lexical) | Existe |
| "Otros servicios" | Derivable de `SERVICE_SLUGS` menos el actual, título y `timeline` de cada doc | Derivable |

Índice (`ServicesIndex`): tarjetas = 4 docs de servicio (`title`, descripción del índice, `timeline`). Tabla comparativa "Qué servicio es para ti": `title`, primer H2 del primer `content` (el "te sirve si"), `serviceScopeCard.outcome` y `.timeline`, **todo derivable**. Los encabezados de columna son texto de interfaz y van a `messages`.

Las cuatro landings no tienen cambios de datos. Conservan el JSON-LD `Service` más `BreadcrumbList` (índice: `ItemList` más `BreadcrumbList`) [VERIFIED: tipos `ld+json` en el HTML live de `/servicios`, `/servicios/seo-technical-audit`, `/en/services/seo-consulting`].

### Landings Lima y Madrid (PAG-12)

Slugs y metadatos: `LOCAL_LANDINGS = [{ slug: 'seo-tecnico-lima', city: 'Lima', country: 'PE' }, { slug: 'seo-tecnico-madrid', city: 'Madrid', country: 'ES' }]` y el segmento de URL no cambia por idioma [VERIFIED: src/lib/local-landing-slugs.ts]. Layout: `hero (variant local-landing, cityName, inlineStat, ringSide, ringFlipX) > localProofSection > content > faq > callToAction` [VERIFIED: API pública]. El sandbox **no tiene vista de landing local**: se compone con `PageHero` (estadística en `inlineStat`), tarjetas de estadísticas, prosa MUI y FAQ. El único dato estructurado actual es `Service` [VERIFIED: HTML live de `/seo-tecnico-lima`] y se conserva con `buildLocalService`.

**Filtro obligatorio:** el doc live trae `"[PLACEHOLDER] Testimonio real pendiente"` en `localProofSection.testimonial.quote` y estadísticas con marcador. `src/lib/placeholder.ts` define `const MARKER = '[PLACEHOLDER]'` con `isPlaceholder`/`withoutPlaceholders`, y `LocalProofSectionComponent` filtra y devuelve `null` si no queda nada. La copia MUI tiene que usar los mismos helpers. Si no, los marcadores llegan al preview y a Google [VERIFIED: src/lib/placeholder.ts; src/blocks/LocalProofSection/Component.tsx].

### Sobre mí (PAG-06)

| Elemento del sandbox `AboutPage` | Fuente hoy | Estado |
|---|---|---|
| Hero: eyebrow, `Juan Carlos Angulo`, lead, chips (Lima, idiomas), foto `juan-sobre-mi.webp` (1122x1402, 80 KB) con `alt` borrador | `authors` (juan-carlos-angulo): `name`, `jobTitle`, `avatar` (id 66, retrato pequeño). La foto nueva no existe en Media | Falta foto y chips |
| Bio (2 párrafos) | `authors.bio` (un `textarea` localizado) | Existe, mismo texto |
| Contadores (4+ años, 15, 13) | `authors.yearsExperience` es `null` en live. 15 y 13 salen del conteo de `clientes` | Parcial |
| Áreas de especialización (4 con `title` y `detail`) | `authors.expertise[].topic` (4, un solo texto, sin `detail`) | Falta `detail` |
| Experiencia (5 etapas con `when` textual, `role`, `org`, `body`, `current`, `link`) | `authors.experience[]`: `company`, `role`, `startDate`, `endDate`, `description` (3 filas en live: aprendoclub, AprendoSEO, Cripto Avances) | **Distinto**: las 5 etapas del sandbox incluyen Loops Growth y una fecha `{{pendiente}}` que no cabe en un campo `date` |
| Educación (2) | `authors.education[]`: `degree`, `institution`, `startDate`, `endDate` (2 filas, mismos datos) | Existe |
| Ponencias (2, con imagen) | Colección `speaking-events` (2 docs). Ninguno tiene `flyer` [VERIFIED: API pública] | Existe sin imagen |

Escribir las 5 etapas en `authors.experience` cambiaría `/authors/juan-carlos-angulo` y su JSON-LD `Person` en live. **No se toca Authors.** El timeline vive en `aboutPage.stages[]` (`when` como texto localizado, `role`, `org`, `body`, `current`, `link{label, href}`). Educación y ponencias se leen de `authors` y `speaking-events` (datos idénticos, sin duplicar). Las imágenes de las ponencias del sandbox no se escriben en `speaking-events` (cambiaría la página de autor live): si Juan las quiere, van en `aboutPage.talkImages[]` con relación al evento (Open Question 6).

### Contacto (PAG-07)

Contrato real del formulario, leído del código:

```ts
const honeypot = String(formData.get('company_website') ?? '').trim()
const locale = String(formData.get('locale') ?? 'es')
const redirectBase = locale === 'en' ? '/en/contact' : '/contact'
```
[VERIFIED: src/app/actions/contact.ts:73-75]. El sandbox llama al honeypot `company` y valida solo en cliente (`useState`, `preventDefault`). Hay tres desajustes que el port tiene que resolver:

1. **Nombre del honeypot:** el formulario MUI debe enviar `company_website` y el campo `locale` oculto, o la acción no descarta el spam ni sabe a qué página volver.
2. **Estado:** la acción responde con `redirect(`${redirectBase}?sent=true|false`)` y la página lee `searchParams.sent`. El port conserva ese patrón (un `<form action={sendContactMessage}>` real, mejora progresiva) y pinta `role="status"` o `role="alert"` según `sent`. El `onSubmit` cliente solo agrega validación previa y sale temprano sin llamar a la acción cuando falta algo. Leer `searchParams` hace dinámica la página, como ya ocurre hoy.
3. **Campos que la acción ignora:** el sandbox agrega `service` (select) y `website`. La acción solo lee `name`, `email`, `message`. Si el formulario los muestra, hay que ampliar la acción para incluirlos en el cuerpo del correo (cambio de código, no de base de datos) o quitarlos. Es una decisión de producto (Open Question 7).

El panel `CtaPanel` (home, servicios, Sobre mí) **también** trae un formulario y no tiene honeypot. Tiene que compartir el mismo componente de formulario y la misma acción.

El FAQ de Contacto ("Antes de escribir") no existe en el doc `contact` live (solo trae `contactFormBlock`). Agregar un bloque `faq` a ese doc haría que live pinte un FAQ en Tailwind. Se lee de `homePage.faq` (mismo contenido que el sandbox).

En el preview `isPreviewReadonly()` corta con `redirect(`${redirectBase}?sent=true`)` después de validar [VERIFIED: contact.ts:92-94, `if (isPreviewReadonly()) {` seguido de `redirect(...?sent=true)`]. El criterio 4 del ROADMAP dice "envía el correo real con Resend". En el preview eso no ocurre por diseño (solo lectura y sin `RESEND_API_KEY`), así que la verificación de la fase 54 es de código y de éxito simulado, y el envío real queda en la fase 57, como fija CONTEXT.

### Stack (PAG-08)

Bloque `toolStack`: `intro`, `categoryGroups[].heading`, `categoryGroups[].tools[]` con `name`, `affiliateLink` (relación a `affiliate-links`), `narrative`, `pro`, `con`, `referenceLink{type, caseStudy, url}`; más `gearIntro`, `gearItems[]` (`name`, `href`), `elegiriaHoy`, `noCommissionPick`, `auditorHighlight.narrative` [VERIFIED: src/blocks/ToolStack/config.ts]. **No hay campo de logo.** El sandbox usa `public/img/stack/<nombre>.webp` (9 archivos de 0,8 a 14 KB: ahrefs, cloudinary, dataforseo, digitalocean, dinorank, hostinger, kinsta, payload, resend).

| Elemento sandbox | Fuente | Estado |
|---|---|---|
| Logo por herramienta | Ninguna | Falta |
| "Cómo lo uso", "Lo bueno", "Lo no tan bueno" | `narrative`, `pro`, `con` | Existe |
| "Dónde lo usé" (casos) | `referenceLink` | Existe |
| Chip "Enlace de afiliado" o "Sin programa de afiliados" | `resolveAffiliateCta(...)` devuelve `active`, `pending` o `none` | Existe |
| Botón con `rel="sponsored noopener"` | `AffiliateLink` fija `rel` | Existe, con diferencia (abajo) |
| Aviso de afiliados visible antes de los enlaces | `AffiliateDisclosureFrame`/`AffiliateDisclosure`, ya con `role="note"` | Existe |

Opciones para el logo:
- **A (recomendada):** columna aditiva `logo` (upload a `media`, nullable) en `categoryGroups.tools[]`, subida de los 9 `.webp` a Cloudinary por script, y escritura de cada `logo` con una actualización del doc `stack` que compare antes y después y confirme que ningún otro campo cambia. Live no pinta el logo (el `ToolCard` viejo ignora la columna). Riesgo: es una escritura a un doc live con bloques localizados (ver Pitfall 8).
- **B (fallback sin escritura a docs existentes):** servir los 9 archivos desde `public/img/stack/` con el nombre normalizado de la herramienta (`normalizeToSlug` ya existe en `ToolCard.tsx`). Cero riesgo en base de datos, pero el logo no se edita desde el admin.

**Diferencia con CONTEXT:** CONTEXT fija `rel="sponsored noopener"`. El código actual es `rel="sponsored nofollow noopener"` [VERIFIED: src/components/AffiliateLink.tsx, `<a href={href} target="_blank" rel="sponsored nofollow noopener" ...>`]. La verificación debe exigir `sponsored` (que cumple ambos) y la decisión de quitar `nofollow` no se toma en esta fase: se conserva el valor de producción. Los enlaces CTA ya apuntan a `/go/<slug>` (`resolveAffiliateCta` devuelve `'/go/' + value.slug`). Los `gearItems[].href` apuntan directo a Amazon.

### Privacy y Terms (PAG-09)

Cada doc (`privacy`, `terms`) es un único bloque `content` con H2 numerados ("1. Información que Recopilamos"...) [VERIFIED: API pública, HTML live]. No tienen JSON-LD. El sandbox arma el índice desde un JSON propio (`buildToc` sobre bloques `h2`) y `PostBody`, que no existen en el repo real y son de la fase 55. En el repo real el texto es Lexical, y el convertidor por defecto de encabezados no agrega `id` (A11). El índice sale recorriendo `root.children` del JSON, con el mismo `slugify` y el mismo deduplicado que el convertidor, para que las anclas coincidan. La línea "fecha de última actualización" del sandbox es `{{pendiente}}` y Payload no tiene ese dato: no se renderiza nada (estado vacío honesto) y la fase 56 decide el campo (Open Question 8).

### 404 (PAG-11)

Sin datos. Texto de interfaz a `messages`. Enlaces sugeridos (Servicios, Casos de éxito, Blog, Contacto) con `buildServicesIndexHref(locale)` y rutas con prefijo de idioma.

### Búsqueda (PAG-12)

Sin datos nuevos. Ver "Búsqueda" en Architecture Patterns.

## Architecture Patterns

### System Architecture Diagram

```
Visita -> Cloudflare -> Traefik -> contenedor del preview (rama feat/mui-redesign, PREVIEW_READONLY=true)
   |
   v middleware (Edge): /es/* 308 | next-intl rewrite | X-Robots-Tag
   |
   v (frontend)/[locale]/layout.tsx  [raiz html: Providers MUI, SiteHeader, <main id="main-content">, SiteFooter]
   |
   +-- page.tsx (home) ---------------> getHomeData(locale) --+--> global home-page (sombra, privado)
   |                                                          +--> pages:home (solo meta y titulo, y bloques legacy si Juan los conserva)
   |                                                          +--> clientes, featured-content, testimonials, authors
   +-- servicios/ y services/ ---------> getServicePage / getServicesIndexPage (cache) -> composicion por ranuras
   +-- servicios/[slug], services/[slug] -> muiBlockComponents (registro paralelo) + ranura de alcance en el hero
   +-- seo-tecnico-lima|madrid --------> getLocalLandingPage -> PageHero + LocalProof(filtro placeholder) + MuiRichText + Faq
   +-- search/ ------------------------> payload.find('search') (force-dynamic) -> SearchView (form GET)
   +-- sobre-mi/ ----------------------> getAboutData(locale) -> global about-page + authors.education + speaking-events
   +-- contact/ -----------------------> doc contact (contactInfo) + homePage.faq -> ContactView -> sendContactMessage (server action)
   +-- stack/ -------------------------> doc stack (toolStack) -> StackView (logos, /go, aviso de afiliados)
   +-- privacy/, terms/ ---------------> doc content -> LegalView (MuiRichText con ids + Toc)
   +-- [...rest]/page.tsx -------------> notFound() ----> not-found.tsx (dentro del layout, shell completo)

Lecturas: Server Component -> src/lib/cache.ts (unstable_cache, TTL 60 s, tags) -> Payload Local API -> rol juantech_preview_ro (SELECT)
Escrituras de contenido nuevo: solo scripts/db/NN-*.ts (Juan, via tunel), tras 04-which-database.ts, siempre aditivas
```

### Recommended Project Structure

```
src/
├── components/
│   ├── mui/                      # primitivos compartidos por las fases 54 y 55
│   │   ├── Section.tsx PageHero.tsx Crumbs.tsx CtaPanel.tsx ContactForm.tsx
│   │   ├── GrainBlob.tsx IconTile.tsx TechChips.tsx ScoreRing.tsx
│   │   ├── lists.tsx             # UL y OL con reset explicito (ver Pitfall 5)
│   │   ├── rich-text/            # MuiRichText.tsx, lexical-toc.ts, Toc.tsx
│   │   └── blocks/               # copias MUI de los bloques y registro paralelo muiBlockComponents
│   ├── home/                     # HomeView y secciones (Hero, Vitals, Tagline, Services, Process, Cases, Sites, About, Testimonials, LogoMarquee, Faq)
│   └── pages/                    # ServicesIndexView, ServiceDetailView, LocalLandingView, AboutView, ContactView, StackView, LegalView, SearchView, NotFoundView
├── globals/HomePage/ y AboutPage/ # globals sombra, privados, con afterChange que revalida su tag
├── lib/home-data.ts about-data.ts # lectores cacheados (fachada sobre src/lib/cache.ts)
├── app/(frontend)/[locale]/
│   ├── not-found.tsx
│   ├── [...rest]/page.tsx
│   ├── sobre-mi/page.tsx
│   └── (paginas existentes reescritas, div en vez de main)
└── migrations/                   # 1 migracion aditiva por frente (globals, clientes.on_dark, tool logo)
scripts/
├── db/20-*.ts ...                # carga de contenido sombra y fotos (Juan, via tunel)
└── verify/54-*.mjs               # contratos de la fase
```

### Pattern 1: Lectura cacheada con tag propio
**What:** Cada global nuevo tiene un fetcher en `src/lib/cache.ts` (`unstable_cache`, clave `[slug, locale]`, `revalidate: CACHE_TTL_SECONDS`, tag en `CACHE_TAGS`) y un `afterChange` de global que llama `safeRevalidateTag` y `safeRevalidateAllPaths`, copia exacta de `revalidateHeaderCache`.
**When to use:** `homePage` y `aboutPage`.
**Example:**
```ts
// Source: src/lib/cache.ts:125-134 (getCachedHeader) y src/lib/cache-tags.ts:179-183
export function getCachedHomePage(locale: Locale) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config })
      return payload.findGlobal({ slug: 'home-page', depth: 1, locale })
    },
    ['home-page', locale],
    { tags: [CACHE_TAGS.homePage()], revalidate: CACHE_TTL_SECONDS },
  )()
}
```
**Por qué sin `overrideAccess: false`:** ver Pitfall 6.

### Pattern 2: Composición por ranuras con caída a renderizado genérico
**What:** `ServiceDetailView` recibe `layout` y saca por `blockType` los bloques con ranura propia (`hero` al encabezado, `serviceScopeCard` al aside del hero, primer `content` a "problema", `auditorCallout`, `relatedCaseStudyBlock`, `faq`, último `callToAction`). Todo bloque sin ranura se renderiza en orden con el registro MUI genérico.
**When to use:** páginas de servicio, índice, landings locales.
**Por qué:** los editores del admin pueden reordenar o agregar bloques sin romper la página, y ningún texto se pierde (SEO-03). Evita parsear Lexical para "adivinar" listas.
**Anti-patrón que evita:** un adaptador que busque el H3 "Qué incluye" por texto; falla en inglés ("What's included") y con cualquier cambio de redacción.

### Pattern 3: Registro MUI paralelo, sin editar los bloques actuales
**What:** `src/components/mui/blocks/` con copias MUI de `hero`, `content`, `faq`, `callToAction`, `serviceScopeCard`, `relatedCaseStudyBlock`, `clientLogosBlock`, `testimonialsCarousel`, `auditorCallout`, `localProofSection`, `contactFormBlock`, `toolStack`, y `muiBlockComponents` con el mismo contrato que `blockComponents` (`src/blocks/blockRegistry.tsx`). `RenderBlocks` acepta un registro opcional.
**Por qué:** `Content`, `FAQ`, `CallToAction` y `Hero` también los usan blog, casos y websites (fase 55). Editarlos en sitio reestila esas páginas a medias y arriesga regresiones de estado HTTP. El precedente es la fase 53: `shell/` nuevo, viejo se borra en la fase 57.
**Excepción:** el registro actual es la única fuente de qué `blockType` existe. No duplicar una cadena `switch` (el comentario del archivo lo prohíbe).

### Pattern 4: Servidor que lee, cliente que pinta
**What:** la página (Server Component) llama al fetcher, normaliza a props serializables (ids, textos, urls, números) y pasa a una vista `'use client'`. Nada del documento de Payload cruza la frontera salvo lo que la vista usa. Mismo patrón que `SiteHeader` más `HeaderView` [VERIFIED: src/components/shell/SiteHeader.tsx].
**Para el rich text:** el árbol Lexical se convierte a JSX **en servidor** (`MuiRichText` Server Component con convertidores a `Typography`, `Link`, listas) y se pasa a la vista como `ReactNode`. Los acordeones reciben nodos ya renderizados.

### Pattern 5: 404 dentro del shell
**What:** `src/app/(frontend)/[locale]/not-found.tsx` (vista MUI, `getLocale()` de next-intl, `metadata` con título propio) y `src/app/(frontend)/[locale]/[...rest]/page.tsx` con `export const dynamic = 'force-dynamic'` que llama `notFound()` de forma síncrona.
**Evidencia de por qué hace falta:** hoy `/pagina-inexistente`, `/en/foo` y `/blog/x/y/z` devuelven 404 con unos 5,3 KB y el texto "404: This page could not be found." sin shell (página por defecto de Next), mientras `/servicios/nope` devuelve 404 con 36 KB (el layout sí envuelve el `notFound()` de una página) [VERIFIED: `curl` contra `https://juan-tech.com` el 2026-11-07]. El catch-all hace que cualquier ruta sin página caiga dentro del layout y se vea el shell.
**Estado HTTP:** la documentación de Next dice que `not-found` devuelve "`200` HTTP status code for streamed responses, and `404` for non-streamed responses" [CITED: github.com/vercel/next.js v15.5.28 `docs/01-app/03-api-reference/03-file-conventions/not-found.mdx`, vía Context7]. Hoy todas las 404 de producción responden 404 [VERIFIED: curl]. Para no pasar a 200: no agregar `loading.tsx` ni `Suspense` por encima de la página, llamar `notFound()` antes de cualquier `await` en el catch-all, y verificar el estado con `54-notfound-status.mjs` en el preview. `force-dynamic` evita que cada URL basura que pida un bot cree una entrada en la caché ISR.
**Precedencia:** carpetas estáticas ganan a `[slug]`, y este gana a `[...rest]`. `/blog/a/b/c` (3 segmentos) hoy ya es 404 y seguirá siéndolo.
**Casos que el middleware reescribe:** `/index.html` y `/foo.php` entran por el matcher (SEO-39), pasan a `/es/index.html` y ahora caen en el catch-all en lugar de depender del 404 por defecto.

### Pattern 6: Búsqueda (conservar consulta, reemplazar vista)
**Consulta actual:** `payload.find({ collection: 'search', locale, pagination: false, where: { or: [{ title: { like: query } }, { 'meta.title': { like: query } }, { 'meta.description': { like: query } }, { slug: { like: query } }] } })`, con `query = q?.slice(0, 200)` y fallo a un estado de error [VERIFIED: src/app/(frontend)/[locale]/search/page.tsx]. El plugin indexa `posts`, `case-studies` y `authors` [VERIFIED: src/payload.config.ts `collections: ['posts', 'case-studies', 'authors']`]; no indexa `pages`, así que los servicios no aparecen en resultados. La colección `search` ya tiene `read: ()=>true` por defecto del plugin [VERIFIED: node_modules/@payloadcms/plugin-search/dist/Search/index.js:54-58], así que se puede agregar `overrideAccess: false`, `depth: 0` y `select` sin romper la lectura (A12). El `href` de un post necesita `getCachedPostCategoryMap` porque el índice solo guarda el slug del post. Se conserva `export const dynamic = 'force-dynamic'`, `robots: { index: false, follow: true }` y los textos `copy` (hoy dentro del archivo) pasan a `messages`.
**Vista MUI (no hay diseño en el sandbox):** `h1`, `<form role="search" method="get">` con `TextField type="search" name="q"` y botón, conteo `aria-live="polite"`, resultados en `ul` de `Card` con `Chip` de tipo ("Artículo", "Caso de éxito", "Autor") y enlace estirado en el título (patrón de tarjeta clicable de A11Y-DECISIONS), estado vacío y estado de error. Pide UI-SPEC o decisión de Juan sobre la composición.

### Pattern 7: URLs de Sobre mí
**Recomendación:** misma ruta en ambos idiomas, `/sobre-mi` y `/en/sobre-mi`. Coincide con el sandbox aprobado (que sirve `/en/sobre-mi`), con el precedente de las landings locales (`/en/seo-tecnico-lima`) y no requiere ampliar `normalizeServiceHref`. La alternativa `/sobre-mi` más `/en/about` obliga a carpetas gemelas, un helper de segmentos duales para selector de idioma, header, footer y sitemap, y `buildAlternates` con rutas distintas. Decisión de URL y de SEO: confirmar con Juan (A4).

### Anti-Patterns to Avoid
- **Editar en sitio `src/blocks/*/Component.tsx`:** reestila páginas de la fase 55 y de blog. Usar el registro paralelo.
- **Escribir copy nuevo en campos existentes de `pages`, `authors`, `websites`, `speaking-events`:** cambia producción.
- **Crear el doc `sobre-mi` en Pages:** aparece en el sitemap live. Usar global.
- **Usar `overrideAccess: false` en un global sin `access.read`:** lanza y la ruta responde 500 (ya ocurrió con la home, ver Pitfall 6).
- **`<main>` dentro de las vistas:** el layout posee el único `main`. Las páginas renderizan `div`.
- **`unmountOnExit` en los acordeones:** quita las respuestas del HTML (SEO-03). Dejar el comportamiento por defecto.
- **Portar `body.paused` y `@media (prefers-reduced-motion)` con `animation: none` del sandbox:** contradice la elección explícita de reanudar (SC 2.2.2). Ver Pitfall 4.
- **Hardcodear en el componente cualquier texto que salga del sandbox:** o va a Payload (contenido) o a `messages` (interfaz).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slugs y hrefs duales de servicios | Tabla nueva | `buildServiceHref`, `buildServicesIndexHref`, `normalizeServiceHref`, `isServiceSlug` de `src/lib/service-slugs.ts` | Ya cubre `/servicios` frente a `/en/services` y es módulo puro apto para cliente |
| Decidir si un href lleva prefijo | Regex nueva | `isPrefixableHref` de `src/i18n/navigation.ts` | Cubre absolutas, `//`, `mailto:`, `#` y `/en/...` |
| Sanear hrefs escritos en el CMS | Validación propia | `sanitizeHref` y `resolveLinkHref` de `src/lib/nav-links.ts` | Rechaza caracteres de control (WR-06). Aplica a `aboutPage.stages[].link.href` y `homePage.hero.ctaHref` |
| Filtrar marcadores `[PLACEHOLDER]` | `if` en cada vista | `isPlaceholder`, `withoutPlaceholders` de `src/lib/placeholder.ts` | Los datos live aún los traen |
| Estado del CTA de afiliado | Lógica en la vista | `resolveAffiliateCta` de `src/lib/affiliate-cta.ts` | Mantiene `/go/<slug>`, `pending` y `none` (GSC) |
| JSON-LD | Armar `<script>` a mano | `JsonLd`, `buildServiceJsonLd`, `buildServicesIndexJsonLd`, `buildLocalService`, `buildBreadcrumbJsonLd`, `buildTrail`, `buildSitePerson`, `buildWebSite`, `buildProfessionalService` | Ya se emiten y SEO-01 exige que queden idénticos |
| Metadatos, canonical, hreflang, OG | Reescribir `generateMetadata` | `getServicesIndexMetadata`, `getServiceMetadata`, `buildAlternates`, `buildServiceAlternates`, `buildOpenGraph`, `pageTitle` | Una sola definición para las rutas gemelas |
| Cadena de revalidación | Hook propio | `safeRevalidateTag`, `safeRevalidateAllPaths` y el patrón de `revalidateHeaderCache` | Los scripts standalone no tienen contexto de request |
| Lexical a JSX | Parser propio | `RichText` de `@payloadcms/richtext-lexical/react` con convertidores propios que mapeen a `Typography` | El árbol de nodos y los convertidores de bloque (`code-block`, `faq`) ya existen en `richTextBlockConverters.tsx` |
| Índice de la página legal | Scroll manual | Recorrer `root.children` por `heading` h2 más `IntersectionObserver` para el activo (patrón de `blog/Toc.tsx` del sandbox) | El resaltado es solo refuerzo |
| Trampa de foco y Escape | Foco manual | `Accordion`, `Drawer`, `Menu` de MUI | A11Y.md lo exige y ya funciona |
| Subida de la foto | `fetch` a Cloudinary | `payload.create({ collection: 'media', filePath })` con el adaptador | Mismo camino que `scripts/spike-cloudinary-upload.ts` |

**Key insight:** casi todo el valor está en reusar piezas con casos de borde ya pagados (slugs duales, placeholders, JSON-LD, overrides de acceso) y en no mover copy hacia campos que producción ya sirve.

## Runtime State Inventory

Fase de construcción, no de renombrado. Aun así comparte estado vivo con producción, y eso es lo que el planner tiene que tratar como inventario:

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | La base `juantech` en `shared-postgres` es la misma para preview y producción. Filas que esta fase agrega: tablas de `home_page` y `about_page` (más locales y arrays), `clientes.on_dark`, columna `logo_id` en `tools` del bloque `toolStack` y su espejo de versiones, filas de `media` (foto de Sobre mí, 3 fotos de la home, 9 logos de stack) | Migración solo aditiva. Datos por script con dry-run y `04-which-database.ts` primero |
| Live service config | Admin de producción corre `master`: no muestra los globals ni los campos nuevos. Header y Footer (globals) viven en la misma base: agregar "Sobre mí" al nav de Header lo muestra en el nav live con un enlace a una URL 404 | No editar Header ni Footer en la fase 54. Resolver el enlace de Sobre mí en el corte de la fase 57 o con una inyección solo-preview (Open Question 5) |
| OS-registered state | Ninguno nuevo. El preview existe desde la fase 53 (app Dokploy `juantech-preview`, rol `juantech_preview_ro`) | Verificado ausencia: el rol ya tiene `SELECT` por defecto sobre tablas futuras de `juantech_user` (A7) |
| Secrets/env vars | El script de foto necesita `CLOUDINARY_*` y `DATABASE_URI` del `.env` de Juan (no se leen en esta sesión). El preview no recibe `RESEND_API_KEY` | Juan corre los scripts con el túnel. Claude no abre el relay |
| Build artifacts | `payload-types.ts` cambia con cada migración (`payload generate:types`). `src/app/(payload)/admin/importMap.js` solo cambia si se agregan componentes de admin (no previsto) | Regenerar tipos tras cada cambio de config |

**Cache de producción:** las escrituras por script no invalidan `unstable_cache`; salen por el TTL de 60 s. Un cambio que no se ve al instante no significa que el script falló.

## Common Pitfalls

### Pitfall 1: Un doc nuevo de Pages se publica en el sitemap live
**What goes wrong:** crear `pages/sobre-mi` publicado agrega `https://juan-tech.com/sobre-mi` y `/en/sobre-mi` al `sitemap.xml` y al `sitemap.html` de producción, que devuelven 404 porque `master` no tiene la ruta.
**Why it happens:** `fetchSitemapEntries` recorre `SITEMAP_COLLECTIONS` con `{ collection: 'pages', prefix: '', hasDrafts: true, group: 'pages' }`, filtra `_status: 'published'` y arma `prefix === '' ? (doc.slug !== 'home' ? doc.slug : '') : `${prefix}/${doc.slug}`` [VERIFIED: src/lib/sitemap-data.ts:60 y 187-188]. El resultado se cachea 900 s.
**How to avoid:** Sobre mí vive en el global `aboutPage` (el sitemap no recorre globals). Nunca crear docs nuevos publicados en `pages` antes del corte. La ruta se agrega al sitemap en la fase 57 o se deja al código del sitemap.
**Warning signs:** un `curl https://juan-tech.com/sitemap.xml | grep -o sobre-mi | wc -l` distinto de 0 antes del corte.

### Pitfall 2: Código desplegado antes que la migración
**What goes wrong:** el preview empuja código que lee `home_page` o `logo_id` y la tabla o columna no existe. Peor que una página rota: cada lectura de `pages` selecciona de las tablas de bloques, así que un bloque nuevo registrado sin migrar rompe **todas** las páginas.
**Why it happens:** `push: false` y el rol del preview es de solo lectura; nada crea el esquema por su cuenta.
**How to avoid:** orden fijo: (1) `payload migrate:create`, (2) leer el SQL y confirmar que no hay `DROP`/`ALTER ... TYPE`, (3) Juan corre `04-which-database.ts`, abre el túnel y aplica, (4) comprobar lectura con el rol del preview, (5) recién entonces empujar la rama. Los campos nuevos nacen nullable. Para revertir, empujar el commit anterior no revierte la base y no hace falta.
**Warning signs:** 500 en `/` del preview justo después del despliegue, `relation "home_page" does not exist` en los logs de Dokploy.

### Pitfall 3: Tablas nuevas sin `SELECT` para el rol del preview
**What goes wrong:** la migración crea tablas con un rol distinto de `juantech_user` y el preview responde `permission denied`.
**Why it happens:** el rol `juantech_preview_ro` recibe `SELECT` sobre tablas futuras solo a través de `ALTER DEFAULT PRIVILEGES FOR ROLE juantech_user` [VERIFIED: .planning/phases/53-.../53-06-PLAN.md:140].
**How to avoid:** aplicar la migración con el `DATABASE_URI` de la app (`juantech_user`). Después de aplicar, hacer `SELECT 1 FROM home_page LIMIT 1` como el rol del preview (paso manual de Juan) o simplemente cargar la home del preview.

### Pitfall 4: Movimiento del sandbox contra el contexto de la fase 53
**What goes wrong:** `GrainBlob`, `LogoMarquee` y `Tagline` del sandbox usan `body.paused` y `@media (prefers-reduced-motion: reduce) { animation: 'none' }`. Con la fase 53, el estado vive en `html[data-motion]` y el script inicial ya pone `paused` si el sistema pide menos movimiento. Esa media query deja las animaciones muertas aunque la persona pulse "reanudar".
**How to avoid:** en el port, borrar `'body.paused &'` (el `GlobalStyles` de `Providers.tsx` ya pausa `*` con `html[data-motion='paused']`) y borrar el `animation: 'none'` bajo `prefers-reduced-motion`. `Tagline` y `Hero` (que llama `window.matchMedia(...)` directo) tienen que leer `useMotion()` de `@/theme/motion`. Precedente: WR-01 "el shader del hero respeta la decisión explícita de reanudar".
**Warning signs:** con `data-motion="running"` y el SO en movimiento reducido, la marquesina no se mueve.

### Pitfall 5: Las listas dependen del reset de Tailwind
**What goes wrong:** el sandbox declara `'ul, ol': { listStyle: 'none', margin: 0, padding: 0 }` en `CssBaseline`; el tema del repo **lo quitó** a propósito (la capa `mui` aplastaría `list-disc` del contenido heredado). Hoy el reset sale del preflight de Tailwind. Cuando la fase 57 retire Tailwind, todas las `Box component="ul"` ganarían viñetas.
**How to avoid:** los primitivos `UL` y `OL` de `src/components/mui/lists.tsx` llevan el reset en su propio `sx`. Prohibir `component="ul"` suelto en las vistas nuevas. Las listas dentro de `MuiRichText` sí llevan viñetas explícitas.

### Pitfall 6: `overrideAccess: false` rompe los globals sin `access.read`
**What goes wrong:** CONTEXT pide `overrideAccess: false` en las lecturas. Para un global sin `access.read` abierto, Payload lanza y la ruta responde 500.
**Evidence:** `getCachedFeaturedContent` documenta que "overrideAccess:false here throws instead of returning empty" y, en la línea siguiente, "this broke Home in production (HTTP 500) until this fix" [VERIFIED: src/lib/cache.ts:82-83]. `getCachedHeader` y `getCachedFooter` lo omiten por la misma razón.
**How to avoid:** `homePage` y `aboutPage` no tienen `versions`/borradores, así que no hay estado que filtrar. Se leen **sin** `overrideAccess: false` (excepción documentada, igual que Header y Footer) y sin `access.read` abierto, de modo que la API pública de live responda 403 y no exponga copy sin aprobar. `overrideAccess: false` queda para colecciones con borradores (`pages`, `posts`, `case-studies`) y para `search`, `clientes`, `testimonials`, `speaking-events`, `authors` (todas con `read: () => true`).

### Pitfall 7: Los acordeones ocultan el texto del HTML
**What goes wrong:** si una respuesta del FAQ no está en el HTML inicial, baja el contenido indexable. El FAQ actual usa `<details>/<summary>`, que deja todo en el DOM.
**How to avoid:** `Accordion` de MUI mantiene `AccordionDetails` montado por defecto. No pasar `slotProps.transition.unmountOnExit`. Verificar con `curl` que la última respuesta del FAQ aparece en el HTML (A6).

### Pitfall 8: Escribir en un doc live con bloques localizados
**What goes wrong:** actualizar el doc `stack` o `contact` para agregar un campo nuevo reescribe el array de bloques. Escribir el array con ids primero en el locale secundario falla, un `update` sin `draft: false` **despublica** el doc, y leer el valor inglés devuelve el español por el fallback.
**How to avoid:** orden inglés primero y español después (cabecera de `scripts/db/09-newsletter-block.ts`); `draft: false` en todo `update`; `fallbackLocale: false` cuando la lectura decide si escribir; dry-run con diff antes y después que exija que solo cambie el campo nuevo; verificar contra el HTML servido, no contra el "OK" del script. Si el diff no queda limpio, caer en la opción B (archivos estáticos) para el logo.

### Pitfall 9: Datos con `null`, uno y cero
**What goes wrong:** `juan-tech-com` tiene los cuatro puntajes Lighthouse en `null`; Testimonials tiene 1 doc; `clientes` incluye un `image/x-icon` sin `width`/`height`; `heroMetric` incluye `"0 → 56 clics"` y `"+68%"` sin etiqueta.
**How to avoid:** cada vista tiene estado vacío, uno y muchos. `ScoreRing` no se pinta con `null`. La rejilla del testimonio único no deja columnas vacías. Un logo sin dimensiones usa un tamaño por defecto con `object-fit: contain`. `splitHeroMetric` cae al texto completo.

### Pitfall 10: Imágenes pesadas del sandbox
**What goes wrong:** `escritorio.png` pesa 1,9 MB (`taller.jpg` 194 KB, `retrato-v2.jpg` 131 KB). Subirlo tal cual castiga LCP en la home.
**How to avoid:** convertir a WebP antes de subir (con `sharp`, ya instalado) y usar `next/image` o la URL de Cloudinary con `f_auto,q_auto`. Declarar `width` y `height` para evitar CLS.

### Pitfall 11: La fase 55 necesita las mismas piezas
**What goes wrong:** blog (fase 55) necesita `MuiRichText`, `Toc` y `slugify`. Si las dos fases corren en paralelo y cada una escribe la suya, hay dos renderizadores Lexical.
**How to avoid:** la fase 54 es dueña de `src/components/mui/rich-text/*` y los publica en una ola temprana. Registrar en el plan la dependencia de la fase 55 sobre esa ola.

### Pitfall 12: El selector de idioma y el nav no conocen Sobre mí
**What goes wrong:** `/sobre-mi` con la misma ruta en ambos idiomas funciona con `LanguageSwitcher` sin cambios. Con rutas distintas, `normalizeServiceHref` no las traduce. Y el global Header de producción no tiene el enlace.
**How to avoid:** recomendación de misma ruta (Pattern 7). El enlace de nav se decide en Open Question 5.

## Code Examples

### Catch-all de 404 (esqueleto)
```tsx
// src/app/(frontend)/[locale]/[...rest]/page.tsx
// Source: Next.js docs not-found.js (notFound() renderiza el not-found del segmento) + patron de este repo
import { notFound } from 'next/navigation'

// Sin cache ISR: cada URL basura de un bot crearia una entrada.
export const dynamic = 'force-dynamic'

// Sin generateStaticParams con datos ni await: notFound() sale antes de cualquier flush.
export default function CatchAllNotFound(): never {
  notFound()
}
```

### `not-found.tsx` dentro del shell (esqueleto)
```tsx
// src/app/(frontend)/[locale]/not-found.tsx
import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { NotFoundView } from '@/components/pages/NotFoundView'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound')
  return { title: t('metaTitle'), robots: { index: false, follow: false } }
}

export default async function NotFound() {
  const locale = (await getLocale()) as 'es' | 'en'
  return <NotFoundView locale={locale} />
}
```

### Fragmento de global sombra (campos aditivos)
```ts
// src/globals/HomePage/index.ts (fragmento)
// Sin access.read abierto: la API publica de live responde 403. Sin versions: no hay borradores que filtrar.
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  admin: { group: 'Site' },
  hooks: { afterChange: [revalidateHomePageCache] },
  fields: [
    { name: 'hero', type: 'group', fields: [
      { name: 'eyebrow', type: 'text', localized: true },
      { name: 'titleLine1', type: 'text', localized: true },
      { name: 'titleLine2', type: 'text', localized: true },
      { name: 'lead', type: 'textarea', localized: true },
      { name: 'ctaLabel', type: 'text', localized: true },
      { name: 'ctaHref', type: 'text' },
    ] },
    { name: 'faq', type: 'array', fields: [
      { name: 'question', type: 'text', localized: true, required: true },
      { name: 'answer', type: 'textarea', localized: true, required: true },
    ] },
  ],
}
```
Los campos `required` solo aplican a filas nuevas; las tablas nacen vacías, no hay datos que reformar.

### Convertidor Lexical con `id` de encabezado (idea)
```tsx
// Source: patron de Payload RichText converters + slugify del sandbox (blog/postUtils.ts)
// El convertidor de heading recibe el nodo; el id sale del texto plano de sus hijos con el mismo slugify
// y el mismo deduplicado ("-2") que lexical-toc.ts usa para construir el indice.
```

### Verificación de estado 404 y de contrato (comando)
```bash
BASE_URL=https://dev.juan-tech.com node scripts/verify/54-notfound-status.mjs
# Debe imprimir PASS por URL: 404, un <main, un <h1, header y footer con aria-label, noindex
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Props de sistema en `Timeline`, `Stack`, `Box` | `sx` | MUI v9 | Ya respetado por el sandbox. No usar props de sistema |
| 404 por defecto de Next para rutas sin página | `not-found.tsx` por segmento más catch-all, o `global-not-found.js` (experimental) | Next 15.4/15.5 | En 15.4.11 `global-not-found` sigue siendo experimental y exige su propio `<html>`. El catch-all dentro de `[locale]` es la vía estable |
| Chips y tarjetas Tailwind (`Container`, `Card` shadcn) | `Container`, `Card`, `Chip` de MUI | Fase 53 | Las vistas nuevas no importan `@/components/ui` |

**Deprecated/outdated:**
- `MotionProvider` viejo (LazyMotion `strict`): se queda hasta la fase 57 para los `m.*` sin migrar.
- `body.paused` del sandbox: reemplazado por `html[data-motion]`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `master` no declara los globals ni campos nuevos, así que el admin real no los muestra, y una fila `payload_migrations` desconocida para `master` no rompe su arranque ni sus lecturas | Mapa de datos, Pitfall 2 | Si `master` ejecutara migraciones al arrancar y fallara ante registros desconocidos, un deploy de emergencia a producción rompería. Probar con Juan: el despliegue de `master` solo hace `npm run build`; `scripts/deploy.sh` menciona `payload migrate` pero no se pudo ver que Dokploy lo llame |
| A2 | `notFound()` desde el catch-all con `force-dynamic` devuelve 404 y no 200 en 15.4.11 (los docs dicen 200 si la respuesta se transmite) | Pattern 5 | La 404 sería "suave" (200). Mitigación: `54-notfound-status.mjs` falla si el estado no es 404, y la solución sería quitar cualquier `Suspense`/`loading` por encima o fijar el estado en middleware |
| A3 | `payload.find` sobre `search` con `depth: 0` conserva `doc.relationTo` | Pattern 6 | La vista de resultados perdería el tipo. Probar contra el preview antes de fijar `depth: 0`; si falla, dejar `depth` por defecto |
| A4 | URL de Sobre mí igual en ES y EN (`/sobre-mi`, `/en/sobre-mi`) | Pattern 7 | Si Juan quiere `/en/about`, hay que agregar carpetas gemelas, helper de segmentos duales y rutas distintas en `buildAlternates` |
| A5 | `@mui/lab@9.0.0-beta.10` compila con Next 15.4.11 | Standard Stack | El sandbox compiló con 15.5.29. Si falla, plan B con `Stepper` o lista propia |
| A6 | `Accordion` de MUI deja el texto de los paneles cerrados en el HTML servido | Pitfall 7 | Se pierde contenido indexable. Verificar con `curl`; si falla, renderizar con `<details>` o montar siempre |
| A7 | Las migraciones corren como `juantech_user` y el rol del preview hereda `SELECT` | Pitfall 3 | El preview da 500 con `permission denied`. Se ve en la primera carga |
| A8 | El mapeo de `onDark` entre `logos.ts` del sandbox y los `clientes` de Payload se puede hacer por nombre normalizado (`money-com.webp` con `money.com`, etc.) | Home | Un logo claro sin chip oscuro queda invisible sobre la franja clara. Revisar el mapeo de los 25 a mano antes de aplicar |
| A9 | El retrato ASCII de la home (`src/data/asciiGrid.ts`) cuenta como activo de diseño y no como "dato del sandbox" que CONTEXT manda eliminar | Home | Si Juan lo considera dato, hay que generarlo desde Media. Confirmar |
| A10 | Juan tiene `CLOUDINARY_*` en su `.env` local para correr el script de fotos | Runtime State Inventory | Sin credenciales, subir por el admin real (Media sí existe en `master`) y enlazar el id por script |
| A11 | El convertidor Lexical por defecto no agrega `id` a los encabezados | Privacy y Terms | Si lo agregara, el índice y las anclas podrían duplicarse. Revisar la salida real |
| A12 | `overrideAccess: false` sobre `clientes`, `testimonials`, `speaking-events`, `authors` no lanza (todas con `read: () => true`) | Pitfall 6 | Una lectura lanzaría 500. Leído `authors` y `speaking-events` (`read: () => true`); `clientes` y `testimonials` se confirmaron por API pública anónima (devuelven datos). `search` confirmado en el plugin |
| A13 | Los datos medidos del sandbox (vitals y puntajes del 6 de noviembre de 2026) son correctos y Juan los aprueba como contenido | Home | Si no, la home muestra métricas sin respaldo. Son de la fase 56 (contenido de Juan) pero la fase 54 las necesita para renderizar |

## Open Questions

1. **¿La home conserva `codeFixesBlock`, `auditOfferBlock` y `auditorHighlight`?** (bloquea la ola de la home)
   - Qué se sabe: están en el doc `home` live con datos reales; el sandbox y CONTEXT los omiten; SEO-03 prohíbe reducir contenido indexable; la memoria del proyecto dice "bloque central = fixes del repo público".
   - Qué falta: diseño MUI para esas tres secciones.
   - Recomendación: Juan decide antes de planificar. Si se conservan, `/gsd-ui-phase 54` diseña las tres con los componentes del sistema (`Card`, `Chip`, bloque de código) y se portan sin cambiar datos.

2. **¿El copy nuevo de la home (h1, vitals, proceso, FAQ) va a globals sombra?**
   - Qué se sabe: escribir esos textos en `pages/home` cambia producción; el admin real no ve campos nuevos.
   - Recomendación: sí, `homePage` y `aboutPage`, cargados por script. Cada texto sale del sandbox aprobado. Documentado como decisión del plan.
   - Consecuencia: antes del corte Juan edita el copy nuevo con `./scripts/db/dev-tunneled.sh` (admin local de la rama contra la base real). El criterio 1 del ROADMAP ("Juan edita un campo en el admin real") solo se puede demostrar con campos que `master` ya conoce (por ejemplo un testimonio, un cliente o el título de un servicio) o con el admin local.

3. **Fidelidad del bloque "Qué incluye" de los servicios.** El sandbox lo muestra como tarjetas con check; en Payload son párrafos dentro de una columna con H3. Opciones: renderizar párrafos como prosa (fiel a los datos, menos fiel al diseño) o convertir los párrafos de esa columna en tarjetas por convención. Recomendación: prosa primero, tarjetas si Juan pide fidelidad y acepta la convención "cada párrafo bajo H3 es un ítem".

4. **Vista de búsqueda y vista de landing local.** No hay diseño en el sandbox. Recomendación: componer con piezas existentes y pasarlas por UI-SPEC (la fase tiene `UI hint: yes`).

5. **Enlace "Sobre mí" en el nav.** El sandbox lo incluye. Header se lee de la base compartida: agregarlo ahora lo muestra en live con enlace a 404. Opciones: (a) agregarlo en el corte (fase 57), (b) inyectarlo solo cuando `isPreviewReadonly()` en `SiteHeader`. Recomendación: (b) para que Juan recorra la página en el preview, y retirar la inyección en el corte.

6. **Imágenes de las ponencias y alt de la foto.** Ninguna ponencia tiene `flyer`. Escribirlo cambia `/authors/...` live. Recomendación: `aboutPage.talkImages[]` solo si Juan las quiere en Sobre mí. El `alt` de la foto nueva es borrador en `A11Y-DECISIONS.md` ("para que Juan lo confirme"): Juan lo aprueba antes de subirlo.

7. **Campos `service` y `website` del formulario de contacto.** La acción ignora ambos. Recomendación: ampliar la acción para incluirlos en el cuerpo del correo (cambio de código), o quitarlos del formulario MUI. Decide Juan.

8. **Fecha de actualización de las páginas legales.** No existe dato. Recomendación: no renderizar nada en la fase 54 y que la fase 56 decida el campo. Evitar usar `updatedAt` del doc (los scripts de humanización lo modifican).

9. **Contenido en inglés del copy sombra.** El sandbox solo trae español. Con `localization.fallback: true` [VERIFIED: src/payload.config.ts:92-99] las páginas EN muestran el español donde falte el inglés (I18N-01 es v2). Recomendación: sembrar solo ES, dejar el fallback y usar el aviso `TranslationNotice` del sandbox (`role="note"`, `lang="en"`) en `/en/sobre-mi` y en las secciones sin traducir. Juan confirma que el recorrido EN de la fase 54 incluye español en el copy nuevo.

10. **`rel` de los enlaces de afiliado.** CONTEXT: `sponsored noopener`. Producción: `sponsored nofollow noopener`. Recomendación: conservar el de producción y exigir `sponsored` en la verificación.

11. **Duplicidad Sobre mí frente a `/authors/juan-carlos-angulo`.** Bio, educación y ponencias se repetirán en dos URLs. Riesgo de canibalización. Decide Juan en la fase 56/57 (hay material en `research/canibalizacion/`); no bloquea la fase 54.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | scripts, build | ✓ | v24.13.0 | none |
| npm | instalación | ✓ | 11.6.2 | none |
| Playwright + Chromium | scripts de navegador | ✓ | 1.61.x, Chromium 1208/1234/1243 en `~/Library/Caches/ms-playwright` | `curl` para contratos HTML |
| Preview `dev.juan-tech.com` | verificación | ✓ (200, `x-robots-tag` presente) | desplegado desde `feat/mui-redesign` | none |
| Producción `juan-tech.com` | paridad y datos de referencia | ✓ (API pública anónima responde) | `master` | none |
| Túnel a `shared-postgres` | migraciones y scripts `scripts/db/*` | No probado | `./scripts/db/tunnel.sh` (lo corre Juan) | Ninguno: sin túnel no hay migración ni carga de contenido |
| Credenciales Cloudinary en `.env` | subida de fotos | No verificado (no se leen secretos) | n/a | Subir por el admin real y enlazar por script |
| Dokploy `juantech-preview` | despliegue | ✓ (auto al empujar `feat/mui-redesign`) | n/a | none |

**Missing dependencies with no fallback:** el túnel (paso manual de Juan) para migrar y sembrar.
**Missing dependencies with fallback:** credenciales de Cloudinary (admin real).

## Validation Architecture

Omitida: `workflow.nyquist_validation` es `false` en `.planning/config.json`. La verificación vive en `scripts/verify/54-*` y se describe en la siguiente sección.

## Verificación en el preview (scripts `54-*`)

Los scripts de la fase 53 son el patrón: ESM `.mjs`, imprimen `PASS`/`FAIL motivo`, salen con 1 ante cualquier fallo, usan `BASE_URL`/`PREVIEW_BASE`/`PROD_BASE`, cuentan con expresiones globales (nunca `grep -c`, el HTML viene en una línea), y tienen `--selftest` con fixtures válido y defectuosos. Reusar tal cual: `53-wait-preview.mjs` (espera 200 más `noindex` tras el despliegue), `53-crawl-parity.mjs` (estado de cada URL del sitemap live contra el preview), `53-layer-check.mjs` (capas `@layer tailwind, mui`), `53-shell-contract.mjs` (landmarks) y `53-computed-styles.mjs` (secciones `styles`, `motion`, `skip`, `lang`, `overflow`, `drawer`, `focus`). `53-shell-contract.mjs` ya exige exactamente un `<main>` con `id="main-content"` y `tabindex="-1"`, así que cubre el `main` único de cada página nueva.

Scripts nuevos propuestos:

| Script | Qué comprueba | Tipo |
|---|---|---|
| `54-page-contract.mjs` | Para cada ruta y locale: estado 200, un `<h1`, jerarquía h2/h3 sin saltos, `<meta name="robots" ... noindex`, `x-robots-tag`, un `<main`, ausencia de `{{`, `[PLACEHOLDER]` y `lorem`, ausencia de rutas del sandbox (`/img/`, `/logos/`), título, descripción, canonical, hreflang y tipos `ld+json` **iguales a producción** (`PROD_BASE`) en las rutas que ya existen en live | HTML |
| `54-notfound-status.mjs` | URLs inexistentes (`/pagina-inexistente`, `/en/foo`, `/blog/x/y/z`, `/index.html`, `/servicios/nope`, `/en/services/nope`) devuelven **404**, traen header, footer, un `<main` y un `<h1`, y `noindex` | HTTP |
| `54-dual-urls.mjs` | `/servicios` y `/en/services` 200 con canonical propio; `/services` y `/en/servicios` resuelven con canonical al segmento correcto; slugs de `SERVICE_SLUGS` en los dos idiomas | HTTP |
| `54-search.mjs` | `/search` sin `q`: formulario y `h1`; `/search?q=seo` con al menos un resultado real y enlaces válidos; `/search?q=zzzzqx` con estado vacío; `robots` contiene `noindex, follow` | HTML |
| `54-stack-affiliate.mjs` | Cantidad de enlaces `href^="/go/"` igual a cantidad de `rel` que contienen `sponsored`; aviso de afiliados (`role="note"`) aparece **antes** del primer enlace `/go/` en el orden del HTML; ningún enlace Amazon de `gearItems` sin `sponsored` | HTML |
| `54-contact-form.mjs` | Playwright: campos `name`, `email`, `message`, `company_website` (oculto con `aria-hidden` y `tabindex=-1`) y `locale` presentes, etiquetas visibles, `?sent=true` muestra `role="status"` y `?sent=false` muestra `role="alert"`; en el preview el envío vuelve con `sent=true` (simulado). Complementa `53-write-gates.mjs`, que ya audita que el preview no escribe | Navegador |
| `54-faq-ssr.mjs` | La última respuesta de cada FAQ aparece en el HTML sin ejecutar JS (A6, Pitfall 7) | HTML |
| `54-about.mjs` | `/sobre-mi` y `/en/sobre-mi` 200, foto con `alt` no vacío, el timeline es una lista con N elementos, sin desborde a 320 px (`53-computed-styles.mjs` `overflow` como modelo); ausencia en `https://juan-tech.com/sitemap.xml` (`grep -o sobre-mi | wc -l` igual a 0) | HTML y HTTP |
| `54-no-sandbox-data.mjs` | `grep` en `src/` de importaciones de `designs/` y de `@/data/`; ausencia de los textos de ranura (`{{`) en el HTML | Estático |

Orden en cada despliegue: `53-wait-preview.mjs`, `53-layer-check.mjs`, `54-page-contract.mjs`, `54-notfound-status.mjs`, `54-dual-urls.mjs`, `53-crawl-parity.mjs` (ninguna URL actual cambia de estado), el resto según la ola. Para el criterio 1 del ROADMAP: editar un campo que `master` ya conoce (un testimonio o el título de un servicio) en el admin real, esperar 60 a 120 s y recargar el preview; para campos nuevos, usar `./scripts/db/dev-tunneled.sh`.

Comprobaciones que siguen siendo humanas (heredan el patrón de la fase 53): lectores de pantalla en acordeón, timeline y formulario; revisión visual a 900, 1024 y 1280 px; foco no tapado por el header fijo (SC 2.4.11); envío real de Contacto contra producción (fase 57).

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Sin login en estas páginas. El admin sigue bloqueado en el preview |
| V3 Session Management | no | Sin sesiones nuevas |
| V4 Access Control | yes | Globals nuevos privados (sin `access.read` abierto), `overrideAccess: false` solo donde la colección es pública; rol de preview solo `SELECT` |
| V5 Input Validation | yes | Consulta de búsqueda acotada a 200 caracteres; formulario con validación cliente y servidor, honeypot `company_website` y límite por IP existentes; `sanitizeHref` para hrefs escritos en el CMS |
| V6 Cryptography | no | Sin criptografía nueva |
| V10 Malicious code / V14 Config | yes | `@mui/lab` pasa por checkpoint de legitimidad; sin `dangerouslySetInnerHTML` salvo el script de movimiento constante de la fase 53 y `JsonLd` |

### Known Threat Patterns for Next + Payload + MUI

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Fuga de copy sin aprobar por la API pública | Information disclosure | Globals sombra sin `access.read` abierto: `GET /api/globals/home-page` responde 403 en live |
| Fuga de la URL nueva al sitemap live | Information disclosure | Sobre mí en global, nunca en `pages` antes del corte (Pitfall 1) |
| Enlaces del CMS con esquemas peligrosos (`javascript:`, caracteres de control) | Tampering / XSS | `sanitizeHref`, `isPrefixableHref`; `target="_blank"` con `rel="noopener"` |
| XSS desde Lexical | Tampering | Convertidores a elementos React (escapan por defecto); prohibido `dangerouslySetInnerHTML` en `MuiRichText` |
| Inyección de `</script>` en JSON-LD | Tampering | `JsonLd` existente; no armar `<script>` a mano |
| Spam al formulario | Denial of service | Honeypot `company_website`, `isRateLimited` por IP, validación de correo; todo ya en `contact.ts`. Verificar que el orden honeypot antes de la compuerta de preview se conserva |
| Open redirect en `/go` | Spoofing | Destino solo desde `affiliate-links` admin-autorado; la ruta no se toca |
| Enumeración de slugs de afiliado | Information disclosure | `/go/<slug>` inexistente e inactivo devuelven el mismo 404 (ya implementado) |
| Cache poisoning por URLs basura | Denial of service | Catch-all con `force-dynamic` (Pattern 5) |
| Escritura accidental contra la base equivocada | Tampering | `04-which-database.ts` antes de cualquier script; el preview solo lee |
| Migración que pierde datos | Tampering | Solo `CREATE`/`ADD COLUMN`/`ADD VALUE`; leer el SQL; sin `DROP` ni cambio de tipo |

## Sources

### Primary (HIGH confidence)
- Código leído esta sesión: `src/collections/Pages/index.ts`, `src/lib/{service-slugs,services-data,local-landing-slugs,local-landing-data,placeholder,cache,cache-tags,sitemap-data}.ts`, `src/app/actions/contact.ts`, `src/app/go/[slug]/route.ts`, `src/app/(frontend)/[locale]/{layout,page}.tsx` y las rutas `servicios`, `services`, `search`, `stack`, `privacy`, `seo-tecnico-lima`, `contact`, `src/blocks/blockRegistry.tsx`, `RenderBlocks.tsx`, configs y componentes de `ServiceScopeCard`, `ToolStack`, `ContactFormBlock`, `LocalProofSection`, `Content`, `FAQ`, `ClientLogosBlock`, `FeaturedCaseStudiesBlock`, `src/collections/{Authors,SpeakingEvents,Clientes,Websites,Testimonials,AffiliateLinks}`, `src/components/{AffiliateLink,ToolCard,Prose,RichTextRenderer,shell/*}`, `src/theme/*`, `src/middleware.ts`, `src/i18n/*`, `postcss.config.js`, `package.json`, `messages/{es,en}.json` (namespaces), `scripts/verify/53-*`, `scripts/db/04-which-database.ts`, `scripts/db/dev-tunneled.sh`.
- Sandbox leído: `designs/design-system-mui/src/components/{home,site,blog/Toc}`, `src/data/*`, `src/lib/i18n.ts`, `A11Y-DECISIONS.md`, `REPORT.md`, `package.json`, `public/`.
- API pública de producción (anónima, solo lectura): `/api/pages`, `/api/authors`, `/api/speaking-events`, `/api/clientes`, `/api/testimonials`, `/api/websites`, `/api/case-studies`, HTML de `/`, `/servicios`, `/servicios/seo-technical-audit`, `/en/services/seo-consulting`, `/seo-tecnico-lima`, `/search`, `/contact`, `/stack`, `/privacy`, `/terms`, y estados de URLs inexistentes. Preview `https://dev.juan-tech.com/` (nav y footer).
- `npm view @mui/lab`, `gsd-tools query package-legitimacy check`.
- Context7 `/vercel/next.js/v15.5.28` (not-found.js, notFound()) y `/mui/material-ui/v9.2.0` (upgrade a v9, Timeline).

### Secondary (MEDIUM confidence)
- `.planning/phases/53-.../53-RESEARCH.md`, `53-PATTERNS.md`, `53-VERIFICATION.md`, `53-06-PLAN.md` (patrones de capas, preview, privilegios del rol).
- Memoria del proyecto (trampas de scripts, incidente de base equivocada, acceso a producción).

### Tertiary (LOW confidence)
- Ninguna fuente solo de búsqueda web. Las suposiciones están en el Assumptions Log.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, un solo paquete nuevo verificado en registro y en seam de legitimidad, compatibilidad por `peerDependencies`.
- Architecture: MEDIUM-HIGH, patrones tomados del código y de la fase 53; el sombra aditivo es una decisión de diseño que Juan debe confirmar.
- Mapa de datos: HIGH para lo leído de código y de la API pública; los valores del sandbox contra Payload se compararon uno a uno.
- Pitfalls: HIGH para los medidos (sitemap, 404, overrideAccess); MEDIUM para los que dependen del despliegue (A1, A2, A7).

**Research date:** 2026-11-07
**Valid until:** 2026-11-21 (el copy y los datos live cambian con los scripts de contenido de Juan; volver a medir los layouts de las páginas antes de planificar si pasan más de dos semanas)
