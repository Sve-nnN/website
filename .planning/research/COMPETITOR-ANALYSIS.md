# Análisis de Competidores Reales — SEO Técnico Freelance (España/LatAm)

**Fecha:** 2026-07-11
**Método:** SERP real vía DinoRank API (`X-API-Key`, endpoint `/api/v1/keyword-research`, fuente "visibility" para ES) sobre los términos objetivo de Home/Author page (`seo técnico`, `seo tecnico freelance`, `consultoria seo tecnico`, `experto seo tecnico`, `agencia seo tecnico`) — no es research genérica de "tendencias de portfolio" (eso ya existía en `research/FEATURES.md`, sección "Competitor Feature Analysis"), es SERP real: quién rankea de verdad hoy para las keywords que Juan quiere posicionar.

## Competidores directos identificados (personal brand, no agencia)

Dominios que aparecen en el top 3-5 de múltiples queries relevantes — el peer-set real de Juan:

| Dominio | Posición típica | Aparece en |
|---|---|---|
| `carlossanchezdonate.com` (Carlos Sánchez) | #2-3, casi todas las queries de "seo técnico" | seo tecnico, tecnico seo, que es el seo tecnico, que es seo tecnico, tecnico en seo, agencia seo tecnico |
| `chesusrodrigo.es` (Chesus Rodrigo) | #5 | consultoria seo tecnico |
| `manufuentes.com` (Manu Fuentes) | #3-5 | experto seo, experto en seo |
| `capitanseo.es` (Capitán SEO) | #3-4 | seo experto, experto seo, experto en seo |
| `davidlegarre.com`, `sergiogarciamonge.es`, `peterlead.com`, `victorlopezseo.com`, `erwinsalas.com`, `alexserrano.es`, `soyjavierlopez.com` | long-tail, top 10 | variantes locales ("consultor seo [ciudad]") |

Agencias que también rankean (contexto, no peer directo): `seotecnico.es`, `ga.agency`, `digitalmenta.com`, `dossetenta.com`, `oorganika.com`, `eskimoz.es`, `seoexperto.es`, `expertoseo.com`.

## Perfil de los 4 competidores más cercanos (visitados en vivo)

### 1. Carlos Sánchez Donate (`carlossanchezdonate.com`) — competidor más cercano

- **Posicionamiento:** "El SEO técnico es la rama del SEO que utiliza la programación... para mejorar el rendimiento" — combina programación + SEO, exactamente el mismo ángulo que Juan.
- **Audiencia:** empresas con necesidades técnicas complejas, profesionales que quieren pasar de SEO generalista a técnico, medianas/grandes empresas.
- **Contenido del blog:** crawl budget, rendering, Core Web Vitals, SEO internacional (hreflang), robots.txt/canonicals, y — relevante — **optimización para LLMs/IA** (GEO), la misma frontera que Juan ya cubre con `llms.txt`.
- **Diferenciador:** un programa de formación "Master" en SEO técnico (monetiza autoridad vía educación, no solo consultoría).
- **Sin case studies con métricas** — construye autoridad por credenciales/profundidad técnica del blog, no por resultados cuantificados.
- **Tono:** técnico pero accesible, código/imágenes técnicas.

### 2. Chesus Rodrigo (`chesusrodrigo.es`)

- **Posicionamiento:** "Sin SEO tu negocio no existe" — atención personalizada freelance vs agencias.
- **Audiencia:** pymes, e-commerce, negocios locales (dentistas, nutricionistas) — más generalista/local que técnico puro.
- **Prueba social:** 5.0★ Google (11 reviews), testimonios de clientes reales, 5+ años de experiencia.
- **Diferenciador real:** reseñas de Google visibles directamente en el sitio (prueba social verificable, no solo testimonios curados).

### 3. Manu Fuentes (`manufuentes.com`)

- **Posicionamiento:** "posicionamiento natural" sin atajos, 10+ años, transparencia por sobre resultados rápidos.
- **Case study propio:** su blog personal de deportes (SportBall) con "500% crecimiento orgánico" en el primer año, superando a medios como Marca/Wikipedia/NBA — **usa un proyecto propio como caso de estudio**, no solo clientes.
- **Diferenciador:** honestidad explícita sobre lo que el SEO NO puede hacer (anti-hype), tono con humor.

