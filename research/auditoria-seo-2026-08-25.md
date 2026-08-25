# Auditoría SEO de juan-tech.com

**Fecha:** 25 de agosto de 2026
**Alcance:** 169 URLs del sitemap, rastreadas y parseadas una por una
**Datos usados:** crawl propio, PageSpeed Insights API (12 corridas), Search Console (`sc-domain:juan-tech.com`, propiedad de dominio, 28 días contra los 28 anteriores)

**Puntaje global: 69 / 100**

| Categoría | Peso | Puntaje |
|---|---|---|
| SEO técnico | 22% | 62 |
| Calidad de contenido | 23% | 68 |
| On-page | 20% | 62 |
| Datos estructurados | 10% | 70 |
| Rendimiento | 10% | 95 |
| Preparación para buscadores con IA | 10% | 78 |
| Imágenes | 5% | 55 |

La base técnica del sitio está bien construida: canonical autorreferencial en las 169 URLs, hreflang completo con x-default en todas, HSTS con preload, robots correcto, cero páginas huérfanas, rendimiento de 93 a 100 en PSI. Todo eso está bien y no hay que tocarlo.

El problema es otro y no se veía sin Search Console. Google no está indexando el sitio que existe hoy. Está indexando el sitio anterior.

---

## Crítico

### 1. El 87% de los clics llegan a URLs de la estructura vieja

En los últimos 28 días el dominio hizo 23 clics. Veinte de esos veintitrés cayeron en slugs planos que ya no son la URL canónica.

| URL que recibió el clic | Clics | Qué es hoy |
|---|---|---|
| `/blog/pilas-y-colas` | 5 | 308 a `/blog/cs-fundamentals/pilas-y-colas` |
| `/blog/payloadcms-tutorial` | 3 | 308 a `/blog/development/payload-cms-guide` |
| `/blog/tablas-hash` | 2 | 308 a `/blog/cs-fundamentals/tablas-hash` |
| `/blog/nextjs-portfolio` | 2 | **404** |
| `/blog/space-complexity` | 1 | 308 |
| `/blog/react-19` | 1 | 308 |
| `/blog/graph-algorithms` | 1 | 308 |
| `/blog/nextjs-cms` | 1 | 308 |
| `/blog/nextjs-seo-optimization` | 1 | 308 |
| `/en/blog/space-complexity` | 1 | 308 |
| `/en/blog/payload-cms-guide` | 1 | 308 |
| `/en/blog/astro-vs-nextjs` | 1 | 308 |

Los tres clics restantes fueron a la home (2) y a `/seo-tecnico-lima` (1). Ninguna otra URL canónica del sitio recibió un solo clic en 28 días.

En impresiones el patrón es el mismo y más agresivo. Las URLs viejas se llevan casi todo mientras la versión canónica del mismo artículo se queda en cero:

| Artículo | URL vieja | Impresiones | URL canónica | Impresiones |
|---|---|---|---|---|
| Queue data structure | `/en/blog/queue-data-structure` | 340 | `/en/blog/cs-fundamentals/queue-data-structure` | 0 |
| Heap data structure | `/en/blog/heap-data-structure` | 309 | `/blog/cs-fundamentals/heap-data-structure` | 143 |
| Space complexity | `/en/blog/space-complexity` | 227 | `/blog/cs-fundamentals/space-complexity` | 0 |
| Topic clusters | `/en/blog/topic-clusters-seo` | 219 | `/blog/seo/topic-clusters-seo` | 0 |
| Astro vs Next.js | `/en/blog/astro-vs-nextjs` | 203 | `/en/blog/development/astro-vs-nextjs` | 135 |
| Tablas hash | `/blog/tablas-hash` | 195 | `/blog/cs-fundamentals/tablas-hash` | 1 |
| Pilas y colas | `/blog/pilas-y-colas` | 179 | `/blog/cs-fundamentals/pilas-y-colas` | 26 |
| SSR vs CSR | `/en/blog/ssr-vs-csr-seo` | 176 | `/en/blog/tech-seo/ssr-vs-csr-seo` | 0 |
| Time complexity | `/blog/time-complexity` | 140 | `/blog/cs-fundamentals/time-complexity` | 19 |
| Headless CMS comparison | `/en/blog/headless-cms-comparison` | 120 | `/en/blog/development/headless-cms-comparison` | 0 |

