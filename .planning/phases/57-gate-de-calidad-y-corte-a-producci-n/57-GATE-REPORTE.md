# Reporte del gate de calidad de la fase 57

Generado: 2026-11-24T06:41:47.073Z. Preview: https://dev.juan-tech.com. Producción: https://juan-tech.com. Commit del repo: 90f8b6f.

Juan, este reporte reúne la medición final del preview contra producción. Todo es lectura por HTTP: no escribe en la base ni envía correos.

## Resumen de una pantalla

Resultado: el corte NO está listo. Hay 5 bloqueo(s), listados en "Bloquea el corte".

| Área | Estado | Bloqueos |
|---|---|---|
| SEO contra producción | **FAIL** | 2 |
| Clases utilitarias en el HTML | PASS | 0 |
| Accesibilidad automática | PASS | 0 |
| Rendimiento contra producción | PASS | 0 |
| Peso del bundle | PASS | 0 |
| Hallazgos F1 a F5 y F13 | PASS | 0 |
| Batería de pasos | **FAIL** | 2 |
| Gate de decisiones de la 56 | **FAIL** | 1 |

Qué pasa: Clases utilitarias en el HTML; Accesibilidad automática; Rendimiento contra producción; Peso del bundle; Hallazgos F1 a F5 y F13.

Qué falla: SEO contra producción (FAIL); Batería de pasos (FAIL); Gate de decisiones de la 56 (FAIL).

Qué necesita tu aceptación: 2 diferencia(s) legítima(s) y 1 decisión(es) pendiente(s).

## Bloquea el corte

| Área | Qué | Causa | Clasificación |
|---|---|---|---|
| SEO | /blog/confirm (estado): el preview responde 500 (producción 200) | El preview responde 500 en /blog/confirm y /en/blog/confirm; producción responde 200 y en 57-06 la URL daba 200. La página la reescribió 57-07 (e682bab y 8783482) y usa Box component={CheckCircle} y Box component={XCircle} dentro de un Server Component: pasa una referencia de componente a un Client Component de MUI, que no es serializable. Es el único uso de component con un icono en src. Causa probable, no reproducida en local porque la página exige la base de datos. Corrección sugerida: poner el icono como hijo (<CheckCircle size={48} aria-hidden /> dentro de un Box) o moverlo a un componente de cliente. Dueño: plan 57-07 | defecto a corregir (código del plan 57-07) |
| SEO | /en/blog/confirm (estado): el preview responde 500 (producción 200) | El preview responde 500 en /blog/confirm y /en/blog/confirm; producción responde 200 y en 57-06 la URL daba 200. La página la reescribió 57-07 (e682bab y 8783482) y usa Box component={CheckCircle} y Box component={XCircle} dentro de un Server Component: pasa una referencia de componente a un Client Component de MUI, que no es serializable. Es el único uso de component con un icono en src. Causa probable, no reproducida en local porque la página exige la base de datos. Corrección sugerida: poner el icono como hijo (<CheckCircle size={48} aria-hidden /> dentro de un Box) o moverlo a un componente de cliente. Dueño: plan 57-07 | defecto a corregir (código del plan 57-07) |
| Batería | 56-run-all --live: 55 regresion: 54 regresion: 54-about da FAIL | /en/sobre-mi no tiene ninguna img con alt no vacío: la foto de Sobre mí tiene alt en ES y alt vacío en EN. Ya figuraba en la línea base de 57-01. La fila ALT-about-hero está aprobada y es cargable, pero el cargador del corte solo escribe el alt de las 6 capturas, no el de p54-about-hero, así que no se resuelve solo en el corte. Arreglarlo exige escribir el alt EN en Media (escritura aditiva en producción), que no se hace desde este plan. Dueño: Juan, antes del corte (plan 57-10 o una carga puntual del alt) | defecto de contenido (carga de un alt en Media) |
| Batería | 56-run-all --live: 55 regresion: 54 regresion: 53-computed-styles da FAIL | Dentro de 56-run-all --live el paso dio 6 PASS y 2 FAIL en 75 s, pero en cuatro corridas aisladas posteriores (tres sueltas y una dentro de 54-run-all) dio 7 PASS y OK en unos 49 s. No se pudo reproducir ni leer el cheque que falló, porque 56-run-all no conserva las líneas internas. No se cambió el script sin una causa visible. Se vuelve a medir en la repetición completa tras corregir /blog/confirm y, si reaparece, 57-08 abre su corrección. Dueño: repetición de la batería tras 57-07 | falso positivo intermitente, sin reproducir |
| Gate de decisiones | CUT-legal-date-efectiva | CUT-legal-date-efectiva: estado pendiente (Fecha efectiva de la politica de privacidad y de los terminos (el dia del corte)); Juan debe responder antes del corte | decisión de Juan |

