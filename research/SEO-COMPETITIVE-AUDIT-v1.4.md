# Auditoría SEO Competitiva v1.4 — Encabezados, Metadata, Servicios, Precios, SEO Local

**Fecha:** 2026-07-12
**Método:** WebFetch en vivo de todas las páginas no-blog de 4 competidores directos (ya identificados en `COMPETITOR-ANALYSIS.md` vía SERP real DinoRank) + discovery de 2 competidores LatAm nuevos + mapeo completo del código/seed actual de `juan-tech.com` (este proyecto).

**Competidores auditados en profundidad (páginas no-blog completas):**
1. `carlossanchezdonate.com` (+ `asdrubalseo.com`, su marca comercial — mismo Carlos Sánchez)
2. `chesusrodrigo.es`
3. `manufuentes.com`
4. `capitanseo.es`

**Competidores nuevos descubiertos (confirmados, no auditados en profundidad todavía):**
- `julianbarbosa.com` (Bogotá, Colombia) — "SEO consultant and web developer", WordPress/Shopify/Magento/React/Angular, 8+ años
- `consultorseo.info` (Medellín, Colombia) — Fabio Gómez, 20+ años dev+ecommerce+marketing, freelancer explícito
- `cristiantait.com` (Argentina) — **sin verificar** (403 al fetch), perfil textual el más parecido a Juan de toda la búsqueda ("Senior Full Stack Developer & Cloud Architect... SEO técnico"), revisar manualmente

**Mercado EN:** no se encontró un competidor genuino que combine "ingeniero de software full-stack real + SEO técnico" como personal brand freelance en inglés. Esto es un hallazgo en sí mismo — hueco de posicionamiento real, no solo laguna de búsqueda (ver Oportunidades).

---

## 1. Gap Analysis — Encabezados y Estructura

### 1.1 Bugs técnicos reales encontrados en el sitio de Juan (no son gaps de copy, son gaps de estructura semántica)

| Página | Problema | Evidencia |
|---|---|---|
| `/contact` | **Sin H1.** Único heading es un H2 ("Hablemos"/"Get in Touch") dentro de `ContactFormBlockComponent`. No hay bloque `hero`. | `src/blocks/ContactFormBlock/Component.tsx:63` |
| `/authors/[slug]` (Author page) | **Sin H1.** El nombre del autor se renderiza como `<Link>` con clases visuales de heading, no como elemento semántico. Todas las secciones internas son H2. | `src/components/AuthorCard.tsx:45` |

Ningún competidor auditado tiene este problema — todos usan H1 real en cada página, incluida su página "sobre mí". Esto es una corrección técnica de bajo riesgo y alto impacto SEO (cada página debe tener exactamente un H1 semántico).

### 1.2 Páginas que Juan no tiene y la mayoría de competidores sí

| Tipo de página | Quién la tiene | Juan |
|---|---|---|
| Servicios (landing por servicio) | Los 4 (Carlos/Asdrubal: 4 landings; Chesus: 5; Manu: 8 por disciplina + 3 por industria; Capitán: 6) | No existe ninguna página `/services` o `/servicios` |
| SEO local dedicado | Manu Fuentes (`/seo-local/`, completa), Chesus Rodrigo (`/consultor-seo-local/` + programmatic SEO por ciudad) | No existe |
| SEO para IA / GEO nombrado como servicio | Capitán SEO (`/seo-para-ia/`, en menú principal), Carlos Sánchez/Asdrubal (servicio "Nuevo") | Infraestructura ya existe (`llms.txt`/`llms-full.txt`) pero no está nombrado como servicio en ningún lado del copy |
| Página "sobre mí" con H1 | Carlos Sánchez (`/sobre-mi/`), Chesus Rodrigo (`/sobre-mi/`) | Author page cumple ese rol mejor que ninguno de los 4 en profundidad (expertise/educación/experiencia/eventos estructurados), pero sin H1 (ver 1.1) |

### 1.3 Patrón estructural replicable (páginas de servicio)

Los 4 competidores convergen en una plantilla casi idéntica para páginas de servicio:
**H1 (nombre del servicio) → Problema/dolor → Qué incluye (bloques con íconos) → Cómo trabajamos/proceso → FAQ → CTA final repetido.**

