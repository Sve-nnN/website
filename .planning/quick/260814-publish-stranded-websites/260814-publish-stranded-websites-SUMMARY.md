---
quick_id: 260814-publish-stranded-websites
status: code_complete_run_pending
date: 2026-08-14
---

# Summary — websites atascados en borrador

## Qué pasó

Juan pidió "un milestone nuevo con los websites que hice". No era un milestone: v1.9 (Phases 38-40) ya construyó la colección `Websites`, las rutas `/websites` y `/websites/[slug]`, el bloque `FeaturedWebsitesBlock` y el poblado de los 6 sitios con screenshots y Lighthouse reales. El trabajo existe. Lo que no existe es su visibilidad.

## Causa raíz (inferida del código, no verificada contra la base)

`scripts/seed-phase40-websites.ts` crea cada doc con `_status: 'published'` (línea 401), pero las dos escrituras por idioma que siguen (`payload.update()`, línea 418) **no pasaban `draft: false`**. La colección `Websites` corre drafts **con autosave** (`src/collections/Websites/index.ts:17-18`), así que esas actualizaciones aterrizan en una versión borrador y des-publican silenciosamente lo que el `create` había publicado.

Es exactamente la RC-2 de `.planning/quick/260813-fix-prod-404-500-routes`, que dejó `/blog` y 6 de 7 case studies en 404 en producción. `websites` está en `SITEMAP_COLLECTIONS` con `hasDrafts: true`, así que un doc en borrador desaparece del sitemap además de no renderizar.

**No verificado contra la base:** Neon sigue caído (TCP 5432 inalcanzable). La inferencia es de código y del precedente idéntico ya diagnosticado ayer, no de una consulta.

## Cambios aplicados

| Archivo | Cambio |
|---|---|
| `scripts/publish-draft-content.ts` | `websites` sumada al set por defecto de `TARGETS`. El script solo cubría `pages`, `case-studies` y opcionalmente `posts`, así que correrlo tal cual **no habría arreglado los websites** |
| `scripts/seed-phase40-websites.ts` | `draft: false` en el update por locale, con el comentario que explica por qué es obligatorio y no cosmético |

`npx tsc --noEmit` sale 0.

## Pendiente — necesita la base arriba

```
node --env-file=.env node_modules/.bin/tsx scripts/publish-draft-content.ts
```

El script se auto-verifica: después de publicar, re-consulta por el camino de lectura público y reporta lo que ve. Confirmar después que `/websites` lista los 6 sitios y que cada `/websites/[slug]` responde 200 en ambos idiomas.

Sigue pendiente lo mismo para `/blog` y los case studies, del ticket de ayer.
