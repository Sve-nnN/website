---
title: GEO SEO guía completa para aparecer en respuestas de IA
metaTitle: GEO SEO guía para que ChatGPT y Google te citen
metaDescription: Qué es el GEO SEO, en qué se parece y en qué no al SEO de siempre, cómo leen tu sitio los rastreadores de IA y qué cambio primero para que te citen.
excerpt: El GEO SEO busca que ChatGPT, Perplexity y los AI Overviews de Google citen tu contenido en sus respuestas. Te explico cómo funciona, qué parte es SEO técnico de toda la vida y qué parte es nueva, con el orden en que yo lo trabajo.
---
Cada vez más preguntas terminan en una respuesta escrita por una IA, y en esa respuesta aparecen dos o tres enlaces como mucho. Si tu página no está entre ellos, para esa persona no existes, aunque estés en la primera página de Google. El GEO SEO trata justamente de eso, de que los motores generativos lean tu contenido, lo entiendan y lo citen.

Llevo años haciendo [SEO técnico](/blog/tech-seo/technical-seo-guide) y programando los sitios que optimizo, así que esta guía la escribo desde ese ángulo. Te voy a contar qué es el GEO, qué parte del trabajo ya la conoces si haces SEO bien, qué parte cambia de verdad y en qué orden lo ataco cuando reviso un sitio. También te voy a decir dónde creo que hay humo, porque en este tema hay bastante.

## Qué es el GEO SEO

GEO viene de Generative Engine Optimization, optimización para motores generativos. Un motor generativo es cualquier sistema que responde a una pregunta con texto redactado por un modelo de lenguaje y que, para escribir esa respuesta, busca y lee páginas web. Hoy los más visibles son ChatGPT con búsqueda, Perplexity, Copilot de Microsoft, Gemini y los AI Overviews y el AI Mode de Google.

El término nació en la academia. En 2023 un grupo de investigadores de Princeton, Georgia Tech, el Allen Institute for AI y el IIT Delhi publicó un paper llamado "GEO: Generative Engine Optimization". Armaron un banco de pruebas con miles de consultas y midieron qué cambios en el texto de una página hacían que un motor generativo la mostrara más en sus respuestas. Algunos métodos subieron la visibilidad hasta un 40% en sus pruebas. Los que mejor funcionaron fueron agregar citas de fuentes, incluir datos concretos y sumar frases textuales de expertos. Meter más palabras clave casi no movió nada.

Ese dato de 40% circula por todos lados sin contexto, así que te doy el mío: es un resultado de laboratorio, con motores simulados y un conjunto de consultas propio. Me sirve como dirección, no como promesa. Lo que sí me parece valioso del paper es el patrón, porque coincide con lo que veo en la práctica: los modelos citan lo que pueden verificar y extraer, no lo que repite la keyword.

En el mercado vas a ver otros nombres para lo mismo o para cosas muy cercanas, como AEO (optimización para motores de respuesta), LLMO o "SEO para IA". No vale la pena pelear por la etiqueta. En mi [servicio de SEO para IA](/servicios/ai-seo-geo) uso GEO porque es el término que más gente busca en español y porque describe bien el objetivo, que es ser la fuente que el modelo cita.

## Cómo decide una IA qué páginas citar

Para optimizar algo tienes que entender cómo funciona por dentro, aunque sea a grandes rasgos. Los motores generativos que citan fuentes siguen un proceso parecido, que en la literatura técnica aparece como RAG (retrieval augmented generation, generación aumentada por recuperación).

1. La persona escribe una pregunta, muchas veces larga y conversacional.
2. El sistema la reescribe en una o varias búsquedas. Google llama a esto "query fan-out" en AI Mode: una pregunta se abre en varias subconsultas que corren en paralelo.
3. Con esas búsquedas recupera páginas de un índice. Puede ser el índice de Google, el de Bing o uno propio, como el que arma OpenAI con su rastreador de búsqueda.
4. Parte esas páginas en fragmentos y elige los que mejor responden a cada subconsulta.
5. El modelo redacta la respuesta usando esos fragmentos y enlaza algunos como fuente.

De ese proceso salen tres consecuencias prácticas. La primera es que si tu página no entra en el índice que usa ese motor, no hay GEO posible, por eso el SEO técnico de base sigue mandando. La segunda es que el modelo no lee tu página entera como un humano, lee fragmentos sueltos, así que cada pasaje tiene que entenderse solo. La tercera es que compites por subconsultas, no por una keyword: una sola pregunta del usuario te puede traer por un ángulo que nunca pensaste.

## GEO y SEO en qué se parecen y en qué no

