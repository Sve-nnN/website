# Competidores del rediseño v4: qué muestran y cómo se presentan

**Fecha:** 2026-10-16
**Alcance:** 15 sitios (11 competidores directos o cercanos y 4 de inspiración). Capturé el primer viewport y el recorrido completo de la home en desktop 1440x900, en `research/redesign-v4/competidores/` (30 JPG, ancho 1400 px, 3.5 MB a 14 MB en total).
**Qué ya existía y no repetí:** `COMPETITOR-ANALYSIS.md` (SERP real de ES, 4 competidores) y `SEO-COMPETITIVE-AUDIT-v1.4.md` (servicios, precios y SEO local de esos 4). Aquí los 4 reaparecen solo para comparar su home en visual y estructura, no para repetir el análisis de keywords.

## Cómo verifiqué y qué no pude verificar

- **Verificado en vivo (Playwright, 2026-10-16):** titulares H1 a H3, orden de secciones, CTAs, textos visibles de la home, cantidad de imágenes, videos y SVG, huellas de stack en el HTML (Next.js, WordPress, Elementor, Astro, GSAP, Lottie) y el aspecto visual de cada captura.
- **No verificado:** el nivel de animación. Detecté librerías (GSAP, Lottie) y marquesinas en las capturas, pero no medí scroll animado ni transiciones. Lo marco como "estimado".
- **No verificado:** precios en páginas internas. Solo registro lo que aparece en la home. Fabio Gómez tiene una página "Precios" en el menú que no abrí. Los precios de Manu Fuentes y Carlos Sánchez vienen de `SEO-COMPETITIVE-AUDIT-v1.4.md` (2026-07-12), no de esta pasada.
- **No verificado:** el estado actual de juan-tech.com. Las comparaciones "mejor/peor que Juan" parten de `JUAN-PROFILE.md`, `COMPETITOR-ANALYSIS.md` y la auditoría v1.4, no de una captura nueva del sitio de Juan. Si la home cambió desde julio, hay que ajustar.
- **Mercado Perú:** no encontré el sitio personal de un consultor SEO técnico peruano que compita de forma directa. La búsqueda devolvió perfiles de marketplace (Upwork y Hubstaff, 25 USD por hora, autodeclarados), guías de precios de kom.pe (auditoría técnica en Lima entre S/ 500 y S/ 3,000, y consultor puntual entre S/ 1,500 y S/ 5,000, referenciales y comerciales) y el sitio de Andrés Ospina, que es colombiano y tiene una página "Consultor SEO en Lima". Lo trato como hueco, pero con esta cautela: puede que existan sitios que mi búsqueda no encontró.
- **Mercado LatAm:** la búsqueda de "SEO técnico + desarrollo" devolvió sobre todo ofertas de empleo y perfiles de marketplace. Elegí sitios propios que sí cargan (Colombia, Argentina) y descarté los perfiles de Malt, Fiverr y similares.
- Kelvin Rivera (Donostia, "full stack y SEO/GEO", 240 EUR al día en Malt) encaja con el perfil de Juan, pero no encontré sitio propio. Lo dejo fuera de las capturas y lo cito solo como señal de mercado.

## 1. Tabla comparativa

