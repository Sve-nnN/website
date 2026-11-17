# Estado de los hallazgos de la muestra de auditoría (57-06)

Medido el 2026-11-17 entre las 19:26 y las 20:40 UTC contra el preview `https://dev.juan-tech.com`, desplegado desde `d68832b` (despliegue `VN6_HUAF35Bi_x_Z-hVo9`, done). Producción (`https://juan-tech.com`) como referencia. Todo con GET; ninguna escritura en la base.

Herramientas: `scripts/verify/57-headers-check.mjs` (vivo), `57-seo-parity-all.mjs` con `EXPECT_PREVIEW=1` (`57-seo-parity-preview-57-06.json`), `57-perf-compare.mjs` con la regla max(10%, 50 ms) (`57-perf-57-06.json`) y curl.

| Hallazgo | Antes (muestra y línea base) | Después (medido hoy en el preview) | Veredicto |
|---|---|---|---|
| F1 TTFB y LCP del post | Muestra: LCP 9,3 s y TTFB 1,8 a 2,2 s. Línea base 57-03: TTFB 1564 ms en el preview y 1915 en producción, `cache-control: private, no-cache, no-store` | `cache-control: s-maxage=60, stale-while-revalidate=31535940` y `x-nextjs-cache: HIT`. Lighthouse: TTFB 282 ms contra 1570 en producción, LCP 2768 ms contra 5811 (3 corridas del preview por un corte de red local, 5 de producción). 9 URLs de post en ES y EN dan 200, entre ellas una con captura de email (`technical-seo-checklist`) y otra con afiliados (`guia-keyword-research`). `?subscribed=pending`, `already` y `error` se aplican en el cliente sin errores de JS; con `error` el foco va al campo | Corregido |
| F2 Critical-CH y 307 interno | Preview y producción con `accept-ch`, `critical-ch` y `vary: Sec-CH-Prefers-Color-Scheme` | `/`, `/en` y el post sin `accept-ch`, sin `critical-ch` y sin la pista en `vary`. HSTS, nosniff, Referrer-Policy y X-Frame-Options siguen presentes. `/admin` conserva `Accept-CH` (decisión 14) | Corregido. El tema automático del admin se revisa a mano tras el corte (el preview responde 404 en /admin a propósito) |
| F3 imagen LCP sin fetchpriority | 0 `fetchpriority="high"` en home, servicio y post | El elemento LCP no es una imagen: en la home es un `div.MuiBox-root`, en el servicio y en el post un párrafo. Sin carga de recurso | No aplica, sin cambio de código |
| F4 enlaces a gemelos EN noindex | 57-02: 14 destinos noindex con enlaces internos, más 3 enlaces rotos (`/en/sitemap.html`, `/en/llms.txt`, `/en/llms-full.txt`) | Enlaces rotos: 0. Gemelos noindex: bajan de 14 a 8 destinos. El pie, el listado, los relacionados y el autor ya no enlazan gemelos noindex. Los 8 que quedan salen del texto enriquecido de posts EN, con `/en` o el dominio escritos a mano en el contenido | Corregido en código (`b522695`), sin desplegar todavía: el disco del VPS quedó en 81% tras el build y el umbral de Juan no permite otro push. Se mide tras la limpieza de disco o en el corte |
| F5 HTML del autor | 2.704.962 bytes en producción | ES 360.235 bytes y EN 354.184 (producción hoy 2.785.008 y 2.247.901). Límite 500 KB | Corregido |
| F13 x-powered-by | `x-powered-by: Next.js, Payload` en el preview | Ausente en `/`, `/en` y el post | Corregido |

## Rendimiento con la regla max(10%, 50 ms)

| URL | LCP preview / prod | TTFB | TBT | Veredicto |
|---|---|---|---|---|
| / | 2597 / 5109 ms | 286 / 319 | 60 / 24 (límite 74) | PASS |
| /en | 2565 / 5042 ms | 325 / 362 | 19 / 26 | PASS |
| /servicios/ai-seo-geo | 2281 / 4253 ms | 280 / 358 | 29 / 22 | PASS |
| /blog/seo/estrategia-seo | 2768 / 5811 ms | 282 / 1570 | 55 / 155 | PASS |

CLS 0 en el preview y accesibilidad de Lighthouse 1 en las cuatro. El proxy de INP sigue más alto en el preview (168 a 192 ms contra 64 ms en producción); no es INP de campo y no entra en la regla, pero 57-09 debe verlo.

## TTFB de home, EN y servicio: entorno, no código

Con caché caliente (curl, 7 peticiones, mediana de espera del servidor descontando la conexión TLS) el preview y producción quedan iguales: `/` 266 contra 264 ms, `/en` 270 contra 270 y `/servicios/ai-seo-geo` 262 contra 262. Las dos sirven `x-nextjs-cache: HIT` con `s-maxage=60`. La diferencia de la línea base de 57-03 venía de peticiones en `STALE`: el preview casi no recibe tráfico, así que tras 60 s cada página vuelve a generarse en la primera visita. Hoy, con la regla nueva, las tres pasan. No hay código que corregir.

## Foco de teclado

Tras `de0d228` (anillo de 2 px en `MuiButtonBase`), el barrido de la home baja de 33 a 8 paradas sin anillo por idioma. Esas 8 eran tarjetas que dibujan el anillo en la tarjeta con `:has(a:focus-visible)`; el navegador confirma un outline de 2 px naranja en el `li` o el `div` padre. Con el barrido ajustado (`5c01dd0`), la home pasa en ES y EN a 375 y 1280 px. Juan lo confirma a ojo con el punto 1 de `57-A11Y-MANUAL.md`.
