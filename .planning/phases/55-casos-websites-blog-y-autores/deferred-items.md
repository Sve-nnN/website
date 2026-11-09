# Fase 55: elementos diferidos y hallazgos para planes posteriores

## 55-01 (hallado en el primer despliegue del preview)

- **Todo `populate` de `media` debe pedir `filename` junto con `url`.** El `url` de Media lo genera el adaptador de Cloudinary desde `filename` en `afterRead`. Con `populate: { media: { url: true, width: true, height: true, alt: true } }` el campo llega `null` y la imagen desaparece sin error (medido: `GET /api/websites?select[screenshots]=true&populate[media][url]=true` devuelve `"url": null`; agregando `populate[media][filename]=true` devuelve la URL de Cloudinary). 55-01 lo corrigió en `getCachedWebsitesIndex`. Les toca a:
  - **55-08** (`getCachedWebsiteBySlug`), **55-10** (`getCachedBlogPostList`, `heroImage`) y **55-12** (`getCachedAuthorsIndex`, `avatar`): incluir `filename: true` en el `populate` de media.
  - `src/lib/home-data-b.ts` `readHomeSites` (fase 54-14, fuera del alcance de 55-01): mismo defecto latente. La home hoy no lo muestra porque `featured-content` está vacío, pero el respaldo D-26 (plan 55-02 y siguientes) lo activa. Corregir ahí al tocar el archivo.
- `55-tracer-live.mjs` ya exige una captura por cada sitio con captura en producción: la comprobación de enlaces sola daba verde con las seis tarjetas sin imagen.