| # | Sitio | Tipo | Mercado e idioma | Hero (propuesta de valor) | Retrato | Prueba social visible en la home | Precios en la home | CTA principal | Stack visible | Animación (est.) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | carlossanchezdonate.com | Directo, el más cercano | ES, con versión EN | "La web del SEO técnico" | No | Ninguna en la home (la ficha previa cita logos y charlas en "sobre mí") | Máster anunciado (23 oct 2026, 30 plazas) sin precio en la barra; el precio sale en otra página | "Ver el Máster", "Contacto" | WordPress + Elementor | Baja |
| 2 | chesusrodrigo.es | Directo | ES, Zaragoza | "Sin SEO tu negocio no existe" | Sí, recortado sobre formas geométricas | 5.0 estrellas, 11 reseñas de Google, testimonios | No | "Quiero posicionar mi web" | WordPress + Elementor + Lottie | Media |
| 3 | manufuentes.com | Directo | ES | "Experto SEO que impulsa tu negocio en Google" | No (foto de escritorio con portátil) | Casos de éxito, bloque "Resultados que hablan por sí solos" | Solo "al mejor precio" en un titular (tabla de precios en otra página) | Botones "SEO On Page", "Blog", "Casos de éxito" | WordPress | Baja |
| 4 | capitanseo.es | Directo (marca personal con voz de agencia) | ES | "Capitán SEO, expertos en SEO y optimización de páginas web" | No | Sección "Qué dicen de nosotros" (1 testimonio según la ficha previa) | No | "Llámanos" | WordPress | Media (video de fondo con efecto glitch) |
| 5 | andresospina.co (Maldito Genio) | Cercano (growth + IA, Colombia) | ES-CO | "Growth Marketing Strategist" | Sí, circular | Marquesina de logos (Kayak, RD Station, Auteco, CodeGPT, Plat y más) | No | "Trabaja conmigo" | WordPress + GSAP | Media |
| 6 | julianbarbosa.com | Directo (Colombia) | ES-CO, con bandera EN | "Consultor SEO en Bogotá Colombia" | No (teclado en blanco y negro) | No hay bloque claro de prueba social; muestra videos | No | "Mejora tu posicionamiento web ahora" | WordPress | Baja |
| 7 | consultorseo.info (Fabio Gómez) | Directo (Colombia) | ES-CO | "Consultor SEO en Medellín que sí te explica cómo aparecer en Google" | Sí, más abajo (retrato editorial en B/N) | 3 casos con cifras de Search Console, testimonios, "20+ años" | Página "Precios" en el menú (sin abrir) | "Hablemos 30 minutos" (llamada gratis) | WordPress + Elementor | Media |
| 8 | cristiantait.com | Directo por perfil (full stack + SEO técnico, Argentina) | ES, EN, FR, PT | "Desarrollo Web que Convierte Visitantes en Clientes" | No | Cifras propias (+10 años, +50 proyectos, Lighthouse 98 a 100, 8.5% de conversión), sin logos ni testimonios | Sí: plan One Page por 50.000 al mes (moneda no indicada en la home; probablemente pesos argentinos, sin confirmar) | WhatsApp | Next.js | Media |
| 9 | ariannalupi.com | Peer y referencia (ya adoptada) | ES, con EN | "Hola, soy Arianna Lupi" | Sí, grande y arqueado | Logos, 4 casos con cifras, testimonios, premios, charlas, prensa | No | "Escríbeme", "Conóceme" | Astro | Media (marquesinas) |
| 10 | aleydasolis.com | Inspiración (referente EN/ES) | EN, con ES | "SEO & AI Search Consultant, Author & Speaker" | Sí | Logos de marcas, testimonios en carrusel, premios, charlas, newsletter de 35.000 suscriptores | No | "Get in touch now", "Request SEO Consulting" | WordPress | Media |
| 11 | jonoalderson.com | Inspiración, el más parecido en ángulo técnico (EN) | EN | "Exceptional technical SEO for ambitious brands" | Sí, retrato retocado a pantalla completa | Logos (Meta, Booking.com, DoorDash, Deliveroo, Nokia y más), 9 testimonios de otros SEO conocidos, 4 insignias de premios | No | "Hire me as a consultant" | WordPress | Baja a media |
| 12 | polemicdigital.com (Barry Adams) | Inspiración (nicho vertical) | EN | "Specialist SEO consultancy for news publishers" | No | Logos de medios (The Guardian, NYT, Politico, Condé Nast y más) | No | "SEO Services" | WordPress + Elementor | Baja |
| 13 | masindexable.com (Gustavo Mas) | Directo de nivel pyme (Argentina) | ES-AR | "Ayudo a empresas, pymes y emprendedores a mejorar su visibilidad en Google" | No (ilustraciones de personajes) | Testimonios con nombre, 3 proyectos | No | "Solicitar auditoría SEO", "Ver proyectos" | WordPress + Lottie | Media |
| 14 | brittanychiang.com | Inspiración (portfolio de ingeniera) | EN | "Frontend Engineer, accesible y pixel-perfect" | No | Empleadores en la línea de experiencia (Klaviyo, Upstatement, Apple) | No | Ninguno comercial | Next.js (huella de Gatsby) | Baja (resalte al pasar el cursor) |
| 15 | leerob.com | Inspiración (minimalismo extremo) | EN | "Engineer and writer", bio en dos párrafos | Ilustración, no foto | Ninguna formal; la marca personal viene de SpaceX, Cursor y Vercel | No | Ninguno | Next.js | Ninguna |

## 2. Fichas cortas

