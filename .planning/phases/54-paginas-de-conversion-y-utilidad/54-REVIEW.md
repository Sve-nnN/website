---
phase: 54-paginas-de-conversion-y-utilidad
reviewed: 2026-11-08T00:00:00Z
depth: standard
files_reviewed: 84
files_reviewed_list:
  - scripts/db/20-phase54-seed-shadow-content.ts
  - scripts/db/21-phase54-upload-media.ts
  - scripts/db/22-phase54-stack-logos.ts
  - scripts/db/23-phase54-verify-schema.ts
  - scripts/db/data/54-media-manifest.ts
  - scripts/db/data/54-seed-lib.ts
  - scripts/verify/54-contact-form.mjs
  - scripts/verify/54-migration-additive.mjs
  - scripts/verify/54-no-sandbox-data.mjs
  - scripts/verify/54-run-all.mjs
  - src/app/(frontend)/[locale]/contact/page.tsx
  - src/app/(frontend)/[locale]/layout.tsx
  - src/app/(frontend)/[locale]/not-found.tsx
  - src/app/(frontend)/[locale]/page.tsx
  - src/app/(frontend)/[locale]/privacy/page.tsx
  - src/app/(frontend)/[locale]/search/page.tsx
  - src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx
  - src/app/(frontend)/[locale]/servicios/[slug]/page.tsx
  - src/app/(frontend)/[locale]/servicios/page.tsx
  - src/app/(frontend)/[locale]/sobre-mi/page.tsx
  - src/app/(frontend)/[locale]/stack/page.tsx
  - src/app/actions/contact.ts
  - src/app/global-not-found.tsx
  - src/app/go/[slug]/route.ts
  - src/blocks/ToolStack/config.ts
  - src/collections/Clientes/index.ts
  - src/components/AffiliateLink.tsx
  - src/components/home/About.tsx
  - src/components/home/AuditOffer.tsx
  - src/components/home/AuditorHighlightCard.tsx
  - src/components/home/Cases.tsx
  - src/components/home/CodeFixes.tsx
  - src/components/home/Faq.tsx
  - src/components/home/Hero.tsx
  - src/components/home/HomeView.tsx
  - src/components/home/Process.tsx
  - src/components/home/Services.tsx
  - src/components/home/SiteCard.tsx
  - src/components/home/Tagline.tsx
  - src/components/home/Testimonials.tsx
  - src/components/home/Vitals.tsx
  - src/components/mui/CaseMetricCard.tsx
  - src/components/mui/ContactForm.tsx
  - src/components/mui/Crumbs.tsx
  - src/components/mui/CtaPanel.tsx
  - src/components/mui/CtaSection.tsx
  - src/components/mui/FaqAccordion.tsx
  - src/components/mui/LogoMarquee.tsx
  - src/components/mui/PageHero.tsx
  - src/components/mui/ScoreRing.tsx
  - src/components/mui/Section.tsx
  - src/components/mui/TestimonialCards.tsx
  - src/components/mui/TranslationNotice.tsx
  - src/components/mui/links.ts
  - src/components/mui/lists.tsx
  - src/components/mui/rich-text/MuiRichText.tsx
  - src/components/mui/rich-text/Toc.tsx
  - src/components/mui/rich-text/lexical-toc.ts
  - src/components/pages/AboutView.tsx
  - src/components/pages/ContactView.tsx
  - src/components/pages/LegalView.tsx
  - src/components/pages/LocalLandingPage.tsx
  - src/components/pages/NotFoundView.tsx
  - src/components/pages/SearchView.tsx
  - src/components/pages/ServiceDetailPage.tsx
  - src/components/pages/ServicesIndexPage.tsx
  - src/components/pages/StackView.tsx
  - src/components/pages/contact/CopyEmailButton.tsx
  - src/components/pages/service/ServiceCaseProof.tsx
  - src/components/pages/service/ServiceCtaBand.tsx
  - src/components/pages/service/ServiceExtras.tsx
  - src/components/pages/service/ServiceHero.tsx
  - src/components/pages/service/column-parts.ts
  - src/components/pages/stack/StackToolCard.tsx
  - src/components/shell/SiteDocument.tsx
  - src/components/shell/SiteHeader.tsx
  - src/globals/AboutPage/index.ts
  - src/globals/HomePage/index.ts
  - src/lib/about-data.ts
  - src/lib/cache-tags.ts
  - src/lib/cache.ts
  - src/lib/contact-data.ts
  - src/lib/cta-data.ts
  - src/lib/home-data-b.ts
  - src/lib/home-data.ts
  - src/lib/local-landing-view.ts
  - src/lib/service-slots.ts
  - src/lib/service-view-data.ts
  - src/lib/services-index-data.ts
  - src/lib/stack-data.ts
  - src/migrations/20261108_043335_phase54_shadow_content.ts
  - src/migrations/index.ts
  - src/payload.config.ts
