---
quick_id: 260815-ngy
status: complete
branch: seo/09-structured-data
issue: 9
date: 2026-08-15
---

# Quick 260815-ngy — Structured data (issue #9)

## Commits

| SHA | Qué |
|---|---|
| `8dba4d7` | `/blog` BreadcrumbList + Article completo |
| `991bb2e` | case study: `about` como `Thing`, `url`, `image` |
| (Service) | `src/lib/service-schema.ts` + las 4 páginas de servicio |

Todos path-scoped (`git commit -- <rutas>`), otras sesiones activas en el checkout.

## Cobertura contra el issue

| # | Item | Resultado |
|---|---|---|
| 1 | `Service` en las 4 páginas, ES y EN | hecho, con desvío documentado en el índice |
| 2 | `BreadcrumbList` en `/blog` | hecho |
| 3 | Article: `image`, `dateModified`, `publisher`, `mainEntityOfPage` | hecho |
| 4 | case study: `about` → `Thing`, `image`, `url`, `datePublished` | hecho **menos `datePublished`** — ver abajo |
| 5 | Omitir claves vacías | hecho en Article y case study |
| 6 | Headline EN duplicado | **no hecho** — es dato, no código |
| 7 | `CreativeWork` de `/websites/{slug}` | **diferido a propósito** |

## Decisiones donde omití en vez de inventar

La regla del plan: si un campo no tiene fuente real en Payload, se omite la clave.
Structured data fabricada viola las Structured Data Guidelines de Google.

- **`datePublished` en el case study (item 4): omitido.** La colección `CaseStudies`
  **no tiene campo `publishedAt`** — verificado, no existe. Las únicas fechas disponibles
  son los timestamps de fila del CMS, y pasar `createdAt` por fecha editorial afirmaría algo
  que el CMS nunca registró. Esa parte del issue necesita primero un campo de schema.
- **`publisher.logo` en el Article: omitido.** No hay asset de logo real en el repo.
- **`areaServed` en `Service`: omitido.** El sitio dice explícitamente que el trabajo es remoto
  desde Lima, y `/seo-tecnico-madrid` dice que no hay oficina en Madrid. Declarar cobertura
  contradiría el copy del propio sitio.
- **Índice de servicios: `ItemList`, no `Service`.** Desvío deliberado del texto del issue.
  El índice lista varias ofertas, o sea no *es* un servicio; cada entrada apunta al landing
  que sí lleva el `Service`.

## Lo que no hice, con razón

- **Item 6 (headline EN duplicado, `"Next Js Seo: Next.js SEO Best Practices…"`)**: el `headline`
  sale de `doc.title`, así que es contenido del CMS, no código. Neon es inalcanzable desde esta
  máquina (`ECONNRESET` sostenido; producción sí conecta), así que se edita desde el admin.
- **Item 7 (`/websites/{slug}`)**: el propio issue advierte que esa plantilla necesita más copy real
  antes de que valga la pena enriquecer el schema. Enriquecerla hoy sería rellenar `description`
  y `author` sin fuente. Diferido, no omitido en silencio.
- **`LocalBusiness`** y **`FAQPage`**: excluidos por el issue.

## Hallazgo colateral (pertenece al issue #3)

`src/app/(frontend)/[locale]/page.tsx:60` — el `Person` de la home usa como fallback
`https://juancarlosangulo.com`, **un dominio distinto** de juan-tech.com. Identidad
inconsistente en structured data. No lo toqué: es del issue #3 (identidad y E-E-A-T).

## Gates

- `npx tsc --noEmit` → **exit 0**, corrido después de cada tarea y al cierre
- Sin migración, sin cambio de schema, sin escritura a la DB
- Issue **no cerrado**: el cierre va post-deploy con `./scripts/seo/issue.sh close 9`

## Pendiente de verificación

Producción corre todavía el build previo, así que **no hay verificación en vivo**. El green sale
post-merge y post-deploy de Dokploy:

```
./scripts/seo/issue.sh pr 9      # PR contra master
# mergear, esperar deploy
./scripts/seo/issue.sh close 9   # valida contra el sitio live; se niega a cerrar si falla
```

## Nota de proceso

El plan lo escribió el orquestador, no `gsd-planner`: el subagente murió dos veces por errores
de API (la máquina se suspendió a mitad de respuesta) sin llegar a escribir el artefacto.