### 1. Carlos Sánchez Donate (carlossanchezdonate.com)
- **Hero:** "La web del SEO técnico". No se vende a sí mismo, define la especialidad y se pone como la autoridad. Explica que el SEO técnico usa la programación a su favor.
- **Orden:** anuncio del Máster, barra con métricas en vivo, menú, hero, texto de tesis ("El posicionamiento que marca la diferencia"), "Especializarse en SEO técnico", "Mejorar en lo laboral", formación (CTA al Máster), "El SEO técnico" con campos (canonicals, hreflang, redirecciones, sitemaps, robots.txt, rendimiento), "Tu SEO de referencia", publicaciones recomendadas, "Aprende SEO On-Page", curiosidades, noticias SEO.
- **Detalle que más destaca:** una franja de arranque con datos técnicos del propio sitio en tiempo real (protocolo h2 o h3, TTFB, LCP, CLS y peso del documento). La captura mostró 447 ms de TTFB y el texto extraído 1623 ms en otra carga, así que el dato se mide en cada visita. Funciona como prueba de competencia sin una sola palabra.
- **Ofertas:** Máster de SEO técnico anunciado en la cabecera. Servicios de consultoría a medida en otras páginas.
- **Imágenes:** casi ninguna. Un panel violeta con trama hexagonal. 37 imágenes en total, la mayoría de blog.
- **Mejor que Juan:** autoridad por profundidad, un blog enorme con categorías técnicas (Rastreo, Renderizado, WPO, IA, Internacional), producto de formación con fecha y cupos, métricas vivas en la cabecera, 6 charlas citadas en su página "sobre mí".
- **Peor que Juan:** sin casos con cifras, sin retrato en la home, sin testimonios ni logos visibles en la home, estética de WordPress. Su texto vende conocimiento, no resultados de cliente.

### 2. Chesus Rodrigo (chesusrodrigo.es)
- **Hero:** "Sin SEO tu negocio no existe", con foto de él recortada y un solo CTA.
- **Orden:** hero, "¿Por qué necesitas contratarme?", servicios (5 tarjetas), "Mi enfoque", trayectoria, otros servicios (6), opiniones, FAQ (6), "Puedes encontrarme como", blog.
- **Prueba social:** 5.0 en Google con 11 reseñas, mostrado en el cuerpo de la home.
- **Mejor que Juan:** retrato en el hero, reseñas de Google verificables, FAQ que responde objeciones ("¿Es caro contratar un consultor SEO autónomo?"), SEO local por ciudad.
- **Peor que Juan:** enfoque generalista y local (dentistas, nutricionistas), sin ángulo de ingeniería, sin casos con cifras, sin stack técnico.

### 3. Manu Fuentes (manufuentes.com)
- **Hero:** "Experto SEO que impulsa tu negocio en Google", con foto de stock de un portátil.
- **Orden:** hero, tesis de 10 años, "Mi trabajo" (on-page y off-page), "Qué trabajo" (9 servicios), "Qué no hago" (anti-promesas), casos de éxito, "Por qué contratarme" (4 razones).
- **Detalle que más destaca:** una sección "Qué NO hago" con tres negativas explícitas (resolver cualquier problema técnico, resultados mágicos en una semana, black hat). Genera confianza por honestidad.
- **Mejor que Juan:** transparencia de precios en su sitio (según la auditoría v1.4), honestidad como marca, proyecto propio (SportBall) como caso.
- **Peor que Juan:** diseño casi sin identidad (logo centrado, texto largo, foto genérica), sin retrato.

### 4. Capitán SEO (capitanseo.es)
- **Hero:** nombre de marca sobre un video de fondo pixelado con colores saturados, y un botón "Llámanos".
- **Orden:** hero con video, 6 servicios (Google Ads, diseño web, consultor SEO, auditoría, linkbuilding, SEO para IA), "Sabiduría y experiencia", "No solo de SEO vive el hombre", especialista SEO, opiniones, cierre "¿Y tú?".
- **Detalle que más destaca:** "SEO para IA" como servicio con nombre propio. Pregunta en el texto: si tu marca aparece cuando alguien consulta a ChatGPT, Gemini o Claude.
- **Mejor que Juan:** nombra la oferta GEO en la home, tiene marca memorable.
- **Peor que Juan:** pocas pruebas, tono de agencia, el hero con video pesado y sin mensaje.

