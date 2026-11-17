---
title: Cómo medir si la IA cita tu sitio
metaTitle: Cómo medir citas en IA con GA4 y prompts fijos
metaDescription: Cómo mido si ChatGPT, Perplexity y Google citan un sitio: tráfico de asistentes de IA en GA4, una lista fija de preguntas, logs de bots y qué no se puede medir todavía.
excerpt: No existe un ranking de ChatGPT, pero sí puedes medir si la IA te cita. Te explico el sistema que armo, con un canal de IA en GA4, una lista fija de preguntas, los logs del servidor y las limitaciones que conviene conocer.
---
Medir si la IA cita tu sitio significa responder tres preguntas: cuánta gente llega desde asistentes como ChatGPT o Perplexity, en qué respuestas apareces cuando alguien pregunta por tu tema y si los bots de esos asistentes pueden leer tus páginas. Ninguna herramienta te da las tres cosas en un solo número, así que armo un sistema con piezas simples. Es la parte de medición del [GEO SEO](/blog/tech-seo/geo-seo-guia), y sin ella no hay forma de saber si un cambio funcionó.

Te adelanto la limitación principal: no existe un ranking de ChatGPT como las posiciones de Google. Las respuestas cambian según la persona, la conversación previa, el momento y el modelo. Lo que mides son tendencias y muestras, no posiciones exactas.

## Tráfico desde asistentes de IA en GA4

Es la medición más concreta porque son visitas reales. Cuando alguien hace clic en un enlace dentro de una respuesta de ChatGPT, Perplexity, Copilot, Gemini o Claude, la visita llega a tu sitio con el dominio del asistente como origen, siempre que el navegador envíe esa información.

En GA4 creo un grupo de canales personalizado con un canal de IA que capture esos orígenes. La condición que uso es que la fuente de la sesión coincida con una expresión regular como esta:

```
.*(chatgpt\.com|chat\.openai\.com|perplexity\.ai|copilot\.microsoft\.com|gemini\.google\.com|claude\.ai|deepseek\.com|meta\.ai).*
```

Ese canal tiene que ir arriba de "Referral" en el orden del grupo, porque GA4 asigna cada sesión al primer canal cuya condición cumple. Si lo dejas abajo, esas visitas se quedan clasificadas como referidos comunes.

Un detalle que ayuda: ChatGPT agrega utm_source=chatgpt.com a muchos de los enlaces que muestra en sus respuestas, así que esas visitas se identifican aunque falte el referente.

Lo que esta medición no ve:

- Las personas que leen la respuesta y no hacen clic, que son la mayoría.
- Las visitas que llegan sin referente, por ejemplo desde algunas apps de escritorio o móviles, que GA4 clasifica como tráfico directo.
- Los clics desde los AI Overviews y el AI Mode de Google, que cuentan como tráfico orgánico normal de Google.

Por eso no me quedo solo con este número. Me sirve para ver la tendencia y qué páginas reciben ese tráfico, que suele ser bastante distinto de las que más tráfico orgánico tienen.

## Lo que Search Console muestra y lo que no

Google incluye las impresiones y los clics de los AI Overviews y del AI Mode dentro del informe de rendimiento web de Search Console, mezclados con el resto. No hay un filtro para separarlos.

Lo que sí hago es mirar dos señales indirectas en [Search Console](/blog/tech-seo/guia-google-search-console):

- Páginas con impresiones que suben y clics que bajan para consultas informativas. Muchas veces ese patrón coincide con la aparición de un AI Overview en esa búsqueda.
- La evolución de las búsquedas de marca. Si la gente lee tu nombre en una respuesta de IA y después te busca, lo ves aquí aunque el primer contacto no haya dejado rastro.

Ninguna de las dos prueba una cita por sí sola. Las uso como contexto para interpretar lo demás.

## Una lista fija de preguntas

Para saber si apareces en las respuestas tienes que preguntar. Armo una lista de 20 a 50 preguntas reales sobre el negocio, del tipo que haría un cliente, y la reviso con la misma frecuencia en los mismos motores.

Las reglas que sigo para que la comparación tenga sentido:

1. Las preguntas no cambian entre una revisión y otra. Si cambias las preguntas, ya no sabes si mejoró tu visibilidad o si cambió la medición.
2. Mezclo preguntas genéricas del sector, preguntas comparativas ("qué opciones hay para...") y preguntas donde tu marca debería aparecer sí o sí.
3. Pregunto en sesiones nuevas, sin historial ni personalización, y anoto el motor y la fecha.
4. Por cada respuesta registro tres cosas: si mencionan la marca, si enlazan alguna página del sitio y qué competidores aparecen.