findings:
  critical: 1
  warning: 5
  info: 9
  total: 15
status: issues_found
---

# Phase 54: Code Review Report

**Reviewed:** 2026-11-08
**Depth:** standard (profundo en contacto, afiliados, migracion, scripts de base de datos y capa de cache)
**Files Reviewed:** 84
**Status:** issues_found

## Summary

Alcance: archivos de `src/`, `scripts/db/` y `scripts/verify/54-*` cambiados entre `2345549` (cierre de la fase 53) y `HEAD`, priorizados con las listas key-files de los SUMMARY. No se revisaron de nuevo los archivos de la fase 53 que 54 no tocó. No hubo bloque de hallazgos estructurales (fallow).

Lo que está bien y se verificó:

- La migración `20261108_043335_phase54_shadow_content` es aditiva: `up` solo hace CREATE TYPE, CREATE TABLE, ADD COLUMN, FK e índices sobre `home_page*`, `about_page*`, `groups_tools`, `_groups_v_tools` y `clientes.on_dark`. Los DROP viven solo en `down`. `payload.config.ts` mantiene `push: false`, así que los scripts que cargan Payload no empujan esquema.
- Los globals `home-page` y `about-page` no declaran `access`, por lo que la lectura anónima por REST y GraphQL queda negada. Los fetchers los leen por Local API en servidor y los cachean con tag propio.
- Los scripts 20, 21 y 22 son dry-run por defecto, rechazan hosts fuera de `127.0.0.1`, `localhost` y `shared-postgres` y toda base distinta de `juantech` antes de abrir conexión, exigen `--db-checked`, nunca llaman a un delete y escriben con `draft: false` y `fallbackLocale: false`. `findOrCreateMedia` evita duplicar assets.
- `AFFILIATE_REL` es la única fuente del `rel` de afiliado; las tarjetas de herramientas y los enlaces de equipo lo usan con `target="_blank"` y sufijo para lector de pantalla. La ruta `/go/[slug]` no cambió en esta fase y conserva el 404 indistinguible y la compuerta de solo lectura.
- Las lecturas de colecciones nuevas usan `overrideAccess: false` con `select` mínimo. El h1 es único por página (PageHero, hero de la home, NotFoundView) y los encabezados de MuiRichText bajan h1 a h2.

Hay un defecto que tumba páginas (CR-01) y cinco advertencias de robustez. El resto son observaciones menores.

## Critical Issues

### CR-01: MuiRichText (Server Component) pasa `linkFor()` como `component` a un componente cliente de MUI

**File:** `src/components/mui/rich-text/MuiRichText.tsx:92`
**Issue:** `MuiRichText` no declara `'use client'` a propósito, así que corre en la capa RSC. En `renderLink`, la rama interna hace `<Link component={linkFor(href)} href={href}>`. Cuando `href` es una ruta raíz sin prefijo de idioma (`/contact`, `/servicios`, cualquier enlace interno en español), `linkFor` devuelve el `Link` de next-intl. En la capa de servidor ese `Link` es un `forwardRef` normal (`createSharedNavigationFns`), no una referencia de cliente, y `Link` de MUI es un componente cliente. React Flight no puede serializar un objeto forwardRef con una función `render` y lanza "Functions cannot be passed directly to Client Components". El resultado es un 500 de toda la página que renderice ese texto.

El equipo ya conocía el problema: el SUMMARY 54-09 documenta que `OtherServices` tuvo que ser `use client` por usar `linkFor` como `component`. `MuiRichText` es el único archivo no cliente de `src/` que llama a `linkFor`.

