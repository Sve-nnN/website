# Informe de Impeccable: mockup v4 C editorial, iteración 2

Método: critique y audit corrieron en un solo contexto (sin subagentes aislados, porque esta tarea ya corre dentro de un subagente). Banner: DEGRADED single-context. El detector determinista `impeccable detect` sí corrió sobre `index.html`. PRODUCT.md existe (portfolio bilingüe, modo Persuade, éxito = el visitante contrata o escribe). DESIGN.md no existe.

## Resumen de la crítica
- Especificidad: alta. Crema, tomate, girasol, bosque, bordes gruesos y sombras duras pertenecen a este sitio. El sello circular es la firma.
- Mayor oportunidad (P1): demasiado texto puro y poca evidencia visual. Se resolvió con iconos, diagramas, capturas reales y mockups de dispositivo.

## Hallazgos y estado
| Sev | Hallazgo | Estado |
|---|---|---|
| P1 | Botón fijo "Pausar animaciones" tapaba texto abajo a la izquierda | Corregido: pasó a la barra superior (44 px, aria-pressed, siempre visible) |
| P1 | Nav móvil mostraba solo la marca | Corregido: botón de menú con aria-expanded, foco atrapado, Escape y retorno del foco |
| P1 | LCP 1.7 s simulado y riesgo de subir por la animación de entrada | Corregido: título visible desde el primer pintado, solo transform, @font-face en línea, preload solo en http |
| P1 | `label-content-name-mismatch` (aria-label de la marca) | Corregido: se quitó el aria-label |
| P1 | Numerales 01 a 09 y chip "NN / 09" | Corregido: eyebrow con icono y nombre de sección; nav con aria-current |
| P2 | Array (puntos) usada en cifras, h3 y botones | Corregido: solo h1 y h2 |
| P2 | Animación de clip-path en secciones (no compuesta) | Corregido: eliminada |
| P2 | `transition: padding` en summary (detector) | Corregido |
| P2 | Icon tile sobre h3, patrón plantilla (detector) | Mitigado: el icono va al lado del título |
| P2 | Etiqueta del hero en mayúsculas largas (detector) | Corregido |
| P2 | El texto del sello giratorio era el LCP por la carga de Geist Mono | Corregido: fuente del sistema solo en ese texto |
| P3 | Hover 2.0:1 sol sobre tomate (detector) | Falso positivo: icono decorativo sol sobre ficha ink |
| P3 | Mayúsculas en sellos PENDIENTE de 46 caracteres | Se queda: son etiquetas de estado |
| P3 | Tracking .1em en el texto circular del sello | Se queda: decorativo, aria-hidden |
| P3 | Cramped padding en hero y badge | Falso positivo |
| P3 | La J de Array se lee como l en "Soy Juan" | Se queda: es el glifo de la fuente, decisión de Juan |
| P3 | SEO 63 en Lighthouse | Se queda: noindex es intencional en la maqueta |

## Limitaciones
- Sin subagentes aislados ni overlay en navegador.
- `polish` se aplicó de forma manual en la tanda final (espaciados, contraste, estados), sin pasada separada.

## Iteración 3: AI tells detectados y eliminados

Impeccable no marcó casi ninguno de estos. Los detecté a mano sobre diseño y copy, con la skill humanizer calibrada contra `research/voice-sample-juan.md` y `research/voice-and-tone-juan.md`.

Diseño
1. Eyebrows: etiqueta mono con icono sobre cada titular (Medición, Servicios, Casos, Proceso, Websites, Sobre mí, Testimonios, FAQ, Contacto), chip sobre el H1 y "Siguiente paso" en el footer. Eliminados, con su CSS.
2. Etiquetas pequeñas sobre cada figura ("Esquema de panel", "Árbol de rastreo", "Capas de mi stack"). Eliminadas junto con las figuras de texto.
3. Cuadrado de icono sobre cada titular de servicio y fichas de icono en las medidas y en el footer. Quité las fichas. En el footer queda un icono suelto.
4. Iconos grandes fantasma repetidos al fondo de cada tarjeta. Eliminados.
5. Cuatro medidores idénticos en fila. Ahora LCP domina, CLS e INP son medianos y TTFB ocupa una franja horizontal.
6. Cuadrícula de tres casos idénticos. Ahora es un bento con una pieza grande (+406, gráfico de línea que se redibuja), una mediana, una pequeña, una nota y un enlace al listado.
7. Monotonía de borde grueso con sombra dura en todos los bloques. La sombra dura queda solo en botones, sello, cita destacada, formulario, tarjeta de auditoría y como respuesta al hover. Tarjetas de testimonio con borde de 2 px.
8. Cinta adhesiva, sello circular sobre el retrato, cubos sueltos, flecha dibujada junto al CTA, cuadrados flotantes del hero y rotaciones de tarjetas: todos decoración sin función. Eliminados. El único sello que queda es el del hero.
9. Fila de flujo (chips con flechas) que repetía el proceso justo encima de los pasos. Eliminada.
10. Etiqueta "Muestra ilustrativa" repetida en cada medidor. Queda una sola nota PENDIENTE.
11. Los mismos cuatro colores en rotación fija por sección. Reordené los fondos (sol, papel, bosque, papel, tomate, papel, bosque, papel, sol) y cada tarjeta del bento cambia de fondo al hover.
12. Gráficos con función: las barras de casos usan la proporción real (409 contra 100, 183 contra 100), la línea del +406 termina en proporción 5,06 y el stack isométrico vive dentro de la tarjeta de desarrollo con etiquetas por capa. El esquema de panel y el árbol de rastreo se eliminaron por pedido de Juan.
13. Pestañas de sección sin funcionar como pestañas: se mantienen solo el nav y la barra de progreso.

Copy
14. Titulares con fórmula "Lo que...", "Cómo...", "Qué... y cómo...", comas y dos puntos. Ahora: Medición antes de tocar el código; Servicios de SEO técnico y desarrollo; Resultados en Search Console; Mi proceso de la auditoría a la medición; Ingeniero de software que trabaja el SEO; Clientes que trabajaron conmigo. Sin punto ni coma.
15. Pares "no X sino Y": "y no como parche al final", "no en el diseño", "no por cantidad de avisos", "Un TTFB alto empieza en el servidor, no en el diseño". Reescritos como afirmaciones directas.
16. Frase de promoción vacía: "Aprende a leerlas". Eliminada.
17. Lista de tres con ritmo uniforme en el lede del hero ("audito, corrijo y mido"). Ahora es una frase continua y concreta con Search Console.
18. Titular del footer "Empieza con una auditoría que se acredita al trabajo" y su párrafo duplicado. Ahora: Auditoría técnica por 600 USD acreditables.
19. Negritas y mayúsculas decorativas: quité las mayúsculas de las etiquetas largas. Los sellos PENDIENTE y de maqueta conservan mayúsculas porque son estado funcional.
20. Sin emojis ni símbolos de adorno. Sin em dash ni en dash en todo el HTML (verificado con grep).

Revisión humanizer
Primera pasada: frases de longitud pareja y arranque idéntico ("Reviso... Entrego..."). Segunda pasada: mezclé frases largas con cláusulas y una corta en el lede, y quité los cierres genéricos. Se mantienen primera persona, sin voseo, sin "nosotros" y sin voz pasiva.

Revisar en Juan
- Las cuatro tarjetas del bento de servicios siguen siendo cuatro colores planos. Lo cambiaría si hay una paleta secundaria.
- La J de Array se lee como "l" en "Juan" dentro de titulares.
