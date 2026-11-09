# Fase 54: elementos diferidos

## 54-06 (hallado, fuera del alcance de ese plan)

- `src/components/mui/FaqAccordion.tsx` (plan 54-05) pone `id={`${idPrefix}-${i}-c`}` en `AccordionDetails`, y MUI ya pone ese mismo id en la region del panel a partir del `aria-controls` del resumen. El HTML servido repite el id (dos elementos con el mismo valor). Arreglo: quitar `id` de `AccordionDetails` y dejarlo solo en `AccordionSummary` (`id` y `aria-controls`). Se corrigio igual en `Toc.tsx`. La autoprueba `54-primitives-ssr.ts` sigue pasando porque comprueba que cada `aria-controls` resuelve a un id, no que el id sea unico; conviene agregarle esa comprobacion al corregirlo.

**Resuelto en 54-08:** `FaqAccordion` ya no repite el id en `AccordionDetails` (lo pone MUI desde `aria-controls`), porque Servicios de la home lo usa y el HTML duplicaba cinco ids. `54-primitives-ssr.ts` y `54-home-ssr.ts` ahora comprueban que ningun id se repita.

## 54-12 (hallado, fuera del alcance de ese plan)

- Dos verificadores heredados de la fase 48 dependen del marcado Tailwind de `/stack` y dejan de coincidir con la vista MUI: `scripts/verify-stack-word-count.ts` busca `data-tool-narrative` en un `div` (la tarjeta nueva es un `li` sin ese marcador) y `scripts/verify-stack-page.ts` exige `aria-label="Breadcrumb"` (las migas MUI usan `common.breadcrumbsLabel`, "Ruta de navegación"). Ninguno forma parte de los scripts `54-*`. Decidir en 54-14 o 54-16 si se reemplazan por `54-stack-affiliate.mjs` y `54-stack-ssr.ts` o si se retiran con el corte de la fase 57. Los componentes viejos (`ToolCard`, `GearCard`, `StackHighlightCallout`, `AffiliateDisclosureFrame`) siguen en pie porque `blog/[category]/[slug]` y `AuditorCallout` los usan.

## 54-14 (decision sobre los verificadores de la fase 48)

- `scripts/verify-stack-word-count.ts` y `scripts/verify-stack-page.ts` no se adaptan: se retiran con el corte de la fase 57, junto con `ToolCard`, `GearCard`, `StackHighlightCallout` y `AffiliateDisclosureFrame`. Dependen de marcado Tailwind, de un dev server en `localhost:3000` y de `--env-file=.env` contra la base de produccion, y nada los invoca. `54-stack-ssr.ts` y `54-stack-affiliate.mjs` cubren su contrato estructural y el de afiliados.
- **Hueco abierto:** ningun script `54-*` comprueba el minimo de 100 palabras por narrativa de herramienta (STACK-02 de la fase 48). Si se quiere conservar, agregarlo a `54-stack-ssr.ts` leyendo `narrative` del doc ya descargado (54-16 o verificacion de fase).
- Pendiente de 54-16: supuesto A7 (rol `juantech_preview_ro` lee `home_page*` y `about_page*`) y, con la home completa, lecturas nuevas de `websites`, `testimonials`, `clientes`, `featured-content` y el doc `home`.

## 54-16 (hueco cerrado)

- El minimo de 100 palabras por narrativa de herramienta (STACK-02 de la fase 48) ya lo comprueba `54-stack-ssr.ts` sobre el doc real: todas las narrativas cumplen. El hueco abierto en 54-14 queda cerrado.
