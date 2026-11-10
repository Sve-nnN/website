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
