# Sistema visual v3

Mockup estático del rediseño de juan-tech.com: tokens, tipografía, efectos, componentes y reportes. Solo HTML, CSS y JavaScript clásico. Sin build, sin CDN, sin React. Las fases 52 a 55 consumen este kit para construir la home y el resto de las páginas.

## Cómo abrirlo

- Con doble clic en `system.html`. Funciona por `file://`.
- Servido, con compresión parecida a producción:

```bash
npx -y serve@14 -l 4173 designs/redesign-v3
```

Luego abre `http://127.0.0.1:4173/system.html`.

## Estructura

```
designs/redesign-v3/
  system.html              biblioteca viva: paleta, tipografía, espaciado, efectos, componentes, catálogo, pesos y contraste
  assets/css/tokens.css    único origen de color, tipografía y espaciado
  assets/css/base.css      fuentes, reset, tipografía base y anillo de foco
  assets/css/components.css  botones, cards, badges, nav, footer, formulario, CRT, ASCII y pausa
  assets/css/effects.css   fallback CSS de cada efecto, visible sin JavaScript
  assets/css/system-doc.css  estilos solo de la página de documentación, no se enlaza en producción
  assets/js/effects.js     slot único de canvas, shaders originales, ticker ASCII, pausa, spotlight y reveal
  assets/js/system-demo.js solo documentación: botones de demo, simulador y formulario de ejemplo
  assets/fonts/            Array, Geist, Geist Mono recortada y Pixel Label, con manifiesto y licencias
  tools/                   verificaciones (ver abajo)
  reports/                 contraste, pesos, Lighthouse y capturas
```

El orden de las hojas es `tokens.css`, `base.css`, `components.css`, `effects.css`. En producción no va `system-doc.css` ni `system-demo.js`.

## Comandos

Todos corren desde la raíz del repo y terminan con código 1 si algo falla.

| Comando | Qué comprueba |
|---|---|
| `node designs/redesign-v3/tools/contrast.mjs` | Calcula los pares de contraste desde `tokens.css`, escribe `reports/contrast.json` y la tabla de `system.html` |
| `node designs/redesign-v3/tools/weight.mjs --online` | Mide bytes crudos, gzip y brotli, compara con los presupuestos y verifica el catálogo contra reactbits.dev |
| `node designs/redesign-v3/tools/verify-states.mjs --stage=all` | Playwright: tracer, fuentes, tokens, fallbacks, efectos y componentes. Con `--shots` deja las ocho capturas finales en `reports/shots/` |
| `node designs/redesign-v3/tools/check-static.mjs` | Landmarks, ids, referencias, nombres accesibles, ASCII, recursos externos, hex sueltos, bucles, excluidos y guiones |
| `node designs/redesign-v3/tools/lh-median.mjs` | Lighthouse mobile y desktop, 3 corridas cada uno, mediana y umbrales |

`verify-states.mjs` usa el Playwright del `node_modules` del repo. `lh-median.mjs` usa `node_modules/.bin/lighthouse` y levanta `serve@14` solo en `127.0.0.1:4173`. Ninguno cambia `package.json` ni los lockfiles.

## Reglas que heredan las fases 52 a 55

1. No redefinas tokens. Cada color, tamaño y espaciado sale de `tokens.css`. Un hex suelto fuera de ese archivo y de los data URI es un error.
2. Usa solo las clases del kit: `.btn`, `.card`, `.badge`, `.nav`, `.site-header`, `.site-footer`, `.form`, `.field`, `.input`, `.crt`, `.ascii-block`, `.pause-toggle`, `.link-inline` y las `.fx-*` de efectos.
3. El texto nunca va directo sobre el gradiente. Siempre va dentro de `.fx-content` (scrim de tinta al 60 por ciento) o sobre un panel sólido.
4. El verde fósforo vive solo sobre tinta o superficies elevadas, para ASCII, cursores y estados.
5. Un canvas activo a la vez y dos por página como máximo. Hoy hay un solo shader permanente (el grano del hero). Los demás efectos son CSS o DOM.
6. Los efectos pesados cargan después de LCP, solo con el elemento en el viewport, y se destruyen al salir.
7. Las superficies de lectura (blog, FAQ, case study) marcan `data-surface="reading"` y solo admiten grano estático o dot grid estático.
8. Un dato que falta se marca con `.badge--pending` y la palabra Pendiente. No se rellena con una cifra inventada.
9. Pausar animaciones (`button[data-fx-pause]` con `aria-pressed` y etiqueta fija) va visible en la cabecera de toda página con movimiento (WCAG 2.2.2).
10. El movimiento nuevo vive bajo `prefers-reduced-motion: no-preference` y `:root:not([data-motion="reduced"]):not([data-saver="on"])`. Ningún bucle dura menos de 1 s.
11. Los anchos de texto van en `rem`, no en `ch`. La unidad `ch` cambia 17 por ciento cuando carga Geist y reacomoda los renglones (CLS medido). `--measure` vale 42rem, unas 80 letras de texto corrido.
12. Si un componente cambia de ancho al cargar una fuente y tiene vecinos, fija el ancho de su caja (`min-width`) para que el swap no mueva a nadie.
13. Los encabezados no llevan punto, coma, dos puntos ni signos de cierre. El texto visible sigue `research/voice-and-tone-juan.md`: primera persona del singular, español neutro, sin guiones largos ni cortos.

## Simular estados en el navegador

`system.html` trae un simulador en `#componentes`. Pone `data-motion="reduced"` o `data-saver="on"` en la raíz y los componentes responden igual que con la preferencia real del sistema. El botón Pausar animaciones de la cabecera hace lo mismo para el movimiento.

## Umbrales de Lighthouse (PERF-03)

| Métrica | Umbral | Dónde |
|---|---|---|
| Accesibilidad | 95 o más | todas las corridas |
| CLS | 0 | todas las corridas |
| Performance | 90 o más | mediana mobile |
| LCP | menos de 2.0 s | mediana mobile |

Mobile mide el fallback CSS porque el viewport emulado de 412 px cae bajo el gate de 767 px. Desktop mide el shader. Una corrida atípica en frío (TBT alto) no invalida la mediana. Si la mediana falla, se corrige el contenido y no el umbral.

## Presupuestos

Los valores viven en `tools/catalog.json` y `weight.mjs` los aplica: `effects.js` 5632 B gzip, `effects.css` 6144 B, CSS del kit 14336 B, JS más CSS 24576 B, fuentes 65536 B crudos y 2048 B por efecto.
