/**
 * Tokens de Juan Tech. Fuente unica de verdad: el tema MUI y la pagina de
 * showcase leen de aqui. Valores heredados del mockup redesign-v5.
 * Cada par de texto y fondo esta medido en A11Y-DECISIONS.md.
 */
export const font = {
  sans: 'var(--font-geist-sans), "Geist", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: 'var(--font-geist-mono, ui-monospace), "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
} as const;

export const motion = { ease: 'cubic-bezier(0.22, 1, 0.36, 1)', fast: 200, base: 300, slow: 500 } as const;

/** Radios en px. MUI usa shape.borderRadius como unidad base. */
export const radius = { sm: 8, md: 16, lg: 24, xl: 32, pill: 9999 } as const;

export type SchemeTokens = {
  bg: string; surface: string; raised: string;
  text: string; muted: string;
  border: string;        // decorativo: tarjetas, divisores (no identifica controles)
  fieldBorder: string;   // identifica controles de formulario: minimo 3:1 (SC 1.4.11)
  accent: string; accentText: string; onAccent: string;
  good: string; mid: string; poor: string;
  band: { bg: string; surface: string; text: string; muted: string; border: string };
};

export const light: SchemeTokens = {
  bg: '#FAFAF7', surface: '#FFFFFF', raised: '#F0F0EA',
  text: '#12141C', muted: '#5B5F6E',
  border: '#D6D6CE', fieldBorder: '#8A8E9C',
  accent: '#F7581E', accentText: '#C23A05', onAccent: '#12141C',
  good: '#15803D', mid: '#B45309', poor: '#B91C1C',
  band: { bg: '#181818', surface: '#1F1F1F', text: '#FAFAF7', muted: '#B8B8B8', border: '#313131' },
};

export const dark: SchemeTokens = {
  bg: '#181818', surface: '#1F1F1F', raised: '#272727',
  text: '#FAFAF7', muted: '#B3B3B3',
  border: '#313131', fieldBorder: '#8F8F8F',
  accent: '#FF7A45', accentText: '#FF7A45', onAccent: '#12141C',
  good: '#4ADE80', mid: '#FBBF24', poor: '#F87171',
  band: { bg: '#000000', surface: '#181818', text: '#FAFAF7', muted: '#B8B8B8', border: '#313131' },
};

/** Gradiente de grano del blob (hero y CTA). Marca fija, no cambia con el tema. */
export const blobGradient =
  'radial-gradient(62% 56% at 24% 22%, #FFC08A 0%, transparent 70%), radial-gradient(58% 62% at 82% 76%, #D12E05 0%, transparent 72%), radial-gradient(46% 46% at 74% 18%, #FF8F52 0%, transparent 70%), radial-gradient(40% 44% at 18% 84%, #FF6A2B 0%, transparent 72%), #F7581E';

export const grainImage =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
