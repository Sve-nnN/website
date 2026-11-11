# Textos de la home y lote 1 de CTAs (plan 56-02)

Este archivo es la fuente de los datos tipados de la home. Ya trae lo que Juan decidió el 2026-11-10 (ver `aprobaciones-juan.md` y `opciones-home.md`). Lo demás queda en "(pega aquí)".

Cómo se usa:

1. Pega el texto después de los dos puntos. Sin rayas largas ni medias.
2. Donde no tengas texto, deja "(pega aquí)". Esa fila conserva su texto vigente y queda en estado pendiente.
3. Para cambiar una elección, cambia la línea "Elegida:" de la sección. Si la opción elegida no tiene texto, la decisión cae al texto vigente y queda pendiente.
4. Corre `node scripts/verify/56-inputs-check.mjs` para ver la tabla de casillas llenas y vacías, y `--emit-json` para regenerar `scripts/db/data/56-juan-inputs.json`.
5. Si prefieres no decidir algo, escribe "defaults" en el chat: la fase sigue con el valor recomendado.

## LOTE1 CTAs del lote 1

Tabla de 13 filas aprobada por Juan el 2026-11-10 (ver `aprobaciones-juan.md`), con el cierre de la home cambiado (D-15). Las filas con "(pega aquí)" no estaban en esa tabla: son del lote 2 (pasos de Contacto) o textos que Juan no vio, y quedan pendientes.

- hero-cta | origen: global sombra home-page, hero.ctaLabel | carga: ahora | vigente ES: Pedir auditoría 360 | ES: Pedir auditoría 360 | EN: Request a 360 audit
- services-cta | origen: global sombra home-page, services.ctaLabel | carga: ahora | vigente ES: Hablemos de tu sitio | ES: Hablemos de tu sitio | EN: Let's talk about your site
- cierre-titulo | origen: global sombra home-page, cta.title | carga: ahora | vigente ES: Hablemos de tu sitio | ES: Hablemos de tu sitio | EN: Let's talk about your site
- cierre-lead | origen: global sombra home-page, cta.lead | carga: ahora | vigente ES: ¿Tienes un proyecto en mente? Cuéntame de qué se trata y empiezo por mirar qué ve Google hoy. | ES: ¿Tienes un proyecto en mente? Cuéntame de qué se trata. | EN: Have a project in mind? Tell me what it is about.
- cases-cta | origen: global sombra home-page, cases.ctaLabel | carga: ahora | vigente ES: Ver todos los casos | ES: Ver todos los casos | EN: See all case studies
- sites-cta | origen: global sombra home-page, sites.ctaLabel | carga: ahora | vigente ES: Ver todos los sitios | ES: Ver todos los sitios | EN: See all websites
- contact-step-1 | origen: global sombra home-page, contact.steps[0].title | carga: ahora | vigente ES: Me cuentas el proyecto | ES: (pega aquí) | EN: (pega aquí)
- contact-step-2 | origen: global sombra home-page, contact.steps[1].title | carga: ahora | vigente ES: Miro qué ve Google hoy | ES: (pega aquí) | EN: (pega aquí)
- contact-step-3 | origen: global sombra home-page, contact.steps[2].title | carga: ahora | vigente ES: Te digo por dónde empezar | ES: (pega aquí) | EN: (pega aquí)
- header-cta | origen: global header, ctaButton (lo lee master) | carga: corte | vigente ES: Hablemos | ES: Pedir auditoría 360 | EN: Request a 360 audit
- audit-offer-cta | origen: bloque auditOfferBlock del doc pages home (lo lee master) | carga: corte | vigente ES: Pedir la auditoría | ES: (pega aquí) | EN: (pega aquí)
- auditor-cta | origen: bloque auditorHighlight o messages auditorHighlight.cta (lo lee master) | carga: corte | vigente ES: Probar el auditor | ES: Probar el auditor | EN: Try the auditor
- services-index-talk | origen: messages, services.index.talkCta | carga: ahora | vigente ES: Hablar con Juan | ES: Hablar con Juan | EN: Talk to Juan
- service-card-cta | origen: messages, servicesShowcase.cta | carga: ahora | vigente ES: Explorar servicio | ES: Explorar servicio | EN: Explore service
- auditor-notice-cta | origen: messages, serviceScopeCard.auditorCta | carga: ahora | vigente ES: Ir al auditor | ES: Ir al auditor | EN: Go to the auditor
- stack-tool-link | origen: messages, serviceScopeCard.ctaDefault | carga: ahora | vigente ES: Probar {tool} | ES: Probar {tool} | EN: Try {tool}
- stack-amazon | origen: messages, serviceScopeCard.ctaAmazon | carga: ahora | vigente ES: Ver en Amazon | ES: Ver en Amazon | EN: View on Amazon
- contact-response-note | origen: global sombra home-page contact.infoRows[0].text y messages contact.cta.responseNote | carga: ahora | vigente ES: Suelo responder en menos de 48 horas. | ES: Suelo responder en menos de 48 horas. | EN: I usually reply within 48 hours.
- contact-write-email | origen: messages, contact.writeEmail | carga: ahora | vigente ES: Escribir un correo | ES: (pega aquí) | EN: (pega aquí)
- contact-submit | origen: messages, contact.form.submit | carga: ahora | vigente ES: Enviar mensaje | ES: (pega aquí) | EN: (pega aquí)
- emailcapture-submit | origen: messages, emailCapture.submitLabel | carga: ahora | vigente ES: Enviarme el checklist | ES: (pega aquí) | EN: (pega aquí)
- newsletter-submit | origen: messages, blog.newsletter.submitLabel | carga: ahora | vigente ES: Suscribirme | ES: (pega aquí) | EN: (pega aquí)