Las redirecciones 308 funcionan, así que nadie ve un error. Pero Google sigue mostrando la URL vieja en la SERP, la autoridad está repartida entre dos direcciones por artículo, y ninguna de las dos consolida. `/blog/cs-fundamentals/space-complexity` perdió 248 impresiones contra cero en el período anterior. `/blog/seo/mejores-cursos-seo-espanol` perdió 246 contra cero. Ese tráfico no desapareció, se movió a la variante vieja.

Detalle que hace ruido: en `/blog/cs-fundamentals/heap-data-structure` la posición media cayó de 8.3 a 26.2 en un mes. Es exactamente lo que pasa cuando dos URLs compiten por la misma consulta y Google deja de confiar en cuál mostrar.

**Qué hacer.** Las redirecciones ya están, no hay nada roto que arreglar. Lo que falta es forzar la reindexación:

1. Enviar por la Indexing API o por inspección manual las 20 o 25 URLs canónicas que hoy tienen cero impresiones y su variante vieja rankeando.
2. Confirmar que ninguna URL vieja quede enlazada desde el contenido (ver punto 5, hay 189 enlaces internos apuntando ahí).
3. Esperar. La consolidación después de una migración de slugs tarda entre 4 y 12 semanas, y este sitio arrastra el split desde al menos febrero.

**Cómo saber si funcionó.** En el informe de rendimiento de GSC, filtrar por página que contenga `/blog/cs-fundamentals/`. Si en seis semanas esas URLs no pasaron de 20 impresiones a un múltiplo de eso, la consolidación no arrancó y hay que revisar si las 308 están perdiendo señal en algún salto.

### 2. Ocho URLs muertas siguen indexadas y recibiendo tráfico

Estas devuelven 404 duro, sin redirección, y Google las sigue mostrando:

| URL | Impresiones 28d | Clics 28d |
|---|---|---|
| `/blog/content-pillar` | 117 | 0 |
| `/en/blog/nextjs-portfolio` | 40 | 0 |
| `/en/blog/content-pillar` | 29 | 0 |
| `/blog/nextjs-portfolio` | 17 | **2** |
| `/en/blog/seo-copywriting-guide` | 4 | 0 |
| `/en/blog/seo-copywriting` | 3 | 0 |
| `/blog/seo-content-strategy` | 3 | 0 |
| `/blog/payloadcms-seo` | 1 | 0 |

La inspección de `/blog/content-pillar` en Search Console devuelve **"Enviada e indexada"** contra una URL que responde 404. Dos personas hicieron clic en `/blog/nextjs-portfolio` este mes y aterrizaron en un error.

Faltan ocho redirecciones. Los destinos naturales son `/blog/seo/pillar-page-seo` para las de content-pillar, `/blog/seo/redaccion-seo` para las de copywriting, `/blog/seo/estrategia-de-contenidos` para seo-content-strategy y `/blog/development/payload-cms-guide` para payloadcms-seo. Para nextjs-portfolio no hay equivalente directo, así que va a `/websites/juan-tech-com` o al índice del blog.

### 3. Seis artículos en inglés sirven el texto en español, y Google ya los rechazó

Las URLs bajo `/en/` cargan el cuerpo del artículo en español. El `<html lang="en">` y el hreflang dicen inglés, el contenido dice otra cosa.

| URL | Palabras ES / EN | Estado en Search Console |
|---|---|---|
| `/en/blog/seo/estrategia-seo` | 1444 / 124 | Rastreada, actualmente sin indexar |
| `/en/blog/seo/estrategia-de-contenidos` | 1312 / 102 | Rastreada, actualmente sin indexar |
| `/en/blog/seo/seo-off-page-guia` | 1238 / 108 | Rastreada, actualmente sin indexar |
| `/en/blog/tech-seo/technical-seo-guide` | 1136 / 88 | Rastreada, actualmente sin indexar |
| `/en/blog/cs-fundamentals/tablas-hash` | 1017 / 76 | **Enviada e indexada** |
| `/en/blog/seo/mejores-cursos-seo-espanol` | 297 / 102 | No encontrada (404) |

Esto no es una hipótesis: cuatro de las seis las crawleó Google y decidió no indexarlas. La última vez que tocó `seo-off-page-guia` fue el 17 de abril y no volvió.

El caso de `tablas-hash` es peor porque sí está indexada. Hay dos URLs con el mismo texto en español, declaradas entre sí como traducciones, las dos en el índice. La versión `/en/` se lleva 12 impresiones y la ES se lleva 1.

Los títulos y las meta description de las seis también están sin traducir, lo que apunta a que el fallback de locale de Payload devuelve el valor en español cuando falta la traducción, en vez de excluir la página.