Ninguno diferencia mucho la estructura entre sus propias páginas de servicio — es la misma plantilla con copy distinto. Si Juan construye páginas de servicio, este patrón es un piso seguro (validado por 4 jugadores independientes), no hace falta inventar una estructura nueva.

---

## 2. Servicios — Comparativa

| Competidor | Servicios nombrados | Segmentación |
|---|---|---|
| Carlos Sánchez/Asdrubal | SEO & Desarrollo web Mensual, SEO White Label, GEO, Fractional SEO Embedded, Auditoría SEO, Consultoría SEO, Formación, Migraciones, Implementaciones web, Desarrollo web (100% código propio, sin builders) | Por tipo de servicio, con foco en "SEO + dev integrado" |
| Chesus Rodrigo | Auditoría SEO, Keyword Research, SEO Local, Diseño Web WordPress, Profesor SEO/formación (+ 6 más sin landing propia) | Por tipo de servicio + variantes geográficas (Zaragoza, Granada, Huesca) |
| Manu Fuentes | Consultor SEO, Auditoría SEO, SEO técnico, SEO on-page, SEO off-page/linkbuilding, Redacción SEO, SEO local | Por disciplina + por industria (clínicas dentales, restaurantes, B2B) |
| Capitán SEO | Consultor SEO, Auditoría SEO, Linkbuilding, Diseño web WordPress, Google Ads, **SEO para IA** | Por tipo de servicio, plantilla genérica repetida |

**Juan hoy:** cero páginas de servicio. Su oferta vive implícita en el Hero/AboutSection de Home ("Mi enfoque en Consultoría Técnica") sin desglose por servicio.

**Diferenciador real de Juan vs. los 4:** ninguno ofrece desarrollo full-stack con Next.js/Payload/CMS headless a ese nivel — Carlos Sánchez es el más cercano (React/Vue/Next/Angular mencionados) pero sin case studies de proyectos reales construidos así. Chesus Rodrigo su "desarrollo" es diseño WordPress genérico. Este es el ángulo a explotar si se crean páginas de servicio: "desarrollo real (Next.js/Payload) con SEO integrado desde el código", no "SEO + un poco de WordPress".

---

## 3. Precios — Comparativa

| Competidor | Publica precios | Modelo |
|---|---|---|
| Carlos Sánchez/Asdrubal | Solo el Máster (€3,695 / 12x€320). Servicios de consultoría: **no**, cotización a medida | Oculto salvo producto formativo |
| Chesus Rodrigo | **No**, ningún servicio | Todo "a medida, bajo consulta" |
| Manu Fuentes | **Sí, extensivo** — tabla completa de precios por servicio (consultoría €150-450/mes, auditoría €530-1.210, redacción €0,03-0,04/palabra) | Transparencia total, el único de los 4 que hace esto |
| Capitán SEO | **No**, ninguna página | Todo vía formulario de contacto |

**Lectura:** 3 de 4 ocultan precio. Manu Fuentes es la excepción y lo usa como diferenciador de transparencia explícito. No hay consenso de mercado — es una decisión de posicionamiento, no un estándar a seguir por default.

---

## 4. SEO Local — Comparativa

| Competidor | Oferta SEO local |
|---|---|
| Carlos Sánchez/Asdrubal | **No existe** (`/servicios/seo-local/` → 404 confirmado) |
| Chesus Rodrigo | **Sí, fuerte** — landing dedicada + programmatic SEO por ciudad (Zaragoza/Granada/Huesca/Ejea) |
| Manu Fuentes | **Sí** — landing dedicada + 3 verticales de industria local (clínicas, restaurantes) |
| Capitán SEO | **No existe** (`/seo-local/` cae a home, sin landing real) |

**Relevante para Juan:** su ICP declarado es clientes globales/empresas con necesidades técnicas complejas (ver `carlossanchezdonate.com` describe audiencia similar), no negocios locales tipo dentistas/restaurantes. SEO local como línea de servicio solo tiene sentido si Juan quiere captar clientes locales en Lima/Perú específicamente — no es gap urgente dado su posicionamiento actual "ingeniero de software + SEO técnico" orientado a empresas con stack técnico complejo, no pymes locales.

---

## 5. Decisión: Author page vs. About page vs. atribución de blog

