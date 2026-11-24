# Phase 48: Página de Stack + Links Inline en Contenido - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning
**Mode:** Discuss directo con Juan (contenido de primera mano, no smart discuss — este material no se puede fabricar con defaults plausibles)

<domain>
## Phase Boundary

Los links de afiliado se renderizan de verdad en dos superficies: una página `/stack` bilingüe bajo un único segmento compartido, sostenida por experiencia propia real (no por el link), y un inline block usable en el rich text de posts con disclosure automático. Ambas superficies montan el mismo leaf `AffiliateLink` y el mismo `AffiliateDisclosure` de Phase 46/47.

Queda fuera: nav principal (se reevalúa a los 90 días con Search Console), tablas de precios, roundups tipo "las 25 mejores", orden por comisión, cualquier programa de afiliados nuevo sin aplicar todavía.

</domain>

<decisions>
## Contenido real por herramienta (fuente: Juan, 2026-09-04)

### DinoRANK — afiliado activo
- **Afiliado**: homepage `https://dinorank.com/?afid=MTE2NQ==`, registro `https://dinorank.com/registro/?afid=MTE2NQ==`
- **Uso**: más barato que otras herramientas SEO, buena suite. Le gusta el redactor de contenido y usa su investigación de keywords para contrastar con otras herramientas.
- **Pro**: precio/funcionalidad, redactor de contenido.
- **Contra**: la IA de investigación de keywords no funciona del todo (suele no arrojar resultados); el mapa de SEO local demora mucho en generarse.
- **Case study**: los 7 case studies (todos usan DinoRANK).

### Hostinger — Referral, sin umbral (link de afiliado pendiente, Juan lo envía después)
- **Uso**: hosting predilecto. Todos sus clientes están alojados ahí.
- **Pro**: velocidad, precios accesibles, configuración libre (no bloquean funcionalidades como otros hostings).
- **Contra**: ninguno — Juan no reportó ningún contra real. No inventar uno; si el bloque de contras es obligatorio a nivel de plantilla, dejarlo vacío o con una frase honesta tipo "sin quejas reales hasta ahora" en vez de fabricar un negativo.
- **Case study**: case study 4 (migración e-commerce Next.js/SEO técnico — `migracion-ecommerce-nextjs-seo-tecnico`), y es la base de hosting para todos sus proyectos de cliente en general.

### DigitalOcean — sin postular todavía, sin link de afiliado aún
- **Uso**: cuando un cliente necesita un VPS específico, fácil de configurar y rápido.
- **Pro**: facilidad de uso y configuración, rapidez.
- **Contra**: número limitado de centros de datos.
- **Case study**: proyectos personales, sin case study público — **excepción documentada a STACK-06**: el texto dice "proyecto personal" y enlaza a `/servicios/fullstack-development` como fit más cercano (decisión de Juan: link a servicio genérico en vez de forzar un case study que no aplica).

### Kinsta — sin postular todavía, sin link de afiliado aún
- **Uso**: hostear bases de datos de sus proyectos principales personales, hosting WordPress y web hosting para proyectos universitarios temporales.
- **Pro**: muy rápido (corre sobre GCP), entornos de staging/prueba incluidos.
- **Contra**: caro, limitado para WordPress.
- **Case study**: proyectos personales, sin case study público — misma excepción que DigitalOcean, enlaza a `/servicios/fullstack-development`.

### DataForSEO — afiliado activo (programa real, corrige el research de Phase 44 que decía "sin programa público")
- **Afiliado**: site referral `https://dataforseo.com/?aff=1b6bcf57-3342-484a-b84b-44885374c08c`, platform referral `https://app.dataforseo.com/?aff=1b6bcf57-3342-484a-b84b-44885374c08c`, Google Sheets connector `https://dataforseo.com/google-sheets-connector?connector_aff=1b6bcf57-3342-484a-b84b-44885374c08c`
- **Uso**: research en bulto (bulk keyword research); con su API construyó varias aplicaciones locales para obtener data de keywords para clientes y armar estrategia.
- **Pro**: los tokens no vencen.
- **Contra**: la recarga mínima es $50, un poco elevado.
- **Case study**: los 7 case studies.

### Payload — sin programa de afiliados, link directo
- **Uso**: CMS moderno, su alternativa a WordPress.
- **Pro**: permite optimizar los sitios al máximo (ejemplo: la velocidad de juan-tech.com mismo).
- **Contra**: curva de aprendizaje más alta para usuarios/clientes que no lo conocen; el mantenimiento es a código, no desde una interfaz como WordPress.
- **Case study**: case study 4 (`migracion-ecommerce-nextjs-seo-tecnico`).

