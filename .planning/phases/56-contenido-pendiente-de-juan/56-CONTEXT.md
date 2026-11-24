# Phase 56: Contenido pendiente de Juan - Context

**Gathered:** 2026-11-10
**Status:** Ready for planning
**Mode:** Auto (`--auto`), no interactivo. Las decisiones de Juan ya registradas en `.planning/phase-56-prep/aprobaciones-juan.md` y en la conversación son LOCKED. Lo que Juan aún no respondió se planea como `checkpoint:decision` con opciones y recomendación y no bloquea el resto del trabajo.

<domain>
## Phase Boundary

Cerrar los textos que solo Juan decide, para que ningún borrador del sandbox llegue a producción. Requisitos: CONT-01 (marcadores `{{pendiente}}`: fecha aprendoclub, stack de Arianna Lupi, datos de Loops Growth, fecha legal, testimonios), CONT-02 (CTAs y lecciones aprendidas de los 7 casos) y CONT-03 (texto legal: hoy dice Hostinger y la infraestructura real es Hetzner con Dokploy).

Esta fase PREPARA y CARGA contenido; no cambia código de vistas salvo lo mínimo para renderizar (por ejemplo quitar el marcador). Corre en paralelo a 54 y 55 y bloquea solo la fase 57.

Fuera de alcance: portal de reseñas (después del corte, milestone nuevo), landings Lima y Madrid (se dejan como están, los marcadores de relleno los ocultan las vistas), cambio del `<title>` y la meta description de la home (se decide después con datos de Search Console), cualquier tarea de corte, merge o limpieza de Tailwind (fase 57), traducciones de posts sin EN (deuda previa, fuera de alcance).

</domain>

<decisions>
## Implementation Decisions

### Reglas de oro heredadas (LOCKED)
- **D-01:** Escrituras a la base SOLO con scripts aditivos o de siembra en `scripts/db/`, con modo dry-run por defecto y bandera explícita para escribir. Antes de escribir se corre `scripts/db/04-which-database.ts`. Claude no abre túnel ni relay y el hook bloquea `--env-file=.env`: cada carga es un `checkpoint:human-action` con comandos exactos, siguiendo el patrón de los planes 54-07 y 55-06 (túnel en terminal A, `DATABASE_URI` sacada con el patrón `ssh ... printenv DATABASE_URI | sed`, nunca tecleada a mano, pre-flight que imprime `127.0.0.1 15432 /juantech`, salida pegada como evidencia). — **Reversibility:** costly — la base es la de producción y no hay sandbox.
- **D-02:** `dev.juan-tech.com` comparte la base con producción. Todo contenido que `master` ya sirve hoy (privacy, terms, mensajes, campos existentes) NO se sobrescribe en caliente: o va a campos/globals sombra que solo lee la rama del rediseño, o se carga en el momento del corte. Nunca se toca `master`. — **Reversibility:** one-way — sobrescribir un campo que producción lee cambia el sitio live al instante.
- **D-03:** Las lecciones de los casos se escriben a Payload SOLO cuando Juan las apruebe, y el script de carga queda listo, probado en dry-run y marcado para correrse en el corte (fase 57). Motivo: el admin de `master` no conoce el campo `lessons` y un guardado allí podría borrarlas. El campo `lessons` ya existe en `src/collections/CaseStudies/index.ts` (fase 55-03). — **Reversibility:** costly.
- **D-04:** Sin secretos impresos. `A11Y.md` estricto en cualquier vista tocada. Sin rayas largas ni medias en entregables en español. Todo entregable escrito pasa por el humanizer calibrado con `research/voice-sample-juan.md` y las reglas de voz: encabezados y meta títulos sin puntos ni comas, se habla de Juan y no de una agencia, tono de experto que enseña.
- **D-05:** El gate de UI-SPEC se omite (igual que en la fase 55): el diseño es el sandbox aprobado. Se referencian `54-UI-SPEC.md` y las excepciones de `54-CONTEXT.md` (escala display y escala vertical de sección, texto de cuerpo 12/14/16/20 px con pesos 400 y 600).