## Diferencias que aceptas por escrito en 57-09

| Área | Qué | Causa |
|---|---|---|
| SEO | /blog/general (palabras) | Categoría general vacía: el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog" con sus cuatro enlaces. El copy propio de la página es idéntico. Juan lo acepta en 57-09 |
| SEO | /en/blog/general (palabras) | Categoría general vacía: el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog" con sus cuatro enlaces. El copy propio de la página es idéntico. Juan lo acepta en 57-09 |

## SEO por URL

170 de 174 URLs sin diferencias. Enlaces internos revisados: 177, con 0 fallo(s). Redirects revisados: 38, con 0 distinto(s).

| URL | Campo | Diferencia | Clase | Motivo |
|---|---|---|---|---|
| /blog/general | palabras | palabras en main: 120 contra 135 en producción (11.1% menos; tolerancia 2%) | b | Categoría general vacía: el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog" con sus cuatro enlaces. El copy propio de la página es idéntico. Juan lo acepta en 57-09 |
| /en/blog/general | palabras | palabras en main: 124 contra 138 en producción (10.1% menos; tolerancia 2%) | b | Categoría general vacía: el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog" con sus cuatro enlaces. El copy propio de la página es idéntico. Juan lo acepta en 57-09 |
| /blog/confirm | estado | el preview responde 500 (producción 200) | sin-clasificar |  |
| /en/blog/confirm | estado | el preview responde 500 (producción 200) | sin-clasificar |  |

Clase a: defecto a corregir. Clase b: diferencia legítima que Juan acepta en 57-09. Sin clasificar: se trata como defecto.

## Accesibilidad por plantilla

axe 4.12.1 con WCAG 2.2 AA y recorrido de Tab, en ES y EN, a 375 y 1280 px. Cubre una parte de WCAG; el resto va en la revisión manual.

| Plantilla | Páginas medidas | Violaciones axe | Problemas de teclado | Estado |
|---|---|---|---|---|
| home | 4 | 0 | 0 | PASS |
| servicios-indice | 4 | 0 | 0 | PASS |
| servicios-detalle | 4 | 0 | 0 | PASS |
| landing-lima | 4 | 0 | 0 | PASS |
| landing-madrid | 4 | 0 | 0 | PASS |
| blog-indice | 4 | 0 | 0 | PASS |
| blog-categoria | 4 | 0 | 0 | PASS |
| blog-post | 4 | 0 | 0 | PASS |
| casos-indice | 4 | 0 | 0 | PASS |
| casos-detalle | 4 | 0 | 0 | PASS |
| websites-indice | 4 | 0 | 0 | PASS |
| websites-detalle | 4 | 0 | 0 | PASS |
| autores-indice | 4 | 0 | 0 | PASS |
| autores-perfil | 4 | 0 | 0 | PASS |
| sobre-mi | 4 | 0 | 0 | PASS |
| contacto | 4 | 0 | 0 | PASS |
| stack | 4 | 0 | 0 | PASS |
| busqueda | 4 | 0 | 0 | PASS |
| privacidad | 4 | 0 | 0 | PASS |
| terminos | 4 | 0 | 0 | PASS |
| 404 | 4 | 0 | 0 | PASS |

## Rendimiento

Lighthouse móvil, mediana por URL. Regla: LCP, TTFB y TBT del preview no superan producción más max(10%, 50 ms); CLS no supera max(producción, 0,1); accesibilidad de Lighthouse igual a 1.

| URL | LCP preview / prod (límite) | TTFB preview / prod (límite) | TBT preview / prod (límite) | CLS | A11y | Veredicto |
|---|---|---|---|---|---|---|
| / | 2630 ms / 3537 ms (3891 ms) | 248 ms / 240 ms (290 ms) | 58 ms / 12 ms (62 ms) | 0 / 0 | 1 | PASS |
| /en | 2661 ms / 3740 ms (4114 ms) | 258 ms / 249 ms (299 ms) | 25 ms / 51 ms (101 ms) | 0 / 0 | 1 | PASS |
| /servicios/ai-seo-geo | 2594 ms / 3497 ms (3846 ms) | 242 ms / 253 ms (303 ms) | 33 ms / 6 ms (56 ms) | 0 / 0 | 1 | PASS |
| /blog/seo/estrategia-seo | 2585 ms / 4107 ms (4518 ms) | 245 ms / 1558 ms (1714 ms) | 37 ms / 49 ms (99 ms) | 0 / 0.013 | 1 | PASS |

