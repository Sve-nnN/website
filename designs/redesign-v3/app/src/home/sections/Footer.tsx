import { useHome } from '../ctx';
import { Cta } from '../fx';
import { Icon } from '../ui';

export function Footer() {
  const { t } = useHome();
  const f = t.footer;
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot-cta">
          <div className="fc-copy">
            <h2>{f.ctaTitle}</h2>
            <p>{f.ctaText}</p>
          </div>
          <div className="fc-act">
            <Cta href="#contacto" label={t.cta} variant="accent-inv" />
            <a className="fc-mail" href={`mailto:${t.contacto.email}`}>
              <Icon name="mail" />
              <span>{t.contacto.email}</span>
            </a>
          </div>
        </div>

        <nav className="dir" aria-label={f.dirLabel}>
          {f.columns.map((col) => (
            <div className="dc" key={col.title}>
              <h3>
                <Icon name={col.icon} />
                <span>{col.title}</span>
              </h3>
              <ul className={'two' in col && col.two ? 'two' : undefined}>
                {col.items.map((it) => (
                  <li key={it.href}>
                    <a href={it.href}>
                      {'icon' in it && it.icon ? <Icon name={it.icon} /> : null}
                      <span>{it.label}</span>
                    </a>
                  </li>
                ))}
                {'all' in col && col.all ? (
                  <li className="all">
                    <a href={col.all.href}>
                      <span>{col.all.label}</span>
                      <Icon name="arrow-right" />
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </nav>

        <div className="foot-bar">
          <p className="foot-brand">
            <span className="brand-mark" aria-hidden="true">
              JA
            </span>
            <span>Juan Carlos Angulo</span>
          </p>
          <p className="copy">{f.copy}</p>
          <a className="totop" href="#top">
            <Icon name="arrow-up-right" />
            <span>{f.top}</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
