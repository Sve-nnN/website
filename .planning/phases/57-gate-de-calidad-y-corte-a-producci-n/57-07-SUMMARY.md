---
phase: 57-gate-de-calidad-y-corte-a-producci-n
plan: 07
subsystem: frontend
status: complete
tags: [tailwind, shadcn, radix, codigo-muerto, bundle, lockfile]
requires: [57-02, 57-03, 57-04, 57-06]
provides:
  - scripts/verify/57-unreachable-components.mjs (alcance estático con la API de TypeScript, --selftest)
  - scripts/verify/53-layer-check.mjs (comprobación inversa: sin Tailwind)
  - src/lib/unrendered-block.ts (aviso de servidor para bloques sin vista)
  - evidence/57-bundle-after.json y evidence/57-legacy-render-sweep-57-07.json (medición del preview tras el retiro)
affects: [57-08, 57-09, 57-11]
tech-stack:
  added: []
  removed: [tailwindcss, tailwindcss-animate, tailwind-merge, class-variance-authority, "@radix-ui/react-* (6)", clsx, autoprefixer]
  patterns:
    - "El default de los switches de bloques devuelve null y deja un console.warn de servidor en lugar de caer en un registro viejo"
    - "El lock se regenera con la misma versión de npm que corre en Dokploy (10.9.2), no con la local"
key-files:
  created:
    - scripts/verify/57-unreachable-components.mjs
    - src/lib/unrendered-block.ts
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-bundle-after.json
    - .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-legacy-render-sweep-57-07.json
  modified:
    - src/components/pages/ServiceDetailPage.tsx
    - src/components/pages/LocalLandingPage.tsx
    - src/components/richTextBlockConverters.tsx
    - src/components/AffiliateInlineCard.tsx
    - src/app/globals.css
    - scripts/verify/53-layer-check.mjs
    - scripts/verify/53-computed-styles.mjs
    - package.json
    - package-lock.json
  deleted:
    - tailwind.config.ts, postcss.config.js, postcss-tailwind-layer.cjs, components.json
    - src/components/ui/* (shadcn), src/lib/utils.ts
    - src/blocks/*/Component.tsx sin vista, src/blocks/RenderBlocks.tsx, src/blocks/blockRegistry.tsx
    - componentes viejos de src/components (PostCard, CaseStudyCard, ToolCard, GearCard y los demás del inventario)
    - scripts/verify-stack-word-count.ts, scripts/verify-stack-page.ts, scripts/verify-chart-bucketing.ts
decisions:
  - "El respaldo RenderBlocks sale de ServiceDetailPage y LocalLandingPage: un bloque sin vista devuelve null con aviso de servidor"
  - "Se conservan los esquemas src/blocks/*/config que usa el admin; solo salen los Component.tsx sin vista"
  - "recharts queda en package.json: no figura en la lista del plan y retirarlo es una decisión aparte"
  - "lead-magnet-content.ts se conserva porque sigue alcanzable"
  - "El lock se regenera con npm 10.9.2 para que npm ci pase en el VPS"
metrics:
  completed: 2026-11-23
actuals:
  tokens: 8700
  tasks: 3
  commits: 3
plan_head_before: 5c7df7e95f80a29878ada6f67c726b144b7c21f3
plan_head_after: c9aa03c8f5f3531bab5cf0a9009e2475223d3e1c
requirements-completed: [CAL-03]
---

# Phase 57 Plan 07: retiro de Tailwind, shadcn/Radix y componentes viejos Summary

Tailwind, shadcn/Radix y unos 105 archivos de código muerto salieron del repo. El CSS servido bajó de 53,5 a 8,8 KB (gzip de 10,1 a 2,1 KB), el JS bajó de 1245,6 a 1209,5 KB, y ninguna de las 174 URLs del preview emite clases utilitarias.

## Tareas

