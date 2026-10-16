import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { originals } from '../../gallery/originals';
import { useHome } from '../ctx';
import { Icon } from '../ui';
import { token } from './colors';

// Efectos de React Bits en la home v4. Cada original entra con React.lazy (chunk propio, fuera del bundle de entrada) y
// solo se pide cuando fxOk lo permite: desktop con puntero fino, despues de load y LCP, sin pausa, sin reduced motion, sin ahorro de datos.
// Los componentes originales no se modifican: aqui solo se configuran sus props. Cada superficie lleva un fallback HTML/CSS identico.

const LSpotlight = lazy(originals.SpotlightCard);
const LStar = lazy(originals.StarBorder);
const LNoise = lazy(originals.Noise);
const LDither = lazy(originals.Dither);
const LHalftone = lazy(originals.HalftoneReveal);

/** Si el chunk del original falla, la superficie se queda con su fallback. */
class Boundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('Home v4: el original no se pudo montar, queda el fallback', error);
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

/** Hijo sonda: su efecto corre cuando el original diferido ya se renderizo dentro del Suspense. */
function Probe({ onReady }: { onReady: (ready: boolean) => void }) {
  useEffect(() => {
    onReady(true);
    return () => onReady(false);
  }, [onReady]);
  return null;
}

/* ---------- SpotlightCard: superficies del bento de servicios y de casos ---------- */

interface SpotProps {
  className: string;
  /** Token CSS del color de la luz (por ejemplo --paper). */
  light: string;
  /** Intensidad del foco, de 0 a 1. */
  intensity?: number;
  /** Tema del original: 'dark' para superficies oscuras, 'light' para papel. */
  theme?: 'dark' | 'light';
  children: ReactNode;
}

// El borde de 1 px del original compite con los bordes gruesos del diseno: se deja solo el brillo de borde al hover.
const BORDERLESS = { '--spotlight-card-border': 'transparent' } as CSSProperties;

/** Superficie con foco de luz que sigue al puntero. Sin efectos disponibles es un <div> con las mismas clases. */
export function Spot({ className, light, intensity = 0.16, theme = 'dark', children }: SpotProps) {
  const { fxOk, palette } = useHome();
  const color = useMemo(() => (fxOk ? token(light) : ''), [fxOk, light, palette]);
  const plain = <div className={className}>{children}</div>;
  if (!fxOk) return plain;
  return (
    <Boundary fallback={plain}>
      <Suspense fallback={plain}>
        <LSpotlight className={className} style={BORDERLESS} spotlightColor={color} intensity={intensity} theme={theme} spotlightSize={320} softness={0.8} borderGlow={0.5} flare={false} ambient={false}>
          {children}
        </LSpotlight>
      </Suspense>
    </Boundary>
  );
}

/* ---------- StarBorder: boton principal ---------- */

interface CtaProps {
  href: string;
  label: string;
  /** Variante visual: tinta sobre papel o acento sobre tinta (footer). */
  variant?: 'ink' | 'accent-inv';
  /** Con true intenta montar StarBorder; con false queda el boton HTML. */
  star?: boolean;
}

/** Boton "Pedir auditoria 360". Con StarBorder un haz orbita el borde; sin efectos es el .btn del diseno, del mismo tamano. */
export function Cta({ href, label, variant = 'ink', star = true }: CtaProps) {
  const { fxOk, palette } = useHome();
  const cls = `btn btn-lg${variant === 'accent-inv' ? ' btn-tomato' : ''}`;
  const inner = (
    <>
      <span>{label}</span>
      <Icon name="arrow-right" />
    </>
  );
  const plain = (
    <a className={cls} href={href}>
      {inner}
    </a>
  );
  const colors = useMemo(() => {
    if (!(fxOk && star)) return null;
    return variant === 'accent-inv'
      ? { bg: token('--accent-inv'), fg: token('--on-accent-inv'), beam: token('--inv-fg') }
      : { bg: token('--fg'), fg: token('--bg'), beam: token('--accent-inv') };
  }, [fxOk, star, variant, palette]);
  if (!colors) return plain;
  return (
    <Boundary fallback={plain}>
      <Suspense fallback={plain}>
        <LStar as="a" href={href} className={cls} color={colors.beam} trailColor={colors.beam} backgroundColor={colors.bg} textColor={colors.fg} borderColor={colors.fg} radius={0} thickness={2} duration={7} hover="lap" stars={3}>
          {inner}
        </LStar>
      </Suspense>
    </Boundary>
  );
}

