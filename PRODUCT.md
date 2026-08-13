# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cuatro audiencias confirmadas, todas relevantes, con jerarquía de conversión distinta:

1. **Cliente potencial (empresa o founder)** — evalúa contratar auditoría SEO técnica, consultoría SEO, desarrollo full-stack con SEO integrado o SEO para IA/GEO. Llega por búsqueda, referencia o landing local (Lima / Madrid). Necesita ver resultados verificables y credibilidad técnica antes de escribir por el formulario de contacto. Es el visitante cuya acción define el éxito comercial del sitio.
2. **Reclutador o lead de contratación** — evalúa el perfil profesional de Juan para un rol o colaboración. Le importa experiencia, stack, credenciales y evidencia de trabajo real. Consume sobre todo la página de autor y los case studies.
3. **Dev / SEO técnico lector** — llega por búsqueda orgánica a un post del blog con un problema concreto que resolver. La conversión es secundaria: su éxito es entender y resolver. El blog es el canal principal de adquisición, así que este visitante alimenta a los otros tres.
4. **Colega u organizador de eventos** — busca a Juan para charlas, talleres o colaboraciones. Respaldado por la colección `SpeakingEvents`.

## Product Purpose

Portfolio profesional bilingüe de Juan Carlos Angulo, ingeniero de software y consultor SEO técnico freelance con sede en Lima, Perú. El sitio existe para convertir visitantes en conversaciones de trabajo (clientes, roles, colaboraciones) demostrando pericia real, no declarándola.

Éxito = el visitante sale convencido de que Juan resuelve SEO a nivel de código, sin intermediarios, y da el paso de contacto.

## Positioning

La intersección entre desarrollo full-stack y SEO técnico, ejecutada por la misma persona. No es una agencia que subcontrata dev, ni un dev que delega SEO: auditoría técnica (rastreo, indexabilidad, Core Web Vitals, Schema.org, datos estructurados) y corrección directa en el código con Next.js y Payload CMS.

El sitio mismo es la prueba. Rendimiento y SEO impecables no son un bonus del proyecto: son el argumento. Si el sitio falla en CWV o en SEO técnico, el producto no cumple su propósito.

## Operating Context

- Sitio público bilingüe EN/ES con routing por locale (`/[locale]/...`) vía next-intl, más segmentos duales por idioma en servicios (`/servicios` + `/services`, `/websites`).
- Superficies: home, blog (listado + detalle), case studies (listado + detalle), autores, servicios (índice + 4 landings), landings locales (Lima, Madrid/España), websites, contacto, búsqueda, privacy, terms, sitemap HTML.
- Contenido administrado desde el admin de Payload por Juan como único editor. Todo bloque visible se compone desde el CMS (`src/blocks`), no se hardcodea en la página.
- Superficies orientadas a máquinas tan reales como las visuales: `sitemap.xml` con XSL, `robots.txt`, `llms.txt` / `llms-full.txt`, JSON-LD por tipo de doc. La lectura por crawlers y por motores de IA es parte del uso normal del producto.
- Evaluación del producto incluye herramientas externas: Lighthouse/CWV, Google Search Console, auditorías de OpenGraph. Una regresión medida ahí es un defecto del producto.

## Capabilities and Constraints

**Capacidades confirmadas**
- Payload CMS 3.85 en proceso dentro de Next.js 15 (App Router), Postgres vía Drizzle, media en Cloudinary, email transaccional vía Resend.
- Colecciones: Pages, Posts, CaseStudies, Authors, Categories, Websites, Testimonials, Clientes, SpeakingEvents, Media, Users. Globals: Header, Footer, FeaturedContent, Llms.
- Sistema de bloques componible (Hero con variants incluido `local-landing`, ServicesShowcase, LocalProofSection, ResultsSection, FAQ, TestimonialsCarousel, ContactForm, TableOfContents, entre otros) más registro central en `src/blocks/blockRegistry.tsx`.
- Case study con chart de resultados antes/después (recharts) alimentado por `results.metrics`.

