import { Component, createContext, lazy, Suspense, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { originals, type OriginalName } from '../gallery/originals';
import { BLOCKED_TEXT, canMountIn, type BlockedReason } from '../gallery/slot';
import { readTokens, type Tokens } from '../gallery/tokens';
import { claimEffectId, MAX_EFFECTS_PER_PAGE } from './effect-budget';
import { readPaused, useArmed, useMedia, useSaveData, useTabVisible, writePaused } from './home-env';

// Motor de efectos de la home: cupo unico (1 activo), tope de 2 ids (D-08) y armado tras load y LCP (D-09).
// Reutiliza las constantes de la galeria sin editarla; la pausa viaja entre /system y / por la misma clave.

export { MAX_EFFECTS_PER_PAGE };
export type HomeEffectId = 'hero' | 'terminal';
export type HomeBlockedReason = BlockedReason | 'small';
export const HOME_BLOCKED_TEXT: Record<HomeBlockedReason, string> = {
  ...BLOCKED_TEXT,
  small: 'Pantalla chica: muestro solo el fallback.',
};

const DPR = 1.5;
const buildProps: Partial<Record<OriginalName, (t: Tokens) => Record<string, unknown>>> = {
  Grainient: (t) => ({ colors: [t.violet, t.coral, t.amber], dpr: DPR }),
  CRTWarp: (t) => ({ color: t.phosphor, backgroundColor: t.ink, dpr: DPR }),
};

// Un lazy() por original, creado una vez: el chunk no se pide hasta el primer montaje.
const lazies = Object.fromEntries(Object.entries(originals).map(([n, loader]) => [n, lazy(loader)])) as Record<
  OriginalName,
  LazyExoticComponent<ComponentType<any>>
>;

interface HomeEffectsValue {
  paused: boolean;
  togglePause: () => void;
  blockedReason: HomeBlockedReason | null;
  activeId: HomeEffectId | null;
  armed: boolean;
  register: (id: HomeEffectId) => () => void;
  reportVisible: (id: HomeEffectId, visible: boolean) => void;
}

const Ctx = createContext<HomeEffectsValue | null>(null);

export function HomeEffectProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(readPaused);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const small = useMedia('(max-width: 767px), (pointer: coarse)');
  const saver = useSaveData();
  const armed = useArmed();
  const tabVisible = useTabVisible();
  const [visible, setVisible] = useState<readonly HomeEffectId[]>([]);
  const [activeId, setActiveId] = useState<HomeEffectId | null>(null);
  const ids = useRef(new Set<string>());
  const blockedReason: HomeBlockedReason | null = paused ? 'paused' : reduced ? 'reduced' : saver ? 'saver' : small ? 'small' : null;

  // La pausa y el ahorro de datos tambien apagan los fallbacks CSS del kit.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (paused) root.setAttribute('data-motion', 'reduced');
    else root.removeAttribute('data-motion');
    if (saver) root.setAttribute('data-saver', 'on');
    else root.removeAttribute('data-saver');
  }, [paused, saver]);

  // Cupo unico: un solo activo; el que llega mientras otro vive espera a que ese se desmonte.
  useEffect(() => {
    setActiveId((cur) => {
      if (blockedReason || !armed || !tabVisible) return null;
      if (cur && visible.includes(cur)) return cur;
      return visible[0] ?? null;
    });
  }, [blockedReason, armed, tabVisible, visible]);

  const togglePause = useCallback(() => {
    setPaused((cur) => {
      writePaused(!cur);
      return !cur;
    });
  }, []);
  const register = useCallback((id: HomeEffectId) => {
    claimEffectId(ids.current, id);
    return () => void ids.current.delete(id);
  }, []);
  const reportVisible = useCallback((id: HomeEffectId, on: boolean) => {
    setVisible((cur) => (cur.includes(id) === on ? cur : on ? [...cur, id] : cur.filter((x) => x !== id)));
  }, []);

  const value = useMemo(
    () => ({ paused, togglePause, blockedReason, activeId, armed, register, reportVisible }),
    [paused, togglePause, blockedReason, activeId, armed, register, reportVisible],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useCtx(): HomeEffectsValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('El motor de efectos de la home debe vivir dentro de HomeEffectProvider');
  return ctx;
}

export function useHomeEffects() {
  const { paused, togglePause, blockedReason, activeId, armed } = useCtx();
  return { paused, togglePause, blockedReason, activeId, armed };
}

/** Si el chunk del original falla, la seccion se queda con el fallback CSS. */
class EffectBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('HomeEffect: el original no se pudo montar, queda el fallback CSS', error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
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

interface HomeEffectProps {
  id: HomeEffectId;
  original: OriginalName;
  className?: string;
}

/** Capa decorativa. Decora a su elemento padre inmediato, que es el que se observa con IntersectionObserver. */
export function HomeEffect({ id, original, className = '' }: HomeEffectProps) {
  const { activeId, register, reportVisible } = useCtx();
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const active = activeId === id;

  useLayoutEffect(() => register(id), [id, register]);

  useEffect(() => {
    const parent = ref.current?.parentElement;
    if (!parent || !canMountIn(parent)) return;
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) reportVisible(id, record.intersectionRatio >= 0.15);
      },
      { threshold: [0, 0.15, 1] },
    );
    observer.observe(parent);
    return () => {
      observer.disconnect();
      reportVisible(id, false);
    };
  }, [id, reportVisible]);

  useEffect(() => {
    if (!active) setReady(false);
  }, [active]);

  // Los tokens se leen al montar, nunca al cargar el modulo.
  const props = useMemo(() => (active ? buildProps[original]?.(readTokens()) ?? {} : null), [active, original]);
  const Original = lazies[original];

  return (
    <div
      ref={ref}
      className={`fx-canvas hm-effect${ready ? ' is-on' : ''}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      data-home-effect={id}
      data-mounted={active && ready ? 'true' : 'false'}
    >
      {props ? (
        <EffectBoundary>
          <Suspense fallback={null}>
            <Original {...props} />
            <Probe onReady={setReady} />
          </Suspense>
        </EffectBoundary>
      ) : null}
    </div>
  );
}