Con eso calculas dos porcentajes simples: en qué parte de las preguntas te mencionan y en qué parte te citan con enlace. No son lo mismo. Un asistente puede nombrar tu marca sin enlazarte, o enlazar una página tuya sin nombrarte en el texto.

Puedes hacerlo a mano en una hoja de cálculo para empezar. Si la lista crece, hay herramientas de seguimiento de prompts que lo automatizan, y algunas suites de SEO ya incluyen informes de visibilidad en IA. Antes de pagar una, te recomiendo hacerlo a mano durante un mes: entiendes mucho mejor qué estás midiendo y qué variación es ruido.

## Los logs del servidor

Los logs te dicen si los bots de IA llegan a tus páginas y qué respuesta reciben. Es la medición más técnica y la que menos gente revisa.

Busco por user agent los bots que me interesan: OAI-SearchBot y ChatGPT-User de OpenAI, PerplexityBot y Perplexity-User, Claude-SearchBot y Claude-User de Anthropic, además de GPTBot y ClaudeBot si quiero ver el rastreo para entrenamiento. Con eso respondo preguntas concretas:

- ¿Los bots de búsqueda de IA visitan las páginas que me importan?
- ¿Reciben un 200 o se topan con 403 por una regla del firewall?
- ¿Después de un cambio de contenido, cuánto tardan en volver a pasar?

Las visitas de ChatGPT-User y Perplexity-User son especialmente interesantes porque se disparan cuando un usuario pide información en ese momento. Un aumento en esas peticiones indica que tus páginas entran en respuestas, aunque nadie haga clic después.

Si tu sitio pasa por Cloudflare u otro CDN, revisa también sus reglas de bots. Es común encontrar un bloqueo general de bots de IA activado por defecto que nadie decidió de forma consciente.

## Cómo junto todo en un informe mensual

Una vez al mes reviso las cuatro fuentes y las cruzo:

1. Sesiones del canal de IA en GA4, por página de destino y por asistente.
2. Porcentaje de menciones y de citas en la lista fija de preguntas, comparado con el mes anterior.
3. Peticiones de bots de IA en los logs, con los códigos de respuesta.
4. Búsquedas de marca en Search Console.

Al lado anoto qué cambié ese mes: páginas reescritas, ajustes en robots.txt, nuevos contenidos. Sin esa columna los números no explican nada. Con ella puedo decir, por ejemplo, que una página reescrita empezó a aparecer citada en Perplexity tres semanas después, y decidir si vale la pena repetir lo mismo en otras.

También cruzo la conversión. El tráfico de IA suele ser menor en volumen, pero llega con una pregunta ya trabajada, así que vale la pena comparar su tasa de conversión con la del orgánico antes de decidir cuánto esfuerzo le dedicas.

## Lo que todavía no se puede medir bien

- Cuántas veces apareces en respuestas sin clic. Ningún asistente publica impresiones de forma general.
- La posición dentro de la respuesta, que cambia de una consulta a otra.
- El efecto de cosas como el [llms.txt](/blog/tech-seo/llms-txt-guia), porque no hay datos públicos de qué motores lo usan para citar.

Prefiero decirlo así a venderte un "índice de visibilidad en IA" como si fuera una métrica exacta. Las herramientas que lo calculan hacen muestreos, y está bien usarlas, siempre que sepas que son una aproximación.

:::faq Preguntas frecuentes sobre medir citas en IA
?? ¿GA4 detecta el tráfico de ChatGPT automáticamente?
No lo separa bien por defecto. Lo más fiable es crear un canal personalizado con una expresión regular que capture los dominios de los asistentes y ubicarlo antes de Referral en el grupo de canales.
?? ¿Puedo ver en Search Console los clics de los AI Overviews?
No por separado. Google los incluye en el rendimiento web normal, mezclados con los resultados clásicos.
?? ¿Cada cuánto conviene revisar la lista de preguntas?
Una vez al mes me alcanza para ver tendencias sin perseguir el ruido diario. Si acabas de hacer un cambio grande, puedes revisar las preguntas afectadas a las dos o tres semanas.
:::

Si quieres que arme este sistema de medición en tu sitio y lo use para priorizar qué cambiar, es parte de mi servicio de [SEO para IA](/servicios/ai-seo-geo).

Lee también mi guía de [llms.txt](/blog/tech-seo/llms-txt-guia), con lo que hace ese archivo y lo que no.
