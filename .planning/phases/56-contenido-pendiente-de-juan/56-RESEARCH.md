# Phase 56: Contenido pendiente de Juan - Research

**Researched:** 2026-11-10
**Domain:** contenido y texto legal sobre Payload 3.85 (globals sombra, siembra aditiva por script, verificación contra HTML servido)
**Confidence:** HIGH en el inventario y en los mecanismos (leído en el repo y en el HTML servido hoy), MEDIUM en el texto legal (no es asesoría legal), LOW en las opciones del hero B a E y 1 a 3 (no existen en el repo)

Convención de etiquetas de este documento: `[VERIFIED: ruta:líneas]` solo cuando abrí el archivo con Read esta sesión y cito el valor tal cual; `[VERIFIED: curl dev/prod 2026-11-10]` cuando lo leí en el HTML servido hoy; `[CITED: url]` documentación externa; `[ASSUMED]` sin verificar. Las rayas largas y medias de los textos citados se marcan como `<RAYA>` para no reproducirlas.

<user_constraints>
## User Constraints (from CONTEXT.md)

(Copiado de `56-CONTEXT.md`. Único cambio: las rayas de separación se sustituyeron por punto, por la regla de entregables sin rayas.)

### Locked Decisions

**Reglas de oro heredadas (LOCKED)**
- **D-01:** Escrituras a la base SOLO con scripts aditivos o de siembra en `scripts/db/`, con modo dry-run por defecto y bandera explícita para escribir. Antes de escribir se corre `scripts/db/04-which-database.ts`. Claude no abre túnel ni relay y el hook bloquea `--env-file=.env`: cada carga es un `checkpoint:human-action` con comandos exactos, siguiendo el patrón de los planes 54-07 y 55-06 (túnel en terminal A, `DATABASE_URI` sacada con el patrón `ssh ... printenv DATABASE_URI | sed`, nunca tecleada a mano, pre-flight que imprime `127.0.0.1 15432 /juantech`, salida pegada como evidencia). **Reversibility:** costly. La base es la de producción y no hay sandbox.
- **D-02:** `dev.juan-tech.com` comparte la base con producción. Todo contenido que `master` ya sirve hoy (privacy, terms, mensajes, campos existentes) NO se sobrescribe en caliente: o va a campos/globals sombra que solo lee la rama del rediseño, o se carga en el momento del corte. Nunca se toca `master`. **Reversibility:** one-way. Sobrescribir un campo que producción lee cambia el sitio live al instante.
- **D-03:** Las lecciones de los casos se escriben a Payload SOLO cuando Juan las apruebe, y el script de carga queda listo, probado en dry-run y marcado para correrse en el corte (fase 57). Motivo: el admin de `master` no conoce el campo `lessons` y un guardado allí podría borrarlas. El campo `lessons` ya existe en `src/collections/CaseStudies/index.ts` (fase 55-03). **Reversibility:** costly.
- **D-04:** Sin secretos impresos. `A11Y.md` estricto en cualquier vista tocada. Sin rayas largas ni medias en entregables en español. Todo entregable escrito pasa por el humanizer calibrado con `research/voice-sample-juan.md` y las reglas de voz: encabezados y meta títulos sin puntos ni comas, se habla de Juan y no de una agencia, tono de experto que enseña.
- **D-05:** El gate de UI-SPEC se omite (igual que en la fase 55): el diseño es el sandbox aprobado. Se referencian `54-UI-SPEC.md` y las excepciones de `54-CONTEXT.md` (escala display y escala vertical de sección, texto de cuerpo 12/14/16/20 px con pesos 400 y 600).

**Identidad y legal (CONT-03, CONT-01 fecha legal)**
- **D-06:** Juan opera como persona natural: Juan Carlos Angulo, Perú. Contacto legal y del formulario: `hello@juan-tech.com` (el buzón recibe y envía; producción ya envía desde `no-reply@juan-tech.com` por Resend y tiene `CONTACT_TO_EMAIL=hello@juan-tech.com`).
- **D-07:** Plantilla base: `General-Legal/legal-templates` (CC0): `templates/privacy-policy-gdpr/template.md` como base, con apoyo de `privacy-policy-us`, `terms-of-use` y `cookie-notice`. Se adapta a ES y EN, redactadas en la voz de Juan. No se pega la plantilla cruda.
- **D-08:** Hechos reales que el texto debe reflejar: no hay scripts de analítica en el código ni en el HTML de producción; la única cookie es funcional (`NEXT_LOCALE`, preferencia de idioma), por lo tanto NO hace falta banner de cookies y el texto lo dice; proveedores: Resend (correo), Cloudinary (medios), Hetzner VPS con Dokploy (hosting), Cloudflare (DNS); el lead magnet guarda correos de suscriptores (doble opt-in); el formulario de contacto guarda los datos que se envían; hay enlaces de afiliado con divulgación. Los textos actuales mencionan Hostinger y Google Analytics: ambos deben desaparecer o corregirse tras verificar contra el código (el researcher confirma si hay GA4 real; el estado conocido es que no).
- **D-09:** Fecha efectiva = el día del corte. Se deja como un único valor parametrizado que se fija justo antes del merge (insumo del gate de la fase 57), no una fecha inventada hoy. El marcador legal `{{pendiente}}` se reemplaza por ese valor en el paso de corte.
- **D-10:** Juan no es abogado. El texto incluye nota interna (en el handoff, no en el sitio) de revisión legal opcional tras el corte. **Reversibility:** reversible.

**Sobre mí (CONT-01 fecha aprendoclub, Loops Growth, Arianna Lupi)**
- **D-11:** Línea de tiempo: aprendoseo (nov 2022) renombrada aprendoclub es UNA entrada continua con rango "nov 2022 a hoy". Loops Growth "2024 a hoy" es una entrada paralela (empresa distinta que coexiste). Coach del diplomado "mar 2025 a hoy". Se elimina el marcador `{{pendiente}} fecha del cambio de nombre` de `scripts/db/data/54-about-copy.ts` (línea 57, etapa índice 2). **PENDIENTE de confirmación de Juan** ("Línea de tiempo de Sobre mí, versión sin fechas inventadas"): se trata como propuesta y se planea como `checkpoint:decision`; no se inventa ninguna fecha que Juan no haya dado.
- **D-12:** Frase de una línea de Loops Growth, aprobada para que Claude la redacte desde loopsgrowth.com (ES): "Agencia de SEO y GEO que ejecuta tu posicionamiento en Google y tu visibilidad en asistentes de IA como ChatGPT y Gemini." EN: "SEO and GEO agency that runs your Google rankings and your visibility in AI assistants like ChatGPT and Gemini."
- **D-13:** Arianna Lupi: stack real = Astro (según Juan, sin confirmar del todo; el HTML muestra `astro-island` y `_astro`). El researcher verifica dónde vive el marcador (Payload/DB, `scripts/db/data`, `src`); el hallazgo inicial es que el marcador del sandbox está en `designs/design-system-mui/src/data/websites.ts` y que la fila Websites de Payload (`scripts/seed-phase40-websites.ts`, slug `ariannalupi-com`) puede ya tener su propio stack. Se corrige en Payload solo lo que el HTML del preview realmente muestre.
- **D-14:** La copia EN de Sobre mí y de la home hoy cae al español en `/en` (los globals nuevos son solo ES). Se necesita una siembra EN aprobada (lote 2 EN). Juan rechazó las propuestas de hero, estadística, tagline, medición y lead de servicios, y aceptó implícitamente el resto: lo aceptado se siembra tras confirmación y lo rechazado espera sus opciones (ver decisiones pendientes).

**CTAs (CONT-02)**
- **D-15:** Los CTAs del lote 1 están APROBADOS por Juan tal como se listaron, con el inglés propuesto, con un cambio: cierre de la home ES "¿Tienes un proyecto en mente? Cuéntame de qué se trata." (sin la frase "empiezo por mirar qué ve Google hoy") y EN "Have a project in mind? Tell me what it is about." Se aplican a donde vivan (global `homePage`, `messages`, `CtaSection`); el plan primero inventaría cada CTA vigente y su origen.

**Contenido que Claude puede preparar ya**
- **D-16:** Lecciones de los 7 casos, ES y EN (`lessons` = array de `title` y `body`, ambos localizados). Parten de `designs/design-system-mui/src/data/case-lessons.ts` (borradores) y SOLO usan cifras que el caso ya muestra, cero afirmaciones inventadas. Se verifica cada cifra contra los datos reales del caso en Payload. Quedan en un archivo de datos para revisión de Juan; no se cargan hasta su aprobación escrita (D-03). Nota del sandbox: la lección "Una cifra anual puede esconder un semestre flojo" (edtech, caída del 25 % en seis meses) debe contrastarse con los datos del caso antes de proponerla.
- **D-17:** Reescritura de los 36 encabezados con punto o coma según las reglas de voz. El researcher localiza dónde viven (copy de home y Sobre mí, `messages`, globals, sandbox) y produce una tabla antes y después; solo se cambia lo que vive en contenido nuevo o sombra, nunca un encabezado que `master` ya sirve y que afecte SEO sin decisión de Juan.
- **D-18:** Textos alternativos (alt) para las fotos de Sobre mí y las capturas de Websites, descriptivos, sin "imagen de", conforme a `A11Y.md`.
- **D-19:** Limpieza de rayas largas y medias en `messages/es.json` y `messages/en.json` (hoy 3 y 4 apariciones), con prioridad al namespace `emailCapture`, dentro de la pasada de voz. Se respeta `scripts/verify/54-messages-parity.mjs`.
- **D-20:** Testimonios: se conserva solo el de Patricia Ibarra. Los demás los pega Juan después. Ningún testimonio de relleno ni inventado; ningún marcador de testimonio queda en el HTML renderizado.
- **D-21:** La traducción EN de recursividad (22 % completa) es una decisión de Juan: se planea como `checkpoint:decision` con opciones (traducir ahora, servir aviso de traducción existente, diferir) y recomendación.

**Decisiones pendientes de Juan (checkpoint:decision, no bloquean otras tareas)**
- **D-22:** Título del hero de la home: opción A "Consultor SEO técnico que también programa" (RECOMENDADA), opciones B a E aún por listar desde la conversación; texto del hero: opciones 1 a 3; estadística del hero: +309 % inmigración de Atlanta (RECOMENDADA), +406 % urología (vigente), +143 %, +104 %, +68 %, +18 clientes (por confirmar); tagline bajo el hero: opciones 1 a 3; título y lead de la sección de medición (se conservan las descripciones de Core Web Vitals y se quitan las notas "Bueno: hasta"); lead de servicios (se quita la frase "empiezo por lo que ve Googlebot y de ahí decido qué tocar" del lead de la sección Y del ítem SEO técnico). El plan registra cada elección en un único archivo de datos con una constante por decisión, de modo que el valor recomendado se siembre por defecto si Juan no responde antes del corte, y el cambio de elección sea de una línea.
- **D-23:** El `<title>` y la meta description de la home NO cambian en el corte (se decide después con datos de Search Console). Cualquier plan que toque el copy de la home confirma que esos dos campos quedan intactos.

### Claude's Discretion
Partición en planes y olas, nombres y estructura de los archivos de datos, el mecanismo concreto de sombra para privacy y terms (campos nuevos en globals privados, doc sombra o carga en el corte, a decidir con la investigación de cómo la fase 54 resolvió `homePage` y `aboutPage`), cómo se agrupa la verificación (`scripts/verify/56-*`), y la redacción de las lecciones y del texto legal dentro de las restricciones de voz.

