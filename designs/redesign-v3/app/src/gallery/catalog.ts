import { createElement as h, type ComponentType, type ReactNode } from 'react';
import { copy, CrtText, halftoneSrc, Scrim } from './fallbacks';
import { originals, type OriginalName } from './originals';
import type { Tokens } from './tokens';

// Origen, categoria y URL de cada fila se copian de tools/catalog.json (fuente unica de la fase 51).
// No se importa el JSON en tiempo de ejecucion para no sumarlo al bundle: el stage gallery de
// scripts/verify-app.mjs compara estos literales contra el archivo.

type Loader = () => Promise<{ default: ComponentType<any> }>;

export interface ShownProp {
  name: string;
  values: string[];
}

export interface CatalogEntry {
  name: OriginalName;
  title: string;
  originName: string;
  category: string;
  group: 'base' | 'scout';
  catalogId: string;
  docsUrl: string;
  /** Alto fijo del escenario: reserva el espacio y evita CLS. */
  stageHeight: string;
  /** true cuando el escenario es un fondo decorativo (aria-hidden). */
  decorative: boolean;
  /** Canvas que el original crea al montar (0 solo en SpotlightCard). */
  expectCanvas: 0 | 1;
  /** Como se coloca el original: llena el escenario o queda centrado con su tamano propio. */
  placement: 'fill' | 'center';
  loader: Loader;
  buildProps: (tokens: Tokens) => Record<string, unknown>;
  shownProps: (props: Record<string, unknown>) => ShownProp[];
  /** Texto de ejemplo sobre el scrim que se superpone al original (los fondos no admiten hijos). */
  overlay?: () => ReactNode;
  /** Envuelve al original cuando la composicion lo exige (por ejemplo Noise sobre el gradiente). */
  wrap?: (original: ReactNode) => ReactNode;
}

// Tope de DPR heredado de la fase 51. Solo lo reciben los originales cuyo tipo de props incluye dpr.
const DPR = 1.5;

const nodeLabel = '(contenido de ejemplo)';

function describe(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value !== null && typeof value === 'object') return [nodeLabel];
  const text = String(value);
  // En el build Vite inlinea el SVG de muestra como data URI: se muestra el nombre del archivo.
  if (text.startsWith('data:')) return ['sample-halftone.svg'];
  return [text];
}

// Estilo y layout no son props de diseno: no se listan.
const HIDDEN = new Set(['style', 'className']);

function shown(props: Record<string, unknown>): ShownProp[] {
  return Object.entries(props)
    .filter(([key]) => !HIDDEN.has(key))
    .map(([key, value]) => ({ name: key, values: describe(value) }));
}

const fill = { width: '100%', height: '100%' };

const text = (value: string) => h(Scrim, null, h('p', null, value));

