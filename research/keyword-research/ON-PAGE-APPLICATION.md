# Aplicación on-page de las keywords de Phase 14

**Fecha:** 2026-08-17
**Insumo:** `research/keyword-research/KEYWORD-RESEARCH.md` (2026-07-11) y `research/serp-intent-home-description.md` (2026-08-01)
**Estado de verificación:** metas actuales leídas de producción con `curl`, no de memoria.

## Por qué existe este documento

Las 4 keywords de Phase 14 están investigadas desde julio y ninguna se usa en un title.
Este archivo trae la copy lista para pegar. **No se pudo aplicar por código ni por script:**
title, description y H1 salen del CMS (`meta?.title ?? doc?.title` en `page.tsx:29`), y Neon
es inalcanzable desde la máquina de Juan (`read ECONNRESET` sostenido; producción sí conecta).

## Estado medido en producción

| Página | Keyword asignada | Title actual | Description actual | H1 actual |
|---|---|---|---|---|
| Home ES | seo técnico | `Juan Carlos Angulo — Inicio` | `Ingeniero de software y experto SEO.` (36) | `Construyo software rápido y hago que se encuentre en Google` |
| Home EN | technical seo consultant | `Juan Carlos Angulo — Home` | `Software engineer and SEO expert.` (33) | `I build fast software and get it found on Google` |
| Autor ES | auditoría seo técnico | `Juan Carlos Angulo` | `Ingeniero de Software y Consultor SEO Técnico` | `Juan Carlos Angulo` |
| Autor EN | technical seo specialist | `Juan Carlos Angulo` | `Software Engineer & Technical SEO Consultant` | `Juan Carlos Angulo` |

Ninguna keyword aparece completa en ningún campo.

## Dos problemas que la copy nueva resuelve

**1. Canibalización EN.** La página de autor en inglés dice "Technical SEO **Consultant**",
que es el término asignado al Home EN. Su propio término es "technical seo **specialist**".
Las dos páginas apuntan al mismo head term — exactamente lo que el research de julio dijo
querer evitar al elegir términos distintos.

**2. La description del Home ya estaba escrita y nunca llegó.**
`scripts/seed-phase-og-home-description.ts` existe desde el 2026-08-02 con la copy correcta
ya humanizada. El commit `d1855df` dice textual: *"seed-phase-og-home-description.ts landed on
a draft, not published"*. Producción sigue sirviendo la vieja. **No hace falta reescribirla,
hace falta re-correr el script y que publique.**

## Copy propuesta

### Home ES — keyword `seo técnico`

- **Title** (57): `SEO técnico e ingeniería de software | Juan Carlos Angulo`
- **Description** (148, ya escrita, solo falta aplicarla):
  `Soy ingeniero de software y consultor de SEO técnico: auditorías, rendimiento web y arquitectura Next.js/Payload para posicionar tu sitio en Google.`
- **H1** (56): `Construyo software rápido y lo posiciono con SEO técnico`

> Nota de intención, del chequeo SerpApi del 2026-08-01: la SERP de "seo técnico" es
> **100% informacional** (Semrush, Hubspot, Wix, todos artículos "¿Qué es el SEO técnico?").
> El Home no va a desplazarlos y no debería intentarlo. La keyword acá sirve para relevancia
> temática, no para pelear esa SERP. Por eso la description describe lo que la página
> realmente ofrece en vez de imitar el framing "¿Qué es X?", que sería bait.

### Home EN — keyword `technical seo consultant`

- **Title** (44): `Technical SEO Consultant | Juan Carlos Angulo`
- **Description** (143, ya escrita):
  `I'm a software engineer and technical SEO consultant: audits, performance, and Next.js/Payload architecture to get your site ranking on Google.`
- **H1** (52): `I build fast software and rank it with technical SEO`

> Este sí es el mejor target de los cuatro: 320/mes, competencia 0.01, intención de servicio
> directa. Es la página donde conviene poner el esfuerzo.

### Autor ES — keyword `auditoría seo técnico`

- **Title** (48): `Auditoría SEO técnico | Juan Carlos Angulo`
- **Description** (152):
  `Hago auditorías de SEO técnico sobre el código: rastreo, indexación, Core Web Vitals y arquitectura. Ingeniero de software, no consultor de diapositivas.`
- **H1**: **dejar `Juan Carlos Angulo`**.

> El H1 se deja como está a propósito. Es una página de perfil de persona y lleva marcado
> `Person`; cambiar el H1 por una keyword de servicio desalinea el H1 del schema y del propósito
> real de la página. La keyword entra por title, description y el subtítulo de la bio.

### Autor EN — keyword `technical seo specialist`

- **Title** (47): `Technical SEO Specialist | Juan Carlos Angulo`
- **Description** (149):
  `I work as a technical SEO specialist and software engineer: crawling, indexing, Core Web Vitals and site architecture, fixed directly in the code.`
- **H1**: **dejar `Juan Carlos Angulo`**, mismo motivo.

> Importante: sacar "Consultant" de esta página. Es lo que hoy la hace competir contra el
> Home EN por el mismo término.

## Cómo aplicarlo

Todo esto es contenido, así que va por el admin de producción (que sí conecta a Neon):

1. `https://juan-tech.com/admin` → Pages → Home → pestaña SEO → pegar title y description ES,
   cambiar de locale a EN y repetir.
2. Home → bloque Hero → cambiar el H1 en los dos locales.
3. Authors → Juan Carlos Angulo → title/description en ES y EN.
4. **Publicar**, no guardar como draft. Ese fue justamente el fallo de `d1855df`.

Alternativa para la description del Home, si preferís script en vez de admin:
re-correr `scripts/seed-phase-og-home-description.ts` desde un entorno con acceso a Neon,
verificando que escriba sobre el documento publicado y no sobre el draft.

## Verificación

Después de publicar y de que Dokploy deploye:

```bash
for u in / /en /authors/juan-carlos-angulo /en/authors/juan-carlos-angulo; do
  echo "== $u"
  curl -sL "https://juan-tech.com$u" | grep -o '<title>[^<]*</title>'
  curl -sL "https://juan-tech.com$u" | grep -o '<meta name="description" content="[^"]*"'
done
```

## Pendiente aparte

No hay keyword research para servicios, blog, categorías de blog, case studies ni websites.
Existen tres JSON sueltos de las landings locales (`seo tecnico madrid`, `experto seo tecnico`,
`consultor seo tecnico freelance`) sin documento que los analice. Eso es research nuevo.