### Deferred Ideas (OUT OF SCOPE)
- Portal de reseñas (enlace de un solo uso con caducidad y aprobación en el admin): después del corte, milestone nuevo.
- Decisión de `<title>` y meta description de la home con datos de Search Console.
- Revisión legal profesional opcional tras el corte.
- Landings Lima y Madrid con contenido real: se dejan como están.
- Traducción EN de los posts 9, 35 a 38, 56, 57 y 58 (deuda previa).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descripción | Qué hallazgo lo habilita |
|----|-------------|--------------------------|
| CONT-01 | Juan resuelve los `{{pendiente}}`: fecha aprendoclub, stack de Arianna Lupi, datos de Loops Growth, fecha legal y testimonios | Sección 1 (inventario: solo UN marcador llega al HTML hoy, en `/sobre-mi` y `/en/sobre-mi`), sección 2 (Arianna: el marcador vive solo en el sandbox; la fila de Payload dice otro stack), sección 4 (slot de fecha legal) y sección 10 (testimonios) |
| CONT-02 | Juan aprueba el texto de los CTA y las lecciones aprendidas de los casos | Sección 5 (inventario de CTAs y de dónde vive cada uno), sección 6 (21 lecciones contrastadas contra el HTML de los casos) |
| CONT-03 | Juan confirma el texto legal (hoy dice Hostinger y la infraestructura real es otra) | Sección 3 (mecanismo sombra para privacy y terms), sección 4 (hechos reales y estructura de la plantilla CC0) |
</phase_requirements>

## Summary

La fase 56 es de contenido, no de código. Lo que existe hoy en el HTML del preview: exactamente un marcador `{{pendiente}}` (la fecha de la etapa aprendoclub, en `/sobre-mi` y `/en/sobre-mi`, que aparece una vez en el cuerpo y otra en el payload RSC). Los demás marcadores del brief (Arianna Lupi, datos de Loops Growth como sitio, fecha legal) viven solo en el sandbox `designs/design-system-mui` y en cero lugares de `src`, `messages` o `scripts/db/data`; en el HTML no llegan. Los testimonios no tienen marcador: Payload tiene una sola fila (Patricia Ibarra), y la sección de la home ya muestra solo esa.

Lo importante que el CONTEXT no sabía: (a) la copia de Sobre mí ya sembrada contradice D-11 en dos textos más, el `lead` de la sección ("son el mismo equipo con tres nombres") y el cuerpo de la etapa de Loops Growth ("El equipo cambia de nombre otra vez"); (b) fusionar aprendoseo y aprendoclub baja las etapas de 5 a 4 y `mergeGroup` de `54-seed-lib.ts` se niega a borrar filas, además de que cuatro verificadores tienen el 5 y el "2 actuales y 3 pasadas" cableados; (c) la fila de Payload de Arianna Lupi dice Next.js, Payload, Neon y Hostinger (y la filtra como Next.js), el sitio real corre Astro tras Cloudflare, y esa fila la sirve también producción, así que corregirla es una escritura en caliente a una fila de `master` (hay que decidir si va ahora o en el corte); (d) el formulario de contacto NO guarda nada en la base: solo envía un correo por Resend a `hello@`; D-08 dice "guarda los datos" y el texto legal debe decir lo que realmente pasa; (e) el CTA de cierre de todas las páginas sale del global sombra `home-page.cta`, así que el cambio de D-15 es una escritura segura (sombra) pero hoy el EN de ese global cae al español.

El mecanismo recomendado para privacy y terms es el mismo que usó la fase 54: un global privado nuevo (`legal-pages`) con migración aditiva, lectura por Local API con respaldo a la página `pages` actual mientras el global esté vacío, y la fecha efectiva como un único campo del global que se rellena el día del corte. Las lecciones y los alt de las capturas de Websites (campo `Media.alt` que `master` lee) se cargan en el corte, con script listo y probado en seco.

**Primary recommendation:** Planear en cuatro olas: (1) esquema aditivo del global legal y datos con estado por texto, (2) siembra sombra ES+EN de home, Sobre mí y CTAs (segura ahora), (3) texto legal y verificadores `56-*`, (4) scripts de corte listos en seco (lecciones, alts de capturas, stack de Arianna, fecha legal). Todo lo que toca la base es `checkpoint:human-action` de Juan con el formato de 55-06.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Copy sombra de home y Sobre mí (hero, tagline, medición, servicios, CTA de cierre, línea de tiempo) | Database / Storage (globals `home-page` y `about-page`) | Frontend Server (SSR vía `getCachedHomePage` y `getCachedAboutPage`) | Ya es el patrón de la fase 54: el contenido vive en un global privado que `master` ignora |
| Texto legal ES y EN | Database / Storage (global nuevo `legal-pages`) | Frontend Server (`LegalView`) | Privacy y terms ya los sirve `master` desde `pages`; un global nuevo evita sobrescribirlos en caliente |
| Fecha efectiva legal | Database / Storage (un campo del global) | Frontend Server (línea bajo el hero de `LegalView`) | Una sola constante, rellenada el día del corte; sin dato no se renderiza (UI-SPEC línea 223) |
| Lecciones de casos | Database / Storage (`case-studies.lessons`) | Frontend Server (`CaseDetailView` ya renderiza la sección) | Campo existente desde 55-03; carga en el corte por D-03 |
| Alt de fotos de Sobre mí y de capturas de Websites | Database / Storage (`media.alt` localizado) | Browser (atributo `alt`) | El alt sale del doc Media; las capturas ya existen y las lee `master` |
| Rayas largas de `messages` | Frontend Server (código de la rama) | n/a | `messages/*.json` es código: no hay efecto en caliente sobre producción |
| Selección de textos pendientes (A..E, 1..3) | Archivo de datos en el repo (`scripts/db/data`) | Database (se siembra la opción elegida) | Una constante por decisión; el estado viaja con el texto |

## Standard Stack

### Core (todo ya instalado, sin paquetes nuevos)
| Pieza | Versión | Para qué | Por qué es la estándar aquí |
|-------|---------|----------|------------------------------|
| `payload` y `@payloadcms/*` | 3.85.2 [VERIFIED: package.json] | Local API para sembrar globals y colecciones | Es el CMS del proyecto; los scripts de la 54 y 55 ya lo usan |
| `@payloadcms/richtext-lexical` | 3.85.2 [VERIFIED: package.json] | Texto legal como Lexical, el formato que `LegalView` y `extractHeadings` esperan | `LegalView` combina raíces Lexical y arma el índice desde ahí (`src/components/pages/LegalView.tsx:36-72`) |
| `next-intl` | ^4.13.1 [VERIFIED: package.json] | Mensajes ES y EN | Ya en uso |
| `tsx` | instalado [VERIFIED: `node_modules/.bin/tsx` existe] | Correr los scripts `scripts/db/*.ts` | Patrón de todos los scripts |
| Node | v24.13.0 [VERIFIED: `node --version`] | Verificadores `.mjs` | Patrón de `scripts/verify` |

### Supporting
| Pieza | Para qué | Cuándo |
|-------|----------|--------|
| `scripts/db/data/54-seed-lib.ts` | `assertSafeTarget`, `buildDiff`, `mergeGroup`, `assertNoForbiddenChars`, `findPendingMarkers` | En toda siembra nueva; se importa, no se copia |
| `scripts/verify/54-run-all.mjs` y `55-run-all.mjs` | Orquestadores con `--selftests` y `--live` | Crear `56-run-all.mjs` con el mismo molde y regresión de 54 y 55 |
| Plantillas CC0 de `General-Legal/legal-templates` | Esqueleto del texto legal | Solo como guía de secciones; no se pega cruda (D-07) |

### Alternatives Considered
| En vez de | Podría usar | Tradeoff |
|-----------|-------------|----------|
| Global nuevo `legal-pages` | Cargar el texto en los docs `pages` `privacy` y `terms` en el corte | Sin migración, pero es una escritura en caliente a docs con borradores y versiones que `master` lee; no hay forma de previsualizar el texto nuevo en dev sin sobrescribir producción |
| Global nuevo `legal-pages` | Campos nuevos en la colección `pages` | `pages` tiene `versions.drafts` (`src/collections/Pages/index.ts:58-59`); un guardado en el admin de `master` crea versiones sin conocer los campos nuevos. Riesgo equivalente al de D-03 |
| Lexical por locale | Arreglo de secciones `{heading, body}` y armar Lexical en la vista | Más código de vista; `LegalView` ya recibe Lexical |

**Installation:** ninguna. Esta fase no instala paquetes.

**Version verification:** versiones leídas de `package.json` esta sesión (`payload` 3.85.2, `next` 15.4.11, `next-intl` ^4.13.1). No se recomienda ningún paquete nuevo.

## Package Legitimacy Audit

No aplica: la fase no instala ningún paquete externo. `slopsquatting` fuera de alcance. **Packages removed due to SLOP:** none. **Packages flagged SUS:** none.

## Architecture Patterns

### System Architecture Diagram

```
Juan decide (checkpoint:decision)         Archivo de datos 56-*.ts (una constante por texto, con estado)
        |                                          |  estado: aprobado | propuesto | pendiente
        v                                          v
 default recomendado ------------------>  scripts/db/NN-phase56-*.ts   (dry-run por defecto)
                                                   |  assertSafeTarget -> 04-which-database -> --apply --db-checked
                                                   v   (solo Juan, por túnel, checkpoint:human-action)
                              +--------------------+---------------------------+
                              |                    |                           |
                       SOMBRA (segura ahora)   CORTE (fase 57)           SOLO CÓDIGO (rama)
                       global home-page        case-studies.lessons       messages/es.json y en.json
                       global about-page       media.alt de capturas      LegalView (slot de fecha)
                       global legal-pages      websites (stack Arianna)
                       (migración aditiva)     legal-pages.effectiveDate
                              |                    |                           |
                              +--------------------+---------------------------+
                                                   v
                       Next SSR (unstable_cache TTL 60 s) -> HTML de dev.juan-tech.com
                                                   v
                       scripts/verify/56-*.mjs (HTML servido, nunca la BD que escribió el script)
```

### Recommended Project Structure
```
scripts/db/data/
├── 56-content-decisions.ts   # una constante por decisión: { id, status, options, chosen }
├── 56-home-copy.ts           # ES y EN de hero, tagline, medición, servicios, cierre (usa las constantes)
├── 56-about-copy.ts          # línea de tiempo nueva ES y EN (4 etapas)
├── 56-legal-copy.ts          # texto legal ES y EN como secciones tipadas, más LEGAL_EFFECTIVE_DATE
├── 56-case-lessons.ts        # 21 lecciones ES y EN con estado y fuente de cada cifra
└── 56-alt-texts.ts           # alt de fotos y de capturas
scripts/db/
├── 25-phase56-verify-schema.ts   # solo lectura, con autoprueba (como 23 y 24)
├── 26-phase56-seed-shadow.ts     # home-page y about-page ES y EN
├── 27-phase56-seed-legal.ts      # legal-pages (sin fecha) 
├── 28-phase56-cutover-load.ts    # lecciones, alts de capturas, stack de Arianna, fecha legal (SOLO corte)
scripts/verify/
├── 56-content-guard.mjs, 56-seed-selftest.ts, 56-legal-live.mjs, 56-no-marker-live.mjs, 56-run-all.mjs
src/globals/LegalPages/index.ts   # global nuevo, sin access ni versions
src/migrations/<ts>_phase56_legal_shadow.ts
```

### Pattern 1: Contenido sombra aditivo (el de la fase 54, ya probado)
**What:** Global privado sin `access` ni `versions` (GET anónimo responde 403), leído por Local API sin `overrideAccess:false`, cacheado con `unstable_cache` y etiqueta propia, invalidado por un hook `afterChange`. `master` no conoce las tablas, así que no las toca ni las pisa.
**Fuente:** `src/globals/HomePage/index.ts:7-21` y `src/lib/cache.ts:140-210` [VERIFIED].
**Respaldo de idioma:** para EN se lee con `fallbackLocale:false` y, si el campo centinela viene vacío (`strict.tagline` en `src/lib/cache.ts:176`, `strict.hero?.lead` en :201), se marca `isFallback` y se relee con respaldo ES; la vista muestra `TranslationNotice`.

### Pattern 2: Siembra con dry-run por defecto
**What:** `scripts/db/20-phase54-seed-shadow-content.ts` importa `assertSafeTarget`, imprime `safeTarget`, lee con `fallbackLocale:false`, calcula `buildDiff`, envía el grupo COMPLETO fusionado con `mergeGroup` y relee para comparar. Exige `--apply --db-checked` para escribir [VERIFIED: `scripts/db/20-phase54-seed-shadow-content.ts:49-105,213-276`].

