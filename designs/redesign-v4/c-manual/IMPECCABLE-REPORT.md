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