**Qué hacer:** o se traducen, o se sacan del sitemap y del hreflang hasta que existan. La segunda opción se hace hoy y es reversible.

### 4. Cualquier ruta con un punto devuelve 500 en lugar de 404

```
/index.html         -> 500
/foo.html           -> 500
/foo.php            -> 500
/image.png          -> 500
/a.b                -> 500
/sitemap_index.xml  -> 500
```

Las rutas sin punto responden 404 bien (`/wp-admin`, `/robots`, `/pagina-que-no-existe-123`). El patrón apunta a que el matcher del middleware excluye rutas con extensión y las deja caer en un handler que revienta.

Importa porque `/sitemap_index.xml` es de las primeras URLs que prueba un rastreador, y un 5xx repetido hace que Google baje el crawl rate de todo el dominio. Con la reindexación pendiente del punto 1, un crawl budget castigado es lo último que conviene.

Hay una pista de que esto ya costó algo. Search Console tiene `/en/blog/seo/mejores-cursos-seo-espanol` como **"No encontrada (404)"** con último rastreo el 10 de agosto. Esa URL responde 200 hoy, en cinco intentos seguidos, también con user agent de Googlebot. Google la vio caída y la sacó del índice.

Eso conecta con algo que vi en el crawl: bajo 12 conexiones concurrentes, tres URLs devolvieron 500 con tiempos de 12 a 14 segundos, y las mismas tres devolvieron 200 en menos de un segundo al reintentarlas de a una. Es el render en frío de ISR cuando la caché está STALE y llegan varias peticiones juntas. Googlebot no rastrea con esa concurrencia, pero la evidencia dice que algo tumbó esa página el 10 de agosto.

---

## Alto

### 5. Ciento ochenta y nueve enlaces internos apuntan a URLs que redirigen

El contenido enlaza slugs viejos que hoy son 308:

| Enlace en el HTML | Destino real | Veces |
|---|---|---|
| `/blog/general/web-performance-guide` | `/blog/tech-seo/web-performance-guide` | 28 |
| `/blog/general/schema-markup-guide` | `/blog/tech-seo/schema-markup-guide` | 26 |
| `/blog/general/robots-txt-best-practices` | `/blog/tech-seo/robots-txt-best-practices` | 21 |
| `/blog/general/xml-sitemap-automation` | `/blog/tech-seo/xml-sitemap-automation` | 21 |
| `/blog/general/core-web-vitals-guide` | `/blog/tech-seo/core-web-vitals-guide` | 20 |
| `/blog/seo/estrategia-topic-clusters` | `/blog/seo/topic-clusters-seo` | 20 |
| `/blog/seo/guia-google-search-console` | `/blog/tech-seo/guia-google-search-console` | 19 |
| `/blog/tech-seo/nextjs-seo-optimization` | `/blog/tech-seo/nextjs-seo` | 17 |
| `/blog/tech-seo/tech-seo-guide` | `/blog/tech-seo/technical-seo-guide` | 17 |

Aislado sería un detalle menor. Con el split del punto 1 encima, no lo es: cada enlace interno a la URL vieja le confirma a Google que la vieja sigue viva.

### 6. Dos enlaces internos apuntan a 404

```
/en/blog/seo/estrategia-topic-clusters  -> 404   (16 enlaces entrantes)
/en/blog/tech-seo/tech-seo-guide        -> 404   (16 enlaces entrantes)
```

Los equivalentes en español existen y redirigen bien. Al plugin de redirects le faltan las dos variantes en inglés.

### 7. El sitemap que tiene Google no es el que sirve el sitio

Search Console reporta 196 URLs en `sitemap.xml`, descargado el 21 de agosto. El sitemap en vivo tiene 169. Hay 27 URLs de diferencia, y el informe trae 3 advertencias.

Eso explica que `/blog/content-pillar`, que hoy es 404, figure como "Enviada e indexada": estuvo en un sitemap que Google todavía recuerda.

### 8. Las landings locales no existen para Google

- `/seo-tecnico-madrid`: **"URL desconocida para Google"**, nunca rastreada.
- `/en/seo-tecnico-madrid`: **"Descubierta, actualmente sin indexar"**, nunca rastreada.
- `/seo-tecnico-lima`: sí conocida, 13 impresiones, 1 clic, posición media 7.8.

Las cuatro están en el sitemap con lastmod del 24 de agosto, y cada una recibe **un solo enlace interno** en todo el sitio. Lima entró, Madrid no. La diferencia entre las dos es el enlazado, y ninguna de las dos tiene datos estructurados (ver punto 17).

