// Presupuesto de efectos de la home (D-08). Modulo puro, sin React ni DOM: lo importa el motor y lo prueba el harness en Node.

export const MAX_EFFECTS_PER_PAGE = 2;

/** Registra un id de efecto. El tercer id distinto lanza un Error que lo nombra. */
export function claimEffectId(ids: Set<string>, id: string): void {
  if (ids.has(id)) return;
  if (ids.size >= MAX_EFFECTS_PER_PAGE) {
    throw new Error(
      `Presupuesto de efectos excedido (D-08): el id "${id}" seria el efecto ${ids.size + 1} y el maximo es ${MAX_EFFECTS_PER_PAGE} (ya registrados: ${[...ids].join(', ')})`,
    );
  }
  ids.add(id);
}
