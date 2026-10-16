import { rows } from '../../../tools/catalog.json';
import type { OriginalName } from './originals';
import type { Tokens } from './tokens';

export interface CatalogEntry {
  name: OriginalName;
  title: string;
  category: string;
  group: 'base' | 'scout';
  catalogId: string;
  docsUrl: string;
  buildProps: (tokens: Tokens) => Record<string, unknown>;
}

// Categoria y URL de documentacion salen de tools/catalog.json (fuente unica de la fase 51), no se duplican.
function fromCatalog(catalogId: string): { category: string; docsUrl: string } {
  const row = rows.find((r) => r.id === catalogId);
  if (!row) throw new Error(`tools/catalog.json no tiene la fila ${catalogId}`);
  return { category: row.category, docsUrl: row.url };
}

export const catalog: CatalogEntry[] = [
  {
    name: 'Grainient',
    title: 'Grano degradado',
    group: 'base',
    catalogId: 'grain',
    ...fromCatalog('grain'),
    buildProps: (t) => ({ colors: [t.violet, t.coral, t.amber] }),
  },
];
