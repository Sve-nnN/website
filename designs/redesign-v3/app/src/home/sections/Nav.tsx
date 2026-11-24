import { useCallback, useEffect, useRef, useState } from 'react';
import { useHome } from '../ctx';
import { Icon } from '../ui';

const NAV_IDS = ['servicios', 'casos', 'proceso', 'testimonios', 'contacto'] as const;

/** Progreso de scroll (variable --sp en <html>) y seccion actual para el menu. Un solo listener con rAF. */
function useScrollSpy(): string | null {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    let queued = false;
    const update = () => {
      queued = false;
      const root = document.documentElement;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty('--sp', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
      const line = window.innerHeight * 0.45;
      let hit: string | null = null;
      for (const id of NAV_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom >= line) hit = id;
      }
      setCurrent((cur) => (cur === hit ? cur : hit));
    };
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return current;
}

export function Nav() {
  const { t, lang, setLang, paused, togglePause } = useHome();
  const current = useScrollSpy();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    document.documentElement.style.overflow = '';
    if (restoreFocus) menuBtn.current?.focus();
  }, []);

  // Menu movil accesible: foco al primer enlace, foco atrapado, Escape cierra y devuelve el foco al boton.
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button') ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(true);
        return;
      }
      if (e.key !== 'Tab') return;
      const ring = [menuBtn.current as HTMLElement, ...focusables()];
      const i = ring.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        ring[ring.length - 1].focus();
      } else if (!e.shiftKey && (i === ring.length - 1 || i === -1)) {
        e.preventDefault();
        ring[0].focus();
      }
    };
    const mq = window.matchMedia('(min-width:1100px)');
    const onMq = (e: MediaQueryListEvent) => e.matches && close(false);
    document.addEventListener('keydown', onKey);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
      document.documentElement.style.overflow = '';
    };
  }, [open, close]);

  return (
    <>
      <header className="nav" id="nav">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            JA
          </span>
          <span className="brand-name">Juan Carlos Angulo</span>
        </a>
        <nav className="nav-links" aria-label={t.a11y.mainNav}>
          {NAV_IDS.map((id) => (
            <a key={id} href={`#${id}`} aria-current={current === id ? 'true' : undefined}>
              {t.nav[id]}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <div className="lang" role="group" aria-label={t.a11y.langGroup}>
            <button type="button" lang="es" aria-label={t.a11y.esLabel} aria-pressed={lang === 'es'} onClick={() => setLang('es')}>
              ES
            </button>
            <button type="button" lang="en" aria-label={t.a11y.enLabel} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
              EN
            </button>
          </div>
          <button type="button" className="icobtn pausebtn" aria-pressed={paused} onClick={togglePause}>
            <Icon name="pause" className="ic ic-pause" />
            <Icon name="play" className="ic ic-play" />
            <span className="pause-txt">{paused ? t.a11y.resume : t.a11y.pause}</span>
          </button>
          <a className="btn btn-sm nav-cta" href="#contacto">
            <span>{t.cta}</span>
          </a>
          <button type="button" id="menubtn" ref={menuBtn} className="icobtn menubtn" aria-expanded={open} aria-controls="mnav" onClick={() => (open ? close(true) : setOpen(true))}>
            <Icon name="menu" className="ic ic-open" />
            <Icon name="x" className="ic ic-close" />
            <span className="sr">{t.a11y.menu}</span>
          </button>
        </div>
      </header>

      <div ref={panel} className="mnav" id="mnav" role="dialog" aria-modal="true" aria-label={t.a11y.menuDialog} hidden={!open}>
        <ul>
          {t.mnav.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} onClick={() => close(false)}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <a className="btn btn-lg" href="#contacto" onClick={() => close(false)}>
          <span>{t.cta}</span>
          <Icon name="arrow-right" />
        </a>
      </div>

      <div className="rail" aria-hidden="true">
        <i />
      </div>
    </>
  );
}
