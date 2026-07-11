# Keyword Research — Home + Author Page (EN/ES) — Milestone v1.2

**Fuente:** DinoRank API (`POST /api/v1/keyword-research`) — ES resuelto vía visibility server (datos de sugerencias relacionadas, sin volumen exacto del término semilla), EN resuelto vía DataForSEO (volumen exacto + histórico 12 meses del término semilla).
**Fecha:** 2026-07-11
**Raw responses:** archivos `dinorank_*.json` en esta misma carpeta (una petición por término semilla evaluado).

## Metodología

Para cada página se probaron 2 términos semilla candidatos por idioma. En EN, DataForSEO devuelve volumen/CPC/competencia exactos para el término semilla mismo. En ES, la fuente "visibility" no expone el volumen exacto del término semilla — devuelve una lista de keywords relacionadas con volumen propio; se usó esa lista para encontrar el mejor término real con volumen medible y relevancia temática directa (se descartó ruido: coincidencias por substring "seo" sin relación real, ej. "seovet", "kouji seo", topónimos coreanos).

## Picks finales

| Página | Idioma | Keyword asignada | Vol/mes | CPC | Competencia | Nota |
|---|---|---|---|---|---|---|
| Home | ES | **seo técnico** | 260 | €3.22 | — | Head term real con volumen medible, coincide con el H1 actual del hero ("...aplicada al SEO Técnico"). |
| Home | EN | **technical seo consultant** | 320 (12m avg, pico 880) | $15.16 | 0.01 (muy baja) | Volumen exacto (DataForSEO), intención de servicio directa, competencia casi nula — buen target. |
| Author (Sobre mí) | ES | **auditoría seo técnico** | 90 | €0.00 | — | Ligado a un servicio concreto que ofrece Juan; diferencia el keyword de Home evitando canibalización, encaja con la narrativa de credenciales/expertise. |
| Author (Sobre mí) | EN | **technical seo specialist** | 1300 (12m avg, pico 12,100 en 2025-12) | $40.04 | 0.14 | Volumen exacto (DataForSEO) muy superior, CPC alto = intención comercial fuerte, encaja con positioning de "especialista" en la bio. |

## Candidatos descartados (con datos)

- Home ES — "seo técnico freelance": usado solo como semilla de expansión (no se evaluó como target directo, aportó la lista de relacionadas de donde salió el pick final).
- Home EN — "technical seo engineer": vol. 10 (12m avg) — muy por debajo de "technical seo consultant" (320).
- Author ES — "especialista seo técnico" / "ingeniero de software seo": 0 relacionadas relevantes devueltas por DinoRank para estos seeds — se re-sembró la búsqueda con "seo tecnico freelance" y de ahí se extrajo "auditoría seo técnico" como mejor match real.
- Author EN — "software engineer seo expert": vol. 0 — descartado.

## Implementación

Requiere campo `targetKeyword` (grupo `en`/`es`, texto simple) en:
- Colección `pages` (para Home)
- Colección `authors` (para el perfil de Juan)

Ver REQUIREMENTS.md v1.2 (`SEO-KW-01`) y ROADMAP.md para la fase que lo implementa. El campo es informativo/editorial (guía para redacción y metas on-page), no dispara ninguna llamada en vivo a DinoRank desde la app — la investigación es un insumo estático de este milestone, consistente con la exclusión de "dinorank tooling" en vivo que sigue vigente en PROJECT.md Out of Scope.
