import { useHome } from '../ctx';
import { Cta, HeroBand } from '../fx';
import { Icon } from '../ui';

export function Hero() {
  const { t } = useHome();
  const h = t.hero;
  const circle = 'seal-path';
  return (
    <section className="hero" id="top" aria-labelledby="h1">
      <div className="hero-grid" aria-hidden="true" />
      <HeroBand />
      <div className="wrap hero-in">
        <div className="hero-copy">
          <h1 id="h1">
            {h.h1.map((line, li) => (
              <span className="ln" key={li}>
                {line.map((word, wi) => {
                  const hl = word.startsWith('*');
                  return (
                    <span key={wi}>
                      <span className={`wd${hl ? ' hl' : ''}`}>{hl ? word.slice(1) : word}</span>{' '}
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>
          <p className="lede">{h.lede}</p>
          <div className="cta-row">
            <Cta href="#contacto" label={t.cta} />
            <a className="btn btn-ghost btn-lg" href="#casos">
              <span>{h.seeCases}</span>
            </a>
          </div>
        </div>
        <div className="hero-orbit">
          <figure className="scope">
            <div className="scope-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <b>{h.scopeTitle}</b>
            </div>
            <ul>
              {h.scope.map((row) => (
                <li key={row.title}>
                  <Icon name={row.icon} />
                  <b>{row.title}</b>
                  <span>{row.sub}</span>
                </li>
              ))}
            </ul>
          </figure>
          <div className="badge" aria-hidden="true">
            <svg viewBox="0 0 200 200" className="spin">
              <defs>
                <path id={circle} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
              </defs>
              <text>
                <textPath href={`#${circle}`} textLength="486" lengthAdjust="spacing">
                  {h.seal}
                </textPath>
              </text>
            </svg>
            <svg viewBox="0 0 200 200" className="star-svg">
              <path d="M100 52 L112 88 L148 100 L112 112 L100 148 L88 112 L52 100 L88 88Z" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