### Identidad y legal (CONT-03, CONT-01 fecha legal)
- **D-06:** Juan opera como persona natural: Juan Carlos Angulo, Perú. Contacto legal y del formulario: `hello@juan-tech.com` (el buzón recibe y envía; producción ya envía desde `no-reply@juan-tech.com` por Resend y tiene `CONTACT_TO_EMAIL=hello@juan-tech.com`).
- **D-07:** Plantilla base: `General-Legal/legal-templates` (CC0): `templates/privacy-policy-gdpr/template.md` como base, con apoyo de `privacy-policy-us`, `terms-of-use` y `cookie-notice`. Se adapta a ES y EN, redactadas en la voz de Juan. No se pega la plantilla cruda.
- **D-08:** Hechos reales que el texto debe reflejar: no hay scripts de analítica en el código ni en el HTML de producción; la única cookie es funcional (`NEXT_LOCALE`, preferencia de idioma), por lo tanto NO hace falta banner de cookies y el texto lo dice; proveedores: Resend (correo), Cloudinary (medios), Hetzner VPS con Dokploy (hosting), Cloudflare (DNS); el lead magnet guarda correos de suscriptores (doble opt-in); el formulario de contacto guarda los datos que se envían; hay enlaces de afiliado con divulgación. Los textos actuales mencionan Hostinger y Google Analytics: ambos deben desaparecer o corregirse tras verificar contra el código (el researcher confirma si hay GA4 real; el estado conocido es que no).
- **D-09:** Fecha efectiva = el día del corte. Se deja como un único valor parametrizado que se fija justo antes del merge (insumo del gate de la fase 57), no una fecha inventada hoy. El marcador legal `{{pendiente}}` se reemplaza por ese valor en el paso de corte.
- **D-10:** Juan no es abogado. El texto incluye nota interna (en el handoff, no en el sitio) de revisión legal opcional tras el corte. — **Reversibility:** reversible.

### Sobre mí (CONT-01 fecha aprendoclub, Loops Growth, Arianna Lupi)
- **D-11:** Línea de tiempo: aprendoseo (nov 2022) renombrada aprendoclub es UNA entrada continua con rango "nov 2022 a hoy". Loops Growth "2024 a hoy" es una entrada paralela (empresa distinta que coexiste). Coach del diplomado "mar 2025 a hoy". Se elimina el marcador `{{pendiente}} fecha del cambio de nombre` de `scripts/db/data/54-about-copy.ts` (línea 57, etapa índice 2). **PENDIENTE de confirmación de Juan** ("Línea de tiempo de Sobre mí, versión sin fechas inventadas"): se trata como propuesta y se planea como `checkpoint:decision`; no se inventa ninguna fecha que Juan no haya dado.
- **D-12:** Frase de una línea de Loops Growth, aprobada para que Claude la redacte desde loopsgrowth.com (ES): "Agencia de SEO y GEO que ejecuta tu posicionamiento en Google y tu visibilidad en asistentes de IA como ChatGPT y Gemini." EN: "SEO and GEO agency that runs your Google rankings and your visibility in AI assistants like ChatGPT and Gemini."
- **D-13:** Arianna Lupi: stack real = Astro (según Juan, sin confirmar del todo; el HTML muestra `astro-island` y `_astro`). El researcher verifica dónde vive el marcador (Payload/DB, `scripts/db/data`, `src`); el hallazgo inicial es que el marcador del sandbox está en `designs/design-system-mui/src/data/websites.ts` y que la fila Websites de Payload (`scripts/seed-phase40-websites.ts`, slug `ariannalupi-com`) puede ya tener su propio stack. Se corrige en Payload solo lo que el HTML del preview realmente muestre.
- **D-14:** La copia EN de Sobre mí y de la home hoy cae al español en `/en` (los globals nuevos son solo ES). Se necesita una siembra EN aprobada (lote 2 EN). Juan rechazó las propuestas de hero, estadística, tagline, medición y lead de servicios, y aceptó implícitamente el resto: lo aceptado se siembra tras confirmación y lo rechazado espera sus opciones (ver decisiones pendientes).

### CTAs (CONT-02)
- **D-15:** Los CTAs del lote 1 están APROBADOS por Juan tal como se listaron, con el inglés propuesto, con un cambio: cierre de la home ES "¿Tienes un proyecto en mente? Cuéntame de qué se trata." (sin la frase "empiezo por mirar qué ve Google hoy") y EN "Have a project in mind? Tell me what it is about." Se aplican a donde vivan (global `homePage`, `messages`, `CtaSection`); el plan primero inventaría cada CTA vigente y su origen.

