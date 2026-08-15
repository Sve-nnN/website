---
quick_id: 260815-ngy
description: "Resolver el issue #9 — completar structured data (Service, BreadcrumbList, Article)"
branch: seo/09-structured-data
issue: 9
date: 2026-08-15
status: planned
---

# Quick 260815-ngy — Structured data (issue #9)

Plan escrito por el orquestador, no por `gsd-planner`: el subagente murió dos veces
por errores de API (la máquina se suspendió a mitad de respuesta) sin llegar a
escribir el artefacto. La investigación previa sí se hizo y está reflejada abajo.

## Regla que gobierna todo el plan

Cada campo que se agregue tiene que nombrar su **fuente real** en Payload. Si un
campo requerido no tiene fuente real, **se omite la clave** — no se inventa. Structured
data fabricada es una violación de las Structured Data Guidelines de Google, no un bug
menor. Una omisión honesta es el resultado correcto, no una carencia.

## Estado medido (del issue, no re-diagnosticado)

| Plantilla | Tiene | Falta |
|---|---|---|
| `/blog` | **nada** | BreadcrumbList |
| `/blog/{cat}/{slug}` | Article + BreadcrumbList | `image`, `dateModified`, `publisher`, `mainEntityOfPage` |
| `/case-studies/{slug}` | CreativeWork + BreadcrumbList | `image`, `url`, `datePublished`; `about` mal tipado |
| `/servicios/{slug}`, `/services/{slug}` | solo BreadcrumbList | `Service` |
| `/servicios`, `/services` | solo BreadcrumbList | `Service` |

## Tareas

### Task 1 — `BreadcrumbList` en `/blog`

`blog/page.tsx` nunca llama a ningún trail builder; por eso no emite nada. Es el mismo
hueco que produjo el bug de locale de 260814-lzz.

- **Archivo:** `src/app/(frontend)/[locale]/blog/page.tsx`
- **Acción:** llamar `buildBlogTrail(locale)` y emitir `<JsonLd data={buildBreadcrumbJsonLd(trail)} />`,
  igual que ya hace `blog/[category]/page.tsx:122`.
- **Fuente:** `src/lib/breadcrumbs.ts` — ya devuelve URLs locale-correctas (`homeHref('en')` → `/en`).
- **Verify:** el HTML de `/blog` y `/en/blog` contiene un bloque `ld+json` con `@type: BreadcrumbList`.

### Task 2 — Completar el `Article`

- **Archivo:** `src/app/(frontend)/[locale]/blog/[category]/[slug]/page.tsx:130-138`
- **Fuentes reales:**
  - `image` → `heroImageUrl` (línea 119), convertido a absoluto con `SITE_URL`
  - `dateModified` → `doc.updatedAt` (campo real de Payload; **no** duplicar `datePublished`)
  - `mainEntityOfPage` → URL canónica absoluta, ya calculada en el bloque de metadata (`:108`)
  - `publisher` → `Person` "Juan Carlos Angulo". El sitio es un portfolio personal, no una
    organización. **Sin `logo`**: no hay archivo de logo real en el repo, y `Organization.logo`
    inventado sería exactamente lo que la regla de arriba prohíbe.
  - `description` → omitir la clave cuando `doc.excerpt` sea vacío (hoy emite `""` en ES y `null` en EN)
- **Verify:** las 4 claves presentes; ningún valor `null` ni `""` en el JSON parseado.

### Task 3 — Corregir el `CreativeWork` del case study

- **Archivo:** `src/app/(frontend)/[locale]/case-studies/[slug]/page.tsx:118-136`
- **Acciones:**
  - `about` pasa de string plano a `{ '@type': 'Thing', name: ... }`
  - agregar `image` (hero del doc, absoluto), `url` (canónica absoluta), `datePublished` (`doc.publishedAt`)
  - omitir claves vacías
- Ojo: `dateCreated`/`dateModified` ya existen y son correctos — no tocarlos.

### Task 4 — `Service` en las 4 páginas de servicio, ES y EN

- **Archivos:** `servicios/page.tsx`, `servicios/[slug]/page.tsx`, `services/page.tsx`, `services/[slug]/page.tsx`
- **Fuentes reales:** `name` ← `doc.title`; `description` ← `meta.description` (omitir si vacía);
  `url` ← canónica absoluta; `provider` ← `Person` "Juan Carlos Angulo"; `areaServed` **se omite**
  (el sitio dice explícitamente que opera remoto desde Lima; inventar cobertura contradiría el copy).

## Fuera de alcance, con razón

- **Item 6 del issue** (headline EN duplicado, `"Next Js Seo: Next.js SEO Best Practices…"`):
  el `headline` sale de `doc.title`, o sea es **dato en el CMS, no código**. Requiere editar el post
  en el admin. Neon es inalcanzable desde esta máquina (`ECONNRESET`), así que queda para Juan.
- **Item 7 del issue** (`CreativeWork` de `/websites/{slug}`): diferido a propósito. El propio issue
  advierte que esa plantilla necesita más copy real antes de que enriquecer el schema valga la pena.
  Enriquecerla hoy significaría rellenar `description`/`author` sin fuente. Se difiere, no se omite en silencio.
- **`LocalBusiness`** y **`FAQPage`**: excluidos por el issue. El primero contradiría el copy del sitio
  (sin oficina en Madrid, operación desde Lima); el segundo perdió los rich results el 2026-05-07.

## Hallazgo colateral (no de este issue)

`src/app/(frontend)/[locale]/page.tsx:60` — el `Person` de la home usa como fallback
`https://juancarlosangulo.com`, **un dominio distinto** de juan-tech.com. Identidad inconsistente
en structured data. Pertenece al issue #3 (identidad y E-E-A-T); se reporta, no se toca acá.

## Gates

- `npx tsc --noEmit` exit 0
- Sin migración, sin cambio de schema, sin escritura a la DB
- No cerrar el issue: el cierre va después del deploy con `./scripts/seo/issue.sh close 9`
- Verificación en vivo solo post-deploy (producción corre el build previo)