### Anti-Patterns to Avoid
- **Sembrar EN a medias:** el centinela de EN es un solo campo (`tagline` en home, `hero.lead` en Sobre mí). Si se siembra el resto del EN y el tagline EN queda vacío por una decisión pendiente, la página entera muestra el aviso de traducción y mezcla idiomas. Sembrar el centinela con la opción recomendada y marcarlo `propuesto`.
- **Escribir en `pages` privacy y terms:** son docs con borradores que `master` sirve hoy.
- **Reusar `mergeGroup` para reducir filas:** lanza si la base tiene más filas que el copy (`54-seed-lib.ts:127-134`). Ver Pitfall 2.
- **Poner lecciones en producción antes del corte:** un guardado en el admin de `master` podría borrarlas (D-03).

## Don't Hand-Roll

| Problema | No construir | Usar | Por qué |
|----------|--------------|------|---------|
| Guardia contra base equivocada | Un chequeo nuevo por script | `assertSafeTarget`, `safeTarget` de `54-seed-lib.ts:23-81` | Nació del incidente del 2026-08-17 |
| Detección de rayas y de marcadores | Regex nuevas | `assertNoForbiddenChars`, `findPendingMarkers` (`54-seed-lib.ts:227-246`) | Ya probadas por autoprueba |
| Construcción de Lexical para texto legal | Un serializador | Helpers `heading`, `paragraph`, `richTextDoc` de `scripts/seed-legal-pages.ts:15-43` (más nodo `list`) | Es el formato que lee `extractLegalRichTexts` |
| Orquestación de verificación | Un runner nuevo | Molde de `55-run-all.mjs` con `--selftests`, `--live`, `--strict` | Ya importa la regresión de 54 |
| Texto legal | Redactar desde cero | Estructura de `privacy-policy-gdpr/template.md` (CC0) adaptada | Cubre derechos, bases legales y transferencias |

**Key insight:** esta fase vive de reutilizar los helpers de la 54 y 55. Lo único realmente nuevo es un global (esquema), un slot de fecha en `LegalView` y los archivos de datos con estado.

## 1. Inventario de marcadores `{{pendiente}}`

Búsqueda: `grep -rIn "{{pendiente"` en todo el repo (sin `node_modules`, `.next`, `.git`) más barrido del HTML servido por dev y prod el 2026-11-10.

| # | Dónde | Línea | Texto | Llega al HTML | Acción |
|---|-------|-------|-------|---------------|--------|
| 1 | `scripts/db/data/54-about-copy.ts` | 57 `when: '{{pendiente}} fecha del cambio de nombre',` | marcador de la etapa índice 2 | SÍ, sembrado en el global `about-page`: `/sobre-mi` y `/en/sobre-mi` (1 vez en el cuerpo y 1 en el payload RSC) [VERIFIED: curl dev] | Cerrar (D-11) |
| 2 | `scripts/db/data/54-about-copy.ts` | 12 `ABOUT_PENDING_PATHS = ['experience.stages[].when']` | permiso para el marcador | no | Quitar o vaciar `[]` al cerrar #1 |
| 3 | `designs/design-system-mui/src/data/about.ts` | 20 | mismo marcador (origen) | no (sandbox, sin git) | Informativo |
| 4 | `designs/design-system-mui/src/data/websites.ts` | 41 `'{{pendiente}} confirmar el stack actual: la ficha publicada dice Next.js y Payload, y el sitio hoy corre en Astro'` | stack de Arianna Lupi | NO: la fila de Payload no tiene marcador | Ver sección 2 |
| 5 | `designs/design-system-mui/src/data/websites.ts` | 48 y 49 | `'{{pendiente}} qué construí y qué logré en este proyecto'` y `'{{pendiente}} retos del proyecto'` (Loops Growth como sitio) | NO: Payload no tiene fila `loopsgrowth-com` (el listado de dev muestra 6 sitios, "Todos (6)") [VERIFIED: curl dev /websites] | Recomendación: no crear la fila (Juan no dio contenido). Cierra el marcador por omisión |
| 6 | `designs/design-system-mui/src/components/site/LegalPage.tsx` | 17 `{'{{pendiente}} fecha de última actualización'}` | fecha legal | NO: `LegalView` real no la renderiza (`src/components/pages/LegalView.tsx:10-12`) | Crear el slot (sección 4) |
| 7 | `designs/redesign-v5/home.html` líneas 464, 734, 735 y `home.template.html` líneas 440, 710, 711 | `{{pendiente}} Valores de muestra...`, `Privacidad {{pendiente}}`, `Términos {{pendiente}}` | mockup v5 | no (mockup descartado) | Ignorar |
| 8 | `scripts/verify/54-page-contract.mjs` | 61 y 62 (`KNOWN_PENDING`), 338-350 (autoprueba) | excepción conocida | n/a | Actualizar (sección 11) |
| 9 | `scripts/verify/54-about-ssr.ts` | 117 y 162 | exige el marcador | n/a | Invertir (sección 11) |
| 10 | `scripts/verify/54-no-sandbox-data.mjs` | 103 | fixture de autoprueba con marcador | n/a | Se queda (es un fixture) |
| 11 | `scripts/verify/54-seed-selftest.ts` | 167-180 y 205-207 | pruebas de la guardia y del único marcador | n/a | Actualizar la 205-207 (sección 11) |

En `src/` y `messages/` hay CERO marcadores literales [VERIFIED: grep]. `src/lib/placeholder.ts:1-35` filtra `[PLACEHOLDER]` (otro marcador, de las landings Lima y Madrid): en el HTML visible de dev quedan 0, pero el payload RSC de dev trae 5 y 6 apariciones en `/seo-tecnico-lima` y `/seo-tecnico-madrid` [VERIFIED: curl dev]. D-fuera de alcance: Lima y Madrid quedan como están; el contrato de HTML ignora script y style, así que no falla.

**Marcadores de otros tipos que no son `{{...}}`:** ninguno en `scripts/db/data`, `src` ni `messages` (grep de `por confirmar|TODO|FIXME|lorem|[PLACEHOLDER]` sin hallazgos fuera de `placeholder.ts`).

## 2. Arianna Lupi: dónde vive el marcador y qué dice Payload

- El marcador `{{pendiente}} confirmar el stack actual...` está SOLO en `designs/design-system-mui/src/data/websites.ts:41` (sandbox sin git). No está en Payload, ni en `scripts/db/data`, ni en `src`.
- `scripts/seed-phase40-websites.ts` (lectura, líneas 64-95): slug `ariannalupi-com`, `stack: ['Next.js', 'Payload CMS', 'Neon Postgres', 'Hostinger']`, highlights "Migración completa a Next.js + Payload CMS con contenido bilingüe", "Base de datos Postgres en Neon con hosting Node.js en Hostinger", "SEO técnico integrado desde el código, sin plugins de terceros" [VERIFIED].
- El HTML de dev y de prod lo confirma: `/websites/ariannalupi-com` muestra Next.js, Payload CMS, Neon Postgres y Hostinger (ES y EN) y el filtro del índice cuenta 4 sitios Next.js, que incluyen a Arianna [VERIFIED: curl dev y prod].
- El sitio real corre Astro: `ariannalupi.com` devuelve `server: cloudflare` y en el HTML 7 `astro-island`, 4 `_astro/`, sin `_next/static` ni `wp-content` [VERIFIED: curl 2026-11-10]. La versión del sandbox ya dice `tech: ['Astro', 'Cloudflare', 'Hostinger']` y `kind: 'astro'` (`websites.ts:38-40`); el `Hostinger` de ahí no está verificado.
- Consecuencia: D-13 manda corregir solo lo que el HTML del preview muestra, y muestra el stack equivocado. Pero la fila la lee también `master`: corregirla cambia producción al instante. Decisión para Juan (checkpoint:decision): aplicar ahora (corrección de un dato falso, reversible por script) o cargar en el corte. Recomendación: cargar en el corte con el script listo en seco, porque D-02 prohíbe pisar en caliente lo que `master` sirve; los datos nuevos que Juan debe aportar son los highlights y retos (no se inventan).
- Hallazgo conexo (CONT-03): las filas `juan-tech-com`, `apturio-com` y `aprendoclub-com` también dicen "Neon Postgres" y "Hostinger" en la página pública de Websites; la infraestructura de `juan-tech.com` hoy es otra. Contradice el texto legal nuevo. Abrir como pregunta para Juan.

## 3. Cómo resolvió la fase 54 el contenido sombra y qué mecanismo usar para privacy y terms

**Lo que hizo la 54** (`54-CONTEXT.md:59`: "Copy nuevo en globals privados nuevos (`homePage`, `aboutPage`) ... No se sobrescribe ningún campo existente"):
1. Dos globals nuevos con slugs `home-page` y `about-page`, sin `access` y sin `versions` (T-54-05): lectura anónima da 403 [VERIFIED: `src/globals/HomePage/index.ts:14-17`, `src/globals/AboutPage/index.ts:12-14`].
2. Migración aditiva `20261108_043335_phase54_shadow_content.ts` (solo `CREATE TABLE` y columnas nuevas; sin `GRANT`: el rol de solo lectura del preview hereda `SELECT` y se verifica con `23-phase54-verify-schema.ts`) [VERIFIED: grep de la migración].
3. Lectura con `getCachedHomePage` y `getCachedAboutPage` (`src/lib/cache.ts:162-210`) y hooks `revalidateHomePageCache` y `revalidateAboutPageCache` (`src/lib/cache-tags.ts:270-278`).
4. Siembra solo ES con `20-phase54-seed-shadow-content.ts`; el inglés cae al español con aviso.

**Estado real de privacy y terms hoy [VERIFIED: curl prod y dev]:** las rutas `src/app/(frontend)/[locale]/privacy/page.tsx` y `terms/page.tsx` leen `getCachedPageBySlug('privacy'|'terms', locale)` (el doc `pages` que `master` también sirve) y pasan `doc.content.layout` a `LegalView`. `title`, `meta.title` y `meta.description` salen del mismo doc y no deben cambiar (paridad SEO de 54-16).

