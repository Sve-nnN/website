# Phase 55: Casos, websites, blog y autores - Discussion Log

> **Audit trail only.** No usar como entrada de planificación, investigación o ejecución.
> Las decisiones viven en 55-CONTEXT.md; este registro conserva las alternativas consideradas.

**Date:** 2026-11-08
**Phase:** 55-casos-websites-blog-y-autores
**Mode:** `--auto` (sin preguntas a Juan; cada elección es la opción recomendada)
**Areas discussed:** Lecciones y comparativos de casos, Datos de Websites, Búsqueda del blog, "Ver más" por categoría, Migración y preview de solo lectura, Autores y timeline, Respaldo de la home, Ítems de la revisión 54

[auto] Todas las áreas grises seleccionadas. No había SPEC.md, ni checkpoint, ni planes previos, ni todos coincidentes.

---

## Lecciones aprendidas de casos

| Opción | Descripción | Seleccionada |
|---|---|---|
| Campo `lessons` aditivo, sin sembrar borradores | La vista renderiza solo si hay datos; la fase 56 carga las aprobadas | ✓ |
| Sembrar `case-lessons.ts` del sandbox | Muestra la sección ya, pero publica borradores sin aprobar | |
| Mantener en archivo TS | Rompe la regla de cero datos del sandbox | |

**Elección:** primera opción (auto, a revisar por Juan). **Nota:** el preview no mostrará lecciones hasta la fase 56.

## Casos comparativos

| Opción | Descripción | Seleccionada |
|---|---|---|
| Calcular en servidor desde `results.metrics` | Sin campo ni duplicación | ✓ |
| Campo manual de comparación | Dato duplicado que se desactualiza | |

**Elección:** calcular (auto, a revisar por Juan).

## Websites: puntajes y capturas

| Opción | Descripción | Seleccionada |
|---|---|---|
| Datos de Payload tal cual | No sobrescribe contenido existente | ✓ |
| Sobrescribir con mediciones del sandbox | Cambia filas que `master` sirve en vivo | |

**Elección:** Payload (auto, a revisar por Juan). Tipo de sitio derivado de `stack`, sin campo nuevo.

## Búsqueda del blog

| Opción | Descripción | Seleccionada |
|---|---|---|
| Filtro en cliente sobre lista ligera, HTML completo sin consulta | Rápido, no reduce contenido indexable | ✓ |
| Búsqueda en servidor por parámetro | Más complejo, duplica `/search` | |

**Elección:** filtro en cliente (auto, a revisar por Juan).

## "Ver más" por categoría

| Opción | Descripción | Seleccionada |
|---|---|---|
| Enlace real a `/blog/[category]`, 6 por categoría en el índice | Rastreable, sin JS | ✓ |
| Revelado en cliente | Contenido oculto, riesgo para el conteo indexable | |

**Elección:** enlace (auto, a revisar por Juan).

## Migración y preview de solo lectura

| Opción | Descripción | Seleccionada |
|---|---|---|
| Aditiva, migrar antes de desplegar, verificar rol con patrón A7 | Heredada de la fase 54 | ✓ |
| Desplegar primero | El rol SELECT rompe páginas con campo sin migrar | |

**Elección:** primera (auto, a revisar por Juan).

## Autores y timeline

| Opción | Descripción | Seleccionada |
|---|---|---|
| Reutilizar `@mui/lab` Timeline de la fase 54 | Sin dependencias nuevas | ✓ |
| Lista simple | Pierde el diseño aprobado | |

**Elección:** Timeline (auto, a revisar por Juan). `/authors` y `/sobre-mi` quedan separados.

## Respaldo de la home

| Opción | Descripción | Seleccionada |
|---|---|---|
| Si `featured-content` está vacío, tomar los más recientes de las colecciones | Datos reales, sin escribir en el global | ✓ |
| Dejar vacías las secciones | Home incompleta en el preview | |
| Sembrar `featured-content` | Contenido curado es de Juan | |

**Elección:** respaldo de solo lectura (auto, a revisar por Juan).

## Ítems de `54-REVIEW.md`

**Plegados:** IN-05, IN-06a, IN-07, IN-08, IN-09. **Diferidos:** IN-01, IN-02, IN-03, IN-04 (auto, a revisar por Juan).

## Claude's Discretion

Nombres de archivos, partición en planes, diseño exacto de `lessons`, tarjetas por categoría (6).

## Deferred Ideas

Lecciones aprobadas y `featured-content` curado (56); puntajes Lighthouse nuevos; retiro de componentes Tailwind (57); IN-01 a IN-04; paginación del blog.
