import type { CSSProperties } from 'react';
import { useHome } from '../ctx';
import { Spot } from '../fx';
import { Sp } from '../ui';

const DIAL_TICKS =
  'M100.0 8.0L100.0 22.0M116.0 9.4L114.8 16.3M131.5 13.5L129.1 20.1M146.0 20.3L139.0 32.5M159.1 29.5L154.6 34.9M170.5 40.9L165.1 45.4M179.7 54.0L167.5 61.0M186.5 68.5L179.9 70.9M190.6 84.0L183.7 85.2M192.0 100.0L178.0 100.0M190.6 116.0L183.7 114.8M186.5 131.5L179.9 129.1M179.7 146.0L167.5 139.0M170.5 159.1L165.1 154.6M159.1 170.5L154.6 165.1M146.0 179.7L139.0 167.5M131.5 186.5L129.1 179.9M116.0 190.6L114.8 183.7M100.0 192.0L100.0 178.0M84.0 190.6L85.2 183.7M68.5 186.5L70.9 179.9M54.0 179.7L61.0 167.5M40.9 170.5L45.4 165.1M29.5 159.1L34.9 154.6M20.3 146.0L32.5 139.0M13.5 131.5L20.1 129.1M9.4 116.0L16.3 114.8M8.0 100.0L22.0 100.0M9.4 84.0L16.3 85.2M13.5 68.5L20.1 70.9M20.3 54.0L32.5 61.0M29.5 40.9L34.9 45.4M40.9 29.5L45.4 34.9M54.0 20.3L61.0 32.5M68.5 13.5L70.9 20.1M84.0 9.4L85.2 16.3';

function Stack({ layers }: { layers: readonly string[] }) {
  // Diagrama isometrico de las cuatro capas (de arriba a abajo: Next.js, Payload, PostgreSQL, servidor).
  const [next, payload, db, server] = layers;
  const cube = (y: number, fill: string, label: string, ly: number) => (
    <g key={label}>
      <g style={{ '--c': fill } as CSSProperties}>
        <polygon className="cT" points={`130,${y} 230,${y + 50} 130,${y + 100} 30,${y + 50}`} />
        <polygon className="cL" points={`30,${y + 50} 130,${y + 100} 130,${y + 126} 30,${y + 76}`} />
        <polygon className="cR" points={`230,${y + 50} 130,${y + 100} 130,${y + 126} 230,${y + 76}`} />
      </g>
      <path d={`M232 ${ly}H300`} stroke="currentColor" strokeWidth="3" strokeDasharray="5 5" fill="none" />
      <text x="312" y={ly + 6} className="isot">
        {label}
      </text>
    </g>
  );
  return (
    <div className="cs-fig">
      <svg viewBox="0 0 520 300" aria-hidden="true" focusable="false" className="isosvg">
        {cube(182, 'color-mix(in srgb,var(--fg) 45%,var(--bg))', server, 238)}
        {cube(124, 'var(--fg)', db, 180)}
        {cube(66, 'color-mix(in srgb,var(--fg) 16%,var(--bg))', payload, 122)}
        {cube(8, 'var(--accent)', next, 64)}
      </svg>
      <ul className="sr">
        {layers.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

export function Services() {
  const { t } = useHome();
  const s = t.servicios;
  return (
    <section className="ch ch-alt" id="servicios" aria-labelledby="t-srv">
      <div className="wrap">
        <header className="ch-head">
          <Sp id="t-srv">{s.title}</Sp>
        </header>
        <ul className="bento">
          <li className="cell b5 rv">
            <Spot className="card c-ink" light="--inv-fg" intensity={0.2} theme="dark">
              <h3>{s.tecnico.title}</h3>
              <p>{s.tecnico.text}</p>
              <ul className="chips">
                {s.tecnico.chips.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Spot>
          </li>
          <li className="cell b7 rv" style={{ '--d': 1 } as CSSProperties}>
            <Spot className="card card-stack" light="--fg" intensity={0.7} theme="light">
              <div className="cs-copy">
                <h3>{s.dev.title}</h3>
                <p>{s.dev.text}</p>
              </div>
              <Stack layers={s.dev.layers} />
            </Spot>
          </li>
          <li className="rows rv">
            <ul>
              {s.rows.map((r) => (
                <li className="row" key={r.title}>
                  <h3>{r.title}</h3>
                  <p>{r.text}</p>
                  <p className="k">{r.keys}</p>
                </li>
              ))}
            </ul>
          </li>
          <li className="audit rv">
            <div>
              <h3>{s.audit.title}</h3>
              <p>{s.audit.text}</p>
              <a className="btn btn-ink btn-lg" href="#contacto">
                <span>{t.cta}</span>
                <svg className="ic" aria-hidden="true" focusable="false">
                  <use href="#i-arrow-right" />
                </svg>
              </a>
            </div>
            <svg className="dial" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
              <circle className="d1" cx="100" cy="100" r="92" />
              <circle className="d2" cx="100" cy="100" r="58" />
              <path className="d1" d={DIAL_TICKS} />
              <path className="d2" d="M100 8V192M8 100H192" />
              <g className="sweep">
                <path d="M100 100L100 12A88 88 0 0 1 162 38Z" fill="currentColor" opacity=".16" />
                <path className="d1" d="M100 100V10" />
              </g>
              <circle className="d3" cx="100" cy="100" r="5" />
            </svg>
          </li>
        </ul>
      </div>
    </section>
  );
}