Proxy de INP medido con Playwright (no es INP de campo y no entra en la regla):

| URL | Preview | Producción |
|---|---|---|
| / | 152 ms | 64 ms |
| /en | 160 ms | 56 ms |
| /servicios/ai-seo-geo | 128 ms | 56 ms |
| /blog/seo/estrategia-seo | 144 ms | 56 ms |

## Bundle antes y después del retiro de Tailwind

| Tipo | Antes | Después | Gzip antes | Gzip después | Veredicto |
|---|---|---|---|---|---|
| CSS | 53.5 KB | 8.8 KB | 10.1 KB | 2.1 KB | PASS |
| JS | 1245.6 KB | 1209.5 KB | 406.3 KB | 392.9 KB | PASS |

Clases utilitarias en el HTML: PASS (174 URLs revisadas).

## Hallazgos F1 a F5 y F13

| Hallazgo | Estado | Evidencia |
|---|---|---|
| F1 TTFB y LCP del post con caché | Corregido | 57-headers-check PASS (s-maxage presente y sin no-store en el post) |
| F2 Critical-CH y pista de tema | Corregido | 57-headers-check PASS (sin accept-ch ni critical-ch fuera de /admin) |
| F3 Imagen LCP sin fetchpriority | No aplica | el elemento LCP de las URLs medidas no es una imagen |
| F4 Enlaces a gemelos EN noindex | Corregido | 0 destinos con enlaces a gemelos noindex o rotos |
| F5 HTML del perfil de autor | Corregido | /authors/juan-carlos-angulo: 360441 de 500000 bytes; /en/authors/juan-carlos-angulo: 354390 de 500000 bytes |
| F13 x-powered-by | Corregido | 57-headers-check PASS |

## Pasos de la batería

| Paso | Resultado | Detalle |
|---|---|---|
| 53-crawl-parity | PASS |  |
| 57-seo-parity-all | **FAIL** | FAIL /blog/general [palabras] palabras en main: 120 contra 135 en producción (11.1% menos; tolerancia 2%) / FAIL /en/blog/general [palabras] palabras en main: 124 contra 138 en producción (10.1% menos; tolerancia 2%) |
| 57-legacy-render-sweep | PASS |  |
| 57-headers-check | PASS |  |
| 57-a11y-sweep | PASS |  |
| 57-perf-compare | PASS |  |
| 57-bundle-weight | PASS |  |
| 56-run-all --live | **FAIL** | FAIL 55 regresion: 54 regresion: 54-about (4 PASS, 1 FAIL, 0 WARN lineas, salida 1, 10.0s) / FAIL 55 regresion: 54 regresion: 53-computed-styles (6 PASS, 2 FAIL, 0 WARN lineas, salida 1, 75.1s) |

## Estado del gate de decisiones de la 56

100 decisiones en total. Problemas que impiden el corte: 1. Advertencias (propuesto con gate propuesto, no bloquean): 10.

- Bloquea: CUT-legal-date-efectiva: estado pendiente (Fecha efectiva de la politica de privacidad y de los terminos (el dia del corte)); Juan debe responder antes del corte
- Advertencia: D-11-lead: propuesto con gate propuesto (Lead de la seccion Experiencia (sin la afirmacion del mismo equipo)); anotar en el handoff
- Advertencia: CUT-cta-master-landings-servicio: propuesto con gate propuesto (CTA landings-servicio (lo lee master)); anotar en el handoff
- Advertencia: HEAD-legal: propuesto con gate propuesto (Encabezados numerados de privacidad y términos (25)); anotar en el handoff
- Advertencia: HEAD-lecciones: propuesto con gate propuesto (Encabezados de las lecciones nuevas (2)); anotar en el handoff
- Advertencia: MSG-emailCapture-description: propuesto con gate propuesto (Mensaje emailCapture.description); anotar en el handoff
- Advertencia: MSG-emailCapture-alreadyBody: propuesto con gate propuesto (Mensaje emailCapture.alreadyBody); anotar en el handoff
- Advertencia: MSG-emailCapture-errorBody: propuesto con gate propuesto (Mensaje emailCapture.errorBody); anotar en el handoff
- Advertencia: MSG-emailCapture-privacyPrefix: propuesto con gate propuesto (Mensaje emailCapture.privacyPrefix); anotar en el handoff
- Advertencia: MSG-emailCapture-privacySuffix: propuesto con gate propuesto (Mensaje emailCapture.privacySuffix); anotar en el handoff
- Advertencia: MSG-emailCapture-pendingBody: propuesto con gate propuesto (Mensaje emailCapture.pendingBody); anotar en el handoff

