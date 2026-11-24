import type { ComponentType } from 'react';

// Un import() literal por original: Vite emite un chunk diferido por componente y ninguno entra al bundle inicial.
// Los archivos viven en src/components/reactbits (generados por scripts/install-reactbits.mjs, no versionados).
export type OriginalName =
  | 'Grainient'
  | 'PatternWaves'
  | 'CRTWarp'
  | 'MicroSlats'
  | 'PixelBlast'
  | 'PixelCard'
  | 'GradientASCII'
  | 'ASCIIText'
  | 'Noise'
  | 'Dither'
  | 'HalftoneReveal'
  | 'PixelTransition'
  | 'FaultyTerminal'
  | 'SpotlightCard'
  | 'GradientBlinds'
  | 'StarBorder';

// Cada original declara sus propias props; la galeria las arma desde catalog.buildProps.
type Loader = () => Promise<{ default: ComponentType<any> }>;

export const originals: Record<OriginalName, Loader> = {
  Grainient: () => import('../components/reactbits/Grainient/Grainient'),
  PatternWaves: () => import('../components/reactbits/PatternWaves/PatternWaves'),
  CRTWarp: () => import('../components/reactbits/CRTWarp/CRTWarp'),
  MicroSlats: () => import('../components/reactbits/MicroSlats/MicroSlats'),
  PixelBlast: () => import('../components/reactbits/PixelBlast/PixelBlast'),
  PixelCard: () => import('../components/reactbits/PixelCard/PixelCard'),
  GradientASCII: () => import('../components/reactbits/GradientASCII/GradientASCII'),
  ASCIIText: () => import('../components/reactbits/ASCIIText/ASCIIText'),
  Noise: () => import('../components/reactbits/Noise/Noise'),
  Dither: () => import('../components/reactbits/Dither/Dither'),
  HalftoneReveal: () => import('../components/reactbits/HalftoneReveal/HalftoneReveal'),
  PixelTransition: () => import('../components/reactbits/PixelTransition/PixelTransition'),
  FaultyTerminal: () => import('../components/reactbits/FaultyTerminal/FaultyTerminal'),
  SpotlightCard: () => import('../components/reactbits/SpotlightCard/SpotlightCard'),
  GradientBlinds: () => import('../components/reactbits/GradientBlinds/GradientBlinds'),
  StarBorder: () => import('../components/reactbits/StarBorder/StarBorder'),
};