### 5. Andrés Ospina, Maldito Genio (andresospina.co)
- **Hero:** retrato circular, "Hola, soy Andrés Ospina" y "Growth Marketing Strategist" en tipografía enorme, con una marquesina de logos de clientes justo debajo.
- **Orden:** hero con logos, bloque de blog sobre IA y B2B, contacto. Menú con Conferencias, Eventos, Podcast, Recursos (calculadora de embudo y de tests A/B, plantillas, herramientas de IA).
- **Mejor que Juan:** logos de clientes en el primer viewport, herramientas gratuitas como imán de leads, podcast y conferencias, CTA único y claro ("Trabaja conmigo"), tiene una página dedicada para Lima.
- **Peor que Juan:** no es técnico, no muestra casos ni cifras en la home.

### 6. Julian Barbosa (julianbarbosa.com)
- **Hero:** "Consultor SEO en Bogotá Colombia" sobre foto oscura de teclado, párrafo genérico y CTA grande.
- **Orden:** hero, "Especialista SEO freelance" (+10 años, CMS, desarrollo web), servicios, "Mejora tu visibilidad", "¿Por qué contratar un consultor SEO?", videos, CTA final.
- **Mejor que Juan:** el titular con ciudad y país captura la intención local sin disimulo. Menciona desarrollo web.
- **Peor que Juan:** sin prueba social visible, imagen de stock, copy genérico.

### 7. Fabio Gómez (consultorseo.info)
- **Hero:** "Consultor SEO en Medellín que sí te explica cómo aparecer en Google", tipografía gigante sobre fondo azul marino, interruptor de modo claro u oscuro, línea de tendencia punteada de fondo, CTA "Hablemos 30 minutos" y una nota "análisis honesto de tu situación, sin venderte nada".
- **Orden:** hero, tira de 3 cifras, problema ("Si dejas de pagar publicidad, dejas de existir"), servicios (4 tarjetas con viñetas), casos locales con cifras, retrato y cita, CTA de llamada, últimos artículos (con casos reales), testimonios.
- **Casos con cifras (de Google Search Console, según su texto):** Transestrella pasa de 115 a más de 1.500 visitas al mes y de 2.119 a más de 80.000 impresiones; Exotic Rent Car de 113 a 489 en un mes; Don Castor de 57 a 189 en un año. Cada caso enlaza a una página con el gráfico mes a mes. No pude verificar las cifras por mi cuenta.
- **Mejor que Juan:** es el mejor ejemplo de esta lista de casos con cifras en la home, con el tono claro de "te explico", un CTA de baja fricción y modo claro u oscuro.
- **Peor que Juan:** sin ángulo de ingeniería real (WordPress y Elementor), enfoque local.

### 8. Cristian Tait (cristiantait.com)
- **Hero:** "Desarrollo Web que Convierte Visitantes en Clientes", un indicador de disponibilidad ("Disponible para nuevos proyectos"), cuatro cifras (+10 años, +50 proyectos, Lighthouse 98 a 100, 8.5% de conversión) y WhatsApp como único CTA.
- **Orden:** hero con cifras, "¿Tu negocio no está creciendo online?" (6 dolores), 7 servicios end to end (full stack, AWS, SEO técnico, e-commerce, soporte, seguridad, IA), producto de chatbot con IA, "No soy otro desarrollador, soy tu socio estratégico" (6 razones), proceso en 4 pasos, FAQ (7 preguntas), blog, CTA final.
- **Oferta y precio visibles:** plan One Page con sitio, hosting y dominio por 50.000 al mes sin inversión inicial. Moneda no indicada en la home.
- **Es el perfil más parecido al de Juan** (ingeniero full stack con SEO técnico) y el único competidor LatAm con Next.js que encontré.
- **Mejor que Juan:** oferta clara con precio, cifras en el hero, proceso en pasos, 4 idiomas, WhatsApp directo, estructura de venta completa.
- **Peor que Juan:** sin retrato, sin casos con nombre ni logos (las cifras de arriba no traen ninguna prueba), cero testimonios, una oferta demasiado amplia ("hago de todo") y un diseño oscuro con degradado morado que ya se ve genérico.