### Contenido que Claude puede preparar ya
- **D-16:** Lecciones de los 7 casos, ES y EN (`lessons` = array de `title` y `body`, ambos localizados). Parten de `designs/design-system-mui/src/data/case-lessons.ts` (borradores) y SOLO usan cifras que el caso ya muestra, cero afirmaciones inventadas. Se verifica cada cifra contra los datos reales del caso en Payload. Quedan en un archivo de datos para revisión de Juan; no se cargan hasta su aprobación escrita (D-03). Nota del sandbox: la lección "Una cifra anual puede esconder un semestre flojo" (edtech, caída del 25 % en seis meses) debe contrastarse con los datos del caso antes de proponerla.
- **D-17:** Reescritura de los 36 encabezados con punto o coma según las reglas de voz. El researcher localiza dónde viven (copy de home y Sobre mí, `messages`, globals, sandbox) y produce una tabla antes y después; solo se cambia lo que vive en contenido nuevo o sombra, nunca un encabezado que `master` ya sirve y que afecte SEO sin decisión de Juan.
- **D-18:** Textos alternativos (alt) para las fotos de Sobre mí y las capturas de Websites, descriptivos, sin "imagen de", conforme a `A11Y.md`.
- **D-19:** Limpieza de rayas largas y medias en `messages/es.json` y `messages/en.json` (hoy 3 y 4 apariciones), con prioridad al namespace `emailCapture`, dentro de la pasada de voz. Se respeta `scripts/verify/54-messages-parity.mjs`.
- **D-20:** Testimonios: se conserva solo el de Patricia Ibarra. Los demás los pega Juan después. Ningún testimonio de relleno ni inventado; ningún marcador de testimonio queda en el HTML renderizado.
- **D-21:** La traducción EN de recursividad (22 % completa) es una decisión de Juan: se planea como `checkpoint:decision` con opciones (traducir ahora, servir aviso de traducción existente, diferir) y recomendación.

### Decisiones pendientes de Juan (checkpoint:decision, no bloquean otras tareas)
- **D-22:** Título del hero de la home: opción A "Consultor SEO técnico que también programa" (RECOMENDADA), opciones B a E aún por listar desde la conversación; texto del hero: opciones 1 a 3; estadística del hero: +309 % inmigración de Atlanta (RECOMENDADA), +406 % urología (vigente), +143 %, +104 %, +68 %, +18 clientes (por confirmar); tagline bajo el hero: opciones 1 a 3; título y lead de la sección de medición (se conservan las descripciones de Core Web Vitals y se quitan las notas "Bueno: hasta"); lead de servicios (se quita la frase "empiezo por lo que ve Googlebot y de ahí decido qué tocar" del lead de la sección Y del ítem SEO técnico). El plan registra cada elección en un único archivo de datos con una constante por decisión, de modo que el valor recomendado se siembre por defecto si Juan no responde antes del corte, y el cambio de elección sea de una línea.
- **D-23:** El `<title>` y la meta description de la home NO cambian en el corte (se decide después con datos de Search Console). Cualquier plan que toque el copy de la home confirma que esos dos campos quedan intactos.

### Claude's Discretion
Partición en planes y olas, nombres y estructura de los archivos de datos, el mecanismo concreto de sombra para privacy y terms (campos nuevos en globals privados, doc sombra o carga en el corte, a decidir con la investigación de cómo la fase 54 resolvió `homePage` y `aboutPage`), cómo se agrupa la verificación (`scripts/verify/56-*`), y la redacción de las lecciones y del texto legal dentro de las restricciones de voz.

</decisions>

<canonical_refs>
## Canonical References

**Los agentes posteriores DEBEN leer esto antes de planear o implementar.**

### Alcance y aprobaciones
- `.planning/ROADMAP.md` (Phase 56) - objetivo y 3 criterios de éxito
- `.planning/REQUIREMENTS.md` - CONT-01, CONT-02, CONT-03
- `.planning/phase-56-prep/aprobaciones-juan.md` - decisiones aprobadas por Juan (leer completo)
- `.planning/phases/54-paginas-de-conversion-y-utilidad/54-CONTEXT.md` y `54-UI-SPEC.md` - excepciones de diseño, contenido sombra, marcadores
- `.planning/phases/55-casos-websites-blog-y-autores/55-CONTEXT.md` (D-10 lecciones, D-29 marcadores, D-31 idioma único), `55-06-PLAN.md` - patrón de checkpoint de base de datos
- `./CLAUDE.md` sección Database Safety y `research/voice-sample-juan.md`, `research/voice-and-tone-juan.md`, `research/JUAN-PROFILE.md`