Afectadas: `/privacy`, `/terms`, las landings de servicio, las landings de Lima y Madrid y el futuro blog (fase 55), en cuanto un editor ponga un enlace interno (`linkType: internal` o una URL `/ruta`) en el cuerpo en español. En inglés `sanitizeHref` ya devuelve `/en/...`, que `isPrefixableHref` descarta y cae en `next/link` (referencia de cliente), por eso la falla pasa desapercibida si el contenido actual no trae enlaces internos. `scripts/verify/54-richtext-toc.ts` incluye un enlace `/servicios`, pero lo renderiza con `renderToString` en el arnés, que no impone el límite RSC, así que la batería no lo detecta.

**Fix:** Mover la decisión de componente a un cliente. Crear un `RichTextLink` con `'use client'` que reciba `href`, `external` y `children` como datos serializables y llame a `linkFor` por dentro:

```tsx
// src/components/mui/rich-text/RichTextLink.tsx
'use client'
import Link from '@mui/material/Link'
import type { ReactNode } from 'react'
import { linkFor } from '../links'

export function RichTextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link component={linkFor(href)} href={href} underline="always" sx={{ color: 'accentText' }}>
      {children}
    </Link>
  )
}
```

En `renderLink`, la rama interna pasa a `return <RichTextLink key={key} href={href}>{children}</RichTextLink>`. Agregar a `54-richtext-toc.ts` o a una verificación viva un caso de enlace interno renderizado por la ruta real (por ejemplo `/privacy` con un doc de prueba o `next build` con un fixture), no por `renderToString`.

## Warnings

### WR-01: Si `getCtaData` devuelve null, el cierre de servicios y landings locales desaparece junto con su texto

**File:** `src/components/pages/ServiceDetailPage.tsx:124` y `:195` (igual en `src/components/pages/LocalLandingPage.tsx:131` y `:161`)
**Issue:** El último `callToAction` del layout (`closing: true`) se omite en `renderSection` con `if (s.closing) return null`, porque se pinta al final con `CtaSection`. Pero `CtaSection` solo se renderiza si `ctaData` existe. `getCtaData` devuelve null cuando falta `home-page.cta.title`, cuando el doc `contact` no trae un `mailto:` o ante cualquier error de Payload. En esos casos la página pierde el formulario y también el texto indexable y el enlace del bloque de cierre, contra la regla SEO-03 que el propio archivo declara ("ningún texto del editor se pierde"). La pérdida es silenciosa: solo queda un `console.error`.
**Fix:** Pintar el cierre como banda cuando no hay datos de cierre:

```tsx
case 'cta':
  if (s.closing && ctaData) return null
  return (
    <ServiceCtaBand key={key} link={ctaLink(s, locale)}>
      <MuiRichText data={s.block.richText as unknown as SerializedEditorState} maxWidth={760} />
    </ServiceCtaBand>
  )
```

### WR-02: Dos extractores del correo con validación distinta

**File:** `src/lib/cta-data.ts:49` y `src/lib/contact-data.ts:75`
**Issue:** `emailFromContactPage` (cierre de conversión) y `extractContactEmail` (página Contacto) hacen lo mismo con reglas diferentes. El de Contacto valida la dirección con `MAILTO_ADDRESS` y descarta lo que no encaja. El de `cta-data` solo recorta y devuelve cualquier cadena no vacía tras `mailto:`. Un `href` mal escrito en el admin (`mailto:juan @x`) se publica en el panel del cierre, se copia al portapapeles y se inyecta en el mensaje de fallo del formulario. Además `emailFromContactPage` itera `Page` tipado y la otra un `DocLike`, así que cualquier cambio futuro tiene que hacerse dos veces.
**Fix:** Dejar un solo extractor exportado (el de `contact-data.ts`, con validación) y hacer que `cta-data.ts` lo importe. Ajustar `54-conversion-ssr.ts` y `54-contact-ssr.ts` para que prueben la misma función.

### WR-03: La compuerta de `--submit` de 54-contact-form se autodeclara y falla con código 0

**File:** `scripts/verify/54-contact-form.mjs:319-322` y `:410`
**Issue:** Dos problemas en la protección contra envíos reales (T-54-47):
1. La condición `submit && !expectPreview && ALLOW_REAL_SEND !== '1'` confía en la variable `EXPECT_PREVIEW=1`, que el operador escribe a mano. `BASE_URL=https://juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/54-contact-form.mjs --submit` pasa la guardia y manda un correo real a `CONTACT_TO_EMAIL` en producción, porque `isPreviewReadonly()` no está activo ahí.
2. Cuando la guardia sí bloquea, imprime `FAIL ...` con `console.log` y hace `return` sin incrementar `failures`. El proceso termina con código 0 y `54-run-all` marca el paso como PASS aunque la salida tenga una línea FAIL.