export const catalog: CatalogEntry[] = [
  {
    name: 'Grainient',
    title: 'Grano degradado',
    originName: 'Grainient',
    category: 'Backgrounds',
    group: 'base',
    catalogId: 'grain',
    docsUrl: 'https://reactbits.dev/backgrounds/grainient',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['Grainient'],
    buildProps: (t) => ({ colors: [t.violet, t.coral, t.amber], dpr: DPR }),
    shownProps: shown,
    overlay: () => h('div', { className: 'stage-overlay' }, text(copy.grain)),
  },
  {
    name: 'PatternWaves',
    title: 'Ondas de patrón',
    originName: 'PatternWaves',
    category: 'Backgrounds',
    group: 'base',
    catalogId: 'waves',
    docsUrl: 'https://reactbits.dev/backgrounds/pattern-waves',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['PatternWaves'],
    buildProps: (t) => ({ color: t.phosphor, backgroundColor: t.ink }),
    shownProps: shown,
    overlay: () => h('div', { className: 'stage-overlay' }, text(copy.waves)),
  },
  {
    name: 'CRTWarp',
    title: 'Pantalla CRT',
    originName: 'CRTWarp',
    category: 'Backgrounds',
    group: 'base',
    catalogId: 'crt',
    docsUrl: 'https://reactbits.dev/backgrounds/crt-warp',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['CRTWarp'],
    buildProps: (t) => ({ color: t.phosphor, backgroundColor: t.ink, dpr: DPR }),
    shownProps: shown,
    overlay: () => h('div', { className: 'stage-overlay stage-overlay--crt' }, h(CrtText)),
  },
  {
    name: 'MicroSlats',
    title: 'Micro persianas',
    originName: 'MicroSlats',
    category: 'Backgrounds',
    group: 'base',
    catalogId: 'slats',
    docsUrl: 'https://reactbits.dev/backgrounds/micro-slats',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['MicroSlats'],
    buildProps: (t) => ({ color: t.violet, glintColor: t.amber, backgroundColor: t.ink }),
    shownProps: shown,
    overlay: () => h('div', { className: 'stage-overlay' }, text(copy.slats)),
  },
  {
    name: 'PixelBlast',
    title: 'Pixel de fondo',
    originName: 'PixelBlast',
    category: 'Backgrounds',
    group: 'base',
    catalogId: 'pixel-blast',
    docsUrl: 'https://reactbits.dev/backgrounds/pixel-blast',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['PixelBlast'],
    buildProps: (t) => ({ color: t.violet, accentColor: t.coral, dpr: DPR }),
    shownProps: shown,
    overlay: () => h('div', { className: 'stage-overlay' }, text('Tramado de 6 px de fondo, sin canvas.')),
  },
  {
    name: 'PixelCard',
    title: 'Tarjeta pixel',
    originName: 'PixelCard',
    category: 'Components',
    group: 'base',
    catalogId: 'pixel-card',
    docsUrl: 'https://reactbits.dev/components/pixel-card',
    stageHeight: '26rem',
    decorative: false,
    expectCanvas: 1,
    placement: 'center',
    loader: originals['PixelCard'],
    buildProps: (t) => ({
      colors: [t.violet, t.coral, t.amber],
      glowColor: t.amber,
      theme: 'dark',
      style: { width: 'min(100%, 20rem)', height: '100%' },
      children: text(copy.pixelCard),
    }),
    shownProps: shown,
  },
  {
    name: 'GradientASCII',
    title: 'ASCII de fondo',
    originName: 'GradientASCII',
    category: 'Backgrounds',
    group: 'base',
    catalogId: 'gradient-ascii',
    docsUrl: 'https://reactbits.dev/backgrounds/gradient-ascii',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['GradientASCII'],
    buildProps: (t) => ({ colors: [t.violet, t.coral, t.amber], characters: '.:-=+*#%@', dpr: DPR }),
    shownProps: shown,
  },
  {
    name: 'ASCIIText',
    title: 'Texto ASCII',
    originName: 'ASCIIText',
    category: 'Text Animations',
    group: 'base',
    catalogId: 'ascii-text',
    docsUrl: 'https://reactbits.dev/text-animations/ascii-text',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['ASCIIText'],
    buildProps: (t) => ({ text: 'JUAN', textColor: t.paper, colors: [t.violet, t.coral, t.amber], charset: '.:-=+*#%@' }),
    shownProps: shown,
  },
  {
    name: 'Noise',
    title: 'Ruido',
    originName: 'Noise',
    category: 'Animations',
    group: 'scout',
    catalogId: 'noise',
    docsUrl: 'https://www.reactbits.dev/animations/noise',
    stageHeight: '14rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['Noise'],
    buildProps: () => ({ opacity: 0.5, blendMode: 'overlay', colored: false, fixed: false }),
    shownProps: shown,
    // El original es una capa de grano: se monta sobre el mismo gradiente y el mismo texto del fallback.
    wrap: (original) =>
      h('div', { className: 'fx-stage stage-fill' }, original, text(copy.noise)),
  },
  {
    name: 'Dither',
    title: 'Tramado Dither',
    originName: 'Dither',
    category: 'Backgrounds',
    group: 'scout',
    catalogId: 'dither',
    docsUrl: 'https://www.reactbits.dev/backgrounds/dither',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['Dither'],
    buildProps: (t) => ({ waveColor: t.violet, backgroundColor: t.ink, dpr: DPR }),
    shownProps: shown,
    overlay: () => h('div', { className: 'stage-overlay' }, text(copy.dither)),
  },
  {
    name: 'HalftoneReveal',
    title: 'Revelado halftone',
    originName: 'Halftone Reveal',
    category: 'Animations',
    group: 'scout',
    catalogId: 'halftone-reveal',
    docsUrl: 'https://www.reactbits.dev/animations/halftone-reveal',
    stageHeight: '18rem',
    decorative: false,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['HalftoneReveal'],
    buildProps: (t) => ({
      src: halftoneSrc,
      mode: 'duotone',
      inkColor: t.ink,
      accentColor: t.coral,
      paperColor: t.paper,
    }),
    shownProps: shown,
  },
  {
    name: 'PixelTransition',
    title: 'Transición pixel',
    originName: 'Pixel Transition',
    category: 'Animations',
    group: 'scout',
    catalogId: 'pixel-transition',
    docsUrl: 'https://www.reactbits.dev/animations/pixel-transition',
    stageHeight: '20rem',
    decorative: false,
    expectCanvas: 1,
    placement: 'center',
    loader: originals['PixelTransition'],
    buildProps: (t) => ({
      pixelColor: t.violet,
      style: { width: 'min(100%, 18rem)' },
      firstContent: h('div', { className: 'stage-panel-fill' }, text(copy.transitionCover)),
      secondContent: h('div', { className: 'stage-panel-fill' }, text(copy.transitionDetail)),
    }),
    shownProps: shown,
  },
  {
    name: 'FaultyTerminal',
    title: 'Terminal averiada',
    originName: 'Faulty Terminal',
    category: 'Backgrounds',
    group: 'scout',
    catalogId: 'faulty-terminal',
    docsUrl: 'https://www.reactbits.dev/backgrounds/faulty-terminal',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['FaultyTerminal'],
    buildProps: (t) => ({ tint: t.phosphor, dpr: DPR }),
    shownProps: shown,
  },
  {
    name: 'SpotlightCard',
    title: 'Tarjeta con foco de luz',
    originName: 'Spotlight Card',
    category: 'Components',
    group: 'scout',
    catalogId: 'spotlight-card',
    docsUrl: 'https://www.reactbits.dev/components/spotlight-card',
    stageHeight: '12rem',
    decorative: false,
    expectCanvas: 0,
    placement: 'fill',
    loader: originals['SpotlightCard'],
    buildProps: (t) => ({
      spotlightColor: t.paper,
      style: fill,
      children: h(Scrim, null, h('p', null, copy.spotlight)),
    }),
    shownProps: shown,
  },
  {
    name: 'GradientBlinds',
    title: 'Persianas con gradiente',
    originName: 'Gradient Blinds',
    category: 'Backgrounds',
    group: 'scout',
    catalogId: 'gradient-blinds',
    docsUrl: 'https://www.reactbits.dev/backgrounds/gradient-blinds',
    stageHeight: '18rem',
    decorative: true,
    expectCanvas: 1,
    placement: 'fill',
    loader: originals['GradientBlinds'],
    buildProps: (t) => ({ gradientColors: [t.violet, t.coral, t.amber], lightColor: t.paper, dpr: DPR }),
    shownProps: shown,
    overlay: () => h('div', { className: 'stage-overlay' }, text(copy.blinds)),
  },
  {
    name: 'StarBorder',
    title: 'Borde estrella',
    originName: 'Star Border',
    category: 'Animations',
    group: 'scout',
    catalogId: 'star-border',
    docsUrl: 'https://www.reactbits.dev/animations/star-border',
    stageHeight: '12rem',
    decorative: false,
    expectCanvas: 1,
    placement: 'center',
    loader: originals['StarBorder'],
    buildProps: (t) => ({
      color: t.amber,
      trailColor: t.coral,
      backgroundColor: t.inkRaised,
      textColor: t.paper,
      borderColor: t.quiet,
      children: copy.star,
    }),
    shownProps: shown,
  },
];
