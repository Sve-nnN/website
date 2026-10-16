import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { OriginalName } from './originals';

// Cupo unico de originales WebGL: solo uno montado a la vez (T-51.1-06). Este modulo no importa ningun original.

export type BlockedReason = 'paused' | 'reduced' | 'saver';

/** Lista blanca de los 16 nombres. Es lo unico contra lo que se compara ?mount= (T-51.1-07). */
export const ORIGINAL_NAMES: readonly OriginalName[] = [
  'Grainient',
  'PatternWaves',
  'CRTWarp',
  'MicroSlats',
  'PixelBlast',
  'PixelCard',
  'GradientASCII',
  'ASCIIText',
  'Noise',
  'Dither',
  'HalftoneReveal',
  'PixelTransition',
  'FaultyTerminal',
  'SpotlightCard',
  'GradientBlinds',
  'StarBorder',
];

export const PAUSE_KEY = 'v3app-paused';

export const BLOCKED_TEXT: Record<BlockedReason, string> = {
  paused: 'Animaciones en pausa: muestro solo el fallback.',
  reduced: 'Tu sistema pide menos movimiento: muestro solo el fallback.',
  saver: 'Ahorro de datos activo: muestro solo el fallback.',
};

interface SlotValue {
  activeId: OriginalName | null;
  blockedReason: BlockedReason | null;
  paused: boolean;
  toggle: (id: OriginalName, el?: Element | null) => void;
  togglePause: () => void;
  reportVisible: (id: OriginalName, visible: boolean) => void;
}

const SlotContext = createContext<SlotValue | null>(null);

/** D-08: las superficies de lectura nunca montan un original. */
export function canMountIn(el: Element | null | undefined): boolean {
  return !el || !el.closest('[data-surface="reading"]');
}

function readPaused(): boolean {
  try {
    return window.sessionStorage.getItem(PAUSE_KEY) === '1';
  } catch {
    return false;
  }
}

function writePaused(value: boolean): void {
  try {
    window.sessionStorage.setItem(PAUSE_KEY, value ? '1' : '0');
  } catch {
    /* sessionStorage no disponible: la pausa dura solo esta carga */
  }
}

type ConnectionLike = { saveData?: boolean; addEventListener?: (t: string, l: () => void) => void; removeEventListener?: (t: string, l: () => void) => void };

function getConnection(): ConnectionLike | undefined {
  return (navigator as Navigator & { connection?: ConnectionLike }).connection;
}

/** Nombre del original pedido por ?mount=, solo si esta en la lista blanca. */
function readDeepLink(): OriginalName | null {
  const raw = new URLSearchParams(window.location.search).get('mount');
  if (!raw) return null;
  const wanted = raw.toLowerCase();
  return ORIGINAL_NAMES.find((n) => n.toLowerCase() === wanted) ?? null;
}

export function SlotProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState<boolean>(readPaused);
  const [reducedOs, setReducedOs] = useState<boolean>(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [saveData, setSaveData] = useState<boolean>(() => Boolean(getConnection()?.saveData));
  const [activeId, setActiveId] = useState<OriginalName | null>(null);
  const [visible, setVisible] = useState<ReadonlySet<OriginalName>>(() => new Set());
  const [deepReady, setDeepReady] = useState(false);
  const [deepTarget] = useState<OriginalName | null>(readDeepLink);
  const deepDone = useRef(false);

  const blockedReason: BlockedReason | null = paused ? 'paused' : reducedOs ? 'reduced' : saveData ? 'saver' : null;
  const blockedRef = useRef(blockedReason);
  blockedRef.current = blockedReason;

  // (e) La pausa se refleja en <html> para que tambien se apaguen los fallbacks CSS de la fase 51.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (paused) root.setAttribute('data-motion', 'reduced');
    else root.removeAttribute('data-motion');
  }, [paused]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (saveData) root.setAttribute('data-saver', 'on');
    else root.removeAttribute('data-saver');
  }, [saveData]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedOs(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const conn = getConnection();
    if (!conn?.addEventListener) return;
    const onChange = () => setSaveData(Boolean(conn.saveData));
    conn.addEventListener('change', onChange);
    return () => conn.removeEventListener?.('change', onChange);
  }, []);

  // (b) Cuando aparece un bloqueo se libera el cupo.
  useEffect(() => {
    if (blockedReason) setActiveId(null);
  }, [blockedReason]);

  // (d) Con la pestana oculta se libera el cupo.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setActiveId(null);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // (f) Deep link: espera load y un instante ocioso, y recien entonces deja montar.
  useEffect(() => {
    if (!deepTarget) return;
    let cancelled = false;
    let idleHandle: number | undefined;
    let timeoutHandle: number | undefined;
    const arm = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(() => !cancelled && setDeepReady(true), { timeout: 1500 });
      } else {
        timeoutHandle = window.setTimeout(() => !cancelled && setDeepReady(true), 200);
      }
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener('load', arm);
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleHandle);
      if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
    };
  }, [deepTarget]);

  useEffect(() => {
    const target = deepTarget;
    if (!deepReady || !target || deepDone.current || blockedReason) return;
    if (!visible.has(target)) {
      // El selector sale de la lista blanca (nombre en minusculas), nunca del valor crudo de la URL.
      const el = document.querySelector(`article[data-effect="${target.toLowerCase()}"]`);
      el?.scrollIntoView({ block: 'nearest' });
      return;
    }
    deepDone.current = true;
    setActiveId(target);
  }, [deepTarget, deepReady, visible, blockedReason]);

  const toggle = useCallback((id: OriginalName, el?: Element | null) => {
    if (blockedRef.current) return;
    if (!canMountIn(el)) return;
    setActiveId((cur) => (cur === id ? null : id));
  }, []);

  const togglePause = useCallback(() => {
    setPaused((cur) => {
      const next = !cur;
      writePaused(next);
      return next;
    });
  }, []);

  // (c) La tarjeta activa que sale del viewport libera el cupo.
  const reportVisible = useCallback((id: OriginalName, isVisible: boolean) => {
    setVisible((cur) => {
      if (cur.has(id) === isVisible) return cur;
      const next = new Set(cur);
      if (isVisible) next.add(id);
      else next.delete(id);
      return next;
    });
    if (!isVisible) setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const value = useMemo<SlotValue>(
    () => ({
      activeId: blockedReason ? null : activeId,
      blockedReason,
      paused,
      toggle,
      togglePause,
      reportVisible,
    }),
    [activeId, blockedReason, paused, toggle, togglePause, reportVisible],
  );

  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

export function useSlot(): SlotValue {
  const ctx = useContext(SlotContext);
  if (!ctx) throw new Error('useSlot debe usarse dentro de SlotProvider');
  return ctx;
}
