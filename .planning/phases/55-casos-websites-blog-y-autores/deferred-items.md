# Fase 55: elementos diferidos y hallazgos para planes posteriores

## 55-01 (hallado en el primer despliegue del preview)

- **Todo `populate` de `media` debe pedir `filename` junto con `url`.** El `url` de Media lo genera el adaptador de Cloudinary desde `filename` en `afterRead`. Con `populate: { media: { url: true, width: true, height: true, alt: true } }` el campo llega `null` y la imagen desaparece sin error (medido: `GET /api/websites?select[screenshots]=true&populate[media][url]=true` devuelve `"url": null`; agregando `populate[media][filename]=true` devuelve la URL de Cloudinary). 55-01 lo corrigió en `getCachedWebsitesIndex`. Les toca a:
  - **55-08** (`getCachedWebsiteBySlug`), **55-10** (`getCachedBlogPostList`, `heroImage`) y **55-12** (`getCachedAuthorsIndex`, `avatar`): incluir `filename: true` en el `populate` de media.
  - `src/lib/home-data-b.ts` `readHomeSites` (fase 54-14, fuera del alcance de 55-01): mismo defecto latente. La home hoy no lo muestra porque `featured-content` está vacío, pero el respaldo D-26 (plan 55-02 y siguientes) lo activa. Corregir ahí al tocar el archivo.
- `55-tracer-live.mjs` ya exige una captura por cada sitio con captura en producción: la comprobación de enlaces sola daba verde con las seis tarjetas sin imagen.

## 55-08 (resuelto y pendiente)

- **Resuelto:** el defecto latente de `readHomeSites` (media sin `filename`) quedó corregido en `src/lib/home-data-b.ts` junto con el respaldo D-26 (`SITES_POPULATE`). La auditoría estática de `55-home-fallback-ssr.ts` falla si alguien vuelve a quitar `filename`.
- **Pendiente de verificación en vivo:** ni el detalle de `/websites/<slug>` ni el respaldo de la home se han visto en `dev.juan-tech.com` (la ola 4 no hace push). El plan que haga el push de la ola debe esperar el estado `done` del despliegue en Dokploy (ordenar por `createdAt`) y comprobar `id="casos"` (3 tarjetas) e `id="sitios"` (5) en `/` y `/en`, y los seis detalles de sitios en ES y EN.
- **Sin uso por ahora:** las claves `websites.detail.screenshotsTitle` y `websites.detail.externalNotice` (creadas en 55-01) no se renderizan: el detalle muestra una sola captura (D-14) y el enlace externo ya anuncia la pestaña nueva con texto oculto (`opensInNewTab`).

## 55-02, 55-11 y 55-13 (anclas sin destino en recursividad EN, tolerada por lista)

- `/en/blog/cs-fundamentals/recursividad` conserva 3 enlaces de ancla del cuerpo sin destino (`#common-recursion-algorithms`, `#best-practices-for-writing-recursive-functions`, `#conclusion`). Los otros 4 que producción ya rompía resuelven porque los encabezados nuevos llevan id. Las tres secciones no existen en la traducción al inglés (el post está en `EN_TRANSLATION_INCOMPLETE`, 22 por ciento del español): es contenido, no código.
- **Tolerado, no ignorado:** `scripts/verify/55-post-contract.mjs` registra la excepción en `DANGLING_ANCHOR_ALLOWLIST` con ruta, anclas, motivo y dueña (fase 56, contenido). Cualquier otro post con una ancla sin destino, o este mismo post con una ancla más, sigue dando FAIL; si el post pierde alguna de las tres (se traduce), el script avisa con WARN para retirar la entrada.
- **Cierra la fase 56:** traducir el artículo completo al inglés o quitar los tres enlaces del cuerpo, y luego borrar la entrada de la lista.

## 55-13 (pendientes que pasan a las fases 56 y 57)

### Fase 56 (contenido que decide Juan)

