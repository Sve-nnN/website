import { useEffect, useState } from 'react';
import { PAUSE_KEY } from '../gallery/slot';

// Senales del entorno que usa el motor de efectos de la home. Ninguna monta nada: solo informan.

export function readPaused(): boolean {
  try {
    return window.sessionStorage.getItem(PAUSE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writePaused(value: boolean): void {
  try {
    window.sessionStorage.setItem(PAUSE_KEY, value ? '1' : '0');
  } catch {
    /* sessionStorage no disponible: la pausa dura solo esta carga */
  }
}

/** matchMedia con listener. Sin matchMedia devuelve false. */
export function useMedia(query: string): boolean {
  const [on, setOn] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia(query).matches);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const onChange = () => setOn(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return on;
}

type ConnectionLike = { saveData?: boolean; addEventListener?: (t: string, l: () => void) => void; removeEventListener?: (t: string, l: () => void) => void };
const connection = (): ConnectionLike | undefined => (navigator as Navigator & { connection?: ConnectionLike }).connection;

export function useSaveData(): boolean {
  const [saver, setSaver] = useState(() => Boolean(connection()?.saveData));
  useEffect(() => {
    const conn = connection();
    if (!conn?.addEventListener) return;
    const onChange = () => setSaver(Boolean(conn.saveData));
    conn.addEventListener('change', onChange);
    return () => conn.removeEventListener?.('change', onChange);
  }, []);
  return saver;
}

export function useTabVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState !== 'hidden');
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

/**
 * D-09: armado cuando se cumplen las tres a la vez: evento load, al menos una entrada de
 * largest-contentful-paint (tope de 3000 ms si el navegador no la emite) y un instante ocioso.
 */
export function useArmed(): boolean {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    let idle: number | undefined;
    let observer: PerformanceObserver | undefined;
    const afterLoad = new Promise<void>((resolve) => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', () => resolve(), { once: true });
    });
    const afterLcp = new Promise<void>((resolve) => {
      timers.push(window.setTimeout(resolve, 3000));
      try {
        observer = new PerformanceObserver((list) => list.getEntries().length > 0 && resolve());
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        resolve();
      }
    });
    void Promise.all([afterLoad, afterLcp]).then(() => {
      if (cancelled) return;
      observer?.disconnect();
      const done = () => !cancelled && setArmed(true);
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(done, { timeout: 1500 });
      else timers.push(window.setTimeout(done, 200));
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      if (idle !== undefined && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
    };
  }, []);
  return armed;
}
