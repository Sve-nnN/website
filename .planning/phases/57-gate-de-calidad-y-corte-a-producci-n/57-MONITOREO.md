# Plan de monitoreo de 404 e indexación tras el corte (fase 57, D-13)

Juan, este documento define qué se mira, cuándo y con qué umbral después de pasar el sitio nuevo a producción. La ventana es de 28 días desde el día del corte. Todas las comprobaciones son de solo lectura.

## Fecha del corte

D = 2026-12-01 es una propuesta, no un compromiso (D-15). El corte ocurre cuando tú das la confirmación escrita de 57-10 y el volcado de respaldo está verificado. Si D se mueve, las fechas de abajo se recalculan contando desde el día real del corte. Este documento usa "día N" para no depender de la fecha.

## Antes del día 0: el snapshot de referencia

Antes del merge se guarda el estado de producción con el sitio viejo:

```
PROD_BASE=https://juan-tech.com node scripts/verify/57-seo-parity-all.mjs --snapshot .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-prod-snapshot-pre.json
```

El snapshot guarda estado y destino de cada URL, los campos de head, el JSON-LD con su hash, las palabras, los h1, `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt` y los redirects. Todas las revisiones de abajo comparan contra ese archivo. Sin snapshot no hay monitoreo comparable, así que es requisito del plan 57-11.

## Calendario de revisiones

| Día | Qué se mira | Quién |
|---|---|---|
| 0 (el día del corte, con el TTL de 60 s vencido) | Paridad contra el snapshot, cabeceras, accesibilidad, bundle y la regresión viva de 56. Reenvío del sitemap en Search Console. Números de partida de Search Console: páginas indexadas, páginas no encontradas (404) y solicitudes de rastreo por día | Claude con el orquestador; Juan en Search Console |
| 1 | Paridad contra el snapshot. Informe de páginas de Search Console: no encontradas y cobertura. Estadísticas de rastreo: solicitudes por día y errores del servidor | Claude y Juan |
| 3 | Lo mismo que el día 1. Además, la lista de URLs "Descubierta, actualmente sin indexar" y "Rastreada, actualmente sin indexar" frente al día 0 | Claude y Juan |
| 7 | Paridad contra el snapshot. Cobertura de indexación completa: indexadas contra el día 0. Redirects del snapshot siguen devolviendo el mismo destino. Rendimiento en vivo contra la línea base de producción | Claude y Juan |
| 14 | Lo mismo que el día 7. Impresiones y clics de las 20 URLs con más tráfico previo contra su promedio de los 28 días anteriores al corte | Claude y Juan |
| 28 | Cierre: paridad, cobertura de indexación, 404 acumulados, estadísticas de rastreo y rendimiento. Veredicto escrito: la ventana cierra, se prolonga o se abre una corrección | Claude y Juan |

## Qué se corre en cada revisión

1. Paridad contra el snapshot previo al corte (solo GET):

   ```
   PROD_BASE=https://juan-tech.com node scripts/verify/57-seo-parity-all.mjs --live-prod --vs-snapshot .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-prod-snapshot-pre.json --out .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-monitoreo-dia-N.json
   ```

   Cada URL del sitemap debe tener el mismo estado que en el snapshot. Una diferencia en title, descripción, canonical, hreflang, OG o JSON-LD solo es válida si el rediseño la declaró como esperada en 57-12; el resto es defecto.

2. Cabeceras y caché: `BASE_URL=https://juan-tech.com node scripts/verify/57-headers-check.mjs`. Las páginas y el post siguen con `s-maxage` y sin `no-store`.

3. En Search Console, informe de páginas: la lista de "No encontrada (404)", la cobertura de indexación y las estadísticas de rastreo (Configuración, Estadísticas de rastreo). Juan pega los números o captura la pantalla; Claude los anota en la tabla de seguimiento de abajo.

4. Los días 0, 7, 14 y 28, la regresión viva `BASE_URL=https://juan-tech.com node scripts/verify/56-run-all.mjs --live --no-wait` sin `EXPECT_PREVIEW`.

## Umbrales

Cada umbral dispara una de dos acciones: corrección (se arregla hacia adelante) o rollback (se sigue 57-ROLLBACK.md).

| Señal | Umbral | Acción |
|---|---|---|
| Home o servicios con 5xx | Más de 5 minutos tras el deploy | Rollback |
| Sitemap, robots o redirects distintos del snapshot sin motivo declarado | Cualquier diferencia el día 0 | Rollback si el sitemap o los redirects pierden URLs; corrección si es un detalle de formato |
| Cualquier URL del sitemap con estado distinto del snapshot | 1 URL o más | Corrección el mismo día. Rollback si son más de 5 URLs o alguna es de servicios o casos |
| 404 nuevos en Search Console | Salto de más de 10 URLs nuevas en un día, o cualquier URL que estaba en el sitemap | Corrección el mismo día con un redirect o la ruta faltante. Rollback si el salto supera 50 URLs |
| Páginas indexadas | Caída de más del 10% frente al día 0 mantenida en dos revisiones seguidas | Corrección: revisar canonical, noindex y robots. Rollback si hay una causa de código que no se resuelve en 48 horas |
| Errores del servidor en estadísticas de rastreo | Más del 2% de las solicitudes del día | Corrección; rollback si pasan del 10% |
| Solicitudes de rastreo por día | Caída de más del 50% frente al día 0 durante 3 días | Corrección: revisar robots, tiempos de respuesta y errores |
| Rendimiento en vivo | LCP, TTFB o TBT peores que la línea base de producción más max(10%, 50 ms) | Corrección |
| Formulario de contacto | No llega el correo de prueba | Rollback si no se arregla en 30 minutos |

Un umbral que dispara rollback nunca se ejecuta sin tu decisión: Claude presenta la causa y las condiciones, y tú decides.

## Tabla de seguimiento

Se llena en cada revisión. Claude la actualiza con lo que Juan pega de Search Console.

| Día | Fecha | URLs con estado distinto del snapshot | Páginas 404 (SC) | Páginas indexadas (SC) | Errores del servidor (SC) | Veredicto |
|---|---|---|---|---|---|---|
| 0 | | | | | | |
| 1 | | | | | | |
| 3 | | | | | | |
| 7 | | | | | | |
| 14 | | | | | | |
| 28 | | | | | | |

## Cierre de la ventana

La ventana cierra el día 28 si ninguna revisión dejó un umbral abierto. Si queda alguno, la ventana se prolonga hasta que pase dos revisiones seguidas. El cierre se anota en este archivo con la fecha y tu confirmación.