La pregunta que más me hacen es si el GEO reemplaza al SEO. No. Lo complementa, y la mayor parte del trabajo se solapa. Te lo resumo así:

- Lo que no cambia: el rastreo, la indexación, la velocidad, los enlaces internos, la autoridad del dominio y el contenido útil. Si fallas en eso, fallas en las dos cosas.
- Lo que cambia de peso: la estructura del texto a nivel de párrafo, los datos verificables, la claridad sobre quién escribe y la frescura del contenido.
- Lo nuevo de verdad: otros rastreadores que leer y permitir, otras métricas (menciones y citas en lugar de posiciones) y una competencia que se decide por fragmento, no por URL.

Hay un punto que me gusta remarcar porque cambia cómo priorizo. En el SEO clásico una página puede rankear bien con un texto mediocre si tiene autoridad y enlaces. En una respuesta generada, el modelo elige el pasaje que mejor contesta, y un párrafo claro de un sitio chico le puede ganar a un párrafo confuso de un medio grande. Eso abre una puerta real para sitios especializados, y es la razón por la que le dedico tiempo a este tema.

## La base técnica que la IA necesita para leerte

Aquí es donde un perfil técnico tiene ventaja, porque buena parte de los problemas de GEO que encuentro no son de contenido. Son de acceso.

### Rastreadores de IA y robots.txt

Cada empresa usa sus propios bots y conviene conocerlos por nombre, porque cumplen funciones distintas:

- OpenAI usa GPTBot para recolectar datos de entrenamiento, OAI-SearchBot para el índice de búsqueda de ChatGPT y ChatGPT-User cuando un usuario le pide que abra una página.
- Anthropic usa ClaudeBot para entrenamiento, Claude-SearchBot para búsqueda y Claude-User para pedidos de usuarios.
- Perplexity usa PerplexityBot para su índice y Perplexity-User para las visitas que dispara un usuario.
- Google no tiene un bot aparte para los AI Overviews. Esas respuestas salen del índice de Googlebot. El token Google-Extended en robots.txt controla si Google usa tu contenido para entrenar y alimentar Gemini, pero no afecta tu aparición en la búsqueda ni en los AI Overviews.

La decisión importante es separar entrenamiento de búsqueda. Puedes bloquear GPTBot si no quieres que tu contenido entrene modelos y aun así permitir OAI-SearchBot para aparecer citado en ChatGPT. Lo que veo seguido es lo contrario: un plugin de seguridad o una regla de Cloudflare que bloquea todo lo que suene a IA, y el sitio desaparece de ChatGPT sin que nadie lo haya decidido. Antes de tocar contenido, reviso el [robots.txt](/blog/tech-seo/robots-txt-best-practices) y las reglas del firewall.

```
# Permito los bots que citan en búsqueda
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

# Bloqueo solo el entrenamiento, si así lo decides
User-agent: GPTBot
Disallow: /
```

### JavaScript y renderizado

Este punto me toca de cerca porque construyo sitios en Next.js. Googlebot renderiza JavaScript, con demora pero lo hace. La mayoría de los rastreadores de IA no. Un análisis que publicó Vercel a fines de 2024 sobre el tráfico de su red mostró que los bots de OpenAI y Anthropic descargan los archivos JavaScript pero no los ejecutan. Si tu contenido se pinta en el navegador, para esos bots tu página está vacía.

La solución es la misma que vengo recomendando para SEO desde hace años: que el HTML que devuelve el servidor ya traiga el texto. Renderizado en servidor o generación estática, según el caso. Si tienes dudas sobre cuál conviene, en mi guía de [SSR vs CSR para SEO](/blog/tech-seo/ssr-vs-csr-seo) explico cómo lo decido, y en la de [SEO para JavaScript](/blog/tech-seo/javascript-seo) cómo comprobar qué ve un bot. La prueba rápida que hago es pedir la página con curl y buscar en la respuesta una frase del cuerpo del artículo. Si no aparece, tienes un problema de GEO aunque Google te indexe bien.

### Velocidad e indexación

Los motores que hacen búsqueda en vivo tienen poco tiempo para traer las páginas. Un servidor que tarda varios segundos en responder o una página que devuelve un error intermitente pierde contra otra fuente que responde rápido. No tengo un umbral publicado por ninguna de estas empresas, así que no te voy a dar un número inventado, pero el criterio es el mismo de las [Core Web Vitals](/blog/tech-seo/core-web-vitals-guide): un TTFB bajo y un HTML liviano.

Y lo obvio que se olvida: si Google o Bing no indexan la página, los motores que dependen de esos índices tampoco la van a encontrar. ChatGPT, por ejemplo, combina su propio índice con resultados de proveedores de búsqueda. Revisar la cobertura en [Google Search Console](/blog/tech-seo/guia-google-search-console) y en Bing Webmaster Tools sigue siendo el primer paso.