### 4. Capitán SEO (`capitanseo.es`)

- **Posicionamiento:** más agencia que solo-consultor pese al branding personal ("Capitán"), 10+ años.
- **Diferenciador:** "SEO for AI" (optimización explícita para ChatGPT/Gemini/Claude) como línea de servicio nombrada, no solo mencionada — Juan ya tiene la infraestructura (`llms.txt`/`llms-full.txt`) pero no lo nombra como servicio propio en el copy actual.
- **Prueba social:** mínima (1 testimonio), sin métricas.

## Comparación directa vs el sitio actual de Juan

| Dimensión | Juan (juan-tech.com / rebuild) | Competencia | Gap/Oportunidad |
|---|---|---|---|
| Ángulo "programación + SEO" | Sí, explícito en el hero actual | Carlos Sánchez lo usa casi idéntico | Ya diferenciado, pero Carlos lo tiene más desarrollado en profundidad de blog (crawl budget, rendering) — reforzar con más contenido técnico de ese nivel |
| GEO/optimización para IA | Infraestructura ya existe (`llms.txt`) pero no se nombra como servicio | Carlos lo cubre en blog; Capitán SEO lo nombra como línea de servicio explícita | **Oportunidad real:** nombrar "SEO para IA / GEO" como servicio explícito en el copy de Home, no solo tenerlo técnicamente implementado |
| Case studies con métricas reales | Sí — modelo estructurado (ariannalupi.com como referencia, ya adoptado) | Ninguno de los 4 muestra métricas de cliente reales con esa profundidad (Manu Fuentes usa un proyecto propio, no de cliente) | **Ventaja competitiva real de Juan** si logra poblar CaseStudies con datos reales — ningún competidor cercano lo hace tan bien |
| Prueba social (reviews/testimonios) | Testimonials collection existe, 1 testimonio real (Patricia Ibarra) | Chesus Rodrigo muestra reviews de Google en vivo (5.0★, 11 reviews) | Considerar embed de reviews reales (Google Business) si Juan tiene, más creíble que testimonio curado único |
| Formación/contenido educativo como autoridad | Blog técnico bilingüe ya existe | Carlos Sánchez monetiza esto con un "Master" — Manu Fuentes con blog propio como case study | No es gap de producto, es gap de posicionamiento — el blog de Juan ya cumple ese rol, solo falta que el copy del Home lo conecte más explícitamente a autoridad ("por qué confiar en mí" en vez de solo "qué hago") |
| E-E-A-T / credenciales visibles | Recién en construcción (Phase 12 de este milestone: expertise/education/experience) | Ninguno de los 4 muestra educación/certificaciones estructuradas tan a fondo | Con Phase 12 cerrada, Juan queda por delante de los 4 en profundidad de E-E-A-T mostrado — validar que se vea así una vez poblado |

## Recomendaciones accionables (fuera del scope de v1.2, para backlog)

1. Nombrar explícitamente "SEO para IA / GEO" como línea de servicio en el copy del Home (ya hay infraestructura, falta posicionamiento) — inspirado en Capitán SEO.
2. Si existen reviews reales de Google Business, embeberlas — más prueba social verificable que un testimonio único (inspirado en Chesus Rodrigo).
3. Mantener la apuesta por CaseStudies con métricas reales — es la ventaja competitiva más clara frente a los 4 competidores directos revisados, ninguno la ejecuta tan bien.
4. Blog técnico ya diferenciador (crawl budget, CWV, rendering) — seguir esa línea de profundidad como hace Carlos Sánchez, evitar contenido genérico tipo "qué es el SEO".

## Fuentes

- DinoRank API keyword-research (fuente "visibility", ES) — 8 queries semilla, SERP real extraído del campo `serp` de cada keyword relacionada. Raw JSON en `.planning/research/keyword-research/dinorank_extra_*.json` y `dinorank_home_es_alt.json`/`dinorank_author_es_alt.json`/`dinorank_extra_experto_seo_tecnico.json`.
- WebFetch en vivo: `carlossanchezdonate.com`, `chesusrodrigo.es`, `manufuentes.com`, `capitanseo.es` (2026-07-11).
