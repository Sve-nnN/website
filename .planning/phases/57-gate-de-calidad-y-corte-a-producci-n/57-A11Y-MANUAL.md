# Revisión manual de accesibilidad (fase 57, checkpoint del plan 57-09)

Juan, esta lista cubre lo que ningún script prueba bien. El barrido automático (`scripts/verify/57-a11y-sweep.mjs`) ya corre axe con WCAG 2.2 AA y un recorrido de Tab en cada plantilla, en ES y EN, a 375 y 1280 px. Lo que sigue necesita ojos, oídos y un lector de pantalla de verdad.

Fuente: A11Y.md de fecarrico, versión 2.5.0 (WCAG 2.2 AA, perfil Standard). Cada ítem cita la sección de A11Y.md y el criterio WCAG que cubre. Todas las URLs apuntan al preview.

## Antes de empezar

- Usa el preview: https://dev.juan-tech.com (lleva `noindex` a propósito).
- Ten a mano la última salida de `57-a11y-sweep.mjs`. Si marca algo, revísalo primero en pantalla.
- Hallazgo automático previo (2026-11-17): en la home, los botones y enlaces con forma de botón de MUI (botones de llamada a la acción, chips de commits, acordeones de servicios y de preguntas frecuentes) no muestran un anillo de foco de 2 px. ButtonBase de MUI anula el `outline` del tema y solo deja el ripple o un cambio de fondo. Confírmalo con tus ojos en el punto 1: si el foco no se ve con claridad, va como ALTA.
- Severidad, según A11Y.md sección 1: CRÍTICA bloquea la tarea (teclado roto, foco perdido); ALTA afecta percepción o lectura (contraste, foco poco visible); MEDIA resta eficiencia; BAJA es pulido.

## Plantillas y URLs

| Plantilla | ES | EN |
|---|---|---|
| Home | https://dev.juan-tech.com/ | https://dev.juan-tech.com/en |
| Servicios, índice | https://dev.juan-tech.com/servicios | https://dev.juan-tech.com/en/services |
| Servicio, detalle | https://dev.juan-tech.com/servicios/seo-technical-audit | https://dev.juan-tech.com/en/services/seo-technical-audit |
| Landing Lima | https://dev.juan-tech.com/seo-tecnico-lima | https://dev.juan-tech.com/en/seo-tecnico-lima |
| Landing Madrid | https://dev.juan-tech.com/seo-tecnico-madrid | https://dev.juan-tech.com/en/seo-tecnico-madrid |
| Blog, índice | https://dev.juan-tech.com/blog | https://dev.juan-tech.com/en/blog |
| Blog, categoría | https://dev.juan-tech.com/blog/seo | https://dev.juan-tech.com/en/blog/seo |
| Blog, post | https://dev.juan-tech.com/blog/seo/estrategia-seo | https://dev.juan-tech.com/en/blog/seo/estrategia-seo |
| Casos, índice | https://dev.juan-tech.com/case-studies | https://dev.juan-tech.com/en/case-studies |
| Caso, detalle | https://dev.juan-tech.com/case-studies/immigration-law-atlanta-seo | https://dev.juan-tech.com/en/case-studies/immigration-law-atlanta-seo |
| Websites, índice | https://dev.juan-tech.com/websites | https://dev.juan-tech.com/en/websites |
| Website, detalle | https://dev.juan-tech.com/websites/juan-tech-com | https://dev.juan-tech.com/en/websites/juan-tech-com |
| Autores, índice | https://dev.juan-tech.com/authors | https://dev.juan-tech.com/en/authors |
| Autor, perfil | https://dev.juan-tech.com/authors/juan-carlos-angulo | https://dev.juan-tech.com/en/authors/juan-carlos-angulo |
| Sobre mí | https://dev.juan-tech.com/sobre-mi | https://dev.juan-tech.com/en/sobre-mi |
| Contacto | https://dev.juan-tech.com/contact | https://dev.juan-tech.com/en/contact |
| Stack | https://dev.juan-tech.com/stack | https://dev.juan-tech.com/en/stack |
| Búsqueda | https://dev.juan-tech.com/search | https://dev.juan-tech.com/en/search |
| Privacidad | https://dev.juan-tech.com/privacy | https://dev.juan-tech.com/en/privacy |
| Términos | https://dev.juan-tech.com/terms | https://dev.juan-tech.com/en/terms |
| 404 | https://dev.juan-tech.com/no-existe | https://dev.juan-tech.com/en/no-existe |

Si te falta tiempo, prioriza home, servicio detalle, post, caso detalle, contacto y búsqueda en ES, y la home en EN. Esas seis concentran los componentes que se repiten en el resto.

## 1. Teclado y foco (CRÍTICA si falla)

Sin ratón. Tab, Mayús+Tab, Enter, Espacio, flechas y Escape.

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

## 2. NVDA con un navegador de escritorio (Windows, Firefox o Chrome)