### 9. Arianna Lupi (ariannalupi.com)
- **Hero:** retrato grande en arco, "Hola, soy Arianna Lupi" con el apellido en cursiva color terracota, 8+ años, dos CTAs (Conóceme y Escríbeme), una marquesina de sectores y logos de "Mencionada y destacada en".
- **Orden:** hero, cifras (8+ años, 2M+ USD en ingresos orgánicos, 1K+ estudiantes, 20+ clientes), logos de marcas (HubSpot, Unilever, Holafly, TravelPerk y más), 4 casos de éxito con cifras, "Construyo lo que enseño" (aprendoclub y contrataunmarketer), "Cómo podemos trabajar juntos" (consultoría, asesoría 1 a 1, in-company), cursos, charlas, testimonios, prensa, newsletter, contacto.
- **Mejor que Juan:** es el modelo completo de confianza (logos, casos con cifras, testimonios, premios, charlas, prensa) y de varias vías de entrada (consultoría, cursos, newsletter). Es la referencia que `COMPETITOR-ANALYSIS.md` ya había adoptado para los case studies.
- **Peor que Juan:** no es un perfil de ingeniería, no muestra stack ni código.

### 10. Aleyda Solis (aleydasolis.com/en)
- **Hero:** degradado azul, retrato, "Award Winning International SEO & AI Search Optimization Consultant, Speaker & Author" y un CTA.
- **Orden:** hero, "Who is Aleyda Solis?" (premios y prensa), "SEO Consultancy" con logos, testimonios en carrusel, conferencias, herramientas y recursos gratuitos (newsletter SEOFOMO, 35.000 suscriptores), blog, podcast, contacto.
- **Mejor que Juan:** autoridad por premios y publicaciones, ecosistema de productos propios (newsletter, tools, aprendizaje), testimonios largos con nombre y cargo.
- **Peor que Juan:** estética recargada, blanda y poco técnica. Es un modelo de autoridad, no de ingeniería.

### 11. Jono Alderson (jonoalderson.com)
- **Hero:** retrato a pantalla completa con luz azul, "Exceptional technical SEO for ambitious brands", un botón "Hire me as a consultant" y cuatro insignias de premios (Digital Superstar, SEO World Champion 2018 y 2023, Best SEO Specialist).
- **Orden:** hero, "Hello. Nice to meet you." (presentación y promesa: técnica, rendimiento y datos estructurados), pensamiento reciente (3 artículos), consultoría y charlas, logos de marcas, 9 testimonios de figuras del sector (Joost de Valk, Lily Ray, Barry Adams y otros), contacto.
- **Detalle:** publica herramientas propias (Impolighthouse, Edge Images, Well-known File Manager), prueba de ingeniería real.
- **Mejor que Juan:** combina retrato, premios, logos y testimonios de pares de peso, y vende un servicio con nombre ("Hire me as a consultant"). Es el referente más cercano del ángulo "técnico, con código".
- **Peor que Juan:** WordPress, sin casos con cifras en la home, en inglés solamente.

### 12. Barry Adams, Polemic Digital (polemicdigital.com)
- **Hero:** "Specialist SEO consultancy for news publishers" sobre fondo azul geométrico, y una pared de logos justo debajo (The Guardian, NYT, Fox, Politico, The Sun, Condé Nast y más).
- **Orden:** hero, logos, 4 tarjetas (SEO para editores, auditorías, formación, newsletter). Home corta, 3.136 px de alto.
- **Mejor que Juan:** nicho vertical clarísimo y logos de máximo nivel en el primer scroll. Demuestra que una home puede ser corta si la prueba es fuerte.
- **Peor que Juan:** un sitio plano, sin retrato ni rostro. Su ventaja es el nicho, no el diseño.

### 13. Gustavo Mas, Más Indexable (masindexable.com)
- **Hero:** "Ayudo a empresas, pymes y emprendedores a mejorar su visibilidad en Google", fondo azul saturado, dos CTAs, ilustraciones de personajes.
- **Orden:** hero, 4 servicios (auditoría, diseño web orientado a SEO, on-page y técnica, consultoría), "el posicionamiento no es fácil", herramientas que usa, 3 proyectos con capturas, sobre mí, testimonios, FAQ de 10 preguntas (incluye "¿Qué es el SEO para IA y lo trabajas?"), CTA, formulario de revisión.
- **Mejor que Juan:** FAQ amplia, formulario de revisión SEO como lead magnet, lista visible de herramientas.
- **Peor que Juan:** plantilla de pyme, ilustraciones de stock, diseño poco cuidado.

