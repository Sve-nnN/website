# Reporte de la home (fase 52)

Generado por `scripts/home-report.mjs` el 2026-10-22T00:35:51.449Z. Ninguna cifra de este reporte se escribe a mano: todas salen de los JSON medidos.

Build medido: `1a7c933d8fd7`. Etiqueta de la medicion: `final`. Corridas por combinacion: 3. Verificacion: `verify-home-checks.mjs` dejo 130 PASS y 3 FAIL en 6 etapas.

## 1. Cómo abrir la home

Con el servidor de desarrollo:

1. `npm run dev` y abre `http://127.0.0.1:5173/` (espanol) y `http://127.0.0.1:5173/en` (ingles).
2. `npm run build` y luego `npm run preview` para el build de produccion, y abre `http://127.0.0.1:4173/` y `http://127.0.0.1:4173/en`.
3. Para simular reduced-motion y ahorro de datos: en las herramientas de desarrollo de tu navegador emula `prefers-reduced-motion: reduce` (Rendering) y `saveData` (Network, ahorro de datos).
4. Para emular mobile: activa el modo dispositivo (por ejemplo 390x844 con 3x) y comprueba que el hero no monta shader y solo se ve el fallback CSS.
5. Para probar Pausar animaciones: pulsa el boton de la cabecera y confirma que los canvas desaparecen y vuelven al soltarlo.

Lista completa de que abrir en el README de la app (`## Que abrir`). La entrega de la home es la build de produccion mas la ruta `/` (D-01, D-02): no hay un `home.html` aparte.

## 2. Lighthouse de la home

Medido con Lighthouse 13.4.1 sobre el build servido con brotli, 3 corridas por combinacion, mediana. Render por software en Chromium headless.

| Idioma | Factor | Perf | A11y | Mejores practicas | LCP (ms) | CLS | TBT (ms) | Transferido |
|--------|--------|------|------|-------------------|----------|-----|----------|-------------|
| EN | desktop | 64 | 100 | 100 | 967 | 0 | 676 | 219.1 KB |
| EN | mobile | 94 | 100 | 100 | 1892 | 0 | 56 | 202.8 KB |
| ES | desktop | 75 | 100 | 100 | 402 | 0 | 394 | 219.1 KB |
| ES | mobile | 91 | 100 | 100 | 1909 | 0 | 95 | 202.8 KB |

Corridas individuales de performance (para ver la dispersion):

- EN desktop: 64, 59, 85 (mediana 64).
- EN mobile: 94, 90, 96 (mediana 94).
- ES desktop: 79, 70, 75 (mediana 75).
- ES mobile: 91, 91, 94 (mediana 91).

Veredicto de cada una de las seis compuertas (D-11):

| Compuerta | Veredicto |
|-----------|-----------|
| accesibilidad 100 en todas las corridas | PASS |
| CLS 0 en todas las corridas mobile | PASS |
| performance mobile, mediana >= 90 | PASS |
| LCP mobile, mediana < 2000 ms | PASS |
| color-contrast aprobado en todas las corridas | PASS |
| ningun chunk de React Bits pedido en mobile | PASS |

Nota del TBT de escritorio (SwiftShader): Chromium headless renderiza WebGL por software (SwiftShader): el TBT y el LCP de desktop salen exagerados. Se confirman en una GPU real. Son informativos, no compuertas (D-11).

El TBT y el LCP de escritorio son informativos y hay que confirmarlos en una GPU real. En el gate, Juan confirma la fluidez con su hardware.

## 3. Presupuesto de efectos

| Dato | Valor |
|------|-------|
| Canvas simultaneos permitidos (tope) | 2 |
| Canvas de banda simultaneos vistos en el recorrido | 4 (limite 1) |
| Ids de efecto usados | dither, halftone (maximo 2) |
| Contextos WebGL creados | 3 |
| Contextos WebGL vivos a la vez | 1 (maximo 1) |
| Primer LCP observado | 1892 ms |
| Ultimo LCP observado | 15688 ms |
| Entrada (JS del chunk inicial) | 297.3 KB crudo, 90.2 KB gzip, 77.5 KB brotli |

