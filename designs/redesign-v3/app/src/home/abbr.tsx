import { Fragment, type ReactNode } from 'react';
import { Text } from './ui';
import { splitPending } from './pending';

// Siglas con <abbr> en su primera aparicion dentro de una seccion (A11Y.md, D-12).
// Helper del plan 52-04: no toca ui.tsx. Los marcadores [PENDIENTE: ...] pasan por Text sin cambios.
// Es una funcion y no un componente a proposito: `seen` se crea en cada render de la seccion y se muta
// en orden de evaluacion, asi que el doble render de StrictMode produce el mismo resultado.

export type Abbr = { term: string; meaning: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function chunk(value: string, abbrs: Abbr[], seen: Set<string>): ReactNode[] {
  const open = abbrs.filter((a) => !seen.has(a.term));
  if (open.length === 0) return [value];
  const meaning = new Map(open.map((a) => [a.term, a.meaning]));
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])(${open.map((a) => escape(a.term)).join('|')})(?![\\p{L}\\p{N}_])`, 'gu');
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of value.matchAll(re)) {
    const term = m[1];
    if (seen.has(term)) continue;
    seen.add(term);
    const start = m.index ?? 0;
    if (start > last) out.push(value.slice(last, start));
    out.push(
      <abbr key={`${term}-${start}`} title={meaning.get(term)}>
        {term}
      </abbr>,
    );
    last = start + term.length;
  }
  if (last < value.length) out.push(value.slice(last));
  return out;
}

/** Envuelve en <abbr> la primera aparicion de cada sigla que `seen` aun no tiene. */
export function abbrNodes(text: string, abbrs: Abbr[], seen: Set<string>): ReactNode {
  return splitPending(text).map((part, i) =>
    part.type === 'pending' ? <Text key={i}>{`[PENDIENTE: ${part.value}]`}</Text> : <Fragment key={i}>{chunk(part.value, abbrs, seen)}</Fragment>,
  );
}
