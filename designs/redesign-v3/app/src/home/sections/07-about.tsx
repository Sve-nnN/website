import { SafeLink, SectionShell, Text, pick, type Lang } from '../ui';
import { abbrNodes } from '../abbr';
import copyJson from '../copy/about.json';
import '../styles/method.css';

// About sin folleto (D-03, D-04). Sin imagenes: retrato y foto son pendientes visibles (D-05).
export default function About({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  const seen = new Set<string>();
  return (
    <SectionShell id="about" heading={t.heading} className="hm-block hm-about">
      <div className="hm-about__body">
        <p>{abbrNodes(t.paragraph, t.abbrs, seen)}</p>
        <ul className="hm-about__features">
          {t.features.map((feature) => (
            <li key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{abbrNodes(feature.text, t.abbrs, seen)}</p>
            </li>
          ))}
        </ul>
        <p>
          <SafeLink className="btn btn--ghost" href="#contacto">
            {t.cta}
          </SafeLink>
        </p>
      </div>
      <div className="hm-about__media">
        <p>
          <Text>{t.portrait}</Text>
        </p>
        <p>
          <Text>{t.photo}</Text>
        </p>
      </div>
    </SectionShell>
  );
}