### Cloudinary — programa de créditos por referido, NO comisión en dinero
- **Referido**: `https://cloudinary.com/invites/lpov9zyyucivvxsnalc5/odxm3irnpy6wjrctdf8y?t=default` — 3 créditos gratis por cada amigo que se registra, hasta 60 créditos. Solo aplica en el plan free, no se acarrea al pasar a plan pago.
- **Uso**: almacenar y editar imágenes on-the-fly; así genera las OG images.
- **Pro**: edición on-the-fly.
- **Contra**: no reportado por Juan — no fabricar uno.
- **Case study**: case study 4 (`migracion-ecommerce-nextjs-seo-tecnico`).
- **Nota de disclosure**: este NO es un programa de comisión monetaria — es un incentivo de créditos. Tratarlo como material connection igual (FTC exige disclosure de cualquier incentivo, no solo cash), pero no confundirlo con "pagan comisión" en el copy ni en el campo `commissionNote`.

### Resend — sin programa de afiliados, link directo
- **Uso**: manejo de correos, tier gratuito bueno, siempre funciona.
- **Pro**: fácil de implementar, buena velocidad y tiempos de entrega.
- **Contra**: Juan no ha aprendido a usar las automatizaciones para armar un flujo de email marketing directamente desde ahí.
- **Case study**: case study 4 (`migracion-ecommerce-nextjs-seo-tecnico`).

### Ahrefs — sin programa de afiliados (programa cerrado, confirmado en Phase 44), link directo
- **Uso**: onboarding de proyectos de clientes, visión clara de cómo arranca el proyecto y cómo escala.
- **Pro**: (implícito en el uso — visión clara de progreso).
- **Contra**: muy caro.
- **Case study**: los 7 case studies.

### Amazon — afiliado activo, sección "Gear" separada dentro de /stack
- **Uso**: compra ahí todos sus componentes de PC. Le gusta Amazon Prime (entrega rápida, a veces ofertas); el contra es que no aprovecha del todo Prime porque no usa Amazon Music ni Prime Video.
- **Sección propia**: dentro de la misma página `/stack` (un solo segmento — STACK-01), no una ruta nueva. Sin case study asociado — son productos personales, no herramientas de servicio a clientes.
- **Productos y links** (todos `amzn.to` — **deben resolverse a URL directa con `tag=juantech02-20` visible antes de publicar**, Amazon prohíbe acortadores/cloaking):
  - AMD RYZEN 7 9800X3D — `https://amzn.to/46EVbDZ`
  - Samsung SSD 990 PRO 2TB — `https://amzn.to/4qXFkdc`
  - CORSAIR Vengeance DDR5 32GB (2x16GB) — `https://amzn.to/4iOMrCt`
  - MSI MAG B850 Tomahawk MAX — `https://amzn.to/4ij5HrP`
  - Fractal Design North Chalk White — `https://amzn.to/4d4rAYf`
  - ARCTIC MX-7 — `https://amzn.to/4x6ET1C`
  - Apple 2022 MacBook Air M2, 13", 8GB RAM, 256GB SSD — `https://amzn.to/4coyqYs`
  - ASUS Prime GeForce RTX 5070 12GB GDDR7 OC — `https://amzn.to/4ctNDHC`
  - MSI PRO A1000PL PCIE5 — `https://amzn.to/46DgHZQ`
  - Noctua NH-D15 G2 chromax.Black — `https://amzn.to/4x7wavW`
  - Logitech G305 — `https://amzn.to/4iT0S8y`
  - Logitech G435 — `https://amzn.to/4xjUHyg`
  - LG UltraWide Monitor 29U511A 29" — `https://amzn.to/4gVo0AR`
  - Amazon Prime (mención, no producto) — `https://amzn.to/3UYHwoJ`

### Cursor, Claude/OpenAI, Sitebulb — omitidos por decisión de Juan
No entran en esta ronda de contenido. No se agregan sin pedirle a Juan que confirme antes.

## Bloques obligatorios de la página (STACK-03/04)

