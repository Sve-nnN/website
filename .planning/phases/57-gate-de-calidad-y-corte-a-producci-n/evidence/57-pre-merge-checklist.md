# Checklist de precondiciones del merge (plan 57-09, tarea 1)

Medido el 2026-11-24 contra el preview `https://dev.juan-tech.com` y producción `https://juan-tech.com`. Todo con GET, sin cookies, sin base de datos y sin escritura en producción. El preview es noindex por diseño: todas las corridas usan `EXPECT_PREVIEW=1`.

Estado del preview: Dokploy reporta la app `juantech-preview` en `done`, rama `feat/mui-redesign`, último despliegue sobre `19d0a09` (fix de `/blog/confirm`, 2026-11-24 06:47 UTC) y contenedor `running`. El reporte se regeneró sobre ese commit.

Leyenda: CUMPLIDO, ABIERTO (bloquea el merge hasta que Juan responda), DIFERIDO (Juan lo aplazó a propósito), INFORMATIVO (no bloquea, queda anotado).

## Precondiciones

| # | Precondición | Estado | Evidencia |
|---|---|---|---|
| 1 | Gate de decisiones de la 56 en 0 (`tsx scripts/verify/56-gate.ts --gate`) | **ABIERTO** | Código de salida **1**. Un ítem bloquea: `CUT-legal-date-efectiva` (fecha efectiva de la política de privacidad y de los términos, el día del corte), pendiente de respuesta de Juan (D-07: con ítems abiertos no hay corte). Además 10 advertencias de ítems en `propuesto` (fila 14) que no bloquean pero hay que anotar en el handoff. |
| 2 | Preview desplegado en el commit actual y sano | CUMPLIDO | `57-dokploy-status --app preview`: despliegue `done`, contenedor `running`, 0 salidas en 10 min, commit `19d0a09`. |
| 3 | `/blog/confirm` y `/en/blog/confirm` sin 500 | CUMPLIDO | Corregido en `19d0a09` (los iconos ya no se pasan como `component` de MUI desde un Server Component). La batería del 2026-11-24 no reporta ninguna diferencia de estado en esas URLs. Constancia en `57-final-clasificacion.json`. |
| 4 | Reporte regenerado sin filas que bloqueen sin excepción propuesta | **ABIERTO** | `57-GATE-REPORTE.md` regenerado sobre `19d0a09`: 2 bloqueos. (a) `54-about`: sin excepción propuesta, es una decisión de contenido de Juan (fila 12). (b) `CUT-legal-date-efectiva` (fila 1). Más 2 diferencias legítimas que Juan debe aceptar por escrito (fila 11). |
| 5 | `57-run-all --selftests --strict` en 0 | CUMPLIDO | Salida 0, los 15 autotests en PASS. |
| 6 | Batería viva contra el preview | **ABIERTO** | 6 de 8 pasos PASS: `53-crawl-parity`, `57-legacy-render-sweep`, `57-headers-check`, `57-a11y-sweep`, `57-perf-compare`, `57-bundle-weight`. Fallan `57-seo-parity-all` (solo las 2 diferencias de palabras de la fila 11) y `56-run-all --live` (solo `54-about`, fila 12). |
| 7 | Hallazgo F1 (TTFB y LCP del post) | CUMPLIDO | Corregido: `57-headers-check` PASS (`s-maxage` presente, sin `no-store` en el post). LCP del post 2585 ms contra 4107 ms en producción; TTFB 245 ms contra 1558 ms. |
| 8 | Hallazgo F2 (`Critical-CH` y su 307) | CUMPLIDO | Corregido: sin `accept-ch` ni `critical-ch` fuera de `/admin`. El tema automático del admin se revisa a mano tras el corte (el preview responde 404 en `/admin` a propósito). |
| 9 | Hallazgo F3 (imagen LCP sin `fetchpriority`) | CUMPLIDO | No aplica: el elemento LCP de las URLs medidas no es una imagen. |
| 10 | Hallazgos F4, F5 y F13 | CUMPLIDO | F4: 0 destinos con enlaces a gemelos EN noindex ni enlaces rotos en el preview. F5: perfil de autor en 360.441 bytes (ES) y 354.390 (EN) contra un presupuesto de 500.000. F13: sin `x-powered-by`. La decisión de los 17 posts solo en español con gemelo EN noindex ya está tomada en `translation-gaps.ts`. |
| 11 | Diferencias legítimas aceptadas por Juan por escrito (D-04) | **ABIERTO** | `/blog/general (palabras)` (120 contra 135, 11,1% menos) y `/en/blog/general (palabras)` (124 contra 138, 10,1% menos). Causa: la categoría vacía pierde el contador "0 artículos" y la fila repetida "Otros temas del blog". Sin respuesta escrita de Juan todavía (T-57-32). |
| 12 | `54-about`: alt EN de la foto de Sobre mí | **ABIERTO** | `/en/sobre-mi` no tiene ninguna imagen con alt no vacío. La fila `ALT-about-hero` está aprobada y es cargable, pero el cargador del corte solo escribe el alt de las 6 capturas. Exige una escritura aditiva en Media o una excepción. Decisión de Juan. |
| 13 | `53-computed-styles` intermitente | INFORMATIVO | El único FAIL ocurrió dentro de `56-run-all --live` a primera hora. No reapareció en cuatro corridas aisladas ni en la repetición completa tras `19d0a09`. Sin causa visible, el script no se tocó. Se vigila en el monitoreo. |
| 14 | Ítems `propuesto` del gate de decisiones (no bloquean) | INFORMATIVO | `D-11-lead`, `CUT-cta-master-landings-servicio`, `HEAD-legal`, `HEAD-lecciones`, `MSG-emailCapture-description`, `-alreadyBody`, `-errorBody`, `-privacyPrefix`, `-privacySuffix` y `-pendingBody`. Van al handoff. |
| 15 | Rendimiento contra producción con la regla max(10%, 50 ms) | CUMPLIDO | Las 4 URLs en PASS, CLS 0 (0,013 en el post), accesibilidad Lighthouse 1. El proxy de INP (Playwright, no entra en la regla) es más alto en el preview: 128 a 160 ms contra 56 a 64 ms en producción. Queda anotado para que Juan lo vea. |
| 16 | Bundle sin crecer tras retirar Tailwind | CUMPLIDO | CSS 53,5 KB a 8,8 KB; JS 1245,6 KB a 1209,5 KB. |
| 17 | Rollback ensayado | CUMPLIDO | `57-ROLLBACK.md`, ensayado en un worktree temporal en 57-08. |
| 18 | Plan de monitoreo escrito | CUMPLIDO | `57-MONITOREO.md` (28 días), escrito en 57-08. |
| 19 | Snapshot de producción previo al corte (D-13) | CUMPLIDO | `evidence/57-prod-snapshot-pre.json`, tomado el 2026-11-24 08:48 UTC: 174 URLs (172 con 200; `/sobre-mi` y `/en/sobre-mi` dan 404 en producción, es la página nueva), sitemap de 166 locs, 38 redirects, `robots.txt`, `llms.txt` y `llms-full.txt` con 200. Sin cookies ni cabeceras de sesión. |
| 20 | Diff de sitemap y llms contra el snapshot vacío | CUMPLIDO | Producción contra su propio snapshot, minutos después: 0 diferencias en estado, head, JSON-LD, palabras, sitemap, `robots.txt`, `llms.txt`, `llms-full.txt` y redirects. El único ruido son 15 hallazgos de enlaces internos que ya tiene producción (14 enlaces a gemelos EN noindex y `/en/sitemap.html` con 404), es decir el F4 original que el preview ya corrigió. Siguen en la línea base como defecto de producción, no como cambio. |
| 21 | Revisión humana de accesibilidad y diseño (CAL-01, tarea 2) | **DIFERIDO** | Diferida por Juan a la revisión en producción tras el corte. Juan, 2026-11-24: "con respecto a la revision humana difierela y la reviso todo en produccion." No está hecha: ver "Riesgos y puntos abiertos conocidos". |
| 22 | Revalidación de admin a preview (T-55-15) | DIFERIDO | Es la prueba opcional del punto 6 de la tarea 2 y no se ejecutó. No hay escrituras en producción desde este plan. La decisión de ejecutarla o descartarla (tras el corte admin y sitio comparten proceso) queda con Juan. |
| 23 | Una respuesta escrita de Juan por cada excepción y diferencia (tarea 3) | **ABIERTO** | No ejecutada. Necesita las respuestas por ID que se piden en el checkpoint. Sin ellas no hay confirmación del merge en 57-10. |

