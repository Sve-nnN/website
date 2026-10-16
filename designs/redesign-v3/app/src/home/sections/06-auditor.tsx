import { SafeLink, SectionShell, Text, pick, type Lang } from '../ui';
import copyJson from '../copy/auditor.json';
import '../styles/method.css';

// Auditor propio (D-03). Gradiente solo CSS (.fx-grain): todo el texto vive dentro de .fx-content (D-10).
export default function Auditor({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="auditor" heading={t.heading} className="hm-block">
      <article className="card card--gradient fx-grain hm-auditor">
        <div className="fx-content">
          <p>
            <Text>{t.text}</Text>
          </p>
          <dl className="hm-stats">
            {t.stats.map((stat) => (
              <div className="hm-stats__item" key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>{'abbr' in stat ? <abbr title={stat.abbr}>{stat.value}</abbr> : stat.value}</dd>
              </div>
            ))}
          </dl>
          <p>
            <SafeLink className="btn btn--primary" href={t.href} newTab>
              {t.cta} <span className="hm-note">({t.newTabNote})</span>
            </SafeLink>
          </p>
          <p className="card__meta hm-auditor__free">
            <Text>{t.freeNote}</Text>
          </p>
        </div>
      </article>
    </SectionShell>
  );
}
