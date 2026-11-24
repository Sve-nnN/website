import type { ReactElement, ReactNode } from 'react';
import type { OriginalName } from './originals';
import halftoneSample from '../../../assets/img/sample-halftone.svg';

// Fallbacks CSS de la fase 51: reproducen el marcado de system.html (seccion #efectos) con las mismas clases
// de assets/css/effects.css. Cada raiz lleva data-fallback. Sin JavaScript de efectos y sin canvas.

/** Texto de ejemplo de cada tarjeta. Lo comparten el fallback y las superficies que lo reutilizan. */
export const copy = {
  grain: 'Texto siempre sobre el scrim, nunca directo sobre el gradiente.',
  waves: 'Puntos halftone en fósforo que derivan despacio.',
  slats: 'Franjas en perspectiva.',
  pixelCard: 'Tramado de 6 px que se disuelve al pasar el puntero o al enfocar.',
  noise: 'Ruido sobre el gradiente de la marca.',
  dither: 'Bayer 4x4 en tres densidades.',
  blinds: 'El gradiente se ve a través de las persianas.',
  transitionCover: 'Portada del caso',
  transitionDetail: 'Detalle del caso con el resultado y los datos clave.',
  spotlight: 'La luz sigue al puntero fino. Sin puntero queda fija arriba y al centro.',
  star: 'Agenda una auditoría',
} as const;

/** Terminal de ejemplo del fallback CRT. */
export const CRT_LINES = ['> sistema visual v3', '> scanlines, viñeta y fósforo', '> listo_'];

// 9 filas por 44 columnas. Solo el juego .:-=+*#%@ y saltos de linea.
const ASCII_ROWS = [
  '+**####**+==----==+**####**+==----==+*#####*',
  '*#%%%%%%#*++====+**#%%%%%%#*++====+**#%%%%%%',
  '#%@@@@@@%#**++++**#%@@@@@@%#**++++**#%@@@@@%',
  '#%@@@@@@%#**++++**#%@@@@@@%#**++++**#%@@@@@@',
  '##%%@@%%##*++==++*##%%@@%%#**++==++*##%@@@%%',
  '+*##%%##*++=----=++*##%%##*+==----=++*##%%##',
  '=++****++=--::::--=++****++=--::::--=+*****+',
  '-==++++==-::....::-=+++++==-::....::-=+++++=',
  '-==++++==-:......:-==++++=--:......:-==++++=',
];
export const ASCII_ART = ASCII_ROWS.join('\n');

/** Bloque de texto sobre el scrim de la fase 51 (.fx-content). */
export function Scrim({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`fx-content ${className}`.trim()}>{children}</div>;
}

/** Terminal del fallback CRT; tambien se reutiliza sobre el original para leer el contraste. */
export function CrtText() {
  return (
    <p className="fx-crt-text">
      {CRT_LINES.map((line, i) => (
        <span key={line}>
          {line}
          {i < CRT_LINES.length - 1 ? <br /> : null}
        </span>
      ))}
    </p>
  );
}

const ascii = (): ReactElement => (
  <pre className="fx-ascii" data-fallback aria-hidden="true">
    {ASCII_ART}
  </pre>
);

export const fallbacks: Record<OriginalName, () => ReactElement> = {
  Grainient: () => (
    <div className="fx-grain" data-fallback>
      <Scrim>
        <p>{copy.grain}</p>
      </Scrim>
    </div>
  ),
  PatternWaves: () => (
    <div className="fx-waves" data-fallback>
      <Scrim>
        <p>{copy.waves}</p>
      </Scrim>
    </div>
  ),
  CRTWarp: () => (
    <div className="fx-crt" data-fallback>
      <CrtText />
    </div>
  ),
  MicroSlats: () => (
    <div className="fx-slats" data-fallback>
      <Scrim className="slats-label">
        <p>{copy.slats}</p>
      </Scrim>
    </div>
  ),
  PixelBlast: () => (
    <div className="fx-pixel" data-fallback>
      <Scrim>
        <p>Tramado de 6 px de fondo, sin canvas.</p>
      </Scrim>
    </div>
  ),
  PixelCard: () => (
    <div className="fx-pixel fx-pixel-card" data-fallback>
      <Scrim>
        <p>{copy.pixelCard}</p>
      </Scrim>
    </div>
  ),
  GradientASCII: ascii,
  ASCIIText: ascii,
  Noise: () => (
    <div className="fx-stage" data-fallback style={{ ['--noise-opacity' as string]: '.5' }}>
      <div className="fx-noise" aria-hidden="true" />
      <Scrim>
        <p>{copy.noise}</p>
      </Scrim>
    </div>
  ),
  Dither: () => (
    <div className="fx-dither" data-fallback>
      <Scrim className="dither-label">
        <p>{copy.dither}</p>
      </Scrim>
    </div>
  ),
  HalftoneReveal: () => (
    <div className="fx-reveal" data-fallback>
      <img src={halftoneSample} width={640} height={400} alt="Composición abstracta de círculos y bandas en violeta, coral y ámbar" />
    </div>
  ),
  PixelTransition: () => (
    <div className="fx-transition" data-fallback>
      <div className="fx-transition__cover">
        <Scrim>
          <p>{copy.transitionCover}</p>
        </Scrim>
      </div>
      <div className="fx-transition__detail">
        <p>{copy.transitionDetail}</p>
      </div>
    </div>
  ),
  FaultyTerminal: () => (
    <div className="fx-crt" data-fallback>
      <CrtText />
    </div>
  ),
  SpotlightCard: () => (
    <div className="fx-spotlight" data-fallback>
      <p>{copy.spotlight}</p>
    </div>
  ),
  GradientBlinds: () => (
    <div className="fx-blinds" data-fallback>
      <Scrim className="blinds-label">
        <p>{copy.blinds}</p>
      </Scrim>
    </div>
  ),
  StarBorder: () => (
    <div className="fx-showcase" data-fallback>
      <div className="fx-star-border">
        <button type="button" tabIndex={-1}>
          {copy.star}
        </button>
      </div>
    </div>
  ),
};

/** URL resuelta del SVG de muestra (en el build puede ser un data URI). */
export const halftoneSrc: string = halftoneSample;
