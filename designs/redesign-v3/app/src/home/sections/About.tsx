import { useHome } from '../ctx';
import { SEO_CLIENTS, DEV_CLIENTS } from '../clients';
import { Count, Icon, Sp } from '../ui';

export function About() {
  const { t } = useHome();
  const s = t.sobre;
  return (
    <section className="ch ch-paper" id="sobre" aria-labelledby="t-sob">
      <div className="wrap about">
        <div className="portrait rv">
          <div className="frame">
            <div className="ph">
              <span>{s.portrait}</span>
              <small>{s.portraitSub}</small>
            </div>
          </div>
        </div>
        <div className="about-copy">
          <header className="ch-head">
            <Sp id="t-sob">{s.title}</Sp>
          </header>
          <p className="rv">{s.p1}</p>
          <p className="rv">{s.p2}</p>
          <ul className="facts rv">
            <li>
              <Count value={SEO_CLIENTS.length} />
              <span>{t.clients.seo}</span>
            </li>
            <li>
              <Count value={DEV_CLIENTS.length} />
              <span>{t.clients.dev}</span>
            </li>
          </ul>
          <ul className="chips chips-ink rv">
            {s.chips.map((c) => (
              <li key={c.label}>
                <Icon name={c.icon} />
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