### Contenido y código
- `scripts/db/data/54-about-copy.ts` (marcador línea 57), `scripts/db/data/54-home-copy.ts`, `scripts/db/data/54-seed-lib.ts` (guardia de base, caracteres prohibidos, marcador)
- `scripts/db/04-which-database.ts`, `scripts/db/tunnel.sh`, `scripts/db/20-phase54-seed-shadow-content.ts`
- `scripts/seed-legal-pages.ts`, `scripts/update-privacy-resend.ts` (texto legal actual con Hostinger y Google Analytics)
- `src/collections/CaseStudies/index.ts` (campo `lessons`), `src/collections/Testimonials/`, `src/collections/Websites/`, `src/globals/{HomePage,AboutPage}`
- `designs/design-system-mui/src/data/{case-lessons,about,websites}.ts`, `designs/design-system-mui/src/components/site/LegalPage.tsx`
- `messages/es.json`, `messages/en.json`, `scripts/verify/54-messages-parity.mjs`, `scripts/verify/54-no-sandbox-data.mjs`, `scripts/verify/54-page-contract.mjs` (lista de marcadores conocidos, líneas 56 a 62: se actualiza al cerrar los marcadores)
- Plantillas legales CC0: `General-Legal/legal-templates` en GitHub (`templates/privacy-policy-gdpr/template.md`, `privacy-policy-us`, `terms-of-use`, `cookie-notice`)
- `A11Y.md` (https://github.com/fecarrico/A11Y.md/blob/main/docs/en/A11Y.md)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/db/data/54-seed-lib.ts`: guardia `assertSafeTarget`, detección de rayas y de marcador, helpers puros con autoprueba.
- `scripts/verify/54-seed-selftest.ts` y `54-no-sandbox-data.mjs`: patrón de autoprueba y de auditoría del marcador, reutilizables como `56-*`.
- Patrón de dry-run, `04-which-database.ts` y checkpoint humano de `54-07` y `55-06`.

### Established Patterns
- Contenido sombra en globals privados (`homePage`, `aboutPage`), solo ES hoy; EN cae a ES por el respaldo.
- Los verificadores permiten hoy el marcador `{{pendiente}}` en `/sobre-mi` y `/en/sobre-mi` como "conocido, lo cierra la fase 56": al cerrar el marcador hay que quitar esa excepción y endurecer el contrato.
- Verificación siempre contra el HTML servido por `dev.juan-tech.com` y TTL de caché de 60 s, nunca contra la base que escribió.

### Integration Points
- `aboutPage.experience.stages[2].when` (marcador de fecha) y nuevas etapas de Loops Growth y coach.
- Pages `privacy` y `terms` (slugs, ES y EN, un bloque `Content` con richText) que `master` ya sirve.
- `case-studies.lessons` (array localizado) para los 7 casos.
- `testimonials` y la sección de testimonios de la home.

</code_context>

<specifics>
## Specific Ideas

- Lo que aprueba Juan debe quedar trazable: cada archivo de datos de la fase lleva el estado (aprobado, propuesto, pendiente) por cada texto, para que el gate de la fase 57 lea ese estado y no dependa de la memoria.
- Texto legal con voz de persona natural en primera persona de Juan, claro y corto, en lugar del tono de plantilla corporativa.

</specifics>

<deferred>
## Deferred Ideas

- Portal de reseñas (enlace de un solo uso con caducidad y aprobación en el admin): después del corte, milestone nuevo.
- Decisión de `<title>` y meta description de la home con datos de Search Console.
- Revisión legal profesional opcional tras el corte.
- Landings Lima y Madrid con contenido real: se dejan como están.
- Traducción EN de los posts 9, 35 a 38, 56, 57 y 58 (deuda previa).

</deferred>

---

*Phase: 56-Contenido pendiente de Juan*
*Context gathered: 2026-11-10*
