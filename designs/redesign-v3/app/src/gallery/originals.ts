import type { ComponentType } from 'react';

// Un import() literal por original: Vite emite un chunk diferido por componente y ninguno entra al bundle inicial.
// Los archivos viven en src/components/reactbits (generados por scripts/install-reactbits.mjs, no versionados).
export type OriginalName = 'Grainient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loader = () => Promise<{ default: ComponentType<any> }>;

export const originals: Record<OriginalName, Loader> = {
  Grainient: () => import('../components/reactbits/Grainient/Grainient'),
};
