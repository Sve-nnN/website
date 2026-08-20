---
phase: quick-260820-blg
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/(frontend)/[locale]/blog/page.tsx
  - src/app/(frontend)/[locale]/blog/[category]/page.tsx
  - src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx
  - src/blocks/BlogCategoryRows/
  - src/blocks/NewsletterBlock/
  - src/components/BlogClosing.tsx
  - src/components/CategoryBridge.tsx
  - src/components/InlineOffer.tsx
  - src/components/RailOffer.tsx
  - src/components/ReadingProgress.tsx
  - src/collections/Subscribers/
  - src/globals/BlogPromo/
  - src/lib/blog-promo.ts
  - src/lib/reading-time.ts
  - src/lib/lexical-split.ts
  - src/app/actions/subscribe.ts
  - src/app/api/newsletter/confirm/route.ts
  - src/app/api/newsletter/unsubscribe/route.ts
  - scripts/db/05-recategorize-posts.ts
  - scripts/db/06-blog-redesign-content.ts
  - scripts/db/07-blog-promo-inline-rail.ts
  - scripts/db/08-blog-promo-by-category.ts
  - scripts/db/09-newsletter-block.ts
autonomous: true
subsystem: blog
tags: [blog, cro, seo, taxonomia, newsletter, payload]

must_haves:
  truths:
    - "Los 4 posts mal categorizados cambian de categoria Y de URL, con sus 301 cargados en los dos idiomas"
    - "El indice del blog muestra filas por categoria con encabezado, conteo real y 'Ver mas', no una grilla plana"
    - "El destacado es el ultimo post publicado y NO se repite dentro de la fila de su categoria"
    - "Los tres banners de conversion cambian de texto segun la categoria que se este leyendo"
    - "La mezcla entre el texto por categoria y el general es POR CAMPO: un campo vacio hereda, no borra"
    - "El alta al correo tiene doble opt-in real: sin confirmar, el correo nunca queda activo"
    - "La baja es un clic desde el correo, sin login ni pantalla intermedia"
    - "La coleccion subscribers tiene acceso cerrado en las 4 operaciones"
    - "El formulario no revela si un correo ya estaba en la lista"
    - "next build y tsc --noEmit pasan"
  artifacts:
    - src/blocks/BlogCategoryRows/Component.tsx
    - src/lib/blog-promo.ts
    - src/collections/Subscribers/index.ts
    - src/app/api/newsletter/confirm/route.ts
    - .planning/quick/260820-blg-blog-redesign-cro-y-newsletter/260820-blg-SUMMARY.md
  key_links:
    - "El slug de la categoria primaria manda la URL canonica (src/lib/blog-paths.ts), asi que recategorizar obliga a redirigir"
    - "Los redirects se cargan con to.type custom, nunca reference: el resolver de referencias arma /blog/<slug>, que es la forma vieja de la URL"
    - "El shader animado tiene techo de 2 canvas por pagina (decision de la home); el post gasta 1 en la oferta inline"
---

<objective>
Rehacer el blog como biblioteca con rutas en vez de muro de tarjetas, con la
conversion apoyada en la oferta real (auditoria de 600 USD acreditables) y
adaptada a la audiencia de cada categoria, y dejar el alta al correo funcionando
de punta a punta.
</objective>

<context>
El indice era una grilla de 66 posts iguales sin fecha, sin tiempo de lectura y
sin ninguna senal de por donde entrar. La categoria terminaba sin salida. El post
cerraba en relacionados y se acababa. No habia una sola llamada a la accion en
todo el blog, que es el canal principal de adquisicion del sitio.

Ademas la taxonomia estaba corrida: `cs-fundamentals` funcionaba como cajon de
sastre (CSS, UX y bases de datos mezclados con algoritmos) y `development`, la
categoria que le interesa a un cliente que busca quien le construya el sitio,
tenia 6 posts.
</context>

<decisions>
- **La taxonomia se corrige con una regla escrita, no caso por caso.** `cs-fundamentals` es teoria independiente del stack; `development` es construir con un stack concreto; `tech-seo` es diagnostico sobre codigo o infra; `seo` es contenido y autoridad. De esa regla salen exactamente 4 movimientos, no una reasignacion masiva.
- **Filas por categoria con 3 posts, no 6.** Con 4 categorias, 6 por fila son 24 cards y el indice vuelve a ser el muro que se estaba deshaciendo. El numero es un campo del bloque, editable sin tocar codigo.
- **Un bloque nuevo (`blogCategoryRows`) y no una opcion mas de ArchiveBlock.** ArchiveBlock renderiza una consulta; esto renderiza una por categoria con encabezado, conteo y navegacion propia. Es otra topologia, no un parametro.
- **Los textos de conversion viven en un global, no en la coleccion Categories.** Editar una categoria es taxonomia, no marketing.
- **Ciencias de la Computacion NO vende la auditoria.** Esa audiencia viene a repasar teoria, no a contratar. Su version apunta a los case studies, sin precio.
- **El alta al correo se cablea de verdad o no se publica.** Un formulario que responde "listo" y descarta el correo pierde el lead y ademas enga単a al visitante. Estuvo fuera del layout hasta que el doble opt-in quedo funcionando.
</decisions>

<risks>
- Cambiar la categoria primaria de un post cambia su URL canonica, y son documentos ya indexados. Mitigado con 8 redirects (ES + EN por post) verificados en vivo.
- Escribir arrays localizados de Payload en el locale secundario falla con ids y recrea filas sin ids. Mitigado con el orden ingles-primero documentado en los scripts 08 y 09.
- El envio del correo de confirmacion depende de Resend. Si la API key no es valida, el alta queda `pending` sin correo y el visitante ve error.
</risks>