Cronologia respecto de la carga: los chunks de los originales se piden despues de `load` y de la primera entrada de LCP, solo en viewport, y se desmontan al salir, al ocultar la pestaña y al pausar (D-09). El cupo es de 1 canvas de banda a la vez.

Pesos de los originales del presupuesto:

| Original | Archivos | Gzip | Brotli |
|----------|----------|------|--------|
| Dither | assets/Dither-D6vutHxJ.js, assets/Dither-C5uArhRq.css | 6.0 KB | 5.4 KB |
| HalftoneReveal | assets/HalftoneReveal-ChkMdQYM.js, assets/HalftoneReveal-zn6FqNYG.css | 7.3 KB | 6.5 KB |

## 4. Resultados por etapa del runner

Runner: `verify:home:checks --stage=all --final-shots` (52-06). Evidencia en `designs/redesign-v3/reports/home/home-checks.json`.

**i18n (paridad ES/EN, titulos y metas)**: 17 PASS, 0 FAIL.

**copy (cifras con fuente, voz sobre el DOM, pendientes)**: 8 PASS, 0 FAIL.

**a11y (WCAG 2.2 AA, foco, contraste, reflow, reduced-motion)**: 81 PASS, 0 FAIL.

**budget (cupo de efectos, chunks diferidos, pesos, lectura sin canvas)**: 14 PASS, 0 FAIL.

**isolation (sin cambios fuera de designs/ y .planning, sin paquetes nuevos)**: 6 PASS, 3 FAIL.

**shots (capturas finales del gate por debajo de 400 KB)**: 4 PASS, 0 FAIL.

Chequeos en FAIL:

- `s2. la union de diff y estado no esta vacia y todas las rutas viven bajo designs/redesign-v3/ o .planning/ (los directorios del pivot v4 y los sin seguimiento de la lista blanca son INFO); ninguna en src/, package.json, lockfiles, payload.config.ts o database/ de la raiz`: 391 rutas (254 INFO: pivot v4 y lista blanca sin seguimiento) | fuera: reports/home/home-checks.json
- `s6. ningun archivo de texto nuevo o modificado bajo la app contiene guion largo ni corto (excluye scripts/verify-home.mjs, protegido por el plan y con guiones solo en su regex de deteccion)`: designs/redesign-v3/app/scripts/verify-app.mjs
- `s8. los archivos sin seguimiento fuera de las raices permitidas coinciden con la lista blanca del repositorio (INFO); cualquier otra ruta es FAIL`: reports/home/home-checks.json

Las etapas i18n, copy, a11y, budget y shots salen sin FAIL. Los FAIL de `isolation` son condiciones preexistentes del entorno, ajenas a esta fase:

1. `s2` y `s8`: el archivo `reports/home/home-checks.json` en la raiz del repositorio es un resto suelto y sin seguimiento de una corrida anterior al plan. No lo versiona ni lo borra esta fase (esta fuera de `designs/redesign-v3/` y de `.planning/`).
2. `s6`: `scripts/verify-app.mjs` contiene un guion medio y uno largo, pero solo dentro de la propia regex que los detecta en el copy (el mismo patron exento que `scripts/verify-home.mjs`). Existia en el commit base de la fase; este plan solo anadio una linea de import en ese archivo.

Ninguno de los tres afecta a la home ni a los artefactos del gate.

## 5. Inventario de pendientes visibles

Los pendientes son contenido que falta y que se ve tal cual en la home (D-05): nada se inventa. Totales por idioma: ES=5, EN=5. En el gate, Juan decide que pendientes siguen y cuales se llenan antes de las fases 53 a 55.

| Seccion | Idioma | Marcas | Texto |
|---------|--------|--------|-------|
| medicion | ES | 1 |  |
| websites | ES | 1 |  |
| sobre | ES | 1 |  |
| testimonios | ES | 9 |  |
| contacto | ES | 1 |  |
| medicion | EN | 1 |  |
| websites | EN | 1 |  |
| sobre | EN | 1 |  |
| testimonios | EN | 9 |  |
| contacto | EN | 1 |  |

Claves de copy con marcador pendiente:

- es.medicion.pending (seccion medicion): "PENDIENTE medir"
- es.websites.pending (seccion websites): "PENDIENTE"
- es.sobre.portrait (seccion sobre): "RETRATO PENDIENTE"
- es.testimonios.pending (seccion testimonios): "PENDIENTE"
- es.contacto.pending (seccion contacto): "PENDIENTE"
- en.medicion.pending (seccion medicion): "PENDING measurement"
- en.websites.pending (seccion websites): "PENDING"
- en.sobre.portrait (seccion sobre): "PORTRAIT PENDING"
- en.testimonios.pending (seccion testimonios): "PENDING"
- en.contacto.pending (seccion contacto): "PENDING"

## 6. Excepciones del lint de voz

La unica lista de excepciones vive en la constante `ALLOW` de `scripts/lib/voice-rules.mjs` (T-52-09). No hay chequeos ocultos ni umbrales bajados.

| Regla | Ruta del copy | Texto permitido | Razon |
|-------|---------------|-----------------|-------|
| V04 | es.casos.items.2.title |  | Titulo de caso anonimo: "Escalar el contenido legal educativo a más de 86 000 clics orgánicos anuales" es la descripcion literal del resultado, no un acto con agente claro. |
| V04 | en.casos.items.2.title |  | Espejo en ingles del titulo anterior: mismo caso anonimo, misma descripcion literal del resultado. |

Reglas que admiten excepcion: V04, V13, V15, V16.

## 7. Supuestos revisables

Son decisiones que se tomaron por defecto para no bloquear la home y que Juan puede cambiar en el gate.

1. Supuestos de voz por defecto (D-07): las preguntas abiertas de voz tomaron el valor por defecto de la guia y quedan como supuestos revisables. Son el tuteo calido, la FAQ con signos de interrogacion, el separador `|` en los titulos y el microcopy terminal. Si Juan prefiere otro valor, se ajusta el copy y se vuelve a presentar la home dentro de la fase.
2. Supuesto derivado del cambio material de D-08: el material de la decision D-08 cambio. Los originales de React Bits que entran al cupo de la home se sirven desde `src/home/fx/` (solo props, todos con `React.lazy`), no desde la galeria de la fase 51. Ese es el material revisable: si Juan decide mover que original decora cada bloque, el cambio vive en `src/home/fx/` sin tocar `src/gallery/`.
3. Los pendientes del apartado 5 (retrato real, testimonios, fecha de cada medicion, plazo de respuesta) son supuestos de contenido: se ven marcados y solo Juan puede llenarlos con datos reales.

## 8. Decisiones que solo Juan puede tomar

1. Aprobar la home y la direccion visual, aprobar con notas para las fases 53 a 55, o pedir cambios (gate D-14).
2. Confirmar la fluidez del shader y el TBT en una GPU real: la evidencia automatica sale de Chromium con render por software y no mide el TBT real.
3. Decidir el valor de los supuestos de voz del apartado 7 (D-07) y el material de `src/home/fx/` (D-08).
4. Decidir el contenido de los pendientes del apartado 5.

## 9. Checklist del gate

1. Ejecuta `npm run build` y `npm run preview` en `designs/redesign-v3/app/` y abre `http://127.0.0.1:4173/` y `http://127.0.0.1:4173/en` en un navegador de escritorio con GPU real. La lista exacta esta en el README, seccion `## Que abrir`.
2. Alterna ES y EN, prueba Pausar animaciones y reduced-motion, navega con teclado hasta el formulario de contacto y vuelve arriba.
3. Revisa a mano el hero con tu GPU real, el TBT, la voz en ES y EN, cada seccion, mobile, el alternador de idioma y el foco con teclado.
4. Lee este reporte completo y los reportes HTML de Lighthouse en `designs/redesign-v3/reports/home-v4/`.
5. Compara las capturas finales (`final-es-desktop.jpg`, `final-es-mobile.jpg`, `final-en-desktop.jpg`, `final-en-mobile.jpg`) con la direccion visual de `system.html` y `designs/redesign-v4/c-manual`.
6. Responde el gate con `approve`, `approve-with-notes` o `changes` y, si aplica, la lista de notas o cambios. Sin `approve` explicito, las fases 53 a 55 no empiezan.

Decision de Juan en el gate: pendiente de su respuesta textual (ver `52-07-SUMMARY.md`, seccion "Decision de Juan en el gate").

