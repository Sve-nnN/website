---
phase: quick-260820-blg
plan: 01
subsystem: blog
tags: [blog, cro, seo, taxonomia, newsletter, payload]
status: complete
requires: []
---

# Blog: biblioteca con rutas, CRO por audiencia y alta al correo

## Que se hizo

**Taxonomia.** Cuatro posts estaban clasificados contra la regla que el propio
blog usa: `que-es-css`, `experiencia-de-usuario` y `sql-vs-nosql` pasaron de
`cs-fundamentals` a `development`, y `guia-google-search-console` de `seo` a
`tech-seo`. Reparto final: tech-seo 18, cs-fundamentals 22, seo 17,
development 9, general 0.

Como el slug de la categoria primaria manda la URL canonica, los cuatro
cambiaron de URL. Se cargaron 8 redirects (ES + EN por post) y se verificaron en
vivo: las URLs nuevas dan 200 y las viejas 308 hacia ellas.

**Indice.** Sale la grilla plana de 12 posts y entra `blogCategoryRows`: una fila
por categoria con encabezado, descripcion, conteo real y "Ver mas" hacia la
categoria. Orden por peso comercial, editable desde el admin. El destacado sigue
siendo el ultimo post publicado y se excluye de la fila de su categoria. Tambien
salio `featuredPostsBlock`: con destacado arriba mas filas, esa grilla curada era
un tercer listado en la misma pagina.

**Categoria.** Conteo en el hero, puente hacia las otras categorias al final y
banda de cierre. Antes se acababan los posts y no habia a donde ir.

**Post.** Barra de avance que mide el articulo (no la pagina), TOC colapsable en
mobile y sticky de verdad en escritorio, oferta inline insertada entre secciones
cerca del 40% del cuerpo, y cierre en escalera: autor, relacionados, conversion.

**CRO por audiencia.** Los tres banners cambian de texto segun la categoria. SEO
Tecnico habla de renderizado e indexacion sobre el codigo; Estrategia SEO habla
de WordPress, Webflow y Shopify, que es donde vive esa audiencia; Desarrollo
habla de decidir bien mientras se construye; Ciencias de la Computacion NO vende
la auditoria y apunta a los case studies.

**Alta al correo.** Coleccion `subscribers` con acceso cerrado en las cuatro
operaciones, doble opt-in real, baja en un clic y rate limit por IP. El bloque
entro al layout recien cuando el alta funcionaba.

## Decisiones que valen para el proximo que toque esto

**La oferta inline se hizo dos veces.** La primera version era una regla en brasa
con texto gris y un enlace. Sobria en el diseno, invisible en la pagina: dentro
de un articulo de 20 minutos, un bloque con la misma tipografia, el mismo color y
el mismo ancho que los parrafos que lo rodean no se ve. La segunda es un panel
navy con el shader granulado, el mismo material que abre la home. Corta por
contraste de superficie, no por gritar.

**Un solo canvas animado por post.** El shader va en la oferta inline; la tarjeta
lateral y la banda de cierre usan grano estatico. La tarjeta lateral acompana
todo el scroll, y algo que esta siempre en pantalla y ademas se mueve deja de ser
oferta y pasa a ser anuncio.

**La mezcla del texto por categoria es por campo.** Un campo vacio hereda del
texto general en vez de borrarlo, asi que cambiar solo un titulo no obliga a
copiar los otros cinco. La excepcion son los puntos del cierre: media lista
pisada no significa nada, asi que es todo o nada.

**Un token invalido no puede decir "confirmado".** La primera version redirigia
igual con token valido e invalido "para no filtrar informacion". El resultado era
que un enlace viejo respondia "listo, tu correo quedo confirmado" sin haber hecho
nada. Ahora vuelve como `invalid`, con el formulario a mano. El token es de 32
bytes aleatorios: distinguir valido de invalido no le sirve a nadie, mentirle a
un lector si cuesta.

**El formulario no revela quien esta en la lista.** Un alta sobre un correo ya
confirmado responde exactamente igual que un alta nueva. Responder "ya estas
suscrito" convierte el formulario en un oraculo para enumerar direcciones.

## Bugs encontrados en la verificacion visual

1. **La fila de metadatos de las cards se recortaba.** `CardContent` con `h-full`
   dentro de una Card que no era flex column: el contenido se desbordaba y el
   `overflow-hidden` lo cortaba. Se veia como una card con un hueco abajo.
2. **El TOC nunca se pegaba al scroll.** Un item de grid se estira a la altura de
   la fila por defecto, y un elemento tan alto como su contenedor no tiene margen
   para `sticky`. Faltaba `self-start`.
3. **`PostCard` usaba `useLocale`**, que lanza "No intl context found" fuera del
   arbol de next-intl. Habria tumbado la vista previa del admin. Ahora lee el
   locale de `useParams`.

## El bug de Payload que costo mas caro

Escribir un array localizado del CMS **con** `id` en cada fila funciona en el
locale por defecto (`es`) y **falla** en el secundario (`en`) con
`ValidationError: id — Value must be unique` sobre la tabla padre. Falla igual en
un proceso limpio, asi que no es estado sucio.

Escribirlo **sin** ids funciona en cualquier locale, pero recrea las filas con
ids nuevos y deja al otro idioma colgando de filas que ya no existen. Durante el
desarrollo eso vacio el espanol entero.

La combinacion que si funciona es contraintuitiva: **ingles primero** (crea las
filas sin ids) y despues espanol (las completa apuntando a esos ids). Quedo
escrito en la cabecera de `scripts/db/08-blog-promo-by-category.ts` y de
`scripts/db/09-newsletter-block.ts`. Cualquier script futuro que escriba arrays
localizados tiene que seguir ese orden.

## Verificacion

- `next build` exit 0 y `tsc --noEmit` limpio despues de cada tanda.
- URLs nuevas 200 y viejas 308, en ES y EN, contra produccion.
- Los tres banners sirven la version correcta por categoria en ambos idiomas,
  comprobado leyendo el HTML servido de un post de `seo`, uno de `tech-seo` y uno
  de `cs-fundamentals`.
- Bloque de alta renderiza con su texto de consentimiento; las rutas de
  confirmacion y baja responden y un token invalido vuelve como `invalid` con el
  formulario disponible.
- Escritorio revisado con capturas. Mobile revisado en el post (TOC colapsado,
  tarjeta lateral ausente); el resto de mobile quedo sin captura porque la
  extension del navegador se desconecto.

## Lo que queda abierto

- **El ciclo completo del alta no se probo de punta a punta**: exigiria mandar un
  correo real. Falta que Juan se suscriba una vez y confirme desde su bandeja.
- **Nada desplegado.** Produccion ya tiene datos, migraciones y contenido nuevos,
  pero sirve el build viejo.
- **Canibalizacion**: hay 7 pares de posts que compiten entre si
  (`dynamic-programming`/`programacion-dinamica`,
  `keyword-research-guide`/`guia-keyword-research`,
  `topic-clusters-seo`/`estrategia-topic-clusters`,
  `content-pillar`/`pillar-page-seo`,
  `seo-copywriting`/`seo-copywriting-guide`/`redaccion-seo`,
  `technical-seo-guide`/`tech-seo-guide`,
  `estrategia-de-contenidos`/`seo-content-strategy`). Consolidar o desindexar es
  tarea propia y probablemente pese mas en trafico que todo lo de arriba.
- **Sin instrumentacion**, "bajar el rebote" no es verificable. El sitio no tiene
  analitica propia.