**Mecanismo recomendado (Claude's Discretion):** global privado nuevo `legal-pages`.
- Campos: grupo `privacy` y grupo `terms`, cada uno con `body` (richText Lexical, `localized: true`) y `effectiveDate` (date o texto, no localizado). Sin `access` ni `versions`, hook `afterChange` con etiqueta nueva.
- Lectura: `getCachedLegalPages(locale)` con el molde de `getCachedAboutPage`. En `privacy/page.tsx` y `terms/page.tsx`: si `body` de ese locale tiene contenido, `LegalView` recibe ese Lexical y la fecha; si no, se queda con el doc `pages` actual. Así dev muestra el texto nuevo, producción (`master`) no cambia nada, y al corte el código de la rama ya lee el global.
- `title`, `meta` y migas siguen saliendo del doc `pages`: SEO idéntico.
- Slot de fecha: `LegalView` hoy no lo tiene (`LegalView.tsx:10-12` dice "Esa línea queda para la fase 56"). Agregar una prop `effectiveDate` y una línea de `Typography variant="body2"` dentro del `PageHero` solo cuando hay dato. Sin dato, no se renderiza nada (`54-UI-SPEC.md:223`: "Sin dato: no se renderiza nada. No se usa `updatedAt`").
- Fecha efectiva (D-09): constante única `LEGAL_EFFECTIVE_DATE` en `56-legal-copy.ts`, vacía hasta el corte. El script de corte la escribe el día del merge. El verificador del gate de la 57 exige que el HTML de `/privacy` y `/terms` (ES y EN) traiga esa fecha.
- Alternativa descartada (cargar en `pages` en el corte): no permite ver el texto nuevo en dev sin sobrescribir producción.
- Riesgo a vigilar: el rol de solo lectura del preview debe poder leer las tablas nuevas. Mismo chequeo que 24: correr el verificador con `juantech_user` y con `juantech_preview_ro` [VERIFIED: `55-06-PLAN.md` paso 8].

## 4. Texto legal actual, hechos reales y estructura de la plantilla CC0

### 4.1 Texto servido hoy (la versión humanizada, no la de `seed-legal-pages.ts`)
El texto vivo no coincide con `scripts/seed-legal-pages.ts` (versión original) sino con una pasada posterior (`scripts/humanize-legal-pages.ts`) más `scripts/update-privacy-resend.ts` (secciones 7 y 8) [VERIFIED: curl prod `/privacy`, `/en/privacy`, `/terms`, `/en/terms`].

Privacy ES (8 secciones numeradas). Frases con hechos hoy falsos o dudosos [VERIFIED: prod]:
- Sección 1: "analíticas anónimas vía Google Analytics y Cloudflare Insights" (falso: ver 4.2).
- Sección 2: "Las analíticas las reviso de forma agregada" (falso).
- Sección 3: "Cloudinary para el almacenamiento de imágenes, Hostinger para el hosting, Google Analytics para el análisis de tráfico y Cloudflare para seguridad y rendimiento" (Hostinger y GA falsos; Cloudflare es solo DNS).
- Sección 4: "Guardo los envíos del formulario de contacto hasta 12 meses" (los envíos son correos en el buzón, no filas; ver 4.2).
- Sección 6: "cookies técnicas ... por ejemplo para la previsualización de borradores" (falta la cookie real `NEXT_LOCALE`).
- Secciones 7 y 8: lead de blog y Resend como encargado, plazo "12 meses" para suscriptores.
Terms ES y EN (5 secciones): sin mención de hosting ni analítica; no hay afiliados ni propiedad de enlaces.

### 4.2 Hechos reales verificados contra código y HTML

| Hecho | Evidencia |
|-------|-----------|
| No hay analítica: cero `gtag`, `googletagmanager`, `analytics`, `cloudflareinsights`, `plausible`, `clarity`, `hotjar`, `posthog`, `umami`, `@vercel/analytics` en `src`, `package.json` ni `next.config` (grep sin resultados fuera de comentarios) | [VERIFIED: grep]. `src/components/AffiliateDisclosure.tsx:1-5` documenta "cero tracking ... sin GA4, sin píxeles, sin IDs de clic por usuario" |
| El HTML de prod y dev no carga ningún script externo; los únicos hosts de recursos son `res.cloudinary.com`, `juan-tech.com`, `github.com`, `linkedin.com` y `auditor.juan-tech.com` | [VERIFIED: curl dev y prod 2026-11-10] |
| Única cookie: `NEXT_LOCALE`, `Path=/; SameSite=lax` (sin `HttpOnly`, sin `Max-Age`: cookie de sesión) | [VERIFIED: `curl -I` a `/` y `/en` en prod y dev: `set-cookie: NEXT_LOCALE=es; Path=/; SameSite=lax`] |
| Hosting: A record `116.203.79.125` (el VPS Hetzner con Dokploy de D-08). Cloudflare solo como DNS: NS `cruz.ns.cloudflare.com` y `vasilii.ns.cloudflare.com`, y las respuestas de `juan-tech.com` no traen `server: cloudflare` ni `cf-ray` | [VERIFIED: dig y curl -I]. Que sea Hetzner viene de D-08 [CITED: 56-CONTEXT.md] |
| Correo transaccional: `resendAdapter` en `src/payload.config.ts:87-91` (`apiKey: process.env.RESEND_API_KEY`) | [VERIFIED] |
| El formulario de contacto NO guarda nada en la base: `src/app/actions/contact.ts:106-113` solo hace `payload.sendEmail({ to: toAddress, replyTo: email, subject, html })` y no hay `payload.create`. Lo que se envía llega como correo a `CONTACT_TO_EMAIL` | [VERIFIED: contact.ts:90-122]. Contradice D-08 ("guarda los datos"): el texto debe decir que llega por correo a `hello@juan-tech.com` |
| Anti abuso: la IP se usa solo en memoria del proceso para limitar peticiones y no se guarda (`src/lib/ip-throttle.ts:1-30`; `AffiliateClicks` no tiene campo de IP) | [VERIFIED] |
| Suscriptores (`subscribers`): `email`, `status`, `locale`, `source`, `token`, `confirmedAt`, `unsubscribedAt`, `optInReason`, `leadMagnet`; doble opt-in | [VERIFIED: `src/collections/Subscribers/index.ts:6,38-120`] |
| Clics de afiliado: `affiliate-clicks` guarda `slug` y `userAgent`, sin IP | [VERIFIED: `src/collections/AffiliateClicks/index.ts`] |
| Las imágenes se sirven desde `res.cloudinary.com`: la IP del visitante llega a Cloudinary | [VERIFIED: HTML] |
| Subprocesadores reales | Resend, Cloudinary, Hetzner (VPS con Dokploy y Postgres compartido), Cloudflare (DNS). Falta: quién hospeda el buzón `hello@juan-tech.com` (no verificable desde el repo) |

Conclusión sobre D-08: confirmo que NO hay GA4 ni Cloudflare Insights reales; los dos nombres deben desaparecer del texto. Y sobre "guarda los datos del formulario": solo en el buzón.

### 4.3 Estructura de la plantilla CC0 (`General-Legal/legal-templates`, fetch de GitHub 2026-11-10)
Licencia CC0 1.0 [VERIFIED: LICENSE del repo]. Las plantillas son conversiones de DOCX con los encabezados aplanados.

`templates/privacy-policy-gdpr/template.md` (52 KB), secciones útiles para este caso:
- Personal information we collect (datos que das, fuentes de terceros, recolección automática)
- Tracking & Other Technologies
- How we use your personal information
- Retention
- How we share your personal information
- Your choices
- Other sites and services
- Security
- International data transfer
- Children
- Changes to this Privacy Policy
- How to contact us
- State privacy rights notice (leyes de estados de EE. UU.: no aplica a una persona natural en Perú; se omite)
- Notice to European users: Controller, legal bases (tabla), retention, your rights (access, correct, delete, transfer, restrict, object, withdraw consent), exercising rights, supervisory authority

`privacy-policy-us` repite la parte estadounidense. `terms-of-use` trae 11 cláusulas (Accounts, Access to the Site, Privacy, Indemnification, Third-Party Services, Disclaimers, Limitation of Liability, Term and Termination, State-Specific Notices, General, Dispute Resolution con dos opciones de arbitraje). `cookie-notice` trae: What are cookies, tipos de cookies, Other technologies, Your choices, Changes, Questions.

Adaptación recomendada (voz de Juan, primera persona, corta):
- Privacy: quién soy y cómo contactarme (`hello@juan-tech.com`); qué datos recojo (contacto por correo, suscripción con doble opt-in, clics de afiliado sin IP, IP en memoria para limitar abuso); qué NO uso (analítica, publicidad, perfiles); la cookie `NEXT_LOCALE` y por qué no hay banner (es de preferencia de idioma; esto es una conclusión que Juan debe confirmar, ver Assumptions); proveedores con enlace a su política; por cuánto tiempo guardo cada dato; tus derechos y cómo ejercerlos; transferencia internacional (Juan está en Perú y los proveedores en otros países; la ubicación del servidor es un dato que Juan debe confirmar); cambios.
- Terms: aceptación, qué es el sitio, propiedad intelectual y cita con atribución, enlaces de afiliado y su divulgación, limitación de responsabilidad, enlaces a terceros, cambios, ley aplicable (decisión de Juan: Perú), contacto.
- La plantilla no cubre la Ley 29733 de Protección de Datos Personales de Perú [ASSUMED]; no es asesoría legal (D-10).
- Cada encabezado de sección sin número, sin punto y sin coma (regla de voz). La numeración actual ("1. ...") es la que dispara los WARN de encabezados en privacy y terms.

## 5. Inventario de CTAs vigentes y su origen

El HTML servido por dev el 2026-11-10 (botones `MuiButton`) y el código dan este mapa [VERIFIED: curl dev y grep]. "Sombra" = global `home-page` (nadie en `master` lo lee, escritura segura). "Master" = campo existente que producción lee. "Código" = `messages` de la rama.

| CTA (ES vigente) | Origen | Lo lee master | Seguro cambiar ahora |
|------------------|--------|---------------|----------------------|
| Hero: "Pedir auditoría 360" a `#contacto` | `home-page.hero.ctaLabel` y `ctaHref` (`HomePage/index.ts:46-47`; valor en `54-home-copy.ts:22-23`) | no | SÍ |
| Servicios: "Hablemos de tu sitio" | `home-page.services.ctaLabel` (`54-home-copy.ts:82`) | no | SÍ |
| Cierre de TODAS las páginas: título "Hablemos de tu sitio" y lead "¿Tienes un proyecto en mente? Cuéntame de qué se trata y empiezo por mirar qué ve Google hoy." | `home-page.cta.title` y `.lead` (`54-home-copy.ts:207-210`), leídos por `getCtaData` (`src/lib/cta-data.ts:50-73`) y pintados por `CtaSection` en home, Sobre mí, casos, Websites y autores | no | SÍ (aquí aterriza D-15) |
| Casos: "Ver todos los casos", Sitios: "Ver todos los sitios" | `home-page.cases.ctaLabel` y `home-page.sites.ctaLabel` (`54-home-copy.ts:122,153`) | no | SÍ |
| Contacto: pasos "Me cuentas el proyecto", "Miro qué ve Google hoy", "Te digo por dónde empezar" | `home-page.contact.steps` (`54-home-copy.ts:214-227`) | no | SÍ |
| Header: "Hablemos" / "Let's talk" a `/contact` | global `header`, campo `ctaButton` (`src/globals/Header/index.ts:29`), con respaldo `shell.ctaFallback` "Pedir auditoría 360" / "Request a 360 audit" (`HeaderView.tsx:75`) | SÍ | NO: corte o dejar |
| Oferta de auditoría: "Pedir la auditoría" / "Request the audit" | bloque `auditOfferBlock` del doc `pages` home (`home-data-b.ts:792`) | SÍ | NO |
| "Probar el auditor" / "Try the auditor" | bloque `auditorHighlight` o `messages` `auditorHighlight.cta` | SÍ (bloque) | NO (bloque); sí (mensaje, código) |
| Índice de servicios: "Hablar con Juan" a `/#contacto`, "Ver servicio" | `messages` `services.index.talkCta` y `viewService` | no (código de la rama) | SÍ |
| Contacto: "Escribir un correo", "Enviar mensaje" | `messages` `contact.writeEmail` y `contact.form.submit` | no (código) | SÍ |
| Lead magnet: "Enviarme el checklist"; newsletter: "Suscribirme" | `messages` `emailCapture.submitLabel`, `blog.newsletter.submitLabel` | no (código) | SÍ |
| Landings de servicio y Lima y Madrid | docs `pages` y bloques | SÍ | NO (D-fuera de alcance para Lima y Madrid) |

Hallazgo: en `/en`, el hero, los CTAs de sombra, el cierre y las listas de casos y sitios salen EN ESPAÑOL porque `home-page` solo tiene ES (HTML de `/en`: "Pedir auditoría 360", "Hablemos de tu sitio", "Ver todos los casos"). Solo los textos de bloques existentes y de `messages` salen en inglés ("Request the audit", "View service", "Let's talk"). Por eso D-14 pide el lote 2 EN.

**La lista del lote 1 NO está en el repo.** Solo `aprobaciones-juan.md:5-9` dice "Aprobados tal como se listaron" y documenta el único cambio (el cierre de la home en ES y EN). Los textos ES y EN exactos de los demás CTAs del lote 1 existen solo en la conversación. Sin esa lista el planificador no puede construir `56-home-copy.ts` ni el EN de los CTAs: el orquestador debe pegarla. Lo único que el repo permite fijar hoy:
- Cierre ES lead: "¿Tienes un proyecto en mente? Cuéntame de qué se trata."
- Cierre EN lead: "Have a project in mind? Tell me what it is about."
- El título del cierre ("Hablemos de tu sitio") y su EN no están documentados: no inventarlos.

## 6. Las 7 lecciones de casos: borradores y verificación de cifras

Borradores: `designs/design-system-mui/src/data/case-lessons.ts` (41 líneas, `Record<slug, {title, body}[]>`, 7 casos y 3 lecciones cada uno = 21) [VERIFIED]. El campo destino es `case-studies.lessons` (array con `title` text y `body` textarea, ambos `localized: true`) [VERIFIED: `src/collections/CaseStudies/index.ts:107-118`] y `CaseDetailView.tsx:309-361` ya lo renderiza (cada `title` sale como `h3`, así que aplica la regla de encabezados sin punto ni coma).

**Fuentes de datos del caso (para verificar):** (a) la fila de Payload `case-studies` en la base (no consultada, por instrucción); (b) el HTML ES y EN que dev sirve hoy de cada caso, que es lectura pública de esa misma fila (`https://dev.juan-tech.com/case-studies/<slug>` y `/en/case-studies/<slug>`); (c) `designs/design-system-mui/src/data/cases.ts` (519 líneas, sandbox) como copia de apoyo; (d) `scripts/migrate/data/export/case-studies.json` está vacío (lista de 0) y no sirve. El verificador `56-cases-lessons-live.mjs` debe leer (b).

Resultado de contrastar cada cifra de las 21 lecciones con el HTML ES de dev (2026-11-10) [VERIFIED: curl dev]. "OK" = la cifra y su sentido aparecen en el texto del caso.

| Caso (slug) | Lección | Cifras y afirmaciones | Veredicto |
|-------------|---------|------------------------|-----------|
| pittsburgh-criminal-defense-legal-content-seo | 1 Escalar exige contenido específico, no solo marca | 47,108 antes; 86,000; "decenas de artículos sobre situaciones legales concretas de Pensilvania" | OK. Título lleva coma |
| | 2 La optimización on-page rinde cuando cubre el catálogo completo | sin cifra; "títulos, encabezados e intención de búsqueda aplicado a todo el catálogo" | OK |
| | 3 La base técnica sostiene el volumen | posición de escritorio 36.3 a 19.2 | OK |
| fabricante-baldosa-hidraulica-seo-espana | 1 Un fabricante pequeño sí puede capturar demanda genérica | 78 a 327 clics anuales de "baldosa hidráulica"; "marketplaces y grandes distribuidores ... presupuestos de contenido mucho mayores" | OK |
| | 2 El contenido educativo atrapa lo que el catálogo no atrapa | mantenimiento y limpieza de suelos hidráulicos | OK |
| | 3 Un catálogo grande primero necesita rastreo consistente | "más de 300 modelos" ok; "mejorar la indexabilidad vino ANTES que publicar más páginas" | PARCIAL: el caso lista la mejora técnica como tercera acción y no fija un orden. Reescribir sin "antes" o marcar para Juan |
| immigration-law-atlanta-seo | 1 Depender de la marca limita el techo | 9,621 clics, "casi por completo de búsquedas de marca"; 39,323 | OK |
| | 2 Responder lo que el solicitante busca durante su caso funciona | green card, estatus en USCIS, tiempos de la visa U; compite con fuentes oficiales | OK |
| | 3 El crecimiento vino sobre todo de lo informacional | "immigration lawyer atlanta" 128 a 188 (+47 %); "principalmente de captar demanda informacional" | OK |
| talleres-costura-miami-lanzamiento-seo-local | 1 En un sitio nuevo, lo primero es que Google lo rastree | "sin historial de indexación no existían consultas" | OK. Título lleva coma |
| | 2 La marca y lo local se capturan primero | 56 clics, 4 de marca, página principal en posición 8.4 | OK |
| | 3 Una escala pequeña también es una base | "la base que hace falta antes de poder escalar" | OK |
| urologo-seo-local-salud-santiago-rd | 1 El contenido educativo por condición mueve la aguja | riñón ectópico 43.8 a 8.0; "multiplicando por 38 sus impresiones anuales" | OK |
| | 2 La autoridad de marca se construye con trabajo on-page | "pasaron de cero clics registrados a captar tráfico real" | OK (textual en el caso) |
| | 3 El crecimiento porcentual es real aunque la escala sea modesta | 48 a 243 clics; "se sostuvo a lo largo de un año completo" | OK |
| edtech-financiera-infantil-crecimiento-organico-seo | 1 Conviene optimizar primero el artículo ancla | 25.2 a 8.2 | OK |
| | 2 Un clúster temático refuerza la autoridad | red de artículos relacionados | OK |
| | 3 Una cifra anual puede esconder un semestre flojo | "caída del 25 % en clics frente al semestre anterior, con impresiones estables" | OK y resuelve la nota de D-16: el caso lo dice en sus Conclusiones (ES: "los últimos seis meses del periodo (enero-junio 2026) muestran una caída del 25% en clics frente al semestre anterior, aunque las impresiones se mantuvieron estables"; EN igual). El caso se contradice en otra cifra: la tabla dice impresiones +142 % y las Conclusiones dicen +141 %. No afecta a la lección |
| migracion-ecommerce-nextjs-seo-tecnico | 1 El mapa de redirecciones 301 uno a uno protege el posicionamiento | inventario congelado antes del corte, tabla verificada contra el sitemap anterior | OK |
| | 2 El renderizado híbrido mejora el rendimiento sin esperar al lanzamiento | LCP móvil 4.2 s a 1.6 s; generación estática incremental | PARCIAL: "sin esperar al lanzamiento" no aparece en el caso. Quitar esa cola del título |
| | 3 Los datos estructurados y el sitemap dinámico mantienen el catálogo al día | JSON-LD de Product y BreadcrumbList; sitemap generado desde la base de datos | OK |

Aviso extra sobre ese caso: sus periodos salen en inglés dentro de la página en español ("Después: After (90 days)") [VERIFIED: curl dev]. Es un defecto de contenido del caso, fuera de las lecciones; anotarlo en el handoff.

Reglas para el archivo `56-case-lessons.ts`: cada lección con `status` (`propuesto` hasta que Juan apruebe por escrito), `figures` (cada cifra con el fragmento del caso que la respalda), título sin punto ni coma (2 títulos hoy llevan coma), sin rayas, voz en primera persona, y EN con las mismas cifras en el formato del EN del caso ("47,108", "4.2s"). Se verificó que los casos EN existen y traen las mismas cifras (Pittsburgh 47,108 y 36.3; edtech 25%; migración 4.2s a 1.6s) [VERIFIED: curl dev /en/case-studies].

## 7. Encabezados con punto o coma

Origen de la lista: no existe en el repo ninguna lista de "36 encabezados". Lo reproducible es `54-page-contract.mjs` contra dev: salida `60 PASS, 0 FAIL, 68 WARN en 30 ruta(s)`, de los cuales 66 son encabezados y 2 el marcador [VERIFIED: ejecución 2026-11-10, solo HTTP de lectura]. Deduplicados quedan 52 textos únicos (nivel y texto); descontando falsos positivos (".js", separador de miles como "86,000", "Dr.") quedan 40 con punto o coma reales. No logré reproducir el número 36 con ningún criterio razonable; el planificador debe usar esta tabla y pedirle a Juan que confirme el alcance.

Dato clave: ningún encabezado con puntuación vive en contenido nuevo o sombra. El copy sombra de home y Sobre mí no tiene ninguno (verificado leyendo `54-home-copy.ts` y `54-about-copy.ts`). Todos los demás los sirve `master` hoy desde la base o desde sus propios mensajes.

| Grupo | Encabezados (antes) | Dónde viven | Master lo sirve | Acción |
|-------|--------------------|-------------|-----------------|--------|
| Legal, 25 únicos | "1. Información que Recopilamos", "2. Cómo Usamos tus Datos", ... "8. Retención y Baja"; "1. Aceptación de los Términos" ... "5. Contacto"; y los EN "1. Information We Collect" ... "8. Retention and Opt-Out", "1. Acceptance of Terms" ... "5. Contact" (el punto es la numeración) | doc `pages` `privacy` y `terms` | SÍ | Se reemplazan por el texto legal nuevo del global sombra, con encabezados sin número. Efecto en el corte, no en caliente |
| Lecciones nuevas, 2 | "Escalar exige contenido específico, no solo marca"; "En un sitio nuevo, lo primero es que Google lo rastree" | `56-case-lessons.ts` (nuevo) | no | Reescribir: "Escalar exige contenido específico y no solo marca"; "En un sitio nuevo lo primero es que Google lo rastree" (propuestas) |
| Home, bloque CodeFixes | "Errores reales, con el commit que los corrige" / EN "Real bugs, with the commit that fixes them" | bloque `codeFixesBlock` del doc `pages` home (semilla `scripts/seed-home.ts:77`) | SÍ | NO cambiar sin decisión de Juan (D-17) |
| Landings de servicio ES y EN | "El informe envejece, el sitio no deja de cambiar"; "Si tu contenido no es citable, la respuesta cita a otro"; "También tengo un auditor automatizado, gratis"; "¿Por qué Next.js/Payload en vez de WordPress?"; "¿Qué es exactamente el archivo llms.txt?" y sus EN | docs `pages` de servicios | SÍ | NO cambiar (SEO) |
| Stack | "Desarrollo, CMS y medios" / "Development, CMS & media"; EN "What I'd choose today, starting from zero" | doc `pages` stack y `messages` `stackPage.elegiriaHoyHeading` | SÍ (prod `/en/stack` ya los sirve, verificado) | Dejar y pedir decisión |
| Mensajes con puntuación en una clave Heading o Title | `auditorCallout.heading` ES "También tengo un auditor automatizado, gratis" (respaldo del bloque); `stackPage.elegiriaHoyHeading` EN con coma; `home.heroTitle` (ES y EN, con dos puntos) sin uso en `src` | `messages/es.json` y `en.json` | el sitio vivo ya sirve el mismo texto | `home.heroTitle` es código muerto (grep sin uso). Los otros dos: decisión de Juan, igual que el resto |
| Títulos de casos y posts en `/search?q=seo` | "Escalar el contenido legal educativo a más de 86,000 clics...", "Migración a Next.js sin perder tráfico orgánico", títulos de posts con dos puntos | colecciones `case-studies` y `posts` | SÍ | NO cambiar |
| Falsos positivos | "Desarrollo con Next.js y Payload" (home, `home-page.services.items[1].title`), "Dr. Manuel A. Vargas Hidalgo", ".llms.txt" | | | Ninguna. El contrato cuenta cualquier "." y ","; propongo afinar su regex a un punto o coma seguido de espacio o fin de cadena |

Recomendación: ejecutar D-17 como (a) texto legal nuevo y lecciones limpias desde el origen, (b) un único `checkpoint:decision` con la lista de master-served para que Juan elija cuáles tocar en el corte, y (c) `--strict-headings` solo sobre las rutas que no sirve master (todas menos servicios y stack) en el gate de la 57.

## 8. Rayas en messages y verificador de paridad

[VERIFIED: grep de U+2014 y U+2013 en `messages/es.json` y `en.json`]

| Clave | ES antes | EN antes |
|-------|----------|----------|
| `emailCapture.description` | "5 categorías, decenas de checks accionables <RAYA> el mismo criterio que uso en mis propias auditorías." (línea 116) | "5 categories, dozens of actionable checks <RAYA> the same criteria I use in my own audits." (116) |
| `emailCapture.privacySuffix` | sin raya en ES (". Solo te escribiremos para confirmar la descarga, sin spam."), pero con "escribiremos" en plural | ". We'll only email you to confirm your download <RAYA> no spam." (122) |
| `emailCapture.alreadyBody` | "Revisa tu bandeja <RAYA> ya deberías tener el checklist." (126) | "Check your inbox <RAYA> you should already have the checklist." (126) |
| `emailCapture.errorBody` | "Algo salió mal. No pudimos registrar tu correo <RAYA> intenta de nuevo en un momento." (127) | "Something went wrong. We couldn't register your email <RAYA> please try again in a moment." (127) |

Total: ES 3 (líneas 116, 126, 127), EN 4 (116, 122, 126, 127). Las 7 están en `emailCapture`. Propuesta de después (a aprobar por Juan; voz en singular, sin "nosotros"):

| Clave | ES después | EN después |
|-------|------------|------------|
| `description` | "5 categorías y decenas de checks accionables, el mismo criterio que uso en mis propias auditorías." | "5 categories and dozens of actionable checks, the same criteria I use in my own audits." |
| `alreadyBody` | "Revisa tu bandeja. Ya deberías tener el checklist." | "Check your inbox. You should already have the checklist." |
| `errorBody` | "Algo salió mal y no pude registrar tu correo. Intenta de nuevo en un momento." | "Something went wrong and I couldn't register your email. Please try again in a moment." |
| `privacyPrefix` | "Al suscribirte aceptas mi " (hoy "nuestra") | "By subscribing you accept my " (hoy "our") |
| `privacySuffix` | ". Solo te escribo para confirmar la descarga, sin spam." | ". I'll only email you to confirm your download, no spam." |
| `pendingBody` (EN) | sin cambio | "I sent you a link to confirm your subscription and unlock the download." (hoy "We sent") |

El script de paridad: `emailCapture` NO está en `REVIEWED` de `scripts/verify/54-messages-parity.mjs:34` (`['common','home','services','about','contact','stack','legal','search','notFound']`), así que hoy no se vigilan sus rayas. `55-messages-parity.mjs:21,29` importa `REVIEWED` y `REQUIRED` de la 54 y agrega seis namespaces de la 55. Para cumplir D-19: agregar `'emailCapture'` a `REVIEWED` (y a `REQUIRED`) en la 54; la 55 lo hereda. Al entrar, la regla 6 (claves que terminan en `heading` o `title` sin punto ni coma) se aplica a `emailCapture.heading`, `pendingHeading` y `alreadyHeading`: hoy pasan. Actualizar la autoprueba de la 54 si su fixture lista los namespaces.

## 9. Textos alternativos

Fotos de Sobre mí y de la home (media ya subida en la fase 54, docs nuevos que `master` no lee): los alt están en `scripts/db/data/54-media-manifest.ts` y el HTML de dev ya los sirve [VERIFIED: manifest 38-70 y curl dev].
- Hero de Sobre mí: "Juan Carlos Angulo sonriendo, con gafas y chaqueta negra sobre una camisa clara, frente a una pared gris con una lámpara cálida y una planta trepadora a un lado". Está marcado en el código como BORRADOR de `designs/design-system-mui/A11Y-DECISIONS.md` ("Foto de Sobre mí") pendiente de confirmación de Juan (bandera `--alts-confirmed`).
- Home, About: tres fotos con alt descriptivo ("Juan Carlos Angulo dando el taller de SEO técnico, con la diapositiva de introducción al SEO técnico detrás", "Juan Carlos Angulo trabajando frente a una laptop, con luz cálida de ventana", "Juan Carlos Angulo con chaqueta oscura, sonriendo, con luces cálidas detrás").
- El alt de la segunda foto de Sobre mí (taller, Caracas SEO Fest) viene de `authors`/`speaking-events` y en dev sale vacío (`alt=""` una vez en `/sobre-mi`); sin dato no hay foto.
- Acción de la fase: Juan confirma o corrige esos 4 alt (ya aplicados; si cambia alguno, se actualiza el doc Media propio de la 54, seguro porque `master` no lo lee). El EN del alt debe sembrarse: `media.alt` es `localized: true` (`src/collections/Media/index.ts:33-38`) y en EN hoy se sirve el alt en español.

Capturas de Websites (docs de Media que `master` también lee): las 6 capturas (`media/<slug>-screenshot` en Cloudinary) tienen alt `"<Nombre> <RAYA> captura de pantalla completa"` en ES y en EN (ejemplo servido: "Apturio <RAYA> captura de pantalla completa") [VERIFIED: curl dev /websites y /]. Defectos: lleva raya larga (viola D-04), no describe el contenido, y el EN sale en español. Los componentes leen `image.alt ?? t('screenshotAlt')` (`WebsiteDetailView.tsx:118`, `ProjectCard.tsx:42`, `WebsitesIndexView.tsx:69`), así que el alt de Media manda. Como son campos que `master` ya sirve, se cargan en el corte (D-02) con un script en seco que primero imprime ES y EN actuales como respaldo. Los textos nuevos los redacta Claude solo con lo visible en cada captura (verificar cada imagen antes de describirla; no inventar), y los aprueba Juan.

## 10. Testimonios

- Payload tiene UNA fila: id 1, Patricia Ibarra, empresa Estylopia, rol "CEO" [VERIFIED: GET público `/api/testimonials` de prod, `totalDocs: 1`].
- ES: "Trabajar con Juan fue lo mejor." EN: "Working with Juan was the best decision we made." Las dos frases NO dicen lo mismo (la EN es más larga y cambia el sentido). Decisión para Juan: confirmar cuál es la cita real y alinear la traducción.
- La home de dev muestra la sección "Clientes que trabajaron conmigo" con solo esa cita, ES y EN [VERIFIED: curl dev]. No hay marcador de testimonio en el HTML. `scripts/db/data/54-home-copy.ts:11-13` documenta que no se siembra ninguna ranura de testimonio del sandbox.
- La colección `testimonials` tiene `read: () => true` y la lee `master` (bloque `TestimonialsCarousel`): una fila nueva que Juan pegue aparecerá en producción en caliente. Avisarle.
- Lima y Madrid conservan `[PLACEHOLDER]` en datos (sus testimonios de relleno), ocultos por `omitPlaceholder` en la vista; quedan como están (fuera de alcance).

## 11. Verificadores a actualizar

Cuatro scripts tienen cableado el marcador o el número de etapas. Todos se cambian en el MISMO plan que cierra la línea de tiempo.

| Archivo | Líneas | Qué dice hoy | Cambio |
|---------|--------|--------------|--------|
| `scripts/verify/54-page-contract.mjs` | 56-62 | `const KNOWN_PENDING = { '/sobre-mi': ['{{pendiente}} fecha del cambio de nombre'], '/en/sobre-mi': ['{{pendiente}} fecha del cambio de nombre'] }` | Vaciar a `{}` (o borrar la constante y su único uso, el bucle de la línea 243). Y reescribir la autoprueba de 337-350 (hoy espera "un WARN y ningun fallo" para el marcador conocido): el marcador debe ser FAIL en cualquier ruta |
| `scripts/verify/54-about-ssr.ts` | 116, 117, 118, 159, 162 | `stages.length === 5`; `stages[2]?.when?.startsWith('{{pendiente}}') === true`; `stages[4]?.link?.external === true`; `data-current="true"` = 2 y `"false"` = 3; `textOf(html).includes('{{pendiente}}')` | Con 4 etapas: longitud 4; el enlace externo pasa al índice 3; 3 actuales y 1 pasada (o calcular desde el fixture); línea 117 y 162 invertidas: NO debe haber marcador |
| `scripts/verify/54-seed-selftest.ts` | 167-180, 205-207, 248 | guardia del marcador, "el único marcador es la fecha de aprendoclub" (`aprendo.length === 1 && aprendo[0].org === 'aprendoclub'`), `stages.length === 5` | 205-207: cero marcadores en `ABOUT_COPY_ES`; 248: 4 etapas. Las pruebas de 167-180 son de la librería y se quedan |
| `scripts/db/data/54-seed-lib.ts` | 416-418 | `add('about-page.experience.stages tiene 5', nStages === 5, ...)` | 4 (o constante). Y `scripts/db/23-phase54-verify-schema.ts:48` (fixture con 5 etapas) |
| `scripts/db/20-phase54-seed-shadow-content.ts` | 56 | `{ slug: 'about-page', copy: ABOUT_COPY_ES, pendingPaths: ABOUT_PENDING_PATHS }` | Pasar `[]` o importar la constante ya vacía. Además este script usaría `mergeGroup`, que se niega a reducir filas |
| `scripts/verify/54-no-sandbox-data.mjs` | 28-50 y 103 | Audita solo `src/`; el 103 es el fixture del marcador | NO hace falta tocarlo: no encontró marcadores en `src` y su fixture es una autoprueba. Mejora opcional: que `56-content-guard.mjs` aplique `findPendingMarkers` a `scripts/db/data` |

`54-about.mjs` (contrato vivo de Sobre mí) solo exige un `ul MuiTimeline-root` con al menos un `li` (líneas 5 y 86-87): no cambia.

## 12. Validación (Nyquist) para una fase de contenido

`.planning/config.json` tiene `workflow.nyquist_validation: false` [VERIFIED: config.json]. El orquestador pidió la sección de todas formas: va abajo como recomendación y el planificador puede omitirla si prefiere respetar el flag.

## 13. Dónde viven las opciones del hero A..E y las opciones 1..3

Busqué en `research/`, `.planning/`, `designs/`, `reports/` y `scripts/` los textos "Consultor SEO técnico que también programa" y las demás opciones [VERIFIED: grep]. Resultado:
- La opción A ("Consultor SEO técnico que también programa") aparece SOLO en `56-CONTEXT.md` (D-22). No existe en ningún otro archivo.
- Las opciones B a E del título, 1 a 3 del texto del hero, 1 a 3 del tagline, 1 a 3 del título de medición, 1 a 2 del texto de medición y 1 a 2 del lead de servicios NO están en el repo. Solo existen en la conversación. No las inventé.
- Lo que sí hay en el repo es el valor VIGENTE de cada uno (lo que se sembró en la fase 54, que Juan rechazó):

| Decisión | Valor vigente | Ubicación |
|----------|---------------|-----------|
| Hero título | "Arreglo el SEO" y "desde el código" | `54-home-copy.ts:19-20`; sandbox `components/home/Hero.tsx:86` |
| Hero texto | "Entro al código, corrijo lo que frena a Google en tu sitio y mido el resultado en Search Console. Trabajo en español e inglés." | `54-home-copy.ts:21` |
| Estadística | "+406 %" con "clics interanuales en un caso de salud" | `54-home-copy.ts:24-25` |
| Tagline | "Abro tu código, encuentro lo que Google no logra leer y lo arreglo yo mismo. Después vuelvo a Search Console para ver si el cambio funcionó." | `54-home-copy.ts:15-16`; sandbox `data/home.ts` (última línea) |
| Medición título y lead | "Medición antes de tocar el código"; "Cuatro lecturas me dicen dónde duele un sitio. La barra de cada una marca el rango que Google considera bueno, mejorable y pobre." | `54-home-copy.ts:28-29` |
| Notas "Bueno: hasta" a quitar | "Bueno: hasta 2.5 s", "0.1", "200 ms", "0.8 s" | `54-home-copy.ts:42,53,64,75` |
| Servicios lead e ítem SEO técnico | "Trabajo yo mismo en cada proyecto. Empiezo por lo que ve Googlebot y de ahí decido qué tocar." y "Audito rastreo, indexación y datos estructurados. Empiezo por lo que ve Googlebot y de ahí decido qué tocar." | `54-home-copy.ts:81,87` |

Estadísticas candidatas: se pueden verificar contra el HTML de los casos hoy: +309 % Atlanta (9,621 a 39,323), +406 % urología (48 a 243), +143 % baldosa (9,629 a 23,410), +104 % edtech (6,113 a 12,485), +83 % Pittsburgh, +68 % migración (es tráfico MENSUAL de 82K a 138K, no clics anuales: el pie de foto debe decirlo) [VERIFIED: curl dev tabla de comparación]. "+18 clientes" aparece como "más de 18 clientes internacionales" en el cuerpo de la etapa aprendoclub de Sobre mí (`54-about-copy.ts:60`) y no tiene respaldo medido: por confirmar.

Patrón para el archivo `56-content-decisions.ts` (constante única por texto, con estado):

```ts
// Sketch: una decisión = una constante; cambiar la elección es cambiar una línea.
export type DecisionStatus = 'aprobado' | 'propuesto' | 'pendiente'
export const HERO_TITLE = {
  status: 'propuesto' as DecisionStatus,
  chosen: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
  options: { A: { es: 'Consultor SEO técnico que también programa', en: undefined /* por traducir y aprobar */ } },
  // B a E: por listar desde la conversación. No inventarlas.
} as const
```

El gate de la 57 lee `status` de cada constante. Un texto `pendiente` no se siembra; un `propuesto` se siembra con el valor recomendado (D-22) y se anota en el handoff.

## Runtime State Inventory

Esta fase reemplaza textos con datos viejos (Hostinger, Google Analytics, stack equivocado), así que aplica el inventario.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Docs `pages` `privacy` y `terms` (ES y EN) con "Google Analytics", "Cloudflare Insights" y "Hostinger"; filas `websites` `ariannalupi-com`, `juan-tech-com`, `apturio-com`, `aprendoclub-com` con stack "Neon Postgres" y "Hostinger"; `media.alt` de 6 capturas con raya y EN en español; `authors` (fila de Juan) con experiencia "nov 2022 a feb 2026" para aprendoclub y "En curso" en Ingeniero de software, que contradice "nov 2022 a hoy" de Sobre mí | Datos, no código: carga en el corte con scripts en seco. El global `legal-pages` evita tocar `pages` |
| Live service config | Resend (envío) y Cloudinary (medios) ya activos; no hay configuración de analítica que apagar (no hay GA4 ni Cloudflare Insights) | Ninguna acción; el texto legal solo deja de nombrarlos |
| OS-registered state | Ninguno. Verificado: no hay tareas programadas del sitio en el repo para este texto | None |
| Secrets/env vars | `CONTACT_TO_EMAIL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` por nombre en `contact.ts` y `payload.config.ts`; el texto legal no las nombra | None. No imprimir valores |
| Build artifacts | `src/payload-types.ts` cambia al agregar el global (correr `generate:types`); `src/migrations/index.ts` y el `.json` de la migración nueva | Regenerar tipos; sin paquetes instalados |

## Common Pitfalls

### Pitfall 1: Sembrar solo parte del EN
**What goes wrong:** el aviso "This page is not available in English yet" sigue apareciendo.
**Why:** el centinela de EN es `tagline` en home y `hero.lead` en Sobre mí (`cache.ts:176,201`); si falta, `isFallback` es verdadero para toda la página.
**How to avoid:** sembrar el centinela con el valor recomendado y marcarlo `propuesto`; verificar `/en` sin la cadena "not available in English".
**Warning signs:** `/en` muestra "Pedir auditoría 360" (ya ocurre hoy).

### Pitfall 2: Fusionar etapas exige borrar una fila
**What goes wrong:** `mergeGroup` lanza "la base tiene 5 filas y el copy 4. Este script no borra filas" (`54-seed-lib.ts:129-134`) y el script `20` aborta.
**Why:** D-11 funde aprendoseo y aprendoclub en una sola entrada.
**How to avoid:** script nuevo con bandera explícita `--allow-shrink-stages`, dry-run que imprime la fila que sobra, y aprobación por nombre de Juan (CLAUDE.md pide confirmación antes de una operación destructiva o de un reshape que pierda datos). Los datos son reproducibles desde `54-about-copy.ts`, y el global es sombra (no lo lee `master`), pero la regla pide confirmar. Alternativa sin borrar: conservar 5 filas, que no encaja con D-11.
**Warning signs:** el dry-run dice `experience.stages.length` distinto.

### Pitfall 3: El lead de Sobre mí contradice D-11
**What goes wrong:** aunque se cierre el marcador, la página sigue diciendo "AprendoSEO, aprendoclub y Loops Growth son el mismo equipo con tres nombres" (`54-about-copy.ts:39`) y "El equipo cambia de nombre otra vez y hoy es Loops Growth" (`:67`), cuando D-11 dice que Loops es una empresa distinta y paralela.
**How to avoid:** reescribir el lead y el cuerpo de la etapa Loops (con la frase de D-12) en el mismo cambio. Y reconciliar `authors` (fila de Juan) que dice otra cosa.

### Pitfall 4: Escribir en Media o en Websites sin decidir cuándo
**What goes wrong:** el alt o el stack de Arianna cambian en producción al instante (D-02).
**How to avoid:** guardar en archivos de datos y cargar en el corte; el script imprime el valor actual como respaldo antes de escribir.

### Pitfall 5: `draft: false` y fallback de locale
**What goes wrong:** un `update` sin `draft: false` despublica el doc (colecciones con borradores: `case-studies`, `websites`, `pages`); leer EN sin `fallbackLocale: false` devuelve el ES y se salta la siembra EN [VERIFIED: memoria `reference_trampas_scripts_payload.md`].
**How to avoid:** copiar los helpers y el estilo de `20-phase54-seed-shadow-content.ts`; verificar contra el HTML servido, no contra el OK del script (TTL de 60 s).

### Pitfall 6: Texto legal que afirma algo falso
**What goes wrong:** repetir "guardo los envíos del formulario 12 meses" cuando no se guardan en la base, o declarar "no hay cookies" cuando existe `NEXT_LOCALE`.
**How to avoid:** cada afirmación del texto legal lleva su evidencia (tabla 4.2) en `56-legal-copy.ts` como comentario, y un verificador exige que "Hostinger", "Google Analytics" y "Cloudflare Insights" no aparezcan en `/privacy` y `/terms` en ES y EN.

### Pitfall 7: Rol del preview sin SELECT en las tablas nuevas
**What goes wrong:** `permission denied` en el preview tras la migración del global.
**How to avoid:** repetir el paso 8 de `55-06-PLAN.md` (verificar con `juantech_preview_ro`); si falla, `GRANT SELECT` dentro de la migración en un plan nuevo.

### Pitfall 8: Verificar contra la base equivocada o antes del TTL
**How to avoid:** `04-which-database.ts` antes de escribir; esperar 60 s o el despliegue `done` (ordenar por `createdAt`) y verificar HTML de `dev.juan-tech.com`.

## Code Examples

### Slot de fecha legal en LegalView (sketch, mínimo)
```tsx
// Source: src/components/pages/LegalView.tsx (estructura actual), UI-SPEC línea 223: sin dato no se renderiza nada
type Props = { /* ...props actuales... */ effectiveDate?: string | null }
// dentro de <PageHero compact ...>:
{effectiveDate ? (
  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
    {t('effectiveOn', { date: formatDate(effectiveDate, locale) })}
  </Typography>
) : null}
// messages: legal.effectiveOn ES "Vigente desde el {date}" / EN "Effective as of {date}"  (propuesta, sin raya)
```

### Siembra del global legal con respaldo (sketch)
```ts
// Source: patrón de scripts/db/20-phase54-seed-shadow-content.ts:60-105 y scripts/seed-legal-pages.ts:15-43
const current = await payload.findGlobal({ slug: 'legal-pages', locale, fallbackLocale: false, depth: 0 })
const diff = buildDiff(current, desired)                    // solo lectura en dry-run
if (!APPLY) return                                          // DRY-RUN por defecto
await payload.updateGlobal({ slug: 'legal-pages', locale, data: mergeGroup(current, desired) })
```

### Checkpoint de base de datos (formato de 55-06)
```bash
# Terminal A (déjala abierta)
./scripts/db/tunnel.sh
# Terminal B
export DATABASE_URI="$(ssh -i ~/.ssh/sapling_ed25519 juan@116.203.79.125 'CID=$(sudo docker ps --filter name=app-program-online-alarm -q); sudo docker exec "$CID" printenv DATABASE_URI' | sed 's#@shared-postgres:5432#@127.0.0.1:15432#; s#$#?sslmode=disable#')"
node -e "const u=new URL(process.env.DATABASE_URI);console.log(u.hostname,u.port,u.pathname)"   # debe imprimir: 127.0.0.1 15432 /juantech
node_modules/.bin/tsx scripts/db/04-which-database.ts                                          # sin --env-file
node_modules/.bin/tsx scripts/db/26-phase56-seed-shadow.ts                                      # dry-run
node_modules/.bin/tsx scripts/db/26-phase56-seed-shadow.ts --apply --db-checked
```
(El patrón de `DATABASE_URI` es el del brief; el hook bloquea `--env-file=.env`.)

## State of the Art

| Antes | Ahora | Cuándo | Impacto |
|-------|-------|--------|---------|
| Texto legal con Google Analytics, Cloudflare Insights y Hostinger | Debe describir que no hay analítica, la cookie `NEXT_LOCALE` y los proveedores reales | esta fase | CONT-03 |
| Marcador `{{pendiente}}` permitido en `/sobre-mi` | Marcador prohibido en cualquier ruta | esta fase | Endurecer `54-page-contract` |
| Copy sombra solo ES | Siembra ES y EN, centinela EN sembrado | esta fase | quita el aviso de traducción |

**Deprecated/outdated:** `scripts/seed-legal-pages.ts` y `scripts/update-privacy-resend.ts` (texto con GA y Hostinger); no se vuelven a correr. `home.heroTitle` y `heroSubtitle` de `messages` no se usan en `src`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | La cookie `NEXT_LOCALE` es "estrictamente necesaria o de preferencia" y no exige banner | 4.2 y 4 | Un texto "no hace falta banner" podría ser inexacto para un lector de la UE. D-08 ya lo da por decidido, Juan debe confirmarlo |
| A2 | La plantilla CC0 no cubre la Ley 29733 de Perú y no sustituye asesoría legal | 4.3 | Falta de cobertura local; D-10 ya cubre la revisión opcional |
| A3 | El VPS es Hetzner (viene de D-08 y de la IP 116.203.79.125, no de una prueba de red) | 4.2 | El texto nombraría un proveedor equivocado. Juan confirma el nombre y la región |
| A4 | El buzón `hello@juan-tech.com` lo aloja algún proveedor de correo que no se nombra en el repo | 4.2 | El texto omitiría un subprocesador |
| A5 | "Retención de 12 meses" de los envíos del formulario es política de Juan | 4.1 | Hoy los correos viven en el buzón, no en una tabla; Juan decide el plazo real |
| A6 | Las opciones B a E del hero y 1 a 3 del resto existen solo en la conversación | 13 | Si están en otro archivo que no vi, el planificador debería leerlo |
| A7 | La ubicación (región) del servidor para la cláusula de transferencia internacional | 4.3 | El texto afirmaría un país equivocado |
| A8 | Las filas `juan-tech-com`, `apturio-com` y `aprendoclub-com` de Websites con "Neon" y "Hostinger" están desactualizadas | 2 | Sin confirmar: es la infraestructura de proyectos de clientes en algunos casos |

## Open Questions

1. **¿Cuál es la lista del lote 1 de CTAs con su inglés?**
   - Sabemos: el cierre de la home (ES y EN) y que "todo lo demás se aprobó tal como se listó".
   - No sabemos: los textos exactos, que existen solo en la conversación.
   - Recomendación: el orquestador pega la lista antes de planear `56-home-copy.ts`.

2. **¿Se corrige ahora la fila de Arianna Lupi (y los "Hostinger" de otras filas) o en el corte?**
   - Es una escritura en caliente a una fila que sirve producción. Recomiendo el corte, con script en seco.

3. **¿Se crea una fila `loopsgrowth-com` en Websites?** Recomiendo no hacerlo (cero datos de Juan) y cerrar ese marcador del sandbox por omisión.

4. **¿Quién hospeda el buzón `hello@juan-tech.com` y en qué región vive la base?** Datos para las secciones de proveedores y transferencia.

5. **¿Alcance real de los "36 encabezados"?** No lo pude reproducir; la tabla de la sección 7 es la base.

6. **¿Lista de Juan sobre "Ingeniero de software" a "ago 2028" y el EN de recursividad?** El 2028 vive en la fila `authors` (educación "may 2022 a ago 2028", "En curso"), no en el global de Sobre mí. La traducción EN de recursividad (D-21) es la decisión de tres opciones.

## Environment Availability

| Dependencia | Requerida por | Disponible | Versión | Alternativa |
|-------------|---------------|-----------|---------|-------------|
| Node | scripts y verificadores | sí | v24.13.0 | |
| tsx | scripts `scripts/db` | sí | en `node_modules/.bin` | |
| CLI `payload` | migración nueva | sí | en `node_modules/.bin` | |
| curl y dig (HTTP de lectura contra dev y prod) | verificación | sí | | |
| Túnel y relay a `shared-postgres` | cualquier escritura | NO para Claude (hook y regla) | | `checkpoint:human-action` de Juan |
| `~/.ssh/sapling_ed25519` y `scripts/db/tunnel.sh` | patrón de `DATABASE_URI` | solo en la máquina de Juan | `tunnel.sh` existe y es ejecutable | |
| Despliegue de Dokploy del preview | verificación en vivo | sí, 6 a 10 min | disco del VPS al 76 % (18 GB libres) | esperar `done` ordenando por `createdAt` |

**Missing dependencies with no fallback:** acceso a la base para Claude (por diseño).
**Autopruebas que corrí:** `54-messages-parity --selftest`, `54-page-contract --selftest` y `54-seed-selftest.ts` pasan hoy en esta rama [VERIFIED].

## Validation Architecture

> `nyquist_validation: false` en config: sección incluida por pedido del orquestador. El planificador puede omitirla.

### Test Framework
| Propiedad | Valor |
|-----------|-------|
| Framework | Scripts propios en `scripts/verify` (ESM `.mjs` y `.ts` vía tsx) con autopruebas `--selftest` y orquestador `*-run-all.mjs` |
| Config | ninguna; variables `BASE_URL`, `PROD_BASE`, `EXPECT_PREVIEW=1` |
| Quick run | `node scripts/verify/56-run-all.mjs --selftests` |
| Full suite | `BASE_URL=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/56-run-all.mjs --live` |

### Phase Requirements to Test Map
| Req | Comportamiento | Tipo | Comando | Existe |
|-----|----------------|------|---------|--------|
| CONT-01 | Ningún `{{` en el HTML de ES y EN (incluye el payload RSC) y cero marcadores en `scripts/db/data` | integración + estático | `node scripts/verify/56-no-marker-live.mjs`; `56-content-guard.mjs` | Wave 0 |
| CONT-01 | Línea de tiempo con 4 etapas, "nov 2022 a hoy", Loops como entrada paralela y sin "mismo equipo" | SSR y vivo | `tsx scripts/verify/54-about-ssr.ts` (actualizado) y `54-about.mjs` | actualizar |
| CONT-01 | Testimonios: solo Patricia Ibarra, ES y EN, sin placeholder | vivo | `56-no-marker-live.mjs` | Wave 0 |
| CONT-02 | Cada CTA del lote 1 (ES y EN) aparece en el HTML servido; el cierre sin "empiezo por mirar" | vivo | `56-cta-live.mjs` | Wave 0 |
| CONT-02 | Lecciones: 7 casos x 3, ES y EN, sin raya, título sin punto ni coma, cifras presentes en el HTML del caso | estático + vivo | `56-content-guard.mjs`; `56-cases-lessons-live.mjs --expect-loaded` (solo en el gate) | Wave 0 |
| CONT-03 | `/privacy` y `/terms` (ES y EN) sin "Hostinger", "Google Analytics", "Cloudflare Insights"; con Resend, Cloudinary, Hetzner, Cloudflare (DNS), `NEXT_LOCALE`, `hello@juan-tech.com` y la fecha efectiva | vivo | `56-legal-live.mjs` | Wave 0 |
| D-19 | `emailCapture` sin rayas, paridad ES y EN | estático | `node scripts/verify/54-messages-parity.mjs` (con `emailCapture` en `REVIEWED`) | actualizar |
| D-23 | `<title>` y meta description de la home idénticos a producción | vivo | `55-seo-parity.mjs` y `54-page-contract.mjs --parity-only --routes /,/en` | existe |
| D-01 | Ningún script de la fase escribe sin `--apply --db-checked` y todos importan `assertSafeTarget` | estático | `56-content-guard.mjs` (grep) y `56-seed-selftest.ts` | Wave 0 |
| Estado | Cada texto de `56-content-decisions.ts` tiene `status`; con `--gate` falla si queda `pendiente` o `propuesto` donde el texto es obligatorio | estático | `56-content-guard.mjs --gate` (lo corre la 57) | Wave 0 |

### Sampling Rate
- **Por tarea:** autoprueba del script tocado y `56-content-guard.mjs` (menos de 30 s, sin red).
- **Por ola:** `56-run-all.mjs --selftests` más regresión de 54 y 55.
- **Gate de la fase:** `56-run-all.mjs --live` contra dev tras esperar el despliegue `done` y 60 s de TTL, más los checkpoints humanos de Juan.

### Wave 0 Gaps
- [ ] `scripts/verify/56-content-guard.mjs`: rayas, marcadores y estado en los archivos `56-*.ts`; `--gate` para la 57
- [ ] `scripts/verify/56-seed-selftest.ts`: helpers puros y la guardia `assertSafeTarget`
- [ ] `scripts/verify/56-legal-live.mjs`, `56-no-marker-live.mjs`, `56-cta-live.mjs`, `56-cases-lessons-live.mjs`
- [ ] `scripts/verify/56-run-all.mjs` (molde de `55-run-all.mjs`, importando la regresión de 54 y 55)
- [ ] `scripts/db/25-phase56-verify-schema.ts` (solo lectura, `--selftest`, `--expect-seeded`)

## Security Domain

`security_enforcement` está activo (ASVS nivel 1, bloqueo en `high`) [VERIFIED: config.json].

### Applicable ASVS Categories
| Categoría | Aplica | Control estándar |
|-----------|--------|------------------|
| V2 Autenticación | no | No hay login nuevo |
| V3 Sesiones | no | Solo la cookie de idioma, ya existente |
| V4 Control de acceso | sí | Global `legal-pages` sin `access` (403 anónimo); escrituras solo con `juantech_user` vía túnel |
| V5 Validación de entrada | sí | `sanitizeHref` en `ctaHref` y `linkHref`; `assertNoForbiddenChars`; el texto legal entra como Lexical generado por script, no HTML libre |
| V6 Criptografía | no | Nada nuevo |
| V8 Protección de datos | sí | El texto legal debe describir el tratamiento real; ningún secreto impreso; la IP no se guarda |
| V14 Configuración | sí | `assertSafeTarget`, `04-which-database.ts`, dry-run por defecto |

### Known Threat Patterns
| Patrón | STRIDE | Mitigación estándar |
|--------|--------|---------------------|
| Escribir contra la Neon abandonada o la base equivocada | Tampering | `assertSafeTarget` y pre-flight `127.0.0.1 15432 /juantech` |
| Sobrescribir en caliente un campo que sirve producción | Tampering | Sombra o corte; el script imprime el valor previo como respaldo |
| Fuga de `DATABASE_URI` o claves en la salida pegada | Information Disclosure | Los scripts imprimen solo host, puerto y base |
| `href` malicioso en un CTA nuevo | Tampering | `sanitizeHref` ya cubre `ctaHref` y `linkHref` (T-54-53) |
| Texto legal que declara tratamiento que no ocurre | Repudiation (riesgo legal) | Evidencia por afirmación (tabla 4.2) y verificador de cadenas prohibidas |
| Borrar filas de `stages` sin querer | Tampering | `mergeGroup` ya lo impide; el recorte exige bandera y aprobación por nombre |

## Project Constraints (from CLAUDE.md)

- Seguir el flujo GSD; no editar fuera de un comando GSD salvo orden de Juan.
- Base de datos: no hay base de desarrollo; `DATABASE_URI` apunta a producción en Dokploy. Antes de escribir se confirma la base con `scripts/db/04-which-database.ts`. Aditivo y escrituras normales no piden confirmación; `DROP COLUMN`, `DROP TABLE`, `TRUNCATE`, borrados y reshapes con pérdida piden lectura del SQL y aprobación por nombre de Juan. (Aplica al recorte de etapas y a cualquier `DROP`.)
- Migraciones con `payload migrate:create`, leyendo el SQL; si solo es aditiva se aplica; nada de `push` en producción (`push: false`).
- Accesibilidad estricta según `A11Y.md` en cualquier vista tocada (`LegalView`).
- Entregables escritos humanizados con la voz de Juan (`research/voice-sample-juan.md`, `voice-and-tone-juan.md`), sin rayas largas ni medias, encabezados sin puntos ni comas.
- Despliegue: Dokploy automático al mergear a `master`; validar contra `juan-tech.com` o el preview, nunca local. Nunca tocar `master` en esta fase.
- No hay skills de proyecto (`.claude/skills` sin `SKILL.md` de proyecto aplicable a esta fase).

## Plan partition sugerida (Claude's Discretion)

| Ola | Contenido | Espera a Juan |
|-----|-----------|---------------|
| 1 | Esquema `legal-pages` y migración aditiva; `56-content-decisions.ts`; `56-content-guard`, `56-seed-selftest`, `56-run-all` con regresión; actualizar verificadores de 11; `emailCapture` limpio y en `REVIEWED` | nada |
| 2 | Línea de tiempo (4 etapas, lead corregido) ES y EN; copy de home con los CTAs aprobados y los defaults recomendados; checkpoint de BD (siembra sombra de `home-page` y `about-page`) | pega la lista del lote 1 y aprueba el EN |
| 3 | Texto legal ES y EN, slot de fecha en `LegalView`, siembra de `legal-pages` | aprueba texto legal, confirma Hetzner, región y buzón |
| 4 | Lecciones ES y EN (21), alts de capturas, stack de Arianna, fecha legal, `28-phase56-cutover-load.ts` en seco | aprueba lecciones, alts, stack; fija la fecha el día del corte |

Items que esperan a Juan (cada uno como `checkpoint:decision` ANTES de sembrar, con recomendación): hero título A a E (rec A), hero texto 1 a 3 (rec 1), estadística (rec +309 % Atlanta, con pie "clics interanuales en un caso de inmigración", a verificar), tagline 1 a 3 (rec 1), título de medición 1 a 3 (rec 1), texto de medición 1 a 2 (rec 1), lead de servicios 1 a 2 (rec 1) y quitar la frase de Googlebot del lead y del ítem SEO técnico, línea de tiempo de Sobre mí, fecha fin "Ingeniero de software" 2028, traducción EN de recursividad (D-21). Todas con constante única en `56-content-decisions.ts` y estado aprobado, propuesto o pendiente por texto. También esperan aprobación: copia EN, lecciones, encabezados, alts y texto legal.

## Sources

### Primary (HIGH confidence)
- Repo, leídos con Read esta sesión: `56-CONTEXT.md`, `56-DISCUSSION-LOG.md`, `.planning/phase-56-prep/aprobaciones-juan.md`, `scripts/db/data/54-about-copy.ts`, `54-home-copy.ts`, `54-seed-lib.ts`, `54-media-manifest.ts`, `scripts/db/20-phase54-seed-shadow-content.ts`, `scripts/seed-legal-pages.ts`, `scripts/update-privacy-resend.ts`, `scripts/verify/54-page-contract.mjs`, `54-no-sandbox-data.mjs`, `54-messages-parity.mjs`, `src/globals/HomePage` y `AboutPage`, `src/lib/cache.ts`, `cta-data.ts`, `placeholder.ts`, `src/components/pages/LegalView.tsx`, `src/app/(frontend)/[locale]/privacy|terms/page.tsx`, `src/app/actions/contact.ts`, `src/collections/CaseStudies`, `Testimonials`, `Websites`, `Media`, `Subscribers`, `AffiliateClicks`, `messages/es.json` y `en.json`, `designs/design-system-mui/src/data/*`, `A11Y-DECISIONS.md`, `.planning/phases/55-*/55-06-PLAN.md`, `.planning/config.json`.
- HTTP de lectura 2026-11-10: `dev.juan-tech.com` y `juan-tech.com` (HTML de home, Sobre mí, contacto, servicios, websites, casos, privacy, terms, stack, Lima, Madrid), `/api/testimonials` público, `ariannalupi.com`, `loopsgrowth.com`, `dig` de NS y A de `juan-tech.com`.
- `54-page-contract.mjs` ejecutado contra dev (solo HTTP de lectura): 60 PASS, 0 FAIL, 68 WARN.
- Plantillas CC0: `https://github.com/General-Legal/legal-templates` (`templates/privacy-policy-gdpr`, `privacy-policy-us`, `terms-of-use`, `cookie-notice`, LICENSE).

### Secondary (MEDIUM confidence)
- `54-CONTEXT.md:59`, `54-UI-SPEC.md:223,228,367`, `54-07-PLAN.md` (formato de checkpoint de BD).
- Memoria del proyecto: `reference_trampas_scripts_payload.md`, `feedback_voz_tono_sitio.md`, `project_deploy_dokploy_master.md`.

### Tertiary (LOW confidence)
- Cualquier afirmación marcada `[ASSUMED]` en el Assumptions Log.

## Metadata

**Confidence breakdown:**
- Inventario de marcadores y de CTAs: HIGH, leído en el repo y en el HTML servido hoy.
- Mecanismo sombra para legal: HIGH en la mecánica (calcada de la 54), MEDIUM en el rol del preview (se verifica con 25 y el rol real).
- Texto legal: MEDIUM, es una redacción de hechos verificados, no asesoría legal.
- Opciones del hero y del lote 1: LOW, no están en el repo.

**Research date:** 2026-11-10
**Valid until:** 2026-11-17 (el preview y producción cambian con cada despliegue; reverificar el inventario antes de ejecutar)