**Fix:** Derivar el permiso de la URL, no de una bandera. Por ejemplo, bloquear `--submit` si `new URL(base).hostname` coincide con el host de producción (`PROD_BASE`) salvo `ALLOW_REAL_SEND=1`, y registrar el bloqueo con `report('--submit bloqueado', ['...'])` para que cuente en `failures` y salga con 1.

### WR-04: Lecturas de metadata sin cache y sin `overrideAccess: false` en Contacto y landings locales

**File:** `src/app/(frontend)/[locale]/contact/page.tsx:25-33` y `src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx:29-36` (igual en `seo-tecnico-lima/page.tsx:29`)
**Issue:** El cuerpo de estas páginas ahora lee por `getCachedPageBySlug` y `getLocalLandingPage` (cacheados, con `overrideAccess: false`, disciplina de la fase 53 WR-08). `generateMetadata` sigue usando un `payload.find` directo con acceso abierto y sin `select`. Consecuencias: cada visita hace dos lecturas del mismo doc con políticas de acceso distintas, y la metadata (título, descripción, imagen OG) puede salir de un documento que el cuerpo ya no serviría a un anónimo (por ejemplo un borrador). `/contact` es `force-dynamic`, así que la doble consulta ocurre en cada petición.
**Fix:** Reutilizar las capas ya existentes:

```ts
async function getContactPage(locale: string) {
  return getCachedPageBySlug('contact', locale as 'es' | 'en')
}
// Madrid y Lima: getLocalLandingPage(locale, 'seo-tecnico-madrid')
```

### WR-05: `getHomeTestimonials` cachea el fallo durante todo el TTL

**File:** `src/lib/home-data-b.ts:559-576`
**Issue:** El `try/catch` está dentro de la función que recibe `unstable_cache`, así que un error transitorio de base de datos se captura, se devuelve `null` y Next guarda ese `null` como resultado válido por 60 s. La sección de testimonios desaparece de la home (y de la ISR resultante) durante ese tiempo aunque la base ya se haya recuperado. El resto de lectores (`readHomeSites`, `getHomeClients`) lo hacen bien: lanzan dentro de la caché y capturan fuera.
**Fix:** Mover el `try/catch` fuera de `unstable_cache`, igual que `getHomeSites`:

```ts
export async function getHomeTestimonials(locale: Locale) {
  try {
    return await readHomeTestimonials(locale) // unstable_cache sin catch interno
  } catch (err) {
    console.error('[home]', err)
    return null
  }
}
```

## Info

### IN-01: Lógica de "Copiar correo" duplicada

**File:** `src/components/mui/CtaPanel.tsx:46` y `src/components/pages/contact/CopyEmailButton.tsx:40`
**Issue:** Ambos implementan el mismo copiar, temporizador de 2 s y región `aria-live`. Si cambia el comportamiento (por ejemplo, anunciar el error del portapapeles) hay que editar dos sitios.
**Fix:** Usar `CopyEmailButton` dentro de `CtaPanel` con una prop de estilo.

### IN-02: El formulario pierde el mensaje escrito cuando el envío falla

**File:** `src/components/mui/ContactForm.tsx:150-158` (con `src/app/actions/contact.ts`)
**Issue:** El éxito y el error llegan por redirección completa a `?sent=false`. Ante un límite de ritmo, un fallo de Resend o un `CONTACT_TO_EMAIL` ausente, el visitante vuelve a un formulario vacío y pierde el texto. El mensaje de error da el correo como alternativa, pero no devuelve lo escrito.
**Fix:** Migrar a `useActionState` con un estado devuelto en vez de `redirect` para el error, o conservar `name` y `email` en query string saneada. Es una mejora, no un bloqueo.

### IN-03: `key` duplicable en StackView

**File:** `src/components/pages/StackView.tsx:174` y `:239`
**Issue:** `key={tool.name}` y `key={item.name}` repiten clave si el editor carga dos herramientas o dos piezas de equipo con el mismo nombre (React avisa y puede reciclar estado). Otros componentes de la fase ya prefijan el índice.
**Fix:** `key={`${i}-${tool.name}`}` e igual para el equipo.

