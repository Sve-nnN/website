import copyJson from '../copy/casos.json';
import { pick, SafeLink, SectionShell, Text, type Lang } from '../ui';
import '../styles/proof.css';

// Tres casos con las metricas publicadas en juan-tech.com/case-studies. El enlace cubre el titulo
// (card--link estira el enlace sobre la tarjeta), asi no hay enlaces anidados.

export default function Casos({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="casos" heading={t.heading} className="hm-proof">
      <p className="hm-proof__lede">
        <Text>{t.lede}</Text>
      </p>
      <ul className="hm-grid">
        {t.cases.map((item) => (
          <li key={item.href}>
            <article className="card card--link hm-case">
              <p className="card__meta">{item.sector}</p>
              <h3 className="card__title">
                <SafeLink href={item.href}>{item.title}</SafeLink>
              </h3>
              <p>
                <span className="badge badge--state hm-metric">{item.metric}</span>
              </p>
              <p className="card__meta hm-case__cta" aria-hidden="true">
                {t.ctaLabel}
              </p>
            </article>
          </li>
        ))}
      </ul>
      <p>
        <SafeLink className="link-inline hm-link" href={t.allHref}>
          {t.allLabel}
        </SafeLink>
      </p>
    </SectionShell>
  );
}