## Lo que revisas a mano

Lista completa de 57-A11Y-MANUAL.md. Ningún script prueba bien estos puntos. Las URLs apuntan al preview.

### 1. Teclado y foco (CRÍTICA si falla)

- [ ] La primera pulsación de Tab muestra "Saltar al contenido" y, con Enter, el foco cae en el contenido principal. A11Y.md sección 3, Operable, Keyboard; WCAG 2.4.1.
- [ ] Ves el foco en cada parada, con un anillo de al menos 2 px y contraste claro contra el fondo, también sobre las tarjetas oscuras y los botones naranjas. A11Y.md sección 4, Focus Indicator; WCAG 2.4.7.
- [ ] El foco nunca queda tapado por la cabecera fija ni por la barra inferior al bajar con Tab. A11Y.md sección 3, Focus; WCAG 2.4.11.
- [ ] El orden de Tab sigue el orden visual: de arriba abajo y de izquierda a derecha, sin saltos raros entre columnas. A11Y.md sección 7, Tab Order; WCAG 2.4.3.
- [ ] Menú móvil (a 375 px): el botón lo abre con Enter, el foco entra al menú, Escape lo cierra y el foco vuelve al botón. El contenido de fondo no recibe foco mientras el menú está abierto. A11Y.md sección 6, Leaked Focus Traps; WCAG 2.1.2.
- [ ] Selector de idioma: abre con Enter o Espacio, las flechas recorren las opciones, Enter cambia de idioma y lleva a la URL equivalente, Escape cierra sin cambiar nada. A11Y.md sección 3, Keyboard; WCAG 2.1.1 y 4.1.2.
- [ ] Acordeones de servicios y de preguntas frecuentes: Enter y Espacio abren y cierran, y el estado abierto o cerrado se anuncia. WCAG 4.1.2.
- [ ] Formulario de contacto (en /contact y en la home): llegas a cada campo con Tab, cada campo tiene su etiqueta visible, un envío con errores lleva el foco o el anuncio al primer error y el éxito se anuncia sin mover el ratón. A11Y.md sección 3, Labels y Dynamic Feedback; WCAG 3.3.1, 3.3.2 y 4.1.3.
- [ ] Búsqueda: escribes, los resultados aparecen y el lector anuncia cuántos hay; llegas a cada resultado con Tab y Enter abre el que elegiste. WCAG 4.1.3.
- [ ] Tras navegar entre páginas sin recarga completa, el foco vuelve arriba o al H1 y el título de la pestaña cambia. A11Y.md sección 3, SPA Routing y Page Title; WCAG 2.4.2.
- [ ] El botón "Pausar animaciones" detiene todo lo que se mueve más de 5 segundos. A11Y.md sección 3, Moving Content; WCAG 2.2.2.

### 2. NVDA con un navegador de escritorio (Windows, Firefox o Chrome)

- [ ] Con H recorres los encabezados: un solo H1 por página y una jerarquía sin saltos (H2, luego H3). WCAG 1.3.1.
- [ ] Con D recorres las regiones: cabecera, navegación, principal y pie, con nombres que distinguen las dos navegaciones si hay más de una. WCAG 1.3.1.
- [ ] Con K recorres los enlaces: cada uno dice adónde lleva fuera de contexto. "Ver servicio" repetido cinco veces sin más detalle cuenta como MEDIA. WCAG 2.4.4.
- [ ] Los enlaces que abren pestaña nueva lo anuncian. WCAG 3.2.5.
- [ ] Los pasajes en otro idioma (nombres de herramientas, citas en inglés dentro del sitio en español) se leen con la voz correcta, o al menos sin quedar ininteligibles. A11Y.md sección 3, Language; WCAG 3.1.2.
- [ ] Las imágenes decorativas no se anuncian y las informativas dicen lo que aportan (ver punto 6).
- [ ] El formulario de contacto anuncia etiqueta, obligatoriedad y error de cada campo.
- [ ] Las métricas de los casos (cifras grandes con su leyenda) se leen como una frase con sentido, no como números sueltos.