### 14. Brittany Chiang (brittanychiang.com)
- **Hero:** columna fija a la izquierda con nombre, rol y navegación por secciones (About, Experience, Projects), contenido a la derecha que se desplaza. Fondo azul oscuro con foco de luz que sigue al cursor (según mi lectura del patrón conocido; no medí la animación).
- **Orden:** about, experiencia con etiquetas de tecnología, proyectos, escritura.
- **Qué aporta:** un solo layout de dos columnas que presenta experiencia, stack y proyectos sin ninguna imagen decorativa. Etiquetas de tecnología por cada experiencia. Es el estándar de portfolio de ingeniería.
- **No compite en servicios.** Sirve solo como referencia de portfolio técnico.

### 15. Lee Robinson (leerob.com)
- **Hero:** el sitio entero es una página de texto con bio, lista de notas, lista de artículos con fecha y una ilustración a la derecha. 1.220 px de alto y ninguna imagen de tipo foto.
- **Qué aporta:** prueba de que la autoridad puede venir solo de la biografía (SpaceX, Cursor, Vercel, Next.js) y de la escritura. Es el extremo opuesto de una home comercial. Sirve como contraste, no como modelo.

## 3. Matriz de secciones (quién tiene qué en la home)

Leyenda: X = lo vi en la home en vivo. P = parcial. Vacío = no lo vi. Los datos de Juan salen de los documentos de research, sin captura nueva.

| Sección o elemento | Carlos S. | Chesus R. | Manu F. | Capitán | Ospina | Barbosa | Fabio G. | Tait | Arianna | Aleyda | Jono | Barry | Mas | Chiang | Lee R. | Juan (según docs) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Retrato en el hero | | X | | | X | | | | X | X | X | | | | | por confirmar |
| Hero con titular de especialidad claro | X | X | X | P | P | X | X | X | P | X | X | X | X | X | P | X |
| Cifras de impacto en el hero o justo debajo | | P | | | | P | X | X | X | | | | | | | por confirmar |
| Logos de clientes o prensa | | | | | X | | | | X | X | X | X | | P | | X (ClientLogosBlock) |
| Casos con cifras | | | X | | | | X | | X | | | | P | | | X (modelo listo, datos por poblar) |
| Testimonios | | X | | X | | | X | | X | X | X | | X | | | 1 (Patricia Ibarra) |
| Reseñas de Google | | X | | | | | | | | | | | | | | No |
| Premios, certificaciones, insignias | | | | | | | | | X | X | X | | | | | No |
| Charlas y eventos | P | | | | X | | | | X | X | X | | | | | X (2 en el perfil) |
| Servicios en tarjetas | P | X | X | X | | X | X | X | X | X | X | X | X | | | Parcial (sin página de servicios) |
| Oferta con precio o plan | P | | P | | | | P | X | | | | | | | | No |
| Proceso en pasos | | | | | | | | X | | | | | | | | No |
| FAQ | | X | | | | | | X | | | | | X | | | por confirmar |
| Sección de "qué no hago" | | | X | | | | | | | | | | | | | No |
| Servicio de IA o GEO con nombre | P | | | X | P | | | P | P | X | | | P | | | No (hay llms.txt sin nombrar) |
| Métricas técnicas propias en vivo | X | | | | | | | P (Lighthouse) | | | | | | | | No |
| Herramientas o recursos gratuitos | X | | | | X | | | | P | X | X | | | | | No |
| Blog o artículos recientes | X | X | | | X | | X | X | | X | X | | | X | X | X |
| Newsletter | | | | | | | | | X | X | | X | | | | No |
| Podcast o video | | | | X | X | X | | | | X | | | | | | No |
| Stack o tecnologías visibles | P | | | | | | | X | | | P | | X | X | | por confirmar |
| Casos de proyectos construidos (portfolio) | | | | | | | | | P | | | | X | X | | X (case studies) |
| Idioma EN junto a ES | X | | | | | X | | X | X | X | | | | | | X |
| CTA de llamada gratuita | | | | | | | X | | | | | | | | | por confirmar |
| WhatsApp visible | | | | | | X | X | X | | | | | X | | | por confirmar |
| Modo claro y oscuro | | | | | | | X | | | | | | | | | por confirmar |

## 4. Patrones del mercado