| Tarea | Commit | Resultado |
|---|---|---|
| 1. Alcance estático y retiro de componentes y del respaldo RenderBlocks | e682bab | 57-unreachable-components con autoprueba; defaults de ServiceDetailPage y LocalLandingPage devuelven null con aviso; borrados los candidatos sin importadores |
| 2. Quitar Tailwind, shadcn, configuración y dependencias | 8783482 | globals.css sin directivas, config y plugin de capa fuera, dependencias desinstaladas, 53-layer-check invertido |
| 3. Checkpoint: disco, push y build del preview | c9aa03c (corrección del lock) | Juan autorizó el push; el primer build falló en `npm ci` y se corrigió con un lock regenerado con npm 10.9.2 |

## Verificación

- Disco del VPS antes del push: 50% usado, 37 GB libres.
- `57-legacy-render-sweep` contra https://dev.juan-tech.com: 174 de 174 URLs sin clases utilitarias. Control positivo válido (1408, 942, 747 y 411 coincidencias en producción).
- `57-bundle-weight --compare evidence/57-bundle-before.json`: PASS.

| Tipo | Antes | Después | Diferencia | Gzip antes | Gzip después |
|---|---|---|---|---|---|
| CSS | 53,5 KB | 8,8 KB | -44,7 KB | 10,1 KB | 2,1 KB |
| JS | 1245,6 KB | 1209,5 KB | -36,1 KB | 406,3 KB | 392,9 KB |

- Despliegue más reciente del preview en done y contenedor sano.
- tsc, `57-unreachable-components --selftest` y `56-run-all --selftests --strict` salieron en 0 antes de cada commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Bloqueo] `npm ci` falló en Dokploy tras desinstalar los paquetes**
- **Found during:** Tarea 3 (primer build del preview)
- **Issue:** npm 11 local podó el peer opcional `next-intl/node_modules/@swc/helpers@0.5.24`. El npm 10.9.2 del VPS lo exige y `npm ci` abortó.
- **Fix:** se regeneró el lock con npm 10.9.2. No se instaló ningún paquete nuevo.
- **Files modified:** package-lock.json
- **Commit:** c9aa03c

**2. [Rule 2 - Funcionalidad crítica] Componentes vivos que aún usaban Tailwind**
- **Found during:** Tarea 1 y 2
- **Issue:** blog/confirm, EmailCaptureCard, AffiliateInlineCard y los respaldos de CodeBlockNode, FaqBlockNode y tablas de richTextBlockConverters seguían escritos con clases utilitarias y no podían quedar así sin Tailwind.
- **Fix:** se reescribieron en MUI. No hay cobertura visual automática de estos cambios.
- **Commit:** e682bab y 8783482

### Desvíos de proceso

- El plan pedía mostrar lo conservado y por qué; se resume abajo.
- La medición del preview no se guardó en evidence durante el checkpoint. Se repitió después y quedó en `57-bundle-after.json` y `57-legacy-render-sweep-57-07.json` con los mismos resultados.

## Conservado a propósito

- `recharts`: sigue en package.json, y como dependencia sin importadores vivos es candidato a retirar. No estaba en la lista de CAL-03, así que queda para decisión de Juan.
- `lead-magnet-content.ts`: alcanzable, no se borra.
- `src/blocks/*/config`: esquemas del admin de Payload (T-57-25).
- `lucide-react`: vive en los componentes MUI.

## Pendiente para Juan

1. Mirar a ojo en 57-09 las piezas reescritas en MUI sin cobertura visual: confirmación de newsletter, tarjeta de captura, tarjeta de afiliados, bloque de código, FAQ y tablas de texto enriquecido.
2. Decidir si `recharts` sale del package.json.

## Threat Flags

Ninguna. El plan solo borra código y desinstala paquetes; no abre superficie nueva.

## Self-Check: PASSED

- FOUND: e682bab, 8783482 y c9aa03c en HEAD
- FOUND: evidence/57-bundle-after.json y evidence/57-legacy-render-sweep-57-07.json
- `tailwind.config.ts` y `components.json` no existen
