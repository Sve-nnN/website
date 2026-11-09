# Fase 54: elementos diferidos

## 54-06 (hallado, fuera del alcance de ese plan)

- `src/components/mui/FaqAccordion.tsx` (plan 54-05) pone `id={`${idPrefix}-${i}-c`}` en `AccordionDetails`, y MUI ya pone ese mismo id en la region del panel a partir del `aria-controls` del resumen. El HTML servido repite el id (dos elementos con el mismo valor). Arreglo: quitar `id` de `AccordionDetails` y dejarlo solo en `AccordionSummary` (`id` y `aria-controls`). Se corrigio igual en `Toc.tsx`. La autoprueba `54-primitives-ssr.ts` sigue pasando porque comprueba que cada `aria-controls` resuelve a un id, no que el id sea unico; conviene agregarle esa comprobacion al corregirlo.

**Resuelto en 54-08:** `FaqAccordion` ya no repite el id en `AccordionDetails` (lo pone MUI desde `aria-controls`), porque Servicios de la home lo usa y el HTML duplicaba cinco ids. `54-primitives-ssr.ts` y `54-home-ssr.ts` ahora comprueban que ningun id se repita.

## 54-12 (hallado, fuera del alcance de ese plan)

- Dos verificadores heredados de la fase 48 dependen del marcado Tailwind de `/stack` y dejan de coincidir con la vista MUI: `scripts/verify-stack-word-count.ts` busca `data-tool-narrative` en un `div` (la tarjeta nueva es un `li` sin ese marcador) y `scripts/verify-stack-page.ts` exige `aria-label="Breadcrumb"` (las migas MUI usan `common.breadcrumbsLabel`, "Ruta de navegación"). Ninguno forma parte de los scripts `54-*`. Decidir en 54-14 o 54-16 si se reemplazan por `54-stack-affiliate.mjs` y `54-stack-ssr.ts` o si se retiran con el corte de la fase 57. Los componentes viejos (`ToolCard`, `GearCard`, `StackHighlightCallout`, `AffiliateDisclosureFrame`) siguen en pie porque `blog/[category]/[slug]` y `AuditorCallout` los usan.
