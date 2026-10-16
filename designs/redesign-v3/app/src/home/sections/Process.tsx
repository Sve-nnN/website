import { useHome } from '../ctx';
import { Icon, Sp } from '../ui';

export function Process() {
  const { t } = useHome();
  return (
    <section className="ch ch-paper" id="proceso" aria-labelledby="t-pro">
      <div className="wrap">
        <header className="ch-head">
          <Sp id="t-pro">{t.proceso.title}</Sp>
        </header>
        <ol className="tl">
          {t.proceso.steps.map((s) => (
            <li className="tl-step rv" key={s.title}>
              <span className="tl-n" aria-hidden="true">
                <Icon name={s.icon} />
              </span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