- [ ] Con H recorres los encabezados: un solo H1 por página y una jerarquía sin saltos (H2, luego H3). WCAG 1.3.1.
- [ ] Con D recorres las regiones: cabecera, navegación, principal y pie, con nombres que distinguen las dos navegaciones si hay más de una. WCAG 1.3.1.
- [ ] Con K recorres los enlaces: cada uno dice adónde lleva fuera de contexto. "Ver servicio" repetido cinco veces sin más detalle cuenta como MEDIA. WCAG 2.4.4.
- [ ] Los enlaces que abren pestaña nueva lo anuncian. WCAG 3.2.5.
- [ ] Los pasajes en otro idioma (nombres de herramientas, citas en inglés dentro del sitio en español) se leen con la voz correcta, o al menos sin quedar ininteligibles. A11Y.md sección 3, Language; WCAG 3.1.2.
- [ ] Las imágenes decorativas no se anuncian y las informativas dicen lo que aportan (ver punto 6).
- [ ] El formulario de contacto anuncia etiqueta, obligatoriedad y error de cada campo.
- [ ] Las métricas de los casos (cifras grandes con su leyenda) se leen como una frase con sentido, no como números sueltos.

## 3. VoiceOver en macOS (Safari) y en iOS (Safari)

- [ ] macOS: con el rotor (Control+Opción+U) revisa encabezados, enlaces, regiones y controles de formulario en home, post y contacto. Mismos criterios del punto 2.
- [ ] iOS: con deslizamientos a la derecha recorres la home completa en orden lógico, sin elementos invisibles que se anuncien ni botones sin nombre.
- [ ] iOS: el menú móvil y el selector de idioma se abren con doble toque, el foco entra en ellos y sale al cerrarlos.
- [ ] iOS: el formulario de contacto se completa y se envía solo con VoiceOver (usa datos de prueba y hazlo solo en el preview: ahí el formulario valida y muestra el éxito, pero no manda correo).
- [ ] Control por voz (macOS o iOS, "Mostrar nombres"): cada botón responde a su texto visible. A11Y.md sección 3, Label in Name; WCAG 2.5.3.

## 4. Anchos: 375, 900, 1024 y 1280 px

En las herramientas de desarrollo, modo responsive, en cada plantilla.

- [ ] 375 px: sin scroll horizontal, sin texto cortado, botones y enlaces de al menos 24 por 24 px (idealmente 44). A11Y.md sección 3, Targets; WCAG 1.4.10 y 2.5.8.
- [ ] 900 px: la cabecera no se monta sobre el contenido y el menú cambia de forma sin perder opciones.
- [ ] 1024 px: tarjetas y columnas no se solapan; las tablas del post y de los casos se leen o tienen su propio scroll con foco.
- [ ] 1280 px: líneas de texto corrido de unos 80 caracteres como máximo. A11Y.md sección 4, Line Length.
- [ ] 320 px (equivale a 400% de zoom en 1280): el contenido se reacomoda sin scroll en dos direcciones. A11Y.md sección 7, Zoom & Reflow; WCAG 1.4.10.

## 5. Zoom al 200%

- [ ] Con Cmd o Ctrl más, hasta 200%, en home, post, caso y contacto: no se pierde texto ni función, nada se superpone y los menús siguen operables. A11Y.md sección 7, Zoom & Reflow; WCAG 1.4.4.
- [ ] Con espaciado de texto aumentado (interlineado 1,5, párrafos 2x, letras 0,12 y palabras 0,16; por ejemplo con el bookmarklet "Text Spacing" de Steve Faulkner) nada queda cortado. A11Y.md sección 3, Text Spacing; WCAG 1.4.12.

## 6. Lo que axe no ve

- [ ] Contraste sobre degradados, fotos y capturas de pantalla (hero, tarjetas de websites, capturas de casos): mide con un cuentagotas (por ejemplo Colour Contrast Analyser) el peor punto, 4,5:1 para texto normal y 3:1 para texto grande e iconos. A11Y.md sección 3, Contrast; WCAG 1.4.3 y 1.4.11.
- [ ] Significado de cada texto alternativo: en home, Sobre mí, casos, websites y autor, cada `alt` dice lo que la imagen aporta en ese contexto, y las decorativas llevan `alt=""` por decisión tuya. La foto de Sobre mí en EN tenía el `alt` vacío según la batería de la fase 56: confírmalo. A11Y.md sección 3, Alt Text y sección 2, Image Evidence; WCAG 1.1.1.
- [ ] Orden de lectura: con el CSS desactivado (Firefox, Ver, Estilo de página, Sin estilo) o con el lector, el contenido se lee en el mismo orden que se ve. WCAG 1.3.2.
- [ ] Color: el estado (activo, error, seleccionado) nunca depende solo del color. Revisa las pestañas del blog y los errores del formulario con un simulador de daltonismo. A11Y.md sección 3, Semantic Redundancy; WCAG 1.4.1.
- [ ] Movimiento reducido: con "Reducir movimiento" activo en el sistema, no hay parallax ni animaciones de entrada y nada se reproduce solo. A11Y.md sección 3, Motion.
- [ ] Contenido sin JavaScript: con JavaScript desactivado, la home, el post y un caso muestran su texto (nada queda en opacidad 0 esperando un script). A11Y.md sección 6, Content Held Hostage by JavaScript.
- [ ] Títulos de pestaña únicos y con lo específico primero en cada plantilla. A11Y.md sección 3, Page Title; WCAG 2.4.2.

## Hallazgos

Pega aquí cada hallazgo. Severidad: CRÍTICA, ALTA, MEDIA o BAJA (A11Y.md sección 1). Lo que quede sin corregir antes del corte necesita una excepción con tu nombre (D-04).

| # | Plantilla y URL | Ancho o tecnología | Qué pasa | Criterio | Severidad | Decisión |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |
| 5 | | | | | | |