## Qué queda abierto

Bloquea el merge hasta que Juan responda:

1. `CUT-legal-date-efectiva`: la fecha efectiva de privacidad y términos.
2. `54-about`: cargar el alt EN de la foto de Sobre mí (escritura aditiva en Media) o aceptar la excepción.
3. `/blog/general (palabras)` y `/en/blog/general (palabras)`: aceptar la diferencia o pedir corrección.

No bloquea, pero Juan debe verlo: los 10 ítems `propuesto` de la fila 14 y el proxy de INP de la fila 15.

## Riesgos y puntos abiertos conocidos

- **CAL-01 no está cumplido.** La revisión con NVDA, VoiceOver, 375/900/1024/1280 px, zoom al 200% y teclado, que ninguna herramienta reemplaza, queda aplazada a producción por decisión explícita de Juan. axe cubre solo una parte de WCAG (T-57-34: falso verde por dar CAL-01 con solo axe). Mientras no se haga, CAL-01 se considera pendiente, no resuelto, y cualquier hallazgo de severidad "bloquea" aparecerá con el sitio ya publicado, no antes del corte. El rollback de `57-ROLLBACK.md` es la salida si pasa.
- **T-55-15 sin probar en vivo**: la revalidación de admin a preview no se ejercitó. Tras el corte admin y sitio comparten proceso, así que el riesgo baja, pero la prueba no existe.
- **Falso positivo intermitente** de `53-computed-styles` sin causa leída (fila 13).
- **Producción mantiene su F4** (14 enlaces a gemelos EN noindex, `/en/sitemap.html` con 404) hasta el corte.
