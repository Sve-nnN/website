---
title: Contenido citable por IA cómo escribir para que te citen
metaTitle: Contenido citable por IA cómo escribir para que te citen
metaDescription: Cómo escribo secciones que ChatGPT, Perplexity y Google pueden extraer y citar: respuesta primero, pasajes que se entienden solos, datos con fuente y un ejemplo de antes y después.
excerpt: Un motor de IA no cita páginas, cita fragmentos. Te muestro cómo reescribo una sección para que se entienda sola, responda en las primeras frases y tenga datos que un modelo pueda verificar, con un ejemplo de antes y después.
---
Un contenido es citable por IA cuando un motor generativo puede tomar un fragmento de tu página, entenderlo sin el resto del artículo y usarlo como fuente en su respuesta. Esa es la definición con la que trabajo, y de ella sale casi todo lo que te voy a contar. Es la parte de contenido del [GEO SEO](/blog/tech-seo/geo-seo-guia), la que queda cuando ya resolviste que los bots puedan entrar y leer tu HTML.

## Por qué la IA cita fragmentos y no páginas

ChatGPT con búsqueda, Perplexity y los AI Overviews de Google siguen un proceso parecido. Reescriben la pregunta en varias búsquedas, recuperan páginas, las parten en fragmentos y eligen los que mejor responden a cada parte de la pregunta. Después el modelo redacta la respuesta y enlaza algunas fuentes.

Eso tiene una consecuencia directa para quien escribe: tu artículo compite párrafo a párrafo. Una página excelente en conjunto puede no aparecer nunca si ninguno de sus fragmentos responde algo de forma clara. Y al revés, un sitio chico con un párrafo preciso le puede ganar la cita a un medio grande con un texto confuso. Me parece la mejor noticia del tema para sitios especializados.

## Qué hace citable a un pasaje

Después de reescribir bastante contenido con este objetivo, lo resumo en cinco rasgos. No son una fórmula secreta, son buena escritura técnica aplicada con disciplina.

### La respuesta va primero

La primera o las dos primeras frases de cada sección contestan la pregunta que plantea el encabezado. El contexto, los matices y los ejemplos vienen después. Si el encabezado es "Qué es la canibalización SEO", la primera frase define la canibalización SEO. No arranca con "En el mundo del SEO hay muchos problemas", que es la clase de introducción que un modelo descarta.

### El pasaje se entiende solo

Cada párrafo tiene que funcionar si lo copias fuera de la página. Para eso repito el sujeto en lugar de usar pronombres que apuntan atrás, evito frases como "como vimos antes" o "esta técnica" sin decir cuál, y nombro las herramientas, las versiones y las cifras de forma explícita. Para un lector humano queda un poco más redundante. Lo acepto.

### Hay datos que se pueden verificar

El paper académico que dio origen al término GEO, publicado en 2023 por investigadores de Princeton, Georgia Tech, el Allen Institute for AI y el IIT Delhi, encontró que agregar citas de fuentes, estadísticas y frases textuales de expertos aumentaba la visibilidad de una página en las respuestas generadas. Meter más keywords casi no ayudaba. Coincide con lo que veo: un dato con fuente y fecha se cita más que una opinión vaga.

La trampa está en inventar. Un modelo puede contrastar una cifra con otras fuentes, y un dato falso te quita credibilidad justo con el sistema que querías convencer. Uso datos propios cuando los tengo y cito la fuente original cuando no.

### La estructura marca dónde empieza y termina cada idea

Encabezados descriptivos, listas para enumeraciones, pasos numerados para procesos y tablas para comparaciones. El sistema que corta tu página en fragmentos usa esa estructura, y un bloque de texto de 400 palabras sin cortes le complica saber qué parte responde qué.

### Hay alguien detrás que sabe del tema

Un pasaje gana peso si viene de una página con autor identificable, fecha de actualización visible y experiencia demostrable en el tema. Firmo lo que escribo con mi nombre y cuento casos de mi propio trabajo, porque eso es justamente lo que un modelo no puede sacar de otro lado.

## Un ejemplo de antes y después

Tomo una sección típica de un artículo de SEO técnico. Así la encuentro muchas veces:

> En la actualidad, la velocidad es un factor cada vez más relevante. Por eso es importante tenerla en cuenta. Esta métrica, en particular, puede marcar una gran diferencia en la experiencia de los usuarios, como mencionamos anteriormente, y también en el posicionamiento.

Fuera de contexto ese párrafo no dice nada: no sabes qué métrica, qué diferencia ni para quién. Así la reescribo:

> El LCP (Largest Contentful Paint) mide cuánto tarda en pintarse el elemento más grande visible de la página, normalmente la imagen principal o el titular. Google considera bueno un LCP de 2,5 segundos o menos en el percentil 75 de las visitas. Si tu LCP supera ese umbral, lo primero que reviso es el tiempo de respuesta del servidor y si la imagen principal se carga con prioridad.

La versión nueva define el término, da el umbral con su criterio de medición y termina con una acción concreta. Cualquiera de sus tres frases podría aparecer citada en una respuesta y seguiría siendo correcta.

## Cómo reviso una página existente

Cuando audito la citabilidad de un sitio no reescribo todo. Sigo este proceso:

1. Elijo las páginas que ya reciben tráfico o que responden a preguntas reales del negocio. Las saco de Search Console y de las consultas que la gente le hace al equipo comercial.
2. Escribo la pregunta concreta que responde cada sección. Si no puedo formularla, la sección probablemente sobra o está mezclando temas.
3. Leo solo el primer párrafo de cada sección y me pregunto si responde esa pregunta sin leer nada más.
4. Busco pronombres huérfanos, referencias a otras partes de la página y afirmaciones sin dato.
5. Reescribo, publico y anoto la fecha para poder medir después.

Ese último paso importa. Sin una fecha de cambio no vas a poder relacionar una mejora en las citas con lo que hiciste. Cómo armo ese seguimiento lo explico en mi guía para [medir citas en IA](/blog/tech-seo/medir-citas-ia).

## Lo técnico que también afecta la citabilidad

Un texto perfecto no sirve si el bot no lo ve. Hay tres cosas técnicas que reviso siempre junto con el contenido:

- Que el texto esté en el HTML que devuelve el servidor. Varios rastreadores de IA, entre ellos los de OpenAI y Anthropic, no ejecutan JavaScript, así que el contenido que se pinta en el navegador no existe para ellos. Lo explico en detalle en [SSR vs CSR para SEO](/blog/tech-seo/ssr-vs-csr-seo).
- Que los bots de búsqueda de IA no estén bloqueados en robots.txt ni en el firewall.
- Que la página tenga [datos estructurados](/blog/tech-seo/structured-data-seo) coherentes con lo que muestra: autor, fechas y tipo de contenido.

El [llms.txt](/blog/tech-seo/llms-txt-guia) aparece seguido en estas conversaciones. Es un índice opcional de tu sitio para modelos de lenguaje, útil sobre todo en documentación técnica, pero no reemplaza nada de lo anterior.

## Errores que hacen que no te citen

- Introducciones largas que tardan tres párrafos en decir de qué trata el artículo.
- Encabezados creativos que no dicen qué hay debajo, como "El secreto mejor guardado".
- Párrafos que mezclan dos o tres ideas distintas.
- Afirmaciones absolutas sin dato ni fuente.
- Contenido generado en masa que repite lo que el modelo ya sabe. Lo que no tiene es tu experiencia, tus datos y tus ejemplos, y eso es lo que vale la pena publicar.

:::faq Preguntas frecuentes sobre contenido citable por IA
?? ¿Escribir para la IA empeora el texto para las personas?
En mi experiencia no. Responder primero, nombrar las cosas con precisión y dar datos concretos también mejora la lectura humana. La única concesión es algo más de repetición del sujeto entre párrafos.
?? ¿Tengo que reescribir todo mi blog?
No. Empieza por las páginas que ya tienen tráfico o que responden a preguntas importantes para tu negocio, mide el efecto y decide después si vale la pena seguir.
?? ¿Sirve marcar las preguntas con FAQPage?
Solo si la página muestra esas preguntas y respuestas de forma visible. El marcado ayuda a entender la estructura, pero no reemplaza un texto que responda bien.
:::

Si quieres que revise qué tan citable es tu contenido y te deje las páginas priorizadas, en mi servicio de [SEO para IA](/servicios/ai-seo-geo) hago esa auditoría junto con el acceso técnico de los bots.
