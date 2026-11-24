# Phase 54: Páginas de conversión y utilidad - Context

**Gathered:** 2026-11-08
**Status:** Ready for planning
**Mode:** Auto (`--auto`): decisiones tomadas con la opción recomendada, sin preguntas a Juan

<domain>
## Phase Boundary

Juan recorre en el preview (`dev.juan-tech.com`), en EN y ES, las páginas que convierten y las de utilidad con el diseño MUI y datos de Payload: home, índice de servicios, las cuatro landings de servicio, landings SEO técnico Lima y Madrid, búsqueda, sobre mí, contacto con su FAQ, stack, privacy, terms y la 404 dentro del shell. Requisitos: PAG-01, PAG-02, PAG-06, PAG-07, PAG-08, PAG-09, PAG-11, PAG-12.

Fuera de alcance: casos de éxito, websites, blog y autores (fase 55), los textos que solo Juan decide (fase 56) y el retiro de Tailwind y del código viejo (fase 57).

</domain>

<decisions>
## Implementation Decisions

### Origen de los componentes y de los datos
- Los componentes MUI se portan desde el sandbox `designs/design-system-mui/src/components/{home,site}` a `src/components/`. Se conserva su marcado, sus tokens y sus estados.
- Se eliminan los datos del sandbox (`src/data/*`). Cada página es un Server Component que lee por Local API (con `overrideAccess: false` y `select`, como el footer tras el fix WR-08) y pasa props tipadas al componente de vista.
- Si un campo que la vista necesita no existe en Payload, se agrega con migración solo aditiva. Nada de datos hardcodeados del sandbox en el HTML del preview.
- Las lecturas pasan por `src/lib/cache.ts` con tags de `src/lib/cache-tags.ts`, y los `afterChange` revalidan esos tags (mismo patrón que Header y Footer).

### Home (PAG-01)
- Todas las secciones del sandbox (Hero, Vitals, Tagline, Services, Process, Cases, Sites, Testimonials, LogoMarquee, About, Faq) salen de la colección Pages y de los globals.
- Los shaders y animaciones respetan el contexto de movimiento de la fase 53 (`useMotion`, `data-motion`).
- Juan edita un campo en el admin real y el cambio aparece en el preview dentro de 60 a 120 s (mismo criterio D-12 de la fase 53).

### Servicios, landings y búsqueda (PAG-02, PAG-12)
- Índice y detalle usan la colección de servicios actual. Se conservan las URLs duales (`/servicios` y `/services`) con `src/lib/service-slugs.ts` y el `pathnames` de next-intl.
- Las landings SEO técnico Lima y Madrid conservan su contenido y su schema JSON-LD, solo cambian la capa visual.
- La búsqueda conserva su lógica de consulta actual y devuelve resultados reales. Solo se reemplaza la vista.

### Sobre mí (PAG-06)
- Página nueva con migración solo aditiva (colección o campos nuevos en Pages para timeline y foto). Sin `DROP`, sin reforma de columnas.
- El timeline usa `@mui/lab` Timeline (única pieza beta autorizada en la fase 53).
- La foto nueva sube a Cloudinary vía Media con un script de `scripts/db/` que primero corre `04-which-database.ts` y escribe contra la base de producción. No aparece en el sitio live antes del corte porque `master` no contiene la ruta ni el código.

### Contacto y Stack (PAG-07, PAG-08)
- Contacto conserva `src/app/actions/contact.ts` (Resend, honeypot, compuertas de `PREVIEW_READONLY`). En el preview el envío responde éxito simulado; el correo real se prueba una vez contra producción en la fase 57. La FAQ pasa al acordeón MUI con roles nativos.
- Stack muestra los logos de herramientas con los enlaces `/go/[slug]` existentes, `rel="sponsored noopener"` y la divulgación de afiliación visible antes de los enlaces.

### Privacy, Terms y 404 (PAG-09, PAG-11)
- Privacy y Terms usan `LegalPage` con índice lateral sticky que colapsa en móvil, anclas por `id` de encabezado y `aria-labelledby`. El texto sale de Payload tal cual está hoy; la actualización de infraestructura la decide Juan en la fase 56.
- La 404 vive en `src/app/(frontend)/[locale]/not-found.tsx` dentro del shell. Para que la URL inexistente devuelva estado 404 real y no 200, se agrega un catch-all `[...rest]/page.tsx` que llama a `notFound()`.

### Contenido pendiente
- Los marcadores `{{pendiente}}` del sandbox (fecha de aprendoclub, stack de Arianna Lupi, datos de Loops Growth, fecha legal, testimonios) no se inventan. Si la fase 54 los necesita, se renderizan como están en Payload y la fase 56 los cierra.
- Voz y tono del copy nuevo según la memoria del proyecto: encabezados y meta títulos sin puntos ni comas, se habla de Juan y no de una agencia, tono de experto que enseña. No se escribe copy nuevo sin que venga del sandbox aprobado o de Payload.

### Accesibilidad y verificación
- Se sigue `A11Y.md` y `designs/design-system-mui/A11Y-DECISIONS.md`. Un solo `main` (lo pone el layout), un `h1` por página, jerarquía h2 y h3 sin saltos.
- Cada página nueva suma comprobaciones a `scripts/verify/` (contrato HTML por ruta y locale, noindex intacto, `rel="sponsored"` en Stack, estado 404 real) y se corren contra `dev.juan-tech.com` tras cada despliegue. El crawl de paridad de la fase 53 se reutiliza para confirmar que ninguna URL actual cambia de estado.
- El preview sigue en solo lectura (`PREVIEW_READONLY`). Los cambios de base de datos se hacen únicamente con migraciones aditivas y scripts verificados con `04-which-database.ts`.