### Datos estructurados

Los [datos estructurados](/blog/tech-seo/structured-data-seo) no son un atajo para que te citen, y desconfío de quien lo vende así. Lo que sí hacen es dejar explícito lo que el texto dice de forma implícita: quién es el autor, cuándo se publicó y actualizó, qué organización está detrás y de qué trata la página. Para un sistema que tiene que decidir si una fuente es confiable, esas señales ayudan a desambiguar. Uso Article con autor y fechas, Organization o Person según el sitio, y FAQPage solo cuando la página realmente tiene preguntas y respuestas visibles.

## El archivo llms.txt

El llms.txt es un archivo de texto en Markdown que vive en la raíz del sitio y le resume a un modelo de lenguaje qué hay en tu web y dónde está lo importante. Lo propuso Jeremy Howard en septiembre de 2024 y no es un estándar oficial de nadie.

En este mismo sitio tengo un llms.txt y un llms-full.txt escritos a mano, con unas quince URLs estables. Los mantengo porque cuestan poco y porque algunos agentes y herramientas de programación sí los leen. Pero no te voy a vender que mueven posiciones: gente de Google dijo en público que su buscador no lo usa, y no conozco datos sólidos de que ChatGPT o Perplexity lo tengan en cuenta para citar.

Si quieres el detalle completo, con el formato, un ejemplo real y cuándo vale la pena, lo explico en mi [guía de llms.txt](/blog/tech-seo/llms-txt-guia).

## Cómo escribir contenido que la IA pueda citar

Cuando el acceso técnico está resuelto, el trabajo pasa al texto. Mi regla de trabajo es simple: cada sección tiene que poder copiarse sola en una respuesta y seguir teniendo sentido.

### Respuesta primero

Pongo la respuesta en las dos primeras frases de cada sección y después desarrollo. Si alguien pregunta "qué es el GEO SEO", el primer párrafo bajo ese encabezado tiene que contestarlo con una definición completa, sin "como vimos antes" ni pronombres que apunten a otra parte de la página. Es lo mismo que hacía para los fragmentos destacados de Google, solo que ahora aplica a cada sección y no solo a la principal.

### Pasajes autocontenidos

Un fragmento que dice "esto mejora el rendimiento" no le sirve a nadie fuera de contexto. Uno que dice "el renderizado en servidor mejora el LCP porque el navegador recibe el HTML ya armado" sí. Repito el sujeto en lugar de usar pronombres, nombro las cosas por su nombre y evito los párrafos que dependen del anterior para entenderse. Suena un poco más redundante para un humano que lee de corrido, y lo acepto a cambio de que cada pasaje funcione solo.

### Datos con fuente y fecha

El paper original de GEO y lo que veo en las respuestas coinciden: los modelos prefieren afirmaciones verificables. Una cifra con su fuente y su fecha tiene más chances de aparecer citada que una opinión vaga. Eso no significa inventar estadísticas, que es lo peor que puedes hacer porque un modelo puede contrastarlas. Significa que si tienes datos propios, de tus proyectos, de tus pruebas o de tu sector, los publiques con claridad.

### Estructura que se pueda extraer

Encabezados que dicen lo que contienen, listas cuando el contenido es una lista, tablas cuando comparas cosas y pasos numerados cuando explicas un proceso. Nada de esto es nuevo, pero en GEO pesa más porque el sistema corta tu página en pedazos y la estructura le marca dónde empieza y dónde termina cada idea.

Todo esto lo desarrollo con ejemplos de antes y después en mi guía sobre [contenido citable por IA](/blog/tech-seo/citabilidad-contenido-ia).

## Autoridad y menciones fuera de tu sitio

Los modelos no solo leen tu web. También aprendieron de lo que otros dicen de ti, y cuando buscan en vivo encuentran foros, comparativas, directorios y artículos de terceros. Si preguntas a ChatGPT por "las mejores herramientas de X", la respuesta suele armarse con listas y reseñas publicadas en otros sitios.

Para GEO eso significa que las menciones de marca importan, aunque no tengan enlace. Aparecer en las comparativas de tu nicho, en hilos donde la gente pide recomendaciones y en medios del sector suma. Es [SEO off page](/blog/seo/seo-off-page-guia) con otro objetivo: no buscas solo el enlace, buscas que tu nombre aparezca asociado al tema correcto en muchos lugares distintos.

Y el autor importa. Un artículo firmado por alguien con trayectoria comprobable en el tema, con una página de autor que lo respalde, encaja con lo que Google describe como [E-E-A-T](/blog/seo/guia-eeat). Yo firmo todo lo que publico con mi nombre y enlazo mi perfil por esa razón.

