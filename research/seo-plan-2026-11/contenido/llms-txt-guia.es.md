---
title: Qué es llms.txt y cuándo vale la pena crearlo
metaTitle: llms.txt qué es y cómo crearlo con un ejemplo real
metaDescription: Qué es el archivo llms.txt, qué formato tiene, quién lo lee de verdad y cuándo vale la pena crearlo. Con el ejemplo del llms.txt que mantengo en mi sitio.
excerpt: El llms.txt es un archivo en Markdown que le resume tu sitio a un modelo de lenguaje. Te explico el formato, quién lo usa de verdad, por qué Google lo ignora y cómo armé el de mi propio sitio.
---
El llms.txt es un archivo de texto en formato Markdown que pones en la raíz de tu dominio, en tusitio.com/llms.txt, para darle a un modelo de lenguaje un resumen de tu sitio y una lista curada de las páginas que importan. Es una propuesta abierta, no un estándar, y forma parte de las tareas de [GEO SEO](/blog/tech-seo/geo-seo-guia) que más ruido generan para el efecto real que tienen.

Lo mantengo en mi propio sitio y forma parte de mi servicio de SEO para IA, así que te cuento qué es, cómo se escribe y, sobre todo, qué puedes esperar de él y qué no.

## De dónde sale el llms.txt

La propuesta la publicó Jeremy Howard, cofundador de Answer.AI y de fast.ai, en septiembre de 2024. El problema que quería resolver es concreto: un modelo que intenta leer un sitio web se encuentra con menús, scripts, banners de cookies y HTML pesado, y además tiene una ventana de contexto limitada. Un archivo plano con lo esencial le ahorra ese trabajo.

La idea nació pensando en documentación técnica. Si le pides a un asistente de programación que use una librería, le sirve mucho más un índice limpio de la documentación que rastrear cien páginas con navegación repetida. Por eso las plataformas de documentación fueron las primeras en adoptarlo, y algunas lo generan solas.

## El formato del archivo

La propuesta define una estructura sencilla, en este orden:

1. Un título H1 con el nombre del proyecto o del sitio. Es el único elemento obligatorio.
2. Un bloque de cita con un resumen corto de qué es el sitio.
3. Párrafos o listas opcionales con contexto adicional.
4. Secciones con encabezados H2, cada una con una lista de enlaces en formato Markdown y una nota breve después de cada enlace.
5. Una sección opcional llamada "Optional" con enlaces que un modelo puede saltarse si le falta espacio.

Un ejemplo mínimo se ve así:

```
# Nombre del sitio

> Una o dos frases que dicen qué es el sitio y para quién.

## Guías

- [Guía de SEO técnico](https://tusitio.com/guia-seo-tecnico): fundamentos para desarrolladores.
- [Checklist de auditoría](https://tusitio.com/checklist): lista de revisión por plantillas.

## Optional

- [Archivo del blog](https://tusitio.com/blog): todos los artículos.
```

Además del llms.txt existe una convención paralela, el llms-full.txt, que en lugar de enlaces contiene el texto completo de las páginas en un solo archivo. Tiene sentido en documentación, donde un agente quiere leerlo todo de una vez. En un sitio de contenido general suele quedar demasiado largo.

## El llms.txt de este sitio

En juan-tech.com sirvo un /llms.txt y un /llms-full.txt. Te cuento las decisiones que tomé porque creo que sirven de referencia:

- Lo escribí a mano y no lo genero desde la base de datos. Son unas quince URLs estables: páginas principales, servicios y secciones. Un volcado de todo el sitemap ya existe en /sitemap.xml, y repetirlo no le aporta nada a nadie.
- El resumen dice en dos frases quién soy y qué hago, y aclara que el sitio es bilingüe, con el español sin prefijo y el inglés bajo /en.
- Cada enlace lleva una nota de una línea que explica qué hay en esa página, escrita para que un modelo entienda cuándo le conviene abrirla.

Hubo un detalle que me enseñó algo. Durante un tiempo la ruta servía un texto de prueba que había dejado al conectar la funcionalidad, con nombres internos del proyecto. Era público e indexable. Lo corregí por higiene, no porque esperara que moviera alguna posición, y esa es la actitud con la que te recomiendo encarar este archivo.

## Quién lee de verdad el llms.txt

Esta es la parte que más se exagera, así que voy por partes.

Google no lo usa en su buscador. Gente del equipo de búsqueda de Google lo dijo en público más de una vez, y su documentación sobre las funciones de IA en la búsqueda no pide ningún archivo especial para aparecer en los AI Overviews o en el AI Mode. Si alguien te vende un llms.txt para subir en Google, desconfía.

OpenAI, Anthropic y Perplexity no publicaron que sus motores de búsqueda usen el llms.txt para decidir qué citar. Puede que lo lean en algún caso, pero no conozco datos sólidos que lo muestren, y no voy a afirmar algo que no puedo comprobar.