### Decisiones tras la investigación (auto, a revisar por Juan)
Tomadas con la opción de menor riesgo porque el preview y producción comparten filas y `master` sigue en vivo. Juan puede revertir cualquiera en la revisión del preview.
- **Contenido sombra aditivo.** Copy nuevo en globals privados nuevos (`homePage`, `aboutPage`), la columna `clientes.onDark` y un logo por herramienta en `toolStack`. No se sobrescribe ningún campo existente. Los globals nuevos se leen sin `overrideAccess:false` (con esa opción un global sin `access.read` lanza, como documenta `src/lib/cache.ts`).
- **Home conserva `codeFixesBlock`, `auditOfferBlock` y `auditorHighlight`.** Se portan a MUI con el lenguaje del sandbox. Quitarlos reduciría contenido indexable (SEO-03).
- **Sobre mí** vive en un global propio, no como doc de Pages, para que no entre al `sitemap.xml` live. El enlace en el nav se inyecta solo en el preview; el enlace real llega con el corte (fase 57).
- **"Qué incluye" de servicios** se renderiza desde los párrafos de Payload como lista MUI con marca de verificación, sin inventar tarjetas.
- **Búsqueda y landings locales** no tienen diseño en el sandbox: se componen con las primitivas MUI existentes (`PageHero`, tarjetas, `CtaSection`), sin diseño nuevo.
- **Orden de migración:** migrar primero con `juantech_user` y desplegar después; un bloque sin migrar rompe todas las páginas porque el preview lee con rol de solo `SELECT`.
- **404:** `not-found.tsx` más catch-all `force-dynamic` con script `54-notfound-status.mjs` que exige 404 real.
- **Afiliados:** se conserva el `rel` real `sponsored nofollow noopener` (más estricto que lo escrito arriba).
- **Dependencia nueva:** `@mui/lab@9.0.0-beta.10`, con `checkpoint:human-verify` antes de instalar.
- **Honeypot real** `company_website` y campo oculto `locale` obligatorio; se ignoran `service` y `website` del sandbox.

### Excepciones de diseño aceptadas por Juan (2026-11-08)
El checker de UI bloqueó la spec en tipografía (13 tamaños de fuente contra un tope de 4) y espaciado (paddings de sección de 80 a 192 px contra un conjunto de 4 a 64). Juan eligió conservar el diseño aprobado del sandbox:
- **Escala `display`** (24, 30, 36, h2 clamp 32 a 48, h1 clamp 40 a 60, 48, 72, 112 y 176 px) para titulares y cifras se mantiene tal cual.
- **Escala vertical de sección** (80, 96, 112, 128, 144, 160 y 192 px) para `py`, `pt`, `pb` y offsets `sticky` se mantiene tal cual.
- La escala de texto de cuerpo queda en 12, 14, 16 y 20 px, con pesos 400 y 600.

### Claude's Discretion
Nombres de archivos, estructura interna de `src/components/`, orden de las olas, partición en planes, y el diseño exacto de los campos nuevos de Payload siempre que sean aditivos.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Sandbox `designs/design-system-mui/src/components/{home,site}` (Home, Hero, Services, Faq, ServicesIndex, ServiceDetail, AboutPage, ContactPage, StackPage, LegalPage, NotFoundView, Breadcrumbs, PageHero, CtaSection).
- Shell de la fase 53: `src/components/shell/*`, `src/theme/*`, `src/lib/{cache,cache-tags,nav-links,preview,preview-guard}.ts`.
- Rutas actuales bajo `src/app/(frontend)/[locale]/`: `page.tsx`, `servicios`, `services`, `servicios/[slug]`, `services/[slug]`, `seo-tecnico-lima`, `seo-tecnico-madrid`, `search`, `contact`, `stack`, `privacy`, `terms`.

### Established Patterns
- Español sin prefijo y `/es/*` redirige 308; EN con prefijo `/en`.
- Payload en proceso, `push:false`, migraciones aditivas, hooks `afterChange` con `revalidateTag`.
- Verificación con scripts `scripts/verify/53-*` (contrato HTML, estilos computados, crawl de paridad).

### Integration Points
- Colecciones Pages, Services (y sus slugs localizados), Media, globals Header y Footer.
- `src/app/actions/contact.ts` y `src/app/go/[slug]/route.ts` (ya con compuertas de preview).
- Dokploy `juantech-preview` redespliega al empujar `feat/mui-redesign`.

</code_context>

<specifics>
## Specific Ideas

Diseño aprobado en `designs/design-system-mui/` (solo oscuro). La home es el sandbox `components/home`, no las versiones v3 a v5 anteriores de `designs/`.

</specifics>

<deferred>
## Deferred Ideas

- Casos, websites, blog y autores: fase 55.
- Cierre de `{{pendiente}}`, CTAs aprobados y texto legal de infraestructura: fase 56.
- Retiro de Tailwind y de componentes viejos, y el correo real de Contacto contra producción: fase 57.

</deferred>