## Cómo medir el GEO

Aquí está la parte más inmadura del tema, y prefiero decirlo de frente. No existe un "ranking de ChatGPT" equivalente a las posiciones de Google. Lo que sí puedes medir son tres cosas:

- El tráfico que llega desde asistentes de IA, que en GA4 aparece como referido desde dominios como chatgpt.com o perplexity.ai. ChatGPT además agrega el parámetro utm_source=chatgpt.com a muchos de los enlaces que muestra.
- Las menciones y citas en las respuestas para un conjunto fijo de preguntas, revisadas a mano o con herramientas de seguimiento de prompts.
- Señales indirectas, como el aumento de búsquedas de marca en Search Console.

Un detalle que confunde a mucha gente: los clics desde los AI Overviews y el AI Mode de Google cuentan dentro del tráfico web normal de Search Console. Google no los separa en un informe propio, así que no los vas a ver como una fuente aparte.

Cómo armo ese seguimiento paso a paso, con el filtro para GA4 y el método de prompts fijos, lo cuento en mi guía para [medir citas en IA](/blog/tech-seo/medir-citas-ia).

## Errores comunes que veo en GEO

- Bloquear a todos los bots de IA por defecto, sin separar entrenamiento de búsqueda.
- Publicar el contenido detrás de JavaScript que los rastreadores no ejecutan.
- Escribir para la keyword en lugar de responder la pregunta, con introducciones largas que tardan tres párrafos en decir algo.
- Comprar herramientas de "visibilidad en IA" antes de revisar que los bots pueden entrar al sitio.
- Generar contenido masivo con IA esperando que otra IA lo cite. Los modelos ya tienen esa información. Lo que les falta es experiencia propia, datos nuevos y criterio.
- Tratar el llms.txt como la solución completa, cuando es un archivo opcional que Google no usa.

## Por dónde empiezo cuando reviso un sitio

Este es el orden que sigo, de lo que más bloquea a lo que más afina:

1. Acceso: robots.txt, reglas del firewall o CDN y logs del servidor para ver qué bots de IA llegan y qué código de respuesta reciben.
2. Renderizado: compruebo que el texto principal está en el HTML del servidor y no depende de JavaScript.
3. Indexación: cobertura en Google y Bing de las páginas que importan.
4. Medición base: segmento de tráfico de IA en GA4 y una lista de 20 a 50 preguntas reales del negocio para seguir cada mes.
5. Contenido: reescribo primero las páginas que ya reciben tráfico o que responden a esas preguntas, con respuesta primero y pasajes autocontenidos.
6. Señales de autoría y datos estructurados.
7. Presencia fuera del sitio, que es lo más lento y lo que más depende del negocio.

Los tres primeros pasos casi siempre son trabajo técnico de una o dos semanas. Lo que viene después es continuo, igual que el SEO.

:::faq Preguntas frecuentes sobre GEO SEO
?? ¿El GEO SEO reemplaza al SEO tradicional?
No. El GEO se apoya en el SEO: si tu página no se rastrea ni se indexa, ningún motor generativo la va a citar. Lo que hace el GEO es sumar una capa de trabajo sobre la estructura del texto, el acceso de los bots de IA y la medición de citas.
?? ¿Cuánto tarda en notarse el GEO?
Los arreglos técnicos, como desbloquear un rastreador o servir el contenido en el HTML, pueden notarse en cuestión de semanas, cuando los bots vuelven a pasar. Los cambios de contenido y de autoridad llevan más tiempo y dependen de cada nicho, así que no prometo plazos fijos.
?? ¿Necesito un llms.txt para aparecer en ChatGPT?
No. ChatGPT y Perplexity citan páginas que no tienen llms.txt todo el tiempo. Es un archivo opcional y barato de mantener, pero no reemplaza el acceso de los bots ni un contenido bien estructurado.
?? ¿Puedo bloquear el entrenamiento de IA sin desaparecer de las respuestas?
Sí, en buena medida. OpenAI, Anthropic y Perplexity usan bots distintos para entrenamiento y para búsqueda, así que puedes bloquear unos y permitir otros en tu robots.txt. En Google, Google-Extended controla el uso para Gemini sin afectar tu presencia en la búsqueda ni en los AI Overviews.
:::

Si prefieres que lo revise yo en tu sitio, en mi servicio de [SEO para IA](/servicios/ai-seo-geo) empiezo por el acceso de los bots y la citabilidad de tus páginas actuales, y te dejo un plan priorizado para que ChatGPT, Perplexity y Google tengan motivos para citarte.
