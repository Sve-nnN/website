import { useState } from 'react';
import { useHome } from '../ctx';
import { Icon, Sp } from '../ui';

type Preview = 1 | 3 | 8;
const PREVIEWS: readonly Preview[] = [1, 3, 8];

// Ranuras de muestra: no son testimonios. Cada una lleva su variante de color y las anchuras de sus lineas esqueleto.
const SLOTS: { tone: 'a' | 'b' | 'c' | 'd'; lines: number[] }[] = [
  { tone: 'a', lines: [96, 88, 92, 55] },
  { tone: 'b', lines: [94, 62] },
  { tone: 'c', lines: [98, 90, 95, 86, 93, 40] },
  { tone: 'd', lines: [90, 97, 70] },
  { tone: 'b', lines: [95, 91, 94, 30] },
  { tone: 'a', lines: [92, 58] },
  { tone: 'c', lines: [97, 89, 96, 84, 45] },
];

function initialPreview(): Preview {
  const n = Number(new URLSearchParams(window.location.search).get('testimonios'));
  return n === 1 || n === 8 ? n : 3;
}

export function Testimonials() {
  const { t } = useHome();
  const s = t.testimonios;
  const [tn, setTn] = useState<Preview>(initialPreview);
  const shown = tn === 1 ? 0 : tn === 3 ? 2 : 7;

  const choose = (n: Preview) => {
    setTn(n);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('testimonios', String(n));
      window.history.replaceState(null, '', url);
    } catch {
      /* sin historial: la vista cambia igual */
    }
  };

  return (
    <section className="ch ch-ink ch-quote" id="testimonios" aria-labelledby="t-tes">
      <div className="wrap">
        <header className="ch-head">
          <Sp id="t-tes">{s.title}</Sp>
        </header>
        <div className="tpv" role="group" aria-label={s.previewGroup}>
          <span className="tpv-l">{s.preview}</span>
          {PREVIEWS.map((n) => (
            <button key={n} type="button" aria-pressed={tn === n} onClick={() => choose(n)}>
              {n}
            </button>
          ))}
        </div>
        <figure className="quote">
          <Icon name="quote" className="ic qmark" />
          <blockquote>
            <p>{s.quote}</p>
          </blockquote>
          <figcaption className="rv">
            <span className="av" aria-hidden="true">
              P
            </span>
            <span className="who">
              <b>{s.who}</b>
              <span>{s.role}</span>
            </span>
          </figcaption>
        </figure>
        {shown > 0 ? (
          <ul className="wall" id="wall" data-n={shown}>
            {SLOTS.slice(0, shown).map((slot, i) => (
              <li className={`tcard t-${slot.tone}`} key={i}>
                <Icon name="quote" className="ic qm" />
                <p className={`stamp ${slot.tone === 'b' ? 'stamp-ink' : 'stamp-warn'}`}>{s.stamp}</p>
                <div className="sk" aria-hidden="true">
                  {slot.lines.map((w, j) => (
                    <i key={j} style={{ width: `${w}%` }} />
                  ))}
                </div>
                <div className="by">
                  <span className="av" aria-hidden="true">
                    P
                  </span>
                  <span className="who">
                    <b>[{s.pending}]</b>
                    <span>
                      {s.role0} [{s.pending}], {s.company0} [{s.pending}]
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="sample-note rv">
          <b className="stamp stamp-warn">{s.pending}</b> <span>{s.note}</span>
        </p>
      </div>
    </section>
  );
}