## D-22a Título del hero

Vigente (rechazado por Juan): Arreglo el SEO desde el código
Recomendada: A
Elegida: A
Estado: aprobado
Nota: Juan eligió A y pidió el inglés "Technical SEO consultant who also codes". La etiqueta sobre el título ("Ingeniero de software") se conserva tal cual, decisión de Juan.

- A | ES: Consultor SEO técnico que también programa | EN: Technical SEO consultant who also codes
- B | ES: Consultor SEO técnico que corrige el problema en el código | EN: Technical SEO consultant who fixes the problem in the code
- C | ES: Consultoría SEO técnica con ingeniería detrás | EN: Technical SEO consulting backed by engineering
- D | ES: Consultor SEO técnico con mentalidad de ingeniero | EN: Technical SEO consultant with an engineer's mindset
- E | ES: Consultor SEO técnico para sitios que viven del tráfico orgánico | EN: Technical SEO consultant for sites that live on organic traffic

## D-22b Texto del hero

Vigente (rechazado por Juan): Entro al código, corrijo lo que frena a Google en tu sitio y mido el resultado en Search Console. Trabajo en español e inglés.
Recomendada: 1
Elegida: 2
Estado: aprobado
Nota: Juan eligió la opción 2 y confirmó que son más de 18 clientes internacionales.

- 1 | ES: Encuentro lo que frena tu tráfico orgánico, lo corrijo yo mismo o dejo el cambio exacto para tu equipo, y compruebo el efecto en Search Console. Trabajo en español e inglés. | EN: I find what holds back your organic traffic, fix it myself or leave the exact change for your team, and check the effect in Search Console. I work in Spanish and English.
- 2 | ES: Soy ingeniero de software y llevo el SEO técnico de más de 18 clientes internacionales. Audito, corrijo en el código y mido el resultado. | EN: I'm a software engineer and I run the technical SEO of more than 18 international clients. I audit, fix in the code and measure the result.
- 3 | ES: Consultoría SEO técnica para empresas y agencias que quieren más tráfico orgánico: auditoría, corrección en el código y medición. | EN: Technical SEO consulting for companies and agencies that want more organic traffic: audit, fix in the code and measurement.

## D-22c Estadística del hero

Vigente (rechazado por Juan): +406 % clics interanuales en un caso de salud
Recomendada: atlanta
Elegida: ninguna
Estado: aprobado
Nota: Juan decidió no mostrar ninguna cifra en el hero. Las candidatas quedan registradas con sus cifras de origen por si cambia de idea; su leyenda en inglés no se pega mientras la elegida sea ninguna.

