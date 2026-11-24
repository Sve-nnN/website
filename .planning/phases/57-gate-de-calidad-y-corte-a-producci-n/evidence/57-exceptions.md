# Excepciones y decisiones de Juan (plan 57-09, tarea 3)

Respuestas dadas por Juan en el chat el 2026-11-24. Cada fila guarda su respuesta literal entre comillas, con fecha. Ninguna aceptación se infiere: lo que no tiene respuesta literal aquí sigue abierto (T-57-32).

## Decisiones por fila bloqueante del reporte

| # | ID | Respuesta literal de Juan (2026-11-24) | Decisión | Consecuencia y dueño |
|---|---|---|---|---|
| 1 | `CUT-legal-date-efectiva` | "Hoy, 2026-11-24" | Fecha efectiva de privacidad y términos = día del merge. | 57-11 fija `LEGAL_EFFECTIVE_DATE` con la fecha del día del merge. **Si el merge ocurre otro día que 2026-11-24, 57-11 se detiene y avisa a Juan, no edita.** El ítem sigue en `propuesto` en el código hasta 57-11, así que `56-gate --gate` sale 1 hasta entonces (ver checklist). |
| 2 | `54-about` (alt EN de la foto de `/en/sobre-mi`) | "Escribirlo en 57-10" | Escribir el alt EN en el Media `p54-about-hero` (fila `ALT-about-hero`, ya aprobada). | Escritura aditiva, no se hizo todavía. Se ejecuta en el paso del cargador (57-10 o 57-12, junto a `media-alt`), después de la confirmación del merge y con el respaldo verificado. Ninguna escritura en producción hasta entonces. |
| 3 | `/blog/general (palabras)` y `/en/blog/general (palabras)` | "Acepto la excepción" | Acepta la diferencia de -11,1% (120 contra 135 palabras) y -10,1% (124 contra 138). | Motivo: el texto que falta es el contador "0 artículos" de la categoría vacía y la fila repetida "Otros temas del blog". El copy propio de la página es idéntico. Sin corrección. |
| 4 | Menores (F1, F2, F3, F4, F5, F13, proxy de INP, ítems `propuesto`, T-55-15) | "Acepto todo, ejecuta T-55-15" | Acepta todo lo listado abajo. | Ver desglose. |

## Desglose de la respuesta 4

| Ítem | Estado | Nota |
|---|---|---|
| F1 TTFB y LCP del post | Sin excepción necesaria | Corregido y medido en el preview (57-06). |
| F2 `Critical-CH` y su 307 | Sin excepción necesaria | Corregido. El tema automático del admin se revisa a mano tras el corte. |
| F3 imagen LCP sin `fetchpriority` | Sin excepción necesaria | No aplica: el elemento LCP medido no es una imagen. |
| F4 gemelos EN noindex | Sin excepción necesaria | Corregido en el preview. Producción conserva su F4 hasta el corte. |
| F5 HTML del perfil de autor | Sin excepción necesaria | 360 KB y 354 KB contra un presupuesto de 500 KB. |
| F13 `x-powered-by` | Sin excepción necesaria | Ausente en el preview. |
| Proxy de INP del preview (128 a 160 ms contra 56 a 64 ms en producción) | Aceptado por Juan | Es un proxy de Playwright, no INP de campo, y no entra en la regla max(10%, 50 ms). Se vigila en el monitoreo. |
| 10 ítems `propuesto` del gate de la 56 | Aceptado por Juan, van al handoff | `D-11-lead`, `CUT-cta-master-landings-servicio`, `HEAD-legal`, `HEAD-lecciones`, `MSG-emailCapture-description`, `-alreadyBody`, `-errorBody`, `-privacyPrefix`, `-privacySuffix`, `-pendingBody`. No bloquean. |
| T-55-15 revalidación de admin a preview | Ejecutar tras el corte | Juan pidió "ejecuta T-55-15". Se corre después del corte como cambio inocuo y reversible (agregar y quitar un espacio, sin tocar texto visible) en un Website, un Author y un SpeakingEvent. No se ejecutó en 57-09 y no hay escrituras en producción desde este plan. |

## Lo que sigue abierto y no es una excepción

- **CAL-01 (revisión humana)**: diferida por Juan a producción tras el corte. Literal, 2026-11-24: "con respecto a la revision humana difierela y la reviso todo en produccion." No está hecha. No se da por cumplida (T-57-34).
- **GO-02**: la frase del merge sigue pendiente (plan 57-10, tarea 3).