/* ---------- Noise: grano de papel global ---------- */

/** Capa fija de grano estatico (fps 0) con muy poca opacidad. Reemplaza al grano SVG del CSS y solo se monta en paletas claras. */
export function PaperNoise() {
  const { staticFxOk, palette } = useHome();
  const light = palette === 'papel-bosque' || palette === 'papel-tomate' || palette === 'papel-cobalto';
  const on = staticFxOk && light;
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (on && ready) root.setAttribute('data-noise', 'on');
    else root.removeAttribute('data-noise');
    return () => root.removeAttribute('data-noise');
  }, [on, ready]);
  useEffect(() => {
    if (!on) setReady(false);
  }, [on]);
  if (!on) return null;
  return (
    <Boundary>
      <Suspense fallback={null}>
        <LNoise fixed opacity={0.03} fps={0} size={1.4} blendMode="multiply" contrast={0.35} zIndex={45} />
        <Probe onReady={setReady} />
      </Suspense>
    </Boundary>
  );
}

/* ---------- Dither: banda del hero ---------- */

/** Banda de tramado en la base del hero. Un shader WebGL, pausado fuera del viewport. Fallback: puntos CSS estaticos. */
export function HeroBand() {
  const { heavyActive, wantHeavy, palette } = useHome();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const active = heavyActive === 'hero-dither';

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((records) => {
      for (const r of records) wantHeavy('hero-dither', r.isIntersecting);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      wantHeavy('hero-dither', false);
    };
  }, [wantHeavy]);

  useEffect(() => {
    if (!active) setReady(false);
  }, [active]);

  const colors = useMemo(() => (active ? { wave: token('--fg'), bg: token('--bg'), mid: token('--muted') } : null), [active, palette]);
  const onReady = useCallback((r: boolean) => setReady(r), []);

  return (
    <div ref={ref} className="fx-band" aria-hidden="true" data-fx="dither" data-mounted={active && ready ? 'true' : 'false'}>
      {colors ? (
        <div className={`fx-canvas${ready ? ' is-on' : ''}`}>
          <Boundary>
            <Suspense fallback={null}>
              <LDither waveColor={colors.wave} backgroundColor={colors.bg} palette={[colors.bg, colors.mid, colors.wave]} pixelSize={4} waveAmplitude={0.32} waveFrequency={2.4} waveSpeed={0.025} enableMouseInteraction={false} dpr={1} />
              <Probe onReady={onReady} />
            </Suspense>
          </Boundary>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- HalftoneReveal: capturas de websites ---------- */

/** Trazo de halftone que sigue al puntero sobre la captura. Se monta solo mientras el puntero esta encima. */
export function SiteHalftone({ src, hot }: { src: string; hot: boolean }) {
  const { heavyActive, wantHeavy, palette } = useHome();
  const [ready, setReady] = useState(false);
  const wanted = useRef(false);

  useEffect(() => {
    if (wanted.current === hot) return;
    wanted.current = hot;
    wantHeavy('sites-halftone', hot);
  }, [hot, wantHeavy]);
  useEffect(() => () => wantHeavy('sites-halftone', false), [wantHeavy]);

  const active = hot && heavyActive === 'sites-halftone';
  useEffect(() => {
    if (!active) setReady(false);
  }, [active]);
  const colors = useMemo(() => (active ? { ink: token('--fg'), accent: token('--accent'), paper: token('--bg') } : null), [active, palette]);
  const onReady = useCallback((r: boolean) => setReady(r), []);
  if (!colors) return null;
  return (
    <div className={`fx-halftone${ready ? ' is-on' : ''}`} aria-hidden="true" data-fx="halftone">
      <Boundary>
        <Suspense fallback={null}>
          <LHalftone src={src} fit="cover" mode="duotone" shape="dot" cellSize={7} inkColor={colors.ink} accentColor={colors.accent} paperColor={colors.paper} revealRadius={120} softness={0.6} linger={0.9} intro={false} />
          <Probe onReady={onReady} />
        </Suspense>
      </Boundary>
    </div>
  );
}