### IN-04: Cadenas fijas fuera de `messages`

**File:** `src/lib/service-view-data.ts:95` y `src/components/home/CodeFixes.tsx:109`
**Issue:** El rol del testimonio de servicios se arma con `' · '` en código, mientras la home usa la plantilla `home.testimonials.roleAt` con "at" o "en". El mismo testimonio sale con formato distinto según la página. El respaldo `'commit'` del chip de CodeFixes es una cadena en inglés fija en una página en español.
**Fix:** Reutilizar `roleAt` en servicios y mover `commit` a `home.codeFixes.commitFallback`.

### IN-05: Lecturas cacheadas sin tag ni hook de revalidación

**File:** `src/lib/home-data.ts:212`, `src/lib/home-data-b.ts:490` y `:556`, `src/lib/about-data.ts:339-405`, `src/lib/cta-data.ts:28`
**Issue:** `clientes`, `testimonials`, `speaking-events` y `authors` no tienen hooks de revalidación, y varias de estas lecturas usan `unstable_cache` sin tags. `revalidatePath` no invalida `unstable_cache`, así que una edición en el admin tarda hasta 60 s en la capa de datos más hasta 60 s en la página ISR. Es aceptable para el sitio, pero la cadena "publicar actualiza sin esperar" que describen los comentarios de las rutas no aplica a estas secciones.
**Fix:** Agregar tags (`clientes:all`, `testimonials:all`, `speaking-events:all`) y llamar a `revalidateTag` desde hooks de esas colecciones, o documentar el retraso de hasta 2 min en los comentarios.

### IN-06: Detalles de seguridad operativa en los scripts de base de datos

**File:** `scripts/db/23-phase54-verify-schema.ts:73-80` y `scripts/db/22-phase54-stack-logos.ts:310`
**Issue:** (a) El script 23 es de solo lectura pero no llama a `assertSafeTarget`: solo imprime el host. Contra una Neon abandonada reportaría PASS sobre una base que no sirve el sitio, la misma clase de falsa confirmación del incidente del 2026-08-17. (b) En el script 22, `die()` y `process.exit(1)` dentro del `try` omiten el `finally`, y el directorio temporal `phase54-logos-*` queda sin borrar en esos caminos.
**Fix:** (a) Llamar a `assertSafeTarget(process.env.DATABASE_URI, false, false)` al inicio del script 23. (b) Lanzar un error en lugar de `process.exit` dentro del `try`, y salir después del `finally`.

### IN-07: `limit ?? 8` no cubre un límite de 0

**File:** `src/lib/service-view-data.ts:133`
**Issue:** `limit: limit ?? 8` deja pasar `0`, que en Payload significa "sin límite" y devuelve todos los testimonios. Además `find` no recibe `locale`, por lo que en EN lee el idioma por defecto.
**Fix:** `limit: limit && limit > 0 ? limit : 8` y pasar `locale`.

### IN-08: Listas con `list-style: none` y sin `role="list"`

**File:** `src/components/mui/lists.tsx:10`
**Issue:** `UL` y `OL` aplican `listStyle: 'none'`. VoiceOver en Safari deja de anunciar como lista un `ul` sin viñetas salvo que lleve `role="list"`. Algunas vistas lo añaden a mano (StackView, SearchView), la mayoría no (Vitals, Services, Process, Testimonials). El comportamiento queda dependiente de cada llamada.
**Fix:** Poner `role="list"` por defecto en `UL` y `OL` (y permitir sobreescribirlo).

### IN-09: `Section` con `aria-labelledby` que depende de un hijo sin título

**File:** `src/components/mui/Section.tsx:34`, usada en `src/components/home/Services.tsx:62`, `About.tsx:54` y `AuditorHighlightCard.tsx:26`
**Issue:** Sin `title`, la sección apunta a `${id}-t` y confía en que un hijo declare ese id. Hoy los tres llamadores lo cumplen, pero solo por comentario. Si un llamador futuro omite el id, queda un `aria-labelledby` colgante y la región pierde su nombre sin ningún aviso.
**Fix:** Omitir `aria-labelledby` cuando no hay `title` ni un `labelledBy` explícito, o hacer obligatoria una de las dos props por tipo.

---

_Reviewed: 2026-11-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
