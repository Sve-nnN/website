# Handoff SEO, cierre del 26 de agosto de 2026

Para retomar sin releer toda la sesión. El informe completo está en
`research/auditoria-seo-2026-08-25.md`.

**Estado: 10 issues cerrados de 17 abiertos por la auditoría, más #7 y #40 que
venían de antes.** Todo lo cerrado está validado contra producción, no contra
local.

---

## 1. Lo que te toca a vos antes que nada

Ninguna de estas la puedo hacer yo. Las tres primeras bloquean trabajo mío.

### 1.1 Imágenes huérfanas del VPS (riesgo de caída)

El disco está al **89%, 8,6 GB libres**. Cada deploy deja una imagen nueva de
~2,9 GB. Hay **25 imágenes sin tag ni contenedor**, restos de los deploys de
esta sesión, que liberarían unos 36 GB.

El 25 de agosto el disco llegó a 100% y tumbó `shared-postgres`, que se llevó
puesto medio juan-tech.com. No conviene volver a acercarse.

```bash
ssh -i ~/.ssh/sapling_ed25519 juan@116.203.79.125
sudo docker images -f dangling=true -q | wc -l    # ver cuántas son
sudo docker image prune -f                        # borra SOLO las huérfanas
df -h /
```

`prune -f` sin `-a` toca únicamente imágenes sin tag y sin contenedor. No borra
la que está corriendo ni las de las otras apps.

Es borrado, y por eso no lo hice sin tu OK.

### 1.2 Cuota de GitHub Actions

El PR #64 no disparó CI: GitGuardian corrió, pero ni Typecheck+Build ni React
Doctor registraron corrida. Los ocho PRs anteriores del día sí. Parece cuota
agotada. Los próximos PRs van a quedar sin CI hasta que se resuelva.

Mientras tanto, el reemplazo es `npm run build` en local: es exactamente el
mismo chequeo.

### 1.3 Search Console

Tres acciones que la API no expone y hay que hacer a mano.

1. **Reenviar `sitemap.xml`.** GSC todavía reporta 196 URLs contra las 167
   reales. Hasta que no lo reenvíes sigue recordando 27 fantasma, incluida
   `/blog/content-pillar` como "Enviada e indexada" siendo un 404 con redirect.
   Revisá también las 3 advertencias del informe de sitemaps.
2. **Pedir indexación** de las canónicas que hoy tienen cero impresiones
   mientras su variante vieja rankea: las diez de la tabla de #38, más
   `/blog/seo/mejores-cursos-seo-espanol`,
   `/blog/cs-fundamentals/graph-algorithms`, `/blog/development/nextjs-cms`,
   `/blog/tech-seo/nextjs-seo`, `/blog/development/react-19` y
   `/blog/cs-fundamentals/recursividad`.
3. **Pedir indexación** de `/seo-tecnico-madrid` y `/en/seo-tecnico-madrid`.

### 1.4 Dos decisiones de contenido