- atlanta | valor: +309 % | desde: 9621 | hasta: 39323 | leyenda: clics interanuales en un caso de inmigración
- urologia | valor: +406 % | desde: 48 | hasta: 243 | leyenda: clics interanuales en un caso de salud
- baldosa | valor: +143 % | desde: 9629 | hasta: 23410 | leyenda: clics interanuales en un fabricante de baldosa hidráulica
- edtech | valor: +104 % | desde: 6113 | hasta: 12485 | leyenda: clics interanuales en un caso de educación financiera infantil
- migracion | valor: +68 % | desde: 82000 | hasta: 138000 | leyenda: tráfico mensual tras migrar un e-commerce a Next.js | nota: es tráfico MENSUAL, no clics anuales: la leyenda debe decirlo
- clientes18 | valor: +18 | leyenda: clientes internacionales | nota: sin respaldo medido, por confirmar
- ninguna | sin cifra: si | nota: el hero no muestra estadística

## D-22d Tagline bajo el hero

Vigente (rechazado por Juan): Abro tu código, encuentro lo que Google no logra leer y lo arreglo yo mismo. Después vuelvo a Search Console para ver si el cambio funcionó.
Recomendada: 1
Elegida: 2
Estado: aprobado

- 1 | ES: Un consultor SEO que sabe programar: encuentro el problema, lo corrijo en el código y te muestro el resultado. | EN: An SEO consultant who knows how to code: I find the problem, fix it in the code and show you the result.
- 2 | ES: Diagnóstico, corrección y medición en una sola persona, sin intermediarios entre el hallazgo y el código. | EN: Diagnosis, fix and measurement in one person, with no go-between from finding to code.
- 3 | ES: Menos reuniones entre el informe y el cambio: el que audita tu sitio es quien lo arregla. | EN: Fewer meetings between the report and the change: the person who audits your site is the one who fixes it.

## D-22e Título de la medición

Vigente (rechazado por Juan): Medición antes de tocar el código
Recomendada: 1
Elegida: 3
Estado: aprobado
Nota: se conservan las descripciones de LCP, CLS, TBT y TTFB y se quitan las notas "Bueno: hasta".

- 1 | ES: Cuatro números que reviso primero | EN: Four numbers I check first
- 2 | ES: Así mido el rendimiento de un sitio | EN: How I measure a site's performance
- 3 | ES: Cómo ve Google la velocidad de tu sitio | EN: How Google sees your site's speed

## D-22f Texto de la medición

Vigente (rechazado por Juan): Cuatro lecturas me dicen dónde duele un sitio. La barra de cada una marca el rango que Google considera bueno, mejorable y pobre.
Recomendada: 1
Elegida: 2
Estado: aprobado

- 1 | ES: Estas cuatro métricas me dicen si un sitio carga rápido, se mantiene estable y responde bien desde el servidor. Estas son las de este sitio. | EN: These four metrics tell me whether a site loads fast, stays stable and responds well from the server. These are this site's.
- 2 | ES: Las reviso en cada auditoría porque marcan cómo viven tu sitio Google y tus visitantes. | EN: I check them in every audit because they show how Google and your visitors experience your site.

## D-22g Lead de servicios

Vigente (rechazado por Juan): Trabajo yo mismo en cada proyecto. Empiezo por lo que ve Googlebot y de ahí decido qué tocar.
Recomendada: 1
Elegida: 3
Estado: aprobado
Quitar la frase sobre Googlebot del lead y del item SEO tecnico: si
Nota: Juan rechazó las opciones 1 y 2 y aprobó la opción 3, propuesta después.

- 1 | ES: Cada proyecto lo hago yo mismo, del diagnóstico al cambio en el código. | EN: I handle every project myself, from diagnosis to the change in the code.
- 2 | ES: Diagnostico, corrijo en el código y mido el efecto. Elijo el servicio según lo que frena tu tráfico. | EN: I diagnose, fix in the code and measure the effect. I pick the service based on what holds your traffic back.
- 3 | ES: Desde la auditoría hasta el código en producción, con resultados que puedes medir. | EN: From the audit to the code in production, with results you can measure.

## D-22g-item Texto del ítem SEO técnico

Vigente (rechazado por Juan): Audito rastreo, indexación y datos estructurados. Empiezo por lo que ve Googlebot y de ahí decido qué tocar.
Recomendada: 1
Elegida: 1
Estado: aprobado
Nota: Juan mantiene el ítem y aprobó este texto nuevo.

- 1 | ES: Audito rastreo, indexación y datos estructurados, y corrijo lo que impide que Google entienda y posicione tus páginas. | EN: I audit crawling, indexing and structured data, and fix what keeps Google from understanding and ranking your pages.