- Cargar las lecciones aprendidas ya aprobadas en `case-studies.lessons` (D-10). La tabla `case_studies_lessons` existe y está vacía; hasta entonces el preview no muestra "Lecciones aprendidas". Cargarlas en el corte, porque guardar un caso desde el admin de master (que no conoce `lessons`) podría perder filas (A3 de 55-06).
- Puntajes Lighthouse y capturas nuevos de Websites (D-13): hoy salen los de Payload (medidos el 14 de julio de 2026) y `juan-tech-com` no trae puntajes (los cuatro son null).
- Marcadores `{{pendiente}}` que lleguen de Payload: se renderizan tal como llegan (D-29) y la fase 56 los cierra.
- Curar `featured-content` (métricas de casos y sitios): el respaldo D-26 muestra los más recientes mientras tanto.
- Perfil de Juan: la experiencia "Senior Tech SEO Analyst" llega sin fechas, `credentials` está vacío y la descripción de aprendoclub trae una URL como texto plano.
- Copy con guiones largos que ya existía: namespace `emailCapture` (`description`, `alreadyBody`, `errorBody`, `privacySuffix`), fuera de la paridad de la fase 55.
- Títulos reales de Payload con defectos que el rediseño no corrige: `/blog/cs-fundamentals/complejidad-algoritmica` termina en "rendim...", `que-es-css` trae URLs markdown como texto, y varios encabezados de contenido con punto o coma (WARN de `55-page-contract`).
- Los 10 de los 17 posts EN incompletos que están traducidos a medias muestran el aviso "no disponible en inglés" aunque tengan parte del texto; la lista `EN_TRANSLATION_INCOMPLETE` no distingue unos de otros.

### Fase 57 (corte y limpieza)

- IN-01 (copiar correo duplicado en `CtaPanel` y `CopyEmailButton`), IN-02 (el formulario pierde el mensaje al fallar), IN-03 (`key` de `StackView`) e IN-04 (cadenas fijas en `service-view-data.ts` y `CodeFixes.tsx`) de `54-REVIEW.md` siguen diferidos: ningún plan de la fase 55 tocó esos archivos. IN-05 a IN-09 se plegaron en 55-04, 55-05 y la fase.
- Retiro de componentes y código viejos que ninguna superficie de esta fase usa ya: `RichTextRenderer`, `PostCard` vieja, `CaseStudyCard`, `CaseStudyResultsChart`, `WebsiteCard`, `AuthorCard`, `BlogCategoryTabs`, `CategoryBridge`, `InlineOffer`, `RailOffer` y `BlogClosing` vieja. Antes de borrar, revisar los bloques de `src/blocks/*` (FAQ, FeaturedCaseStudies, FeaturedWebsites, RelatedCaseStudy, Archive, Content, CallToAction) y `richTextBlockConverters.tsx`, que aún los importan, y `src/app/globals.css`.
- Revalidación de admin a preview en vivo (T-55-15): los hooks `afterChange` corren en el proceso de producción; el preview solo se entera por el TTL de 60 s más la ventana ISR de 60 s. Compuerta humana: publicar un cambio en un Website, un Author y un SpeakingEvent desde el admin de producción y comprobar el preview sin esperar.
- `src/lib/sitemap-data.ts` (líneas 118 a 129) dice que Authors y Websites "have no cache-tag hooks at all", lo cual ya es falso; decidir si el sitemap suma `CACHE_TAGS.websites()` y `CACHE_TAGS.authors()` y corregir el comentario.
- Los verificadores de la fase 48 (`scripts/verify-stack-word-count.ts`, `scripts/verify-stack-page.ts`) se retiran junto con `ToolCard`, `GearCard`, `StackHighlightCallout` y `AffiliateDisclosureFrame`.
- Claves de mensajes sin uso: `websites.detail.screenshotsTitle` y `websites.detail.externalNotice`.
- Archivos temporales sin versionar en `scripts/` (`_tmp-dump-b0303.ts`, `_tmp-extract-b0303.ts`) ajenos a la fase 55: decidir si se borran o se commitean.