**Los 62 excerpts largos (#43).** El problema de fondo no es que falten 62
descriptions: es que `excerpt` cumple dos funciones con longitudes distintas,
teaser en el listado (300 caracteres se leen bien) y snippet en la SERP (Google
corta en 155). Dos caminos:

- Escribir 62 `meta.description` propias. Es lo correcto y son 62 textos.
- Recortar el fallback al renderizar. Una línea, pero corta a mitad de frase.

Se combinan: recortar ya como piso, escribir las propias por tandas según
impresiones de GSC.

**`areaServed: Lima, Madrid`.** Está en producción, en el nodo
`ProfessionalService` de la home. Lo saqué de que existen esas dos landings. Si
trabajás remoto sin foco geográfico, se saca de `src/lib/site-schema.ts`.

---

## 2. Lo que puedo retomar yo

En orden de retorno.

### #45 — Titles de casos de éxito (medio, listo para ejecutar)

La mitad de código está hecha y desplegada: 56 títulos genéricos ganaron el
sufijo de marca. Falta lo de contenido.

Siete casos de éxito con títulos de hasta 113 caracteres necesitan un
`meta.title` corto propio, mientras el titular largo se queda como H1. Son 14
textos (7 × 2 idiomas).

Es la tarea más autocontenida que queda. Necesita el túnel a la base.

### #43 — Los 62 excerpts (alto, bloqueado por la decisión 1.4)

Ver arriba. En cuanto elijas camino, se ejecuta.

### #49 — Imágenes genéricas (bajo, decisión de producto)

Las 169 páginas usan `fallback-image-NN.avif`, incluidos `og:image` y el
`image` del schema. Para un sitio que vende ejecución técnica, la tarjeta de
LinkedIn muestra un placeholder.

Prioridad sugerida: los 7 casos de éxito, después las 4 páginas de servicio.
No hace falta ilustración original para los 105 artículos: un template de
portada con título, categoría y marca ya diferencia y se genera
programáticamente.

### #51 — Dos assets de Cloudinary en 404 (bajo, solo vos)

```
/media/miamiherald-logo
/media/ariannalupi
```

Bajan Best Practices de 100 a 96 en home y en `/servicios/seo-consulting`. El
código ya tiene un fallback que evita la imagen rota, y su comentario dice que
la única solución real es volver a subir los archivos, que no están en el repo.

### #52 — `/blog/general` y las fichas de `/websites/` (bajo, decisión)

`/blog/general` quedó vacía tras mover sus cinco artículos. Las 12 fichas de
`/websites/` tienen entre 66 y 94 palabras y suman 6 impresiones en 28 días.
Sus meta descriptions van de 18 a 38 caracteres.

Mi lectura: colapsar las 12 en una galería con contexto real rinde más que
expandirlas.

### #53 — `http://www` hace doble salto (bajo, infraestructura)

Va a `https://www` y de ahí al canónico. Se resuelve en un salto apuntando el
301 directo, desde la configuración del proxy en Dokploy.

### #38 — Consolidación del índice (crítico, solo esperar)

La parte técnica está toda hecha: cero enlaces internos legacy, redirects en un
salto, URLs muertas redirigidas, páginas EN duplicadas fuera del índice.

Lo único que falta es la reindexación (punto 1.3) y tiempo. Después de una
migración de slugs tarda entre 4 y 12 semanas.

**Cómo medir si funcionó**, sin volver a auditar: hoy 3 de 23 clics van a URLs
canónicas. En GSC, filtro por página que contenga `/blog/cs-fundamentals/`,
`/blog/tech-seo/`, `/blog/seo/` o `/blog/development/`. Si en seis semanas esa
proporción no pasó de la mitad, la consolidación no arrancó.

Indicador temprano, a las tres semanas: `/blog/tablas-hash` (192 impresiones)
no debería seguir por encima de `/blog/cs-fundamentals/tablas-hash` (1).

### #7 — Traducciones truncadas (alto, es escribir)

Sigue abierto en sus puntos originales: `big-o-notation` al 35% del español,
`react-19` al 44%, y otros nueve por debajo del 50%. Necesita que alguien
escriba, no código.

Los seis que servían español entero ya salieron del índice.

---

## 3. Trampas que ya me comí, para no repetirlas

**`grep -c` cuenta líneas, no ocurrencias.** El HTML de Next viene en una sola
línea, así que `grep -c '<h1'` devuelve 1 tanto con uno como con cinco. Me dio
un falso positivo de deploy. Contar con `grep -o '<h1' | wc -l`.

**Payload devuelve el valor español al leer un campo inglés vacío.** Es el
fallback de locale. Un script que escribe primero el español y después lee el
inglés para ver "si ya tiene" va a saltear todas las inglesas, y las páginas EN
quedan sirviendo castellano. Siempre `fallbackLocale: false` al leer para
decidir si hay que escribir.

**`draft: false` en todo update sobre colecciones con borradores.** Sin eso, un
update despublica el doc. Ya está en todos los scripts de `scripts/db/`.

**Las escrituras por script no invalidan el tag de `unstable_cache`.** Salen por
el TTL de 60 s. Un cambio que no se ve al instante no significa que el script
falló: esperá un minuto antes de investigar.

**Verificar contra el HTML servido, no contra el "OK" del script.** Las dos
veces que algo salió mal esta sesión, el script decía que había terminado bien.

**El túnel SSH se cae solo.** Conviene `-o ServerAliveInterval=15`. Y
reconectar muchas veces seguidas activa el bloqueo del puerto 22 por IP, que
tardó unas horas en soltarse. Cuando pase: el sitio sigue arriba, es solo tu
acceso.

---

## 4. Cómo levantar el entorno

```bash
# túnel a la base de producción, dejar la terminal abierta
./scripts/db/tunnel.sh

# en otra terminal: la credencial se saca en vivo, no vive en .env
PROD_URI=$(ssh -i ~/.ssh/sapling_ed25519 juan@116.203.79.125 \
  "CID=\$(sudo docker ps --filter name=app-program-online-alarm -q | head -1); \
   sudo docker exec \"\$CID\" printenv DATABASE_URI")
export DATABASE_URI="${PROD_URI/@shared-postgres:5432\/juantech/@127.0.0.1:15432/juantech?sslmode=disable}"

# SIEMPRE antes de escribir: confirmar contra qué base estás
node --env-file=.env node_modules/.bin/tsx scripts/db/04-which-database.ts
```

Los scripts de esta sesión, todos con dry-run por defecto:

- `scripts/db/17-redirects-404-indexadas.ts`
- `scripts/db/18-enlaces-internos-legacy.ts`
- `scripts/db/19-meta-descriptions-faltantes.ts`
- `scripts/seo/measure-translations.py` (ahora detecta páginas que sirven español)