### 3. VoiceOver en macOS (Safari) y en iOS (Safari)

- [ ] macOS: con el rotor (Control+Opción+U) revisa encabezados, enlaces, regiones y controles de formulario en home, post y contacto. Mismos criterios del punto 2.
- [ ] iOS: con deslizamientos a la derecha recorres la home completa en orden lógico, sin elementos invisibles que se anuncien ni botones sin nombre.
- [ ] iOS: el menú móvil y el selector de idioma se abren con doble toque, el foco entra en ellos y sale al cerrarlos.
- [ ] iOS: el formulario de contacto se completa y se envía solo con VoiceOver (usa datos de prueba y hazlo solo en el preview: ahí el formulario valida y muestra el éxito, pero no manda correo).
- [ ] Control por voz (macOS o iOS, "Mostrar nombres"): cada botón responde a su texto visible. A11Y.md sección 3, Label in Name; WCAG 2.5.3.

### 4. Anchos: 375, 900, 1024 y 1280 px

- [ ] 375 px: sin scroll horizontal, sin texto cortado, botones y enlaces de al menos 24 por 24 px (idealmente 44). A11Y.md sección 3, Targets; WCAG 1.4.10 y 2.5.8.
- [ ] 900 px: la cabecera no se monta sobre el contenido y el menú cambia de forma sin perder opciones.
- [ ] 1024 px: tarjetas y columnas no se solapan; las tablas del post y de los casos se leen o tienen su propio scroll con foco.
- [ ] 1280 px: líneas de texto corrido de unos 80 caracteres como máximo. A11Y.md sección 4, Line Length.
- [ ] 320 px (equivale a 400% de zoom en 1280): el contenido se reacomoda sin scroll en dos direcciones. A11Y.md sección 7, Zoom & Reflow; WCAG 1.4.10.

### 5. Zoom al 200%

- [ ] Con Cmd o Ctrl más, hasta 200%, en home, post, caso y contacto: no se pierde texto ni función, nada se superpone y los menús siguen operables. A11Y.md sección 7, Zoom & Reflow; WCAG 1.4.4.
- [ ] Con espaciado de texto aumentado (interlineado 1,5, párrafos 2x, letras 0,12 y palabras 0,16; por ejemplo con el bookmarklet "Text Spacing" de Steve Faulkner) nada queda cortado. A11Y.md sección 3, Text Spacing; WCAG 1.4.12.

### 6. Lo que axe no ve

- [ ] Contraste sobre degradados, fotos y capturas de pantalla (hero, tarjetas de websites, capturas de casos): mide con un cuentagotas (por ejemplo Colour Contrast Analyser) el peor punto, 4,5:1 para texto normal y 3:1 para texto grande e iconos. A11Y.md sección 3, Contrast; WCAG 1.4.3 y 1.4.11.
- [ ] Significado de cada texto alternativo: en home, Sobre mí, casos, websites y autor, cada `alt` dice lo que la imagen aporta en ese contexto, y las decorativas llevan `alt=""` por decisión tuya. La foto de Sobre mí en EN tenía el `alt` vacío según la batería de la fase 56: confírmalo. A11Y.md sección 3, Alt Text y sección 2, Image Evidence; WCAG 1.1.1.
- [ ] Orden de lectura: con el CSS desactivado (Firefox, Ver, Estilo de página, Sin estilo) o con el lector, el contenido se lee en el mismo orden que se ve. WCAG 1.3.2.
- [ ] Color: el estado (activo, error, seleccionado) nunca depende solo del color. Revisa las pestañas del blog y los errores del formulario con un simulador de daltonismo. A11Y.md sección 3, Semantic Redundancy; WCAG 1.4.1.
- [ ] Movimiento reducido: con "Reducir movimiento" activo en el sistema, no hay parallax ni animaciones de entrada y nada se reproduce solo. A11Y.md sección 3, Motion.
- [ ] Contenido sin JavaScript: con JavaScript desactivado, la home, el post y un caso muestran su texto (nada queda en opacidad 0 esperando un script). A11Y.md sección 6, Content Held Hostage by JavaScript.
- [ ] Títulos de pestaña únicos y con lo específico primero en cada plantilla. A11Y.md sección 3, Page Title; WCAG 2.4.2.