**Estado real del código (verificado, no supuesto):**
- Ya existe una única Author page por autor (`/authors/[slug]`) con bio completa + Expertise + Educación + Experiencia + Eventos + Artículos + Casos de éxito — más profunda que 3 de los 4 competidores directos (ver `COMPETITOR-ANALYSIS.md`, sección Benchmark E-E-A-T).
- La atribución en blog posts **ya es doble**: byline compacto (avatar + link a Author page + jobTitle) junto al título, y `AuthorCard` completo (bio, credenciales, social links) al final del post — mismo patrón en case studies.
- La Author page **ya tiene** una sección "Artículos"/"Posts" al final que lista los posts del autor.
- No existe una página "About"/"Sobre mí" separada — el bloque `aboutSection` de Home fue reescrito en Phase 13 de un ángulo biográfico a un ángulo de propuesta de valor ("Mi enfoque en Consultoría Técnica"), separando conscientemente "qué ofrezco" (Home) de "quién soy" (Author page).

**Respuestas a las preguntas de Juan:**

1. **¿Hace falta página de author?** Sí, mantenerla — es una ventaja competitiva real y ya construida (Phase 12), más profunda en E-E-A-T que 3 de 4 competidores directos. Solo requiere el fix técnico del H1 (sección 1.1).

2. **¿Hace falta página "sobre mí" separada?** No. Crear una tercera página duplicaría contenido entre Home (`aboutSection`), Author page (bio completa) y una hipotética About page — sin beneficio SEO claro (canibalización de keyword, contenido repetido). Ninguno de los 4 competidores tiene ambas cosas (Author-style E-E-A-T page + About page separada); todos tienen como máximo una página "sobre mí" genérica, que en el caso de Juan ya es más rica (Author page). La arquitectura actual (Home = propuesta de valor, Author page = quién soy) es correcta y no necesita una tercera página.

3. **¿Es mejor que la atribución en blog vaya como link a la página de "sobre mí" con lista de posts al final?** Esto **ya está implementado exactamente así** — el byline linkea a la Author page, que tiene una sección "Artículos" al final listando los posts del autor. No hace falta cambiar la arquitectura de información; el patrón ya sigue la recomendación. Lo único pendiente es la corrección del H1 (sección 1.1) para que la Author page tenga un heading semántico real, no solo un `<Link>` con estilos de heading.

---

## 6. Oportunidades priorizadas (para definir requirements de este milestone)

En orden de impacto/esfuerzo:

1. **Fix H1 semántico en `/contact` y `/authors/[slug]`** — bug técnico real, bajo esfuerzo, ningún competidor lo tiene, impacto SEO directo (accesibilidad + jerarquía de contenido para crawlers).
2. **Nombrar "SEO para IA / GEO" como servicio explícito** — Juan ya tiene la infraestructura (`llms.txt`/`llms-full.txt`), 2 de 4 competidores directos ya lo nombran como línea de servicio con landing propia. Gap de posicionamiento puro, no de infraestructura.
3. **Páginas de servicio** (Auditoría SEO Técnica, Consultoría, Desarrollo Full-Stack con SEO integrado, SEO para IA/GEO) — los 4 competidores las tienen, Juan no tiene ninguna. Decisión pendiente de Juan: ¿con o sin precios publicados? (3 de 4 ocultan precio; Manu Fuentes es la excepción exitosa).
4. **SEO local** — deprioritizado salvo que Juan confirme que quiere captar clientes locales en Lima además de su ICP global actual.
5. **Reforzar en Home el ángulo "desarrollo real (Next.js/Payload) + SEO técnico"** frente al "SEO + WordPress genérico" de 3 de los 4 competidores — ya está parcialmente en el Hero, reforzar en encabezados de servicio si se construyen.

## Fuentes

- WebFetch en vivo (2026-07-12): `carlossanchezdonate.com` (+ subpáginas `asdrubalseo.com`), `chesusrodrigo.es` (14 páginas), `manufuentes.com` (17 páginas), `capitanseo.es` (9 páginas — sitio completo)
- WebSearch discovery: `julianbarbosa.com`, `consultorseo.info`, `cristiantait.com` (sin verificar), `ricardorodriguezz.com` y `matttutt.me` (evaluados y descartados como no-match)
- Codebase real de este proyecto: `src/app/(frontend)/[locale]/**`, `src/blocks/**`, `scripts/seed-*.ts` (grep exhaustivo de `<h1`/`<h2`/`<h3`)
- Research previo: `research/COMPETITOR-ANALYSIS.md`, `research/JUAN-PROFILE.md`, `research/keyword-research/`
