// Parser puro del marcador de pendiente: [PENDIENTE: descripcion de lo que falta].
// Lo comparten el lint (scripts/check-copy.mjs) y el componente Pending de ui.tsx, para que no diverjan.
// Sin importaciones, sin JSX, sin acceso a window. Node 24 lo carga sin compilar (solo sintaxis borrable).

export type PendingPart = { type: 'text'; value: string } | { type: 'pending'; value: string };

/** Marcador bien formado: descripcion no vacia, sin corchete de cierre ni salto de linea. */
export const PENDING_RE = /\[PENDIENTE:[ \t]*([^\]\n]*[^\]\s][^\]\n]*)\]/g;

/** Intento de marcador: la palabra PENDIENTE (cualquier caja) tras un corchete de apertura. */
const ATTEMPT_RE = /\[\s*pendiente/i;

/** Divide una cadena en tramos de texto y de pendiente, en orden. Cadena vacia devuelve lista vacia. */
export function splitPending(text: string): PendingPart[] {
  const parts: PendingPart[] = [];
  let last = 0;
  for (const m of text.matchAll(PENDING_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ type: 'text', value: text.slice(last, start) });
    parts.push({ type: 'pending', value: m[1].trim() });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

/** Cuenta solo los marcadores bien formados. */
export function countPending(text: string): number {
  let n = 0;
  for (const _ of text.matchAll(PENDING_RE)) n += 1;
  return n;
}

/** Detecta intentos mal formados: quita los marcadores validos y busca lo que quede. */
export function hasMalformedPending(text: string): boolean {
  return ATTEMPT_RE.test(text.replace(PENDING_RE, ''));
}
