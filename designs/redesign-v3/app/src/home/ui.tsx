import { useEffect, useRef, type CSSProperties, type ElementType, type RefObject } from 'react';
import { SPRITE, type IconName } from './icons';

// Piezas chicas compartidas por las secciones: icono del sprite, titular con palabras que suben, contador y reveals.

export function Sprite() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: `<defs>${SPRITE}</defs>` }} />;
}

export function Icon({ name, className = 'ic' }: { name: IconName | string; className?: string }) {
  return (
    <svg className={className} aria-hidden="true" focusable="false">
      <use href={`#i-${name}`} />
    </svg>
  );
}

/** Titular en Array: cada palabra sube desde una mascara cuando entra al viewport (clase .sp, ver useReveal). */
export function Sp({ as: Tag = 'h2', id, className = '', children }: { as?: ElementType; id?: string; className?: string; children: string }) {
  const words = children.split(/\s+/).filter(Boolean);
  return (
    <Tag id={id} className={`sp${className ? ` ${className}` : ''}`}>
      {words.map((w, i) => (
        <span key={`${i}-${w}`}>
          <span className="w">
            <span style={{ '--i': i } as CSSProperties}>{w}</span>
          </span>{' '}
        </span>
      ))}
    </Tag>
  );
}

const reducedNow = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cifra que cuenta de 0 al valor al entrar al viewport. Renderiza el valor final: sin JS o con movimiento reducido se queda asi. */
export function Count({ value, dec = 0, as: Tag = 'span', className = 'cnt' }: { value: number; dec?: number; as?: 'span' | 'b'; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let raf = 0;
    const final = value.toFixed(dec);
    const io = new IntersectionObserver((records) => {
      if (!records.some((r) => r.isIntersecting)) return;
      io.disconnect();
      if (reducedNow() || document.documentElement.classList.contains('paused')) return;
      const t0 = performance.now();
      const step = (now: number) => {
        const f = Math.min(1, (now - t0) / 1400);
        const eased = 1 - Math.pow(1 - f, 3);
        el.textContent = (value * eased).toFixed(dec);
        if (f < 1 && !document.documentElement.classList.contains('paused')) raf = requestAnimationFrame(step);
        else el.textContent = final;
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.18 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, dec]);
  return (
    <Tag ref={ref as never} className={className}>
      {value.toFixed(dec)}
    </Tag>
  );
}

/**
 * Reveals: observa .rv, .sp y .tl-step dentro de root y les pone .in al entrar. En navegadores con view() los .rv
 * se animan con scroll-timeline por CSS y esto solo cubre .sp y .tl-step. `deps` re-escanea cuando cambia el contenido.
 */
export function useReveal(root: RefObject<HTMLElement | null>, deps: readonly unknown[]) {
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    if (typeof IntersectionObserver === 'undefined') {
      host.querySelectorAll('.rv,.sp,.tl-step').forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          if (!r.isIntersecting) continue;
          const el = r.target as HTMLElement;
          el.classList.add('in');
          if (el.classList.contains('tl-step')) {
            const steps = host.querySelectorAll('.tl-step');
            const idx = Array.prototype.indexOf.call(steps, el) + 1;
            el.closest<HTMLElement>('.tl')?.style.setProperty('--p', String(idx / steps.length));
          }
          io.unobserve(el);
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );
    host.querySelectorAll('.rv,.sp,.tl-step').forEach((el) => {
      if (!el.classList.contains('in')) io.observe(el);
    });
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