**Constraints técnicos**
- Deploy standalone en Hostinger (Cloud/Business con Node.js). No asumir capacidades de Vercel: sin ISR, sin edge functions, sin ejecución serverless. Revalidación por hooks `afterChange` sobre un proceso Node persistente.
- Una sola base de datos: `DATABASE_URI` apunta a la Postgres real de producción. No existe sandbox. Migraciones destructivas requieren aprobación explícita de Juan; ver CLAUDE.md, sección Database Safety.
- Suite `@payloadcms/*` en lockstep 3.85.x. `graphql` fijado en ^16.
- Fuera de alcance permanente: dashboard interno de tooling SEO (métricas GSC en vivo, broken links, keyword scoring, dinorank). Se descartó a propósito en la reconstrucción.

**Decisiones abiertas**
- Deploy + cutover a producción (Phase 6) sigue en pausa: falta que Juan entregue credenciales reales de Hostinger/DNS y una `RESEND_API_KEY` válida.

## Brand Commitments

- Nombre y dominio: Juan Carlos Angulo — `juan-tech.com`.
- Voz calibrada contra `research/voice-sample-juan.md` (ES y EN). Todo entregable escrito pasa por humanización antes de entregarse: sin tells de escritura de IA, sin em/en dashes, voz natural y variada.
- Español neutro siempre. Nunca voceo.
- Sistema visual incumbente documentado en `designs/DESIGN-SYSTEM.md` y `designs/current-site-real.pen`. Tokens y componentes existentes son autoridad de diseño hasta que se decida lo contrario de forma explícita.
- Sin precios publicados en ninguna landing de servicio. La conversación de tarifas ocurre por contacto.

## Evidence on Hand

**Real y usable**
- Case studies con métricas provenientes de Google Search Console real (clics, impresiones, posición), con el cliente anonimizado.
- Bio profesional real de Juan (más de cuatro años de experiencia, Lima, Next.js + Payload, auditoría técnica) — texto canónico en `.planning/REQUIREMENTS.md`, requirement CASE-07.
- Datos de la página de autor: expertise, educación, experiencia, con Person JSON-LD enriquecido (`sameAs`, `knowsAbout`, `hasCredential`).
- Taller DinoRANK / Arianna Lupi 2025 como prueba local real de Lima.
- Keyword research real detrás de `targetKeyword` en pages y authors.
- Colecciones Testimonials, Clientes, Websites y SpeakingEvents con contenido poblado.

**Ausencias que no se pueden inventar**
- `LocalProofSection` en las landings de Lima y Madrid tiene la mayoría de sus stats como `[PLACEHOLDER]`. Solo hay una stat real (Lima). Esos huecos esperan datos reales de clientes vía GSC. Trabajo futuro los deja vacíos o los quita, nunca los rellena con números plausibles.
- No hay clientes con nombre público. No hay precios. No hay benchmarks de terceros ni prensa que se puedan citar.

## Product Principles

1. **El sitio es la demo.** Rendimiento, accesibilidad y SEO técnico impecables son el argumento de venta, no un requisito de calidad genérico. Una regresión en CWV o en marcado estructurado es una falla del producto.
2. **Cero fabricación.** Todo número, cliente, credencial o resultado sale de una fuente real y verificable. Un dato faltante se queda faltante y visible como tal, no se aproxima.
3. **Anonimato del cliente es innegociable.** Los case studies muestran resultados, nunca identidad: sin nombre, dominio, condado ni conteos que permitan reconstruir quién es.
4. **Paridad EN/ES total.** Cada página, campo, label y enlace existe en ambos locales. Nada de contenido que solo viva en un idioma ni de campos sin localizar que rompan el sitio por idioma.
5. **Todo se edita desde el CMS.** Contenido nuevo se modela como bloque o campo de Payload, no como markup fijo en la página. La mantenibilidad del backend es la razón de existir de esta reconstrucción.
6. **Las superficies para máquinas son producto.** Sitemaps, JSON-LD, `llms.txt` y metadatos se tratan con la misma exigencia que una pantalla visible.

## Accessibility & Inclusion

Requisito del producto: **WCAG 2.2 AA**, más las reglas de A11Y.md (https://github.com/fecarrico/A11Y.md/blob/main/docs/en/A11Y.md), que aplican de forma estricta a todo trabajo de frontend.

Implicaciones ya activas en el código: `prefers-reduced-motion` respetado en el fondo animado del hero (GrainGradient), H1 semántico real en cada ruta, contraste sobre tokens definidos, charts legibles en mobile sin overflow ni labels cortados.
