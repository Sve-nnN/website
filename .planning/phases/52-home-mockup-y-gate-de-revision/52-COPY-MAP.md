# Fase 52: mapa de fuentes del copy de la home

Estado: entrada de planificación, levantada el 2026-10-15. Es el único insumo de copy y estructura para los planes 52-02 a 52-07. No contiene texto final: los planes reescriben cada cadena con `research/voice-and-tone-juan.md` (en adelante, la guía) y la validan con el lint de 52-02.

Cómo se levantó: lectura de `src/` (solo lectura), de los scripts de siembra del repo (`scripts/seed-home.ts`, `scripts/humanize-home-page.ts`) y descarga del HTML vivo de `https://juan-tech.com/` (ES) y `https://juan-tech.com/en` (EN), más `/case-studies`, `/websites` y `/servicios/seo-technical-audit`. No se tocó la base de datos ni se escribió nada fuera de `.planning/`.

## 1. Hallazgos que cambian el plan

1. **La home viva no tiene los ocho bloques que lista D-03.** Hoy renderiza, en este orden: hero, clientes (28 nombres en dos grupos), "Errores reales, con el commit que los corrige", servicios ("Cómo puedo ayudarte"), auditor propio, about ("Mi enfoque en Consultoría Técnica"), oferta de auditoría (600 USD) y formulario de contacto. FAQ, testimonios, websites y casos destacados no aparecen en el HTML vivo: el brief del 2026-08-19 quitó FAQ, artículos destacados y el carrusel de testimonios de la home (`scripts/seed-home.ts`, constante `DROPPED`), y el seed incluye un bloque de casos destacados en el layout que el HTML vivo no pinta (no se pudo confirmar por qué sin leer la base de datos, que está fuera de alcance). Casos y websites viven hoy en `/case-studies` y `/websites`. D-03 manda: el mockup incluye los ocho más los bloques vivos del brief. Es el supuesto 1 de la lista de decisiones de Juan.
2. **La home viva en inglés tiene bloques sin traducir.** En `/en` salen en español el H1 y el subtítulo del hero, el encabezado "Cómo puedo ayudarte", todo el about, y el formulario de contacto (salvo tres etiquetas). El inglés correcto existe en el repo (`scripts/humanize-home-page.ts`, constantes `heroCopy`, `aboutCopy`, `faqCopy`, `contactCopy`, `servicesShowcaseTitle`) y en `scripts/seed-home.ts` (clientes, errores reales, oferta). El mockup usa esos textos. La paridad de HOME-04 se cumple en el mockup, no en el sitio vivo.
3. **Voseo y plural en el copy vivo.** La introducción de "Errores reales" dice "podés abrir el commit". En la página de servicio vivo aparece "acá tenés". La guía prohíbe el voseo (regla 3). La FAQ del repo usa "¿Cómo medimos el éxito...?" (plural de agencia, regla 11).
4. **Fixtures sospechosos publicados en el sitio vivo.** `scripts/seed-phase10-7-gap-fill.ts` crea "un caso realista" (Migración a Next.js sin perder tráfico orgánico, métrica +68%, testimonio de "Marcela Ibáñez, Directora de Marketing Digital"). Es un dato de relleno, no un resultado verificado, y sigue visible en `/case-studies` y como "caso real" en la página de servicio. **Nada de eso entra a la home** (D-05, guía regla 4). Juan decide si lo retira del CMS; está fuera de esta fase.
5. **Única cita real encontrada:** "Trabajar con Juan fue lo mejor.", firmada por Patricia Ibarra, CEO · Estylopia (colección Testimonials, visible en las páginas de servicio). En EN el sitio vivo muestra la misma cita en español.
6. **El CTA del hero vivo ("Hablemos") enlaza a `/case-studies`**, no a contacto. En el mockup el CTA primario va a `#contacto`.
7. **Títulos de casos con ciudad** (Atlanta, Pittsburgh en las bajadas, Santiago, Miami) chocan con la regla 5 de la guía (cliente anónimo). Supuesto 6.
8. **La página `/websites` viva publica puntajes "NN Performance"** sin fecha ni herramienta. Entran con pendiente visible.
9. **Lecciones técnicas de 51.1 que aplican aquí:** el stage `report` de `verify-app.mjs` compara el hash del build con los JSON medidos (chequeo r2), así que cualquier cambio de código exige volver a correr `npm run measure` al final. `check-static.mjs` recorre `app/node_modules`, no se usa en esta fase. LCP del baseline `/system` fue 1893 ms con poco margen: el hero de la home debe vivir en el chunk de entrada y todo lo demás cargar después.