1. **El hero casi siempre dice "consultor SEO en [ciudad]".** Chesus, Fabio, Barbosa y Mas lo hacen. Nadie dice "ingeniero que arregla SEO desde el código" en el hero, salvo Tait con otro enfoque (web que convierte) y Carlos (define la disciplina).
2. **El retrato separa a quienes parecen personas de quienes parecen plantillas.** Arianna, Aleyda, Jono, Chesus y Ospina lo ponen en el primer viewport. Los que usan foto de stock (Manu, Barbosa) o ilustración (Mas) se perciben más débiles.
3. **Los logos y casos con cifras concentran la confianza.** Arianna, Fabio y Jono llevan la prueba al primer o segundo scroll. Carlos, el que más posiciona en SERP, no la muestra en la home, y compensa con volumen de contenido.
4. **El precio casi no aparece.** Solo Tait muestra un plan con precio. Manu lo hace en otra página. Fabio tiene un enlace a "Precios".
5. **GEO y SEO para IA ya tiene nombre en 3 de 15 sitios:** Capitán SEO, Aleyda Solis ("AI Search Optimization" en el hero) y Gustavo Mas (FAQ). Carlos Sánchez publica sobre llms.txt. Ya no es un hueco vacío, es un hueco que se cierra.
6. **La animación es baja en general.** WordPress con Elementor domina (9 de 15). Solo Tait, Arianna (Astro), Chiang y Lee usan stacks modernos, y entre ellos solo Tait es competidor comercial. Ningún competidor directo usa 3D, video propio ni capturas de dashboards en su home.
7. **Capturas de dashboards de Search Console:** Fabio las cita ("cada caso está publicado con su gráfico mes a mes") pero en la página del caso, no en la home. Ninguno las muestra en el primer scroll.

## 5. Huecos de mercado que Juan puede ocupar

1. **Ingeniero que corrige el SEO en el código, con evidencia en repositorio público.** Nadie en la lista lo dice con esas palabras y lo prueba con enlaces a commits o PRs. Tait se acerca por perfil (full stack con SEO técnico), pero vende "web que convierte", no auditoría con código. Es el diferenciador central (ver también la memoria del proyecto sobre el bloque central con fixes del repo público).
2. **Sitio propio como prueba técnica.** Solo Carlos muestra métricas técnicas vivas. Si juan-tech.com mide Core Web Vitals en tiempo real y los muestra, Juan iguala ese gesto y lo mejora al estar construido sobre Next.js y Payload.
3. **Mercado peruano.** No encontré un consultor SEO técnico peruano con sitio propio sólido (limitación de mi búsqueda, ver arriba). Ospina, que vive en Colombia, ya tiene una página "Consultor SEO en Lima". Una página o bloque para Lima con casos y precios referenciales en soles es terreno poco ocupado.
4. **Puente Lima y Madrid, ES y EN.** Solo Carlos, Barbosa, Tait, Arianna y Aleyda tienen versión en dos idiomas, y ninguno apunta a Lima y Madrid a la vez. En inglés, la lista no tiene a nadie con el perfil "ingeniero de software que hace SEO técnico". Jono es el más cercano, pero es británico, consultor de marcas grandes y sin servicios de implementación.
5. **Oferta de auditoría con precio y entregables visibles.** Nadie con perfil técnico lo hace en la home. La memoria del proyecto registra 600 USD acreditables por auditoría. Mostrarlo diferencia por transparencia (Manu fue el único que se atrevió, y solo en otra página).
6. **GEO y SEO para IA con evidencia propia.** Juan ya tiene llms.txt, llms-full.txt, formación en IA+SEO y el taller de Lima. Los otros 3 que lo nombran no muestran una implementación propia verificable.
7. **Honestidad de "qué no hago".** Manu es el único. Juan puede hacerlo desde un ángulo de ingeniería: "no prometo posiciones, entrego cambios verificables".

## 6. Lista priorizada para la home de Juan

**Imprescindible (compite o pierde):**
1. **Hero con propuesta clara y retrato real.** Titular que combine ingeniería y SEO técnico, una frase de para quién, un CTA principal y uno secundario. Retrato en el primer viewport. Sin foto de stock.
2. **Franja de pruebas rápidas bajo el hero.** 3 o 4 cifras reales y verificables (años, clientes, mejora de rendimiento, charlas) y logos de clientes si se pueden mostrar. Modelo: Arianna, Ospina, Barry.
3. **Bloque central de fixes y casos con cifras.** Pruebas de ingeniería (commits o PRs públicos) más 2 o 3 casos con antes y después. Modelo: Fabio (cifras de Search Console con enlace al caso), Arianna (4 casos).
4. **Servicios en tarjetas con nombre propio:** auditoría técnica, implementación en Next.js o Payload, SEO para IA o GEO. Modelo: Chesus, Gustavo Mas, Carlos. Hoy Juan no tiene página de servicios (según la auditoría v1.4).
5. **Oferta de auditoría con precio y entregables.** Una tarjeta con "qué incluye, en cuánto tiempo, cuánto cuesta". Modelo: Tait (precio visible) y Manu (transparencia).
6. **Testimonios con nombre y cargo, y reseñas de Google si existen.** Modelo: Aleyda (largos y con cargo), Chesus (5.0 en Google). Hoy Juan tiene un solo testimonio.
7. **CTA de baja fricción.** Llamada de 30 minutos sin compromiso y una vía rápida (WhatsApp o correo). Modelo: Fabio, Tait.
8. **Selector de idioma visible ES y EN.**