Que Lima ya esté en posición 7.8 con una sola página y cero refuerzo dice que la keyword es alcanzable. Madrid está tirada.

### 9. `/case-studies` y `/authors` reciben 444 enlaces internos y no están en el sitemap

Son las dos páginas índice más enlazadas después de la home. `/case-studies` está indexada igual (Google la encontró por enlaces), pero no está declarada. Sus versiones en inglés tampoco.

### 10. Diez páginas sin meta description

`binary-search-tree`, `merge-sort-python`, `quicksort-python`, `time-complexity`, `technical-seo-guide`, en los dos idiomas. Google inventa el snippet.

### 11. Ochenta y pico meta descriptions pasan de 200 caracteres

El rango va de 197 a 400. Google corta cerca de 155.

```
400  /blog/cs-fundamentals/programacion-dinamica
379  /blog/cs-fundamentals/algoritmos-ordenamiento
376  /blog/cs-fundamentals/complejidad-algoritmica
375  /blog/cs-fundamentals/arboles-binarios
373  /blog/cs-fundamentals/diseno-bases-datos
```

En el otro extremo, las 12 páginas de `/websites/` tienen descriptions de 18 a 52 caracteres, y dos son idénticas entre sí (`drmanuelvargashidalgo-com` y `estylopia-com` comparten "Implementación y configuración WordPress + Elementor").

---

## Medio

### 12. Dieciocho páginas tienen dos H1

Todas artículos del blog: `big-o-notation`, `que-es-css`, `headless-cms-seo`, `dynamic-programming`, `heap-data-structure`, `merge-sort-python`, `space-complexity`, `payload-cms-guide`, `auditoria-seo` (ES y EN), `seo-on-page-guia` (ES y EN), `technical-seo-checklist`, `pilas-y-colas` (EN), `canibalizacion-seo` (EN), `guia-google-search-console` (EN), `javascript-seo` (ES y EN).

El H1 del hero y el primer heading del cuerpo Lexical se están renderizando los dos como H1.

### 13. Los títulos de los casos de éxito llegan a 113 caracteres

```
113  Escalar el contenido legal educativo a más de 86,000 clics orgánicos anuales para...
 98  Scaling educational legal content to over 86,000 annual organic clicks...
 97  Más que duplicar el tráfico orgánico de un fabricante artesanal de baldosas...
```

El titular completo funciona como H1. El `<title>` necesita su propia versión corta.

### 14. Treinta y pico títulos por debajo de 25 caracteres

`Blog`, `General`, `Servicios`, `Contacto`, `React 19`, `Apturio`, `Recursividad`, `Juan Tech`. Sin marca ni contexto. `/blog` y `/en/blog` comparten el título literal, igual que las 12 páginas de `/websites/` entre pares de idioma.

### 15. `/search` es indexable, aunque Google ya decidió que no

`/search` y `/en/search` devuelven 200 sin `noindex` y reciben 169 enlaces internos entre las dos. Search Console las tiene como "Rastreada, actualmente sin indexar", así que el daño hoy es solo crawl budget gastado. Igual corresponde el `noindex`.

### 16. `og:type` es `website` en las 169 páginas

Los 105 artículos deberían declarar `article`. Faltan también `article:published_time` y `article:author`.

### 17. Diez páginas sin ningún dato estructurado

`/seo-tecnico-madrid`, `/seo-tecnico-lima`, `/contact`, `/terms`, `/privacy`, cada una en dos idiomas. Las dos landings locales son justamente las que más ganarían con `Service` más `LocalBusiness`, y son las del punto 8.

### 18. La home solo declara `Person`

Falta `WebSite` con `inLanguage` y falta `ProfessionalService` u `Organization`.

### 19. Ningún `Article` declara `inLanguage`

105 de 105. En un sitio bilingüe con pares hreflang y con el problema del punto 3 encima, es la señal de desambiguación más barata que existe.

### 20. Cuarenta y tres `Article` sin `description`

El campo existe en los otros 62, así que es contenido faltante en Payload, no un problema de plantilla.

---

## Bajo

### 21. Las 169 páginas usan imágenes genéricas

Cada página del sitio sirve una imagen de `portfolio/fallback-image-NN.avif`. Eso incluye el `og:image` y el `image` del schema `Article`. Hay 155 archivos distintos entre 169 páginas, así que además se repiten.

