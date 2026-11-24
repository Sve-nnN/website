---
phase: 52-home-mockup-y-gate-de-revision
plan: 03
subsystem: designs/redesign-v3/app (secciones de prueba de la home)
tags: [home, copy, errores-reales, casos, websites, testimonio, d-05, a11y]
requires: [52-01, 52-02]
provides:
  - "sections/01-clientes.tsx, 02-errores-reales.tsx, 03-casos.tsx, 04-websites.tsx, 08-testimonio.tsx"
  - "copy/clientes.json, errores-reales.json, casos.json, websites.json, testimonio.json"
  - "styles/proof.css"
  - "scripts/home-stages/proof.mjs (stage proof, p0 a p17)"
affects: [52-04, 52-05, 52-06, 52-07]
key-files:
  created:
    - designs/redesign-v3/app/src/home/sections/01-clientes.tsx
    - designs/redesign-v3/app/src/home/sections/02-errores-reales.tsx
    - designs/redesign-v3/app/src/home/sections/03-casos.tsx
    - designs/redesign-v3/app/src/home/sections/04-websites.tsx
    - designs/redesign-v3/app/src/home/sections/08-testimonio.tsx
    - designs/redesign-v3/app/src/home/copy/clientes.json
    - designs/redesign-v3/app/src/home/copy/errores-reales.json
    - designs/redesign-v3/app/src/home/copy/casos.json
    - designs/redesign-v3/app/src/home/copy/websites.json
    - designs/redesign-v3/app/src/home/copy/testimonio.json
    - designs/redesign-v3/app/src/home/styles/proof.css
    - designs/redesign-v3/app/scripts/home-stages/proof.mjs
    - designs/redesign-v3/reports/home/proof-desktop.jpg
    - designs/redesign-v3/reports/home/proof-mobile.jpg
  modified: []
requirements-completed: [HOME-01, HOME-03]
status: complete
commits: 3
plan_head_before: 46bbe5343cf259e07b6f911e690dd83a6a49fb2f
actuals:
  tokens: 21000
  tasks: 3
  commits: 3
---

# Phase 52 Plan 03: Secciones de prueba de la home Summary

Cinco secciones de prueba en ES y EN: 28 clientes como texto en dos grupos, tres fixes del repo público con el código idéntico al seed y enlace al commit real, tres casos con métricas de Search Console, tres websites con su puntaje y la única cita real, con todo dato faltante marcado como pendiente.

## Resultados de verificación

- `node scripts/check-copy.mjs` sobre los cinco JSON: `archivos=5 fail=0 warn=0`.
- `npm run typecheck` y `npm run build`: en verde.
- `node scripts/verify-home.mjs --stage=proof --shots`: **30 PASS, 0 FAIL** (p0, p1 a p6 y p9 a p15 en ES y EN, p4 a 320 px en ES y EN, p7 lint, p8 consola y red, p17 capturas).
- p3 compara el `textContent` de cada `pre[lang="en"]` con las constantes `HREFLANG_CODE`, `SITEMAP_CODE` y `AVIF_CODE` de `scripts/seed-home.ts` (leídas del archivo en cada corrida): idénticas carácter por carácter. Los enlaces de commit son exactamente `https://github.com/Sve-nnN/website/commit/{23646a1,6849e95,4f8942e}`.
- El campo `code` de `errores-reales.json` se generó con un script desechable que extrae las constantes del seed (sin retranscribir a mano).
- `git diff --name-only 46bbe53 HEAD` no lista nada fuera de `designs/redesign-v3/`; `git status` de `package.json`, lockfiles y `src/` raíz: sin salida.
- Capturas revisadas a la vista: `proof-desktop.jpg` (277 KB) y `proof-mobile.jpg` (245 KB). Sin desbordes, contraste correcto, código legible en ambos anchos.

## Decisiones de Juan que surgieron

1. **Ciudades en títulos de casos.** El caso de inmigración conserva "Atlanta" tal como lo publica el sitio vivo (guía 4.1 regla 5 pide cliente anónimo). Los otros dos títulos no traen ciudad. Decidir si se quita.
2. **Cita única.** Solo entra la cita de Patricia Ibarra (Estylopia). La traducción EN "Working with Juan was the best." es provisional y lleva pendiente. Un `<h2>` "Testimonios" en plural con una sola cita es literal del mapa.
3. **Puntajes sin fecha ni herramienta.** 83, 73 y 67 vienen de `/websites` vivo; queda un pendiente visible por bloque.
4. **Slugs y cifras sin verificar en línea.** Los slugs de casos y websites salen del mapa de copy; no se validó que cada URL viva responda.

## Excepciones `_allow`

Ninguna. `_sameAllowed`: `groups.0.heading` ("SEO", igual en ES y EN) en `clientes.json` y los tres `fixes.N.language` en `errores-reales.json`.

## Correcciones aplicadas al copy fuente

- Título de errores reales sin coma ("Errores reales y el commit que los corrige"); "podés" a "puedes".
- Síntoma del sitemap reescrito sin la cifra 500 ("fallaba con un error de servidor"), porque 500 no está en la tabla de cifras permitidas.
- Voz pasiva: "quedaba servido el fallback" a "la ruta servía el fallback"; EN "Images were served" a "The site served images"; desenlaces con verbo activo ("El sitio sirve AVIF...").
- "86 000" con espacio de no separación; sectores con coma, sin guion largo; "Los clientes quedan anónimos" en lugar de "van anonimizados".

## Deviations from Plan

**1. [Ajuste menor] Humanizer revisado a mano.** Igual que en 52-01, las cadenas reescritas se calibraron a mano contra `research/voice-sample-juan.md` y la guía 4.1, sin invocar la skill como herramienta. El lint pasa sin FAIL ni WARN.

**2. [Ajuste menor] Estructura de la tarjeta de caso.** El `ctaLabel` ("Leer el caso completo") va como texto con `aria-hidden` porque el enlace del título ya cubre toda la tarjeta (`card--link`); así no hay enlaces anidados ni nombres duplicados para lectores de pantalla.

**3. [Ajuste menor] Chips de clientes** con fuente del cuerpo y sin mayúsculas forzadas, para no alterar nombres propios.

Sin otras desviaciones. No se instaló ningún paquete. STATE.md, ROADMAP.md y REQUIREMENTS.md no se tocaron en esta rama para evitar conflictos con 52-04 y 52-05 (misma ola); el orquestador los actualiza al fusionar.

## Known Stubs

Pendientes visibles intencionales (D-05, no son stubs de código): logos de clientes como imagen, más citas reales, confirmación de la cita y su traducción, fecha y herramienta de los puntajes. Los resuelven fases o decisiones posteriores de Juan.

## Threat Flags

Ninguna superficie nueva. T-52-02 (SafeLink y V14, URLs exactas de commit), T-52-07 (cifras con `_numbers`, "Marcela" e "Ibáñez" ausentes en p14, casos +68, +143, +104 ausentes en p9), T-52-10 (p3 contra el seed), T-52-03 (p8, 0 peticiones externas) y T-52-SC (cero instalaciones) mitigadas.

## Pendiente de revisión humana

Leer en voz alta las cinco secciones en `/` y `/en` (`npm --prefix designs/redesign-v3/app run preview`) y confirmar que suenan a Juan.

## Self-Check: PASSED

- Archivos creados presentes en disco (5 secciones, 5 JSON, proof.css, proof.mjs, 2 capturas).
- Commits `c74890a`, `36db9ee` y `532e5fd` presentes en `git log`.