**Alta prioridad (diferencia):**
9. **Franja de métricas técnicas del propio sitio en vivo** (LCP, CLS, TTFB, peso del HTML). Modelo: Carlos. Juan puede hacerlo con datos reales del servidor Next.js.
10. **SEO para IA y GEO con nombre propio**, con la evidencia (llms.txt, taller de Lima). Modelo: Capitán, Aleyda.
11. **Proceso en 4 pasos.** Modelo: Tait.
12. **Sección "qué no hago".** Modelo: Manu.
13. **FAQ corta (6 a 8 preguntas)**, con precio, plazos y alcance. Modelo: Chesus, Mas.
14. **Charlas y formación en una sola banda.** Caracas SEO Fest, taller de Lima con DinoRANK, aprendoclub. Modelo: Arianna ("En el escenario"), Jono.
15. **Bloque de Lima y Madrid** con intención local clara y casos o precios referenciales por mercado.

**Opcional (según tiempo):**
16. Recurso gratuito (checklist o calculadora) como imán de leads. Modelo: Ospina, Aleyda.
17. Newsletter. Modelo: Arianna, Aleyda, Barry.
18. Stack visible en etiquetas por proyecto. Modelo: Chiang.
19. Últimos artículos del blog (3). Modelo: Jono, Carlos.
20. Modo claro y oscuro. Modelo: Fabio.

**Evitar (lo que se ve mal en el mercado):**
- Foto de stock o ilustración genérica de personajes (Manu, Mas).
- Video de fondo sin mensaje (Capitán).
- Degradado morado con tarjetas oscuras (Tait): ya se ve genérico.
- Hero que enumera servicios sin decir para quién ni con qué resultado (Barbosa).
- Hero sin retrato, sin logos y sin casos (Carlos en la home).

## 7. Resumen de lo que hace cada uno mejor que Juan, en una línea

- **Carlos Sánchez:** métricas vivas y un producto de formación con fecha y cupos.
- **Chesus Rodrigo:** reseñas de Google visibles y FAQ que atiende objeciones.
- **Manu Fuentes:** precios en su sitio y honestidad de "qué no hago".
- **Capitán SEO:** "SEO para IA" con nombre en la home.
- **Andrés Ospina:** logos en el primer viewport y recursos gratuitos.
- **Fabio Gómez:** casos con cifras de Search Console y CTA de llamada sin presión.
- **Cristian Tait:** oferta completa con precio, cifras en el hero, proceso y 4 idiomas.
- **Arianna Lupi:** sistema completo de confianza y varias vías de entrada.
- **Aleyda Solis y Jono Alderson:** autoridad por premios, logos y testimonios de pares.
- **Barry Adams:** nicho vertical y logos de máximo nivel con una home corta.

## Fuentes

- Capturas y extracción de textos con Playwright el 2026-10-16: carlossanchezdonate.com, chesusrodrigo.es, manufuentes.com, capitanseo.es, andresospina.co, julianbarbosa.com, consultorseo.info, cristiantait.com, ariannalupi.com, aleydasolis.com/en, jonoalderson.com, polemicdigital.com, leerob.com, brittanychiang.com, masindexable.com.
- Búsquedas web para descubrir candidatos (resultados parciales, perfiles de marketplace y guías comerciales, usados solo como orientación): Upwork, Hubstaff, Malt (perfil de Kelvin Rivera Romero), kom.pe (guías de precios en Perú), andresospina.co/consultor-seo/lima.
- `research/COMPETITOR-ANALYSIS.md` y `research/SEO-COMPETITIVE-AUDIT-v1.4.md` (2026-07-11 y 2026-07-12) para precios, servicios y E-E-A-T de los 4 competidores ya analizados.
- `research/JUAN-PROFILE.md` para el estado y la identidad de Juan.
