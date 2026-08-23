---
quick_id: 260823-seo-perf-a11y
status: complete
issues: [3, 6, 7, 8, 10]
prs: [25, 26, 27, 28, 29, 30, 31]
date: 2026-08-23
---

# Quick 260823 — Auditoría SEO: identidad, rendimiento, traducciones y accesibilidad

Continuación de `260820-seo-09-11`. Cerrados en esta tanda: **#3** (crítico) y
**#8**. Avanzados con medición y sin cerrar: **#6**, **#7**, **#10**.

## #3 — Identidad y E-E-A-T (cerrado, 6/6 en vivo)

Tres inconsistencias que se contradecían entre sí en el mismo dominio.

- **Credencial fechada en 2028.** Decisión de Juan: la carrera está en curso.
  Una carrera en curso no es una credencial obtenida, así que ahora sale como
  `alumniOf` (la relación con la institución, sin afirmar título ni fecha) y
  `hasCredential` queda para lo terminado. Cuando pase el `endDate`, la misma
  entrada empieza a emitirse como credencial sin tocar código.
- **LinkedIn incorrecto en el footer**, solo en español; el inglés ya tenía el
  correcto, y por eso en `/authors` convivían los dos handles.
- **Dos entidades Person para la misma persona.** `src/lib/person.ts` arma el
  nodo una vez, desde el doc de `authors` y no desde constantes, bajo un `@id`
  canónico. La home, la ficha de autor, los Article y los case studies apuntan
  todos ahí.

Colateral: `NEXT_PUBLIC_SERVER_URL` caía a `juancarlosangulo.com`, otro dominio,
en cuatro archivos.

## #8 — Meta descriptions (cerrado, 16/16 en vivo)

Las 13 entradas no tenían ni `meta.description` ni `excerpt`, y la plantilla ya
cae al excerpt, así que salían sin descripción del todo. 29 de 30 escritas a
mano en ambos idiomas.

La que falta (`en que-es-css`) no tiene fila en inglés: la página sirve el
español por fallback. Escribirle una meta en inglés la rotularía como traducida.

**La corrida completa de unlighthouse encontró 5 posts más** que el baseline
muestreado no vio, más `/websites`, que al ser ruta escrita a mano no tenía
ningún campo del CMS del que caer.

## #6 — Rendimiento (4 de 5 criterios)

Dos causas en serie, y la segunda solo se vio cuando la primera dejó de tapar.

**ISR.** El HTML servía `no-store` y re-ejecutaba el SSR entero. Venía de
`force-dynamic`, que estaba por una razón real: el build de Dokploy no tiene red
hacia Postgres. `generateStaticParams` devolviendo lista vacía cumple las dos
condiciones: el build no renderiza nada y cada URL se cachea en la primera
visita. Verificado en el prerender-manifest, no en la tabla del build, que marca
`●` en rutas que no prerenderiza.

**El shader del hero.** Con el servidor ya resuelto, la home seguía en 44.
Bloqueando solo el chunk de `@paper-design/shaders-react`: 44 → 82 y TBT 2090 ms
→ 50 ms. Se difiere a idle + viewport, con un degradado CSS de los mismos hex
mientras tanto. El diseño llega igual, un segundo más tarde.

| | Baseline | Ahora |
|---|---|---|
| Performance mediana del sitio | 74,5 | **95** |
| Home TTFB | 3,82 s | ~0,45 s |
| Home TBT | 620 ms | ~70 ms |
| Home LCP | 7,9 s | 5,3 s |

Falta el LCP bajo 4 s. Ya no es el servidor ni el hilo principal: es el peso del
documento más la latencia. Y todas estas mediciones salen de una laptop en Perú
contra un VPS en Alemania: cinco corridas seguidas dieron 82, 62, 72, 76 y 74.

## #7 — Traducciones (medido y contenido, no cerrado)

El issue listaba dos posts porque midió dos. Medidos los 66: **27 tienen el
inglés bajo el 80% del español, 10 bajo el 50%**, faltan ~31.400 palabras.

No es un corte de la migración: las versiones inglesas terminan bien, con
secciones completas. Son traducciones parciales.

Decisión de Juan: cortar el sangrado primero. Los 11 peores salen del índice
inglés (`noindex, follow`, sin hreflang `en`, fuera del sitemap). Los 17 entre
50% y 80% quedan indexados: son artículos completos con menos desarrollo.

## #10 — Accesibilidad (4 de 7 rutas)

Dos de los tres items ya estaban resueltos. El tercero tenía cuatro causas, y la
que más costó ver fue el footer: sus encabezados de columna eran h3, así que
rompía el orden en toda página sin h2 propio en el cuerpo.

Hallazgo nuevo de la corrida completa: 8 posts con tablas sin `<th>`. El
conversor oficial lee `node.headerState`, que en las tablas migradas es
`undefined`.

## Errores de método que costaron tiempo

- **El validador daba FAIL falso.** `echo "$html" | grep -q` bajo `pipefail`
  devuelve el status de `echo`, que recibe EPIPE cuando grep sale al primer
  match: un patrón temprano en 500 KB de HTML fallaba y el mismo patrón al final
  pasaba. Diagnosticó "el Article no incluye image" con la image ahí.
- **La tabla del build miente.** Marca `●` (SSG) en rutas que el
  prerender-manifest lista como dinámicas. Verificar ISR contra el manifest.
- **El fallback de locale disfraza lo que falta.** `payload.find` con locale
  `en` devuelve el español si no hay traducción, así que un post sin traducir
  parece traducido hasta que intentás escribirle y Payload valida los campos
  requeridos contra la fila vacía. `fallbackLocale: false` es la forma de sacar
  la lista real.
- **El check de fuentes empezó a pasar por vacío.** Medía el header `Link`, que
  Next dejó de emitir al pasar a ISR: 0 bytes contra un umbral de 120.000.

## Pendiente

| Qué | Quién |
|---|---|
| `scripts/db/14-fix-heading-levels.ts` y `15-meta-descriptions-ronda-2.ts` | Juan corre el túnel |
| Resubir `miamiherald-logo` y `ariannalupi` a Cloudinary (404) | Juan |
| #5 canibalización | bloqueado: juan-tech.com no tiene proyecto en Ahrefs, no hay datos de GSC |
| #7: las ~31.400 palabras de traducción | por tandas |
| #6: LCP bajo 4 s | falta reducir peso de documento en `/` y `/blog` |
