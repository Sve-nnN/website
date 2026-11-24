---
phase: 54-paginas-de-conversion-y-utilidad
fixed_at: 2026-11-08T00:00:00Z
review_path: /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/phases/54-paginas-de-conversion-y-utilidad/54-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 54: Code Review Fix Report

**Fixed at:** 2026-11-08
**Source review:** /Users/juan/Documents/Codigo/Personal/juantech/juan-payload/.planning/phases/54-paginas-de-conversion-y-utilidad/54-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (1 Critical, 5 Warning; los 9 Info quedan fuera de `fix_scope: critical_warning`)
- Fixed: 6
- Skipped: 0

**Donde se verifico:** en el checkout principal (`workflow.use_worktrees=false`), rama `feat/mui-redesign`, sin worktree aislado. Verificacion tras cada fix: `npx tsc --noEmit` (limpio en todos). Ademas se corrio `npm run build` completo al final (OK, 56 s, sin errores) y se repitieron `54-rsc-boundary.mjs` y `53-layer-check.mjs` despues del build (ambos OK). No se hizo push, no se toco master, no se uso `--env-file=.env` y no se escribio en ninguna base de datos.

**Limite de la verificacion de CR-01:** `next build` no ejercita la ruta RSC real de `/privacy` ni de las landings de servicio. Las rutas usan `generateStaticParams` vacio, el prerender-manifest queda con 0 rutas y el render ocurre en la primera visita contra la base. Por eso el build confirma que el bundle compila y que el limite Server/Client no se rompe en tiempo de compilacion, pero no sustituye una visita real. Para cubrir el hueco se agrego una guarda estatica (`54-rsc-boundary.mjs`). Falta una comprobacion viva: abrir en el preview una pagina con un enlace interno en el cuerpo en espanol (por ejemplo `/privacy` con un enlace `/servicios`) y confirmar que responde 200.

## Fixed Issues

### CR-01: MuiRichText (Server Component) pasa `linkFor()` como `component` a un componente cliente de MUI

**Files modified:** `src/components/mui/rich-text/RichTextLink.tsx` (nuevo), `src/components/mui/rich-text/MuiRichText.tsx`, `scripts/verify/54-rsc-boundary.mjs` (nuevo), `scripts/verify/54-run-all.mjs`
**Commit:** e083876
**Status:** fixed: requires human verification
**Applied fix:** Se creo `RichTextLink` con `'use client'`. Recibe `href` y `children` (datos serializables) y llama a `linkFor(href)` dentro del cliente. La rama interna de `renderLink` en `MuiRichText` ahora devuelve `<RichTextLink>` y se quito el import de `linkFor` del Server Component. La rama externa no cambia: usa `Link` de MUI sin `component`, que es seguro en RSC. Como `renderToString` no impone el limite RSC, se agrego `54-rsc-boundary.mjs` (con `--selftest`), que falla si un modulo sin `'use client'` llama a `linkFor(`, y se registro en `selftestSteps()` de `54-run-all.mjs`. Se comprobo que el `MuiRichText` anterior habria sido marcado por la guarda. Archivos nuevos justificados por el propio Fix del review.
**Nota:** ver "Limite de la verificacion de CR-01" arriba.

### WR-01: Si `getCtaData` devuelve null, el cierre de servicios y landings locales desaparece junto con su texto

**Files modified:** `src/components/pages/ServiceDetailPage.tsx`, `src/components/pages/LocalLandingPage.tsx`
**Commit:** cdf7c0a
**Status:** fixed: requires human verification
**Applied fix:** La condicion `if (s.closing) return null` pasa a `if (s.closing && ctaData) return null` en ambos archivos. Sin datos de cierre, el ultimo bloque `callToAction` se pinta como `ServiceCtaBand` y su texto y enlace siguen indexables (SEO-03). Con datos, el comportamiento no cambia.

### WR-02: Dos extractores del correo con validacion distinta

**Files modified:** `src/lib/cta-data.ts`, `scripts/verify/54-conversion-ssr.ts`
**Commit:** a1727a3
**Applied fix:** Se elimino `emailFromContactPage` y `cta-data.ts` importa `extractContactEmail` de `contact-data.ts` (el que valida con `MAILTO_ADDRESS`). No hay ciclo de imports. `54-conversion-ssr.ts` ahora prueba la misma funcion y gana un caso nuevo: `mailto:juan @x` devuelve null. `54-conversion-ssr.ts` pasa completo. `54-contact-ssr.ts` ya probaba `extractContactEmail`, asi que no cambio.

### WR-03: La compuerta de `--submit` de 54-contact-form se autodeclara y falla con código 0

**Files modified:** `scripts/verify/54-contact-form.mjs`
**Commit:** abf8e0c
**Status:** fixed: requires human verification
**Applied fix:** Se quitaron `EXPECT_PREVIEW` y `ALLOW_REAL_SEND` de la compuerta. Ahora `submitBlockReason(base)` deriva el permiso del hostname de `BASE_URL` contra la lista explicita `SUBMIT_ALLOWED_HOSTS = ['dev.juan-tech.com']`. Cualquier otro host, o una URL invalida, bloquea el envio. El bloqueo se registra con `report('--submit bloqueado', [...])`, que suma a `failures`, asi que el proceso sale con 1 y `54-run-all` lo marca como FAIL. La comprobacion corre antes de abrir el navegador, de modo que no hay trafico ni correo. El `--selftest` suma 8 casos de la compuerta (preview permitido, mayusculas y puerto, produccion, `www`, sufijo `dev.juan-tech.com.evil.test`, credenciales que imitan el host, localhost y URL invalida). Probado a mano: `BASE_URL=https://juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/54-contact-form.mjs --submit` ahora imprime FAIL y sale con 1.
**Nota:** el envio real contra produccion de la fase 57 exige ahora editar `SUBMIT_ALLOWED_HOSTS` a proposito; ya no hay variable de entorno que lo salte.

### WR-04: Lecturas de metadata sin cache y sin `overrideAccess: false` en Contacto y landings locales

**Files modified:** `src/app/(frontend)/[locale]/contact/page.tsx`, `src/app/(frontend)/[locale]/seo-tecnico-madrid/page.tsx`, `src/app/(frontend)/[locale]/seo-tecnico-lima/page.tsx`
**Commit:** c8ccbf5
**Applied fix:** El `getPayload` + `payload.find` directo de `generateMetadata` se reemplazo por las mismas lecturas del cuerpo: `getCachedPageBySlug('contact', locale)` en Contacto y `getLocalLandingPage(locale, slug)` en Madrid y Lima. Ambas usan `overrideAccess: false`. Se quitaron los imports de `getPayload` y `config` que quedaron sin uso. `getCachedPageBySlug` cachea con tag `page:contact` y deduplica con la lectura del cuerpo. `getLocalLandingPage` no usa `unstable_cache` (el review decia que si), pero iguala la politica de acceso, que es el defecto principal.

### WR-05: `getHomeTestimonials` cachea el fallo durante todo el TTL

**Files modified:** `src/lib/home-data-b.ts`
**Commit:** b397484
**Applied fix:** La lectura paso a `readHomeTestimonials`, que lanza dentro de `unstable_cache` sin `try/catch`. `getHomeTestimonials` es ahora `async`, hace el `try/catch` por fuera y devuelve null sin guardarlo en cache (el error se propaga fuera de la funcion cacheada, asi que Next no lo almacena). La firma publica no cambia (`Promise<HomeTestimonialItem[] | null>`). `54-home-b-ssr.ts` pasa.

## Skipped Issues

None. Todos los hallazgos en alcance se aplicaron.

---

_Fixed: 2026-11-08_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
