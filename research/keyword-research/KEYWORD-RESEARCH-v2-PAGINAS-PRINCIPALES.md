# Keyword Research v2 — Servicios, Blog y Categorías

**Fuente:** Ahrefs Keywords Explorer vía MCP (`keywords-explorer-overview`), país `es` (España).
**Fecha:** 2026-08-17
**Alcance:** las páginas que el research de julio (`KEYWORD-RESEARCH.md`) nunca cubrió — índice de
servicios, las 4 landings de servicio, índice de blog, las 5 categorías, casos de éxito.

## Nota de mercado

Se midió contra **España**, no Perú. Razón: es el mercado hispanohablante con volumen y CPC
medibles en Ahrefs, y el sitio ya tiene una landing local apuntando a Madrid. Si el objetivo
comercial real es Perú/LatAm, estos volúmenes hay que re-medirlos con `country=pe` antes de
decidir: los picks cambiarían.

Advertencia de método: Ahrefs da **350/mes** para "seo tecnico" donde DinoRank dio 260 en julio.
Fuentes distintas, cifras distintas. No mezclar las dos tablas como si fueran comparables.

## Picks propuestos

| Página | Keyword | Vol/mes | KD | Tráfico pot. | Intención | Por qué |
|---|---|---|---|---|---|---|
| `/servicios` | **consultor seo** | 3700 | 0 | 1900 | comercial + transaccional | El hallazgo grande. Volumen alto, dificultad cero, intención de contratación directa. |
| `/servicios/seo-technical-audit` | **auditoría seo** | 1400 | 0 | 500 | comercial | Ver nota abajo sobre el genérico vs el específico. |
| `/servicios/seo-consulting` | **consultoría seo** | 800 | 0 | 10 | comercial + local | Volumen decente pero tráfico potencial de 10: es un término de destino único, no de cluster. |
| `/servicios/fullstack-development` | **desarrollo full stack** | 150 | 0 | 450 | comercial | Tráfico potencial 3x su volumen propio, o sea entra a un cluster mayor. |
| `/servicios/ai-seo-geo` | **geo seo** | 450 | 5 | 150 | comercial | Global 16.000. Categoría joven, dificultad baja, ventana abierta. |
| `/blog/seo` | **estrategia seo** | 700 | 31 | **4400** | informacional | El mejor tráfico potencial de todo el set. Ya es el título de la categoría. |
| `/blog/tech-seo` | **core web vitals** | 900 | 24 | 400 | informacional | Global 26.000. Encaja con el contenido real de la categoría. |
| `/blog/cs-fundamentals` | **estructuras de datos** | 100 | 0 | 20 | informacional | Match directo con los posts que ya existen (tablas hash, pilas y colas, recursividad). |
| `/blog/development` | **next js** | 2000 | 0 | 4400 | informacional, de marca | Ver advertencia abajo. |
| `/case-studies` | **casos de éxito seo** | 100 | — | — | comercial | Volumen bajo pero intención exacta. Es página de conversión, no de tráfico. |

## Tres cosas que cambian decisiones

**1. El genérico le gana al específico, y por mucho.**

| Término | Volumen |
|---|---|
| auditoría seo | 1400 |
| auditoría seo técnica | 70 |
| agencia seo técnico | 90 |

Veinte veces más volumen en el genérico. El instinto de apuntar al término más específico
porque "es más relevante" cuesta caro acá. Vale además para el research de julio: el Home tiene
asignado "seo técnico" (350) cuando "consultor seo" (3700) está a KD 0 y con intención comercial.

**2. `/blog` como índice no tiene keyword que valga.**
"blog seo tecnico" da 10/mes, "blog desarrollo web" da 30. No hay término real detrás. El índice
del blog debería optimizarse para navegación y marca, no forzarle una keyword. Las categorías
son las que cargan el peso.

**3. `next js` para `/blog/development` es tentador y riesgoso.**
2000/mes, KD 0, tráfico potencial 4400. Pero Ahrefs lo marca **branded**: la SERP la dominan
nextjs.org y su documentación. Una categoría de blog no va a competir con la doc oficial.
Sirve como tema paraguas para los posts, no como target de la categoría. Antes de fijarlo hay
que mirar la SERP real, cosa que no hice acá.

## Lo que no se midió

- **Intención de SERP.** El research de julio incluyó un chequeo SerpApi para el Home y ese
  chequeo cambió la decisión (la SERP de "seo técnico" resultó 100% informacional, o sea el Home
  no debería pelearla). Acá no lo repetí para ninguno de los diez picks. **Ninguno debería
  fijarse sin ese paso**, sobre todo "consultor seo" y "auditoría seo", que son los dos que más
  plata valen y donde equivocarse de intención cuesta más.
- **Perú/LatAm**, ver nota de mercado.
- **Canibalización cruzada** entre estos picks nuevos y los cuatro de julio. "consultor seo"
  en `/servicios` y "technical seo consultant" en Home EN son idiomas distintos, así que no
  chocan, pero "auditoría seo" en la landing y "auditoría seo técnico" en la página de autor sí
  se pisan y hay que resolverlo.
- **Las 4 landings locales** (`seo tecnico madrid`, etc.). Tienen JSON crudo de DinoRank en esta
  carpeta desde julio, sin análisis. Quedan pendientes.

## Siguiente paso recomendado

1. Chequear intención de SERP de "consultor seo" y "auditoría seo" antes de fijarlos.
2. Decidir mercado: España o Perú. Cambia toda la tabla.
3. Resolver el solapamiento "auditoría seo" vs "auditoría seo técnico".
4. Recién ahí, cargar los `targetKeyword` y escribir las metas.

## Costo

1.248 unidades de API de Ahrefs, 24 keywords en 3 consultas.
