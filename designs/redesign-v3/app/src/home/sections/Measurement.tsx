import type { CSSProperties } from 'react';
import { useHome } from '../ctx';
import { Count, Sp } from '../ui';

function Bar() {
  return (
    <div className="bar" aria-hidden="true">
      <span className="z z1" />
      <span className="z z2" />
      <span className="z z3" />
      <i className="mk" />
    </div>
  );
}

export function Marquee() {
  const { t } = useHome();
  return (
    <section className="marq" aria-label={t.marquee.label}>
      <div className="marq-track">
        <ul className="marq-set">
          {t.marquee.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <ul className="marq-set" aria-hidden="true">
          {t.marquee.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Measurement() {
  const { t } = useHome();
  const m = t.medicion;
  return (
    <section className="ch ch-paper" id="medicion" aria-labelledby="t-med">
      <div className="wrap">
        <header className="ch-head">
          <Sp id="t-med">{m.title}</Sp>
        </header>
        <p className="intro rv">{m.intro}</p>
        <p className="sample-note rv">
          <b className="stamp stamp-warn">{m.pending}</b> <span>{m.note}</span>
        </p>
        <ul className="gauges">
          {m.gauges.map((g, i) => {
            const style = { '--d': i, '--pos': g.pos, '--g': g.g, '--m': g.m } as CSSProperties;
            const val = (
              <p className="val">
                <Count value={g.value} dec={g.dec} />
                {g.unit ? <small>{g.unit}</small> : null}
              </p>
            );
            if (g.id === 'ttfb') {
              return (
                <li key={g.id} className={`gauge g-${g.id} rv`} style={style}>
                  <div className="gt">
                    <h3>{g.name}</h3>
                    <p className="what">{g.what}</p>
                  </div>
                  {val}
                  <div className="gb">
                    <Bar />
                    <p className="thr">{g.thr}</p>
                  </div>
                </li>
              );
            }
            return (
              <li key={g.id} className={`gauge g-${g.id} rv`} style={style}>
                <h3>{g.name}</h3>
                <p className="what">{g.what}</p>
                {val}
                <Bar />
                <p className="thr">{g.thr}</p>
              </li>
            );
          })}
        </ul>
        <p className="legend rv" aria-hidden="true">
          <span>
            <i className="z1" />
            {m.legend.good}
          </span>
          <span>
            <i className="z2" />
            {m.legend.mid}
          </span>
          <span>
            <i className="z3" />
            {m.legend.bad}
          </span>
        </p>
      </div>
    </section>
  );
}
