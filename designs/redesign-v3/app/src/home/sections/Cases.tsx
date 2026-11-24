import type { CSSProperties } from 'react';
import { useHome } from '../ctx';
import { Spot } from '../fx';
import { Count, Icon, Sp } from '../ui';

const SIZES = ['big', 'mid', 'sm'] as const;
const LIGHT = { big: '--paper', mid: '--tomato', sm: '--paper' } as const;

function Figure({ size }: { size: (typeof SIZES)[number] }) {
  if (size === 'big') {
    return (
      <svg className="cfig cfig-line" viewBox="0 0 420 150" aria-hidden="true" focusable="false">
        <path d="M0 140H420M0 100H420M0 60H420M0 20H420" className="cgrid" />
        <path d="M6 134C70 132 110 128 150 118S230 96 270 78 340 38 414 12V150H6Z" className="carea" />
        <path d="M6 134C70 132 110 128 150 118S230 96 270 78 340 38 414 12" className="cline" pathLength={1} />
        <circle cx="414" cy="12" r="7" className="cdot" />
      </svg>
    );
  }
  if (size === 'mid') {
    return (
      <svg className="cfig cfig-bars" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
        <path d="M0 78H120" className="cgrid" />
        <rect x="20" y="58" width="30" height="20" className="b0" />
        <rect x="70" y="2" width="30" height="76" className="b1" />
      </svg>
    );
  }
  return (
    <svg className="cfig cfig-steps" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
      <path d="M0 78H120" className="cgrid" />
      <path d="M6 70H36V50H66V30H96V10" className="cstep" pathLength={1} />
      <circle cx="96" cy="10" r="5" className="cdot" />
    </svg>
  );
}

export function Cases() {
  const { t } = useHome();
  const c = t.casos;
  return (
    <section className="ch ch-ink" id="casos" aria-labelledby="t-cas">
      <div className="wrap">
        <header className="ch-head">
          <Sp id="t-cas">{c.title}</Sp>
        </header>
        <div className="cbento">
          {c.items.map((it, i) => {
            const size = SIZES[i];
            return (
              <div key={size} className={`cb cb-${size} rv`} style={{ '--d': i } as CSSProperties}>
                <Spot className={`ct ct-${size}`} light={LIGHT[size]} intensity={size === 'mid' ? 0.22 : 0.18} theme="dark">
                  <p className="sector">{it.sector}</p>
                  <p className="big" aria-hidden="true">
                    +<Count value={it.value} />
                    <span className="u">%</span>
                  </p>
                  <Figure size={size} />
                  <h3>
                    <a className="stretch" href={c.allHref}>
                      {it.title}
                    </a>
                  </h3>
                  <p className="sr">
                    +{it.value}% {c.yoy}
                  </p>
                </Spot>
              </div>
            );
          })}
          <aside className="ct ct-note rv" style={{ '--d': 1 } as CSSProperties}>
            <p>{c.note}</p>
          </aside>
          <a className="ct ct-cta rv" style={{ '--d': 2 } as CSSProperties} href={c.allHref}>
            <span>{c.all}</span>
            <Icon name="arrow-right" />
          </a>
        </div>
      </div>
    </section>
  );
}
