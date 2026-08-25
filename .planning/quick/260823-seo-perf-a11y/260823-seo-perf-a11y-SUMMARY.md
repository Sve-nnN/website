---
quick_id: 260823-seo-perf-a11y
status: complete
issues: [3, 5, 6, 7, 8, 10]
prs: [25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
date: 2026-08-25
---

# Quick 260823 — Auditoría SEO: identidad, rendimiento, traducciones y accesibilidad

Continuación de `260820-seo-09-11`. Cerrados en esta tanda: **#3** (crítico),
**#5**, **#6**, **#8** y **#10**. Queda abierto solo **#7**, que es trabajo de
contenido: ~31.400 palabras de traducción.

La auditoría queda en **10 de 11 cerrados**.

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

## #6 — Rendimiento (cerrado, los 5 criterios)

Tres causas en serie. Cada una tapaba a la siguiente, así que ninguna se veía
hasta resolver la anterior.

**ISR.** El HTML servía `no-store` y re-ejecutaba el SSR entero. Venía de
`force-dynamic`, que estaba por una razón real: el build de Dokploy no tiene red
hacia Postgres. `generateStaticParams` devolviendo lista vacía cumple las dos
condiciones. Verificado en el prerender-manifest, no en la tabla del build, que
marca `●` en rutas que no prerenderiza. TTFB 3,82 s → 0,12 s.

**El shader del hero.** Con el servidor resuelto, la home seguía en 44. PSI midió
su costo real en móvil: **27,8 s de bloqueo del hilo principal**. Diferirlo bien
lo bajó a 13,1 s, que sigue siendo inutilizable — partir a la mitad un número
inutilizable deja un número inutilizable. El problema no era *cuándo* corría
sino *cuánto costaba*, y el costo no se agenda. Decisión de Juan: shader solo en
escritorio, degradado CSS en táctiles. TBT 13.100 ms → **156 ms**.

**La herramienta de medición.** Lighthouse local daba 39, 67, 69 y 87 para la
misma página el mismo día. Llegué a reportar una "mediana de TBT de 70 ms" que
con más muestras no se sostenía: la dispersión del instrumento era mayor que el
efecto a medir. `scripts/seo/pagespeed.py` mide desde hardware de Google y
reporta mínimo y máximo junto a la mediana.

| | Baseline | Final |
|---|---|---|
| Performance home | 46 | **94** |
| LCP | 7,9 s | **2,63 s** |
| TBT | 620 ms | **156 ms** |
| TTFB | 3,82 s | **0,12 s** |

`/servicios` 100, `/blog` 95, `/blog/tech-seo/nextjs-seo` 95. CrUX todavía no
tiene muestra suficiente, así que son números de laboratorio.

## #5 — Canibalización (cerrado, 15/15)

Desbloqueado cuando entró el acceso a Search Console por MCP. Seis meses de
datos decidieron cada ganadora, y **en tres de los siete grupos contradijeron a
la intuición**: gana la URL con impresiones, que es la que tiene *menos* enlaces
internos.

`topic-clusters-seo` figuraba como PERDEDORA en la lista tentativa del issue,
con 320 impresiones contra 0 de la otra. Consolidar hacia la otra habría tirado
la única señal real del grupo — exactamente el error contra el que el issue
advertía al hacer de GSC un prerrequisito duro.

Nada se borró: cada perdedora quedó en borrador con su documento completo
guardado en `research/canibalizacion/` antes de tocar la base.

Los 17-24 enlaces internos que el crawler contaba hacia las perdedoras salían de
los bloques de artículos relacionados, que dejan de listar un borrador solos.
Enlace escrito a mano había **uno**. Esa autoridad interna era automática, no
editorial, y por eso valía menos de lo que parecía.

**Pendiente:** la fusión editorial. `estrategia-topic-clusters` tiene 3518
palabras que hoy no ve nadie. Concatenar por script deja encabezados repetidos y
párrafos que se contradicen.

## #7 — Traducciones (medido y contenido, no cerrado)

El issue listaba dos posts porque midió dos. Medidos los 66: **27 tienen el
inglés bajo el 80% del español, 10 bajo el 50%**, faltan ~31.400 palabras.

No es un corte de la migración: las versiones inglesas terminan bien, con
secciones completas. Son traducciones parciales.

Decisión de Juan: cortar el sangrado primero. Los 11 peores salen del índice
inglés (`noindex, follow`, sin hreflang `en`, fuera del sitemap). Los 17 entre
50% y 80% quedan indexados: son artículos completos con menos desarrollo.

## #10 — Accesibilidad (cerrado, 9/9 rutas)

Dos de los tres items ya estaban resueltos. El tercero tenía cuatro causas, y la
que más costó ver fue el footer: sus encabezados de columna eran h3, así que
rompía el orden en toda página sin h2 propio en el cuerpo.

Las tres últimas rutas se resolvieron con datos, no con código: los h3 estaban
escritos así en el rich text. `scripts/db/14-fix-heading-levels.ts` sube los H3 a
H2 solo cuando el campo no tiene ningún H2, así que la jerarquía relativa queda
intacta.

Hallazgo de la corrida completa: 8 posts con tablas sin `<th>`. El conversor
oficial lee `node.headerState`, que en las tablas migradas es `undefined`.

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
| #7: las ~31.400 palabras de traducción | por tandas, priorizando por impresiones |
| La fusión editorial de los 7 grupos consolidados | a mano, con el texto en `research/canibalizacion/` |
| Resubir `miamiherald-logo` y `ariannalupi` a Cloudinary (404) | Juan |

## Nota operativa

El túnel a la base se cayó tres veces en la sesión, cada vez con un error
distinto: `ECONNRESET` a mitad de corrida, `ECONNREFUSED` con nada escuchando, y
timeout de handshake. El relay `socat` no sobrevive mucho rato ocioso. Si esto
sigue, conviene que los scripts de contenido corran desde el VPS, donde
`shared-postgres` resuelve por nombre y no hay dos saltos que se caigan.