## 2. Orden de secciones y archivos

El orden sigue el brief confirmado el 2026-08-19 (memoria del proyecto: bloque central = fixes reales del repo público) y agrega las secciones de D-03 donde la narrativa las pide. Es decisión de maquetación (Claude's Discretion) y queda revisable en el gate.

| Orden | Archivo en `src/home/sections/` | Sección | Origen |
|-------|--------------------------------|---------|--------|
| 0 | (HomePage, no lazy) | Hero | live + repo |
| 1 | `01-clientes.tsx` | Con quiénes trabajé | live |
| 2 | `02-errores-reales.tsx` | Errores reales con commit | live + `seed-home.ts` |
| 3 | `03-casos.tsx` | Casos de éxito (3) | `/case-studies` live |
| 4 | `04-websites.tsx` | Websites (3) | `/websites` live |
| 5 | `05-servicios.tsx` | Cómo puedo ayudarte (4) | live |
| 6 | `06-auditor.tsx` | Mi propio auditor SEO | live |
| 7 | `07-about.tsx` | Mi enfoque (about) | live + `humanize-home-page.ts` |
| 8 | `08-testimonio.tsx` | Testimonio | páginas de servicio vivas |
| 9 | `09-oferta.tsx` | Empecemos por una auditoría | live + `seed-home.ts` |
| 10 | `10-faq.tsx` | Preguntas frecuentes | `humanize-home-page.ts` |
| 11 | `11-contacto.tsx` | Contacto | live + `humanize-home-page.ts` |
| fin | `Footer.tsx` | Pie | live |

Cada sección tiene su JSON `src/home/copy/<nombre>.json` con la forma `{ "es": {...}, "en": {...}, "_numbers": [...] }`.

## 3. Fuente por sección

Convención: "VIVO" es texto descargado el 2026-10-15; "REPO" es texto en un script del repo. Todo texto se reescribe con la guía. Los bloques "Corregir" son cambios obligatorios.

### 3.0 Header, hero y metas

- Skip link: ES "Saltar al contenido", EN "Skip to content" (VIVO).
- Nav (VIVO): ES Blog, Casos de éxito, Autores, Contacto, Servicios. EN Blog, Case Studies, Authors, Contact, Services. Corregir EN a mayúscula inicial ("Case studies") por la guía 4.2. Destinos: Servicios `#servicios`, Casos `#casos`, Contacto `#contacto`; Blog y Autores apuntan al sitio vivo (`https://juan-tech.com/blog`, `/authors`, con `/en/` en EN) hasta las fases 54 y 55.
- Hero ES (VIVO y REPO): H1 "Construyo software rápido y hago que se encuentre en Google". Subtítulo "Ingeniería de software y SEO técnico, trabajados como una sola disciplina, no por separado." Corregir: "trabajados" es participio pasivo; reescribir en primera persona activa.
- Hero EN (REPO `heroCopy.en`): H1 "I build fast software and get it found on Google". Subtítulo "Software engineering and technical SEO, treated as one discipline, not two." Corregir: reescribir activo.
- CTA primario (guía 7): ES "Pedir auditoría" a `#contacto`; EN "Request an audit". Secundario: ES "Ver casos" a `#casos`; EN "See case studies".
- Idioma: ES "ES"/"EN" con `lang`, `hreflang`, `aria-label` "Español" y "English".
- Pausa (D-12): ES "Pausar animaciones", EN "Pause animations", etiqueta fija con `aria-pressed`.
- Título (VIVO): ES "SEO técnico e ingeniería de software | Juan Carlos Angulo" (57 caracteres). EN "Technical SEO Consultant | Juan Carlos Angulo" (45). Ya cumplen la guía 4.1 regla 10.
- Meta descripción (REPO `research/serp-intent-home-description.md`): ES "Soy ingeniero de software y consultor de SEO técnico: auditorías, rendimiento web y arquitectura Next.js/Payload para posicionar tu sitio en Google." EN "I'm a software engineer and technical SEO consultant: audits, performance, and Next.js/Payload architecture to get your site ranking on Google."
- ASCII del hero: arte estático `ASCII_ART` de `src/gallery/fallbacks.tsx` (app), decorativo, sin pie explicativo.

### 3.1 Clientes (`01-clientes`)

Título ES "Con quiénes trabajé", EN "Who I have worked with" (VIVO y REPO). Dos grupos con conteo (VIVO muestra "SEO15" y "Desarrollo13"; EN "SEO" y "Development"). Nombres (alt de los logos, VIVO):

- SEO (15): money.com, Miami Herald, Holafly, Souma Hotel Lima, TheSmokyRolling, DSLX, Vallas Venezuela, TheSmokyBox, Florida Health Care Academy, Delta Cloudz, Tursi Digital Nomads, The Sosa Team, Florida Top Roofs, Felipe Vergara, Storybook app.
- Desarrollo (13): Luxembourg Philharmonie, Arianna Lupi, Apturio, Childrenchic, TuMundoSalud, Crédito USS, Wiñaypaq, Dr. Manuel A. Vargas Hidalgo, Puntada con Amor, Aprendoclub, Pro Torque Diesel, Cresory, Estylopia.

Los 28 están autorizados (memoria del proyecto). El mockup los muestra como texto, sin cargar logos (cero recursos externos). Pendiente visible: logos reales desde Media.

### 3.2 Errores reales (`02-errores-reales`)

Fuente única: `scripts/seed-home.ts`. Código en las constantes `HREFLANG_CODE`, `SITEMAP_CODE`, `AVIF_CODE` (líneas 35 a 71); texto ES/EN en el objeto `COPY` (líneas 73 a 198). **El código se copia literal del seed, jamás se recrea ni se edita** (memoria: "nunca código recreado"). Cada fix tiene archivo, lenguaje, commit (`23646a1`, `6849e95`, `4f8942e`) con URL `https://github.com/Sve-nnN/website/commit/<sha>` y desenlace.

- Título ES "Errores reales, con el commit que los corrige": lleva coma. Corregir a un encabezado sin coma (guía regla 9), por ejemplo "Errores reales y el commit que los corrige".
- Introducción ES: corregir "podés" a "puedes". Introducción EN y títulos de los tres fixes (síntomas) cumplen la regla 9; el título EN de la sección lleva coma: corregir igual.
- Los comentarios dentro del código están en inglés: el bloque `<pre>` lleva `lang="en"` en la página ES (A11Y.md, WCAG 3.1.2).
- Cifras permitidas: "6 conexiones a 1 consulta" (desenlace del fix 2, commit `6849e95`).

### 3.3 Casos (`03-casos`)

Se muestran tres, elegidos por la memoria del brief (métricas reales de Search Console): urólogo, inmigración y defensa criminal. Textos de `https://juan-tech.com/case-studies` y `/en/case-studies` (VIVO):

| Caso | Título ES (VIVO) | Sector ES | Métrica ES |
|------|------------------|-----------|------------|
| urólogo | De casi cero visibilidad a un año de crecimiento sostenido para un urólogo | Salud, urología | +406% clics interanuales |
| inmigración | Cuadruplicar el tráfico orgánico de un despacho de inmigración en Atlanta en un año | Servicios legales, inmigración | +309% clics interanuales |
| defensa criminal | Escalar el contenido legal educativo a más de 86,000 clics orgánicos anuales para un despacho de defensa criminal | Servicios legales, defensa criminal | +83% clics interanuales |

EN (VIVO): "From near-zero visibility to a year of sustained growth for a urologist" (Healthcare, urology, +406% YoY clicks); "Quadrupling organic traffic for an Atlanta immigration law firm in one year" (Legal services, immigration, +309% YoY clicks); "Scaling educational legal content to over 86,000 annual organic clicks for a criminal defense firm" (Legal services, criminal defense, +83% YoY clicks).

- Corregir: el sitio vivo separa el área y la especialidad del sector con un guion largo; ese carácter no se copia. Usar coma ("Salud, urología").
- Corregir: "86,000" lleva coma dentro de un encabezado (regla 9). Usar "86 000" con espacio de no separación en ES y EN.
- Decisión de Juan: "Atlanta" y las ciudades de las bajadas contradicen la regla 5. El mockup mantiene la ciudad solo donde el título vivo la trae y la lista en el gate.
- Texto del bloque (VIVO, página de casos): "Cada caso muestra qué estaba fallando, qué corregí en el código y qué cambió después. Los números salen de Search Console, los clientes van anonimizados." / EN "Every case shows what was failing, what I fixed in the code and what changed afterwards. The numbers come from Search Console, the clients stay anonymous."
- Enlaces: a la página viva del caso (`/case-studies/<slug>` y `/en/case-studies/<slug>`). Botón "Leer el caso completo" / "Read the full case" (guía 7).
- **Excluidos:** el caso "+68%" (hallazgo 4) y los casos "+143%", "0 a 56 clics" y "+104%" (no están en el brief).

### 3.4 Websites (`04-websites`)

De `/websites` y `/en/websites` (VIVO). Se muestran los tres primeros con puntaje publicado, sin el sitio propio: Apturio (Software / SaaS, 83), Arianna Lupi (Marca personal / coaching, 73; EN Personal brand / coaching) y Estylopia (Retail / estilo personal, 67; EN Retail / personal styling). Etiqueta viva "NN Performance". Pendiente visible por tarjeta o por bloque: "fecha y herramienta de la medición". Título de sección ES "Sitios web", EN "Websites". Enlace "Ver todos los sitios" a `/websites`.

### 3.5 Servicios (`05-servicios`)

Título ES "Cómo puedo ayudarte" (VIVO), EN "How I can help" (REPO `servicesShowcaseTitle`, a mayúscula inicial). Cuatro tarjetas (VIVO ES / VIVO EN):

1. "Auditoría SEO Técnica" / "Technical SEO Audit". "Auditoría técnica SEO completa: rastreo, indexación, Core Web Vitals y datos estructurados, con un plan de corrección priorizado por impacto real." / "Full technical SEO audit: crawling, indexation, Core Web Vitals, and structured data, with a fix plan prioritized by real impact."
2. "Consultoría SEO" / "SEO Consulting". "Consultoría SEO continua para equipos que necesitan alguien que entienda tanto el código como el posicionamiento, sin traducir entre agencia y desarrollo." / "Ongoing SEO consulting for teams that need someone who understands both the code and the rankings, no translation layer between agency and dev."
3. "Desarrollo Full-Stack con SEO integrado" / "Full-Stack Development with SEO Built In". "Desarrollo full-stack con Next.js y Payload CMS, pensado desde el primer commit para que el sitio rinda bien y sea indexable sin parches después." / "Full-stack development with Next.js and Payload CMS, built from the first commit to perform well and stay indexable without patches later."
4. "SEO para IA / GEO" / "AI SEO / GEO". "Optimización para que tu contenido sea citado por ChatGPT, Perplexity y las respuestas de IA de Google, además del ranking tradicional en buscadores." / "Optimization so your content gets cited by ChatGPT, Perplexity, and Google AI answers, on top of traditional search rankings."

Corregir: títulos a mayúscula inicial (guía 4.2, no Title Case). Enlace por tarjeta "Explorar servicio" / "Explore service" a `/servicios/<slug>` y `/en/services/<slug>` vivos (`seo-technical-audit`, `seo-consulting`, `fullstack-development`, `ai-seo-geo`). Revisar "pensado" y "citado" (participios) contra la regla de voz pasiva y reescribir en activa si el lint lo marca. Enlace de cierre "Todos los servicios".

### 3.6 Auditor propio (`06-auditor`)

VIVO ES: título "Construí mi propio auditor SEO"; "Es la misma herramienta que uso en mis propios proyectos y en los de mis clientes, no la vendo como servicio, es software que construí y que mantengo en producción."; cuatro datos: "29 checks técnicos", "5 categorías", "500 URLs por auditoría", "CWV Core Web Vitals (PageSpeed Insights)"; enlace "Probar el auditor (se abre en una pestaña nueva)" a `https://auditor.juan-tech.com`; nota "Plan gratuito: 1 auditoría por semana, por email verificado.". VIVO EN: "I built my own SEO auditor"; "It's the same tool I use on my own projects and my clients', I don't sell it as a service, it's software I built and I keep running in production."; "29 technical checks", "5 categories", "500 URLs per audit", "CWV Core Web Vitals (PageSpeed Insights)"; "Try the auditor (opens in a new tab)"; "Free tier: 1 audit per week, per verified email."

Cifras permitidas con fuente viva: 29, 5, 500, 1. Primer uso de CWV con `<abbr>`.

### 3.7 About (`07-about`)

Fuente: `scripts/humanize-home-page.ts`, constante `aboutCopy` (líneas 103 a 171), idéntica al texto vivo ES. Título ES "Mi enfoque en Consultoría Técnica" (corregir a mayúscula inicial) / EN "My Approach to Technical Consulting" (corregir). Un párrafo y cuatro características (SEO técnico, Rendimiento web, Arquitectura escalable, Ingeniería de UX).

Corregir (guía 4.1 reglas 2 y 4, 4.3 y vocabulario del brief): "metodología", "motor principal del crecimiento orgánico", "gana terreno real", "prácticamente inmediata" y "Mi obsesión es el 100/100" son frases de folleto o cifras sin respaldo. Conservar los hechos (Next.js y CMS headless como Payload, SEO diseñado en el código desde el primer commit, auditar antes de construir, A11Y, mobile-first) y reemplazar el adjetivo suelto por la acción medible. Si una frase pide un dato, va `[PENDIENTE: dato medido]`. No usar "100/100". Foto: la home viva muestra una foto del taller de SEO técnico; en el mockup va `[PENDIENTE: foto del about desde Media]`. Retrato del hero: `[PENDIENTE: retrato de Juan desde Media]`.

### 3.8 Testimonio (`08-testimonio`)

Una sola cita real (hallazgo 5). ES "Trabajar con Juan fue lo mejor." Patricia Ibarra, CEO · Estylopia. EN: traducción provisional "Working with Juan was the best." más `[PENDIENTE: confirmar la traducción de la cita con la clienta]`. Además `[PENDIENTE: más citas reales y autorizadas]`. Título ES "Testimonios", EN "Testimonials".

### 3.9 Oferta de auditoría (`09-oferta`)

Fuente: `scripts/seed-home.ts`, objeto `COPY` (`audit`, líneas 117 a 134 ES y 179 a 196 EN) y la home viva (idéntico). Título ES "Empecemos por una auditoría técnica" / EN "We start with a technical audit" (corregir EN a primera persona del singular: la guía prohíbe "we"). Cinco incluidos, precio "600 USD", leyenda "Auditoría SEO técnica completa", "Entrega en 10 días hábiles", nota de crédito ("esos 600 se descuentan del trabajo") y botón "Pedir la auditoría" / "Request the audit". Precio y crédito vienen de la memoria del brief (600 USD acreditables) y D-05 los permite porque el brief los exige.

### 3.10 FAQ (`10-faq`)

Fuente: `scripts/humanize-home-page.ts`, constante `faqCopy` (líneas 173 a 234): cinco preguntas y respuestas ES y EN. Título ES "Preguntas frecuentes" / EN "Frequently asked questions" (ambos ya cumplen la regla 9 y la mayúscula inicial). Corregir: "¿Cómo medimos el éxito de las optimizaciones implementadas?" a singular ("Cómo mido el éxito de las optimizaciones" con o sin signos según D-07). Preguntas sin coma. Superficie de lectura: sin shaders (D-10), `<details>` nativos.

### 3.11 Contacto (`11-contacto`)

Fuente: `scripts/humanize-home-page.ts`, constante `contactCopy` (líneas 236 a 269). ES: etiqueta "Contacto"; título "Hablemos"; descripción "¿Tienes un proyecto en mente? Cuéntame de qué se trata."; campos Nombre, Correo electrónico, Mensaje; botón "Enviar mensaje"; lateral "Charlemos sobre tu próximo proyecto" y "Disponible para consultoría en ingeniería de software y SEO técnico."; correo `hello@juan-tech.com`. EN: Contact, Let's talk, "Got a project in mind? Tell me about it.", Name, Email, Message, "Send message", "Let's talk about your next project", "Available for software engineering and technical SEO consulting.".

- Corregir: "Suelo responder en menos de 48 horas." es un dato no confirmado (guía 7 y 11.7). Va `[PENDIENTE: plazo de respuesta real]`.
- El formulario del mockup no envía nada: sin `action`, sin `fetch`; muestra un estado ("Este formulario es un mockup, no envía nada" / "This form is a mockup, it sends nothing") dentro de `role="status"`. Sin campo trampa.
- Microcopy de terminal permitido (guía 6): `> contacto` / `> contact`, máximo 3 palabras.

### 3.12 Pie (`Footer.tsx`)

VIVO ES: Servicios (Auditoría SEO Técnica, Consultoría SEO, Desarrollo Full-Stack con SEO integrado, SEO para IA / GEO, Todos los servicios, SEO Técnico en Lima, SEO Técnico en Madrid / España); Sitio (Blog, Casos de éxito, Autores); Contacto (Contáctame, Buscar); LinkedIn `https://linkedin.com/in/juancangulo`; legales (Privacidad, Términos, Sitemap, Mi stack); "© 2026 Juan Carlos Angulo. Todos los derechos reservados." Marca: "Juan Carlos Angulo" y "Ingeniero de software y consultor SEO técnico. Lima, Perú." EN (VIVO): Services, Site, Contact, "Contact me", Search, Privacy, Terms, Sitemap, My stack, "© 2026 Juan Carlos Angulo. All rights reserved.", "Software engineer and technical SEO consultant. Lima, Peru.", "Technical SEO in Lima", "Technical SEO in Madrid / Spain".

Las listas dinámicas "Últimos artículos" y "Últimos casos de éxito" del pie vivo se incluyen con los cinco títulos ES vivos y, en EN, los títulos EN vivos; el artículo "Tablas hash..." sale en español en EN (bug del sitio vivo), así que lleva `[PENDIENTE: título en inglés]`. Enlaces a páginas vivas. Todos los enlaces del pie a páginas no maquetadas apuntan al sitio vivo.

Listas del pie vivo (2026-10-15):

- Últimos artículos, ES: "Tablas hash: Estructuras clave para un manejo eficiente de datos" (`/blog/cs-fundamentals/tablas-hash`), "Pilas y Colas" (`/blog/cs-fundamentals/pilas-y-colas`), "Recursividad" (`/blog/cs-fundamentals/recursividad`), "Hidratación Web" (`/blog/development/hidratacion-web`), "React 19" (`/blog/development/react-19`). EN: el primero igual en español (bug vivo), "Stacks and Queues", "Recursion algorithms", "Web Hydration SEO", "React 19 new features", con prefijo `/en` en las rutas. La cifra 19 va en `_numbers` con fuente "pie vivo".
- Últimos casos de éxito, ES (`/case-studies/<slug>`): "Escalar el contenido legal educativo a más de 86,000 clics orgánicos anuales para un despacho de defensa criminal" (`pittsburgh-criminal-defense-legal-content-seo`), "Más que duplicar el tráfico orgánico de un fabricante artesanal de baldosas hidráulicas en España" (`fabricante-baldosa-hidraulica-seo-espana`), "Cuadruplicar el tráfico orgánico de un despacho de inmigración en Atlanta en un año" (`immigration-law-atlanta-seo`), "De cero a los primeros clics orgánicos reales para un negocio local de talleres" (`talleres-costura-miami-lanzamiento-seo-local`), "De casi cero visibilidad a un año de crecimiento sostenido para un urólogo" (`urologo-seo-local-salud-santiago-rd`). EN (`/en/case-studies/<slug>`): "Scaling educational legal content to over 86,000 annual organic clicks for a criminal defense firm", "More than doubling organic traffic for a family-run artisan hydraulic tile manufacturer in Spain", "Quadrupling organic traffic for an Atlanta immigration law firm in one year", "From zero to the first real organic clicks for a local workshop business", "From near-zero visibility to a year of sustained growth for a urologist". Escribir "86 000" con espacio de no separación; la cifra 86000 va en `_numbers`.
- El caso "+68%" no entra al pie aunque esté en las listas vivas de otras páginas.

## 4. Cifras permitidas con fuente (las únicas)

| Valor | Dónde | Fuente |
|-------|-------|--------|
| 15, 13 | Conteo de clientes por grupo | Bloque vivo de logos (home) |
| 6, 1 | Desenlace del fix del sitemap | `seed-home.ts`, commit `6849e95` |
| 406, 309, 83, 86 000 | Métricas de casos | `/case-studies` vivo (Search Console, según la propia página) |
| 83, 73, 67 | Puntajes de websites | `/websites` vivo, con pendiente de fecha y herramienta |
| 29, 5, 500, 1 | Auditor propio | home viva, bloque auditor |
| 600, 10 | Oferta de auditoría | `seed-home.ts` y memoria del brief (600 USD acreditables) |
| 2026 | Año del pie | pie vivo |

Todo otro número en el copy es un FAIL del lint de 52-02. Hashes de commit y rutas no cuentan como cifras.

## 5. Contenido excluido

- Caso "+68%", testimonio "Marcela Ibáñez" y cualquier cifra de `scripts/seed-phase10-7-gap-fill.ts` (hallazgo 4).
- Perfil con "más de cuatro años", "18+ clientes" o "WPO en 35%" de `research/JUAN-PROFILE.md`: no aparecen en la home viva y no están confirmados para publicar.
- "Mi obsesión es el 100/100" y cualquier puntaje propio sin medición.
- Precio en tarjetas de servicio.
- Logos como imagen, fotos y cualquier recurso de Cloudinary.

## 6. Pendientes visibles obligatorios (mínimo)

1. Retrato del hero y foto del about (Media).
2. Plazo de respuesta real del formulario.
3. Fecha y herramienta de los puntajes de websites.
4. Más testimonios reales y traducción confirmada de la cita.
5. Título en inglés del artículo "Tablas hash" en el pie EN.
6. Logos de clientes como imagen.

## 7. Supuestos revisables (D-07 más los de este mapa)

Tuteo cálido; FAQ con signos de interrogación; separador `|` en metas; microcopy de terminal como etiqueta corta; orden de secciones del apartado 2; CRTWarp como segundo efecto; ASCII del hero estático; rutas `/` (ES) y `/en` (EN); enlaces a páginas no maquetadas hacia el sitio vivo; clientes como texto; ciudades en títulos de casos; precio de 600 USD en la home.