Donde sí tiene uso real es en herramientas que alguien apunta a un sitio de forma explícita: asistentes de programación, agentes que navegan por encargo de un usuario y servidores que exponen documentación a un editor de código. En ese contexto el archivo ahorra tokens y mejora la respuesta, y por eso es casi un estándar de hecho en documentación de APIs.

Si quieres comprobarlo en tu caso, revisa los logs del servidor y busca peticiones a /llms.txt. En la mayoría de los sitios de contenido que reviso, las visitas a ese archivo son pocas y vienen sobre todo de herramientas y curiosos, no de los rastreadores de búsqueda.

## Cuándo vale la pena crearlo

Mi criterio es este:

- Vale la pena si tienes documentación técnica, una API o un producto para desarrolladores. Ahí los agentes de programación lo usan y el beneficio es directo.
- Vale la pena si te cuesta poco mantenerlo, por ejemplo si tu sitio tiene pocas páginas clave que casi no cambian. Media hora de trabajo y una revisión cada tanto.
- No vale la pena si lo haces en lugar de resolver lo que sí bloquea tu visibilidad en IA: bots bloqueados en robots.txt, contenido que solo aparece con JavaScript o páginas que nadie puede citar porque no responden nada concreto.
- Tampoco vale la pena generar uno automático con miles de URLs. Pierde justamente lo que lo hace útil, que es la curaduría.

Lo que más mueve la aguja para que te citen sigue siendo el texto. En mi guía sobre [contenido citable por IA](/blog/tech-seo/citabilidad-contenido-ia) explico cómo reescribo una sección para que un modelo la pueda extraer y citar sin perder el sentido.

## Cómo crear tu llms.txt paso a paso

1. Haz una lista de las páginas que mejor explican tu negocio o tu proyecto. Con diez a veinte alcanza para la mayoría de los sitios.
2. Escribe el resumen en dos o tres frases, con datos concretos: qué haces, para quién y en qué idiomas está el sitio.
3. Agrupa los enlaces por secciones con H2 y escribe una nota de una línea para cada uno.
4. Guarda el archivo como texto plano UTF-8 y publícalo en la raíz del dominio. En Next.js lo sirvo desde un route handler que devuelve el contenido con Content-Type text/plain, y el texto vive en el CMS para poder editarlo sin desplegar.
5. Abre tusitio.com/llms.txt en el navegador y comprueba que responde con código 200 y que no hay redirecciones raras.
6. Agenda una revisión cada pocos meses, o cuando cambien tus páginas principales. Un llms.txt con enlaces rotos es peor que no tenerlo.

No hace falta enlazarlo desde el sitemap ni declararlo en robots.txt. Quien lo busque lo va a pedir en la ruta convencional.

## Lo que el llms.txt no hace

- No bloquea ni permite rastreadores. Eso sigue siendo trabajo del robots.txt y de tu firewall.
- No reemplaza el sitemap, que es lo que usan los buscadores para descubrir URLs.
- No mejora tu posición en Google.
- No garantiza que ChatGPT o Perplexity te citen.

Tampoco te sirve para saber si te citan. Para eso necesitas medir el tráfico que llega desde asistentes de IA y seguir un conjunto fijo de preguntas, algo que explico en mi guía para [medir citas en IA](/blog/tech-seo/medir-citas-ia).

:::faq Preguntas frecuentes sobre llms.txt
?? ¿El llms.txt es un estándar oficial?
No. Es una propuesta abierta publicada en llmstxt.org en septiembre de 2024. Ningún buscador ni empresa de IA lo adoptó como requisito.
?? ¿Google usa el llms.txt?
No en su buscador. Google no pide ningún archivo especial para aparecer en los AI Overviews ni en el AI Mode, y miembros de su equipo de búsqueda dijeron en público que no lo usan.
?? ¿Qué diferencia hay entre llms.txt y llms-full.txt?
El llms.txt es un índice con enlaces y notas cortas. El llms-full.txt reúne el texto completo de las páginas en un solo archivo, útil sobre todo para documentación técnica.
?? ¿Puede perjudicar mi SEO tener un llms.txt?
No, siempre que no exponga información interna ni contenido que no quieras publicar. Es un archivo público más y cualquiera lo puede leer.
:::

Si quieres que revise cómo leen tu sitio los motores de IA, con el llms.txt incluido pero sin quedarme en él, en mi servicio de [SEO para IA](/servicios/ai-seo-geo) empiezo por el acceso de los bots y la estructura del contenido, que es donde suelen estar los bloqueos de verdad.

Lee también mi guía para [medir citas en IA](/blog/tech-seo/medir-citas-ia), con el método que uso para saber si un cambio funcionó.
