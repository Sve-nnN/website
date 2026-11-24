import { useEffect, useRef, useState } from 'react';
import { PALETTES, SEL_KEY, safeSet, useHome } from '../ctx';
import { Icon } from '../ui';

// Herramienta de prueba: cambia entre las 6 paletas sin recargar. Persiste en localStorage (en try/catch) y en ?paleta=.

function readSel(): { hide: boolean; min: boolean } {
  const force = /[?&]selector=1/.test(window.location.search);
  try {
    if (force) window.localStorage.removeItem(SEL_KEY);
    const v = window.localStorage.getItem(SEL_KEY);
    return { hide: v === 'hide' && !force, min: v === 'min' };
  } catch {
    return { hide: false, min: false };
  }
}

export function PaletteSelector() {
  const { t, palette, setPalette } = useHome();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(readSel);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const current = PALETTES.find((p) => p.id === palette) ?? PALETTES[5];

  useEffect(() => {
    if (!open) return;
    const items = () => Array.from(root.current?.querySelectorAll<HTMLElement>('.pal-menu button') ?? []);
    (root.current?.querySelector<HTMLElement>('.pal-menu [aria-pressed="true"]') ?? items()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        btn.current?.focus();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const list = items();
        const i = list.indexOf(document.activeElement as HTMLElement);
        list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus();
      }
    };
    const onDoc = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onDoc);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onDoc);
    };
  }, [open]);

  if (sel.hide) return null;
  const p = t.palette;
  return (
    <div className="pal" id="pal" ref={root} data-min={sel.min ? '' : undefined}>
      <button type="button" ref={btn} className="pal-btn" aria-haspopup="true" aria-expanded={open} aria-controls="palmenu" onClick={() => setOpen((o) => !o)}>
        <Icon name="palette" />
        <span className="pal-txt">
          <span className="pal-k">{p.button}</span>
          <b>{current.name}</b>
        </span>
      </button>
      <div className="pal-menu" id="palmenu" role="group" aria-label={p.group} hidden={!open}>
        <ul>
          {PALETTES.map((x) => (
            <li key={x.id}>
              <button type="button" aria-pressed={palette === x.id} onClick={() => setPalette(x.id)}>
                <span className="sw" aria-hidden="true">
                  {x.sw.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                <span>{x.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="pal-foot">
          <button
            type="button"
            onClick={() => {
              const next = !sel.min;
              setSel({ hide: false, min: next });
              safeSet(SEL_KEY, next ? 'min' : '');
            }}
          >
            {p.iconOnly}
          </button>
          <button
            type="button"
            onClick={() => {
              setSel({ hide: true, min: false });
              setOpen(false);
              safeSet(SEL_KEY, 'hide');
            }}
          >
            {p.hide}
          </button>
          <p>{p.restore}</p>
        </div>
      </div>
    </div>
  );
}
