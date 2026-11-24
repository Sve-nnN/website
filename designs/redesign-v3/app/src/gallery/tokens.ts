export interface Tokens {
  ink: string;
  violet: string;
  coral: string;
  amber: string;
  phosphor: string;
  paper: string;
  quiet: string;
  inkRaised: string;
  scrim: string;
}

// Nombre de la variable CSS de tokens.css por cada clave. Ningun literal hexadecimal vive en TypeScript.
const VARS: Record<keyof Tokens, string> = {
  ink: '--ink',
  violet: '--violet',
  coral: '--coral',
  amber: '--amber',
  phosphor: '--phosphor',
  paper: '--paper',
  quiet: '--quiet',
  inkRaised: '--ink-raised',
  scrim: '--scrim',
};

/** Lee los tokens resueltos de :root. Lanza un Error que nombra el token si alguno viene vacio. */
export function readTokens(): Tokens {
  const style = getComputedStyle(document.documentElement);
  const out = {} as Tokens;
  for (const key of Object.keys(VARS) as (keyof Tokens)[]) {
    const value = style.getPropertyValue(VARS[key]).trim();
    if (!value) throw new Error(`Token ${VARS[key]} vacio: tokens.css no se cargo o cambio de nombre`);
    out[key] = value;
  }
  return out;
}
