import { useCallback, useEffect, useLayoutEffect, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useHomeEffects } from './home-effect';
import type { Lang } from './HomePage';

type SectionComponent = ComponentType<{ lang: Lang }>;

// Cada archivo de src/home/sections es un chunk aparte: agregar secciones no mueve la ruta critica del LCP.
const modules = import.meta.glob<{ default: SectionComponent }>('./sections/*.tsx');
const keys = Object.keys(modules).sort();

/** Id del destino de un enlace "#ancla" o del hash de la URL, solo si ese destino aun no existe en el DOM. */
function missingTarget(hash: string): string | null {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  return id && !document.getElementById(id) ? id : null;
}

interface Props {
  lang: Lang;
  /** El pie. Se pinta fuera de main, en #hm-after, cuando la ultima seccion ya monto. */
  after: ReactNode;
}

/**
 * D-09: arma con la misma senal que el motor de efectos y monta las secciones una a una en ocio
 * (una tarea corta por seccion). Si el usuario pide un ancla que aun no existe, carga lo pendiente al instante.
 */
export function HomeSections({ lang, after }: Props) {
  const { armed } = useHomeEffects();
  const [loaded, setLoaded] = useState<SectionComponent[]>([]);
  const [forceAll, setForceAll] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const ready = loaded.length >= keys.length;

  useLayoutEffect(() => setSlot(document.getElementById('hm-after')), []);

  const want = useCallback((hash: string) => {
    const id = missingTarget(hash);
    if (!id) return;
    setPending(id);
    setForceAll(true);
  }, []);

  useEffect(() => {
    if (window.location.hash) want(window.location.hash);
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (link) want(link.getAttribute('href') ?? '');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [want]);

  useEffect(() => {
    if ((!armed && !forceAll) || ready) return;
    let cancelled = false;
    const index = loaded.length;
    const load = async () => {
      const batch = forceAll ? keys.slice(index) : [keys[index]];
      const mods = await Promise.all(batch.map((key) => modules[key]()));
      if (!cancelled) setLoaded((cur) => (cur.length === index ? [...cur, ...mods.map((m) => m.default)] : cur));
    };
    let idle: number | undefined;
    let timer: number | undefined;
    if (index === 0 || forceAll) void load();
    else if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => void load(), { timeout: 300 });
    else timer = window.setTimeout(() => void load(), 50);
    return () => {
      cancelled = true;
      if (idle !== undefined && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [armed, forceAll, ready, loaded.length]);

  useEffect(() => {
    if (!ready || !pending) return;
    document.getElementById(pending)?.scrollIntoView();
    setPending(null);
  }, [ready, pending, loaded.length]);

  return (
    <>
      <div className="hm-sections" data-sections-ready={ready ? 'true' : 'false'}>
        {loaded.map((Section, i) => (
          <Section key={keys[i]} lang={lang} />
        ))}
      </div>
      {ready && slot ? createPortal(after, slot) : null}
    </>
  );
}