Para un sitio cuyo argumento de venta es la ejecución técnica impecable, la tarjeta de LinkedIn muestra un placeholder.

### 22. ~~Todas las imágenes de portada llevan `alt=""`~~ — CORREGIDO, el hallazgo estaba mal

**Este punto era falso.** Lo dejo escrito en vez de borrarlo porque el error de método vale más que el hallazgo.

Volví a medir sobre el HTML servido, distinguiendo atributo ausente de `alt=""`:

| URL | img | sin atributo alt | `alt=""` | con alt |
|---|---|---|---|---|
| `/` | 30 | 0 | 0 | 30 |
| `/blog` | 13 | 0 | 13 | 0 |
| `/authors/juan-carlos-angulo` | 50 | 0 | 50 | 0 |
| `/servicios/seo-consulting` | 28 | 0 | 0 | 28 |
| **Total sobre 6 páginas** | **126** | **0** | 68 | 58 |

Ninguna imagen del sitio carece de `alt`. Las 68 vacías lo están a propósito.

Mi regex contaba como "sin alt" cualquier `<img>` que no tuviera `alt="algo"`, metiendo en la misma bolsa el atributo ausente y el vacío. Son opuestos: el ausente es un fallo, el vacío es la forma correcta de declarar que una imagen es decorativa.

Y están vacíos por buenas razones, ya documentadas en el código. Las tarjetas son un solo `<a>` que envuelve imagen y título, así que repetir el título en el `alt` hace que un lector de pantalla lea la misma frase dos veces, algo que axe marca como `image-redundant-alt`. Se arregló en el issue #10 de la auditoría anterior. Los fondos de hero van dentro de un `div` con `aria-hidden="true"`. Los logos de cliente sí llevan alt real.

Poner el título como `alt` sería una regresión, no una mejora.

La señal que debería haberme hecho dudar antes de publicarlo estaba en mi propio informe: accesibilidad 100 en las doce corridas de PageSpeed.

### 23. Dos imágenes de Cloudinary devuelven 404 en la home y en las páginas de servicio

```
/media/miamiherald-logo
/media/ariannalupi
```

Salen como errores de consola en PSI y bajan Best Practices de 100 a 96 en home y en `/servicios/seo-consulting`. Los assets no están en el bucket.

### 24. `/blog/general` es una categoría vacía

137 palabras, un enlace entrante, existe en los dos idiomas. Es la categoría vieja de la que salieron los cinco artículos que hoy redirigen a `/blog/tech-seo/`.

### 25. Las páginas de `/websites/` son finas

Entre 66 y 94 palabras cada una, 12 URLs, misma estructura y casi el mismo texto.

### 26. `http://www.juan-tech.com` hace doble salto

Va a `https://www` y de ahí a `https://` sin www. Se resuelve en un salto apuntando el 301 directo al canónico.

---

## Rendimiento: lo único que no hay que tocar

PageSpeed Insights, 6 URLs por 2 estrategias, con API key:

| URL | Perf mobile | Perf desktop | LCP mobile | CLS |
|---|---|---|---|---|
| Home | 97 | 94 | 1.8 s | 0 |
| `/blog` | 97 | 99 | 2.3 s | 0 |
| `/blog/seo/guia-eeat` | 95 | 98 | 2.8 s | 0.012 |
| `/servicios/seo-consulting` | 100 | 94 | 1.5 s | 0 |
| `/case-studies/immigration-law-atlanta-seo` | 93 | 98 | 3.0 s | 0 |
| `/seo-tecnico-lima` | 99 | 100 | 1.8 s | 0.001 |

Accesibilidad 100 y SEO 100 en las doce corridas. CLS casi cero en todas.

CrUX no tiene datos de campo para ninguna URL ni para el origen. Con 23 clics en 28 días no hay tráfico para llenar el percentil 75, así que todo lo de arriba es laboratorio.

Descarté una medición: Lighthouse local contra la home dio 68 de performance con LCP de 8.1 s. Es mi red, no el sitio. PSI desde la infraestructura de Google da 97.

---

## Buscadores con IA

Lo que está bien:

- `llms.txt` existe, responde 200 y está bien escrito. Describe la estructura bilingüe de forma explícita.
- `robots.txt` no bloquea ningún rastreador de IA.
- El schema `Person` de la home tiene `sameAs` a LinkedIn y GitHub, que es lo que usan los modelos para resolver la entidad.
- La profundidad de contenido es real: mediana de 2334 palabras en 105 artículos, mínimo 1025.

Lo que falta:

- Ningún `WebSite` ni `Organization` en la home. La entidad "juan-tech.com" como negocio no está declarada.
- Sin `inLanguage`, un modelo que cita en inglés puede terminar citando la URL española.
- Las imágenes genéricas quitan la miniatura diferenciada en las respuestas que la muestran.
- `llms.txt` lista solo los índices, no los casos de éxito ni los artículos.

Nota sobre FAQPage: Google retiró los resultados enriquecidos de FAQ para todos los sitios el 7 de mayo de 2026. No recomiendo agregar FAQPage buscando ese beneficio porque ya no existe.

---

## Orden de ejecución

El orden importa. Todo lo demás vale poco mientras Google siga indexando el sitio viejo.

**Esta semana**

1. Crear las 8 redirecciones que faltan para las URLs 404 con impresiones (#2). Es lo único que hoy manda usuarios a un error.
2. Arreglar el 500 en rutas con extensión (#4). Cambio de matcher en el middleware.
3. Decidir qué pasa con los seis artículos en inglés sin traducir (#3). Sacarlos del sitemap toma minutos y es reversible.
4. Crear las dos redirecciones en inglés que faltan (#6).
5. Reenviar el sitemap para que Google descarte las 27 URLs fantasma (#7).

**Semana 2, consolidación**

6. Reemplazar los 189 enlaces internos que apuntan a slugs viejos (#5). Va después del paso 1 para no hacerlo dos veces.
7. Pedir reindexación de las 20 a 25 URLs canónicas que hoy tienen cero impresiones y su variante vieja rankeando (#1).
8. Enlazar `/seo-tecnico-madrid` y `/seo-tecnico-lima` desde la home, el índice de servicios y las páginas de servicio (#8). Hoy tienen un enlace cada una.
9. Agregar `/case-studies` y `/authors` al sitemap en los dos idiomas (#9).

**Semana 3, on-page**

10. Las 10 meta description faltantes y las 80 y pico que se pasan de largo (#10, #11).
11. Títulos cortos para los 7 casos de éxito (#13) y para las 30 páginas con título genérico (#14).
12. `noindex` en `/search` y `/en/search` (#15).

**Semana 4, plantillas**

13. Arreglar el doble H1 (#12). Una plantilla, 18 páginas.
14. `og:type` condicional por colección (#16).
15. `inLanguage` en el generador de `Article` (#19).
16. `WebSite` más `ProfessionalService` en la home (#18). `Service` y `ContactPage` donde falta schema (#17), empezando por Madrid y Lima.

**Backlog**

17. Imágenes propias, arrancando por los 7 casos de éxito y las 4 páginas de servicio (#21). El punto 22 quedó descartado: ver la corrección.
18. Subir los dos assets faltantes de Cloudinary (#23).
19. Qué hacer con `/blog/general` (#24) y con `/websites/` (#25).

## Qué mirar para saber si funcionó

Sin volver a correr la auditoría entera:

- **Proporción de clics a URLs canónicas.** Hoy es 3 de 23. En GSC, filtrar páginas que contengan `/blog/cs-fundamentals/`, `/blog/tech-seo/`, `/blog/seo/` o `/blog/development/`. Si en seis semanas esa proporción no pasó de la mitad, la consolidación no arrancó.
- **Errores 5xx en el informe de rastreo.** Después del fix del middleware tiene que quedar en cero.
- **`/seo-tecnico-madrid` en inspección de URL.** Tiene que dejar de decir "URL desconocida para Google". Si sigue igual dos semanas después de enlazarla, el problema no era el enlazado.
- **CTR de `cs-fundamentals`.** Son los artículos con las meta description más largas. Si el recorte sirve, el CTR sube ahí primero.
- **Impresiones en inglés.** Si las seis sin traducir salen del sitemap, las impresiones EN bajan al principio. Es esperable y es la señal de que se cortó la duplicación.

## Cabos sueltos

CrUX no va a tener datos de campo hasta que suba el tráfico, así que el rendimiento real de los usuarios sigue siendo una incógnita aunque el laboratorio pinte bien.

Queda una pregunta sin responder: por qué `/en/blog/seo/mejores-cursos-seo-espanol` estaba en 404 para Googlebot el 10 de agosto y responde 200 hoy. Las dos explicaciones que tengo son el 5xx intermitente bajo concurrencia o que la página estuviera despublicada en ese momento. La segunda encaja con el bug de draft que ya apareció antes en la colección Websites. Vale la pena revisar el historial de publicación de ese documento en Payload antes de darlo por cerrado.
