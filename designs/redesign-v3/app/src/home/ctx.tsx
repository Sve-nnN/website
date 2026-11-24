import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import es from './copy/es.json';
import en from './copy/en.json';
import { claimEffectId } from './effect-budget';
import { readPaused, useArmed, useMedia, useSaveData, useTabVisible, writePaused } from './home-env';

// Estado compartido de la home: idioma, paleta de prueba, pausa de animaciones y permisos de los efectos de React Bits.

export type Lang = 'es' | 'en';
export type Copy = typeof es;
const COPY: Record<Lang, Copy> = { es, en: en as Copy };

export const PALETTES = [
  { id: 'papel-tomate', name: 'Papel y tomate', sw: ['#FAF6EE', '#14110F', '#FF5B3A'] },
  { id: 'tinta-fosforo', name: 'Tinta y fósforo', sw: ['#0B0B12', '#E9ECF2', '#B6FF3B'] },
  { id: 'noche-menta', name: 'Noche y menta', sw: ['#0A192F', '#CCD6F6', '#64FFDA'] },
  { id: 'papel-cobalto', name: 'Papel y cobalto', sw: ['#F4F5F7', '#0E1117', '#2A3BFF'] },
  { id: 'tinta-ambar', name: 'Tinta y ámbar', sw: ['#14110D', '#F3EBDD', '#FFB020'] },
  { id: 'papel-bosque', name: 'Papel y bosque', sw: ['#FAF6EE', '#14110F', '#0E3B2C'] },
] as const;
export type PaletteId = (typeof PALETTES)[number]['id'];
export const DEFAULT_PALETTE: PaletteId = 'papel-bosque';
const PALETTE_KEY = 'home-v4-paleta';
export const SEL_KEY = 'home-v4-sel';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* sin localStorage: la preferencia dura solo esta carga */
  }
}

const isPalette = (v: string | null): v is PaletteId => PALETTES.some((p) => p.id === v);

function initialPalette(): PaletteId {
  const q = new URLSearchParams(window.location.search).get('paleta');
  if (isPalette(q)) return q;
  const saved = safeGet(PALETTE_KEY);
  return isPalette(saved) ? saved : DEFAULT_PALETTE;
}

export function langFromPath(): Lang {
  return window.location.pathname.replace(/\/+$/, '') === '/en' ? 'en' : 'es';
}

type HeavyId = 'hero-dither' | 'sites-halftone';

interface HomeValue {
  lang: Lang;
  t: Copy;
  setLang: (l: Lang) => void;
  palette: PaletteId;
  setPalette: (p: PaletteId) => void;
  paused: boolean;
  togglePause: () => void;
  /** true cuando los efectos de React Bits pueden montarse: desktop con puntero fino, tras load y LCP, sin pausa, sin reduced motion ni ahorro de datos. */
  fxOk: boolean;
  /** Efectos estaticos (grano de Noise): no necesitan movimiento, asi que sobreviven a la pausa y a reduced motion. */
  staticFxOk: boolean;
  reduced: boolean;
  /** Cupo unico de shaders pesados (WebGL): devuelve el id activo ahora. */
  heavyActive: HeavyId | null;
  wantHeavy: (id: HeavyId, want: boolean) => void;
}

const Ctx = createContext<HomeValue | null>(null);

export function HomeProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [palette, setPaletteState] = useState<PaletteId>(initialPalette);
  const [paused, setPaused] = useState<boolean>(readPaused);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const fine = useMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');
  const saver = useSaveData();
  const armed = useArmed();
  const tabVisible = useTabVisible();
  const [wants, setWants] = useState<readonly HeavyId[]>([]);
  const ids = useRef(new Set<string>());

  // Clases y atributos de <html> antes del primer pintado.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.add('js');
    try {
      if (CSS.supports('animation-timeline: view()')) root.classList.add('sda');
    } catch {
      /* sin soporte: los reveals usan IntersectionObserver */
    }
    return () => root.classList.remove('js', 'sda');
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dataset.lang = lang;
    document.title = COPY[lang].meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', COPY[lang].meta.description);
  }, [lang]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (palette === DEFAULT_PALETTE) root.removeAttribute('data-palette');
    else root.dataset.palette = palette;
    return () => root.removeAttribute('data-palette');
  }, [palette]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('paused', paused);
    if (paused) root.setAttribute('data-motion', 'reduced');
    else root.removeAttribute('data-motion');
    return () => {
      root.classList.remove('paused');
      root.removeAttribute('data-motion');
    };
  }, [paused]);

  useEffect(() => {
    const onPop = () => setLangState(langFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    const url = `${l === 'en' ? '/en' : '/'}${window.location.search}${window.location.hash}`;
    try {
      window.history.pushState(null, '', url);
    } catch {
      /* el cambio de idioma sigue funcionando sin historial */
    }
  }, []);

  const setPalette = useCallback((p: PaletteId) => {
    setPaletteState(p);
    safeSet(PALETTE_KEY, p);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('paleta', p);
      window.history.replaceState(null, '', url);
    } catch {
      /* sin historial: queda solo en localStorage */
    }
  }, []);

  const togglePause = useCallback(() => {
    setPaused((cur) => {
      writePaused(!cur);
      return !cur;
    });
  }, []);

  const fxOk = armed && !paused && !reduced && !saver && fine && tabVisible;
  const staticFxOk = armed && !saver && fine;

  // Estado de los efectos visible en <html> para las pruebas: on, o el primer motivo por el que estan apagados.
  useLayoutEffect(() => {
    const reason = !armed ? 'wait' : paused ? 'paused' : reduced ? 'reduced' : saver ? 'saver' : !fine ? 'small' : !tabVisible ? 'hidden' : 'on';
    document.documentElement.dataset.fx = reason;
  }, [armed, paused, reduced, saver, fine, tabVisible]);

  // Cupo unico: de los shaders que lo piden, manda el ultimo que llego.
  const wantHeavy = useCallback((id: HeavyId, want: boolean) => {
    if (want) claimEffectId(ids.current, id);
    setWants((cur) => (want ? [...cur.filter((x) => x !== id), id] : cur.filter((x) => x !== id)));
  }, []);
  const heavyActive = fxOk ? (wants[wants.length - 1] ?? null) : null;

  const value = useMemo<HomeValue>(
    () => ({ lang, t: COPY[lang], setLang, palette, setPalette, paused, togglePause, fxOk, staticFxOk, reduced, heavyActive, wantHeavy }),
    [lang, setLang, palette, setPalette, paused, togglePause, fxOk, staticFxOk, reduced, heavyActive, wantHeavy],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHome(): HomeValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useHome debe usarse dentro de HomeProvider');
  return v;
}