- **"Qué elegiría hoy si empezara de cero"**: DataForSEO (para obtener datos de clientes) combinado con DinoRANK. Hosting: Hostinger para levantar proyectos de cliente. Herramientas de medición: Google Search Console, tier free de Ahrefs, GA4. Stack de código: si es CMS → Payload; si es web estática → Astro; si es sitio existente o el cliente prefiere WordPress → lo instala directo en Hostinger. Aprovecha los free tiers de Resend y Cloudinary para que todo sea rápido y responsivo.
- **Recomendación destacada sin comisión (STACK-04)**: Google Search Console — gratis, sin programa de afiliados de ningún tipo, y ya es parte real de su stack de día a día.
- **Negativos honestos**: ya cubiertos por herramienta arriba (DinoRANK: IA de keywords floja + mapa local lento; DigitalOcean: pocos datacenters; Kinsta: caro + limitado en WordPress; DataForSEO: recarga mínima $50; Payload: curva de aprendizaje + mantenimiento a código; Resend: automatizaciones de email marketing sin explorar; Ahrefs: caro). Hostinger y Cloudinary no tienen contra reportado — no fabricar uno.

### Claude's Discretion
- Estructura visual exacta del bloque `ToolStack` (cards, grupos por categoría, orden) mientras respete: sin tablas de precios, sin roundup "las mejores", sin ordenar por comisión.
- Agrupación de herramientas (por categoría de uso vs. por programa de afiliado vs. orden de aparición en esta conversación) — a definir en UI-SPEC.
- Redacción exacta en ES/EN de cada bloque de 100+ palabras, partiendo del contenido crudo de arriba, pasada por el humanizer antes de publicar.

</decisions>

<code_context>
## Existing Code Insights

- `src/components/AffiliateLink.tsx`, `src/components/AffiliateDisclosure.tsx`, `src/lib/affiliate.ts` (`pickDestination()`), `getCachedAffiliateLinks()` — todo de Phase 46, ya construido y verificado en producción (schema) — esta fase los consume, no los reconstruye.
- `src/app/go/[slug]/route.ts` — de Phase 47. Amazon renderiza directo (no pasa por `/go/`); DinoRANK/DataForSEO/Cloudinary/Hostinger/DigitalOcean/Kinsta si pasan por `/go/` cuando tengan slug activo en `affiliate-links`.
- Rutas reales confirmadas en producción (`juan-tech.com`) para los links de case study/website/servicio:
  - Case studies: `edtech-financiera-infantil-crecimiento-organico-seo`, `fabricante-baldosa-hidraulica-seo-espana`, `immigration-law-atlanta-seo`, `migracion-ecommerce-nextjs-seo-tecnico`, `pittsburgh-criminal-defense-legal-content-seo`, `talleres-costura-miami-lanzamiento-seo-local`, `urologo-seo-local-salud-santiago-rd`
  - Servicios: `ai-seo-geo`, `fullstack-development`, `seo-consulting`, `seo-technical-audit`
  - Websites (portfolio técnico, no usado como target de esta fase salvo que investigación encuentre mejor fit): `aprendoclub-com`, `apturio-com`, `ariannalupi-com`, `drmanuelvargashidalgo-com`, `estylopia-com`, `juan-tech-com`

</code_context>

<specifics>
## Specific Ideas

- Los 13 links de Amazon son `amzn.to` (shortlinks) — deben resolverse a la URL de producto completa con `?tag=juantech02-20` visible antes de escribir el documento en `affiliate-links`. No publicar el shortlink tal cual: viola la constraint "sin cloaking" del milestone.
- Hostinger todavía no tiene link de afiliado — Juan lo envía después. El plan debe dejar el documento de Hostinger listo pero marcar el campo de destino como pendiente si no llega antes de la ejecución, o Juan lo pasa en el checkpoint de contenido si el plan incluye uno.
- **Decisión de Juan**: DigitalOcean y Kinsta se publican en `/stack` como mención editorial completa (texto de 100+ palabras, pro, contra) pero SIN componente `AffiliateLink` activo — sin botón/CTA de afiliado, porque no hay link real todavía (no postulados). Cuando Juan postule y tenga el link, se activa sin tocar el contenido editorial. El planner debe definir cómo el bloque `ToolStack` soporta una entrada "sin afiliado activo" (texto simple en vez de leaf `AffiliateLink`, o el mismo componente con destino null y sin renderizar CTA).

</specifics>

<deferred>
## Deferred Ideas

- Cursor, Claude/OpenAI, Sitebulb como herramientas del stack — Juan los omitió esta ronda, no agregar sin confirmación explícita futura.
- Nav principal para `/stack` — reevaluar a los 90 días con Search Console (ya lo dice el ROADMAP).
- Resolver la ambigüedad de red de DigitalOcean (CJ vs. Impact) — se resuelve al postular, fuera de esta fase.

</deferred>
