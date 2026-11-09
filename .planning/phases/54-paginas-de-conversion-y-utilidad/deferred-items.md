# Fase 54: elementos diferidos

## 54-06 (hallado, fuera del alcance de ese plan)

- `src/components/mui/FaqAccordion.tsx` (plan 54-05) pone `id={`${idPrefix}-${i}-c`}` en `AccordionDetails`, y MUI ya pone ese mismo id en la region del panel a partir del `aria-controls` del resumen. El HTML servido repite el id (dos elementos con el mismo valor). Arreglo: quitar `id` de `AccordionDetails` y dejarlo solo en `AccordionSummary` (`id` y `aria-controls`). Se corrigio igual en `Toc.tsx`. La autoprueba `54-primitives-ssr.ts` sigue pasando porque comprueba que cada `aria-controls` resuelve a un id, no que el id sea unico; conviene agregarle esa comprobacion al corregirlo.

**Resuelto en 54-08:** `FaqAccordion` ya no repite el id en `AccordionDetails` (lo pone MUI desde `aria-controls`), porque Servicios de la home lo usa y el HTML duplicaba cinco ids. `54-primitives-ssr.ts` y `54-home-ssr.ts` ahora comprueban que ningun id se repita.
